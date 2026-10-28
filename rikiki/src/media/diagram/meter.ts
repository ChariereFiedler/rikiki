// ════════════════════════════════════════════════════════════════
// RIKIKI · diagram, the meter engine
//
// A meter is a gauge read from the back of the room: its label at the left, its
// figure at the right, and under them a track filled as far as the value goes
// against its maximum. The value may change on each click (`value="45 72 96"`),
// so the fill is computed for every click and the drawing grows or shrinks it.
//
// Pure: the label and the figure arrive measured, the engine says where the
// words, the track and each click's fill go. The fill is exact · a small value
// is a short fill, never rounded up to look like more.
// ════════════════════════════════════════════════════════════════

import type { Size } from './types.js';

/** How thick the track is. */
export const METER_TRACK = 28;
/** Between the words and the track. */
const WORDS_GAP = 12;
/** A display figure's glyphs reach above its line box · it keeps this room above it. */
export const FIGURE_HEADROOM = 12;
/** Between the label and the figure, on one line. */
export const METER_FIGURE_GAP = 24;
/** Narrower than this a track cannot show a difference worth reading. */
export const METER_MIN_WIDTH = 240;
/** The width a meter takes with room to spare, and the most it ever takes. */
export const METER_PREF_WIDTH = 520;
export const METER_MAX_WIDTH = 720;

/** The share of the track a value fills · 0 to 1, whatever was written. */
export function shareOf(value: number, max: number): number {
  if (!(max > 0) || !Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value / max));
}

export interface MeterInput {
  width: number;
  /** The label as set at the width left beside the figure · 0×0 without one. */
  label: Size;
  /** The widest figure of all the clicks. */
  figure: Size;
  /** The share filled on each click. */
  shares: number[];
  /** The share where a threshold stands, when there is one. */
  threshold?: number;
}

export interface MeterResult {
  size: Size;
  /** Top-left of the label, and of the figure (set flush right). */
  label: { x: number; y: number };
  figure: { x: number; y: number };
  track: { x: number; y: number; w: number; h: number };
  /** The width filled on each click, from the left of the track. */
  fills: number[];
  /** Where the threshold crosses the track, from its left · absent without one. */
  threshold?: number;
}

/** A threshold stands this far past the track, above and below. */
export const THRESHOLD_REACH = 8;

/** Place a meter `width` wide · the words on one band, the track under them. */
export function meter(input: MeterInput): MeterResult {
  const figure = input.figure.h > 0 ? input.figure.h + FIGURE_HEADROOM : 0;
  const words = Math.max(input.label.h, figure);
  const reach = input.threshold === undefined ? 0 : THRESHOLD_REACH;
  const trackY = (words > 0 ? words + WORDS_GAP : 0) + reach;
  const track = { x: 0, y: trackY, w: input.width, h: METER_TRACK };
  return {
    size: { w: input.width, h: trackY + METER_TRACK + reach },
    ...(input.threshold === undefined ? {} : { threshold: shareOf(input.threshold, 1) * track.w }),
    // Both sit on the bottom of the band, so a short label and a tall figure share a baseline.
    label: { x: 0, y: words - input.label.h },
    figure: { x: input.width - input.figure.w, y: words - input.figure.h },
    track,
    fills: input.shares.map((share) => shareOf(share, 1) * track.w),
  };
}
