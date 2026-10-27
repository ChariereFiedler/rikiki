import { describe, expect, it } from 'vitest';
import {
  type AxisInput,
  type AxisItem,
  type AxisResult,
  axis,
  INFO_PREFIX,
  SHARED_TRACK,
} from './axis.js';
import type { Placed } from './types.js';

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
const ROOMY = { w: 1e6, h: 1e6 };

const between = (rand: () => number, min: number, max: number) => min + rand() * (max - min);
const whole = (rand: () => number, min: number, max: number) =>
  Math.floor(between(rand, min, max + 1));

/** A value in the domain, now and then past one of its ends when `strays`. */
function randomValue(rand: () => number, [low, high]: [number, number], strays: boolean) {
  const span = high - low;
  return strays && rand() < 0.15
    ? between(rand, low - span, high + span)
    : between(rand, low, high);
}

function randomItem(rand: () => number, i: number, domain: [number, number], strays: boolean) {
  const label = { key: `i${i}`, w: between(rand, 20, 220), h: between(rand, 14, 60) };
  const kind = rand();
  if (kind < 0.45) {
    return {
      ...label,
      from: randomValue(rand, domain, strays),
      to: randomValue(rand, domain, strays),
    };
  }
  if (kind < 0.9) return { ...label, at: randomValue(rand, domain, strays) };
  return label;
}

function randomInput(rand: () => number, strays = true): AxisInput {
  const low = between(rand, -500, 500);
  const domain: [number, number] = [low, low + between(rand, 1, 1000)];
  const count = whole(rand, 0, 10);
  return {
    items: Array.from({ length: count }, (_, i) => randomItem(rand, i, domain, strays)),
    domain,
    length: between(rand, 200, 1400),
    orientation: rand() < 0.5 ? 'horizontal' : 'vertical',
    bounds: rand() < 0.6 ? ROOMY : { w: between(rand, 300, 1600), h: between(rand, 200, 900) },
    labelGap: between(rand, 0, 24),
    trackThickness: between(rand, 4, 40),
    lane: rand() < 0.5 ? 'own' : 'shared',
  };
}

function forEachCase(seed: number, check: (input: AxisInput, result: AxisResult) => void) {
  const rand = mulberry32(seed);
  for (let i = 0; i < CASES; i++) {
    const input = randomInput(rand);
    check(input, axis(input));
  }
}

const overlap = (a: Placed, b: Placed) =>
  a.x < b.x + b.w - TOLERANCE &&
  b.x < a.x + a.w - TOLERANCE &&
  a.y < b.y + b.h - TOLERANCE &&
  b.y < a.y + a.h - TOLERANCE;

const isInterval = (item: AxisItem) => item.from !== undefined && item.to !== undefined;
const isPoint = (item: AxisItem) => item.at !== undefined && !isInterval(item);
const markOf = (result: AxisResult, key: string) => result.marks.find((m) => m.key === key)!;

const base: Omit<AxisInput, 'items'> = {
  domain: [0, 100],
  length: 1000,
  orientation: 'horizontal',
  bounds: ROOMY,
  labelGap: 10,
  trackThickness: 20,
};

