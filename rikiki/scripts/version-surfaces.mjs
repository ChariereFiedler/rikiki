// Single source of truth for every place a rikiki release version appears.
// Imported by both the bump CLI (scripts/bump-version.mjs) and the consistency
// tests (scripts/version.test.mjs) so the two never drift apart.
//
// Paths are resolved from the git root: the npm package lives in `rikiki/`,
// while the changelog and the site live one level up.

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url)); // rikiki/scripts
export const REPO_ROOT = resolve(here, '..', '..'); // git root
const PKG_DIR = resolve(here, '..'); // rikiki/

const at = (...p) => resolve(REPO_ROOT, ...p);

export const PACKAGE_JSON = resolve(PKG_DIR, 'package.json');

const SEMVER = /^(\d+)\.(\d+)\.(\d+)$/;
const VERSION_RE = /\d+\.\d+\.\d+/g;

export function readCurrentVersion() {
  return JSON.parse(readFileSync(PACKAGE_JSON, 'utf8')).version;
}

export function parseSemver(v) {
  const m = SEMVER.exec(v);
  if (!m) throw new Error(`not a semver: ${v}`);
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

// returns >0 if a>b, <0 if a<b, 0 if equal
export function compareSemver(a, b) {
  const x = parseSemver(a),
    y = parseSemver(b);
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] - y[i];
  return 0;
}

// EXACT surfaces: every captured group must equal the current version.
// Each `find` is a global RegExp with one capture group per occurrence.
export const EXACT = [
  {
    file: resolve(REPO_ROOT, 'site/src/pages/docs/getting-started.astro'),
    label: 'CDN install snippet (pinned specifier)',
    find: /rikiki-deck@(\d+\.\d+\.\d+)\//g,
  },
  {
    file: resolve(PKG_DIR, 'package-lock.json'),
    label: 'package-lock.json version fields',
    // the two top-level "rikiki-deck" entries (root + packages[""]); never deps
    find: /"name": "rikiki-deck",\s*"version": "(\d+\.\d+\.\d+)"/g,
  },
  {
    file: resolve(PKG_DIR, 'decks/tests/demo.html'),
    label: 'demo deck cover speaker',
    find: /speaker="(\d+\.\d+\.\d+)"/g,
  },
  {
    file: resolve(PKG_DIR, 'decks/tests/demo.html'),
    label: 'demo deck cover title accent',
    find: /<span class="accent">(\d+\.\d+\.\d+)<\/span>/g,
  },
  {
    file: resolve(PKG_DIR, 'decks/tests/demo.html'),
    label: 'demo deck takeaway kicker',
    find: /kicker="rikiki v(\d+\.\d+\.\d+)"/g,
  },
  // Doc stamps: the "rikiki v<version>" sigil declaring which release each doc
  // documents. The `v` prefix distinguishes the stamp from historical "since
  // 0.3.0" prose scanned below.
  {
    file: resolve(PKG_DIR, 'llms.txt'),
    label: 'llms.txt doc stamp',
    find: /rikiki v(\d+\.\d+\.\d+)/g,
  },
  {
    file: resolve(PKG_DIR, 'docs/llms/rikiki-reference.md'),
    label: 'rikiki-reference.md doc stamp',
    find: /rikiki v(\d+\.\d+\.\d+)/g,
  },
  {
    file: resolve(PKG_DIR, 'README.md'),
    label: 'README.md doc stamp',
    find: /rikiki v(\d+\.\d+\.\d+)/g,
  },
  {
    file: at('README.md'),
    label: 'root README.md doc stamp',
    find: /rikiki v(\d+\.\d+\.\d+)/g,
  },
];

// HISTORICAL surfaces: free prose that legitimately mentions older versions
// (e.g. "on by default since 0.3.0"). Invariant: no mentioned version may
// exceed the current one. Bare 3-part versions only; "pre-0.3" / "0.3 s" etc.
// are not matched.
export const HISTORICAL = [
  { file: resolve(PKG_DIR, 'README.md'), label: 'README.md' },
  { file: at('README.md'), label: 'root README.md' },
  { file: resolve(PKG_DIR, 'llms.txt'), label: 'llms.txt' },
  { file: resolve(PKG_DIR, 'docs/llms/rikiki-reference.md'), label: 'rikiki-reference.md' },
];

export const CHANGELOG = at('CHANGELOG.md');
export const SITE_CHANGELOG = at('site', 'src', 'pages', 'docs', 'changelog.astro');

export function read(file) {
  return readFileSync(file, 'utf8');
}

// All distinct 3-part versions mentioned in a blob.
export function versionsIn(text) {
  return [...text.matchAll(VERSION_RE)].map((m) => m[0]);
}

// CHANGELOG.md must carry "## [X.Y.Z] - <date>" for the given version.
export function changelogEntry(text, version) {
  const re = new RegExp(`^## \\[${version.replace(/\./g, '\\.')}\\] - (\\d{4}-\\d{2}-\\d{2})`, 'm');
  const m = re.exec(text);
  return m ? { found: true, date: m[1] } : { found: false };
}

// Every released "## [x.y.z]" header (i.e. not [Unreleased]) must have a date.
export function releasedSectionsWithoutDate(text) {
  const bad = [];
  const re = /^## \[(\d+\.\d+\.\d+)\](.*)$/gm;
  for (const m of text.matchAll(re)) {
    if (!/ - \d{4}-\d{2}-\d{2}/.test(m[2])) bad.push(m[1]);
  }
  return bad;
}

// The site changelog must carry an "<h2 ...>X.Y.Z · ...</h2>" section.
export function siteMentionsVersion(text, version) {
  const re = new RegExp(`<h2[^>]*>\\s*${version.replace(/\./g, '\\.')}\\s*·`);
  return re.test(text);
}
