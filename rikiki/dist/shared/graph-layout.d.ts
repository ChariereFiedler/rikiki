export interface Point {
    readonly x: number;
    readonly y: number;
}
export type GraphLayout = 'free' | 'row' | 'column';
/** Read an `at="x,y"` attribute · null when it is absent or unreadable, so the
 *  caller can fall back to an arrangement rather than pinning to a corner. */
export declare function parsePoint(raw: string | null | undefined): Point | null;
/**
 * Resolve a position for every node.
 *
 * `free` honours what the author wrote and centres anything unwritten. `row`
 * and `column` space the nodes evenly and ignore `at` entirely · the two cases
 * that would otherwise be typed out by hand on every chain diagram.
 *
 * The inset keeps the first and last node off the edge, where their labels
 * would be cut by the slide padding.
 */
export declare function arrange(raw: readonly (string | null)[], layout?: GraphLayout, inset?: number): Point[];
export interface EdgeGeometry {
    readonly x1: number;
    readonly y1: number;
    readonly x2: number;
    readonly y2: number;
    /** Midpoint, where a label sits. */
    readonly mx: number;
    readonly my: number;
}
/**
 * The segment between two nodes, shortened at both ends.
 *
 * The gap is what stops a line from running under a label · without it every
 * edge appears to strike through the word it connects.
 */
export declare function edgeGeometry(from: Point, to: Point, gap?: number): EdgeGeometry;
