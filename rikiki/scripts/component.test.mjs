import { readFileSync, readdirSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  CATALOGUE_PAGE,
  COUNT_SURFACES,
  catalogueCounts,
  catalogueEntries,
  elementAttributes,
  LLM_REFERENCE,
  NOT_IN_CATALOGUE,
  PKG_DIR,
  REPO_ROOT,
  UNDOCUMENTED_ATTRIBUTES,
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

  // The catalogue now interpolates the lengths of its own arrays, so the prose
  // and the entries below it cannot disagree. What can still break is the
  // derivation itself: a renamed array, or a bucket that quietly empties.
  it('the catalogue derives its bucket counts from its own arrays', () => {
    const page = readFileSync(CATALOGUE_PAGE, 'utf8');
    for (const binding of [
      'const layoutCount = layouts.length;',
      'const atomCount = atoms.length;',
      'const optionalModuleCount = optionalComponents.length;',
      'const childCount = optionalChildren.length;',
    ]) {
      expect(page, `the catalogue no longer derives its counts · ${binding}`).toContain(binding);
    }
    for (const [bucket, count] of Object.entries(catalogueCounts())) {
      expect(count, `the ${bucket} array details no component`).toBeGreaterThan(0);
    }
  });

  it('the LLM reference lists every element, core and opt-in', () => {
    const reference = readFileSync(LLM_REFERENCE, 'utf8');
    const missing = elements.filter((name) => !reference.includes(name));
    expect(missing, `absent from the LLM reference: ${missing.join(', ')}`).toEqual([]);
  });
});

// ────────────────────────────────────────────────────────────────
// An attribute that exists but is not written down
//
// The catalogue was read by hand and drifted from the source in one direction
// only: a `@property` added later kept working and stayed undocumented, so an
// author could not discover deck-csv's highlight-rows, deck-stat's compact or
// deck-punch's fit at all. The source declares the attribute surface, so the
// source is what the page is checked against.
// ────────────────────────────────────────────────────────────────

describe('every attribute an element declares is in its catalogue entry', () => {
  const entries = catalogueEntries();
  const attributes = elementAttributes();
  const catalogued = [...entries.keys()].filter((tag) => (attributes[tag] ?? []).length > 0);

  it('finds the catalogue entries to check', () => {
    // A parsing change that silently matched nothing would make every case
    // below vacuous · this is the assertion that notices.
    expect(catalogued.length).toBeGreaterThan(30);
  });

  it.each(catalogued)('%s documents every attribute it declares', (tag) => {
    const entry = entries.get(tag);
    const excused = UNDOCUMENTED_ATTRIBUTES[tag] ?? {};
    const missing = attributes[tag].filter((name) => {
      if (excused[name]) return false;
      // Word boundaries that treat `-` as part of the name, so `note` is not
      // matched by `note-position` and `n` is not matched by `num`.
      return !new RegExp(`(?<![\\w-])${name}(?![\\w-])`).test(entry);
    });
    expect(
      missing,
      `<${tag}> accepts ${missing.join(', ')} · absent from its catalogue entry`,
    ).toEqual([]);
  });

  it('every excused attribute names a real property and gives a reason', () => {
    for (const [tag, excuses] of Object.entries(UNDOCUMENTED_ATTRIBUTES)) {
      for (const [name, reason] of Object.entries(excuses)) {
        expect(attributes[tag], `${tag} is not a registered element`).toBeDefined();
        expect(attributes[tag], `${tag} no longer declares ${name}`).toContain(name);
        expect(reason.length, `${tag}/${name} is excused without a reason`).toBeGreaterThan(20);
      }
    }
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
