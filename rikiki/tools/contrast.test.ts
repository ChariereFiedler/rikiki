import { describe, expect, it } from 'vitest';
import {
  DELTA_E_DISTINCT,
  contrastRatio,
  deltaE,
  flatten,
  isOpaque,
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
    expect(parseColor('rgba(18 52 86 / 0.5)')).toEqual({ r: 18, g: 52, b: 86, a: 0.5 });
    expect(parseColor('rgba(18, 52, 86, 0.04)')).toEqual({ r: 18, g: 52, b: 86, a: 0.04 });
    expect(parseColor('#0000000d')).toEqual({ r: 0, g: 0, b: 0, a: 13 / 255 });
  });

  // The bug this replaces: alpha was dropped, so the theme's own
  // rgba(42, 37, 32, 0.04) tint read as near-black and scored 20:1 against the
  // page. Any surface guard built on that number would have been a lie.
  it('composites a translucent color over its backdrop before measuring', () => {
    const page = { r: 250, g: 248, b: 245 };
    const tint = parseColor('rgba(42, 37, 32, 0.04)')!;
    expect(isOpaque(tint)).toBe(false);
    const seen = flatten(tint, page);
    expect(contrastRatio(seen, page)).toBeLessThan(1.2);
    // Reading the same value as opaque overstates it by more than tenfold.
    const naive = contrastRatio({ ...tint, a: undefined }, page);
    expect(naive / contrastRatio(seen, page)).toBeGreaterThan(10);
  });

  // The instrument this adds: judging a surface by luminance alone calls the
  // mango accent invisible on paper, which it plainly is not, while calling the
  // raised surface visible, which it plainly is not either.
  it('separates a hue difference from a luminance difference', () => {
    const page = { r: 250, g: 248, b: 245 };
    const accent = { r: 240, g: 112, b: 32 };
    const raised = { r: 240, g: 237, b: 232 };

    expect(contrastRatio(accent, page)).toBeLessThan(3);
    expect(deltaE(accent, page)).toBeGreaterThan(DELTA_E_DISTINCT);

    expect(contrastRatio(raised, page)).toBeLessThan(3);
    expect(deltaE(raised, page)).toBeLessThan(DELTA_E_DISTINCT);
  });

  it('measures no difference between a colour and itself', () => {
    const c = { r: 12, g: 34, b: 56 };
    expect(deltaE(c, c)).toBeCloseTo(0, 10);
    expect(deltaE({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 })).toBeCloseTo(100, 0);
  });

  it('refuses to composite over a backdrop that is itself translucent', () => {
    expect(() => flatten({ r: 0, g: 0, b: 0, a: 0.5 }, { r: 255, g: 255, b: 255, a: 0.5 })).toThrow(
      /opaque/,
    );
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
