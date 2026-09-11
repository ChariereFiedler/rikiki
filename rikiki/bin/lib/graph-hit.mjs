// ════════════════════════════════════════════════════════════════
// Does a painted graph edge cross a node it does not connect?
//
// Pure arithmetic, kept out of `check.mjs` because the answer is the whole
// diagnostic: an edge check that is a few pixels too forgiving reports nothing
// on a crossing anybody can see from the back of the room, and a check nobody
// trusts costs more than no check at all.
//
// The functions are also serialized into the browser by `check.mjs` (see
// GRAPH_GEOMETRY_READER), so they must stay self-contained: no imports, no
// closure over anything in this module.
// ════════════════════════════════════════════════════════════════

/**
 * Read the `data-path` that `deck-graph` publishes on each `deck-edge`:
 * `"x1,y1 x2,y2[ x3,y3 ...]"` in graph-relative CSS pixels.
 *
 * Returns `[]` for anything it cannot read whole · half a polyline would be
 * tested as a shorter edge and quietly miss, which is the failure this module
 * exists to end. The caller falls back to its own geometry instead.
 */
export function parseGraphPath(raw) {
  if (typeof raw !== 'string' || !raw.trim()) return [];
  const points = [];
  for (const pair of raw.trim().split(/\s+/)) {
    const [x, y] = pair.split(',').map(Number);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return [];
    points.push({ x, y });
  }
  return points.length >= 2 ? points : [];
}

/**
 * Does a polyline put ink inside a rectangle?
 *
 * `margin` grows the rectangle before the test. It carries the half width of
 * the stroke: an edge is a band, not a mathematical line, so a centre line
 * that misses a node by one pixel still paints over it. Growing the rectangle
 * rather than fattening the segment squares off the band's corners, which errs
 * towards reporting · the right direction for a check whose only known defect
 * was staying silent.
 */
export function polylineHitsRect(points, rect, margin = 0) {
  const box = {
    left: rect.left - margin,
    right: rect.right + margin,
    top: rect.top - margin,
    bottom: rect.bottom + margin,
  };
  if (box.left >= box.right || box.top >= box.bottom) return false;
  // Liang-Barsky: a segment hits when a slice of its parameter range survives
  // all four half-planes of the box.
  const segmentHits = (a, b) => {
    let t0 = 0;
    let t1 = 1;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    for (const [p, q] of [
      [-dx, a.x - box.left],
      [dx, box.right - a.x],
      [-dy, a.y - box.top],
      [dy, box.bottom - a.y],
    ]) {
      if (p === 0) {
        if (q < 0) return false;
        continue;
      }
      const t = q / p;
      if (p < 0) t0 = Math.max(t0, t);
      else t1 = Math.min(t1, t);
      if (t0 > t1) return false;
    }
    return true;
  };
  for (let i = 0; i + 1 < points.length; i++) {
    if (segmentHits(points[i], points[i + 1])) return true;
  }
  return false;
}

/** The same two functions, as source, for `page.evaluate` · the inspector runs
 *  in the browser and cannot import from here. */
export const GRAPH_GEOMETRY_READER = `({
  parseGraphPath: ${parseGraphPath},
  polylineHitsRect: ${polylineHitsRect},
})`;
