import { describe, expect, it } from 'vitest';
import {
  EVEN_RANK_SLACK,
  type LayerNode,
  type LayersInput,
  type LayersResult,
  MAX_NODES,
  layers,
} from './layers.js';
import type { Edge, Placed, Point } from './types.js';

/** A seeded generator · the random graphs are the same on every run. */
function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SEED = 20261021;
const RANDOM_GRAPHS = 320;
const EDGE_CHANCE = 0.3;
const BACK_CHANCE = 0.3;
const WIDE = { w: 1600, h: 900 };

const box = (key: string, w = 120, h = 60): LayerNode => ({ key, w, h });
const edge = (from: string, to: string, back = false): Edge =>
  back ? { from, to, back } : { from, to };

function input(nodes: LayerNode[], edges: Edge[], extra: Partial<LayersInput> = {}): LayersInput {
  return { nodes, edges, direction: 'right', bounds: WIDE, nodeGap: 32, rankGap: 80, ...extra };
}

/** A DAG of 1 to 12 nodes · every edge goes from a node to one declared after it,
 *  and some graphs add one declared return edge, from a later node to an earlier. */
function randomDag(random: () => number): LayersInput {
  const between = (low: number, high: number) => low + random() * (high - low);
  const count = 1 + Math.floor(random() * MAX_NODES);
  const nodes = Array.from({ length: count }, (_, i) =>
    box(`n${i}`, between(40, 240), between(30, 140)),
  );
  const edges: Edge[] = [];
  for (let from = 0; from < count; from++) {
    for (let to = from + 1; to < count; to++) {
      if (random() < EDGE_CHANCE) edges.push(edge(`n${from}`, `n${to}`));
    }
  }
  if (count > 1 && random() < BACK_CHANCE) {
    const to = Math.floor(random() * (count - 1));
    const from = to + 1 + Math.floor(random() * (count - 1 - to));
    edges.push(edge(`n${from}`, `n${to}`, true));
  }
  return input(nodes, edges, {
    direction: random() < 0.5 ? 'right' : 'down',
    nodeGap: between(16, 64),
    rankGap: between(40, 120),
  });
}

const randomGraphs = (() => {
  const random = mulberry32(SEED);
  return Array.from({ length: RANDOM_GRAPHS }, () => randomDag(random));
})();

const overlap = (a: Placed, b: Placed) =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

/** Whether the straight segment p→q enters the inside of a box (its border is fine). */
function crossesInside(p: Point, q: Point, node: Placed): boolean {
  const [left, right] = [Math.min(p.x, q.x), Math.max(p.x, q.x)];
  const [top, bottom] = [Math.min(p.y, q.y), Math.max(p.y, q.y)];
  return right > node.x && left < node.x + node.w && bottom > node.y && top < node.y + node.h;
}

const segments = (points: Point[]) => points.slice(1).map((q, i) => [points[i], q]);

/** The crossings of the naive order · each rank in declaration order, real nodes
 *  first, then one dummy per edge passing through, by edge. */
function naiveCrossings(graph: LayersInput, ranks: Record<string, number>): number {
  const position = new Map<string, number>();
  const rows = new Map<number, number>();
  const take = (id: string, rank: number) => {
    const next = rows.get(rank) ?? 0;
    position.set(id, next);
    rows.set(rank, next + 1);
  };
  for (const node of graph.nodes) take(node.key, ranks[node.key]);
  const steps: [string, string, number][] = [];
  graph.edges.forEach((e, i) => {
    if (e.back) return;
    let previous = e.from;
    for (let rank = ranks[e.from] + 1; rank <= ranks[e.to]; rank++) {
      const id = rank === ranks[e.to] ? e.to : `dummy-${i}-${rank}`;
      if (id !== e.to) take(id, rank);
      steps.push([previous, id, rank - 1]);
      previous = id;
    }
  });
  let crossings = 0;
  steps.forEach(([a, b, rank], i) => {
    for (const [c, d, other] of steps.slice(i + 1)) {
      const at = (id: string) => position.get(id) as number;
      if (rank === other && (at(a) - at(c)) * (at(b) - at(d)) < 0) crossings++;
    }
  });
  return crossings;
}

