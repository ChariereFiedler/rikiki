import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

// `rikiki init` is the first gesture of the public path. Before v1.0 it could
// only emit a bundle, so it failed outright on a fresh install where rolldown
// (an optional ~55 MB peer) is absent. The default is now an editable source
// deck whose assets sit next to it, and which needs nothing but Node.

const PKG_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CLI = join(PKG_DIR, 'bin', 'rikiki.mjs');

/** Run the CLI in `cwd` and return { stdout, stderr, status }. */
function runCli(args, cwd) {
  try {
    const stdout = execFileSync(process.execPath, [CLI, ...args], {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      maxBuffer: 64 * 1024 * 1024,
    });
    return { stdout, stderr: '', status: 0 };
  } catch (e) {
    return { stdout: e.stdout ?? '', stderr: e.stderr ?? '', status: e.status ?? 1 };
  }
}

describe('init writes an editable source deck', () => {
  // A path with a space · the previous CLI was only ever exercised from the
  // repo root, where no segment contains one.
  let dir;
  let html;

  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), 'rikiki init '));
    const run = runCli(['init', 'talk.html', '--title', 'A talk'], dir);
    expect(run.status, run.stderr).toBe(0);
    html = readFileSync(join(dir, 'talk.html'), 'utf8');
  });

  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  it('references the runtime by path instead of inlining it', () => {
    expect(html).toContain('src="rikiki/dist/index.js"');
    expect(html).toContain('href="rikiki/tokens.css"');
    // An inlined bundle is six figures of bytes · a source deck is a page.
    expect(html.length).toBeLessThan(20_000);
  });

  it('puts every referenced asset next to the deck', () => {
    for (const ref of html.matchAll(/(?:src|href)="(rikiki\/[^"]+)"/g)) {
      expect(existsSync(join(dir, ref[1])), `missing asset: ${ref[1]}`).toBe(true);
    }
  });

  it('copies the runtime without the heavy vendored plugins', () => {
    // lit and marked are the runtime itself · mermaid and Shiki weigh ~12 MB
    // together and belong only to the decks that ask for them.
    expect(existsSync(join(dir, 'rikiki/dist/index.js'))).toBe(true);
    expect(existsSync(join(dir, 'rikiki/dist/vendor/lit.js'))).toBe(true);
    expect(existsSync(join(dir, 'rikiki/dist/vendor/mermaid.min.js'))).toBe(false);
    expect(existsSync(join(dir, 'rikiki/dist/vendor/shiki.js'))).toBe(false);
  });

  it('renders every asset the deck imports, not only the ones it spells out', () => {
    // The deck names dist/index.js · that file imports ./vendor/lit.js, which
    // no attribute in the HTML mentions. Copying only what the HTML spells is
    // how a source deck ends up loading nothing.
    const runtime = readFileSync(join(dir, 'rikiki/dist/index.js'), 'utf8');
    for (const ref of runtime.matchAll(/from"(\.\/[^"]+)"/g)) {
      expect(existsSync(join(dir, 'rikiki/dist', ref[1])), `missing import: ${ref[1]}`).toBe(true);
    }
  });

  it('carries the title into the document and the cover', () => {
    expect(html).toContain('<title>A talk</title>');
    expect(html).toContain('A talk');
  });

  it('bundles the deck it just wrote', () => {
    // The two modes are one path, not two: what `init` writes is what `bundle`
    // folds into a single file.
    const run = runCli(['bundle', 'talk.html', 'talk.bundle.html'], dir);
    expect(run.status, run.stderr).toBe(0);
    const bundled = readFileSync(join(dir, 'talk.bundle.html'), 'utf8');
    expect(bundled).not.toContain('src="rikiki/dist/index.js"');
    expect(bundled.length).toBeGreaterThan(100_000);
  });
});

describe('init --theme siliceum', () => {
  let dir;

  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), 'rikiki theme '));
    const run = runCli(['init', 'talk.html', '--theme', 'siliceum'], dir);
    expect(run.status, run.stderr).toBe(0);
  });

  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  it('ships the theme and the font files it points at', () => {
    const html = readFileSync(join(dir, 'talk.html'), 'utf8');
    expect(html).toContain('href="rikiki/themes/siliceum.css"');
    const css = readFileSync(join(dir, 'rikiki/themes/siliceum-fonts.css'), 'utf8');
    for (const ref of css.matchAll(/url\(\.\.\/(fonts\/[^)]+)\)/g)) {
      expect(existsSync(join(dir, 'rikiki', ref[1])), `missing font: ${ref[1]}`).toBe(true);
    }
  });
});

describe('init refuses to overwrite', () => {
  it('stops rather than replacing an existing deck, and says how to force it', () => {
    const dir = mkdtempSync(join(tmpdir(), 'rikiki twice '));
    try {
      expect(runCli(['init', 'talk.html'], dir).status).toBe(0);
      const second = runCli(['init', 'talk.html'], dir);
      expect(second.status).toBe(1);
      expect(second.stderr).toMatch(/--force/);
      // A failed init leaves the previous work untouched.
      expect(readFileSync(join(dir, 'talk.html'), 'utf8')).toContain('deck-root');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('a missing optional peer is reported without a stack trace', () => {
  it('prints the remedy, not the internals of the package', () => {
    const dir = mkdtempSync(join(tmpdir(), 'rikiki peer '));
    try {
      // Force the failure the same way a fresh install does: no rolldown.
      const blocker = join(PKG_DIR, 'scripts/fixtures/block-rolldown.mjs');
      const run = (() => {
        try {
          const stdout = execFileSync(
            process.execPath,
            ['--import', blocker, CLI, 'init', 'talk.html', '--standalone'],
            { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
          );
          return { stdout, stderr: '', status: 0 };
        } catch (e) {
          return { stdout: e.stdout ?? '', stderr: e.stderr ?? '', status: e.status ?? 1 };
        }
      })();
      expect(run.status).toBe(1);
      expect(run.stderr).toMatch(/npm i -D rolldown/);
      expect(run.stderr, 'an expected error must not print a stack').not.toMatch(/ {4}at /);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
