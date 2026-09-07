import { describe, expect, it } from 'vitest';
import { EMPTY_OUTLINE, coordsOf, outlineOf, slideAt, supportsTwoD } from './deck-outline.js';
import type { DeckOutline, StepsOf } from './deck-outline.js';
import {
  LINEAR,
  advance,
  back,
  clampPosition,
  first,
  goToCoords,
  goToSlide,
  last,
  samePosition,
} from './navigation.js';

// The navigation model runs without a browser, which is the whole point of
// extracting it. Every rule the engine used to express as a sequence of DOM
// mutations is stated here as one question with one answer.

const LOOP = { loop: true };
const noSteps: StepsOf = () => 0;
/** Slide 1 has 2 steps, everything else has none. */
const stepsOnSlide1: StepsOf = (slide) => (slide === 1 ? 2 : 0);

const flat = (n: number): DeckOutline => outlineOf(Array(n).fill('deck-feature'));

describe('outline', () => {
  it('puts every slide in exactly one chapter', () => {
    const outline = outlineOf(['deck-cover', 'deck-feature', 'deck-section', 'deck-feature']);
    expect(outline.slideCount).toBe(4);
    expect(outline.chapters).toEqual([
      { start: 0, length: 2 },
      { start: 2, length: 2 },
    ]);
  });

  it('opens a chapter on the first slide whatever its tag', () => {
    expect(outlineOf(['deck-feature']).chapters).toEqual([{ start: 0, length: 1 }]);
  });

  it('is case-insensitive about the section tag', () => {
    expect(outlineOf(['deck-feature', 'DECK-SECTION']).chapters).toHaveLength(2);
  });

  it('describes an empty deck without inventing a chapter', () => {
    expect(outlineOf([])).toEqual(EMPTY_OUTLINE);
  });
});

describe('2D navigation is opt-in AND structural', () => {
  const sectioned = outlineOf(['deck-section', 'deck-feature', 'deck-section', 'deck-feature']);

  it('needs the opt-in', () => {
    expect(supportsTwoD(sectioned, false)).toBe(false);
    expect(supportsTwoD(sectioned, true)).toBe(true);
  });

  it('needs more than one chapter', () => {
    expect(supportsTwoD(outlineOf(['deck-feature', 'deck-feature']), true)).toBe(false);
  });

  it('needs a chapter with more than one slide', () => {
    // Two chapters of one slide each is a linear deck wearing sections.
    expect(supportsTwoD(outlineOf(['deck-section', 'deck-section']), true)).toBe(false);
  });
});

describe('coordinates', () => {
  const outline = outlineOf(['deck-section', 'deck-feature', 'deck-section', 'deck-feature']);

  it('round-trips a slide through its coordinate', () => {
    for (let slide = 0; slide < outline.slideCount; slide++) {
      expect(slideAt(outline, coordsOf(outline, slide))).toBe(slide);
    }
  });

  it('clamps a chapter that no longer exists to the nearest one', () => {
    // A deep link to a removed chapter lands on the closest valid slide, never
    // back at slide 0.
    expect(slideAt(outline, { chapter: 99, index: 0 })).toBe(2);
    expect(slideAt(outline, { chapter: -5, index: 0 })).toBe(0);
  });

  it('clamps an index past the end of its chapter', () => {
    expect(slideAt(outline, { chapter: 0, index: 99 })).toBe(1);
  });

  it('has no slide to offer on an empty deck', () => {
    expect(slideAt(EMPTY_OUTLINE, { chapter: 0, index: 0 })).toBeNull();
  });
});

describe('advance', () => {
  it('takes the next step before the next slide', () => {
    expect(advance(flat(3), LINEAR, { slide: 1, step: 0 }, stepsOnSlide1)).toEqual({
      slide: 1,
      step: 1,
    });
  });

  it('moves to the next slide once the steps are exhausted', () => {
    expect(advance(flat(3), LINEAR, { slide: 1, step: 2 }, stepsOnSlide1)).toEqual({
      slide: 2,
      step: 0,
    });
  });

  it('stops at the end of a deck that does not loop', () => {
    expect(advance(flat(3), LINEAR, { slide: 2, step: 0 }, noSteps)).toBeNull();
  });

  it('wraps to the start when the deck loops', () => {
    expect(advance(flat(3), LOOP, { slide: 2, step: 0 }, noSteps)).toEqual({ slide: 0, step: 0 });
  });

  it('does nothing on an empty deck', () => {
    expect(advance(EMPTY_OUTLINE, LOOP, { slide: 0, step: 0 }, noSteps)).toBeNull();
  });
});

