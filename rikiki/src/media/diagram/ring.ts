// ════════════════════════════════════════════════════════════════
// RIKIKI · diagram, the ring engine
//
// Places a cycle of nodes on a circle: the first at the top, the next ones
// clockwise, at equal angles, in the order given. The radius is the smallest that
// keeps every two boxes `gap` apart (boxes, not points: a wide node needs more
// room than a dot) and that leaves a free zone in the middle at least as large as
// `centre`, for an annotation. The links follow the arc from one node to the next,
// leaving and entering each box on its edge. Coordinates are the content's own,
// its top-left corner at 0,0 · the caller decides where the ring sits in `bounds`.
// ════════════════════════════════════════════════════════════════

import type { Bounds, EngineResult, Placed, Point, Route, Size } from './types.js';

/** Fewer than three nodes is a pair or a dot, not a cycle; more than eight is a
 *  clock face nobody follows round. Placed anyway, and said. */
export const MIN_RING_NODES = 3;
export const MAX_RING_NODES = 8;

/** A difference of cosines below this is the float noise of two angles mirrored
 *  across an axis · it separates nothing. */
const AXIS_EPSILON = 1e-9;
/** A route takes a point at least every this many units of arc. */
const ROUTE_STEP = 24;
const ROUTE_MIN_POINTS = 8;
/** Samples taken along the arc to find where it leaves a box, before bisection
 *  narrows it down to the edge. */
const EDGE_SAMPLES = 64;
const EDGE_BISECTIONS = 48;
const TOP = -Math.PI / 2;

export interface RingNode {
  key: string;
  w: number;
  h: number;
}

export interface RingInput {
  nodes: RingNode[];
  bounds: Bounds;
  gap: number;
  /** Links the last node back to the first. */
  closed?: boolean;
  /** A zone kept free in the middle of the ring, centred on it. */
  centre?: Size;
}

export interface RingCentre extends Point {
  /** The radius the node centres sit on. */
  r: number;
  /** The free zone in the middle, `gap` away from every box · the shape of
   *  `centre` scaled up as far as the boxes allow, a square without one. */
  free: Size;
}

export interface RingResult extends EngineResult {
  centre: RingCentre;
  routes: Route[];
}

/** A box relative to the ring's centre. */
type Box = Placed;

const angleOf = (index: number, count: number) => TOP + (index * 2 * Math.PI) / count;
const format = (value: number) => Number(value.toFixed(1));

/** The radius at which two points `spread` apart per unit of radius are `need` apart. */
function clearing(need: number, spread: number): number {
  return spread > AXIS_EPSILON ? need / spread : Number.POSITIVE_INFINITY;
}

/** The least radius that keeps two boxes `gap` apart, on either axis. */
function pairRadius(a: RingNode, b: RingNode, angleA: number, angleB: number, gap: number) {
  const alongX = clearing((a.w + b.w) / 2 + gap, Math.abs(Math.cos(angleB) - Math.cos(angleA)));
  const alongY = clearing((a.h + b.h) / 2 + gap, Math.abs(Math.sin(angleB) - Math.sin(angleA)));
  return Math.min(alongX, alongY);
}

/** The least radius that keeps a box `gap` clear of the reserved zone in the middle. */
function centreRadius(node: RingNode, angle: number, centre: Size, gap: number) {
  const alongX = clearing((node.w + centre.w) / 2 + gap, Math.abs(Math.cos(angle)));
  const alongY = clearing((node.h + centre.h) / 2 + gap, Math.abs(Math.sin(angle)));
  return Math.min(alongX, alongY);
}

function ringRadius(nodes: RingNode[], gap: number, centre: Size | undefined): number {
  const n = nodes.length;
  let radius = 0;
  nodes.forEach((node, i) => {
    for (let j = i + 1; j < n; j++) {
      radius = Math.max(radius, pairRadius(node, nodes[j], angleOf(i, n), angleOf(j, n), gap));
    }
    if (centre) radius = Math.max(radius, centreRadius(node, angleOf(i, n), centre, gap));
  });
  return radius;
}

/** The largest zone of the given shape, centred, that stays `gap` clear of every box. */
function freeZone(boxes: Box[], gap: number, centre: Size | undefined): Size {
  if (!boxes.length) return centre ?? { w: 0, h: 0 };
  const shape = centre && centre.w > 0 && centre.h > 0 ? centre : { w: 1, h: 1 };
  const scales = boxes.map((box) => {
    const clearX = Math.abs(box.x + box.w / 2) - box.w / 2 - gap;
    const clearY = Math.abs(box.y + box.h / 2) - box.h / 2 - gap;
    return Math.max((2 * clearX) / shape.w, (2 * clearY) / shape.h);
  });
  const scale = Math.max(0, Math.min(...scales));
  return { w: scale * shape.w, h: scale * shape.h };
}

const onArc = (radius: number, angle: number): Point => ({
  x: radius * Math.cos(angle),
  y: radius * Math.sin(angle),
});

const inside = (p: Point, box: Box) =>
  p.x > box.x && p.x < box.x + box.w && p.y > box.y && p.y < box.y + box.h;

/** The angle, going from `from` towards `to`, where the arc first leaves `box`. */
function edgeAngle(box: Box, radius: number, from: number, to: number): number {
  let previous = from;
  for (let step = 0; step <= EDGE_SAMPLES; step++) {
    const angle = from + ((to - from) * step) / EDGE_SAMPLES;
    if (!inside(onArc(radius, angle), box)) return bisectEdge(box, radius, previous, angle);
    previous = angle;
  }
  return to;
}

