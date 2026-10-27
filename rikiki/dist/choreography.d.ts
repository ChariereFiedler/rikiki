import type { DiagramLayout, LItem, LLane, LLink, LNote, LRun, LayoutOptions } from './layout.js';
import type { DgNode, ParsedDiagram } from './model.js';
import { type Cue, type Enter, type MotionIssue, type Timing } from './motion.js';
/** A cursor travels along its axis for this long. */
export declare const TRAVEL_SECONDS = 1.2;
/** A curve is traced from its first value to its last for this long · slower than a
 *  link, so the eye follows the shape as it forms. */
export declare const TRACE_SECONDS = 1.4;
/** Tokens on one link leave this far apart. */
export declare const RIDE_SPACING = 0.18;
export declare const itemEnter: (item: LItem) => Enter;
export declare const linkEnter: (link: LLink) => Enter;
export declare const noteEnter: (note: LNote) => Enter;
/** How long an entrance takes · a cursor that travels takes its time, a gate
 *  drops and a meter fills as fast as they do on a click. */
export declare function durationOf(item: LItem, enter: Enter): number;
/** Whether an item looks otherwise on click `stage` than on the click before · a
 *  gate that moves, a meter or a queue whose value or tone changes, a box that
 *  turns. */
export declare function changesOn(item: LItem, stage: number, appears: number): boolean;
/** The click an item last changed on, up to the click shown · the one it appeared
 *  on when it has not changed since. */
export declare function lastChange(item: LItem, appears: number, shown: number): number;
export declare const cueIds: {
    item: (i: number) => string;
    run: (i: number, stage: number) => string;
    switch: (i: number, stage: number) => string;
    link: (j: number) => string;
    ride: (j: number) => string;
    note: (k: number) => string;
};
/** The runs a lane plays · from the click it appears on, the one standing then
 *  replayed as it comes in, and each later one on its own click. */
export declare function runsShown(lane: LLane, appears: number): LRun[];
/** The length of a polyline. */
export declare const lengthOf: (points: {
    x: number;
    y: number;
}[]) => number;
/** How long one token takes along a link · with the line as it is drawn, else at its speed. */
export declare function rideSeconds(link: LLink): number;
export interface Choreography {
    cues: Cue[];
    /** The click each item, link and note appears on, by cue id. */
    appears: Map<string, number>;
}
/** The cues of a drawing, and the click each of its parts appears on. */
export declare function choreograph(drawn: DiagramLayout, tree: DgNode[]): Choreography;
/** One click's drawing, and when its parts move. */
export interface Frame {
    stage: number;
    drawn: DiagramLayout;
    choreography: Choreography;
    timing: Map<string, Timing>;
    issues: MotionIssue[];
}
/** The drawing of each click and when its parts move · one for a diagram without
 *  states, whose clicks only bring parts in, one per click for one with them. */
export declare function framesOf(parsed: ParsedDiagram, options: LayoutOptions): Frame[];
