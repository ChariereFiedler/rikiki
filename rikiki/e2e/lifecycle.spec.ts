import { expect, test } from '@playwright/test';
import { createDeckPage } from './pages/deck.page';

// Host-page lifecycle · a deck must not leave permanent marks on the page that
// embeds it, and must keep working after being moved in the DOM or
// reconfigured at runtime.

const TOUR = '/examples/rikiki-tour/';

test('removing the deck restores the host page (no global leak)', async ({ page }) => {
  const deck = createDeckPage(page);
  await deck.goto(TOUR);

  const after = await page.evaluate(() => {
    document.querySelector('deck-root')?.remove();
    return {
      globalsInjected: !!document.getElementById('rik-deck-globals'),
      bodyOverflow: getComputedStyle(document.body).overflow,
    };
  });
  expect(after.globalsInjected, 'the #rik-deck-globals style is removed').toBe(false);
  expect(after.bodyOverflow, 'the host page can scroll again').not.toBe('hidden');
});

test('changing width/height after first render re-fits the stage', async ({ page }) => {
  const deck = createDeckPage(page);
  await deck.goto(TOUR);

  const result = await page.evaluate(async () => {
    const root = document.querySelector('deck-root') as HTMLElement & {
      width: number;
      height: number;
      updateComplete: Promise<boolean>;
    };
    root.width = 960;
    root.height = 540;
    await root.updateComplete;
    const stage = root.shadowRoot?.querySelector('#stage') as HTMLElement;
    return {
      canvasW: getComputedStyle(document.documentElement).getPropertyValue('--deck-canvas-w').trim(),
      stageW: stage.clientWidth,
    };
  });
  expect(result.canvasW, '--deck-canvas-w follows the property').toBe('960');
  expect(result.stageW, 'the stage resizes to the new logical canvas').toBe(960);
});

test('a re-attached deck keeps rescaling on resize', async ({ page }) => {
  const deck = createDeckPage(page);
  await deck.goto(TOUR);

  await page.evaluate(() => {
    const root = document.querySelector('deck-root') as HTMLElement;
    const parent = root.parentElement as HTMLElement;
    root.remove();
    parent.appendChild(root);
  });

  await page.setViewportSize({ width: 960, height: 540 });
  await expect
    .poll(
      () =>
        page.evaluate(() =>
          parseFloat(
            (document.querySelector('deck-root') as HTMLElement).style.getPropertyValue(
              '--deck-scale',
            ),
          ),
        ),
      { message: 'the scale follows the viewport after a reconnect' },
    )
    .toBeCloseTo(0.5, 2);
});
