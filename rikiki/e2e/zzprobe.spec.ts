import { test } from '@playwright/test';
import { createDeckPage } from './pages/deck.page';
test('probe', async ({ page }) => {
  const deck = createDeckPage(page);
  await deck.goto('/examples/rikiki-tour/index.html#9');
  await page.waitForTimeout(400);
  const out = await page.evaluate(() => {
    const slide = document.querySelector('deck-root > [active]') as HTMLElement;
    const shell = slide.shadowRoot?.querySelector('.body') as HTMLElement | null;
    const box = slide.getBoundingClientRect();
    const cs = getComputedStyle(slide);
    const kids = [...slide.querySelectorAll('*')]
      .filter((el) => el.getBoundingClientRect().height > 0)
      .map((el) => ({
        tag: el.tagName.toLowerCase(),
        bottom: Math.round(el.getBoundingClientRect().bottom),
      }))
      .sort((a, b) => b.bottom - a.bottom)
      .slice(0, 5);
    return {
      tag: slide.tagName.toLowerCase(),
      slideBottom: Math.round(box.bottom),
      paddingBottom: cs.paddingBottom,
      shellClip: shell ? { scroll: shell.scrollHeight, client: shell.clientHeight } : null,
      slideClip: { scroll: slide.scrollHeight, client: slide.clientHeight },
      lowest: kids,
    };
  });
  console.log(JSON.stringify(out, null, 1));
});
