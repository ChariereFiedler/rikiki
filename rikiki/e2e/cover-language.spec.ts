import { expect, test } from '@playwright/test';

// The cover writes four words of its own: the meta labels beside the speaker,
// the company, the duration and the audience. They were French whatever the
// deck declared, so an English deck opened on "PRÉSENTÉ PAR" while every other
// word the engine writes was in English.

const deckWith = (lang: string, attrs = '') =>
  `<!doctype html><html lang="${lang}"><head><meta charset="UTF-8">
<link rel="stylesheet" href="/rikiki/tokens.css">
<script type="module" src="/rikiki/dist/index.js"></script>
</head><body><deck-root>
<deck-cover speaker="Alex" company="siliceum" duration="20 min" audience="Devs" ${attrs}>
<h1>Titre</h1></deck-cover>
</deck-root></body></html>`;

/** The labels the cover actually painted, in order. */
async function labelsOf(page: import('@playwright/test').Page, html: string) {
  await page.setContent(html);
  await page.waitForFunction(() => !!document.querySelector('deck-cover')?.shadowRoot?.textContent);
  return page.evaluate(() =>
    Array.from(document.querySelector('deck-cover')!.shadowRoot!.querySelectorAll('.meta-item strong'))
      .map((el) => el.textContent?.trim())
      .filter(Boolean),
  );
}

test('an English deck gets English labels', async ({ page }) => {
  await page.goto('/rikiki/decks/tests/bento.html');
  const labels = await labelsOf(page, deckWith('en'));
  expect(labels.join(' ')).toContain('Presented by');
  expect(labels.join(' ')).not.toContain('Présenté');
});

test('a French deck keeps French labels', async ({ page }) => {
  await page.goto('/rikiki/decks/tests/bento.html');
  const labels = await labelsOf(page, deckWith('fr'));
  expect(labels.join(' ')).toContain('Présenté par');
  expect(labels.join(' ')).toContain('Durée');
});

test('an explicit label wins over the language', async ({ page }) => {
  await page.goto('/rikiki/decks/tests/bento.html');
  const labels = await labelsOf(page, deckWith('en', 'speaker-label="Orateur"'));
  expect(labels.join(' ')).toContain('Orateur');
});
