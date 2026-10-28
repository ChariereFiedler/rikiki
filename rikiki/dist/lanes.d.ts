import type { EngineResult, Placed, Size } from './types.js';
export declare const TOKEN_RADIUS = 10;
export declare const TOKEN_PITCH: number;
/** More than eight tokens a lane is a queue nobody counts. */
export declare const MAX_FLOW = 8;
export declare const GATE_WIDTH = 96;
/** A gate stands this far past the lanes it crosses, above and below. */
export declare const GATE_OVERHANG = 18;
/** Between the end of a track (its arrow head) and what it runs into. */
export declare const SINK_GAP = 24;
/** The tip of the arrow at the end of a track is kept clear of the tokens. */
export declare const ARROW_ROOM = 20;
/** Shorter than this a track has no room for a story · the longest queue, a
 *  gate, the room past it and the arrow. */
export declare const MIN_TRACK: number;
/** Where a gate stands along its track when nothing aligns it · a share of the track. */
export declare const GATE_AT: Readonly<{
    start: 0.25;
    middle: 0.5;
    end: 0.75;
}>;
export type GateAt = keyof typeof GATE_AT;
export declare const GATE_STATES: readonly ["open", "closed", "shed"];
export type GateState = (typeof GATE_STATES)[number];
/** Units a token covers in a second. */
export declare const SPEEDS: Readonly<{
    slow: 360;
    normal: 560;
    fast: 900;
}>;
export type Speed = keyof typeof SPEEDS;
/** A refused token turns hollow in this long, once it has stopped. */
export declare const REFUSE_SECONDS = 0.25;
export interface LaneSpec {
    key: string;
    /** The label block (icon, text, note), measured. */
    label: Size;
}
export interface GateSpec {
    key: string;
    /** Indexes of the lanes it stands across · consecutive or not, it spans from the
     *  first to the last. Empty means every lane. */
    lanes: number[];
    /** Where it stands along the track, a share of it, when nothing aligns it. */
    at: number;
    /** Its word, measured · drawn above it. */
    label?: Size;
    /** The longest queue that can form against it, in tokens · the track keeps
     *  room for it before the gate. 0 when it never blocks. */
    queue: number;
}
export interface SinkSpec {
    key: string;
    minW: number;
    prefW: number;
    heightFor(width: number): number;
}
export interface LanesInput {
    lanes: LaneSpec[];
    gates: GateSpec[];
    /** What the lanes run into, stacked at the right · none, one, or a column. */
    sinks: SinkSpec[];
    width: number;
    /** Between two lanes. */
    gap: number;
    /** How long the tracks are when the lanes share their line with other marks ·
     *  absent, they run as far as `width` lets them. */
    track?: number;
}
/** The track lanes take beside other marks · longer by a gate and the room past it
 *  for each gate after the first on one lane. */
export declare function naturalTrack(gatesInSeries: number): number;
export interface PlacedLane {
    key: string;
    /** The row, label to track end. */
    x: number;
    y: number;
    w: number;
    h: number;
    /** The centre line the tokens run on. */
    cy: number;
    label: Placed;
    track: {
        x0: number;
        x1: number;
    };
}
export interface PlacedGate extends Placed {
    /** The lanes it stands across, by index. */
    lanes: number[];
    label?: Placed;
    /** The range its centre may take · the queue before it, the room past it. */
    centreMin: number;
    centreMax: number;
}
export interface LanesResult extends EngineResult {
    lanes: PlacedLane[];
    gates: PlacedGate[];
    sinks: Placed[];
}
/** The room a queue of `tokens` takes before a gate, the gap to it included. */
export declare const queueRoom: (tokens: number) => number;
/** Where a gate's centre may go, and where it goes when it would like `desired`. */
export declare function gateCentre(gate: Pick<PlacedGate, 'centreMin' | 'centreMax'>, desired: number): number;
/** Where a gate's word goes · above it, where nothing else is, unless a lane runs
 *  above the gate and none under it: the word would sit on that lane's track, so it
 *  goes under the gate. */
export declare function labelSide(covered: number[], count: number): 'above' | 'below';
/** Place the lanes, the gates across them and what they run into, `width` wide. */
export declare function lanes(input: LanesInput): LanesResult;
export type Fate = 'pass' | 'queue' | 'refuse';
export interface Token {
    /** The centre it leaves from and the centre it rests at, along the track. */
    from: number;
    to: number;
    fate: Fate;
    /** When it leaves, from the start of the run, and how long it travels. */
    delay: number;
    duration: number;
}
export interface Run {
    tokens: Token[];
    /** When the last token has stopped, refusal included. */
    duration: number;
}
export interface RunInput {
    track: {
        x0: number;
        x1: number;
    };
    /** The gates on this lane, as they stand at this moment. */
    gates: {
        x: number;
        w: number;
        state: GateState;
    }[];
    flow: number;
    speed: Speed;
}
/** One run of a lane's tokens · they leave the start of the track one after the
 *  other, the first going farthest, and rest where the gates let them. */
export declare function planRun(input: RunInput): Run;
