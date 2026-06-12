import { expect, test, type Page } from '@playwright/test';
import { createDeckPage } from './pages/deck.page';

// The deck renders into a fixed 1920×1080 logical canvas scaled uniformly to fit
// the viewport (deck-root #stage transform). So the slide layout is identical at
// any window size · only the scale changes, and the canvas keeps its aspect
// (letterboxed when the screen aspect differs). These lock that behaviour.

const stageBox = (page: Page) =>
  page.evaluate(() => {
    const stage = document.querySelector('deck-root')?.shadowRoot?.querySelector('#stage');
    if (!stage) throw new Error('no #stage');
    const b = stage.getBoundingClientRect();
    return { w: b.width, h: b.height };
  });

const TOUR = '/examples/rikiki-tour/';

test('slide layout is identical at any viewport width (uniform zoom-to-fit)', async ({ page }) => {
  const deck = createDeckPage(page);
  await deck.goto(TOUR);
  const title = page.locator('deck-cover h1').first();

  // What fraction of the (scaled) canvas the cover title spans · with a uniform
  // scale this is the constant unscaled ratio; reflow would change it.
  const titleFraction = async () => {
    const t = await title.boundingBox();
    const s = await stageBox(page);
    if (!t) throw new Error('no title box');
    return t.width / s.w;
  };

  await page.setViewportSize({ width: 1600, height: 900 });
  const wide = await titleFraction();
  await page.setViewportSize({ width: 700, height: 1100 });
  const narrow = await titleFraction();

  expect(Math.abs(wide - narrow), 'title spans the same fraction → no reflow').toBeLessThan(0.02);
  expect(deck.consoleErrors).toEqual([]);
});

test('the rem baseline is injected by the framework, not the theme', async ({ page }) => {
  const deck = createDeckPage(page);
  await deck.goto(TOUR);
  const { injected, rootFont } = await page.evaluate(() => ({
    injected: !!document.getElementById('rik-deck-globals'),
    rootFont: parseFloat(getComputedStyle(document.documentElement).fontSize),
  }));
  expect(injected, 'deck-root injects #rik-deck-globals').toBe(true);
  // canvas height 1080 × 0.0235 ≈ 25.4px · constant, theme-independent
  expect(rootFont).toBeCloseTo(1080 * 0.0235, 0);
});

test('the canvas keeps its 16:9 aspect (letterboxed, never stretched)', async ({ page }) => {
  const deck = createDeckPage(page);
  await page.setViewportSize({ width: 700, height: 1100 });
  await deck.goto(TOUR);
  const s = await stageBox(page);
  expect(s.w / s.h, 'stage stays 16:9').toBeCloseTo(1920 / 1080, 1);
});

test('letterbox bands match the active slide background', async ({ page }) => {
  const deck = createDeckPage(page);
  await page.setViewportSize({ width: 540, height: 1240 }); // tall · big bands
  await deck.goto(TOUR);

  const { host, slideBg } = await page.evaluate(() => {
    const root = document.querySelector('deck-root');
    const slide = [...(root?.children ?? [])].find((c) => c.hasAttribute('active'));
    return {
      host: getComputedStyle(root as Element).backgroundColor,
      slideBg: getComputedStyle(slide as Element).backgroundColor,
    };
  });
  expect(host, 'the bands take the cover background').toBe(slideBg);
});

test('no horizontal overflow of the cover title on a small viewport', async ({ page }) => {
  const deck = createDeckPage(page);
  await page.setViewportSize({ width: 400, height: 800 });
  await deck.goto(TOUR);

  const box = await page.locator('deck-cover h1').first().boundingBox();
  if (!box) throw new Error('cover title has no box');
  expect(box.x + box.width, 'title right edge within the viewport').toBeLessThanOrEqual(401);
});
