import { describe, expect, it } from 'vitest';
import {
  DEFAULT_MAX_LINES,
  type StackInput,
  type TableGridInput,
  type UniformGridInput,
  grid,
  stack,
} from './stack.js';
import type { Align, Block, EngineResult, Placed } from './types.js';

/** Cases drawn per property. */
const CASES = 300;
/** Lengths compared after float arithmetic. */
const EPS = 1e-6;
const ALIGNS: Align[] = ['start', 'center', 'end', 'stretch'];

/** A seeded generator · the same seed draws the same cases on every run. */
function mulberry32(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Random = () => number;
const between = (rand: Random, lo: number, hi: number) => lo + rand() * (hi - lo);
const whole = (rand: Random, lo: number, hi: number) => Math.floor(between(rand, lo, hi + 1));
const pick = <T>(rand: Random, items: readonly T[]) => items[Math.floor(rand() * items.length)];

type Extra = Partial<Pick<Block, 'maxW' | 'weight'>>;

/** A text-like block · as many lines as its preferred width needs at the width it gets,
 *  so its height never grows when it is given more room. */
function textBlock(
  key: string,
  minW: number,
  prefW: number,
  lineH: number,
  extra: Extra = {},
): Block {
  const lines = (w: number) => Math.max(1, Math.ceil(prefW / Math.max(w, 1) - EPS));
  return { key, minW, prefW, heightFor: (w) => lineH * lines(w), ...extra };
}

/** The same block at one height whatever its width. */
const flat = (b: Block): Block => ({ ...b, heightFor: () => 40 });

function randomBlock(rand: Random, key: string): Block {
  const minW = between(rand, 20, 300);
  const prefW = minW + between(rand, 0, 300);
  const extra: Extra = {};
  if (rand() < 0.5) extra.maxW = prefW + between(rand, 0, 400);
  if (rand() < 0.5) extra.weight = between(rand, 0.5, 4);
  return textBlock(key, minW, prefW, between(rand, 20, 60), extra);
}

function randomStack(rand: Random): StackInput {
  const count = whole(rand, 0, 8);
  return {
    direction: rand() < 0.6 ? 'row' : 'column',
    blocks: Array.from({ length: count }, (_, i) => randomBlock(rand, `b${i}`)),
    bounds: { w: between(rand, 200, 1600), h: between(rand, 100, 900) },
    gap: rand() < 0.2 ? 0 : between(rand, 0, 48),
    align: pick(rand, ALIGNS),
    wrap: rand() < 0.5,
    equalCross: rand() < 0.3,
    maxLines: whole(rand, 1, 4),
  };
}

function randomUniform(rand: Random): UniformGridInput {
  return {
    mode: 'uniform',
    count: whole(rand, 0, 400),
    columns: rand() < 0.5 ? 'auto' : whole(rand, 1, 40),
    bounds: { w: between(rand, 200, 1600), h: between(rand, 100, 600) },
    gap: rand() < 0.2 ? 0 : between(rand, 0, 12),
    minCell: between(rand, 4, 16),
    maxCell: between(rand, 20, 60),
  };
}

function randomTable(rand: Random): TableGridInput {
  const rows = whole(rand, 0, 6);
  const tracks = Array.from({ length: whole(rand, 1, 4) }, () =>
    pick(rand, ['auto', 'fill', between(rand, 40, 300)] as const),
  );
  return {
    mode: 'table',
    rows: Array.from({ length: rows }, (_, r) =>
      tracks.map((_, c) => randomBlock(rand, `r${r}c${c}`)),
    ),
    tracks,
    bounds: { w: between(rand, 300, 1600), h: between(rand, 100, 900) },
    gap: { w: between(rand, 0, 32), h: between(rand, 0, 24) },
  };
}

/** Runs `check` on `CASES` drawn cases, the seed named on failure. */
function forCases<T>(draw: (rand: Random) => T, check: (input: T, seed: number) => void) {
  for (let seed = 1; seed <= CASES; seed++) check(draw(mulberry32(seed)), seed);
}

function allFinite(result: EngineResult): boolean {
  const numbers = result.placed.flatMap((p) => [p.x, p.y, p.w, p.h]);
  numbers.push(result.size.w, result.size.h);
  return numbers.every((n) => Number.isFinite(n) && n >= 0);
}

function inBounds(result: EngineResult, bounds: { w: number; h: number }): boolean {
  const size = result.size.w <= bounds.w + EPS && result.size.h <= bounds.h + EPS;
  return (
    size && result.placed.every((p) => p.x + p.w <= bounds.w + EPS && p.y + p.h <= bounds.h + EPS)
  );
}

const overlaps = (a: Placed, b: Placed) =>
  a.x + a.w > b.x + EPS && b.x + b.w > a.x + EPS && a.y + a.h > b.y + EPS && b.y + b.h > a.y + EPS;

function noOverlap(placed: Placed[]): boolean {
  return placed.every((a, i) => placed.slice(i + 1).every((b) => !overlaps(a, b)));
}

/** Each next child is after the last along the axis, or starts a new line below it. */
function keepsOrder(input: StackInput, placed: Placed[]): boolean {
  if (placed.map((p) => p.key).join() !== input.blocks.map((b) => b.key).join()) return false;
  return placed.slice(1).every((next, i) => {
    const prev = placed[i];
    if (input.direction === 'column') return next.y >= prev.y + prev.h - EPS;
    return next.x >= prev.x + prev.w - EPS || next.y >= prev.y + prev.h - EPS;
  });
}

describe('stack, properties', () => {
  it('is deterministic · the same input draws the same placement', () => {
    forCases(randomStack, (input, seed) => {
      expect(stack(input), `seed ${seed}`).toEqual(stack(randomStack(mulberry32(seed))));
    });
  });

  it('gives finite, non-negative numbers and never drops a child', () => {
    forCases(randomStack, (input, seed) => {
      const result = stack(input);
      expect(allFinite(result), `seed ${seed}`).toBe(true);
      expect(result.placed).toHaveLength(input.blocks.length);
      expect(result.status === 'fit').toBe(result.reasons.length === 0);
    });
  });

  it('keeps a fitted placement inside the bounds, with no two children overlapping', () => {
    forCases(randomStack, (input, seed) => {
      const result = stack(input);
      if (result.status !== 'fit') return;
      expect(inBounds(result, input.bounds), `seed ${seed}`).toBe(true);
      expect(noOverlap(result.placed), `seed ${seed}`).toBe(true);
    });
  });

  it('keeps the order of the children along the axis', () => {
    forCases(randomStack, (input, seed) => {
      expect(keepsOrder(input, stack(input).placed), `seed ${seed}`).toBe(true);
    });
  });

  it('never wraps a row past maxLines', () => {
    forCases(randomStack, (input, seed) => {
      const result = stack({ ...input, direction: 'row', wrap: true });
      expect(result.lines, `seed ${seed}`).toBeLessThanOrEqual(input.maxLines ?? DEFAULT_MAX_LINES);
      const tops = new Set(result.placed.map((p) => p.y));
      if (input.align === 'start' || input.equalCross) expect(tops.size).toBe(result.lines);
    });
  });

  it('shares the free room of a row in proportion to the weights when no maxW bites', () => {
    forCases(randomStack, (drawn, seed) => {
      const blocks = drawn.blocks.map(({ maxW: _maxW, ...rest }) => rest);
      const prefs = blocks.reduce((a, b) => a + b.prefW, 0) + drawn.gap * (blocks.length - 1);
      const input = { ...drawn, direction: 'row' as const, blocks };
      input.bounds = { w: prefs + between(mulberry32(seed), 0, 600), h: 10_000 };
      const extra = input.bounds.w - prefs;
      const weights = blocks.map((b) => b.weight ?? 1);
      const total = weights.reduce((a, b) => a + b, 0);
      stack(input).placed.forEach((p, i) => {
        expect(Math.abs(p.w - blocks[i].prefW - (extra * weights[i]) / total)).toBeLessThan(1);
      });
    });
  });

  it('never goes from fit to unresolved when the bounds get wider', () => {
    forCases(randomStack, (drawn, seed) => {
      // Wrapping regroups children, so lines of mixed heights could stack taller ·
      // the guarantee holds when every child has the same height.
      const input = drawn.wrap ? { ...drawn, blocks: drawn.blocks.map(flat) } : drawn;
      if (stack(input).status !== 'fit') return;
      const wider = { ...input, bounds: { ...input.bounds, w: input.bounds.w + 1 + seed * 3 } };
      expect(stack(wider).status, `seed ${seed}`).toBe('fit');
    });
  });
});

describe('stack, cases', () => {
  const bounds = { w: 1000, h: 400 };
  const base = { bounds, gap: 20, align: 'start' as const };

  it('places nothing for no child, and fits', () => {
    const result = stack({ ...base, direction: 'row', blocks: [] });
    expect(result).toEqual({
      placed: [],
      size: { w: 0, h: 0 },
      status: 'fit',
      reasons: [],
      lines: 0,
    });
  });

  it('places one child at its preferred width, grown to the box', () => {
    const one = textBlock('a', 100, 300, 40);
    expect(stack({ ...base, direction: 'row', blocks: [one] }).placed[0]).toMatchObject({
      x: 0,
      w: 1000,
    });
    const capped = textBlock('a', 100, 300, 40, { maxW: 400 });
    expect(stack({ ...base, direction: 'row', blocks: [capped] }).size.w).toBe(400);
  });

  it('shrinks a short row toward the least widths in proportion to what each can give', () => {
    const blocks = [textBlock('a', 100, 700, 40), textBlock('b', 300, 500, 40)];
    const widths = stack({ ...base, gap: 0, direction: 'row', blocks }).placed.map((p) => p.w);
    // 200 over, 600 and 200 to give: three quarters from a, one from b.
    expect(widths).toEqual([550, 450]);
  });

  it('says why a child wider than the box alone is unresolved, and still draws it', () => {
    const result = stack({
      ...base,
      direction: 'row',
      blocks: [textBlock('wide', 1200, 1200, 40)],
    });
    expect(result.status).toBe('unresolved');
    expect(result.reasons.join()).toMatch(/"wide" needs at least 1200 wide/);
    expect(result.placed[0].w).toBe(1200);
  });

  it('wraps a row whose least widths do not fit, and names a row past maxLines', () => {
    const blocks = Array.from({ length: 6 }, (_, i) => textBlock(`b${i}`, 300, 300, 40));
    const wrapped = stack({ ...base, direction: 'row', blocks, wrap: true });
    expect(wrapped).toMatchObject({ status: 'fit', lines: 2 });
    const capped = stack({ ...base, direction: 'row', blocks, wrap: true, maxLines: 1 });
    expect(capped.lines).toBe(1);
    expect(capped.reasons.join()).toMatch(/needs 2 lines, 1 at most/);
  });

  it('aligns on the cross axis and stretches to the tallest', () => {
    const blocks = [textBlock('a', 100, 100, 40), textBlock('b', 100, 100, 100)];
    const at = (align: Align) => stack({ ...base, direction: 'row', align, blocks }).placed[0];
    expect(at('center')).toMatchObject({ y: 30, h: 40 });
    expect(at('end')).toMatchObject({ y: 60, h: 40 });
    expect(at('stretch')).toMatchObject({ y: 0, h: 100 });
  });

  it('names how much a row is too tall', () => {
    const result = stack({ ...base, direction: 'row', blocks: [textBlock('a', 100, 100, 500)] });
    expect(result.reasons).toEqual(['the row is 500 tall, 100 over the 400 of the box']);
  });

  it('squeezes the gaps of a column down to half before giving up', () => {
    const blocks = Array.from({ length: 5 }, (_, i) => textBlock(`b${i}`, 100, 100, 72));
    const roomy = { w: 1000, h: 420 };
    const squeezed = stack({ ...base, bounds: roomy, gap: 20, direction: 'column', blocks });
    // 360 of children leave 60 for four gaps of 20 · each gives 5.
    expect(squeezed.status).toBe('fit');
    expect(squeezed.placed[1].y).toBe(87);
    const tight = stack({
      ...base,
      gap: 20,
      direction: 'column',
      blocks,
      bounds: { w: 1000, h: 380 },
    });
    expect(tight.status).toBe('unresolved');
    expect(tight.placed[1].y).toBe(82);
  });

  it('gives a column child the box width capped by its maxW, all of it when stretched', () => {
    const blocks = [textBlock('a', 100, 200, 40, { maxW: 300 }), textBlock('b', 100, 200, 40)];
    const widths = (align: Align) =>
      stack({ ...base, direction: 'column', align, blocks }).placed.map((p) => p.w);
    expect(widths('start')).toEqual([300, 1000]);
    expect(widths('stretch')).toEqual([1000, 1000]);
  });

  it('lays a gap of 0 edge to edge', () => {
    const blocks = [textBlock('a', 100, 100, 40, { maxW: 100 }), textBlock('b', 100, 100, 40)];
    expect(stack({ ...base, gap: 0, direction: 'row', blocks }).placed[1].x).toBe(100);
  });
});

describe('grid uniform', () => {
  it('is deterministic, finite, and inside its bounds without overlap when it fits', () => {
    forCases(randomUniform, (input, seed) => {
      const result = grid(input);
      expect(result, `seed ${seed}`).toEqual(grid(randomUniform(mulberry32(seed))));
      expect(allFinite(result)).toBe(true);
      expect(result.placed).toHaveLength(input.count);
      if (result.status !== 'fit') return;
      expect(inBounds(result, input.bounds), `seed ${seed}`).toBe(true);
      expect(noOverlap(result.placed), `seed ${seed}`).toBe(true);
    });
  });

  it('draws exactly the columns asked for', () => {
    forCases(randomUniform, (drawn, seed) => {
      const columns = whole(mulberry32(seed), 1, 40);
      const result = grid({ ...drawn, columns });
      expect(result.columns, `seed ${seed}`).toBe(columns);
      const used = new Set(result.placed.map((p) => p.x)).size;
      expect(used, `seed ${seed}`).toBe(Math.min(columns, drawn.count));
    });
  });

  it('never goes from fit to unresolved when the bounds get wider', () => {
    forCases(randomUniform, (input, seed) => {
      if (grid(input).status !== 'fit') return;
      const wider = { ...input, bounds: { ...input.bounds, w: input.bounds.w + 1 + seed * 3 } };
      expect(grid(wider).status, `seed ${seed}`).toBe('fit');
    });
  });

  const units = { mode: 'uniform' as const, gap: 4, minCell: 12, maxCell: 44 };

  it('orders cells down a column, then the next, like the units scene', () => {
    const result = grid({ ...units, count: 12, columns: 4, bounds: { w: 1600, h: 600 } });
    const cell = result.cell + 4;
    result.placed.forEach((p, i) => {
      expect([p.x / cell, p.y / cell]).toEqual([Math.floor(i / 3), i % 3]);
    });
  });

  it('keeps 21 columns for 200 cells, the ragged edge on the last row', () => {
    const result = grid({ ...units, count: 200, columns: 21, bounds: { w: 1600, h: 600 } });
    expect(result).toMatchObject({ columns: 21, rows: 10, status: 'fit' });
    expect(result.placed.filter((p) => p.y === 9 * (result.cell + 4))).toHaveLength(11);
  });

  it('picks a landscape shape for 400 cells, with the cells as big as the box allows', () => {
    const result = grid({ ...units, count: 400, columns: 'auto', bounds: { w: 1600, h: 340 } });
    expect(result.status).toBe('fit');
    expect(result.columns).toBeGreaterThan(result.rows);
    expect(result.placed).toHaveLength(400);
    expect(result.placed[399].key).toBe('399');
  });

  it('chooses the shape nearest the aspect among cells capped at maxCell', () => {
    const result = grid({ ...units, count: 100, columns: 'auto', bounds: { w: 1600, h: 1600 } });
    expect(result.cell).toBe(44);
    expect(result.columns / result.rows).toBeCloseTo(2.2, 0);
  });

  it('says why cells under minCell are unresolved, and still draws them at minCell', () => {
    const result = grid({ ...units, count: 400, columns: 40, bounds: { w: 300, h: 300 } });
    expect(result.status).toBe('unresolved');
    expect(result.reasons[0]).toMatch(/under the 12 a unit reads at/);
    expect(result.cell).toBe(12);
  });

  it('places nothing for no cell', () => {
    const result = grid({ ...units, count: 0, columns: 'auto', bounds: { w: 100, h: 100 } });
    expect(result).toMatchObject({ placed: [], status: 'fit', rows: 0, cell: 0 });
  });
});

describe('grid table', () => {
  it('is deterministic, finite, and inside its bounds without overlap when it fits', () => {
    forCases(randomTable, (input, seed) => {
      const result = grid(input);
      expect(result, `seed ${seed}`).toEqual(grid(randomTable(mulberry32(seed))));
      expect(allFinite(result)).toBe(true);
      if (result.status !== 'fit') return;
      expect(inBounds(result, input.bounds), `seed ${seed}`).toBe(true);
      expect(noOverlap(result.placed), `seed ${seed}`).toBe(true);
    });
  });

  it('never goes from fit to unresolved when the bounds get wider', () => {
    forCases(randomTable, (input, seed) => {
      if (grid(input).status !== 'fit') return;
      const wider = { ...input, bounds: { ...input.bounds, w: input.bounds.w + 1 + seed * 3 } };
      expect(grid(wider).status, `seed ${seed}`).toBe('fit');
    });
  });

  it('sizes a label to its widest, a fixed tag to its number, the fill track to the rest', () => {
    const row = (label: number) => [
      textBlock('label', 60, label, 30),
      textBlock('bar', 50, 100, 20),
      textBlock('tag', 40, 60, 30),
    ];
    const result = grid({
      mode: 'table',
      rows: [row(120), row(180)],
      tracks: ['auto', 'fill', 80],
      bounds: { w: 1000, h: 400 },
      gap: { w: 20, h: 10 },
    });
    expect(result.tracks).toEqual([180, 700, 80]);
    expect(result.placed.find((p) => p.key === '1,2')).toMatchObject({ x: 920, y: 40, w: 80 });
    expect(result.size).toEqual({ w: 1000, h: 70 });
  });
});
