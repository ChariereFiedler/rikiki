// ════════════════════════════════════════════════════════════════
// Public hook to override <deck-code> syntax highlighting.
//
// Kept in its own module · with no custom-element definition · so both the
// opt-in Shiki plugin and a deck author can import it without esbuild inlining a
// second copy of <deck-code> (which would double-define the element). It reaches
// the component through the shared custom-element registry, not a value import.
// ════════════════════════════════════════════════════════════════

import type { DeckCodeHighlighter } from './deck-code.js';

export type { DeckCodeHighlighter };

interface DeckCodeClass {
  highlighter: DeckCodeHighlighter | null;
  rehighlightAll(): void;
}

/** Register (or, with null, remove) a custom highlighter shared by every
 *  `<deck-code>`. The function returns the block's inner HTML, or null to fall
 *  back to the built-in regex highlighter. Re-highlights existing instances. */
export function setDeckCodeHighlighter(fn: DeckCodeHighlighter | null): void {
  const ctor = customElements.get('deck-code') as unknown as DeckCodeClass | undefined;
  if (!ctor) {
    console.warn('[rikiki/deck-code] <deck-code> is not defined yet · import rikiki first');
    return;
  }
  ctor.highlighter = fn;
  ctor.rehighlightAll();
}
