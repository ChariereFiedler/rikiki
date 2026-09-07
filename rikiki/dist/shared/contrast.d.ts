export interface Rgb {
    r: number;
    g: number;
    b: number;
}
/** Parse `#abc`, `#aabbcc`, `rgb(…)` or `rgba(…)` · null for anything else. */
export declare function parseColor(value: string): Rgb | null;
/** WCAG 2.1 relative luminance, 0 (black) to 1 (white). */
export declare function relativeLuminance({ r, g, b }: Rgb): number;
/** WCAG 2.1 contrast ratio between two colors · 1 to 21, order-independent. */
export declare function contrastRatio(a: Rgb, b: Rgb): number;
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
