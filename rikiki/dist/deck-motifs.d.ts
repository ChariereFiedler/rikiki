/** What a drawing says of its place in the deck · `data-motif` on a diagram's svg,
 *  and the words of its named marks, which `rikiki check` reads off the ink. */
export interface Motif {
    /** The words of each mark, by the mark that wrote them. */
    words: Record<string, string>;
    /** The marks it names · the words' marks when it says nothing. */
    names?: string[];
    /** The steps of its act and the one it stands at, from 0. */
    act?: {
        steps: string[];
        at: number;
    } | null;
    /** The id of the slide that answers it · on an incident, its remedy. */
    pair?: string | null;
    /** The slide its camera opens from, and the mark it frames there. */
    zoomFrom?: {
        slide: string;
        mark: string;
    } | null;
}
/** How a drawing moves on from the one before · a step of the act, a wider scope
 *  (more marks around the same ones), other figures, another state. */
export type Progress = 'step' | 'scope' | 'data' | 'state';
export declare const DECK_MOTIF_CODES: readonly ["ILL_PAIR_TARGET", "ILL_PAIR_MARKS", "ILL_ZOOM_FROM_TARGET", "ILL_ACT_DRIFT"];
export type DeckMotifCode = (typeof DECK_MOTIF_CODES)[number];
export declare const MOTIF_LIMITS: Readonly<{
    /** Two drawings are one motif when they share this share of the marks of the
     *  smaller · a remedy keeps as much of its incident. */
    shared: 0.5;
}>;
/** How `after` moves on from `before` · empty when it is not the same motif, or is
 *  the same picture again. */
export declare function progressOf(before: Motif | null | undefined, after: Motif | null | undefined): Progress[];
export interface MotifEntry {
    slide: number;
    slideId?: string | null;
    element?: string;
    motif?: Motif | null;
}
export interface MotifIssue {
    code: DeckMotifCode;
    severity: 'error' | 'warning';
    slide: number;
    slideId: string | null;
    element?: string;
    message: string;
    measurement: Record<string, unknown>;
    fix: {
        action: string;
        [detail: string]: unknown;
    };
}
/** What the motifs of a deck declare wrong · `partial` when only some slides were
 *  walked, so a slide that was not is not called missing. */
export declare function deckMotifIssues(entries: readonly MotifEntry[], { partial }?: {
    partial?: boolean;
}): MotifIssue[];
