import type { Point, Size } from './types.js';
/** Fewer than two values is a dot, not a shape; more than twelve is a chart to
 *  read up close, not a curve read from the back of the room. */
export declare const CURVE_MIN_POINTS = 2;
export declare const CURVE_MAX_POINTS = 12;
/** How tall the plot is · a shape needs height to read as one, and a plot much
 *  taller than its words weighs the drawing down. */
export declare const CURVE_PLOT_HEIGHT = 220;
/** Narrower than this the steps crowd; the width it takes with room to spare, and
 *  the most it ever takes. */
export declare const CURVE_MIN_WIDTH = 480;
export declare const CURVE_PREF_WIDTH = 960;
export declare const CURVE_MAX_WIDTH = 1200;
/** The first and the last value stand this far in from the plot's edges · the dot on
 *  a point and the round end of the line stay inside the curve's own box. */
export declare const CURVE_INSET = 16;
/** The top of a scale that holds `value` · a round number at or above it. */
export declare function niceMax(value: number): number;
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
    plot: {
        x: number;
        y: number;
        w: number;
        h: number;
    };
    /** Each value, from the left edge of the plot to its right one. */
    points: Point[];
    /** Where the threshold stands, as a y · absent without one. */
    threshold?: number;
    /** Where the curve first crosses its threshold · the segment it does it on (from
     *  the point before), and the point itself, found on the straight segment. */
    crossing?: {
        index: number;
        at: Point;
    };
    /** Top-left of each word under the plot. */
    ticks: Point[];
}
/** The first segment on which the curve passes from one side of `line` to the other,
 *  and the point where it does · null when it never does. */
export declare function crossingOf(points: Point[], values: number[], line: number): {
    index: number;
    at: Point;
} | null;
/** Place a curve `width` wide · the words on one band, the plot under them, the words
 *  of the steps under the plot. */
export declare function curve(input: CurveInput): CurveResult;
