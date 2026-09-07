import { expect, test } from '@playwright/test';
import { createDeckPage } from './pages/deck.page';

// Opt-in components · they live outside dist/index.js, so a deck that does not
// use them pays nothing. These tests cover both halves of that bargain: they
// work when loaded, and they are absent when they are not.

const DECK = '/rikiki/decks/tests/extras.html';
const WITHOUT = '/rikiki/decks/tests/extras-optin.html';

/** Width of a bar segment as a share of its track. */
async function segmentShares(page: import('@playwright/test').Page, id: string): Promise<number[]> {
  return page.evaluate((barId) => {
    const shadow = document.getElementById(barId)?.shadowRoot;
    const track = shadow?.querySelector('.track') as HTMLElement | null;
    if (!track) return [];
    const whole = track.getBoundingClientRect().width;
    return [...track.querySelectorAll('.seg')].map(
      (s) => Math.round(((s as HTMLElement).getBoundingClientRect().width / whole) * 1000) / 10,
    );
  }, id);
}

test('a value bar draws its share and leaves the rest of the track empty', async ({ page }) => {
  const deck = createDeckPage(page);
  await deck.goto(DECK);

  const [share] = await segmentShares(page, 'bar-part');
  // 160 of 538 · the point is that it does NOT fill the track.
  expect(share).toBeGreaterThan(28);
  expect(share).toBeLessThan(32);
});

test('a stacked bar fills the track and its legend adds up to 100', async ({ page }) => {
  const deck = createDeckPage(page);
  await deck.goto(DECK);

  const shares = await segmentShares(page, 'bar-stack');
  expect(shares).toHaveLength(5);
  expect(shares.reduce((a, b) => a + b, 0), 'the segments fill the track').toBeCloseTo(100, 0);

  const legend = await page.evaluate(() => {
    const shadow = document.getElementById('bar-stack')?.shadowRoot;
    return [...(shadow?.querySelectorAll('.legend-value') ?? [])].map((n) =>
      Number((n.textContent ?? '').replace('%', '')),
    );
  });
  expect(legend.reduce((a, b) => a + b, 0), 'the printed percentages add to 100').toBe(100);
});

test('a bar is announced, not silent', async ({ page }) => {
  const deck = createDeckPage(page);
  await deck.goto(DECK);

  const label = await page.evaluate(
    () =>
      document.getElementById('bar-part')?.shadowRoot?.querySelector('.track')?.getAttribute('aria-label'),
  );
  expect(label, 'the bar carries its own accessible name').toContain('30%');
  expect(label).toContain('538');
});

test('every visual belongs to the theme · a token override reaches it', async ({ page }) => {
  const deck = createDeckPage(page);
  await deck.goto(DECK);

  const height = await page.evaluate(() => {
    const track = document.getElementById('bar-token')?.shadowRoot?.querySelector('.track');
    return track ? getComputedStyle(track).height : null;
  });
  expect(height, '--deck-bar-height is honoured').toBe('40px');

  // And the default comes from the theme, not from a hardcoded colour.
  const fill = await page.evaluate(() => {
    const seg = document.getElementById('bar-part')?.shadowRoot?.querySelector('.seg');
    return seg ? getComputedStyle(seg).backgroundColor : null;
  });
  expect(fill).not.toBe('rgba(0, 0, 0, 0)');
});

test('a quote carries its attribution, and does not steal the ARIA role', async ({ page }) => {
  const deck = createDeckPage(page);
  await deck.goto(`${DECK}#2`);

  const quote = await page.evaluate(() => {
    const el = document.getElementById('q-full');
    const shadow = el?.shadowRoot;
    return {
      author: shadow?.querySelector('.author')?.textContent?.trim() ?? null,
      role: shadow?.querySelector('.role')?.textContent?.trim() ?? null,
      ariaRole: el?.getAttribute('role'),
      quoted: shadow?.querySelector('blockquote') !== null,
    };
  });

  expect(quote.author).toBe('Marie Dupont');
  expect(quote.role).toBe('CTO, Acme');
  expect(quote.quoted, 'the words sit in a blockquote').toBe(true);
  // `author-role`, never `role` · the latter would announce the element as a
  // landmark named "CTO, Acme".
  expect(quote.ariaRole, 'the ARIA role attribute is untouched').toBeNull();
});

test('a quote with no author renders without an empty attribution', async ({ page }) => {
  const deck = createDeckPage(page);
  await deck.goto(`${DECK}#2`);

  const caption = await page.evaluate(
    () => document.getElementById('q-bare')?.shadowRoot?.querySelector('figcaption'),
  );
  expect(caption, 'no attribution block when there is nobody to attribute to').toBeNull();
});

test('the extras are genuinely opt-in', async ({ page }) => {
  // Same tags, without their modules · the deck must still render, and the
  // elements must stay unknown rather than half-registered.
  const deck = createDeckPage(page);
  await deck.goto(WITHOUT);

  const registered = await page.evaluate(() => ({
    bar: customElements.get('deck-bar') !== undefined,
    quote: customElements.get('deck-quote') !== undefined,
    root: customElements.get('deck-root') !== undefined,
  }));
  expect(registered.root, 'the engine is there').toBe(true);
  expect(registered.bar, 'deck-bar is not in the default bundle').toBe(false);
  expect(registered.quote, 'deck-quote is not in the default bundle').toBe(false);

  await expect(page.locator('deck-root > [active]')).toHaveCount(1);
  expect(deck.consoleErrors, 'an unknown element is not an error').toEqual([]);
});

