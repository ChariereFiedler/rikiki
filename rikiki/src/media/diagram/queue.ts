// ════════════════════════════════════════════════════════════════
// RIKIKI · diagram, the queue engine
//
// A queue is a row of places, some of them taken: what waits in front of a
// bottleneck, how full a buffer is. Places are taken from the right end · the
// end that leads out, toward whatever the queue waits for · so a queue that
// grows reaches back, the way a line of people does. How many are taken may
// change on each click (`fill="1 4 8"`).
//
// Pure: the caption arrives measured, the engine says where it goes, where each
// place goes, and which places are taken on each click.
// ════════════════════════════════════════════════════════════════

import type { Size } from './types.js';

/** The most places a queue shows · more is a crowd nobody counts. */
export const MAX_QUEUE = 12;
/** A place is this wide with room to spare, and never less than the least. */
export const QUEUE_CELL = 44;
export const QUEUE_MIN_CELL = 24;
const CELL_GAP = 10;
const CAPTION_GAP = 10;

export interface QueueInput {
  count: number;
  width: number;
  /** The caption above the places · 0×0 without one. */
  caption: Size;
}

export interface QueueResult {
  size: Size;
  caption: { x: number; y: number };
  /** The places, left to right. */
  cells: { x: number; y: number; w: number; h: number }[];
}

/** The width a row of `count` places takes at a cell size. */
export const rowWidth = (count: number, cell: number) =>
  count * cell + Math.max(0, count - 1) * CELL_GAP;

/** Place a queue `width` wide · the caption, then the places, as large as the
 *  width lets them be, between the least and the comfortable size. */
export function queue(input: QueueInput): QueueResult {
  const count = Math.max(1, Math.floor(input.count));
  const room = (input.width - (count - 1) * CELL_GAP) / count;
  const cell = Math.min(QUEUE_CELL, Math.max(QUEUE_MIN_CELL, room));
  const top = input.caption.h > 0 ? input.caption.h + CAPTION_GAP : 0;
  const cells = Array.from({ length: count }, (_, i) => ({
    x: i * (cell + CELL_GAP),
    y: top,
    w: cell,
    h: cell,
  }));
  return {
    size: { w: Math.max(rowWidth(count, cell), input.caption.w), h: top + cell },
    caption: { x: 0, y: 0 },
    cells,
  };
}

/** The places taken when `fill` of `count` are · from the right end. */
export function takenPlaces(count: number, fill: number): number[] {
  const taken = Math.min(count, Math.max(0, Math.floor(fill)));
  return Array.from({ length: taken }, (_, i) => count - taken + i);
}
