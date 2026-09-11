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

/** The same three functions, as source, for `page.evaluate` · the inspector
 *  runs in the browser and cannot import from here. */
export const BOX_GEOMETRY_READER = `({
  escapeOf: ${escapeOf},
  overlapOf: ${overlapOf},
  encloses: ${encloses},
})`;
