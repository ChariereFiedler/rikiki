// ════════════════════════════════════════════════════════════════
// RIKIKI · diagram, the `layers` engine · a reduced Sugiyama for directed graphs
//
// Services and what they depend on read best in layers, every arrow going the same
// way. From measured sizes, the engine places the nodes and routes each edge:
//
// 1. Validate · an unknown end or a self loop is reported and left out. An
//    UNDECLARED cycle is broken by a depth-first walk in declaration order: the
//    edge closing it is reported and not routed. A `back: true` edge is a declared
//    return · out of the ranks, routed round the outside, not an issue.
// 2. Caps · over MAX_NODES nodes or MAX_EDGES edges is reported, and placed.
// 3. Ranks · longest path from the sources (an isolated node is rank 0). Each
//    connected group is laid out alone; groups sit side by side on the cross axis,
//    `nodeGap * COMPONENT_GAP_FACTOR` apart.
// 4. Order · a dummy in every rank a long edge skips. Ranks start in declaration
//    order (nodes, then dummies by edge); SWEEPS barycentre sweeps alternate down
//    and up, ties by declaration, and the order with fewest crossings is kept.
// 5. Coordinates · a rank is as thick as its thickest node, `rankGap` from the
//    next; its nodes are stacked `nodeGap` apart (`laneGap` by a dummy) and the
//    rank is centred on its group's cross axis.
// 6. Routes · exit face to entry face, turning mid-corridor and passing through
//    the dummies, so no route crosses a node. A return leaves by the corridor after
//    its source (past the last rank for the last), runs in its own lane beyond the
//    far side of the group, and comes in by the corridor before its target.
// 7. Fit · too large for `bounds`, the gaps shrink through GAP_SCALES to half;
//    still too large, the tightest placement is `unresolved` with the size needed.
//
// Coordinates start at the content's top-left. Routes keep the declaration order.
// ════════════════════════════════════════════════════════════════

import type { Bounds, Edge, EngineResult, Point, Route, Size } from './types.js';

/** Past a dozen boxes, or two dozen arrows, a layered diagram stops being read and
 *  starts being searched · the slide wants splitting, not a smaller font. */
export const MAX_NODES = 12;
export const MAX_EDGES = 24;

/** Barycentre sweeps · four (down, up, down, up) settle graphs this small. */
const SWEEPS = 4;
/** Two groups that share nothing are set apart by twice the node gap. */
const COMPONENT_GAP_FACTOR = 2;
/** Without `laneGap`, a route passing a node keeps half a node gap from it. */
const DEFAULT_LANE_SHARE = 0.5;
/** A box at most this many units shorter than the widest of its rank takes the rank's
 *  size · centred, its edges would land under 6 px from the others' on a 1920 slide,
 *  the band `rikiki check` calls a slip (ILL_NEAR_ALIGN). Past it, the difference is
 *  seen as meant. */
export const EVEN_RANK_SLACK = 12;
/** The scales the gaps are tried at in turn, down to half, before giving up on the
 *  bounds · never further, or the ranks start touching their link labels. */
const GAP_SCALES = [1, 0.9, 0.8, 0.7, 0.6, 0.5];
/** Rounding slack when comparing the drawing to its bounds. */
const FIT_EPSILON = 1e-6;

export type LayerIssueCode =
  | 'LAYERS_UNKNOWN_NODE'
  | 'LAYERS_CYCLE'
  | 'LAYERS_SELF_LOOP'
  | 'LAYERS_TOO_MANY';

export interface LayerIssue {
  code: LayerIssueCode;
  message: string;
  /** The keys involved · an edge's two ends, or what is over a cap. */
  items: string[];
}

/** A node as measured, in drawing units. */
export type LayerNode = Size & { key: string };

export interface LayersInput {
  nodes: LayerNode[];
  edges: Edge[];
  /** Where the ranks progress · `right` puts rank 0 on the left, `down` on top. */
  direction: 'right' | 'down';
  bounds: Bounds;
  /** Between two nodes of a rank, and (doubled) between two groups. */
  nodeGap: number;
  /** The corridor between two ranks, where routes turn and link labels sit. */
  rankGap: number;
  /** Between a passing route and a node, and between two return lanes. */
  laneGap?: number;
}

