// ════════════════════════════════════════════════════════════════
// RIKIKI · marker placement for <deck-annotate>
//
// Pure and DOM-free. Positions are percentages of the image box, so they
// survive the zoom-to-fit transform, the overview thumbnail and the PDF
// export without a single pixel measurement.
// ════════════════════════════════════════════════════════════════

export interface Mark {
  /** Horizontal position, 0..100, from the left edge of the image. */
  readonly x: number;
  /** Vertical position, 0..100, from the top edge. */
  readonly y: number;
  /** Caption shown in the legend · empty is allowed, the number still shows. */
  readonly label: string;
}

export interface PlacedMark extends Mark {
  /** 1-based, in document order · what the reader sees in the badge. */
  readonly n: number;
}

const clamp01 = (n: number): number => {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, n));
};

/**
 * Read the `marks` attribute · `x,y,label` triples separated by `|`.
 *
 * An attribute rather than JSON because a deck author writes HTML by hand, and
 * `35,60,Latency spike` survives being retyped in five years better than an
 * escaped JSON blob does.
 *
 * A mark with an unreadable coordinate is DROPPED rather than pinned to 0,0:
 * a marker in the wrong corner of a screenshot is worse than a missing one,
 * because the room believes it.
 */
export function parseMarks(raw: string | null | undefined): Mark[] {
  if (!raw) return [];
  return raw
    .split('|')
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const [x = '', y = '', ...rest] = chunk.split(',');
      // An EMPTY coordinate is missing, not zero · Number('') is 0, which would
      // pin the marker to the top-left corner of the screenshot.
      const num = (s: string): number => (s.trim() === '' ? Number.NaN : Number(s.trim()));
      return { x: num(x), y: num(y), label: rest.join(',').trim() };
    })
    .filter((m) => Number.isFinite(m.x) && Number.isFinite(m.y))
    .map((m) => ({ x: clamp01(m.x), y: clamp01(m.y), label: m.label }));
}

/** Number the marks in document order. */
export function placeMarks(marks: readonly Mark[]): PlacedMark[] {
  return marks.map((m, i) => ({ ...m, n: i + 1 }));
}

/**
 * How many marks are visible at `step`.
 *
 * Step 0 shows none, so the room looks at the screenshot before the speaker
 * starts pointing at it. Each step reveals one more, and a step past the last
 * mark keeps them all rather than wrapping.
 */
export function visibleCount(total: number, step: number): number {
  if (total <= 0) return 0;
  return Math.max(0, Math.min(total, Math.floor(step)));
}

/** Steps a slide needs to reveal every mark · the count the engine asks for. */
export const stepsForMarks = (total: number): number => Math.max(0, total);

/** A badge side name : the four directions a keyword offset can name. */
export type AnchorSide = 'above' | 'below' | 'left' | 'right';

/** A parsed `offset` / `offsets` entry, either raw pixels or a named side. */
export type Offset =
  | { readonly kind: 'px'; readonly dx: number; readonly dy: number }
  | { readonly kind: 'anchor'; readonly side: AnchorSide };

const ANCHOR_SIDES: readonly AnchorSide[] = ['above', 'below', 'left', 'right'];

const ZERO_OFFSET: Offset = { kind: 'px', dx: 0, dy: 0 };

/**
 * Read one `offset` / `offsets` entry · either `x,y` CSS pixels or a keyword
 * naming a side (`above`, `below`, `left`, `right`).
 *
 * A keyword lets the author state the intent instead of guessing pixels in a
 * coordinate system they cannot see : the component turns it into a real
 * displacement once it knows the rendered badge size.
 *
 * An unreadable entry falls back to `0,0`, same as an unreadable `x,y` pair
 * always has : a badge pinned to its target is a smaller mistake than one
 * thrown off-image by a typo.
 */
export function parseOffset(text: string | null | undefined): Offset {
  const trimmed = text?.trim();
  if (!trimmed) return ZERO_OFFSET;
  if ((ANCHOR_SIDES as readonly string[]).includes(trimmed)) {
    return { kind: 'anchor', side: trimmed as AnchorSide };
  }
  const [rawX, rawY] = trimmed.split(',');
  const dx = Number(rawX?.trim());
  const dy = Number(rawY?.trim());
  return Number.isFinite(dx) && Number.isFinite(dy) ? { kind: 'px', dx, dy } : ZERO_OFFSET;
}
