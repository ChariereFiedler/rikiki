import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

// Security contract (SECURITY.md · "deck content is HTML you publish"):
//  · authored deck content is trusted and renders as written
//  · text DERIVED from that content is NOT · a library error message folds the
//    offending source back into itself, so it must reach any innerHTML sink
//    escaped. Both halves are pinned here so a regression on either goes red.

const FIXTURE = '/rikiki/decks/tests/security.html';

const payloadsFired = (page: Page): Promise<string[]> =>
  page.evaluate(() => (window as unknown as { __rikXss: string[] }).__rikXss);

/** Load the fixture and wait for the mermaid render attempt to settle · it
 *  resolves on the error path too, which is the path under test. */
async function gotoSettled(page: Page): Promise<void> {
  await page.goto(FIXTURE);
  await page.locator('#mmd-payload').waitFor({ state: 'attached' });
  await page.evaluate(async () => {
    const el = document.querySelector('#mmd-payload') as unknown as { whenRendered: Promise<void> };
    await el.whenRendered;
  });
}

test('a mermaid error message cannot execute the payload it quotes', async ({ page }) => {
  await gotoSettled(page);

  expect(await payloadsFired(page)).toEqual([]);

  // The message still reaches the author, as escaped text rather than markup.
  const sink = page.locator('#mmd-payload').locator('pre');
  await expect(sink).toBeAttached();
  await expect(sink).toContainText('onerror');
  expect(await sink.locator('img').count()).toBe(0);
});

test('the escaped error survives being cloned into an overview thumbnail', async ({ page }) => {
  // deck-overview re-injects renderedSvg into a second DOM tree, so an unescaped
  // message would get a second chance to run there.
  await gotoSettled(page);

  await page.keyboard.press('o');
  await expect(page.locator('deck-root[overview]')).toHaveCount(1);
  const snap = page.locator('.ov-mermaid-snap').first();
  await expect(snap).toBeAttached();

  // Assert on the built tree, not just on the payload having had time to run:
  // an unescaped message materialises a real element here.
  expect(await snap.locator('img').count()).toBe(0);
  await expect(snap).toContainText('onerror');
  expect(await payloadsFired(page)).toEqual([]);
});

test('no request is made for the quoted payload URL', async ({ page }) => {
  // The sharpest signal that markup was built rather than escaped: an <img>
  // element would fetch its src. Nothing may request the payload's URL.
  const requested: string[] = [];
  page.on('request', (r) => requested.push(r.url()));

  await gotoSettled(page);
  await page.keyboard.press('o');
  await expect(page.locator('deck-root[overview]')).toHaveCount(1);

  expect(requested.filter((u) => u.includes('nope'))).toEqual([]);
});

test('authored HTML inside markdown still renders · the trusted contract holds', async ({
  page,
}) => {
  await page.goto(FIXTURE);
  const raw = page.locator('#md-trusted').locator('#md-raw-html');
  await expect(raw).toHaveCount(1);
  await expect(raw).toHaveText('raw');
});
