import type { Bounds, Edge, EngineResult, Route, Size } from './types.js';
/** Past a dozen boxes, or two dozen arrows, a layered diagram stops being read and
 *  starts being searched · the slide wants splitting, not a smaller font. */
export declare const MAX_NODES = 12;
export declare const MAX_EDGES = 24;
/** A box at most this many units shorter than the widest of its rank takes the rank's
 *  size · centred, its edges would land under 6 px from the others' on a 1920 slide,
 *  the band `rikiki check` calls a slip (ILL_NEAR_ALIGN). Past it, the difference is
 *  seen as meant. */
export declare const EVEN_RANK_SLACK = 12;
export type LayerIssueCode = 'LAYERS_UNKNOWN_NODE' | 'LAYERS_CYCLE' | 'LAYERS_SELF_LOOP' | 'LAYERS_TOO_MANY';
export interface LayerIssue {
    code: LayerIssueCode;
    message: string;
    /** The keys involved · an edge's two ends, or what is over a cap. */
    items: string[];
}
/** A node as measured, in drawing units. */
export type LayerNode = Size & {
    key: string;
};
export interface LayersInput {
    nodes: LayerNode[];
    edges: Edge[];
    /** Where the ranks progress · `right` puts rank 0 on the left, `down` on top. */
    direction: 'right' | 'down';
    bounds: Bounds;
    /** Between two nodes of a rank, and (doubled) between two groups. */
    nodeGap: number;
    /** The corridor between two ranks, where routes turn and link labels sit. */
    rankGap: number;
    /** Between a passing route and a node, and between two return lanes. */
    laneGap?: number;
}
export interface LayersResult extends EngineResult {
    routes: Route[];
    /** Crossings between edges of consecutive ranks, dummies included. */
    crossings: number;
    ranks: Record<string, number>;
    issues: LayerIssue[];
}
/** Places a directed graph in layers · the seven steps are in the header. */
export declare function layers(input: LayersInput): LayersResult;
