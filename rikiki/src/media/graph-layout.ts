// ════════════════════════════════════════════════════════════════
// RIKIKI · graph geometry for <deck-graph>
//
// Pure and DOM-free. Placing nodes and routing edges is arithmetic, and it is
// the part most likely to be wrong in a way nobody notices until the slide is
// on a wall · so it is a unit test, not a squint.
// ════════════════════════════════════════════════════════════════

export interface Point {
  readonly x: number;
  readonly y: number;
}

export type GraphLayout = 'free' | 'row' | 'column';

const clamp = (n: number): number => {
  if (!Number.isFinite(n)) return 50;
  return Math.max(0, Math.min(100, n));
};

/** Read an `at="x,y"` attribute · null when it is absent or unreadable, so the
 *  caller can fall back to an arrangement rather than pinning to a corner. */
export function parsePoint(raw: string | null | undefined): Point | null {
  if (!raw) return null;
  const [x = '', y = ''] = raw.split(',');
  if (x.trim() === '' || y.trim() === '') return null;
  const px = Number(x);
  const py = Number(y);
  if (!Number.isFinite(px) || !Number.isFinite(py)) return null;
  return { x: clamp(px), y: clamp(py) };
}

/**
 * Resolve a position for every node.
 *
 * `free` honours what the author wrote and centres anything unwritten. `row`
 * and `column` space the nodes evenly and ignore `at` entirely · the two cases
 * that would otherwise be typed out by hand on every chain diagram.
 *
 * The inset keeps the first and last node off the edge, where their labels
 * would be cut by the slide padding.
 */
export function arrange(
  raw: readonly (string | null)[],
  layout: GraphLayout = 'free',
  inset = 12,
): Point[] {
  const n = raw.length;
  if (n === 0) return [];
  if (layout === 'free') {
    return raw.map((value) => parsePoint(value) ?? { x: 50, y: 50 });
  }
  const span = 100 - inset * 2;
  return raw.map((_, i) => {
    const t = n === 1 ? 0.5 : i / (n - 1);
    const along = inset + span * t;
    return layout === 'row' ? { x: along, y: 50 } : { x: 50, y: along };
  });
}

export interface EdgeGeometry {
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
  /** Midpoint, where a label sits. */
  readonly mx: number;
  readonly my: number;
}

/**
 * The segment between two nodes, shortened at both ends.
 *
 * The gap is what stops a line from running under a label · without it every
 * edge appears to strike through the word it connects.
 */
export function edgeGeometry(from: Point, to: Point, gap = 6): EdgeGeometry {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy);
  if (length === 0) {
    return { x1: from.x, y1: from.y, x2: to.x, y2: to.y, mx: from.x, my: from.y };
  }
  // Never eat more than a third of the edge · two close nodes would otherwise
  // end up with no visible line at all.
  const trim = Math.min(gap, length / 3);
  const ux = dx / length;
  const uy = dy / length;
  return {
    x1: from.x + ux * trim,
    y1: from.y + uy * trim,
    x2: to.x - ux * trim,
    y2: to.y - uy * trim,
    mx: (from.x + to.x) / 2,
    my: (from.y + to.y) / 2,
  };
}
