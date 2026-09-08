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
import { readRegions } from './support/regions';
import { settled } from './support/settle';

/* Measured in the SLIDE's frame of reference, and widened past the two
   fixtures it used to look at. Both changes are the same fix: this file used to
   clip to `.body ?? active`, and `.body` exists in three layouts out of eight,
   so five slides were measured against a different origin and denominator from
   the other three and none of the numbers were comparable. */
const DECKS = [
  '/rikiki/decks/tests/extras-more.html',
  '/rikiki/decks/tests/fill.html',
  '/rikiki/decks/tests/demo.html',
  '/examples/rikiki-tour/index.html',
  '/examples/showcase/index.html',
];

/* deck-root paints its own chrome over the slide · the counter, the arrows, the
   keyboard hint and the progress bar. On a slide at 3% ink that chrome is a
   large share of what a pixel reader sees and it all sits at the bottom, which
   drags the centroid down by more than the layout ever could. Three attributes
   and one public token remove it for the duration of the measurement. */
const NO_CHROME = 'deck-root { --deck-root-progress-height: 0px; }';
async function hideChrome(page: import('@playwright/test').Page) {
  await page.evaluate(() => {
    const root = document.querySelector('deck-root');
    root?.setAttribute('no-hint', '');
    root?.setAttribute('no-arrows', '');
    root?.setAttribute('no-counter', '');
  });
  await page.addStyleTag({ content: NO_CHROME });
}

interface SlideInk {
  index: number;
  id: string;
  tag: string;
  spread: string;
  /** Bottom of the head as a fraction of slide height · null when there is no
   *  head, which is itself the fact that decides the composition regime. */
  shoulder: number | null;
  /** Vertical centre of mass of the ink, as a fraction of SLIDE height · the
   *  one number that is comparable between layouts. */
  centroid: number;
  /** The same centre of mass, as a fraction of the FIELD · what `spread`
   *  actually governs, and therefore what a layout can be held to. */
  inField: number | null;
  /** How much of the field the ink spans · the density, derived and never
   *  declared. */
  density: number | null;
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
  // Two of these decks are called index.html · name the test by the folder.
  const label = deck.split('/').filter(Boolean).slice(-2).join('/');
  test(`ink lands where the layout promised on ${label}`, async ({ page }) => {
    test.slow(); // one screenshot per slide · slow, not flaky
    const deckPage = createDeckPage(page);
    await deckPage.goto(deck);
    await hideChrome(page);

    const slides = await page.evaluate(() =>
      [...document.querySelectorAll('deck-root > *')]
        .filter((el) => el.tagName.toLowerCase().startsWith('deck-'))
        .map((el, i) => ({
          index: i + 1,
          id: el.id || String(i + 1),
          spread: el.getAttribute('spread') ?? '',
        })),
    );


    const report: SlideInk[] = [];
    const failures: string[] = [];

    for (const slide of slides) {
      await page.evaluate((i) => {
        location.hash = `${i}.0`;
      }, slide.index);
      await page.waitForFunction((i) => location.hash.startsWith(`#${i}`), slide.index);
      await settled(page);

      // Measure the SLIDE. It is the rectangle the room sees and the only
      // frame of reference the eight layouts share · the head is then removed
      // arithmetically rather than by cropping, so a layout with no head is
      // still comparable to one that has one.
      const regions = await readRegions(page);
      /* Clip to the FIELD. Clipping to the whole slide would measure the head
         too, and the head is a large mass anchored at the top, so it dominates
         the centroid and says nothing about the composition. The old code
         clipped to `.body` for this reason and was right to; what it lacked was
         a field that exists in all eight layouts. */
      const field = regions.field ?? regions.slide;
      const shot = await page.screenshot({
        clip: { x: field.left, y: field.top, width: field.width, height: field.height },
      });
      const ink = await measureInk(page, shot.toString('base64'));

      /* Two readings from one measurement. `inField` is what `spread` governs
         and what a layout can be held to. `centroid` converts the same point
         into the slide's frame, which is the only one comparable between
         layouts and the only one the room actually sees. */
      const inField = ink.centroid;
      const centroid = (field.top + ink.centroid * field.height - regions.slide.top) / regions.slide.height;
      const density = field.height > 0 ? field.height / regions.slide.height : null;

      report.push({
        ...slide,
        tag: regions.tag,
        shoulder: regions.shoulder,
        centroid,
        inField,
        density,
        coverage: ink.coverage,
      });

      /* Anti-vacuity, restated · the point of this guard is that a screenshot
         of nothing must not report success.
         It used to assert the dominant colour was the page surface, which
         worked while the clip was the whole slide. Clipped to the field, that
         assertion is wrong rather than strict: a dense slide whose field is
         mostly a dark code block has a dominant colour that is content, and a
         cover is dark by construction. The invariant is structural instead ·
         the box was measured from the live DOM and must sit inside the slide,
         and the strip must be neither blank nor uniform. */
      expect(
        field.top >= regions.slide.top - 1 && field.bottom <= regions.slide.bottom + 1,
        `slide ${slide.index} has a field outside its own slide`,
      ).toBe(true);
      expect(ink.coverage, `slide ${slide.index} fills its whole field`).toBeLessThan(1);
      expect(ink.coverage, `slide ${slide.index} is blank`).toBeGreaterThan(0);

      /* The only judgement made here, and it is the layout's own.
         It asks where the FIELD sits inside the room it was given, not where
         the ink sits inside the field. The second question cannot fail: the
         field IS the union of the author's boxes, so its ink fills it and the
         centroid lands mid-field whatever the layout did · which is how a
         deck-split whose spread is inert kept passing this assertion. */
      if (slide.spread === 'center' && regions.field && regions.available.height > 0) {
        const centre =
          (regions.field.top + regions.field.height / 2 - regions.available.top) /
          regions.available.height;
        if (centre < 1 / 3 || centre > 2 / 3) {
          failures.push(
            `slide ${slide.index} (${slide.id}, ${regions.tag}) asks for spread="center" but its ` +
              `content sits at ${(centre * 100).toFixed(0)}% of the room under its title`,
          );
        }
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
