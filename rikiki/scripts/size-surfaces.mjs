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
const PKG_DIR = resolve(here, '..');

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
    file: at('site/src/components/Hero.astro'),
    label: 'hero headline and bullet',
    find: /~([\d.]+) KB/g,
    expect: 'initialLoadGzip',
  },
  {
    file: at('site/src/layouts/Base.astro'),
    label: 'site meta description',
    find: /~([\d.]+) KB gzip/g,
    expect: 'initialLoadGzip',
  },
  {
    file: at('site/src/pages/index.astro'),
    label: 'home stat tile',
    find: /claim="~([\d.]+) KB gzip"/g,
    expect: 'initialLoadGzip',
  },
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
    file: at('site/src/components/DualUse.astro'),
    label: 'dual-use paragraph',
    find: /~([\d.]+) KB initial load/g,
    expect: 'initialLoadGzip',
  },
  {
    file: at('site/src/components/Comparison.astro'),
    label: 'comparison table · our column',
    find: /values: \['~([\d.]+) KB'/g,
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
  {
    file: at('site/src/pages/docs/index.astro'),
    label: 'docs index · initial load',
    find: /initial load is ~([\d.]+) KB gzip/g,
    expect: 'initialLoadGzip',
  },
  {
    file: at('site/src/pages/docs/plugins.astro'),
    label: 'plugins page · initial load',
    find: /~([\d.]+) KB gzip\) doesn/g,
    expect: 'initialLoadGzip',
  },

  // Bundle-only claims · dist/index.js on its own, no vendor chunk.
  {
    file: at('site/src/pages/docs/index.astro'),
    label: 'docs index · bundle alone',
    find: /\(([\d.]+) KB of engine plus/g,
    expect: 'bundleGzip',
  },
  {
    file: at('site/src/pages/docs/plugins.astro'),
    label: 'plugins page · core stays at',
    find: /stays at ~([\d.]+) KB gzip/g,
    expect: 'bundleGzip',
  },
  {
    file: at('site/src/pages/docs/contributing.astro'),
    label: 'contributing · current floor',
    find: /current floor is ([\d.]+) KB/g,
    expect: 'bundleGzip',
  },
  {
    file: at('site/src/pages/docs/contributing.astro'),
    label: 'contributing · initial load',
    find: /initial load including Lit and marked is ~([\d.]+) KB/g,
    expect: 'initialLoadGzip',
  },
];

/** Per-plugin figures published in the plugins table · measured from the lazy
 *  module each row describes. */
export const PLUGIN_SURFACES = [
  { label: 'deck-transition row', module: 'deck-transition' },
  { label: 'deck-presenter row', module: 'deck-presenter' },
  { label: 'click-stages row', module: 'click-stages' },
  { label: 'deck-overview row', module: 'deck-overview' },
  { label: 'deck-help row', module: 'deck-help' },
];

export const PLUGINS_PAGE = at('site/src/pages/docs/plugins.astro');
