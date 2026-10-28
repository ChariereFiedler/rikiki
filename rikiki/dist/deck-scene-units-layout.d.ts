/** Past four hundred cells a grid is a texture, and no one counts a texture. */
export declare const MAX_TOTAL = 400;
export declare const DEFAULT_TOTAL = 100;
/** Below this a cell is a dot, and a dot does not read as one person. */
export declare const MIN_CELL = 12;
/** Above this a cell stops reading as a unit of a crowd and reads as a card. */
export declare const MAX_CELL = 44;
/** A grid is no taller than this · the slide holds a title above it and a caption
 *  and a note around it, and a scene that outgrows the room is clipped. */
export declare const MAX_GRID_HEIGHT = 340;
export declare const MAX_COLUMNS = 40;
export interface Count {
    value: number;
    /** False when what was written is not a whole number in range · the value is
     *  then the fallback, and the lint says so. */
    valid: boolean;
}
/** A whole number from `min` to `max`, as an author writes it. Absent is the
 *  fallback and is valid. */
export declare function readWhole(attribute: string | null | undefined, fallback: number, min: number, max: number): Count;
/** Between two panels · wide enough that the eye reads two grids and not one. */
export declare const PANEL_GAP = 48;
/** How wide each of `count` side-by-side panels is, on a canvas `width` units wide. */
export declare function panelWidth(count: number, width?: number): number;
/** The columns that give a grid of `total` cells a landscape shape. */
export declare function defaultColumns(total: number): number;
export interface GridFrame {
    columns: number;
    rows: number;
    cell: number;
    gap: number;
    width: number;
    height: number;
}
/** The size of a cell so the columns a grid really uses, gutters included, fill
 *  `width` · and no bigger than a cell may be, in which case the grid is narrower
 *  than its room. Asking for 21 columns of 200 cells makes 10 rows, and 20 columns
 *  are then all there is to draw. */
export declare function gridFrame(total: number, columns: number, width: number, maxHeight?: number): GridFrame;
/** Whether the columns an author asked for leave cells big enough to count. */
export declare function cellIsReadable(total: number, columns: number, width: number): boolean;
export interface Cell {
    index: number;
    column: number;
    row: number;
    x: number;
    y: number;
}
/** The cells in the order they light · down a column, then on to the next, so a
 *  count reads as a bar filling from the left. */
export declare function cellsOf(total: number, frame: GridFrame): Cell[];
/** When each column lights · a fixed beat per column, spread thinner when there
 *  are many so the whole grid is in within about two seconds. */
export declare function columnDelays(columns: number, panel?: number): number[];