const byKey = (result: LayersResult) => new Map(result.placed.map((p) => [p.key, p]));

describe('layers · random DAGs', () => {
  const results = randomGraphs.map((graph) => ({ graph, result: layers(graph) }));

  it('is deterministic', () => {
    for (const { graph, result } of results) expect(layers(structuredClone(graph))).toEqual(result);
  });

  it('sends every edge from a smaller rank to a larger one, with no issue', () => {
    for (const { graph, result } of results) {
      expect(result.issues.filter((issue) => issue.code !== 'LAYERS_TOO_MANY')).toEqual([]);
      for (const e of graph.edges.filter((forward) => !forward.back)) {
        expect(result.ranks[e.from]).toBeLessThan(result.ranks[e.to]);
      }
    }
  });

  it('places every node exactly once, at its own size (or its rank, a hair wider), without overlap', () => {
    for (const { graph, result } of results) {
      expect(result.placed.map((p) => p.key)).toEqual(graph.nodes.map((n) => n.key));
      result.placed.forEach((p, i) => {
        // Down a page the rank runs along y · across it, along x. Only that side may
        // grow, and by less than EVEN_RANK_SLACK.
        const right = graph.direction === 'right';
        const [along, own] = right ? [p.w, graph.nodes[i].w] : [p.h, graph.nodes[i].h];
        expect(along - own).toBeGreaterThanOrEqual(0);
        expect(along - own).toBeLessThan(EVEN_RANK_SLACK);
        expect(right ? p.h : p.w).toBe(right ? graph.nodes[i].h : graph.nodes[i].w);
        for (const other of result.placed.slice(i + 1)) expect(overlap(p, other)).toBe(false);
      });
    }
  });

  it('keeps every number finite and positive, and inside the bounds when it fits', () => {
    for (const { graph, result } of results) {
      const points = result.routes.flatMap((route) => route.points);
      const xs = [...result.placed.flatMap((p) => [p.x, p.x + p.w]), ...points.map((p) => p.x)];
      const ys = [...result.placed.flatMap((p) => [p.y, p.y + p.h]), ...points.map((p) => p.y)];
      for (const n of [...xs, ...ys, result.size.w, result.size.h]) {
        expect(Number.isFinite(n) && n >= 0).toBe(true);
      }
      expect(Math.max(0, ...xs)).toBeLessThanOrEqual(result.size.w + 1e-6);
      expect(Math.max(0, ...ys)).toBeLessThanOrEqual(result.size.h + 1e-6);
      if (result.status === 'fit') {
        expect(result.size.w).toBeLessThanOrEqual(graph.bounds.w + 1e-6);
        expect(result.size.h).toBeLessThanOrEqual(graph.bounds.h + 1e-6);
      } else {
        expect(result.reasons.length).toBeGreaterThan(0);
      }
    }
  });

  it('routes every edge orthogonally, without repeated points and through no node', () => {
    for (const { graph, result } of results) {
      expect(result.routes.map((r) => [r.from, r.to])).toEqual(
        graph.edges.map((e) => [e.from, e.to]),
      );
      for (const route of result.routes) {
        for (const [p, q] of segments(route.points)) {
          expect(p.x === q.x || p.y === q.y).toBe(true);
          expect(p.x === q.x && p.y === q.y).toBe(false);
          for (const node of result.placed) expect(crossesInside(p, q, node)).toBe(false);
        }
      }
    }
  });

  it('never crosses more than the naive declaration order', () => {
    for (const { graph, result } of results) {
      expect(result.crossings).toBeLessThanOrEqual(naiveCrossings(graph, result.ranks));
    }
  });
});

