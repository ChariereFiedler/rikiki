/** A run of consecutive slides under one section heading. */
export interface Chapter {
    /** Index of the chapter's first slide in the flat slide list. */
    readonly start: number;
    /** How many slides the chapter holds · always >= 1. */
    readonly length: number;
}
/** Slide count plus chapter structure · everything navigation needs to know
 *  about the deck's shape, and nothing about its content. */
export interface DeckOutline {
    readonly slideCount: number;
    readonly chapters: readonly Chapter[];
}
/** Where the deck is · a slide and a step within it. */
export interface DeckPosition {
    readonly slide: number;
    readonly step: number;
}
/** A coordinate in the 2D (chapter × slide) model. */
export interface DeckCoords {
    readonly chapter: number;
    readonly index: number;
}
/** How many steps a slide has · injected, because the count comes from the DOM
 *  and from plugin hooks, which the domain must not know about. */
export type StepsOf = (slide: number) => number;
export declare const EMPTY_OUTLINE: DeckOutline;
/** Build an outline from the slides' tag names.
 *
 *  A `deck-section` opens a new chapter; anything else joins the current one.
 *  The first slide always opens one, whatever its tag, so every slide belongs
 *  to exactly one chapter. */
export declare function outlineOf(tagNames: readonly string[]): DeckOutline;
/** Is 2D navigation meaningful for this outline?
 *
 *  It is opt-in (`nav="2d"`) AND needs a structure that makes sense: more than
 *  one chapter, at least one of them holding more than one slide. Without the
 *  opt-in the arrows stay linear, so a sectioned deck does not surprise its
 *  author by remapping left/right to chapter jumps. */
export declare function supportsTwoD(outline: DeckOutline, optedIn: boolean): boolean;
/** Flat slide index → chapter coordinate. Falls back to the origin for an index
 *  that belongs to no chapter (an empty deck). */
export declare function coordsOf(outline: DeckOutline, slide: number): DeckCoords;
/** Chapter coordinate → flat slide index.
 *
 *  An out-of-range chapter clamps to the nearest one rather than snapping back
 *  to slide 0: a deep link to a coordinate that no longer exists (a chapter
 *  removed while iterating) should land on the closest valid slide. */
export declare function slideAt(outline: DeckOutline, coords: DeckCoords): number | null;
export declare function clamp(value: number, min: number, max: number): number;
