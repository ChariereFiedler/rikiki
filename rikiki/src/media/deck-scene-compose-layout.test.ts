import { describe, expect, it } from 'vitest';
import {
  type ComposeInput,
  MIN_REGION_WIDTH,
  REGION_GAP,
  STACK_GAP,
  composedHeight,
  lintCompose,
  parseSplit,
  rowFrame,
} from './deck-scene-compose-layout.js';
import { EDGE, SCENE_WIDTH } from './scene-layout.js';

describe('parseSplit', () => {
  it('is equal shares when absent', () => {
    expect(parseSplit(null, 2)).toEqual({ shares: [1, 1], valid: true });
    expect(parseSplit('  ', 3)).toEqual({ shares: [1, 1, 1], valid: true });
  });

  it('reads one positive number per region', () => {
    expect(parseSplit('2:1', 2)).toEqual({ shares: [2, 1], valid: true });
    expect(parseSplit('1 : 2 : 1', 3)).toEqual({ shares: [1, 2, 1], valid: true });
  });

  it.each([
    ['2:1', 3],
    ['1:0', 2],
    ['a:b', 2],
    ['1:-1', 2],
    ['1', 2],
  ])('calls %s for %i regions invalid and falls back to equal shares', (split, count) => {
    const parsed = parseSplit(split, count);
    expect(parsed.valid).toBe(false);
    expect(parsed.shares).toEqual(Array.from({ length: count }, () => 1));
  });
});

describe('rowFrame', () => {
  it('shares what is left after the gutters', () => {
    const { widths } = rowFrame([1, 1]);
    expect(widths).toEqual([(SCENE_WIDTH - REGION_GAP) / 2, (SCENE_WIDTH - REGION_GAP) / 2]);
  });

  it('keeps the proportions of an uneven split', () => {
    const { widths } = rowFrame([2, 1]);
    expect(widths[0] / widths[1]).toBeCloseTo(2, 10);
  });

  it.each([
    [[1, 1]],
    [[2, 1]],
    [[1, 1, 1]],
    [[3, 2, 1]],
    [[1, 4]],
  ])('adds up to the canvas, in the same unit as a scene alone (%j)', (shares) => {
    // The invariant that keeps the type one size: regions and gaps, in CSS
    // units, fill exactly the width of a scene drawn alone (canvas + margins).
    const { tracks, gap } = rowFrame(shares);
    const total = tracks.reduce((a, b) => a + b, 0) + gap * (shares.length - 1);
    expect(total).toBeCloseTo(SCENE_WIDTH + 2 * EDGE, 9);
  });

  it('puts each gutter centre between the two regions it separates', () => {
    const { tracks, gap, gutterCentres } = rowFrame([1, 1]);
    expect(gutterCentres).toHaveLength(1);
    expect(gutterCentres[0]).toBeCloseTo(tracks[0] + gap / 2, 9);
  });

  it('has a gutter centre per gap, none for a single region', () => {
    expect(rowFrame([1, 1, 1]).gutterCentres).toHaveLength(2);
    expect(rowFrame([1]).gutterCentres).toEqual([]);
  });

  it('leaves two even regions wider than the minimum a scene needs', () => {
    expect(rowFrame([1, 1]).widths[0]).toBeGreaterThan(MIN_REGION_WIDTH);
  });

  it('keeps three equal regions at the floor every shape was measured clean at', () => {
    expect(rowFrame([1, 1, 1]).widths[0]).toBeGreaterThanOrEqual(MIN_REGION_WIDTH);
  });

  it('shares a split of huge numbers as their proportions, every width finite', () => {
    const { widths, tracks, gutterCentres } = rowFrame(parseSplit('1e308:1e308', 2).shares);
    expect([...widths, ...tracks, ...gutterCentres].every(Number.isFinite)).toBe(true);
    expect(widths).toEqual(rowFrame([1, 1]).widths);
  });

  it('puts a three-way split of one to four below the minimum, which the lint reports', () => {
    expect(rowFrame([1, 4, 1]).widths[0]).toBeLessThan(MIN_REGION_WIDTH);
  });
});

