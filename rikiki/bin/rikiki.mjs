#!/usr/bin/env node
// ════════════════════════════════════════════════════════════════
// rikiki CLI
//
//   rikiki init --standalone [name.html] [--title "…"] [--theme rikiki|siliceum]
//                            [--with-mermaid] [--with-shiki] [--no-fonts]
//   rikiki bundle <deck.html> [out.html|-] [--with-mermaid] [--with-shiki] [--no-fonts]
//   rikiki export <deck.html> [--output deck.pdf]
//   rikiki skills [--dir <path>] [--force]
//
// `init --standalone` generates a self-contained, share-anywhere deck with no
// external links. `bundle` folds an existing deck into the same single file.
// Both use the rolldown-powered inliner in lib/inline.mjs. `skills` installs the
// bundled Claude Code skills into a project so the agent auto-discovers them.
// ════════════════════════════════════════════════════════════════

import { parseArgs } from 'node:util';
import { readFileSync, writeFileSync, existsSync, statSync, cpSync, mkdirSync } from 'node:fs';
import { resolve, dirname, basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inlineDeck } from './lib/inline.mjs';
import { starterHtml } from './lib/starter.mjs';
import { formatExternal, scanExternal } from './lib/scan-external.mjs';
import { exportPdf } from './lib/export-pdf.mjs';

const PKG_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const HELP = `rikiki · self-contained slide decks

  rikiki init --standalone [name.html] [options]   generate a new single-file deck
  rikiki bundle <deck.html> [out.html|-] [options]  fold an existing deck into one file
  rikiki export <deck.html> [--output deck.pdf]     render the deck to PDF, one slide per page
  rikiki skills [--dir <path>] [--force]            install the Claude Code skills into a project

Options:
  --title "…"          deck title (init)
  --theme rikiki|siliceum   theme · siliceum inlines its local fonts (default: rikiki)
  --with-mermaid       inline the mermaid runtime (+~3 MB)
  --with-shiki         inline the Shiki highlighter (+~9 MB)
  --output, -o <file>  PDF path (export · default <deck>.pdf)
  --no-fonts           drop fonts instead of inlining them (smaller, system fonts)
  --all                bundle every component (skip the used-only curation)
  --include a,b        force-include components used only from JS
  --minify-css         minify the inlined CSS (default: readable)
  --minify-html        collapse blank lines in the HTML (default: readable)
  --no-minify-js       keep the framework JS readable (default: minified)
  -h, --help           show this help

Output is one HTML file with zero external references · open it offline.
The bundle is curated to the components the deck uses; HTML and CSS stay
readable so you can keep editing the file. Images are inlined as base64 and
SVGs as inline markup.`;

/** Shared inlining options derived from the parsed flags. */
const inlineOpts = (v) => ({
  all: v.all,
  include: v.include ? v.include.split(',').map((s) => s.trim()).filter(Boolean) : [],
  minifyCss: v['minify-css'],
  minifyHtml: v['minify-html'],
  minifyJs: !v['no-minify-js'],
  noFonts: v['no-fonts'],
});

const SHARED_OPTIONS = {
  all: { type: 'boolean', default: false },
  include: { type: 'string' },
  'minify-css': { type: 'boolean', default: false },
  'minify-html': { type: 'boolean', default: false },
  'no-minify-js': { type: 'boolean', default: false },
  'no-fonts': { type: 'boolean', default: false },
};

// References that appear in a bundle but are provably never fetched from it.
// Each one needs a reason, and the offline e2e test is what actually proves it.
const INERT_IN_BUNDLE = new Map([
  [
    './index.js',
    'deck-presenter computes it as a fallback bundle href · a bundled deck always ' +
      'takes the inline branch instead (bundleInline is non-empty)',
  ],
]);

/** Report anything a "self-contained" file could still fetch at runtime.
 *  Returns true when the file really reaches for nothing.
 *
 *  `inlined` names the heavy runtimes folded into this file. Their loaders keep
 *  a `new URL('./vendor/…')` in the code, but that branch is dead once the
 *  global is already set · which is exactly what inlining does. */
