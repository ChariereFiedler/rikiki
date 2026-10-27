import { describe, expect, it } from 'vitest';
import {
  DEFAULT_TOTAL,
  MAX_CELL,
  MAX_GRID_HEIGHT,
  MAX_COLUMNS,
  MAX_TOTAL,
  MIN_CELL,
  cellIsReadable,
  cellsOf,
  columnDelays,
  defaultColumns,
  gridFrame,
  readWhole,
} from './deck-scene-units-layout.js';

describe('readWhole', () => {
  it('takes the fallback when nothing is written, and says it is fine', () => {
    expect(readWhole(null, 100, 1, 400)).toEqual({ value: 100, valid: true });
    expect(readWhole('  ', 100, 1, 400)).toEqual({ value: 100, valid: true });
  });

  it('reads a whole number in range, bounds included', () => {
    expect(readWhole('1', 100, 1, 400)).toEqual({ value: 1, valid: true });
    expect(readWhole('400', 100, 1, 400)).toEqual({ value: 400, valid: true });
    expect(readWhole('0', 5, 0, 9)).toEqual({ value: 0, valid: true });
  });

  it.each(['0', '401', '2.5', 'many', '-3'])('refuses %j for 1 to 400 and falls back', (text) => {
    expect(readWhole(text, 100, 1, 400)).toEqual({ value: 100, valid: false });
  });
});

describe('defaultColumns', () => {
  it('gives a landscape grid, 20-odd by 10 for 200', () => {
    const columns = defaultColumns(200);
    const rows = Math.ceil(200 / columns);
    expect(columns).toBeGreaterThan(rows * 1.5);
    expect(columns).toBeLessThan(rows * 3);
  });

  it('stays within bounds at every size', () => {
    for (let total = 1; total <= MAX_TOTAL; total++) {
      const columns = defaultColumns(total);
      expect(columns).toBeGreaterThanOrEqual(1);
      expect(columns).toBeLessThanOrEqual(MAX_COLUMNS);
    }
  });
});

describe('gridFrame', () => {
  it('fills the width it is given, to the unit, when the width is what limits the cell', () => {
    const frame = gridFrame(100, 15, 400);
    expect(frame.cell).toBeLessThan(MAX_CELL);
    expect(frame.width).toBeCloseTo(400);
  });

  it('counts the columns it really uses: 200 cells in 10 rows are 20 columns, not 21', () => {
    const frame = gridFrame(200, 21, 784);
    expect(frame.rows).toBe(10);
    expect(frame.columns).toBe(20);
  });

  it('caps the cell, and leaves the grid narrower than its room', () => {
    const frame = gridFrame(12, 4, 1600);
    expect(frame.cell).toBe(MAX_CELL);
    expect(frame.width).toBeLessThan(1600);
  });

  it('holds every cell, and not many more', () => {
    for (const total of [1, 7, 24, 100, 199, 200, 361, 400]) {
      const frame = gridFrame(total, defaultColumns(total), 784);
      expect(frame.columns * frame.rows, `${total}`).toBeGreaterThanOrEqual(total);
      expect(frame.columns * frame.rows, `${total}`).toBeLessThan(total + frame.rows);
    }
  });

  it('keeps the gutter a fixed share of the cell at every size', () => {
    for (const width of [300, 784, 1600]) {
      const frame = gridFrame(100, 15, width);
      expect(frame.gap / frame.cell).toBeCloseTo(0.25);
    }
  });

  it('reads a grid of 400 as cells in two panels, and not in three narrow ones', () => {
    expect(cellIsReadable(400, defaultColumns(400), 784)).toBe(true);
    expect(cellIsReadable(400, defaultColumns(400), 500)).toBe(true);
    expect(cellIsReadable(400, defaultColumns(400), 300)).toBe(false);
    expect(gridFrame(400, 40, 784).cell).toBeGreaterThanOrEqual(MIN_CELL);
  });
});

describe('cellsOf', () => {
  const frame = gridFrame(200, 21, 784);
  const cells = cellsOf(200, frame);

  it('lights down a column, then on to the next, so a count fills from the left', () => {
    expect(cells[0]).toMatchObject({ column: 0, row: 0 });
    expect(cells[1]).toMatchObject({ column: 0, row: 1 });
    expect(cells[frame.rows]).toMatchObject({ column: 1, row: 0 });
    expect(cells.at(-1)).toMatchObject({ column: frame.columns - 1, row: frame.rows - 1 });
  });

  it('places no two cells on the same spot, and none outside the grid', () => {
    expect(new Set(cells.map((c) => `${c.x},${c.y}`)).size).toBe(200);
    for (const c of cells) {
      expect(c.x + frame.cell).toBeLessThanOrEqual(frame.width + 1e-6);
      expect(c.y + frame.cell).toBeLessThanOrEqual(frame.height + 1e-6);
    }
  });

  it('leaves a short last column short, not padded', () => {
    const short = cellsOf(23, gridFrame(23, 5, 700));
    expect(short).toHaveLength(23);
    expect(short.at(-1)?.row).toBeLessThan(5);
  });
});

describe('columnDelays', () => {
  it('lights the columns in order, one beat apart, 0.18 s later for the next panel', () => {
    const first = columnDelays(5, 0);
    const second = columnDelays(5, 1);
    for (let i = 1; i < first.length; i++) expect(first[i]!).toBeGreaterThan(first[i - 1]!);
    expect(second[0]! - first[0]!).toBeCloseTo(0.18);
  });

  it('is in within two seconds at any width, so the slide is never waiting on it', () => {
    for (let columns = 1; columns <= MAX_COLUMNS; columns++) {
      expect(Math.max(...columnDelays(columns, 2)), `${columns} columns`).toBeLessThan(2.2);
    }
  });

  it('has defaults an author can lean on', () => {
    expect(DEFAULT_TOTAL).toBe(100);
  });
});

describe('gridFrame · the room a slide has', () => {
  it('is never taller than the grid allowance, at any size and in any panel width', () => {
    for (const total of [1, 24, 100, 200, 360, 400]) {
      for (const width of [501, 776, 1600]) {
        const frame = gridFrame(total, defaultColumns(total), width);
        expect(frame.height, `${total} cells in ${width}`).toBeLessThanOrEqual(
          MAX_GRID_HEIGHT + 1e-6,
        );
        expect(frame.width, `${total} cells in ${width}`).toBeLessThanOrEqual(width + 1e-6);
      }
    }
  });

  it('shrinks the cells of one big grid rather than let it run off the slide', () => {
    const wide = gridFrame(360, defaultColumns(360), 1600);
    expect(wide.cell).toBeLessThan(MAX_CELL);
    expect(wide.height).toBeCloseTo(MAX_GRID_HEIGHT);
  });

  it('keeps a full grid of 400 readable in three panels', () => {
    expect(cellIsReadable(400, defaultColumns(400), 501)).toBe(true);
  });
});
