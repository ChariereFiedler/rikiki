import { describe, expect, it } from 'vitest';
import { selectSlides } from './slide-selector.mjs';

const ids = ['cover', 'u2-etat', 'u2-mecanisme', 'offre', 'strat', 'sources', null, 'merci'];
const outline = ids.map((id, i) => ({ index: i + 1, id, tag: 'deck-feature', title: `slide ${i + 1}` }));
const positions = (selector) => selectSlides(outline, selector).map((s) => s.index);

describe('selectSlides', () => {
  it('keeps every slide when nothing is asked', () => {
    expect(selectSlides(outline, undefined)).toBe(outline);
    expect(selectSlides(outline, '')).toBe(outline);
  });

  it('takes one slide by position or by id', () => {
    expect(positions('3')).toEqual([3]);
    expect(positions('u2-etat')).toEqual([2]);
  });

  it('takes a list in deck order, each slide once', () => {
    expect(positions('merci,2,cover,2')).toEqual([1, 2, 8]);
  });

  it('takes an interval, and several intervals, inclusive', () => {
    expect(positions('2-4')).toEqual([2, 3, 4]);
    expect(positions('1-2,5-6,8')).toEqual([1, 2, 5, 6, 8]);
    expect(positions('3-3')).toEqual([3]);
  });

  it('opens an interval at either end', () => {
    expect(positions('-2')).toEqual([1, 2]);
    expect(positions('7-')).toEqual([7, 8]);
  });

  it('takes the slides between two ends named by id or position', () => {
    expect(positions('u2-etat..offre')).toEqual([2, 3, 4]);
    expect(positions('3..strat')).toEqual([3, 4, 5]);
    expect(positions('sources..merci')).toEqual([6, 7, 8]);
  });

  it('merges intervals that overlap', () => {
    expect(positions('2-5,4-6')).toEqual([2, 3, 4, 5, 6]);
  });

  it('does not read a hyphenated id as an interval', () => {
    expect(positions('u2-mecanisme')).toEqual([3]);
  });

  it.each([['9'], ['nope'], ['5-3'], ['0-2'], ['6-12'], ['offre..cover'], ['a..b..c'], ['-']])(
    'refuses %s and says what the deck holds',
    (selector) => {
      const pick = () => selectSlides(outline, selector, { command: 'check', exitCode: 2 });
      expect(pick).toThrow(/check · no slide matches/);
      expect(pick).toThrow(/this deck has: 1 \(cover\), 2 \(u2-etat\)/);
    },
  );

  it('exits with the code the caller asked for, 1 by default', () => {
    const exitCodeOf = (options) => {
      try {
        selectSlides(outline, 'nope', options);
      } catch (error) {
        return error.exitCode;
      }
    };
    expect(exitCodeOf(undefined)).toBe(1);
    expect(exitCodeOf({ command: 'check', exitCode: 2 })).toBe(2);
  });

  it('names every token it could not place', () => {
    expect(() => selectSlides(outline, '2,ghost,40')).toThrow(/"ghost", "40"/);
  });

  it('refuses a selector made of separators only', () => {
    expect(() => selectSlides(outline, ' , ')).toThrow(/names no slide/);
  });
});
