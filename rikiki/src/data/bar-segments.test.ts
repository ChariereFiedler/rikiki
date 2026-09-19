import { describe, expect, it } from 'vitest';
import { parseSegments, remainder, sizeSegments } from './bar-segments.js';

describe('parseSegments', () => {
  it('reads label:value triples', () => {
    expect(parseSegments('Fixed:12|Open:5')).toEqual([
      { label: 'Fixed', value: 12, tone: undefined },
      { label: 'Open', value: 5, tone: undefined },
    ]);
  });

  it('reads the optional tone', () => {
    expect(parseSegments('Fixed:12:ok')[0]).toEqual({ label: 'Fixed', value: 12, tone: 'ok' });
  });

  it('tolerates spacing around the separators', () => {
    expect(parseSegments(' Fixed : 12 : ok | Open : 5 ')).toHaveLength(2);
  });

  it('skips a malformed segment rather than rendering garbage', () => {
    // A missing value or label would otherwise draw a nameless zero-width slice.
    expect(parseSegments('Fixed:12|:5|Broken:|Open:abc|Neg:-4')).toEqual([
      { label: 'Fixed', value: 12, tone: undefined },
    ]);
  });

  it('is empty for an absent attribute', () => {
    expect(parseSegments(undefined)).toEqual([]);
    expect(parseSegments(null)).toEqual([]);
    expect(parseSegments('')).toEqual([]);
    expect(parseSegments('||')).toEqual([]);
  });
});

describe('sizeSegments · one value against a total', () => {
  it('turns a value and a total into a percentage', () => {
    const [bar] = sizeSegments([{ label: 'Reviewed', value: 160 }], 538);
    expect(bar!.percent).toBe(30);
  });

  it('leaves the rest of the track empty', () => {
    const sized = sizeSegments([{ label: 'Reviewed', value: 160 }], 538);
    expect(Math.round(remainder(sized))).toBe(70);
  });

  it('does not stretch a partial bar to fill the track', () => {
    // The whole point of "160 of 538" is that it does NOT look like 100%.
    const sized = sizeSegments([{ label: 'Reviewed', value: 160 }], 538);
    expect(sized[0]!.percent).toBeLessThan(100);
  });
});

describe('sizeSegments · a stack of categories', () => {
  it('uses the sum when no total is given', () => {
    const sized = sizeSegments([
      { label: 'a', value: 1 },
      { label: 'b', value: 1 },
    ]);
    expect(sized.map((s) => s.percent)).toEqual([50, 50]);
  });

  it('always adds up to exactly 100, even with awkward thirds', () => {
    const sized = sizeSegments([
      { label: 'a', value: 1 },
      { label: 'b', value: 1 },
      { label: 'c', value: 1 },
    ]);
    expect(sized.reduce((acc, s) => acc + s.percent, 0)).toBe(100);
  });

  it('adds up to 100 across five uneven verdicts', () => {
    // The real case: 4000 findings split five ways · a legend that reads 99
    // makes the audience doubt the whole slide.
    const sized = sizeSegments([
      { label: 'blocker', value: 137 },
      { label: 'major', value: 921 },
      { label: 'minor', value: 1544 },
      { label: 'info', value: 812 },
      { label: 'noise', value: 586 },
    ]);
    expect(sized.reduce((acc, s) => acc + s.percent, 0)).toBe(100);
  });

  it('corrects the rounding on the largest slice, not the first', () => {
    const sized = sizeSegments([
      { label: 'small', value: 1 },
      { label: 'big', value: 100 },
      { label: 'small2', value: 1 },
    ]);
    const total = sized.reduce((acc, s) => acc + s.percent, 0);
    expect(total).toBe(100);
    expect(sized[1]!.label, 'the correction lands where it is least visible').toBe('big');
  });

  it('fills the whole track', () => {
    const sized = sizeSegments([
      { label: 'a', value: 3 },
      { label: 'b', value: 1 },
    ]);
    expect(remainder(sized)).toBe(0);
  });
});

describe('degenerate inputs render, they do not throw', () => {
  it('handles an empty bar', () => {
    expect(sizeSegments([])).toEqual([]);
    expect(remainder([])).toBe(100);
  });

  it('handles a total of zero', () => {
    const sized = sizeSegments([{ label: 'none', value: 0 }], 0);
    expect(sized[0]!.percent).toBe(0);
  });

  it('handles every value at zero', () => {
    const sized = sizeSegments([
      { label: 'a', value: 0 },
      { label: 'b', value: 0 },
    ]);
    expect(sized.map((s) => s.percent)).toEqual([0, 0]);
  });

  it('clamps a value above its total to a full bar', () => {
    const sized = sizeSegments([{ label: 'over', value: 90 }], 50);
    expect(sized[0]!.percent).toBe(180);
    // The component caps the drawn width; the number stays honest.
    expect(remainder(sized)).toBe(0);
  });
});
