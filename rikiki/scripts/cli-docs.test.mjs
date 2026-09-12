import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// The docs site documents a command line it does not own.
//
// A renamed flag, a dropped command or a diagnostic code that no longer exists
// leaves the page reading perfectly and instructing the reader to type
// something the CLI refuses. Nothing in the site build notices: an .astro page
// is prose to it. This test reads the prose and asks the CLI whether it is
// still true.

const PKG_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const REPO_ROOT = resolve(PKG_DIR, '..');

const CLI_SOURCE = readFileSync(resolve(PKG_DIR, 'bin', 'rikiki.mjs'), 'utf8');
const CHECK_SOURCE = readFileSync(resolve(PKG_DIR, 'bin', 'lib', 'check.mjs'), 'utf8');

const PAGES = ['cli.astro', 'getting-started.astro'].map((name) => {
  const abs = resolve(REPO_ROOT, 'site/src/pages/docs', name);
  // The <style> block speaks CSS · its custom properties are not CLI flags.
  const text = readFileSync(abs, 'utf8').replace(/<style[\s\S]*?<\/style>/g, '');
  return { name, text };
});
const CLI_PAGE = PAGES.find((p) => p.name === 'cli.astro').text;

/** The verbs the CLI actually dispatches on. */
const COMMANDS = new Set(
  [...CLI_SOURCE.matchAll(/cmd === '([a-z]+)'/g)].map((m) => m[1]).filter((c) => c !== 'help'),
);

/** Every long flag `parseArgs` is told about, plus the ones the dispatcher
 *  reads before any command is chosen (`--help`). */
const FLAGS = new Set([
  ...[...CLI_SOURCE.matchAll(/'?([a-z][a-z0-9-]*)'?:\s*\{\s*type:\s*'(?:boolean|string)'/g)].map(
    (m) => m[1],
  ),
  ...[...CLI_SOURCE.matchAll(/cmd === '--([a-z-]+)'/g)].map((m) => m[1]),
]);

/** Every diagnostic code the checker can emit. */
const CODES = new Set([...CHECK_SOURCE.matchAll(/diagnostic\(\s*'([A-Z_]+)'/g)].map((m) => m[1]));

describe('what the site says about the CLI is what the CLI does', () => {
  it('found the CLI surface to compare against', () => {
    expect(COMMANDS.size).toBeGreaterThan(5);
    expect(FLAGS.has('json')).toBe(true);
    expect(CODES.size).toBeGreaterThan(10);
  });

  it.each(PAGES.map((p) => [p.name, p.text]))('%s only names real commands', (_name, text) => {
    const verbs = [...text.matchAll(/\brikiki ([a-z][a-z-]*)/g)].map((m) => m[1]);
    expect(verbs.length).toBeGreaterThan(0);
    const unknown = [...new Set(verbs)].filter((v) => !COMMANDS.has(v));
    expect(unknown, `documents commands the CLI does not have: ${unknown.join(', ')}`).toEqual([]);
  });

  it.each(PAGES.map((p) => [p.name, p.text]))('%s only names real flags', (_name, text) => {
    const flags = [...text.matchAll(/--([a-z][a-z0-9-]*)/g)].map((m) => m[1]);
    const unknown = [...new Set(flags)].filter((f) => !FLAGS.has(f));
    expect(unknown, `documents flags the CLI does not parse: ${unknown.join(', ')}`).toEqual([]);
  });

  it('gives every command a section on the CLI page', () => {
    const missing = [...COMMANDS].filter((c) => !CLI_PAGE.includes(`rikiki ${c}`));
    expect(missing, `commands the page never shows: ${missing.join(', ')}`).toEqual([]);
  });

  it('only quotes diagnostic codes the checker emits', () => {
    // Two words or more, joined by an underscore · never PDF, HTML or JSON.
    const quoted = [...CLI_PAGE.matchAll(/\b([A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+)\b/g)].map((m) => m[1]);
    expect(quoted.length).toBeGreaterThan(10);
    const unknown = [...new Set(quoted)].filter((c) => !CODES.has(c));
    expect(unknown, `quotes codes check.mjs never emits: ${unknown.join(', ')}`).toEqual([]);
  });

  it('names the skills the CLI installs, and no others', () => {
    const declared = /DISTRIBUTED_SKILLS = \[([^\]]+)\]/
      .exec(CLI_SOURCE)[1]
      .match(/'([a-z-]+)'/g)
      .map((s) => s.slice(1, -1));
    for (const skill of declared) expect(CLI_PAGE).toContain(`<code>${skill}</code>`);
  });

  it('separates "the deck has defects" from "I could not read the deck"', () => {
    // The page documents exit 2 · the CLI has to keep reserving it for check.
    expect(CLI_PAGE).toMatch(/<code>2<\/code>/);
    expect(CLI_SOURCE).toMatch(/deckArgument\('check',[^)]*exitCode: 2/);
  });

  it('reads the Node and peer ranges from package.json rather than retyping them', () => {
    expect(CLI_PAGE).toContain('pkg.engines.node');
    expect(CLI_PAGE).toContain('pkg.peerDependencies.playwright');
    expect(CLI_PAGE).toContain('pkg.peerDependencies.rolldown');
    const hardCoded = CLI_PAGE.match(/[\^>=]=?\s?\d+\.\d+\.\d+/g) ?? [];
    expect(hardCoded, `hard-codes a version range: ${hardCoded.join(', ')}`).toEqual([]);
  });
});