describe('lintCompose', () => {
  const base: ComposeInput = {
    layout: null,
    link: null,
    split: null,
    regions: ['deck-scene-units', 'deck-scene-units'],
    strays: [],
  };
  const codes = (over: Partial<ComposeInput>, emphasised: string[] = []) =>
    lintCompose({ ...base, ...over }, emphasised).map((issue) => issue.code);

  it('is quiet for two scenes side by side', () => {
    expect(codes({})).toEqual([]);
    expect(codes({ layout: 'row', link: 'arrow', split: '1:1' })).toEqual([]);
  });

  it('flags a layout, a link, a split the composition does not know', () => {
    expect(codes({ layout: 'grid' })).toEqual(['SCENE_LAYOUT_INVALID']);
    expect(codes({ link: 'then' })).toEqual(['SCENE_LAYOUT_INVALID']);
    expect(codes({ split: '1:2:3' })).toEqual(['SCENE_LAYOUT_INVALID']);
  });

  it('flags fewer than two regions', () => {
    expect(codes({ regions: ['deck-scene-units'] })).toEqual(['SCENE_LAYOUT_INVALID']);
    expect(codes({ regions: [] })).toContain('SCENE_LAYOUT_INVALID');
  });

  it('lets one scene stand under a stack when a band closes it, and only then', () => {
    const one = ['deck-scene-bars'];
    expect(codes({ layout: 'stack', regions: one, band: true })).toEqual([]);
    expect(codes({ layout: 'stack', regions: one })).toEqual(['SCENE_LAYOUT_INVALID']);
    expect(codes({ layout: 'row', regions: one, band: true })).toEqual(['SCENE_LAYOUT_INVALID']);
  });

  it('names the regions past the maximum of a row and of a stack', () => {
    const four = Array.from({ length: 4 }, () => 'deck-scene-cards');
    const row = lintCompose({ ...base, regions: four }, []);
    expect(row.find((i) => i.code === 'SCENE_ITEMS_DROPPED')?.items).toHaveLength(1);
    const stack = lintCompose({ ...base, layout: 'stack', regions: four.slice(0, 3) }, []);
    expect(stack.find((i) => i.code === 'SCENE_ITEMS_DROPPED')?.items).toHaveLength(1);
  });

  it('flags a child that is not a scene', () => {
    const found = lintCompose({ ...base, strays: ['p'] }, []).find(
      (i) => i.code === 'SCENE_LAYOUT_INVALID',
    );
    expect(found?.items).toEqual(['p']);
  });

  it('flags the region a split leaves too narrow, by tag and with the width it needs', () => {
    const found = lintCompose({ ...base, split: '1:5' }, []).find(
      (i) => i.code === 'SCENE_REGION_TOO_NARROW',
    );
    expect(found?.items).toEqual(['deck-scene-units (needs 469)']);
  });

  it('asks more of the shapes the bench found need more · lanes and matrix 1000, steps 650', () => {
    const side = (tag: string) =>
      lintCompose({ ...base, regions: [tag, 'deck-scene-bars'] }, []).find(
        (i) => i.code === 'SCENE_REGION_TOO_NARROW',
      )?.items;
    // Two equal regions get 752 each.
    expect(side('deck-scene-lanes')).toEqual(['deck-scene-lanes (needs 1000)']);
    expect(side('deck-scene-matrix')).toEqual(['deck-scene-matrix (needs 1000)']);
    expect(side('deck-scene-steps')).toBeUndefined();
    expect(side('deck-scene-cards')).toBeUndefined();
  });

  it('lets a lanes scene have the room it needs with an uneven split', () => {
    const issues = lintCompose(
      { ...base, regions: ['deck-scene-lanes', 'deck-scene-bars'], split: '2:1' },
      [],
    );
    expect(issues.map((i) => i.code)).toEqual([]);
  });

  it('does not measure a stack by width, whose regions are the whole canvas', () => {
    expect(codes({ layout: 'stack', split: null })).not.toContain('SCENE_REGION_TOO_NARROW');
  });

  it('warns when more than one region puts something forward', () => {
    const issues = lintCompose(base, ['deck-scene-bars', 'deck-scene-units']);
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({ code: 'SCENE_EMPHASIS_SCATTERED', severity: 'warning' });
    expect(codes({}, ['deck-scene-bars'])).toEqual([]);
  });
});

describe('composedHeight', () => {
  it('is the tallest region for a row', () => {
    expect(composedHeight('row', [300, 420], 0)).toBe(420);
  });

  it('is the regions and the gaps between them for a stack', () => {
    expect(composedHeight('stack', [200, 150], 0)).toBe(350 + STACK_GAP);
  });

  it('adds a band and the gap before it, to either', () => {
    expect(composedHeight('row', [300], 96)).toBe(300 + STACK_GAP + 96);
    expect(composedHeight('stack', [100, 100], 96)).toBe(200 + STACK_GAP + STACK_GAP + 96);
  });

  it('is zero for nothing', () => {
    expect(composedHeight('row', [], 0)).toBe(0);
    expect(composedHeight('stack', [], 0)).toBe(0);
  });
});
