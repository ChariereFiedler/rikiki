#!/usr/bin/env node
// Post-Astro-build · swap rikiki/dist/index.js for the standalone bundle.
//
// Why · the framework's dist/index.js follows the zero-build philosophy:
// it imports Lit at runtime from `https://cdn.jsdelivr.net/npm/lit@3/+esm`
// so a deck author can drop a single <script> tag in an .html file without
// running npm. Great for end-consumers, but the rikiki.tordu-jardin.fr
// deployment sits behind a strict platform CSP (`script-src 'self'
// 'unsafe-inline' 'unsafe-eval' https://analytics.tordu-jardin.fr`) and
// the dynamic Lit import is blocked → no custom elements register, every
// <deck-*> falls back to raw text on the page.
//
// Fix · copy dist/standalone.js (Lit bundled, no external imports) over
// dist/index.js inside the built site/dist/ tree only. The repo-tracked
// rikiki/dist/index.js is untouched, so docs that copy-paste the canonical
// install instructions still see the zero-build flavour.
//
// This script runs after `astro build` from the repo root (see the
// root package.json `build` script).

import { existsSync, copyFileSync, statSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');
const targetDir = resolve(repoRoot, 'site', 'dist', 'rikiki', 'dist');
const standalone = resolve(targetDir, 'standalone.js');
const indexJs = resolve(targetDir, 'index.js');

if (!existsSync(standalone)) {
  console.error(`post-build · expected ${standalone} to exist (was Astro build skipped?)`);
  process.exit(1);
}
if (!existsSync(indexJs)) {
  console.error(`post-build · expected ${indexJs} to exist (was Astro build skipped?)`);
  process.exit(1);
}

const beforeSize = statSync(indexJs).size;
copyFileSync(standalone, indexJs);
const afterSize = statSync(indexJs).size;

const fmt = (n) => (n / 1024).toFixed(1) + ' KB';
console.log(`post-build · ${indexJs.replace(repoRoot + '/', '')} · ${fmt(beforeSize)} → ${fmt(afterSize)} (standalone, Lit inlined)`);
