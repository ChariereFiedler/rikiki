/** `cols`/`rows` value · integer 1..12 → `repeat(N, minmax(0, 1fr))`, else the
 *  value is passed through as an explicit track template ("1fr 2fr"). */
export declare function expandTracks(value: string | undefined): string | null;
/** `gap` value · integer 1..6 → `var(--rik-space-N)`, else any CSS length. */
export declare function expandGap(value: string | undefined): string | null;
export interface CellSpan {
    /** grid-column value */
    col: string;
    /** grid-row value */
    row: string;
}
/** Turn one axis of a span into a grid-* value · a positive integer becomes
 *  `span N`, anything else (raw line syntax like "1 / 3") passes through. */
export declare function toTrack(value: string | undefined): string;
/** Parse a bento cell span. Accepts "CxR" (e.g. "2x1"), a bare column count
 *  ("2" → span 2 columns, 1 row), or empty (→ a single auto-placed cell). */
export declare function parseSpan(value: string | undefined): CellSpan;
