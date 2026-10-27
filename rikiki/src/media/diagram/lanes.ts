// ════════════════════════════════════════════════════════════════
// RIKIKI · diagram, the lanes engine
//
// Lanes are rows that carry traffic: a label at the left (an icon, a word, a
// note), then a track the tokens run along, and at the right what the lanes run
// into (one box, or a column of them). Gates stand across some of the lanes, the
// way a barrier stands across a road: open, they let every token through;
// closed, the tokens queue against them; shedding, one in two goes through and
// the others are refused and wait, hollow, in the queue.
//
// Two pure functions. `lanes` places the rows, the gates and what the lanes run
// into, in a width it is given. `planRun` says, for one lane and the gates that
// stand on it at one moment, where each token goes, in what order and how long it
// takes · the final positions are the picture at rest, the trips are the motion.
// No DOM, no font: labels arrive measured.
// ════════════════════════════════════════════════════════════════

import type { EngineResult, Placed, Size } from './types.js';

export const TOKEN_RADIUS = 10;
const TOKEN_GAP = 8;
export const TOKEN_PITCH = 2 * TOKEN_RADIUS + TOKEN_GAP;
/** More than eight tokens a lane is a queue nobody counts. */
export const MAX_FLOW = 8;

export const GATE_WIDTH = 96;
/** A gate stands this far past the lanes it crosses, above and below. */
export const GATE_OVERHANG = 18;
const GATE_LABEL_GAP = 10;
/** Between the widest label and the start of the tracks. */
const LABEL_GAP = 40;
/** Between the end of a track (its arrow head) and what it runs into. */
export const SINK_GAP = 24;
const SINK_ROW_GAP = 16;
const MAX_SINK_WIDTH = 360;
/** The tokens that pass need somewhere to be seen on the far side of a gate ·
 *  room for half the most a lane carries, which is what a shedding gate lets by. */
const ROOM_PAST_GATE = TOKEN_GAP + Math.ceil(MAX_FLOW / 2) * TOKEN_PITCH;
/** The tip of the arrow at the end of a track is kept clear of the tokens. */
export const ARROW_ROOM = 20;
/** Shorter than this a track has no room for a story · the longest queue, a
 *  gate, the room past it and the arrow. */
export const MIN_TRACK =
  TOKEN_GAP + MAX_FLOW * TOKEN_PITCH + GATE_WIDTH + ROOM_PAST_GATE + ARROW_ROOM;

/** Where a gate stands along its track when nothing aligns it · a share of the track. */
export const GATE_AT = Object.freeze({ start: 0.25, middle: 0.5, end: 0.75 });
export type GateAt = keyof typeof GATE_AT;

export const GATE_STATES = ['open', 'closed', 'shed'] as const;
export type GateState = (typeof GATE_STATES)[number];

/** Units a token covers in a second. */
export const SPEEDS = Object.freeze({ slow: 360, normal: 560, fast: 900 });
export type Speed = keyof typeof SPEEDS;

/** Departures of one run spread over this long at most, however many tokens. */
const RUN_SPREAD = 0.8;
const MAX_DEPARTURE_STEP = 0.18;
const MIN_TRIP = 0.35;
const MAX_TRIP = 1.1;
/** A refused token turns hollow in this long, once it has stopped. */
export const REFUSE_SECONDS = 0.25;

export interface LaneSpec {
  key: string;
  /** The label block (icon, text, note), measured. */
  label: Size;
}

export interface GateSpec {
  key: string;
  /** Indexes of the lanes it stands across · consecutive or not, it spans from the
   *  first to the last. Empty means every lane. */
  lanes: number[];
  /** Where it stands along the track, a share of it, when nothing aligns it. */
  at: number;
  /** Its word, measured · drawn above it. */
  label?: Size;
  /** The longest queue that can form against it, in tokens · the track keeps
   *  room for it before the gate. 0 when it never blocks. */
  queue: number;
}

