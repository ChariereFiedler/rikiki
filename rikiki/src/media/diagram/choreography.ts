// ════════════════════════════════════════════════════════════════
// RIKIKI · diagram, the choreography
//
// From a drawing to the cues of its motion: each mark comes in on the click it
// belongs to (its own `step`, or its group's, or the one of what it links), in the
// way it says (`enter`) or the way its kind comes in; each lane plays a run of
// tokens when it appears and on every click that moves a gate on it; each gate
// drops when its state changes; tokens ride a link with a `flow`. The schedule
// (motion.ts) then says when. Pure: a layout in, cues out.
// ════════════════════════════════════════════════════════════════

import type {
  DiagramLayout,
  LGate,
  LItem,
  LLane,
  LLink,
  LNote,
  LRun,
  LayoutOptions,
} from './layout.js';
import { atClick, gateStateAt, layoutDiagram, stepOf } from './layout.js';
import { SPEEDS } from './lanes.js';
import type { DgNode, ParsedDiagram } from './model.js';
import {
  type Cue,
  ENTERS,
  ENTER_SECONDS,
  type Enter,
  FILL_SECONDS,
  type MotionIssue,
  SWITCH_SECONDS,
  type Timing,
  schedule,
} from './motion.js';

/** A cursor travels along its axis for this long. */
export const TRAVEL_SECONDS = 1.2;
/** A curve is traced from its first value to its last for this long · slower than a
 *  link, so the eye follows the shape as it forms. */
export const TRACE_SECONDS = 1.4;
/** Tokens on one link leave this far apart. */
export const RIDE_SPACING = 0.18;
const MIN_RIDE = 0.4;
const MAX_RIDE = 1.2;

/** How each kind comes in when it does not say. */
function defaultEnter(item: LItem): Enter {
  switch (item.kind) {
    case 'frame':
      return 'fade';
    case 'bar':
    case 'lane':
    case 'gate':
    case 'cursor':
    case 'meter':
    case 'queue':
    case 'curve':
      return 'draw';
    case 'span':
      return item.shape === 'stretch' ? 'draw' : 'pop';
    // Panels come in as a surface does · a band is drawn along its time.
    case 'terminal':
    case 'table':
    case 'screen':
      return 'fade';
    case 'band':
      return 'draw';
    default:
      return 'pop';
  }
}

const enterOf = (node: DgNode | undefined, fallback: Enter): Enter =>
  node && (ENTERS as readonly string[]).includes(node.attrs.enter ?? '')
    ? (node.attrs.enter as Enter)
    : fallback;

export const itemEnter = (item: LItem): Enter => enterOf(item.node, defaultEnter(item));
export const linkEnter = (link: LLink): Enter => enterOf(link.node, 'fade');
export const noteEnter = (note: LNote): Enter => enterOf(note.node, 'fade');

/** How long an entrance takes · a cursor that travels takes its time, a gate
 *  drops and a meter fills as fast as they do on a click. */
export function durationOf(item: LItem, enter: Enter): number {
  if (enter !== 'draw') return ENTER_SECONDS[enter];
  if (item.kind === 'cursor') return TRAVEL_SECONDS;
  if (item.kind === 'gate') return SWITCH_SECONDS;
  if (item.kind === 'meter' || item.kind === 'queue') return FILL_SECONDS;
  if (item.kind === 'curve') return TRACE_SECONDS;
  return ENTER_SECONDS.draw;
}

/** Whether an item looks otherwise on click `stage` than on the click before · a
 *  gate that moves, a meter or a queue whose value or tone changes, a box that
 *  turns. */
export function changesOn(item: LItem, stage: number, appears: number): boolean {
  if (stage <= appears) return false;
  if (item.kind === 'gate')
    return gateStateAt(item, stage, appears) !== gateStateAt(item, stage - 1, appears);
  if (item.kind === 'meter' || item.kind === 'queue')
    return (
      atClick(item.fills, stage) !== atClick(item.fills, stage - 1) ||
      atClick(item.tones, stage) !== atClick(item.tones, stage - 1)
    );
  if (item.kind === 'box') return atClick(item.tones, stage) !== atClick(item.tones, stage - 1);
  if (item.kind === 'switch')
    return atClick(item.states, stage) !== atClick(item.states, stage - 1);
  return false;
}

/** The click an item last changed on, up to the click shown · the one it appeared
 *  on when it has not changed since. */
export function lastChange(item: LItem, appears: number, shown: number): number {
  let since = appears;
  for (let stage = appears + 1; stage <= shown; stage += 1)
    if (changesOn(item, stage, appears)) since = stage;
  return since;
}

