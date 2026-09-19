import type { DeckOutline, DeckPosition, StepsOf } from '../domain/deck-outline.js';
import type { NavigationPolicy } from '../domain/navigation.js';
/** What the deck should do · an intent, not a mutation. */
export type DeckIntent = 'none' | 'close-overview' | 'open-overview' | 'clear-blank' | 'blank-black' | 'blank-white' | 'zoom-in' | 'zoom-out' | 'zoom-reset' | 'toggle-help' | 'close-help' | 'toggle-presenter' | 'first' | 'last' | 'advance' | 'back' | 'next-chapter' | 'prev-chapter' | 'next-in-chapter' | 'prev-in-chapter';
/** Everything the keymap needs to know · a snapshot, so it stays pure. */
export interface KeyState {
    readonly key: string;
    /** The overview overlay is open · it swallows almost everything. */
    readonly overview: boolean;
    /** The screen is blanked · any key restores it and does nothing else. */
    readonly blanked: boolean;
    readonly zoomEnabled: boolean;
    /** Already magnified beyond fit · only then does `0` mean "reset". */
    readonly zoomed: boolean;
    readonly twoD: boolean;
}
export interface KeyDecision {
    readonly intent: DeckIntent;
    /** Whether the engine should call preventDefault · preserved key by key,
     *  because the browser's own behaviour for Escape, Home/End and `?` is
     *  deliberately left alone. */
    readonly preventDefault: boolean;
}
/** Map a key press to an intent.
 *
 *  Order matters and mirrors what a presenter expects: an open overlay wins
 *  over everything, a blanked screen wins over navigation, and zoom keys are
 *  only claimed when zoom is actually available. */
export declare function keyIntent(state: KeyState): KeyDecision;
/** Which intents are a move, and therefore resolve to a position. */
export type MoveIntent = Extract<DeckIntent, 'first' | 'last' | 'advance' | 'back' | 'next-chapter' | 'prev-chapter' | 'next-in-chapter' | 'prev-in-chapter'>;
export declare const isMove: (intent: DeckIntent) => intent is MoveIntent;
/**
 * Where a move intent lands.
 *
 * The four 2D intents fall back to linear navigation at the edges, on purpose:
 * holding ArrowDown walks the whole deck rather than stopping dead at every
 * chapter boundary, and ArrowRight past the last chapter still advances.
 */
export declare function resolveMove(intent: MoveIntent, outline: DeckOutline, policy: NavigationPolicy, from: DeckPosition, stepsOf: StepsOf): DeckPosition | null;
