import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';

// The template and the gates, pinned to each other.
//
// A scaffold that stops producing conforming code is worse than no scaffold:
// the contributor copies it, a guard fires, and the fix goes into their file
// instead of the template. So the generator's output is run through the same
// rules scripts/component-contract.test.mjs enforces, here, rather than
// trusted to stay in step.

const PKG_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const GENERATOR = resolve(PKG_DIR, 'scripts/new-component.mjs');

const sandboxes = [];
function generate(args) {
  const into = mkdtempSync(join(tmpdir(), 'rikiki-gen-'));
  sandboxes.push(into);
  const stdout = execFileSync('node', [GENERATOR, ...args, '--into', into], {
    cwd: PKG_DIR,
    encoding: 'utf8',
  });
  return { into, stdout };
}

afterAll(() => {
  for (const dir of sandboxes) rmSync(dir, { recursive: true, force: true });
});

describe('the generated component passes every contract rule', () => {
  const { into } = generate(['text', 'deck-probe']);
  const source = readFileSync(join(into, 'src/text/deck-probe.ts'), 'utf8');

  it('opens with a usage header', () => {
    expect(source.split('\n')[0].startsWith('//')).toBe(true);
  });

  it('declares its tag on HTMLElementTagNameMap', () => {
    expect(source).toContain('HTMLElementTagNameMap');
  });

  it('styles through `static override styles`', () => {
    expect(source).toContain('static override styles');
  });

  it('defines the element it is named after', () => {
    expect(source).toContain("@customElement('deck-probe')");
  });

  it('hardcodes no colour', () => {
    expect(source).not.toMatch(/#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})(?![\w-])/);
  });

  it('writes no em-dash · the dash linter fails the lint job on one', () => {
    expect(source).not.toContain('—');
  });

  it('exposes its knobs as --deck-* tokens over --rik-* defaults', () => {
    // Token discipline is the one rule a contributor breaks without noticing,
    // because a literal renders fine in the theme they happen to be using.
    expect(source).toMatch(/var\(--deck-probe-[a-z-]+, var\(--rik-[a-z0-9-]+\)\)/);
  });

  it('renders it on a slide, so a fixture covers it from the first commit', () => {
    const fixture = readFileSync(join(into, 'decks/tests/deck-probe.html'), 'utf8');
    expect(fixture).toContain('<deck-probe');
  });
});

describe('it refuses what would not build', () => {
  const fails = (args) => {
    try {
      execFileSync('node', [GENERATOR, ...args], { cwd: PKG_DIR, stdio: 'pipe' });
      return null;
    } catch (error) {
      return `${error.stdout ?? ''}${error.stderr ?? ''}`;
    }
  };

  it('refuses a directory that is not a family', () => {
    expect(fails(['misc', 'deck-probe'])).toMatch(/not a family/);
  });

  it('refuses a tag already registered', () => {
    // dist/ is flat, so two modules with one basename overwrite each other.
    expect(fails(['text', 'deck-md'])).toMatch(/already/);
  });

  it('refuses a name that is not a deck- custom element', () => {
    // A custom element name needs its hyphen, and every element here is a
    // deck- one · the flat dist makes the prefix the namespace.
    expect(fails(['text', 'probe'])).toMatch(/deck-/);
  });
});

describe('it says what it could not do', () => {
  const { stdout } = generate(['data', 'deck-probe-two']);

  it('names the reference entry the author still owes', () => {
    expect(stdout).toMatch(/rikiki-reference\.md/);
  });

  it('names the rebuild', () => {
    expect(stdout).toMatch(/npm run build/);
  });
});
