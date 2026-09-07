import type { DeckOutline, DeckPosition, StepsOf } from '../domain/deck-outline.js';
/** The URL, as the application is allowed to see it. Implemented by the browser
 *  adapter; a test supplies a plain object. */
export interface LocationPort {
    /** The current fragment, `#` included, or an empty string. */
    read(): string;
    /** Replace the fragment without adding a history entry. Implementations
     *  swallow the SecurityError an opaque origin throws · see the adapter. */
    write(hash: string): void;
}
export interface DeepLinkContext {
    readonly outline: DeckOutline;
    readonly twoD: boolean;
    readonly stepsOf: StepsOf;
    /** False for an embedded deck · the fragment belongs to the host page. */
    readonly ownsUrl: boolean;
}
/**
 * The position the current URL asks for, or null when it asks for nothing.
 *
 * `coldLoad` matters: before the plugins have computed their step counts, the
 * model would clamp `#4.2` down to step 0 and lose the link. Until a count
 * exists the asked-for step is kept as-is; from then on it is clamped, so a
 * link to a click that no longer exists settles on the last available one.
 */
export declare function readDeepLink(port: LocationPort, ctx: DeepLinkContext, coldLoad?: boolean): DeckPosition | null;
/** Write a position to the URL, in the grammar `readDeepLink` will read back.
 *  A deck that does not own the URL writes nothing at all. */
export declare function publishDeepLink(port: LocationPort, position: DeckPosition, ctx: Pick<DeepLinkContext, 'outline' | 'twoD' | 'ownsUrl'>): void;
