/** A width and a height, in drawing units. */
export interface Size {
    w: number;
    h: number;
}
export interface Point {
    x: number;
    y: number;
}
/** Where an engine put a child · the child's top-left corner and its size. */
export interface Placed {
    key: string;
    x: number;
    y: number;
    w: number;
    h: number;
}
/** What an engine was given to place in · the box, and nothing outside it. */
export interface Bounds {
    w: number;
    h: number;
}
/** Whether the children fitted the box with the strategies the engine is allowed.
 *  `unresolved` is not a proof that no placement exists · it says these strategies
 *  found none, and `reasons` names what blocked them. */
export type Status = 'fit' | 'unresolved';
export interface EngineResult {
    placed: Placed[];
    /** The size the placement takes, content only · `<= bounds` when `fit`. */
    size: Size;
    status: Status;
    /** Why it is `unresolved`, one short line each, empty when `fit`. */
    reasons: string[];
}
/** A child as an engine sees it: what it wants and what it needs, already measured.
 *  A text that wraps has a height that depends on the width it is given, so a block
 *  answers `heightFor(width)` instead of holding one height. */
export interface Block {
    key: string;
    /** The least width the block can be drawn in (its longest word, a fixed glyph). */
    minW: number;
    /** The width it would take with room to spare. */
    prefW: number;
    /** The most it ever takes · absent when it can grow with the room. */
    maxW?: number;
    /** Its height when drawn `width` wide · `width` is within `[minW, maxW]`. */
    heightFor(width: number): number;
    /** Its share of the free room in an engine that shares it · 1 when absent. */
    weight?: number;
}
/** An edge between two keyed children of a graph engine. */
export interface Edge {
    from: string;
    to: string;
    /** A return edge, declared as such · it goes round the outside instead of back
     *  through the ranks. An undeclared cycle is an error of the author, not routed. */
    back?: boolean;
}
/** A route an engine found for an edge · points in drawing units, orthogonal. */
export interface Route {
    from: string;
    to: string;
    points: Point[];
}
export type Align = 'start' | 'center' | 'end' | 'stretch';
export type Direction = 'row' | 'column';
