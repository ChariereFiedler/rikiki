import type { Size } from './types.js';
/** The most places a queue shows · more is a crowd nobody counts. */
export declare const MAX_QUEUE = 12;
/** A place is this wide with room to spare, and never less than the least. */
export declare const QUEUE_CELL = 44;
export declare const QUEUE_MIN_CELL = 24;
export interface QueueInput {
    count: number;
    width: number;
    /** The caption above the places · 0×0 without one. */
    caption: Size;
}
export interface QueueResult {
    size: Size;
    caption: {
        x: number;
        y: number;
    };
    /** The places, left to right. */
    cells: {
        x: number;
        y: number;
        w: number;
        h: number;
    }[];
}
/** The width a row of `count` places takes at a cell size. */
export declare const rowWidth: (count: number, cell: number) => number;
/** Place a queue `width` wide · the caption, then the places, as large as the
 *  width lets them be, between the least and the comfortable size. */
export declare function queue(input: QueueInput): QueueResult;
/** The places taken when `fill` of `count` are · from the right end. */
export declare function takenPlaces(count: number, fill: number): number[];
