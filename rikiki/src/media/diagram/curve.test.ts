import { describe, expect, it } from 'vitest';
import { CURVE_INSET, CURVE_PLOT_HEIGHT, crossingOf, curve, niceMax } from './curve.js';

const words = { label: { w: 240, h: 38 }, figure: { w: 140, h: 64 } };

describe('niceMax', () => {
  it('rounds the top of a scale up to 1, 2, 2.5 or 5 of a power of ten', () => {
    expect(niceMax(0.8)).toBe(1);
    expect(niceMax(17)).toBe(20);
    expect(niceMax(23)).toBe(25);
    expect(niceMax(38)).toBe(50);
    expect(niceMax(52)).toBe(100);
    expect(niceMax(100)).toBe(100);
    expect(niceMax(1800)).toBe(2000);
  });

  it('gives a scale of one when there is nothing to hold', () => {
    expect(niceMax(0)).toBe(1);
    expect(niceMax(Number.NaN)).toBe(1);
  });
});

describe('curve', () => {
  it('sets the values at equal steps, a dot in from each edge, on an exact scale from zero', () => {
    const placed = curve({ width: 900, ...words, values: [0, 50, 100], max: 100, ticks: [] });
    const { plot } = placed;
    expect(placed.points.map((p) => p.x)).toEqual([CURVE_INSET, 450, 900 - CURVE_INSET]);
    expect(placed.points[0]!.y).toBe(plot.y + plot.h);
    expect(placed.points[1]!.y).toBe(plot.y + plot.h / 2);
    expect(placed.points[2]!.y).toBe(plot.y);
    expect(plot.h).toBe(CURVE_PLOT_HEIGHT);
  });

  it('puts the label at the left and the figure flush right, on one baseline', () => {
    const placed = curve({ width: 900, ...words, values: [1, 2], max: 2, ticks: [] });
    expect(placed.label.x).toBe(0);
    expect(placed.figure.x).toBe(900 - 140);
    expect(placed.label.y + words.label.h).toBe(placed.figure.y + words.figure.h);
    expect(placed.plot.y).toBeGreaterThan(placed.figure.y + words.figure.h);
  });

  it('finds where the curve crosses its threshold on the straight segment, not at a point', () => {
    const placed = curve({
      width: 300,
      ...words,
      values: [100, 200, 600],
      max: 800,
      threshold: 400,
      ticks: [],
    });
    expect(placed.crossing?.index).toBe(2);
    // Half way from 200 to 600, between the second point and the third · and the
    // crossing stands on the threshold's line.
    const [, second, third] = placed.points;
    expect(placed.crossing?.at.x).toBeCloseTo((second!.x + third!.x) / 2);
    expect(placed.crossing?.at.y).toBeCloseTo(placed.threshold!);
  });

  it('says no crossing when the curve stays on one side of its line', () => {
    const placed = curve({
      width: 300,
      ...words,
      values: [1, 2, 3],
      max: 10,
      threshold: 5,
      ticks: [],
    });
    expect(placed.threshold).toBeDefined();
    expect(placed.crossing).toBeUndefined();
    expect(crossingOf(placed.points, [1, 2, 3], 5)).toBeNull();
  });

  it('finds the crossing on the line as drawn when a value is past its scale', () => {
    const placed = curve({
      width: 300,
      ...words,
      values: [102, 13],
      max: 100,
      threshold: 48,
      ticks: [],
    });
    expect(placed.points[0]!.y).toBe(placed.plot.y);
    expect(placed.crossing!.at.y).toBeCloseTo(placed.threshold!);
  });

  it('crosses downwards as well as upwards', () => {
    const points = [
      { x: 0, y: 0 },
      { x: 100, y: 100 },
    ];
    expect(crossingOf(points, [80, 20], 50)?.at).toEqual({ x: 50, y: 50 });
  });

  it('puts a word under each value, centred, or the first and the last flush to the edges', () => {
    const tick = { w: 60, h: 30 };
    const each = curve({
      width: 600,
      ...words,
      values: [1, 2, 3],
      max: 3,
      ticks: [tick, tick, tick],
    });
    expect(each.ticks.map((t) => t.x)).toEqual([0, 270, 540]);
    const ends = curve({ width: 600, ...words, values: [1, 2, 3, 4], max: 4, ticks: [tick, tick] });
    expect(ends.ticks.map((t) => t.x)).toEqual([0, 540]);
    expect(ends.ticks[0]!.y).toBeGreaterThan(ends.plot.y + ends.plot.h);
    expect(ends.size.h).toBe(ends.ticks[0]!.y + 30);
  });

  it('is only a plot when it has no words', () => {
    const placed = curve({
      width: 500,
      label: { w: 0, h: 0 },
      figure: { w: 0, h: 0 },
      values: [1, 2],
      max: 2,
      ticks: [],
    });
    expect(placed.plot.y).toBe(0);
    expect(placed.size).toEqual({ w: 500, h: CURVE_PLOT_HEIGHT });
  });
});
