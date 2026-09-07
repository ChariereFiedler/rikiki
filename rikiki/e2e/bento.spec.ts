import { expect, test } from '@playwright/test';
import { createDeckPage } from './pages/deck.page';

// Bento layout · cells share a multi-row/column grid (span placement), and a
// <deck-punch fit> shrinks to never overflow its cell. The fit must hold across
// the zoom-to-fit transform and recompute when a slide is shown or a step is
// revealed (the cell resizes from 0 → real box).
const DECK = '/rikiki/decks/tests/bento.html';

const gridArea = (page: import('@playwright/test').Page, id: string) =>
  page.evaluate((sel) => {
    const el = document.getElementById(sel);
    if (!el) throw new Error(`no #${sel}`);
    const s = getComputedStyle(el);
    return { col: s.gridColumn, row: s.gridRow };
  }, id);

// The fit runs via ResizeObserver after layout · wait for it to converge (no
// overflow, element visible) before measuring, so the assertions never race the
// first paint. Waits on state, never a fixed delay.
const waitForFit = (page: import('@playwright/test').Page, id: string) =>
  page.waitForFunction((sel) => {
    const el = document.getElementById(sel);
    if (!el || el.clientWidth === 0 || el.clientHeight === 0) return false;
    return el.scrollWidth - el.clientWidth <= 1 && el.scrollHeight - el.clientHeight <= 1;
  }, id);

// Layout px (canvas space), immune to #stage's scale transform · this is what
// the fit logic compares, so the assertion uses the same yardstick.
const overflow = (page: import('@playwright/test').Page, id: string) =>
  page.evaluate((sel) => {
    const el = document.getElementById(sel);
    if (!el) throw new Error(`no #${sel}`);
    return {
      w: el.scrollWidth - el.clientWidth,
      h: el.scrollHeight - el.clientHeight,
      fontPx: parseFloat(getComputedStyle(el).fontSize),
    };
  }, id);

test('cells span the grid and a fit punch never overflows its cell', async ({ page }) => {
  const deck = createDeckPage(page);
  await deck.goto(DECK);

  // Spans land where the author placed them.
  expect(await gridArea(page, 'hero'), 'hero spans 2 columns').toMatchObject({
    col: expect.stringContaining('span 2'),
  });
  expect(await gridArea(page, 'side'), 'side spans 2 rows').toMatchObject({
    row: expect.stringContaining('span 2'),
  });

  // The long hero line is fitted · zero overflow in either axis, and it picked a
  // real size at or under the ceiling (9rem) and at/above the floor (1rem).
  await waitForFit(page, 'fitline');
  const hero = await overflow(page, 'fitline');
  expect(hero.w, 'fit punch does not overflow horizontally').toBeLessThanOrEqual(1);
  expect(hero.h, 'fit punch does not overflow vertically').toBeLessThanOrEqual(1);
  const rootPx = await page.evaluate(
    () => parseFloat(getComputedStyle(document.documentElement).fontSize),
  );
  expect(hero.fontPx, 'fit size stays within [min, max]').toBeGreaterThanOrEqual(rootPx - 1);
  expect(hero.fontPx).toBeLessThanOrEqual(9 * rootPx + 1);

  expect(deck.consoleErrors, 'no JavaScript errors').toEqual([]);
});

test('a slotted image contains itself and a fit csv table never overflows its cell', async ({
  page,
}) => {
  const deck = createDeckPage(page);
  await deck.goto(`${DECK}#3`); // jump straight to the media + csv slide
  await expect(page.locator('deck-root > [active]')).toHaveCount(1);

  // The image is contained within its cell (object-fit), so it never spills.
  const img = await page.evaluate(() => {
    const el = document.getElementById('img-cell');
    const im = document.getElementById('demo-img');
    if (!el || !im) throw new Error('no image cell');
    return { imgW: im.clientWidth, cellW: el.clientWidth, imgH: im.clientHeight, cellH: el.clientHeight };
  });
  expect(img.imgW, 'image stays within the cell width').toBeLessThanOrEqual(img.cellW + 1);
  expect(img.imgH, 'image stays within the cell height').toBeLessThanOrEqual(img.cellH + 1);

  // The csv rendered a table and the fit shrank it inside the cell.
  await waitForFit(page, 'csv-fit');
  const csv = await page.evaluate(() => {
    const el = document.getElementById('csv-fit');
    const rows = el?.shadowRoot?.querySelectorAll('tbody tr').length ?? 0;
    const head = el?.shadowRoot?.querySelectorAll('thead th').length ?? 0;
    return { rows, head, ow: (el?.scrollWidth ?? 0) - (el?.clientWidth ?? 0), oh: (el?.scrollHeight ?? 0) - (el?.clientHeight ?? 0) };
  });
  expect(csv.head, 'header columns parsed').toBe(3);
  expect(csv.rows, 'body rows parsed').toBe(5);
  expect(csv.ow, 'fit csv does not overflow horizontally').toBeLessThanOrEqual(1);
  expect(csv.oh, 'fit csv does not overflow vertically').toBeLessThanOrEqual(1);

  expect(deck.consoleErrors, 'no JavaScript errors').toEqual([]);
});

test('a fit punch recomputes when its slide is shown and its step revealed', async ({ page }) => {
  const deck = createDeckPage(page);
  await deck.goto(DECK);

  // Move to slide 2 (the reveal lives there, hidden until clicked).
  await deck.advance();
  await expect(page.locator('deck-root > [active]')).toHaveCount(1);

  // Reveal the step · the punch becomes visible and must fit its now-sized cell.
  await deck.advance();
  await waitForFit(page, 'reveal-fit');
  const revealed = await overflow(page, 'reveal-fit');
  expect(revealed.w, 'revealed fit punch does not overflow').toBeLessThanOrEqual(1);
  expect(revealed.h).toBeLessThanOrEqual(1);
  expect(revealed.fontPx, 'revealed punch got a real size').toBeGreaterThan(0);

  expect(deck.consoleErrors, 'no JavaScript errors').toEqual([]);
});

test('a ragged csv keeps every row aligned with its header', async ({ page }) => {
  // Regression · a short row used to render fewer <td> than the header has
  // <th> (invalid markup, columns drift), and a quoted empty value used to be
  // dropped as if it were a blank spacer line.
  const deck = createDeckPage(page);
  await deck.goto(`${DECK}#4`);

  const table = await page.evaluate(() => {
    const el = document.getElementById('csv-ragged');
    const head = el?.shadowRoot?.querySelectorAll('thead th').length ?? 0;
    const rows = Array.from(el?.shadowRoot?.querySelectorAll('tbody tr') ?? []);
    return { head, widths: rows.map((r) => r.querySelectorAll('td').length) };
  });

  expect(table.head, 'header columns parsed').toBe(3);
  expect(table.widths, 'every body row matches the header width').toEqual([3, 3, 3]);
});
