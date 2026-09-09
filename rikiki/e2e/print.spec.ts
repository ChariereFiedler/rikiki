import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';

// The print contract · "print to PDF from the browser" has been a published
// promise with no implementation behind it: a ten-slide deck printed one page,
// cropped. What must hold now:
//   · every slide is printed, one slide per page
//   · the page is the deck's own canvas, not A4
//   · backgrounds survive
//   · navigation chrome does not
//
// Assertions read the real PDF through poppler rather than trusting the DOM.

const PKG_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
let workDir: string;

test.beforeAll(() => {
  workDir = mkdtempSync(join(tmpdir(), 'rikiki-print-'));
});
test.afterAll(() => {
  rmSync(workDir, { recursive: true, force: true });
});

interface PdfInfo {
  pages: number;
  widthPt: number;
  heightPt: number;
}

function pdfInfo(file: string): PdfInfo {
  const out = execFileSync('pdfinfo', [file], { encoding: 'utf8' });
  const pages = Number(/Pages:\s+(\d+)/.exec(out)?.[1]);
  const size = /Page size:\s+([\d.]+) x ([\d.]+)/.exec(out);
  return { pages, widthPt: Number(size?.[1]), heightPt: Number(size?.[2]) };
}

const pdfText = (file: string): string =>
  execFileSync('pdftotext', [file, '-'], { encoding: 'utf8' });

/** Text per page, so "every page has content" is checkable page by page. */
function pdfPages(file: string): string[] {
  return pdfText(file).split('\f').slice(0, -1);
}

async function printDeck(
  page: import('@playwright/test').Page,
  deckPath: string,
  out: string,
): Promise<string> {
  const file = join(workDir, out);
  await page.goto(deckPath);
  await expect(page.locator('deck-root > [active]')).toHaveCount(1);
  // No width/height override · the deck sets its own @page size from its canvas.
  await page.pdf({ path: file, printBackground: true, preferCSSPageSize: true });
  return file;
}

/** Slides an author wrote, as the deck itself counts them. */
async function slideCount(page: import('@playwright/test').Page): Promise<number> {
  return page.evaluate(
    () =>
      document.querySelectorAll(
        'deck-root > *:not(script):not(style):not(template)',
      ).length,
  );
}

test('every slide of a deck becomes its own page', async ({ page }) => {
  const deck = '/rikiki/decks/tests/demo.html';
  await page.goto(deck);
  const slides = await slideCount(page);
  expect(slides, 'the fixture has several slides').toBeGreaterThan(3);

  const file = await printDeck(page, deck, 'demo.pdf');
  const info = pdfInfo(file);
  expect(info.pages, `${slides} slides must print as ${slides} pages`).toBe(slides);
});

test('the page is the deck canvas, in landscape', async ({ page }) => {
  const deck = '/rikiki/decks/tests/demo.html';
  const file = await printDeck(page, deck, 'ratio.pdf');
  const { widthPt, heightPt } = pdfInfo(file);

  expect(widthPt, 'landscape').toBeGreaterThan(heightPt);
  // 1920x1080 · the ratio is what survives unit conversion.
  expect(widthPt / heightPt).toBeCloseTo(16 / 9, 2);
});

test('no page comes out blank', async ({ page }) => {
  const file = await printDeck(page, '/rikiki/decks/tests/demo.html', 'blank.pdf');
  const pages = pdfPages(file);
  const empty = pages
    .map((text, i) => ({ page: i + 1, text: text.trim() }))
    .filter((p) => p.text.length === 0);
  expect(empty.map((p) => p.page), 'these pages printed no text').toEqual([]);
});

test('navigation chrome is not printed', async ({ page }) => {
  const file = await printDeck(page, '/rikiki/decks/tests/demo.html', 'chrome.pdf');
  const text = pdfText(file);
  // The on-screen counter reads "3 / 12" · a printed page must not carry it.
  expect(text).not.toMatch(/^\s*\d+\s*\/\s*\d+\s*$/m);
});

test('every piece of on-screen chrome is hidden under print media', async ({ page }) => {
  // The text check above missed the keyboard chips and the nav arrows, which
  // carry no extractable text · they printed in the corners of every deck.
  // Asking the browser directly is the assertion that actually holds.
  await page.goto('/rikiki/decks/tests/demo.html');
  await expect(page.locator('deck-root > [active]')).toHaveCount(1);
  await page.emulateMedia({ media: 'print' });

  const shown = await page.evaluate(() => {
    const shadow = document.querySelector('deck-root')?.shadowRoot;
    if (!shadow) return ['no shadow root'];
    const ids = ['counter', 'progress', 'nav-arrows', 'kb-hint', 'step-dots'];
    return ids
      .map((id) => ({ id, el: shadow.getElementById(id) }))
      .filter(({ el }) => el && getComputedStyle(el).display !== 'none')
      .map(({ id }) => id);
  });
  expect(shown, `still visible on paper: ${shown.join(', ')}`).toEqual([]);
});

test('the printed stage drops the zoom-to-fit transform', async ({ page }) => {
  // A stage still scaled to the viewport would print one shrunken slide.
  await page.goto('/rikiki/decks/tests/demo.html');
  await expect(page.locator('deck-root > [active]')).toHaveCount(1);
  await page.emulateMedia({ media: 'print' });

  const stage = await page.evaluate(() => {
    const el = document.querySelector('deck-root')?.shadowRoot?.getElementById('stage');
    return el ? getComputedStyle(el).transform : null;
  });
  expect(stage, 'the stage is unscaled on paper').toBe('none');
});

