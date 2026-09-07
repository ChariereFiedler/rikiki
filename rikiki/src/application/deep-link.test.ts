import { describe, expect, it } from 'vitest';
import { outlineOf } from '../domain/deck-outline.js';
import type { StepsOf } from '../domain/deck-outline.js';
import type { LocationPort } from './deep-link.js';
import { publishDeepLink, readDeepLink } from './deep-link.js';

// Deep-link rules, tested without a browser · the URL is a port, so a plain
// object stands in for `location` and `history`.

/** A URL that records what was written to it. */
function fakeLocation(initial = ''): LocationPort & { hash: string; writes: string[] } {
  return {
    hash: initial,
    writes: [],
    read() {
      return this.hash;
    },
    write(hash: string) {
      this.hash = hash;
      this.writes.push(hash);
    },
  };
}

const linear = outlineOf(['deck-cover', 'deck-feature', 'deck-feature', 'deck-feature']);
const sectioned = outlineOf([
  'deck-section',
  'deck-feature',
  'deck-section',
  'deck-feature',
  'deck-feature',
]);

const noSteps: StepsOf = () => 0;
const threeSteps: StepsOf = () => 3;

const ctx = (over: Partial<Parameters<typeof readDeepLink>[1]> = {}) => ({
  outline: linear,
  twoD: false,
  stepsOf: noSteps,
  ownsUrl: true,
  ...over,
});

describe('reading a deep link', () => {
  it('resolves a slide number', () => {
    expect(readDeepLink(fakeLocation('#3'), ctx())).toEqual({ slide: 2, step: 0 });
  });

  it('resolves a slide and a step', () => {
    expect(readDeepLink(fakeLocation('#3.2'), ctx({ stepsOf: threeSteps }))).toEqual({
      slide: 2,
      step: 2,
    });
  });

  it('resolves a 2D coordinate through the outline', () => {
    const at = readDeepLink(
      fakeLocation('#2.2'),
      ctx({ outline: sectioned, twoD: true, stepsOf: noSteps }),
    );
    expect(at).toEqual({ slide: 3, step: 0 });
  });

  it('ignores a fragment that is not a deck link', () => {
    // The host page's own anchor · this is what keeps an embedded deck from
    // hijacking `#introduction`.
    expect(readDeepLink(fakeLocation('#introduction'), ctx())).toBeNull();
    expect(readDeepLink(fakeLocation(''), ctx())).toBeNull();
  });

  it('reads nothing at all when the deck does not own the URL', () => {
    expect(readDeepLink(fakeLocation('#3'), ctx({ ownsUrl: false }))).toBeNull();
  });

  it('clamps a slide past the end of the deck', () => {
    expect(readDeepLink(fakeLocation('#99'), ctx())).toEqual({ slide: 3, step: 0 });
  });

  it('clamps a step to what the slide has', () => {
    expect(readDeepLink(fakeLocation('#3.9'), ctx({ stepsOf: threeSteps }))).toEqual({
      slide: 2,
      step: 3,
    });
  });
});

describe('the cold-load window', () => {
  it('keeps the asked-for step while no count exists yet', () => {
    // Plugins have not registered their steps · clamping here would silently
    // drop the step from every deep link that carries one.
    expect(readDeepLink(fakeLocation('#3.2'), ctx({ stepsOf: noSteps }), true)).toEqual({
      slide: 2,
      step: 2,
    });
  });

  it('clamps as usual once a count exists, even on a cold load', () => {
    expect(readDeepLink(fakeLocation('#3.9'), ctx({ stepsOf: threeSteps }), true)).toEqual({
      slide: 2,
      step: 3,
    });
  });

  it('clamps once the deck is warm, even with no count', () => {
    expect(readDeepLink(fakeLocation('#3.2'), ctx({ stepsOf: noSteps }), false)).toEqual({
      slide: 2,
      step: 0,
    });
  });
});

describe('publishing a position', () => {
  it('writes the linear grammar', () => {
    const url = fakeLocation('#1');
    publishDeepLink(url, { slide: 2, step: 0 }, ctx());
    expect(url.writes).toEqual(['#3']);
  });

  it('writes the step when there is one', () => {
    const url = fakeLocation('#1');
    publishDeepLink(url, { slide: 2, step: 2 }, ctx());
    expect(url.writes).toEqual(['#3.2']);
  });

  it('writes the 2D grammar for a 2D deck', () => {
    const url = fakeLocation('#1');
    publishDeepLink(url, { slide: 3, step: 1 }, ctx({ outline: sectioned, twoD: true }));
    expect(url.writes).toEqual(['#2.2s1']);
  });

  it('writes nothing when the fragment already says so', () => {
    const url = fakeLocation('#3');
    publishDeepLink(url, { slide: 2, step: 0 }, ctx());
    expect(url.writes, 'no redundant history churn').toEqual([]);
  });

  it('writes nothing when the deck does not own the URL', () => {
    const url = fakeLocation('#host-anchor');
    publishDeepLink(url, { slide: 2, step: 0 }, ctx({ ownsUrl: false }));
    expect(url.writes).toEqual([]);
    expect(url.hash, "the host's anchor survives").toBe('#host-anchor');
  });
});

describe('round trip through the port', () => {
  it('what is published is what is read back · linear', () => {
    const url = fakeLocation();
    const context = ctx({ stepsOf: threeSteps });
    publishDeepLink(url, { slide: 2, step: 2 }, context);
    expect(readDeepLink(url, context)).toEqual({ slide: 2, step: 2 });
  });

  it('what is published is what is read back · 2D with a step', () => {
    const url = fakeLocation();
    const context = ctx({ outline: sectioned, twoD: true, stepsOf: threeSteps });
    publishDeepLink(url, { slide: 4, step: 1 }, context);
    expect(readDeepLink(url, context)).toEqual({ slide: 4, step: 1 });
  });
});
