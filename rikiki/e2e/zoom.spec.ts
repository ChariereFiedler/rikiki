import { expect, test, type Page } from '@playwright/test';
import { createDeckPage } from './pages/deck.page';

const DECK = '/rikiki/decks/tests/zoom.html';

// Read the host's zoom custom property + marker.
const zoomState = (page: Page) =>
  page.evaluate(() => {
    const root = document.querySelector('deck-root') as HTMLElement;
    return {
      zoom: parseFloat(getComputedStyle(root).getPropertyValue('--deck-zoom') || '1'),
      zoomed: root.hasAttribute('data-zoomed'),
    };
  });

// Dispatch a ctrl+wheel (zoom-in) at a viewport point and report preventDefault.
const ctrlWheel = (page: Page, deltaY: number) =>
  page.evaluate((dy) => {
    const root = document.querySelector('deck-root')!;
    const ev = new WheelEvent('wheel', {
      deltaY: dy,
      clientX: 400,
      clientY: 300,
      ctrlKey: true,
      cancelable: true,
      bubbles: true,
    });
    root.dispatchEvent(ev);
    return ev.defaultPrevented;
  }, deltaY);

test('ctrl+wheel magnifies the slide', async ({ page }) => {
  const deck = createDeckPage(page);
  await deck.goto(DECK);

  expect((await zoomState(page)).zoom).toBe(1);
  const prevented = await ctrlWheel(page, -300); // negative = zoom in
  expect(prevented, 'zoom gesture is consumed').toBe(true);

  const after = await zoomState(page);
  expect(after.zoom, 'zoomed past fit').toBeGreaterThan(1);
  expect(after.zoomed, 'data-zoomed set').toBe(true);
  expect(deck.consoleErrors).toEqual([]);
});
