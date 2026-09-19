import { describe, expect, it } from 'vitest';
import { expandGap, expandTracks, parseSpan, toTrack } from './grid-tracks.js';

describe('expandTracks', () => {
  it('expands an integer 1..12 to a repeat() of equal minmax tracks', () => {
    expect(expandTracks('3')).toBe('repeat(3, minmax(0, 1fr))');
    expect(expandTracks('1')).toBe('repeat(1, minmax(0, 1fr))');
    expect(expandTracks('12')).toBe('repeat(12, minmax(0, 1fr))');
  });

  it('passes an explicit template through unchanged', () => {
    expect(expandTracks('1fr 2fr')).toBe('1fr 2fr');
    expect(expandTracks('auto 1fr')).toBe('auto 1fr');
  });

  it('does not treat out-of-range or mixed values as track counts', () => {
    expect(expandTracks('0')).toBe('0');
    expect(expandTracks('13')).toBe('13');
    expect(expandTracks('2 cols')).toBe('2 cols');
  });

  it('returns null for empty input', () => {
    expect(expandTracks(undefined)).toBeNull();
    expect(expandTracks('')).toBeNull();
  });
});

describe('expandGap', () => {
  it('maps 1..6 to the space token', () => {
    expect(expandGap('1')).toBe('var(--rik-space-1)');
    expect(expandGap('6')).toBe('var(--rik-space-6)');
  });

  it('passes a raw CSS length through when it does not start with a 1..6 token index', () => {
    expect(expandGap('0.75rem')).toBe('0.75rem');
    expect(expandGap('12px')).toBe('12px');
  });

  it('does not mistake a length whose integer part is 1..6 for a token index', () => {
    expect(expandGap('2rem')).toBe('2rem');
    expect(expandGap('3px')).toBe('3px');
    expect(expandGap('4vw')).toBe('4vw');
  });

  it('returns null for empty input', () => {
    expect(expandGap(undefined)).toBeNull();
  });
});

describe('toTrack', () => {
  it('turns a positive integer into a span', () => {
    expect(toTrack('2')).toBe('span 2');
  });

  it('passes raw line syntax through', () => {
    expect(toTrack('1 / 3')).toBe('1 / 3');
  });

  it('falls back to auto for empty input', () => {
    expect(toTrack(undefined)).toBe('auto');
  });
});

describe('parseSpan', () => {
  it('parses "CxR" into column and row spans', () => {
    expect(parseSpan('2x1')).toEqual({ col: 'span 2', row: 'span 1' });
    expect(parseSpan('1x2')).toEqual({ col: 'span 1', row: 'span 2' });
  });

  it('treats a bare count as a column span with an auto row', () => {
    expect(parseSpan('3')).toEqual({ col: 'span 3', row: 'auto' });
  });

  it('is case-insensitive on the separator', () => {
    expect(parseSpan('2X2')).toEqual({ col: 'span 2', row: 'span 2' });
  });

  it('defaults to auto placement when empty', () => {
    expect(parseSpan(undefined)).toEqual({ col: 'auto', row: 'auto' });
  });
});
