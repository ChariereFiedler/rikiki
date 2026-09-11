import { readFileSync } from 'node:fs';
import { relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  BUDGETS,
  PLUGINS_PAGE,
  PLUGIN_SURFACES,
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

describe('the plugins table quotes the module it names', () => {
  const page = readFileSync(PLUGINS_PAGE, 'utf8');

  it.each(PLUGIN_SURFACES)('$label', ({ module }) => {
    // Match the row by the module name in its first cell, then read the size
    // cell right after it · a row that moves keeps its own figure.
    const row = new RegExp(`<code>${module}</code>[\\s\\S]{0,200}?<td>~([\\d.]+) KB`);
    const found = page.match(row);
    expect(found, `no size cell found for ${module} in the plugins table`).not.toBeNull();
    expect(
      Number(found[1]),
      `the table says ${found[1]} KB for ${module}, measured ${toKb(sizes.lazy[module])} KB`,
    ).toBe(toKb(sizes.lazy[module]));
  });
});
