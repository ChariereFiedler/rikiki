export interface Mark {
    /** Horizontal position, 0..100, from the left edge of the image. */
    readonly x: number;
    /** Vertical position, 0..100, from the top edge. */
    readonly y: number;
    /** Caption shown in the legend · empty is allowed, the number still shows. */
    readonly label: string;
}
export interface PlacedMark extends Mark {
    /** 1-based, in document order · what the reader sees in the badge. */
    readonly n: number;
}
/**
 * Read the `marks` attribute · `x,y,label` triples separated by `|`.
 *
 * An attribute rather than JSON because a deck author writes HTML by hand, and
 * `35,60,Latency spike` survives being retyped in five years better than an
 * escaped JSON blob does.
 *
 * A mark with an unreadable coordinate is DROPPED rather than pinned to 0,0:
 * a marker in the wrong corner of a screenshot is worse than a missing one,
 * because the room believes it.
 */
export declare function parseMarks(raw: string | null | undefined): Mark[];
/** Number the marks in document order. */
export declare function placeMarks(marks: readonly Mark[]): PlacedMark[];
/**
 * How many marks are visible at `step`.
 *
 * Step 0 shows none, so the room looks at the screenshot before the speaker
 * starts pointing at it. Each step reveals one more, and a step past the last
 * mark keeps them all rather than wrapping.
 */
export declare function visibleCount(total: number, step: number): number;
/** Steps a slide needs to reveal every mark · the count the engine asks for. */
export declare const stepsForMarks: (total: number) => number;
/** A badge side name : the four directions a keyword offset can name. */
export type AnchorSide = 'above' | 'below' | 'left' | 'right';
/** A parsed `offset` / `offsets` entry, either raw pixels or a named side. */
export type Offset = {
    readonly kind: 'px';
    readonly dx: number;
    readonly dy: number;
} | {
    readonly kind: 'anchor';
    readonly side: AnchorSide;
};
/**
 * Read one `offset` / `offsets` entry · either `x,y` CSS pixels or a keyword
 * naming a side (`above`, `below`, `left`, `right`).
 *
 * A keyword lets the author state the intent instead of guessing pixels in a
 * coordinate system they cannot see : the component turns it into a real
 * displacement once it knows the rendered badge size.
 *
 * An unreadable entry falls back to `0,0`, same as an unreadable `x,y` pair
 * always has : a badge pinned to its target is a smaller mistake than one
 * thrown off-image by a typo.
 */
export declare function parseOffset(text: string | null | undefined): Offset;
