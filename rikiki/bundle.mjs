#!/usr/bin/env node
// rikiki/bundle.mjs · fold a deck HTML into one self-contained file.
//
//   node bundle.mjs my-talk/index.html              # writes my-talk/index.bundle.html
//   node bundle.mjs my-talk/index.html out.html     # writes to out.html
//   node bundle.mjs my-talk/index.html -            # writes to stdout
//   node bundle.mjs my-talk/index.html --no-fonts   # drop fonts (system fallback)
//
// Thin wrapper around the shared rolldown-powered inliner (bin/lib/inline.mjs),
// the same engine `rikiki bundle` uses. No Vite · zero external references out.

import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { resolve, dirname, basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inlineDeck } from './bin/lib/inline.mjs';

const PKG_ROOT = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const has = (f) => args.includes(f);
const incArg = args.find((a) => a.startsWith('--include='));
const opts = {
  noFonts: has('--no-fonts'),
  all: has('--all'),
  include: incArg ? incArg.slice('--include='.length).split(',').map((s) => s.trim()).filter(Boolean) : [],
  minifyCss: has('--minify-css'),
  minifyHtml: has('--minify-html'),
  minifyJs: !has('--no-minify-js'),
};
const positional = args.filter((a) => !a.startsWith('-'));

if (positional.length < 1) {
  console.error(`
rikiki · bundle a deck into one self-contained HTML

  node bundle.mjs <input.html> [output.html|-] [options]

  --no-fonts        drop fonts (system fallback)
  --all             keep every component (skip used-only curation)
  --include=a,b     force-include components used only from JS
  --minify-css      minify the inlined CSS (default: readable)
  --minify-html     collapse blank lines (default: readable)
  --no-minify-js    keep the framework JS readable (default: minified)
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
  : outputArg === '-' ? null
  : resolve(process.cwd(), outputArg);

const html = readFileSync(inputPath, 'utf8');
const bundled = await inlineDeck({ html, baseDir: dirname(inputPath), pkgRoot: PKG_ROOT, ...opts });

if (outputPath === null) {
  process.stdout.write(bundled);
} else {
  writeFileSync(outputPath, bundled);
  console.error(`bundle · wrote ${outputPath} · ${(Buffer.byteLength(bundled) / 1024).toFixed(0)} KB`);
}
