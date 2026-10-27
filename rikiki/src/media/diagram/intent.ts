// ════════════════════════════════════════════════════════════════
// RIKIKI · diagram, the intent
//
// `<deck-diagram intent="barrier" also="cause">` says what the picture must
// demonstrate, and each mark says the part it plays (`role="flow"`). This module
// is the compiler between the two: from the intent and the roles it chooses the
// layout, the treatment (the one mark put forward) and the motion (what comes in
// first, what waits for which click), and hands an ordinary tree to the layout.
// It never writes a coordinate.
//
// Each of the sixteen intents (intent-specs.ts) compiles to a structure of its
// own · a chain, lanes and a gate, a queue before a neck, a stock, two pictures, a
// ring, a crowd, frames in frames, columns side by side, a tree that turns rank by
// rank, a gauge and its line, two gauges forked, gaps from a line, bars, one band,
// a funnel · so that no two intents look alike. Once the layout has placed it,
// `proveIntent` (intent-prove.ts) reads the drawing back and says whether it
// demonstrates what it claims (`INT_*`).
//
// Pure: a tree in, a tree out.
// ════════════════════════════════════════════════════════════════

import { MAX_FLOW } from './lanes.js';
import { type DgIssue, type DgNode, type MarkKind, nameOf, readNumber, words } from './model.js';
import { MAX_QUEUE } from './queue.js';
import {
  INTENTS,
  INTENT_NAMES,
  type IntentName,
  REFUSED_BECAUSE,
  type RoleSpec,
} from './intent-specs.js';

export {
  INTENTS,
  INTENT_NAMES,
  REFUSED_BECAUSE,
  SECONDARIES,
  type CompiledIntent,
  type IntCode,
  type IntentFamily,
  type IntentName,
  type IntentSpec,
  type Pitfall,
  type RoleSpec,
} from './intent-specs.js';
export { type ProofFrame, proveIntent } from './intent-prove.js';

// ── from a sentence to an intent ──────────────────────────────────────────

/** Lower case, accents dropped, curly apostrophes made straight. */
const fold = (text: string): string =>
  text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[’`]/g, "'");

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Whether a cue opens a word of the sentence · a cue is a stem ("accumul" finds
 *  "s'accumulent"), never the middle of a word. */
const cueFound = (sentence: string, cue: string): boolean =>
  new RegExp(`(^|[^a-z0-9])${escapeRegExp(cue)}`).test(sentence);

export interface IntentMatch {
  name: IntentName;
  /** The cues found in the sentence. */
  cues: string[];
  /** Words matched · a cue of two words weighs two. */
  score: number;
}

/** The cues of a list a sentence holds · how `rikiki intent` and `rikiki recipe` read
 *  a sentence. Cues are written folded (lower case, no accent). */
export function cuesIn(sentence: string, cues: readonly string[]): string[] {
  const folded = fold(sentence);
  return cues.filter((cue) => cueFound(folded, cue));
}

/** The intents a sentence points at, the closest first · the same sentence, the
 *  same answer. Ties keep the registry's order. */
export function closestIntents(sentence: string): IntentMatch[] {
  return INTENT_NAMES.map((name) => {
    const cues = cuesIn(sentence, INTENTS[name].cues);
    return { name, cues, score: cues.reduce((sum, cue) => sum + words(cue).length, 0) };
  })
    .filter((match) => match.score > 0)
    .sort((a, b) => b.score - a.score);
}

// ── compiling · from roles to a tree of layouts ───────────────────────────

/** What the proof needs to read the drawing back · which mark plays which part. */
export interface IntentPlan {
  main: IntentName;
  also: IntentName[];
  /** The names of the marks that play each role, as compiled. */
  roles: Record<string, string[]>;
  /** The amount each mark says in its `value`, by name · rates, sums, wholes. */
  rates: Record<string, number>;
  /** The marks inside a group that plays a role, in order, by the group's name ·
   *  the steps of a branch. */
  inside: Record<string, string[]>;
}

/** A node the compiler owns · its attributes are its to complete. */
type Owned = DgNode & { attrs: Record<string, string> };

interface Casting {
  /** The marks that play each role, in source order · a mark with two roles is in both. */
  cast: Map<string, Owned[]>;
  /** The author's links, the notes and anything with no part to play. */
  links: Owned[];
  rest: Owned[];
  /** The arrows that join a secondary intent to the main one · they run between two
   *  regions, so they belong to the root. */
  bridges: Owned[];
  /** Nodes already placed in a region · a mark shared by two intents is placed once. */
  placed: Set<DgNode>;
  names: Set<string>;
  fresh: () => number;
  issues: DgIssue[];
  plan: IntentPlan;
}

/** A part of the picture an intent compiles · a mark or a group, laid above or below
 *  the main one when an intent is a secondary. */
interface Region {
  nodes: Owned[];
  /** How the region places its nodes · a region of one node needs none. */
  layout?: Record<string, string>;
}

/** On one click, the eye follows two links at most. */
const LINKS_PER_CLICK = 2;
/** Tokens on the link into a stock, and out of it · illustrative, not a rate. */
const STOCK_IN_TOKENS = '3';
const STOCK_OUT_TOKENS = '1';
/** Tokens on each lane of a barrier that does not say. */
const LANE_TOKENS = '4';
/** Tokens on each link into a merge whose sources say no amount. */
const MERGE_TOKENS = '2';
/** The tone a mark turns when a change reaches it, or a line is crossed. */
const TURNED = 'danger';
/** A drift traces this many periods on entry, one after the other · the next ones
 *  come a click each, so no click moves for longer than the budget. */
const DRIFT_ON_ENTRY = 3;
/** The tone of the gaps of a drift before the last · filled, quieter than the accent. */
const GAP_TONE = 'muted';
/** Marks the compiler puts forward with `emphasis` · one surface in the accent. A
 *  queue is not: its taken places would be as many separate things put forward. */
const EMPHASIS_KINDS: ReadonlySet<MarkKind> = new Set(['box', 'meter', 'dot', 'bar']);
/** Root attributes that place · the intent places, so they are its own. */
const PLACING = ['layout', 'direction', 'columns', 'link', 'align'] as const;
/** Intents whose picture leans by nature · gaps that grow from one line, bars as long
 *  as their values · they say `balance="free"` for the author. */
const LEANING: ReadonlySet<IntentName> = new Set(['drift', 'compare']);
/** What a box says of how it moves, carried over to the frame it becomes. */
const MOTION = ['step', 'after', 'enter'] as const;

const tagOf = (node: DgNode) => `dg-${node.kind}`;

const own = (node: DgNode): Owned => ({
  ...node,
  attrs: { ...node.attrs },
  children: node.children.map(own),
});

/** Write an attribute unless the author did · the author's word stands. */
function setDefault(node: Owned, attribute: string, value: string): void {
  if (node.attrs[attribute] === undefined) node.attrs[attribute] = value;
}

function uniqueName(c: Casting, base: string): string {
  let name = base;
  for (let n = 2; c.names.has(name); n += 1) name = `${base}-${n}`;
  c.names.add(name);
  return name;
}

function create(
  c: Casting,
  kind: MarkKind,
  attrs: Record<string, string>,
  children: Owned[] = [],
): Owned {
  return { kind, attrs, children, index: c.fresh() };
}

const roleOf = (c: Casting, role: string): Owned[] => c.cast.get(role) ?? [];

/** The marks of several roles, in the order the author wrote them. */
const inSourceOrder = (c: Casting, ...roles: string[]): Owned[] =>
  roles.flatMap((role) => roleOf(c, role)).sort((a, b) => a.index - b.index);

const nameIs = (node: DgNode) => node.attrs.name!;

/** A tone on each click · `normal` until click `at`, then `tone`. */
const toneFrom = (at: number, tone: string) =>
  [...Array<string>(Math.max(0, at)).fill('normal'), tone].join(' ');

/** A rate as an author writes it in a `value` · `6 / h`, `1 200 par jour`. */
export function rateOf(node: DgNode): number {
  const match = /^\s*(-?[\d\s.,]*\d)/.exec(node.attrs.value ?? '');
  return match ? readNumber(match[1]!) : Number.NaN;
}

/** Keep the amount each mark says in its `value`, for the proof. */
function keepRates(c: Casting, nodes: Owned[]): void {
  for (const node of nodes) {
    const rate = rateOf(node);
    if (Number.isFinite(rate)) c.plan.rates[node.attrs.name!] = rate;
  }
}

/** Say the marks that must say an amount in `value` and do not. */
function requireRates(c: Casting, required: Owned[], what: string): void {
  const missing = required.filter((node) => !Number.isFinite(rateOf(node)));
  if (missing.length)
    c.issues.push({
      code: 'INT_VALUE_MISSING',
      severity: 'error',
      items: missing.map(nameOf),
      message: `${what} · ${missing.map(nameOf).join(', ')} says none in \`value\``,
      expected: 'a number at the start of `value`',
      fix: { action: 'set-attribute', attribute: 'value', on: missing.map(nameOf) },
    });
}

