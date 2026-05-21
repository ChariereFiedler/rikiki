#!/usr/bin/env node
// rikiki/bundle.mjs · take a deck HTML and produce a single self-contained file.
//
//   node bundle.mjs my-talk/index.html              # writes my-talk/dist/index.html
//   node bundle.mjs my-talk/index.html out.html     # writes to out.html
//   node bundle.mjs my-talk/index.html --no-fonts   # strip Google Fonts @import
//
// Implementation · Vite + vite-plugin-singlefile. The deck's <link> and
// <script type="module"> references are crawled, bundled, and inlined into
// one HTML file. Lit is bundled in too (peer dep declared on the rikiki
// package · vite resolves it from node_modules).

import { build } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { transform as esbuildTransform } from 'esbuild';
import { readFileSync, writeFileSync, existsSync, mkdtempSync, rmSync, cpSync, statSync } from 'node:fs';
import { resolve, dirname, basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RIKIKI_ROOT = __dirname;

const args = process.argv.slice(2);
const noFonts = args.includes('--no-fonts');
const positional = args.filter((a) => !a.startsWith('-'));

if (positional.length < 1) {
  console.error(`
rikiki · bundle a deck into a single self-contained HTML

  node bundle.mjs <input.html> [output.html|-]

Flags:
  --no-fonts    strip the Google Fonts @import from the inlined theme
                (deck falls back to system fonts · zero network calls)

Examples:
  node bundle.mjs my-talk/index.html
  node bundle.mjs my-talk/index.html share.html
  node bundle.mjs my-talk/index.html - > /tmp/share.html
  node bundle.mjs my-talk/index.html --no-fonts
`);
  process.exit(positional.length === 0 ? 1 : 0);
}

const inputPath = resolve(process.cwd(), positional[0]);
if (!existsSync(inputPath) || !statSync(inputPath).isFile()) {
  console.error(`bundle · input not found: ${inputPath}`);
  process.exit(1);
}

const outputArg = positional[1];
const outputPath = !outputArg
  ? join(dirname(inputPath), basename(inputPath, '.html') + '.bundle.html')
  : outputArg === '-'
    ? null
    : resolve(process.cwd(), outputArg);

// ── Stage the deck + rikiki repo into a temp dir so absolute /rikiki/* paths
//    in the input HTML resolve against vite's root cleanly. ───────────────
const tmpRoot = mkdtempSync(join(tmpdir(), 'rikiki-bundle-'));
try {
  // 1. Stage the deck file as the entry point · rewrite any rikiki/* path
  //    (relative or absolute) so they resolve against the tmpRoot/rikiki/
  //    mirror we make in step 2. This way the deck author can use whichever
  //    path style they prefer · we normalise.
  let inputHtml = readFileSync(inputPath, 'utf8');
  inputHtml = inputHtml.replace(
    /(?<=["'])([^"']*?)rikiki\/(dist|themes|tokens\.css)([^"']*)/g,
    (_m, _prefix, what, rest) => '/rikiki/' + what + rest,
  );
  // Force the standalone bundle (Lit included) instead of dist/index.js
  // (which externalizes Lit to jsdelivr). The whole point of `bundle` is
  // zero-network · so dist/index.js is the wrong source.
  inputHtml = inputHtml.replace(
    /\/rikiki\/dist\/index\.js/g,
    '/rikiki/dist/standalone.js',
  );
  writeFileSync(join(tmpRoot, 'index.html'), inputHtml);

  // 2. Mirror the rikiki package · themes + dist + src (in case the deck
  //    points at src). Only the files actually referenced will be bundled.
  cpSync(RIKIKI_ROOT, join(tmpRoot, 'rikiki'), {
    recursive: true,
    filter: (src) => {
      const b = basename(src);
      // Skip junk we never reference from a deck.
      if (b === 'node_modules' || b === '.git' || b === 'test-results') return false;
      return true;
    },
  });

  // 3. Optionally strip Google Fonts @import from the staged theme files.
  if (noFonts) {
    for (const t of ['rikiki.css', 'siliceum.css']) {
      const p = join(tmpRoot, 'rikiki', 'themes', t);
      if (existsSync(p)) {
        const stripped = readFileSync(p, 'utf8').replace(
          /^@import url\(['"]https:\/\/fonts\.googleapis[^)]+\);?\s*$/gm,
          '',
        );
        writeFileSync(p, stripped);
      }
    }
  }

  // ── Run vite build ─────────────────────────────────────────────────
  await build({
    root: tmpRoot,
    logLevel: 'error',
    build: {
      outDir: join(tmpRoot, '__out'),
      emptyOutDir: true,
      assetsInlineLimit: 100000000,   // inline everything (default 4 KB is too low)
      cssCodeSplit: false,
      // Let vite emit unminified output · we post-process the JS through
      // esbuild with `lineLimit` to get the size win of minification while
      // keeping lines short enough for VS Code's syntax highlighter (~5000
      // char ceiling). CSS stays unminified so theme tokens are editable.
      minify: false,
      cssMinify: false,
      rollupOptions: {
        input: join(tmpRoot, 'index.html'),
        output: { inlineDynamicImports: true },
      },
    },
    plugins: [viteSingleFile()],
  });

  // Vite writes the bundle to __out/index.html
  let bundled = readFileSync(join(tmpRoot, '__out', 'index.html'), 'utf8');

  // ── Post-process · find the inline `<script type="module">` (one block
  //    in the head, vite output convention) and replace its content with a
  //    minified version. Tricky bit · the JS bundle CAN contain literal
  //    `</script>` inside template literals (e.g. deck-presenter builds
  //    popup-window HTML at runtime). We use indexOf/lastIndexOf to find
  //    the real outer-tag boundaries, then escape every `</script>` inside
  //    the JS body to `<\/script>` (identical at runtime, hidden from the
  //    HTML parser). Without that escape, the outer <script> terminates
  //    prematurely and the rest of the JS renders as text on the page.
  const openMatch = bundled.match(/^\s*<script\b[^>]*type=['"]module['"][^>]*>/m);
  if (openMatch) {
    const openTag = openMatch[0];
    const openIdx = bundled.indexOf(openTag);
    const closeIdx = bundled.lastIndexOf('</script>');
    if (openIdx >= 0 && closeIdx > openIdx) {
      const codeStart = openIdx + openTag.length;
      const rawCode = bundled.slice(codeStart, closeIdx);
      try {
        const out = await esbuildTransform(rawCode, {
          loader: 'js',
          minify: true,
          lineLimit: 500,
          legalComments: 'none',
        });
        const safeCode = out.code.trimEnd().replace(/<\/script>/gi, '<\\/script>');
        bundled = bundled.slice(0, openIdx)
          + openTag + '\n' + safeCode + '\n'
          + bundled.slice(closeIdx);
      } catch (e) {
        console.error('bundle · esbuild minify failed · keeping unminified · ' + (e && e.message || e));
      }
    }
  }

  // Banner with bundle stats and any leftover-CDN warnings.
  const cdnWarnings = [];
  if (/<deck-mermaid\b/i.test(bundled)) {
    cdnWarnings.push('mermaid · deck-mermaid still fetches mermaid from jsdelivr at runtime');
  }
  if (/cdn\.jsdelivr\.net|fonts\.googleapis/.test(bundled) && !noFonts) {
    if (!cdnWarnings.includes('fonts')) cdnWarnings.push('fonts · Google Fonts is still imported · pass --no-fonts to strip');
  }

  const banner = `<!--
  Rikiki · bundled deck
  ────────────────────────────────────────────────────────────────────
  One HTML file. Serve via http:// (modules need it):
      python3 -m http.server 7799
${cdnWarnings.length ? '  External runtime calls left:\n' + cdnWarnings.map((w) => '    · ' + w).join('\n') + '\n' : '  No external runtime calls.'}
-->
`;
  const output = bundled.replace(/^<!doctype html>\s*/i, '<!doctype html>\n' + banner);

  if (outputPath === null) {
    process.stdout.write(output);
  } else {
    writeFileSync(outputPath, output);
    const kb = (output.length / 1024).toFixed(1);
    console.error(`bundle · wrote ${outputPath} · ${kb} KB raw`);
    if (cdnWarnings.length) {
      console.error('bundle · warnings:');
      cdnWarnings.forEach((w) => console.error('  · ' + w));
    }
  }
} finally {
  rmSync(tmpRoot, { recursive: true, force: true });
}