test('a deck with click stages prints each slide once', async ({ page }) => {
  // Steps are reveals inside one slide · printing every step would multiply
  // pages. The contract: one page per slide, fully revealed.
  const deck = '/rikiki/decks/tests/stages.html';
  await page.goto(deck);
  const slides = await slideCount(page);
  const file = await printDeck(page, deck, 'stages.pdf');
  expect(pdfInfo(file).pages).toBe(slides);
});

test('speaker notes stay out of the printed deck', async ({ page }) => {
  const file = await printDeck(page, '/rikiki/decks/tests/demo.html', 'notes.pdf');
  const text = pdfText(file);
  const notes = await page.evaluate(() =>
    Array.from(document.querySelectorAll('deck-notes'))
      .map((n) => (n.textContent ?? '').trim())
      .filter((t) => t.length > 20),
  );
  expect(notes.length, 'the fixture must exercise speaker-note exclusion').toBeGreaterThan(0);
  for (const note of notes) {
    expect(text, 'a speaker note leaked into the printed deck').not.toContain(
      note.slice(0, 30),
    );
  }
});

test('a bento deck prints its cells', async ({ page }) => {
  const deck = '/rikiki/decks/tests/bento.html';
  await page.goto(deck);
  const slides = await slideCount(page);
  const file = await printDeck(page, deck, 'bento.pdf');
  expect(pdfInfo(file).pages).toBe(slides);
  // A cell's own content, not just the slide count · proves the grid printed.
  const text = pdfText(file);
  expect(text).toContain('Sharing the space');
  expect(text).toContain('Ragged csv');
});

test('slide backgrounds survive the print', async ({ page }) => {
  // The strongest evidence available: rasterise page 1 and look at the pixels.
  // The cover slide is dark; printed with backgrounds off it comes out white.
  const file = await printDeck(page, '/rikiki/decks/tests/demo.html', 'bg.pdf');

  // pdftoppm writes a P6 PPM on stdout: magic, width, height, maxval, then
  // binary RGB triples · no image library needed to average it.
  const ppm = execFileSync('pdftoppm', ['-r', '10', '-f', '1', '-l', '1', file], {
    maxBuffer: 64 * 1024 * 1024,
  });
  const header = /^P6\s+(\d+)\s+(\d+)\s+(\d+)\s/.exec(ppm.subarray(0, 64).toString('latin1'));
  expect(header, 'pdftoppm produced a PPM').not.toBeNull();

  const body = ppm.subarray(header![0].length);
  expect(body.length, 'the page rasterised to pixels').toBeGreaterThan(1000);
  let sum = 0;
  for (const byte of body) sum += byte;
  const mean = sum / body.length;

  expect(
    mean,
    `page 1 averages ${mean.toFixed(0)}/255 · a page printed without backgrounds averages ~255`,
  ).toBeLessThan(240);
});

test('rikiki export renders the deck to a PDF from the command line', async () => {
  // The CLI path, end to end · it serves the deck, drives a browser and waits
  // for fonts and diagrams before the snapshot.
  const out = join(workDir, 'cli.pdf');
  const stderr = execFileSync(
    process.execPath,
    ['bin/rikiki.mjs', 'export', 'decks/tests/demo.html', '--output', out],
    { cwd: PKG_DIR, encoding: 'utf8', stdio: 'pipe' },
  );
  expect(stderr + '').toBeDefined();

  const info = execFileSync('pdfinfo', [out], { encoding: 'utf8' });
  const pages = Number(/Pages:\s+(\d+)/.exec(info)?.[1]);
  expect(pages, 'the exported PDF has one page per slide').toBeGreaterThan(3);

  // 1920x1080 css px becomes 1440x810 pt at 96 dpi · the deck canvas, not A4.
  const size = /Page size:\s+([\d.]+) x ([\d.]+)/.exec(info);
  expect(Number(size?.[1]) / Number(size?.[2])).toBeCloseTo(16 / 9, 2);

  const text = execFileSync('pdftotext', [out, '-'], { encoding: 'utf8' });
  expect(text.trim().length, 'the exported PDF carries text').toBeGreaterThan(100);
});

test('the exported PDF is navigable · real pages, an outline and a tagged tree', async () => {
  // A viewer can only offer page-by-page navigation if the file carries it.
  // Scroll behaviour itself belongs to the viewer, but the page breaks, the
  // bookmark outline and the tag tree are ours to ship.
  const out = join(workDir, 'outline.pdf');
  execFileSync(
    process.execPath,
    ['bin/rikiki.mjs', 'export', 'decks/tests/demo.html', '--output', out],
    { cwd: PKG_DIR, encoding: 'utf8', stdio: 'pipe' },
  );

  const info = execFileSync('pdfinfo', [out], { encoding: 'utf8' });
  expect(info, 'the PDF is tagged, so the outline means something').toMatch(/Tagged:\s+yes/);
  expect(Number(/Pages:\s+(\d+)/.exec(info)?.[1])).toBeGreaterThan(3);

  const raw = readFileSync(out);
  expect(raw.includes('/Outlines'), 'the PDF carries a bookmark outline').toBe(true);
});
