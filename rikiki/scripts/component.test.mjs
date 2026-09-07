import { readFileSync } from 'node:fs';
import { relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  CATALOGUE_PAGE,
  COUNT_SURFACES,
  catalogueCounts,
  LLM_REFERENCE,
  NOT_IN_CATALOGUE,
  REPO_ROOT,
  registeredElements,
} from './component-surfaces.mjs';

const elements = registeredElements();

describe('the component count is derived, not typed', () => {
  it('finds every registered element, both registration styles', () => {
    expect(elements.length).toBeGreaterThan(0);
    // deck-kicker registers with a bare customElements.define · every
    // decorator-only count published before v1.0 was short by exactly this one.
    expect(elements).toContain('deck-kicker');
    expect(elements).toContain('deck-root');
  });

  it.each(COUNT_SURFACES)('$label agrees with the source', ({ file, find }) => {
    const text = readFileSync(file, 'utf8');
    const found = [...text.matchAll(find)].map((m) => Number(m[1]));
    const where = relative(REPO_ROOT, file);
    expect(found.length, `no component count found in ${where}`).toBeGreaterThan(0);
    for (const value of found) {
      expect(value, `${where} says ${value} components, source registers ${elements.length}`).toBe(
        elements.length,
      );
    }
  });
});

describe('every element is documented where an author will look', () => {
  it('the catalogue lists every element an author can write', () => {
    const page = readFileSync(CATALOGUE_PAGE, 'utf8');
    const missing = elements
      .filter((name) => !NOT_IN_CATALOGUE.includes(name))
      .filter((name) => !page.includes(name));
    expect(missing, `absent from the components catalogue: ${missing.join(', ')}`).toEqual([]);
  });

  it('the catalogue bucket counts match its own arrays', () => {
    const { layouts, atoms } = catalogueCounts();
    const page = readFileSync(CATALOGUE_PAGE, 'utf8');
    expect(page).toContain(`<strong>${layouts} layouts</strong>`);
    expect(page).toContain(`<strong>${atoms} building blocks</strong>`);
  });

  it('the LLM reference lists every element', () => {
    const reference = readFileSync(LLM_REFERENCE, 'utf8');
    const missing = elements.filter((name) => !reference.includes(name));
    expect(missing, `absent from the LLM reference: ${missing.join(', ')}`).toEqual([]);
  });
});