/** An arrow from each stage of a chain to the next · one `dg-link` per pair. */
function chainLinks(c: Casting, stages: Owned[][]): Owned[] {
  const links: Owned[] = [];
  for (let k = 1; k < stages.length; k += 1) {
    const from = stages[k - 1]!.map(nameIs);
    const to = stages[k]!.map(nameIs);
    links.push(
      create(c, 'link', { name: uniqueName(c, 'link'), from: from.join(' '), to: to.join(' ') }),
    );
  }
  return links;
}

/** A chain is a row when each stage is one mark, a graph by layers otherwise. */
const chainLayout = (stages: Owned[][]): Record<string, string> =>
  stages.every((stage) => stage.length === 1)
    ? { layout: 'row', gap: 'airy' }
    : { layout: 'layers', direction: 'right' };

/** The author's links between two marks of a set · they wire it themselves. */
function linksAmong(c: Casting, members: Owned[]): Owned[] {
  const names = new Set(members.map((m) => m.attrs.name));
  return c.links.filter(
    (link) =>
      words(link.attrs.from).some((n) => names.has(n)) &&
      words(link.attrs.to).some((n) => names.has(n)),
  );
}

/** The author's links of a set taken over by the intent · named, and no longer
 *  left over for the end of the diagram. */
function takeLinks(c: Casting, authored: Owned[]): void {
  for (const link of authored) setDefault(link, 'name', uniqueName(c, 'link'));
  c.links = c.links.filter((link) => !authored.includes(link));
}

/** One link per pair of an author's links · the label stays on the first pair, so
 *  each pair can wait for its own click. */
function perPair(c: Casting, authored: Owned[]): Owned[] {
  return authored.flatMap((link) =>
    words(link.attrs.from).flatMap((from, i) =>
      words(link.attrs.to).map((to, j) => {
        const { name: _name, label, from: _from, to: _to, ...rest } = link.attrs;
        const first = i === 0 && j === 0;
        return create(c, 'link', {
          ...rest,
          ...(first && label !== undefined ? { label } : {}),
          name: uniqueName(c, 'link'),
          from,
          to,
        });
      }),
    ),
  );
}

/** Put a mark forward unless the author put one of its fellows forward · for an
 *  intent whose focal role holds several marks (the core of a contain, the last
 *  period of a drift). */
function putForward(fellows: Owned[], mark: Owned | undefined): void {
  if (!mark || mark.attrs.tone !== undefined) return;
  if (fellows.some((m) => m.attrs.emphasis === 'true')) return;
  mark.attrs.emphasis = 'true';
}

function place(c: Casting, nodes: Owned[]): void {
  for (const node of nodes) c.placed.add(node);
}

/** A cause and its chain · the links trace one after the other on entry, the next
 *  mark coming in as its link reaches it; or, when the cause drives another intent,
 *  everything stands on entry and a token rides the chain on click `beat`. Returns
 *  the last click it plays on. */
function compileCause(c: Casting, beat: number): { region: Region; last: number } {
  const causes = roleOf(c, 'cause');
  const vias = roleOf(c, 'via');
  const effects = roleOf(c, 'effect');
  const stages = [causes, ...vias.map((v) => [v]), effects].filter((s) => s.length);
  const members = stages.flat();
  const authored = linksAmong(c, members);
  const links = authored.length ? authored : chainLinks(c, stages);
  takeLinks(c, authored);
  let last = beat;
  links.forEach((link, k) => {
    const click = beat + Math.floor(k / LINKS_PER_CLICK);
    last = Math.max(last, click);
    setDefault(link, 'flow', '1');
    if (k > 0) setDefault(link, 'after', links[k - 1]!.attrs.name!);
    if (beat === 0) setDefault(link, 'enter', 'draw');
    if (click > 0) setDefault(link, 'step', String(click));
  });
  if (beat === 0)
    for (const mark of members.filter((m) => !causes.includes(m))) {
      const into = links.find((link) => words(link.attrs.to).includes(mark.attrs.name!));
      if (into) setDefault(mark, 'after', into.attrs.name!);
    }
  else {
    // Driving another intent, the trigger is told in a lower voice, bare · and the
    // chain still comes in from the cause on, stage after stage, whatever its marks'
    // sizes, so an effect never stands before what causes it. A click the author
    // gave a mark stands, and is judged as written.
    for (const cause of causes) setDefault(cause, 'paint', 'none');
    stages.slice(1).forEach((stage, s) => {
      const before = stages[s]![0]!;
      if (before.attrs.step !== undefined) return;
      for (const mark of stage) setDefault(mark, 'after', nameIs(before));
    });
  }
  place(c, [...members, ...links]);
  return { region: { nodes: [...members, ...links], layout: chainLayout(stages) }, last };
}

