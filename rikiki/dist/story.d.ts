import { type Choreography } from './choreography.js';
import type { DiagramLayout } from './layout.js';
import type { DgIssue, DgNode } from './model.js';
import { type Timing } from './motion.js';
import { type Beat } from './story-words.js';
export { BEATS, type Beat, PLAYS, STORY_ATTRIBUTES, STORY_BUDGET, STORY_MAX_BUDGET, readSeconds, } from './story-words.js';
/** The pace of the room, in seconds · a story written longer is played faster to
 *  last this long, up to `STORY_MAX_RATE` times (the normalisation of the pace:
 *  clamp(written / 6.5 s, 1, 2)). */
export declare const STORY_PACE = 6.5;
export declare const STORY_MAX_RATE = 2;
/** An established flow lasts this long when a steady beat says no length. */
export declare const DEFAULT_STEADY = 3;
/** A token of an established flow leaves this often · the talk sends one every 0.7 s. */
export declare const STEADY_INTERVAL = 0.75;
/** Two beats of a story start this far apart at least, written · played up to
 *  1.5 times faster, they stay over the half second the eye needs for each. */
export declare const BEAT_GAP = 0.8;
/** A swap, a proof, a dim and a lever take this long. */
export declare const SWAP_SECONDS = 0.5;
export declare const PROOF_SECONDS = 0.45;
export declare const DIM_SECONDS = 0.6;
export declare const LEVER_SECONDS = 0.6;
/** What is cut pales to this. */
export declare const DIM_OPACITY = 0.32;
/** The tokens a story carries · per lane, and in all · past them the eye stops counting. */
export declare const MAX_STORY_TOKENS_LANE = 12;
export declare const MAX_STORY_TOKENS = 40;
/** What a story action does · `lasting` when it leaves a trace in the resting picture.
 *  `act` is what a mark that tells a story does in its own words (marks.ts): a
 *  terminal types, a table carries its rows, a timer runs, a band is cut. */
export type ActionKind = 'enter' | 'change' | 'swap' | 'proof' | 'dim' | 'ride' | 'lever' | 'flow' | 'act' | 'camera';
/** One beat of the script, as played · what `check` reads (`data-story`). */
export interface StoryBeat {
    phase: Beat;
    mark: string;
    kind: ActionKind;
    atMs: number;
    /** Whether the resting picture keeps a trace of it. */
    lasting: boolean;
    /** Declared by the author with `beat` · the beats the diagram adds (a queue that
     *  forms against a gate, what a cut leaves pale) follow them and are not counted. */
    declared: boolean;
    /** The mark it is played with (`with`), when it says so. */
    with?: string;
}
/** The script of a story, as `check` reads it · played times, in ms. */
export interface StoryScript {
    writtenMs: number;
    playedMs: number;
    rate: number;
    budgetMs: number;
    /** How long the established flow runs before the first event, played. */
    steadyMs: number;
    beats: StoryBeat[];
}
export interface StoryPlan {
    /** When everything moves, played · the ids of the choreography and the story's own. */
    timing: Map<string, Timing>;
    /** The departures of the tokens of an established flow, by id, played. */
    departures: Map<string, number[]>;
    /** How long one of those tokens travels, by id, played. */
    trips: Map<string, number>;
    /** Where a lever points before its beat, in degrees from where it rests, by link id. */
    levers: Map<string, number>;
    script: StoryScript;
    issues: DgIssue[];
}
export declare const storyIds: {
    swap: (i: number) => string;
    proof: (i: number) => string;
    dim: (i: number) => string;
    downstream: (i: number) => string;
    steady: (i: number) => string;
    act: (i: number) => string;
    noteSwap: (k: number) => string;
    linkDim: (j: number) => string;
    linkSteady: (j: number) => string;
    lever: (j: number) => string;
    camera: (c: number) => string;
    /** The camera's way back to the whole picture, when the last one ends on a detail. */
    cameraBack: string;
};
/** What each camera does on its beat · it moves the frame, and is gone from the
 *  picture at rest unless it ends on the whole picture, which the picture at rest is. */
export declare function camerasOf(tree: DgNode[]): DgNode[];
export interface StoryOptions {
    /** The played length the story may take, in seconds · `budget` on the root. */
    budget?: number;
}
/** When everything of a story moves. */
export declare function planStory(drawn: DiagramLayout, choreography: Choreography, options?: StoryOptions): StoryPlan;
type Point = {
    x: number;
    y: number;
};
/** A lever and the link it turns away from leave their mark from one point · on its
 *  edge, toward what the two of them reach, the way a switch has one pivot. */
export declare function leverPivots(drawn: DiagramLayout): Map<number, Point>;
