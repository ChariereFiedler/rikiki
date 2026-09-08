import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { scanExternal } from '../bin/lib/scan-external.mjs';

// The CLI as a consumer meets it: exit codes, refusals, and the paths that
// `init`'s own suite and the Playwright bundle/print suites do not cover.
//
// What lives elsewhere, on purpose:
//   · the source deck and its assets      → scripts/init-source.test.mjs
//   · assembling partials                 → scripts/assemble.test.mjs
//   · a bundle that fetches nothing, and  → e2e/bundle.spec.ts
//     the offline render of one
//   · a real PDF, page by page            → e2e/print.spec.ts

const PKG_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CLI = join(PKG_DIR, 'bin', 'rikiki.mjs');
const NO_ROLLDOWN = join(PKG_DIR, 'scripts/fixtures/block-rolldown.mjs');

let dir;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'rikiki cli '));
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

/** Run the CLI in the temp directory · never from the repo root. */
function cli(...args) {
  const r = spawnSync(process.execPath, [CLI, ...args], { cwd: dir, encoding: 'utf8' });
  return { stdout: r.stdout ?? '', stderr: r.stderr ?? '', status: r.status ?? 1 };
}

/** Same, with rolldown made unresolvable · what a fresh install looks like. */
function cliWithoutRolldown(...args) {
  const r = spawnSync(process.execPath, ['--import', NO_ROLLDOWN, CLI, ...args], {
    cwd: dir,
    encoding: 'utf8',
  });
  return { stdout: r.stdout ?? '', stderr: r.stderr ?? '', status: r.status ?? 1 };
}

describe('the CLI answers for itself', () => {
  it.each([['--help'], ['-h'], ['help']])('%s prints usage on stdout and succeeds', (flag) => {
    const run = cli(flag);
    expect(run.status).toBe(0);
    expect(run.stdout).toMatch(/rikiki init/);
    expect(run.stdout).toMatch(/rikiki assemble/);
  });

  it('prints usage when called with nothing at all', () => {
    const run = cli();
    expect(run.status).toBe(0);
    expect(run.stdout).toMatch(/rikiki bundle/);
  });

  it('names an unknown command and exits non-zero', () => {
    const run = cli('summarise');
    expect(run.status).toBe(1);
    expect(run.stderr).toMatch(/unknown command: summarise/);
  });

  it('documents every command it accepts', () => {
    // A command the help does not mention is a command nobody finds.
    const help = cli('--help').stdout;
    for (const command of ['init', 'assemble', 'bundle', 'export', 'skills']) {
      expect(help, `help omits \`${command}\``).toMatch(new RegExp(`rikiki ${command}\\b`));
    }
  });
});

describe('init · the shapes it can write', () => {
  it('writes a self-contained file under --standalone', () => {
    const run = cli('init', '--standalone', 'solo.html', '--title', 'Solo');
    expect(run.status, run.stderr).toBe(0);
    const html = readFileSync(join(dir, 'solo.html'), 'utf8');
    // Self-contained means nothing left to fetch. Grepping for a path would
    // trip over the same path quoted inside an inlined CSS comment · the
    // scanner reads the references the browser would actually follow.
    const external = scanExternal(html)
      .map((h) => h.ref)
      .filter((ref) => ref !== './index.js');
    expect(external, `still fetches: ${external.join(', ')}`).toEqual([]);
    expect(html.length).toBeGreaterThan(100_000);
    expect(existsSync(join(dir, 'rikiki')), 'a standalone deck needs no runtime beside it').toBe(
      false,
    );
  });

  it('refuses --standalone without rolldown, and writes nothing', () => {
    const run = cliWithoutRolldown('init', '--standalone', 'solo.html');
    expect(run.status).toBe(1);
    expect(run.stderr).toMatch(/npm i -D rolldown/);
    expect(existsSync(join(dir, 'solo.html')), 'a failed init must not leave a half deck').toBe(
      false,
    );
  });

  it('writes a source deck with no rolldown in sight', () => {
    // The whole point of the default mode: the first gesture costs one install.
    const run = cliWithoutRolldown('init', 'talk.html');
    expect(run.status, run.stderr).toBe(0);
    expect(existsSync(join(dir, 'rikiki/dist/index.js'))).toBe(true);
  });

  it('carries the heavy plugins only when asked', () => {
    expect(cli('init', 'plain.html').status).toBe(0);
    expect(existsSync(join(dir, 'rikiki/dist/vendor/mermaid.min.js'))).toBe(false);

    expect(cli('init', 'diagram.html', '--with-mermaid').status).toBe(0);
    expect(existsSync(join(dir, 'rikiki/dist/vendor/mermaid.min.js'))).toBe(true);
    const html = readFileSync(join(dir, 'diagram.html'), 'utf8');
    expect(html).toContain('rikiki/dist/vendor/mermaid.min.js');
    expect(html, 'the mermaid starter shows a diagram').toContain('<deck-mermaid>');
  });

  it('activates Shiki from the deck it writes', () => {
    expect(cli('init', 'code.html', '--with-shiki').status).toBe(0);
    const html = readFileSync(join(dir, 'code.html'), 'utf8');
    expect(html).toContain('rikiki/dist/vendor/shiki.js');
    expect(html).toContain('installShiki');
    expect(existsSync(join(dir, 'rikiki/dist/vendor/shiki.js'))).toBe(true);
  });

  it('writes to stdout on `-`, and copies nothing', () => {
    const run = cli('init', '-');
    expect(run.status).toBe(0);
    expect(run.stdout).toContain('<deck-root>');
    expect(existsSync(join(dir, 'rikiki'))).toBe(false);
    // Silence would leave the reader with a deck whose runtime is missing.
    expect(run.stderr).toMatch(/runtime/);
  });

  it('--force replaces the deck, and leaves the runtime usable', () => {
    expect(cli('init', 'talk.html', '--title', 'First').status).toBe(0);
    const run = cli('init', 'talk.html', '--title', 'Second', '--force');
    expect(run.status, run.stderr).toBe(0);
    expect(readFileSync(join(dir, 'talk.html'), 'utf8')).toContain('<title>Second</title>');
    expect(existsSync(join(dir, 'rikiki/dist/index.js'))).toBe(true);
  });

  it('drops the fonts under --no-fonts instead of inlining them', () => {
    // Only the siliceum theme carries font files · the default theme has none,
    // so the flag has nothing to remove there.
    const withFonts = cli('init', '--standalone', 'a.html', '--theme', 'siliceum');
    const without = cli('init', '--standalone', 'b.html', '--theme', 'siliceum', '--no-fonts');
    expect(withFonts.status, withFonts.stderr).toBe(0);
    expect(without.status, without.stderr).toBe(0);

    const heavy = readFileSync(join(dir, 'a.html'), 'utf8');
    const light = readFileSync(join(dir, 'b.html'), 'utf8');
    expect(heavy).toMatch(/data:font\/woff2;base64/);
    expect(light).not.toMatch(/data:font\/woff2;base64/);
    expect(light.length).toBeLessThan(heavy.length / 2);
  });

  it('leaves no @font-face rule pointing at nothing', () => {
    // `src: none` is not valid CSS · a dropped font must drop its whole rule,
    // not leave a declaration the browser has to throw away.
    cli('init', '--standalone', 'b.html', '--theme', 'siliceum', '--no-fonts');
    const light = readFileSync(join(dir, 'b.html'), 'utf8');
    expect(light).not.toMatch(/src:\s*none/);
  });
});

