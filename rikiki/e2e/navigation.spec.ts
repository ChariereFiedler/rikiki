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

test('a deep link to a step lands on that step, not on step 0', async ({ page }) => {
  const deck = createDeckPage(page);

  // The step count of a slide is published by the component on it, and an
  // opt-in component is a separate module that can register AFTER the engine
  // has read the fragment. The link was clamped against a count of zero and
  // silently landed on step 0, so every shared link into the middle of a build
  // opened the slide neutral · the one thing a deep link exists to avoid.
  await deck.goto('/rikiki/decks/tests/extras-more.html#7.2');

  await expect
    .poll(() => page.evaluate(() => document.querySelector('deck-flow-step[active]')?.id ?? null))
    .toBe('fs-2');
  expect(await page.evaluate(() => location.hash)).toBe('#7.2');
});

test('plain wheel navigates; ctrl+wheel is claimed for slide zoom', async ({ page }) => {
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

  // A plain wheel drives navigation; ctrl+wheel (and trackpad pinch) is claimed
  // for slide zoom by default (see zoom.spec). `no-zoom` would leave it to the
  // browser instead.
  expect(await prevented({}), 'plain wheel drives navigation').toBe(true);
  expect(await prevented({ ctrlKey: true }), 'ctrl+wheel claimed for zoom').toBe(true);
});

test('going back into a slide lands on its last step, even when the transition defers', async ({
  page,
}) => {
  // The regression the navigation domain exists for. The engine used to decide
  // "previous slide" and "its last step" in two statements; a transition plugin
  // defers the first one, so the second ran against the old slide and the
  // deferred move then reset the step to 0.
  const deck = createDeckPage(page);
  await deck.goto('/rikiki/decks/tests/morph-back.html#2');

  await expect
    .poll(() =>
      page.evaluate(() => {
        const slides = Array.from(document.querySelectorAll('deck-root > *'));
        return slides.findIndex((s) => s.hasAttribute('active'));
      }),
    )
    .toBe(1);

  await page.keyboard.press('ArrowLeft');

  await expect
    .poll(() =>
      page.evaluate(() => {
        const root = document.querySelector('deck-root') as unknown as {
          current: number;
          step: number;
        };
        return `${root.current}.${root.step}`;
      }),
    )
    .toBe('0.3');

  // And the reveals really are all showing, not just the counter.
  await expect(page.locator('#s3')).toBeVisible();
});
