// ════════════════════════════════════════════════════════════════
// RIKIKI · domain · navigation verbs
//
// Pure. No DOM, no Lit, no globals. See docs/design/adr-001-deck-navigation-domain.md.
//
// Every verb answers one question · "where does the deck go from here?" · with
// a COMPLETE position, or null for "this does nothing". Returning a whole
// position is what keeps slide and step from ever disagreeing: the caller
// applies one value, so there is no window in which they are out of sync.
//
// That window is not hypothetical. The engine used to express "go back into the
// previous slide" as two statements, `goTo(idx)` then `step = maxSteps()`. With
// a plugin that defers navigation (a View Transition), the second statement ran
// against the old slide and the deferred navigation then reset the step to 0.
// ════════════════════════════════════════════════════════════════

import {
  type DeckCoords,
  type DeckOutline,
  type DeckPosition,
  type StepsOf,
  clamp,
  slideAt,
} from './deck-outline.js';

/** The author's navigation choices. */
export interface NavigationPolicy {
  /** Wrap around at both ends. */
  readonly loop: boolean;
}

export const LINEAR: NavigationPolicy = { loop: false };

const isEmpty = (outline: DeckOutline): boolean => outline.slideCount <= 0;

/** Bring any position inside the deck · the invariant every verb returns under.
 *  Null for an empty deck, which has no valid position at all. */
export function clampPosition(
  outline: DeckOutline,
  position: DeckPosition,
  stepsOf: StepsOf,
): DeckPosition | null {
  if (isEmpty(outline)) return null;
  const slide = clamp(position.slide, 0, outline.slideCount - 1);
  const max = Math.max(0, stepsOf(slide));
  return { slide, step: clamp(position.step, 0, max) };
}

/** One step forward, then one slide forward, then wrap if the deck loops.
 *  Null at the very end of a deck that does not loop. */
export function advance(
  outline: DeckOutline,
  policy: NavigationPolicy,
  from: DeckPosition,
  stepsOf: StepsOf,
): DeckPosition | null {
  if (isEmpty(outline)) return null;
  const max = Math.max(0, stepsOf(from.slide));
  if (from.step < max) return { slide: from.slide, step: from.step + 1 };
  if (from.slide < outline.slideCount - 1) return { slide: from.slide + 1, step: 0 };
  if (policy.loop) return { slide: 0, step: 0 };
  return null;
}

/** One step back, then into the previous slide AT ITS LAST STEP, then wrap.
 *  Null at the very start of a deck that does not loop. */
export function back(
  outline: DeckOutline,
  policy: NavigationPolicy,
  from: DeckPosition,
  stepsOf: StepsOf,
): DeckPosition | null {
  if (isEmpty(outline)) return null;
  if (from.step > 0) return { slide: from.slide, step: from.step - 1 };
  if (from.slide > 0) {
    const slide = from.slide - 1;
    return { slide, step: Math.max(0, stepsOf(slide)) };
  }
  if (policy.loop) {
    const slide = outline.slideCount - 1;
    return { slide, step: Math.max(0, stepsOf(slide)) };
  }
  return null;
}

/** Jump to a slide, at its first step. Out-of-range clamps into the deck. */
export function goToSlide(
  outline: DeckOutline,
  slide: number,
  stepsOf: StepsOf,
): DeckPosition | null {
  return clampPosition(outline, { slide, step: 0 }, stepsOf);
}

/** Jump to a chapter coordinate, at the target slide's first step. */
export function goToCoords(
  outline: DeckOutline,
  coords: DeckCoords,
  stepsOf: StepsOf,
): DeckPosition | null {
  const slide = slideAt(outline, coords);
  if (slide === null) return null;
  return clampPosition(outline, { slide, step: 0 }, stepsOf);
}

export function first(outline: DeckOutline, stepsOf: StepsOf): DeckPosition | null {
  return goToSlide(outline, 0, stepsOf);
}

export function last(outline: DeckOutline, stepsOf: StepsOf): DeckPosition | null {
  return goToSlide(outline, outline.slideCount - 1, stepsOf);
}

/** True when two positions name the same place · lets a caller skip the work
 *  of applying a move that changes nothing. */
export function samePosition(a: DeckPosition | null, b: DeckPosition | null): boolean {
  if (a === null || b === null) return a === b;
  return a.slide === b.slide && a.step === b.step;
}
