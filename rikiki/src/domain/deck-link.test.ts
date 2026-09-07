import { describe, expect, it } from 'vitest';
import { formatHash, parseHash } from './deck-link.js';

// Deep links · 1-based in the URL, 0-based in the model. The grammar depends on
// the navigation model, so both directions take the same `twoD` flag: `#2.3` is
// "slide 2, step 3" in a linear deck and "chapter 2, slide 3" in a 2D one.

describe('parseHash · linear', () => {
  it('reads a slide', () => {
    expect(parseHash('#4', false)).toEqual({ kind: 'slide', slide: 3, step: 0 });
  });

  it('reads a slide and a step', () => {
    expect(parseHash('#4.2', false)).toEqual({ kind: 'slide', slide: 3, step: 2 });
  });

  it('ignores a hash that is not ours', () => {
    // A host page anchor must stay the host's · this is what stops an embedded
    // deck from hijacking `#section-3`.
    expect(parseHash('#section-3', false)).toBeNull();
    expect(parseHash('', false)).toBeNull();
    expect(parseHash('#', false)).toBeNull();
    expect(parseHash('#4.2.1', false)).toBeNull();
    expect(parseHash('#-1', false)).toBeNull();
  });
});

describe('parseHash · 2D', () => {
  it('reads a chapter coordinate', () => {
    expect(parseHash('#2.3', true)).toEqual({
      kind: 'coords',
      coords: { chapter: 1, index: 2 },
      step: 0,
    });
  });

  it('reads a coordinate with a step', () => {
    expect(parseHash('#2.3s1', true)).toEqual({
      kind: 'coords',
      coords: { chapter: 1, index: 2 },
      step: 1,
    });
  });

  it('still reads a bare slide number linearly', () => {
    expect(parseHash('#5', true)).toEqual({ kind: 'slide', slide: 4, step: 0 });
  });

  it('reads the same string differently from a linear deck · on purpose', () => {
    expect(parseHash('#2.3', true)).not.toEqual(parseHash('#2.3', false));
  });
});

describe('formatHash', () => {
  it('writes a slide, and omits step 0', () => {
    expect(formatHash({ slide: 3, step: 0 }, { twoD: false })).toBe('#4');
    expect(formatHash({ slide: 3, step: 2 }, { twoD: false })).toBe('#4.2');
  });

  it('writes the 2D grammar for a 2D deck', () => {
    expect(
      formatHash({ slide: 3, step: 0 }, { twoD: true, coords: { chapter: 1, index: 2 } }),
    ).toBe('#2.3');
    expect(
      formatHash({ slide: 3, step: 1 }, { twoD: true, coords: { chapter: 1, index: 2 } }),
    ).toBe('#2.3s1');
  });

  it('falls back to the linear grammar when no coordinate is supplied', () => {
    expect(formatHash({ slide: 3, step: 1 }, { twoD: true })).toBe('#4.1');
  });
});

describe('round trip · what is written must read back the same', () => {
  it('holds for a linear deck, with and without steps', () => {
    for (const position of [
      { slide: 0, step: 0 },
      { slide: 7, step: 0 },
      { slide: 7, step: 3 },
    ]) {
      expect(parseHash(formatHash(position, { twoD: false }), false)).toEqual({
        kind: 'slide',
        slide: position.slide,
        step: position.step,
      });
    }
  });

  it('holds for a 2D deck with steps · it did not before', () => {
    // The write side used to emit the linear form even in 2D, so `#3.1` was
    // written for "slide 3, step 1" and read back as "chapter 3, slide 1".
    const coords = { chapter: 2, index: 0 };
    const hash = formatHash({ slide: 5, step: 1 }, { twoD: true, coords });
    expect(parseHash(hash, true)).toEqual({ kind: 'coords', coords, step: 1 });
  });
});
