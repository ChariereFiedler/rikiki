/** Parse CSV text into a matrix of rows × cells.
 *
 *  A blank spacer line (a single UNQUOTED empty field) is dropped so an author
 *  can space the source out for readability. A quoted `""` is a value the author
 *  wrote on purpose and survives · dropping it silently loses data.
 *
 *  Row terminators: `\n`, `\r\n` and a lone `\r` (some spreadsheet exports).
 *  The delimiter may be more than one character. */
export declare function parseCsv(text: string, delimiter?: string): string[][];
