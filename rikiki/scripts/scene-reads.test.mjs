import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { ITEM_ATTRIBUTES, SCENE_KINDS, SCENE_READS } from '../src/media/scene-lint.ts';

// `SCENE_READS` says which attributes a scene looks at, and the lint warns about
// every other one. If the table drifts from the drawing, the lint either cries
// over an attribute that works or stays silent over one that does not · so the
// table is checked against the sources, not against a memory of them.

const source = (name) => {
  try {
    return readFileSync(fileURLToPath(new URL(`../src/media/${name}.ts`, import.meta.url)), 'utf8');
  } catch {
    return '';
  }
};

/** Item attributes a scene reads: `item.getAttribute('x')` / `hasAttribute('x')`
 *  in its element or its layout module. */
const attributesRead = (kind) => {
  const code = source(`deck-scene-${kind}`) + source(`deck-scene-${kind}-layout`);
  const names = [...code.matchAll(/\b(?:get|has)Attribute\('([a-z-]+)'\)/g)].map((m) => m[1]);
  return ITEM_ATTRIBUTES.filter((attribute) => names.includes(attribute)).sort();
};

describe('SCENE_READS', () => {
  it.each(SCENE_KINDS)('lists exactly what deck-scene-%s reads of an item', (kind) => {
    expect(attributesRead(kind)).not.toEqual([]);
    expect([...SCENE_READS[kind]].sort()).toEqual(attributesRead(kind));
  });
});
