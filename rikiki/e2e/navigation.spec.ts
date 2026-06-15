import { expect, test } from '@playwright/test';
import { createDeckPage, expectActiveIndex } from './pages/deck.page';

// The navigation contract the deck-root refactor must preserve: linear advance,
// back, mouse-click advance, overview toggle, and hash deep-linking with clamp.
const DEMO = '/rikiki/decks/tests/demo.html';

const slideCount = (deck: ReturnType<typeof createDeckPage>) =>
  deck.page.evaluate(() => document.querySelector('deck-root')?.children.length ?? 0);

test('arrow keys advance and go back', async ({ page }) => {
  const deck = createDeckPage(page);
  await deck.goto(DEMO);
  expect(await deck.activeIndex()).toBe(0);

  // Advance until we leave the first slide (the cover may have inner steps).
  await expect
    .poll(async () => {
      await deck.advance();
      return deck.activeIndex();
    })
    .toBeGreaterThan(0);

  const reached = await deck.activeIndex();
  await expect
    .poll(async () => {
      await deck.back();
      return deck.activeIndex();
    })
    .toBeLessThan(reached);

  expect(deck.consoleErrors).toEqual([]);
});

test('a click on the stage advances (default mouse-nav)', async ({ page }) => {
  const deck = createDeckPage(page);
  await deck.goto(DEMO);
  const before = await deck.activeIndex();
  await expect
    .poll(async () => {
      await deck.clickCenter();
      return deck.activeIndex();
    })
    .toBeGreaterThan(before);
});

test('overview toggles open and closed', async ({ page }) => {
  const deck = createDeckPage(page);
  await deck.goto(DEMO);
  expect(await deck.inOverview()).toBe(false);

  await deck.toggleOverview();
  await expect.poll(() => deck.inOverview()).toBe(true);

  await page.keyboard.press('Escape');
  await expect.poll(() => deck.inOverview()).toBe(false);
});

test('hash deep-links to a slide and clamps out-of-range links', async ({ page }) => {
  const deck = createDeckPage(page);

  await deck.goto(`${DEMO}#3`);
  await expectActiveIndex(deck, 2); // #3 is 1-based → 0-based index 2

  // An out-of-range deep link clamps to the last slide, not back to the first.
  const last = (await slideCount(deck)) - 1;
  await page.goto(`${DEMO}#999`);
  await expectActiveIndex(deck, last);
});

test('ctrl/pinch wheel is left for browser zoom, plain wheel still navigates', async ({ page }) => {
  const deck = createDeckPage(page);
  await deck.goto(DEMO);

  // Dispatch on the deck shell and report whether the deck called preventDefault.
  const prevented = (opts: { ctrlKey?: boolean }) =>
    page.evaluate((o) => {
      const root = document.querySelector('deck-root')!;
      const ev = new WheelEvent('wheel', { deltaY: 120, cancelable: true, bubbles: true, ...o });
      root.dispatchEvent(ev);
      return ev.defaultPrevented;
    }, opts);

  // Zoom gesture (ctrl+wheel / trackpad pinch) must pass through to the browser.
  expect(await prevented({ ctrlKey: true }), 'ctrl+wheel left for zoom').toBe(false);
  // A plain wheel is still claimed for navigation.
  expect(await prevented({}), 'plain wheel drives navigation').toBe(true);
});
