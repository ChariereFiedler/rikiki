import { expect, test } from '@playwright/test';
import { createDeckPage } from './pages/deck.page';

// Integration test for the click-stages plugin after the hook migration · it no
// longer patches deck-root's prototype but registers via deckRoot.use() through
// the installClickStages() shim. This exercises the `steps` hook (the engine's
// step count grows) and the `applyStep` hook (data-click elements reveal as you
// step), which is invisible to a render-only smoke check.
const DECK = '/rikiki/decks/tests/stages.html';

// Inline opacity is what the plugin's setVisible() drives · 0 = hidden.
const opacityOf = (el: Element) => (el as HTMLElement).style.opacity;

test('click-stages reveals data-click elements step by step (hook migration)', async ({ page }) => {
  const deck = createDeckPage(page);
  await deck.goto(DECK);

  // First slide carries three opacity-revealed <p data-click> elements (a 4th
  // data-click SVG draws via stroke, not opacity) · all hidden at step 0.
  const reveals = page.locator('deck-root > [active] p[data-click]');
  await expect(reveals).toHaveCount(3);
  const hidden = await reveals.evaluateAll((els) => els.map((e) => (e as HTMLElement).style.opacity));
  expect(hidden, 'every opacity-revealed data-click element starts hidden').toEqual(['0', '0', '0']);

  // The plugin's `steps` hook makes the engine count the click steps · the dots
  // reflect a multi-step slide rather than a single static one.
  const stepDots = await page.evaluate(
    () => document.querySelector('deck-root')?.shadowRoot?.querySelectorAll('#step-dots .dot').length,
  );
  expect(stepDots, 'engine counts the click steps via the steps hook').toBe(4);

  // Advancing one step reveals the first data-click element (its `applyStep`
  // hook ran), the rest stay hidden.
  await deck.advance();
  await expect(reveals.first()).toHaveJSProperty('style.opacity', '1');
  expect(await reveals.nth(1).evaluate(opacityOf), 'second stays hidden').toBe('0');

  // Stepping back hides it again · the reveal reverses cleanly.
  await deck.back();
  await expect(reveals.first()).toHaveJSProperty('style.opacity', '0');

  expect(deck.consoleErrors, 'no JavaScript errors').toEqual([]);
});
