import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// A spec runs once per engine project. That is the point for a spec that
// renders, and pure waste for one that does not: the CLI specs shell out to
// `rikiki render` / `rikiki check`, which drive a Chromium of their own, so
// the project they run under changes nothing they exercise.
//
// It stayed unnoticed because the cost is invisible locally (parallel) and
// only bites on CI, where `workers: 1` serialises it: three identical runs of
// render-check.spec.ts were 16 of the suite's 35 minutes, and the browsers
// they piled up made its slowest case miss a 60 s page load on main.
//
// So the list in playwright.config.ts is checked against the specs rather
// than trusted. A new browser-free spec joins the `cli` project or this
// fails · the failure a reviewer cannot otherwise see.

const PKG_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const E2E = join(PKG_DIR, 'e2e');
const config = readFileSync(join(PKG_DIR, 'playwright.config.ts'), 'utf8');

/** The spec file names inside a `const <NAME> = [ … ]` list of regexes. */
function specList(name) {
  const block = config.match(new RegExp(`const ${name} = \\[([^\\]]*)\\]`))?.[1];
  if (!block) throw new Error(`playwright.config.ts no longer declares ${name}`);
  return [...block.matchAll(/\/([\w-]+\\\.spec\\\.ts)\//g)]
    .map((m) => m[1].replaceAll('\\.', '.'))
    .sort();
}

const specs = readdirSync(E2E).filter((f) => f.endsWith('.spec.ts'));

/** A spec is browser-free when it never asks Playwright for a page, a context
 *  or a browser · the three fixtures that make an engine project meaningful.
 *  Type-only mentions (`page: import('@playwright/test').Page` in a helper)
 *  do not count: the fixture is what costs a browser. */
function usesBrowser(file) {
  const source = readFileSync(join(E2E, file), 'utf8');
  return /async\s*\(\s*\{[^}]*\b(page|context|browser)\b/.test(source);
}

describe('a spec runs on the engines it actually needs', () => {
  it('every browser-free spec is in the cli project, and only those', () => {
    const browserFree = specs.filter((f) => !usesBrowser(f)).sort();
    expect(specList('CLI_ONLY')).toEqual(browserFree);
  });

  it('the cli project claims the list, and the engines all skip it', () => {
    expect(config).toMatch(/name: 'cli', testMatch: CLI_ONLY/);
    for (const engine of ['chromium', 'firefox', 'webkit']) {
      // From this project's name to the next one · `use: { … },` holds a brace
      // of its own, so a brace cannot delimit the block.
      const after = config.slice(config.indexOf(`name: '${engine}'`) + 1);
      const next = after.indexOf("name: '");
      const project = next === -1 ? after : after.slice(0, next);
      expect(project, `${engine} does not skip the CLI specs`).toMatch(
        /testIgnore: (CLI_ONLY|\[\.\.\.CLI_ONLY)/,
      );
    }
  });

  it('the chromium-only skips name capabilities, not whole engines', () => {
    // Firefox and WebKit must share one list · two hand-maintained lists is
    // how they silently drift apart.
    expect(specList('CHROMIUM_ONLY').length).toBeGreaterThan(0);
    expect(config.match(/\.\.\.CLI_ONLY, \.\.\.CHROMIUM_ONLY/g)).toHaveLength(2);
  });
});
