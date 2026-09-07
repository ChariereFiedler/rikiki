// ════════════════════════════════════════════════════════════════
// RIKIKI · domain · deep links
//
// Pure. No DOM, no Lit, no globals. See docs/design/adr-001-deck-navigation-domain.md.
//
// Two hash grammars, one per navigation model:
//   linear   #4        slide 4          #4.2      slide 4, step 2
//   2D       #2.3      chapter 2, slide 3         #2.3s1  … step 1
//
// Both are 1-based in the URL and 0-based in the model · a reader types the
// number they see in the counter.
//
// The write side used to emit the LINEAR form even for a 2D deck, so a 2D deck
// with steps wrote `#3.1` and read it back as "chapter 3, slide 1". The round
// trip landed somewhere else. formatHash now follows the same grammar it parses.
// ════════════════════════════════════════════════════════════════

import type { DeckCoords, DeckPosition } from './deck-outline.js';

const TWO_D = /^#(\d+)\.(\d+)(?:s(\d+))?$/;
const LINEAR = /^#(\d+)(?:\.(\d+))?$/;

/** What a hash asked for · one of the two grammars, or null if it is not ours
 *  (a plain page anchor, an empty hash, anything else). */
export type DeckLink =
  | { readonly kind: 'slide'; readonly slide: number; readonly step: number }
  | { readonly kind: 'coords'; readonly coords: DeckCoords; readonly step: number };

/** Parse a location hash. `twoD` selects the grammar, because `#2.3` means
 *  different things in the two models and neither is a superset of the other. */
export function parseHash(hash: string, twoD: boolean): DeckLink | null {
  if (twoD) {
    const m = TWO_D.exec(hash);
    if (m) {
      return {
        kind: 'coords',
        coords: { chapter: Number(m[1]) - 1, index: Number(m[2]) - 1 },
        step: m[3] ? Number(m[3]) : 0,
      };
    }
  }
  const m = LINEAR.exec(hash);
  if (!m) return null;
  return { kind: 'slide', slide: Number(m[1]) - 1, step: m[2] ? Number(m[2]) : 0 };
}

/** The hash for a position · in the grammar `parseHash` will read it back with.
 *  `coords` is required for a 2D deck and ignored otherwise. */
export function formatHash(
  position: DeckPosition,
  options: { twoD: boolean; coords?: DeckCoords },
): string {
  if (options.twoD && options.coords) {
    const { chapter, index } = options.coords;
    const step = position.step > 0 ? `s${position.step}` : '';
    return `#${chapter + 1}.${index + 1}${step}`;
  }
  return `#${position.slide + 1}${position.step > 0 ? `.${position.step}` : ''}`;
}
