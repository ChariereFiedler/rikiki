import type { DiagramLayout, LLink } from './layout.js';
import type { DgIssue } from './model.js';
import { type Cue, type Enter } from './motion.js';
import type { Point } from './types.js';
/** More marks than this moving on one click is a shuffle the eye cannot follow. */
export declare const MORPH_CROWD = 7;
/** A picture as the room sees it on one click. */
export interface Picture {
    layout: DiagramLayout;
    /** The click it is the picture of. */
    stage: number;
    /** What is on it, by index into the layout's items, links and notes. */
    items: number[];
    links: number[];
    notes: number[];
    /** Where it is drawn from the layout's origin · each picture is centred in the
     *  frame all of them share, so the frame does not jump from one to the next. */
    shift: Point;
}
/** The picture of a layout on click `stage` · what has appeared by then, read off
 *  the click each part appears on (`Choreography.appears`). */
export declare function pictureOf(layout: DiagramLayout, appears: ReadonlyMap<string, number>, stage: number, shift?: Point): Picture;
/** A mark that stays and changes · drawn at its new place, played from the old one. */
export interface Move {
    /** Its index in the picture before. */
    from: number;
    /** Where it was, from where it is: an offset, and its old size over its new. */
    dx: number;
    dy: number;
    sx: number;
    sy: number;
    /** Its words changed · the new ones fade in while it moves. */
    relabel: boolean;
    /** Its fill before, for a meter or a queue that changes value. */
    fill?: number;
}
export interface Transition {
    /** By cue id of the new picture · what moves. Neither here nor entering: it stays. */
    moves: Map<string, Move>;
    /** By cue id of the new picture · what comes in. */
    entering: Set<string>;
    /** What leaves, by index into the picture before. */
    leaving: {
        items: number[];
        links: number[];
        notes: number[];
    };
    cues: Cue[];
    issues: DgIssue[];
}
/** The cue of a part of the picture before that leaves, and of a mark that moves. */
export declare const morphIds: {
    leave: (id: string) => string;
    move: (id: string) => string;
};
/** How a link comes in on a click that changes the picture · traced, unless it is
 *  dashed or says otherwise: the new connection is made under the eye. */
export declare const transitionLinkEnter: (link: LLink) => Enter;
/** What each part of `after` does as `before` becomes it, and when. */
export declare function planTransition(before: Picture, after: Picture): Transition;
