import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { createDeckPage } from './pages/deck.page';

// Accessibility · two halves, because neither is sufficient alone.
//
//  1. An automated Axe pass over the reference decks · catches contrast,
//     labelling and role violations at scale, misses everything about behaviour.
//  2. Targeted keyboard assertions on the paths a person actually uses ·
//     an all-clear Axe report says nothing about whether you can reach the
//     overview with a keyboard and pick a slide.

const DECKS = [
  '/rikiki/decks/tests/demo.html',
  '/rikiki/decks/tests/bento.html',
  '/rikiki/starter.html',
];

/** Serious and critical only · the moderate/minor tail is mostly advisory and
 *  would turn this into a nagging suite nobody keeps green. */
const BLOCKING = new Set(['serious', 'critical']);

for (const deck of DECKS) {
  test(`${deck} has no serious or critical accessibility violation`, async ({ page }) => {
    const deckPage = createDeckPage(page);
    await deckPage.goto(deck);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    const blocking = results.violations.filter((v) => BLOCKING.has(v.impact ?? ''));
    const summary = blocking
      .map((v) => `${v.impact} · ${v.id} · ${v.nodes.length} node(s) · ${v.help}`)
      .join('\n');
    expect(blocking, `axe violations on ${deck}:\n${summary}`).toEqual([]);
  });
}

test('the overview opens, moves and picks a slide with the keyboard alone', async ({ page }) => {
  const deck = createDeckPage(page);
  await deck.goto('/rikiki/decks/tests/demo.html');

  await page.keyboard.press('o');
  await expect(page.locator('deck-root[overview]')).toHaveCount(1);

  // Something inside the overview must hold focus · without it a keyboard user
  // lands nowhere and has no way in.
  //
  // The overview attribute lands before the focus call does, so reading
  // activeElement straight after the assertion above races the engine and went
  // red on WebKit under a loaded worker. Wait for the state, never for a delay.
  const focusedTag = () =>
    page.evaluate(() => {
      const active = document.activeElement;
      const inner = active?.shadowRoot?.activeElement;
      return (inner ?? active)?.tagName?.toLowerCase() ?? null;
    });
  await expect
    .poll(focusedTag, { message: 'the overview takes focus when it opens' })
    .not.toBe('body');

  // Enter picks the focused slide and closes the overview.
  await page.keyboard.press('Enter');
  await expect(page.locator('deck-root[overview]')).toHaveCount(0);
  await expect(page.locator('deck-root > [active]')).toHaveCount(1);
});

test('every on-screen control is a real, focusable button', async ({ page }) => {
  const deck = createDeckPage(page);
  await deck.goto('/rikiki/decks/tests/demo.html');

  const controls = await page.evaluate(() => {
    const root = document.querySelector('deck-root');
    const shadow = root?.shadowRoot;
    if (!shadow) return null;
    const ids = ['nav-arrows', 'kb-hint'];
    const out: { tag: string; label: string | null; tabbable: boolean }[] = [];
    for (const id of ids) {
      const host = shadow.getElementById(id);
      if (!host) continue;
      for (const el of host.querySelectorAll('*')) {
        const clickable =
          el.tagName === 'BUTTON' || el.hasAttribute('data-nav') || el.getAttribute('role');
        if (!clickable && el.tagName !== 'KBD') continue;
        out.push({
          tag: el.tagName.toLowerCase(),
          label:
            el.getAttribute('aria-label') ?? (el.textContent ?? '').trim() ?? null,
          tabbable: el.tagName === 'BUTTON' || el.hasAttribute('tabindex'),
        });
      }
    }
    return out;
  });

  expect(controls, 'the deck exposes its controls').not.toBeNull();
  const unreachable = controls!.filter((c) => !c.tabbable);
  expect(
    unreachable,
    `these controls cannot be reached with a keyboard: ${JSON.stringify(unreachable)}`,
  ).toEqual([]);

  const unlabelled = controls!.filter((c) => !c.label || c.label.length === 0);
  expect(unlabelled, `these controls have no accessible name: ${JSON.stringify(unlabelled)}`).toEqual(
    [],
  );
});

test('a slide change is announced to assistive technology', async ({ page }) => {
  const deck = createDeckPage(page);
  await deck.goto('/rikiki/decks/tests/demo.html');

  const live = await page.evaluate(() => {
    const shadow = document.querySelector('deck-root')?.shadowRoot;
    const region = shadow?.querySelector('[aria-live]');
    return region ? { politeness: region.getAttribute('aria-live'), text: region.textContent } : null;
  });
  expect(live, 'the deck has a live region for slide changes').not.toBeNull();
  expect(live!.politeness).toBe('polite');

  await deck.advance();
  const after = await page.evaluate(
    () => document.querySelector('deck-root')?.shadowRoot?.querySelector('[aria-live]')?.textContent,
  );
  expect(after?.trim().length, 'the live region names the new slide').toBeGreaterThan(0);
});

test('reduced motion is respected', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const deck = createDeckPage(page);
  await deck.goto('/rikiki/decks/tests/demo.html');

  const durations = await page.evaluate(() => {
    const slides = Array.from(document.querySelectorAll('deck-root > *'));
    return slides.map((s) => getComputedStyle(s).animationDuration);
  });
  const animated = durations.filter((d) => d !== '0s' && d !== '' && d !== 'auto');
  expect(animated, 'no slide animates under prefers-reduced-motion').toEqual([]);
});
