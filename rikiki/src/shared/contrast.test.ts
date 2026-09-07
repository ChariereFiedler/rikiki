import { describe, expect, it } from 'vitest';
import {
  contrastRatio,
  parseColor,
  readTokens,
  relativeLuminance,
  resolveColor,
  resolveToken,
} from './contrast.js';

describe('color parsing and WCAG math', () => {
  it('parses short hex, long hex and rgb functions', () => {
    expect(parseColor('#fff')).toEqual({ r: 255, g: 255, b: 255 });
    expect(parseColor('#00c8a0')).toEqual({ r: 0, g: 200, b: 160 });
    expect(parseColor('rgb(18, 52, 86)')).toEqual({ r: 18, g: 52, b: 86 });
    expect(parseColor('rgba(18 52 86 / 0.5)')).toEqual({ r: 18, g: 52, b: 86 });
  });

  it('returns null for a value that is not a color', () => {
    expect(parseColor('var(--nope)')).toBeNull();
    expect(parseColor('1rem')).toBeNull();
  });

  it('anchors relative luminance at pure black and pure white', () => {
    expect(relativeLuminance({ r: 0, g: 0, b: 0 })).toBe(0);
    expect(relativeLuminance({ r: 255, g: 255, b: 255 })).toBeCloseTo(1, 10);
  });

  it('reproduces the reference ratios', () => {
    const black = { r: 0, g: 0, b: 0 };
    const white = { r: 255, g: 255, b: 255 };
    expect(contrastRatio(black, white)).toBeCloseTo(21, 10);
    expect(contrastRatio(white, black)).toBeCloseTo(21, 10);
    expect(contrastRatio(white, white)).toBeCloseTo(1, 10);
    // Known WCAG example · #767676 is the lightest grey that passes 4.5 on white.
    expect(contrastRatio({ r: 118, g: 118, b: 118 }, white)).toBeGreaterThanOrEqual(4.5);
  });
});

describe('token resolution', () => {
  const css = `
    :root {
      --a: #123456;
      --b: var(--a);
      --c: var(--missing, #abcdef);
      --loop: var(--loop2);
      --loop2: var(--loop);
    }
    /* --commented: #ff0000; */
  `;
  const tokens = readTokens(css);

  it('follows a var() chain to the literal value', () => {
    expect(resolveToken(tokens, '--b')).toBe('#123456');
    expect(resolveColor(tokens, '--b')).toEqual({ r: 18, g: 52, b: 86 });
  });

  it('falls back to the second var() argument when the reference is missing', () => {
    expect(resolveToken(tokens, '--c')).toBe('#abcdef');
  });

  it('returns null instead of looping forever on a cycle', () => {
    expect(resolveToken(tokens, '--loop')).toBeNull();
  });

  it('ignores a declaration inside a comment', () => {
    expect(resolveToken(tokens, '--commented')).toBeNull();
  });
});
