import type { Bounds, EngineResult, Point, Route, Size } from './types.js';
/** Fewer than three nodes is a pair or a dot, not a cycle; more than eight is a
 *  clock face nobody follows round. Placed anyway, and said. */
export declare const MIN_RING_NODES = 3;
export declare const MAX_RING_NODES = 8;
export interface RingNode {
    key: string;
    w: number;
    h: number;
}
export interface RingInput {
    nodes: RingNode[];
    bounds: Bounds;
    gap: number;
    /** Links the last node back to the first. */
    closed?: boolean;
    /** A zone kept free in the middle of the ring, centred on it. */
    centre?: Size;
}
export interface RingCentre extends Point {
    /** The radius the node centres sit on. */
    r: number;
    /** The free zone in the middle, `gap` away from every box · the shape of
     *  `centre` scaled up as far as the boxes allow, a square without one. */
    free: Size;
}
export interface RingResult extends EngineResult {
    centre: RingCentre;
    routes: Route[];
}
export declare function ring(input: RingInput): RingResult;
