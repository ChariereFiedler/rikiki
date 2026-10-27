import { describe, expect, it } from 'vitest';
import { choreograph, cueIds } from './choreography.js';
import { type LGate, type LLane, type Meter, layoutDiagram } from './layout.js';
import { TOKEN_RADIUS } from './lanes.js';
import { type ElementLike, parseDiagram } from './model.js';
import {
  BEAT_GAP,
  MAX_STORY_TOKENS_LANE,
  STORY_MAX_RATE,
  STORY_PACE,
  type StoryPlan,
  leverPivots,
  planStory,
  readSeconds,
  storyIds,
} from './story.js';

// ════════════════════════════════════════════════════════════════
// The story · one scene played on entry. What is promised: the system runs before
// it breaks, the tokens of the flow stop where the event cuts them, one beat at a
// time, the proof last, played at the room's pace and never so fast that two
// beats come within half a second, the same plan every time.
// ════════════════════════════════════════════════════════════════

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

function story(children: ElementLike[], attrs: Record<string, string> = {}) {
  const parsed = parseDiagram(el('deck-diagram', { play: 'enter', ...attrs }, children));
  const drawn = layoutDiagram(parsed, { meter, bounds: { w: 1600, h: 600 } });
  const plan = planStory(drawn, choreograph(drawn, drawn.tree), {
    budget: readSeconds(parsed.attrs.budget) || undefined,
  });
  return { parsed, drawn, plan };
}

/** The kill switch of the story fixture · a flow of 3 s, the switch, the gate, the proof. */
const killSwitch = (steady = '3s') => [
  el('dg-group', { layout: 'row', gap: 'airy' }, [
    el('dg-box', {
      name: 'essai',
      icon: 'flag',
      label: 'essai réel',
      note: 'mardi 14:02',
      paint: 'ok',
    }),
    el('dg-box', {
      name: 'drapeau',
      icon: 'database',
      label: 'DB 2 · MARCHE',
      swap: 'DB 2 · STOP',
      'swap-icon': 'ban',
      paint: 'pale',
      tone: 'normal warn',
      beat: 'event',
      after: 'ecrit',
    }),
    el('dg-box', { name: 'lit', icon: 'code', label: 'is_active()', paint: 'ink' }),
    el('dg-link', { name: 'ecrit', from: 'essai', to: 'drapeau', flow: '1', beat: 'event' }),
    el('dg-link', { name: 'lu', from: 'drapeau', to: 'lit', flow: '1', beat: 'spread' }),
  ]),
  el('dg-group', { layout: 'lanes', gap: 'tight' }, [
    el('dg-lane', { name: 'api', icon: 'cloud', label: 'API', steady }),
    el('dg-lane', { name: 'tache', icon: 'clock', label: 'tâche', steady }),
    el('dg-gate', { name: 'stop', by: 'lit', state: 'open closed', beat: 'spread', after: 'lu' }),
    el('dg-box', {
      name: 'acme',
      icon: 'target',
      label: 'ACME',
      paint: 'pale',
      proof: '0 devis créé',
      beat: 'proof',
    }),
  ]),
];

const at = (plan: StoryPlan, mark: string) => plan.script.beats.find((b) => b.mark === mark)!.atMs;
const indexOf = (drawn: ReturnType<typeof story>['drawn'], key: string) =>
  drawn.items.findIndex((item) => item.key === key);

describe('readSeconds', () => {
  it('reads seconds and milliseconds, with a comma or a point', () => {
    expect(readSeconds('3s')).toBe(3);
    expect(readSeconds('2,5 s')).toBe(2.5);
    expect(readSeconds('800ms')).toBe(0.8);
    expect(readSeconds('4')).toBe(4);
    expect(readSeconds('soon')).toBeNaN();
    expect(readSeconds(undefined)).toBeNaN();
  });
});