describe('bundle · what it refuses', () => {
  it('reports a missing input instead of writing one', () => {
    const run = cli('bundle', 'nope.html');
    expect(run.status).toBe(1);
    expect(run.stderr).toMatch(/input not found/);
  });

  it('asks for the deck when given no argument', () => {
    const run = cli('bundle');
    expect(run.status).toBe(1);
    expect(run.stderr).toMatch(/missing <deck\.html>/);
  });

  it('names rolldown and exits non-zero when it is absent', () => {
    writeFileSync(join(dir, 'deck.html'), '<deck-root><deck-takeaway/></deck-root>');
    const run = cliWithoutRolldown('bundle', 'deck.html');
    expect(run.status).toBe(1);
    expect(run.stderr).toMatch(/npm i -D rolldown/);
    expect(run.stderr, 'an expected error must not print a stack').not.toMatch(/ {4}at /);
  });
});

describe('export · what it refuses', () => {
  it('reports a missing input', () => {
    const run = cli('export', 'nope.html');
    expect(run.status).toBe(1);
    expect(run.stderr).toMatch(/input not found/);
  });

  it('asks for the deck when given no argument', () => {
    const run = cli('export');
    expect(run.status).toBe(1);
    expect(run.stderr).toMatch(/missing <deck\.html>/);
  });

  it('refuses a directory as politely as a missing file', () => {
    mkdirSync(join(dir, 'somewhere'));
    const run = cli('export', 'somewhere');
    expect(run.status).toBe(1);
    expect(run.stderr).toMatch(/input not found/);
  });
});

describe('skills · installing the agent instructions', () => {
  const SHIPPED = ['rikiki-deck', 'rikiki-theme', 'rikiki-debug'];

  it('installs the three shipped skills where an agent looks for them', () => {
    const run = cli('skills');
    expect(run.status, run.stderr).toBe(0);
    for (const name of SHIPPED) {
      expect(existsSync(join(dir, '.claude/skills', name, 'SKILL.md')), `${name} missing`).toBe(
        true,
      );
    }
  });

  it('installs only the three meant for a consumer', () => {
    // rikiki-component and rikiki-visual-design need the TypeScript sources ·
    // shipping them to a consumer would teach gestures they cannot perform.
    cli('skills');
    const { readdirSync } = require('node:fs');
    expect(readdirSync(join(dir, '.claude/skills')).sort()).toEqual([...SHIPPED].sort());
  });

  it('keeps an edited skill unless told otherwise', () => {
    cli('skills');
    const edited = join(dir, '.claude/skills/rikiki-deck/SKILL.md');
    writeFileSync(edited, 'my own notes');

    const second = cli('skills');
    expect(second.stderr).toMatch(/already exists · use --force/);
    expect(readFileSync(edited, 'utf8'), 'a second run must not overwrite').toBe('my own notes');

    expect(cli('skills', '--force').status).toBe(0);
    expect(readFileSync(edited, 'utf8')).toMatch(/rikiki/);
  });

  it('installs into an explicit directory', () => {
    const run = cli('skills', '--dir', 'agent/skills');
    expect(run.status, run.stderr).toBe(0);
    expect(existsSync(join(dir, 'agent/skills/rikiki-theme/SKILL.md'))).toBe(true);
  });
});
