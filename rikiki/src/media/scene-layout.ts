// ════════════════════════════════════════════════════════════════
// RIKIKI · scene layout, the pure part of the scene kit
//
// The numbers and the wrapping every deck-scene-* lays out with, kept apart from
// the element so they run, and are tested, without a browser · scene-kit.ts
// re-exports all of it, so a scene imports one module.
// ════════════════════════════════════════════════════════════════

/** Every scene is drawn 1600 units wide and scales with its slide like an
 *  image · so a size below is a size on a 1600-wide canvas, whatever the room. */
export const SCENE_WIDTH = 1600;

/** The type scale, in drawing units. Two sizes for reading and one for a figure ·
 *  the gap between them is the hierarchy (rikiki-deck, "Hierarchy"). */
export const TYPE = Object.freeze({
  label: { size: 31, weight: 650, line: 38 },
  note: { size: 25, weight: 400, line: 34 },
  tag: { size: 23, weight: 600, line: 30 },
  value: { size: 56, weight: 750, line: 64 },
});

/** A baseline sits this far into its line box · close to the cap height of the
 *  sans families rikiki themes use. */
export const BASELINE = 0.8;

/** Room around the drawing · a card laid on the edge of the canvas has half its
 *  stroke outside it, and the slide crops whatever leaves the box. */
export const EDGE = 4;

/** The viewBox for a drawing of this height, with EDGE units on every side ·
 *  `width` is the scene's own, 1600 unless it sits in a composition. */
export function sceneViewBox(height: number, width = SCENE_WIDTH): string {
  return `${-EDGE} ${-EDGE} ${width + 2 * EDGE} ${height + 2 * EDGE}`;
}

/** The tallest drawing a slide leaves room for, in drawing units, under a title
 *  of one line · measured on the fixtures: a scene of 614 sits under it (a matrix
 *  of three rows and its legend is 606), one of 680 does not, and a title that
 *  wraps to a second line (past about 36 characters) costs about 80 more. Past
 *  this the engine clips the slide and `check` says "content is cut off", which
 *  names neither the scene nor the cause. */
export const MAX_SCENE_HEIGHT = 620;

/** The room a diagram plans for when its `bounds` say nothing · under the clip
 *  limit above, so a diagram and its source line sit under a title of one line
 *  with a margin. */
export const DIAGRAM_ROOM_HEIGHT = 600;

/** One step down, tried once, when a field does not fit at its own size. */
export const SHRINK_RATIO = 0.88;

/** Breathing room inside a card, and between cards · a grid of 8, so edges line
 *  up across a row without anyone checking them. */
export const PAD = 28;
export const GAP = 32;

/** How many items each scene draws · past `max` the rest are not drawn, and
 *  under `min` the shape stops saying what it is for (one card is not a
 *  comparison). Shared by the drawing and by the lint, so they cannot drift. */
export const SCENE_LIMITS = Object.freeze({
  cards: { min: 2, max: 5 },
  steps: { min: 1, max: 6 },
  bars: { min: 2, max: 8 },
  matrix: { min: 1, max: 6 },
  ranges: { min: 1, max: 8 },
  lanes: { min: 2, max: 5 },
  units: { min: 1, max: 3 },
});

export type Measure = (text: string) => number;

export interface Wrapped {
  lines: string[];
  fits: boolean;
}

/** Greedy wrap that never cuts a word. A word wider than the box keeps its own
 *  line and marks the result as not fitting · cutting it would print a word the
 *  author never wrote. */
export function wrapText(
  text: string,
  maxWidth: number,
  measure: Measure,
  maxLines: number,
): Wrapped {
  // Break on ordinary spaces only · a no-break space (a figure and its unit,
  // "12 ms") is a promise that the two stay on one line.
  const words = text
    .trim()
    .split(/[ \t\n\r]+/)
    .filter(Boolean);
  const lines: string[] = [];
  let current = '';
  let fits = true;
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (measure(candidate) <= maxWidth) {
      current = candidate;
      continue;
    }
    if (current) lines.push(current);
    current = word;
    if (measure(word) > maxWidth) fits = false;
  }
  if (current) lines.push(current);
  return { lines, fits: fits && lines.length <= maxLines };
}

export interface Fitted extends Wrapped {
  size: number;
}

/** Wrap at the field's size, then once at one step smaller. */
export function fitText(
  text: string,
  maxWidth: number,
  maxLines: number,
  size: number,
  measureAt: (size: number) => Measure,
): Fitted {
  const first = wrapText(text, maxWidth, measureAt(size), maxLines);
  if (first.fits) return { ...first, size };
  const smaller = Math.round(size * SHRINK_RATIO);
  const second = wrapText(text, maxWidth, measureAt(smaller), maxLines);
  return { ...second, size: smaller };
}

/** Equal columns across the drawing · the x of each and their shared width. */
export function columns(
  count: number,
  gap = GAP,
  total = SCENE_WIDTH,
): { width: number; xs: number[] } {
  const n = Math.max(1, count);
  const width = (total - gap * (n - 1)) / n;
  return { width, xs: Array.from({ length: n }, (_, i) => i * (width + gap)) };
}
