// ════════════════════════════════════════════════════════════════
// Did anything move since the last render?
//
// After a runtime update, 57 of 64 slides of a real deck changed pixels.
// Nearly all of it was anti-aliasing; seven were geometry that had actually
// moved. Finding those seven meant a `cmp` loop in a shell and opening images
// one by one. So the comparison has to rank: how much moved, and where.
//
// There is no image library here, and none is wanted. The comparison runs in
// the Chromium the CLI already launched: both PNGs go in as `data:` URLs, get
// drawn on a canvas, and `getImageData` gives the bytes. Everything the answer
// depends on · the ranking, the threshold, the box, the classification · is a
// pure function in this file, tested in Node, not a line hidden in a browser.
// ════════════════════════════════════════════════════════════════

import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const DIFF_SCHEMA = 'rikiki.render-diff/1';

/** How far one channel must move before a pixel counts as changed.
 *
 *  Anti-aliasing on a re-render nudges an edge pixel by a handful of levels;
 *  a glyph that moved paints where there was background. 32 of 255 sits
 *  between the two, so a re-render of an unchanged deck reads as stable. */
export const CHANNEL_DELTA = 32;

/** Percent of a slide's pixels that has to change before it is worth looking
 *  at. `--threshold 0` reports every single pixel that moved. */
export const DEFAULT_THRESHOLD = 0.5;

/**
 * The smallest rect containing every pixel in `pixels` (`{x, y}`), or null.
 *
 * The in-page pass keeps only the two extreme corners rather than a list of a
 * million points · that is the same rect, which is why this takes a list.
 */
export function boundingBox(pixels) {
  if (!pixels?.length) return null;
  let left = Number.POSITIVE_INFINITY;
  let top = Number.POSITIVE_INFINITY;
  let right = Number.NEGATIVE_INFINITY;
  let bottom = Number.NEGATIVE_INFINITY;
  for (const { x, y } of pixels) {
    if (x < left) left = x;
    if (x > right) right = x;
    if (y < top) top = y;
    if (y > bottom) bottom = y;
  }
  return { left, top, width: right - left + 1, height: bottom - top + 1 };
}

/** `changed` or `stable` for a measured slide.
 *
 *  A slide exactly at the threshold is changed · the threshold is the point
 *  from which a difference counts, not the first value past it. A slide where
 *  nothing at all moved is stable whatever the threshold, so `--threshold 0`
 *  means "every pixel counts", not "every slide is suspect". */
export function statusForRatio(changedRatio, threshold) {
  if (changedRatio <= 0) return 'stable';
  return changedRatio * 100 >= threshold ? 'changed' : 'stable';
}

/** Which files both sides have, and which only one of them has. */
export function classifyFiles(currentFiles, baselineFiles) {
  const baseline = new Set(baselineFiles);
  const current = new Set(currentFiles);
  return {
    compared: currentFiles.filter((f) => baseline.has(f)),
    added: currentFiles.filter((f) => !baseline.has(f)),
    missing: baselineFiles.filter((f) => !current.has(f)),
  };
}

/**
 * One report entry from one in-page measurement.
 *
 * Two canvases of different sizes have no pixels in common, so a `resized`
 * slide carries both sizes and no count · a ratio computed across a resize
 * would be a number that means nothing.
 */
export function slideEntry(file, measured, threshold, meta = {}) {
  const { baselineSize, size } = measured;
  if (baselineSize.width !== size.width || baselineSize.height !== size.height) {
    return { file, ...meta, status: 'resized', baselineSize, size };
  }
  const changedRatio = measured.total ? measured.changed / measured.total : 0;
  return {
    file,
    ...meta,
    status: statusForRatio(changedRatio, threshold),
    changedRatio,
    changedPixels: measured.changed,
    totalPixels: measured.total,
    box: boundingBox(measured.changedCorners),
  };
}

/** The slides, loudest first · the ones nobody could measure keep to the end,
 *  in file order, because they are already named one by one in the report. */
export function rankSlides(slides) {
  const loudness = (s) => (typeof s.changedRatio === 'number' ? s.changedRatio : -1);
  return [...slides].sort((a, b) => loudness(b) - loudness(a) || a.file.localeCompare(b.file));
}

/** How many slides of each status. */
export function summarize(slides) {
  const summary = { changed: 0, stable: 0, added: 0, missing: 0, resized: 0 };
  for (const s of slides) summary[s.status] += 1;
  return summary;
}

/** Whether the render disagrees with its baseline.
 *
 *  A slide the baseline never had is what adding a slide looks like · it is
 *  news, not a regression, so it does not fail the run. */
export const diffFailed = (summary) => summary.changed + summary.missing + summary.resized > 0;

const percent = (ratio) => (ratio * 100).toFixed(2) + '%';

/** The report as a human reads it · the changed slides ranked, the ones that
 *  could not be compared named, then the counts. */
