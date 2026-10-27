/** The number disc · just taller than a label line, so the number reads before
 *  the words and a one-line row stays one line tall · six such rows still fit
 *  under a one-line slide title. */
export declare const DISC = 40;
/** The label column is fixed, not measured · labels of different lengths still
 *  start their notes on one vertical edge, which is what makes rows a list. */
export declare const LABEL_WIDTH = 320;
/** Between two rows · half the kit's gap. Rows are one list, not separate
 *  cards, and four of them with a band must still fit under a slide title. */
export declare const ROW_GAP: number;
/** Room between the last row and the closing band · wider than the gap between
 *  rows, so the band reads as the conclusion of the list, not its next row. */
export declare const BEFORE_BAND = 32;
/** Heights snap to this grid, so rows of every scene line up with each other. */
export declare const GRID = 8;
/** Where the disc and the label column sit · fixed, and shared with the closing
 *  band, whose icon and sentence line up under them. */
export declare const DISC_CENTER: number;
export declare const LABEL_X: number;
export interface StepColumns {
    discCenter: number;
    labelX: number;
    noteX: number;
    noteWidth: number;
    tagRight: number;
}
export interface StepRows {
    rowHeight: number;
    ys: number[];
    bandY: number;
    bandHeight: number;
    height: number;
}
export declare function snapToGrid(value: number): number;
/** The note takes whatever the tag column leaves · the widest tag decides, so
 *  every note wraps to the same width and every tag ends on the same edge. */
export declare function stepColumns(tagWidth: number, width?: number): StepColumns;
/** Every row takes the height of the fullest one · a list whose rows change
 *  height reads as a table with a missing cell. `bandContent` is null when the
 *  scene has no closing band. */
export declare function stepRows(contents: number[], bandContent: number | null): StepRows;
