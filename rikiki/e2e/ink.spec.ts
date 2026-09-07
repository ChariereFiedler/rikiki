// ════════════════════════════════════════════════════════════════
// Where the ink actually lands on a slide
//
// Most rejected slides render their content in the top fifth and look
// unfinished. There is no honest threshold for "too empty": a section title is
// meant to be sparse and a bento is meant to be full, so any fill ratio picked
// here would be taste, and a test that encodes taste gets worked around within
// a month. e2e/slide-budget.spec.ts already reports the ratio for that reason.
//
// What IS objective is a layout breaking a promise it made itself. A slide that
// declares spread="center" and paints its ink at the top is not a matter of
// taste; the author asked for distribution and did not get it. That is the only
// thing asserted here. Everything else is attached as a report.
//
// Chromium only · this reads pixels, and pixel reading is not an engine
// contract question.
// ════════════════════════════════════════════════════════════════

import { expect, test } from '@playwright/test';
import { createDeckPage } from './pages/deck.page';
import { settled } from './support/settle';

const DECKS = ['/rikiki/decks/tests/extras-more.html', '/rikiki/decks/tests/fill.html'];

interface SlideInk {
  index: number;
  id: string;
  spread: string;
  /** Vertical centre of mass of the ink, 0 at the top and 1 at the bottom. */
  centroid: number;
  /** Share of the slide box the ink covers. */
  coverage: number;
}

/**
 * Measure the ink of the active slide from its own pixels.
 *
 * A pixel counts as ink when it differs from the slide's dominant colour, and
 * the dominant colour is asserted to be the page surface · that assertion is
 * what stops the whole measurement from silently reading a blank canvas.
 */
async function measureInk(
  page: import('@playwright/test').Page,
  base64: string,
): Promise<{ centroid: number; coverage: number; dominant: string }> {
  return page.evaluate(async (data) => {
    const blob = await (await fetch(`data:image/png;base64,${data}`)).blob();
    const bitmap = await createImageBitmap(blob);
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const context = canvas.getContext('2d');
    if (!context) throw new Error('no 2d context to decode the slide into');
    context.drawImage(bitmap, 0, 0);
    const { data: px } = context.getImageData(0, 0, bitmap.width, bitmap.height);

    const counts = new Map<number, number>();
    for (let i = 0; i < px.length; i += 4) {
      const key = (px[i]! << 16) | (px[i + 1]! << 8) | px[i + 2]!;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    let dominant = 0;
    let best = 0;
    for (const [key, n] of counts) {
      if (n > best) {
        best = n;
        dominant = key;
      }
    }
    const bg = [(dominant >> 16) & 255, (dominant >> 8) & 255, dominant & 255];

    let ink = 0;
    let weighted = 0;
    for (let y = 0; y < bitmap.height; y += 1) {
      for (let x = 0; x < bitmap.width; x += 1) {
        const i = (y * bitmap.width + x) * 4;
        // A generous threshold on purpose · this measures where the content is,
        // not whether it is legible, which e2e/emphasis.spec.ts does properly.
        const far =
          Math.abs(px[i]! - bg[0]!) + Math.abs(px[i + 1]! - bg[1]!) + Math.abs(px[i + 2]! - bg[2]!);
        if (far > 24) {
          ink += 1;
          weighted += y;
        }
      }
    }
    return {
      centroid: ink === 0 ? 0 : weighted / ink / bitmap.height,
      coverage: ink / (bitmap.width * bitmap.height),
      dominant: `rgb(${bg.join(', ')})`,
    };
  }, base64);
}

for (const deck of DECKS) {
  test(`ink lands where the layout promised on ${deck.split('/').pop()}`, async ({ page }) => {
    test.slow(); // one screenshot per slide · slow, not flaky
    const deckPage = createDeckPage(page);
    await deckPage.goto(deck);

    const slides = await page.evaluate(() =>
      [...document.querySelectorAll('deck-root > *')]
        .filter((el) => el.tagName.toLowerCase().startsWith('deck-'))
        .map((el, i) => ({
          index: i + 1,
          id: el.id || String(i + 1),
          spread: el.getAttribute('spread') ?? '',
        })),
    );

    const page_background = await page.evaluate(
      () => getComputedStyle(document.body).backgroundColor,
    );
    const report: SlideInk[] = [];
    const failures: string[] = [];

    for (const slide of slides) {
      await page.evaluate((i) => {
        location.hash = `${i}.0`;
      }, slide.index);
      await page.waitForFunction((i) => location.hash.startsWith(`#${i}`), slide.index);
      await settled(page);

      // Measure the region `spread` actually governs · the shadow body, not
      // the whole slide. The title block always sits at the top, so including
      // it would drag every centroid upwards and turn the promise into one no
      // centred layout could keep.
      const clip = await page.evaluate(() => {
        const active = document.querySelector('deck-root > [active]');
        if (!active) return null;
        const body = active.shadowRoot?.querySelector('.body') ?? active;
        const r = body.getBoundingClientRect();
        return { x: r.x, y: r.y, width: r.width, height: r.height };
      });
      expect(clip, `slide ${slide.index} has no measurable body`).not.toBeNull();
      const shot = await page.screenshot({ clip: clip! });
      const ink = await measureInk(page, shot.toString('base64'));
      report.push({ ...slide, centroid: ink.centroid, coverage: ink.coverage });

      // Anti-vacuity · if the dominant colour is not the page, the screenshot
      // is not of the slide and every number above is meaningless.
      expect(ink.dominant, `slide ${slide.index} does not look like a deck slide`).toBe(
        page_background,
      );
      expect(ink.coverage, `slide ${slide.index} is blank`).toBeGreaterThan(0);

      // The only judgement made here, and it is the layout's own.
      if (slide.spread === 'center' && (ink.centroid < 1 / 3 || ink.centroid > 2 / 3)) {
        failures.push(
          `slide ${slide.index} (${slide.id}) asks for spread="center" but its ink ` +
            `centres at ${(ink.centroid * 100).toFixed(0)}% of the slide height`,
        );
      }
    }

    // Coverage is advice for whoever is designing, never a verdict.
    await test.info().attach('ink.json', {
      body: JSON.stringify(report, null, 2),
      contentType: 'application/json',
    });
    expect(failures.join('\n')).toBe('');
  });
}

// The guard, falsified. Forcing the layout to abandon its own distribution
// reproduces the "everything in the top fifth" rendering exactly, and the
// centroid must leave the middle third · without this the assertion above is
// one CSS refactor away from being unfalsifiable.
test('the centroid notices a layout that drops its distribution', async ({ page }) => {
  const deckPage = createDeckPage(page);
  await deckPage.goto('/rikiki/decks/tests/extras-more.html');
  // An !important declaration beats the inline custom property the layout sets.
  await page.addStyleTag({ content: 'deck-feature { --_spread: flex-start !important; }' });
  await page.evaluate(() => {
    location.hash = '#2.0';
  });
  await page.waitForFunction(() => location.hash.startsWith('#2'));
  await settled(page);

  const clip = await page.evaluate(() => {
    const active = document.querySelector('deck-root > [active]');
    const body = active?.shadowRoot?.querySelector('.body');
    if (!body) return null;
    const r = body.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  });
  expect(clip).not.toBeNull();
  const shot = await page.screenshot({ clip: clip! });
  const ink = await measureInk(page, shot.toString('base64'));

  expect(
    ink.centroid,
    `the slide still asks for spread="center" and the ink now centres at ` +
      `${(ink.centroid * 100).toFixed(0)}% · the guard would not have noticed`,
  ).toBeLessThan(1 / 3);
});
