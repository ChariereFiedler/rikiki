/** More than eight tokens a side is a queue nobody counts, and no longer a story. */
export declare const MAX_TOKENS = 8;
export declare const DEFAULT_PASSED = 3;
export declare const DEFAULT_BLOCKED = 3;
export declare const TOKEN_RADIUS = 10;
export declare const GATE_WIDTH = 56;
/** The gate stands this far beyond the first and the last lane. */
export declare const GATE_OVERHANG = 14;
export declare const HEADER_HEIGHT = 72;
/** A lane is its label, and a note under it when any lane has one. */
export declare const LANE_PITCH = 88;
export declare const LANE_PITCH_WITH_NOTE = 116;
export interface Count {
    value: number;
    /** False when the author wrote something that is not a whole number of
     *  tokens, from 0 to the most a side holds · the value then is the default. */
    valid: boolean;
}
/** A token count as an author writes it · absent is the default, and a word, a
 *  fraction or a number past the maximum is reported by the lint, not drawn. */
export declare function readCount(attribute: string | null | undefined, fallback: number): Count;
export interface FrameInput {
    lanes: number;
    /** A gate label or a trigger sits above the lanes. */
    hasHeader: boolean;
    hasNotes: boolean;
    /** The widest lane label, icon and note included, as measured. */
    labelWidth: number;
    /** The widest end-of-lane tag, as measured · 0 when no lane has one. */
    tagWidth: number;
    /** The canvas width in drawing units · the scene's, 1600 unless composed. */
    width?: number;
}
export interface Frame {
    height: number;
    /** The vertical centre of each lane. */
    laneYs: number[];
    headerY: number;
    trackLeft: number;
    trackRight: number;
    /** Where an end-of-lane tag starts · null when there is none. */
    tagX: number | null;
    tagWidth: number;
    gate: {
        x: number;
        y: number;
        width: number;
        height: number;
        centre: number;
    };
}
export declare function lanesFrame(input: FrameInput): Frame;
/** Between the trigger, the connector and the gate's label. */
export declare const HEADER_GAP = 28;
export interface TriggerSpan {
    /** The width the trigger may take, from the start of the track · zero or less
     *  when the gate's label reaches back that far. */
    room: number;
    /** Where the connector's arrow ends, a gap before the gate's label. */
    tip: number;
}
/** The trigger's place in the header · from the start of the track to the gate's
 *  label, less a gap each side of the connector that leads to it. No floor: a
 *  room the header does not have would set the trigger under the gate's label,
 *  so a gate standing close to the track's start leaves none, and a trigger
 *  then does not fit and is reported. `gateLabelWidth` is 0 without a label. */
export declare function triggerSpan(frame: Frame, gateLabelWidth: number): TriggerSpan;
export type TokenKind = 'passed' | 'blocked';
export interface Token {
    kind: TokenKind;
    /** Where it rests, and so where it is drawn · the final state is the picture. */
    x: number;
    /** How far left of its resting place it starts, as a translate. */
    back: number;
    delay: number;
    duration: number;
    /** When it crosses the gate's centre, or reaches its queue · for the gate to wait for. */
    crosses: number;
}
/** Units a token covers in a second. */
export declare const SPEED = 560;
/** Resting places on the far side of the gate, nearest the gate first · packed
 *  as tight as the tokens allow when they would not all fit. */
export declare function passedPlaces(count: number, frame: Frame): number[];
/** Resting places on the near side, a queue against the gate · the first token
 *  to arrive is the one touching it. */
export declare function blockedPlaces(count: number, frame: Frame): number[];
/** The tokens of lane `lane`, out of `lanes` · the same story in every lane, each
 *  one a beat after the one above it so they do not move as a block. */
export declare function laneTokens(passed: number, blocked: number, frame: Frame, lane: number, lanes?: number): Token[];
/** When the gate comes down · after the last token that passes has crossed it,
 *  and before the first one that stops has reached it. */
export declare function gateCloses(lanes: Token[][]): number;
/** The gate drops in this long. */
export declare const CLOSE_DURATION = 0.3;
