import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { bundledElements, separateElements } from './component-surfaces.mjs';
import { measureSizes, toKb } from './size-surfaces.mjs';

// The README is generated, so the thing to test is the generator.
//
// Two properties matter. The committed README must agree with what the
// generator produces right now, which is what `--check` asserts in CI. And
// the generator must FAIL rather than improvise when it is asked for a value
// it cannot measure · a README that silently prints a plausible default is
// precisely the failure that generating it was meant to remove.

const PKG_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const REPO_ROOT = resolve(PKG_DIR, '..');
const GENERATOR = resolve(PKG_DIR, 'scripts/build-readme.mjs');
const README = resolve(REPO_ROOT, 'README.md');
const TEMPLATE = resolve(REPO_ROOT, 'README.template.md');

const readme = readFileSync(README, 'utf8');
const sizes = measureSizes();

describe('the committed README says what the artifact measures', () => {
  it('is current · `npm run readme` would change nothing', () => {
    const result = execFileSync(process.execPath, [GENERATOR, '--check'], {
      cwd: PKG_DIR,
      encoding: 'utf8',
    });
    expect(result).toContain('already current');
  });

  it('announces itself as generated, so nobody edits it by hand', () => {
    expect(readme.split('\n')[0]).toContain('README.template.md');
  });

  it.each([
    ['the default bundle count', `**${bundledElements().length} elements in the default bundle**`],
    ['the separately loaded count', `and ${separateElements().length} more you`],
    ['the initial load', `**${toKb(sizes.initialLoadGzip)} KB gzip**`],
    ['the engine size', `${toKb(sizes.bundleGzip)} KB gzip of them`],
  ])('carries %s', (_label, expected) => {
    expect(readme).toContain(expected);
  });

  it('lists every CLI command the binary offers', () => {
    const help = execFileSync(process.execPath, [resolve(PKG_DIR, 'bin/rikiki.mjs'), '--help'], {
      encoding: 'utf8',
    });
    const commands = [...new Set([...help.matchAll(/^ {2}rikiki ([a-z]+)/gm)].map((m) => m[1]))];
    expect(commands.length).toBeGreaterThan(3);
    for (const name of commands) expect(readme).toContain(`| \`${name}\` |`);
  });
});

describe('it refuses rather than improvises', () => {
  // Each case doctors a real file and restores it in a finally block · the
  // last assertion in this block is what proves the restores happened.

  it('fails on a placeholder it cannot measure', () => {
    const original = readFileSync(TEMPLATE, 'utf8');
    writeFileSync(TEMPLATE, `${original}\n{{ somethingNobodyMeasures }}\n`);
    try {
      expect(() =>
        execFileSync(process.execPath, [GENERATOR, '--check'], { cwd: PKG_DIR, stdio: 'pipe' }),
      ).toThrow(/unknown values/);
    } finally {
      writeFileSync(TEMPLATE, original);
    }
  });

  it('fails on a CLI command with no description', () => {
    // The command LIST comes from the binary; the descriptions are prose in
    // the generator. A new command must not slip into the README nameless.
    const bin = resolve(PKG_DIR, 'bin/rikiki.mjs');
    const original = readFileSync(bin, 'utf8');
    // Anchored inside the HELP literal · a shorter anchor matches the usage
    // comment at the top of the file first, and splices a bare line into it.
    const anchor = '  rikiki init [name.html] [options]';
    expect(original, 'the help block no longer looks the way this test expects').toContain(anchor);
    writeFileSync(bin, original.replace(anchor, `  rikiki probe [x]   undescribed\n${anchor}`));
    try {
      expect(() =>
        execFileSync(process.execPath, [GENERATOR, '--check'], { cwd: PKG_DIR, stdio: 'pipe' }),
      ).toThrow(/no description/);
    } finally {
      writeFileSync(bin, original);
    }
  });

  it('leaves the repository as it found it', () => {
    // The two cases above edit real files and restore them · if a restore
    // ever fails, this is the assertion that says so rather than the next
    // contributor discovering it.
    expect(readFileSync(README, 'utf8')).toBe(readme);
    expect(readFileSync(TEMPLATE, 'utf8')).not.toContain('somethingNobodyMeasures');
    expect(readFileSync(resolve(PKG_DIR, 'bin/rikiki.mjs'), 'utf8')).not.toContain('rikiki probe');
  });
});
