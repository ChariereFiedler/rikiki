// Color utilities shared by the deck runtime · pure, DOM-free.

/** True when a computed CSS color is fully opaque.
 *
 *  `getComputedStyle().backgroundColor` serializes opaque colors as
 *  `rgb(r, g, b)` and anything with alpha < 1 as `rgba(r, g, b, a)` ·
 *  so the alpha is the 4th comma component when present, never the 3rd.
 *  Modern color functions (`oklch(…)`, `color(…)`) carry their alpha
 *  after a slash instead. */
export function isOpaqueColor(color: string): boolean {
  if (!color || color === 'transparent') return false;
  const legacy = color.match(/^(?:rgb|hsl)a?\(([^)]*)\)$/i);
  if (legacy) {
    const parts = legacy[1]!.split(',');
    return parts.length < 4 || parseFloat(parts[3]!) >= 1;
  }
  const slashAlpha = color.match(/\/\s*([\d.]+%?)\s*\)$/);
  if (slashAlpha) {
    const raw = slashAlpha[1]!;
    const alpha = raw.endsWith('%') ? parseFloat(raw) / 100 : parseFloat(raw);
    return alpha >= 1;
  }
  return true;
}
