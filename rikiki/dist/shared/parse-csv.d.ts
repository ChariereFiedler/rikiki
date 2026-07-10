/** Parse CSV text into a matrix of rows × cells. Fully-empty lines (a single
 *  empty field, e.g. a trailing newline or a blank separator line) are dropped
 *  so a deck author can space the source out for readability. */
export declare function parseCsv(text: string, delimiter?: string): string[][];
