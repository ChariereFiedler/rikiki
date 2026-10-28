/** More than four inputs stop reading as "these feed that" and start reading as
 *  a list · and more than two outcomes dilute the one result the slide argues. */
export declare const MAX_SOURCES = 4;
export declare const MAX_OUTCOMES = 2;
/** Each column's share of the drawing width · the rest is split evenly between
 *  the two connector lanes, so the arrows get the same room on both sides. */
export declare const SHARE: Readonly<{
    sources: 0.3;
    hub: 0.22;
    outcomes: 0.26;
}>;
/** Every column edge lands on this grid, so a scene lines up with its neighbours. */
export declare const GRID = 8;
export interface Roles<T> {
    sources: T[];
    hub: T | undefined;
    outcomes: T[];
}
/** Roles come from order · the emphasised item is the hub, what precedes it
 *  feeds it, what follows it comes out of it. Without an emphasis the last item
 *  is the hub: a flow that only converges is still a flow. */
export declare function flowRoles<T>(items: T[], isEmphasis: (item: T) => boolean): Roles<T>;
export interface Span {
    x: number;
    width: number;
}
export interface FlowColumns {
    sources: Span | null;
    hub: Span;
    outcomes: Span | null;
    /** The width of each connector lane between two columns. */
    link: number;
}
/** The columns for the roles present · the shares are scaled to fill the width,
 *  so a flow without outcomes is as wide as one with them, and the last column
 *  takes the rounding so the drawing ends exactly at its edge. */
export declare function flowColumns(hasSources: boolean, hasOutcomes: boolean, width?: number): FlowColumns;
/** The height of `count` equal boxes stacked with GAP between them. */
export declare function stackHeight(count: number, boxHeight: number): number;
/** The top of each of `count` equal boxes, stacked and centred on `centre`. */
export declare function stackTops(count: number, boxHeight: number, centre: number): number[];
/** Arrows leave the hub straight, at the height of each outcome · so the hub
 *  must reach past the outermost outcome's middle by a PAD, or an arrow would
 *  start from a rounded corner or from nowhere. */
export declare function hubHeight(contentHeight: number, outcomeHeight: number, outcomeCount: number): number;
