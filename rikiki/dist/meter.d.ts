import type { Size } from './types.js';
/** How thick the track is. */
export declare const METER_TRACK = 28;
/** A display figure's glyphs reach above its line box · it keeps this room above it. */
export declare const FIGURE_HEADROOM = 12;
/** Between the label and the figure, on one line. */
export declare const METER_FIGURE_GAP = 24;
/** Narrower than this a track cannot show a difference worth reading. */
export declare const METER_MIN_WIDTH = 240;
/** The width a meter takes with room to spare, and the most it ever takes. */
export declare const METER_PREF_WIDTH = 520;
export declare const METER_MAX_WIDTH = 720;
/** The share of the track a value fills · 0 to 1, whatever was written. */
export declare function shareOf(value: number, max: number): number;
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
    label: {
        x: number;
        y: number;
    };
    figure: {
        x: number;
        y: number;
    };
    track: {
        x: number;
        y: number;
        w: number;
        h: number;
    };
    /** The width filled on each click, from the left of the track. */
    fills: number[];
    /** Where the threshold crosses the track, from its left · absent without one. */
    threshold?: number;
}
/** A threshold stands this far past the track, above and below. */
export declare const THRESHOLD_REACH = 8;
/** Place a meter `width` wide · the words on one band, the track under them. */
export declare function meter(input: MeterInput): MeterResult;
