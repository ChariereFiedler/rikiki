// ════════════════════════════════════════════════════════════════
// RIKIKI · deck-scene-units layout, the pure part of the units scene
//
// One cell per unit · how many cells a grid holds, how they are cut into
// columns, how big each is for the room a panel has, and in what order they
// light. Kept apart from the element so it runs, and is tested, without a
// browser.
// ════════════════════════════════════════════════════════════════

import { SCENE_WIDTH } from './scene-layout.js';

/** Past four hundred cells a grid is a texture, and no one counts a texture. */
export const MAX_TOTAL = 400;
export const DEFAULT_TOTAL = 100;
/** Below this a cell is a dot, and a dot does not read as one person. */
export const MIN_CELL = 12;
/** Above this a cell stops reading as a unit of a crowd and reads as a card. */
export const MAX_CELL = 44;
/** A grid is no taller than this · the slide holds a title above it and a caption
 *  and a note around it, and a scene that outgrows the room is clipped. */
export const MAX_GRID_HEIGHT = 340;

/** The gutter between cells, as a share of a cell · so the grid reads as cells
 *  at any size, rather than as one block with cracks in it. */
const GUTTER = 0.25;
/** A grid is wider than it is tall, like the slide it sits on. */
const ASPECT = 2.2;
export const MAX_COLUMNS = 40;

export interface Count {
  value: number;
  /** False when what was written is not a whole number in range · the value is
   *  then the fallback, and the lint says so. */
  valid: boolean;
}

/** A whole number from `min` to `max`, as an author writes it. Absent is the
 *  fallback and is valid. */
export function readWhole(
  attribute: string | null | undefined,
  fallback: number,
  min: number,
  max: number,
): Count {
  if (attribute === null || attribute === undefined || attribute.trim() === '') {
    return { value: fallback, valid: true };
  }
  const value = Number(attribute);
  const valid = Number.isInteger(value) && value >= min && value <= max;
  return { value: valid ? value : fallback, valid };
}

/** Between two panels · wide enough that the eye reads two grids and not one. */
export const PANEL_GAP = 48;

/** How wide each of `count` side-by-side panels is, on a canvas `width` units wide. */
export function panelWidth(count: number, width = SCENE_WIDTH): number {
  const n = Math.max(1, count);
  return (width - PANEL_GAP * (n - 1)) / n;
}

/** The columns that give a grid of `total` cells a landscape shape. */
export function defaultColumns(total: number): number {
  return Math.min(MAX_COLUMNS, Math.max(1, Math.ceil(Math.sqrt(total * ASPECT))));
}

export interface GridFrame {
  columns: number;
  rows: number;
  cell: number;
  gap: number;
  width: number;
  height: number;
}

/** The size of a cell so the columns a grid really uses, gutters included, fill
 *  `width` · and no bigger than a cell may be, in which case the grid is narrower
 *  than its room. Asking for 21 columns of 200 cells makes 10 rows, and 20 columns
 *  are then all there is to draw. */
export function gridFrame(
  total: number,
  columns: number,
  width: number,
  maxHeight = MAX_GRID_HEIGHT,
): GridFrame {
  const rows = Math.ceil(total / columns);
  const used = Math.ceil(total / rows);
  const cell = Math.min(
    MAX_CELL,
    width / (used + (used - 1) * GUTTER),
    maxHeight / (rows + (rows - 1) * GUTTER),
  );
  const gap = cell * GUTTER;
  return {
    columns: used,
    rows,
    cell,
    gap,
    width: used * cell + (used - 1) * gap,
    height: rows * cell + (rows - 1) * gap,
  };
}

/** Whether the columns an author asked for leave cells big enough to count. */
export function cellIsReadable(total: number, columns: number, width: number): boolean {
  return gridFrame(total, columns, width).cell >= MIN_CELL;
}

export interface Cell {
  index: number;
  column: number;
  row: number;
  x: number;
  y: number;
}

/** The cells in the order they light · down a column, then on to the next, so a
 *  count reads as a bar filling from the left. */
export function cellsOf(total: number, frame: GridFrame): Cell[] {
  return Array.from({ length: total }, (_, index) => {
    const column = Math.floor(index / frame.rows);
    const row = index % frame.rows;
    return {
      index,
      column,
      row,
      x: column * (frame.cell + frame.gap),
      y: row * (frame.cell + frame.gap),
    };
  });
}

const FIRST = 0.1;
const MAX_SPAN = 1.6;
const MAX_STEP = 0.04;

/** When each column lights · a fixed beat per column, spread thinner when there
 *  are many so the whole grid is in within about two seconds. */
export function columnDelays(columns: number, panel = 0): number[] {
  const step = Math.min(MAX_STEP, MAX_SPAN / Math.max(1, columns));
  return Array.from({ length: columns }, (_, c) => FIRST + panel * 0.18 + c * step);
}
