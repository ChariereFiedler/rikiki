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
export const PKG_DIR = resolve(here, '..');
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
 *  a statement about what you get when you load dist/index.js; a module a deck
 *  may never load does not belong in that number. Manifesto principle 3: light
 *  by default, extensible on demand.
 *
 *  Named for the fact, not for a rank · a component is in the convenience
 *  bundle or it is not. "core" read as a first class with everything else
 *  beneath it, which is not how they differ. */
export function bundledElements() {
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

/** Registered, but only when the deck loads the module itself · everything
 *  src/index.ts does not import. Not a lesser kind of component: the same
 *  contract, the same guards, simply outside the convenience bundle. */
export function separateElements() {
  const bundled = new Set(bundledElements());
  return registeredElements().filter((name) => !bundled.has(name));
}

/** Every page that publishes a component count. */
export const COUNT_SURFACES = [
  {
    file: at('site/src/components/Hero.astro'),
    label: 'home hero',
    find: /<strong>(\d+)<\/strong> core components/g,
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
    // The README claims its own figures are derived. That claim is only true
    // while this row exists.
    file: at('README.md'),
    label: 'README default bundle',
    find: /\*\*(\d+) elements in the default bundle\*\*/g,
  },
];

export const CATALOGUE_PAGE = at('site/src/pages/docs/components.astro');
export const LLM_REFERENCE = resolve(PKG_DIR, 'docs/llms/rikiki-reference.md');

/** The catalogue page's frontmatter · every array of entries lives there. */
function catalogueSource() {
  const page = readFileSync(CATALOGUE_PAGE, 'utf8');
  const close = page.indexOf('\n---', 3);
  return close < 0 ? page : page.slice(0, close);
}

/** One array of catalogue entries, from its declaration to the `];` that closes
 *  it in column 0 · a nested array (a parent's children) is indented, so it does
 *  not end the block early. */
function arrayBlock(source, declaration) {
  const start = source.indexOf(declaration);
  if (start < 0) throw new Error(`${declaration} is missing from the components catalogue`);
  const end = source.indexOf('\n];', start);
  return source.slice(start, end < 0 ? source.length : end);
}

/** Every entry declares its element on a `    tag: '...'` line · one indent
 *  level inside its array, which is what separates an entry from anything else
 *  the frontmatter mentions. */
const ENTRY_TAG = /^ {4}tag: '([^']+)',$/gm;

const CATALOGUE_ARRAYS = {
  layouts: 'const layouts: Component[] = [',
  atoms: 'const atoms: Component[] = [',
  optional: 'const optionalComponents: OptionalComponent[] = [',
  children: 'const optionalChildren: ChildComponent[] = [',
};

/** How many entries the catalogue actually details, per array · the page
 *  publishes these numbers and they drifted from the arrays below them. */
export function catalogueCounts() {
  const source = catalogueSource();
  const counts = {};
  for (const [bucket, declaration] of Object.entries(CATALOGUE_ARRAYS)) {
    counts[bucket] = [...arrayBlock(source, declaration).matchAll(ENTRY_TAG)].length;
  }
  return counts;
}

/** Element tag → the text of its catalogue entry · the slice that runs from its
 *  own `tag:` line to the next entry's. Checking an attribute against the whole
 *  page would pass on a mention under some other element. */
export function catalogueEntries() {
  const source = catalogueSource();
  const marks = [...source.matchAll(ENTRY_TAG)];
  const entries = new Map();
  for (let i = 0; i < marks.length; i++) {
    const from = marks[i].index;
    const to = i + 1 < marks.length ? marks[i + 1].index : source.length;
    entries.set(marks[i][1], source.slice(from, to));
  }
  return entries;
}

/** A Lit `@property` declaration and the field it decorates · the modifiers
 *  between the two (`override` on deck-code's `lang`, for one) are skipped. */
const PROPERTY =
  /@property\(([^)]*)\)\s*(?:(?:override|declare|readonly|accessor|public|private|protected)\s+)*([A-Za-z_$][\w$]*)/g;

/** The attribute a `@property` declaration reads, or null when it reads none.
 *
 *  Lit's rule, which this mirrors: `attribute: false` means the property is set
 *  in JavaScript only; `attribute: 'x-y'` names the attribute outright; with
 *  neither, the attribute is the property name LOWERCASED · Lit does not
 *  kebab-case it, so `noHeader` would observe `noheader` and every multi-word
 *  property in src/ therefore spells its attribute out. */
function attributeOf(options, propertyName) {
  if (/attribute:\s*false/.test(options)) return null;
  const named = options.match(/attribute:\s*'([^']+)'/);
  return named ? named[1] : propertyName.toLowerCase();
}

/** Element tag → the attribute names its source declares.
 *
 *  Chunked by class rather than by decorator so the `customElements.define`
 *  registration style is covered too, and so a file that registers several
 *  elements (deck-shortcut.ts registers three) keeps each one's properties on
 *  the element that declares them. */
export function elementAttributes() {
  const attributes = {};
  for (const file of walk(SRC_DIR)) {
    const src = readFileSync(file, 'utf8');
    const tagOf = {};
    for (const m of src.matchAll(/@customElement\('([^']+)'\)\s*export class ([A-Za-z0-9_$]+)/g)) {
      tagOf[m[2]] = m[1];
    }
    for (const m of src.matchAll(/customElements\.define\('([^']+)',\s*([A-Za-z0-9_$]+)/g)) {
      tagOf[m[2]] = m[1];
    }
    const classes = [...src.matchAll(/^export class ([A-Za-z0-9_$]+) extends /gm)];
    for (let i = 0; i < classes.length; i++) {
      const tag = tagOf[classes[i][1]];
      if (!tag) continue;
      const end = i + 1 < classes.length ? classes[i + 1].index : src.length;
      const body = src.slice(classes[i].index, end);
      const names = [];
      for (const p of body.matchAll(PROPERTY)) {
        const attribute = attributeOf(p[1], p[2]);
        if (attribute) names.push(attribute);
      }
      attributes[tag] = names;
    }
  }
  return attributes;
}

/** Attributes an author is not meant to write · each one needs a reason, and
 *  the reason is what stops the list from becoming a place to hide an omission.
 *  Anything absent from here has to appear in the element's catalogue entry. */
export const UNDOCUMENTED_ATTRIBUTES = {
  'deck-point': {
    banded: 'written by deck-bento to share its grid rows · never by an author',
  },
  'deck-mermaid': {
    rendered: 'reflected once the diagram has painted · a state marker, not an input',
  },
};
