import { describe, expect, it } from 'vitest';
import {
  BAR_GAP,
  FIGURE_FLOOR,
  GROUP_GAP,
  LABEL_OVERHANG,
  MAX_BAR_WIDTH,
  UNIT_SPACE,
  barColumns,
  barHeight,
  fitFigure,
  formatFigure,
  groupByNote,
  parseFigure,
  scaleMax,
} from './deck-scene-bars-layout.js';
import { SCENE_WIDTH, SHRINK_RATIO } from './scene-layout.js';

describe('parseFigure', () => {
  it('reads a decimal comma and a decimal point as the same number', () => {
    expect(parseFigure('1,7')).toBe(1.7);
    expect(parseFigure('1.7')).toBe(1.7);
  });

  it('reads a space inside a figure as a thousands separator', () => {
    expect(parseFigure('12 500')).toBe(12500);
    expect(parseFigure('12 500')).toBe(12500);
  });

  it('reads a missing or non-numeric figure as zero', () => {
    expect(parseFigure(null)).toBe(0);
    expect(parseFigure('')).toBe(0);
    expect(parseFigure('soon')).toBe(0);
  });
});

describe('formatFigure', () => {
  it('keeps the figure as written and joins the unit with a narrow no-break space', () => {
    expect(formatFigure('1,7', '%')).toBe(`1,7${UNIT_SPACE}%`);
  });

  it('prints the bare figure when there is no unit', () => {
    expect(formatFigure(' 1.7 ', '')).toBe('1.7');
  });

  it('prints nothing, not a lone unit, when there is no figure', () => {
    expect(formatFigure('', '%')).toBe('');
  });
});

describe('fitFigure', () => {
  const monoAt = (size: number) => (text: string) => text.length * size;

  it('keeps a figure and its unit on one line, never breaking at the unit space', () => {
    expect(fitFigure(`12${UNIT_SPACE}ms`, 100, 10, monoAt)).toEqual({
      lines: [`12${UNIT_SPACE}ms`],
      fits: true,
      size: 10,
      measured: 50,
    });
  });

  it('steps the size down, then reports a figure still too wide at the floor', () => {
    expect(fitFigure('12345678', 75, 10, monoAt)).toEqual({
      lines: ['12345678'],
      fits: true,
      size: Math.round(10 * SHRINK_RATIO),
      measured: 72,
    });
    const tooWide = fitFigure('123456789012', 75, 10, monoAt);
    expect(tooWide.fits).toBe(false);
    expect(tooWide.size).toBe(Math.round(10 * FIGURE_FLOOR));
    expect(tooWide.measured).toBe(84);
  });

  it('goes below one step down when the figure needs it, and not below the floor', () => {
    // 10 chars, 56 wide per size unit ratio: fits only at the 7 floor (70 <= 75)
    const fitted = fitFigure('1234567890', 75, 10, monoAt);
    expect(fitted.fits).toBe(true);
    expect(fitted.size).toBeLessThan(Math.round(10 * SHRINK_RATIO));
    expect(fitted.size).toBeGreaterThanOrEqual(Math.round(10 * FIGURE_FLOOR));
  });

  it('draws no line for an empty figure', () => {
    expect(fitFigure('', 75, 10, monoAt).lines).toEqual([]);
  });
});

describe('scaleMax', () => {
  it('defaults to the largest value', () => {
    expect(scaleMax([1.7, 2.3, 1.5])).toBe(2.3);
  });

  it('takes the author max when given', () => {
    expect(scaleMax([1.7, 2.3], 5)).toBe(5);
  });

  it('never returns zero, so a scale of flat bars does not divide by it', () => {
    expect(scaleMax([0, 0])).toBe(1);
    expect(scaleMax([], 0)).toBe(1);
  });
});

describe('barHeight', () => {
  it('scales the value to the area', () => {
    expect(barHeight(1, 4, 280)).toBe(70);
  });

  it('stops a value past the scale at the top, and a negative one on the baseline', () => {
    expect(barHeight(9, 4, 280)).toBe(280);
    expect(barHeight(-1, 4, 280)).toBe(0);
  });
});

describe('groupByNote', () => {
  it('groups consecutive items that share a note', () => {
    expect(groupByNote(['holiday 2025', 'holiday 2025', 'May 2026', 'May 2026'])).toEqual([
      { note: 'holiday 2025', first: 0, count: 2 },
      { note: 'May 2026', first: 2, count: 2 },
    ]);
  });

  it('makes one group without a caption when no item has a note', () => {
    expect(groupByNote(['', '', ''])).toEqual([{ note: '', first: 0, count: 3 }]);
  });

  it('starts a new group when a note comes back after another one', () => {
    expect(groupByNote(['a', 'b', 'a']).map((group) => group.count)).toEqual([1, 1, 1]);
  });
});

describe('barColumns', () => {
  const twoByTwo = groupByNote(['a', 'a', 'b', 'b']);

  it('gives every bar the same width, capped so few bars do not turn into cards', () => {
    const { barWidth } = barColumns(twoByTwo);
    expect(barWidth).toBe(MAX_BAR_WIDTH);
  });

  it('keeps equal gaps inside a group and a wider one between groups', () => {
    const { xs, barWidth } = barColumns(twoByTwo);
    const gaps = xs.slice(1).map((x, i) => x - ((xs[i] ?? 0) + barWidth));
    expect(gaps).toEqual([BAR_GAP, GROUP_GAP, BAR_GAP]);
  });

  it('centres the set in the drawing', () => {
    const { xs, barWidth } = barColumns(twoByTwo);
    const left = xs[0] ?? 0;
    const right = (xs.at(-1) ?? 0) + barWidth;
    expect(left).toBeCloseTo(SCENE_WIDTH - right);
  });

  it('puts one divider in the middle of each gap between groups, none for one group', () => {
    const { xs, barWidth, dividers } = barColumns(twoByTwo);
    expect(dividers).toEqual([(xs[1] ?? 0) + barWidth + GROUP_GAP / 2]);
    expect(barColumns(groupByNote(['', '', ''])).dividers).toEqual([]);
  });

  it('spans each group from its first bar to its last', () => {
    const { xs, barWidth, groups } = barColumns(twoByTwo);
    expect(groups).toEqual([
      { note: 'a', first: 0, count: 2, x: xs[0], width: 2 * barWidth + BAR_GAP },
      { note: 'b', first: 2, count: 2, x: xs[2], width: 2 * barWidth + BAR_GAP },
    ]);
  });

  it('narrows the bars when many share the drawing, labels included, without leaving it', () => {
    const notes = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const { xs, barWidth, labelWidth } = barColumns(groupByNote(notes));
    expect(barWidth).toBeLessThan(MAX_BAR_WIDTH);
    expect(labelWidth).toBe(barWidth + 2 * LABEL_OVERHANG);
    expect((xs[0] ?? 0) - LABEL_OVERHANG).toBeCloseTo(0);
    expect((xs.at(-1) ?? 0) + barWidth + LABEL_OVERHANG).toBeCloseTo(SCENE_WIDTH);
  });

  it('lays out nothing for no bar', () => {
    expect(barColumns([])).toEqual({
      barWidth: 0,
      labelWidth: 0,
      xs: [],
      groups: [],
      dividers: [],
    });
  });
});
