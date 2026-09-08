import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';

// `render` and `check` are what an agent uses instead of eyes. They drive a
// real browser, so they live here rather than in the node suite.
//
// Every deck below is written into a temporary directory outside the
// repository, with the runtime copied beside it by `rikiki init`: what these
// tests exercise is the deck a consumer would have, not a repo fixture.

const PKG_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CLI = join(PKG_DIR, 'bin', 'rikiki.mjs');

let workDir: string;
let runtimeDir: string;

test.beforeAll(() => {
  // One `init` for the whole file · copying the runtime per test would spend
  // more time on file I/O than on the browser.
  workDir = mkdtempSync(join(tmpdir(), 'rikiki looks '));
  execFileSync(process.execPath, [CLI, 'init', 'base.html'], { cwd: workDir, stdio: 'ignore' });
  runtimeDir = join(workDir, 'rikiki');
  expect(existsSync(join(runtimeDir, 'dist/index.js'))).toBe(true);
});

test.afterAll(() => rmSync(workDir, { recursive: true, force: true }));

/** Write a deck into its own directory next to the shared runtime. */
function deck(name: string, body: string): string {
  const file = join(workDir, `${name}.html`);
  writeFileSync(
    file,
    `<!doctype html>
<html lang="en"><head><meta charset="UTF-8">
<link rel="stylesheet" href="rikiki/tokens.css">
<script type="module" src="rikiki/dist/index.js"></script>
</head><body>
<deck-root>
${body}
</deck-root>
</body></html>`,
  );
  return file;
}

function cli(args: string[]): { stdout: string; stderr: string; status: number } {
  // spawnSync, not execFileSync: the latter only hands back stderr when the
  // command fails, and half of what these commands say is said on success.
  const run = spawnSync(process.execPath, [CLI, ...args], {
    cwd: workDir,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  });
  return { stdout: run.stdout ?? '', stderr: run.stderr ?? '', status: run.status ?? 1 };
}

const report = (name: string) => {
  const run = cli(['check', `${name}.html`, '--json']);
  return { ...run, json: JSON.parse(run.stdout) };
};
const codes = (r: { json: any }) => r.json.diagnostics.map((d: any) => d.code);

