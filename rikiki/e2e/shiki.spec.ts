import { expect, test } from '@playwright/test';
import { createDeckPage } from './pages/deck.page';

// Integration test for the Shiki plugin after the hook migration · it registers
// through deck-code's public setDeckCodeHighlighter() hook instead of patching
// the component's private _highlight(). Loading the vendored Shiki bundle is
// heavy, so give it room.
const DECK = '/rikiki/decks/tests/shiki.html';

test('shiki replaces the built-in regex highlighter via the deck-code hook', async ({ page }) => {
  test.setTimeout(60_000);
  const deck = createDeckPage(page);
  await deck.goto(DECK);

  // Playwright's CSS engine pierces the open shadow root · the highlighted spans
  // live in <deck-code>'s shadow <code>.
  const code = page.locator('deck-code code');
  await expect(code).toContainText('const answer = 42');

  // The built-in regex highlighter tags keywords with `.kw`; Shiki's output has
  // no such class. Before Shiki finishes loading the block renders via the regex
  // path (so `.kw` exists), then the hook re-highlights and `.kw` disappears.
  // The auto-retry waits out the async Shiki load.
  await expect(page.locator('deck-code .kw'), 'Shiki output has no regex .kw class').toHaveCount(0);
  // …and Shiki did produce token spans (it's not just an empty/plain render).
  expect(await page.locator('deck-code code span').count()).toBeGreaterThan(0);

  expect(deck.consoleErrors, 'no JavaScript errors').toEqual([]);
});
