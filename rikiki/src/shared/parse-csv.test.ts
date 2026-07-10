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
