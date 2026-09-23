import { expect, test } from '@playwright/test';
import { createDeckPage } from './pages/deck.page';

// An embedded deck (not a direct <body> child) must be a good citizen: no
// overflow lock, no rem rebase, the host page keeps scrolling.
const EMBED = '/rikiki/decks/tests/embedded.html';

test('an embedded deck leaves the host page untouched', async ({ page }) => {
  const deck = createDeckPage(page);
  await deck.goto(EMBED);

  const host = await page.evaluate(() => ({
    htmlOverflow: getComputedStyle(document.documentElement).overflow,
    rootFont: parseFloat(getComputedStyle(document.documentElement).fontSize),
  }));
  expect(host.htmlOverflow, 'host page keeps its scroll').not.toBe('hidden');
  expect(host.rootFont, 'host page keeps its rem baseline').toBe(16);
  expect(deck.consoleErrors).toEqual([]);
});

test('an embedded zoom-to-fit deck scales to its container, not the window', async ({ page }) => {
  const deck = createDeckPage(page);
  await deck.goto(EMBED);

  // #deck-box is 800×450 → scale = min(800/1920, 450/1080) ≈ 0.417
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
      { message: 'scale derives from the container box' },
    )
    .toBeCloseTo(800 / 1920, 2);
});

test('a fluid deck reflows with the viewport (no canvas, no letterbox)', async ({ page }) => {
  const deck = createDeckPage(page);
  await deck.goto('/rikiki/decks/tests/fluid.html');

  // The stage fills the viewport exactly · no 16:9 letterbox.
  await page.setViewportSize({ width: 700, height: 1100 });
  const tall = await deck.stageBox();
  expect(tall.w, 'stage fills the viewport width').toBeCloseTo(700, 0);
  expect(tall.h, 'stage fills the viewport height').toBeCloseTo(1100, 0);

  // Reflow, not zoom: the stage box CHANGES shape between viewports — the
  // inverse of the zoom-to-fit invariant locked in scaling.spec.ts.
  await page.setViewportSize({ width: 1600, height: 900 });
  const wide = await deck.stageBox();
  expect(wide.w / wide.h, 'aspect follows the window').not.toBeCloseTo(tall.w / tall.h, 1);
  expect(deck.consoleErrors).toEqual([]);
});

test('toggling fluid off at runtime restores the zoom-to-fit canvas', async ({ page }) => {
  const deck = createDeckPage(page);
  await page.setViewportSize({ width: 700, height: 1100 });
  await deck.goto('/rikiki/decks/tests/fluid.html');

  // Fluid: the stage fills the 700×1100 viewport.
  const fluid = await deck.stageBox();
  expect(fluid.h, 'fluid fills the viewport height').toBeCloseTo(1100, 0);

  // Turn fluid off at runtime · the deck must return to the scaled 16:9 canvas.
  await page.evaluate(() => {
    (document.querySelector('deck-root') as HTMLElement & { fluid: boolean }).fluid = false;
  });
  // Zoom-to-fit must re-engage: the rendered stage shrinks to fit the viewport
  // (scale = min(700/1920, 1100/1080) = 700/1920) instead of overflowing at its
  // raw 1920×1080. Polling the rendered width catches the missing rescale — the
  // 16:9 aspect alone holds even when --deck-scale is left unset.
  await expect
    .poll(async () => (await deck.stageBox()).w, {
      message: 'stage is scaled back to fit the viewport after fluid is turned off',
    })
    .toBeCloseTo(700, 0);
  const restored = await deck.stageBox();
  expect(restored.w / restored.h, 'stage returns to 16:9').toBeCloseTo(1920 / 1080, 1);
  expect(deck.consoleErrors).toEqual([]);
});

// The host page owns its own look · importing a rikiki theme is not permission
// to restyle the document around the deck. Each assertion below matches a
// declaration in the fixture's own <style> block.
test('a rikiki theme does not restyle the host page', async ({ page }) => {
  const deck = createDeckPage(page);
  await deck.goto(EMBED);

  const host = await page.evaluate(() => {
    const body = getComputedStyle(document.body);
    const title = getComputedStyle(document.getElementById('host-title')!);
    const accent = getComputedStyle(document.getElementById('host-accent')!);
    const box = getComputedStyle(document.getElementById('host-box')!);
    return {
      margin: body.marginTop,
      font: body.fontFamily,
      background: body.backgroundColor,
      color: body.color,
      titleMargin: title.marginBottom,
      accentColor: accent.color,
      boxSizing: box.boxSizing,
      boxWidth: box.width,
    };
  });

  expect(host.margin, 'the host keeps its body margin').toBe('24px');
  expect(host.font, 'the host keeps its font').toContain('Georgia');
  expect(host.background, 'the host keeps its background').toBe('rgb(240, 230, 220)');
  expect(host.color, 'the host keeps its text color').toBe('rgb(20, 40, 60)');
  expect(host.titleMargin, 'the host keeps its heading margins').toBe('32px');
  expect(host.accentColor, 'the theme does not hijack a generic .accent class').toBe(
    'rgb(10, 120, 90)',
  );
  expect(host.boxSizing, 'the host keeps its box-sizing').toBe('content-box');
  expect(host.boxWidth, 'content-box means the width excludes the padding').toBe('200px');
});

test('an embedded deck does not take the host page keyboard or URL', async ({ page }) => {
  // Arrow keys belong to the host until the reader focuses the deck, and the
  // deck must not rewrite an anchor the host page put in the URL.
  const deck = createDeckPage(page);
  await page.goto(`${EMBED}#host-title`);
  await expect(page.locator('deck-root:not([data-overview-snapshot]) > [active]')).toHaveCount(1);

  const firstHash = await page.evaluate(() => location.hash);
  expect(firstHash, 'the host anchor survives the deck booting').toBe('#host-title');

  // Focus is on the host page · the deck must not move.
  await page.locator('#host-title').click();
  const before = await page.evaluate(
    () => document.querySelector('deck-root')?.getAttribute('current') ?? '0',
  );
  await page.keyboard.press('ArrowRight');
  const after = await page.evaluate(
    () => document.querySelector('deck-root')?.getAttribute('current') ?? '0',
  );
  expect(after, 'the deck ignores arrow keys while the host page has focus').toBe(before);
  expect(await page.evaluate(() => location.hash), 'the URL is untouched').toBe('#host-title');
});

test('an embedded deck navigates once it is focused', async ({ page }) => {
  // The flip side · scoping the keyboard must not make the deck unusable.
  const deck = createDeckPage(page);
  await deck.goto(EMBED);

  await page.evaluate(() => (document.querySelector('deck-root') as HTMLElement).focus());
  await page.keyboard.press('ArrowRight');
  await expect
    .poll(() =>
      page.evaluate(() => {
        const slides = Array.from(document.querySelectorAll('deck-root > *'));
        return slides.findIndex((s) => s.hasAttribute('active'));
      }),
    )
    .toBe(1);
});

test('an embedded deck lets the host page scroll under the pointer', async ({ page }) => {
  const deck = createDeckPage(page);
  await deck.goto(EMBED);

  const box = await page.locator('#deck-box').boundingBox();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.wheel(0, 400);

  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeGreaterThan(0);
});
