/** The logical canvas the deck composes on. */
export interface Canvas {
    readonly width: number;
    readonly height: number;
}
/** The box the canvas is displayed in, in CSS pixels. */
export interface Box {
    readonly width: number;
    readonly height: number;
}
/** Zoom factor plus the offset of the stage from its centred position. */
export interface Viewport {
    readonly zoom: number;
    readonly panX: number;
    readonly panY: number;
}
export declare const FIT: Viewport;
/** Scale at which the canvas exactly fits its box · the deck's "1x". */
export declare function fitScale(canvas: Canvas, box: Box): number;
/** How far the stage may slide before showing empty space beside the canvas.
 *  Zero on an axis the canvas does not overflow · nothing to pan there. */
export declare function panBounds(canvas: Canvas, box: Box, zoom: number): {
    x: number;
    y: number;
};
/** Keep the pan inside its bounds · the invariant every pan and zoom returns
 *  under, so the reader can never drag the slide off screen. */
export declare function clampPan(view: Viewport, canvas: Canvas, box: Box): Viewport;
export interface ZoomLimits {
    /** Never below 1 · the deck does not zoom out past fit. */
    readonly max: number;
}
/**
 * Zoom by `factor` while keeping the point at (cx, cy) under the cursor.
 *
 * Coordinates are relative to the centre of the display box, which is where the
 * stage transform originates. Returns the same viewport when the factor would
 * take it past a limit it already sits on, so a caller can skip the work.
 */
export declare function zoomAt(view: Viewport, factor: number, cx: number, cy: number, canvas: Canvas, box: Box, limits: ZoomLimits): Viewport;
export declare function panBy(view: Viewport, dx: number, dy: number, canvas: Canvas, box: Box): Viewport;
export declare const isAtFit: (view: Viewport) => boolean;
