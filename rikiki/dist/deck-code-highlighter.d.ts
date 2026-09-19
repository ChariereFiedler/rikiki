import type { DeckCodeHighlighter } from './deck-code.js';
export type { DeckCodeHighlighter };
/** Register (or, with null, remove) a custom highlighter shared by every
 *  `<deck-code>`. The function returns the block's inner HTML, or null to fall
 *  back to the built-in regex highlighter. Re-highlights existing instances. */
export declare function setDeckCodeHighlighter(fn: DeckCodeHighlighter | null): void;
