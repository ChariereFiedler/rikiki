export interface Rgb {
    r: number;
    g: number;
    b: number;
    /** 0 to 1 · absent means fully opaque. A translucent color has NO contrast
     *  ratio of its own, only one against a named backdrop · see flatten(). */
    a?: number;
}
/** Parse `#abc`, `#abcd`, `#aabbcc`, `#aabbccdd`, `rgb(…)` or `rgba(…)` ·
 *  null for anything else. Alpha is CARRIED, not dropped: a value read as
 *  opaque when it is not turns a 1.1 contrast into a 20 and makes any guard
 *  built on it a lie. */
export declare function parseColor(value: string): Rgb | null;
/** True when the color is fully opaque, so it has a luminance of its own. */
export declare function isOpaque(color: Rgb): boolean;
/** Composite `fg` over `bg` (source-over) · the color the eye actually sees.
 *  `bg` must be opaque; a translucent backdrop has no single answer. */
export declare function flatten(fg: Rgb, bg: Rgb): Rgb;
/** WCAG 2.1 relative luminance, 0 (black) to 1 (white). */
export declare function relativeLuminance({ r, g, b }: Rgb): number;
/** WCAG 2.1 contrast ratio between two colors · 1 to 21, order-independent. */
export declare function contrastRatio(a: Rgb, b: Rgb): number;
/**
 * CIE76 colour difference between two opaque colours.
 *
 * WHY THIS EXISTS ALONGSIDE contrastRatio · the WCAG ratio is luminance only,
 * so it cannot tell a saturated accent from the paper it sits on: the mango
 * accent scores 1.48 against the siliceum page and is nonetheless one of the
 * most visible things on the slide. Judging a SURFACE by luminance alone would
 * condemn every colour-coded tile and miss none of the grey ones. A surface is
 * distinguishable when it wins on either axis.
 *
 * The threshold used across this repo is DELTA_E_DISTINCT, below.
 */
export declare function deltaE(a: Rgb, b: Rgb): number;
/** Clearly perceptible between two large adjacent areas · the easiest case for
 *  the eye, and the one a slide always presents. Not a taste threshold. */
export declare const DELTA_E_DISTINCT = 10;
/** Collect every `--name: value;` declaration in a stylesheet · later
 *  declarations win, matching the cascade for a single theme file. */
export declare function readTokens(css: string): Map<string, string>;
/** Follow a `var(--a, fallback)` chain down to a literal color.
 *  Returns null on an unresolvable or cyclic reference. */
export declare function resolveToken(tokens: Map<string, string>, name: string, seen?: Set<string>): string | null;
/** Resolve a token straight to RGB · null when it is missing or not a color. */
export declare function resolveColor(tokens: Map<string, string>, name: string): Rgb | null;
/** WCAG 2.1 minimum ratios. Large text is >= 24px, or >= 18.66px bold. */
export declare const WCAG_AA: {
    readonly normalText: 4.5;
    readonly largeText: 3;
    readonly uiComponent: 3;
};
