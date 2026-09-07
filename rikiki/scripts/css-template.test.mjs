import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// A backtick inside a css`` template literal CLOSES it, and the file then fails
// to parse with an error that points nowhere near the comment that caused it.
// It has cost three debugging rounds; a test costs none.

const SRC = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'src');

function sources(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return sources(full);
    return entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts') ? [full] : [];
  });
}

/** The body of every css`` literal in a file. */
function cssBlocks(src) {
  const blocks = [];
  const re = /\bcss`/g;
  let m = re.exec(src);
  while (m) {
    const start = m.index + m[0].length;
    const end = src.indexOf('`', start);
    if (end === -1) break;
    blocks.push({ start, body: src.slice(start, end) });
    re.lastIndex = end + 1;
    m = re.exec(src);
  }
  return blocks;
}

const files = sources(SRC);

describe('no backtick inside a css template literal', () => {
  it('finds template literals to check', () => {
    expect(files.some((f) => readFileSync(f, 'utf8').includes('css`'))).toBe(true);
  });

  it.each(files)('%s', (file) => {
    const src = readFileSync(file, 'utf8');
    const offenders = cssBlocks(src)
      .filter((b) => b.body.includes('`'))
      .map((b) => src.slice(0, b.start).split('\n').length);
    expect(
      offenders,
      `${relative(SRC, file)} has a backtick inside a css template, near line ${offenders.join(', ')}`,
    ).toEqual([]);
  });
});
