import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// One axis, kept.
//
// docs/design/adr-004-source-modulith-by-family.md · src/ used to sort files
// on three axes at once (layer, size, distribution) and a contributor adding
// a component got three answers and no rule. The tree is one axis now, and
// what keeps it that way is this file rather than the ADR.
//
// The rule that matters most is the shared/ one. Six of its eleven modules
// had exactly one importer, in another directory · a helper that belongs to
// its consumer, exiled because it was "pure". ADR-001 had already named the
// problem ("a bag of pure helpers with no boundary") and it kept growing
// anyway, which is the argument for a test over a note.

const PKG_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = resolve(PKG_DIR, 'src');

/** The families, and nothing else. core/ is ADR-001's bounded context and
 *  keeps its own internal layering, guarded by architecture.test.mjs. */
const FAMILIES = ['core', 'data', 'engine', 'layout', 'media', 'shared', 'structure', 'text'];

function sources(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return sources(full);
    return entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts') ? [full] : [];
  });
}

const rel = (file) => relative(PKG_DIR, file);
const familyOf = (file) => file.slice(SRC.length + 1).split('/')[0];
const allSources = sources(SRC);

describe('the tree has one axis', () => {
  it('src/ root holds index.ts and nothing else', () => {
    // livereload.ts and shared-styles.ts sat here because no bucket fit them,
    // which is what a missing axis looks like from the inside.
    const loose = readdirSync(SRC, { withFileTypes: true })
      .filter((e) => e.isFile() && e.name !== 'index.ts')
      .map((e) => e.name);
    expect(loose, `orphans at src/ root: ${loose.join(', ')}`).toEqual([]);
  });

  it('every directory under src/ is a declared family', () => {
    const dirs = readdirSync(SRC, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort();
    expect(dirs).toEqual(FAMILIES);
  });

  it('finds sources in every family', () => {
    // A walk that matched nothing would make every case below vacuous.
    for (const family of FAMILIES) {
      const count = allSources.filter((f) => familyOf(f) === family).length;
      expect(count, `src/${family} is empty`).toBeGreaterThan(0);
    }
  });
});

describe('shared/ holds only what two families need', () => {
  /** Files outside shared/ that import a given shared module, by family. */
  function familiesUsing(name) {
    const users = allSources.filter(
      (f) => familyOf(f) !== 'shared' && readFileSync(f, 'utf8').includes(`/shared/${name}.js`),
    );
    return new Set(users.map(familyOf));
  }

  const sharedModules = sources(resolve(SRC, 'shared')).map((f) =>
    f.slice(f.lastIndexOf('/') + 1, -3),
  );

  it('finds the shared modules to check', () => {
    expect(sharedModules.length).toBeGreaterThan(0);
  });

  it.each(sharedModules)('%s is used by two families or more', (name) => {
    const families = [...familiesUsing(name)].sort();
    expect(
      families.length,
      `src/shared/${name}.ts is used only by ${families.join(', ') || 'nobody'} · move it in with its consumer`,
    ).toBeGreaterThan(1);
  });
});

describe('a family owns its helpers', () => {
  /** A component · every family may render and import another family's
   *  component. What it may not reach for is another family's internals. */
  const isComponent = (module) => module.startsWith('deck-');

  // core/ is governed by architecture.test.mjs, which enforces a stricter
  // rule than this one: its layers may only point inward. Checking it here
  // too would read application -> domain, its correct direction, as a family
  // crossing.
  const outsideCore = allSources.filter(
    (f) => familyOf(f) !== 'shared' && familyOf(f) !== 'core',
  );

  it.each(outsideCore)('%s imports no other family’s helper', (file) => {
    const mine = familyOf(file);
    const reach = [...readFileSync(file, 'utf8').matchAll(/from '\.\.\/([a-z]+)\/([a-z-]+)\.js'/g)]
      .filter(([, family, module]) => {
        if (!FAMILIES.includes(family)) return false;
        if (family === mine || family === 'shared' || family === 'core') return false;
        return !isComponent(module);
      })
      .map((m) => m[0]);
    expect(
      reach,
      `${rel(file)} reaches into another family's internals: ${reach.join(', ')}`,
    ).toEqual([]);
  });
});
