import type { Align, Block, Bounds, Direction, EngineResult, Size } from './types.js';
/** How many lines a wrapping row breaks into at most, when the author does not say. */
export declare const DEFAULT_MAX_LINES = 3;
/** A grid of units with no aspect asked for is landscape, like the slide it sits on. */
export declare const DEFAULT_ASPECT = 2.2;
export interface StackInput {
    direction: Direction;
    blocks: Block[];
    bounds: Bounds;
    gap: number;
    align: Align;
    /** A row that does not fit even at its least widths breaks into lines. */
    wrap?: boolean;
    /** Every child gets the same cross size (height in a row, width in a column). */
    equalCross?: boolean;
    /** The most lines a wrapping row breaks into · `DEFAULT_MAX_LINES` when absent. */
    maxLines?: number;
}
export interface StackResult extends EngineResult {
    /** How many lines the children took · 0 with no child, 1 for a column. */
    lines: number;
}
export interface UniformGridInput {
    mode: 'uniform';
    count: number;
    /** Exactly this many columns, or the shape with the biggest cells near `aspect`. */
    columns: number | 'auto';
    bounds: Bounds;
    gap: number;
    minCell: number;
    maxCell: number;
    /** Columns over rows the auto shape aims at · `DEFAULT_ASPECT` when absent. */
    aspect?: number;
}
export interface UniformGridResult extends EngineResult {
    cell: number;
    columns: number;
    rows: number;
}
/** A table track: the width of its widest child, a share of what is left, or fixed. */
export type Track = 'auto' | 'fill' | number;
export interface TableGridInput {
    mode: 'table';
    rows: Block[][];
    tracks: Track[];
    bounds: Bounds;
    /** `w` between two tracks, `h` between two rows. */
    gap: Size;
}
export interface TableGridResult extends EngineResult {
    /** The width each track came out at, in order. */
    tracks: number[];
}
/** A row or a column of children · see the file header for the rules. */
export declare function stack(input: StackInput): StackResult;
/** Identical square cells (`uniform`) or the tracks of a table (`table`). */
export declare function grid(input: UniformGridInput): UniformGridResult;
export declare function grid(input: TableGridInput): TableGridResult;
