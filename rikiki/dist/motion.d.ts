export declare const ENTERS: readonly ["fade", "rise", "pop", "draw"];
export type Enter = (typeof ENTERS)[number];
/** How long each entrance takes, in seconds · the stylesheet reads the same table. */
export declare const ENTER_SECONDS: Readonly<Record<Enter, number>>;
/** A gate that changes state drops (or lifts) in this long. */
export declare const SWITCH_SECONDS = 0.35;
/** A meter fills, a queue takes or frees its places, in this long. */
export declare const FILL_SECONDS = 0.8;
/** On a click that changes the picture · what leaves fades in this long, then what
 *  stays moves to its new place in this long, then what is new comes in. */
export declare const EXIT_SECONDS = 0.3;
export declare const MORPH_SECONDS = 0.8;
/** A stage moves for this long at most · under the 3 s past which `rikiki check`
 *  says the room is waiting on the drawing (ILL_MOTION_LONG). */
export declare const MOTION_BUDGET = 2.8;
/** The most clicks a diagram takes. */
export declare const MAX_STEP = 9;
export type CueRole = 'frame' | 'mark' | 'link' | 'note' | 'run' | 'switch' | 'exit' | 'morph';
/** One thing that moves once · an entrance, a run of tokens, a gate changing state. */
export interface Cue {
    id: string;
    role: CueRole;
    /** The `name` an `after` may point at · cues of one name end together. */
    owner?: string;
    /** The click it belongs to, as written (0 when the slide is entered). */
    stage: number;
    duration: number;
    /** Reading order among the marks of a stage · smaller comes first. */
    order: number;
    /** Names it waits for, as the author wrote them (`after`). */
    after?: string[];
    /** Cues it waits for, by id · `start` to go with it, `end` to follow it. */
    waits?: {
        id: string;
        edge: 'start' | 'end';
    }[];
    /** Not when its name appears · a lane's later runs, a gate's later drops, the
     *  line under tokens that wait on their own. */
    secondary?: boolean;
}
export interface Timing {
    start: number;
    duration: number;
    stage: number;
}
export interface MotionIssue {
    code: 'DG_MOTION_BUDGET';
    severity: 'warning';
    /** The click it is about · 0 for the entrance. */
    stage: number;
    items: string[];
    message: string;
    fix: {
        action: string;
        [detail: string]: unknown;
    };
}
export interface Schedule {
    timing: Map<string, Timing>;
    /** When each stage stops moving, after any speeding up. */
    ends: number[];
    issues: MotionIssue[];
}
/** When everything moves, stage by stage, inside the budget. */
export declare function schedule(input: Cue[], budget?: number): Schedule;
