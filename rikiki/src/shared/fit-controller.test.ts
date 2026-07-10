import { describe, expect, it } from 'vitest';
import { bestFitSize } from './fit-controller.js';

describe('bestFitSize', () => {
  it('returns the max when everything fits', () => {
    expect(bestFitSize(10, 100, () => true)).toBe(100);
  });

  it('returns the min when nothing fits (a tiny clip beats vanishing text)', () => {
    expect(bestFitSize(10, 100, () => false)).toBeCloseTo(10, 0);
  });

  it('converges to the largest fitting size for a monotonic predicate', () => {
    // Fits up to 30px · the search should land just under it.
    const size = bestFitSize(10, 100, (px) => px <= 30);
    expect(size).toBeLessThanOrEqual(30);
    expect(size).toBeGreaterThan(29);
  });

  it('respects min/max bounds', () => {
    // Threshold above max → clamps to max.
    expect(bestFitSize(10, 50, (px) => px <= 80)).toBe(50);
    // Threshold below min → clamps to min.
    expect(bestFitSize(20, 80, (px) => px <= 5)).toBeCloseTo(20, 0);
  });

  it('handles a degenerate range', () => {
    expect(bestFitSize(40, 40, () => false)).toBe(40);
    expect(bestFitSize(60, 40, () => true)).toBe(60);
  });
});
