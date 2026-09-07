import { type Page, expect, test } from '@playwright/test';
import { createDeckPage } from './pages/deck.page';

// Presenter mode (`P`) opens a popup with a Current + Next preview, speaker
// notes and a control bar. The previews must stay 16:9, and the narrow Next
// pane must hug its thumbnail (not stretch full-height leaving dead bands).
const DECK = '/rikiki/decks/tests/demo.html';

const box = (page: Page, sel: string) =>
  page.evaluate((s) => {
    const el = document.querySelector(s);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { w: r.width, h: r.height, left: r.left, top: r.top };
  }, sel);

test('presenter previews are 16:9 and the Next pane hugs its thumbnail', async ({ page, context }) => {
  const deck = createDeckPage(page);
  await deck.goto(DECK);
  await deck.advance();

  const popupPromise = context.waitForEvent('page');
  await page.keyboard.press('p');
  const popup = await popupPromise;
  await popup.setViewportSize({ width: 1440, height: 810 });
  // Wait for the grid to lay out.
  await expect.poll(() => box(popup, '#current-frame').then((b) => (b?.w ?? 0) > 0)).toBe(true);

  const cur = await box(popup, '#current-frame');
  const next = await box(popup, '#next-frame');
  const curPanel = await box(popup, '#current');
  const nextPanel = await box(popup, '#next');
  const notes = await box(popup, '#notes-panel');
  if (!cur || !next || !curPanel || !nextPanel || !notes) throw new Error('missing presenter nodes');

  // Both previews keep the projection aspect ratio.
  expect(cur.w / cur.h, 'current preview is 16:9').toBeCloseTo(16 / 9, 1);
  expect(next.w / next.h, 'next preview is 16:9').toBeCloseTo(16 / 9, 1);

  // The Next pane hugs its 16:9 thumbnail · clearly shorter than the tall
  // Current pane (no full-height stretch with dead bands).
  expect(nextPanel.h, 'next pane is compact, not full-height').toBeLessThan(curPanel.h * 0.75);

  // Notes sit in the right column (under Next), not full width.
  expect(notes.left, 'notes are in the right column').toBeGreaterThan(curPanel.left + curPanel.w / 2);
  expect(notes.top, 'notes sit below the next pane').toBeGreaterThan(nextPanel.top + nextPanel.h - 1);

  expect(deck.consoleErrors.filter((e) => !/Failed to load resource/i.test(e))).toEqual([]);
});