export function formatDiff(report) {
  const lines = [];
  const changed = report.slides.filter((s) => s.status === 'changed');
  if (changed.length) lines.push(`rikiki · diff · ${changed.length} slide(s) changed · most changed first`);
  for (const s of changed) {
    const where = s.box ? ` · box ${s.box.left},${s.box.top} ${s.box.width}×${s.box.height}` : '';
    lines.push(`    · ${percent(s.changedRatio).padStart(7)} ${s.file}${s.title ? ' · ' + s.title : ''}${where}`);
  }
  for (const s of report.slides) {
    if (s.status === 'missing') {
      lines.push(`    · missing ${s.file} · the baseline has it, this render does not`);
    } else if (s.status === 'resized') {
      const { baselineSize: was, size: now } = s;
      lines.push(`    · resized ${s.file} · ${was.width}×${was.height} → ${now.width}×${now.height}`);
    }
  }
  const { changed: c, stable, added, missing, resized } = report.summary;
  lines.push(
    `rikiki · diff · ${c} changed · ${stable} stable · ${added} added · ` +
      `${missing} missing · ${resized} resized · baseline ${report.baseline}`,
  );
  return lines.join('\n');
}

/**
 * Compare two PNGs, in the page.
 *
 * Serialized into the browser by `diffRender`, so it is self-contained: no
 * import, no closure over anything in this module. It returns both sizes
 * always, the count of pixels whose worst channel moved by more than
 * `channelDelta`, and the two extreme corners of those pixels · never the
 * pixels themselves, which for a 1920×1080 slide would be two million points
 * crossing the bridge for a rect.
 */
export const COMPARE_IMAGES = `async (baselineUrl, currentUrl, channelDelta) => {
  const load = (src) => new Promise((ok, fail) => {
    const img = new Image();
    img.onload = () => ok(img);
    img.onerror = () => fail(new Error('could not decode one of the two images'));
    img.src = src;
  });
  const [before, after] = await Promise.all([load(baselineUrl), load(currentUrl)]);
  const baselineSize = { width: before.naturalWidth, height: before.naturalHeight };
  const size = { width: after.naturalWidth, height: after.naturalHeight };
  if (baselineSize.width !== size.width || baselineSize.height !== size.height) {
    return { baselineSize, size };
  }

  const { width, height } = size;
  const bytesOf = (img) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);
    return ctx.getImageData(0, 0, width, height).data;
  };
  const a = bytesOf(before);
  const b = bytesOf(after);

  let changed = 0;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (let i = 0, p = 0; i < a.length; i += 4, p += 1) {
    const delta = Math.max(
      Math.abs(a[i] - b[i]),
      Math.abs(a[i + 1] - b[i + 1]),
      Math.abs(a[i + 2] - b[i + 2]),
      Math.abs(a[i + 3] - b[i + 3]),
    );
    if (delta <= channelDelta) continue;
    changed += 1;
    const x = p % width;
    const y = (p / width) | 0;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  return {
    baselineSize,
    size,
    changed,
    total: width * height,
    changedCorners: changed ? [{ x: minX, y: minY }, { x: maxX, y: maxY }] : [],
  };
}`;

const pngsIn = (dir) =>
  readdirSync(dir)
    .filter((f) => f.toLowerCase().endsWith('.png'))
    .sort();

const dataUrl = (file) => 'data:image/png;base64,' + readFileSync(file).toString('base64');

/**
 * Compare a fresh render against a directory of earlier captures.
 *
 * Runs on a blank page of the browser `renderDeck` already has open, writes
 * `diff.json` next to the manifest, and returns the report.
 *
 * @param {object} options
 * @param {import('playwright').Browser} options.browser  the open browser
 * @param {string} options.outDir       the render that just happened
 * @param {string} options.baselineDir  the captures to compare it against
 * @param {number} [options.threshold]  percent of pixels · at or above is `changed`
 * @param {Array}  [options.shots]      the manifest's shots, to name the slides
 */
export async function diffRender({ browser, outDir, baselineDir, threshold = DEFAULT_THRESHOLD, shots = [] }) {
  const { compared, added, missing } = classifyFiles(pngsIn(outDir), pngsIn(baselineDir));
  const metaOf = new Map(
    shots.map((s) => [s.file, { slide: s.index, id: s.id, title: s.title, step: s.step }]),
  );

  const slides = [];
  // A page of its own: the deck's own page carries the deck, and a canvas the
  // size of a slide has no business being appended to it.
  const context = await browser.newContext();
  const blank = await context.newPage();
  try {
    for (const file of compared) {
      const measured = await blank.evaluate(
        async ({ source, baseline, current, channelDelta }) => {
          const compare = new Function('return ' + source)();
          return compare(baseline, current, channelDelta);
        },
        {
          source: COMPARE_IMAGES,
          baseline: dataUrl(join(baselineDir, file)),
          current: dataUrl(join(outDir, file)),
          channelDelta: CHANNEL_DELTA,
        },
      );
      slides.push(slideEntry(file, measured, threshold, metaOf.get(file)));
    }
  } finally {
    await context.close().catch(() => {});
  }

  for (const file of added) slides.push({ file, ...(metaOf.get(file) ?? {}), status: 'added' });
  for (const file of missing) slides.push({ file, status: 'missing' });

  const ranked = rankSlides(slides);
  const report = {
    schema: DIFF_SCHEMA,
    baseline: baselineDir,
    threshold,
    slides: ranked,
    summary: summarize(ranked),
  };
  const diffPath = join(outDir, 'diff.json');
  writeFileSync(diffPath, JSON.stringify(report, null, 2) + '\n');
  return { report, diffPath };
}