/** Lanes, the gate across them, where they go, and what drives the gate · the gate
 *  closes on click `closeAt`. */
function compileBarrier(c: Casting, closeAt: number): Region[] {
  const flows = roleOf(c, 'flow');
  const [gate] = roleOf(c, 'barrier');
  const beyond = roleOf(c, 'beyond');
  const [control] = roleOf(c, 'control');
  for (const lane of flows) setDefault(lane, 'flow', LANE_TOKENS);
  // The gate is a narrow bar of accent · every box around it is outlined, so no
  // filled surface outweighs it.
  const around = [control, ...beyond, ...roleOf(c, 'via'), ...roleOf(c, 'effect')];
  for (const box of around) if (box?.kind === 'box') setDefault(box, 'paint', 'outline');
  if (gate) {
    setDefault(gate, 'state', [...Array(closeAt).fill('open'), 'closed'].join(' '));
    const driver = control ?? roleOf(c, 'effect').at(-1);
    if (driver) setDefault(gate, 'by', driver.attrs.name!);
  }
  const lanes = create(
    c,
    'group',
    { name: uniqueName(c, 'lanes'), layout: 'lanes', gap: 'tight' },
    [...flows, ...(gate ? [gate] : []), ...beyond],
  );
  const regions: Region[] = [];
  if (control && !c.placed.has(control)) regions.push({ nodes: [control] });
  regions.push({ nodes: [lanes] });
  place(c, [lanes, ...lanes.children, ...(control ? [control] : [])]);
  return regions;
}

/** Tokens for a rate · the rates kept in proportion, the largest at most `MAX_FLOW`. */
const tokensFor = (rate: number, largest: number) =>
  String(Math.max(1, Math.round(rate * Math.min(1, MAX_FLOW / largest) || 1)));

/** What arrives, what waits, the neck and where it goes · the rates written in
 *  `value` set the tokens on each side of the neck and how much of the queue fills
 *  on the click. */
function compileBottleneck(c: Casting): Region {
  const sources = roleOf(c, 'source');
  const [queue] = roleOf(c, 'queue');
  const [neck] = roleOf(c, 'neck');
  const sinks = roleOf(c, 'sink');
  const rated = [...sources, ...(neck ? [neck] : [])];
  keepRates(c, [...rated, ...sinks]);
  requireRates(
    c,
    rated,
    'a bottleneck is read from its rates, and the neck cannot be shown narrower without them',
  );
  const arriving = sources.reduce((sum, s) => sum + (rateOf(s) || 0), 0);
  const through = neck ? rateOf(neck) || 0 : 0;
  const largest = Math.max(arriving, through, 1);
  if (queue && arriving > 0) {
    setDefault(queue, 'count', String(Math.min(MAX_QUEUE, Math.max(2, Math.ceil(arriving)))));
    const count = readNumber(queue.attrs.count!);
    const waiting = Math.max(0, Math.round(((arriving - through) / arriving) * count));
    setDefault(queue, 'fill', `0 ${Math.min(count, waiting)}`);
  }
  const stages = [sources, queue ? [queue] : [], neck ? [neck] : [], sinks].filter((s) => s.length);
  const links = chainLinks(c, stages);
  const leaving = links.at(-1);
  for (const link of links) {
    const fromSources = words(link.attrs.from).some((n) => sources.some((s) => s.attrs.name === n));
    if (fromSources) {
      setDefault(link, 'flow', tokensFor(arriving / Math.max(1, sources.length), largest));
      setDefault(link, 'step', '1');
    } else if (link === leaving && neck && sinks.length) {
      setDefault(link, 'flow', tokensFor(through / sinks.length, largest));
      setDefault(link, 'step', '1');
    }
  }
  const nodes = [...stages.flat(), ...links];
  place(c, nodes);
  return { nodes, layout: chainLayout(stages) };
}

/** A stock between what feeds it and what drains it · tokens ride in and out on the
 *  click the stock first changes. Nothing when another intent placed the stock: what
 *  feeds it is then that intent's arrows, and an inflow or an outflow of its own would
 *  not be drawn, which is said. */
function compileAccumulate(c: Casting): Region | null {
  const [stock] = roleOf(c, 'stock');
  const inflows = roleOf(c, 'inflow');
  const outflows = roleOf(c, 'outflow');
  if (stock && c.placed.has(stock)) {
    refuseOwnFlows(c, stock, [...inflows, ...outflows]);
    return null;
  }
  if (!stock) return null;
  const stages = [inflows, [stock], outflows].filter((s) => s.length);
  const links = chainLinks(c, stages);
  const values = stockValues(stock);
  const changes = values.findIndex((v, k) => k > 0 && v !== values[k - 1]);
  for (const link of links) {
    const intoStock = words(link.attrs.to).includes(stock.attrs.name!);
    setDefault(link, 'flow', intoStock ? STOCK_IN_TOKENS : STOCK_OUT_TOKENS);
    if (changes > 0) setDefault(link, 'step', String(changes));
  }
  const nodes = [...stages.flat(), ...links];
  place(c, nodes);
  return stages.length > 1 ? { nodes, layout: chainLayout(stages) } : { nodes };
}

/** A stock another intent draws (a merge's `into`, a threshold's `measure`) is fed by
 *  that intent's arrows · an inflow or an outflow of its own has nowhere to be drawn. */
function refuseOwnFlows(c: Casting, stock: Owned, flows: Owned[]): void {
  if (!flows.length) return;
  c.issues.push({
    code: 'INT_ROLE_EXTRA',
    severity: 'error',
    items: flows.map(nameOf),
    message: `${nameIs(stock)} is drawn by ${c.plan.main} as well as the stock · it takes no inflow or outflow of its own, and ${flows.map(nameOf).join(', ')} would not be drawn`,
    measurement: { role: 'inflow outflow', count: flows.length },
    expected: { min: 0, max: 0 },
    fix: {
      action: 'remove-marks',
      roles: ['inflow', 'outflow'],
      or: 'a stock of its own, not shared',
    },
  });
}

/** The value a stock shows on each click · a queue's places taken, a meter's value. */
const stockValues = (node: DgNode): number[] =>
  words(node.kind === 'queue' ? node.attrs.fill : node.attrs.value).map(readNumber);

/** Before, then after on the next click · the parts named alike move. */
function compileTransform(c: Casting): Region {
  const [before] = roleOf(c, 'before');
  const [after] = roleOf(c, 'after');
  if (after) setDefault(after, 'step', '1');
  const nodes = [before, after].filter((n): n is Owned => !!n);
  place(c, nodes);
  return { nodes };
}

/** The stages round a ring, the output last · the arrows forward stand on entry, and
 *  the one that brings the output back is traced on click `beat`, a token riding it. */
