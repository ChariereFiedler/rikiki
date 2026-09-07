import { readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ROOT, cssBlocks, lineAt, sources } from './css-source.mjs';

// A backtick inside a css`` template literal CLOSES it, and the file then fails
// to parse with an error that points nowhere near the comment that caused it.
// It has cost three debugging rounds; a test costs none.

const SRC = join(ROOT, 'src');
const files = sources(SRC);

describe('no backtick inside a css template literal', () => {
  it('finds template literals to check', () => {
    expect(files.some((f) => readFileSync(f, 'utf8').includes('css`'))).toBe(true);
  });

  it.each(files)('%s', (file) => {
    const src = readFileSync(file, 'utf8');
    const offenders = cssBlocks(src)
      .filter((b) => b.body.includes('`'))
      .map((b) => lineAt(src, b.start));
    expect(
      offenders,
      `${relative(SRC, file)} has a backtick inside a css template, near line ${offenders.join(', ')}`,
    ).toEqual([]);
  });
});
