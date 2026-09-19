import type { DeckCoords, DeckPosition } from './deck-outline.js';
/** What a hash asked for · one of the two grammars, or null if it is not ours
 *  (a plain page anchor, an empty hash, anything else). */
export type DeckLink = {
    readonly kind: 'slide';
    readonly slide: number;
    readonly step: number;
} | {
    readonly kind: 'coords';
    readonly coords: DeckCoords;
    readonly step: number;
};
/** Parse a location hash. `twoD` selects the grammar, because `#2.3` means
 *  different things in the two models and neither is a superset of the other. */
export declare function parseHash(hash: string, twoD: boolean): DeckLink | null;
/** The hash for a position · in the grammar `parseHash` will read it back with.
 *  `coords` is required for a 2D deck and ignored otherwise. */
export declare function formatHash(position: DeckPosition, options: {
    twoD: boolean;
    coords?: DeckCoords;
}): string;
