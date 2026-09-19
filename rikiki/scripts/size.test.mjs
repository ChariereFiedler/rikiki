import { readFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { gzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import {
  BUDGETS,
  PKG_DIR,
  REPO_ROOT,
  SIZE_SURFACES,
  measureSizes,
  toKb,
} from './size-surfaces.mjs';

// Every published size figure must match the artifact it describes, and the
// v1.0 budgets must hold. Both were previously prose, copied by hand, and drifted.

const sizes = measureSizes();
const asKb = { ...sizes, initialLoadGzip: sizes.initialLoadGzip };

describe('v1.0 size budgets', () => {
  it('the initial load stays within budget', () => {
    // index.js plus the vendor chunks it statically imports · what a browser
    // actually downloads before the first slide paints.
    expect(
      sizes.initialLoadGzip,
      `initial load is ${toKb(sizes.initialLoadGzip)} KB gzip (budget ${toKb(BUDGETS.initialLoadGzip)} KB)`,
    ).toBeLessThanOrEqual(BUDGETS.initialLoadGzip);
  });

  it('the standalone bundle stays within budget', () => {
    expect(
      sizes.standaloneGzip,
      `standalone is ${toKb(sizes.standaloneGzip)} KB gzip (budget ${toKb(BUDGETS.standaloneGzip)} KB)`,
    ).toBeLessThanOrEqual(BUDGETS.standaloneGzip);
  });

  it('mermaid and shiki are excluded from the initial load', () => {
    // They are an order of magnitude larger than the engine · counting them as
    // "core" would be the same dishonesty the budgets exist to prevent.
    const initialPaths = sizes.initialLoad.map((f) => f.path);
    expect(initialPaths).not.toContain('dist/vendor/mermaid.min.js');
    expect(initialPaths).not.toContain('dist/vendor/shiki.js');
    expect(sizes.vendors.mermaid).toBeGreaterThan(sizes.initialLoadGzip);
  });

  it('the curated Shiki runtime stays below its optional-module budget', () => {
    expect(
      sizes.vendors.shiki,
      `Shiki vendor is ${toKb(sizes.vendors.shiki)} KB gzip (budget ${toKb(BUDGETS.shikiVendorGzip)} KB)`,
    ).toBeLessThanOrEqual(BUDGETS.shikiVendorGzip);
  });
});

describe('published size figures match the artifacts', () => {
  it.each(SIZE_SURFACES)('$label', ({ file, find, expect: key }) => {
    const measured = toKb(asKb[key]);
    const text = readFileSync(file, 'utf8');
    const found = [...text.matchAll(find)].map((m) => Number(m[1]));
    const where = relative(REPO_ROOT, file);

    expect(
      found.length,
      `no size figure found in ${where} · has the wording changed?`,
    ).toBeGreaterThan(0);
    for (const value of found) {
      expect(value, `${where} claims ${value} KB, measured ${measured} KB for ${key}`).toBe(
        measured,
      );
    }
  });
});

// The plugins table used to be checked row by row against the lazy modules it
// names. It now reads those sizes from measureSizes() in its own Astro
// frontmatter, so the table and this measurement are the same call and there is
// no published literal left to compare.

// ────────────────────────────────────────────────────────────────
// The three figures the LLM reference publishes about script tags
//
// §20 tells an author when to stop adding <script> tags and bundle
// instead. The advice is only worth following while its numbers are true,
// and they move with every component that changes size. Derived here rather
// than trusted, the same reason SIZE_SURFACES exists.
// ────────────────────────────────────────────────────────────────

describe('the script-tag table in the LLM reference', () => {
  const REFERENCE = resolve(PKG_DIR, 'docs/llms/rikiki-reference.md');
  const THREE = ['deck-bar', 'deck-quote', 'deck-table'];
  const FIVE = [...THREE, 'deck-kpi-grid', 'deck-timeline'];

  const gz = (file) => gzipSync(readFileSync(resolve(PKG_DIR, file))).length;
  const withModules = (tags) =>
    tags.reduce((sum, tag) => sum + gz(`dist/${tag}.js`), gz('dist/index.js'));

  const rows = [
    ['`dist/index.js` alone', gz('dist/index.js')],
    ['`dist/index.js` + 3 modules', withModules(THREE)],
    ['`dist/index.js` + 5 modules', withModules(FIVE)],
  ];

  it.each(rows)('%s states the measured size', (label, bytes) => {
    const table = readFileSync(REFERENCE, 'utf8');
    const row = table.split('\n').find((line) => line.startsWith(`| ${label} |`));
    expect(row, `no row for "${label}" in the reference table`).toBeDefined();
    expect(row).toContain(`| ${toKb(bytes)} KB |`);
  });

  it('still says adding tags costs more than it saves', () => {
    // The advice itself, not its numbers · if five modules ever became
    // cheaper than the bundle, the paragraph would be wrong rather than
    // stale, and no size figure would say so.
    expect(withModules(FIVE)).toBeGreaterThan(gz('dist/index.js'));
  });
});
