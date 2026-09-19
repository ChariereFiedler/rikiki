import { describe, expect, it } from 'vitest';
import { expandCards, lintCards, parseCardOpts, parseCards } from './cards-syntax.js';

// A fake renderer · keeps the structural assertions free of marked's HTML.
const render = { inline: (s: string) => `I(${s})`, block: (s: string) => `B(${s})` };

describe('parseCardOpts', () => {
  it('reads cols and gap', () => {
    expect(parseCardOpts(' cols=3 gap=2')).toEqual({ cols: 3, gap: 2 });
  });
  it('ignores out-of-range gap and junk', () => {
    expect(parseCardOpts('cols=2 gap=9 foo')).toEqual({ cols: 2 });
  });
  it('is empty when nothing is set', () => {
    expect(parseCardOpts('')).toEqual({});
  });
});

describe('parseCards', () => {
  it('splits cards on :: and collects bodies', () => {
    const cards = parseCards(
      ':: warn | Build cost\nsource vs prebuilt\n:: ok | Control\nwho owns it',
    );
    expect(cards).toEqual([
      { tone: 'warn', title: 'Build cost', body: 'source vs prebuilt' },
      { tone: 'ok', title: 'Control', body: 'who owns it' },
    ]);
  });

  it('reads tone and span in any order before the pipe', () => {
    expect(parseCards(':: ok 2x1 | Control\nx')[0]).toMatchObject({ tone: 'ok', span: '2x1' });
    expect(parseCards(':: 2x1 ok | Control\nx')[0]).toMatchObject({ tone: 'ok', span: '2x1' });
  });

  it('supports a title-only card (no tone, no pipe)', () => {
    expect(parseCards(':: Just a title\nbody')[0]).toEqual({ title: 'Just a title', body: 'body' });
  });

  it('keeps multi-line bodies', () => {
    expect(parseCards(':: info | T\nline one\nline two')[0].body).toBe('line one\nline two');
  });
});

describe('lintCards', () => {
  it('passes a balanced block', () => {
    expect(lintCards('::: cards\n:: | A\nx\n:::')).toBeNull();
  });
  it('flags an unclosed block', () => {
    expect(lintCards('::: cards\n:: | A\nx')).toMatch(/Unclosed/);
  });
  it('passes prose with no block', () => {
    expect(lintCards('# Title\n\njust text')).toBeNull();
  });
});

describe('expandCards', () => {
  it('replaces a cards block with a comment placeholder and renders the grid', () => {
    const src = 'before\n\n::: cards cols=3\n:: warn | A\nbody a\n:::\n\nafter';
    const { text, blocks } = expandCards(src, render);
    expect(text).toContain('<!--cards:0-->');
    expect(text).toContain('before');
    expect(text).toContain('after');
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toContain('--cards-cols:3');
    expect(blocks[0]).toContain('data-tone="warn"');
    expect(blocks[0]).toContain('<h3>I(A)</h3>');
    expect(blocks[0]).toContain('B(body a)');
  });

  it('defaults cols to the card count', () => {
    const { blocks } = expandCards('::: cards\n:: | A\n:: | B\n:::', render);
    expect(blocks[0]).toContain('--cards-cols:2');
  });

  it('emits a span style when a card declares one', () => {
    const { blocks } = expandCards('::: cards\n:: ok 2x1 | A\nx\n:::', render);
    expect(blocks[0]).toContain('grid-column:span 2');
    expect(blocks[0]).toContain('grid-row:span 1');
  });

  it('leaves text without a cards block untouched', () => {
    const { text, blocks } = expandCards('# title\n\njust prose', render);
    expect(text).toBe('# title\n\njust prose');
    expect(blocks).toHaveLength(0);
  });
});
