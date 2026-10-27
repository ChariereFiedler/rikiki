/** A pie reads at a glance with two to six parts · past six, the small ones are
 *  slivers nobody tells apart, and they belong together as "other". */
export declare const SLICES_MIN = 2;
export declare const SLICES_MAX = 6;
/** Columns compare two to twelve things, in one to three series side by side. */
export declare const COLUMNS_MIN = 2;
export declare const COLUMNS_MAX = 12;
export declare const SERIES_MAX = 3;
/** A waterfall starts from a total and walks two to ten steps to the next one. */
export declare const STEPS_MIN = 2;
export declare const STEPS_MAX = 11;
/** How a pie is drawn · a ring with the figure of the whole in its hole, or a full disc. */
export declare const PIE_SHAPES: readonly ["ring", "pie"];
/** The number a figure says · its sign and its decimal comma read. */
export declare const figureValue: (figure: string) => number;
/** A line of a chart · its words, then its figures (`Juin 42 51` is the column
 *  "Juin" at 42 and 51). The figures are the numbers at its end, `most` of them at
 *  most (one per series), so words may end with a number of their own (`marge 2025
 *  120` is the step "marge 2025" at 120). */
export declare function chartRow(line: string, most?: number): {
    label: string;
    figures: string[];
};