describe('back', () => {
  it('takes the previous step first', () => {
    expect(back(flat(3), LINEAR, { slide: 1, step: 2 }, stepsOnSlide1)).toEqual({
      slide: 1,
      step: 1,
    });
  });

  it('lands on the PREVIOUS slide at its last step, in one decision', () => {
    // The regression this model exists for · slide and step are decided
    // together, so a deferred navigation cannot reset the step to 0 behind it.
    expect(back(flat(3), LINEAR, { slide: 2, step: 0 }, stepsOnSlide1)).toEqual({
      slide: 1,
      step: 2,
    });
  });

  it('lands on the previous slide at step 0 when that slide has no steps', () => {
    expect(back(flat(3), LINEAR, { slide: 1, step: 0 }, noSteps)).toEqual({ slide: 0, step: 0 });
  });

  it('stops at the start of a deck that does not loop', () => {
    expect(back(flat(3), LINEAR, { slide: 0, step: 0 }, noSteps)).toBeNull();
  });

  it('wraps to the LAST STEP of the last slide when the deck loops', () => {
    expect(back(flat(3), LOOP, { slide: 0, step: 0 }, () => 4)).toEqual({ slide: 2, step: 4 });
  });
});

describe('jumps', () => {
  it('goToSlide starts the target at its first step', () => {
    expect(goToSlide(flat(3), 2, stepsOnSlide1)).toEqual({ slide: 2, step: 0 });
  });

  it('goToSlide clamps out of range instead of failing', () => {
    expect(goToSlide(flat(3), 99, noSteps)).toEqual({ slide: 2, step: 0 });
    expect(goToSlide(flat(3), -4, noSteps)).toEqual({ slide: 0, step: 0 });
  });

  it('goToCoords resolves through the chapter structure', () => {
    const outline = outlineOf(['deck-section', 'deck-feature', 'deck-section', 'deck-feature']);
    expect(goToCoords(outline, { chapter: 1, index: 1 }, noSteps)).toEqual({ slide: 3, step: 0 });
  });

  it('first and last are the ends of the deck', () => {
    expect(first(flat(3), noSteps)).toEqual({ slide: 0, step: 0 });
    expect(last(flat(3), noSteps)).toEqual({ slide: 2, step: 0 });
  });

  it('every jump is null on an empty deck', () => {
    expect(goToSlide(EMPTY_OUTLINE, 0, noSteps)).toBeNull();
    expect(goToCoords(EMPTY_OUTLINE, { chapter: 0, index: 0 }, noSteps)).toBeNull();
    expect(first(EMPTY_OUTLINE, noSteps)).toBeNull();
    expect(last(EMPTY_OUTLINE, noSteps)).toBeNull();
  });
});

describe('clampPosition · the invariant every verb returns under', () => {
  it('brings a slide inside the deck', () => {
    expect(clampPosition(flat(3), { slide: 9, step: 0 }, noSteps)).toEqual({ slide: 2, step: 0 });
  });

  it('clamps a step to what the slide actually has', () => {
    // A deep link to a click that no longer exists settles on the last one.
    expect(clampPosition(flat(3), { slide: 1, step: 9 }, stepsOnSlide1)).toEqual({
      slide: 1,
      step: 2,
    });
  });

  it('never returns a negative step', () => {
    expect(clampPosition(flat(3), { slide: 0, step: -3 }, noSteps)).toEqual({ slide: 0, step: 0 });
  });

  it('treats NaN as the low bound rather than propagating it', () => {
    expect(clampPosition(flat(3), { slide: Number.NaN, step: Number.NaN }, noSteps)).toEqual({
      slide: 0,
      step: 0,
    });
  });
});

describe('samePosition', () => {
  it('compares both halves', () => {
    expect(samePosition({ slide: 1, step: 2 }, { slide: 1, step: 2 })).toBe(true);
    expect(samePosition({ slide: 1, step: 2 }, { slide: 1, step: 3 })).toBe(false);
  });

  it('handles the null a verb returns for "no move"', () => {
    expect(samePosition(null, null)).toBe(true);
    expect(samePosition(null, { slide: 0, step: 0 })).toBe(false);
  });
});

describe('sequences · the properties that must hold over many moves', () => {
  it('advancing to the end then back returns to the start, step for step', () => {
    const outline = flat(3);
    const steps: StepsOf = () => 1;
    const visited: string[] = [];
    let at: { slide: number; step: number } | null = { slide: 0, step: 0 };
    while (at) {
      visited.push(`${at.slide}.${at.step}`);
      at = advance(outline, LINEAR, at, steps);
    }
    expect(visited).toEqual(['0.0', '0.1', '1.0', '1.1', '2.0', '2.1']);

    const backwards: string[] = [];
    let cursor: { slide: number; step: number } | null = { slide: 2, step: 1 };
    while (cursor) {
      backwards.push(`${cursor.slide}.${cursor.step}`);
      cursor = back(outline, LINEAR, cursor, steps);
    }
    expect(backwards).toEqual([...visited].reverse());
  });

  it('a loop never terminates and never leaves the deck', () => {
    const outline = flat(2);
    let at = { slide: 0, step: 0 };
    for (let i = 0; i < 20; i++) {
      const next = advance(outline, LOOP, at, noSteps);
      expect(next, 'a looping deck always has a next position').not.toBeNull();
      at = next!;
      expect(at.slide).toBeGreaterThanOrEqual(0);
      expect(at.slide).toBeLessThan(outline.slideCount);
    }
  });
});
