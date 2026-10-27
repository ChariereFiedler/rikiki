import { describe, expect, it } from 'vitest';
import { MAX_RING_NODES, MIN_RING_NODES, type RingInput, type RingResult, ring } from './ring.js';
import type { Placed, Point, Size } from './types.js';

/** A seeded generator · the same cases on every run, so a failure is replayed. */
function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CASES = 400;
const TOLERANCE = 1e-6;
const ROOMY: Size = { w: 1e6, h: 1e6 };

const between = (rand: () => number, min: number, max: number) => min + rand() * (max - min);
const whole = (rand: () => number, min: number, max: number) =>
  Math.floor(between(rand, min, max + 1));

function randomInput(rand: () => number): RingInput {
  const count = whole(rand, MIN_RING_NODES, MAX_RING_NODES);
  const nodes = Array.from({ length: count }, (_, i) => ({
    key: `n${i}`,
    w: between(rand, 20, 320),
    h: between(rand, 20, 160),
  }));
  const centre =
    rand() < 0.5 ? { w: between(rand, 10, 400), h: between(rand, 10, 200) } : undefined;
  const bounds = rand() < 0.7 ? ROOMY : { w: between(rand, 200, 1600), h: between(rand, 200, 900) };
  return { nodes, bounds, gap: between(rand, 0, 40), closed: rand() < 0.5, centre };
}

function forEachCase(seed: number, check: (input: RingInput, result: RingResult) => void) {
  const rand = mulberry32(seed);
  for (let i = 0; i < CASES; i++) {
    const input = randomInput(rand);
    check(input, ring(input));
  }
}

const middle = (box: Placed): Point => ({ x: box.x + box.w / 2, y: box.y + box.h / 2 });

/** Two boxes at least `gap` apart on one axis or the other. */
function apart(a: Placed, b: Placed, gap: number): boolean {
  const ma = middle(a);
  const mb = middle(b);
  const clearX = Math.abs(ma.x - mb.x) - (a.w + b.w) / 2;
  const clearY = Math.abs(ma.y - mb.y) - (a.h + b.h) / 2;
  return Math.max(clearX, clearY) >= gap - TOLERANCE;
}

const strictlyInside = (p: Point, box: Placed, margin: number) =>
  p.x > box.x + margin &&
  p.x < box.x + box.w - margin &&
  p.y > box.y + margin &&
  p.y < box.y + box.h - margin;

const onEdge = (p: Point, box: Placed) =>
  !strictlyInside(p, box, TOLERANCE) && strictlyInside(p, box, -TOLERANCE);

/** Whether a polyline enters a box · each segment sampled finely. */
function enters(points: Point[], box: Placed): boolean {
  const SAMPLES = 16;
  return points.some((p, i) => {
    if (i === 0) return false;
    const q = points[i - 1];
    return Array.from({ length: SAMPLES + 1 }, (_, s) => s / SAMPLES).some((t) =>
      strictlyInside({ x: q.x + (p.x - q.x) * t, y: q.y + (p.y - q.y) * t }, box, TOLERANCE),
    );
  });
}

const node = (key: string, w = 120, h = 60) => ({ key, w, h });
const nodes = (count: number, w?: number, h?: number) =>
  Array.from({ length: count }, (_, i) => node(`n${i}`, w, h));

