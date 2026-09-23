// ════════════════════════════════════════════════════════════════
// Stage the rikiki assets the site actually serves into public/rikiki/.
//
// This used to be a symlink to the whole package, so `astro build` copied the
// TypeScript sources, the test fixtures and 366 MB of node_modules into dist/.
// A published site carries what a visitor's browser fetches · nothing else.
// ════════════════════════════════════════════════════════════════

import { readFileSync, writeFileSync, cpSync, existsSync, lstatSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PKG_DIR = resolve(SITE_DIR, '..', 'rikiki');
const DEST = join(SITE_DIR, 'public', 'rikiki');
const EXAMPLES_DIR = resolve(SITE_DIR, '..', 'examples');
const DEMO_SRC = join(EXAMPLES_DIR, 'rikiki-tour');
const DEMO_DEST = join(SITE_DIR, 'public', 'embed');
const DECKS_DEST = join(SITE_DIR, 'public', 'decks');

// The example decks the landing gallery links to, published one directory deep
// so their `../../rikiki/…` references land on the staged runtime, exactly as
// they do from examples/<name>/ inside the repository. Only index.html ships:
// bento/source.html is the authoring view its bundle was built from, and a
// reader never fetches it.
const GALLERY_DECKS = ['showcase', 'bento'];

// Each entry says what a browser or a reader asks for. Anything absent here is
// absent from the published site, on purpose.
const PUBLISHED = [
  'dist', // the runtime · lazy chunks and vendors included
  'themes', // rikiki.css, siliceum.css and the font faces they declare
  'fonts', // the woff2 files siliceum-fonts.css points at
  'tokens.css', // the theme entry point a deck links to
  'docs/llms', // the agent reference the docs page links to
  'llms.txt', // the short agent entry point
  'README.md',
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
  // Astro dev does not follow the symlinked demo directory reliably. Copy the
  // one public demo into public/ so `/embed/` works in dev and in the static build.
  if (lstatSafe(DEMO_DEST)) rmSync(DEMO_DEST, { recursive: true, force: true });
  cpSync(DEMO_SRC, DEMO_DEST, { recursive: true });
  assertAssetsResolve(join(DEMO_DEST, 'index.html'));
  // The gallery decks, next to the demo. public/decks/thumbs/ holds the
  // committed thumbnails and is left alone · only the deck copies are redone.
  for (const name of GALLERY_DECKS) {
    const dest = join(DECKS_DEST, name);
    if (lstatSafe(dest)) rmSync(dest, { recursive: true, force: true });
    mkdirSync(dest, { recursive: true });
    cpSync(join(EXAMPLES_DIR, name, 'index.html'), join(dest, 'index.html'));
    assertAssetsResolve(join(dest, 'index.html'));
  }
  cpSync(join(EXAMPLES_DIR, 'stories', 'art'), join(SITE_DIR, 'public', 'stories', 'art'), { recursive: true });
  for (const name of ['incident', 'quidditch', 'acme', 'three-pigs', 'rikiki']) {
    const dest = join(SITE_DIR, 'public', 'stories', name + '.html');
    mkdirSync(dirname(dest), { recursive: true });
    cpSync(join(EXAMPLES_DIR, 'stories', name + '.html'), dest);
    assertAssetsResolve(dest);
  }
  // The web entry has a different base URL from the installed package.
  const entry = join(SITE_DIR, 'public', 'llms.txt');
  if (lstatSafe(entry)?.isSymbolicLink()) rmSync(entry);
  const web = readFileSync(join(PKG_DIR, 'llms.txt'), 'utf8')
    .replace(/\]\((docs\/llms\/[^)]+|README\.md|themes\/[^)]+)\)/g, '](/rikiki/$1)');
  writeFileSync(entry, web);
  console.log(
    `stage-assets · staged ${PUBLISHED.length} entries, the demo and ${GALLERY_DECKS.length} gallery decks into public/`,
  );
}

/** A staged deck must find the runtime from where it now sits. A deck that
 *  moved a directory would otherwise ship a page of 404s that still renders a
 *  white rectangle · fail the build instead, and say which reference broke.
 *  References resolve the way a browser resolves them, against the site root,
 *  not against the filesystem · `../../` from /embed/ stops at the root. */
function assertAssetsResolve(deckPath) {
  const publicDir = join(SITE_DIR, 'public');
  const from = 'https://local/' + relative(publicDir, deckPath).split('\\').join('/');
  const html = readFileSync(deckPath, 'utf8');
  // Only real loading tags · a deck that quotes `href="rikiki/tokens.css"` in a
  // code sample is showing markup, not fetching it.
  const loaders = /<(?:link|script|img|source|iframe)\b[^>]*?\b(?:src|href)="([^"<>]+)"/g;
  for (const [, ref] of html.matchAll(loaders)) {
    if (/^(https?:|data:|mailto:|#|\/\/)/.test(ref)) continue;
    if (/[`${}+]/.test(ref)) continue; // a URL the deck builds at runtime
    const { pathname } = new URL(ref, from);
    if (existsSync(join(publicDir, decodeURIComponent(pathname)))) continue;
    throw new Error(`stage-assets · ${ref} does not resolve from /${relative(publicDir, deckPath)}`);
  }
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