function checkSelfContained(html, inlined = {}) {
  const dead = new Map(INERT_IN_BUNDLE);
  if (inlined.mermaid) {
    dead.set(
      './vendor/mermaid.min.js',
      'the mermaid UMD is inlined above and sets window.mermaid, so the loader ' +
        'returns before it builds this URL',
    );
  }
  if (inlined.shiki) {
    dead.set(
      './vendor/shiki.js',
      'the Shiki highlighter is inlined above and registered on globalThis',
    );
  }
  const hits = scanExternal(html);
  const real = hits.filter((h) => !dead.has(h.ref));
  const inert = hits.filter((h) => dead.has(h.ref));

  for (const h of inert) {
    console.error(`rikiki · note · ${h.ref} stays in the file but is never fetched`);
    console.error(`         (${dead.get(h.ref)})`);
  }
  if (real.length === 0) return true;

  console.error('rikiki · ERROR · the bundle is NOT self-contained · it still fetches:');
  console.error(formatExternal(real));
  const wantsMermaid = real.some((h) => h.ref.includes('mermaid'));
  const wantsShiki = real.some((h) => h.ref.includes('shiki'));
  if (wantsMermaid) console.error('  → this deck uses <deck-mermaid> · re-run with --with-mermaid');
  if (wantsShiki) console.error('  → this deck uses Shiki · re-run with --with-shiki');
  return false;
}

/** Inject the heavy vendor runtimes the inliner then folds into the file.
 *  mermaid's UMD sets window.mermaid, so deck-mermaid skips its network load. */
function injectVendors(html, { withMermaid, withShiki }) {
  // Shiki goes FIRST · it publishes globalThis.__rikikiShiki from a module, and
  // modules run in document order, so a deck whose own <script> calls
  // installShiki() must not be reached before the global exists.
  const first = withShiki
    ? `<script type="module">\n` +
      `import { createHighlighter } from '${PKG_ROOT}/dist/vendor/shiki.js';\n` +
      `globalThis.__rikikiShiki = createHighlighter;\n` +
      `</script>\n`
    : '';
  // mermaid goes LAST · it is a classic script, so it runs during parsing, well
  // before any module, wherever it sits. Keeping it after the deck's own markup
  // also keeps the inliner's asset passes away from its 3 MB of minified JS.
  const last = withMermaid
    ? `<script src="${PKG_ROOT}/dist/vendor/mermaid.min.js"></script>\n`
    : '';
  if (!first && !last) return html;

  let out = html;
  const headOpen = out.match(/<head\b[^>]*>/i);
  if (first) out = headOpen ? out.replace(headOpen[0], headOpen[0] + '\n' + first) : first + out;
  if (last) out = out.includes('</head>') ? out.replace('</head>', last + '</head>') : out + last;
  return out;
}

function writeOut(html, outputPath) {
  if (outputPath === '-') { process.stdout.write(html); return; }
  writeFileSync(outputPath, html);
  const kb = (Buffer.byteLength(html) / 1024).toFixed(0);
  console.error(`rikiki · wrote ${outputPath} · ${kb} KB`);
}

async function cmdInit(argv) {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      standalone: { type: 'boolean', default: false },
      title: { type: 'string' },
      theme: { type: 'string', default: 'rikiki' },
      'with-mermaid': { type: 'boolean', default: false },
      'with-shiki': { type: 'boolean', default: false },
      ...SHARED_OPTIONS,
    },
  });

  // `init` only produces standalone single-file decks for now · accept the flag
  // explicitly but don't require it (the whole point is the self-contained file).
  if (!values.standalone) {
    console.error('rikiki · init currently generates standalone single-file decks · assuming --standalone');
  }
  const theme = values.theme === 'siliceum' ? 'siliceum' : 'rikiki';
  const name = positionals[0] || 'slides.html';
  const outputPath = name === '-' ? '-' : resolve(process.cwd(), name.endsWith('.html') ? name : name + '.html');
  const title = values.title || basename(name, '.html').replace(/[-_]/g, ' ') || 'My deck';

  const html = starterHtml({
    title, theme,
    withMermaid: values['with-mermaid'],
    withShiki: values['with-shiki'],
  });
  const inlined = await inlineDeck({ html, baseDir: PKG_ROOT, pkgRoot: PKG_ROOT, ...inlineOpts(values) });
  writeOut(inlined, outputPath);
  // Same contract as `bundle` · a starter that would 404 offline is not a
  // starter, so the exit code says so.
  const ok = checkSelfContained(inlined, {
    mermaid: values['with-mermaid'],
    shiki: values['with-shiki'],
  });
  if (!ok) process.exit(1);
}