export interface LayersResult extends EngineResult {
  routes: Route[];
  /** Crossings between edges of consecutive ranks, dummies included. */
  crossings: number;
  ranks: Record<string, number>;
  issues: LayerIssue[];
}

/** An edge kept for drawing, between two known nodes by index. */
type Link = { from: number; to: number; back: boolean };
/** A real node (by index) or a dummy (`null`) · an entity's id is its declaration order. */
type Entity = { node: number | null; rank: number; group: number };
/** The entities a forward link goes through, from its source to its target. */
type Chain = { link: Link; ids: number[] };
/** A point in the engine's frame · `along` the ranks, `cross` within a rank. */
type FramePoint = { along: number; cross: number };
/** A box in the engine's frame, its corner and its size. */
type Frame = FramePoint & { alongSize: number; crossSize: number };
/** Where each rank of a group starts on the along axis, and how thick it is. */
type Bands = { start: number[]; thick: number[] };
type Gaps = { node: number; rank: number; lane: number };
/** What one placement, at one gap scale, works on. */
type Drawing = { entities: Entity[]; frames: Frame[]; gaps: Gaps };
/** The order found once, placed at every gap scale. */
type Layered = { entities: Entity[]; chains: Chain[]; drawn: Link[]; groups: Group[] };
/** A connected group, named by its first node, and its ranks in their best order. */
type Group = { group: number; rows: number[][]; crossings: number };

const label = (edge: Edge) => `${edge.from}→${edge.to}`;

function validate(nodes: LayerNode[], edges: Edge[]) {
  const index = new Map<string, number>();
  for (const [i, node] of nodes.entries()) if (!index.has(node.key)) index.set(node.key, i);
  const issues: LayerIssue[] = [];
  const drawn = new Map<Link, Edge>();
  for (const edge of edges) {
    const from = index.get(edge.from);
    const to = index.get(edge.to);
    if (from === undefined || to === undefined) {
      const missing = [edge.from, edge.to].filter((key) => !index.has(key)).join(', ');
      const message = `edge ${label(edge)} names an unknown node: ${missing}`;
      issues.push({ code: 'LAYERS_UNKNOWN_NODE', message, items: [edge.from, edge.to] });
    } else if (from === to) {
      const message = `edge ${label(edge)} loops on its own node and is not drawn`;
      issues.push({ code: 'LAYERS_SELF_LOOP', message, items: [edge.from] });
    } else {
      drawn.set({ from, to, back: edge.back === true }, edge);
    }
  }
  const broken = closingLinks(nodes.length, [...drawn.keys()]);
  for (const link of broken) {
    const edge = drawn.get(link) as Edge;
    const message = `edge ${label(edge)} closes a cycle and is not drawn · declare it back: true`;
    issues.push({ code: 'LAYERS_CYCLE', message, items: [edge.from, edge.to] });
  }
  return { drawn: [...drawn.keys()].filter((link) => !broken.has(link)), issues };
}

/** The forward links that close a cycle, by a depth-first walk in declaration order. */
function closingLinks(count: number, links: Link[]): Set<Link> {
  const outgoing: Link[][] = Array.from({ length: count }, () => []);
  for (const link of links) if (!link.back) outgoing[link.from].push(link);
  const state = new Map<number, 'on-path' | 'done'>();
  const broken = new Set<Link>();
  const visit = (node: number) => {
    state.set(node, 'on-path');
    for (const link of outgoing[node]) {
      if (state.get(link.to) === 'on-path') broken.add(link);
      else if (!state.has(link.to)) visit(link.to);
    }
    state.set(node, 'done');
  };
  for (let node = 0; node < count; node++) if (!state.has(node)) visit(node);
  return broken;
}

/** A `LAYERS_TOO_MANY` issue when `keys` is over `max`, naming what is past it. */
function tooMany(what: string, keys: string[], max: number): LayerIssue[] {
  if (keys.length <= max) return [];
  const message = `${keys.length} ${what}, at most ${max} read as one diagram`;
  return [{ code: 'LAYERS_TOO_MANY', message, items: keys.slice(max) }];
}

/** Longest path from the sources · the links form a DAG, so `count` passes settle it. */
function longestPathRanks(count: number, links: Link[]): number[] {
  const ranks = new Array<number>(count).fill(0);
  for (let pass = 0; pass < count; pass++) {
    for (const link of links) ranks[link.to] = Math.max(ranks[link.to], ranks[link.from] + 1);
  }
  return ranks;
}

