// ════════════════════════════════════════════════════════════════
// RIKIKI · diagram, the curve engine
//
// A curve is a series of values read as one shape · it grows, it levels off, it
// turns at a knee, it crosses a line. Its label at the left and its last figure at
// the right on one band, as a meter has them; under them a plot as wide as the
// curve is given, its baseline at zero and its top at the scale's maximum, the
// values at equal steps from one side to the other (a dot's width in from each
// edge), joined by straight segments. Never smoothed: a smooth line would show
// values nobody measured.
//
// Pure: the words arrive measured, the engine says where the words, the plot, each
// point, the threshold and the point where the curve crosses it go.
// ════════════════════════════════════════════════════════════════

import type { Point, Size } from './types.js';

/** Fewer than two values is a dot, not a shape; more than twelve is a chart to
 *  read up close, not a curve read from the back of the room. */
export const CURVE_MIN_POINTS = 2;
export const CURVE_MAX_POINTS = 12;
/** How tall the plot is · a shape needs height to read as one, and a plot much
 *  taller than its words weighs the drawing down. */
export const CURVE_PLOT_HEIGHT = 220;
/** Narrower than this the steps crowd; the width it takes with room to spare, and
 *  the most it ever takes. */
export const CURVE_MIN_WIDTH = 480;
export const CURVE_PREF_WIDTH = 960;
export const CURVE_MAX_WIDTH = 1200;
/** Between the words and the plot, and between the plot and the words under it. */
const WORDS_GAP = 16;
const TICK_GAP = 10;
/** A display figure's glyphs reach above its line box · it keeps this room above it. */
const FIGURE_HEADROOM = 12;
/** The first and the last value stand this far in from the plot's edges · the dot on
 *  a point and the round end of the line stay inside the curve's own box. */
export const CURVE_INSET = 16;
/** The steps of a scale's top · 1, 2, 2.5, 5, then the next power of ten. */
const NICE_STEPS = [1, 2, 2.5, 5, 10] as const;

/** The top of a scale that holds `value` · a round number at or above it. */
export function niceMax(value: number): number {
  if (!(value > 0) || !Number.isFinite(value)) return 1;
  const power = 10 ** Math.floor(Math.log10(value));
  const step = NICE_STEPS.find((s) => s * power >= value - 1e-9) ?? 10;
  return step * power;
}

export interface CurveInput {
  width: number;
  /** The label, set at the width left beside the figure · 0×0 without one. */
  label: Size;
  /** The figure of the last value · 0×0 without one. */
  figure: Size;
  values: number[];
  /** The top of the scale · every value and the threshold are at or under it. */
  max: number;
  threshold?: number;
  /** The words under the plot · one per value, or the first and the last. */
  ticks: Size[];
}

export interface CurveResult {
  size: Size;
  /** Top-left of the label, and of the figure (set flush right). */
  label: Point;
  figure: Point;
  /** The plot · its bottom edge is zero, its top the maximum. */
  plot: { x: number; y: number; w: number; h: number };
  /** Each value, from the left edge of the plot to its right one. */
  points: Point[];
  /** Where the threshold stands, as a y · absent without one. */
  threshold?: number;
  /** Where the curve first crosses its threshold · the segment it does it on (from
   *  the point before), and the point itself, found on the straight segment. */
  crossing?: { index: number; at: Point };
  /** Top-left of each word under the plot. */
  ticks: Point[];
}

/** Where a value stands in the plot, from its top · the scale is exact. */
const yOf = (value: number, max: number, plotY: number, plotH: number) =>
  plotY + plotH * (1 - Math.min(1, Math.max(0, value / max)));

/** The first segment on which the curve passes from one side of `line` to the other,
 *  and the point where it does · null when it never does. */
export function crossingOf(
  points: Point[],
  values: number[],
  line: number,
): { index: number; at: Point } | null {
  for (let k = 1; k < values.length; k += 1) {
    const a = values[k - 1]!;
    const b = values[k]!;
    if (a >= line === b >= line) continue;
    const share = (line - a) / (b - a);
    const p = points[k - 1]!;
    const q = points[k]!;
    return { index: k, at: { x: p.x + (q.x - p.x) * share, y: p.y + (q.y - p.y) * share } };
  }
  return null;
}

/** The left edge of each word under the plot · one under each value, centred on it,
 *  or the first flush left and the last flush right · never past the curve's width. */
function tickPlaces(ticks: Size[], points: Point[], width: number, y: number): Point[] {
  const clampX = (x: number, w: number) => Math.min(Math.max(0, x), Math.max(0, width - w));
  if (ticks.length === points.length)
    return ticks.map((t, k) => ({ x: clampX(points[k]!.x - t.w / 2, t.w), y }));
  return ticks.map((t, k) => ({ x: k === 0 ? 0 : clampX(width - t.w, t.w), y }));
}

/** Place a curve `width` wide · the words on one band, the plot under them, the words
 *  of the steps under the plot. */
export function curve(input: CurveInput): CurveResult {
  const figure = input.figure.h > 0 ? input.figure.h + FIGURE_HEADROOM : 0;
  const words = Math.max(input.label.h, figure);
  const plot = {
    x: 0,
    y: words > 0 ? words + WORDS_GAP : 0,
    w: input.width,
    h: CURVE_PLOT_HEIGHT,
  };
  const count = input.values.length;
  const run = Math.max(0, plot.w - 2 * CURVE_INSET);
  // A value past the scale is drawn at its bound (and said, `DG_VALUE_RANGE`) · the
  // crossing is found on the line as drawn, not on the value as written.
  const drawn = input.values.map((value) => Math.min(Math.max(value, 0), input.max));
  const points = drawn.map((value, k) => ({
    x: CURVE_INSET + (count > 1 ? (run * k) / (count - 1) : run / 2),
    y: yOf(value, input.max, plot.y, plot.h),
  }));
  const tickTop = plot.y + plot.h + TICK_GAP;
  const tickH = Math.max(0, ...input.ticks.map((t) => t.h));
  const line =
    input.threshold === undefined ? undefined : Math.min(Math.max(input.threshold, 0), input.max);
  const threshold = line === undefined ? undefined : yOf(line, input.max, plot.y, plot.h);
  const crossing = line === undefined ? null : crossingOf(points, drawn, line);
  return {
    size: { w: input.width, h: tickH > 0 ? tickTop + tickH : plot.y + plot.h },
    // Both sit on the bottom of the band, so a short label and a tall figure share a baseline.
    label: { x: 0, y: words - input.label.h },
    figure: { x: input.width - input.figure.w, y: words - input.figure.h },
    plot,
    points,
    ...(threshold === undefined ? {} : { threshold }),
    ...(crossing ? { crossing } : {}),
    ticks: tickPlaces(input.ticks, points, input.width, tickTop),
  };
}
