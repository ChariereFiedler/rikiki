import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { componentGraph, expandDeps } from '../bin/lib/component-deps.mjs';

// A component can render another component's tag.
//
// `rikiki bundle` curates the runtime from the tags written in the deck
// (bin/lib/inline.mjs). A tag that only ever appears inside another
// component's template is invisible to that scan, so the curated deck shipped
// without it and the element stayed unregistered · rendering as bare text.
// decks/tests/figure.html is the live case: it writes <deck-figure> and never
// writes <deck-source>, which deck-figure renders for its credit line.
//
// The graph is read from dist/, not from src/, because that is the only thing
// present in an installed package · `rikiki bundle` runs from node_modules.

const PKG_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = resolve(PKG_DIR, 'dist');

describe('the graph is read from what ships', () => {
  const graph = componentGraph(DIST);

  it('finds components to check', () => {
    expect(graph.size).toBeGreaterThan(40);
  });

  it.each([
    ['deck-figure', 'deck-source'],
    ['deck-annotate', 'deck-source'],
    ['deck-graph', 'deck-icon'],
  ])('%s renders %s', (from, to) => {
    expect([...(graph.get(from) ?? [])]).toContain(to);
  });

  it('never points a component at itself', () => {
    for (const [tag, deps] of graph)
      expect([...deps], `${tag} depends on itself`).not.toContain(tag);
  });

  it('only names tags that have a module of their own', () => {
    // deck-kbd and deck-tier are defined inside a sibling's file and have no
    // dist/<tag>.js · they travel with their parent module and must not be
    // asked for separately.
    for (const [tag, deps] of graph) {
      for (const dep of deps) {
        expect(graph.has(dep), `${tag} names ${dep}, which has no module`).toBe(true);
      }
    }
  });
});

describe('expansion', () => {
  it('leaves a component with no dependency alone', () => {
    expect(expandDeps(['deck-callout'], DIST)).toEqual(['deck-callout']);
  });

  it('pulls in what a component renders', () => {
    expect(expandDeps(['deck-figure'], DIST)).toContain('deck-source');
  });

  it('is idempotent · expanding an expanded set adds nothing', () => {
    const once = expandDeps(['deck-figure', 'deck-graph'], DIST);
    expect(expandDeps(once, DIST).sort()).toEqual(once.sort());
  });

  it('terminates on a cycle rather than recursing forever', () => {
    // No cycle exists today. This asserts the traversal is a closure over a
    // visited set, so introducing one is a bug report and not a stack
    // overflow in a contributor's terminal.
    const all = [...componentGraph(DIST).keys()];
    expect(expandDeps(all, DIST).length).toBeGreaterThanOrEqual(all.length);
  });
});

describe('the deck that exposed the defect', () => {
  it('figure.html writes deck-figure and never writes deck-source', () => {
    // If this stops being true the fixture no longer covers the case, and the
    // test below would pass for the wrong reason.
    const html = readFileSync(resolve(PKG_DIR, 'decks/tests/figure.html'), 'utf8');
    expect(html).toMatch(/<deck-figure[\s/>]/);
    expect(html).not.toMatch(/<deck-source[\s/>]/);
  });

  it('expanding what that deck writes yields deck-source', () => {
    expect(expandDeps(['deck-root', 'deck-figure'], DIST)).toContain('deck-source');
  });
});