function compileFeedback(c: Casting, beat: number): Region {
  const loop = inSourceOrder(c, 'stage', 'output');
  const [first] = roleOf(c, 'stage');
  const [output] = roleOf(c, 'output');
  const authored = linksAmong(c, loop);
  takeLinks(c, authored);
  const links = authored.length
    ? authored
    : chainLinks(
        c,
        loop.map((mark) => [mark]),
      );
  if (!authored.length && first && output && loop.length > 1)
    links.push(
      create(c, 'link', { name: uniqueName(c, 'back'), from: nameIs(output), to: nameIs(first) }),
    );
  const back = links.find(
    (link) =>
      !!first &&
      !!output &&
      words(link.attrs.from).includes(nameIs(output)) &&
      words(link.attrs.to).includes(nameIs(first)),
  );
  if (back) {
    setDefault(back, 'enter', 'draw');
    setDefault(back, 'flow', '1');
    setDefault(back, 'step', String(beat));
  }
  const nodes = [...loop, ...links];
  place(c, nodes);
  return { nodes, layout: { layout: 'ring' } };
}

/** One cell, then the crowd · on one grid, the unit first in reading order, so the
 *  crowd unfolds from it as the cells come in one after the other. */
function compileScale(c: Casting): Region {
  const [unit] = roleOf(c, 'unit');
  const [crowd] = roleOf(c, 'crowd');
  if (unit) setDefault(unit, 'count', '1');
  // The crowd is drawn hollow · hundreds of filled cells would outweigh the one.
  if (crowd) setDefault(crowd, 'tone', 'muted');
  const nodes = [unit, crowd].filter((n): n is Owned => !!n);
  place(c, nodes);
  return { nodes, layout: { layout: 'grid' } };
}

/** Frames inside frames · each layer but the last becomes a surface that holds the
 *  next, outlined and soft in turn, the innermost a mark put forward. They come in
 *  from the outside in. */
function compileContain(c: Casting): Region {
  const layers = roleOf(c, 'layer');
  const core = layers.at(-1);
  if (!core) return { nodes: [] };
  putForward(layers, core);
  let inner: Owned = core;
  for (let k = layers.length - 2; k >= 0; k -= 1) {
    const layer = layers[k]!;
    const note = layer.attrs.note
      ? [create(c, 'text', { name: uniqueName(c, 'about'), note: layer.attrs.note })]
      : [];
    const motion = Object.fromEntries(
      MOTION.filter((a) => layer.attrs[a] !== undefined).map((a) => [a, layer.attrs[a]!]),
    );
    inner = create(
      c,
      'group',
      {
        ...motion,
        name: nameIs(layer),
        ...(layer.attrs.label ? { label: layer.attrs.label } : {}),
        layout: 'column',
        align: 'start',
        gap: 'tight',
        paint: layer.attrs.paint ?? (k % 2 ? 'soft' : 'outline'),
      },
      [...note, inner],
    );
    // What a frame holds comes in once the frame is there.
    for (const child of inner.children) setDefault(child as Owned, 'after', nameIs(inner));
  }
  place(c, [inner, ...layers]);
  return { nodes: [inner] };
}

/** Columns side by side, one per branch · the k-th step of every branch waits for
 *  all the steps before it, so the steps of one rank come in together. The join
 *  comes last, the arrows from every branch traced into it. */
function compileParallel(c: Casting): Region {
  const branches = roleOf(c, 'branch');
  const [join] = roleOf(c, 'join');
  const steps = branches.map((branch) => {
    setDefault(branch, 'layout', 'column');
    setDefault(branch, 'paint', 'outline');
    setDefault(branch, 'gap', 'tight');
    const marks = (branch.children as Owned[]).filter(
      (child) => child.kind !== 'link' && !(child.kind === 'text' && child.attrs.for),
    );
    for (const mark of marks) setDefault(mark, 'name', uniqueName(c, 'step'));
    c.plan.inside[nameIs(branch)] = marks.map(nameIs);
    return marks;
  });
  // The first steps wait for the first column to stand, the next for every step of
  // the rank before · each rank starts at one moment.
  const depth = Math.max(0, ...steps.map((s) => s.length));
  const lastRank = steps.flatMap((s) => (s.length ? [nameIs(s.at(-1)!)] : []));
  for (let rank = 0; rank < depth; rank += 1) {
    const before =
      rank === 0
        ? branches.slice(0, 1).map(nameIs)
        : steps.flatMap((s) => (s[rank - 1] ? [nameIs(s[rank - 1]!)] : []));
    for (const s of steps) if (s[rank]) setDefault(s[rank]!, 'after', before.join(' '));
  }
  const links = join
    ? branches.map((branch) =>
        create(c, 'link', {
          name: uniqueName(c, 'meet'),
          from: nameIs(branch),
          to: nameIs(join),
          enter: 'draw',
          after: lastRank.join(' '),
        }),
      )
    : [];
  if (join) setDefault(join, 'after', lastRank.join(' '));
  const nodes = [...branches, ...(join ? [join] : []), ...links];
  place(c, nodes);
  return {
    nodes,
    layout: join ? { layout: 'layers', direction: 'down' } : { layout: 'row', gap: 'airy' },
  };
}

/** The rank of each mark from the origin, following the arrows · absent when no
 *  arrow gets there. */
function ranksFrom(origin: string, links: Owned[]): Map<string, number> {
  const rank = new Map<string, number>([[origin, 0]]);
  const queue = [origin];
  while (queue.length) {
    const here = queue.shift()!;
    for (const link of links.filter((l) => l.attrs.from === here && l.attrs.dashed !== 'true')) {
      const to = link.attrs.to!;
      if (rank.has(to)) continue;
      rank.set(to, rank.get(here)! + 1);
      queue.push(to);
    }
  }
  return rank;
}

/** A tree from the origin, rank after rank to the right · everything stands on
 *  entry, and on each click a token rides into the next rank and its marks turn. */
function compilePropagate(c: Casting, beat: number): Region {
  const [origin] = roleOf(c, 'origin');
  const reached = roleOf(c, 'reached');
  // An origin that is also the effect of a cause is drawn by the cause · drawn here
  // too, it would stand twice. Said, and drawn once.
  if (origin && c.placed.has(origin)) refuseSharedOrigin(c, origin);
  const members = [origin, ...reached].filter((n): n is Owned => !!n && !c.placed.has(n));
  const authored = linksAmong(c, members);
  takeLinks(c, authored);
  const links = authored.length
    ? perPair(c, authored)
    : origin
      ? reached.map((mark) =>
          create(c, 'link', {
            name: uniqueName(c, 'wave'),
            from: nameIs(origin),
            to: nameIs(mark),
          }),
        )
      : [];
  const rank = origin ? ranksFrom(nameIs(origin), links) : new Map<string, number>();
  const clickOf = (r: number) => beat + r - 1;
  for (const link of links) {
    const from = rank.get(link.attrs.from!);
    if (from === undefined || rank.get(link.attrs.to!) !== from + 1) continue;
    setDefault(link, 'flow', '1');
    setDefault(link, 'step', String(clickOf(from + 1)));
  }
  for (const mark of reached) {
    const r = rank.get(nameIs(mark));
    if (r !== undefined) setDefault(mark, 'tone', toneFrom(clickOf(r), TURNED));
  }
  const nodes = [...members, ...links];
  place(c, nodes);
  return { nodes, layout: { layout: 'layers', direction: 'right' } };
}