test.describe('render', () => {
  test('writes one picture per slide, a gallery and a manifest that ties them together', () => {
    deck(
      'three',
      `<deck-cover id="intro"><h1>Un</h1></deck-cover>
       <deck-feature id="milieu"><h1 slot="title">Deux</h1><p>Corps</p></deck-feature>
       <deck-takeaway><h1>Trois</h1></deck-takeaway>`,
    );
    const run = cli(['render', 'three.html', '--out', 'shots']);
    expect(run.status, run.stderr).toBe(0);

    const manifest = JSON.parse(readFileSync(join(workDir, 'shots/manifest.json'), 'utf8'));
    expect(manifest.schema).toBe(1);
    expect(manifest.captured).toBe(3);
    expect(manifest.canvas).toEqual({ width: 1920, height: 1080 });
    expect(manifest.shots.map((s: any) => s.id)).toEqual(['intro', 'milieu', null]);
    expect(manifest.shots.map((s: any) => s.title)).toEqual(['Un', 'Deux', 'Trois']);

    // Every file the manifest names is a file that exists · the manifest is
    // the contract between what was seen and what can be edited.
    for (const shot of manifest.shots) {
      expect(existsSync(join(workDir, 'shots', shot.file)), shot.file).toBe(true);
    }
    const gallery = readFileSync(join(workDir, 'shots/index.html'), 'utf8');
    for (const shot of manifest.shots) expect(gallery).toContain(shot.file);
  });

  test('renders only the slides asked for, by number or by id', () => {
    deck(
      'pick',
      `<deck-cover id="a"><h1>A</h1></deck-cover>
       <deck-feature id="b"><h1 slot="title">B</h1></deck-feature>
       <deck-takeaway id="c"><h1>C</h1></deck-takeaway>`,
    );
    const run = cli(['render', 'pick.html', '--out', 'picked', '--slides', 'c,1']);
    expect(run.status, run.stderr).toBe(0);
    const manifest = JSON.parse(readFileSync(join(workDir, 'picked/manifest.json'), 'utf8'));
    // Deck order, not argument order · a gallery reads like the talk.
    expect(manifest.shots.map((s: any) => s.id)).toEqual(['a', 'c']);
    expect(manifest.slideCount).toBe(3);
  });

  test('names the slides it has when the selection matches none', () => {
    deck('pick2', `<deck-cover id="a"><h1>A</h1></deck-cover>`);
    const run = cli(['render', 'pick2.html', '--out', 'nope', '--slides', 'zzz']);
    expect(run.status).toBe(1);
    expect(run.stderr).toMatch(/no slide matches "zzz"/);
    expect(run.stderr).toMatch(/this deck has: 1 \(a\)/);
    expect(run.stderr, 'an expected error must not print a stack').not.toMatch(/ {4}at /);
  });

  test('captures each revealed state under --steps, and says which state it caught', () => {
    deck(
      'steps',
      `<deck-feature id="reveal" steps="2">
         <h1 slot="title">Reveals</h1>
         <p data-step-block="1">First</p>
         <p data-step-block="2">Second</p>
       </deck-feature>`,
    );
    const plain = cli(['render', 'steps.html', '--out', 'plain']);
    expect(plain.status, plain.stderr).toBe(0);
    const first = JSON.parse(readFileSync(join(workDir, 'plain/manifest.json'), 'utf8'));
    expect(first.captured).toBe(1);
    expect(first.stepsCaptured).toBe(false);
    // The opening state of a stepped slide is the emptiest one it has · a
    // reader of the manifest must not mistake it for the whole slide.
    expect(plain.stderr).toMatch(/--steps/);

    const stepped = cli(['render', 'steps.html', '--out', 'stepped', '--steps']);
    expect(stepped.status, stepped.stderr).toBe(0);
    const all = JSON.parse(readFileSync(join(workDir, 'stepped/manifest.json'), 'utf8'));
    expect(all.stepsCaptured).toBe(true);
    expect(all.shots.map((s: any) => s.step)).toEqual([0, 1, 2]);
    expect(all.shots.map((s: any) => s.file)).toEqual([
      '01-reveal.png',
      '01-reveal-s1.png',
      '01-reveal-s2.png',
    ]);
  });

  test('turns a hostile slide id into one harmless file name', () => {
    deck('unsafe', `<deck-cover id="../../etc/passwd"><h1>Nope</h1></deck-cover>`);
    const run = cli(['render', 'unsafe.html', '--out', 'safe']);
    expect(run.status, run.stderr).toBe(0);
    const manifest = JSON.parse(readFileSync(join(workDir, 'safe/manifest.json'), 'utf8'));
    const [shot] = manifest.shots;
    expect(shot.file).not.toContain('/');
    expect(shot.file).not.toContain('..');
    expect(existsSync(join(workDir, 'safe', shot.file))).toBe(true);
    // The id is still reported as written · sanitising the file name must not
    // rewrite the deck's own vocabulary.
    expect(shot.id).toBe('../../etc/passwd');
  });

  test('renders at the size it is told, and refuses a size that is not one', () => {
    deck('sized', `<deck-cover><h1>Small</h1></deck-cover>`);
    const run = cli(['render', 'sized.html', '--out', 'small', '--width', '800', '--height', '450']);
    expect(run.status, run.stderr).toBe(0);
    const manifest = JSON.parse(readFileSync(join(workDir, 'small/manifest.json'), 'utf8'));
    expect(manifest.canvas).toEqual({ width: 800, height: 450 });

    const bad = cli(['render', 'sized.html', '--out', 'bad', '--width', 'wide']);
    expect(bad.status).toBe(1);
    expect(bad.stderr).toMatch(/positive whole number of pixels/);
  });

  test('refuses to photograph a deck that never showed a slide', () => {
    writeFileSync(join(workDir, 'dead.html'), '<!doctype html><html><body><p>no deck</p></body></html>');
    const run = cli(['render', 'dead.html', '--out', 'dead']);
    expect(run.status).toBe(1);
    expect(run.stderr).toMatch(/never showed a slide/);
    expect(run.stderr).toMatch(/rikiki check/);
  });
});

