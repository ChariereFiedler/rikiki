import { expect, test } from '@playwright/test';

import { createDeckPage } from './pages/deck.page';

// Both components are opt-in, so they need a page that actually loads their
// modules · `setContent` has no base URL and every relative module 404s.
const DECK = '/rikiki/decks/tests/figure.html';

// An inline placeholder · a relative file name would 404 against the deck
// directory and put a broken image in every measurement.
const IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='450'%3E%3Crect width='800' height='450' fill='%23dcd6cc'/%3E%3C/svg%3E";

async function loadComponents(page: import('@playwright/test').Page): Promise<void> {
  await createDeckPage(page).goto(DECK);
  await page.waitForFunction(() =>
    Boolean(customElements.get('deck-figure') && customElements.get('deck-versus')),
  );
}

test('deck-figure keeps image, caption and linked source in native figure semantics', async ({ page }) => {
  await loadComponents(page);
  await page.evaluate((image) => {
    document.body.insertAdjacentHTML(
      'beforeend',
      `<deck-figure id="figure" src="${image}" alt="Build time falls from 18 to 7 minutes"
        caption="Cache enabled." source="CI benchmark" source-href="/benchmark"></deck-figure>`,
    );
  }, IMAGE);

  const semantics = await page.evaluate(() => {
    const host = document.getElementById('figure')!;
    const root = host.shadowRoot!;
    return {
      figure: root.querySelector('figure') !== null,
      alt: root.querySelector('img')?.getAttribute('alt'),
      caption: root.querySelector('figcaption')?.textContent?.replace(/\s+/g, ' ').trim(),
      sourceHref: root.querySelector('cite a')?.getAttribute('href'),
      invalid: host.hasAttribute('data-missing-alt'),
    };
  });

  expect(semantics).toEqual({
    figure: true,
    alt: 'Build time falls from 18 to 7 minutes',
    caption: 'Cache enabled. CI benchmark',
    sourceHref: '/benchmark',
    invalid: false,
  });
});

test('deck-figure requires an alt unless the author explicitly marks it decorative', async ({ page }) => {
  await loadComponents(page);
  const result = await page.evaluate(async (image) => {
    const informative = document.createElement('deck-figure');
    informative.setAttribute('src', image);
    const decorative = document.createElement('deck-figure');
    decorative.setAttribute('src', image);
    decorative.setAttribute('decorative', '');
    document.body.append(informative, decorative);
    await Promise.all([
      (informative as unknown as { updateComplete: Promise<unknown> }).updateComplete,
      (decorative as unknown as { updateComplete: Promise<unknown> }).updateComplete,
    ]);
    return {
      informativeMissing: informative.hasAttribute('data-missing-alt'),
      informativeHasAlt: informative.shadowRoot?.querySelector('img')?.hasAttribute('alt'),
      decorativeMissing: decorative.hasAttribute('data-missing-alt'),
      decorativeAlt: decorative.shadowRoot?.querySelector('img')?.getAttribute('alt'),
    };
  }, IMAGE);

  expect(result).toEqual({
    informativeMissing: true,
    informativeHasAlt: false,
    decorativeMissing: false,
    decorativeAlt: '',
  });
});

test('deck-versus remains an inline comparison by default', async ({ page }) => {
  await loadComponents(page);
  const display = await page.evaluate(async () => {
    const versus = document.createElement('deck-versus');
    versus.innerHTML = '<p slot="left">Before</p><p slot="right">After</p>';
    document.body.append(versus);
    await (versus as unknown as { updateComplete: Promise<unknown> }).updateComplete;
    return getComputedStyle(versus).display;
  });
  expect(display).toBe('grid');
});

test('deck-versus slide composes a complete active slide and stacks responsively', async ({ page }) => {
  await loadComponents(page);
  await page.evaluate(() => {
    document.body.insertAdjacentHTML(
      'beforeend',
      `<deck-versus id="versus" slide active eyebrow="Before / after" pivot="→" winner="right">
        <h1 slot="title">Review in minutes</h1>
        <p slot="lead">The evidence stays the same.</p>
        <section slot="left"><h3>Before</h3><p>Four hours.</p></section>
        <section slot="right"><h3>After</h3><p>Twelve minutes.</p></section>
      </deck-versus>`,
    );
  });

  const desktop = await page.evaluate(() => {
    const host = document.getElementById('versus')!;
    const root = host.shadowRoot!;
    const left = root.querySelector('.left')!.getBoundingClientRect();
    const right = root.querySelector('.right')!.getBoundingClientRect();
    return {
      display: getComputedStyle(host).display,
      title: root.querySelector('slot[name="title"]')?.assignedElements()[0]?.textContent,
      sideBySide: Math.abs(left.top - right.top) < 2 && left.left < right.left,
    };
  });
  expect(desktop).toEqual({ display: 'grid', title: 'Review in minutes', sideBySide: true });

  await page.setViewportSize({ width: 600, height: 900 });
  const mobile = await page.evaluate(() => {
    const root = document.getElementById('versus')!.shadowRoot!;
    const left = root.querySelector('.left')!.getBoundingClientRect();
    const right = root.querySelector('.right')!.getBoundingClientRect();
    return right.top > left.bottom;
  });
  expect(mobile, 'the two sides stack rather than squeeze').toBe(true);
});