/** A cause drives a propagation by its click, not by an arrow · the mark its chain
 *  ends in and the origin of the wave are two marks. */
function refuseSharedOrigin(c: Casting, origin: Owned): void {
  c.issues.push({
    code: 'INT_ROLE_EXTRA',
    severity: 'error',
    items: [nameOf(origin)],
    message: `${nameIs(origin)} plays the effect of the cause and the origin of the wave · the cause draws it above, so the wave has no root · give the origin a mark of its own`,
    measurement: { role: 'origin', count: 1 },
    expected: { shared: false },
    fix: { action: 'split-mark', roles: ['effect', 'origin'] },
  });
}

/** The first click a meter's value is on the other side of its threshold from the
 *  first one, -1 when it never is. */
function crossingClick(meter: DgNode): number {
  const line = readNumber(meter.attrs.threshold ?? '');
  if (!Number.isFinite(line)) return -1;
  const values = words(meter.attrs.value).map(readNumber);
  const start = (values[0] ?? 0) >= line;
  return values.findIndex((v) => v >= line !== start);
}

/** The gauge and its line, what tips under it · on the click the line is crossed,
 *  a token rides down once the gauge has filled, and what tips turns. The gauge may
 *  be the stock of another intent, placed there. */
function compileThreshold(c: Casting): Region {
  const [measure] = roleOf(c, 'measure');
  const [consequence] = roleOf(c, 'consequence');
  if (measure && !measure.attrs.threshold)
    c.issues.push({
      code: 'INT_VALUE_MISSING',
      severity: 'error',
      items: [nameOf(measure)],
      message: `a threshold is a line on the gauge · ${nameOf(measure)} says none in \`threshold\``,
      expected: 'threshold="80" on the measure, on the scale of its values',
      fix: { action: 'set-attribute', attribute: 'threshold', on: nameOf(measure) },
    });
  const crossing = measure ? crossingClick(measure) : -1;
  if (consequence) {
    // Outlined, so its tone shows when it tips, and no surface outweighs the gauge.
    setDefault(consequence, 'paint', 'outline');
    if (crossing > 0) setDefault(consequence, 'tone', toneFrom(crossing, TURNED));
  }
  const nodes = [measure, consequence].filter((n): n is Owned => !!n && !c.placed.has(n));
  const links =
    measure && consequence
      ? [
          create(c, 'link', {
            name: uniqueName(c, 'tips'),
            from: nameIs(measure),
            to: nameIs(consequence),
          }),
        ]
      : [];
  for (const link of links)
    if (crossing > 0) {
      setDefault(link, 'flow', '1');
      setDefault(link, 'step', String(crossing));
      setDefault(link, 'after', nameIs(measure!));
    }
  place(c, [...nodes, ...links]);
  if (nodes.length > 1)
    return { nodes: [...nodes, ...links], layout: { layout: 'column', gap: 'airy' } };
  // A gauge another intent draws tips what is under it all the same · the arrow runs
  // from that intent's part of the picture into this one, so it is the root's.
  c.bridges.push(...links);
  return { nodes };
}

/** The choice above, forking down into what it wins and what it costs, a gauge each
 *  side by side like the pans of a balance · on the click they move, a token rides
 *  to each and both move at once. */
function compileTradeoff(c: Casting): Region {
  const [lever] = roleOf(c, 'lever');
  const gauges = inSourceOrder(c, 'gain', 'cost');
  const moves = Math.max(
    0,
    ...gauges.map((gauge) => {
      const values = words(gauge.attrs.value);
      return values.findIndex((v, k) => k > 0 && v !== values[k - 1]);
    }),
  );
  const links = lever
    ? gauges.map((gauge) =>
        create(c, 'link', { name: uniqueName(c, 'fork'), from: nameIs(lever), to: nameIs(gauge) }),
      )
    : [];
  if (moves > 0)
    for (const link of links) {
      setDefault(link, 'flow', '1');
      setDefault(link, 'step', String(moves));
    }
  const nodes = [...(lever ? [lever] : []), ...gauges, ...links];
  place(c, nodes);
  return { nodes, layout: { layout: 'layers', direction: 'down', gap: 'airy' } };
}

/** A line at what was planned, and from it the gap of each period on a track of its
 *  own, traced one after the other · the gaps filled in ink, the widest, the last,
 *  put forward in the accent. */
function compileDrift(c: Casting): Region {
  const [reference] = roleOf(c, 'reference');
  const measures = roleOf(c, 'measure');
  const at = reference?.attrs.value;
  const last = measures.at(-1);
  measures.forEach((measure, k) => {
    if (at !== undefined && measure.attrs.value !== undefined) {
      setDefault(measure, 'from', at);
      setDefault(measure, 'to', measure.attrs.value);
    }
    if (k > 0 && k < DRIFT_ON_ENTRY) setDefault(measure, 'after', nameIs(measures[k - 1]!));
    if (k >= DRIFT_ON_ENTRY) setDefault(measure, 'step', String(k - DRIFT_ON_ENTRY + 1));
  });
  putForward(measures, last);
  // The gaps before the last are ink, not pale cards · the widening is read off them.
  for (const measure of measures)
    if (measure !== last && measure.attrs.emphasis !== 'true')
      setDefault(measure, 'tone', GAP_TONE);
  const nodes = [...measures, ...(reference ? [reference] : [])];
  place(c, nodes);
  return { nodes, layout: { layout: 'axis' } };
}

/** Bars on one scale in the order written · the one in question grows once the
 *  others have. */
function compileCompare(c: Casting): Region {
  const bars = inSourceOrder(c, 'subject', 'other');
  const [subject] = roleOf(c, 'subject');
  const others = roleOf(c, 'other');
  requireRates(c, bars, 'a comparison is drawn from the values, in one unit');
  if (subject && others.length) setDefault(subject, 'after', others.map(nameIs).join(' '));
  place(c, bars);
  return { nodes: bars, layout: { layout: 'column', gap: 'tight' } };
}

/** The parts end to end on one band, from nothing to their sum, in the order
 *  written · under the whole's caption. */
