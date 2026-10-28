import { describe, expect, it } from 'vitest';
import { changesOn, choreograph, cueIds, lastChange } from './choreography.js';
import { TOKEN_RADIUS } from './lanes.js';
import {
  type DiagramLayout,
  type LCursor,
  type LGate,
  type LLane,
  type LMeter,
  type LQueue,
  type LSpan,
  type Meter,
  layoutDiagram,
} from './layout.js';
import { type ElementLike, parseDiagram } from './model.js';
import { schedule } from './motion.js';

/** A font that is the same width for every letter · a test needs numbers, not glyphs. */
const meter: Meter = (size) => (text) => text.length * size * 0.55;

function el(
  localName: string,
  attrs: Record<string, string | true> = {},
  children: ElementLike[] = [],
): ElementLike {
  return {
    localName,
    children,
    getAttribute: (name) =>
      name in attrs ? String(attrs[name] === true ? '' : attrs[name]) : null,
    hasAttribute: (name) => name in attrs,
    getAttributeNames: () => Object.keys(attrs),
  };
}

const lay = (children: ElementLike[], attrs: Record<string, string> = {}) => {
  const parsed = parseDiagram(el('deck-diagram', attrs, children));
  return { parsed, drawn: layoutDiagram(parsed, { meter, bounds: { w: 1600, h: 600 } }) };
};

const lanesOf = (drawn: DiagramLayout) => drawn.items.filter((i): i is LLane => i.kind === 'lane');
const gatesOf = (drawn: DiagramLayout) => drawn.items.filter((i): i is LGate => i.kind === 'gate');

/** The kill switch of the fixture, as a tree. */
const killSwitch = () => [
  el('dg-group', { layout: 'row', gap: 'airy' }, [
    el('dg-box', { name: 'essai', icon: 'flag', label: 'essai réel', paint: 'none' }),
    el('dg-box', { name: 'db', icon: 'database', label: 'DB 2 · MARCHE' }),
    el('dg-box', {
      name: 'lit',
      icon: 'code',
      label: 'is_active()',
      note: 'le seul code qui lit le STOP',
    }),
    el('dg-link', { from: 'essai', to: 'db', label: 'écrit' }),
    el('dg-link', { from: 'lit', to: 'db', label: 'lu' }),
  ]),
  el('dg-group', { layout: 'lanes' }, [
    el('dg-lane', { name: 'api', icon: 'cloud', label: 'API' }),
    el('dg-lane', { name: 'tache', icon: 'clock', label: 'tâche' }),
    el('dg-lane', { name: 'service', icon: 'database', label: 'service' }),
    el('dg-gate', { name: 'stop', by: 'lit', state: 'open closed' }),
    el('dg-box', { name: 'acme', label: 'ACME' }),
  ]),
];

