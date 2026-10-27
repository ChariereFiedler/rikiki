/** The horizontal span the scale is drawn across, in drawing units. */
export interface ScaleArea {
    left: number;
    right: number;
}
export interface Span {
    x: number;
    width: number;
}
/** A number from an attribute, or null · an author who wrote "ten" meant
 *  something, but not a position on the scale. */
export declare function parseValue(attribute: string | null): number | null;
/** Where a value lands, clamped to the scale · a value past the maximum sits at
 *  the end of the track rather than off the slide. */
export declare function scaleX(value: number, scale: number, area: ScaleArea): number;
/** The bar for a row, or null when the row is open (no `to`).
 *
 *  `to` alone is a single value: a short pill centred on it, so "10 days" reads
 *  as a point and not as "0 to 10". A range shorter than the bar is tall gets
 *  `minWidth`, so it stays a pill instead of shrinking to a sliver. Both are
 *  kept inside the area. */
export declare function barSpan(from: number | null, to: number | null, scale: number, area: ScaleArea, minWidth: number, pointWidth: number): Span | null;
/** A tag starts where its bar starts, pulled back when it would run past the
 *  end of the scale · and never before the start of it. */
export declare function tagStart(barX: number, tagWidth: number, area: ScaleArea): number;
