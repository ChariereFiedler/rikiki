import { describe, expect, it } from 'vitest';
import { capacityFields, capacityOf, fitsCapacity } from './scene-capacity.js';
import { CAPACITY_WIDTHS, SCENE_CAPACITY } from './scene-capacity.data.js';
import { SCENE_LIMITS } from './scene-layout.js';

describe('the measured table', () => {
  it('covers every shape, at every width, for every count it draws', () => {
    for (const [kind, limits] of Object.entries(SCENE_LIMITS)) {
      for (const width of CAPACITY_WIDTHS) {
        const counts = Object.keys(SCENE_CAPACITY[kind]?.[width] ?? {}).map(Number);
        expect(counts, `${kind} at ${width}`).toContain(limits.max);
        expect(counts, `${kind} at ${width}`).toContain(Math.max(1, limits.min));
      }
    }
    expect(Object.keys(SCENE_CAPACITY)).toContain('flow');
  });

  it('is monotone · a wider canvas never holds less of a field', () => {
    for (const [kind, byWidth] of Object.entries(SCENE_CAPACITY)) {
      const widths = [...CAPACITY_WIDTHS].sort((a, b) => a - b);
      for (const [count, fields] of Object.entries(byWidth[widths[0] as number] ?? {})) {
        for (const field of Object.keys(fields)) {
          let previous = -1;
          for (const width of widths) {
            const holds = byWidth[width]?.[Number(count)]?.[field] ?? 0;
            // 3 characters is the measure's own granularity (words of six letters, halving).
            expect(holds, `${kind} ${field} x${count} at ${width}`).toBeGreaterThanOrEqual(
              previous - 3,
            );
            previous = Math.max(previous, holds);
          }
        }
      }
    }
  });

  it('is monotone the other way · more items never hold more', () => {
    for (const [kind, byWidth] of Object.entries(SCENE_CAPACITY)) {
      for (const width of CAPACITY_WIDTHS) {
        const byCount = byWidth[width] ?? {};
        const counts = Object.keys(byCount)
          .map(Number)
          .sort((a, b) => a - b);
        for (const field of Object.keys(byCount[counts[0] as number] ?? {})) {
          let previous = Number.POSITIVE_INFINITY;
          for (const count of counts) {
            const holds = byCount[count]?.[field] ?? 0;
            expect(holds, `${kind} ${field} at ${width}, ${count} items`).toBeLessThanOrEqual(
              previous + 3,
            );
            previous = Math.min(previous, holds);
          }
        }
      }
    }
  });
});

describe('capacityOf', () => {
  it('reads a measured cell', () => {
    const measured = SCENE_CAPACITY.cards?.[1600]?.[5]?.note;
    expect(capacityOf('cards', 1600, 5, 'note')).toBe(measured);
    expect(measured).toBeGreaterThan(30);
  });

  it('rounds the width down to a measured one, never up', () => {
    expect(capacityOf('cards', 1599, 3, 'note')).toBe(capacityOf('cards', 1250, 3, 'note'));
    expect(capacityOf('cards', 2000, 3, 'note')).toBe(capacityOf('cards', 1600, 3, 'note'));
  });

  it('is 0 under the narrowest width measured, for a field that exists', () => {
    expect(capacityOf('cards', 300, 3, 'note')).toBe(0);
  });

  it('takes the next count up, and the most when there are more than it draws', () => {
    expect(capacityOf('cards', 1600, 1, 'note')).toBe(capacityOf('cards', 1600, 2, 'note'));
    expect(capacityOf('cards', 1600, 9, 'note')).toBe(capacityOf('cards', 1600, 5, 'note'));
  });

  it('is null for what was not measured', () => {
    expect(capacityOf('spiral', 1600, 3, 'note')).toBeNull();
    expect(capacityOf('bars', 1600, 3, 'note')).toBeNull();
    expect(capacityOf('spiral', 300, 3, 'note')).toBeNull();
  });
});

describe('fitsCapacity', () => {
  it('says whether a text is within the field', () => {
    const holds = capacityOf('cards', 1600, 3, 'note') as number;
    expect(fitsCapacity('cards', 1600, 3, 'note', holds)).toBe(true);
    expect(fitsCapacity('cards', 1600, 3, 'note', holds + 1)).toBe(false);
    expect(fitsCapacity('spiral', 1600, 3, 'note', 10)).toBeNull();
  });
});

describe('capacityFields', () => {
  it('names what each shape wraps', () => {
    expect(capacityFields('cards')).toEqual(['label', 'note', 'tag']);
    expect(capacityFields('bars')).toEqual(['label']);
    expect(capacityFields('spiral')).toEqual([]);
  });
});
