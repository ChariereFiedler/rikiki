import { describe, expect, it } from 'vitest';
import { isOpaqueColor } from './color.js';

// getComputedStyle().backgroundColor serializes fully opaque colors as
// `rgb(r, g, b)` and anything with alpha < 1 as `rgba(r, g, b, a)`.
// Modern color functions keep their own syntax with `/ alpha`.
describe('isOpaqueColor', () => {
  it('treats opaque rgb() colors as opaque even when the blue channel is 0', () => {
    expect(isOpaqueColor('rgb(0, 0, 0)')).toBe(true); // black
    expect(isOpaqueColor('rgb(255, 0, 0)')).toBe(true); // red
    expect(isOpaqueColor('rgb(255, 255, 0)')).toBe(true); // yellow
    expect(isOpaqueColor('rgb(10, 20, 30)')).toBe(true);
  });

  it('treats fully transparent values as not opaque', () => {
    expect(isOpaqueColor('rgba(0, 0, 0, 0)')).toBe(false);
    expect(isOpaqueColor('transparent')).toBe(false);
    expect(isOpaqueColor('')).toBe(false);
  });

  it('treats semi-transparent colors as not opaque (they composite differently in the bands)', () => {
    expect(isOpaqueColor('rgba(10, 10, 20, 0.5)')).toBe(false);
    expect(isOpaqueColor('rgba(255, 0, 0, 0.999)')).toBe(false);
  });

  it('handles rgba with alpha 1 as opaque', () => {
    expect(isOpaqueColor('rgba(0, 0, 0, 1)')).toBe(true);
  });

  it('handles modern color syntax with slash alpha', () => {
    expect(isOpaqueColor('oklch(0.5 0.2 240)')).toBe(true);
    expect(isOpaqueColor('oklch(0.5 0.2 240 / 0)')).toBe(false);
    expect(isOpaqueColor('color(srgb 0 0 0 / 0.5)')).toBe(false);
    expect(isOpaqueColor('color(display-p3 1 0 0)')).toBe(true);
  });
});
