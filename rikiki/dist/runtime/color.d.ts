/** True when a computed CSS color is fully opaque.
 *
 *  `getComputedStyle().backgroundColor` serializes opaque colors as
 *  `rgb(r, g, b)` and anything with alpha < 1 as `rgba(r, g, b, a)` ·
 *  so the alpha is the 4th comma component when present, never the 3rd.
 *  Modern color functions (`oklch(…)`, `color(…)`) carry their alpha
 *  after a slash instead. */
export declare function isOpaqueColor(color: string): boolean;
