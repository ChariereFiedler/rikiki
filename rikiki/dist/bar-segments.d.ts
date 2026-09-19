/** One slice of a bar · a share of the whole with a label and a tone. */
export interface Segment {
    readonly label: string;
    readonly value: number;
    readonly tone?: string;
}
export interface SizedSegment extends Segment {
    /** Share of the total, 0..100, rounded for display. */
    readonly percent: number;
    /** Exact share before rounding · used to lay the bar out without drift. */
    readonly exact: number;
}
/** Parse the `segments` attribute · `label:value:tone` triples separated by
 *  `|`, because a deck author writes attributes, not JSON. The tone is
 *  optional; a malformed triple is skipped rather than rendered as garbage. */
export declare function parseSegments(raw: string | null | undefined): Segment[];
/**
 * Size each segment against the total.
 *
 * `total` defaults to the sum, which is what a stacked bar wants. Passing a
 * larger one is what makes "160 of 538" show the remaining 70% as empty track.
 *
 * Rounding is corrected on the largest segment so the displayed percentages
 * always add to 100 · five segments of 16.67 must not print as 85.
 */
export declare function sizeSegments(segments: readonly Segment[], total?: number): SizedSegment[];
/** The share of the track left empty · 0 for a stacked bar that fills it. */
export declare function remainder(sized: readonly SizedSegment[]): number;