describe('a story, the kill switch', () => {
  it('is read as a story and takes no click', () => {
    const { parsed, drawn } = story(killSwitch(), { layout: 'column', align: 'start' });
    expect(parsed.story).toBe(true);
    expect(parsed.issues).toEqual([]);
    expect(drawn.status).toBe('fit');
  });

  it("plays a steady it refused as the diagram's own · never the length written", () => {
    const refused = story(killSwitch('120s'), { layout: 'column', align: 'start' });
    expect(refused.parsed.issues.map((i) => i.code)).toContain('DG_VALUE_INVALID');
    const own = story(killSwitch('3s'), { layout: 'column', align: 'start' });
    expect(refused.plan.script.writtenMs).toBe(own.plan.script.writtenMs);
    expect([...refused.plan.departures.values()].flat()).toEqual(
      [...own.plan.departures.values()].flat(),
    );
  });

  it('lets the system run before it breaks · the flow passes, then the event', () => {
    const { plan } = story(killSwitch(), { layout: 'column', align: 'start' });
    expect(plan.script.steadyMs).toBeGreaterThanOrEqual(1500);
    const flows = plan.script.beats.filter((b) => b.kind === 'flow');
    expect(flows.map((b) => b.mark)).toEqual(['api', 'tache']);
    expect(Math.max(...flows.map((b) => b.atMs))).toBeLessThan(at(plan, 'ecrit'));
  });

  it('sends a token of the flow only if it reaches the gate before it closes', () => {
    const { drawn, plan } = story(killSwitch(), { layout: 'column', align: 'start' });
    const gateIndex = indexOf(drawn, 'stop');
    const gate = drawn.items[gateIndex] as LGate;
    const closes = plan.timing.get(cueIds.switch(gateIndex, 1))!.start;
    for (const key of ['api', 'tache']) {
      const i = indexOf(drawn, key);
      const lane = drawn.items[i] as LLane;
      const departures = plan.departures.get(storyIds.steady(i))!;
      const trip = plan.trips.get(storyIds.steady(i))!;
      expect(departures.length).toBeGreaterThanOrEqual(3);
      const from = lane.track.x0 + TOKEN_RADIUS;
      const to = lane.track.x1 - 20 - TOKEN_RADIUS;
      const reach = ((gate.x - TOKEN_RADIUS - from) / (to - from)) * trip;
      for (const start of departures) expect(start + reach).toBeLessThanOrEqual(closes + 1e-6);
    }
  });

  it('queues the tokens after the gate closes, then pales what lies past it', () => {
    const { drawn, plan } = story(killSwitch(), { layout: 'column', align: 'start' });
    const gateIndex = indexOf(drawn, 'stop');
    const closes = plan.timing.get(cueIds.switch(gateIndex, 1))!;
    const run = plan.timing.get(cueIds.run(indexOf(drawn, 'api'), 1))!;
    const past = plan.timing.get(storyIds.downstream(gateIndex))!;
    expect(run.start).toBeGreaterThanOrEqual(closes.start + closes.duration);
    expect(past.start).toBeGreaterThan(run.start);
  });

  it('plays its beats in order, one at a time, the proof last', () => {
    const { plan } = story(killSwitch(), { layout: 'column', align: 'start' });
    const order = ['ecrit', 'drapeau', 'lu', 'stop', 'acme'].map((mark) => at(plan, mark));
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    for (let k = 1; k < order.length; k += 1)
      expect(order[k]! - order[k - 1]!).toBeGreaterThanOrEqual(500);
    expect(plan.script.beats.at(-1)!.phase).toBe('proof');
  });

  it('times what a beat does · the swap with the tone, the proof in the target', () => {
    const { drawn, plan } = story(killSwitch(), { layout: 'column', align: 'start' });
    const drapeau = indexOf(drawn, 'drapeau');
    expect(plan.timing.get(storyIds.swap(drapeau))!.start).toBe(
      plan.timing.get(cueIds.switch(drapeau, 1))!.start,
    );
    expect(plan.timing.get(storyIds.proof(indexOf(drawn, 'acme')))!.start * 1000).toBeCloseTo(
      at(plan, 'acme'),
      -1,
    );
  });

  it('is played at the pace of the room, from six to ten seconds', () => {
    const { plan } = story(killSwitch(), { layout: 'column', align: 'start' });
    expect(plan.script.writtenMs).toBeGreaterThan(STORY_PACE * 1000);
    expect(plan.script.rate).toBeGreaterThan(1);
    expect(plan.script.rate).toBeLessThanOrEqual(STORY_MAX_RATE);
    expect(plan.script.playedMs).toBeGreaterThanOrEqual(6000);
    expect(plan.script.playedMs).toBeLessThanOrEqual(10_000);
    expect(plan.issues).toEqual([]);
  });

  it('is the same plan every time', () => {
    const once = story(killSwitch(), { layout: 'column', align: 'start' }).plan;
    const twice = story(killSwitch(), { layout: 'column', align: 'start' }).plan;
    expect(JSON.stringify([...twice.timing])).toBe(JSON.stringify([...once.timing]));
    expect(twice.script).toEqual(once.script);
  });
});