describe('ring · properties', () => {
  it('is deterministic', () => {
    forEachCase(1, (input, result) => {
      expect(ring(structuredClone(input))).toEqual(result);
    });
  });

  it('keeps the order and spaces the nodes at equal angles, clockwise from the top', () => {
    forEachCase(2, (input, result) => {
      const n = input.nodes.length;
      expect(result.placed.map((p) => p.key)).toEqual(input.nodes.map((p) => p.key));
      const angles = result.placed.map((box) => {
        const m = middle(box);
        return Math.atan2(m.y - result.centre.y, m.x - result.centre.x);
      });
      expect(angles[0]).toBeCloseTo(-Math.PI / 2, 6);
      angles.forEach((angle, i) => {
        const turn = angle - angles[0];
        const expected = (i * 2 * Math.PI) / n;
        // y grows downwards · a growing angle turns clockwise on the slide.
        const wrapped = ((turn - expected + 3 * Math.PI) % (2 * Math.PI)) - Math.PI;
        expect(Math.abs(wrapped)).toBeLessThan(TOLERANCE);
      });
    });
  });

  it('keeps every two boxes `gap` apart', () => {
    forEachCase(3, (input, result) => {
      result.placed.forEach((a, i) => {
        for (const b of result.placed.slice(i + 1)) expect(apart(a, b, input.gap)).toBe(true);
      });
    });
  });

  it('keeps the reserved centre free of every box', () => {
    forEachCase(4, (input, result) => {
      if (!input.centre) return;
      const { w, h } = input.centre;
      const zone = { key: 'centre', x: result.centre.x - w / 2, y: result.centre.y - h / 2, w, h };
      for (const box of result.placed) expect(apart(box, zone, input.gap)).toBe(true);
      expect(result.centre.free.w).toBeGreaterThanOrEqual(w - TOLERANCE);
      expect(result.centre.free.h).toBeGreaterThanOrEqual(h - TOLERANCE);
    });
  });

  it('puts everything inside the bounds when it fits, and says why when not', () => {
    forEachCase(5, (input, result) => {
      if (result.status === 'unresolved') {
        expect(result.reasons.length).toBeGreaterThan(0);
        return;
      }
      expect(result.reasons).toEqual([]);
      for (const box of result.placed) {
        expect(box.x).toBeGreaterThanOrEqual(-TOLERANCE);
        expect(box.y).toBeGreaterThanOrEqual(-TOLERANCE);
        expect(box.x + box.w).toBeLessThanOrEqual(input.bounds.w + TOLERANCE);
        expect(box.y + box.h).toBeLessThanOrEqual(input.bounds.h + TOLERANCE);
      }
      for (const p of result.routes.flatMap((r) => r.points)) {
        expect(p.x).toBeGreaterThanOrEqual(-TOLERANCE);
        expect(p.y).toBeGreaterThanOrEqual(-TOLERANCE);
        expect(p.x).toBeLessThanOrEqual(input.bounds.w + TOLERANCE);
        expect(p.y).toBeLessThanOrEqual(input.bounds.h + TOLERANCE);
      }
      expect(result.size.w).toBeLessThanOrEqual(input.bounds.w);
      expect(result.size.h).toBeLessThanOrEqual(input.bounds.h);
    });
  });

  it('never shrinks the radius when the nodes grow', () => {
    const rand = mulberry32(6);
    for (let i = 0; i < CASES; i++) {
      const input = randomInput(rand);
      const factor = between(rand, 1, 3);
      const grown = input.nodes.map((n) => ({ ...n, w: n.w * factor, h: n.h * factor }));
      const before = ring(input).centre.r;
      expect(ring({ ...input, nodes: grown }).centre.r).toBeGreaterThanOrEqual(before - TOLERANCE);
    }
  });

  it('routes each link along the arc, edge to edge, through no other box', () => {
    forEachCase(7, (input, result) => {
      const n = input.nodes.length;
      expect(result.routes).toHaveLength(input.closed ? n : n - 1);
      const byKey = new Map(result.placed.map((box) => [box.key, box]));
      for (const route of result.routes) {
        expect(route.points.length).toBeGreaterThanOrEqual(8);
        expect(onEdge(route.points[0], byKey.get(route.from)!)).toBe(true);
        expect(onEdge(route.points.at(-1)!, byKey.get(route.to)!)).toBe(true);
        for (const p of route.points) {
          const distance = Math.hypot(p.x - result.centre.x, p.y - result.centre.y);
          expect(distance).toBeCloseTo(result.centre.r, 6);
        }
        const third = result.placed.filter((b) => b.key !== route.from && b.key !== route.to);
        for (const box of third) expect(enters(route.points, box)).toBe(false);
      }
    });
  });

  it('returns finite, non-negative numbers everywhere', () => {
    forEachCase(8, (_input, result) => {
      const numbers = [
        ...result.placed.flatMap((p) => [p.x, p.y, p.w, p.h]),
        ...result.routes.flatMap((r) => r.points.flatMap((p) => [p.x, p.y])),
        result.size.w,
        result.size.h,
        result.centre.x,
        result.centre.y,
        result.centre.r,
        result.centre.free.w,
        result.centre.free.h,
      ];
      for (const value of numbers) {
        expect(Number.isFinite(value)).toBe(true);
        expect(value).toBeGreaterThanOrEqual(-TOLERANCE);
      }
    });
  });
});

describe('ring · cases', () => {
  it.each([MIN_RING_NODES, MAX_RING_NODES])('fits %i nodes in roomy bounds', (count) => {
    const result = ring({ nodes: nodes(count), bounds: ROOMY, gap: 16, closed: true });
    expect(result.status).toBe('fit');
    expect(result.placed).toHaveLength(count);
    expect(result.routes).toHaveLength(count);
  });

  it.each([
    1,
    MAX_RING_NODES + 1,
  ])('places %i nodes anyway, and says the count is out of range', (count) => {
    const result = ring({ nodes: nodes(count), bounds: ROOMY, gap: 16, closed: true });
    expect(result.status).toBe('unresolved');
    expect(result.placed).toHaveLength(count);
    expect(result.reasons.join(' ')).toMatch(/3 to 8 nodes, got/);
  });

  it('places a single node at the top with no link to itself', () => {
    const result = ring({ nodes: nodes(1), bounds: ROOMY, gap: 16, closed: true });
    expect(result.routes).toEqual([]);
    expect(result.placed[0]).toMatchObject({ x: 0, y: 0, w: 120, h: 60 });
  });

  it('places nothing for no nodes, keeps the centre, and says why', () => {
    const result = ring({ nodes: [], bounds: ROOMY, gap: 16, centre: { w: 100, h: 40 } });
    expect(result.placed).toEqual([]);
    expect(result.size).toEqual({ w: 100, h: 40 });
    expect(result.status).toBe('unresolved');
  });

  it('grows the radius to keep a large centre free', () => {
    const bare = ring({ nodes: nodes(4), bounds: ROOMY, gap: 16 });
    const reserved = ring({ nodes: nodes(4), bounds: ROOMY, gap: 16, centre: { w: 600, h: 300 } });
    expect(reserved.centre.r).toBeGreaterThan(bare.centre.r);
  });

  it('gives the radius it needs when the bounds are too small', () => {
    const result = ring({ nodes: nodes(6), bounds: { w: 200, h: 200 }, gap: 16 });
    expect(result.status).toBe('unresolved');
    expect(result.reasons.join(' ')).toMatch(/needs radius \d/);
    expect(result.placed).toHaveLength(6);
    expect(result.placed.every((p) => p.w === 120 && p.h === 60)).toBe(true);
  });

  it('links the last node to the first only when closed', () => {
    const open = ring({ nodes: nodes(5), bounds: ROOMY, gap: 16 });
    expect(open.routes.map((r) => `${r.from}-${r.to}`)).toEqual([
      'n0-n1',
      'n1-n2',
      'n2-n3',
      'n3-n4',
    ]);
    const closed = ring({ nodes: nodes(5), bounds: ROOMY, gap: 16, closed: true });
    expect(closed.routes.at(-1)).toMatchObject({ from: 'n4', to: 'n0' });
  });
});
