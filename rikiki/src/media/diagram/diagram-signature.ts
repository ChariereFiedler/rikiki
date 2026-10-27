// ════════════════════════════════════════════════════════════════
// RIKIKI · diagram, the signature of a drawing
//
// What a diagram is made of, read off its compiled tree and not off its words: the
// intent it demonstrates, the layouts it uses, the kinds of its marks, how its
// arrows connect (a chain, a fan, a loop), whether tokens ride, a gate drops or the
// picture reorganises · its surfaces and tones · how many clicks it takes and what
// moves on them. Two slides whose signatures match are the same picture with other
// words, whatever the words say. `diversity.ts` compares them.
//
// Pure: a parsed diagram in, a plain object out · written on the svg as
// `data-signature`, where `rikiki check` reads it.
// ════════════════════════════════════════════════════════════════

import type { DiagramSignature, Topology } from '../diversity.js';
import { type DgNode, type ParsedDiagram, isGroupLike, words } from './model.js';

/** Nodes that are not counted as marks · a link is counted as an edge, a state by
 *  what it holds. A group is a mark: a frame is something the eye sees. */
const NOT_A_MARK = new Set(['link', 'state', 'camera']);

/** Every node of the tree, the marks of every state included. */
function everyNode(nodes: readonly DgNode[]): DgNode[] {
  return nodes.flatMap((node) => [node, ...everyNode(node.children)]);
}

/** The children a `link="arrow"` chains · what an arrow can stand between, groups
 *  included, as the layout does. */
const chained = (node: { children: DgNode[] }) =>
  node.children.filter((child) => !NOT_A_MARK.has(child.kind) && child.kind !== 'dot');

/** The edges the drawing shows, by the key of each end · the author's links (and
 *  those the intent wrote), and the chains of a `link` on the root or a group. A ring
 *  closes its chain. */
function edgesOf(root: { attrs: Readonly<Record<string, string>>; children: DgNode[] }) {
  const all = everyNode(root.children);
  const keyOf = new Map<string, string>();
  for (const node of all) {
    const key = node.attrs.name ?? node.attrs.label ?? `#${node.index}`;
    if (node.attrs.name) keyOf.set(node.attrs.name, key);
    if (node.attrs.label && !keyOf.has(node.attrs.label)) keyOf.set(node.attrs.label, key);
  }
  const edges: { from: string; to: string; back: boolean }[] = [];
  for (const link of all.filter((node) => node.kind === 'link'))
    for (const from of words(link.attrs.from))
      for (const to of words(link.attrs.to))
        edges.push({
          from: keyOf.get(from) ?? from,
          to: keyOf.get(to) ?? to,
          back: link.attrs.back === 'true',
        });
  const chainOwners = [root, ...all.filter(isGroupLike)];
  for (const owner of chainOwners) {
    if (owner.attrs.link !== 'arrow' && owner.attrs.link !== 'line') continue;
    const keys = chained(owner).map((n) => n.attrs.name ?? n.attrs.label ?? `#${n.index}`);
    for (let i = 1; i < keys.length; i += 1)
      edges.push({ from: keys[i - 1]!, to: keys[i]!, back: false });
    if ((owner.attrs.layout ?? 'row') === 'ring' && keys.length > 2)
      edges.push({ from: keys.at(-1)!, to: keys[0]!, back: true });
  }
  return edges;
}

/** How the arrows connect · a loop, a single line, one into many, many into one, or
 *  anything else. */
export function topologyOf(
  edges: readonly { from: string; to: string; back: boolean }[],
): Topology {
  if (!edges.length) return 'none';
  const ahead = new Map<string, string[]>();
  for (const e of edges) ahead.set(e.from, [...(ahead.get(e.from) ?? []), e.to]);
  if (edges.some((e) => e.back) || hasCycle(ahead)) return 'cycle';
  const count = (side: 'from' | 'to') => {
    const n = new Map<string, number>();
    for (const e of edges) n.set(e[side], (n.get(e[side]) ?? 0) + 1);
    return Math.max(...n.values());
  };
  const out = count('from');
  const into = count('to');
  if (out <= 1 && into <= 1) return 'chain';
  if (into <= 1) return 'fan-out';
  if (out <= 1) return 'fan-in';
  return 'graph';
}