/** The click each node of the tree belongs to · its own `step`, or a group's above it. */
function stagesByNode(nodes: DgNode[], above = 0, into = new Map<DgNode, number>()) {
  for (const node of nodes) {
    const stage = Math.max(above, stepOf(node));
    into.set(node, stage);
    stagesByNode(node.children, stage, into);
  }
  return into;
}

export const cueIds = {
  item: (i: number) => `i${i}`,
  run: (i: number, stage: number) => `i${i}:run${stage}`,
  switch: (i: number, stage: number) => `i${i}:switch${stage}`,
  link: (j: number) => `l${j}`,
  ride: (j: number) => `l${j}:ride`,
  note: (k: number) => `n${k}`,
};

/** The runs a lane plays · from the click it appears on, the one standing then
 *  replayed as it comes in, and each later one on its own click. */
export function runsShown(lane: LLane, appears: number): LRun[] {
  const before = lane.runs.filter((r) => r.stage <= appears).at(-1);
  const later = lane.runs.filter((r) => r.stage > appears);
  return [...(before ? [{ ...before, stage: appears }] : []), ...later];
}

/** The length of a polyline. */
export const lengthOf = (points: { x: number; y: number }[]) =>
  points
    .slice(1)
    .reduce((sum, p, i) => sum + Math.hypot(p.x - points[i]!.x, p.y - points[i]!.y), 0);

/** How long one token takes along a link · with the line as it is drawn, else at its speed. */
export function rideSeconds(link: LLink): number {
  if (linkEnter(link) === 'draw') return ENTER_SECONDS.draw;
  const speed = SPEEDS[link.speed] ?? SPEEDS.normal;
  return Math.min(MAX_RIDE, Math.max(MIN_RIDE, lengthOf(link.points) / speed));
}

export interface Choreography {
  cues: Cue[];
  /** The click each item, link and note appears on, by cue id. */
  appears: Map<string, number>;
}

/** The cues of a drawing, and the click each of its parts appears on. */
export function choreograph(drawn: DiagramLayout, tree: DgNode[]): Choreography {
  const nodeStage = stagesByNode(tree);
  const stageOfNode = (node: DgNode | undefined) => (node ? (nodeStage.get(node) ?? 0) : 0);
  const cues: Cue[] = [];
  const appears = new Map<string, number>();
  const byKey = new Map<string, number>();
  const rides: { to: string; stage: number; id: string }[] = [];
  drawn.items.forEach((item, i) => {
    const stage = stageOfNode(item.node);
    byKey.set(item.key, Math.max(byKey.get(item.key) ?? 0, stage));
    appears.set(cueIds.item(i), stage);
    const enter = itemEnter(item);
    cues.push({
      id: cueIds.item(i),
      role: item.kind === 'frame' ? 'frame' : 'mark',
      owner: item.node.attrs.name,
      stage,
      duration: durationOf(item, enter),
      order: item.y * 10_000 + item.x,
      after: words(item.node.attrs.after),
    });
  });
  drawn.items.forEach((item, i) => {
    if (item.kind === 'lane') cues.push(...laneRunCues(drawn, item, i, appears));
  });
  drawn.links.forEach((link, j) => {
    const ends = Math.max(byKey.get(link.from) ?? 0, byKey.get(link.to) ?? 0);
    const own = Math.max(stageOfNode(link.node), ends);
    const enter = linkEnter(link);
    const after = words(link.node?.attrs.after);
    // Tokens on a line that is not traced by them wait on their own · the line is
    // there with what it joins, and `step` and `after` time the tokens.
    const ridesAlone = link.flow > 0 && enter !== 'draw';
    const lineStage = ridesAlone ? ends : own;
    appears.set(cueIds.link(j), lineStage);
    cues.push({
      id: cueIds.link(j),
      role: 'link',
      owner: link.node?.attrs.name,
      stage: lineStage,
      duration: ENTER_SECONDS[enter],
      order: j,
      after: ridesAlone ? [] : after,
      secondary: ridesAlone,
    });
    if (link.flow > 0) {
      rides.push({ to: link.to, stage: own, id: cueIds.ride(j) });
      cues.push({
        id: cueIds.ride(j),
        role: 'run',
        owner: link.node?.attrs.name,
        stage: own,
        duration: rideSeconds(link) + (link.flow - 1) * RIDE_SPACING,
        order: j,
        after: ridesAlone ? after : [],
        waits: [{ id: cueIds.link(j), edge: enter === 'draw' ? 'start' : 'end' }],
      });
    }
  });
  // A mark changes once what rides into it on that click has arrived.
  const ridesInto = (key: string, stage: number) =>
    rides
      .filter((ride) => ride.to === key && ride.stage === stage)
      .map((ride) => ({ id: ride.id, edge: 'end' as const }));
  drawn.items.forEach((item, i) => {
    cues.push(...switchCues(item, i, appears.get(cueIds.item(i))!, drawn.stages, ridesInto));
  });
  drawn.notes.forEach((note, k) => {
    const stage = Math.max(stageOfNode(note.node), byKey.get(note.target) ?? 0);
    appears.set(cueIds.note(k), stage);
    cues.push({
      id: cueIds.note(k),
      role: 'note',
      owner: note.node.attrs.name,
      stage,
      duration: ENTER_SECONDS[noteEnter(note)],
      order: k,
      after: words(note.node.attrs.after),
    });
  });
  return { cues, appears };
}

