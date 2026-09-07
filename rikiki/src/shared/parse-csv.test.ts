import { describe, expect, it } from 'vitest';
import { parseCsv } from './parse-csv.js';

describe('parseCsv', () => {
  it('parses a simple grid', () => {
    expect(parseCsv('a,b,c\n1,2,3')).toEqual([
      ['a', 'b', 'c'],
      ['1', '2', '3'],
    ]);
  });

  it('keeps the delimiter inside quoted fields', () => {
    expect(parseCsv('name,note\n"Smith, J.","a, b, c"')).toEqual([
      ['name', 'note'],
      ['Smith, J.', 'a, b, c'],
    ]);
  });

  it('unescapes doubled quotes inside a quoted field', () => {
    expect(parseCsv('q\n"she said ""hi"""')).toEqual([['q'], ['she said "hi"']]);
  });

  it('handles \\r\\n line endings and a trailing newline', () => {
    expect(parseCsv('a,b\r\n1,2\r\n')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });

  it('supports a custom delimiter', () => {
    expect(parseCsv('a;b\n1;2', ';')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });

  it('drops fully-blank separator lines but keeps real rows', () => {
    expect(parseCsv('a,b\n\n1,2')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });

  it('returns an empty matrix for empty input', () => {
    expect(parseCsv('')).toEqual([]);
  });
});

// ── Regressions · data loss and dropped terminators (v1.0 audit) ──

describe('rows a deck author cannot afford to lose', () => {
  it('keeps a quoted empty field as its own row', () => {
    // `""` is an explicit empty value, not the blank spacer line the filter
    // is meant to drop.
    expect(parseCsv('name\n""\nbob')).toEqual([['name'], [''], ['bob']]);
  });

  it('still drops an unquoted blank spacer line', () => {
    expect(parseCsv('a\n\nb')).toEqual([['a'], ['b']]);
  });

  it('treats a lone \\r as a row terminator', () => {
    // Classic-Mac and some spreadsheet exports use CR alone · today every row
    // collapses into one.
    expect(parseCsv('a,b\rc,d')).toEqual([
      ['a', 'b'],
      ['c', 'd'],
    ]);
  });

  it('does not split twice on a CRLF pair', () => {
    expect(parseCsv('a,b\r\nc,d')).toEqual([
      ['a', 'b'],
      ['c', 'd'],
    ]);
  });

  it('splits on a multi-character delimiter', () => {
    expect(parseCsv('a::b::c', '::')).toEqual([['a', 'b', 'c']]);
  });

  it('keeps a lone delimiter character as text when the delimiter is longer', () => {
    expect(parseCsv('a:b::c', '::')).toEqual([['a:b', 'c']]);
  });
});