function hasCycle(ahead: ReadonlyMap<string, string[]>): boolean {
  const done = new Set<string>();
  const visit = (key: string, path: Set<string>): boolean => {
    if (path.has(key)) return true;
    if (done.has(key)) return false;
    path.add(key);
    const found = (ahead.get(key) ?? []).some((next) => visit(next, path));
    path.delete(key);
    done.add(key);
    return found;
  };
  return [...ahead.keys()].some((key) => visit(key, new Set()));
}

/** A word given once per click (`state="open closed"`) changes when it has two
 *  different words. */
const changes = (value: string | undefined) => new Set(words(value)).size > 1;

/** What moves, by kind · read off the attributes that make it move. */
function motifsOf(nodes: readonly DgNode[], parsed: ParsedDiagram): string[] {
  const motifs = new Set<string>();
  for (const node of nodes) {
    if (Number(node.attrs.flow) > 0) motifs.add('tokens');
    if (node.kind === 'gate' && changes(node.attrs.state)) motifs.add('gate');
    if (
      (node.kind === 'meter' && changes(node.attrs.value)) ||
      (node.kind === 'queue' && changes(node.attrs.fill))
    )
      motifs.add('fill');
    if (node.kind === 'box' && changes(node.attrs.tone)) motifs.add('turn');
    if (node.kind === 'cursor') motifs.add('cursor');
    if ((node.attrs.enter === 'draw' && node.kind === 'link') || node.kind === 'curve')
      motifs.add('trace');
    if (node.attrs.step && node.kind !== 'state') motifs.add('reveal');
    if (node.attrs.after) motifs.add('sequence');
    if (node.kind === 'camera') motifs.add('camera');
    // A ring swept part after part, columns grown one after the other, a total walked.
    if (node.kind === 'pie') motifs.add('sweep');
    if (node.kind === 'columns') motifs.add('grow');
    if (node.kind === 'waterfall') motifs.add('walk');
  }
  if (parsed.states) motifs.add('morph');
  return [...motifs].sort();
}

const sortedSet = (values: Iterable<string>) => [...new Set(values)].sort();

/** The signature of a parsed (and compiled) diagram. */
export function signatureOf(parsed: ParsedDiagram): DiagramSignature {
  const nodes = everyNode(parsed.children);
  const marks: Record<string, number> = {};
  for (const node of nodes.filter((n) => !NOT_A_MARK.has(n.kind)))
    marks[node.kind] = (marks[node.kind] ?? 0) + 1;
  const edges = edgesOf(parsed);
  // A composition is laid out by its `compose`, each panel by its own layout.
  const layouts = [
    parsed.attrs.compose ? `compose:${parsed.attrs.compose}` : (parsed.attrs.layout ?? 'row'),
    ...nodes.filter(isGroupLike).map((n) => n.attrs.layout ?? 'row'),
  ];
  const tones = nodes.flatMap((n) => words(n.attrs.tone)).filter((tone) => tone !== 'normal');
  const paints = [parsed.attrs.paint, ...nodes.map((n) => n.attrs.paint)].filter(
    (paint): paint is string => !!paint && paint !== 'none',
  );
  return {
    structure: {
      kind: 'deck-diagram',
      intent: parsed.intent
        ? [parsed.intent.main, ...[...parsed.intent.also].sort()].join('+')
        : null,
      layouts: sortedSet(layouts),
      marks,
      links: edges.length,
      topology: topologyOf(edges),
      tokens: nodes.some((n) => Number(n.attrs.flow) > 0),
      gates: nodes.some((n) => n.kind === 'gate'),
      morph: parsed.states,
    },
    visual: {
      surfaces: sortedSet(paints),
      tones: sortedSet([
        ...tones,
        ...(nodes.some((n) => n.attrs.emphasis === 'true') ? ['accent'] : []),
      ]),
      density: parsed.marks,
    },
    time: { clicks: parsed.stages, motifs: motifsOf(nodes, parsed) },
  };
}
