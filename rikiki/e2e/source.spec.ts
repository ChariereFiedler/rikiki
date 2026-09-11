import { expect, test } from '@playwright/test';

import { createDeckPage } from './pages/deck.page';

// deck-source is a core atom (registered by dist/index.js), so any fixture
// that loads the default bundle carries it · this one also happens to load
// deck-figure, which is what the last test needs.
const DECK = '/rikiki/decks/tests/figure.html';

async function loadComponents(page: import('@playwright/test').Page): Promise<void> {
  await createDeckPage(page).goto(DECK);
  await page.waitForFunction(() => Boolean(customElements.get('deck-source')));
}

test('deck-source renders its slotted text with no link by default', async ({ page }) => {
  await loadComponents(page);
  await page.evaluate(() => {
    document.body.insertAdjacentHTML('beforeend', '<deck-source id="plain">Word, p. 12</deck-source>');
  });

  const result = await page.evaluate(() => {
    const host = document.getElementById('plain')!;
    const root = host.shadowRoot!;
    return {
      // The slotted text lives in the host's own (light DOM) tree, not the
      // shadow tree that renders it, so read it off the host itself.
      text: host.textContent?.trim(),
      cite: root.querySelector('cite') !== null,
      link: root.querySelector('a'),
    };
  });

  expect(result.text).toBe('Word, p. 12');
  expect(result.cite).toBe(true);
  expect(result.link).toBeNull();
});

test('deck-source wraps its text in a link when href is set', async ({ page }) => {
  await loadComponents(page);
  await page.evaluate(() => {
    document.body.insertAdjacentHTML(
      'beforeend',
      '<deck-source id="linked" href="https://example.invalid/report">Annual report, p. 4</deck-source>',
    );
  });

  const result = await page.evaluate(() => {
    const host = document.getElementById('linked')!;
    const root = host.shadowRoot!;
    const link = root.querySelector('a');
    return {
      text: host.textContent?.trim(),
      href: link?.getAttribute('href'),
    };
  });

  expect(result).toEqual({ text: 'Annual report, p. 4', href: 'https://example.invalid/report' });
});

test('deck-figure with a source renders one deck-source carrying the same text', async ({ page }) => {
  await loadComponents(page);

  const result = await page.evaluate(() => {
    const host = document.getElementById('fig')!;
    const root = host.shadowRoot!;
    const sources = root.querySelectorAll('deck-source');
    const source = sources[0];
    return {
      count: sources.length,
      // The fallback text lives on the <slot> deck-figure nests inside its
      // own <deck-source>, still in deck-figure's own shadow tree.
      text: source?.textContent?.trim(),
      href: source?.shadowRoot?.querySelector('a')?.getAttribute('href'),
    };
  });

  expect(result).toEqual({
    count: 1,
    text: 'CI benchmark · 11 September 2026',
    href: 'https://example.invalid/benchmark',
  });
});
