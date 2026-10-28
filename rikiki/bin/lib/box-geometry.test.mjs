import { describe, expect, it } from 'vitest';
import { BOX_GEOMETRY_READER, encloses, escapeOf, mapBox, overlapOf, smallestContaining } from './box-geometry.mjs';

/** A 200x100 box at (100, 100) · the container every escapeOf case is aimed at. */
const container = { left: 100, right: 300, top: 100, bottom: 200 };

describe('escapeOf', () => {
  it('reports zero when the rect sits fully inside', () => {
    const rect = { left: 120, right: 280, top: 110, bottom: 190 };
    expect(escapeOf(rect, container)).toEqual({
      pixels: 0,
      sides: { left: 0, right: 0, top: 0, bottom: 0 },
    });
  });

  it('reports the worst side when the rect spills past several', () => {
    // 10px past the right, 30px past the bottom · the worst side wins.
    const rect = { left: 120, right: 310, top: 110, bottom: 230 };
    const result = escapeOf(rect, container);
    expect(result.pixels).toBe(30);
    expect(result.sides).toEqual({ left: 0, right: 10, top: 0, bottom: 30 });
  });

  it('never reports a negative side, even when the rect is well inside', () => {
    const rect = { left: 150, right: 160, top: 120, bottom: 130 };
    const result = escapeOf(rect, container);
    expect(Object.values(result.sides).every((v) => v >= 0)).toBe(true);
  });

  it('reports a spill on every side for a rect that surrounds its container', () => {
    const rect = { left: 50, right: 350, top: 50, bottom: 250 };
    const result = escapeOf(rect, container);
    expect(result.sides).toEqual({ left: 50, right: 50, top: 50, bottom: 50 });
    expect(result.pixels).toBe(50);
  });
});

describe('overlapOf', () => {
  it('reports the shared width and height of two intersecting rects', () => {
    const a = { left: 0, right: 100, top: 0, bottom: 100 };
    const b = { left: 50, right: 150, top: 40, bottom: 140 };
    expect(overlapOf(a, b)).toEqual({ x: 50, y: 60 });
  });

  it('reports a negative axis when the rects do not touch there', () => {
    const a = { left: 0, right: 100, top: 0, bottom: 100 };
    const b = { left: 200, right: 300, top: 0, bottom: 100 };
    expect(overlapOf(a, b).x).toBeLessThan(0);
  });

  it('reports the full extent when one rect fully contains the other', () => {
    const a = { left: 0, right: 100, top: 0, bottom: 100 };
    const b = { left: 20, right: 40, top: 20, bottom: 40 };
    expect(overlapOf(a, b)).toEqual({ x: 20, y: 20 });
  });
});

describe('encloses', () => {
  it('is true when the outer rect strictly contains the inner one', () => {
    const outer = { left: 0, right: 100, top: 0, bottom: 100 };
    const inner = { left: 10, right: 90, top: 10, bottom: 90 };
    expect(encloses(outer, inner)).toBe(true);
  });

  it('is false when the inner rect pokes out on one side', () => {
    const outer = { left: 0, right: 100, top: 0, bottom: 100 };
    const inner = { left: 10, right: 110, top: 10, bottom: 90 };
    expect(encloses(outer, inner)).toBe(false);
  });

  it('absorbs a sub-pixel rounding difference within the default tolerance', () => {
    const outer = { left: 0, right: 100, top: 0, bottom: 100 };
    const inner = { left: -0.4, right: 100.4, top: 0, bottom: 100 };
    expect(encloses(outer, inner)).toBe(true);
  });

  it('rejects a difference larger than an explicit tolerance', () => {
    const outer = { left: 0, right: 100, top: 0, bottom: 100 };
    const inner = { left: -3, right: 103, top: 0, bottom: 100 };
    expect(encloses(outer, inner, 1)).toBe(false);
  });

  it('is true for two rects that agree to the pixel', () => {
    const same = { left: 0, right: 100, top: 0, bottom: 100 };
    expect(encloses(same, { ...same })).toBe(true);
  });
});

/** A getScreenCTM()-shaped matrix · identity unless told otherwise. */
const matrix = (m = {}) => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0, ...m });

describe('mapBox', () => {
  const box = { x: 10, y: 20, width: 100, height: 30 };

  it('returns the box itself under the identity', () => {
    expect(mapBox(box, matrix())).toEqual({ left: 10, right: 110, top: 20, bottom: 50 });
  });

  it('applies a viewBox scale and a translation', () => {
    // A 1600-unit drawing painted 800px wide, 50px from the left edge.
    expect(mapBox(box, matrix({ a: 0.5, d: 0.5, e: 50, f: 0 }))).toEqual({ left: 55, right: 105, top: 10, bottom: 25 });
  });

  it('returns the rect around the quad of a rotated box', () => {
    // A quarter turn: the 100x30 box stands up as 30 wide, 100 tall.
    const rotated = mapBox({ x: 0, y: 0, width: 100, height: 30 }, matrix({ a: 0, b: 1, c: -1, d: 0 }));
    expect(rotated).toEqual({ left: -30, right: 0, top: 0, bottom: 100 });
  });
});

describe('smallestContaining', () => {
  const panel = { left: 0, right: 1000, top: 0, bottom: 500, name: 'panel' };
  const card = { left: 100, right: 300, top: 100, bottom: 200, name: 'card' };

  it('picks the tightest rect around the point, not the panel behind it', () => {
    expect(smallestContaining([panel, card], { x: 150, y: 150 })).toBe(card);
  });

  it('falls back to the larger rect when only it holds the point', () => {
    expect(smallestContaining([panel, card], { x: 600, y: 150 })).toBe(panel);
  });

  it('returns null when no rect holds the point', () => {
    expect(smallestContaining([card], { x: 600, y: 150 })).toBeNull();
  });

  it('counts a point on the edge as inside', () => {
    expect(smallestContaining([card], { x: 100, y: 200 })).toBe(card);
  });
});

describe('BOX_GEOMETRY_READER', () => {
  it('rebuilds every helper, as the browser side does', () => {
    const geometry = new Function(`return ${BOX_GEOMETRY_READER}`)();
    const a = { left: 0, right: 100, top: 0, bottom: 100 };
    const b = { left: 10, right: 90, top: 10, bottom: 90 };
    expect(geometry.escapeOf(b, a).pixels).toBe(0);
    expect(geometry.overlapOf(a, b)).toEqual({ x: 80, y: 80 });
    expect(geometry.encloses(a, b)).toBe(true);
    expect(geometry.mapBox({ x: 0, y: 0, width: 10, height: 10 }, matrix({ e: 5 }))).toEqual({ left: 5, right: 15, top: 0, bottom: 10 });
    expect(geometry.smallestContaining([a, b], { x: 50, y: 50 })).toBe(b);
  });
});
