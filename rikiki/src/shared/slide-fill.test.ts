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

  it('defers to the theme rather than dropping the layout', () => {
    // A typo must not silently remove the layout · BENTO-11 was exactly this
    // failure mode on deck-cell. An empty value means "no per-slide opinion",
    // and the layouts fall through to --rik-slide-spread, then to flex-start.
    expect(spreadValue('bogus')).toBe('');
    expect(spreadValue('')).toBe('');
    expect(spreadValue(undefined)).toBe('');
    expect(spreadValue(null)).toBe('');
  });

  it('takes `theme` as an explicit way to say "use the theme default"', () => {
    expect(spreadValue('theme')).toBe('');
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
