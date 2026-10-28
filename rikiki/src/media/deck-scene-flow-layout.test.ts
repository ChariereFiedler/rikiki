import { describe, expect, it } from 'vitest';
import {
  GRID,
  MAX_OUTCOMES,
  MAX_SOURCES,
  flowColumns,
  flowRoles,
  hubHeight,
  stackHeight,
  stackTops,
} from './deck-scene-flow-layout.js';
import { GAP, PAD, SCENE_WIDTH } from './scene-layout.js';

interface Item {
  name: string;
  emphasis?: boolean;
}
const item = (name: string, emphasis = false): Item => ({ name, emphasis });
const isEmphasis = (entry: Item) => entry.emphasis === true;
const names = (entries: Item[]) => entries.map((entry) => entry.name);

describe('flowRoles', () => {
  it('makes the emphasised item the hub, what precedes it sources, what follows it outcomes', () => {
    const roles = flowRoles([item('a'), item('b'), item('hub', true), item('out')], isEmphasis);
    expect(names(roles.sources)).toEqual(['a', 'b']);
    expect(roles.hub?.name).toBe('hub');
    expect(names(roles.outcomes)).toEqual(['out']);
  });

  it('makes the last item the hub when none is emphasised, with no outcome', () => {
    const roles = flowRoles([item('a'), item('b'), item('c')], isEmphasis);
    expect(names(roles.sources)).toEqual(['a', 'b']);
    expect(roles.hub?.name).toBe('c');
    expect(roles.outcomes).toEqual([]);
  });

  it('keeps the first emphasised item as the hub when several are marked', () => {
    const roles = flowRoles([item('a'), item('hub', true), item('other', true)], isEmphasis);
    expect(roles.hub?.name).toBe('hub');
    expect(names(roles.outcomes)).toEqual(['other']);
  });

  it('ignores sources and outcomes beyond the maximum', () => {
    const sources = Array.from({ length: MAX_SOURCES + 2 }, (_, i) => item(`s${i}`));
    const outcomes = Array.from({ length: MAX_OUTCOMES + 1 }, (_, i) => item(`o${i}`));
    const roles = flowRoles([...sources, item('hub', true), ...outcomes], isEmphasis);
    expect(roles.sources).toHaveLength(MAX_SOURCES);
    expect(roles.outcomes).toHaveLength(MAX_OUTCOMES);
  });

  it('has no hub when there is no item', () => {
    expect(flowRoles([], isEmphasis)).toEqual({ sources: [], hub: undefined, outcomes: [] });
  });
});

describe('flowColumns', () => {
  it('lays sources, hub and outcomes at their shares, with equal connector lanes', () => {
    const { sources, hub, outcomes, link } = flowColumns(true, true);
    expect(sources).toEqual({ x: 0, width: 480 });
    expect(hub).toEqual({ x: 480 + link, width: 352 });
    expect(outcomes?.x).toBe(hub.x + hub.width + link);
    expect((outcomes?.x ?? 0) + (outcomes?.width ?? 0)).toBe(SCENE_WIDTH);
    expect(link).toBe(176);
  });

  it('scales the shares to fill the width when there is no outcome column', () => {
    const { sources, hub, outcomes, link } = flowColumns(true, false);
    expect(outcomes).toBeNull();
    expect(hub.x).toBe((sources?.width ?? 0) + link);
    expect(hub.x + hub.width).toBe(SCENE_WIDTH);
    expect((sources?.width ?? 0) / hub.width).toBeCloseTo(0.3 / 0.22, 1);
  });

  it('puts every column edge on the grid', () => {
    for (const [hasSources, hasOutcomes] of [
      [true, true],
      [true, false],
      [false, true],
    ] as const) {
      const { sources, hub, outcomes } = flowColumns(hasSources, hasOutcomes);
      for (const span of [sources, hub, outcomes]) {
        if (!span) continue;
        expect(span.x % GRID).toBe(0);
        expect(span.width % GRID).toBe(0);
      }
    }
  });
});

describe('stacking', () => {
  it('stacks equal boxes with GAP between them, centred on the given line', () => {
    const first = 200 - (3 * 100 + 2 * GAP) / 2;
    expect(stackTops(3, 100, 200)).toEqual([first, first + 100 + GAP, first + 2 * (100 + GAP)]);
  });

  it('is empty with no box', () => {
    expect(stackHeight(0, 100)).toBe(0);
    expect(stackTops(0, 100, 50)).toEqual([]);
  });
});

describe('hubHeight', () => {
  it('keeps the content height when one outcome leaves it at the middle', () => {
    expect(hubHeight(200, 150, 1)).toBe(200);
  });

  it('grows so that the outermost arrow leaves the hub a PAD from its edge', () => {
    const outcome = 300;
    expect(hubHeight(200, outcome, 2)).toBe(outcome + GAP + 2 * PAD);
  });
});