describe('a story · its pace and its limits', () => {
  it('never plays two beats within half a second to keep its pace', () => {
    const { plan } = story(killSwitch(), { layout: 'column', align: 'start' });
    const declared = plan.script.beats.filter((b) => b.declared && b.phase !== 'steady' && !b.with);
    const gaps = declared.slice(1).map((b, k) => b.atMs - declared[k]!.atMs);
    expect(Math.min(...gaps)).toBeGreaterThanOrEqual(500);
    expect(BEAT_GAP / plan.script.rate).toBeGreaterThanOrEqual(0.5);
  });

  it('plays a story longer than its budget faster, and says so', () => {
    const { plan } = story(killSwitch('9s'), { layout: 'column', align: 'start', budget: '6s' });
    expect(plan.script.playedMs).toBeLessThanOrEqual(6000 + 1);
    expect(plan.issues.map((i) => i.code)).toContain('DG_MOTION_BUDGET');
  });

  it('says a flow too long to count · more than twelve tokens a lane', () => {
    const { plan } = story(killSwitch('11s'), { layout: 'column', align: 'start', budget: '12s' });
    const crowd = plan.issues.find((i) => i.code === 'DG_TOKENS_MANY');
    expect(crowd?.expected).toEqual({ perLane: MAX_STORY_TOKENS_LANE, total: 40 });
  });

  it('starts what goes with another mark with it, and what comes after once it ends', () => {
    const { plan } = story([
      el('dg-box', { name: 'a', label: 'A', beat: 'event' }),
      el('dg-box', { name: 'b', label: 'B', beat: 'event', with: 'a' }),
      el('dg-box', { name: 'c', label: 'C', beat: 'event', after: 'a' }),
      el('dg-box', { name: 'd', label: 'D', proof: 'reçu', beat: 'proof' }),
    ]);
    expect(at(plan, 'b')).toBe(at(plan, 'a'));
    expect(at(plan, 'c')).toBeGreaterThan(at(plan, 'a'));
    expect(at(plan, 'd')).toBeGreaterThan(at(plan, 'c'));
  });

  it('places marks that wait for each other anyway, one beat after the other', () => {
    const { plan } = story([
      el('dg-box', { name: 'a', label: 'A', beat: 'event', after: 'b' }),
      el('dg-box', { name: 'b', label: 'B', beat: 'event', after: 'a' }),
    ]);
    expect(at(plan, 'b') - at(plan, 'a')).not.toBe(0);
  });
});

describe('the writing of a story', () => {
  const codesOf = (root: Record<string, string>, children: ElementLike[]) =>
    parseDiagram(el('deck-diagram', root, children)).issues.map((i) => `${i.code} ${i.severity}`);

  it('drops what only a story reads on a diagram that plays on clicks, and says it', () => {
    const parsed = parseDiagram(
      el('deck-diagram', {}, [
        el('dg-box', { name: 'a', label: 'A', beat: 'event', proof: 'reçu' }),
      ]),
    );
    expect(parsed.story).toBe(false);
    const found = parsed.issues.find((i) => i.code === 'DG_STORY_ATTR');
    expect(found?.items).toEqual(['box a · beat', 'box a · proof']);
    expect(parsed.children[0]!.attrs.proof).toBeUndefined();
  });

  it('reads no click in a story, and says the step it drops', () => {
    expect(
      codesOf({ play: 'enter' }, [el('dg-box', { name: 'a', label: 'A', step: '1' })]),
    ).toEqual(['DG_STORY_ATTR warning']);
  });

  it('refuses a beat, a duration or a budget it cannot read', () => {
    expect(
      codesOf({ play: 'enter' }, [el('dg-box', { name: 'a', label: 'A', beat: 'later' })]),
    ).toEqual(['DG_VALUE_INVALID error']);
    expect(codesOf({ play: 'enter', budget: '20s' }, [el('dg-box', { label: 'A' })])).toEqual([
      'DG_VALUE_INVALID error',
    ]);
    expect(codesOf({ play: 'enter' }, [el('dg-lane', { label: 'A', steady: 'long' })])).toContain(
      'DG_VALUE_INVALID error',
    );
    expect(codesOf({ play: 'later' }, [el('dg-box', { label: 'A' })])).toContain(
      'DG_VALUE_INVALID error',
    );
  });

  it('names a mark that with points at and nobody is', () => {
    expect(
      codesOf({ play: 'enter' }, [
        el('dg-box', { name: 'a', label: 'A', beat: 'event', with: 'ghost' }),
      ]),
    ).toEqual(['DG_REF_UNKNOWN error']);
  });

  it('plays the clicks of dg-state, and says play is dropped', () => {
    const parsed = parseDiagram(
      el('deck-diagram', { play: 'enter' }, [el('dg-state', {}, [el('dg-box', { label: 'A' })])]),
    );
    expect(parsed.story).toBe(false);
    expect(parsed.issues.map((i) => i.code)).toContain('DG_STORY_ATTR');
  });

  it('sets a box that swaps its word in the room of the longer one, and its proof inside it', () => {
    const { drawn } = story([
      el('dg-box', {
        name: 'a',
        label: 'MARCHE',
        swap: 'STOP · coupé net',
        paint: 'pale',
        proof: '0 créé',
        beat: 'event',
      }),
    ]);
    const box = drawn.items.find((i) => i.key === 'a');
    if (box?.kind !== 'box') throw new Error('a box');
    const label = box.texts.find((t) => t.role === 'label')!;
    expect(label.lines.join(' ')).toBe('STOP · coupé net');
    expect(box.before?.label?.lines.join(' ')).toBe('MARCHE');
    expect(box.before?.label?.y).toBe(label.y);
    const proof = box.texts.find((t) => t.role === 'proof')!;
    expect(proof.y + proof.line).toBeLessThanOrEqual(box.y + box.h);
    expect(box.proofDisc!.x).toBeLessThan(proof.x);
  });
});