test.describe('check', () => {
  test('passes a sound deck, and says what it did not look at', () => {
    deck(
      'sound',
      `<deck-cover id="intro"><h1>Titre</h1></deck-cover>
       <deck-feature id="body"><h1 slot="title">Corps</h1><p>Une phrase.</p></deck-feature>`,
    );
    const r = report('sound');
    expect(r.status).toBe(0);
    expect(r.json.summary).toEqual({ error: 0, warning: 0 });
    expect(r.json.slideCount).toBe(2);
    // Silence about a check that never ran would read as a clean bill.
    expect(r.json.notChecked.join(' ')).toMatch(/accessibility/);
  });

  test('names a misspelled element, where it is, and why nothing shows', () => {
    deck('typo', `<deck-feature id="detail"><h1 slot="title">T</h1><deck-callot>lost</deck-callot></deck-feature>`);
    const r = report('typo');
    expect(r.status).toBe(1);
    expect(codes(r)).toContain('UNKNOWN_ELEMENT');
    const found = r.json.diagnostics.find((d: any) => d.code === 'UNKNOWN_ELEMENT');
    expect(found.severity).toBe('error');
    expect(found.element).toContain('deck-feature#detail');
    expect(found.message).toContain('deck-callot');
  });

  test('measures clipped content and points inside the shadow tree', () => {
    const lines = Array.from({ length: 40 }, (_, i) => `<p>Ligne ${i} d'un contenu trop long.</p>`).join('');
    deck('over', `<deck-feature id="trop"><h1 slot="title">Trop</h1>${lines}</deck-feature>`);
    const r = report('over');
    expect(r.status).toBe(1);
    const clipped = r.json.diagnostics.find((d: any) => d.code === 'CONTENT_CLIPPED');
    expect(clipped.slide).toBe(1);
    expect(clipped.slideId).toBe('trop');
    expect(clipped.measurement.clippedPx).toBeGreaterThan(100);
    expect(clipped.element, 'the clipping box is inside the layout').toContain('::shadow');
    expect(clipped.suggestion).toMatch(/deck-notes|split/);
  });

  test('reports a missing resource once, with its status', () => {
    writeFileSync(
      join(workDir, 'missing.html'),
      `<!doctype html><html lang="en"><head><meta charset="UTF-8">
<link rel="stylesheet" href="rikiki/tokens.css">
<script type="module" src="rikiki/dist/index.js"></script>
</head><body><deck-root>
<deck-photo id="pic"><img src="absent.png" alt="gone"></deck-photo>
</deck-root></body></html>`,
    );
    const r = report('missing');
    expect(r.status).toBe(1);
    const missing = r.json.diagnostics.filter((d: any) => d.code === 'RESOURCE_MISSING');
    expect(missing, 'one file, one diagnostic').toHaveLength(1);
    expect(missing[0].url).toMatch(/absent\.png$/);
    expect(missing[0].httpStatus).toBe(404);
  });

  test('blames the runtime once, instead of every element it did not define', () => {
    writeFileSync(
      join(workDir, 'noruntime.html'),
      `<!doctype html><html lang="en"><head><meta charset="UTF-8">
<script type="module" src="rikiki/dist/nope.js"></script>
</head><body><deck-root>
<deck-cover><h1>A</h1></deck-cover><deck-feature><h1>B</h1></deck-feature>
</deck-root></body></html>`,
    );
    const r = report('noruntime');
    expect(r.status).toBe(1);
    expect(codes(r)).toContain('RUNTIME_NOT_LOADED');
    expect(codes(r).filter((c: string) => c === 'UNKNOWN_ELEMENT'), 'the cause is stated once').toHaveLength(0);
    // Layout numbers from an unstyled page would be real and meaningless.
    expect(codes(r)).not.toContain('SLIDE_DENSE');
    expect(r.json.notChecked.join(' ')).toMatch(/runtime never ran/);
  });

  test('warns about duplicate ids, which break a targeted edit', () => {
    deck('dupes', `<deck-cover id="same"><h1>A</h1></deck-cover><deck-takeaway id="same"><h1>B</h1></deck-takeaway>`);
    const r = report('dupes');
    const dupe = r.json.diagnostics.find((d: any) => d.code === 'DUPLICATE_SLIDE_ID');
    expect(dupe.severity).toBe('warning');
    expect(dupe.message).toContain('same');
    // Warnings alone leave the exit code at 0 · they are not blockers.
    expect(r.status).toBe(0);
  });

  test('reads the deck file for network dependencies a bundle would have to inline', () => {
    writeFileSync(
      join(workDir, 'cdn.html'),
      `<!doctype html><html lang="en"><head><meta charset="UTF-8">
<link rel="stylesheet" href="rikiki/tokens.css">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter">
<script type="module" src="rikiki/dist/index.js"></script>
</head><body><deck-root><deck-cover><h1>A</h1></deck-cover></deck-root></body></html>`,
    );
    const r = report('cdn');
    const external = r.json.diagnostics.find((d: any) => d.code === 'EXTERNAL_DEPENDENCY');
    expect(external.severity).toBe('warning');
    expect(external.message).toContain('fonts.googleapis.com');
    expect(external.suggestion).toMatch(/bundle/);
  });

  test('in --json mode stdout is the report and nothing else, even when the deck is broken', () => {
    writeFileSync(
      join(workDir, 'broken.html'),
      `<!doctype html><html lang="en"><head><meta charset="UTF-8">
<script type="module" src="rikiki/dist/gone.js"></script>
</head><body><deck-root><deck-cover><h1>A</h1></deck-cover></deck-root></body></html>`,
    );
    const run = cli(['check', 'broken.html', '--json']);
    expect(run.status).toBe(1);
    expect(() => JSON.parse(run.stdout), 'stdout must parse as JSON on its own').not.toThrow();
    expect(run.stdout.trimStart().startsWith('{')).toBe(true);
  });

  test('separates a deck it could not read (2) from a deck with defects (1)', () => {
    // An agent branches on this: 1 means "fix the deck", 2 means "fix the call".
    const run = cli(['check', 'absent.html']);
    expect(run.status).toBe(2);
    expect(run.stderr).toMatch(/input not found/);
    expect(run.stderr).not.toMatch(/ {4}at /);
  });
});
