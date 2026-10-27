import type { Bounds, EngineResult, Placed } from './types.js';
export type AxisOrientation = 'horizontal' | 'vertical';
export type AxisLane = 'own' | 'shared';
/** The key of the one track every item is drawn on when the lane is shared. */
export declare const SHARED_TRACK = "shared";
export declare const INFO_PREFIX = "info: ";
export interface AxisItem {
    key: string;
    from?: number;
    to?: number;
    at?: number;
    /** The label's box, as measured. */
    w: number;
    h: number;
}
export interface AxisInput {
    items: AxisItem[];
    domain: [number, number];
    length: number;
    orientation: AxisOrientation;
    bounds: Bounds;
    labelGap: number;
    trackThickness: number;
    lane?: AxisLane;
    /** Labels of one track take turns: the first on the near side, the second on
     *  the far one, and so on · a frise read both sides of its line. Each still
     *  moves out a row when its side is taken. */
    alternate?: boolean;
}
/** A stretch along the axis (a mark) or across it (a track's band). */
export interface AxisSpan {
    key: string;
    start: number;
    end: number;
}
export interface AxisResult extends EngineResult {
    marks: AxisSpan[];
    labels: Placed[];
    tracks: AxisSpan[];
}
/** Where a value lands, clamped to the domain · the middle of a single-value domain.
 *  Exported for a mark that rides the axis without being one of its items (a cursor). */
export declare function axisScale(domain: [number, number], length: number): (value: number) => number;
export declare function axis(input: AxisInput): AxisResult;
