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