/** The connected group of each node, named by its first node · a union always keeps
 *  the smaller root, so a group's root is the first node declared in it. */
function groupsOf(count: number, links: Link[]): number[] {
  const parent = Array.from({ length: count }, (_, i) => i);
  const root = (node: number): number => (parent[node] === node ? node : root(parent[node]));
  for (const link of links) {
    const a = root(link.from);
    const b = root(link.to);
    parent[Math.max(a, b)] = Math.min(a, b);
  }
  return parent.map((_, node) => root(node));
}

/** One chain per forward link · appends a dummy entity for each rank it skips. */
function buildChains(entities: Entity[], links: Link[]): Chain[] {
  return links.map((link) => {
    const ids = [link.from];
    for (let rank = entities[link.from].rank + 1; rank < entities[link.to].rank; rank++) {
      ids.push(entities.length);
      entities.push({ node: null, rank, group: entities[link.from].group });
    }
    ids.push(link.to);
    return { link, ids };
  });
}

/** Two steps between the same two ranks cross when their ends swap order · `at` is
 *  each entity's index in its rank. */
function countCrossings(steps: number[][], at: number[], entities: Entity[]): number {
  let crossings = 0;
  steps.forEach(([a, b], i) => {
    for (const [c, d] of steps.slice(i + 1)) {
      const sameCorridor = entities[a].rank === entities[c].rank;
      if (sameCorridor && (at[a] - at[c]) * (at[b] - at[d]) < 0) crossings++;
    }
  });
  return crossings;
}

/** One rank sorted by the mean position of its neighbours in the rank just placed ·
 *  an entity without neighbours there keeps its own position. */
function sortByBarycentre(row: number[], neighbours: number[][], position: number[]): number[] {
  const centre = (id: number) => {
    const around = neighbours[id];
    if (around.length === 0) return position[id];
    return around.reduce((sum, other) => sum + position[other], 0) / around.length;
  };
  const sorted = row
    .map((id) => ({ id, centre: centre(id) }))
    .sort((a, b) => a.centre - b.centre || a.id - b.id)
    .map((entry) => entry.id);
  for (const [i, id] of sorted.entries()) position[id] = i;
  return sorted;
}

/** The ranks of one group in their best order · each rank starts in declaration
 *  order, and has no hole: a node at rank r > 0 has a predecessor at r - 1. */
function orderGroup(group: number, entities: Entity[], chains: Chain[]) {
  const rows: number[][] = [];
  entities.forEach((entity, id) => {
    if (entity.group !== group) return;
    rows[entity.rank] ??= [];
    rows[entity.rank].push(id);
  });
  const own = chains.filter((chain) => entities[chain.link.from].group === group);
  const steps = own.flatMap(({ ids }) => ids.slice(1).map((to, i) => [ids[i], to]));
  const above: number[][] = entities.map(() => []);
  const below: number[][] = entities.map(() => []);
  for (const [a, b] of steps) {
    below[a].push(b);
    above[b].push(a);
  }
  // Kept in step with `current` by every sort, so the crossings read it directly.
  const position = new Array<number>(entities.length).fill(0);
  for (const row of rows) for (const [i, id] of row.entries()) position[id] = i;
  let current = rows;
  let best = { group, rows, crossings: countCrossings(steps, position, entities) };
  for (let sweep = 0; sweep < SWEEPS; sweep++) {
    const downward = sweep % 2 === 0;
    current = [...current];
    for (let step = 1; step < current.length; step++) {
      const rank = downward ? step : current.length - 1 - step;
      current[rank] = sortByBarycentre(current[rank], downward ? above : below, position);
    }
    const crossings = countCrossings(steps, position, entities);
    if (crossings < best.crossings) best = { group, rows: current, crossings };
  }
  return best;
}

const centreOf = (frame: Frame) => frame.cross + frame.crossSize / 2;
const exitOf = (frame: Frame) => ({ along: frame.along + frame.alongSize, cross: centreOf(frame) });
const entryOf = (frame: Frame) => ({ along: frame.along, cross: centreOf(frame) });
const corridorAfter = (bands: Bands, rank: number, gaps: Gaps) =>
  bands.start[rank] + bands.thick[rank] + gaps.rank / 2;

