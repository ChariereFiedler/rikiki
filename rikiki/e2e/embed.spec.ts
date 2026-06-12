import { expect, test } from '@playwright/test';
import { createDeckPage } from './pages/deck.page';

// An embedded deck (not a direct <body> child) must be a good citizen: no
// overflow lock, no rem rebase, the host page keeps scrolling.
const EMBED = '/rikiki/decks/tests/embedded.html';

test('an embedded deck leaves the host page untouched', async ({ page }) => {
  const deck = createDeckPage(page);
  await deck.goto(EMBED);

  const host = await page.evaluate(() => ({
    htmlOverflow: getComputedStyle(document.documentElement).overflow,
    rootFont: parseFloat(getComputedStyle(document.documentElement).fontSize),
  }));
  expect(host.htmlOverflow, 'host page keeps its scroll').not.toBe('hidden');
  expect(host.rootFont, 'host page keeps its rem baseline').toBe(16);
  expect(deck.consoleErrors).toEqual([]);
});

test('an embedded zoom-to-fit deck scales to its container, not the window', async ({ page }) => {
  const deck = createDeckPage(page);
  await deck.goto(EMBED);

  // #deck-box is 800×450 → scale = min(800/1920, 450/1080) ≈ 0.417
  await expect
    .poll(
      () =>
        page.evaluate(() =>
          parseFloat(
            (document.querySelector('deck-root') as HTMLElement).style.getPropertyValue(
              '--deck-scale',
            ),
          ),
        ),
      { message: 'scale derives from the container box' },
    )
    .toBeCloseTo(800 / 1920, 2);
});

test('a fluid deck reflows with the viewport (no canvas, no letterbox)', async ({ page }) => {
  const deck = createDeckPage(page);
  await deck.goto('/rikiki/decks/tests/fluid.html');

  const stageBox = () =>
    page.evaluate(() => {
      const stage = document.querySelector('deck-root')?.shadowRoot?.querySelector('#stage');
      if (!stage) throw new Error('no #stage');
      const b = stage.getBoundingClientRect();
      return { w: b.width, h: b.height };
    });

  // The stage fills the viewport exactly · no 16:9 letterbox.
  await page.setViewportSize({ width: 700, height: 1100 });
  const tall = await stageBox();
  expect(tall.w, 'stage fills the viewport width').toBeCloseTo(700, 0);
  expect(tall.h, 'stage fills the viewport height').toBeCloseTo(1100, 0);

  // Reflow, not zoom: the stage box CHANGES shape between viewports — the
  // inverse of the zoom-to-fit invariant locked in scaling.spec.ts.
  await page.setViewportSize({ width: 1600, height: 900 });
  const wide = await stageBox();
  expect(wide.w / wide.h, 'aspect follows the window').not.toBeCloseTo(tall.w / tall.h, 1);
  expect(deck.consoleErrors).toEqual([]);
});

test('toggling fluid off at runtime restores the zoom-to-fit canvas', async ({ page }) => {
  const deck = createDeckPage(page);
  await page.setViewportSize({ width: 700, height: 1100 });
  await deck.goto('/rikiki/decks/tests/fluid.html');

  const stageBox = () =>
    page.evaluate(() => {
      const stage = document.querySelector('deck-root')?.shadowRoot?.querySelector('#stage');
      if (!stage) throw new Error('no #stage');
      const b = stage.getBoundingClientRect();
      return { w: b.width, h: b.height };
    });

  // Fluid: the stage fills the 700×1100 viewport.
  const fluid = await stageBox();
  expect(fluid.h, 'fluid fills the viewport height').toBeCloseTo(1100, 0);

  // Turn fluid off at runtime · the deck must return to the scaled 16:9 canvas.
  await page.evaluate(() => {
    (document.querySelector('deck-root') as HTMLElement & { fluid: boolean }).fluid = false;
  });
  // Zoom-to-fit must re-engage: the rendered stage shrinks to fit the viewport
  // (scale = min(700/1920, 1100/1080) = 700/1920) instead of overflowing at its
  // raw 1920×1080. Polling the rendered width catches the missing rescale — the
  // 16:9 aspect alone holds even when --deck-scale is left unset.
  await expect
    .poll(async () => (await stageBox()).w, {
      message: 'stage is scaled back to fit the viewport after fluid is turned off',
    })
    .toBeCloseTo(700, 0);
  const restored = await stageBox();
  expect(restored.w / restored.h, 'stage returns to 16:9').toBeCloseTo(1920 / 1080, 1);
  expect(deck.consoleErrors).toEqual([]);
});
