// ════════════════════════════════════════════════════════════════
// rikiki scene · measure
//
// The plan sizes a candidate from tables · this draws it. Each candidate is
// mounted in the real scene elements, in the theme's fonts, on a stage where one
// drawing unit is one pixel, and what the scenes say about themselves once drawn
// (`data-scene-issues`, the height they came out) is read back with a picture.
//
// One browser for every candidate: the page is loaded once, and each candidate
// replaces the previous one on its stage.
// ════════════════════════════════════════════════════════════════

import { mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { EDGE, SCENE_WIDTH } from '../../dist/scene-layout.js';
import { PAGE_LOAD_TIMEOUT_MS, launchChromium, loadChromium, serveDir } from './browser.mjs';

const PKG_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const PAGE_PATH = 'bin/lib/scene-measure.html';

export const MEASURE_THEMES = ['rikiki', 'siliceum'];

/** Wide enough for the stage (the canvas and its two margins) with room to spare;
 *  tall enough that most drawings are photographed without a scroll. */
const VIEWPORT = { width: SCENE_WIDTH + 2 * EDGE + 32, height: 1200 };

/** What the page could not load or threw, split by whose fault it is · our own
 *  files failing is a broken install, a web font failing is a fallback. */
function watchPage(page, origin) {
  const failures = [];
  const external = [];
  const record = (url, what) => (url.startsWith(origin) ? failures : external).push(`${url} ${what}`);
  page.on('pageerror', (e) => failures.push(e instanceof Error ? e.message : String(e)));
  page.on('requestfailed', (r) => record(r.url(), `failed (${r.failure()?.errorText ?? 'no reason given'})`));
  page.on('response', (r) => {
    if (r.status() >= 400) record(r.url(), `answered HTTP ${r.status()}`);
  });
  return { failures, external };
}

function throwOnFailures(failures, what) {
  if (failures.length) throw new Error(`scene measure · ${what} · ${failures.splice(0).join(' · ')}`);
}

/** Measure one candidate on the open page and photograph it. */
async function measureOne(page, candidate, shot) {
  const drawn = await page.evaluate(
    ({ imports, html }) => window.measureScene(imports, html),
    { imports: candidate.imports, html: candidate.html },
  );
  await page.locator('#stage > *').first().screenshot({ path: shot });
  return drawn;
}

/**
 * Draw every candidate of a plan and add what was measured.
 *
 * Each candidate comes back with `measured: { height, issues, shot }` and a
 * `fits` that is false as soon as a measured issue is an error. `notes` names
 * what made the measure less than exact (a theme font that did not load, a web
 * resource that failed) · said, never dropped.
 *
 * @param {object[]} candidates  the plan's candidates, as `planScenes` gives them
 * @param {{ outDir: string, theme?: string, note?: (line: string) => void }} options
 * @returns {Promise<{ candidates: object[], notes: string[] }>}
 */
export async function measureCandidates(candidates, { outDir, theme = 'rikiki', note }) {
  if (!MEASURE_THEMES.includes(theme)) throw new Error(`scene measure · unknown theme "${theme}"`);
  const chromium = await loadChromium();
  mkdirSync(outDir, { recursive: true });
  const server = await serveDir(PKG_ROOT);
  let browser;
  try {
    browser = await launchChromium(chromium, note);
    const page = await browser.newPage({ viewport: VIEWPORT });
    const watched = watchPage(page, server.origin);
    await page.goto(`${server.origin}/${PAGE_PATH}?theme=${theme}`, {
      waitUntil: 'load',
      timeout: PAGE_LOAD_TIMEOUT_MS,
    });
    await page.evaluate(() => window.sceneMeasureReady);
    throwOnFailures(watched.failures, 'the measuring page');

    const measured = [];
    const missingFonts = new Set();
    for (const candidate of candidates) {
      const shot = join(outDir, `${candidate.id}.png`);
      const drawn = await measureOne(page, candidate, shot);
      throwOnFailures(watched.failures, `candidate ${candidate.id}`);
      for (const family of drawn.missingFonts) missingFonts.add(family);
      const errors = drawn.issues.filter((issue) => issue.severity === 'error').length;
      measured.push({
        ...candidate,
        measured: { height: drawn.height, issues: drawn.issues, shot },
        fits: candidate.fits && errors === 0,
      });
    }

    const notes = [
      ...[...missingFonts].map(
        (family) => `the font "${family}" is not installed or did not load · every width was measured in a fallback`,
      ),
      ...[...new Set(watched.external)].map((line) => `could not load ${line}`),
    ];
    // Measured errors can only take a candidate out · those that still fit come
    // first, in the plan's own order otherwise (the sort is stable).
    measured.sort((a, b) => Number(b.fits) - Number(a.fits));
    return { candidates: measured, notes };
  } finally {
    if (browser) await browser.close();
    await server.close();
  }
}