describe('a story · a lever and the route it turns away from', () => {
  const blueGreen = () => [
    el('dg-box', { name: 'clients', label: 'clients' }),
    el('dg-box', { name: 'traefik', label: 'Traefik' }),
    el('dg-box', { name: 'blue', label: 'blue' }),
    el('dg-box', { name: 'green', label: 'green', beat: 'event' }),
    el('dg-link', { name: 'in', from: 'clients', to: 'traefik', steady: '3s' }),
    el('dg-link', {
      name: 'old',
      from: 'traefik',
      to: 'blue',
      route: 'straight',
      steady: '3s',
      dim: true,
      beat: 'effect',
      with: 'new',
    }),
    el('dg-link', {
      name: 'new',
      from: 'traefik',
      to: 'green',
      route: 'straight',
      steady: '3s',
      lever: true,
      beat: 'effect',
    }),
    el('dg-box', { name: 'proof', label: 'ok', proof: '0 perdue', beat: 'proof' }),
  ];

  it('leaves both routes from one pivot, and turns from the old one to the new', () => {
    const { drawn, plan } = story(blueGreen(), { layout: 'layers', direction: 'right' });
    const pivots = leverPivots(drawn);
    const oldLink = drawn.links.findIndex((l) => l.node?.attrs.name === 'old');
    const newLink = drawn.links.findIndex((l) => l.node?.attrs.name === 'new');
    expect(pivots.get(oldLink)).toEqual(pivots.get(newLink));
    expect(Math.abs(plan.levers.get(storyIds.lever(newLink))!)).toBeGreaterThan(5);
  });

  it('carries the flow on the old route until the lever, then on the new one, fed by the first', () => {
    const { drawn, plan } = story(blueGreen(), { layout: 'layers', direction: 'right' });
    const j = (name: string) => drawn.links.findIndex((l) => l.node?.attrs.name === name);
    const lever = plan.timing.get(storyIds.lever(j('new')))!.start;
    const old = plan.departures.get(storyIds.linkSteady(j('old')))!;
    const fresh = plan.departures.get(storyIds.linkSteady(j('new')))!;
    expect(old.length).toBeGreaterThan(0);
    expect(fresh.length).toBeGreaterThan(0);
    expect(Math.max(...old)).toBeLessThanOrEqual(lever + 1e-6);
    expect(Math.min(...fresh)).toBeGreaterThanOrEqual(lever - 1e-6);
    const fed = plan.departures.get(storyIds.linkSteady(j('in')))!;
    expect(Math.max(...fed)).toBeGreaterThan(lever);
  });
});

