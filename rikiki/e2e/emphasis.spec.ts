// ════════════════════════════════════════════════════════════════
// What a slide paints as emphasis has to be visible
//
// Three visual defects in a row had the same shape: a component filled a state
// with a surface the eye cannot tell from the page, and every test stayed green
// because no test ever looked at a pixel. scripts/theme-contrast.test.mjs
// catches this at the token level; this catches what a token cannot say · the
// fill measured against its OWN backdrop rather than against the page, at the
// size it is actually painted, whatever alpha and stacking did to it on the way.
//
// Chromium only, by design: colour is not an engine-variance question, and one
// screenshot per emphasis is not worth paying for three times.
// ════════════════════════════════════════════════════════════════

import { expect, test } from '@playwright/test';
import {
  DELTA_E_DISTINCT,
  WCAG_AA,
  contrastRatio,
  deltaE,
  flatten,
  isOpaque,
  parseColor,
} from '../src/shared/contrast.js';
import { createDeckPage } from './pages/deck.page';
import { settled } from './support/settle';
import { type Box, sampleAround } from './support/ink';
import { THEMES, useTheme } from './support/theme';

// A ratchet, not a target · `fills` is how many painted emphases the deck
// exercises today. Adding one raises the number; nothing may lower it. Without
// it this whole file is one deleted fixture slide away from measuring nothing
// and reporting success, which is exactly how the suite that preceded it missed
// three visual defects in a row.
const DECKS = [
  { path: '/rikiki/decks/tests/extras-more.html', fills: 9 },
  { path: '/rikiki/decks/tests/extensions.html', fills: 4 },
];

/** The attributes a component sets to say "this one is different". Kept in
 *  step with STATE_ATTRIBUTE in scripts/paint-surfaces.mjs. */
const STATE_SELECTOR =
  '[data-mark],[tone],[color],[active],[winner],[boxed],[current],[done],[selected]';

/** A fill only owes the eye a contrast once it is big enough to be a surface ·
 *  a 3px rule excludes itself by its own geometry, with no annotation. */
const MIN_AREA_SHARE = 0.01;
const MIN_SIDE = 8;

// Two elements are deliberately out of scope, and neither is an oversight.
//
// A state carried by TYPE rather than by a fill · a marked column that goes
// accent-coloured and bold, a milestone whose tone is a dot. Those paint no
// background, so there is no fill to measure, and demanding one would push
// every component back towards the tinted tiles this whole effort removed.
// Only an element that CLAIMS a fill is measured, and the claim is read from
// its computed background rather than guessed.
//
// The slide itself · `[active]` marks the current slide, which paints the
// resting page surface. That is the backdrop everything else is measured
// against, not an emphasis competing with it.

interface Candidate {
  label: string;
  box: Box;
  color: string;
  hasText: boolean;
}

/** Every emphasised element on the active slide, shadow roots included. */
async function emphasised(page: import('@playwright/test').Page): Promise<Candidate[]> {
  return page.evaluate(
    ({ selector, minShare, minSide }) => {
      const slide = document.querySelector('deck-root > [active]');
      if (!slide) return [];
      const slideBox = slide.getBoundingClientRect();
      const area = slideBox.width * slideBox.height;

      const found: Element[] = [];
      const walk = (root: ParentNode): void => {
        for (const el of root.querySelectorAll('*')) {
          if (el.matches(selector)) found.push(el);
          if (el.shadowRoot) walk(el.shadowRoot);
        }
      };
      walk(slide);

      /** Does this element paint a background of its own? */
      const paintsFill = (style: CSSStyleDeclaration): boolean => {
        if (style.backgroundImage !== 'none') return true;
        const bg = style.backgroundColor;
        const alpha = /rgba?\([^)]*[,/]\s*([\d.]+)\s*\)/.exec(bg);
        return bg !== 'transparent' && (alpha === null || Number(alpha[1]) > 0);
      };

      // A state element does not always paint its own fill: a marked table row
      // carries the attribute while its cells carry the band. When the element
      // paints nothing, its painted children stand in for it · without this the
      // canonical case, the emphasised row, is silently never measured.
      const painted = found.flatMap((el) =>
        paintsFill(getComputedStyle(el))
          ? [{ el, via: '' }]
          : [...el.children]
              .filter((child) => paintsFill(getComputedStyle(child)))
              .map((child) => ({ el: child, via: `${el.tagName.toLowerCase()} > ` })),
      );

      return painted
        .map(({ el, via }) => {
          const rect = el.getBoundingClientRect();
          const style = getComputedStyle(el);
          const attrs = [...el.attributes]
            .filter((a) => a.name !== 'style' && a.name !== 'class')
            .map((a) => (a.value ? `${a.name}="${a.value}"` : a.name))
            .join(' ');
          return {
            label: `${via}${el.tagName.toLowerCase()}[${attrs}]`,
            box: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
            color: style.color,
            hasText: (el.textContent ?? '').trim().length > 0,
            share: (rect.width * rect.height) / area,
          };
        })
        .filter(
          (c) => c.share >= minShare && c.box.width >= minSide && c.box.height >= minSide,
        )
        .map(({ share: _share, ...rest }) => rest);
    },
    { selector: STATE_SELECTOR, minShare: MIN_AREA_SHARE, minSide: MIN_SIDE },
  );
}

