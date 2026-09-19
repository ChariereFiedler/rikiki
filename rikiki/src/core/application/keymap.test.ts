import { describe, expect, it } from 'vitest';
import { outlineOf } from '../domain/deck-outline.js';
import type { StepsOf } from '../domain/deck-outline.js';
import { LINEAR } from '../domain/navigation.js';
import type { KeyState } from './keymap.js';
import { isMove, keyIntent, resolveMove } from './keymap.js';

// The whole keymap, asked without a browser · "what does ArrowUp do in a 2D
// deck at the top of a chapter?" is now a unit test, not a manual click.

const state = (key: string, over: Partial<KeyState> = {}): KeyState => ({
  key,
  overview: false,
  blanked: false,
  zoomEnabled: true,
  zoomed: false,
  twoD: false,
  ...over,
});

const intentOf = (key: string, over: Partial<KeyState> = {}) => keyIntent(state(key, over)).intent;

describe('overlays win over everything', () => {
  it.each(['Escape', 'o', 'O', 'Enter'])('%s leaves the overview', (key) => {
    expect(intentOf(key, { overview: true })).toBe('close-overview');
  });

  it.each(['ArrowRight', ' ', 'p', 'Home'])('%s does nothing while the overview is open', (key) => {
    expect(intentOf(key, { overview: true })).toBe('none');
  });

  it('any key at all restores a blanked screen', () => {
    for (const key of ['ArrowRight', 'x', 'Escape', ' ']) {
      expect(intentOf(key, { blanked: true })).toBe('clear-blank');
    }
  });
});

describe('presenter clicker keys', () => {
  it.each(['.', 'b', 'B'])('%s blanks to black', (key) => {
    expect(intentOf(key)).toBe('blank-black');
  });

  it.each([',', 'w', 'W'])('%s blanks to white', (key) => {
    expect(intentOf(key)).toBe('blank-white');
  });
});

describe('zoom keys are only claimed when zoom is available', () => {
  it.each(['+', '='])('%s zooms in', (key) => {
    expect(intentOf(key)).toBe('zoom-in');
  });

  it('- zooms out', () => {
    expect(intentOf('-')).toBe('zoom-out');
  });

  it('leaves +/- to the browser when the deck disables zoom', () => {
    // A `no-zoom` deck must not steal the browser's own page zoom.
    expect(intentOf('+', { zoomEnabled: false })).toBe('none');
    expect(intentOf('-', { zoomEnabled: false })).toBe('none');
  });

  it('0 only means reset once the slide is actually magnified', () => {
    expect(intentOf('0', { zoomed: false })).toBe('none');
    expect(intentOf('0', { zoomed: true })).toBe('zoom-reset');
  });
});

describe('overlays, ends and paging', () => {
  it.each([
    ['?', 'toggle-help'],
    ['h', 'toggle-help'],
    ['Escape', 'close-help'],
    ['o', 'open-overview'],
    ['p', 'toggle-presenter'],
    ['Home', 'first'],
    ['End', 'last'],
    [' ', 'advance'],
    ['PageDown', 'advance'],
    ['PageUp', 'back'],
  ])('%s means %s', (key, intent) => {
    expect(intentOf(key)).toBe(intent);
  });

  it('keeps the browser default for help, Escape and Home/End', () => {
    // Deliberate · these keys have useful native behaviour worth leaving alone.
    for (const key of ['?', 'Escape', 'Home', 'End']) {
      expect(keyIntent(state(key)).preventDefault, `${key} is not swallowed`).toBe(false);
    }
    expect(keyIntent(state(' ')).preventDefault, 'space must not scroll the page').toBe(true);
  });

  it('does nothing for a key it does not own', () => {
    expect(intentOf('q')).toBe('none');
    expect(intentOf('F5')).toBe('none');
  });
});

describe('arrows · linear versus 2D', () => {
  it('maps both axes to advance/back in a linear deck', () => {
    expect(intentOf('ArrowRight')).toBe('advance');
    expect(intentOf('ArrowDown')).toBe('advance');
    expect(intentOf('ArrowLeft')).toBe('back');
    expect(intentOf('ArrowUp')).toBe('back');
  });

  it('splits the axes in a 2D deck', () => {
    expect(intentOf('ArrowRight', { twoD: true })).toBe('next-chapter');
    expect(intentOf('ArrowLeft', { twoD: true })).toBe('prev-chapter');
    expect(intentOf('ArrowDown', { twoD: true })).toBe('next-in-chapter');
    expect(intentOf('ArrowUp', { twoD: true })).toBe('prev-in-chapter');
  });
});

// A · B B · C C C
const sectioned = outlineOf([
  'deck-section',
  'deck-section',
  'deck-feature',
  'deck-section',
  'deck-feature',
  'deck-feature',
]);
const noSteps: StepsOf = () => 0;
const move = (intent: Parameters<typeof resolveMove>[0], slide: number, step = 0) =>
  resolveMove(intent, sectioned, LINEAR, { slide, step }, noSteps);

describe('resolving a 2D move', () => {
  it('jumps to the head of the next chapter', () => {
    expect(move('next-chapter', 1)).toEqual({ slide: 3, step: 0 });
  });

  it('jumps to the head of the previous chapter', () => {
    expect(move('prev-chapter', 4)).toEqual({ slide: 1, step: 0 });
  });

  it('walks down inside a chapter', () => {
    expect(move('next-in-chapter', 3)).toEqual({ slide: 4, step: 0 });
  });

  it('walks up inside a chapter', () => {
    expect(move('prev-in-chapter', 5)).toEqual({ slide: 4, step: 0 });
  });
});

describe('2D falls back to linear at every edge', () => {
  it('down past the end of a chapter continues into the next slide', () => {
    // Holding ArrowDown must walk the whole deck, not stop at each boundary.
    expect(move('next-in-chapter', 2)).toEqual({ slide: 3, step: 0 });
  });

  it('up past the head of a chapter continues into the previous slide', () => {
    expect(move('prev-in-chapter', 3)).toEqual({ slide: 2, step: 0 });
  });

  it('right past the last chapter advances linearly', () => {
    expect(move('next-chapter', 4)).toEqual({ slide: 5, step: 0 });
  });

  it('left before the first chapter goes back linearly', () => {
    expect(move('prev-chapter', 0)).toBeNull();
  });

  it('stops at the very end of a deck that does not loop', () => {
    expect(move('next-chapter', 5)).toBeNull();
  });
});

describe('isMove', () => {
  it('separates the intents that produce a position', () => {
    expect(isMove('advance')).toBe(true);
    expect(isMove('next-in-chapter')).toBe(true);
    expect(isMove('open-overview')).toBe(false);
    expect(isMove('none')).toBe(false);
  });
});
