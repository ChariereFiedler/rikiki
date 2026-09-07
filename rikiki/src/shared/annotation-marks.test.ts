import { describe, expect, it } from 'vitest';
import { parseMarks, placeMarks, stepsForMarks, visibleCount } from './annotation-marks.js';

describe('parseMarks', () => {
  it('reads x,y,label triples', () => {
    expect(parseMarks('35,60,Latency spike|10,20,Queue depth')).toEqual([
      { x: 35, y: 60, label: 'Latency spike' },
      { x: 10, y: 20, label: 'Queue depth' },
    ]);
  });

  it('keeps a comma inside the label', () => {
    // "Latency, p99" is a legitimate caption · only the first two commas split.
    expect(parseMarks('35,60,Latency, p99')[0]!.label).toBe('Latency, p99');
  });

  it('allows a mark with no label', () => {
    expect(parseMarks('35,60')).toEqual([{ x: 35, y: 60, label: '' }]);
  });

  it('tolerates spacing', () => {
    expect(parseMarks(' 35 , 60 , Spike ')[0]).toEqual({ x: 35, y: 60, label: 'Spike' });
  });

  it('clamps a coordinate outside the image', () => {
    expect(parseMarks('150,-20,Off')[0]).toEqual({ x: 100, y: 0, label: 'Off' });
  });

  it('DROPS a mark with an unreadable coordinate', () => {
    // A marker in the wrong corner is worse than a missing one · the room
    // believes what the speaker points at.
    expect(parseMarks('35,60,Good|abc,20,Bad|,,Empty')).toEqual([{ x: 35, y: 60, label: 'Good' }]);
  });

  it('is empty for an absent attribute', () => {
    expect(parseMarks(undefined)).toEqual([]);
    expect(parseMarks('')).toEqual([]);
    expect(parseMarks('||')).toEqual([]);
  });
});

describe('placeMarks', () => {
  it('numbers in document order, starting at 1', () => {
    expect(placeMarks(parseMarks('1,1,a|2,2,b')).map((m) => m.n)).toEqual([1, 2]);
  });
});

describe('progressive reveal', () => {
  it('shows nothing at step 0 · the image speaks first', () => {
    expect(visibleCount(3, 0)).toBe(0);
  });

  it('reveals one more per step', () => {
    expect(visibleCount(3, 1)).toBe(1);
    expect(visibleCount(3, 2)).toBe(2);
    expect(visibleCount(3, 3)).toBe(3);
  });

  it('keeps them all past the last step rather than wrapping', () => {
    expect(visibleCount(3, 9)).toBe(3);
  });

  it('never goes negative', () => {
    expect(visibleCount(3, -2)).toBe(0);
    expect(visibleCount(0, 5)).toBe(0);
  });

  it('asks the engine for one step per mark', () => {
    expect(stepsForMarks(3)).toBe(3);
    expect(stepsForMarks(0)).toBe(0);
  });
});