/** Drops repeated points and the middle of three aligned ones. */
function simplify(points: FramePoint[]): FramePoint[] {
  const same = (a: FramePoint, b: FramePoint) => a.along === b.along && a.cross === b.cross;
  const unique = points.filter((point, i) => i === 0 || !same(point, points[i - 1]));
  return unique.filter((point, i) => {
    const before = unique[i - 1];
    const after = unique[i + 1];
    if (!before || !after) return true;
    const alongLine = before.along === point.along && point.along === after.along;
    return !alongLine && !(before.cross === point.cross && point.cross === after.cross);
  });
}

function routeChain({ entities, frames, gaps }: Drawing, bands: Bands, { ids }: Chain) {
  const points = [exitOf(frames[ids[0]])];
  ids.slice(1).forEach((to, i) => {
    const corridor = corridorAfter(bands, entities[ids[i]].rank, gaps);
    points.push({ along: corridor, cross: centreOf(frames[ids[i]]) });
    points.push({ along: corridor, cross: centreOf(frames[to]) });
  });
  points.push(entryOf(frames[ids[ids.length - 1]]));
  return simplify(points);
}

function routeBack({ entities, frames, gaps }: Drawing, bands: Bands, link: Link, lane: number) {
  const exit = corridorAfter(bands, entities[link.from].rank, gaps);
  const entry = bands.start[entities[link.to].rank] - gaps.rank / 2;
  return simplify([
    exitOf(frames[link.from]),
    { along: exit, cross: centreOf(frames[link.from]) },
    { along: exit, cross: lane },
    { along: entry, cross: lane },
    { along: entry, cross: centreOf(frames[link.to]) },
    entryOf(frames[link.to]),
  ]);
}

/** Stacks a rank from `cross` on, `nodeGap` apart (`laneGap` next to a dummy) ·
 *  returns where it ends. */
function stackRow({ entities, frames, gaps }: Drawing, row: number[], cross: number): number {
  let end = cross;
  row.forEach((id, i) => {
    if (i > 0) {
      const nearDummy = entities[id].node === null || entities[row[i - 1]].node === null;
      end += nearDummy ? gaps.lane : gaps.node;
    }
    frames[id].cross = end;
    end += frames[id].crossSize;
  });
  return end;
}

/** Places one group from `crossStart` on, and the lanes of its return edges. */
function placeGroup(drawing: Drawing, rows: number[][], returns: Link[], crossStart: number) {
  const { entities, frames, gaps } = drawing;
  const last = rows.length - 1;
  const lead = returns.some((link) => entities[link.to].rank === 0) ? gaps.rank / 2 : 0;
  const trail = returns.some((link) => entities[link.from].rank === last) ? gaps.rank / 2 : 0;
  const thick = rows.map((row) => Math.max(0, ...row.map((id) => frames[id].alongSize)));
  // A box a few units short of its rank's widest takes its width · centred, its edges
  // would miss the others' by a hair, which reads as a slip, not a choice.
  rows.forEach((row, rank) => {
    for (const id of row) {
      const short = thick[rank] - frames[id].alongSize;
      if (entities[id].node !== null && short > 0 && short < EVEN_RANK_SLACK)
        frames[id].alongSize = thick[rank];
    }
  });
  // Each rank starts one corridor past the end of the one before.
  const start = thick.map(
    (_, rank) => lead + thick.slice(0, rank).reduce((sum, t) => sum + t + gaps.rank, 0),
  );
  const ends = rows.map((row) => stackRow(drawing, row, crossStart));
  const laneStart = Math.max(...ends);
  rows.forEach((row, rank) => {
    for (const id of row) {
      frames[id].cross += (laneStart - ends[rank]) / 2;
      frames[id].along = start[rank] + (thick[rank] - frames[id].alongSize) / 2;
    }
  });
  const lanes = new Map(returns.map((link, i) => [link, laneStart + gaps.lane * (i + 1)]));
  const crossEnd = laneStart + gaps.lane * returns.length;
  return { bands: { start, thick }, lanes, crossEnd, alongEnd: start[last] + thick[last] + trail };
}

