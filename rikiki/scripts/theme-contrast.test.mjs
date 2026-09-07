import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  DELTA_E_DISTINCT,
  WCAG_AA,
  contrastRatio,
  deltaE,
  flatten,
  isOpaque,
  readTokens,
  resolveColor,
} from '../src/shared/contrast.ts';
import { ROOT } from './css-source.mjs';
import { citeSite, isStateSurface, isThin, paintedSurfaces } from './paint-surfaces.mjs';

// The contrast contract · measured from the theme files, never copied by hand.
//
// Status tones are rendered by deck-punch and deck-stat, whose type scale is
// large text throughout (lead/big/mega/stat/display), so the applicable
// threshold is WCAG AA large text. Every tone must clear it on the page surface
// in BOTH themes. A theme that ships a tone below it goes red here.

const THEMES = ['rikiki', 'siliceum'];

/** Every token the tone tables route to · keep in sync with the TONES maps in
 *  src/atoms/deck-punch.ts and src/molecules/deck-stat.ts. */
const TONE_TOKENS = [
  '--rik-status-success__text',
  '--rik-status-warn__text',
  '--rik-status-danger__text',
  '--rik-accent__text',
  '--rik-decor-orchid__text',
  '--rik-decor-lime__text',
  '--rik-decor-canary__text',
];

describe.each(THEMES)('theme %s · status tones', (theme) => {
  const tokens = readTokens(readFileSync(`themes/${theme}.css`, 'utf8'));
  const page = resolveColor(tokens, '--rik-surface-page');

  it('defines a page surface to measure against', () => {
    expect(page).not.toBeNull();
  });

  it.each(TONE_TOKENS)('%s clears the large-text threshold on the page surface', (token) => {
    const color = resolveColor(tokens, token);
    expect(color, `${token} is undefined in themes/${theme}.css`).not.toBeNull();
    const ratio = contrastRatio(color, page);
    expect(
      ratio,
      `${token} on --rik-surface-page is ${ratio.toFixed(2)}:1 in themes/${theme}.css`,
    ).toBeGreaterThanOrEqual(WCAG_AA.largeText);
  });
});

// ────────────────────────────────────────────────────────────────
// State surfaces · a fill that claims to mean something must be seen
//
// Three visual defects in a row had the same shape: a component painted a state
// (a marked row, a toned tile, an active step) with a surface the eye cannot
// tell from the page, and every test stayed green because no test looked. The
// list of tokens is DERIVED from the stylesheets, components and themes alike,
// so it cannot rot; the threshold is a standard, not a preference.
//
// A surface passes on either axis, and it needs only one:
//   luminance · the WCAG non-text ratio of 3:1, which catches the grey tints
//   colour    · CIE76 delta E of 10, which is what makes a saturated accent
//               legible on paper despite scoring 1.48 on the luminance axis
// ────────────────────────────────────────────────────────────────

describe.each(THEMES)('theme %s · state surfaces', (theme) => {
  const tokens = readTokens(readFileSync(`themes/${theme}.css`, 'utf8'));
  const page = resolveColor(tokens, '--rik-surface-page');
  const painted = paintedSurfaces();

  /** Every state site of every painted token, flattened for iteration. */
  const sites = [...painted].flatMap(([token, all]) =>
    all
      .filter(isStateSurface)
      .filter((s) => !isThin(s))
      .map((site) => ({ token, site })),
  );

  it('finds state surfaces to check', () => {
    // Anti-vacuity: a refactor that renames the state attributes, or a bug in
    // the derivation, must fail here rather than silently check nothing.
    expect(sites.length).toBeGreaterThan(10);
  });

  it.each(
    sites.map((s) => [`${s.token} @ ${citeSite(s.site, ROOT)}`, s]),
  )('%s is distinguishable from the page', (_label, { token, site }) => {
    const color = resolveColor(tokens, token);
    expect(color, `${token} is undefined in themes/${theme}.css`).not.toBeNull();
    const seen = isOpaque(color) ? color : flatten(color, page);
    const ratio = contrastRatio(seen, page);
    const difference = deltaE(seen, page);
    expect(
      ratio >= WCAG_AA.uiComponent || difference >= DELTA_E_DISTINCT,
      `${token} painted at ${citeSite(site, ROOT)} is ${ratio.toFixed(2)}:1 and ` +
        `delta E ${difference.toFixed(1)} against the page in themes/${theme}.css · ` +
        'a state the audience cannot see is not a state. Repaint it, or mark the ' +
        'declaration /* thin */ if it draws a line rather than a surface.',
    ).toBe(true);
  });
});
