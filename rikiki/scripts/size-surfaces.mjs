// Single source of truth for every published size figure.
//
// Sizes were copied by hand into a dozen pages and drifted from the artifacts
// they describe. This module MEASURES them from `dist/`, and scripts/size.test.mjs
// fails the build when a page disagrees with the measurement or a budget is
// blown. Mirrors what scripts/version-surfaces.mjs does for the version.

import { gzipSync } from 'node:zlib';
import { readFileSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url)); // rikiki/scripts
export const REPO_ROOT = resolve(here, '..', '..');
export const PKG_DIR = resolve(here, '..');

const at = (...p) => resolve(REPO_ROOT, ...p);
const inPkg = (...p) => resolve(PKG_DIR, ...p);

/** gzip -9, the level every published figure is quoted at. */
export function gzipSize(absPath) {
  return gzipSync(readFileSync(absPath), { level: 9 }).length;
}

export function rawSize(absPath) {
  return statSync(absPath).size;
}

/** Round to the precision the docs actually use · one decimal under 10 KB,
 *  whole KB above, so a figure never claims more accuracy than it has. */
export function toKb(bytes) {
  const kb = bytes / 1024;
  return kb < 10 ? Math.round(kb * 10) / 10 : Math.round(kb);
}

/** What a browser downloads before the first slide paints.
 *
 *  index.js is NOT the whole story: it statically imports the Lit and marked
 *  vendor chunks, so quoting index.js alone understates the real cost by ~80%.
 *  mermaid and shiki are excluded on purpose · they are dynamically imported
 *  and only ever fetched by a deck that uses them. */
export const INITIAL_LOAD = ['dist/index.js', 'dist/vendor/lit.js', 'dist/vendor/marked.js'];

/** Lazily-loaded modules · each is fetched only when its feature is used. */
export const LAZY_MODULES = {
  'deck-transition': 'dist/deck-transition.js',
  'deck-presenter': 'dist/deck-presenter.js',
  'deck-overview': 'dist/deck-overview.js',
  'deck-help': 'dist/deck-help.js',
  'click-stages': 'dist/click-stages.js',
  'deck-mermaid': 'dist/deck-mermaid.js',
  shiki: 'dist/shiki.js',
};

/** Vendored third-party payloads · big, optional, and never part of "core". */
export const VENDORS = {
  mermaid: 'dist/vendor/mermaid.min.js',
  shiki: 'dist/vendor/shiki.js',
};

/** Budgets for the v1.0 contract · guardrails, not targets to hack toward.
 *  Exceeding one is a decision to document, not a number to quietly raise. */
export const BUDGETS = {
  initialLoadGzip: 45 * 1024,
  standaloneGzip: 55 * 1024,
  shikiVendorGzip: 150 * 1024,
};

/** Measure every artifact the docs quote · the single call both the test and
 *  any future doc generator use. */
export function measureSizes() {
  const initial = INITIAL_LOAD.map((p) => ({ path: p, gzip: gzipSize(inPkg(p)) }));
  const initialLoadGzip = initial.reduce((sum, f) => sum + f.gzip, 0);

  const lazy = {};
  for (const [name, p] of Object.entries(LAZY_MODULES)) lazy[name] = gzipSize(inPkg(p));

  const vendors = {};
  for (const [name, p] of Object.entries(VENDORS)) vendors[name] = gzipSize(inPkg(p));

  return {
    bundleGzip: gzipSize(inPkg('dist/index.js')),
    bundleRaw: rawSize(inPkg('dist/index.js')),
    initialLoad: initial,
    initialLoadGzip,
    standaloneGzip: gzipSize(inPkg('dist/standalone.js')),
    standaloneRaw: rawSize(inPkg('dist/standalone.js')),
    lazy,
    vendors,
  };
}

/** Every place a size figure is published · `expect` names the measured value
 *  it must match, in KB at the precision toKb() produces. Add a row here rather
 *  than typing a number into a page. */
export const SIZE_SURFACES = [
  // Initial-load claims · engine + Lit + marked, what a browser really downloads.
  {
    file: at('site/src/pages/docs/recipes.astro'),
    label: 'recipes claim',
    find: /<h3 slot="claim">~([\d.]+) KB gzip<\/h3>/g,
    expect: 'initialLoadGzip',
  },
  {
    file: at('site/src/components/PluginShelf.astro'),
    label: 'plugin shelf intro',
    find: /~([\d.]+) KB initial load/g,
    expect: 'initialLoadGzip',
  },
  {
    file: at('site/src/components/Hero.astro'),
    label: 'home hero initial JavaScript load',
    find: /<strong>([\d.]+) KB<\/strong> initial JavaScript load/g,
    expect: 'initialLoadGzip',
  },
  {
    file: at('site/src/components/Faq.astro'),
    label: 'faq runtime size',
    find: /~([\d.]+) KB (?:gz \(engine|initial load)/g,
    expect: 'initialLoadGzip',
  },
  {
    file: inPkg('llms.txt'),
    label: 'llms.txt summary',
    find: /~([\d.]+) KB gzip/g,
    expect: 'initialLoadGzip',
  },
  {
    file: inPkg('docs/llms/rikiki-reference.md'),
    label: 'LLM reference size claim',
    find: /([\d.]+) KB gzip/g,
    expect: 'initialLoadGzip',
  },
  // The root README is NOT a surface: it is generated from
  // README.template.md with these same measurements, and
  // `npm run readme -- --check` is what holds it. Checking a generated file
  // against the source it was generated from is a second mechanism for one
  // property, and the weaker of the two · it would pass on a README that had
  // drifted in every other respect.
];

/* The plugins page and the docs overview used to publish their sizes as typed
   prose, guarded by the rows above. They now call measureSizes() in their Astro
   frontmatter, so there is no literal left to check · the figure and the
   artifact come from the same call. The rows were removed rather than kept
   pointing at wording that no longer exists.

   The contributing page followed, for the same reason: it now reads BUDGETS and
   measureSizes() in its own frontmatter and prints both the budget and the
   measurement, so its two rows ("current floor", "initial load including Lit
   and marked") had nothing left to match. The budgets themselves stay guarded
   by the budget tests at the top of scripts/size.test.mjs. */
