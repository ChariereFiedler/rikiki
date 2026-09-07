// ════════════════════════════════════════════════════════════════
// contrast · WCAG 2.1 relative luminance and contrast ratio, plus the
// minimum CSS custom-property resolver needed to read a theme's tokens
// without a browser.
//
// Exists so published contrast figures are MEASURED from the theme files
// rather than copied into a comment and left to rot.
// ════════════════════════════════════════════════════════════════

export interface Rgb {
  r: number;
  g: number;
  b: number;
  /** 0 to 1 · absent means fully opaque. A translucent color has NO contrast
   *  ratio of its own, only one against a named backdrop · see flatten(). */
  a?: number;
}

const HEX3 = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i;
const HEX4 = /^#([0-9a-f])([0-9a-f])([0-9a-f])([0-9a-f])$/i;
const HEX6 = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i;
const HEX8 = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i;
const RGB_FN = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+%?))?/i;

const hex = (s: string): number => parseInt(s.length === 1 ? s + s : s, 16);

/** An alpha as CSS writes it · a bare number 0-1, or a percentage. */
function alphaOf(raw: string | undefined): number | undefined {
  if (raw === undefined) return undefined;
  const n = raw.endsWith('%') ? Number(raw.slice(0, -1)) / 100 : Number(raw);
  return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : undefined;
}

/** Parse `#abc`, `#abcd`, `#aabbcc`, `#aabbccdd`, `rgb(…)` or `rgba(…)` ·
 *  null for anything else. Alpha is CARRIED, not dropped: a value read as
 *  opaque when it is not turns a 1.1 contrast into a 20 and makes any guard
 *  built on it a lie. */
export function parseColor(value: string): Rgb | null {
  const v = value.trim();
  const short = v.match(HEX4) ?? v.match(HEX3);
  if (short) {
    const [, r, g, b, a] = short;
    return { r: hex(r!), g: hex(g!), b: hex(b!), ...(a ? { a: hex(a) / 255 } : {}) };
  }
  const long = v.match(HEX8) ?? v.match(HEX6);
  if (long) {
    const [, r, g, b, a] = long;
    return { r: hex(r!), g: hex(g!), b: hex(b!), ...(a ? { a: hex(a) / 255 } : {}) };
  }
  const fn = v.match(RGB_FN);
  if (fn) {
    const a = alphaOf(fn[4]);
    return {
      r: Number(fn[1]),
      g: Number(fn[2]),
      b: Number(fn[3]),
      ...(a === undefined ? {} : { a }),
    };
  }
  return null;
}

/** True when the color is fully opaque, so it has a luminance of its own. */
export function isOpaque(color: Rgb): boolean {
  return color.a === undefined || color.a >= 1;
}

/** Composite `fg` over `bg` (source-over) · the color the eye actually sees.
 *  `bg` must be opaque; a translucent backdrop has no single answer. */
export function flatten(fg: Rgb, bg: Rgb): Rgb {
  if (!isOpaque(bg)) throw new Error('flatten: the backdrop must be opaque');
  const a = fg.a ?? 1;
  return {
    r: fg.r * a + bg.r * (1 - a),
    g: fg.g * a + bg.g * (1 - a),
    b: fg.b * a + bg.b * (1 - a),
  };
}

const channel = (c: number): number => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};

/** WCAG 2.1 relative luminance, 0 (black) to 1 (white). */
export function relativeLuminance({ r, g, b }: Rgb): number {
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** WCAG 2.1 contrast ratio between two colors · 1 to 21, order-independent. */
export function contrastRatio(a: Rgb, b: Rgb): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/** CIE L*a*b*, D65 · the space where a distance means what the eye sees. */
function lab({ r, g, b }: Rgb): [number, number, number] {
  const [lr, lg, lb] = [channel(r), channel(g), channel(b)];
  // sRGB to XYZ, then normalised by the D65 white point.
  const x = (lr * 0.4124 + lg * 0.3576 + lb * 0.1805) / 0.95047;
  const y = lr * 0.2126 + lg * 0.7152 + lb * 0.0722;
  const z = (lr * 0.0193 + lg * 0.1192 + lb * 0.9505) / 1.08883;
  const f = (t: number): number => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const [fx, fy, fz] = [f(x), f(y), f(z)];
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

/**
 * CIE76 colour difference between two opaque colours.
 *
 * WHY THIS EXISTS ALONGSIDE contrastRatio · the WCAG ratio is luminance only,
 * so it cannot tell a saturated accent from the paper it sits on: the mango
 * accent scores 1.48 against the siliceum page and is nonetheless one of the
 * most visible things on the slide. Judging a SURFACE by luminance alone would
 * condemn every colour-coded tile and miss none of the grey ones. A surface is
 * distinguishable when it wins on either axis.
 *
 * The threshold used across this repo is DELTA_E_DISTINCT, below.
 */
export function deltaE(a: Rgb, b: Rgb): number {
  const [l1, a1, b1] = lab(a);
  const [l2, a2, b2] = lab(b);
  return Math.hypot(l1 - l2, a1 - a2, b1 - b2);
}

/** Clearly perceptible between two large adjacent areas · the easiest case for
 *  the eye, and the one a slide always presents. Not a taste threshold. */
export const DELTA_E_DISTINCT = 10;

/** Collect every `--name: value;` declaration in a stylesheet · later
 *  declarations win, matching the cascade for a single theme file. */
export function readTokens(css: string): Map<string, string> {
  const tokens = new Map<string, string>();
  // Strip comments first · a commented-out token must not register.
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, '');
  for (const m of clean.matchAll(/(--[\w-]+)\s*:\s*([^;{}]+);/g)) {
    tokens.set(m[1]!, m[2]!.trim());
  }
  return tokens;
}

/** Follow a `var(--a, fallback)` chain down to a literal color.
 *  Returns null on an unresolvable or cyclic reference. */
export function resolveToken(
  tokens: Map<string, string>,
  name: string,
  seen: Set<string> = new Set(),
): string | null {
  if (seen.has(name)) return null;
  seen.add(name);
  const raw = tokens.get(name);
  if (raw === undefined) return null;
  const ref = raw.match(/^var\(\s*(--[\w-]+)\s*(?:,\s*([^)]*))?\)$/);
  if (!ref) return raw;
  const resolved = resolveToken(tokens, ref[1]!, seen);
  if (resolved !== null) return resolved;
  return ref[2] ? ref[2].trim() : null;
}

/** Resolve a token straight to RGB · null when it is missing or not a color. */
export function resolveColor(tokens: Map<string, string>, name: string): Rgb | null {
  const value = resolveToken(tokens, name);
  return value === null ? null : parseColor(value);
}

/** WCAG 2.1 minimum ratios. Large text is >= 24px, or >= 18.66px bold. */
export const WCAG_AA = { normalText: 4.5, largeText: 3, uiComponent: 3 } as const;
