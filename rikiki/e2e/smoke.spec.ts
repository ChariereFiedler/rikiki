import { expect, test } from '@playwright/test';
import { createDeckPage } from './pages/deck.page';

// Smoke · every shipped/fixture deck must load, upgrade its custom elements, and
// show a first slide with no JavaScript errors. This is the safety net the
// deck-root refactor runs behind: if any deck stops rendering, this goes red.
const DECKS = [
  '/rikiki/starter.html',
  '/rikiki/decks/tests/demo.html',
  '/rikiki/decks/tests/demo-2d.html',
  '/rikiki/decks/tests/stages.html',
  '/rikiki/decks/tests/mouse-nav.html',
  '/rikiki/decks/tests/overview-svg.html',
  '/rikiki/decks/tests/embedded.html',
  '/rikiki/decks/tests/fluid.html',
  '/rikiki/decks/tests/per-slide-fluid.html',
  '/rikiki/decks/tests/zoom.html',
  '/rikiki/decks/tests/bento.html',
  // The public examples · served in production from site/public symlinks, and
  // previously covered by nothing at all.
  '/examples/rikiki-tour/index.html',
  '/examples/sample/index.html',
  '/examples/stress/index.html',
  '/examples/bento/index.html',
];

// Resource 404s (favicon, optional CDN assets) are not JS failures · the smoke
// cares about the engine, not the network.
const isJsError = (msg: string) => !/Failed to load resource/i.test(msg);

for (const deckPath of DECKS) {
  test(`@smoke ${deckPath} renders without errors`, async ({ page }) => {
    const deck = createDeckPage(page);
    await deck.goto(deckPath);

    expect(await deck.upgraded(), 'deck-root should be a defined custom element').toBe(true);
    await expect(deck.activeSlide, 'exactly one slide is active on load').toHaveCount(1);

    expect(deck.consoleErrors.filter(isJsError), 'no JavaScript errors on load').toEqual([]);
    expect(deck.failedRequests, 'every local deck asset loads').toEqual([]);
  });
}