function compilePartition(c: Casting): Region {
  const [whole] = roleOf(c, 'whole');
  const parts = inSourceOrder(c, 'share', 'part');
  keepRates(c, [...(whole ? [whole] : []), ...parts]);
  requireRates(c, parts, 'a partition is drawn end to end from the amount of each part');
  let at = 0;
  for (const part of parts) {
    const value = rateOf(part);
    if (!Number.isFinite(value)) continue;
    setDefault(part, 'from', String(at));
    at += value;
    setDefault(part, 'to', String(at));
  }
  const caption = whole
    ? [whole.attrs.label, whole.attrs.value].filter(Boolean).join(' · ')
    : undefined;
  const band = create(
    c,
    'group',
    {
      name: whole ? nameIs(whole) : uniqueName(c, 'whole'),
      layout: 'axis',
      ...(caption ? { label: caption } : {}),
    },
    parts,
  );
  place(c, [band, ...parts, ...(whole ? [whole] : [])]);
  return { nodes: [band] };
}

/** The sources in a row above, and straight arrows converging down into where they
 *  meet, a funnel · on click `beat` the tokens ride every arrow at once, as many as
 *  each source says. */
function compileMerge(c: Casting, beat: number): Region {
  const sources = roleOf(c, 'source');
  const [into] = roleOf(c, 'into');
  const members = [...sources, ...(into ? [into] : [])];
  keepRates(c, members);
  const authored = linksAmong(c, members);
  takeLinks(c, authored);
  const links = authored.length
    ? authored
    : into
      ? sources.map((source) =>
          create(c, 'link', { name: uniqueName(c, 'in'), from: nameIs(source), to: nameIs(into) }),
        )
      : [];
  // A queue is entered at its tail, the left end, and read toward the right one that
  // leads out · the sources stand in a column at its left and their lines join it
  // there. Into anything else they converge from above in straight lines, a funnel.
  const atTail = into?.kind === 'queue';
  // The queue's places are small · filled sources beside it would outweigh where
  // they meet, so they are outlined, as the boxes round a gate are.
  if (atTail) for (const source of sources) setDefault(source, 'paint', 'outline');
  const largest = Math.max(1, ...sources.map((s) => rateOf(s) || 0));
  for (const link of links) {
    const source = sources.find((s) => words(link.attrs.from).includes(nameIs(s)));
    const rate = source ? rateOf(source) : Number.NaN;
    setDefault(link, 'flow', Number.isFinite(rate) ? tokensFor(rate, largest) : MERGE_TOKENS);
    setDefault(link, 'step', String(beat));
    if (!atTail) setDefault(link, 'route', 'straight');
  }
  const nodes = [...members, ...links];
  place(c, nodes);
  return { nodes, layout: { layout: 'layers', direction: atTail ? 'right' : 'down' } };
}

/** Every role an intent knows, with the intent it belongs to. */
function rolesOf(active: IntentName[]): Map<string, { intent: IntentName; spec: RoleSpec }> {
  const known = new Map<string, { intent: IntentName; spec: RoleSpec }>();
  for (const intent of active)
    for (const spec of INTENTS[intent].compiled.roles) known.set(spec.role, { intent, spec });
  return known;
}

/** Sort the root's children by the part they play · and say what plays no part, a
 *  part no intent of the diagram has, a mark that cannot play its part. */
function castRoles(c: Casting, children: DgNode[], active: IntentName[]): void {
  const known = rolesOf(active);
  const none: string[] = [];
  const unknown: string[] = [];
  const wrongKind: string[] = [];
  for (const child of children.map(own)) {
    if (child.kind === 'link') {
      c.links.push(child);
      continue;
    }
    const roles = words(child.attrs.role);
    if (child.kind === 'text' && child.attrs.for && !roles.length) {
      c.rest.push(child);
      continue;
    }
    if (!roles.length) {
      none.push(`${tagOf(child)} ${nameOf(child)}`);
      c.rest.push(child);
      continue;
    }
    let cast = false;
    for (const role of roles) {
      const entry = known.get(role);
      if (!entry) unknown.push(`${tagOf(child)} ${nameOf(child)} · role="${role}"`);
      else if (!entry.spec.tags.includes(tagOf(child)))
        wrongKind.push(
          `${tagOf(child)} ${nameOf(child)} · role="${role}" is played by ${entry.spec.tags.join(', ')}`,
        );
      else {
        if (!child.attrs.name) child.attrs.name = uniqueName(c, role);
        c.cast.set(role, [...roleOf(c, role), child]);
        cast = true;
      }
    }
    if (!cast) c.rest.push(child);
  }
  const roleList = [...known.keys()].join(', ');
  if (none.length)
    c.issues.push({
      code: 'INT_ROLE_NONE',
      severity: 'error',
      items: none,
      message: `in a diagram written as an intent every mark plays a part · ${none.join(', ')} has no role, so the intent cannot place it · drawn at the end`,
      expected: `role is one of ${roleList}`,
      fix: { action: 'set-attribute', attribute: 'role', oneOf: [...known.keys()] },
    });
  if (unknown.length)
    c.issues.push({
      code: 'INT_ROLE_UNKNOWN',
      severity: 'error',
      items: unknown,
      message: `no intent of this diagram has that part · the roles here are ${roleList}`,
      expected: [...known.keys()],
      fix: { action: 'set-attribute', attribute: 'role', oneOf: [...known.keys()] },
    });
  if (wrongKind.length)
    c.issues.push({
      code: 'INT_ROLE_KIND',
      severity: 'error',
      items: wrongKind,
      message: 'that mark cannot play that part · a lane flows, a gate stops, a queue waits',
      fix: { action: 'change-mark' },
    });
}

/** Each role holds as many marks as its intent asks for. */
function checkCardinality(c: Casting, active: IntentName[]): void {
  for (const intent of active) {
    for (const spec of INTENTS[intent].compiled.roles) {
      const count = roleOf(c, spec.role).length;
      const bounds = spec.min === spec.max ? `${spec.min}` : `${spec.min} to ${spec.max}`;
      if (count < spec.min)
        c.issues.push({
          code: 'INT_ROLE_MISSING',
          severity: 'error',
          items: [`${intent} · ${spec.role}`],
          message: `${intent} needs ${bounds} ${spec.tags.join(' or ')} with role="${spec.role}" (${spec.says}) · ${count === 0 ? 'none is' : `${count} are`} there`,
          measurement: { role: spec.role, count },
          expected: { min: spec.min, max: spec.max },
          fix: { action: 'add-mark', tags: spec.tags, role: spec.role, min: spec.min },
        });
      if (count > spec.max)
        c.issues.push({
          code: 'INT_ROLE_EXTRA',
          severity: 'error',
          items: roleOf(c, spec.role).slice(spec.max).map(nameOf),
          message: `${intent} takes ${bounds} role="${spec.role}" · ${count} play it, and the eye cannot follow more`,
          measurement: { role: spec.role, count },
          expected: { min: spec.min, max: spec.max },
          fix: { action: 'remove-marks', role: spec.role, keep: spec.max },
        });
    }
  }
}

