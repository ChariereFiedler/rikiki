import { describe, expect, it } from 'vitest';
import { GRAPH_GEOMETRY_READER, parseGraphPath, polylineHitsRect } from './graph-hit.mjs';

/** A 100x50 box at (100, 100) · the node every case below is aimed at. */
const node = { left: 100, right: 200, top: 100, bottom: 150 };

describe('parseGraphPath', () => {
  it('reads the published pairs in order', () => {
    expect(parseGraphPath('10,20 30,40')).toEqual([
      { x: 10, y: 20 },
      { x: 30, y: 40 },
    ]);
  });

  it('reads a four point orthogonal route', () => {
    expect(parseGraphPath('0,0 5,0 5,9 10,9')).toHaveLength(4);
  });

  it('refuses a path it cannot read whole rather than returning a shorter one', () => {
    expect(parseGraphPath('10,20 oops')).toEqual([]);
    expect(parseGraphPath('10,20')).toEqual([]);
    expect(parseGraphPath(null)).toEqual([]);
    expect(parseGraphPath('')).toEqual([]);
  });
});

describe('polylineHitsRect', () => {
  it('reports a segment straight through the box', () => {
    expect(polylineHitsRect([{ x: 0, y: 125 }, { x: 400, y: 125 }], node)).toBe(true);
  });

  it('reports a corner graze once the stroke width is counted', () => {
    // Passes 1.4px outside the bottom-right corner: invisible to a zero width
    // line, unmistakable ink once the 4px stroke is a 2px band. This is the
    // geometry of the reported bug, scaled down.
    const path = [
      { x: 257.6, y: 133.2 },
      { x: 57.4, y: 196.8 },
    ];
    expect(polylineHitsRect(path, node, 0)).toBe(false);
    expect(polylineHitsRect(path, node, 2)).toBe(true);
  });

  it('leaves a segment that clears the box by more than the stroke alone', () => {
    expect(polylineHitsRect([{ x: 0, y: 160 }, { x: 400, y: 160 }], node, 2)).toBe(false);
  });

  it('leaves a segment that stops short of the box', () => {
    expect(polylineHitsRect([{ x: 0, y: 125 }, { x: 90, y: 125 }], node, 2)).toBe(false);
  });

  it('reports an orthogonal route that only hits on its second segment', () => {
    // Down the left of the box, across through it, then out · the first and
    // last segments are clear, so a test that only looked at the endpoints
    // would call this fine.
    const ortho = [
      { x: 50, y: 0 },
      { x: 50, y: 125 },
      { x: 250, y: 125 },
      { x: 250, y: 300 },
    ];
    expect(polylineHitsRect(ortho, node)).toBe(true);
  });

  it('leaves an orthogonal route that goes around the box', () => {
    const ortho = [
      { x: 50, y: 0 },
      { x: 50, y: 300 },
      { x: 250, y: 300 },
      { x: 250, y: 0 },
    ];
    expect(polylineHitsRect(ortho, node, 2)).toBe(false);
  });

  it('never hits a box the margin cannot open', () => {
    expect(polylineHitsRect([{ x: 0, y: 0 }, { x: 400, y: 400 }], { left: 10, right: 10, top: 0, bottom: 50 })).toBe(false);
  });
});

describe('GRAPH_GEOMETRY_READER', () => {
  it('rebuilds both helpers, as the browser side does', () => {
    const geometry = new Function(`return ${GRAPH_GEOMETRY_READER}`)();
    expect(geometry.parseGraphPath('1,2 3,4')).toHaveLength(2);
    expect(geometry.polylineHitsRect([{ x: 0, y: 125 }, { x: 400, y: 125 }], node)).toBe(true);
  });
});
