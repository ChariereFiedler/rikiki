// ════════════════════════════════════════════════════════════════
// Swapping the theme a loaded deck wears
//
// Every visual must hold under both shipped themes, so a check that claims to
// cover both has to prove the swap happened. A silently failing swap produces a
// green run "under both themes" that only ever looked at one · the worst kind
// of passing test.
// ════════════════════════════════════════════════════════════════

import { type Page, expect } from '@playwright/test';

export const THEMES = ['rikiki', 'siliceum'] as const;
export type ThemeName = (typeof THEMES)[number];

/** Point the deck at another theme, and fail if the page surface did not move. */
export async function useTheme(page: Page, theme: ThemeName): Promise<void> {
  const before = await page.evaluate(() => ({
    background: getComputedStyle(document.body).backgroundColor,
    href: document.querySelector<HTMLLinkElement>('link[rel="stylesheet"][href*="themes/"]')?.href,
  }));
  // Already wearing it · nothing to prove, and nothing to wait for.
  if (before.href?.includes(`${theme}.css`)) return;

  await page.evaluate(async (name) => {
    const link = document.querySelector<HTMLLinkElement>('link[rel="stylesheet"][href*="themes/"]');
    if (!link) throw new Error('this deck has no theme stylesheet to swap');
    await new Promise((resolve, reject) => {
      link.addEventListener('load', resolve, { once: true });
      link.addEventListener('error', () => reject(new Error(`theme ${name} failed to load`)), {
        once: true,
      });
      link.href = link.href.replace(/themes\/[\w-]+\.css/, `themes/${name}.css`);
    });
  }, theme);

  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(
    () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))),
  );

  const after = await page.evaluate(() => ({
    background: getComputedStyle(document.body).backgroundColor,
    href: document.querySelector<HTMLLinkElement>('link[rel="stylesheet"][href*="themes/"]')?.href,
  }));
  expect(after.href, 'the stylesheet href still points elsewhere').toContain(`${theme}.css`);
  // The shipped themes have different page surfaces, so a real swap moves it.
  // This is what stops the matrix from silently testing one theme twice.
  expect(after.background, `switching to ${theme} did not repaint the page`).not.toBe(
    before.background,
  );
}
