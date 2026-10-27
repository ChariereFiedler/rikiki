import { type DgIssue, type DgNode } from './model.js';
import { type IntentName } from './intent-specs.js';
export { INTENTS, INTENT_NAMES, REFUSED_BECAUSE, SECONDARIES, type CompiledIntent, type IntCode, type IntentFamily, type IntentName, type IntentSpec, type Pitfall, type RoleSpec, } from './intent-specs.js';
export { type ProofFrame, proveIntent } from './intent-prove.js';
export interface IntentMatch {
    name: IntentName;
    /** The cues found in the sentence. */
    cues: string[];
    /** Words matched · a cue of two words weighs two. */
    score: number;
}
/** The cues of a list a sentence holds · how `rikiki intent` and `rikiki recipe` read
 *  a sentence. Cues are written folded (lower case, no accent). */
export declare function cuesIn(sentence: string, cues: readonly string[]): string[];
/** The intents a sentence points at, the closest first · the same sentence, the
 *  same answer. Ties keep the registry's order. */
export declare function closestIntents(sentence: string): IntentMatch[];
/** What the proof needs to read the drawing back · which mark plays which part. */
export interface IntentPlan {
    main: IntentName;
    also: IntentName[];
    /** The names of the marks that play each role, as compiled. */
    roles: Record<string, string[]>;
    /** The amount each mark says in its `value`, by name · rates, sums, wholes. */
    rates: Record<string, number>;
    /** The marks inside a group that plays a role, in order, by the group's name ·
     *  the steps of a branch. */
    inside: Record<string, string[]>;
}
/** A rate as an author writes it in a `value` · `6 / h`, `1 200 par jour`. */
export declare function rateOf(node: DgNode): number;
/** Compile a diagram written as an intent into a tree of layouts · the hook
 *  `parseDiagram` takes. A diagram without `intent` is returned as it is. */
export declare function compileIntent(tree: {
    attrs: Record<string, string>;
    children: DgNode[];
}, fresh: () => number): {
    attrs: Record<string, string>;
    children: DgNode[];
    issues: DgIssue[];
    intent?: IntentPlan;
};
