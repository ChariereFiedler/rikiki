export declare const INTENT_NAMES: readonly ["cause", "barrier", "bottleneck", "accumulate", "transform", "feedback", "scale", "contain", "parallel", "propagate", "threshold", "tradeoff", "drift", "compare", "partition", "merge"];
export type IntentName = (typeof INTENT_NAMES)[number];
export type IntentFamily = 'flow' | 'structure' | 'quantity' | 'time' | 'decision';
/** Every code an intent finding carries · `rikiki check` lists, selects and
 *  configures them by this table (bin/lib/check-registry.mjs). */
export declare const INT_CODES: readonly ["INT_INTENT_UNKNOWN", "INT_COMPOSE_MANY", "INT_COMPOSE_INVALID", "INT_COMPOSE_APART", "INT_ROLE_NO_INTENT", "INT_ROLE_NONE", "INT_ROLE_UNKNOWN", "INT_ROLE_KIND", "INT_ROLE_MISSING", "INT_ROLE_EXTRA", "INT_LAYOUT_FIXED", "INT_VALUE_MISSING", "INT_FOCAL_MULTIPLE", "INT_FOCAL_OFF_ROLE", "INT_CAUSE_NO_ARROW", "INT_CAUSE_EFFECT_FIRST", "INT_BARRIER_NOT_ACROSS", "INT_BARRIER_NEVER_CLOSES", "INT_BOTTLENECK_NOT_NARROWEST", "INT_BOTTLENECK_NO_QUEUE", "INT_ACCUMULATE_NOT_MONOTONE", "INT_TRANSFORM_NO_PAIR", "INT_TRANSFORM_NO_CHANGE", "INT_FEEDBACK_OPEN", "INT_SCALE_TOO_CLOSE", "INT_CONTAIN_NOT_NESTED", "INT_PARALLEL_NOT_TOGETHER", "INT_PARALLEL_JOIN_EARLY", "INT_PROPAGATE_NOT_REACHED", "INT_PROPAGATE_SKIPS", "INT_THRESHOLD_NEVER_CROSSED", "INT_THRESHOLD_EARLY", "INT_TRADEOFF_ONE_SIDED", "INT_DRIFT_NOT_WIDENING", "INT_COMPARE_LIE", "INT_PARTITION_NOT_WHOLE", "INT_MERGE_APART", "INT_MERGE_NOT_SUM"];
export type IntCode = (typeof INT_CODES)[number];
/** A part an intent asks for · which marks can play it, and how many of them. */
export interface RoleSpec {
    role: string;
    tags: readonly string[];
    min: number;
    max: number;
    says: string;
}
/** A mistake an intent is known for, and the code that names it · with the markup
 *  that makes it, when one diagram shows it. */
export interface Pitfall {
    code: IntCode;
    says: string;
    html?: string;
}
/** What the compiler knows of an intent it places. */
export interface CompiledIntent {
    roles: readonly RoleSpec[];
    /** The role put forward · the gate of a barrier is put forward by its colour. */
    focal: string;
    /** The intents it takes as secondaries (`also`). */
    composes: readonly IntentName[];
    /** A diagram that demonstrates it, with every role filled · `rikiki intent <name>`. */
    skeleton: string;
    pitfalls: readonly Pitfall[];
}
export interface IntentSpec {
    name: IntentName;
    family: IntentFamily;
    /** What the picture demonstrates, in one line. */
    shows: string;
    /** What the picture looks like, in a few words · no two intents look alike. */
    looks: string;
    /** Words of a sentence that point at it · folded: lower case, no accent. */
    cues: readonly string[];
    compiled: CompiledIntent;
}
/** The secondaries an intent may take · a region of its own above (a cause that
 *  drives it) or below (a stock, a line crossed). Every other intent is a whole
 *  picture: composed, it would read as two pictures, so it is a main only. */
export declare const SECONDARIES: readonly IntentName[];
/** Why a pair is refused · what the author is told to do instead. */
export declare const REFUSED_BECAUSE = "only cause (above), accumulate and threshold (below) are ever secondaries, and transform, scale, contain, parallel, tradeoff, drift, compare and partition take none \u00B7 two shapes in one picture read as two pictures: split the slide";
export declare const INTENTS: Readonly<Record<IntentName, IntentSpec>>;
