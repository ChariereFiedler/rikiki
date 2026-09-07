import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { WCAG_AA, contrastRatio, readTokens, resolveColor } from '../src/shared/contrast.ts';

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