/** True when the two colours are told apart on either axis · see deltaE(). */
function distinct(a: { r: number; g: number; b: number }, b: { r: number; g: number; b: number }) {
  return contrastRatio(a, b) >= WCAG_AA.uiComponent || deltaE(a, b) >= DELTA_E_DISTINCT;
}

for (const { path: deck, fills } of DECKS) {
  for (const theme of THEMES) {
    test(`emphasis reads on ${deck.split('/').pop()} under ${theme}`, async ({ page }) => {
      test.slow(); // one screenshot per emphasis across a whole deck · slow, not flaky
      const deckPage = createDeckPage(page);
      await deckPage.goto(deck);
      await useTheme(page, theme);

      // Every slide, and for a slide with steps its LAST step as well. Most
      // emphasis in this framework only exists once the speaker has advanced:
      // the active stage of a chain, the revealed row of a table. Looking only
      // at step 0 measured the neutral state of everything and called it a
      // pass.
      const stops = await page.evaluate(() =>
        [...document.querySelectorAll('deck-root > *')]
          .filter((el) => el.tagName.toLowerCase().startsWith('deck-'))
          .flatMap((el, i) => {
            const steps = Number(el.getAttribute('steps') ?? el.getAttribute('data-steps') ?? '0');
            return steps > 0 ? [`${i + 1}.0`, `${i + 1}.${steps}`] : [`${i + 1}.0`];
          }),
      );
      const failures: string[] = [];
      let measured = 0;

      for (const stop of stops) {
        await page.evaluate((h) => {
          location.hash = h;
        }, stop);
        await page.waitForFunction((h) => location.hash === `#${h}`, stop);
        await settled(page);
        const index = stop;

        for (const candidate of await emphasised(page)) {
          const { inside, ring } = await sampleAround(page, candidate.box);
          measured += 1;
          const where = `slide ${index} · ${candidate.label}`;
          if (!distinct(inside, ring)) {
            failures.push(
              `${where} · fill ${contrastRatio(inside, ring).toFixed(2)}:1 and delta E ` +
                `${deltaE(inside, ring).toFixed(1)} against its own backdrop`,
            );
          }
          if (candidate.hasText) {
            const text = parseColor(candidate.color);
            if (text) {
              const seen = isOpaque(text) ? text : flatten(text, inside);
              const ratio = contrastRatio(seen, inside);
              if (ratio < WCAG_AA.largeText) {
                failures.push(`${where} · text ${ratio.toFixed(2)}:1 on its own fill`);
              }
            }
          }
        }
      }

      expect(
        measured,
        `${deck} painted ${measured} emphases, ${fills} expected · if a fixture ` +
          'gained one, raise the number; never lower it to get a green run',
      ).toBeGreaterThanOrEqual(fills);
      expect(failures.join('\n')).toBe('');
    });
  }
}

// The detector, tested. Without this the whole file is one selector typo away
// from measuring nothing and reporting success · which is exactly how the 372
// tests that preceded it missed three visual defects in a row.
test('the detector calls a dead emphasis dead', async ({ page }) => {
  const deckPage = createDeckPage(page);
  await deckPage.goto('/rikiki/decks/tests/extras-more.html');
  // The exact colour deck-table shipped before the fix, reinjected through the
  // component's own knob. It is written as a literal on purpose: it used to be
  // --rik-status-info__bg, and that token has since been strengthened, so
  // naming the token here would quietly stop reproducing the defect and leave
  // this test proving nothing.
  await page.addStyleTag({
    content: 'deck-root { --deck-table-mark-bg: rgba(240, 112, 32, 0.06); }',
  });
  await page.evaluate(() => {
    location.hash = '#9.0';
  });
  await page.waitForFunction(() => document.querySelector('table[data-rik-table] tr[data-mark]'));
  await settled(page);

  const marked = await emphasised(page);
  const row = marked.find((c) => c.label.includes('tr > td'));
  expect(row, 'the marked row is found').toBeTruthy();
  const { inside, ring } = await sampleAround(page, row!.box);
  expect(
    distinct(inside, ring),
    `the historical tint measured ${contrastRatio(inside, ring).toFixed(2)}:1 and delta E ` +
      `${deltaE(inside, ring).toFixed(1)} · the detector must call that dead`,
  ).toBe(false);
});
