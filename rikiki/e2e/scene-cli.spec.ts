import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
import { launchChromium, loadChromium, serveDir } from '../bin/lib/browser.mjs';
import { planScenes } from '../bin/lib/scene-plan.mjs';

// `rikiki scene plan --measure` draws each candidate in the real scene elements,
// in a Chromium of its own, and reads back what the scenes say once drawn. The
// node suite (scripts/scene-cli.test.mjs) covers the plan without a browser;
// this is the part that needs one.

const PKG_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CLI = join(PKG_DIR, 'bin', 'rikiki.mjs');
const SCHEMA = 'rikiki.scene-brief/1';
/** What a slide leaves a scene under a one-line title (MAX_SCENE_HEIGHT). */
const SLIDE_UNITS = 620;
/** A PNG of a drawn scene · a header alone, or a blank stage, weighs less. */
const MIN_SHOT_BYTES = 1_000;

const BEFORE_AFTER = {
  schema: SCHEMA,
  claim: 'Twice as many stay after the change',
  relation: 'before-after',
  before: { label: 'Before', value: 12, of: 50 },
  after: { label: 'After', value: 31, of: 50 },
  focus: 'After',
  source: { text: 'Invented figures', nature: 'illustration' },
};

/** Six rows of a matrix are taller than a slide leaves room for. */
const TOO_TALL = {
  schema: SCHEMA,
  claim: 'Who runs it where',
  relation: 'position-2d',
  columns: ['EU', 'US', 'Asia'],
  rows: ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta'].map((label) => ({
    label,
    levels: ['prod', 'pilot', 'none'],
  })),
  source: { text: 'Invented', nature: 'illustration' },
};

let workDir: string;

test.beforeAll(() => {
  workDir = mkdtempSync(join(tmpdir(), 'rikiki scene measure '));
});

test.afterAll(() => rmSync(workDir, { recursive: true, force: true }));

/** Plan a brief with --measure --json into its own directory. */
function measuredPlan(name: string, brief: object) {
  const file = join(workDir, `${name}.json`);
  writeFileSync(file, JSON.stringify(brief));
  const out = join(workDir, name);
  const run = spawnSync(
    process.execPath,
    [CLI, 'scene', 'plan', file, '--measure', '--json', '--out', out],
    { cwd: workDir, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 },
  );
  return { status: run.status, stderr: run.stderr ?? '', out, plan: JSON.parse(run.stdout) };
}

test('measures every candidate once drawn, and photographs it', () => {
  const { status, stderr, out, plan } = measuredPlan('before-after', BEFORE_AFTER);
  expect(status, stderr).toBe(0);
  expect(plan.candidates.map((c: { id: string }) => c.id)).toEqual(['units-row', 'bars-stack']);
  for (const candidate of plan.candidates) {
    expect(candidate.measured, `${candidate.id} was not measured`).toBeDefined();
    expect(candidate.measured.height, `${candidate.id} drew nothing`).toBeGreaterThan(0);
    expect(candidate.measured.issues.filter((i: { severity: string }) => i.severity === 'error')).toEqual([]);
    expect(candidate.measured.shot).toBe(join(out, `${candidate.id}.png`));
    expect(statSync(candidate.measured.shot).size, `${candidate.id}.png is empty`).toBeGreaterThan(
      MIN_SHOT_BYTES,
    );
    expect(candidate.fits).toBe(true);
  }
  // candidates.json is written after the measure, so it carries it.
  expect(statSync(join(out, 'candidates.json')).size).toBeGreaterThan(0);
});

test('a scene taller than the slide does not fit once measured', () => {
  const { status, plan } = measuredPlan('too-tall', TOO_TALL);
  expect(status).toBe(1);
  const [matrix] = plan.candidates;
  expect(matrix.id).toBe('matrix');
  expect(matrix.fits).toBe(false);
  expect(matrix.measured.height).toBeGreaterThan(SLIDE_UNITS);
  const tall = matrix.measured.issues.find((i: { code: string }) => i.code === 'SCENE_TOO_TALL');
  expect(tall, 'the scene itself reports the height once drawn').toMatchObject({
    severity: 'error',
    scene: 'deck-scene-matrix',
  });
  expect(statSync(matrix.measured.shot).size).toBeGreaterThan(MIN_SHOT_BYTES);
});

test('a failed web-font download keeps the measuring page usable with a reported fallback', async () => {
  const server = await serveDir(PKG_DIR);
  const browser = await launchChromium(await loadChromium());
  try {
    const page = await browser.newPage();
    // The stylesheet succeeds, then its font files fail: unlike a missing
    // stylesheet, FontFaceSet.load rejects in this ordinary network failure.
    await page.route('https://fonts.googleapis.com/**', (route) => route.fulfill({
      contentType: 'text/css',
      body: '@font-face{font-family:RikikiSceneMissingSans;font-weight:100 900;src:url(https://fonts.gstatic.com/failed-inter.woff2)} @font-face{font-family:RikikiSceneMissingDisplay;font-weight:100 900;src:url(https://fonts.gstatic.com/failed-unbounded.woff2)}',
    }));
    // Unique families keep an installed system font from concealing the failed
    // download on a developer machine.
    await page.route('**/themes/rikiki.css', (route) => route.fulfill({
      contentType: 'text/css',
      body: readFileSync(join(PKG_DIR, 'themes/rikiki.css'), 'utf8')
        .replaceAll("'Inter'", "'RikikiSceneMissingSans'")
        .replaceAll("'Unbounded'", "'RikikiSceneMissingDisplay'"),
    }));
    await page.route('https://fonts.gstatic.com/**', (route) => route.abort('failed'));
    await page.goto(`${server.origin}/bin/lib/scene-measure.html?theme=rikiki`);
    await page.evaluate(() => window.sceneMeasureReady);
    const [candidate] = planScenes(BEFORE_AFTER).candidates;
    const drawn = await page.evaluate(({ imports, html }) => window.measureScene(imports, html), candidate);
    expect(drawn.height).toBeGreaterThan(0);
    expect(drawn.missingFonts).toEqual(expect.arrayContaining(['RikikiSceneMissingSans', 'RikikiSceneMissingDisplay']));
    expect((await page.getByTestId('scene-measure-stage').screenshot()).byteLength).toBeGreaterThan(MIN_SHOT_BYTES);
  } finally {
    await browser.close();
    await server.close();
  }
});

test('a failed local theme is still a broken measuring page', async () => {
  const server = await serveDir(PKG_DIR);
  const browser = await launchChromium(await loadChromium());
  try {
    const page = await browser.newPage();
    await page.route('**/themes/rikiki.css', (route) => route.abort('failed'));
    await page.goto(`${server.origin}/bin/lib/scene-measure.html?theme=rikiki`);
    await expect(page.evaluate(() => window.sceneMeasureReady)).rejects.toThrow(/theme stylesheet did not load/);
  } finally {
    await browser.close();
    await server.close();
  }
});
