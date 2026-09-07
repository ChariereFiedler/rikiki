import { expect, test } from '@playwright/test';
import { createDeckPage } from './pages/deck.page';

// The slide budget · a guard rail against the two ways a slide fails a room.
//
// TOO FULL: the engine does not let content overflow · it CLIPS it. Every slide
// shell and every cell carries `overflow: hidden`, so a slide with too much on
// it silently loses its last lines and nobody in the room knows. That is the
// failure mode worth catching, and it is measured as scrollHeight beyond
// clientHeight on each clipping box, not as a bounding-box overflow.
//
// TOO EMPTY: the content uses a third of the canvas and the rest is white. That
// is a judgement, not a defect · a section title is meant to be sparse. So it
// is reported, never failed, and the shipped decks are the reference.

const DECKS = [
  '/rikiki/decks/tests/demo.html',
  '/rikiki/decks/tests/bento.html',
  '/rikiki/decks/tests/fill.html',
  '/rikiki/decks/tests/extensions.html',
  '/rikiki/starter.html',
  '/examples/rikiki-tour/index.html',
];

interface SlideBudget {
  index: number;
  tag: string;
  overflowX: number;
  overflowY: number;
  fillRatio: number;
}

/** Measure one slide · the deck must already be showing it. */
async function measureActive(page: import('@playwright/test').Page): Promise<SlideBudget | null> {
  return page.evaluate(() => {
    const root = document.querySelector('deck-root');
    const slides = [...(root?.children ?? [])].filter((el) =>
      el.tagName.toLowerCase().startsWith('deck-'),
    ) as HTMLElement[];
    const index = slides.findIndex((s) => s.hasAttribute('active'));
    const slide = slides[index];
    if (!slide) return null;
    const box = slide.getBoundingClientRect();
    if (box.height === 0) return null;

    /** Every box that clips inside this slide, light DOM and shadow alike.
     *
     *  Found by asking each element what its overflow is, rather than by
     *  listing the class names that happened to clip when this was written.
     *  The list was `.body, .grid, table`, so deck-split's own `.col` — which
     *  clips, and which is where a column of cards actually loses its last
     *  card's padding — was never looked at, and a shipped slide overflowed
     *  under a green run. A list of selectors is a guess about the future;
     *  the computed style is the answer. */
    const clippers: HTMLElement[] = [];
    const seen = new Set<HTMLElement>();
    const collect = (root: HTMLElement | ShadowRoot) => {
      for (const el of root.querySelectorAll<HTMLElement>('*')) {
        if (seen.has(el)) continue;
        seen.add(el);
        const overflow = getComputedStyle(el).overflow;
        if (overflow === 'hidden' || overflow === 'clip') clippers.push(el);
        if (el.shadowRoot) collect(el.shadowRoot);
      }
    };
    clippers.push(slide);
    if (slide.shadowRoot) collect(slide.shadowRoot);
    collect(slide);

    let clippedX = 0;
    let clippedY = 0;
    for (const el of clippers) {
      clippedX = Math.max(clippedX, el.scrollWidth - el.clientWidth);
      clippedY = Math.max(clippedY, el.scrollHeight - el.clientHeight);
    }

    const shadowBody = (slide.shadowRoot?.querySelector('.body') ?? null) as HTMLElement | null;
    const body = shadowBody ?? slide;
    return {
      index,
      tag: slide.tagName.toLowerCase(),
      overflowX: Math.max(0, Math.round(clippedX)),
      overflowY: Math.max(0, Math.round(clippedY)),
      fillRatio: Math.round((body.scrollHeight / box.height) * 100) / 100,
    };
  });
}

/** Walk the deck the way a reader does · by deep link, so the engine really
 *  activates each slide and the fit controllers run. */
async function measure(
  page: import('@playwright/test').Page,
  deck: string,
): Promise<SlideBudget[]> {
  const count = await page.evaluate(
    () =>
      [...(document.querySelector('deck-root')?.children ?? [])].filter((el) =>
        el.tagName.toLowerCase().startsWith('deck-'),
      ).length,
  );
  const out: SlideBudget[] = [];
  for (let i = 0; i < count; i++) {
    await page.goto(`${deck}#${i + 1}`);
    await expect(page.locator('deck-root > [active]')).toHaveCount(1);
    // Two frames · the fit controllers measure after layout.
    await page.evaluate(
      () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))),
    );
    const slide = await measureActive(page);
    if (slide) out.push(slide);
  }
  return out;
}

for (const deck of DECKS) {
  test(`no slide of ${deck} loses content to clipping`, async ({ page }) => {
    // This one legitimately navigates once per slide and waits for the fit
    // controllers each time · a twenty-slide deck on WebKit runs past the
    // default budget. Slow, not flaky: raising the budget is the honest fix,
    // and a retry would only hide the cost.
    test.slow();
    const deckPage = createDeckPage(page);
    await deckPage.goto(deck);
    const slides = await measure(page, deck);
    expect(slides.length, 'the deck has slides to measure').toBeGreaterThan(0);

    // A few pixels are rounding · anything more is content the projector cuts.
    const clipped = slides.filter((s) => s.overflowY > 4 || s.overflowX > 4);
    const report = clipped
      .map((s) => `slide ${s.index + 1} (${s.tag}) loses ${s.overflowX}x${s.overflowY}px`)
      .join('\n');
    expect(clipped, `content is silently clipped:\n${report}`).toEqual([]);
  });
}

test('under-filled slides are reported, not failed', async ({ page }, testInfo) => {
  // Emptiness is a judgement · a section title is meant to be sparse. The
  // report is attached to the run so an author can see which slides of their
  // deck are candidates for `spread` or `fill`.
  const deckPage = createDeckPage(page);
  const demo = '/rikiki/decks/tests/demo.html';
  await deckPage.goto(demo);
  const slides = await measure(page, demo);

  const sparse = slides.filter((s) => s.fillRatio < 0.5 && s.tag !== 'deck-section');
  await testInfo.attach('slide-budget.json', {
    body: JSON.stringify({ measured: slides.length, sparse }, null, 2),
    contentType: 'application/json',
  });

  // The assertion is only that the measurement works · the numbers are advice.
  expect(slides.every((s) => s.fillRatio > 0)).toBe(true);
});
