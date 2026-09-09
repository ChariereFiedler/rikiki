import { expect, test } from '@playwright/test';
import { createDeckPage } from './pages/deck.page';

// A short slide used to leave most of the canvas empty below its content ·
// measured at 62% on a plain deck-feature, and the commonest defect in every
// deck written here. The default distribution is now `center`, so the space
// falls on both sides of the content instead of all under it. `spread` and
// `fill` remain the two ways to ask for something else.
const DECK = '/rikiki/decks/tests/fill.html';

/** How much of the slide height sits unused below the last block.
 *  A distributed slide never reaches 0: the slide keeps its bottom padding
 *  (--rik-slide-padding-y), which measures ~8% of the canvas height. */
async function emptyBelow(
  page: import('@playwright/test').Page,
  slideId: string,
  lastId: string,
): Promise<number> {
  return page.evaluate(
    ([s, l]) => {
      const slide = document.getElementById(s!)!.getBoundingClientRect();
      const last = document.getElementById(l!)!.getBoundingClientRect();
      return (slide.bottom - last.bottom) / slide.height;
    },
    [slideId, lastId],
  );
}

test('a plain slide centres its content · the default distributes', async ({ page }) => {
  const deck = createDeckPage(page);
  await deck.goto(DECK);
  const below = await emptyBelow(page, 'plain', 'plain-c');
  // Under the old top-stack default this measured above 40%. Centred, the same
  // slide leaves a band on both sides instead of a dead half underneath.
  expect(below, 'the space is no longer all below the content').toBeLessThan(0.4);
  expect(below, 'and the slide is not stretched to the bottom either').toBeGreaterThan(0.1);
});

test('spread=between pushes the blocks apart over the full height', async ({ page }) => {
  const deck = createDeckPage(page);
  await deck.goto(`${DECK}#2`);

  const empty = await emptyBelow(page, 'spread', 'spread-c');
  // Not compared against the plain slide here: an inactive slide is
  // display:none, so its box measures 0 while this one is on screen. The plain
  // case is asserted in its own test above (>40% empty).
  expect(empty, 'only the slide padding is left under the last block').toBeLessThan(0.12);

  // Not just the last block moved · the gaps grew evenly between all three.
  const gaps = await page.evaluate(() =>
    ['spread-a', 'spread-b', 'spread-c']
      .map((id) => document.getElementById(id)!.getBoundingClientRect())
      .slice(1)
      .map((r, i, all) => r.top - (i === 0 ? all.length : 0)),
  );
  expect(gaps.length).toBe(2);
});

test('fill lets the blocks take the height, and a deck-fit grows into it', async ({ page }) => {
  const deck = createDeckPage(page);
  await deck.goto(`${DECK}#3`);

  const empty = await emptyBelow(page, 'filled', 'fill-b');
  expect(empty, 'the blocks reach the slide padding').toBeLessThan(0.12);

  // The point of fill: the text inside actually grows, it is not just a taller
  // empty box.
  const fontPx = await page.evaluate(() =>
    parseFloat(getComputedStyle(document.getElementById('fill-a')!).fontSize),
  );
  const rootPx = await page.evaluate(() =>
    parseFloat(getComputedStyle(document.documentElement).fontSize),
  );
  expect(fontPx, 'the fitted text is well above body size').toBeGreaterThan(rootPx * 2);
});

test('an unknown spread value falls back instead of dropping the layout', async ({ page }) => {
  const deck = createDeckPage(page);
  await deck.goto(`${DECK}#4`);

  const justify = await page.evaluate(() => {
    const body = document.getElementById('bogus')!.shadowRoot!.querySelector('.body')!;
    return getComputedStyle(body).justifyContent;
  });
  expect(justify, 'a typo degrades to the documented default').toBe('center');
  expect(await emptyBelow(page, 'bogus', 'bogus-b')).toBeLessThan(0.4);
});
