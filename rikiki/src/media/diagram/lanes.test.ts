import { describe, expect, it } from 'vitest';
import {
  GATE_AT,
  GATE_WIDTH,
  type GateState,
  type LanesInput,
  MAX_FLOW,
  MIN_TRACK,
  type RunInput,
  TOKEN_RADIUS,
  gateCentre,
  lanes,
  planRun,
  queueRoom,
} from './lanes.js';

/** A seeded generator · the same cases on every run, so a failure is replayed. */
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

const CASES = 300;
const sink = (key: string, w = 240) => ({ key, minW: 120, prefW: w, heightFor: () => 80 });

const three = (over: Partial<LanesInput> = {}): LanesInput => ({
  lanes: [
    { key: 'api', label: { w: 120, h: 48 } },
    { key: 'job', label: { w: 160, h: 48 } },
    { key: 'svc', label: { w: 140, h: 48 } },
  ],
  gates: [{ key: 'stop', lanes: [], at: GATE_AT.middle, queue: 3 }],
  sinks: [sink('acme')],
  width: 1600,
  gap: 32,
  ...over,
});

describe('lanes · placement', () => {
  it('stacks the lanes top to bottom at one pitch, on tracks that start and end together', () => {
    const result = lanes(three());
    expect(result.status).toBe('fit');
    const ys = result.lanes.map((l) => l.cy);
    expect(ys[1]! - ys[0]!).toBeCloseTo(ys[2]! - ys[1]!);
    expect(new Set(result.lanes.map((l) => l.track.x0)).size).toBe(1);
    expect(new Set(result.lanes.map((l) => l.track.x1)).size).toBe(1);
  });

  it('keeps every label left of the tracks', () => {
    const result = lanes(three());
    for (const lane of result.lanes)
      expect(lane.label.x + lane.label.w).toBeLessThan(lane.track.x0);
  });

  it('stands a gate across every lane it names, its bar past them above and below', () => {
    const result = lanes(three({ gates: [{ key: 'g', lanes: [0, 2], at: 0.5, queue: 0 }] }));
    const gate = result.gates[0]!;
    for (const lane of result.lanes) {
      expect(gate.y).toBeLessThan(lane.cy - TOKEN_RADIUS);
      expect(gate.y + gate.h).toBeGreaterThan(lane.cy + TOKEN_RADIUS);
    }
    expect(gate.w).toBe(GATE_WIDTH);
  });

  it('keeps room before a gate for the queue it can hold', () => {
    const result = lanes(three({ gates: [{ key: 'g', lanes: [], at: 0, queue: 6 }] }));
    const gate = result.gates[0]!;
    expect(gate.x).toBeGreaterThanOrEqual(result.lanes[0]!.track.x0 + queueRoom(6) - 0.01);
  });

  it('puts what the lanes run into at the right, past the tracks, as tall as the lanes', () => {
    const result = lanes(three());
    const box = result.sinks[0]!;
    expect(box.x).toBeGreaterThan(result.lanes[0]!.track.x1);
    expect(box.y).toBeLessThanOrEqual(result.lanes[0]!.cy - TOKEN_RADIUS);
    expect(box.y + box.h).toBeGreaterThanOrEqual(result.lanes[2]!.cy + TOKEN_RADIUS);
    expect(box.x + box.w).toBeLessThanOrEqual(1600 + 0.01);
  });

  it('stacks several sinks in a column, none over another', () => {
    const result = lanes(three({ sinks: [sink('a'), sink('b'), sink('c')] }));
    const [a, b, c] = result.sinks;
    expect(a!.y + a!.h).toBeLessThanOrEqual(b!.y);
    expect(b!.y + b!.h).toBeLessThanOrEqual(c!.y);
  });

  it('says it does not fit when the tracks would be too short, and still places them', () => {
    const result = lanes(three({ width: 500 }));
    expect(result.status).toBe('unresolved');
    expect(result.reasons.join(' ')).toMatch(/tracks need/);
    expect(result.lanes[0]!.track.x1 - result.lanes[0]!.track.x0).toBe(MIN_TRACK);
  });

  it('pushes a second gate on the same lane clear of the first', () => {
    const result = lanes(
      three({
        gates: [
          { key: 'a', lanes: [], at: 0.5, queue: 0 },
          { key: 'b', lanes: [], at: 0.5, queue: 0 },
        ],
      }),
    );
    const [a, b] = result.gates;
    expect(b!.x).toBeGreaterThan(a!.x + a!.w);
  });

  it('clamps a wished gate centre into the range its queue and its far side leave', () => {
    const gate = { centreMin: 300, centreMax: 900 };
    expect(gateCentre(gate, 100)).toBe(300);
    expect(gateCentre(gate, 1200)).toBe(900);
    expect(gateCentre(gate, 500)).toBe(500);
  });

  it('places any input inside its width when it says it fits, and draws the same twice', () => {
    const random = mulberry32(7);
    for (let n = 0; n < CASES; n += 1) {
      const count = 1 + Math.floor(random() * 5);
      const input: LanesInput = {
        lanes: Array.from({ length: count }, (_, i) => ({
          key: `l${i}`,
          label: { w: 40 + random() * 300, h: 30 + random() * 60 },
        })),
        gates:
          random() < 0.7
            ? [{ key: 'g', lanes: [], at: random(), queue: Math.floor(random() * 9) }]
            : [],
        sinks: random() < 0.6 ? [sink('s', 100 + random() * 400)] : [],
        width: 600 + random() * 1000,
        gap: 16 + random() * 40,
      };
      const result = lanes(input);
      expect(JSON.stringify(lanes(input))).toBe(JSON.stringify(result));
      if (result.status !== 'fit') continue;
      expect(result.size.w).toBeLessThanOrEqual(input.width + 0.01);
      for (const placed of result.placed) {
        expect(placed.x).toBeGreaterThanOrEqual(-0.01);
        expect(placed.x + placed.w).toBeLessThanOrEqual(input.width + 0.01);
      }
    }
  });
});