/** The main intent, or null when it is not one · said. */
function mainIntent(c: Casting, written: string): IntentName | null {
  const name = written.trim();
  if ((INTENT_NAMES as readonly string[]).includes(name)) return name as IntentName;
  c.issues.push({
    code: 'INT_INTENT_UNKNOWN',
    severity: 'error',
    items: [`intent="${name}"`],
    message: `"${name}" is not an intent · the diagram is drawn as written, without one`,
    expected: [...INTENT_NAMES],
    fix: { action: 'set-attribute', attribute: 'intent', oneOf: [...INTENT_NAMES] },
  });
  return null;
}

/** A main intent and this many secondaries at most · a picture that proves four
 *  things proves none. */
const MAX_SECONDARIES = 2;

/** The secondary intents that compose with the main one. */
function secondaries(c: Casting, main: IntentName, written: string[]): IntentName[] {
  if (written.length > MAX_SECONDARIES)
    c.issues.push({
      code: 'INT_COMPOSE_MANY',
      severity: 'error',
      items: written.slice(MAX_SECONDARIES).map((name) => `also="${name}"`),
      message: `one main intent and ${MAX_SECONDARIES} secondaries at most · ${written.length} are asked, the first ${MAX_SECONDARIES} are kept`,
      measurement: { secondaries: written.length },
      expected: { secondaries: MAX_SECONDARIES },
      fix: { action: 'split-slide', keep: written.slice(0, MAX_SECONDARIES) },
    });
  const composes = INTENTS[main].compiled.composes;
  const kept: IntentName[] = [];
  const refused: string[] = [];
  for (const name of written.slice(0, MAX_SECONDARIES)) {
    if (composes.includes(name as IntentName) && !kept.includes(name as IntentName))
      kept.push(name as IntentName);
    else refused.push(name);
  }
  if (refused.length)
    c.issues.push({
      code: 'INT_COMPOSE_INVALID',
      severity: 'error',
      items: refused.map((name) => `also="${name}"`),
      message: `${main} composes with ${composes.length ? composes.join(', ') : 'no other intent'} · ${refused.join(', ')} is dropped · ${REFUSED_BECAUSE}`,
      expected: [...composes],
      fix: { action: 'remove-attribute-word', attribute: 'also', words: refused },
    });
  return kept;
}

/** Every mark of a tree, with the state it stands in. */
function marksIn(
  nodes: Owned[],
  state: Owned | null = null,
): { node: Owned; state: Owned | null }[] {
  return nodes.flatMap((node) => [
    { node, state },
    ...marksIn(node.children as Owned[], node.kind === 'state' ? node : state),
  ]);
}

/** One thing put forward per picture, and it is the part the main intent argues
 *  for · put forward for the author when nothing is. */
function settleFocal(c: Casting, tree: Owned[]): void {
  const focal = INTENTS[c.plan.main].compiled.focal;
  const holders = roleOf(c, focal);
  const marks = marksIn(tree).filter(({ node }) => node.kind !== 'link');
  const forward = marks.filter(({ node }) => node.attrs.emphasis === 'true');
  if (!forward.length) {
    const [only] = holders;
    if (holders.length === 1 && EMPHASIS_KINDS.has(only!.kind) && only!.attrs.tone === undefined)
      only!.attrs.emphasis = 'true';
    return;
  }
  const pictures = new Map<Owned | null, Owned[]>();
  for (const { node, state } of forward)
    pictures.set(state, [...(pictures.get(state) ?? []), node]);
  const crowded = [...pictures.values()].filter((nodes) => nodes.length > 1);
  if (crowded.length)
    c.issues.push({
      code: 'INT_FOCAL_MULTIPLE',
      severity: 'error',
      items: crowded.flat().map(nameOf),
      message: `${crowded[0]!.length} marks are put forward in one picture · an intent argues for one thing, the ${focal}`,
      measurement: { putForward: crowded[0]!.length },
      expected: { putForward: 1, role: focal },
      fix: { action: 'one-emphasis', keep: focal },
    });
  const offRole =
    c.plan.main === 'transform' ? [] : forward.filter(({ node }) => !holders.includes(node));
  if (offRole.length)
    c.issues.push({
      code: 'INT_FOCAL_OFF_ROLE',
      severity: 'error',
      items: offRole.map(({ node }) => nameOf(node)),
      message: `${offRole.map(({ node }) => nameOf(node)).join(', ')} is put forward, and it is not the ${focal} · the picture would argue for something the intent does not`,
      expected: { role: focal },
      fix: { action: 'remove-attribute', attribute: 'emphasis', focal },
    });
}

/** The root's own attributes once compiled · the author's, without what places. */
function rootAttributes(c: Casting, attrs: Record<string, string>): Record<string, string> {
  const placing = PLACING.filter((name) => attrs[name] !== undefined);
  if (placing.length)
    c.issues.push({
      code: 'INT_LAYOUT_FIXED',
      severity: 'warning',
      items: placing.map((name) => `${name}="${attrs[name]}"`),
      message: `${c.plan.main} places its marks itself · ${placing.join(', ')} is dropped`,
      fix: { action: 'remove-attributes', attributes: placing },
    });
  const kept = { ...attrs };
  for (const name of PLACING) delete kept[name];
  return kept;
}

/** Regions one under the other · one region alone becomes the root itself. */
function assemble(
  c: Casting,
  attrs: Record<string, string>,
  regions: Region[],
): { attrs: Record<string, string>; children: DgNode[] } {
  const leftover = [...c.bridges, ...c.links, ...c.rest];
  const drawn = regions.filter((region) => region.nodes.length);
  if (drawn.length === 1) {
    const [region] = drawn;
    return {
      attrs: { ...attrs, ...(region!.layout ?? {}) },
      children: [...region!.nodes, ...leftover],
    };
  }
  const children = drawn.map((region) => asNode(c, region));
  // The arrows between two parts need the gap between them to be seen as arrows.
  const gap: Record<string, string> = c.bridges.length ? { gap: 'airy' } : {};
  return {
    attrs: { ...attrs, layout: 'column', ...gap },
    children: [...children, ...leftover],
  };
}

/** The part of the main intent a cause above drives, by role · its chain ends in an
 *  arrow into it. A barrier is driven through its gate's line (`by`), not an arrow. */
const DRIVEN: Partial<Record<IntentName, string>> = {
  propagate: 'origin',
  threshold: 'measure',
  accumulate: 'stock',
};

/** The parts of the main intent that fill a stock, or move a gauge, drawn below it ·
 *  by role, the first one cast. */
const FEEDING: Partial<Record<IntentName, readonly string[]>> = {
  cause: ['effect'],
  barrier: ['barrier'],
  bottleneck: ['queue', 'neck'],
  feedback: ['output'],
  merge: ['into'],
  accumulate: ['stock'],
  threshold: ['consequence', 'measure'],
};

