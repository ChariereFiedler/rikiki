import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// "siliceum" is written in lower case, always · in a title, a comment, an example
// a reader copies, at the start of a sentence. A capital slips in unseen, so every
// tracked text file is read rather than trusted. The design notes are left out:
// they quote the wrong spelling to write the rule that refuses it.

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const TEXT = new Set([
  '.md',
  '.mjs',
  '.js',
  '.ts',
  '.css',
  '.html',
  '.astro',
  '.json',
  '.txt',
  '.yml',
  '.yaml',
]);
const QUOTING_THE_RULE = /^docs\/design\//;
// A capital S, then the rest in either case · written so it does not match itself.
const CAPITALISED = /[S][Ii][Ll][Ii][Cc][Ee][Uu][Mm]/;

/** This file, which writes the rule · it is read too, tracked yet or not, so the
 *  pattern above can never hold the spelling it refuses. */
const SELF = relative(REPO_ROOT, fileURLToPath(import.meta.url));

const tracked = execFileSync('git', ['ls-files'], { cwd: REPO_ROOT, encoding: 'utf8' })
  .split('\n')
  .filter((file) => TEXT.has(extname(file)) && !QUOTING_THE_RULE.test(file));
const read = [...new Set([...tracked, SELF])];

describe('the house spelling', () => {
  it('writes siliceum in lower case in every tracked text file, this one included', () => {
    expect(tracked.length).toBeGreaterThan(100);
    expect(read).toContain(SELF);
    const capitalised = read.flatMap((file) =>
      readFileSync(join(REPO_ROOT, file), 'utf8')
        .split('\n')
        .flatMap((line, index) => (CAPITALISED.test(line) ? [`${file}:${index + 1}`] : [])),
    );
    expect(capitalised).toEqual([]);
  });
});