const words = (value: string | undefined) => (value ?? '').split(/\s+/).filter(Boolean);

/** One click's drawing, and when its parts move. */
export interface Frame {
  stage: number;
  drawn: DiagramLayout;
  choreography: Choreography;
  timing: Map<string, Timing>;
  issues: MotionIssue[];
}

/** The drawing of each click and when its parts move · one for a diagram without
 *  states, whose clicks only bring parts in, one per click for one with them. */
export function framesOf(parsed: ParsedDiagram, options: LayoutOptions): Frame[] {
  const stages = parsed.states
    ? Array.from({ length: parsed.stages + 1 }, (_, stage) => stage)
    : [parsed.stages];
  return stages.map((stage) => {
    const drawn = layoutDiagram(parsed, { ...options, stage });
    const choreography = choreograph(drawn, drawn.tree);
    const plan = schedule(choreography.cues);
    // A part that waits (`after`) for one that comes on a later click comes with
    // it · the schedule settled that, so the click each part appears on is read back.
    for (const [id, t] of plan.timing)
      if (choreography.appears.has(id)) choreography.appears.set(id, t.stage);
    return { drawn, choreography, timing: plan.timing, issues: plan.issues, stage };
  });
}

/** A gate drops again, a meter fills again, a queue takes or frees its places, a box
 *  turns, on each click where it changes · once the tokens riding into it arrive. */
function switchCues(
  item: LItem,
  i: number,
  appears: number,
  stages: number,
  ridesInto: (key: string, stage: number) => Cue['waits'],
): Cue[] {
  const cues: Cue[] = [];
  for (let stage = appears + 1; stage <= stages; stage += 1) {
    if (!changesOn(item, stage, appears)) continue;
    const waits = ridesInto(item.key, stage);
    cues.push({
      id: cueIds.switch(i, stage),
      role: 'switch',
      owner: item.node.attrs.name,
      stage,
      duration:
        item.kind === 'gate' || item.kind === 'box' || item.kind === 'switch'
          ? SWITCH_SECONDS
          : FILL_SECONDS,
      order: i,
      secondary: true,
      ...(waits?.length ? { waits } : {}),
    });
  }
  return cues;
}

/** A lane's runs · each leaves with the lane's line when it comes in with it (the
 *  line is traced faster than a token runs), and after every gate on the lane that
 *  moves on its click. */
function laneRunCues(
  drawn: DiagramLayout,
  lane: LLane,
  i: number,
  appears: Map<string, number>,
): Cue[] {
  const laneStage = appears.get(cueIds.item(i)) ?? 0;
  const gates = drawn.items
    .map((item, k) => ({ item, k }))
    .filter(
      (g): g is { item: LGate; k: number } =>
        g.item.kind === 'gate' && g.item.lanes.includes(lane.key),
    );
  return runsShown(lane, laneStage).map((run) => {
    const waits: Cue['waits'] =
      run.stage === laneStage ? [{ id: cueIds.item(i), edge: 'start' }] : [];
    for (const { k } of gates) {
      const gateStage = appears.get(cueIds.item(k)) ?? 0;
      waits.push({
        id: gateStage === run.stage ? cueIds.item(k) : cueIds.switch(k, run.stage),
        edge: 'end',
      });
    }
    return {
      id: cueIds.run(i, run.stage),
      role: 'run' as const,
      owner: lane.node.attrs.name,
      stage: run.stage,
      duration: run.duration,
      order: i,
      waits,
      secondary: true,
    };
  });
}