test('annotation marks are placed by percentage and revealed one per step', async ({ page }) => {
  const deck = createDeckPage(page);
  await deck.goto(`${DECK}#4`);

  // Step 0 shows the screenshot alone · the room looks before being pointed at.
  const visible = () =>
    page.evaluate(() => {
      const shadow = document.getElementById('shot')?.shadowRoot;
      return [...(shadow?.querySelectorAll('.mark') ?? [])].filter(
        (m) => !(m as HTMLElement).hidden,
      ).length;
    });
  expect(await visible()).toBe(0);

  await page.keyboard.press('ArrowRight');
  await expect.poll(visible).toBe(1);
  await page.keyboard.press('ArrowRight');
  await expect.poll(visible).toBe(2);

  // The placement is a percentage of the PAINTED PICTURE, not of the element
  // box · an image letterboxed inside its box would otherwise shift every mark.
  const placed = await page.evaluate(() => {
    const shadow = document.getElementById('shot')!.shadowRoot!;
    const el = shadow.querySelector('img') as HTMLImageElement;
    const box = el.getBoundingClientRect();
    const ratio = el.naturalWidth / el.naturalHeight;
    const boxRatio = box.width / box.height;
    const w = ratio > boxRatio ? box.width : box.height * ratio;
    const left = box.left + (box.width - w) / 2;
    const m = (shadow.querySelector('.mark') as HTMLElement).getBoundingClientRect();
    return Math.round(((m.left + m.width / 2 - left) / w) * 100);
  });
  expect(placed, 'the first mark sits at 20% of the picture').toBeGreaterThan(17);
  expect(placed).toBeLessThan(23);
});

test('an annotated slide asks the engine for one step per mark', async ({ page }) => {
  const deck = createDeckPage(page);
  await deck.goto(`${DECK}#4`);
  const steps = await page.evaluate(
    () => document.getElementById('annotated')?.getAttribute('data-steps'),
  );
  expect(steps, 'three marks means three steps').toBe('3');
});

test('the agenda reads the deck own chapters and marks the current one', async ({ page }) => {
  const deck = createDeckPage(page);
  await deck.goto(`${DECK}#6`);

  const entries = await page.evaluate(() => {
    const shadow = document.getElementById('agenda')?.shadowRoot;
    return [...(shadow?.querySelectorAll('li') ?? [])].map((li) => ({
      state: li.getAttribute('data-state'),
      title: li.textContent?.trim().replace(/\s+/g, ' ') ?? '',
    }));
  });

  expect(entries.length, 'one entry per chapter, derived not typed').toBeGreaterThan(2);
  expect(entries.map((e) => e.state)).toContain('current');
  expect(entries.some((e) => e.title.includes('Second act'))).toBe(true);
  // The chapter the deck is in is the current one, and earlier ones are done.
  const current = entries.findIndex((e) => e.state === 'current');
  expect(entries.slice(0, current).every((e) => e.state === 'done')).toBe(true);
});

test('an agenda entry is a real button that jumps to its chapter', async ({ page }) => {
  const deck = createDeckPage(page);
  await deck.goto(`${DECK}#6`);

  await page.evaluate(() => {
    const shadow = document.getElementById('agenda')?.shadowRoot;
    (shadow?.querySelectorAll('button')[0] as HTMLElement).click();
  });

  await expect
    .poll(() =>
      page.evaluate(() => {
        const slides = [...document.querySelectorAll('deck-root > *')];
        return slides.findIndex((s) => s.hasAttribute('active'));
      }),
    )
    .toBe(0);
});

test('a marker sits on the image, not on the letterbox beside it', async ({ page }) => {
  // The frame used to take the full width while the picture was centred inside
  // it, so a marker at 20% landed on the empty margin · a marker in the wrong
  // place is worse than a missing one, because the room believes it.
  const deck = createDeckPage(page);
  await deck.goto(`${DECK}#4`);
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');

  const inside = await page.evaluate(() => {
    const shadow = document.getElementById('shot')!.shadowRoot!;
    const el = shadow.querySelector('img')!;
    const box = el.getBoundingClientRect();
    // The PAINTED area, not the element box · an image whose intrinsic ratio
    // differs from its box is letterboxed inside it, and a marker placed
    // against the box would sit on the empty margin.
    const ratio = el.naturalWidth / el.naturalHeight;
    const boxRatio = box.width / box.height;
    const w = ratio > boxRatio ? box.width : box.height * ratio;
    const h = ratio > boxRatio ? box.width / ratio : box.height;
    const img = {
      left: box.left + (box.width - w) / 2,
      right: box.left + (box.width + w) / 2,
      top: box.top + (box.height - h) / 2,
      bottom: box.top + (box.height + h) / 2,
    };
    return [...shadow.querySelectorAll('.mark')].map((m) => {
      const r = (m as HTMLElement).getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      return cx >= img.left && cx <= img.right && cy >= img.top && cy <= img.bottom;
    });
  });

  expect(inside, 'every marker lands on the screenshot').toEqual([true, true, true]);
});
