import { describe, expect, it } from 'vitest';
import { barSpan, parseValue, scaleX, tagStart } from './deck-scene-ranges-layout.js';

// A scale area 1200 units wide starting at 400, on a scale of 12 · one unit of
// the scale is 100 units of drawing, so every expected x reads at a glance.
const AREA = { left: 400, right: 1600 };
const SCALE = 12;
const MIN_WIDTH = 24;
const POINT_WIDTH = 48;

describe('parseValue', () => {
  it('reads a number, decimals included', () => {
    expect(parseValue('8')).toBe(8);
    expect(parseValue(' 2.5 ')).toBe(2.5);
  });

  it('returns null for a missing, empty or non-numeric attribute', () => {
    expect(parseValue(null)).toBeNull();
    expect(parseValue('')).toBeNull();
    expect(parseValue('ten')).toBeNull();
  });
});

describe('scaleX', () => {
  it('maps 0 to the left of the area and the scale maximum to its right', () => {
    expect(scaleX(0, SCALE, AREA)).toBe(400);
    expect(scaleX(12, SCALE, AREA)).toBe(1600);
    expect(scaleX(5, SCALE, AREA)).toBe(900);
  });

  it('clamps a value outside the scale to the nearest end', () => {
    expect(scaleX(-3, SCALE, AREA)).toBe(400);
    expect(scaleX(20, SCALE, AREA)).toBe(1600);
  });

  it('puts every value at the left on a scale that is not positive', () => {
    expect(scaleX(5, 0, AREA)).toBe(400);
  });
});

describe('barSpan', () => {
  it('spans from `from` to `to`', () => {
    expect(barSpan(5, 10, SCALE, AREA, MIN_WIDTH, POINT_WIDTH)).toEqual({ x: 900, width: 500 });
  });

  it('reads a reversed range the right way round', () => {
    expect(barSpan(10, 5, SCALE, AREA, MIN_WIDTH, POINT_WIDTH)).toEqual({ x: 900, width: 500 });
  });

  it('draws `to` alone as a short pill centred on the value', () => {
    expect(barSpan(null, 10, SCALE, AREA, MIN_WIDTH, POINT_WIDTH)).toEqual({
      x: 1376,
      width: POINT_WIDTH,
    });
  });

  it('keeps a pill at the end of the scale inside the area', () => {
    expect(barSpan(null, 12, SCALE, AREA, MIN_WIDTH, POINT_WIDTH)).toEqual({
      x: 1600 - POINT_WIDTH,
      width: POINT_WIDTH,
    });
    expect(barSpan(null, 0, SCALE, AREA, MIN_WIDTH, POINT_WIDTH)).toEqual({
      x: 400,
      width: POINT_WIDTH,
    });
  });

  it('gives a very short range the minimum width, still inside the area', () => {
    expect(barSpan(12, 12, SCALE, AREA, MIN_WIDTH, POINT_WIDTH)).toEqual({
      x: 1600 - MIN_WIDTH,
      width: MIN_WIDTH,
    });
  });

  it('clamps a range that leaves the scale', () => {
    expect(barSpan(-2, 30, SCALE, AREA, MIN_WIDTH, POINT_WIDTH)).toEqual({ x: 400, width: 1200 });
  });

  it('returns null for an open row, with no `to`', () => {
    expect(barSpan(null, null, SCALE, AREA, MIN_WIDTH, POINT_WIDTH)).toBeNull();
    expect(barSpan(5, null, SCALE, AREA, MIN_WIDTH, POINT_WIDTH)).toBeNull();
  });
});

describe('tagStart', () => {
  it('starts the tag where its bar starts', () => {
    expect(tagStart(900, 200, AREA)).toBe(900);
  });

  it('pulls a tag back so it ends inside the area', () => {
    expect(tagStart(1500, 200, AREA)).toBe(1400);
  });

  it('never starts a tag before the area, even when it is wider than the area', () => {
    expect(tagStart(400, 1500, AREA)).toBe(400);
  });
});
