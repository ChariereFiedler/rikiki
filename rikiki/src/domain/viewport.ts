// ════════════════════════════════════════════════════════════════
// RIKIKI · domain · zoom and pan arithmetic
//
// Pure. No DOM, no Lit, no globals. See docs/design/adr-001-deck-navigation-domain.md.
//
// The engine measures the boxes and applies the result as custom properties;
// the arithmetic that decides WHERE the stage sits lives here, so "does the pan
// stay inside the canvas at 4x on a portrait window?" is a unit test.
// ════════════════════════════════════════════════════════════════

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

export const FIT: Viewport = { zoom: 1, panX: 0, panY: 0 };

/** Scale at which the canvas exactly fits its box · the deck's "1x". */
export function fitScale(canvas: Canvas, box: Box): number {
  if (!box.width || !box.height || !canvas.width || !canvas.height) return 1;
  return Math.min(box.width / canvas.width, box.height / canvas.height);
}

/** How far the stage may slide before showing empty space beside the canvas.
 *  Zero on an axis the canvas does not overflow · nothing to pan there. */
export function panBounds(canvas: Canvas, box: Box, zoom: number): { x: number; y: number } {
  const scale = fitScale(canvas, box) * zoom;
  return {
    x: Math.max(0, (canvas.width * scale - box.width) / 2),
    y: Math.max(0, (canvas.height * scale - box.height) / 2),
  };
}

/** Keep the pan inside its bounds · the invariant every pan and zoom returns
 *  under, so the reader can never drag the slide off screen. */
export function clampPan(view: Viewport, canvas: Canvas, box: Box): Viewport {
  const bounds = panBounds(canvas, box, view.zoom);
  return {
    zoom: view.zoom,
    panX: Math.max(-bounds.x, Math.min(bounds.x, view.panX)),
    panY: Math.max(-bounds.y, Math.min(bounds.y, view.panY)),
  };
}

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
export function zoomAt(
  view: Viewport,
  factor: number,
  cx: number,
  cy: number,
  canvas: Canvas,
  box: Box,
  limits: ZoomLimits,
): Viewport {
  const zoom = Math.max(1, Math.min(limits.max, view.zoom * factor));
  if (zoom === view.zoom) return view;
  // Move the pan so the anchor point does not drift as the scale changes.
  const ratio = zoom / view.zoom;
  return clampPan(
    {
      zoom,
      panX: view.panX + (cx - view.panX) * (1 - ratio),
      panY: view.panY + (cy - view.panY) * (1 - ratio),
    },
    canvas,
    box,
  );
}

export function panBy(view: Viewport, dx: number, dy: number, canvas: Canvas, box: Box): Viewport {
  return clampPan({ zoom: view.zoom, panX: view.panX + dx, panY: view.panY + dy }, canvas, box);
}

export const isAtFit = (view: Viewport): boolean =>
  view.zoom === 1 && view.panX === 0 && view.panY === 0;