describe('a group or a panel that comes in on its beat', () => {
  const late = () => [
    el('dg-box', { name: 'avant', label: 'avant', beat: 'event' }),
    el(
      'dg-group',
      { name: 'tard', layout: 'row', label: 'plus tard', paint: 'pale', beat: 'spread' },
      [
        el('dg-box', { name: 'a', label: 'a' }),
        el('dg-box', { name: 'b', label: 'b' }),
        el('dg-box', { name: 'c', label: 'c', proof: 'vu', beat: 'proof' }),
      ],
    ),
  ];
  const startOf = (
    plan: StoryPlan,
    drawn: { items: { node: { attrs: { name?: string } } }[] },
    name: string,
  ) =>
    plan.timing.get(cueIds.item(drawn.items.findIndex((i) => i.node.attrs.name === name)))!.start;

  it('brings its marks in together, a little apart, as one beat', () => {
    const { drawn, plan } = story(late());
    const group = startOf(plan, drawn, 'tard');
    const marks = ['a', 'b'].map((n) => startOf(plan, drawn, n));
    for (const at of marks) expect(at - group).toBeLessThan(BEAT_GAP / 2);
    expect(plan.script.beats.filter((b) => b.declared && b.phase === 'spread')).toHaveLength(1);
  });

  it('brings in with it a mark that acts on a beat of its own, which acts later', () => {
    const { drawn, plan } = story(late());
    const group = startOf(plan, drawn, 'tard');
    expect(startOf(plan, drawn, 'c') - group).toBeLessThan(BEAT_GAP / 2);
    const c = drawn.items.findIndex((i) => i.node.attrs.name === 'c');
    expect(plan.timing.get(storyIds.proof(c))!.start).toBeGreaterThan(group + BEAT_GAP);
  });

  it('with no surface, is led by its first mark, which plays the beat written on it', () => {
    const { plan } = story([
      el('dg-box', { name: 'x', label: 'x', beat: 'event' }),
      el('dg-group', { layout: 'column', beat: 'spread', after: 'x' }, [
        el('dg-box', { name: 'p', label: 'p' }),
        el('dg-box', { name: 'q', label: 'q' }),
      ]),
    ]);
    const lead = plan.script.beats.find((b) => b.mark === 'p')!;
    const event = plan.script.beats.find((b) => b.mark === 'x')!;
    expect(lead.declared).toBe(true);
    expect(lead.atMs).toBeGreaterThan(event.atMs);
    expect(plan.script.beats.find((b) => b.mark === 'q')!.declared).toBe(false);
  });
});

describe('the steady beat', () => {
  it('starts a mark that says `with` another one of it beside it · the tracks of a replay move together', () => {
    const { plan } = story([
      el('dg-counter', { name: 'total', value: '4182', beat: 'steady', duration: '3s' }),
      el('dg-curve', {
        name: 'series',
        values: '1 4 9 6',
        beat: 'steady',
        with: 'total',
        duration: '3s',
      }),
      el('dg-box', { name: 'later', label: 'later', beat: 'steady' }),
    ]);
    const at = (mark: string) => plan.script.beats.find((b) => b.mark === mark)!.atMs;
    expect(at('series')).toBe(at('total'));
    expect(at('later')).toBeGreaterThan(at('total'));
  });
});

describe('a crowd on a beat', () => {
  // A `dg-dot count="100"` is a hundred items of one mark · it came in on its beat as
  // a hundred beats one after the other, a story of a minute and a hundred lines of
  // script for one thing the room sees once.
  const crowd = (count: string) =>
    story([
      el('dg-group', { layout: 'grid' }, [
        el('dg-dot', { count: '60', beat: 'steady' }),
        el('dg-dot', { name: 'partis', count, emphasis: true, beat: 'event' }),
      ]),
      el('dg-box', { name: 'bilan', label: 'bilan', proof: '38 partis', beat: 'proof' }),
    ]);

  it('is one beat for the whole group, its dots in a bounded wave', () => {
    const { plan } = crowd('100');
    const beats = plan.script.beats.filter((b) => b.mark === 'partis');
    expect(beats).toHaveLength(1);
    expect(plan.script.beats.filter((b) => b.phase === 'steady')).toHaveLength(1);
    expect(plan.script.playedMs).toBeLessThanOrEqual(STORY_PACE * 1000 + 1);
    expect(plan.issues.map((i) => i.code)).not.toContain('DG_STORY_LONG');
  });

  it('times a hundred dots like ten · the wave is bounded, not one step per dot', () => {
    const hundred = crowd('100').plan.script.playedMs;
    const ten = crowd('10').plan.script.playedMs;
    expect(hundred).toBe(ten);
    const { drawn, plan } = crowd('100');
    const starts = drawn.items
      .map((item, i) => ({ item, i }))
      .filter(({ item }) => item.node.attrs.name === 'partis')
      .map(({ i }) => plan.timing.get(cueIds.item(i))!.start);
    expect(starts).toHaveLength(100);
    const wave = starts.at(-1)! - starts[0]!;
    expect(wave, 'one after the other').toBeGreaterThan(0);
    expect(wave, 'within the wave, played').toBeLessThanOrEqual(0.6 / plan.script.rate + 1e-9);
  });
});
