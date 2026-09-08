// ════════════════════════════════════════════════════════════════
// Stage the rikiki assets the site actually serves into public/rikiki/.
//
// This used to be a symlink to the whole package, so `astro build` copied the
// TypeScript sources, the test fixtures and 366 MB of node_modules into dist/.
// A published site carries what a visitor's browser fetches · nothing else.
// ════════════════════════════════════════════════════════════════

import { cpSync, existsSync, lstatSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PKG_DIR = resolve(SITE_DIR, '..', 'rikiki');
const DEST = join(SITE_DIR, 'public', 'rikiki');

// Each entry says what a browser or a reader asks for. Anything absent here is
// absent from the published site, on purpose.
const PUBLISHED = [
  'dist', // the runtime · lazy chunks and vendors included
  'themes', // rikiki.css, siliceum.css and the font faces they declare
  'fonts', // the woff2 files siliceum-fonts.css points at
  'tokens.css', // the theme entry point a deck links to
  'docs/llms', // the agent reference the docs page links to
  'llms.txt', // the short agent entry point
  'LICENSE', // the terms the runtime is served under
];

function stage() {
  if (existsSync(DEST) || lstatSafe(DEST)) rmSync(DEST, { recursive: true, force: true });
  for (const entry of PUBLISHED) {
    const src = join(PKG_DIR, entry);
    if (!existsSync(src)) {
      throw new Error(`stage-assets · missing ${entry} in ${PKG_DIR} · run \`npm run build\` in rikiki/ first`);
    }
    const dest = join(DEST, entry);
    mkdirSync(dirname(dest), { recursive: true });
    cpSync(src, dest, { recursive: true });
  }
  console.log(`stage-assets · staged ${PUBLISHED.length} entries into public/rikiki/`);
}

/** `existsSync` follows symlinks · a dangling one still has to be removed. */
function lstatSafe(path) {
  try {
    return lstatSync(path);
  } catch {
    return null;
  }
}

stage();
