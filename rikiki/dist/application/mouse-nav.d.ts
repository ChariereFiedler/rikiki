/** The pointer mechanisms a deck can claim. */
export type MouseMechanism = 'click' | 'wheel' | 'arrows' | 'aux';
export declare const MOUSE_MECHANISMS: readonly MouseMechanism[];
/**
 * Is `mechanism` enabled by this `mouse-nav` value?
 *
 * Absent or `all` enables everything (the default), `none` disables everything,
 * and anything else is a space-separated allowlist. An unknown word simply
 * matches nothing, so `mouse-nav="whel"` disables the wheel rather than
 * silently enabling it.
 */
export declare function mouseEnabled(raw: string | null | undefined, mechanism: MouseMechanism): boolean;