function arrange(input: LayersInput, layered: Layered, scale: number) {
  const right = input.direction === 'right';
  const lane = input.laneGap ?? input.nodeGap * DEFAULT_LANE_SHARE;
  const gaps = { node: input.nodeGap * scale, rank: input.rankGap * scale, lane: lane * scale };
  const frames = layered.entities.map((entity) => {
    const { w, h } = entity.node === null ? { w: 0, h: 0 } : input.nodes[entity.node];
    return { along: 0, cross: 0, alongSize: right ? w : h, crossSize: right ? h : w };
  });
  const { entities } = layered;
  const drawing: Drawing = { entities, frames, gaps };
  const paths = new Map<Link, FramePoint[]>();
  const bands = new Map<number, Bands>();
  const size = { along: 0, cross: 0 };
  layered.groups.forEach(({ group, rows }, i) => {
    const crossStart = i === 0 ? 0 : size.cross + gaps.node * COMPONENT_GAP_FACTOR;
    const returns = layered.drawn.filter((l) => l.back && entities[l.from].group === group);
    const placed = placeGroup(drawing, rows, returns, crossStart);
    for (const [link, lane] of placed.lanes) {
      paths.set(link, routeBack(drawing, placed.bands, link, lane));
    }
    bands.set(group, placed.bands);
    size.along = Math.max(size.along, placed.alongEnd);
    size.cross = placed.crossEnd;
  });
  for (const chain of layered.chains) {
    const groupBands = bands.get(entities[chain.link.from].group) as Bands;
    paths.set(chain.link, routeChain(drawing, groupBands, chain));
  }
  const toPoint = (p: FramePoint): Point =>
    right ? { x: p.along, y: p.cross } : { x: p.cross, y: p.along };
  const keyOf = (node: number) => input.nodes[node].key;
  const routes = layered.drawn.map((link) => {
    const points = (paths.get(link) as FramePoint[]).map(toPoint);
    return { from: keyOf(link.from), to: keyOf(link.to), points };
  });
  // A node's frame may have been widened to its rank (EVEN_RANK_SLACK) · it is placed
  // at its frame's size.
  const placed = input.nodes.map(({ key }, i) => {
    const frame = frames[i];
    const w = right ? frame.alongSize : frame.crossSize;
    const h = right ? frame.crossSize : frame.alongSize;
    return { key, ...toPoint(frame), w, h };
  });
  const extent = right ? { w: size.along, h: size.cross } : { w: size.cross, h: size.along };
  return { placed, routes, size: extent };
}

const fits = (size: Size, bounds: Bounds) =>
  size.w <= bounds.w + FIT_EPSILON && size.h <= bounds.h + FIT_EPSILON;

/** Places a directed graph in layers · the seven steps are in the header. */
export function layers(input: LayersInput): LayersResult {
  const { nodes, edges, bounds } = input;
  const { drawn, issues } = validate(nodes, edges);
  const keys = nodes.map((node) => node.key);
  issues.push(...tooMany('nodes', keys, MAX_NODES));
  issues.push(...tooMany('edges', edges.map(label), MAX_EDGES));
  const forward = drawn.filter((link) => !link.back);
  const ranks = longestPathRanks(nodes.length, forward);
  const group = groupsOf(nodes.length, drawn);
  const entities: Entity[] = group.map((g, node) => ({ node, rank: ranks[node], group: g }));
  const chains = buildChains(entities, forward);
  const ordered = [...new Set(group)].map((g) => orderGroup(g, entities, chains));
  const layered = { entities, chains, drawn, groups: ordered };
  const common = {
    crossings: ordered.reduce((sum, order) => sum + order.crossings, 0),
    ranks: Object.fromEntries(keys.map((key, i) => [key, ranks[i]])),
    issues,
  };
  let attempt = arrange(input, layered, GAP_SCALES[0]);
  for (const scale of GAP_SCALES.slice(1)) {
    if (fits(attempt.size, bounds)) break;
    attempt = arrange(input, layered, scale);
  }
  if (fits(attempt.size, bounds)) return { ...attempt, ...common, status: 'fit', reasons: [] };
  const need = `${Math.ceil(attempt.size.w)}×${Math.ceil(attempt.size.h)}`;
  const reason = `needs ${need} with its gaps halved, the bounds are ${bounds.w}×${bounds.h}`;
  return { ...attempt, ...common, status: 'unresolved', reasons: [reason] };
}