describe('axis · properties', () => {
  it('is deterministic', () => {
    forEachCase(1, (input, result) => {
      expect(axis(structuredClone(input))).toEqual(result);
    });
  });

  // Within a kind of mark · a point is centred on its value, so it starts half a
  // track before it, while an interval starts on its lowest value.
  it('keeps the order of the values along the axis', () => {
    const rand = mulberry32(2);
    const lowest = (item: AxisItem) => item.at ?? Math.min(item.from!, item.to!);
    for (let i = 0; i < CASES; i++) {
      const input = randomInput(rand, false);
      const result = axis(input);
      for (const kind of [isPoint, isInterval]) {
        const valued = input.items.filter(kind);
        for (const a of valued) {
          for (const b of valued.filter((other) => lowest(a) < lowest(other))) {
            expect(markOf(result, a.key).start).toBeLessThanOrEqual(
              markOf(result, b.key).start + TOLERANCE,
            );
          }
        }
      }
    }
  });

  it('draws every interval inside [0, length], the right way round', () => {
    forEachCase(3, (input, result) => {
      for (const item of input.items.filter(isInterval)) {
        const mark = markOf(result, item.key);
        expect(mark.start).toBeGreaterThanOrEqual(0);
        expect(mark.end).toBeLessThanOrEqual(input.length + TOLERANCE);
        expect(mark.start).toBeLessThanOrEqual(mark.end);
      }
    });
  });

  it('draws a point at least `trackThickness` wide', () => {
    forEachCase(4, (input, result) => {
      for (const item of input.items.filter(isPoint)) {
        const mark = markOf(result, item.key);
        expect(mark.end - mark.start).toBeGreaterThanOrEqual(input.trackThickness - TOLERANCE);
      }
    });
  });

  it('never lets two labels overlap, and keeps their size', () => {
    forEachCase(5, (input, result) => {
      expect(result.labels.map((l) => l.key)).toEqual(input.items.map((item) => item.key));
      result.labels.forEach((label, i) => {
        expect(label.w).toBe(input.items[i].w);
        expect(label.h).toBe(input.items[i].h);
        for (const other of result.labels.slice(i + 1)) expect(overlap(label, other)).toBe(false);
      });
    });
  });

  it('clamps a value outside the domain to the edge and says so', () => {
    forEachCase(6, (input, result) => {
      const [low, high] = input.domain;
      for (const item of input.items) {
        const values = [item.from, item.to, item.at].filter((v) => v !== undefined);
        if (!values.some((v) => v < low || v > high)) continue;
        expect(result.status).toBe('unresolved');
        expect(result.reasons.some((r) => r.startsWith(`${item.key}:`))).toBe(true);
      }
      for (const mark of result.marks) {
        expect(mark.start).toBeGreaterThanOrEqual(0);
        expect(mark.end).toBeLessThanOrEqual(
          Math.max(input.length, input.trackThickness) + TOLERANCE,
        );
      }
    });
  });

  it('puts everything inside the bounds when it fits, and says why when not', () => {
    forEachCase(7, (input, result) => {
      const blocking = result.reasons.filter((r) => !r.startsWith(INFO_PREFIX));
      expect(result.status === 'fit').toBe(blocking.length === 0);
      if (result.status !== 'fit') return;
      for (const box of [...result.labels, ...result.placed]) {
        expect(box.x).toBeGreaterThanOrEqual(-TOLERANCE);
        expect(box.y).toBeGreaterThanOrEqual(-TOLERANCE);
        expect(box.x + box.w).toBeLessThanOrEqual(input.bounds.w + TOLERANCE);
        expect(box.y + box.h).toBeLessThanOrEqual(input.bounds.h + TOLERANCE);
      }
    });
  });

  it('stacks one track per item in order, or one for all when shared', () => {
    forEachCase(8, (input, result) => {
      if (input.lane === 'shared') {
        expect(result.tracks.map((t) => t.key)).toEqual(input.items.length ? [SHARED_TRACK] : []);
        return;
      }
      expect(result.tracks.map((t) => t.key)).toEqual(input.items.map((item) => item.key));
      result.tracks.forEach((track, i) => {
        if (i > 0) expect(track.start).toBeGreaterThan(result.tracks[i - 1].end);
      });
    });
  });

  it('returns finite, non-negative numbers everywhere', () => {
    forEachCase(9, (_input, result) => {
      const numbers = [
        ...[...result.placed, ...result.labels].flatMap((p) => [p.x, p.y, p.w, p.h]),
        ...[...result.marks, ...result.tracks].flatMap((s) => [s.start, s.end]),
        result.size.w,
        result.size.h,
      ];
      for (const value of numbers) {
        expect(Number.isFinite(value)).toBe(true);
        expect(value).toBeGreaterThanOrEqual(0);
      }
    });
  });
});

