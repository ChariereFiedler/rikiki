// ════════════════════════════════════════════════════════════════
// RIKIKI · application · what a key press means
//
// The keymap was a 100-line if/else inside the engine's event handler, so the
// only way to ask "what does ArrowUp do in a 2D deck at the top of a chapter?"
// was to open a browser. It is a decision, not an effect: it belongs here.
//
// Depends on the domain. Never on the DOM · the caller passes a plain snapshot
// of the event, not the event.
// ════════════════════════════════════════════════════════════════

import type { DeckOutline, DeckPosition, StepsOf } from '../domain/deck-outline.js';
import { coordsOf } from '../domain/deck-outline.js';
import type { NavigationPolicy } from '../domain/navigation.js';
import { advance, back, first, goToCoords, last } from '../domain/navigation.js';

/** What the deck should do · an intent, not a mutation. */
export type DeckIntent =
  | 'none'
  | 'close-overview'
  | 'open-overview'
  | 'clear-blank'
  | 'blank-black'
  | 'blank-white'
  | 'zoom-in'
  | 'zoom-out'
  | 'zoom-reset'
  | 'toggle-help'
  | 'close-help'
  | 'toggle-presenter'
  | 'first'
  | 'last'
  | 'advance'
  | 'back'
  | 'next-chapter'
  | 'prev-chapter'
  | 'next-in-chapter'
  | 'prev-in-chapter';

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

const NOTHING: KeyDecision = { intent: 'none', preventDefault: false };
const decide = (intent: DeckIntent, preventDefault = true): KeyDecision => ({
  intent,
  preventDefault,
});

const is = (key: string, ...accepted: string[]): boolean =>
  accepted.some((a) => a.toLowerCase() === key.toLowerCase());

/** Map a key press to an intent.
 *
 *  Order matters and mirrors what a presenter expects: an open overlay wins
 *  over everything, a blanked screen wins over navigation, and zoom keys are
 *  only claimed when zoom is actually available. */
export function keyIntent(state: KeyState): KeyDecision {
  const { key } = state;

  // An open overview swallows the deck · only O, Esc and Enter leave it.
  if (state.overview) {
    return is(key, 'Escape', 'o', 'Enter') ? decide('close-overview') : NOTHING;
  }

  // A blanked screen restores on ANY key · the clicker sends whatever it sends.
  if (state.blanked) return decide('clear-blank');
  if (is(key, '.', 'b')) return decide('blank-black');
  if (is(key, ',', 'w')) return decide('blank-white');

  // Zoom keys are only claimed when zoom is available, so a deck with `no-zoom`
  // leaves +/- to the browser's own page zoom.
  if (state.zoomEnabled && (key === '+' || key === '=')) return decide('zoom-in');
  if (state.zoomEnabled && key === '-') return decide('zoom-out');
  if (key === '0' && state.zoomed) return decide('zoom-reset');

  // These three keep the browser's default on purpose.
  if (is(key, '?', 'h')) return decide('toggle-help', false);
  if (key === 'Escape') return decide('close-help', false);
  if (key === 'Home') return decide('first', false);
  if (key === 'End') return decide('last', false);

  if (is(key, 'o')) return decide('open-overview');
  if (is(key, 'p')) return decide('toggle-presenter');

  if (key === ' ' || key === 'PageDown') return decide('advance');
  if (key === 'PageUp') return decide('back');

  if (state.twoD) {
    if (key === 'ArrowRight') return decide('next-chapter');
    if (key === 'ArrowLeft') return decide('prev-chapter');
    if (key === 'ArrowDown') return decide('next-in-chapter');
    if (key === 'ArrowUp') return decide('prev-in-chapter');
    return NOTHING;
  }
  if (key === 'ArrowRight' || key === 'ArrowDown') return decide('advance');
  if (key === 'ArrowLeft' || key === 'ArrowUp') return decide('back');
  return NOTHING;
}

/** Which intents are a move, and therefore resolve to a position. */
export type MoveIntent = Extract<
  DeckIntent,
  | 'first'
  | 'last'
  | 'advance'
  | 'back'
  | 'next-chapter'
  | 'prev-chapter'
  | 'next-in-chapter'
  | 'prev-in-chapter'
>;

const MOVES = new Set<DeckIntent>([
  'first',
  'last',
  'advance',
  'back',
  'next-chapter',
  'prev-chapter',
  'next-in-chapter',
  'prev-in-chapter',
]);

export const isMove = (intent: DeckIntent): intent is MoveIntent => MOVES.has(intent);

/**
 * Where a move intent lands.
 *
 * The four 2D intents fall back to linear navigation at the edges, on purpose:
 * holding ArrowDown walks the whole deck rather than stopping dead at every
 * chapter boundary, and ArrowRight past the last chapter still advances.
 */
export function resolveMove(
  intent: MoveIntent,
  outline: DeckOutline,
  policy: NavigationPolicy,
  from: DeckPosition,
  stepsOf: StepsOf,
): DeckPosition | null {
  const linearNext = () => advance(outline, policy, from, stepsOf);
  const linearPrev = () => back(outline, policy, from, stepsOf);
  const { chapter, index } = coordsOf(outline, from.slide);

  switch (intent) {
    case 'first':
      return first(outline, stepsOf);
    case 'last':
      return last(outline, stepsOf);
    case 'advance':
      return linearNext();
    case 'back':
      return linearPrev();
    case 'next-chapter':
      return chapter + 1 < outline.chapters.length
        ? goToCoords(outline, { chapter: chapter + 1, index: 0 }, stepsOf)
        : linearNext();
    case 'prev-chapter':
      return chapter > 0
        ? goToCoords(outline, { chapter: chapter - 1, index: 0 }, stepsOf)
        : linearPrev();
    case 'next-in-chapter': {
      const here = outline.chapters[chapter];
      return here && index + 1 < here.length
        ? goToCoords(outline, { chapter, index: index + 1 }, stepsOf)
        : linearNext();
    }
    case 'prev-in-chapter':
      return index > 0 ? goToCoords(outline, { chapter, index: index - 1 }, stepsOf) : linearPrev();
  }
}
