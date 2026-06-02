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

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

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
console.log(`post-build · rikiki/dist/index.js · ${fmt(beforeSize)} → ${fmt(afterSize)} (standalone, Lit inlined)`);

// ── Patch the second-level CDN dep · `marked` · so deck-md works under
// the strict platform CSP. The framework's deck-md.ts uses a top-level
// static import from cdn.jsdelivr.net, which esbuild keeps verbatim
// because the URL is not resolvable via node_modules. Under the
// platform's `script-src 'self' ...` CSP that static import fails,
// the whole bundle fails to evaluate, and no custom element registers.
// Workaround · download marked at deploy time, serve it from our own
// origin under /rikiki/dist/vendor/, and rewrite the URL in the
// bundle. deck-mermaid stays opt-in (dynamic <script> injection,
// only loads if a <deck-mermaid> is actually present).
const MARKED_URL = 'https://cdn.jsdelivr.net/npm/marked@12/+esm';
const VENDOR_DIR = resolve(targetDir, 'vendor');
const MARKED_LOCAL_FILE = resolve(VENDOR_DIR, 'marked.js');
const MARKED_LOCAL_PATH = '/rikiki/dist/vendor/marked.js';

console.log(`post-build · downloading marked from ${MARKED_URL}`);
const res = await fetch(MARKED_URL, { redirect: 'follow' });
if (!res.ok) {
  console.error(`post-build · marked download failed · HTTP ${res.status}`);
  process.exit(1);
}
const markedBody = await res.text();
mkdirSync(VENDOR_DIR, { recursive: true });
writeFileSync(MARKED_LOCAL_FILE, markedBody);
console.log(`post-build · saved marked · ${fmt(Buffer.byteLength(markedBody))} → ${MARKED_LOCAL_PATH}`);

const bundleSrc = readFileSync(indexJs, 'utf8');
const patched = bundleSrc.replaceAll(MARKED_URL, MARKED_LOCAL_PATH);
if (patched === bundleSrc) {
  console.warn(`post-build · WARNING · marked URL not found in bundle, deck-md may break`);
} else {
  writeFileSync(indexJs, patched);
  const occurrences = (bundleSrc.match(/cdn\.jsdelivr\.net\/npm\/marked/g) || []).length;
  console.log(`post-build · rewrote ${occurrences} marked-URL reference(s) to ${MARKED_LOCAL_PATH}`);
}

// ── Same treatment for `mermaid` · deck-mermaid injects a <script src="…cdn…">
// at render time, which the platform CSP (`script-src 'self' …`) blocks, so
// any <deck-mermaid> on the page (the landing has several previews) logs
// "mermaid failed to load" and renders nothing. Vendor it under our own
// origin and rewrite the URL · a same-origin <script src> is allowed by
// `script-src 'self'`. ~3 MB, only fetched when a diagram actually renders.
const MERMAID_URL = 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js';
const MERMAID_LOCAL_FILE = resolve(VENDOR_DIR, 'mermaid.min.js');
const MERMAID_LOCAL_PATH = '/rikiki/dist/vendor/mermaid.min.js';

console.log(`post-build · downloading mermaid from ${MERMAID_URL}`);
const mres = await fetch(MERMAID_URL, { redirect: 'follow' });
if (!mres.ok) {
  console.error(`post-build · mermaid download failed · HTTP ${mres.status}`);
  process.exit(1);
}
const mermaidBody = await mres.text();
writeFileSync(MERMAID_LOCAL_FILE, mermaidBody);
console.log(`post-build · saved mermaid · ${fmt(Buffer.byteLength(mermaidBody))} → ${MERMAID_LOCAL_PATH}`);

const afterMarked = readFileSync(indexJs, 'utf8');
const mPatched = afterMarked.replaceAll(MERMAID_URL, MERMAID_LOCAL_PATH);
if (mPatched === afterMarked) {
  console.warn(`post-build · WARNING · mermaid URL not found in bundle, diagrams may break`);
} else {
  writeFileSync(indexJs, mPatched);
  const mOcc = (afterMarked.match(/cdn\.jsdelivr\.net\/npm\/mermaid/g) || []).length;
  console.log(`post-build · rewrote ${mOcc} mermaid-URL reference(s) to ${MERMAID_LOCAL_PATH}`);
}
