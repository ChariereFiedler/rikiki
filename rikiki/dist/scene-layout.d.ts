/** Every scene is drawn 1600 units wide and scales with its slide like an
 *  image · so a size below is a size on a 1600-wide canvas, whatever the room. */
export declare const SCENE_WIDTH = 1600;
/** The type scale, in drawing units. Two sizes for reading and one for a figure ·
 *  the gap between them is the hierarchy (rikiki-deck, "Hierarchy"). */
export declare const TYPE: Readonly<{
    label: {
        size: number;
        weight: number;
        line: number;
    };
    note: {
        size: number;
        weight: number;
        line: number;
    };
    tag: {
        size: number;
        weight: number;
        line: number;
    };
    value: {
        size: number;
        weight: number;
        line: number;
    };
}>;
/** A baseline sits this far into its line box · close to the cap height of the
 *  sans families rikiki themes use. */
export declare const BASELINE = 0.8;
/** Room around the drawing · a card laid on the edge of the canvas has half its
 *  stroke outside it, and the slide crops whatever leaves the box. */
export declare const EDGE = 4;
/** The viewBox for a drawing of this height, with EDGE units on every side ·
 *  `width` is the scene's own, 1600 unless it sits in a composition. */
export declare function sceneViewBox(height: number, width?: number): string;
/** The tallest drawing a slide leaves room for, in drawing units, under a title
 *  of one line · measured on the fixtures: a scene of 614 sits under it (a matrix
 *  of three rows and its legend is 606), one of 680 does not, and a title that
 *  wraps to a second line (past about 36 characters) costs about 80 more. Past
 *  this the engine clips the slide and `check` says "content is cut off", which
 *  names neither the scene nor the cause. */
export declare const MAX_SCENE_HEIGHT = 620;
/** The room a diagram plans for when its `bounds` say nothing · under the clip
 *  limit above, so a diagram and its source line sit under a title of one line
 *  with a margin. */
export declare const DIAGRAM_ROOM_HEIGHT = 600;
/** One step down, tried once, when a field does not fit at its own size. */
export declare const SHRINK_RATIO = 0.88;
/** Breathing room inside a card, and between cards · a grid of 8, so edges line
 *  up across a row without anyone checking them. */
export declare const PAD = 28;
export declare const GAP = 32;
/** How many items each scene draws · past `max` the rest are not drawn, and
 *  under `min` the shape stops saying what it is for (one card is not a
 *  comparison). Shared by the drawing and by the lint, so they cannot drift. */
export declare const SCENE_LIMITS: Readonly<{
    cards: {
        min: number;
        max: number;
    };
    steps: {
        min: number;
        max: number;
    };
    bars: {
        min: number;
        max: number;
    };
    matrix: {
        min: number;
        max: number;
    };
    ranges: {
        min: number;
        max: number;
    };
    lanes: {
        min: number;
        max: number;
    };
    units: {
        min: number;
        max: number;
    };
}>;
export type Measure = (text: string) => number;
export interface Wrapped {
    lines: string[];
    fits: boolean;
}
/** Greedy wrap that never cuts a word. A word wider than the box keeps its own
 *  line and marks the result as not fitting · cutting it would print a word the
 *  author never wrote. */
export declare function wrapText(text: string, maxWidth: number, measure: Measure, maxLines: number): Wrapped;
export interface Fitted extends Wrapped {
    size: number;
}
/** Wrap at the field's size, then once at one step smaller. */
export declare function fitText(text: string, maxWidth: number, maxLines: number, size: number, measureAt: (size: number) => Measure): Fitted;
/** Equal columns across the drawing · the x of each and their shared width. */
export declare function columns(count: number, gap?: number, total?: number): {
    width: number;
    xs: number[];
};
