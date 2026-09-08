import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

// `rikiki assemble` builds one deck out of ordered partials. It used to live in
// build/vite-deck.mjs, which `files` never published: the reference taught a
// command a consumer could not run.

const PKG_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CLI = join(PKG_DIR, 'bin', 'rikiki.mjs');

let dir;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'rikiki assemble '));
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

function run(args) {
  const r = spawnSync(process.execPath, [CLI, 'assemble', ...args], {
    cwd: dir,
    encoding: 'utf8',
  });
  return { stdout: r.stdout ?? '', stderr: r.stderr ?? '', status: r.status ?? 1 };
}

/** Write a config plus its partials, and return the config's name. */
function fixture(config, partials) {
  mkdirSync(join(dir, 'parts'), { recursive: true });
  for (const [name, body] of Object.entries(partials)) {
    writeFileSync(join(dir, 'parts', name), body);
  }
  writeFileSync(join(dir, 'deck.config.json'), JSON.stringify(config, null, 2));
  return 'deck.config.json';
}

describe('assemble joins partials into one deck', () => {
  it('inlines html verbatim and wraps each markdown chunk in its own slide', () => {
    const config = fixture(
      { title: 'A talk', slides: ['parts/cover.html', 'parts/body.md'] },
      {
        'cover.html': '<deck-cover><h1>Hello</h1></deck-cover>',
        'body.md': 'First slide\n\n---\n\nSecond slide',
      },
    );
    const run1 = run([config, 'out.html']);
    expect(run1.status, run1.stderr).toBe(0);

    const html = readFileSync(join(dir, 'out.html'), 'utf8');
    expect(html).toContain('<deck-cover><h1>Hello</h1></deck-cover>');
    expect(html.match(/<deck-feature>/g)).toHaveLength(2);
    expect(html).toContain('First slide');
    expect(html).toContain('Second slide');
    expect(html).toContain('<title>A talk</title>');
  });

  it('defaults to the runtime paths `rikiki init` writes', () => {
    // The default must be the spelling the bundler rewrites · anything else
    // hands the author a deck that quietly refuses to become one file.
    const config = fixture(
      { title: 'D', slides: ['parts/a.html'] },
      { 'a.html': '<deck-takeaway/>' },
    );
    run([config, 'out.html']);
    const html = readFileSync(join(dir, 'out.html'), 'utf8');
    expect(html).toContain('href="rikiki/tokens.css"');
    expect(html).toContain('src="rikiki/dist/index.js"');
  });

  it('warns when a configured href will not inline, instead of failing silently', () => {
    const config = fixture(
      { title: 'D', theme: '../../tokens.css', slides: ['parts/a.html'] },
      { 'a.html': '<deck-takeaway/>' },
    );
    const result = run([config, 'out.html']);
    expect(result.status).toBe(0);
    expect(result.stderr).toMatch(/will not inline/);
  });

  it('names the output after the title when none is given', () => {
    const config = fixture(
      { title: 'My Big Talk', slides: ['parts/a.html'] },
      { 'a.html': '<deck-takeaway/>' },
    );
    expect(run([config]).status).toBe(0);
    expect(readFileSync(join(dir, 'my-big-talk.html'), 'utf8')).toContain('deck-root');
  });

  it('writes to stdout on `-`, leaving stderr for the notes', () => {
    const config = fixture(
      { title: 'D', slides: ['parts/a.html'] },
      { 'a.html': '<deck-takeaway/>' },
    );
    const result = run([config, '-']);
    expect(result.status).toBe(0);
    expect(result.stdout.startsWith('<!doctype html>')).toBe(true);
  });

  it('escapes a title rather than letting it close the tag', () => {
    const config = fixture(
      { title: 'a </title><script>x</script>', slides: ['parts/a.html'] },
      { 'a.html': '<deck-takeaway/>' },
    );
    run([config, 'out.html']);
    const html = readFileSync(join(dir, 'out.html'), 'utf8');
    expect(html).toContain('&lt;/title&gt;');
    expect(html).not.toContain('<script>x</script>');
  });
});

describe('assemble refuses what it cannot build', () => {
  it.each([
    [['missing.config.js'], /config not found/],
    [[], /missing <deck\.config/],
  ])('%s', (args, message) => {
    const result = run(args);
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(message);
    expect(result.stderr, 'an expected error must not print a stack').not.toMatch(/ {4}at /);
  });

  it('names the partial that is missing', () => {
    const config = fixture({ title: 'D', slides: ['parts/nope.html'] }, {});
    const result = run([config, 'out.html']);
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/partial not found: parts\/nope\.html/);
  });

  it('rejects a config without slides', () => {
    const config = fixture({ title: 'D', slides: [] }, {});
    const result = run([config, 'out.html']);
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/non-empty array/);
  });
});
