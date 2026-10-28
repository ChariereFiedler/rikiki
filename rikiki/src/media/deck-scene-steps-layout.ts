// ════════════════════════════════════════════════════════════════
// RIKIKI · deck-scene-steps layout, the pure part of the scene
//
// Where the columns of a step row fall and how tall the rows and the closing
// band are, kept apart from the element so the geometry runs, and is tested,
// without a browser. One consumer · it lives beside it (ADR-004).
// ════════════════════════════════════════════════════════════════

import { GAP, PAD, SCENE_WIDTH } from './scene-layout.js';

/** The number disc · just taller than a label line, so the number reads before
 *  the words and a one-line row stays one line tall · six such rows still fit
 *  under a one-line slide title. */
export const DISC = 40;

/** The label column is fixed, not measured · labels of different lengths still
 *  start their notes on one vertical edge, which is what makes rows a list. */
export const LABEL_WIDTH = 320;

/** Between two rows · half the kit's gap. Rows are one list, not separate
 *  cards, and four of them with a band must still fit under a slide title. */
export const ROW_GAP = GAP / 2;

/** Room between the last row and the closing band · wider than the gap between
 *  rows, so the band reads as the conclusion of the list, not its next row. */
export const BEFORE_BAND = GAP;

/** Heights snap to this grid, so rows of every scene line up with each other. */
export const GRID = 8;

/** Where the disc and the label column sit · fixed, and shared with the closing
 *  band, whose icon and sentence line up under them. */
export const DISC_CENTER = PAD + DISC / 2;
export const LABEL_X = PAD + DISC + GAP;

export interface StepColumns {
  discCenter: number;
  labelX: number;
  noteX: number;
  noteWidth: number;
  tagRight: number;
}

export interface StepRows {
  rowHeight: number;
  ys: number[];
  bandY: number;
  bandHeight: number;
  height: number;
}

export function snapToGrid(value: number): number {
  return Math.ceil(value / GRID) * GRID;
}

/** The note takes whatever the tag column leaves · the widest tag decides, so
 *  every note wraps to the same width and every tag ends on the same edge. */
export function stepColumns(tagWidth: number, width = SCENE_WIDTH): StepColumns {
  const noteX = LABEL_X + LABEL_WIDTH + GAP;
  const tagRight = width - PAD;
  const noteRight = tagWidth > 0 ? tagRight - tagWidth - GAP : tagRight;
  return {
    discCenter: DISC_CENTER,
    labelX: LABEL_X,
    noteX,
    noteWidth: noteRight - noteX,
    tagRight,
  };
}

/** Every row takes the height of the fullest one · a list whose rows change
 *  height reads as a table with a missing cell. `bandContent` is null when the
 *  scene has no closing band. */
export function stepRows(contents: number[], bandContent: number | null): StepRows {
  const count = Math.max(1, contents.length);
  const rowHeight = snapToGrid(Math.max(DISC, ...contents) + 2 * PAD);
  const ys = Array.from({ length: count }, (_, i) => i * (rowHeight + ROW_GAP));
  const rowsBottom = count * rowHeight + (count - 1) * ROW_GAP;
  if (bandContent === null)
    return { rowHeight, ys, bandY: rowsBottom, bandHeight: 0, height: rowsBottom };
  const bandY = rowsBottom + BEFORE_BAND;
  const bandHeight = snapToGrid(bandContent + 2 * PAD);
  return { rowHeight, ys, bandY, bandHeight, height: bandY + bandHeight };
}
