import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

// Two decks in one document · whether this is supported was never stated, and
// the engine writes canvas variables on documentElement, which two decks with
// different canvases would fight over. These tests decide the answer.
const DECK = '/rikiki/decks/tests/multi-deck.html';

/** The shared deck page object asserts a single active slide per document,
 *  which is exactly the assumption under test here · so this spec drives the
 *  page directly and collects console errors itself. */
async function openBoth(page: Page): Promise<string[]> {
  const errors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error' && !/Failed to load resource/i.test(m.text())) errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(DECK);
  await expect(page.locator('deck-root > [active]')).toHaveCount(2);
  return errors;
}

const activeIndex = (page: Page, id: string) =>
  page.evaluate((sel) => {
    const slides = Array.from(document.querySelectorAll(`${sel} > *`));
    return slides.findIndex((s) => s.hasAttribute('active'));
  }, `#${id}`);

test('both decks render their own first slide', async ({ page }) => {
  const errors = await openBoth(page);

  expect(await activeIndex(page, 'deck-a')).toBe(0);
  expect(await activeIndex(page, 'deck-b')).toBe(0);
  expect(errors, 'neither deck errors when they share a document').toEqual([]);
});

test('focusing one deck navigates it and leaves the other alone', async ({ page }) => {
  await openBoth(page);

  await page.evaluate(() => (document.getElementById('deck-a') as HTMLElement).focus());
  await page.keyboard.press('ArrowRight');
  await expect.poll(() => activeIndex(page, 'deck-a')).toBe(1);
  expect(await activeIndex(page, 'deck-b'), 'the other deck did not move').toBe(0);

  await page.evaluate(() => (document.getElementById('deck-b') as HTMLElement).focus());
  await page.keyboard.press('ArrowRight');
  await expect.poll(() => activeIndex(page, 'deck-b')).toBe(1);
  expect(await activeIndex(page, 'deck-a'), 'the first deck stayed where it was').toBe(1);
});

test('two decks with different canvases each scale to their own', async ({ page }) => {
  // The canvas variables are written on documentElement · if they were shared,
  // the second deck would inherit the first one's geometry.
  await openBoth(page);

  const ratios = await page.evaluate(() =>
    ['deck-a', 'deck-b'].map((id) => {
      const stage = document.getElementById(id)?.shadowRoot?.getElementById('stage');
      const r = stage?.getBoundingClientRect();
      return r && r.height > 0 ? r.width / r.height : 0;
    }),
  );
  expect(ratios[0], 'deck A keeps 16:9').toBeCloseTo(16 / 9, 1);
  expect(ratios[1], 'deck B keeps its own 1600x900').toBeCloseTo(16 / 9, 1);
});