/** Main intents drawn as a ring, whose stock stands in its middle, not under it. */
const STOCK_INSIDE: ReadonlySet<IntentName> = new Set(['feedback']);

/** A region as one node · a group when it places several marks. */
const asNode = (c: Casting, region: Region): Owned =>
  region.layout
    ? create(c, 'group', { name: uniqueName(c, 'part'), ...region.layout }, region.nodes)
    : region.nodes[0]!;

/** The first click a stock or a gauge shows a new value on · 0 when it never does. */
function firstChange(node: DgNode): number {
  const values = stockValues(node);
  return Math.max(
    0,
    values.findIndex((v, k) => k > 0 && v !== values[k - 1]),
  );
}

/** An arrow from one region into another · a secondary is a part of the picture, and
 *  a part that no arrow joins to the rest floats beside it. Nothing when the two are
 *  one mark, or one is missing. */
function bridge(
  c: Casting,
  from: Owned | undefined,
  to: Owned | undefined,
  attrs: Record<string, string>,
): void {
  if (!from || !to || from === to) return;
  c.bridges.push(
    create(c, 'link', {
      name: uniqueName(c, 'bridge'),
      from: nameIs(from),
      to: nameIs(to),
      ...attrs,
    }),
  );
}

/** The mark of the main intent that feeds what a secondary draws below it. */
const feederOf = (c: Casting): Owned | undefined =>
  (FEEDING[c.plan.main] ?? []).map((role) => roleOf(c, role).at(-1)).find(Boolean);

/** The regions of the main intent and its secondaries, top to bottom · a cause that
 *  drives the main intent above it and plays first, a stock and a line crossed below,
 *  each joined to the main intent by an arrow. */
function compileRegions(c: Casting): Region[] {
  const { main, also } = c.plan;
  const above: Region[] = [];
  let beat = 1;
  if (also.includes('cause') && main !== 'cause') {
    const cause = compileCause(c, beat);
    above.push(cause.region);
    // Standing from the entrance, like the chain above it · the main intent's own
    // motion on the next click tells what the cause sets off.
    const driven = DRIVEN[main];
    if (driven) bridge(c, roleOf(c, 'effect').at(-1), roleOf(c, driven)[0], {});
    beat = cause.last + 1;
  }
  let middle = mainRegions(c, beat);
  const below: Region[] = [];
  const stock = also.includes('accumulate') ? compileAccumulate(c) : null;
  if (stock) {
    // A loop fills the stock in its middle · the ring keeps its centre for it, and
    // the arrow from the output goes straight in. Anywhere else the stock is below.
    const [ring] = middle;
    const inside = STOCK_INSIDE.has(main) && !!ring && stock.nodes.length === 1;
    if (inside) middle = [{ ...ring, nodes: [...ring.nodes, ...stock.nodes] }];
    else below.push(stock);
    const [held] = roleOf(c, 'stock');
    if (held && !roleOf(c, 'inflow').length) {
      const changes = firstChange(held);
      bridge(c, feederOf(c), held, {
        flow: STOCK_IN_TOKENS,
        ...(changes > 0 ? { step: String(changes) } : {}),
        ...(inside ? { route: 'straight' } : {}),
      });
    }
  }
  if (also.includes('threshold')) {
    const [measure] = roleOf(c, 'measure');
    const standsApart = !!measure && !c.placed.has(measure);
    below.push(compileThreshold(c));
    if (standsApart) bridge(c, feederOf(c), measure, {});
  }
  return [...above, ...middle, ...below];
}

/** The regions of the main intent · its beat is the click it plays on. */
function mainRegions(c: Casting, beat: number): Region[] {
  switch (c.plan.main) {
    case 'cause':
      return [compileCause(c, 0).region];
    case 'barrier':
      return compileBarrier(c, beat);
    case 'bottleneck':
      return [compileBottleneck(c)];
    case 'accumulate': {
      const region = compileAccumulate(c);
      return region ? [region] : [];
    }
    case 'transform':
      return [compileTransform(c)];
    case 'feedback':
      return [compileFeedback(c, beat)];
    case 'scale':
      return [compileScale(c)];
    case 'contain':
      return [compileContain(c)];
    case 'parallel':
      return [compileParallel(c)];
    case 'propagate':
      return [compilePropagate(c, beat)];
    case 'threshold':
      return [compileThreshold(c)];
    case 'tradeoff':
      return [compileTradeoff(c)];
    case 'drift':
      return [compileDrift(c)];
    case 'compare':
      return [compileCompare(c)];
    case 'partition':
      return [compilePartition(c)];
    case 'merge':
      return [compileMerge(c, beat)];
  }
}

/** Every name the author gave · a name the compiler makes never takes one of them. */
function namesIn(nodes: DgNode[], into = new Set<string>()): Set<string> {
  for (const node of nodes) {
    if (node.attrs.name) into.add(node.attrs.name);
    namesIn(node.children, into);
  }
  return into;
}

/** Compile a diagram written as an intent into a tree of layouts · the hook
 *  `parseDiagram` takes. A diagram without `intent` is returned as it is. */
export function compileIntent(
  tree: { attrs: Record<string, string>; children: DgNode[] },
  fresh: () => number,
): { attrs: Record<string, string>; children: DgNode[]; issues: DgIssue[]; intent?: IntentPlan } {
  const issues: DgIssue[] = [];
  if (tree.attrs.intent === undefined) {
    const playing = marksIn(tree.children.map(own)).filter(({ node }) => node.attrs.role);
    if (playing.length)
      issues.push({
        code: 'INT_ROLE_NO_INTENT',
        severity: 'warning',
        items: playing.map(({ node }) => nameOf(node)),
        message:
          'a role is a part in an intent · this diagram has no `intent`, so the roles do nothing',
        fix: { action: 'set-attribute', attribute: 'intent', oneOf: [...INTENT_NAMES] },
      });
    return { ...tree, issues };
  }
  const c: Casting = {
    cast: new Map(),
    links: [],
    rest: [],
    bridges: [],
    placed: new Set(),
    names: namesIn(tree.children),
    fresh,
    issues,
    plan: { main: 'cause', also: [], roles: {}, rates: {}, inside: {} },
  };
  const main = mainIntent(c, tree.attrs.intent);
  if (!main) return { ...tree, issues };
  const also = secondaries(c, main, words(tree.attrs.also));
  c.plan = { main, also, roles: {}, rates: {}, inside: {} };
  castRoles(c, tree.children, [main, ...also]);
  checkCardinality(c, [main, ...also]);
  for (const [role, nodes] of c.cast) c.plan.roles[role] = nodes.map(nameIs);
  const regions = compileRegions(c);
  const compiled = assemble(c, rootAttributes(c, tree.attrs), regions);
  if (LEANING.has(main) && compiled.attrs.balance === undefined) compiled.attrs.balance = 'free';
  settleFocal(c, compiled.children as Owned[]);
  return { ...compiled, issues, intent: c.plan };
}
