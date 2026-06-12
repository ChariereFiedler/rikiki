import { expect, type Locator, type Page } from '@playwright/test';

// Page object for a rikiki deck. rikiki's contract IS its custom-element tags
// and reflected attributes (`deck-root`, `[active]`, `[overview]`), so those are
// the stable selectors here — not fragile CSS. Dynamic assertions use text or
// data-testid. Every wait keys off a concrete state, never an arbitrary delay.
export function createDeckPage(page: Page) {
  // Console / page errors are the heart of the smoke check · collect them from
  // the moment the object is created so nothing is missed during load.
  const consoleErrors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => {
    consoleErrors.push(`pageerror: ${err.message}`);
  });

  // A deck asset that 404s (theme CSS, tokens, lazy chunk) only surfaces in the
  // console as the generic "Failed to load resource", which the smoke filters
  // as network noise · track local failures structurally instead, so a broken
  // stylesheet can't pass green. Favicons are browser noise, not deck assets.
  const failedRequests: string[] = [];
  page.on('response', (res) => {
    if (res.status() >= 400 && res.url().includes('localhost') && !/favicon/.test(res.url())) {
      failedRequests.push(`${res.status()} ${res.url()}`);
    }
  });

  const root: Locator = page.locator('deck-root');
  const activeSlide: Locator = page.locator('deck-root > [active]');

  return {
    page,
    consoleErrors,
    failedRequests,
    root,
    activeSlide,

    async goto(path: string) {
      await page.goto(path);
      // Ready = the engine upgraded and marked a current slide active.
      await expect(activeSlide).toHaveCount(1);
    },

    /** True once the custom element is defined and upgraded. */
    upgraded() {
      return page.evaluate(() => customElements.get('deck-root') !== undefined);
    },

    /** 0-based index of the active slide among deck-root's children. */
    activeIndex() {
      return page.evaluate(() => {
        const r = document.querySelector('deck-root');
        if (!r) return -1;
        return [...r.children].findIndex((c) => c.hasAttribute('active'));
      });
    },

    hash() {
      return page.evaluate(() => location.hash);
    },

    inOverview() {
      return root.evaluate((el) => el.hasAttribute('overview'));
    },

    async advance() {
      await page.keyboard.press('ArrowRight');
    },
    async back() {
      await page.keyboard.press('ArrowLeft');
    },
    async toggleOverview() {
      await page.keyboard.press('o');
    },

    /** The shadow #stage box in viewport pixels (includes the zoom transform). */
    async stageBox() {
      return page.evaluate(() => {
        const stage = document.querySelector('deck-root')?.shadowRoot?.querySelector('#stage');
        if (!stage) throw new Error('no #stage');
        const b = stage.getBoundingClientRect();
        return { w: b.width, h: b.height };
      });
    },

    /** Click the center of the stage · default mouse-nav advances. */
    async clickCenter() {
      const box = await root.boundingBox();
      if (!box) throw new Error('deck-root has no bounding box');
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    },
  };
}

export type DeckPage = ReturnType<typeof createDeckPage>;

/** Assert a deck reached a given 0-based slide index without polling on time. */
export async function expectActiveIndex(deck: DeckPage, index: number) {
  await expect
    .poll(() => deck.activeIndex(), { message: `active slide should be ${index}` })
    .toBe(index);
}