describe('layers · shapes', () => {
  it('lays a chain along the direction, one rank each, without crossing', () => {
    const nodes = ['a', 'b', 'c', 'd'].map((key) => box(key));
    const chain = [edge('a', 'b'), edge('b', 'c'), edge('c', 'd')];
    const right = layers(input(nodes, chain));
    expect(right.ranks).toEqual({ a: 0, b: 1, c: 2, d: 3 });
    expect(right.crossings).toBe(0);
    expect(right.placed.map((p) => p.x)).toEqual([0, 200, 400, 600]);
    expect(new Set(right.placed.map((p) => p.y)).size).toBe(1);
    const down = layers(input(nodes, chain, { direction: 'down' }));
    expect(down.placed.map((p) => p.y)).toEqual([0, 140, 280, 420]);
    expect(down.routes[0].points).toEqual([
      { x: 60, y: 60 },
      { x: 60, y: 140 },
    ]);
  });

  it('gives boxes a hair narrower than their rank its width, and leaves a real difference alone', () => {
    const near = layers(
      input([box('s'), box('a', 120), box('b', 124)], [edge('s', 'a'), edge('s', 'b')]),
    );
    const [, a, b] = near.placed;
    expect([a!.x, a!.w]).toEqual([b!.x, b!.w]);
    const far = layers(
      input([box('s'), box('a', 120), box('b', 200)], [edge('s', 'a'), edge('s', 'b')]),
    );
    expect(far.placed[1]!.w).toBe(120);
    expect(far.placed[1]!.x - far.placed[2]!.x).toBe(40);
  });

  it('fans one source out to five, the source centred on them', () => {
    const leaves = ['l1', 'l2', 'l3', 'l4', 'l5'];
    const result = layers(
      input(
        [box('hub'), ...leaves.map((key) => box(key))],
        leaves.map((l) => edge('hub', l)),
      ),
    );
    const placed = byKey(result);
    const hub = placed.get('hub') as Placed;
    const first = placed.get('l1') as Placed;
    const last = placed.get('l5') as Placed;
    expect(result.crossings).toBe(0);
    expect(leaves.map((l) => result.ranks[l])).toEqual([1, 1, 1, 1, 1]);
    expect(hub.y + hub.h / 2).toBeCloseTo((first.y + last.y + last.h) / 2);
    expect(result.status).toBe('fit');
  });

  it('places a diamond on three ranks without crossing', () => {
    const nodes = ['a', 'b', 'c', 'd'].map((key) => box(key));
    const edges = [edge('a', 'b'), edge('a', 'c'), edge('b', 'd'), edge('c', 'd')];
    const result = layers(input(nodes, edges));
    expect(result.ranks).toEqual({ a: 0, b: 1, c: 1, d: 2 });
    expect(result.crossings).toBe(0);
  });

  it('routes a long edge round the node it skips', () => {
    const nodes = ['a', 'b', 'c'].map((key) => box(key));
    const result = layers(input(nodes, [edge('a', 'b'), edge('b', 'c'), edge('a', 'c')]));
    const b = byKey(result).get('b') as Placed;
    const long = result.routes[2];
    expect(long.points.length).toBeGreaterThan(2);
    for (const [p, q] of segments(long.points)) expect(crossesInside(p, q, b)).toBe(false);
  });

  it('sets two groups side by side on the cross axis, a double gap apart', () => {
    const nodes = ['a', 'b', 'c', 'd'].map((key) => box(key));
    const result = layers(input(nodes, [edge('a', 'b'), edge('c', 'd')]));
    const placed = byKey(result);
    expect(result.ranks).toEqual({ a: 0, b: 1, c: 0, d: 1 });
    expect((placed.get('c') as Placed).x).toBe((placed.get('a') as Placed).x);
    expect((placed.get('c') as Placed).y).toBe(60 + 32 * 2);
    expect(result.size).toEqual({ w: 320, h: 184 });
  });

  it('places nothing for no node, and one node at the origin', () => {
    const empty = layers(input([], []));
    expect(empty).toMatchObject({ placed: [], routes: [], size: { w: 0, h: 0 }, status: 'fit' });
    const one = layers(input([box('solo', 100, 50)], []));
    expect(one.placed).toEqual([{ key: 'solo', x: 0, y: 0, w: 100, h: 50 }]);
    expect(one.size).toEqual({ w: 100, h: 50 });
    expect(one.ranks).toEqual({ solo: 0 });
  });
});

