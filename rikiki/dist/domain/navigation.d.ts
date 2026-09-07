import { type DeckCoords, type DeckOutline, type DeckPosition, type StepsOf } from './deck-outline.js';
/** The author's navigation choices. */
export interface NavigationPolicy {
    /** Wrap around at both ends. */
    readonly loop: boolean;
}
export declare const LINEAR: NavigationPolicy;
/** Bring any position inside the deck · the invariant every verb returns under.
 *  Null for an empty deck, which has no valid position at all. */
export declare function clampPosition(outline: DeckOutline, position: DeckPosition, stepsOf: StepsOf): DeckPosition | null;
/** One step forward, then one slide forward, then wrap if the deck loops.
 *  Null at the very end of a deck that does not loop. */
export declare function advance(outline: DeckOutline, policy: NavigationPolicy, from: DeckPosition, stepsOf: StepsOf): DeckPosition | null;
/** One step back, then into the previous slide AT ITS LAST STEP, then wrap.
 *  Null at the very start of a deck that does not loop. */
export declare function back(outline: DeckOutline, policy: NavigationPolicy, from: DeckPosition, stepsOf: StepsOf): DeckPosition | null;
/** Jump to a slide, at its first step. Out-of-range clamps into the deck. */
export declare function goToSlide(outline: DeckOutline, slide: number, stepsOf: StepsOf): DeckPosition | null;
/** Jump to a chapter coordinate, at the target slide's first step. */
export declare function goToCoords(outline: DeckOutline, coords: DeckCoords, stepsOf: StepsOf): DeckPosition | null;
export declare function first(outline: DeckOutline, stepsOf: StepsOf): DeckPosition | null;
export declare function last(outline: DeckOutline, stepsOf: StepsOf): DeckPosition | null;
/** True when two positions name the same place · lets a caller skip the work
 *  of applying a move that changes nothing. */
export declare function samePosition(a: DeckPosition | null, b: DeckPosition | null): boolean;