describe('axis · cases', () => {
  it('places nothing for no items', () => {
    const result = axis({ ...base, items: [] });
    expect(result).toMatchObject({ placed: [], labels: [], marks: [], tracks: [], status: 'fit' });
    expect(result.size).toEqual({ w: 1000, h: 0 });
  });

  it('draws one interval with its label above the track', () => {
    const result = axis({ ...base, items: [{ key: 'a', from: 20, to: 60, w: 100, h: 30 }] });
    expect(result.marks).toEqual([{ key: 'a', start: 200, end: 600 }]);
    expect(result.labels).toEqual([{ key: 'a', x: 350, y: 0, w: 100, h: 30 }]);
    expect(result.tracks).toEqual([{ key: 'a', start: 40, end: 60 }]);
    expect(result.size).toEqual({ w: 1000, h: 60 });
    expect(result.status).toBe('fit');
  });

  it('places every value in the middle of a single-value domain, with no NaN', () => {
    const result = axis({
      ...base,
      domain: [5, 5],
      items: [
        { key: 'a', at: 5, w: 40, h: 20 },
        { key: 'b', from: 5, to: 5, w: 40, h: 20 },
      ],
    });
    expect(result.marks).toEqual([
      { key: 'a', start: 490, end: 510 },
      { key: 'b', start: 500, end: 500 },
    ]);
    expect(JSON.stringify(result)).not.toMatch(/null|NaN/);
  });

  it('puts colliding labels near side, far side, then one row further', () => {
    const items = ['a', 'b', 'c'].map((key) => ({ key, at: 50, w: 100, h: 30 }));
    const result = axis({ ...base, lane: 'shared', items });
    const track = result.tracks[0];
    const [a, b, c] = result.labels;
    expect(a.y + a.h).toBe(track.start - base.labelGap);
    expect(b.y).toBe(track.end + base.labelGap);
    expect(c.y + c.h).toBe(a.y - base.labelGap);
  });

  it('keeps labels that do not collide in the same row', () => {
    const items = [
      { key: 'a', at: 10, w: 100, h: 30 },
      { key: 'b', at: 90, w: 100, h: 30 },
    ];
    const result = axis({ ...base, lane: 'shared', items });
    expect(result.labels[0].y).toBe(result.labels[1].y);
  });

  it('clamps a value past the domain and names the item', () => {
    const result = axis({ ...base, items: [{ key: 'late', at: 140, w: 60, h: 20 }] });
    expect(result.marks[0]).toEqual({ key: 'late', start: 980, end: 1000 });
    expect(result.status).toBe('unresolved');
    expect(result.reasons[0]).toMatch(/^late: 140 is outside the domain \[0, 100\]/);
  });

  it('draws an item with no value as its label alone, with a remark', () => {
    const result = axis({ ...base, items: [{ key: 'open', w: 60, h: 20 }] });
    expect(result.marks).toEqual([]);
    expect(result.labels).toHaveLength(1);
    expect(result.status).toBe('fit');
    expect(result.reasons).toEqual([`${INFO_PREFIX}open has no value, drawn as its label alone`]);
  });

  it('turns the axis on its side when vertical', () => {
    const result = axis({
      ...base,
      orientation: 'vertical',
      items: [{ key: 'a', from: 0, to: 50, w: 80, h: 30 }],
    });
    expect(result.placed).toEqual([{ key: 'a', x: 90, y: 0, w: 20, h: 500 }]);
    expect(result.labels[0]).toMatchObject({ x: 0, w: 80, h: 30 });
    expect(result.size).toEqual({ w: 110, h: 1000 });
  });

  it('says what it needs when the bounds are too small', () => {
    const items = Array.from({ length: 6 }, (_, i) => ({ key: `i${i}`, at: 50, w: 100, h: 30 }));
    const result = axis({ ...base, bounds: { w: 1000, h: 100 }, items });
    expect(result.status).toBe('unresolved');
    expect(result.reasons.join(' ')).toMatch(/axis needs 1000×\d+/);
    expect(result.labels).toHaveLength(6);
  });
});
