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

test('plus/minus/zero keys zoom and reset', async ({ page }) => {
  const deck = createDeckPage(page);
  await deck.goto(DECK);

  await page.keyboard.press('+');
  await page.keyboard.press('+');
  const zoomedIn = (await zoomState(page)).zoom;
  expect(zoomedIn, 'plus zooms in').toBeGreaterThan(1);

  await page.keyboard.press('-');
  expect((await zoomState(page)).zoom, 'minus zooms out').toBeLessThan(zoomedIn);

  await page.keyboard.press('0');
  const reset = await zoomState(page);
  expect(reset.zoom, 'zero resets to fit').toBe(1);
  expect(reset.zoomed).toBe(false);
  expect(deck.consoleErrors).toEqual([]);
});

const panState = (page: Page) =>
  page.evaluate(() => {
    const root = document.querySelector('deck-root') as HTMLElement;
    const cs = getComputedStyle(root);
    return {
      x: cs.getPropertyValue('--deck-pan-x').trim(),
      y: cs.getPropertyValue('--deck-pan-y').trim(),
    };
  });

test('plain wheel pans while zoomed, navigates at fit', async ({ page }) => {
  const deck = createDeckPage(page);
  await deck.goto(DECK);

  await page.keyboard.press('+');
  await page.keyboard.press('+');
  const before = await deck.activeIndex();

  const prevented = await page.evaluate(() => {
    const root = document.querySelector('deck-root')!;
    const ev = new WheelEvent('wheel', { deltaY: 120, cancelable: true, bubbles: true });
    root.dispatchEvent(ev);
    return ev.defaultPrevented;
  });
  expect(prevented, 'wheel claimed for pan').toBe(true);
  expect(await deck.activeIndex(), 'slide unchanged while zoomed').toBe(before);
  expect((await panState(page)).y, 'pan moved').not.toBe('0px');

  await page.keyboard.press('0');
  const idx = await deck.activeIndex();
  await page.mouse.wheel(0, 200);
  await expect.poll(() => deck.activeIndex()).toBeGreaterThan(idx);
});

test('navigating to another slide resets the zoom', async ({ page }) => {
  const deck = createDeckPage(page);
  await deck.goto(DECK);

  await page.keyboard.press('+');
  await page.keyboard.press('+');
  expect((await zoomState(page)).zoom).toBeGreaterThan(1);

  await page.keyboard.press('ArrowRight'); // navigate
  const after = await zoomState(page);
  expect(after.zoom, 'zoom reset on slide change').toBe(1);
  expect(after.zoomed).toBe(false);
  expect(deck.consoleErrors).toEqual([]);
});

test('no-zoom disables the feature (browser keeps its zoom)', async ({ page }) => {
  const deck = createDeckPage(page);
  await deck.goto(DECK);
  await page.evaluate(() => document.querySelector('deck-root')!.setAttribute('no-zoom', ''));

  const prevented = await ctrlWheel(page, -300);
  expect(prevented, 'ctrl+wheel left for the browser').toBe(false);
  expect((await zoomState(page)).zoomed).toBe(false);
});

test('fluid deck does not zoom', async ({ page }) => {
  const deck = createDeckPage(page);
  await deck.goto('/rikiki/decks/tests/fluid.html');

  const prevented = await ctrlWheel(page, -300);
  expect(prevented, 'no zoom in fluid mode').toBe(false);
  expect((await zoomState(page)).zoomed).toBe(false);
});

test('entering overview resets the zoom', async ({ page }) => {
  const deck = createDeckPage(page);
  await deck.goto(DECK);
  await page.keyboard.press('+');
  await page.keyboard.press('+');
  expect((await zoomState(page)).zoom).toBeGreaterThan(1);

  await page.keyboard.press('o'); // overview
  expect((await zoomState(page)).zoom, 'zoom cleared on overview').toBe(1);
  expect((await zoomState(page)).zoomed).toBe(false);
});

test('setting no-zoom after zooming clears the magnification', async ({ page }) => {
  const deck = createDeckPage(page);
  await deck.goto(DECK);
  await page.keyboard.press('+');
  await page.keyboard.press('+');
  expect((await zoomState(page)).zoom).toBeGreaterThan(1);

  await page.evaluate(() => document.querySelector('deck-root')!.setAttribute('no-zoom', ''));
  await expect.poll(async () => (await zoomState(page)).zoom, 'zoom cleared by no-zoom').toBe(1);
});

test('hash deep-link to another slide resets the zoom', async ({ page }) => {
  const deck = createDeckPage(page);
  await deck.goto(DECK);
  await page.keyboard.press('+');
  await page.keyboard.press('+');
  expect((await zoomState(page)).zoom).toBeGreaterThan(1);

  await page.evaluate(() => { location.hash = '#2'; });
  await expect.poll(async () => (await zoomState(page)).zoom, 'zoom reset on hash nav').toBe(1);
});

test('pan is clamped (does not grow without bound)', async ({ page }) => {
  const deck = createDeckPage(page);
  await deck.goto(DECK);
  await page.keyboard.press('+');
  await page.keyboard.press('+');

  const panFar = () =>
    page.evaluate(() => {
      const root = document.querySelector('deck-root')!;
      for (let i = 0; i < 50; i++) {
        root.dispatchEvent(new WheelEvent('wheel', { deltaY: 400, cancelable: true, bubbles: true }));
      }
      return parseFloat(getComputedStyle(root as HTMLElement).getPropertyValue('--deck-pan-y'));
    });
  const first = await panFar();
  const second = await panFar();
  expect(second, 'pan saturates at the clamp bound').toBeCloseTo(first, 1);
});

test('drag pans the magnified slide', async ({ page }) => {
  const deck = createDeckPage(page);
  await deck.goto(DECK);
  await page.keyboard.press('+');
  await page.keyboard.press('+');

  await page.mouse.move(400, 300);
  await page.mouse.down();
  await page.mouse.move(300, 220, { steps: 5 });
  await page.mouse.up();

  const p = await panState(page);
  expect(p.x !== '0px' || p.y !== '0px', 'drag moved the pan').toBe(true);
  expect(deck.consoleErrors).toEqual([]);
});