export interface SinkSpec {
  key: string;
  minW: number;
  prefW: number;
  heightFor(width: number): number;
}

export interface LanesInput {
  lanes: LaneSpec[];
  gates: GateSpec[];
  /** What the lanes run into, stacked at the right · none, one, or a column. */
  sinks: SinkSpec[];
  width: number;
  /** Between two lanes. */
  gap: number;
  /** How long the tracks are when the lanes share their line with other marks ·
   *  absent, they run as far as `width` lets them. */
  track?: number;
}

/** Tracks as long as this read as traffic travelling, with a gate on them · lanes
 *  beside other marks take this, not the whole room. */
const NATURAL_TRACK = 640;

/** The track lanes take beside other marks · longer by a gate and the room past it
 *  for each gate after the first on one lane. */
export function naturalTrack(gatesInSeries: number): number {
  const extra = Math.max(0, gatesInSeries - 1) * (GATE_WIDTH + ROOM_PAST_GATE);
  return Math.max(NATURAL_TRACK, MIN_TRACK + extra);
}

export interface PlacedLane {
  key: string;
  /** The row, label to track end. */
  x: number;
  y: number;
  w: number;
  h: number;
  /** The centre line the tokens run on. */
  cy: number;
  label: Placed;
  track: { x0: number; x1: number };
}

export interface PlacedGate extends Placed {
  /** The lanes it stands across, by index. */
  lanes: number[];
  label?: Placed;
  /** The range its centre may take · the queue before it, the room past it. */
  centreMin: number;
  centreMax: number;
}

