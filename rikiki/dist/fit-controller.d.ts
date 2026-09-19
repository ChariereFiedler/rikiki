import type { ReactiveController, ReactiveControllerHost } from 'lit';
/** Largest size in [min, max] for which `fits(px)` holds, found by bisection.
 *  `fits` must be monotonic (true up to some threshold, false above). If even
 *  `min` overflows, returns `min` · a tiny clip beats vanishing text. Pure and
 *  DOM-free so the search is unit-testable with a mock predicate. */
export declare function bestFitSize(min: number, max: number, fits: (px: number) => boolean, epsilon?: number): number;
type FitHost = ReactiveControllerHost & HTMLElement;
export interface FitOptions {
    /** When false, the controller clears its sizing and stays idle. */
    enabled?: () => boolean;
    /** Floor size in rem (resolved against the root font-size). Default 1. */
    minRem?: () => number;
    /** Ceiling size in rem. Default 12. */
    maxRem?: () => number;
}
export declare class FitController implements ReactiveController {
    private host;
    private opts;
    private ro?;
    constructor(host: FitHost, opts?: FitOptions);
    hostConnected(): void;
    hostDisconnected(): void;
    /** Re-measure and size the host · safe to call after content or attribute
     *  changes (the host's updated() hook should call it). */
    refit(): void;
}
export {};