describe('layers · what the author got wrong', () => {
  it('breaks an undeclared cycle, reports the edge it broke and does not route it', () => {
    const nodes = ['a', 'b', 'c'].map((key) => box(key));
    const result = layers(input(nodes, [edge('a', 'b'), edge('b', 'c'), edge('c', 'a')]));
    expect(result.issues).toEqual([
      expect.objectContaining({ code: 'LAYERS_CYCLE', items: ['c', 'a'] }),
    ]);
    expect(result.ranks).toEqual({ a: 0, b: 1, c: 2 });
    expect(result.routes.map((r) => `${r.from}${r.to}`)).toEqual(['ab', 'bc']);
  });

  it('routes a declared return edge round the outside, without an issue', () => {
    for (const direction of ['right', 'down'] as const) {
      const nodes = ['a', 'b', 'c'].map((key) => box(key));
      const graph = input(nodes, [edge('a', 'b'), edge('b', 'c'), edge('c', 'a', true)], {
        direction,
      });
      const result = layers(graph);
      expect(result.issues).toEqual([]);
      expect(result.ranks).toEqual({ a: 0, b: 1, c: 2 });
      const back = result.routes[2];
      const cross = direction === 'right' ? 'y' : 'x';
      const farSide = Math.max(
        ...result.placed.map((p) => p[cross] + (direction === 'right' ? p.h : p.w)),
      );
      expect(Math.max(...back.points.map((p) => p[cross]))).toBeGreaterThan(farSide);
      for (const [p, q] of segments(back.points)) {
        for (const node of result.placed) expect(crossesInside(p, q, node)).toBe(false);
      }
      expect(result.status).toBe('fit');
    }
  });

  it('reports a self loop and does not route it', () => {
    const result = layers(input([box('a')], [edge('a', 'a')]));
    expect(result.issues).toEqual([
      expect.objectContaining({ code: 'LAYERS_SELF_LOOP', items: ['a'] }),
    ]);
    expect(result.routes).toEqual([]);
  });

  it('reports an edge to an unknown node and places the rest', () => {
    const result = layers(input([box('a'), box('b')], [edge('a', 'ghost'), edge('a', 'b')]));
    expect(result.issues).toEqual([
      expect.objectContaining({ code: 'LAYERS_UNKNOWN_NODE', items: ['a', 'ghost'] }),
    ]);
    expect(result.issues[0].message).toContain('ghost');
    expect(result.placed.map((p) => p.key)).toEqual(['a', 'b']);
    expect(result.routes.map((r) => `${r.from}${r.to}`)).toEqual(['ab']);
  });

  it('reports more than twelve nodes and places them all anyway', () => {
    const nodes = Array.from({ length: MAX_NODES + 1 }, (_, i) => box(`n${i}`));
    const edges = nodes.slice(1).map((node, i) => edge(nodes[i].key, node.key));
    const result = layers(input(nodes, edges, { bounds: { w: 4000, h: 900 } }));
    expect(result.issues).toEqual([
      expect.objectContaining({ code: 'LAYERS_TOO_MANY', items: [`n${MAX_NODES}`] }),
    ]);
    expect(result.placed).toHaveLength(MAX_NODES + 1);
    expect(result.routes).toHaveLength(MAX_NODES);
  });
});

describe('layers · bounds', () => {
  const chain = () =>
    input(
      ['a', 'b', 'c'].map((key) => box(key, 100, 60)),
      [edge('a', 'b'), edge('b', 'c')],
      {
        rankGap: 100,
      },
    );

  it('shrinks the gaps before giving up', () => {
    const result = layers({ ...chain(), bounds: { w: 430, h: 900 } });
    expect(result.status).toBe('fit');
    expect(result.size.w).toBeLessThanOrEqual(430);
    expect(result.placed.map((p) => p.w)).toEqual([100, 100, 100]);
  });

  it('is unresolved with the size it needs when halving is not enough, and places anyway', () => {
    const result = layers({ ...chain(), bounds: { w: 300, h: 900 } });
    expect(result.status).toBe('unresolved');
    expect(result.reasons).toEqual([expect.stringContaining('400×60')]);
    expect(result.placed).toHaveLength(3);
    expect(result.routes).toHaveLength(2);
  });
});
