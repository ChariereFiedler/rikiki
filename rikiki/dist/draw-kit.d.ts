import type { LText } from './layout.js';
import type { Timing } from './motion.js';
/** Where a line's baseline sits, as a share of its size from its top. */
export declare const BASELINE = 0.8;
/** When something moves, as the style its animation reads. */
export declare const at: (t: Timing | undefined) => string;
/** The part of a movement from share `from` to share `to` of it. */
export declare const part: (t: Timing | undefined, from: number, to: number) => Timing | undefined;
/** A text, its lines one under the other · `cls` says its role and its colour. */
export declare function words(t: LText, cls: string, anchor?: 'start' | 'middle', x?: number): import("lit-html").TemplateResult<2>[];
