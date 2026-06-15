import { expect, test } from '@playwright/test';
import { createDeckPage } from './pages/deck.page';

// Per-slide fluid escape (issue #4) · a fixed-canvas deck where one slide carries
// its own `fluid` attribute drops the zoom-to-fit canvas for that slide only,
// giving it the real viewport, then restores the canvas on navigation away.
const DECK = '/rikiki/decks/tests/per-slide-fluid.html';

// Tall, non-16:9 viewport so the fixed canvas is visibly letterboxed (the stage
// is much shorter than the viewport) while a fluid slide fills it edge to edge.
const VIEWPORT = { width: 800, height: 1200 };

const hostUnfixed = (page: import('@playwright/test').Page) =>
  page.evaluate(() => document.querySelector('deck-root')?.hasAttribute('unfixed') ?? false);

const rootFont = (page: import('@playwright/test').Page) =>
  page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).fontSize));

test('a fixed slide keeps the zoom-to-fit canvas; a fluid slide fills the viewport', async ({
  page,
}) => {
  const deck = createDeckPage(page);
  await page.setViewportSize(VIEWPORT);
  await deck.goto(DECK);

  // Slide 0 · fixed · stage is the letterboxed 16:9 canvas, host has no marker.
  expect(await hostUnfixed(page), 'fixed slide → no unfixed marker').toBe(false);
  const fixed = await deck.stageBox();
  expect(fixed.w / fixed.h, 'fixed stage stays 16:9').toBeCloseTo(1920 / 1080, 1);
  expect(fixed.h, 'fixed stage is letterboxed (shorter than the viewport)').toBeLessThan(
    VIEWPORT.height - 100,
  );
  // Fixed rem baseline · canvas height 1080 × 0.0235 ≈ 25.4px.
  expect(await rootFont(page), 'fixed rem baseline tracks the canvas').toBeCloseTo(1080 * 0.0235, 0);

  // Slide 1 · fluid · stage fills the viewport, host gets the unfixed marker.
  await deck.advance();
  await expect(page.locator('deck-root[unfixed]')).toHaveCount(1);
  const fluid = await deck.stageBox();
  expect(fluid.w, 'fluid stage spans the viewport width').toBeCloseTo(VIEWPORT.width, 0);
  expect(fluid.h, 'fluid stage spans the viewport height').toBeCloseTo(VIEWPORT.height, 0);
  // Viewport rem baseline · clamp(14, 2.35vh, 42) → 2.35% of 1200 = 28.2px.
  expect(await rootFont(page), 'fluid rem baseline tracks the viewport').toBeCloseTo(
    Math.min(42, Math.max(14, 1200 * 0.0235)),
    0,
  );

  // Slide 2 · fixed again · the canvas is restored, the marker is gone.
  await deck.advance();
  expect(await hostUnfixed(page), 'navigating back restores the fixed canvas').toBe(false);
  const restored = await deck.stageBox();
  expect(restored.w / restored.h, 'restored stage is 16:9 again').toBeCloseTo(1920 / 1080, 1);

  expect(deck.consoleErrors, 'no JavaScript errors').toEqual([]);
});
