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
}

const HEX3 = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i;
const HEX6 = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i;
const RGB_FN = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i;

/** Parse `#abc`, `#aabbcc`, `rgb(…)` or `rgba(…)` · null for anything else. */
export function parseColor(value: string): Rgb | null {
  const v = value.trim();
  const short = v.match(HEX3);
  if (short) {
    const [, r, g, b] = short;
    return { r: parseInt(r! + r!, 16), g: parseInt(g! + g!, 16), b: parseInt(b! + b!, 16) };
  }
  const long = v.match(HEX6);
  if (long) {
    const [, r, g, b] = long;
    return { r: parseInt(r!, 16), g: parseInt(g!, 16), b: parseInt(b!, 16) };
  }
  const fn = v.match(RGB_FN);
  if (fn) return { r: Number(fn[1]), g: Number(fn[2]), b: Number(fn[3]) };
  return null;
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
