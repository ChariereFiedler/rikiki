import { describe, expect, it } from 'vitest';
import { FIT, clampPan, fitScale, isAtFit, panBounds, panBy, zoomAt } from './viewport.js';

// Zoom and pan arithmetic, asked without a browser · "can the reader drag the
// slide off screen at 4x on a portrait window?" used to need a manual drag.

const CANVAS = { width: 1920, height: 1080 };
const WIDE = { width: 1920, height: 1080 };
const PORTRAIT = { width: 600, height: 1000 };
const LIMITS = { max: 4 };

describe('fitScale', () => {
  it('is 1 when the box matches the canvas', () => {
    expect(fitScale(CANVAS, WIDE)).toBe(1);
  });

  it('takes the smaller axis, so the whole canvas is visible', () => {
    expect(fitScale(CANVAS, { width: 960, height: 1080 })).toBe(0.5);
    expect(fitScale(CANVAS, { width: 1920, height: 540 })).toBe(0.5);
  });

  it('falls back to 1 rather than dividing by zero', () => {
    // A deck measured before layout has a zero box · the fallback keeps the
    // arithmetic finite instead of producing NaN transforms.
    expect(fitScale(CANVAS, { width: 0, height: 0 })).toBe(1);
    expect(fitScale({ width: 0, height: 0 }, WIDE)).toBe(1);
  });
});

describe('panBounds', () => {
  it('is zero at fit · there is nothing to pan', () => {
    expect(panBounds(CANVAS, WIDE, 1)).toEqual({ x: 0, y: 0 });
  });

  it('grows with the zoom', () => {
    const at2 = panBounds(CANVAS, WIDE, 2);
    expect(at2.x).toBe(960);
    expect(at2.y).toBe(540);
  });

  it('is zero on an axis the canvas does not overflow', () => {
    // Letterboxed: the canvas is narrower than the box on one axis even zoomed.
    const bounds = panBounds(CANVAS, PORTRAIT, 1);
    expect(bounds.x).toBe(0);
    expect(bounds.y).toBe(0);
  });
});

describe('clampPan', () => {
  it('keeps a pan inside its bounds', () => {
    const clamped = clampPan({ zoom: 2, panX: 5000, panY: -5000 }, CANVAS, WIDE);
    expect(clamped.panX).toBe(960);
    expect(clamped.panY).toBe(-540);
  });

  it('pins the pan to zero at fit', () => {
    expect(clampPan({ zoom: 1, panX: 300, panY: 300 }, CANVAS, WIDE)).toEqual(FIT);
  });

  it('leaves the zoom alone', () => {
    expect(clampPan({ zoom: 2.5, panX: 0, panY: 0 }, CANVAS, WIDE).zoom).toBe(2.5);
  });
});

describe('zoomAt', () => {
  it('magnifies up to the ceiling and no further', () => {
    const deep = zoomAt(FIT, 100, 0, 0, CANVAS, WIDE, LIMITS);
    expect(deep.zoom).toBe(4);
  });

  it('never zooms out past fit', () => {
    const out = zoomAt(FIT, 0.5, 0, 0, CANVAS, WIDE, LIMITS);
    expect(out.zoom).toBe(1);
  });

  it('returns the same viewport when it is already at the limit', () => {
    const at4 = zoomAt(FIT, 4, 0, 0, CANVAS, WIDE, LIMITS);
    expect(zoomAt(at4, 2, 0, 0, CANVAS, WIDE, LIMITS)).toBe(at4);
  });

  it('keeps the anchor point in place · zooming on the centre pans nowhere', () => {
    const zoomed = zoomAt(FIT, 2, 0, 0, CANVAS, WIDE, LIMITS);
    expect(zoomed).toEqual({ zoom: 2, panX: 0, panY: 0 });
  });

  it('pans toward the anchor when it is off centre', () => {
    // Zooming on a point to the right must bring that point back under the
    // cursor, which means panning left.
    const zoomed = zoomAt(FIT, 2, 400, 0, CANVAS, WIDE, LIMITS);
    expect(zoomed.panX).toBeLessThan(0);
    expect(zoomed.panY).toBe(0);
  });

  it('never lets the anchor push the pan out of bounds', () => {
    const bounds = panBounds(CANVAS, WIDE, 2);
    const zoomed = zoomAt(FIT, 2, 100000, 100000, CANVAS, WIDE, LIMITS);
    expect(Math.abs(zoomed.panX)).toBeLessThanOrEqual(bounds.x);
    expect(Math.abs(zoomed.panY)).toBeLessThanOrEqual(bounds.y);
  });
});

describe('panBy', () => {
  it('moves and clamps in one go', () => {
    const zoomed = zoomAt(FIT, 2, 0, 0, CANVAS, WIDE, LIMITS);
    const panned = panBy(zoomed, 100, 0, CANVAS, WIDE);
    expect(panned.panX).toBe(100);
  });

  it('cannot drag the slide off screen, however hard', () => {
    const zoomed = zoomAt(FIT, 2, 0, 0, CANVAS, WIDE, LIMITS);
    const bounds = panBounds(CANVAS, WIDE, 2);
    let view = zoomed;
    for (let i = 0; i < 50; i++) view = panBy(view, 500, 500, CANVAS, WIDE);
    expect(view.panX).toBe(bounds.x);
    expect(view.panY).toBe(bounds.y);
  });

  it('does not move at all at fit', () => {
    expect(panBy(FIT, 400, 400, CANVAS, WIDE)).toEqual(FIT);
  });
});

describe('isAtFit', () => {
  it('is true only for the untouched viewport', () => {
    expect(isAtFit(FIT)).toBe(true);
    expect(isAtFit({ zoom: 1, panX: 1, panY: 0 })).toBe(false);
    expect(isAtFit({ zoom: 1.2, panX: 0, panY: 0 })).toBe(false);
  });
});
