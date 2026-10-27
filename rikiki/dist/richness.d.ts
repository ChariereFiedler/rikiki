import { type Motif } from './deck-motifs.js';
import type { DiagramSignature } from './diversity.js';
import { type InkModel } from './ill-rules.js';
/** Every code the richness says · `rikiki check` lists, selects and configures them
 *  by this table (bin/lib/check-registry.mjs). */
export declare const RICHNESS_CODES: readonly ["ILL_GENERIC", "ILL_FLAT_PAINT", "ILL_MODEL_REPEAT"];
export type RichnessCode = (typeof RICHNESS_CODES)[number];
export declare const RICHNESS_CRITERIA: readonly ["content", "demonstration", "story", "paint", "result"];
export type RichnessCriterion = (typeof RICHNESS_CRITERIA)[number];
/** Every threshold, with where it comes from. */
export declare const RICHNESS_LIMITS: Readonly<{
    /** What a criterion is worth when met, and half met · five of them make 100. */
    full: 20;
    half: 10;
    /** Two precise facts at least · a brief of `rikiki recipe` needs as many · and of
     *  two kinds (when, which, how much): rates alone fit any case. */
    facts: 2;
    factKinds: 2;
    /** Two devices of relation at least, articulated · one is a list of boxes. */
    devices: 2;
    /** Two fills this close on every channel (0 to 255) are one paint · the role
     *  surfaces of a theme are pale tints a dozen apart, so only a rounding is one. */
    sameColour: 4;
    sameOpacity: 0.05;
    /** A filled shape over this share of the frame is a surface, not a dot. */
    surfaceShare: 0.01;
    /** The paints a drawing needs at most to tell its roles apart. */
    treatments: 3;
    /** The same graphic model a third time in five illustrated slides is a repeat. */
    repeatUses: 3;
    repeatWindow: 5;
}>;
/** A value that says something precise · a figure (a date, an hour, a count) or an
 *  identifier (`is_active()`, `v2.4`, `pg-01`, `0042_tva`, `#42`). */
export declare const PRECISE_VALUE: RegExp;
/** Words an author leaves when nothing precise was written · they say nothing. */
export declare const GENERIC_WORDS: RegExp;
export interface CriterionScore {
    /** 0, 10 or 20 · null when the criterion does not apply to this drawing. */
    points: number | null;
    measurement: Record<string, number | string | boolean | string[]>;
    /** How to earn the rest, by name · absent when the criterion is met. */
    fix?: {
        action: string;
        [detail: string]: unknown;
    };
}
export interface Richness {
    /** 0 to 100 over the criteria that apply. */
    score: number;
    /** The graphic model the drawing is made on · what ILL_MODEL_REPEAT compares. */
    model: string;
    criteria: Record<RichnessCriterion, CriterionScore>;
}
export interface RichnessInput {
    model: InkModel;
    /** What a diagram says it is made of · null for a drawing that says nothing. */
    signature?: DiagramSignature | null;
    /** The slide names a source (`deck-source`) · its fidelity is for a reviewer. */
    sourced?: boolean;
    /** The element that drew it, for a drawing that says nothing of itself. */
    tag?: string;
}
/** The graphic model a drawing is made on · its distinctive layouts and marks, or the
 *  element that drew it when it says nothing of itself. */
export declare function modelOf(signature: DiagramSignature | null | undefined, tag?: string): string;
/** How rich a drawing is, criterion by criterion. */
export declare function measureRichness(input: RichnessInput): Richness;
export interface RichnessIssue {
    code: RichnessCode;
    severity: 'warning';
    message: string;
    measurement: Record<string, unknown>;
    fix: {
        action: string;
        [detail: string]: unknown;
    };
}
/** What a drawing's richness says, when asked · nothing precise, roles painted alike. */
export declare function richnessIssues(richness: Richness): RichnessIssue[];
/** One use of a graphic model · and its motif: a motif that progresses keeps its
 *  marks and moves on (deck-motifs.ts). */
export interface ModelUse extends Motif {
    slide: number;
    slideId?: string | null;
    model: string;
}
/** The words of a drawing, by the mark that wrote them. */
export declare function wordsByMark(model: InkModel): Record<string, string>;
/** The third use (or more) of one graphic model within five illustrated slides,
 *  unless it is a motif that progresses · one warning per use, on its slide. */
export declare function modelRepeatIssues(uses: readonly ModelUse[]): RichnessIssue[];
