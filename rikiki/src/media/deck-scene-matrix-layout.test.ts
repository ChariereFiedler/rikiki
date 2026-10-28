import { describe, expect, it } from 'vitest';
import {
  DEFAULT_STATUS_WORDS,
  dotDelays,
  flowLine,
  legendStatuses,
  parseColumns,
  parseGroups,
  parseLevels,
  parseStatusWords,
  unfitWords,
} from './deck-scene-matrix-layout.js';

describe('unfitWords', () => {
  const word = (text: string, fits: boolean) => ({ lines: text.split(' '), fits });

  it('names every word of a row that did not fit, not only the first', () => {
    // Seed 2, case 323: "announced" missed its column by a few units, and the
    // long status word after it ran into its neighbour without being named.
    const row = [
      word('announced', false),
      word('in test', true),
      word('Donaudampfschifffahrtsgesellschaft', false),
    ];
    expect(unfitWords(row).map((w) => w.lines.join(' '))).toEqual([
      'announced',
      'Donaudampfschifffahrtsgesellschaft',
    ]);
  });

  it('names a word once however many columns repeat it, and nothing when all fit', () => {
    const long = word('nothing yet at all', false);
    expect(unfitWords([long, word('pilot', true), long])).toEqual([long]);
    expect(unfitWords([word('pilot', true), word('in test', true)])).toEqual([]);
  });
});

describe('parseColumns', () => {
  it('splits on the bar and trims each header', () => {
    expect(parseColumns(' be cited |catalogue | brand app ')).toEqual([
      'be cited',
      'catalogue',
      'brand app',
    ]);
  });

  it('drops empty headers and keeps at most twelve', () => {
    expect(parseColumns('a || b |')).toEqual(['a', 'b']);
    expect(parseColumns(Array.from({ length: 14 }, (_, i) => `c${i}`).join('|'))).toHaveLength(12);
  });

  it('returns no column for a missing attribute', () => {
    expect(parseColumns(undefined)).toEqual([]);
  });
});

describe('parseGroups', () => {
  it('turns name:count pairs into consecutive spans', () => {
    expect(parseGroups('be found:2 | be chosen:2 | sell:4', 8)).toEqual([
      { name: 'be found', start: 0, count: 2 },
      { name: 'be chosen', start: 2, count: 2 },
      { name: 'sell', start: 4, count: 4 },
    ]);
  });

  it('keeps a colon inside the name and reads the count after the last one', () => {
    expect(parseGroups('phase 1: discovery:3', 3)).toEqual([
      { name: 'phase 1: discovery', start: 0, count: 3 },
    ]);
  });

  it('cuts a group at the last column and drops the groups past it', () => {
    expect(parseGroups('a:2 | b:3 | c:1', 4)).toEqual([
      { name: 'a', start: 0, count: 2 },
      { name: 'b', start: 2, count: 2 },
    ]);
  });

  it('ignores an entry without a positive count', () => {
    expect(parseGroups('a | b:0 | c:2', 2)).toEqual([{ name: 'c', start: 0, count: 2 }]);
  });
});

describe('parseStatusWords', () => {
  it('uses the English defaults when nothing is given', () => {
    expect(parseStatusWords(undefined)).toEqual(DEFAULT_STATUS_WORDS);
  });

  it('replaces the words given and keeps the defaults for the others', () => {
    const words = parseStatusWords('prod=en production | none=rien à ce jour');
    expect(words.prod).toBe('en production');
    expect(words.none).toBe('rien à ce jour');
    expect(words.test).toBe(DEFAULT_STATUS_WORDS.test);
  });

  it('ignores an unknown status', () => {
    expect(parseStatusWords('live=yes')).toEqual(DEFAULT_STATUS_WORDS);
  });
});

describe('parseLevels', () => {
  it('reads one status per column', () => {
    expect(parseLevels('prod pilot test', 3)).toEqual(['prod', 'pilot', 'test']);
  });

  it('reads a missing or unknown status as none', () => {
    expect(parseLevels('prod live', 3)).toEqual(['prod', 'none', 'none']);
  });

  it('drops statuses past the last column', () => {
    expect(parseLevels('prod prod prod', 2)).toEqual(['prod', 'prod']);
  });
});

describe('legendStatuses', () => {
  it('lists the statuses present, in the order of the scale, once each', () => {
    expect(
      legendStatuses([
        ['none', 'prod'],
        ['test', 'prod'],
      ]),
    ).toEqual(['prod', 'test', 'none']);
  });
});

describe('dotDelays', () => {
  it('runs column by column, the second row after the first', () => {
    const delays = dotDelays(2, 3, 0.1, 0.1, 2);
    expect(delays[0]).toEqual([0.1, 0.2, 0.3]);
    expect(delays[1]?.[0]).toBeCloseTo(0.4);
  });

  it('tightens the step so the last dot starts within the budget', () => {
    const delays = dotDelays(6, 12, 0.1, 0.1, 2);
    expect(delays[5]?.[11]).toBeCloseTo(2);
  });
});

describe('flowLine', () => {
  it('places entries one after the other on a line', () => {
    expect(flowLine([100, 200], 40, 1000)).toEqual([
      { x: 0, line: 0 },
      { x: 140, line: 0 },
    ]);
  });

  it('starts a new line when an entry would run past the width', () => {
    expect(flowLine([600, 600, 100], 40, 1000)).toEqual([
      { x: 0, line: 0 },
      { x: 0, line: 1 },
      { x: 640, line: 1 },
    ]);
  });
});
