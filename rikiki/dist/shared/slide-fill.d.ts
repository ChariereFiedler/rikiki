/** The `spread` vocabulary, and the flexbox value each one means. */
export declare const SPREAD: Map<string, string>;
/** Resolve a `spread` attribute to its flexbox value.
 *
 *  An unknown value falls back to the default distribution instead of being
 *  passed through: a typo must degrade to the documented default, never remove
 *  the layout it was meant to change. */
export declare function spreadValue(raw: string | null | undefined): string;
