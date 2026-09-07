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
  coreElements,
  optInElements,
  registeredElements,
} from './component-surfaces.mjs';

const elements = registeredElements();
const core = coreElements();
const optIn = optInElements();

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
      // The DEFAULT bundle · an opt-in module a deck may never load does not
      // belong in "Rikiki has N components".
      expect(value, `${where} says ${value} components, index.ts registers ${core.length}`).toBe(
        core.length,
      );
    }
  });
});

describe('every element is documented where an author will look', () => {
  it('the catalogue lists every core element an author can write', () => {
    const page = readFileSync(CATALOGUE_PAGE, 'utf8');
    const missing = core
      .filter((name) => !NOT_IN_CATALOGUE.includes(name))
      .filter((name) => !page.includes(name));
    expect(missing, `absent from the components catalogue: ${missing.join(', ')}`).toEqual([]);
  });

  it('every opt-in element says so in the reference', () => {
    // An author who reads about deck-bar must learn, in the same table, that it
    // needs its own <script> · otherwise they hit an unknown element.
    const reference = readFileSync(LLM_REFERENCE, 'utf8');
    for (const name of optIn) {
      expect(reference, `${name} is not documented`).toContain(name);
    }
    expect(reference, 'the reference explains the opt-in contract').toMatch(/opt-in/i);
  });

  it('the catalogue bucket counts match its own arrays', () => {
    const { layouts, atoms } = catalogueCounts();
    const page = readFileSync(CATALOGUE_PAGE, 'utf8');
    expect(page).toContain(`<strong>${layouts} layouts</strong>`);
    expect(page).toContain(`<strong>${atoms} building blocks</strong>`);
  });

  it('the LLM reference lists every element, core and opt-in', () => {
    const reference = readFileSync(LLM_REFERENCE, 'utf8');
    const missing = elements.filter((name) => !reference.includes(name));
    expect(missing, `absent from the LLM reference: ${missing.join(', ')}`).toEqual([]);
  });
});
