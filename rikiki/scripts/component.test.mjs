import { readFileSync, readdirSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  CATALOGUE_PAGE,
  COUNT_SURFACES,
  catalogueCounts,
  LLM_REFERENCE,
  NOT_IN_CATALOGUE,
  PKG_DIR,
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

  it('the landing optional count agrees with the opt-in registry', () => {
    const hero = readFileSync(resolve(REPO_ROOT, 'site/src/components/Hero.astro'), 'utf8');
    expect(hero).toContain(`${optIn.length} optional`);
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

// ────────────────────────────────────────────────────────────────
// The showcase has to show it
//
// e2e/emphasis.spec.ts and e2e/ink.spec.ts only measure what a fixture actually
// renders. An extras component that appears in no fixture is checked by nothing
// at all, and the gap is invisible · the suite stays green and the component
// ships unlooked-at. This is the cheapest guard in the set and the one that
// keeps the expensive ones honest.
// ────────────────────────────────────────────────────────────────

describe('every opt-in component appears in a fixture deck', () => {
  const EXTRAS_DIR = resolve(PKG_DIR, 'src', 'extras');
  const FIXTURES = resolve(PKG_DIR, 'decks', 'tests');

  /** Every element registered under src/extras/, the opt-in surface. */
  const extras = readdirSync(EXTRAS_DIR)
    .filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts'))
    .flatMap((f) => [
      ...readFileSync(join(EXTRAS_DIR, f), 'utf8').matchAll(/@customElement\('([^']+)'\)/g),
    ])
    .map((m) => m[1])
    .sort();

  const decks = readdirSync(FIXTURES)
    .filter((f) => f.endsWith('.html'))
    .map((f) => readFileSync(join(FIXTURES, f), 'utf8'))
    .join('\n');

  it('finds the opt-in components to check', () => {
    expect(extras.length).toBeGreaterThan(10);
  });

  it.each(extras)('%s is written on a slide somewhere', (tag) => {
    expect(decks, `<${tag}> appears in no deck under decks/tests/`).toContain(`<${tag}`);
  });
});
