import { describe, expect, it } from 'vitest';
import { FIGURE_HEADROOM, METER_TRACK, THRESHOLD_REACH, meter, shareOf } from './meter.js';

describe('shareOf', () => {
  it('is the value against its maximum', () => {
    expect(shareOf(25, 100)).toBe(0.25);
    expect(shareOf(3, 4)).toBe(0.75);
  });

  it('never leaves 0 to 1, whatever was written', () => {
    expect(shareOf(140, 100)).toBe(1);
    expect(shareOf(-5, 100)).toBe(0);
    expect(shareOf(5, 0)).toBe(0);
    expect(shareOf(Number.NaN, 100)).toBe(0);
  });
});

describe('meter', () => {
  const words = { label: { w: 200, h: 38 }, figure: { w: 120, h: 64 } };

  it('fills each click exactly as far as its share · a small value is a short fill', () => {
    const placed = meter({ width: 500, ...words, shares: [0.1, 0.62, 1] });
    expect(placed.fills).toEqual([50, 310, 500]);
    expect(placed.track).toEqual({ x: 0, y: FIGURE_HEADROOM + 64 + 12, w: 500, h: METER_TRACK });
  });

  it('sets the label at the left and the figure flush right, on one baseline, room above it', () => {
    const placed = meter({ width: 500, ...words, shares: [0.5] });
    expect(placed.label).toEqual({ x: 0, y: FIGURE_HEADROOM + 64 - 38 });
    expect(placed.figure).toEqual({ x: 500 - 120, y: FIGURE_HEADROOM });
    expect(placed.label.y + words.label.h).toBe(placed.figure.y + words.figure.h);
  });

  it('keeps room above and below the track for a threshold, and puts it at its share', () => {
    const plain = meter({ width: 400, ...words, shares: [0.5] });
    const marked = meter({ width: 400, ...words, shares: [0.5], threshold: 0.8 });
    expect(marked.threshold).toBe(320);
    expect(marked.size.h).toBe(plain.size.h + 2 * THRESHOLD_REACH);
    expect(plain.threshold).toBeUndefined();
  });

  it('is only a track when it has no words', () => {
    const placed = meter({
      width: 300,
      label: { w: 0, h: 0 },
      figure: { w: 0, h: 0 },
      shares: [0.5],
    });
    expect(placed.size).toEqual({ w: 300, h: METER_TRACK });
  });
});
