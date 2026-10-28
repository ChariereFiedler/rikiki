import { describe, expect, it } from 'vitest';
import { QUEUE_CELL, QUEUE_MIN_CELL, queue, rowWidth, takenPlaces } from './queue.js';

describe('queue', () => {
  const caption = { w: 120, h: 30 };

  it('draws exactly the places it holds, in a row, none on another', () => {
    const placed = queue({ count: 8, width: 800, caption });
    expect(placed.cells).toHaveLength(8);
    for (const [i, cell] of placed.cells.entries()) {
      const next = placed.cells[i + 1];
      if (next) expect(next.x).toBeGreaterThanOrEqual(cell.x + cell.w);
      expect(cell.y).toBe(placed.cells[0]!.y);
    }
  });

  it('takes the comfortable size with room to spare, and shrinks to fit, never under the least', () => {
    expect(queue({ count: 4, width: 1000, caption }).cells[0]!.w).toBe(QUEUE_CELL);
    const tight = queue({ count: 6, width: rowWidth(6, 30), caption });
    expect(tight.cells[0]!.w).toBeCloseTo(30);
    expect(queue({ count: 12, width: 100, caption }).cells[0]!.w).toBe(QUEUE_MIN_CELL);
  });

  it('puts its caption above the places', () => {
    const placed = queue({ count: 3, width: 400, caption });
    expect(placed.caption).toEqual({ x: 0, y: 0 });
    expect(placed.cells[0]!.y).toBeGreaterThan(caption.h);
    expect(queue({ count: 3, width: 400, caption: { w: 0, h: 0 } }).cells[0]!.y).toBe(0);
  });

  it('is as tall as its caption and a place, and as wide as the wider of the two', () => {
    const placed = queue({ count: 2, width: 400, caption: { w: 300, h: 30 } });
    expect(placed.size.w).toBe(300);
    expect(placed.size.h).toBe(placed.cells[0]!.y + placed.cells[0]!.h);
  });
});

describe('takenPlaces', () => {
  it('takes places from the right end, the one that leads out', () => {
    expect(takenPlaces(8, 3)).toEqual([5, 6, 7]);
    expect(takenPlaces(4, 0)).toEqual([]);
  });

  it('never takes more places than there are, nor fewer than none', () => {
    expect(takenPlaces(4, 9)).toEqual([0, 1, 2, 3]);
    expect(takenPlaces(4, -2)).toEqual([]);
    expect(takenPlaces(4, 2.7)).toEqual([2, 3]);
  });
});
