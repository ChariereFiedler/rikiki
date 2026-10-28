// ════════════════════════════════════════════════════════════════
// Does a painted box leave its container, or land on top of a sibling?
//
// Pure rect arithmetic, kept out of `check.mjs` for the same reason as
// `graph-hit.mjs`: the answer is the whole diagnostic, so the thresholds
// belong beside tests that pin them, not scattered through the DOM walk that
// calls them.
//
// The functions are also serialized into the browser by `check.mjs` (see
// BOX_GEOMETRY_READER), so they must stay self-contained: no imports, no
// closure over anything in this module.
// ════════════════════════════════════════════════════════════════

/**
 * How far `rect` sits outside `container`, per side and at its worst side.
 *
 * Only the sides where `rect` actually spills are counted · a box that sits
 * fully inside its container reports zero on every side, whatever slack it
 * leaves.
 */
export function escapeOf(rect, container) {
  const sides = {
    left: Math.max(0, container.left - rect.left),
    right: Math.max(0, rect.right - container.right),
    top: Math.max(0, container.top - rect.top),
    bottom: Math.max(0, rect.bottom - container.bottom),
  };
  return { pixels: Math.max(sides.left, sides.right, sides.top, sides.bottom), sides };
}

/**
 * How much two rects intersect, on each axis.
 *
 * A negative value means the rects do not touch on that axis at all · the
 * caller compares both axes against its own tolerance rather than this
 * function deciding what counts as an overlap.
 */
export function overlapOf(a, b) {
  return {
    x: Math.min(a.right, b.right) - Math.max(a.left, b.left),
    y: Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top),
  };
}

/**
 * Does `outer` fully contain `inner`, within `tolerance` px on each side?
 *
 * The tolerance absorbs sub-pixel layout rounding · two rects that agree to
 * the pixel should not read as "neither encloses the other".
 */
export function encloses(outer, inner, tolerance = 1) {
  return (
    outer.left <= inner.left + tolerance &&
    outer.right >= inner.right - tolerance &&
    outer.top <= inner.top + tolerance &&
    outer.bottom >= inner.bottom - tolerance
  );
}

/**
 * The screen rect of an SVG box once `matrix` has moved it.
 *
 * `box` is what `getBBox()` returns (`x`, `y`, `width`, `height` in the
 * element's own user space) and `matrix` what `getScreenCTM()` returns (`a` to
 * `f`). A rotation or a skew turns the box into a quad · its four corners are
 * mapped and the rect that holds them is returned, which is what the eye
 * compares against the shape around it.
 */
export function mapBox(box, matrix) {
  const corners = [
    [box.x, box.y],
    [box.x + box.width, box.y],
    [box.x, box.y + box.height],
    [box.x + box.width, box.y + box.height],
  ].map(([x, y]) => ({
    x: matrix.a * x + matrix.c * y + matrix.e,
    y: matrix.b * x + matrix.d * y + matrix.f,
  }));
  const xs = corners.map((p) => p.x);
  const ys = corners.map((p) => p.y);
  return { left: Math.min(...xs), right: Math.max(...xs), top: Math.min(...ys), bottom: Math.max(...ys) };
}

/**
 * The smallest of `rects` that holds `point`, or null when none does.
 *
 * This is how a drawn label finds the shape it was written into: of every
 * rect around its anchor, the tightest one is the card or the pill, and the
 * larger ones are the panels behind it. The rect returned is the caller's own
 * object, extra fields and all.
 */
export function smallestContaining(rects, point) {
  let best = null;
  let bestArea = Number.POSITIVE_INFINITY;
  for (const rect of rects) {
    const holds = rect.left <= point.x && point.x <= rect.right && rect.top <= point.y && point.y <= rect.bottom;
    if (!holds) continue;
    const area = (rect.right - rect.left) * (rect.bottom - rect.top);
    if (area < bestArea) {
      best = rect;
      bestArea = area;
    }
  }
  return best;
}

/** The same functions, as source, for `page.evaluate` · the inspector runs in
 *  the browser and cannot import from here. */
export const BOX_GEOMETRY_READER = `({
  escapeOf: ${escapeOf},
  overlapOf: ${overlapOf},
  encloses: ${encloses},
  mapBox: ${mapBox},
  smallestContaining: ${smallestContaining},
})`;
