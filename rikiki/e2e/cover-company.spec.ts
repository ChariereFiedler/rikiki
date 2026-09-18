import { expect, test } from '@playwright/test';

// A deck handed to a client names that client on the cover. `brand-src` already
// put the author's mark beside its name; the company row had only words, so a
// client logo had to be pasted over the cover by hand.

const PIXEL_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=';

const deckWith = (attrs: string) =>
  `<!doctype html><html lang="fr"><head><meta charset="UTF-8">
<link rel="stylesheet" href="/rikiki/tokens.css">
<script type="module" src="/rikiki/dist/index.js"></script>
</head><body><deck-root>
<deck-cover speaker="Alex" ${attrs}><h1>Titre</h1></deck-cover>
</deck-root></body></html>`;

/** The company row the cover painted: its logo, if any, and its words. */
async function companyRowOf(page: import('@playwright/test').Page, html: string) {
  await page.setContent(html);
  await page.waitForFunction(() => !!document.querySelector('deck-cover')?.shadowRoot?.textContent);
  return page.evaluate(() => {
    const row = document.querySelector('deck-cover')!.shadowRoot!.querySelector('[data-field="company"]');
    const img = row?.querySelector('img');
    return {
      found: !!row,
      logo: img ? { src: img.getAttribute('src'), alt: img.getAttribute('alt') } : null,
      text: row?.querySelector('span')?.textContent?.trim() ?? '',
    };
  });
}

test('company-src puts the client logo beside the company name', async ({ page }) => {
  await page.goto('/rikiki/decks/tests/bento.html');
  const row = await companyRowOf(page, deckWith(`company="RTE" company-src="${PIXEL_PNG}"`));
  expect(row.logo).toEqual({ src: PIXEL_PNG, alt: '' });
  expect(row.text).toBe('RTE');
});

test('without company-src the company row stays text only', async ({ page }) => {
  await page.goto('/rikiki/decks/tests/bento.html');
  const row = await companyRowOf(page, deckWith('company="RTE"'));
  expect(row.found).toBe(true);
  expect(row.logo).toBeNull();
  expect(row.text).toBe('RTE');
});
