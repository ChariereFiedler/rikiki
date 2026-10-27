import type { IntentPlan } from './intent.js';
import type { DiagramLayout, LMeter } from './layout.js';
import { type DgIssue } from './model.js';
import type { Timing } from './motion.js';
/** One click's drawing, and when its parts came in · what the proof reads. */
export interface ProofFrame {
    drawn: DiagramLayout;
    stage: number;
    /** The click each item, link and note appears on, by cue id. */
    appears?: Map<string, number>;
    timing?: Map<string, Timing>;
}
/** A crowd under this many times its unit is not an order of magnitude. */
export declare const MIN_SCALE_RATIO = 10;
/** A drift ends at least this many times wider than it starts, or it is not seen. */
export declare const MIN_DRIFT_GROWTH = 2;
/** A bar drawn this many times longer or shorter than its value says lies. */
export declare const MAX_LIE_FACTOR = 1.1;
/** The click a meter first stands on the other side of its line, -1 when never. */
export declare function crossingOf(meter: LMeter): number;
/** Read the drawing back and say where it does not demonstrate its intent · the
 *  main one, each secondary, and how they are joined. */
export declare function proveIntent(plan: IntentPlan, frames: ProofFrame[]): DgIssue[];