describe('a group of lanes', () => {
  it('places every lane, the gate across all of them and the box they run into, inside the room', () => {
    const { parsed, drawn } = lay(killSwitch(), { layout: 'column', align: 'start' });
    expect(parsed.issues).toEqual([]);
    expect(drawn.status).toBe('fit');
    const lanes = lanesOf(drawn);
    const [gate] = gatesOf(drawn);
    expect(lanes).toHaveLength(3);
    for (const lane of lanes) {
      expect(gate!.y).toBeLessThan(lane.cy - TOKEN_RADIUS);
      expect(gate!.y + gate!.h).toBeGreaterThan(lane.cy + TOKEN_RADIUS);
      expect(lane.head).toBe(true);
    }
    const acme = drawn.items.find((i) => i.key === 'acme')!;
    expect(acme.x).toBeGreaterThan(lanes[0]!.track.x1);
    for (const item of drawn.items)
      expect(item.x + ('w' in item ? item.w : 0)).toBeLessThanOrEqual(1600.5);
  });

  it('stands a gate driven by a mark under it, with a straight line down from it', () => {
    const { drawn } = lay(killSwitch(), { layout: 'column', align: 'start' });
    const [gate] = gatesOf(drawn);
    const lit = drawn.items.find((i) => i.key === 'lit')!;
    const litBox = lit as { x: number; w: number; y: number; h: number };
    expect(gate!.feed).toHaveLength(2);
    expect(gate!.feed![0]!.y).toBeCloseTo(litBox.y + litBox.h);
    expect(gate!.feed![1]!.y).toBeCloseTo(gate!.y);
    expect(gate!.x + gate!.w / 2).toBeGreaterThan(litBox.x);
    expect(gate!.x + gate!.w / 2).toBeLessThan(litBox.x + litBox.w);
  });

  it('plays a run when the slide is entered and another on the click that closes the gate', () => {
    const { drawn } = lay(killSwitch(), { layout: 'column', align: 'start' });
    expect(drawn.stages).toBe(1);
    const [gate] = gatesOf(drawn);
    for (const lane of lanesOf(drawn)) {
      expect(lane.runs.map((r) => r.stage)).toEqual([0, 1]);
      const [open, closed] = lane.runs;
      // Open, the tokens rest on both sides of the gate; closed, all before it.
      expect(open!.tokens.some((t) => t.to > gate!.x + gate!.w)).toBe(true);
      expect(
        closed!.tokens.every((t) => t.fate === 'queue' && t.to + TOKEN_RADIUS <= gate!.x),
      ).toBe(true);
      for (const run of lane.runs)
        for (const t of run.tokens) {
          expect(t.to).toBeGreaterThanOrEqual(lane.track.x0);
          expect(t.to).toBeLessThanOrEqual(lane.track.x1);
        }
    }
  });

  it('draws a lane outside a group of lanes as its label alone, and says so', () => {
    const { parsed, drawn } = lay([el('dg-lane', { label: 'API' }), el('dg-box', { label: 'B' })]);
    expect(parsed.issues.map((i) => i.code)).toContain('DG_MARK_PLACE');
    expect(drawn.items.filter((i) => i.kind === 'box')).toHaveLength(2);
  });
});

describe('a group on an axis', () => {
  const frise = () => [
    el('dg-bar', { label: 'launch', value: '2023' }),
    el('dg-bar', { label: 'pilot', value: '2024' }),
    el('dg-bar', { label: 'rollout', value: '2025', emphasis: true }),
    el('dg-bar', { label: 'review', value: '2026' }),
    el('dg-cursor', { label: 'today', value: '2024.5' }),
  ];

  it('places the points in the order of their values, labels on both sides of one track', () => {
    const { parsed, drawn } = lay(frise(), { layout: 'axis' });
    expect(parsed.issues).toEqual([]);
    expect(drawn.status).toBe('fit');
    const spans = drawn.items.filter((i): i is LSpan => i.kind === 'span');
    expect(spans.map((s) => s.shape)).toEqual(['point', 'point', 'point', 'point']);
    const xs = spans.map((s) => s.x);
    expect([...xs].sort((a, b) => a - b)).toEqual(xs);
    expect(spans.filter((s) => s.track)).toHaveLength(1);
    const above = spans.filter((s) => s.texts[0]!.y < s.y).length;
    expect(above).toBe(2);
  });

  it('puts the cursor at its value, travelling from the start of the axis, clear of the labels', () => {
    const { drawn } = lay(frise(), { layout: 'axis' });
    const cursor = drawn.items.find((i): i is LCursor => i.kind === 'cursor')!;
    const spans = drawn.items.filter((i): i is LSpan => i.kind === 'span');
    const centre = cursor.x + cursor.w / 2;
    expect(centre).toBeGreaterThan(spans[1]!.x);
    expect(centre).toBeLessThan(spans[2]!.x);
    expect(cursor.travel.x).toBeLessThan(0);
    expect(cursor.texts[0]!.y).toBeGreaterThan(cursor.y + cursor.h);
  });

  it('gives a stretch from `from` to `to` a track of its own', () => {
    const { drawn } = lay(
      [
        el('dg-bar', { label: 'build', from: '1', to: '4' }),
        el('dg-bar', { label: 'test', from: '3', to: '6' }),
      ],
      { layout: 'axis' },
    );
    const spans = drawn.items.filter((i): i is LSpan => i.kind === 'span');
    expect(spans.map((s) => s.shape)).toEqual(['stretch', 'stretch']);
    expect(spans[1]!.y).toBeGreaterThan(spans[0]!.y);
  });
});