export interface LanesResult extends EngineResult {
  lanes: PlacedLane[];
  gates: PlacedGate[];
  sinks: Placed[];
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

/** The room a queue of `tokens` takes before a gate, the gap to it included. */
export const queueRoom = (tokens: number) => (tokens > 0 ? TOKEN_GAP + tokens * TOKEN_PITCH : 0);

/** Where a gate's centre may go, and where it goes when it would like `desired`. */
export function gateCentre(gate: Pick<PlacedGate, 'centreMin' | 'centreMax'>, desired: number) {
  return gate.centreMin <= gate.centreMax
    ? clamp(desired, gate.centreMin, gate.centreMax)
    : gate.centreMin;
}

/** The gates in the order given, each pushed right of an earlier one it would
 *  stand on (they share a lane and their bars would touch). */
function separateGates(gates: PlacedGate[], reasons: string[]): void {
  gates.forEach((gate, i) => {
    for (const earlier of gates.slice(0, i)) {
      const shared = gate.lanes.some((lane) => earlier.lanes.includes(lane));
      const touching =
        gate.x < earlier.x + earlier.w + TOKEN_PITCH && gate.x + gate.w > earlier.x - TOKEN_PITCH;
      if (!shared || !touching) continue;
      gate.x = earlier.x + earlier.w + ROOM_PAST_GATE;
      if (gate.x + gate.w / 2 > gate.centreMax)
        reasons.push(`gate ${gate.key} has no room beside gate ${earlier.key}`);
    }
  });
}

function placeSinks(sinks: SinkSpec[], x: number, top: number, height: number, width: number) {
  const each = sinks.length ? (height - SINK_ROW_GAP * (sinks.length - 1)) / sinks.length : 0;
  let y = top;
  return sinks.map((sink) => {
    const h = Math.max(each, sink.heightFor(width));
    const placed = { key: sink.key, x, y, w: width, h };
    y += h + SINK_ROW_GAP;
    return placed;
  });
}

/** Where a gate's word goes · above it, where nothing else is, unless a lane runs
 *  above the gate and none under it: the word would sit on that lane's track, so it
 *  goes under the gate. */
export function labelSide(covered: number[], count: number): 'above' | 'below' {
  if (!covered.length) return 'above';
  const first = Math.min(...covered);
  const last = Math.max(...covered);
  return first > 0 && last === count - 1 ? 'below' : 'above';
}

/** Place the lanes, the gates across them and what they run into, `width` wide. */
export function lanes(input: LanesInput): LanesResult {
  const reasons: string[] = [];
  const content = Math.max(2 * TOKEN_RADIUS, ...input.lanes.map((lane) => lane.label.h));
  const pitch = content + input.gap;
  const count = input.lanes.length;
  const coveredBy = input.gates.map((gate) =>
    (gate.lanes.length ? gate.lanes : input.lanes.map((_, i) => i)).filter(
      (i) => i >= 0 && i < count,
    ),
  );
  const sides = coveredBy.map((covered) => labelSide(covered, count));
  const roomFor = (side: 'above' | 'below') =>
    Math.max(
      0,
      ...input.gates.map((g, i) => (g.label && sides[i] === side ? g.label.h + GATE_LABEL_GAP : 0)),
    );
  const header = roomFor('above');
  const overhang = input.gates.length || input.sinks.length ? GATE_OVERHANG : 0;
  const top = header + overhang;
  const area = count ? count * content + (count - 1) * input.gap : 0;

  const labelCol = Math.max(0, ...input.lanes.map((lane) => lane.label.w));
  const x0 = labelCol > 0 ? labelCol + LABEL_GAP : 0;
  const sinkW = input.sinks.length
    ? clamp(
        Math.max(...input.sinks.map((s) => s.prefW)),
        Math.max(...input.sinks.map((s) => s.minW)),
        Math.max(MAX_SINK_WIDTH, ...input.sinks.map((s) => s.minW)),
      )
    : 0;
  let x1 = input.width - (sinkW ? sinkW + SINK_GAP : 0);
  if (input.track !== undefined) x1 = Math.min(x1, x0 + input.track);
  if (x1 - x0 < MIN_TRACK) {
    reasons.push(
      `the tracks need ${Math.ceil(x0 + MIN_TRACK + (sinkW ? sinkW + SINK_GAP : 0))} units, the room holds ${Math.round(input.width)}`,
    );
    x1 = x0 + MIN_TRACK;
  }

  const placedLanes: PlacedLane[] = input.lanes.map((lane, i) => {
    const y = top + i * pitch;
    const cy = y + content / 2;
    return {
      key: lane.key,
      x: 0,
      y,
      w: x1,
      h: content,
      cy,
      label: { key: lane.key, x: 0, y: cy - lane.label.h / 2, w: lane.label.w, h: lane.label.h },
      track: { x0, x1 },
    };
  });

  const span = x1 - x0;
  const gates: PlacedGate[] = input.gates.map((gate, g) => {
    const covered = coveredBy[g]!;
    const first = Math.min(...covered, count - 1);
    const last = Math.max(...covered, 0);
    const y = (placedLanes[first]?.y ?? top) - overhang;
    const h = (placedLanes[last]?.y ?? top) + content + overhang - y;
    const centreMin = x0 + queueRoom(gate.queue) + GATE_WIDTH / 2;
    const centreMax = x1 - ARROW_ROOM - ROOM_PAST_GATE - GATE_WIDTH / 2;
    if (centreMin > centreMax)
      reasons.push(
        `gate ${gate.key} needs ${Math.ceil(centreMin - centreMax)} more units of track for its queue`,
      );
    const centre = gateCentre({ centreMin, centreMax }, x0 + gate.at * span);
    return {
      key: gate.key,
      x: centre - GATE_WIDTH / 2,
      y,
      w: GATE_WIDTH,
      h,
      lanes: covered,
      centreMin,
      centreMax,
    };
  });
  separateGates(gates, reasons);
  gates.forEach((gate, i) => {
    const label = input.gates[i]!.label;
    if (label)
      gate.label = {
        key: gate.key,
        x: gate.x + gate.w / 2 - label.w / 2,
        y:
          sides[i] === 'below'
            ? gate.y + gate.h + GATE_LABEL_GAP
            : gate.y - GATE_LABEL_GAP - label.h,
        w: label.w,
        h: label.h,
      };
  });

  const sinkTop = top - overhang;
  const sinkHeight = area + 2 * overhang;
  const sinks = placeSinks(input.sinks, x1 + SINK_GAP, sinkTop, sinkHeight, sinkW);
  const bottom = Math.max(
    top + area + overhang,
    ...sinks.map((s) => s.y + s.h),
    ...gates.map((g) => g.y + g.h),
    ...gates.map((g) => (g.label ? g.label.y + g.label.h : 0)),
  );
  const width = sinkW ? x1 + SINK_GAP + sinkW : x1;
  return {
    placed: [...placedLanes, ...gates, ...sinks].map(({ key, x, y, w, h }) => ({
      key,
      x,
      y,
      w,
      h,
    })),
    size: { w: width, h: bottom },
    status: reasons.length ? 'unresolved' : 'fit',
    reasons,
    lanes: placedLanes,
    gates,
    sinks,
  };
}

// ── tokens ────────────────────────────────────────────────────────────────

export type Fate = 'pass' | 'queue' | 'refuse';

export interface Token {
  /** The centre it leaves from and the centre it rests at, along the track. */
  from: number;
  to: number;
  fate: Fate;
  /** When it leaves, from the start of the run, and how long it travels. */
  delay: number;
  duration: number;
}

export interface Run {
  tokens: Token[];
  /** When the last token has stopped, refusal included. */
  duration: number;
}

export interface RunInput {
  track: { x0: number; x1: number };
  /** The gates on this lane, as they stand at this moment. */
  gates: { x: number; w: number; state: GateState }[];
  flow: number;
  speed: Speed;
}

/** The stretches of [from, to] a token may rest on · the bar of a gate, and a
 *  token's width either side of it, are not among them. */
function freeStretches(from: number, to: number, gates: RunInput['gates']): [number, number][] {
  const stretches: [number, number][] = [];
  let at = from;
  for (const gate of [...gates].sort((a, b) => a.x - b.x)) {
    const before = gate.x - TOKEN_RADIUS - TOKEN_GAP;
    if (before > at) stretches.push([at, before]);
    at = Math.max(at, gate.x + gate.w + TOKEN_RADIUS + TOKEN_GAP);
  }
  if (to > at) stretches.push([at, to]);
  return stretches;
}

/** How many tokens rest on each stretch · as many as its share of the length,
 *  and one at least on every stretch that holds one while there are tokens to
 *  spare, so a token is seen on the far side of every open gate. */
function shares(count: number, stretches: [number, number][]): number[] {
  const lengths = stretches.map(([a, b]) => b - a);
  const total = lengths.reduce((sum, l) => sum + l, 0);
  const fits = (i: number, n: number) => n * TOKEN_PITCH <= lengths[i]! + TOKEN_GAP;
  const counts = lengths.map(() => 0);
  // The far stretches first, while a token is left for each.
  for (let i = lengths.length - 1; i >= 0; i -= 1)
    if (counts.reduce((s, c) => s + c, 0) < count && fits(i, 1)) counts[i] = 1;
  let left = count - counts.reduce((s, c) => s + c, 0);
  while (left > 0) {
    // The stretch with the most room per token takes the next one.
    let best = -1;
    lengths.forEach((length, i) => {
      if (!fits(i, counts[i]! + 1)) return;
      if (best < 0 || length / (counts[i]! + 1) > lengths[best]! / (counts[best]! + 1)) best = i;
    });
    if (best < 0) best = lengths.indexOf(Math.max(...lengths));
    counts[best] = counts[best]! + 1;
    left -= 1;
  }
  return total > 0 ? counts : counts.map((_, i) => (i === 0 ? count : 0));
}

/** `count` resting places spread evenly over the free stretches of [from, to],
 *  the farthest first. */
function spread(count: number, from: number, to: number, gates: RunInput['gates']): number[] {
  const stretches = freeStretches(from, to, gates);
  if (!stretches.length) return Array.from({ length: count }, () => to);
  const counts = shares(count, stretches);
  const places = stretches.flatMap(([a, b], i) =>
    Array.from({ length: counts[i]! }, (_, k) => a + ((k + 0.5) * (b - a)) / counts[i]!),
  );
  return places.sort((p, q) => q - p);
}

/** The places of a queue against a gate that starts at `gateX`, nearest first ·
 *  a queue that reaches back to an open gate goes on past it, not on its bar. */
function queueAt(gateX: number, count: number, from: number, open: RunInput['gates']): number[] {
  const stretches = freeStretches(from, gateX - TOKEN_GAP - TOKEN_RADIUS, open).reverse();
  const places: number[] = [];
  let at = stretches[0]?.[1] ?? gateX - TOKEN_GAP - TOKEN_RADIUS;
  let stretch = 0;
  while (places.length < count) {
    const current = stretches[stretch];
    if (current && at < current[0] - 0.5 && stretches[stretch + 1]) {
      stretch += 1;
      at = stretches[stretch]![1];
      continue;
    }
    places.push(at);
    at -= TOKEN_PITCH;
  }
  return places;
}

/** Where each of a run's tokens rests, in the order they leave. */
function restingPlaces(input: RunInput): { to: number; fate: Fate }[] {
  const start = input.track.x0 + TOKEN_RADIUS;
  const end = input.track.x1 - ARROW_ROOM - TOKEN_RADIUS;
  const ordered = [...input.gates].sort((a, b) => a.x - b.x);
  return settle(input.flow, start, end, ordered);
}

/** `flow` tokens leaving `start` along gates in order · the first gate that blocks
 *  holds them, or sheds them: one in two goes on, and meets the gates after it in
 *  turn, so gates in series filter in cascade; the others are refused and wait. */
function settle(
  flow: number,
  start: number,
  end: number,
  ordered: RunInput['gates'],
): { to: number; fate: Fate }[] {
  const blocking = ordered.find((g) => g.state !== 'open');
  if (!blocking)
    return spread(flow, start, end, ordered).map((to) => ({ to, fate: 'pass' as const }));
  const before = ordered.filter((g) => g.x < blocking.x);
  if (blocking.state === 'closed')
    return queueAt(blocking.x, flow, start, before).map((to) => ({ to, fate: 'queue' as const }));
  const passing = Math.ceil(flow / 2);
  const beyond = settle(
    passing,
    blocking.x + blocking.w + TOKEN_GAP + TOKEN_RADIUS,
    end,
    ordered.filter((g) => g.x > blocking.x),
  );
  const refused = queueAt(blocking.x, flow - passing, start, before);
  return Array.from({ length: flow }, (_, i) =>
    i % 2 === 0 ? beyond[i / 2]! : { to: refused[(i - 1) / 2]!, fate: 'refuse' as const },
  );
}

/** One run of a lane's tokens · they leave the start of the track one after the
 *  other, the first going farthest, and rest where the gates let them. */
export function planRun(input: RunInput): Run {
  const flow = clamp(Math.floor(input.flow), 0, MAX_FLOW);
  if (!flow) return { tokens: [], duration: 0 };
  const from = input.track.x0 + TOKEN_RADIUS;
  const speed = SPEEDS[input.speed] ?? SPEEDS.normal;
  const departure = Math.min(MAX_DEPARTURE_STEP, RUN_SPREAD / flow);
  const tokens = restingPlaces({ ...input, flow }).map(({ to, fate }, i) => ({
    from,
    to,
    fate,
    delay: i * departure,
    duration: clamp(Math.abs(to - from) / speed, MIN_TRIP, MAX_TRIP),
  }));
  const duration = Math.max(
    ...tokens.map((t) => t.delay + t.duration + (t.fate === 'refuse' ? REFUSE_SECONDS : 0)),
  );
  return { tokens, duration };
}