const track = { x0: 200, x1: 1200 };
const run = (state: GateState | null, flow = 4, extra: Partial<RunInput> = {}) =>
  planRun({
    track,
    gates: state ? [{ x: 700, w: GATE_WIDTH, state }] : [],
    flow,
    speed: 'normal',
    ...extra,
  });

describe('lanes · a run of tokens', () => {
  it('with no gate, spreads the tokens over the whole track, the first one farthest', () => {
    const { tokens } = run(null);
    expect(tokens.every((t) => t.fate === 'pass')).toBe(true);
    const places = tokens.map((t) => t.to);
    expect([...places].sort((a, b) => b - a)).toEqual(places);
    expect(Math.max(...places)).toBeGreaterThan(900);
    expect(Math.min(...places)).toBeLessThan(500);
  });

  it('through an open gate, never rests a token on the bar', () => {
    for (let flow = 1; flow <= MAX_FLOW; flow += 1) {
      for (const t of run('open', flow).tokens) {
        const onBar = t.to + TOKEN_RADIUS > 700 && t.to - TOKEN_RADIUS < 700 + GATE_WIDTH;
        expect(onBar, `flow ${flow}, token at ${t.to}`).toBe(false);
      }
    }
  });

  it('against a closed gate, queues every token before it, the first one touching it', () => {
    const { tokens } = run('closed', 5);
    expect(tokens.every((t) => t.fate === 'queue')).toBe(true);
    expect(tokens.every((t) => t.to + TOKEN_RADIUS <= 700)).toBe(true);
    expect(tokens[0]!.to).toBe(Math.max(...tokens.map((t) => t.to)));
  });

  it('at a gate that sheds, lets one in two through and refuses the others before it', () => {
    const { tokens } = run('shed', 6);
    const passed = tokens.filter((t) => t.fate === 'pass');
    const refused = tokens.filter((t) => t.fate === 'refuse');
    expect(passed).toHaveLength(3);
    expect(refused).toHaveLength(3);
    expect(passed.every((t) => t.to - TOKEN_RADIUS >= 700 + GATE_WIDTH)).toBe(true);
    expect(refused.every((t) => t.to + TOKEN_RADIUS <= 700)).toBe(true);
  });

  it('draws at most the ceiling of tokens, and none for a flow of zero', () => {
    expect(run(null, 40).tokens).toHaveLength(MAX_FLOW);
    expect(run(null, 0)).toEqual({ tokens: [], duration: 0 });
  });

  it('a faster lane ends sooner, and every run ends within two seconds', () => {
    const slow = run(null, 4, { speed: 'slow' }).duration;
    const fast = run(null, 4, { speed: 'fast' }).duration;
    expect(fast).toBeLessThan(slow);
    for (let flow = 1; flow <= MAX_FLOW; flow += 1)
      expect(run('shed', flow, { speed: 'slow' }).duration).toBeLessThanOrEqual(2.5);
  });

  it('keeps every token on its track, two never closer than a token, whatever the gates', () => {
    const random = mulberry32(11);
    const states: GateState[] = ['open', 'closed', 'shed'];
    for (let n = 0; n < CASES; n += 1) {
      const x0 = random() * 300;
      const x1 = x0 + MIN_TRACK + random() * 900;
      const flow = Math.floor(random() * (MAX_FLOW + 1));
      const gateX =
        x0 + queueRoom(flow) + random() * Math.max(0, x1 - x0 - queueRoom(flow) - 3 * GATE_WIDTH);
      const gates =
        random() < 0.8
          ? [{ x: gateX, w: GATE_WIDTH, state: states[Math.floor(random() * 3)]! }]
          : [];
      const { tokens } = planRun({ track: { x0, x1 }, gates, flow, speed: 'normal' });
      for (const t of tokens) {
        expect(t.to - TOKEN_RADIUS).toBeGreaterThanOrEqual(x0 - 0.01);
        expect(t.to + TOKEN_RADIUS).toBeLessThanOrEqual(x1 + 0.01);
      }
      const places = tokens.map((t) => t.to).sort((a, b) => a - b);
      for (let i = 1; i < places.length; i += 1)
        expect(places[i]! - places[i - 1]!).toBeGreaterThanOrEqual(2 * TOKEN_RADIUS - 0.01);
    }
  });
});
