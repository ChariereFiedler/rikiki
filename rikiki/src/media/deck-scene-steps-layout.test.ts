import { describe, expect, it } from 'vitest';
import {
  BEFORE_BAND,
  DISC,
  GRID,
  LABEL_WIDTH,
  ROW_GAP,
  snapToGrid,
  stepColumns,
  stepRows,
} from './deck-scene-steps-layout.js';
import { GAP, PAD, SCENE_WIDTH } from './scene-layout.js';

// deck-scene-steps-layout has one consumer, deck-scene-steps · it lives beside it.

describe('stepColumns', () => {
  it('places disc, label and note left to right, one gap apart', () => {
    const { discCenter, labelX, noteX } = stepColumns(0);
    expect(discCenter).toBe(PAD + DISC / 2);
    expect(labelX).toBe(PAD + DISC + GAP);
    expect(noteX).toBe(labelX + LABEL_WIDTH + GAP);
  });

  it('gives the note the full width when no row has a tag', () => {
    const { noteX, noteWidth, tagRight } = stepColumns(0);
    expect(tagRight).toBe(SCENE_WIDTH - PAD);
    expect(noteX + noteWidth).toBe(tagRight);
  });

  it('keeps one gap between the note and the widest tag', () => {
    const tagWidth = 180;
    const { noteX, noteWidth, tagRight } = stepColumns(tagWidth);
    expect(tagRight - tagWidth - (noteX + noteWidth)).toBe(GAP);
  });
});

describe('stepRows', () => {
  it('gives every row the height of the fullest one, on the grid', () => {
    const { rowHeight, ys } = stepRows([38, 76, 34], null);
    expect(rowHeight).toBe(snapToGrid(76 + 2 * PAD));
    expect(rowHeight % GRID).toBe(0);
    expect(ys).toEqual([0, rowHeight + ROW_GAP, 2 * (rowHeight + ROW_GAP)]);
  });

  it('never makes a row shorter than its disc needs', () => {
    expect(stepRows([10], null).rowHeight).toBeGreaterThanOrEqual(DISC + 2 * PAD);
  });

  it('ends the drawing at the last row when there is no band', () => {
    const { rowHeight, height, bandHeight } = stepRows([38, 38], null);
    expect(bandHeight).toBe(0);
    expect(height).toBe(2 * rowHeight + ROW_GAP);
  });

  it('keeps the gap between rows on the grid', () => {
    expect(ROW_GAP % GRID).toBe(0);
  });

  it('puts the band under the rows, set apart by more than a row gap', () => {
    const { rowHeight, bandY, bandHeight, height } = stepRows([38, 38], 72);
    expect(BEFORE_BAND).toBeGreaterThan(ROW_GAP);
    expect(bandY).toBe(2 * rowHeight + ROW_GAP + BEFORE_BAND);
    expect(bandHeight).toBe(snapToGrid(72 + 2 * PAD));
    expect(height).toBe(bandY + bandHeight);
  });
});