async function cmdExport(argv) {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: { output: { type: 'string', short: 'o' } },
  });
  const input = positionals[0];
  if (!input) {
    console.error('rikiki export · missing <deck.html>\n\n' + HELP);
    process.exit(1);
  }
  const inputPath = resolve(process.cwd(), input);
  if (!existsSync(inputPath) || !statSync(inputPath).isFile()) {
    console.error('rikiki export · input not found: ' + inputPath);
    process.exit(1);
  }
  const outputPath = resolve(
    process.cwd(),
    values.output ?? positionals[1] ?? basename(inputPath, '.html') + '.pdf',
  );

  let result;
  try {
    result = await exportPdf(inputPath, outputPath);
  } catch (e) {
    console.error('rikiki export · ' + (e instanceof Error ? e.message : String(e)));
    process.exit(1);
  }
  // A missing asset means a page printed without something the author put
  // there · reporting it beats handing over a silently incomplete PDF.
  if (result.missing.length) {
    console.error('rikiki export · WARNING · the deck could not load:');
    for (const url of [...new Set(result.missing)].slice(0, 10)) console.error('    · ' + url);
  }
  console.error(`rikiki · wrote ${outputPath} · ${result.pages} pages`);
}

async function cmdBundle(argv) {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      'with-mermaid': { type: 'boolean', default: false },
      'with-shiki': { type: 'boolean', default: false },
      ...SHARED_OPTIONS,
    },
  });
  const input = positionals[0];
  if (!input) { console.error('rikiki bundle · missing <deck.html>\n\n' + HELP); process.exit(1); }
  const inputPath = resolve(process.cwd(), input);
  if (!existsSync(inputPath) || !statSync(inputPath).isFile()) {
    console.error('rikiki bundle · input not found: ' + inputPath); process.exit(1);
  }
  const outArg = positionals[1];
  const outputPath = outArg === '-' ? '-'
    : outArg ? resolve(process.cwd(), outArg)
    : join(dirname(inputPath), basename(inputPath, '.html') + '.bundle.html');

  const html = injectVendors(readFileSync(inputPath, 'utf8'), {
    withMermaid: values['with-mermaid'],
    withShiki: values['with-shiki'],
  });
  const inlined = await inlineDeck({ html, baseDir: dirname(inputPath), pkgRoot: PKG_ROOT, ...inlineOpts(values) });
  writeOut(inlined, outputPath);
  // A bundle that still fetches is a broken deliverable, not a warning · the
  // exit code is the only thing a CI job or a script can act on.
  const ok = checkSelfContained(inlined, {
    mermaid: values['with-mermaid'],
    shiki: values['with-shiki'],
  });
  if (!ok) process.exit(1);
}

// Consumer-facing skills shipped in the npm tarball. `rikiki-component` and
// `bump-version` stay repo-only (they need the TS sources / release scripts a
// package consumer doesn't have).
const DISTRIBUTED_SKILLS = ['rikiki-deck', 'rikiki-theme', 'rikiki-debug'];

function cmdSkills(argv) {
  const { values } = parseArgs({
    args: argv,
    options: { dir: { type: 'string' }, force: { type: 'boolean', default: false } },
  });
  const targetRoot = resolve(process.cwd(), values.dir || '.claude/skills');
  let copied = 0;
  for (const name of DISTRIBUTED_SKILLS) {
    const src = join(PKG_ROOT, '.claude', 'skills', name);
    if (!existsSync(src)) continue; // not in this install (e.g. running from a trimmed tarball)
    const dest = join(targetRoot, name);
    if (existsSync(dest) && !values.force) {
      console.error(`rikiki skills · ${name} already exists · use --force to overwrite`);
      continue;
    }
    mkdirSync(dirname(dest), { recursive: true });
    cpSync(src, dest, { recursive: true });
    console.error(`rikiki skills · installed ${name} → ${join(values.dir || '.claude/skills', name)}`);
    copied++;
  }
  if (copied) console.error(`rikiki skills · ${copied} skill(s) installed · restart Claude Code to pick them up`);
  else console.error('rikiki skills · nothing installed');
}

const [cmd, ...rest] = process.argv.slice(2);
try {
  if (cmd === 'init') await cmdInit(rest);
  else if (cmd === 'bundle') await cmdBundle(rest);
  else if (cmd === 'export') await cmdExport(rest);
  else if (cmd === 'skills') cmdSkills(rest);
  else if (!cmd || cmd === '-h' || cmd === '--help' || cmd === 'help') { console.log(HELP); }
  else { console.error('rikiki · unknown command: ' + cmd + '\n\n' + HELP); process.exit(1); }
} catch (e) {
  console.error('rikiki · error · ' + (e && e.stack || e));
  process.exit(1);
}