describe('the choreography', () => {
  it('brings a mark on its click, and what follows it with it', () => {
    const { parsed, drawn } = lay([
      el('dg-box', { name: 'a', label: 'A' }),
      el('dg-box', { name: 'b', label: 'B', step: '1' }),
      el('dg-box', { name: 'c', label: 'C', after: 'b' }),
    ]);
    const { cues } = choreograph(drawn, parsed.children);
    const plan = schedule(cues);
    const stageOf = (key: string) =>
      plan.timing.get(cueIds.item(drawn.items.findIndex((i) => i.key === key)))!.stage;
    expect([stageOf('a'), stageOf('b'), stageOf('c')]).toEqual([0, 1, 1]);
  });

  it('starts the tokens of a lane once the gate on it has moved on that click', () => {
    const { parsed, drawn } = lay(killSwitch(), { layout: 'column', align: 'start' });
    const plan = schedule(choreograph(drawn, parsed.children).cues);
    const gate = drawn.items.findIndex((i) => i.kind === 'gate');
    const lane = drawn.items.findIndex((i) => i.kind === 'lane');
    const drop = plan.timing.get(cueIds.switch(gate, 1))!;
    const run = plan.timing.get(cueIds.run(lane, 1))!;
    expect(run.stage).toBe(1);
    expect(run.start).toBeGreaterThanOrEqual(drop.start + drop.duration);
    expect(plan.issues).toEqual([]);
    for (const end of plan.ends) expect(end).toBeLessThanOrEqual(2.8);
  });

  it('keeps a line under tokens that wait for a click, and times only the tokens', () => {
    const { parsed, drawn } = lay(
      [
        el('dg-box', { name: 'a', label: 'A' }),
        el('dg-box', { name: 'b', label: 'B' }),
        el('dg-link', { name: 'go', from: 'a', to: 'b', flow: '1', step: '1' }),
      ],
      { layout: 'layers' },
    );
    const { cues, appears } = choreograph(drawn, parsed.children);
    const plan = schedule(cues);
    expect(appears.get(cueIds.link(0))).toBe(0);
    expect(plan.timing.get(cueIds.ride(0))!.stage).toBe(1);
  });
});

