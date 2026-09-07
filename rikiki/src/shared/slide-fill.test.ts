import { describe, expect, it } from 'vitest';
import { SPREAD, spreadValue } from './slide-fill.js';

// `spread` distributes the leftover vertical space of a slide body; `fill`
// makes the body's children share that space instead. Both are opt-in, so an
// existing deck must be unaffected when the attribute is absent.

describe('spreadValue', () => {
  it('maps each documented value to its flexbox equivalent', () => {
    expect(spreadValue('between')).toBe('space-between');
    expect(spreadValue('around')).toBe('space-around');
    expect(spreadValue('evenly')).toBe('space-evenly');
    expect(spreadValue('center')).toBe('center');
    expect(spreadValue('end')).toBe('flex-end');
    expect(spreadValue('start')).toBe('flex-start');
  });

  it('falls back to the top-aligned default rather than dropping it', () => {
    // A typo must not silently remove the layout · BENTO-11 was exactly this
    // failure mode on deck-cell, and it is not repeated here.
    expect(spreadValue('bogus')).toBe('flex-start');
    expect(spreadValue('')).toBe('flex-start');
    expect(spreadValue(undefined)).toBe('flex-start');
    expect(spreadValue(null)).toBe('flex-start');
  });

  it('ignores case and surrounding whitespace', () => {
    expect(spreadValue('  Between ')).toBe('space-between');
  });

  it('documents exactly the values it accepts', () => {
    expect([...SPREAD.keys()].sort()).toEqual([
      'around',
      'between',
      'center',
      'end',
      'evenly',
      'start',
    ]);
  });
});
