import { type DiagramLayout, type Meter } from './layout.js';
import type { Point } from './types.js';
/** A drawing that leaves most of its room empty is drawn larger, never past this. */
export declare const MAX_GROWTH = 1.5;
/** The share of the room a grown drawing may take · the rest is breathing room. */
export declare const GROWN_FILL = 0.92;
/** A narrower layout is worth it when the drawing grows at least this much more. */
export declare const WORTH_GROWING = 1.15;
/** The share of the room's height a drawing laid out narrower to grow may reach · less
 *  than a drawing that already fits, since the room a diagram plans for assumes a title
 *  of one line, and a title on two takes about 80 units of it. */
export declare const NARROWED_FILL = 0.8;
export interface Ink {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
}
/** An arrow head's wings are this long, this far either side of its line, in radians. */
export declare const ARROW_LENGTH = 14;
export declare const ARROW_SPREAD = 0.45;
/** The two wing tips of the arrow head at the end of a polyline. */
export declare function arrowWings(points: Point[]): [Point, Point] | null;
/** The box around everything drawn · marks, link routes and their arrow heads, notes
 *  and their text. */
export declare function inkOf(drawn: DiagramLayout, meter: Meter): Ink | null;
/** The box around the ink of every picture · the frame they share. */
export declare function unionOf(inks: (Ink | null)[]): Ink | null;
/** How much to enlarge a drawing so its ink fills its room · 1 when it already does. */
export declare function growthFor(ink: Ink | null, room: {
    w: number;
    h: number;
}): number;
/** The width to lay a drawing out in so it is drawn larger · when its width holds
 *  it back and its height would let it grow by `WORTH_GROWING` more, the width that,
 *  enlarged as far as the height allows, fills the room. Null when the width it was
 *  laid out in already lets it be drawn as large as it can. */
export declare function widthToGrow(ink: Ink | null, room: {
    w: number;
    h: number;
}): number | null;
