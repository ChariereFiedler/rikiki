import { describe, expect, it } from 'vitest';
import { arrange, edgeGeometry, parsePoint } from './graph-layout.js';

describe('parsePoint', () => {
  it('reads a percentage pair', () => {
    expect(parsePoint('10,50')).toEqual({ x: 10, y: 50 });
  });

  it('tolerates spacing and decimals', () => {
    expect(parsePoint(' 12.5 , 33 ')).toEqual({ x: 12.5, y: 33 });
  });

  it('clamps a point outside the drawing area', () => {
    expect(parsePoint('150,-20')).toEqual({ x: 100, y: 0 });
  });

  it('returns null rather than pinning an unreadable point to a corner', () => {
    expect(parsePoint('abc,10')).toBeNull();
    expect(parsePoint('10')).toBeNull();
    expect(parsePoint(',')).toBeNull();
    expect(parsePoint('')).toBeNull();
    expect(parsePoint(null)).toBeNull();
  });
});

describe('arrange · free', () => {
  it('honours what the author wrote', () => {
    expect(arrange(['10,20', '80,60'])).toEqual([
      { x: 10, y: 20 },
      { x: 80, y: 60 },
    ]);
  });

  it('centres a node with no position instead of stacking it at 0,0', () => {
    expect(arrange([null])).toEqual([{ x: 50, y: 50 }]);
  });
});

describe('arrange · row and column', () => {
  it('spaces the nodes evenly across a row', () => {
    const points = arrange([null, null, null], 'row');
    expect(points.map((p) => p.x)).toEqual([12, 50, 88]);
    expect(points.every((p) => p.y === 50)).toBe(true);
  });

  it('does the same down a column', () => {
    const points = arrange([null, null, null], 'column');
    expect(points.map((p) => p.y)).toEqual([12, 50, 88]);
    expect(points.every((p) => p.x === 50)).toBe(true);
  });

  it('centres a single node', () => {
    expect(arrange([null], 'row')).toEqual([{ x: 50, y: 50 }]);
  });

  it('keeps the ends off the edge, where a label would be cut', () => {
    const points = arrange([null, null], 'row');
    expect(points[0]!.x).toBeGreaterThan(0);
    expect(points[1]!.x).toBeLessThan(100);
  });

  it('ignores an authored position under a canned arrangement', () => {
    // Otherwise a stale `at` from an earlier edit fights the layout silently.
    expect(arrange(['0,0', '0,0'], 'row').map((p) => p.x)).toEqual([12, 88]);
  });

  it('handles an empty graph', () => {
    expect(arrange([], 'row')).toEqual([]);
  });
});

describe('edgeGeometry', () => {
  it('shortens the segment at both ends so it does not strike the labels', () => {
    const g = edgeGeometry({ x: 0, y: 0 }, { x: 100, y: 0 });
    expect(g.x1).toBeCloseTo(6);
    expect(g.x2).toBeCloseTo(94);
  });

  it('puts the label at the midpoint of the FULL edge, not the trimmed one', () => {
    const g = edgeGeometry({ x: 0, y: 0 }, { x: 100, y: 50 });
    expect(g.mx).toBe(50);
    expect(g.my).toBe(25);
  });

  it('never eats more than a third of a short edge', () => {
    const g = edgeGeometry({ x: 50, y: 50 }, { x: 56, y: 50 });
    expect(g.x2 - g.x1, 'a line remains').toBeGreaterThan(0);
  });

  it('does not divide by zero on two nodes at the same point', () => {
    const g = edgeGeometry({ x: 50, y: 50 }, { x: 50, y: 50 });
    expect(Number.isFinite(g.x1) && Number.isFinite(g.y2)).toBe(true);
  });

  it('works on a diagonal', () => {
    const g = edgeGeometry({ x: 0, y: 0 }, { x: 100, y: 100 });
    expect(g.x1).toBeCloseTo(g.y1);
    expect(g.x2).toBeCloseTo(g.y2);
  });
});
