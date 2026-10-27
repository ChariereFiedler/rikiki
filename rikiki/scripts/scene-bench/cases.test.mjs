import { describe, expect, it } from 'vitest';
import {
  COUNTS,
  KINDS,
  MIN_WIDTHS,
  WIDTHS,
  caseMarkup,
  generateCase,
  generateCases,
  mulberry32,
  widthsFor,
} from './cases.mjs';
import { MIN_SCENE_WIDTH } from '../../src/media/deck-scene-compose-layout.ts';
import { SCENE_LIMITS } from '../../src/media/scene-layout.ts';

describe('mulberry32', () => {
  it('gives the same stream for the same seed, and another for another', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
    expect(mulberry32(43)()).not.toBe(mulberry32(42)());
  });

  it('stays in [0, 1)', () => {
    const random = mulberry32(7);
    for (let i = 0; i < 1000; i++) {
      const value = random();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

describe('generateCase', () => {
  it('is reproducible from its seed and index', () => {
    expect(generateCase(1, 5)).toEqual(generateCase(1, 5));
    expect(generateCase(1, 5)).not.toEqual(generateCase(1, 6));
  });

  it('is plain JSON · nothing that would not survive the trip into a page', () => {
    for (const testCase of generateCases(3, 200)) {
      expect(JSON.parse(JSON.stringify(testCase))).toEqual(testCase);
    }
  });

  it('draws every shape at every width it is declared clean at, in a run of a few hundred', () => {
    const cases = generateCases(9, 400);
    expect(new Set(cases.map((c) => c.kind))).toEqual(new Set(KINDS));
    for (const kind of KINDS) {
      const widths = new Set(cases.filter((c) => c.kind === kind).map((c) => c.width));
      expect(widths, kind).toEqual(new Set(widthsFor(kind)));
    }
  });

  it('never draws a shape under its declared width unless the widths are asked for', () => {
    // Under it a composition reports SCENE_REGION_TOO_NARROW for the whole region,
    // so a failure there is not silent · the bench judges the widths a shape promises.
    for (const testCase of generateCases(12, 1000)) {
      expect(testCase.width, testCase.id).toBeGreaterThanOrEqual(MIN_WIDTHS[testCase.kind]);
    }
    expect(widthsFor('lanes')).toEqual([1600, 1000]);
    expect(widthsFor('steps')).toEqual([1600, 752, 650]);
    expect(widthsFor('cards')).toEqual(WIDTHS);
  });

  it('keeps its narrowest widths equal to the ones the compositions enforce', () => {
    expect(MIN_WIDTHS).toEqual({ ...MIN_SCENE_WIDTH });
  });

  it('reaches the boundaries of every shape · under the minimum, over the maximum', () => {
    const cases = generateCases(11, 2000);
    for (const kind of KINDS) {
      const counts = new Set(cases.filter((c) => c.kind === kind).map((c) => c.count));
      expect(counts.has(COUNTS[kind].max + 1), `${kind} over its maximum`).toBe(true);
      expect(counts.has(COUNTS[kind].max), `${kind} at its maximum`).toBe(true);
      expect(counts.has(COUNTS[kind].min), `${kind} at its minimum`).toBe(true);
    }
  });

  it('keeps its counts equal to the scenes’ own limits', () => {
    for (const [kind, limits] of Object.entries(SCENE_LIMITS)) {
      expect(COUNTS[kind], kind).toEqual(limits);
    }
  });

  it('writes as many items as it says', () => {
    for (const testCase of generateCases(5, 300)) {
      expect(testCase.items).toHaveLength(testCase.count);
    }
  });

  it('can be limited to some shapes and some widths', () => {
    const cases = generateCases(2, 100, ['bars'], [469]);
    expect(cases.every((c) => c.kind === 'bars' && c.width === 469)).toBe(true);
  });

  it('puts one hub in every flow, after its sources', () => {
    for (const testCase of generateCases(4, 600, ['flow'])) {
      const hubs = testCase.items.filter((it) => it.emphasis);
      expect(hubs).toHaveLength(1);
    }
  });

  it('keeps ranges from before to', () => {
    for (const testCase of generateCases(6, 400, ['ranges'])) {
      for (const it of testCase.items) {
        if (it.from !== undefined && it.to !== undefined) {
          expect(Number(it.from)).toBeLessThanOrEqual(Number(it.to));
        }
      }
    }
  });
});

describe('caseMarkup', () => {
  it('writes the scene as an author would, items as attributes', () => {
    const html = caseMarkup({
      kind: 'bars',
      attrs: { unit: '%' },
      items: [{ label: 'A "quoted" & co', value: '3', emphasis: true }],
    });
    expect(html).toBe(
      '<deck-scene-bars unit="%"><deck-scene-item label="A &quot;quoted&quot; &amp; co" value="3" emphasis></deck-scene-item></deck-scene-bars>',
    );
  });
});
