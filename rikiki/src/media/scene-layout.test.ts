import { describe, expect, it } from 'vitest';
import {
  EDGE,
  GAP,
  SCENE_WIDTH,
  SHRINK_RATIO,
  columns,
  fitText,
  sceneViewBox,
  wrapText,
} from './scene-layout.js';

// A fixed-pitch measurer: every character is 10 units wide, so a width is a
// character count the test can read at a glance.
const PITCH = 10;
const mono = (text: string) => text.length * PITCH;
const monoAt = (size: number) => (text: string) => text.length * size;

describe('wrapText', () => {
  it('keeps a string that fits on one line', () => {
    expect(wrapText('one connector', 200, mono, 3)).toEqual({
      lines: ['one connector'],
      fits: true,
    });
  });

  it('breaks between words, never inside one', () => {
    const { lines, fits } = wrapText('one connector for every assistant', 140, mono, 3);
    expect(lines).toEqual(['one connector', 'for every', 'assistant']);
    expect(fits).toBe(true);
  });

  it('reports a text that needs more lines than allowed, and still returns all of them', () => {
    const { lines, fits } = wrapText('one connector for every assistant', 140, mono, 2);
    expect(lines).toHaveLength(3);
    expect(fits).toBe(false);
  });

  it('reports a single word wider than the box instead of cutting it', () => {
    const { lines, fits } = wrapText('interoperability', 100, mono, 3);
    expect(lines).toEqual(['interoperability']);
    expect(fits).toBe(false);
  });

  it('keeps a figure and its unit together across a no-break space', () => {
    const { lines } = wrapText('waits 12 ms here', 90, mono, 3);
    expect(lines).toContain('12 ms');
  });

  it('returns no line for an empty text, which fits', () => {
    expect(wrapText('   ', 100, mono, 1)).toEqual({ lines: [], fits: true });
  });
});

describe('fitText', () => {
  it('keeps the size when the text fits', () => {
    expect(fitText('short', 100, 1, 10, monoAt).size).toBe(10);
  });

  it('steps the size down once when the text does not fit', () => {
    const fitted = fitText('definitely far too long', 110, 1, 10, monoAt);
    expect(fitted.size).toBe(Math.round(10 * SHRINK_RATIO));
    expect(fitted.fits).toBe(false);
  });

  it('fits after the step down when one step is enough', () => {
    const fitted = fitText('twelve chars', 110, 1, 10, monoAt);
    expect(fitted.size).toBe(Math.round(10 * SHRINK_RATIO));
    expect(fitted.fits).toBe(true);
  });
});

describe('columns', () => {
  it('splits the drawing into equal columns separated by the gap', () => {
    const { width, xs } = columns(4);
    expect(width).toBe((SCENE_WIDTH - 3 * GAP) / 4);
    expect(xs).toEqual([0, width + GAP, 2 * (width + GAP), 3 * (width + GAP)]);
    expect((xs.at(-1) ?? 0) + width).toBe(SCENE_WIDTH);
  });

  it('treats zero items as one full-width column', () => {
    expect(columns(0)).toEqual({ width: SCENE_WIDTH, xs: [0] });
  });
});

describe('sceneViewBox', () => {
  it('leaves EDGE units around the drawing so an edge stroke is not cropped', () => {
    expect(sceneViewBox(300)).toBe(`${-EDGE} ${-EDGE} ${SCENE_WIDTH + 2 * EDGE} ${300 + 2 * EDGE}`);
  });
});
