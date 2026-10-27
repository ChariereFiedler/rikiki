// ════════════════════════════════════════════════════════════════
// RIKIKI · deck-scene-ranges layout, the pure part
//
// The shared scale every row of deck-scene-ranges is drawn on: where a value
// lands, how a range becomes a bar, where its tag starts. Kept apart from the
// element so the arithmetic is tested without a browser.
// ════════════════════════════════════════════════════════════════

/** The horizontal span the scale is drawn across, in drawing units. */
export interface ScaleArea {
  left: number;
  right: number;
}

export interface Span {
  x: number;
  width: number;
}

/** A number from an attribute, or null · an author who wrote "ten" meant
 *  something, but not a position on the scale. */
export function parseValue(attribute: string | null): number | null {
  if (attribute === null || attribute.trim() === '') return null;
  const value = Number(attribute);
  return Number.isFinite(value) ? value : null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Where a value lands, clamped to the scale · a value past the maximum sits at
 *  the end of the track rather than off the slide. */
export function scaleX(value: number, scale: number, area: ScaleArea): number {
  if (scale <= 0) return area.left;
  return area.left + (clamp(value, 0, scale) / scale) * (area.right - area.left);
}

/** The bar for a row, or null when the row is open (no `to`).
 *
 *  `to` alone is a single value: a short pill centred on it, so "10 days" reads
 *  as a point and not as "0 to 10". A range shorter than the bar is tall gets
 *  `minWidth`, so it stays a pill instead of shrinking to a sliver. Both are
 *  kept inside the area. */
export function barSpan(
  from: number | null,
  to: number | null,
  scale: number,
  area: ScaleArea,
  minWidth: number,
  pointWidth: number,
): Span | null {
  if (to === null) return null;
  if (from === null) {
    const centre = scaleX(to, scale, area);
    return {
      x: clamp(centre - pointWidth / 2, area.left, area.right - pointWidth),
      width: pointWidth,
    };
  }
  const start = scaleX(Math.min(from, to), scale, area);
  const end = scaleX(Math.max(from, to), scale, area);
  const width = Math.max(end - start, minWidth);
  return { x: clamp(start, area.left, area.right - width), width };
}

/** A tag starts where its bar starts, pulled back when it would run past the
 *  end of the scale · and never before the start of it. */
export function tagStart(barX: number, tagWidth: number, area: ScaleArea): number {
  return Math.max(area.left, Math.min(barX, area.right - tagWidth));
}
