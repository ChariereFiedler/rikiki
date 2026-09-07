// Single source of truth for "how many components does rikiki have".
//
// The answer was published as 23, 26 and 30 on different pages while the source
// registered 34. It is derivable, so it is derived · scripts/component.test.mjs
// fails the build when a page disagrees.

import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = resolve(here, '..', '..');
const PKG_DIR = resolve(here, '..');
const SRC_DIR = resolve(PKG_DIR, 'src');

const at = (...p) => resolve(REPO_ROOT, ...p);

function* walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts')) yield full;
  }
}

/** Every custom element the package registers, sorted.
 *
 *  Both registration styles count: the `@customElement` decorator and the bare
 *  `customElements.define` call (deck-kicker uses the latter, which is why every
 *  decorator-only count was one short). */
export function registeredElements() {
  const names = new Set();
  for (const file of walk(SRC_DIR)) {
    const src = readFileSync(file, 'utf8');
    for (const m of src.matchAll(/@customElement\('([^']+)'\)/g)) names.add(m[1]);
    for (const m of src.matchAll(/customElements\.define\('([^']+)'/g)) names.add(m[1]);
  }
  return [...names].sort();
}

/** Elements an author never writes · counted as components, but not listed in
 *  the components catalogue, which documents what you put on a slide. */
export const NOT_IN_CATALOGUE = ['deck-root'];

/** Elements the DEFAULT bundle registers · everything src/index.ts imports.
 *
 *  The split matters for what the docs may claim. "Rikiki has N components" is
 *  a statement about what you get when you load dist/index.js; an opt-in module
 *  a deck may never import does not belong in that number. Manifesto principle
 *  3: light by default, extensible on demand. */
export function coreElements() {
  const entry = readFileSync(resolve(SRC_DIR, 'index.ts'), 'utf8');
  const imported = new Set(
    [...entry.matchAll(/^\s*import\s+'\.\/([^']+)\.js'/gm)].map((m) => `${m[1]}.ts`),
  );
  const names = new Set();
  for (const file of walk(SRC_DIR)) {
    const relative = file.slice(SRC_DIR.length + 1);
    if (!imported.has(relative)) continue;
    const src = readFileSync(file, 'utf8');
    for (const m of src.matchAll(/@customElement\('([^']+)'\)/g)) names.add(m[1]);
    for (const m of src.matchAll(/customElements\.define\('([^']+)'/g)) names.add(m[1]);
  }
  return [...names].sort();
}

/** Registered, but only when the deck asks for the module · src/extras/**. */
export function optInElements() {
  const core = new Set(coreElements());
  return registeredElements().filter((name) => !core.has(name));
}

/** Every page that publishes a component count. */
export const COUNT_SURFACES = [
  {
    file: at('site/src/pages/index.astro'),
    label: 'home stat tile',
    find: /Lit and (\d+) components/g,
  },
  {
    file: at('site/src/pages/docs/recipes.astro'),
    label: 'recipes claim',
    find: /(\d+) components/g,
  },
  {
    // "your first deck in 5 components" is a deliberate subset, not the total.
    file: at('site/src/pages/docs/cheatsheet.astro'),
    label: 'cheatsheet intro',
    find: /Rikiki has (\d+) components/g,
  },
  {
    file: at('site/src/pages/docs/components.astro'),
    label: 'components catalogue intro',
    find: /(\d+) components (?:total|fit)/g,
  },
];

/** How many entries the catalogue actually details, per bucket · the page
 *  publishes both numbers and they drifted from the arrays below them. */
export function catalogueCounts() {
  const page = readFileSync(CATALOGUE_PAGE, 'utf8');
  const atomsAt = page.indexOf('const atoms: Component[] = [');
  const count = (chunk) => [...chunk.matchAll(/tag: 'deck-/g)].length;
  return {
    layouts: count(page.slice(page.indexOf('const layouts: Component[] = ['), atomsAt)),
    atoms: count(page.slice(atomsAt, page.indexOf('---', atomsAt))),
  };
}

export const CATALOGUE_PAGE = at('site/src/pages/docs/components.astro');
export const LLM_REFERENCE = resolve(PKG_DIR, 'docs/llms/rikiki-reference.md');
