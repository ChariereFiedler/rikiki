import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
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

/** Write a deck into its own directory next to the shared runtime.
    `modules` names opt-in scripts (e.g. `deck-versus`) to load beside the
    core bundle, for a component that ships outside `dist/index.js`. */
function deck(name: string, body: string, modules: string[] = []): string {
  const file = join(workDir, `${name}.html`);
  const extraScripts = modules
    .map((m) => `<script type="module" src="rikiki/dist/${m}.js"></script>`)
    .join('\n');
  writeFileSync(
    file,
    `<!doctype html>
<html lang="en"><head><meta charset="UTF-8">
<link rel="stylesheet" href="rikiki/tokens.css">
<script type="module" src="rikiki/dist/index.js"></script>
${extraScripts}
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
// The pixel pass is not needed for a DOM/geometry assertion, and it is the
// slowest thing `check` does.
const reportFast = (name: string) => {
  const run = cli(['check', `${name}.html`, '--json', '--no-visual']);
  return { ...run, json: JSON.parse(run.stdout) };
};
const codes = (r: { json: any }) => r.json.diagnostics.map((d: any) => d.code);

test('checks third-party custom elements without treating unknown namespaces as errors', () => {
  deck('third-party', `<deck-feature><h1 slot="title">Extensions</h1>
    <script>
      customElements.define('sales-box', class extends HTMLElement {
        static get observedAttributes() { return ['label']; }
        connectedCallback() {
          this.attachShadow({ mode: 'open' }).innerHTML = '<style>:host([compact]) { padding: 0 }</style><slot></slot>';
        }
      });
    </script>
    <sales-box label="Valid" compact logo="ignored"><p slot="missing">Lost</p></sales-box>
    <sales-bxo></sales-bxo><external-widget></external-widget>
    <svg><font-face></font-face></svg>
  </deck-feature>`);
  const r = reportFast('third-party');
  const diagnostics = r.json.diagnostics;
  expect(diagnostics.some((d: any) => d.code === 'UNKNOWN_ATTRIBUTE' && d.message.includes('logo='))).toBe(true);
  expect(diagnostics.some((d: any) => d.code === 'UNKNOWN_ATTRIBUTE' && d.message.includes('compact='))).toBe(false);
  expect(diagnostics.some((d: any) => d.code === 'CONTENT_NOT_RENDERED' && d.message.includes('sales-box'))).toBe(true);
  expect(diagnostics.some((d: any) => d.code === 'UNKNOWN_ELEMENT' && d.message.includes('sales-bxo') && d.severity === 'error')).toBe(true);
  expect(diagnostics.some((d: any) => d.code === 'UNKNOWN_ELEMENT' && d.message.includes('external-widget') && d.severity === 'warning')).toBe(true);
  expect(diagnostics.some((d: any) => d.code === 'UNKNOWN_ELEMENT' && d.message.includes('font-face'))).toBe(false);
});

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

  test('compares a render to a baseline, and ranks what moved', () => {
    const body = (title: string) =>
      `<deck-cover id="intro"><h1>${title}</h1></deck-cover>
       <deck-feature id="corps" spread="center"><h1 slot="title">Corps</h1><p>Une phrase stable.</p></deck-feature>`;

    deck('base', body('Avant'));
    expect(cli(['render', 'base.html', '--out', 'baseA']).status).toBe(0);

    // The same deck rendered twice must read as stable · anti-aliasing alone
    // has to stay under the default threshold, or the command cries wolf on
    // every run and nobody looks at it twice.
    const same = cli(['render', 'base.html', '--out', 'baseB', '--baseline', 'baseA', '--json']);
    expect(same.status, same.stderr).toBe(0);
    const stable = JSON.parse(same.stdout);
    expect(stable.schema).toBe('rikiki.render-diff/1');
    expect(stable.threshold).toBe(0.5);
    expect(stable.summary).toEqual({ changed: 0, stable: 2, added: 0, missing: 0, resized: 0 });
    expect(stable.slides.every((s: any) => s.status === 'stable')).toBe(true);
    // The report is also a file beside the manifest · the next session reads it.
    const onDisk = JSON.parse(readFileSync(join(workDir, 'baseB/diff.json'), 'utf8'));
    expect(onDisk.summary).toEqual(stable.summary);

    // One title changed · that slide must come first, and the run must fail.
    deck('base', body('Après, tout autre'));
    const moved = cli(['render', 'base.html', '--out', 'baseC', '--baseline', 'baseA', '--json']);
    expect(moved.status).toBe(1);
    const report = JSON.parse(moved.stdout);
    expect(report.slides[0].file).toBe('01-intro.png');
    expect(report.slides[0].status).toBe('changed');
    expect(report.slides[0].id).toBe('intro');
    expect(report.slides[0].changedRatio).toBeGreaterThan(0.005);
    // The box points at the title, not at the whole slide.
    expect(report.slides[0].box.height).toBeLessThan(1080);
    expect(report.summary.changed).toBe(1);
    expect(report.summary.stable).toBe(1);
  });

  test('reports a slide the baseline had and this render does not', () => {
    deck('shrink', `<deck-cover id="un"><h1>Un</h1></deck-cover>
       <deck-cover id="deux"><h1>Deux</h1></deck-cover>`);
    expect(cli(['render', 'shrink.html', '--out', 'twoSlides']).status).toBe(0);

    deck('shrink', `<deck-cover id="un"><h1>Un</h1></deck-cover>`);
    const run = cli(['render', 'shrink.html', '--out', 'oneSlide', '--baseline', 'twoSlides']);
    expect(run.status).toBe(1);
    expect(run.stderr).toMatch(/missing 02-deux\.png/);
    const report = JSON.parse(readFileSync(join(workDir, 'oneSlide/diff.json'), 'utf8'));
    expect(report.summary).toEqual({ changed: 0, stable: 1, added: 0, missing: 1, resized: 0 });
    // A missing file is never given a pixel count · there is nothing to count.
    expect(report.slides.find((s: any) => s.status === 'missing').changedRatio).toBeUndefined();
  });

  test('reports a baseline rendered at another size as resized', () => {
    deck('size', `<deck-cover id="un"><h1>Un</h1></deck-cover>`);
    expect(cli(['render', 'size.html', '--out', 'big']).status).toBe(0);
    const run = cli([
      'render', 'size.html', '--out', 'smallerShots',
      '--width', '1280', '--height', '720', '--baseline', 'big', '--json',
    ]);
    expect(run.status).toBe(1);
    const [slide] = JSON.parse(run.stdout).slides;
    expect(slide.status).toBe('resized');
    expect(slide.baselineSize).toEqual({ width: 1920, height: 1080 });
    expect(slide.size).toEqual({ width: 1280, height: 720 });
    expect(slide.changedRatio).toBeUndefined();
  });

  test('stops on a baseline directory that is not there, before rendering', () => {
    deck('nobase', `<deck-cover><h1>Un</h1></deck-cover>`);
    const run = cli(['render', 'nobase.html', '--out', 'nobaseShots', '--baseline', 'nowhere']);
    expect(run.status, 'a baseline that is not there is exit 2').toBe(2);
    expect(run.stderr).toMatch(/baseline directory not found/);
    expect(run.stderr, 'an expected error must not print a stack').not.toMatch(/ {4}at /);
    expect(existsSync(join(workDir, 'nobaseShots')), 'nothing was rendered').toBe(false);
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
    // Enough content that the slide fills its canvas · a headline over one
    // sentence is reported by the visual pass, and rightly so.
    deck(
      'sound',
      `<deck-cover id="intro"><h1>Titre</h1></deck-cover>
       <deck-feature id="body" spread="center"><h1 slot="title">Corps</h1>
         <deck-callout type="info">Une première phrase, qui porte le propos de la slide.</deck-callout>
         <deck-callout type="ok">Une deuxième, qui l'appuie avec un fait.</deck-callout>
         <deck-callout type="warn">Une troisième, qui nuance ce que les deux premières affirment.</deck-callout>
       </deck-feature>`,
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

  test('counts two dependencies that differ only by a version number as two', () => {
    // The `--steps` dedupe blanks the measurement out of a diagnostic's
    // identity, because a pixel drifts between two states of one slide. It
    // must not blank the digits of a URL: these two are one character apart
    // and they are two files the deck fetches.
    writeFileSync(
      join(workDir, 'cdn-twice.html'),
      `<!doctype html><html lang="en"><head><meta charset="UTF-8">
<link rel="stylesheet" href="rikiki/tokens.css">
<link rel="stylesheet" href="https://cdn.example.com/pack/v1/a.css">
<link rel="stylesheet" href="https://cdn.example.com/pack/v2/a.css">
<script type="module" src="rikiki/dist/index.js"></script>
</head><body><deck-root><deck-cover><h1>A</h1></deck-cover></deck-root></body></html>`,
    );
    const r = reportFast('cdn-twice');
    const external = r.json.diagnostics.filter((d: any) => d.code === 'EXTERNAL_DEPENDENCY');
    expect(external.map((d: any) => d.message).join(' '), r.stdout).toContain('v1');
    expect(external.map((d: any) => d.message).join(' '), r.stdout).toContain('v2');
    expect(external, r.stdout).toHaveLength(2);
  });

  test('reports a deck it cannot walk instead of crashing on it', () => {
    // The walk drives the deck by its location hash. A page script that eats
    // the hashchange leaves `deck-root` on slide 1 forever · the navigation
    // helper throws on its own timeout, and the command used to die with no
    // JSON at all on stdout, which is the one thing an agent cannot parse.
    writeFileSync(
      join(workDir, 'stalled.html'),
      `<!doctype html><html lang="en"><head><meta charset="UTF-8">
<link rel="stylesheet" href="rikiki/tokens.css">
<script>window.addEventListener('hashchange', (e) => e.stopImmediatePropagation(), true);</script>
<script type="module" src="rikiki/dist/index.js"></script>
</head><body><deck-root>
<deck-cover id="one"><h1>A</h1></deck-cover>
<deck-takeaway id="two"><h1>B</h1></deck-takeaway>
</deck-root></body></html>`,
    );
    const run = cli(['check', 'stalled.html', '--json', '--no-visual']);
    expect(() => JSON.parse(run.stdout), 'stdout must parse as JSON on its own').not.toThrow();
    const json = JSON.parse(run.stdout);
    const stalled = json.diagnostics.find((d: any) => d.code === 'NAVIGATION_STALLED');
    expect(stalled, run.stdout).toBeTruthy();
    expect(stalled.severity).toBe('error');
    expect(stalled.slide).toBe(2);
    expect(json.slideCount).toBe(2);
    expect(run.status).toBe(1);
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

test.describe('what the report says about itself', () => {
  test('reads a two-line title as one line of words', () => {
    // textContent joins across a <br>, which turned "Click<br>stages" into
    // "Clickstages" in a manifest whose whole job is to name a slide.
    deck('broken-title', `<deck-section id="chap"><h1>Click<br>stages</h1></deck-section>`);
    const run = cli(['render', 'broken-title.html', '--out', 'titled']);
    expect(run.status, run.stderr).toBe(0);
    const manifest = JSON.parse(readFileSync(join(workDir, 'titled/manifest.json'), 'utf8'));
    expect(manifest.shots[0].title).toBe('Click stages');
  });

  test('does not call a clipped slide merely dense', () => {
    // Both findings have the same cause · saying "nothing is cut yet" under a
    // line that just counted the cut pixels contradicts it.
    const lines = Array.from({ length: 40 }, (_, i) => `<p>Ligne ${i}.</p>`).join('');
    deck('both', `<deck-feature id="full"><h1 slot="title">Full</h1>${lines}</deck-feature>`);
    const r = report('both');
    expect(codes(r)).toContain('CONTENT_CLIPPED');
    expect(codes(r)).not.toContain('SLIDE_DENSE');
  });
});

test.describe('an attribute a component does not read', () => {
  test('is reported, with what the element does accept', () => {
    // deck-stat takes `num` and its words as content. Writing label="…" on it
    // loses the label with no error anywhere · the slide simply renders without
    // it, which is how three recipes in the authoring guide shipped wrong.
    deck('stray', `<deck-feature id="s"><h1 slot="title">T</h1>
      <deck-stat value="9" label="files">body</deck-stat></deck-feature>`);
    const r = report('stray');
    const strays = r.json.diagnostics.filter((d: any) => d.code === 'UNKNOWN_ATTRIBUTE');
    expect(strays.map((d: any) => d.message).join(' ')).toContain('label');
    expect(strays[0].severity).toBe('warning');
    expect(strays[0].measurement.accepts).toContain('num');
    expect(strays[0].element).toContain('deck-stat');
  });

  test('is not reported when the attribute only styles the element', () => {
    // `compact` on deck-mermaid changes nothing in JavaScript · it exists as
    // `:host([compact])` in the shadow styles. Reading only observedAttributes
    // called it stray and cried wolf on three decks in this repository.
    deck('styled', `<deck-feature id="c"><h1 slot="title">T</h1>
      <deck-code lang="ts" hero>const a = 1;</deck-code></deck-feature>`);
    const r = report('styled');
    expect(r.json.diagnostics.filter((d: any) => d.code === 'UNKNOWN_ATTRIBUTE')).toEqual([]);
  });

  test('measures the size of the author\'s text, not the component chrome', () => {
    // A cover's meta labels are sized by the theme. Telling an author to fix a
    // span they never wrote is noise, and it fired on three shipped decks.
    deck('chrome', `<deck-cover id="c" speaker="Alex" duration="5 min"><h1>Titre</h1></deck-cover>`);
    const r = report('chrome');
    expect(r.json.diagnostics.filter((d: any) => d.code === 'TEXT_TOO_SMALL')).toEqual([]);
    expect(r.json.notChecked.join(' ')).toMatch(/chrome/);
  });
});

test.describe('graph geometry', () => {
  test('reports a node that leaves the graph canvas', () => {
    deck('graph-out', `<script type="module" src="rikiki/dist/deck-graph.js"></script>
      <deck-feature id="graph-out"><h1 slot="title">Graph</h1>
        <deck-graph>
          <deck-node id="outside" at="1,50" boxed label="A node with a useful long label"></deck-node>
          <deck-node id="inside" at="75,50" boxed label="Inside"></deck-node>
          <deck-edge from="outside" to="inside"></deck-edge>
        </deck-graph>
      </deck-feature>`);
    const r = report('graph-out');
    const found = r.json.diagnostics.find((d: any) => d.code === 'GRAPH_NODE_OUT_OF_BOUNDS');
    expect(found, r.stdout).toBeTruthy();
    expect(found.severity).toBe('error');
    expect(found.slideId).toBe('graph-out');
    expect(found.measurement.overflowPx).toBeGreaterThan(4);
    expect(found.element).toContain('deck-node#outside');
  });

  test('reports a straight edge that crosses an unrelated node', () => {
    deck('graph-cross', `<script type="module" src="rikiki/dist/deck-graph.js"></script>
      <deck-feature id="graph-cross"><h1 slot="title">Graph</h1>
        <deck-graph>
          <deck-node id="a" at="15,50" boxed label="A"></deck-node>
          <deck-node id="blocker" at="50,50" boxed label="Blocked"></deck-node>
          <deck-node id="c" at="85,50" boxed label="C"></deck-node>
          <deck-edge from="a" to="c" label="request"></deck-edge>
        </deck-graph>
      </deck-feature>`);
    const r = report('graph-cross');
    const found = r.json.diagnostics.find((d: any) => d.code === 'GRAPH_EDGE_CROSSES_NODE');
    expect(found, r.stdout).toBeTruthy();
    expect(found.severity).toBe('warning');
    expect(found.measurement.obstructingNode).toContain('deck-node#blocker');
    expect(found.element).toContain('deck-edge');
  });

  test('reports an edge that only clips a corner of an unrelated node', () => {
    // The reported regression, at the coordinates it was reported at: the
    // t4 to t5 edge runs along the bottom-right corner of t3, close enough
    // that a 4px stroke paints over it. The old check compared a zero width
    // centre-to-centre segment against the node box shrunk by 2px, and so
    // said nothing at all about a crossing visible from the back of a room.
    //
    // The boxes are pinned rather than grown from a label and a note: the
    // whole point is a near-tangent, and a near-tangent that drifts with font
    // metrics is a flaky test. 288x202 is what the reported nodes measured.
    const box = 'style="width:288px;height:202px"';
    deck('graph-corner', `<script type="module" src="rikiki/dist/deck-graph.js"></script>
      <deck-feature id="graph-corner"><h1 slot="title">Graph</h1>
        <deck-graph>
          <deck-node id="t3" at="55,24" boxed label="Identify" ${box}></deck-node>
          <deck-node id="t4" at="80,24" boxed label="Query" ${box}></deck-node>
          <deck-node id="t5" at="16,76" boxed label="Confront" ${box}></deck-node>
          <deck-edge from="t4" to="t5"></deck-edge>
        </deck-graph>
      </deck-feature>`);
    const r = report('graph-corner');
    const found = r.json.diagnostics.find((d: any) => d.code === 'GRAPH_EDGE_CROSSES_NODE');
    expect(found, r.stdout).toBeTruthy();
    expect(found.measurement.obstructingNode).toContain('deck-node#t3');
    expect(found.measurement.from).toBe('t4');
    expect(found.measurement.to).toBe('t5');
  });

  test('reports two nodes painted on top of each other', () => {
    deck('graph-overlap', `<script type="module" src="rikiki/dist/deck-graph.js"></script>
      <deck-feature id="graph-overlap"><h1 slot="title">Graph</h1>
        <deck-graph>
          <deck-node id="near" at="50,50" boxed label="A source nobody can read"></deck-node>
          <deck-node id="over" at="52,50" boxed label="Because of this one"></deck-node>
        </deck-graph>
      </deck-feature>`);
    const r = report('graph-overlap');
    const found = r.json.diagnostics.find((d: any) => d.code === 'GRAPH_NODE_OVERLAPS_NODE');
    expect(found, r.stdout).toBeTruthy();
    expect(found.severity).toBe('error');
    expect(found.slideId).toBe('graph-overlap');
    expect(found.message).toContain('"near"');
    expect(found.message).toContain('"over"');
    expect(found.measurement.overlapPx.x).toBeGreaterThan(4);
    expect(found.measurement.overlapPx.y).toBeGreaterThan(4);
  });

  test('leaves two nodes that merely sit side by side', () => {
    deck('graph-apart', `<script type="module" src="rikiki/dist/deck-graph.js"></script>
      <deck-feature id="graph-apart"><h1 slot="title">Graph</h1>
        <deck-graph>
          <deck-node id="left" at="20,50" boxed label="Left"></deck-node>
          <deck-node id="right" at="80,50" boxed label="Right"></deck-node>
        </deck-graph>
      </deck-feature>`);
    const r = report('graph-apart');
    expect(r.json.diagnostics.map((d: any) => d.code), r.stdout).not.toContain(
      'GRAPH_NODE_OVERLAPS_NODE',
    );
  });

  test('reports a group label painted under a node', () => {
    // A deck-group hangs its caption on its own top border · a node parked on
    // that corner hides it, and the generic sibling rule skips everything
    // inside a graph.
    deck('graph-label', `<script type="module" src="rikiki/dist/deck-graph.js"></script>
      <deck-feature id="graph-label"><h1 slot="title">Graph</h1>
        <deck-graph>
          <deck-group at="10,20,80,70" label="Réseau partagé"></deck-group>
          <deck-node id="onlabel" at="18,20" boxed label="Gateway" note="ingress"></deck-node>
          <deck-node id="far" at="80,70" boxed label="Service"></deck-node>
        </deck-graph>
      </deck-feature>`);
    const r = report('graph-label');
    const found = r.json.diagnostics.find((d: any) => d.code === 'GRAPH_NODE_COVERS_LABEL');
    expect(found, r.stdout).toBeTruthy();
    expect(found.severity).toBe('error');
    expect(found.message).toContain('Réseau partagé');
    expect(found.measurement.node).toContain('deck-node#onlabel');
  });

  test('leaves a group label nothing is painted over', () => {
    deck('graph-label-clear', `<script type="module" src="rikiki/dist/deck-graph.js"></script>
      <deck-feature id="graph-label-clear"><h1 slot="title">Graph</h1>
        <deck-graph>
          <deck-group at="10,20,80,70" label="Réseau partagé"></deck-group>
          <deck-node id="low" at="25,60" boxed label="Gateway"></deck-node>
          <deck-node id="lower" at="75,60" boxed label="Service"></deck-node>
        </deck-graph>
      </deck-feature>`);
    const r = report('graph-label-clear');
    expect(codes(r), r.stdout).not.toContain('GRAPH_NODE_COVERS_LABEL');
  });

  test('reports an edge that misses horizontal by a hair', () => {
    deck('graph-skew', `<script type="module" src="rikiki/dist/deck-graph.js"></script>
      <deck-feature id="graph-skew"><h1 slot="title">Graph</h1>
        <deck-graph>
          <deck-node id="a" at="20,50" boxed label="A"></deck-node>
          <deck-node id="b" at="80,52" boxed label="B"></deck-node>
          <deck-edge from="a" to="b"></deck-edge>
        </deck-graph>
      </deck-feature>`);
    const r = report('graph-skew');
    const found = r.json.diagnostics.find((d: any) => d.code === 'GRAPH_EDGE_SKEWED');
    expect(found, r.stdout).toBeTruthy();
    expect(found.severity).toBe('warning');
    expect(found.measurement.axis).toBe('horizontal');
    expect(found.measurement.deviationPx).toBeGreaterThan(1);
    expect(found.element).toContain('deck-edge');
  });

  test('leaves a frank diagonal alone', () => {
    deck('graph-diagonal', `<script type="module" src="rikiki/dist/deck-graph.js"></script>
      <deck-feature id="graph-diagonal"><h1 slot="title">Graph</h1>
        <deck-graph>
          <deck-node id="a" at="20,15" boxed label="A"></deck-node>
          <deck-node id="b" at="80,85" boxed label="B"></deck-node>
          <deck-edge from="a" to="b"></deck-edge>
        </deck-graph>
      </deck-feature>`);
    const r = report('graph-diagonal');
    expect(codes(r), r.stdout).not.toContain('GRAPH_EDGE_SKEWED');
  });

  test('reports two nodes that nearly share a row, and stays quiet when they do', () => {
    deck('graph-offaxis', `<script type="module" src="rikiki/dist/deck-graph.js"></script>
      <deck-feature id="graph-offaxis"><h1 slot="title">Graph</h1>
        <deck-graph>
          <deck-node id="left" at="20,50" boxed label="Left"></deck-node>
          <deck-node id="right" at="80,52" boxed label="Right"></deck-node>
        </deck-graph>
      </deck-feature>`);
    const r = report('graph-offaxis');
    const found = r.json.diagnostics.find((d: any) => d.code === 'GRAPH_NODES_OFF_AXIS');
    expect(found, r.stdout).toBeTruthy();
    expect(found.severity).toBe('warning');
    expect(found.measurement.axis).toBe('y');
    expect(found.measurement.offsetPx).toBeGreaterThan(1);
    // One sloppy row, one diagnostic · not one per pair.
    expect(r.json.diagnostics.filter((d: any) => d.code === 'GRAPH_NODES_OFF_AXIS')).toHaveLength(1);

    deck('graph-onaxis', `<script type="module" src="rikiki/dist/deck-graph.js"></script>
      <deck-feature id="graph-onaxis"><h1 slot="title">Graph</h1>
        <deck-graph>
          <deck-node id="left" at="20,50" boxed label="Left"></deck-node>
          <deck-node id="right" at="80,50" boxed label="Right"></deck-node>
        </deck-graph>
      </deck-feature>`);
    const clean = report('graph-onaxis');
    expect(codes(clean), clean.stdout).not.toContain('GRAPH_NODES_OFF_AXIS');
  });

  test('reports two nodes of one row that nearly share a height', () => {
    // Same row, same wording, one note longer than the box · the taller box is
    // a few percent off the other, which reads as an accident.
    deck('graph-sizes', `<script type="module" src="rikiki/dist/deck-graph.js"></script>
      <deck-feature id="graph-sizes"><h1 slot="title">Graph</h1>
        <deck-graph>
          <deck-node id="short" at="25,50" boxed label="Ingest" style="width:200px;height:120px"></deck-node>
          <deck-node id="tall" at="75,50" boxed label="Serve" style="width:200px;height:132px"></deck-node>
        </deck-graph>
      </deck-feature>`);
    const r = report('graph-sizes');
    const found = r.json.diagnostics.find((d: any) => d.code === 'GRAPH_NODE_SIZES_MIXED');
    expect(found, r.stdout).toBeTruthy();
    expect(found.severity).toBe('warning');
    expect(found.measurement.dimension).toBe('height');
    expect(found.measurement.differencePx).toBeGreaterThan(3);
  });

  test('leaves two nodes that are plainly different sizes', () => {
    deck('graph-sizes-intent', `<script type="module" src="rikiki/dist/deck-graph.js"></script>
      <deck-feature id="graph-sizes-intent"><h1 slot="title">Graph</h1>
        <deck-graph>
          <deck-node id="small" at="25,50" boxed label="Ingest" style="width:200px;height:90px"></deck-node>
          <deck-node id="big" at="75,50" boxed label="Serve" style="width:200px;height:220px"></deck-node>
        </deck-graph>
      </deck-feature>`);
    const r = report('graph-sizes-intent');
    expect(codes(r), r.stdout).not.toContain('GRAPH_NODE_SIZES_MIXED');
  });

  test('reports hand-placed coordinates that spell out a row, and accepts the semantic form', () => {
    deck('graph-handrow', `<script type="module" src="rikiki/dist/deck-graph.js"></script>
      <deck-feature id="graph-handrow"><h1 slot="title">Graph</h1>
        <deck-graph>
          <deck-node id="a" at="20,50" boxed label="A"></deck-node>
          <deck-node id="b" at="50,50" boxed label="B"></deck-node>
          <deck-node id="c" at="80,50" boxed label="C"></deck-node>
        </deck-graph>
      </deck-feature>`);
    const r = report('graph-handrow');
    const found = r.json.diagnostics.find((d: any) => d.code === 'GRAPH_LAYOUT_NOT_SEMANTIC');
    expect(found, r.stdout).toBeTruthy();
    expect(found.severity).toBe('warning');
    expect(found.measurement.arrangement).toBe('row');
    expect(found.suggestion).toContain('layout="row"');

    deck('graph-semantic', `<script type="module" src="rikiki/dist/deck-graph.js"></script>
      <deck-feature id="graph-semantic"><h1 slot="title">Graph</h1>
        <deck-graph layout="row">
          <deck-node id="a" boxed label="A"></deck-node>
          <deck-node id="b" boxed label="B"></deck-node>
          <deck-node id="c" boxed label="C"></deck-node>
        </deck-graph>
      </deck-feature>`);
    const clean = report('graph-semantic');
    expect(codes(clean), clean.stdout).not.toContain('GRAPH_LAYOUT_NOT_SEMANTIC');
  });
});

test.describe('typography', () => {
  // Where a line breaks is a font metric, and a test that depends on one is a
  // test that fails on the next machine. The break is pinned with a <br>: what
  // is under test is the rule reading the painted lines, not the wrapping.
  test('reports a paragraph whose last line is a lone stub', () => {
    deck('orphan', `<deck-feature id="orphan"><h1 slot="title">Titre</h1>
        <p>Le calendrier de bascule est arrêté avec les équipes régionales<br>(annexe B)</p>
      </deck-feature>`);
    const r = reportFast('orphan');
    const found = r.json.diagnostics.find((d: any) => d.code === 'TEXT_LAST_LINE_ORPHAN');
    expect(found, r.stdout).toBeTruthy();
    expect(found.severity).toBe('warning');
    expect(found.slideId).toBe('orphan');
    expect(found.measurement.lastLineRatio).toBeLessThan(0.25);
    expect(found.excerpt).toContain('annexe');
  });

  test('leaves a heading and a short block alone', () => {
    // A title finishing on a stub is the composition, and a four-word block
    // has no paragraph to break badly · neither is a typographic accident.
    deck('orphan-quiet', `<deck-feature id="orphan-quiet"><h1 slot="title">Un titre assez long pour passer à la ligne<br>seul</h1>
        <p>Quatre mots et<br>puis</p>
      </deck-feature>`);
    const r = reportFast('orphan-quiet');
    expect(codes(r), r.stdout).not.toContain('TEXT_LAST_LINE_ORPHAN');
  });

  test('says nothing about a code block that breaks where it was typed', () => {
    deck('orphan-code', `<deck-feature id="orphan-code"><h1 slot="title">Code</h1>
        <deck-code lang="ts">const configuration = loadRegionalConfiguration(regionName, options);
const x = 1;</deck-code>
      </deck-feature>`);
    const r = reportFast('orphan-code');
    expect(codes(r), r.stdout).not.toContain('TEXT_LAST_LINE_ORPHAN');
  });
});

test.describe('two icons in one box', () => {
  test('reports a callout whose text opens with an emoji', () => {
    deck('icon-doubled', `<deck-feature id="icon-doubled"><h1 slot="title">Lab</h1>
        <deck-callout type="ok">🚩 Target: <code>flag{x}</code></deck-callout>
      </deck-feature>`);
    const r = reportFast('icon-doubled');
    const found = r.json.diagnostics.find((d: any) => d.code === 'ICON_DOUBLED');
    expect(found, r.stdout).toBeTruthy();
    expect(found.severity).toBe('warning');
    expect(found.slideId).toBe('icon-doubled');
    expect(found.measurement.emoji).toBe('🚩');
    expect(found.element).toContain('deck-callout');
  });

  test('leaves an emoji alone where no component icon competes with it', () => {
    // A plain paragraph, an emoji later in a callout's sentence, and a
    // deck-graph (whose shadow SVG is a canvas, not an icon) are all fine.
    deck('icon-quiet', `<deck-feature id="icon-quiet"><h1 slot="title">🚩 Flags</h1>
        <p>🚩 Each module ends with a flag.</p>
        <deck-callout type="info">Capture all ten 🚩</deck-callout>
        <deck-graph><deck-node id="a" at="30,50" label="🚩 start"></deck-node><deck-node id="b" at="70,50" label="end"></deck-node><deck-edge from="a" to="b"></deck-edge></deck-graph>
      </deck-feature>`, ['deck-graph']);
    const r = reportFast('icon-quiet');
    expect(codes(r), r.stdout).not.toContain('ICON_DOUBLED');
  });
});

test.describe('a scrollbar for a sliver', () => {
  // The box height is pinned so the overflow does not depend on font metrics:
  // what is under test is the comparison with the box's own line height.
  test('reports a box that scrolls by less than one line', () => {
    deck('sliver', `<deck-feature id="sliver"><h1 slot="title">Code</h1>
        <div style="overflow:auto; height:100px; line-height:40px; font-size:20px">a<br>b<br>c</div>
      </deck-feature>`);
    const r = reportFast('sliver');
    const found = r.json.diagnostics.find((d: any) => d.code === 'SCROLL_SLIVER');
    expect(found, r.stdout).toBeTruthy();
    expect(found.severity).toBe('warning');
    expect(found.slideId).toBe('sliver');
    expect(found.measurement.overflowPx).toBe(20);
    expect(found.measurement.linePx).toBe(40);
  });

  test('leaves a deliberate scroll of a line or more alone', () => {
    deck('sliver-quiet', `<deck-feature id="sliver-quiet"><h1 slot="title">Code</h1>
        <div style="overflow:auto; height:80px; line-height:40px; font-size:20px">a<br>b<br>c<br>d</div>
      </deck-feature>`);
    const r = reportFast('sliver-quiet');
    expect(codes(r), r.stdout).not.toContain('SCROLL_SLIVER');
  });
});

test.describe('check --steps', () => {
  test('measures every revealed state, and reports a defect that only shows once stepped through', () => {
    // deck-graph's own `reveal` only dims and highlights nodes as the deck
    // steps through them · it never conceals or moves one (emphasis, not
    // concealment). To get a defect that is genuinely absent from the
    // opening state and present only once revealed, this rule hooks the
    // `[active]` attribute deck-graph already toggles at the matching step
    // and moves the third node off its canvas right when it lights up.
    deck(
      'graph-steps',
      `<script type="module" src="rikiki/dist/deck-graph.js"></script>
       <style>deck-node#c[active] { --nx: 500% !important; }</style>
       <deck-feature id="graph-steps"><h1 slot="title">Graph</h1>
         <deck-graph reveal>
           <deck-node id="a" at="20,50" boxed label="A"></deck-node>
           <deck-node id="b" at="50,50" boxed label="B"></deck-node>
           <deck-node id="c" at="80,50" boxed label="C"></deck-node>
         </deck-graph>
       </deck-feature>`,
    );

    const plain = reportFast('graph-steps');
    expect(codes(plain), plain.stdout).not.toContain('GRAPH_NODE_OUT_OF_BOUNDS');
    expect(plain.json.notChecked.join(' ')).toMatch(/revealed steps/);

    const run = cli(['check', 'graph-steps.html', '--json', '--no-visual', '--steps']);
    const stepped = { ...run, json: JSON.parse(run.stdout) };
    const found = stepped.json.diagnostics.find((d: any) => d.code === 'GRAPH_NODE_OUT_OF_BOUNDS');
    expect(found, stepped.stdout).toBeTruthy();
    expect(found.severity).toBe('error');
    expect(found.state).toBeGreaterThan(0);
    // Four states of one slide · the opening one plus each of the three the
    // graph declares for itself.
    expect(stepped.json.statesInspected).toBe(4);
    // The generic "only the opening state" line would now be false · the
    // pixel-specific one takes its place since the visual pass never walks
    // the steps.
    expect(stepped.json.notChecked.join(' ')).not.toMatch(/revealed steps · only the opening/);
  });

  test('collapses a defect seen at several states down to its first occurrence', () => {
    // A duplicate id lives on the slide itself, unrelated to any step · every
    // state re-measures it, and the report must still say it once.
    deck(
      'dedupe-steps',
      `<deck-feature id="a" steps="1"><h1 slot="title">A</h1><p data-step-block="1">x</p></deck-feature>
       <deck-takeaway id="a"><h1>B</h1></deck-takeaway>`,
    );
    const run = cli(['check', 'dedupe-steps.html', '--json', '--no-visual', '--steps']);
    const stepped = { ...run, json: JSON.parse(run.stdout) };
    const dupes = stepped.json.diagnostics.filter((d: any) => d.code === 'DUPLICATE_SLIDE_ID');
    expect(dupes, stepped.stdout).toHaveLength(1);
    expect(dupes[0].state).toBe(0);
  });
});

test('text is measured inside the elements that re-render the author\'s words', () => {
  // Slotted content stays in the light DOM and is measured there. deck-md and
  // deck-code are different: they rebuild the author's own text into their
  // shadow tree, and skipping shadow trees wholesale made a code block
  // invisible to the size check.
  deck(
    'shadowtext',
    `<deck-feature id="code"><h1 slot="title">T</h1>
       <deck-code lang="ts" style="font-size:6px">const a = 1;</deck-code>
     </deck-feature>`,
  );
  const r = report('shadowtext');
  const where = r.json.diagnostics
    .filter((d: any) => d.code === 'TEXT_TOO_SMALL')
    .map((d: any) => d.element)
    .join(' ');
  expect(where, 'the code block is measured').toMatch(/deck-code ::shadow/);
  // deck-md is walked for the same reason, but it sets its own type size, so
  // an author cannot shrink it from the outside · nothing to assert there.
});

test.describe('content no slot takes', () => {
  test('is an error, naming the slots the parent does offer', () => {
    // deck-feature-cards is a slide layout, not a block: putting cards in it
    // from inside another layout drops all three and leaves the slide blank,
    // with nothing in the report to say so.
    deck(
      'lost',
      `<deck-feature id="host"><h1 slot="title">T</h1>
         <deck-feature-cards>
           <deck-card slot="a">un</deck-card>
         </deck-feature-cards>
       </deck-feature>`,
    );
    const r = report('lost');
    expect(r.status).toBe(1);
    const lost = r.json.diagnostics.find((d: any) => d.code === 'CONTENT_NOT_RENDERED');
    expect(lost.severity).toBe('error');
    expect(lost.element).toContain('deck-card');
    expect(lost.measurement.wantedSlot).toBe('a');
    expect(lost.measurement.slotsOffered).toContain('left');
    expect(lost.suggestion).toMatch(/slot/);
  });

  test('does not fire on notes, which are for the presenter and never shown', () => {
    deck('notes', `<deck-feature id="n"><h1 slot="title">T</h1><p>corps</p>
      <deck-notes>ce que je dirai</deck-notes></deck-feature>`);
    const r = report('notes');
    expect(r.json.diagnostics.filter((d: any) => d.code === 'CONTENT_NOT_RENDERED')).toEqual([]);
  });

  test('does not fire on a deck-versus slide footer', () => {
    deck(
      'versus-footer',
      `<deck-versus id="v" slide active pivot="OR" winner="right">
         <h1 slot="title">T</h1>
         <div slot="left">a</div>
         <div slot="right">b</div>
         <deck-callout slot="footer" type="info">note</deck-callout>
       </deck-versus>`,
      ['deck-versus'],
    );
    const r = reportFast('versus-footer');
    expect(r.json.diagnostics.filter((d: any) => d.code === 'CONTENT_NOT_RENDERED')).toEqual([]);
  });
});

test.describe('painted box geometry', () => {
  test('reports content that spills past its box and over the slide below it', () => {
    // Two cards in a grid row fixed too short for their paragraph, followed
    // by a callout: this is the reported defect verbatim. The slide itself
    // has room to spare below, so nothing clips · the last sentence of each
    // card paints past its own box and over the callout, and only comparing
    // painted rects catches it.
    const para =
      "Une phrase assez longue pour remplir la carte. Une deuxieme phrase qui pousse le texte encore plus bas dans la carte. Une troisieme phrase qui continue d'allonger le paragraphe pour forcer un debordement bien visible au-dela de la bordure de la carte, vers le bas.";
    deck(
      'spill',
      `<deck-feature id="clash"><h1 slot="title">Deux options</h1>
         <deck-grid cols="2" rows="140px">
           <deck-card id="a" color="yellow"><h3>Option A</h3><p>${para}</p></deck-card>
           <deck-card id="b" color="green"><h3>Option B</h3><p>${para}</p></deck-card>
         </deck-grid>
         <deck-callout type="info">Ce texte de synthese doit rester lisible meme si les cartes au-dessus debordent un peu trop bas.</deck-callout>
       </deck-feature>`,
    );
    const r = reportFast('spill');
    expect(codes(r), r.stdout).not.toContain('CONTENT_CLIPPED');

    const escape = r.json.diagnostics.find((d: any) => d.code === 'CONTENT_ESCAPES_BOX');
    expect(escape, r.stdout).toBeTruthy();
    expect(escape.severity).toBe('error');
    expect(escape.slideId).toBe('clash');
    expect(escape.element).toContain('deck-card');
    expect(escape.measurement.escapePx).toBeGreaterThan(4);

    const overlap = r.json.diagnostics.find((d: any) => d.code === 'CONTENT_OVERLAPS_SIBLING');
    expect(overlap, r.stdout).toBeTruthy();
    expect(overlap.severity).toBe('error');
    expect(overlap.slideId).toBe('clash');
    expect(overlap.measurement.overlapPx.x).toBeGreaterThan(8);
    expect(overlap.measurement.overlapPx.y).toBeGreaterThan(8);
  });

  test('leaves a well-sized slide alone', () => {
    deck(
      'wellsized',
      `<deck-feature id="ok"><h1 slot="title">Deux options</h1>
         <deck-grid cols="2">
           <deck-card id="a" color="yellow"><h3>Option A</h3><p>Une phrase courte.</p></deck-card>
           <deck-card id="b" color="green"><h3>Option B</h3><p>Une autre phrase courte.</p></deck-card>
         </deck-grid>
         <deck-callout type="info">Une synthese courte.</deck-callout>
       </deck-feature>`,
    );
    const r = reportFast('wellsized');
    expect(codes(r), r.stdout).not.toContain('CONTENT_ESCAPES_BOX');
    expect(codes(r), r.stdout).not.toContain('CONTENT_OVERLAPS_SIBLING');
  });

  test('does not flag an <em> sitting inside its own <h1>', () => {
    // An inline mark inside a heading paints a rect that differs from the
    // heading's own by sub-pixel line-box rounding, and is well under the
    // 40x20 painted-box floor besides · neither should ever read as an
    // escape or an overlap.
    deck('em-title', `<deck-cover id="em"><h1>Un <em>mot</em> important</h1></deck-cover>`);
    const r = reportFast('em-title');
    expect(codes(r), r.stdout).not.toContain('CONTENT_ESCAPES_BOX');
    expect(codes(r), r.stdout).not.toContain('CONTENT_OVERLAPS_SIBLING');
  });
});

test.describe('text inside a drawing', () => {
  // A hand-drawn SVG places every label by coordinates: nothing wraps and
  // nothing clips, so a word too long for its card runs over the edge in
  // silence. The margins below are tens of pixels wide on purpose · what is
  // under test is the rule, not the width of a glyph in the CI font.
  const svgCodes = (r: { json: any }) => codes(r).filter((c: string) => /^(SVG_|SCENE_)/.test(c));
  const DRAWING_IN_SHADOW = `<script>
    customElements.define('sales-drawing', class extends HTMLElement {
      connectedCallback() {
        this.attachShadow({ mode: 'open' }).innerHTML = '<svg viewBox="0 0 800 300" style="width:800px">'
          + '<rect x="20" y="20" width="160" height="80" fill="#eee"/>'
          + '<text x="40" y="70" font-size="32">A shadow label much too long</text></svg>';
      }
    });
  </script>`;

  test('reports a label that runs past its card, past the viewBox, and inside a shadow root', () => {
    deck('svg-escape', `${DRAWING_IN_SHADOW}
      <deck-feature id="svg-card"><h1 slot="title">Card</h1>
        <svg viewBox="0 0 800 300" style="width:800px">
          <rect x="20" y="20" width="200" height="80" fill="#eee"/>
          <text x="40" y="70" font-size="32">A label far too long for this card</text>
          <text x="700" y="200" font-size="32">Past the edge</text>
        </svg>
      </deck-feature>
      <deck-feature id="svg-shadow"><h1 slot="title">Shadow</h1><sales-drawing></sales-drawing></deck-feature>`);
    const r = reportFast('svg-escape');
    const escapes = r.json.diagnostics.filter((d: any) => d.code === 'SVG_TEXT_ESCAPES');

    const card = escapes.find((d: any) => d.measurement.against === 'rect' && d.slideId === 'svg-card');
    expect(card, r.stdout).toBeTruthy();
    expect(card.severity).toBe('error');
    expect(card.excerpt).toContain('A label far too long');
    expect(card.measurement.escapePx).toBeGreaterThan(100);
    expect(card.measurement.shape).toContain('rect');

    const edge = escapes.find((d: any) => d.measurement.against === 'viewBox');
    expect(edge, r.stdout).toBeTruthy();
    expect(edge.slideId).toBe('svg-card');
    expect(edge.excerpt).toBe('Past the edge');

    const shadow = escapes.find((d: any) => d.slideId === 'svg-shadow');
    expect(shadow, r.stdout).toBeTruthy();
    expect(shadow.element).toContain('sales-drawing ::shadow');
  });

  test('reports two labels painted over each other, once, under its own code', () => {
    deck('svg-overlap', `<deck-feature id="svg-overlap"><h1 slot="title">Overlap</h1>
        <svg viewBox="0 0 800 300" style="width:800px">
          <text x="40" y="100" font-size="32">First label</text>
          <text x="60" y="110" font-size="32">Second label</text>
        </svg>
      </deck-feature>`);
    const r = reportFast('svg-overlap');
    const overlap = r.json.diagnostics.find((d: any) => d.code === 'SVG_TEXT_OVERLAP');
    expect(overlap, r.stdout).toBeTruthy();
    expect(overlap.severity).toBe('error');
    expect(overlap.slideId).toBe('svg-overlap');
    expect(overlap.message).toContain('First label');
    expect(overlap.measurement.otherText).toBe('Second label');
    expect(overlap.measurement.overlapPx.x).toBeGreaterThan(2);
    expect(overlap.measurement.overlapPx.y).toBeGreaterThan(2);
    // A drawn label is not a laid-out box · the layout code stays out of it.
    expect(codes(r), r.stdout).not.toContain('CONTENT_OVERLAPS_SIBLING');
  });

  test('leaves a well-drawn scene alone, hidden labels and a late entrance included', () => {
    // Every trap is here: a label centred in a circle, one in a translated
    // group, a definition holding a rect, labels hidden three ways right on
    // top of the visible one, an empty label, two caption lines set tighter
    // than the font's line cell, and a card that grows in over thirty seconds
    // · far longer than the wait for a still frame.
    deck('svg-clean', `<style>
        @keyframes grow { from { transform: scaleX(0); } to { transform: scaleX(1); } }
        .late { transform-box: fill-box; animation: grow 30s linear both; }
      </style>
      <deck-feature id="svg-clean"><h1 slot="title">Clean</h1>
        <svg viewBox="0 0 800 400" style="width:800px">
          <defs><clipPath id="c"><rect x="0" y="0" width="10" height="10"/></clipPath></defs>
          <rect x="20" y="20" width="400" height="80" fill="#eee"/>
          <text x="40" y="70" font-size="32">Fits</text>
          <text x="40" y="70" font-size="32" style="display:none">Hidden over the first</text>
          <g style="display:none"><text x="40" y="70" font-size="32">Hidden group</text></g>
          <text x="40" y="70" font-size="32" style="visibility:hidden">Hidden too</text>
          <text x="300" y="70" font-size="32"> </text>
          <circle cx="620" cy="80" r="60" fill="#ddd"/>
          <text x="620" y="90" font-size="28" text-anchor="middle">Dot</text>
          <g transform="translate(20 140)"><rect width="400" height="60" fill="#eee"/><text x="200" y="40" font-size="28" text-anchor="middle">Centred</text></g>
          <text x="460" y="180" font-size="25">first caption line</text>
          <text x="460" y="206" font-size="25">and its second</text>
          <rect class="late" x="20" y="260" width="500" height="80" fill="#eee"/>
          <text x="40" y="310" font-size="32">A card that grows in late</text>
        </svg>
      </deck-feature>`);
    const r = reportFast('svg-clean');
    expect(svgCodes(r), r.stdout).toEqual([]);
  });

  test('reports a scene that could not fit an item by its own words, not its drawing', () => {
    // A scene names the field it could not fit, with its measure, in
    // data-scene-issues and draws it anyway. The field is what the author
    // fixes, so it is reported once, by name, and the over-long label it drew
    // is not reported a second time.
    const issue = JSON.stringify([{
      code: 'SCENE_TEXT_TOO_LONG',
      severity: 'error',
      items: ['MCP · label'],
      message: 'could not fit',
      fields: [{ item: 'MCP', field: 'label', text: 'A scene label much too long', measured: 420, budget: 140 }],
    }]);
    deck('scene-overflow', `<script>
        customElements.define('deck-scene-probe', class extends HTMLElement {
          connectedCallback() {
            this.attachShadow({ mode: 'open' }).innerHTML = '<svg viewBox="0 0 800 300" style="width:800px">'
              + '<rect x="20" y="20" width="160" height="80" fill="#eee"/>'
              + '<text x="40" y="70" font-size="32">A scene label much too long</text></svg>';
            this.setAttribute('data-scene-issues', ${JSON.stringify(issue)});
          }
        });
      </script>
      <deck-feature id="scene-overflow"><h1 slot="title">Scene</h1><deck-scene-probe></deck-scene-probe></deck-feature>`);
    const r = reportFast('scene-overflow');
    const found = r.json.diagnostics.find((d: any) => d.code === 'SCENE_TEXT_TOO_LONG');
    expect(found, r.stdout).toBeTruthy();
    expect(found.severity).toBe('error');
    expect(found.slideId).toBe('scene-overflow');
    expect(found.measurement.items).toEqual(['MCP · label']);
    expect(found.measurement.fields[0]).toMatchObject({ field: 'label', measured: 420, budget: 140 });
    expect(found.suggestion).toContain('shorten the label');
    expect(found.element).toContain('deck-scene-probe');
    expect(codes(r), r.stdout).not.toContain('SVG_TEXT_ESCAPES');
  });

  test('reports text a drawing sets under the readable floor, by what the room sees', () => {
    // 10 units in a 400-unit viewBox drawn 400px wide is 10px · under the 18px floor.
    // The same 10 units in a viewBox drawn at twice the size is 20px and is fine.
    deck('svg-small', `<deck-feature id="svg-small"><h1 slot="title">Small</h1>
        <svg viewBox="0 0 400 100" style="width:400px"><text x="10" y="40" font-size="10">too small</text>
          <text x="10" y="80" font-size="24">fine</text></svg>
        <svg viewBox="0 0 200 50" style="width:400px"><text x="5" y="20" font-size="10">scaled up, fine</text></svg>
      </deck-feature>`);
    const r = reportFast('svg-small');
    const small = r.json.diagnostics.filter((d: any) => d.code === 'SVG_TEXT_TOO_SMALL');
    expect(small, r.stdout).toHaveLength(1);
    expect(small[0].excerpt).toBe('too small');
    expect(small[0].measurement.px).toBeLessThan(18);
    expect(small[0].severity).toBe('warning');
  });

  test('reports a label whose colour is too close to what it is drawn on', () => {
    deck('svg-contrast', `<deck-feature id="svg-contrast"><h1 slot="title">Contrast</h1>
        <svg viewBox="0 0 800 300" style="width:800px">
          <rect x="20" y="20" width="360" height="80" fill="#888888"/>
          <text x="40" y="70" font-size="32" fill="#7c7c7c">grey on grey</text>
          <rect x="420" y="20" width="360" height="80" fill="#ffffff"/>
          <text x="440" y="70" font-size="32" fill="#000000">black on white</text>
          <rect x="20" y="140" width="360" height="80" fill="#ffffff"/>
          <rect x="20" y="140" width="360" height="80" fill="#000000"/>
          <text x="40" y="190" font-size="32" fill="#ffffff">on the top shape</text>
          <rect x="420" y="140" width="360" height="80" fill="#ffffff"/>
          <text x="440" y="190" font-size="32" fill="#ffffff" opacity="0">not painted</text>
        </svg>
      </deck-feature>`);
    const r = reportFast('svg-contrast');
    const low = r.json.diagnostics.filter((d: any) => d.code === 'SVG_TEXT_CONTRAST_LOW');
    expect(low.map((d: any) => d.excerpt), r.stdout).toEqual(['grey on grey']);
    expect(low[0].severity).toBe('error');
    expect(low[0].measurement.ratio).toBeLessThan(1.5);
  });

  /** The illustration rules read any SVG of a slide · these draw one on purpose. */
  const illustration = (id: string, body: string, attrs = '') =>
    deck(
      id,
      `<deck-feature id="${id}"><h1 slot="title">Illustration</h1>
        <svg viewBox="0 0 800 400" style="width:800px;height:400px"${attrs}>${body}</svg></deck-feature>`,
    );
  const cards = (x: number[]) =>
    x.map((left) => `<rect x="${left}" y="60" width="200" height="280" fill="#eee"/><text x="${left + 20}" y="110" font-size="30">Card</text>`).join('');
  const illCodes = (r: { json: any }) =>
    r.json.diagnostics.filter((d: any) => d.code.startsWith('ILL_')).map((d: any) => d.code);

  test('a drawing that is framed, centred and has one focal is left alone, and scored', () => {
    illustration(
      'ill-clean',
      `${cards([60, 300, 540])}<rect x="300" y="60" width="200" height="280" fill="#f07020"/><text x="320" y="110" font-size="30" fill="#000">Focal</text>`,
    );
    const r = reportFast('ill-clean');
    expect(illCodes(r), r.stdout).toEqual([]);
    expect(r.json.illustrations).toHaveLength(1);
    expect(r.json.illustrations[0]).toMatchObject({ slideId: 'ill-clean', verdict: 'ship' });
    expect(r.json.illustrations[0].facets).toHaveProperty('balance');
  });

  test('ILL_ESCAPE is a defect, with the pixels it runs past the frame', () => {
    illustration('ill-escape', `${cards([60, 300])}<rect x="700" y="60" width="160" height="280" fill="#eee"/>`);
    const r = reportFast('ill-escape');
    const found = r.json.diagnostics.find((d: any) => d.code === 'ILL_ESCAPE');
    expect(found, r.stdout).toBeTruthy();
    expect(found.severity).toBe('error');
    expect(found.fix.action).toBe('move-inside');
    expect(r.json.illustrations[0].verdict).toBe('fail');
    // Silenced by the deck's policy, the defect no longer fails the drawing · and the
    // row says what was left out of its verdict.
    const run = cli(['check', 'ill-escape.html', '--json', '--no-visual', '--severity', 'ill-escape=off']);
    const silenced = JSON.parse(run.stdout);
    expect(silenced.illustrations[0].verdict, run.stdout).not.toBe('fail');
    expect(silenced.illustrations[0].suppressed).toEqual(['ILL_ESCAPE']);
    expect(silenced.suppressed.map((d: any) => d.code)).toContain('ILL_ESCAPE');
  });

  test('ILL_SHAPE_OVERLAP is a defect, and a shape inside another is not', () => {
    illustration('ill-overlap', `<rect x="60" y="60" width="300" height="280" fill="#eee"/><rect x="300" y="100" width="300" height="240" fill="#ddd"/><rect x="620" y="60" width="120" height="280" fill="#eee"/>`);
    expect(illCodes(reportFast('ill-overlap'))).toContain('ILL_SHAPE_OVERLAP');
    illustration('ill-inside', `${cards([60, 540])}<rect x="80" y="130" width="100" height="100" fill="#ddd"/>`);
    expect(illCodes(reportFast('ill-inside'))).not.toContain('ILL_SHAPE_OVERLAP');
  });

  test('a drawing that leans to one side is a warning, and balance="free" says it is meant', () => {
    illustration('ill-lean', `<rect x="20" y="60" width="200" height="280" fill="#eee"/><rect x="240" y="60" width="200" height="280" fill="#eee"/><text x="40" y="110" font-size="30">Left</text>`);
    const lean = reportFast('ill-lean');
    const found = lean.json.diagnostics.find((d: any) => d.code === 'ILL_OFF_CENTRE');
    expect(found, lean.stdout).toBeTruthy();
    expect(found.severity).toBe('warning');
    expect(lean.status, 'a warning does not fail the run').toBe(0);
    deck(
      'ill-free',
      `<deck-feature id="ill-free"><h1 slot="title">Illustration</h1>
        <div balance="free"><svg viewBox="0 0 800 400" style="width:800px;height:400px"><rect x="20" y="60" width="200" height="280" fill="#eee"/><rect x="240" y="60" width="200" height="280" fill="#eee"/><text x="40" y="110" font-size="30">Left</text></svg></div></deck-feature>`,
    );
    expect(illCodes(reportFast('ill-free'))).not.toContain('ILL_OFF_CENTRE');
  });

  test('an animation that never ends is a defect, and a long one a warning', () => {
    illustration(
      'ill-motion',
      `<style>.spin{animation:spin 1s linear infinite;transform-box:fill-box;transform-origin:center}.slow{animation:slow 4s ease 0s both}@keyframes spin{to{transform:rotate(360deg)}}@keyframes slow{from{opacity:0}to{opacity:1}}</style>${cards([60, 300, 540])}<circle class="spin" cx="400" cy="200" r="30" fill="#f07020"/><rect class="slow" x="360" y="300" width="80" height="20" fill="#ccc"/>`,
    );
    const r = reportFast('ill-motion');
    expect(illCodes(r), r.stdout).toEqual(expect.arrayContaining(['ILL_MOTION_ENDLESS', 'ILL_MOTION_LONG']));
    expect(r.json.diagnostics.find((d: any) => d.code === 'ILL_MOTION_ENDLESS').severity).toBe('error');
  });

  test('a scene is measured too, and the report scores it', () => {
    const html = readFileSync(join(PKG_DIR, 'decks', 'tests', 'deck-scene-cards.html'), 'utf8');
    deck('ill-scene', html.split('<deck-root>')[1].split('</deck-root>')[0], ['deck-scene-cards']);
    const r = reportFast('ill-scene');
    expect(r.json.illustrations.length, r.stdout).toBeGreaterThan(0);
    expect(r.json.illustrations[0].tag).toBe('deck-scene-cards');
  });

  test('a diagram written as an intent is scored on its meaning, and a defect of meaning fails it whatever its score', () => {
    const bottleneck = (neck: string) => `<deck-feature id="goulot"><h1 slot="title">Six arrive, two pass</h1>
        <deck-diagram intent="bottleneck">
          <dg-box role="source" name="arrivees" icon="document" label="Arrivées" value="6 / min"></dg-box>
          <dg-queue role="queue" name="file" label="en attente"></dg-queue>
          <dg-box role="neck" name="validation" icon="search" label="Validation" value="${neck}"></dg-box>
          <dg-box role="sink" name="valides" icon="check" label="Validés" value="2 / min"></dg-box>
        </deck-diagram></deck-feature>`;
    deck('int-shown', bottleneck('2 / min'), ['deck-diagram']);
    const shown = reportFast('int-shown');
    expect(shown.json.diagnostics.filter((d: any) => d.code.startsWith('INT_')), shown.stdout).toEqual([]);
    expect(shown.json.illustrations[0]).toMatchObject({ tag: 'deck-diagram', intent: 'bottleneck' });
    expect(shown.json.illustrations[0].facets.meaning).toBe(100);

    deck('int-wide', bottleneck('8 / min'), ['deck-diagram']);
    const wide = reportFast('int-wide');
    const found = wide.json.diagnostics.find((d: any) => d.code === 'INT_BOTTLENECK_NOT_NARROWEST');
    expect(found, wide.stdout).toBeTruthy();
    expect(found.severity).toBe('error');
    expect(found.measurement.rates).toMatchObject({ arriving: 6, neck: 8 });
    expect(found.measurement.items).toContain('validation');
    expect(found.expected).toBeTruthy();
    expect(found.fix.action).toBe('set-attribute');
    expect(wide.status).not.toBe(0);
    const row = wide.json.illustrations[0];
    expect(row.verdict).toBe('fail');
    expect(row.facets.meaning).toBeLessThan(100);
    // The score still ranks the drawing as drawn · the verdict is what the meaning decides.
    expect(row.score).toBeGreaterThan(70);
  });

  /** `check --steps` on a deck of diagrams, fast · a finding of an early click counts. */
  const stepsFast = (name: string) => {
    const run = cli(['check', `${name}.html`, '--json', '--no-visual', '--steps']);
    return { ...run, json: JSON.parse(run.stdout) };
  };

  test('a story played on entry is judged on its own budget and its script · the four remedies are clean', () => {
    const html = readFileSync(join(PKG_DIR, 'decks', 'tests', 'deck-diagram-story.html'), 'utf8');
    deck('story', html.split('<deck-root>')[1].split('</deck-root>')[0], ['deck-diagram']);
    const r = stepsFast('story');
    const ours = r.json.diagnostics.filter((d: any) => /^(ILL|INT|DG)_/.test(d.code));
    expect(ours, r.stdout).toEqual([]);
    expect(r.json.illustrations).toHaveLength(4);
    for (const row of r.json.illustrations) expect(row.verdict, JSON.stringify(row)).toBe('ship');
  });

  // The recipes of `rikiki recipe`, each filled with its example brief · one slide,
  // checked click by click in the browser, the ILL_* rules included.
  const RECIPES = [
    'incident-band',
    'lanes-gate',
    'probe-stations',
    'wiring',
    'switch-over',
    'race-lock',
    'filter-records',
    'version-lanes',
    'escalation-runbook',
    'pulse-threshold',
    'scope-rings',
    'data-replay',
  ];
  for (const name of RECIPES)
    test(`the recipe ${name}, filled with its example brief, passes check --steps clean`, () => {
      const slide = cli(['recipe', name, '--example']);
      expect(slide.status, slide.stderr).toBe(0);
      deck(`recipe-${name}`, slide.stdout, ['deck-diagram']);
      const r = stepsFast(`recipe-${name}`);
      const ours = r.json.diagnostics.filter((d: any) => /^(ILL|INT|DG)_/.test(d.code));
      expect(ours, r.stdout).toEqual([]);
      expect(r.json.illustrations[0].verdict).toBe('ship');
    });

  test('the twelve recipes of the acceptance deck are clean click by click, and no two look alike', () => {
    const html = readFileSync(join(PKG_DIR, 'decks', 'tests', 'deck-diagram-recipes.html'), 'utf8');
    deck('recipes', html.split('<deck-root>')[1].split('</deck-root>')[0], ['deck-diagram']);
    const run = cli(['check', 'recipes.html', '--json', '--no-visual', '--steps', '--diversity']);
    const json = JSON.parse(run.stdout);
    const ours = json.diagnostics.filter((d: any) => /^(ILL|INT|DG)_/.test(d.code));
    expect(ours, run.stdout).toEqual([]);
    expect(json.illustrations).toHaveLength(RECIPES.length);
    for (const row of json.illustrations) expect(row.verdict, JSON.stringify(row)).toBe('ship');
    expect(json.diversity.repeated).toEqual([]);
    expect(json.diversity.structures).toBe(RECIPES.length);
  });

  test('a story whose break is told by tokens alone fails, and one with no flow before it is said', () => {
    deck(
      'story-thin',
      `<deck-feature id="thin"><h1 slot="title">A request, then nothing</h1>
        <deck-diagram play="enter" layout="row" gap="airy">
          <dg-box name="client" icon="user" label="client" paint="pale"></dg-box>
          <dg-box name="api" icon="code" label="API" paint="ink" proof="200 OK" beat="proof"></dg-box>
          <dg-link name="appel" from="client" to="api" flow="1" beat="event"></dg-link>
        </deck-diagram></deck-feature>`,
      ['deck-diagram'],
    );
    const r = reportFast('story-thin');
    const lost = r.json.diagnostics.find((d: any) => d.code === 'ILL_FINAL_INCOMPLETE');
    expect(lost, r.stdout).toBeTruthy();
    expect(lost.severity).toBe('error');
    expect(lost.measurement).toMatchObject({ phases: ['event'], marks: ['appel'] });
    expect(lost.fix.action).toBe('make-it-last');
    const steady = r.json.diagnostics.find((d: any) => d.code === 'ILL_NO_STEADY_STATE');
    expect(steady?.severity).toBe('warning');
    expect(steady.measurement.minMs).toBe(1500);
    expect(r.status).not.toBe(0);
  });

  test('a balance finding on a diagram names the marks and the attribute, and the change it proposes clears it', () => {
    const body = (paint: string) => `<deck-feature id="lean"><h1 slot="title">The full queue backs up</h1>
        <deck-diagram layout="column" gap="airy">
          <dg-group layout="row" link="arrow">
            <dg-box name="amont" icon="spark" label="Producer"${paint}></dg-box>
            <dg-queue name="file" label="queue" count="6" fill="6" tone="danger"></dg-queue>
            <dg-box name="aval" icon="clock" label="Consumer" emphasis></dg-box>
          </dg-group>
          <dg-meter name="perte" label="Messages lost" value="1.5" max="5" unit="%"></dg-meter>
          <dg-text for="aval" side="top" label="slow"></dg-text>
        </deck-diagram></deck-feature>`;
    deck('named-lean', body(' paint="outline"'), ['deck-diagram']);
    const leaning = reportFast('named-lean');
    const found = leaning.json.diagnostics.find((d: any) => d.code === 'ILL_OFF_CENTRE');
    expect(found, leaning.stdout).toBeTruthy();
    expect(found.fix.pulls[0]).toMatchObject({ mark: 'aval', kind: 'box' });
    const proposed = found.fix.try.find((t: any) => t.mark === 'amont');
    expect(proposed).toMatchObject({ set: 'paint="soft"' });
    expect(Math.abs(proposed.leanAfterPct)).toBeLessThanOrEqual(found.measurement.limitXPct);
    deck('named-lean-applied', body(` ${proposed.set}`), ['deck-diagram']);
    const applied = reportFast('named-lean-applied');
    expect(codes(applied), applied.stdout).not.toContain('ILL_OFF_CENTRE');
  });

  test('an open gate is not a weak accent, gates in series are one barrier, and lanes do not lean by their labels', () => {
    deck('gates', `<deck-feature id="canary"><h1 slot="title">The gauge passes, the gate drops</h1>
        <deck-diagram layout="column" gap="airy">
          <dg-meter name="gauge" label="Errors · line at 5 %" value="1 2 8" max="20" unit="%" threshold="5" tone="ok ok danger"></dg-meter>
          <dg-group layout="lanes" gap="tight">
            <dg-lane name="v2" icon="spark" label="v2" flow="2"></dg-lane>
            <dg-lane name="v1" icon="check" label="v1" flow="6"></dg-lane>
            <dg-gate name="gate" over="v2" by="gauge" label="back to v1" state="open open closed"></dg-gate>
            <dg-box name="clients" icon="team" label="Clients" paint="outline"></dg-box>
          </dg-group>
        </deck-diagram></deck-feature>
      <deck-feature id="layers"><h1 slot="title">Three layers, little gets through</h1>
        <deck-diagram layout="lanes" gap="airy">
          <dg-lane name="scans" icon="search" label="Scans" flow="4"></dg-lane>
          <dg-lane name="logins" icon="user" label="Fake logins" flow="4"></dg-lane>
          <dg-lane name="copies" icon="document" label="Stolen copies" flow="4"></dg-lane>
          <dg-gate name="firewall" over="scans" at="start" label="firewall" state="open closed"></dg-gate>
          <dg-gate name="auth" over="logins" at="middle" label="authentication" state="open open shed"></dg-gate>
          <dg-gate name="crypto" over="copies" at="end" label="encryption" state="open open open closed"></dg-gate>
          <dg-box name="data" icon="database" label="Data" paint="outline"></dg-box>
        </deck-diagram></deck-feature>`, ['deck-diagram']);
    const r = stepsFast('gates');
    const ill = r.json.diagnostics.filter((d: any) => d.code.startsWith('ILL_')).map((d: any) => `${d.code} s${d.slide}@${d.state}`);
    expect(ill, r.stdout).toEqual([]);
  });

  test("a link's label with no free place is said, and drawn on a box it is a defect that names the box", () => {
    deck('label-blocked', `<deck-feature id="blocked"><h1 slot="title">A label too long</h1>
        <deck-diagram layout="column" gap="tight">
          <dg-group layout="row"><dg-box name="top" label="Cart, payment and delivery teams"></dg-box></dg-group>
          <dg-group layout="row"><dg-box name="bottom" label="The service at the far bottom left"></dg-box></dg-group>
          <dg-link from="top" to="bottom" label="a label far too long to sit between them"></dg-link>
        </deck-diagram></deck-feature>`, ['deck-diagram']);
    const r = reportFast('label-blocked');
    const blocked = r.json.diagnostics.find((d: any) => d.code === 'DG_LABEL_BLOCKED');
    expect(blocked, r.stdout).toBeTruthy();
    expect(blocked.fix).toMatchObject({ action: 'shorten-label', link: 'top → bottom' });
    const over = r.json.diagnostics.find((d: any) => d.code === 'ILL_TEXT_OVER_SHAPE');
    expect(over?.severity).toBe('error');
    expect(over.measurement.on.length).toBeGreaterThan(0);
    expect(r.json.illustrations[0].verdict).toBe('fail');
  });

  test('a per-click list on a mark that appears late names the words never seen, and the list that shows them', () => {
    deck('late-words', `<deck-feature id="late"><h1 slot="title">The gate closes late</h1>
        <deck-diagram layout="lanes">
          <dg-lane name="api" icon="cloud" label="API"></dg-lane>
          <dg-gate name="stop" label="STOP" step="2" state="open closed"></dg-gate>
          <dg-box name="acme" icon="target" label="ACME" paint="outline"></dg-box>
        </deck-diagram></deck-feature>`, ['deck-diagram']);
    const r = reportFast('late-words');
    const found = r.json.diagnostics.find((d: any) => d.code === 'DG_STEP_WORDS_UNSEEN');
    expect(found, r.stdout).toBeTruthy();
    expect(found.severity).toBe('warning');
    expect(found.fix).toMatchObject({ attribute: 'state', write: 'open open open closed' });
  });

  /** Slides of one diagram each · the illustrations a gallery compares. */
  const gallery = (diagrams: string[]) =>
    diagrams
      .map((body, i) => `<deck-feature id="d${i + 1}"><h1 slot="title">Picture ${i + 1}</h1><deck-diagram ${body}</deck-diagram></deck-feature>`)
      .join('\n');
  const graph = (words: string[]) => `layout="layers" direction="right">
      <dg-box name="a" label="${words[0]}"></dg-box><dg-box name="b" label="${words[1]}" emphasis></dg-box>
      <dg-box name="c" label="${words[2]}"></dg-box><dg-box name="d" label="${words[3]}"></dg-box>
      <dg-link from="a" to="b"></dg-link><dg-link from="b" to="c d"></dg-link>`;

  test('six clones of one picture are the same look six times · a warning about the deck, never an error', () => {
    const words = ['Web Gateway Auth Postgres', 'Shop Cart Stock Billing', 'App API Queue Worker', 'CRM Sync Lake Report', 'Mail Relay Spam Inbox', 'Edge Cache Origin Disk'];
    deck('div-clones', gallery(words.map((w) => graph(w.split(' ')))), ['deck-diagram']);
    const r = reportFast('div-clones');
    const repeated = r.json.diagnostics.filter((d: any) => d.code === 'ILL_REPEATED_LOOK');
    expect(repeated, r.stdout).toHaveLength(15);
    expect(repeated.every((d: any) => d.severity === 'warning')).toBe(true);
    expect(repeated[0].measurement.slides).toHaveLength(2);
    expect(repeated[0].fix.action).toBe('vary-the-look');
    expect(r.status, 'a repeated look does not fail the run').toBe(0);
    expect(r.json.diversity).toMatchObject({ illustrations: 6, structures: 1, largestFamily: { share: 1 } });
    expect(r.json.diversity.matrix, 'the matrix only with --diversity').toBeUndefined();
    expect(r.json.illustrations[0].signature.structure).toMatchObject({ kind: 'deck-diagram', topology: 'fan-out' });
    const human = cli(['check', 'div-clones.html', '--no-visual', '--diversity']);
    expect(human.stderr).toContain('Diversity · 6 illustrations · 1 structures');
    expect(human.stderr).toContain('alike  slide 1 · slide 2');
    expect(human.stderr).toContain('nearest slide');
  });

  test('a varied gallery is left alone, and --diversity adds every distance', () => {
    deck('div-varied', gallery([
      graph(['Web', 'Gateway', 'Auth', 'Postgres']),
      `layout="column" align="start"><dg-bar label="Storage" value="52" emphasis></dg-bar><dg-bar label="Compute" value="31"></dg-bar><dg-bar label="Network" value="12"></dg-bar>`,
      `layout="ring" link="arrow"><dg-box label="Build"></dg-box><dg-box label="Measure"></dg-box><dg-box label="Learn" emphasis></dg-box>`,
      `intent="threshold"><dg-meter role="measure" name="disk" label="Disk" value="55 70 88" unit="%" threshold="80"></dg-meter><dg-box role="consequence" name="writes" icon="alert" label="Writes refused"></dg-box>`,
    ]), ['deck-diagram']);
    const run = cli(['check', 'div-varied.html', '--json', '--no-visual', '--diversity']);
    const json = JSON.parse(run.stdout);
    expect(json.diagnostics.filter((d: any) => d.code === 'ILL_REPEATED_LOOK'), run.stdout).toEqual([]);
    expect(json.diversity).toMatchObject({ illustrations: 4, structures: 4, intents: ['threshold'], repeated: [] });
    expect(json.diversity.matrix).toHaveLength(4);
  });

  /** Pictures poor on purpose · generic words, no figure, one paint, one model. */
  const POOR = [
    `layout="row" link="arrow"><dg-box label="Service A"></dg-box><dg-box label="Service B"></dg-box><dg-box label="Service C"></dg-box>`,
    `layout="layers" direction="right"><dg-box name="api" label="API"></dg-box><dg-box name="m1" label="Module 1"></dg-box><dg-box name="m2" label="Module 2"></dg-box><dg-link from="api" to="m1 m2"></dg-link>`,
    `layout="column" link="arrow"><dg-box label="Étape 1"></dg-box><dg-box label="Étape 2"></dg-box><dg-box label="Étape 3"></dg-box>`,
  ];
  /** A kill switch tested for real (decks/tests/deck-diagram-story.html) · the facts
   *  of its case, painted by role, told as a story and proven in the target. */
  const RICH = `<deck-feature id="stop"><h1 slot="title">The STOP button, tested for real</h1>
    <deck-diagram play="enter" layout="column" align="start">
      <dg-group layout="row" gap="airy">
        <dg-box name="essai" icon="flag" label="real test" note="Tuesday 14:02" paint="ok"></dg-box>
        <dg-box name="drapeau" icon="database" label="DB 2 · ON" swap="DB 2 · STOP" swap-icon="ban" paint="pale" tone="normal warn" beat="event" after="ecrit"></dg-box>
        <dg-box name="lit" icon="code" label="is_active()" note="the only code that reads STOP" paint="ink"></dg-box>
        <dg-link name="ecrit" from="essai" to="drapeau" label="writes" flow="1" beat="event"></dg-link>
        <dg-link name="lu" from="drapeau" to="lit" label="reads" flow="1" beat="spread"></dg-link>
      </dg-group>
      <dg-group layout="lanes" gap="tight">
        <dg-lane name="api" icon="cloud" label="API" note="POST /quotes" steady="3s"></dg-lane>
        <dg-lane name="tache" icon="clock" label="job" note="retry 15 min" steady="3s"></dg-lane>
        <dg-gate name="stop" by="lit" state="open closed" beat="spread" after="lu"></dg-gate>
        <dg-box name="acme" icon="target" label="ACME · prod" paint="pale" proof="0 quotes created" beat="proof"></dg-box>
        <dg-text name="coupe" for="stop" side="bottom" label="14:02:03" note="nothing gets through" beat="effect"></dg-text>
      </dg-group>
    </deck-diagram>
    <deck-source>Illustration · a test made up for the example (hours and client ACME invented)</deck-source>
  </deck-feature>`;

  test('the richness is measured on every drawing and says nothing by default · --richness says what the poor ones lack', () => {
    deck('rich-poor', `${gallery(POOR)}\n${RICH}`, ['deck-diagram']);
    const quiet = reportFast('rich-poor');
    const richnessCodes = ['ILL_GENERIC', 'ILL_FLAT_PAINT', 'ILL_MODEL_REPEAT'];
    expect(codes(quiet).filter((c: string) => richnessCodes.includes(c)), 'a measure, off by default').toEqual([]);
    const scores = quiet.json.illustrations.map((row: any) => row.richness.score);
    expect(Math.max(...scores.slice(0, 3)), quiet.stdout).toBeLessThanOrEqual(40);
    expect(scores[3], JSON.stringify(quiet.json.illustrations[3].richness)).toBeGreaterThanOrEqual(90);
    expect(quiet.json.illustrations[0].richness.criteria.content).toMatchObject({ points: 0, fix: { action: 'add-precise-facts' } });
    expect(quiet.json.richness).toMatchObject({ illustrations: 4, min: { slide: 1 } });
    expect(quiet.json.illustrations[0], 'the words of its marks stay inside the check').not.toHaveProperty('motif');

    const asked = cli(['check', 'rich-poor.html', '--json', '--no-visual', '--richness']);
    const json = JSON.parse(asked.stdout);
    const found = json.diagnostics.filter((d: any) => richnessCodes.includes(d.code));
    expect(found.every((d: any) => d.severity === 'warning'), asked.stdout).toBe(true);
    expect(asked.status, 'a measure never fails the run').toBe(quiet.status);
    expect(found.filter((d: any) => d.code === 'ILL_GENERIC').map((d: any) => d.slide)).toEqual([1, 2, 3]);
    expect(found.find((d: any) => d.code === 'ILL_FLAT_PAINT')?.fix.action).toBe('paint-by-role');
    const repeat = found.find((d: any) => d.code === 'ILL_MODEL_REPEAT');
    expect(repeat?.measurement).toMatchObject({ slide: 3, model: 'deck-diagram:boxes', uses: 3 });
    expect(found.filter((d: any) => d.slide === 4), 'the rich slide is left alone').toEqual([]);

    const human = cli(['check', 'rich-poor.html', '--no-visual', '--richness']);
    expect(human.stderr).toContain('Richness · 4 illustrations');
    expect(human.stderr).toMatch(/slide +score +content +demo +story +paint +result +model/);
    expect(human.stderr).toMatch(/ 1 +13 +0 +10 +- +0 +0 +deck-diagram:boxes/);
  });

  test('a crowd on a beat is one wave, and a cursor in a small part keeps its line off the labels · clean', () => {
    deck('charts-limits', `<deck-feature id="foule"><h1 slot="title">38 of 100 leave</h1>
        <deck-diagram play="enter" layout="grid">
          <dg-dot count="62" beat="steady"></dg-dot>
          <dg-dot name="partis" count="100" emphasis beat="event"></dg-dot>
          <dg-text for="partis" side="right" label="100 gone" note="21 in month 2" beat="proof"></dg-text>
        </deck-diagram></deck-feature>
      <deck-feature id="plafond"><h1 slot="title">The cap falls in tools</h1>
        <deck-diagram layout="axis">
          <dg-bar name="a" label="salaries" tag="70 %" from="0" to="70"></dg-bar>
          <dg-bar name="b" label="cloud" tag="22 %" from="70" to="92"></dg-bar>
          <dg-bar name="c" label="tools" tag="4 %" from="92" to="96"></dg-bar>
          <dg-bar name="d" label="other" tag="4 %" from="96" to="100"></dg-bar>
          <dg-cursor name="p" label="cap · 94 %" value="94"></dg-cursor>
        </deck-diagram></deck-feature>`, ['deck-diagram']);
    const r = reportFast('charts-limits');
    const ours = r.json.diagnostics.filter((d: any) => /^(ILL|INT|DG|SVG)_/.test(d.code) && d.code !== 'ILL_REPEATED_LOOK');
    expect(ours, r.stdout).toEqual([]);
  });

  test('a deck can ask for the richness findings by its policy, and silence one', () => {
    deck('rich-policy', gallery(POOR), ['deck-diagram']);
    const run = cli(['check', 'rich-policy.html', '--json', '--no-visual', '--richness', '--checks', '-ill-flat-paint']);
    const json = JSON.parse(run.stdout);
    expect(codes({ json })).toContain('ILL_GENERIC');
    expect(codes({ json })).not.toContain('ILL_FLAT_PAINT');
  });

  test('a scene that reported one text still has the rest of its drawing measured', () => {
    // The known fault must not hide another: only the reported words are
    // dropped from the geometry findings, the other label still spills.
    const issue = JSON.stringify([{
      code: 'SCENE_TEXT_TOO_LONG',
      severity: 'error',
      items: ['MCP · label'],
      message: 'could not fit',
      fields: [{ item: 'MCP', field: 'label', text: 'A scene label much too long' }],
    }]);
    deck('scene-two-faults', `<script>
        customElements.define('deck-scene-probe2', class extends HTMLElement {
          connectedCallback() {
            this.attachShadow({ mode: 'open' }).innerHTML = '<svg viewBox="0 0 800 300" style="width:800px">'
              + '<rect x="20" y="20" width="160" height="80" fill="#eee"/>'
              + '<text x="40" y="70" font-size="32">A scene label much too long</text>'
              + '<rect x="400" y="20" width="160" height="80" fill="#eee"/>'
              + '<text x="420" y="70" font-size="32">Another label that spills</text></svg>';
            this.setAttribute('data-scene-issues', ${JSON.stringify(issue)});
          }
        });
      </script>
      <deck-feature id="scene-two-faults"><h1 slot="title">Scene</h1><deck-scene-probe2></deck-scene-probe2></deck-feature>`);
    const r = reportFast('scene-two-faults');
    const spills = r.json.diagnostics.filter((d: any) => d.code === 'SVG_TEXT_ESCAPES');
    expect(spills.map((d: any) => d.excerpt), r.stdout).toEqual(['Another label that spills']);
  });
});

test.describe('every slide is measured, not only the one on screen', () => {
  // deck-root shows the active slide and hides the rest, so a single
  // inspection of the document measured empty rects everywhere but slide 1:
  // the painted-box and graph codes fired only when the defect happened to
  // sit on the opening slide. Default mode now walks the deck slide by slide.
  const para =
    "Une phrase assez longue pour remplir la carte. Une deuxieme phrase qui pousse le texte encore plus bas dans la carte. Une troisieme phrase qui continue d'allonger le paragraphe pour forcer un debordement bien visible au-dela de la bordure de la carte, vers le bas.";

  const later = (r: { json: any; stdout: string }, code: string) => {
    const found = r.json.diagnostics.find((d: any) => d.code === code);
    expect(found, `${code} · ${r.stdout}`).toBeTruthy();
    expect(found.slide, `${code} is reported on the slide it sits on`).toBeGreaterThan(1);
    return found;
  };

  test('reports a defect that sits on a slide the deck does not open on', () => {
    deck(
      'late-defects',
      `<script type="module" src="rikiki/dist/deck-graph.js"></script>
       <deck-cover id="first"><h1>Une ouverture sans defaut</h1></deck-cover>
       <deck-feature id="late-out"><h1 slot="title">Graph</h1>
         <deck-graph>
           <deck-node id="outside" at="1,50" boxed label="A node with a useful long label"></deck-node>
           <deck-node id="inside" at="75,50" boxed label="Inside"></deck-node>
           <deck-edge from="outside" to="inside"></deck-edge>
         </deck-graph>
       </deck-feature>
       <deck-feature id="late-cross"><h1 slot="title">Graph</h1>
         <deck-graph>
           <deck-node id="a" at="15,50" boxed label="A"></deck-node>
           <deck-node id="blocker" at="50,50" boxed label="Blocked"></deck-node>
           <deck-node id="c" at="85,50" boxed label="C"></deck-node>
           <deck-edge from="a" to="c" label="request"></deck-edge>
         </deck-graph>
       </deck-feature>
       <deck-feature id="late-overlap"><h1 slot="title">Graph</h1>
         <deck-graph>
           <deck-node id="near" at="50,50" boxed label="A source nobody can read"></deck-node>
           <deck-node id="over" at="52,50" boxed label="Because of this one"></deck-node>
         </deck-graph>
       </deck-feature>
       <deck-feature id="late-spill"><h1 slot="title">Deux options</h1>
         <deck-grid cols="2" rows="140px">
           <deck-card id="a" color="yellow"><h3>Option A</h3><p>${para}</p></deck-card>
           <deck-card id="b" color="green"><h3>Option B</h3><p>${para}</p></deck-card>
         </deck-grid>
         <deck-callout type="info">Ce texte de synthese doit rester lisible meme si les cartes au-dessus debordent un peu trop bas.</deck-callout>
       </deck-feature>`,
    );
    const r = reportFast('late-defects');

    expect(later(r, 'GRAPH_NODE_OUT_OF_BOUNDS').slideId).toBe('late-out');
    expect(later(r, 'GRAPH_EDGE_CROSSES_NODE').slideId).toBe('late-cross');
    expect(later(r, 'GRAPH_NODE_OVERLAPS_NODE').slideId).toBe('late-overlap');
    expect(later(r, 'CONTENT_ESCAPES_BOX').slideId).toBe('late-spill');
    expect(later(r, 'CONTENT_OVERLAPS_SIBLING').slideId).toBe('late-spill');

    // One state per slide in default mode · the count keeps meaning the
    // number of slides, and no diagnostic claims a state it never walked.
    expect(r.json.statesInspected).toBe(r.json.slideCount);
    expect(r.json.diagnostics.every((d: any) => d.state === undefined), r.stdout).toBe(true);
  });
});

test.describe('a row of figures', () => {
  // The reported slide: three metrics, each a value, a label and a note that
  // wraps to two lines, inside a deck-feature that already held a title and a
  // lead. It fitted under the published runtime and was cut off by the branch,
  // because the value scale had grown with the viewport. The fixture is sized
  // to sit just inside the canvas at the signature statement size · which is
  // what makes the second half of the test worth writing.
  const FIGURES = `<deck-feature id="figures" spread="center" eyebrow="Le parc">
       <h1 slot="title">Ce que la releve a mesure sur le terrain, saison apres saison, sans jamais interrompre l'exploitation ni mobiliser une equipe</h1>
       <p slot="lead">Trois mesures qui resument la campagne : ce que la releve a couvert sur le terrain, ce qu'elle a coute a concevoir une seule fois, et ce qui la rejoue chaque annee sans personne devant l'ecran ni budget supplementaire a prevoir.</p>
       <deck-kpi-grid GRID ruled cols="3">
         <deck-kpi value="4 174" label="constats releves" note="sur l'ensemble du parc, dont la nuit, sans surveillance"></deck-kpi>
         <deck-kpi value="17 h" label="de conception" tone="accent" note="une seule fois, puis le programme tourne seul chaque annee"></deck-kpi>
         <deck-kpi value="429" label="tests automatises" note="rejoues a chaque version, dont la nuit, sans surveillance"></deck-kpi>
       </deck-kpi-grid>
     </deck-feature>`;

  test('fits three three-line metrics on the slide it was laid out for', () => {
    deck('figures', FIGURES.replace('GRID ', ''), ['deck-kpi-grid']);
    const r = reportFast('figures');
    expect(codes(r), r.stdout).not.toContain('CONTENT_CLIPPED');
    expect(codes(r), r.stdout).not.toContain('CONTENT_OVERLAPS_SIBLING');
  });

  test('still reaches the fluid scale through --deck-kpi-value-size', () => {
    // The same slide with the scale the branch had made the default · it is
    // off the canvas, which is both the bug that was reported and the proof
    // that the knob still carries the larger scale for a deck with room.
    const fluid = 'style="--deck-kpi-value-size: clamp(2.25rem, calc(18cqw / 3), 7rem)"';
    deck('figures-fluid', FIGURES.replace('GRID', fluid), ['deck-kpi-grid']);
    const r = reportFast('figures-fluid');
    expect(codes(r), r.stdout).toContain('CONTENT_CLIPPED');
  });
});

test.describe('the visual pass', () => {
  test('reports a slide whose content sits in the top with a dead band below', () => {
    // Measured on the pixels, not on the DOM: a box can be the right size and
    // the slide still read as unfinished. This is the defect a room notices
    // first, and the one the DOM cannot see.
    deck(
      'topheavy',
      `<deck-feature id="haut"><h1 slot="title">Un titre qui prend le haut</h1>
         <p>Une phrase, et rien d'autre.</p>
       </deck-feature>`,
    );
    const r = report('topheavy');
    const found = r.json.diagnostics.find((d: any) => d.code === 'SLIDE_TOP_HEAVY');
    expect(found, 'the imbalance is reported').toBeTruthy();
    expect(found.severity).toBe('warning');
    expect(found.slideId).toBe('haut');
    expect(found.measurement.emptyBandBelow).toBeGreaterThan(0.3);
    expect(found.suggestion).toMatch(/spread/);
    expect(r.json.visualMeasured).toBe(true);
  });

  test('leaves a slide alone when its content earns the space', () => {
    // The imbalance is reported, never the amount of empty space on its own:
    // a slide whose ink reaches down the canvas is left alone whatever remains.
    deck(
      'filled',
      `<deck-feature id="plein" spread="center"><h1 slot="title">Plein</h1>
         <deck-callout type="info">Une première phrase, qui porte le propos de la slide.</deck-callout>
         <deck-callout type="ok">Une deuxième, qui l'appuie avec un fait mesuré.</deck-callout>
         <deck-callout type="warn">Une troisième, qui nuance ce que les deux premières affirment.</deck-callout>
       </deck-feature>`,
    );
    const r = report('filled');
    expect(r.json.diagnostics.filter((d: any) => d.code === 'SLIDE_TOP_HEAVY')).toEqual([]);
  });

  test('says so when the pixels were not measured', () => {
    // A deck that never rendered cannot be measured · the report must not let
    // that silence read as a clean visual bill.
    writeFileSync(
      join(workDir, 'novisual.html'),
      `<!doctype html><html lang="fr"><head><meta charset="UTF-8">
<script type="module" src="rikiki/dist/absent.js"></script>
</head><body><deck-root><deck-cover><h1>A</h1></deck-cover></deck-root></body></html>`,
    );
    const r = report('novisual');
    expect(r.json.visualMeasured).toBe(false);
    expect(r.json.notChecked.join(' ')).toMatch(/pixels/);
  });
});

// ── --slides · check only the slides that were asked for ─────────────
test.describe('check --slides', () => {
  const OVERFLOWING = `<svg viewBox="0 0 800 300" style="width:800px">
    <rect x="20" y="20" width="200" height="80" fill="#eee"/>
    <text x="40" y="70" font-size="32">A label far too long for this card</text></svg>`;
  const slide = (id: string, drawing = '') =>
    `<deck-feature id="${id}"><h1 slot="title">${id}</h1>${drawing}</deck-feature>`;

  /** Slides 2 ("bad-early") and 4 ("bad-late") carry the same defect. */
  const DECK = 'pick-slides';
  test.beforeAll(() => {
    deck(
      DECK,
      [slide('intro'), slide('bad-early', OVERFLOWING), slide('middle'), slide('bad-late', OVERFLOWING)].join('\n'),
    );
  });

  const checkSlides = (selector: string) => {
    const run = cli(['check', `${DECK}.html`, '--json', '--no-visual', '--slides', selector]);
    return { ...run, json: run.status === 2 ? null : JSON.parse(run.stdout) };
  };
  const escaped = (r: { json: any }) =>
    r.json.diagnostics.filter((d: any) => d.code === 'SVG_TEXT_ESCAPES').map((d: any) => d.slideId);

  test('measures one slide and says which, leaving the defect elsewhere unreported', () => {
    const r = checkSlides('4');
    expect(r.json.slidesChecked).toEqual([4]);
    expect(r.json.slideCount).toBe(4);
    expect(escaped(r)).toEqual(['bad-late']);
    expect(r.json.statesInspected).toBe(1);
    expect(r.json.notChecked.join(' ')).toMatch(/1 of 4 slides measured/);
  });

  test('measures a set of slides, by position and by id, in deck order', () => {
    const r = checkSlides('bad-late,1,intro');
    expect(r.json.slidesChecked).toEqual([1, 4]);
    expect(escaped(r)).toEqual(['bad-late']);
  });

  test('measures an interval, closed or open at either end', () => {
    expect(checkSlides('2-3').json.slidesChecked).toEqual([2, 3]);
    expect(escaped(checkSlides('2-3'))).toEqual(['bad-early']);
    expect(checkSlides('-2').json.slidesChecked).toEqual([1, 2]);
    expect(checkSlides('3-').json.slidesChecked).toEqual([3, 4]);
    expect(escaped(checkSlides('3-'))).toEqual(['bad-late']);
  });

  test('measures several intervals, and the slides between two ends', () => {
    expect(checkSlides('1,3-4').json.slidesChecked).toEqual([1, 3, 4]);
    const between = checkSlides('bad-early..bad-late');
    expect(between.json.slidesChecked).toEqual([2, 3, 4]);
    expect(escaped(between)).toEqual(['bad-early', 'bad-late']);
  });

  test('measures every slide when no selection is given', () => {
    const run = cli(['check', `${DECK}.html`, '--json', '--no-visual']);
    const r = { json: JSON.parse(run.stdout) };
    expect(r.json.slidesChecked).toEqual([1, 2, 3, 4]);
    expect(escaped(r)).toEqual(['bad-early', 'bad-late']);
    expect(r.json.notChecked.join(' ')).not.toMatch(/slides measured/);
  });

  test('still reads what belongs to the whole document when slide 1 is left out', () => {
    // The document-wide pass is tied to the first slide walked, not to slide 1.
    const r = checkSlides('3');
    expect(r.json.slidesChecked).toEqual([3]);
    expect(r.json.settled).toBe(true);
    expect(r.json.statesInspected).toBe(1);
  });

  test('refuses an unknown or malformed selection with exit 2, naming what the deck holds', () => {
    for (const selector of ['9', 'ghost', '4-2', '2..1']) {
      const r = checkSlides(selector);
      expect(r.status, selector).toBe(2);
      expect(r.stdout, 'no report on stdout for a refused selection').toBe('');
      expect(r.stderr).toContain('no slide matches');
      expect(r.stderr).toContain('this deck has: 1 (intro), 2 (bad-early), 3 (middle), 4 (bad-late)');
    }
  });
});

// ── scene lint · what a scene would draw silently ────────────────────
test.describe('scene lint', () => {
  const SCENES = ['cards', 'steps', 'flow', 'bars', 'matrix', 'ranges', 'lanes', 'units'].map(
    (kind) => `deck-scene-${kind}`,
  );

  /** A fixture's slides, from the repository · one source for the deck and the test. */
  const fixtureSlides = (name: string) => {
    const html = readFileSync(join(PKG_DIR, 'decks', 'tests', `${name}.html`), 'utf8');
    return html.split('<deck-root>')[1].split('</deck-root>')[0];
  };
  const sceneCodes = (r: { json: any }) => codes(r).filter((c: string) => c.startsWith('SCENE_'));
  const findings = (r: { json: any }, code: string) =>
    r.json.diagnostics.filter((d: any) => d.code === code);

  test('names every silent failure of a scene, once, on its slide, with the items concerned', () => {
    deck('scene-lint', fixtureSlides('deck-scene-lint'), SCENES);
    const r = reportFast('scene-lint');
    const only = (code: string, slideId: string) => {
      const found = findings(r, code).filter((d: any) => d.slideId === slideId);
      expect(found, `${code} on ${slideId}\n${r.stdout}`).toHaveLength(1);
      return found[0];
    };

    expect(only('SCENE_ITEMS_DROPPED', 'lint-cards')).toMatchObject({
      severity: 'error',
      measurement: { items: ['Sixth, never drawn'] },
    });
    expect(only('SCENE_ITEM_NO_LABEL', 'lint-cards').measurement.items).toEqual(['item 4']);
    expect(only('SCENE_ICON_UNKNOWN', 'lint-cards').measurement.items).toEqual(['Unknown icon']);
    expect(only('SCENE_VALUE_INVALID', 'lint-bars').measurement.items).toEqual(['Not a number', 'No value']);
    expect(only('SCENE_LEVEL_INVALID', 'lint-matrix').measurement.items).toEqual(['Too short', 'Unknown word']);
    expect(only('SCENE_VALUE_INVALID', 'lint-ranges').measurement.items).toEqual(['Backwards', 'A word']);
    expect(only('SCENE_ITEMS_DROPPED', 'lint-flow').measurement.items).toEqual([
      'Source 5 is cut',
      'Outcome 3 is cut',
    ]);

    expect(only('SCENE_VALUE_INVALID', 'lint-lanes').measurement.items).toEqual(['passed', 'blocked']);
    expect(only('SCENE_ATTRIBUTE_IGNORED', 'lint-lanes').measurement.items).toEqual(['Reads a value · value']);

    const tall = only('SCENE_TOO_TALL', 'lint-tall');
    expect(tall.severity).toBe('error');
    expect(tall.measurement.items[0]).toMatch(/^6 items, \d{3,4} units tall$/);
    expect(only('SCENE_VALUE_INVALID', 'lint-units').measurement.items).toEqual(['Past the total', 'No value']);
    expect(only('SCENE_GRID_TOO_DENSE', 'lint-units').measurement.items[0]).toMatch(/400 cells in 40 columns/);

    expect(only('SCENE_VALUE_CLIPPED', 'lint-bars-scale').measurement.items).toEqual(['Past max']);
    expect(only('SCENE_ATTRIBUTE_INVALID', 'lint-bars-scale').measurement.items).toEqual(['height']);
    expect(only('SCENE_GROUP_SPLIT', 'lint-bars-scale')).toMatchObject({
      severity: 'warning',
      measurement: { items: ['Q1'] },
    });
    expect(only('SCENE_VALUE_CLIPPED', 'lint-ranges-scale').measurement.items).toEqual(['Past scale']);
    expect(only('SCENE_ATTRIBUTE_INVALID', 'lint-ranges-scale').measurement.items).toEqual(['scale']);

    // Each field that did not fit is named with its measure, and the fix is
    // the field's own · a figure is not shortened like a label.
    const long = only('SCENE_TEXT_TOO_LONG', 'lint-fields');
    const byField = Object.fromEntries(long.measurement.fields.map((f: any) => [f.field, f]));
    expect(Object.keys(byField).sort()).toEqual(['figure', 'label']);
    expect(byField.figure).toMatchObject({ item: 'Wide figure', text: '760 000 000 000 ms' });
    expect(byField.figure.measured).toBeGreaterThan(byField.figure.budget);
    expect(byField.label.item).toBe('Pneumonoultramicroscopicsilicovolcanoconiosis');
    expect(long.suggestion).toContain('figure is too wide');
    expect(long.suggestion).toContain('shorten the label');
    // The fix a reader acts on without parsing words: the action, and for each
    // field how long it is, how much the measured table says fits, and the units.
    expect(long.fix.action).toBe('shorten');
    const target = Object.fromEntries(long.fix.targets.map((t: any) => [t.field, t]));
    expect(target.label).toMatchObject({ item: 'Pneumonoultramicroscopicsilicovolcanoconiosis', chars: 45 });
    expect(target.label.holds).toBeGreaterThan(10);
    expect(target.label.holds).toBeLessThan(45);
    expect(target.label.needsUnits).toBeGreaterThan(target.label.hasUnits);
    expect(target.figure.holds, 'a figure is not in the table').toBeNull();
    expect(long.suggestion).toMatch(/about \d+ fit here/);

    const fallback = only('SCENE_FONT_FALLBACK', 'lint-font');
    expect(fallback.severity).toBe('warning');
    expect(fallback.measurement.family).toBe('NoSuchFace');

    const crowded = only('SCENE_EMPHASIS_MANY', 'lint-cards');
    expect(crowded.severity).toBe('warning');
    expect(crowded.element).toContain('deck-scene-cards');
    expect(only('SCENE_LABEL_LONG', 'lint-cards').severity).toBe('warning');
    expect(only('SCENE_NOTE_LONG', 'lint-cards').severity).toBe('warning');
    expect(r.status, 'a defect fails the run').toBe(1);
  });

  test('leaves alone the scenes written as meant, grouped emphasis and an open row included', () => {
    // The fixtures hold the two shapes a stricter lint got wrong: a bar
    // emphasised once per period, and a duration still to be fixed (no bound).
    for (const kind of ['cards', 'steps', 'flow', 'bars', 'matrix', 'ranges']) {
      deck(`scene-ok-${kind}`, fixtureSlides(`deck-scene-${kind}`), SCENES);
      const r = reportFast(`scene-ok-${kind}`);
      expect(sceneCodes(r), `${kind}\n${r.stdout}`).toEqual([]);
    }
  });

  test('does not trust an attribute that is not the lint\'s JSON, and does not crash on it', () => {
    deck('scene-foreign', `<script>
        customElements.define('deck-scene-probe', class extends HTMLElement {});
      </script>
      <deck-feature id="foreign"><h1 slot="title">Foreign</h1>
        <deck-scene-probe data-scene-issues="not json"></deck-scene-probe>
      </deck-feature>`);
    const r = reportFast('scene-foreign');
    expect(r.json.settled, r.stdout).toBe(true);
    expect(sceneCodes(r)).toEqual([]);
    expect(codes(r)).not.toContain('PAGE_ERROR');
  });
});

// A deck's check policy · rikiki.config.json `check` and the exceptions written on the
// deck. The deck and its config live in a folder of their own, so the policy reaches
// no other test of this file.
test.describe('a check policy', () => {
  const tiny = '<p style="font-size:8px">texte trop petit pour le fond de la salle</p>';
  // One folder per test · the tests of a file run in parallel, and a config is per folder.
  const policyDeck = (config: object, name = test.info().title.replace(/\W+/g, '-').slice(0, 40)) => {
    const dir = join(workDir, `policy-${name}`);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'rikiki.config.json'), JSON.stringify(config));
    writeFileSync(
      join(dir, 'deck.html'),
      `<!doctype html>
<html lang="fr"><head><meta charset="UTF-8">
<link rel="stylesheet" href="../rikiki/tokens.css">
<script type="module" src="../rikiki/dist/index.js"></script>
</head><body>
<deck-root>
  <deck-feature id="cours" wobble="1"><h1 slot="title">Cours</h1>${tiny}</deck-feature>
  <deck-feature id="annexe" data-tags="annexe"><h1 slot="title">Annexe</h1>${tiny}</deck-feature>
  <deck-feature id="mentions" data-check-off="text-too-small" data-check-reason="mentions légales, lues en PDF"><h1 slot="title">Mentions</h1>${tiny}</deck-feature>
  <deck-feature id="calme" data-check-off="slide-dense" data-check-reason="dense un jour, peut-être"><h1 slot="title">Calme</h1><p>Une phrase.</p></deck-feature>
</deck-root>
</body></html>`,
    );
    return `policy-${name}/deck.html`;
  };
  const run = (args: string[]) => {
    const r = cli(args);
    return { ...r, json: JSON.parse(r.stdout) };
  };
  const config = {
    check: {
      root: true,
      checks: '-text-too-smal',
      severity: { 'unknown-attribute': 'error' },
      overrides: [{ tags: ['annexe'], checks: '-text-too-small', reason: 'annexe, lue en PDF' }],
    },
  };

  test('silences by tag and by an exception with its reason, raises a rule, and says what it got wrong', () => {
    const r = run(['check', policyDeck(config), '--json', '--no-visual']);
    const small = r.json.diagnostics.filter((d: any) => d.code === 'TEXT_TOO_SMALL');
    expect(small.map((d: any) => d.slide), r.stdout).toEqual([1]);
    const silenced = r.json.suppressed.filter((d: any) => d.code === 'TEXT_TOO_SMALL');
    expect(silenced.map((d: any) => [d.slide, d.suppressedBy.kind, d.suppressedBy.reason])).toEqual([
      [2, 'override', 'annexe, lue en PDF'],
      [3, 'inline', 'mentions légales, lues en PDF'],
    ]);
    expect(r.json.summary.suppressed).toBe(2);
    expect(r.json.diagnostics.find((d: any) => d.code === 'UNKNOWN_ATTRIBUTE')?.severity).toBe('error');
    expect(codes(r)).toEqual(expect.arrayContaining(['CHECK_SELECTION_UNMATCHED', 'CHECK_SUPPRESSION_UNUSED']));
    expect(r.json.selection.overrides[0]).toMatchObject({ slides: [2], reason: 'annexe, lue en PDF' });
    expect(r.json.notChecked.join(' ')).toMatch(/2 measured and left out by the deck's policy/);
    expect(r.status).toBe(1);
  });

  test('lets the command line speak last, and refuses what cannot work before a browser is spent', () => {
    const lowered = run(['check', policyDeck(config), '--json', '--no-visual', '--severity', 'unknown-attribute=warning', '--checks', '-text-*']);
    expect(lowered.json.diagnostics.find((d: any) => d.code === 'UNKNOWN_ATTRIBUTE')?.severity).toBe('warning');
    expect(lowered.json.diagnostics.filter((d: any) => d.code === 'TEXT_TOO_SMALL')).toEqual([]);
    const bad = cli(['check', policyDeck(config), '--severity', 'text-too-small=loud']);
    expect(bad.status).toBe(2);
    expect(bad.stderr).toMatch(/the level is one of error, warning, off/);
  });

  test('ignores the exceptions of the deck when asked, and lists every rule with where it is kept', () => {
    const strict = run(['check', policyDeck(config), '--json', '--no-visual', '--no-inline-exceptions']);
    expect(strict.json.diagnostics.filter((d: any) => d.code === 'TEXT_TOO_SMALL').map((d: any) => d.slide)).toEqual([1, 3]);
    const listed = run(['check', policyDeck(config), '--list-checks', '--json']);
    const row = listed.json.checks.find((c: any) => c.code === 'TEXT_TOO_SMALL');
    expect(row).toMatchObject({ name: 'text-too-small', enabled: 'mixed', slides: { off: [2] } });
    expect(listed.json.checks.find((c: any) => c.code === 'PAGE_ERROR')).toMatchObject({ alwaysOn: true, enabled: true });
    expect(listed.json.checks.length).toBeGreaterThan(150);
  });

  test('gives a plugin rule its options, does not run it where it is silenced, and refuses a built-in namespace', () => {
    const plugin = (namespace: string) => {
      const dir = join(workDir, 'policy-plugins', `plugin-${namespace.toLowerCase()}`);
      mkdirSync(dir, { recursive: true });
      writeFileSync(
        join(dir, 'rikiki.module.json'),
        JSON.stringify({ schemaVersion: 1, id: `demo-${namespace.toLowerCase()}`, version: '1.0.0', namespace, checks: { apiVersion: 1, entry: 'checks.js', profiles: ['recommended'] } }),
      );
      writeFileSync(
        join(dir, 'checks.js'),
        `globalThis[Symbol.for('rikiki.checks.v1')].define({ apiVersion: 1, id: 'demo-${namespace.toLowerCase()}', version: '1.0.0', rules: [{
          code: '${namespace}_TITLE_WORDS', scope: 'slide', severity: 'warning',
          run(ctx) {
            const max = (ctx.options ?? {}).max ?? 100;
            const words = (ctx.query('h1')[0]?.textContent ?? '').trim().split(/\\s+/).length;
            ctx.report({ message: words + ' words, over ' + max, measurement: { words, max } });
          },
        }] });`,
      );
      return `./plugin-${namespace.toLowerCase()}/rikiki.module.json`;
    };
    const deck = policyDeck(
      {
        plugins: [{ manifest: plugin('DEMO') }, { manifest: plugin('TEXT') }],
        check: { root: true, options: { 'demo-title-words.max': 0 }, overrides: [{ slides: 'annexe..calme', checks: '-demo-*' }] },
      },
      'plugins',
    );
    const r = run(['check', deck, '--json', '--no-visual']);
    const demo = r.json.diagnostics.filter((d: any) => d.code === 'DEMO_TITLE_WORDS');
    expect(demo.map((d: any) => d.slide), r.stdout).toEqual([1]);
    expect(demo[0].measurement).toEqual({ words: 1, max: 0 });
    // Silenced on slides 2 to 4 by the override, so never run there: nothing to suppress.
    expect(r.json.suppressed.filter((d: any) => d.code === 'DEMO_TITLE_WORDS')).toEqual([]);
    const refused = r.json.diagnostics.find((d: any) => d.code === 'CHECK_PLUGIN_LOAD_FAILED');
    expect(refused?.message).toMatch(/namespace TEXT is a family of built-in rules/);
  });
});