function bisectEdge(box: Box, radius: number, within: number, beyond: number): number {
  let [a, b] = [within, beyond];
  for (let i = 0; i < EDGE_BISECTIONS; i++) {
    const middle = (a + b) / 2;
    if (inside(onArc(radius, middle), box)) a = middle;
    else b = middle;
  }
  return b;
}

/** The arc from box `a` (at `angleA`) to box `b`, clockwise, edge to edge. */
function arcPoints(a: Box, b: Box, radius: number, angleA: number, angleB: number): Point[] {
  const start = edgeAngle(a, radius, angleA, angleB);
  const end = Math.max(start, edgeAngle(b, radius, angleB, angleA));
  const count = Math.max(ROUTE_MIN_POINTS, Math.ceil((radius * (end - start)) / ROUTE_STEP) + 1);
  return Array.from({ length: count }, (_, i) =>
    onArc(radius, start + ((end - start) * i) / (count - 1)),
  );
}

/** Whether the segment p–q passes through the inside of `box` (touching is not). */
function crosses(p: Point, q: Point, box: Box): boolean {
  const dx = q.x - p.x;
  const dy = q.y - p.y;
  const sides: [number, number][] = [
    [-dx, p.x - box.x],
    [dx, box.x + box.w - p.x],
    [-dy, p.y - box.y],
    [dy, box.y + box.h - p.y],
  ];
  let [enter, leave] = [0, 1];
  for (const [direction, room] of sides) {
    if (direction === 0) {
      if (room <= 0) return false;
      continue;
    }
    const t = room / direction;
    if (direction < 0) enter = Math.max(enter, t);
    else leave = Math.min(leave, t);
    if (enter >= leave) return false;
  }
  return true;
}

function ringRoutes(boxes: Box[], radius: number, closed: boolean): Route[] {
  const n = boxes.length;
  const links = closed && n > 1 ? n : n - 1;
  return Array.from({ length: Math.max(0, links) }, (_, i) => {
    const next = (i + 1) % n;
    const angleB = angleOf(i, n) + (2 * Math.PI) / n;
    const points = arcPoints(boxes[i], boxes[next], radius, angleOf(i, n), angleB);
    return { from: boxes[i].key, to: boxes[next].key, points };
  });
}

function blockedRoutes(routes: Route[], boxes: Box[]): string[] {
  return routes.flatMap((route) => {
    const third = boxes.filter((box) => box.key !== route.from && box.key !== route.to);
    const hit = third.find((box) =>
      route.points.some((p, i) => i > 0 && crosses(route.points[i - 1], p, box)),
    );
    return hit ? [`link ${route.from} → ${route.to} crosses node ${hit.key}`] : [];
  });
}

/** The content's extent around the ring's centre · the reserved zone and the links
 *  included, since an arc bulges past the boxes it joins. */
function extent(boxes: Box[], routes: Route[], centre: Size | undefined) {
  const zone = centre ?? { w: 0, h: 0 };
  const points = routes.flatMap((route) => route.points).map((p) => ({ ...p, w: 0, h: 0 }));
  const all = [...boxes, ...points, { x: -zone.w / 2, y: -zone.h / 2, w: zone.w, h: zone.h }];
  const left = Math.min(...all.map((b) => b.x));
  const top = Math.min(...all.map((b) => b.y));
  const right = Math.max(...all.map((b) => b.x + b.w));
  const bottom = Math.max(...all.map((b) => b.y + b.h));
  return { left, top, w: right - left, h: bottom - top };
}

function countReason(count: number): string[] {
  if (count >= MIN_RING_NODES && count <= MAX_RING_NODES) return [];
  return [`a ring holds ${MIN_RING_NODES} to ${MAX_RING_NODES} nodes, got ${count}`];
}

export function ring(input: RingInput): RingResult {
  const { nodes, bounds, centre } = input;
  const gap = Math.max(0, input.gap);
  const radius = ringRadius(nodes, gap, centre);
  const boxes: Box[] = nodes.map((node, i) => {
    const at = onArc(radius, angleOf(i, nodes.length));
    return { key: node.key, x: at.x - node.w / 2, y: at.y - node.h / 2, w: node.w, h: node.h };
  });
  const routes = ringRoutes(boxes, radius, input.closed ?? false);
  const reasons = [...countReason(nodes.length), ...blockedRoutes(routes, boxes)];
  const area = extent(boxes, routes, centre);
  if (area.w > bounds.w || area.h > bounds.h) {
    reasons.push(
      `ring needs radius ${format(radius)}, ${format(area.w)}×${format(area.h)}, ` +
        `bounds are ${format(bounds.w)}×${format(bounds.h)}`,
    );
  }
  const shift = (p: Point): Point => ({ x: p.x - area.left, y: p.y - area.top });
  return {
    placed: boxes.map((box) => ({ ...box, ...shift(box) })),
    size: { w: area.w, h: area.h },
    status: reasons.length ? 'unresolved' : 'fit',
    reasons,
    centre: { ...shift({ x: 0, y: 0 }), r: radius, free: freeZone(boxes, gap, centre) },
    routes: routes.map((route) => ({ ...route, points: route.points.map(shift) })),
  };
}
