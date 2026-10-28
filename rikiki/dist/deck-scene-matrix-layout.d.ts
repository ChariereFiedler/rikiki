/** From furthest along to nothing yet · the legend follows this order. */
export declare const STATUSES: readonly ["prod", "pilot", "test", "announced", "none"];
export type Status = (typeof STATUSES)[number];
export declare const MAX_COLUMNS = 12;
export declare const DEFAULT_STATUS_WORDS: Readonly<Record<Status, string>>;
export interface Group {
    name: string;
    start: number;
    count: number;
}
export declare function parseColumns(attribute: string | undefined): string[];
/** `name:count` pairs laid side by side from the first column. The count is
 *  read after the last colon, so a name may hold one. A group that runs past
 *  the last column is cut there · the drawing has no column to put it on. */
export declare function parseGroups(attribute: string | undefined, columnCount: number): Group[];
/** `status=word` pairs over the English defaults · the deck's language is the
 *  author's, and only the words the author changed need writing. */
export declare function parseStatusWords(attribute: string | undefined): Record<Status, string>;
/** One status per column. A missing or unknown one reads as `none` · the dot
 *  that says "nothing" is the honest default for a column nobody filled in. */
export declare function parseLevels(attribute: string | null, columnCount: number): Status[];
/** The words of a row that did not fit their column, each text once · all of
 *  them, not the first: a second word wider than its column runs into the next
 *  one, and only a word that is named is not silent. */
export declare function unfitWords<T extends {
    lines: string[];
    fits: boolean;
}>(words: T[]): T[];
/** The statuses that appear, once each, in the order of the scale · a legend
 *  entry for a dot nobody can find on the slide is noise. */
export declare function legendStatuses(levels: Status[][]): Status[];
/** When each dot pops, in seconds · column by column along a row, then the next
 *  row. The step is `maxStep` unless that would start the last dot after
 *  `lastStart`, then it tightens, so a full twelve-column grid still lands in time. */
export declare function dotDelays(rows: number, columns: number, start: number, maxStep: number, lastStart: number): number[][];
/** Entries of these widths placed left to right, wrapping to a new line when
 *  the next one would run past `maxWidth`. */
export declare function flowLine(widths: number[], gap: number, maxWidth: number): {
    x: number;
    line: number;
}[];