describe('a meter and a queue in a diagram', () => {
  const meterOf = (drawn: DiagramLayout) =>
    drawn.items.find((i): i is LMeter => i.kind === 'meter')!;
  const queueOf = (drawn: DiagramLayout) =>
    drawn.items.find((i): i is LQueue => i.kind === 'queue')!;

  it('fills a meter, on each click, exactly as far as its value goes against its maximum', () => {
    const { parsed, drawn } = lay([
      el('dg-meter', {
        name: 'disk',
        label: 'Disk',
        value: '25 50 100',
        max: '200',
        threshold: '150',
      }),
    ]);
    expect(parsed.issues).toEqual([]);
    const disk = meterOf(drawn);
    expect(disk.fills.map((f) => f / disk.track.w)).toEqual([0.125, 0.25, 0.5]);
    expect((disk.threshold! - disk.track.x) / disk.track.w).toBeCloseTo(0.75);
    expect(disk.figures.map((f) => f.lines.join(' '))).toEqual([
      '25 / 200',
      '50 / 200',
      '100 / 200',
    ]);
    expect(drawn.status).toBe('fit');
  });

  it('says a figure with its unit when it has one', () => {
    const disk = meterOf(lay([el('dg-meter', { value: '85', unit: '%' })]).drawn);
    expect(disk.figures[0]!.lines).toEqual(['85 %']);
  });

  it('draws a queue of its places, as many taken on each click as it says', () => {
    const { parsed, drawn } = lay([
      el('dg-queue', { name: 'wait', label: 'waiting', count: '8', fill: '0 4 8' }),
    ]);
    expect(parsed.issues).toEqual([]);
    const wait = queueOf(drawn);
    expect(wait.cells).toHaveLength(8);
    expect(wait.fills).toEqual([0, 4, 8]);
    for (const cell of wait.cells) {
      expect(cell.x).toBeGreaterThanOrEqual(wait.x - 0.5);
      expect(cell.x + cell.w).toBeLessThanOrEqual(wait.x + wait.w + 0.5);
    }
  });

  it('is linked like any mark · a row with link="arrow" chains through a queue', () => {
    const { drawn } = lay(
      [
        el('dg-box', { name: 'in', label: 'In' }),
        el('dg-queue', { name: 'wait', count: '4', fill: '2' }),
        el('dg-box', { name: 'out', label: 'Out' }),
      ],
      { layout: 'row', link: 'arrow' },
    );
    expect(drawn.links.map((l) => `${l.from}>${l.to}`)).toEqual(['in>wait', 'wait>out']);
  });

  it('changes a meter on each click its value moves, and not on the others', () => {
    const { drawn } = lay([el('dg-meter', { name: 'disk', value: '40 40 85' })]);
    const { cues } = choreograph(drawn, drawn.tree);
    const switches = cues.filter((c) => c.role === 'switch').map((c) => c.stage);
    expect(switches).toEqual([2]);
    expect(changesOn(meterOf(drawn), 1, 0)).toBe(false);
    expect(changesOn(meterOf(drawn), 2, 0)).toBe(true);
    expect(lastChange(meterOf(drawn), 0, 1)).toBe(0);
    expect(lastChange(meterOf(drawn), 0, 2)).toBe(2);
  });
});

describe('a diagram with states', () => {
  it('keeps one scale for a bar chart that changes, so a shorter bar is a smaller number on every click', () => {
    const bars = (values: [string, string][]) =>
      values.map(([name, value]) => el('dg-bar', { name, label: name, value }));
    const parsed = parseDiagram(
      el('deck-diagram', { layout: 'column' }, [
        el(
          'dg-state',
          {},
          bars([
            ['mobile', '60'],
            ['web', '30'],
          ]),
        ),
        el(
          'dg-state',
          { step: '1' },
          bars([
            ['web', '45'],
            ['mobile', '40'],
          ]),
        ),
      ]),
    );
    const width = (stage: number, key: string) => {
      const drawn = layoutDiagram(parsed, { meter, bounds: { w: 1600, h: 600 }, stage });
      return (drawn.items.find((i) => i.key === key) as { w: number }).w;
    };
    expect(width(1, 'web') / width(0, 'mobile')).toBeCloseTo(45 / 60, 1);
    expect(width(0, 'web') / width(0, 'mobile')).toBeCloseTo(30 / 60, 1);
  });

  it('lays out the picture of the click it is asked for, the last one when it is not', () => {
    const parsed = parseDiagram(
      el('deck-diagram', {}, [
        el('dg-state', {}, [el('dg-box', { name: 'a', label: 'A' })]),
        el('dg-state', { step: '1' }, [el('dg-box', { name: 'b', label: 'B' })]),
      ]),
    );
    const keys = (stage?: number) =>
      layoutDiagram(parsed, { meter, bounds: { w: 1600, h: 600 }, stage }).items.map((i) => i.key);
    expect(keys(0)).toEqual(['a']);
    expect(keys(1)).toEqual(['b']);
    expect(keys()).toEqual(['b']);
  });
});
