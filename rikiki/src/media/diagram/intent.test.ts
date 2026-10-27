import { describe, expect, it } from 'vitest';
import { framesOf } from './choreography.js';
import {
  INTENTS,
  INTENT_NAMES,
  SECONDARIES,
  closestIntents,
  compileIntent,
  proveIntent,
  rateOf,
} from './intent.js';
import type { LBox, LGate, Meter } from './layout.js';
import { type DgNode, type ElementLike, parseDiagram } from './model.js';

/** A font that is the same width for every letter · a test needs numbers, not glyphs. */
const meter: Meter = (size) => (text) => text.length * size * 0.55;
const OPTIONS = { meter, bounds: { w: 1600, h: 600 } };

/** A tree of elements from markup · tags, quoted attributes, bare attributes. */
function readMarkup(html: string): ElementLike {
  type Literal = ElementLike & { children: Literal[] };
  const root = { children: [] as Literal[] };
  const stack: { children: Literal[] }[] = [root];
  for (const match of html.matchAll(/<(\/?)([a-z][\w-]*)((?:\s+[\w-]+(?:="[^"]*")?)*)\s*>/g)) {
    const [, closing, name, rest] = match;
    if (closing) {
      stack.pop();
      continue;
    }
    const attrs: Record<string, string> = {};
    for (const a of rest!.matchAll(/([\w-]+)(?:="([^"]*)")?/g)) attrs[a[1]!] = a[2] ?? '';
    const element: Literal = {
      localName: name!,
      children: [],
      getAttribute: (n) => (n in attrs ? attrs[n]! : null),
      hasAttribute: (n) => n in attrs,
      getAttributeNames: () => Object.keys(attrs),
    };
    stack.at(-1)!.children.push(element);
    stack.push(element);
  }
  return root.children[0]!;
}

/** A diagram written as an intent, compiled, laid out on every click and proven. */
function draw(html: string) {
  const parsed = parseDiagram(readMarkup(html), compileIntent);
  const frames = framesOf(parsed, OPTIONS);
  const proven = parsed.intent
    ? proveIntent(
        parsed.intent,
        frames.map((f) => ({
          drawn: f.drawn,
          stage: f.stage,
          appears: f.choreography.appears,
          timing: f.timing,
        })),
      )
    : [];
  return { parsed, frames, issues: [...parsed.issues, ...proven] };
}

const codes = (html: string) => draw(html).issues.map((issue) => issue.code);
const intentCodes = (html: string) => codes(html).filter((code) => code.startsWith('INT_'));

const find = (nodes: DgNode[], test: (n: DgNode) => boolean): DgNode | undefined => {
  for (const node of nodes) {
    if (test(node)) return node;
    const inside = find(node.children, test);
    if (inside) return inside;
  }
  return undefined;
};
const byName = (nodes: DgNode[], name: string) => find(nodes, (n) => n.attrs.name === name);

describe('the registry', () => {
  it('names the sixteen intents of the grammar, every one compiled', () => {
    expect(INTENT_NAMES).toHaveLength(16);
    for (const name of INTENT_NAMES) {
      expect(INTENTS[name].cues.length).toBeGreaterThan(2);
      expect(INTENTS[name].compiled.skeleton).toContain(`intent="${name}"`);
    }
  });

  it('gives every intent a focal role it has, and only secondaries that have a region of their own', () => {
    for (const name of INTENT_NAMES) {
      const compiled = INTENTS[name].compiled;
      expect(compiled.roles.map((r) => r.role)).toContain(compiled.focal);
      for (const other of compiled.composes) expect(SECONDARIES).toContain(other);
      expect(compiled.composes).not.toContain(name);
    }
  });

  it('keeps the roles of an intent and of its secondaries apart, so a role says one part', () => {
    for (const name of INTENT_NAMES) {
      const compiled = INTENTS[name].compiled;
      for (const other of compiled.composes) {
        const mine = compiled.roles.map((r) => r.role);
        const theirs = INTENTS[other].compiled.roles.map((r) => r.role);
        expect(
          mine.filter((role) => theirs.includes(role)),
          `${name} + ${other}`,
        ).toEqual([]);
      }
    }
  });
});

/** The structure a skeleton compiles to, its looks aside · the layouts of its groups,
 *  the kinds of its marks, how its links run. */
function structureOf(html: string): string {
  const { parsed } = draw(html);
  const shape = (nodes: DgNode[]): unknown[] =>
    nodes
      .filter((n) => n.kind !== 'text')
      .map((n) =>
        n.children.length
          ? [n.kind, n.attrs.layout ?? '', n.attrs.direction ?? '', shape(n.children)]
          : n.kind,
      );
  return JSON.stringify([
    parsed.attrs.layout ?? '',
    parsed.attrs.direction ?? '',
    shape(parsed.children),
  ]);
}

describe('every intent looks like no other', () => {
  it('compiles each skeleton to a structure of its own', () => {
    const seen = new Map<string, string>();
    for (const name of INTENT_NAMES) {
      const structure = structureOf(INTENTS[name].compiled.skeleton);
      expect(seen.get(structure), `${name} is drawn like ${seen.get(structure)}`).toBeUndefined();
      seen.set(structure, name);
    }
  });
});

describe.each(INTENT_NAMES)('%s', (name) => {
  const compiled = INTENTS[name].compiled;

  it('its skeleton demonstrates it: no error, no INT finding, and it fits on every click', () => {
    const { issues, frames } = draw(compiled.skeleton);
    expect(issues.filter((i) => i.severity === 'error' || i.code.startsWith('INT_'))).toEqual([]);
    for (const frame of frames)
      expect(frame.drawn.status, `click ${frame.stage}: ${frame.drawn.reasons.join('; ')}`).toBe(
        'fit',
      );
  });

  it('writes no coordinate · the skeleton holds no size and no position', () => {
    expect(compiled.skeleton).not.toMatch(/\b(bounds|x|y|width|height|style)=/);
  });

  for (const pitfall of compiled.pitfalls.filter((p) => p.html))
    it(`rejects its counter-example with ${pitfall.code}`, () => {
      const found = draw(pitfall.html!).issues.filter((i) => i.code === pitfall.code);
      expect(found.length, JSON.stringify(draw(pitfall.html!).issues)).toBeGreaterThan(0);
      expect(found[0]!.severity).toBe('error');
    });

  it('compiles the same tree to the same drawing', () => {
    const a = draw(compiled.skeleton);
    const b = draw(compiled.skeleton);
    expect(JSON.stringify(a.frames.map((f) => f.drawn))).toBe(
      JSON.stringify(b.frames.map((f) => f.drawn)),
    );
  });
});

describe('compiling', () => {
  it('leaves a diagram without intent as it was written', () => {
    const html =
      '<deck-diagram layout="column"><dg-box name="a" label="A"></dg-box></deck-diagram>';
    const parsed = parseDiagram(readMarkup(html), compileIntent);
    expect(parsed.intent).toBeUndefined();
    expect(parsed.attrs.layout).toBe('column');
    expect(parsed.issues).toEqual([]);
  });

  it('says a role does nothing without an intent', () => {
    expect(
      codes('<deck-diagram><dg-box role="cause" label="A"></dg-box></deck-diagram>'),
    ).toContain('INT_ROLE_NO_INTENT');
  });

  it('places a chain of three in a row, links each to the next and traces them in order', () => {
    const { parsed } = draw(INTENTS.cause.compiled!.skeleton);
    expect(parsed.attrs.layout).toBe('row');
    const links = parsed.children.filter((n) => n.kind === 'link');
    expect(links.map((l) => `${l.attrs.from}>${l.attrs.to}`)).toEqual(['cache>db', 'db>pages']);
    expect(links.every((l) => l.attrs.enter === 'draw' && l.attrs.flow === '1')).toBe(true);
    expect(links[1]!.attrs.after).toBe(links[0]!.attrs.name);
    // The effect comes in when the chain reaches it, and it is the one put forward.
    expect(byName(parsed.children, 'pages')!.attrs.after).toBe(links[1]!.attrs.name);
    expect(byName(parsed.children, 'pages')!.attrs.emphasis).toBe('true');
    expect(byName(parsed.children, 'cache')!.attrs.emphasis).toBeUndefined();
  });

  it('places several causes as a graph', () => {
    const { parsed } = draw(`<deck-diagram intent="cause">
      <dg-box role="cause" name="a" label="A"></dg-box>
      <dg-box role="cause" name="b" label="B"></dg-box>
      <dg-box role="effect" name="c" label="C"></dg-box>
    </deck-diagram>`);
    expect(parsed.attrs.layout).toBe('layers');
  });

  it('puts the lanes and the gate in a lanes group, closes the gate on the first click, under its control', () => {
    const { parsed, frames } = draw(INTENTS.barrier.compiled!.skeleton);
    expect(parsed.attrs.layout).toBe('column');
    const gate = byName(parsed.children, 'stop')!;
    expect(gate.attrs.state).toBe('open closed');
    expect(gate.attrs.by).toBe('switch');
    expect(
      find(parsed.children, (n) => n.attrs.layout === 'lanes')!.children.map((n) => n.kind),
    ).toEqual(['lane', 'lane', 'lane', 'gate', 'box']);
    const drawn = frames.at(-1)!.drawn.items.find((i): i is LGate => i.kind === 'gate')!;
    expect(drawn.lanes).toEqual(['api', 'jobs', 'sync']);
  });

  it('composes a cause that drives the barrier · the chain rides on click 1, the gate closes on click 2', () => {
    const { parsed, issues } = draw(`<deck-diagram intent="barrier" also="cause">
      <dg-box role="cause" name="test" icon="flag" label="Live test"></dg-box>
      <dg-box role="via" name="flag" icon="database" label="Flag"></dg-box>
      <dg-box role="effect" name="reader" icon="code" label="is_active()"></dg-box>
      <dg-lane role="flow" name="api" label="API"></dg-lane>
      <dg-lane role="flow" name="jobs" label="Jobs"></dg-lane>
      <dg-gate role="barrier" name="stop" label="STOP"></dg-gate>
      <dg-box role="beyond" name="vendor" label="Vendor"></dg-box>
    </deck-diagram>`);
    expect(issues.filter((i) => i.code.startsWith('INT_') || i.severity === 'error')).toEqual([]);
    expect(parsed.stages).toBe(2);
    const gate = byName(parsed.children, 'stop')!;
    expect(gate.attrs.by).toBe('reader');
    expect(gate.attrs.state).toBe('open open closed');
    const links = find(
      parsed.children,
      (n) => n.kind === 'group' && n.children.some((k) => k.kind === 'link'),
    )!.children.filter((n) => n.kind === 'link');
    expect(links.map((l) => l.attrs.step)).toEqual(['1', '1']);
    // A secondary does not put its effect forward · the gate is the focal.
    expect(byName(parsed.children, 'reader')!.attrs.emphasis).toBeUndefined();
  });

  it('composes a stock under a barrier, and a stock that is the queue of a bottleneck', () => {
    const barrier = draw(`<deck-diagram intent="barrier" also="accumulate">
      <dg-lane role="flow" name="web" label="web"></dg-lane>
      <dg-gate role="barrier" name="quota" label="quota"></dg-gate>
      <dg-queue role="stock" name="retry" label="to retry" count="6" fill="0 5"></dg-queue>
    </deck-diagram>`);
    expect(barrier.issues.filter((i) => i.severity === 'error')).toEqual([]);
    const marks = barrier.parsed.children.filter((n) => n.kind !== 'link');
    expect(marks.at(-1)!.attrs.name).toBe('retry');
    // The stock is fed by the gate that holds the flow back · an arrow joins them, its
    // tokens riding on the click the stock fills.
    const fed = barrier.parsed.children.find((n) => n.kind === 'link')!;
    expect(fed.attrs).toMatchObject({ from: 'quota', to: 'retry', flow: '3', step: '1' });
    const shared = draw(`<deck-diagram intent="bottleneck" also="accumulate">
      <dg-box role="source" name="in" label="In" value="6"></dg-box>
      <dg-queue role="queue stock" name="wait" label="waiting"></dg-queue>
      <dg-box role="neck" name="neck" label="Neck" value="2"></dg-box>
      <dg-box role="sink" name="out" label="Out"></dg-box>
    </deck-diagram>`);
    expect(shared.issues.filter((i) => i.severity === 'error')).toEqual([]);
    expect(shared.parsed.children.filter((n) => n.kind === 'queue')).toHaveLength(1);
  });

  it('reads the rates of a bottleneck into its tokens and its queue', () => {
    const { parsed } = draw(INTENTS.bottleneck.compiled!.skeleton);
    const queue = byName(parsed.children, 'waiting')!;
    expect(queue.attrs.count).toBe('6');
    expect(queue.attrs.fill).toBe('0 4');
    const flows = parsed.children.filter((n) => n.kind === 'link').map((l) => l.attrs.flow ?? '');
    expect(flows).toEqual(['6', '', '2']);
    expect(byName(parsed.children, 'review')!.attrs.emphasis).toBe('true');
    expect(rateOf(byName(parsed.children, 'arrivals')!)).toBe(6);
  });

  it('keeps the rates in proportion when they are more than tokens can count', () => {
    const { parsed } = draw(`<deck-diagram intent="bottleneck">
      <dg-box role="source" name="in" label="PRs" value="40 / day"></dg-box>
      <dg-queue role="queue" name="wait" label="waiting"></dg-queue>
      <dg-box role="neck" name="review" label="Review" value="12 / day"></dg-box>
      <dg-box role="sink" name="out" label="Prod"></dg-box>
    </deck-diagram>`);
    const flows = parsed.children
      .filter((n) => n.kind === 'link')
      .map((l) => Number(l.attrs.flow ?? 0));
    expect(flows[0]).toBe(8);
    expect(flows[2]).toBe(2);
    expect(byName(parsed.children, 'wait')!.attrs).toMatchObject({ count: '12', fill: '0 8' });
  });

  it('brings the after picture of a transform on the first click', () => {
    const { parsed } = draw(INTENTS.transform.compiled!.skeleton);
    expect(parsed.states).toBe(true);
    expect(parsed.stages).toBe(1);
  });

  it('keeps what the author wrote over what it would choose', () => {
    const { parsed } = draw(`<deck-diagram intent="barrier">
      <dg-lane role="flow" name="api" label="API" flow="2"></dg-lane>
      <dg-gate role="barrier" name="stop" state="open shed"></dg-gate>
    </deck-diagram>`);
    expect(byName(parsed.children, 'api')!.attrs.flow).toBe('2');
    expect(byName(parsed.children, 'stop')!.attrs.state).toBe('open shed');
  });
});

/** When a named mark comes in, and when it last turns or fills, on a click. */
function timesOf(frames: ReturnType<typeof draw>['frames'], name: string) {
  const frame = frames.at(-1)!;
  const index = frame.drawn.items.findIndex((item) => item.node.attrs.name === name);
  const t = (id: string) => frame.timing.get(id);
  return {
    enter: t(`i${index}`),
    turn: (click: number) => t(`i${index}:switch${click}`),
  };
}

describe('the third lot · each intent compiled to a structure of its own', () => {
  it('feedback · a ring whose return arrow is traced on the click, a token riding it', () => {
    const { parsed, issues } = draw(INTENTS.feedback.compiled.skeleton);
    expect(issues.filter((i) => i.code.startsWith('INT_'))).toEqual([]);
    expect(parsed.attrs.layout).toBe('ring');
    expect(parsed.stages).toBe(1);
    const back = parsed.children.find((n) => n.kind === 'link' && n.attrs.from === 'reach')!;
    expect(back.attrs).toMatchObject({ to: 'users', enter: 'draw', flow: '1', step: '1' });
    const forward = parsed.children.filter((n) => n.kind === 'link' && n !== back);
    expect(forward.every((l) => l.attrs.step === undefined && l.attrs.flow === undefined)).toBe(
      true,
    );
    expect(byName(parsed.children, 'reach')!.attrs.emphasis).toBe('true');
  });

  it('scale · one lit cell first on one grid, the crowd hollow after it', () => {
    const { parsed, frames } = draw(INTENTS.scale.compiled.skeleton);
    expect(parsed.attrs.layout).toBe('grid');
    expect(byName(parsed.children, 'one')!.attrs).toMatchObject({ count: '1', emphasis: 'true' });
    expect(byName(parsed.children, 'all')!.attrs.tone).toBe('muted');
    const cells = frames.at(-1)!.drawn.items.filter((i) => i.kind === 'dot');
    expect(cells[0]!.key).toBe('one');
    expect(cells).toHaveLength(200);
  });

  it('contain · frames inside frames from the outside in, the core put forward', () => {
    const { parsed, frames } = draw(INTENTS.contain.compiled.skeleton);
    const cloud = byName(parsed.children, 'cloud')!;
    const network = byName(cloud.children, 'network')!;
    expect([cloud.kind, cloud.attrs.paint, network.kind, network.attrs.paint]).toEqual([
      'group',
      'outline',
      'group',
      'soft',
    ]);
    const data = byName(network.children, 'data')!;
    expect(data.attrs).toMatchObject({ emphasis: 'true', after: 'network' });
    expect(network.attrs.after).toBe('cloud');
    // The note of a layer is kept, under its caption.
    expect(network.children[0]!.attrs.note).toBe('no public address');
    expect(timesOf(frames, 'data').enter!.start).toBeGreaterThan(
      timesOf(frames, 'network').enter!.start,
    );
  });

  it('parallel · columns whose steps of one rank start at one moment, the join after the last', () => {
    const { parsed, frames } = draw(INTENTS.parallel.compiled.skeleton);
    expect(parsed.attrs).toMatchObject({ layout: 'layers', direction: 'down' });
    const intent = parsed.intent!;
    const starts = (rank: number) =>
      intent.roles.branch!.map((b) => timesOf(frames, intent.inside[b]![rank]!).enter!.start);
    for (const rank of [0, 1]) expect(new Set(starts(rank)).size, `rank ${rank}`).toBe(1);
    expect(starts(1)[0]).toBeGreaterThan(starts(0)[0]!);
    expect(timesOf(frames, 'release').enter!.start).toBeGreaterThan(starts(1)[0]!);
    expect(parsed.stages).toBe(0);
  });

  it('propagate · one rank per click, each mark turning once the token reaches it', () => {
    const { parsed, frames } = draw(INTENTS.propagate.compiled.skeleton);
    expect(parsed.attrs).toMatchObject({ layout: 'layers', direction: 'right' });
    expect(parsed.stages).toBe(2);
    expect(byName(parsed.children, 'api')!.attrs.tone).toBe('normal danger');
    expect(byName(parsed.children, 'web')!.attrs.tone).toBe('normal normal danger');
    const wave = parsed.children.filter((n) => n.kind === 'link');
    expect(wave.map((l) => `${l.attrs.from}>${l.attrs.to}:${l.attrs.step}`)).toEqual([
      'lib>auth:1',
      'lib>api:1',
      'api>web:2',
      'api>mobile:2',
    ]);
    const box = frames.at(-1)!.drawn.items.find((i): i is LBox => i.key === 'web')!;
    expect(box.tones).toEqual(['normal', 'normal', 'danger']);
    const ride = frames
      .at(-1)!
      .timing.get(`l${frames.at(-1)!.drawn.links.findIndex((l) => l.to === 'web')}:ride`)!;
    const turn = timesOf(frames, 'web').turn(2)!;
    expect(turn.start).toBeGreaterThanOrEqual(ride.start + ride.duration);
  });

  it('threshold · the consequence tips on the click the line is crossed, once the gauge has filled', () => {
    const { parsed, frames } = draw(INTENTS.threshold.compiled.skeleton);
    expect(parsed.attrs).toMatchObject({ layout: 'column' });
    expect(byName(parsed.children, 'writes')!.attrs).toMatchObject({
      tone: 'normal normal danger',
      paint: 'outline',
    });
    const link = parsed.children.find((n) => n.kind === 'link')!;
    expect(link.attrs).toMatchObject({ step: '2', after: 'disk', flow: '1' });
    expect(timesOf(frames, 'writes').turn(2)!.start).toBeGreaterThan(
      timesOf(frames, 'disk').turn(2)!.start,
    );
  });

  it('tradeoff · the choice forks down into two gauges that move on the same click', () => {
    const { parsed } = draw(INTENTS.tradeoff.compiled.skeleton);
    expect(parsed.attrs).toMatchObject({ layout: 'layers', direction: 'down' });
    const forks = parsed.children.filter((n) => n.kind === 'link');
    expect(forks.map((l) => `${l.attrs.from}>${l.attrs.to}:${l.attrs.step}`)).toEqual([
      'cache>speed:1',
      'cache>fresh:1',
    ]);
    expect(byName(parsed.children, 'cache')!.attrs.emphasis).toBe('true');
  });

  it('drift · gaps from the planned line, traced one after the other, the widest put forward', () => {
    const { parsed } = draw(INTENTS.drift.compiled.skeleton);
    expect(parsed.attrs).toMatchObject({ layout: 'axis', balance: 'free' });
    expect(byName(parsed.children, 'q2')!.attrs).toMatchObject({
      from: '10',
      to: '14',
      after: 'q1',
    });
    expect(byName(parsed.children, 'q3')!.attrs.emphasis).toBe('true');
    const five = INTENTS.drift.compiled.skeleton.replace(
      '</deck-diagram>',
      '  <dg-bar role="measure" name="q4" label="Q4" value="27"></dg-bar>\n</deck-diagram>',
    );
    const late = draw(five);
    expect(byName(late.parsed.children, 'q4')!.attrs.step).toBe('1');
    expect(late.issues.filter((i) => i.code.startsWith('INT_'))).toEqual([]);
  });

  it('compare · bars on one scale, the subject growing once the others have', () => {
    const { parsed, frames } = draw(INTENTS.compare.compiled.skeleton);
    expect(parsed.attrs).toMatchObject({ layout: 'column', balance: 'free' });
    expect(byName(parsed.children, 'mobile')!.attrs).toMatchObject({
      after: 'web',
      emphasis: 'true',
    });
    expect(timesOf(frames, 'mobile').enter!.start).toBeGreaterThan(
      timesOf(frames, 'web').enter!.start,
    );
  });

  it('partition · the parts end to end on one band, under the caption of the whole', () => {
    const { parsed, frames } = draw(INTENTS.partition.compiled.skeleton);
    const band = byName(parsed.children, 'budget')!;
    expect(band.attrs).toMatchObject({ layout: 'axis', label: 'Budget · 100 %' });
    expect(band.children.map((p) => `${p.attrs.from}-${p.attrs.to}`)).toEqual([
      '0-45',
      '45-80',
      '80-100',
    ]);
    const spans = frames.at(-1)!.drawn.items.filter((i) => i.kind === 'span');
    expect(new Set(spans.map((s) => s.y)).size).toBe(1);
  });

  it('merge · straight arrows converging down, tokens in proportion to what each source says', () => {
    const { parsed, frames } = draw(INTENTS.merge.compiled.skeleton);
    expect(parsed.attrs).toMatchObject({ layout: 'layers', direction: 'down' });
    const arrows = parsed.children.filter((n) => n.kind === 'link');
    expect(
      arrows.map((l) => `${l.attrs.from}:${l.attrs.flow}:${l.attrs.route}:${l.attrs.step}`),
    ).toEqual(['web:3:straight:1', 'shops:2:straight:1', 'phone:1:straight:1']);
    expect(frames.at(-1)!.drawn.links.every((l) => l.points.length === 2)).toBe(true);
    expect(parsed.intent!.rates).toMatchObject({ web: 3, shops: 2, phone: 1, orders: 6 });
  });
});

describe('composing · a secondary is joined to the main intent by an arrow', () => {
  const linkFrom = (nodes: DgNode[], from: string, to: string) =>
    find(nodes, (n) => n.kind === 'link' && n.attrs.from === from && n.attrs.to === to);

  it('a cause above leads into what it drives · the origin of a wave, the gauge of a line', () => {
    const wave = draw(`<deck-diagram intent="propagate" also="cause">
      <dg-box role="cause" name="merge" label="Merge"></dg-box>
      <dg-box role="effect" name="config" label="Config"></dg-box>
      <dg-box role="origin" name="paris" label="Paris"></dg-box>
      <dg-box role="reached" name="madrid" label="Madrid"></dg-box>
      <dg-box role="reached" name="milan" label="Milan"></dg-box>
    </deck-diagram>`);
    expect(wave.issues.filter((i) => i.severity === 'error')).toEqual([]);
    const drives = linkFrom(wave.parsed.children, 'config', 'paris')!;
    // Standing from the entrance, with the chain · the wave tells what follows.
    expect(drives.attrs.flow).toBeUndefined();
    expect(drives.attrs.step).toBeUndefined();
    expect(
      wave.frames.at(-1)!.drawn.links.some((l) => l.from === 'config' && l.to === 'paris'),
    ).toBe(true);
    const line = draw(
      INTENTS.threshold.compiled.skeleton
        .replace('intent="threshold"', 'intent="threshold" also="cause"')
        .replace(
          '</deck-diagram>',
          '<dg-box role="cause" name="batch" label="Batch"></dg-box><dg-box role="effect" name="logs" label="Logs"></dg-box></deck-diagram>',
        ),
    );
    const measure = line.parsed.intent!.roles.measure![0]!;
    expect(linkFrom(line.parsed.children, 'logs', measure)).toBeDefined();
  });

  it('a stock below is filled by the part of the main intent that feeds it, its tokens on its click', () => {
    const gel = draw(`<deck-diagram intent="barrier" also="accumulate">
      <dg-lane role="flow" name="fixes" label="Fixes"></dg-lane>
      <dg-gate role="barrier" name="freeze" label="freeze"></dg-gate>
      <dg-queue role="stock" name="waiting" label="waiting" count="8" fill="1 6"></dg-queue>
    </deck-diagram>`);
    expect(linkFrom(gel.parsed.children, 'freeze', 'waiting')!.attrs).toMatchObject({
      flow: '3',
      step: '1',
    });
    // A row of regions joined by an arrow keeps a gap the arrow can be seen in.
    expect(gel.parsed.attrs).toMatchObject({ layout: 'column', gap: 'airy' });
  });

  it('a loop keeps its stock in its ring, the output feeding it in a straight line', () => {
    const { parsed, frames, issues } = draw(
      INTENTS.feedback.compiled.skeleton
        .replace('intent="feedback"', 'intent="feedback" also="accumulate"')
        .replace(
          '</deck-diagram>',
          '<dg-queue role="stock" name="base" label="readers" count="6" fill="2 5"></dg-queue></deck-diagram>',
        ),
    );
    expect(issues.filter((i) => i.severity === 'error' || i.code.startsWith('INT_'))).toEqual([]);
    expect(parsed.attrs.layout).toBe('ring');
    expect(parsed.children.some((n) => n.kind === 'queue')).toBe(true);
    const output = parsed.intent!.roles.output![0]!;
    expect(linkFrom(parsed.children, output, 'base')!.attrs.route).toBe('straight');
    const drawn = frames.at(-1)!.drawn;
    expect(drawn.status).toBe('fit');
  });

  it('a threshold under a stock it shares tips its consequence by an arrow from the gauge', () => {
    const { parsed } = draw(`<deck-diagram intent="accumulate" also="threshold">
      <dg-box role="inflow" name="logs" label="Logs"></dg-box>
      <dg-meter role="stock measure" name="disk" label="Disk" value="40 65 90" unit="%" threshold="80"></dg-meter>
      <dg-box role="consequence" name="alarm" label="Alarm"></dg-box>
    </deck-diagram>`);
    expect(linkFrom(parsed.children, 'disk', 'alarm')!.attrs).toMatchObject({
      flow: '1',
      step: '2',
    });
  });

  it('a stock fed by an inflow of its own beside a loop stands apart · INT_COMPOSE_APART', () => {
    const apart = draw(
      INTENTS.feedback.compiled.skeleton
        .replace('intent="feedback"', 'intent="feedback" also="accumulate"')
        .replace(
          '</deck-diagram>',
          '<dg-box role="inflow" name="ads" label="Ads"></dg-box><dg-queue role="stock" name="base" label="readers" count="6" fill="2 5"></dg-queue></deck-diagram>',
        ),
    );
    const found = apart.issues.find((i) => i.code === 'INT_COMPOSE_APART');
    expect(found).toMatchObject({ severity: 'error' });
    expect(found!.items).toEqual(expect.arrayContaining(['ads', 'base']));
  });
});

describe('composing · one main and two secondaries at most', () => {
  it('a stock that crosses a line · accumulate, then threshold under it, on the same gauge', () => {
    const { parsed, issues } = draw(`<deck-diagram intent="accumulate" also="threshold">
      <dg-box role="inflow" name="logs" label="Logs"></dg-box>
      <dg-meter role="stock measure" name="disk" label="Disk" value="40 65 90" unit="%" threshold="80"></dg-meter>
      <dg-box role="consequence" name="alarm" label="Alarm"></dg-box>
    </deck-diagram>`);
    expect(issues.filter((i) => i.severity === 'error' || i.code.startsWith('INT_'))).toEqual([]);
    expect(parsed.attrs.layout).toBe('column');
    expect(byName(parsed.children, 'alarm')!.attrs.tone).toBe('normal normal danger');
    expect(parsed.children.filter((n) => byName([n], 'disk'))).toHaveLength(1);
  });

  it('a chain that starts the wave · propagate with a cause above, the wave a click later', () => {
    const { parsed, issues } = draw(
      INTENTS.propagate.compiled.skeleton
        .replace('intent="propagate"', 'intent="propagate" also="cause"')
        .replace(
          '</deck-diagram>',
          '<dg-box role="cause" name="push" label="Bad release"></dg-box><dg-box role="effect" name="bug" label="Bug shipped"></dg-box></deck-diagram>',
        ),
    );
    expect(issues.filter((i) => i.severity === 'error' || i.code.startsWith('INT_'))).toEqual([]);
    expect(parsed.stages).toBe(3);
    expect(byName(parsed.children, 'api')!.attrs.tone).toBe('normal normal danger');
  });

  it('a loop that feeds a stock, a merge into a stock, a threshold driven by a cause', () => {
    const loop = draw(
      INTENTS.feedback.compiled.skeleton
        .replace('intent="feedback"', 'intent="feedback" also="accumulate"')
        .replace(
          '</deck-diagram>',
          '<dg-queue role="stock" name="base" label="readers" count="8" fill="2 6"></dg-queue></deck-diagram>',
        ),
    );
    expect(loop.issues.filter((i) => i.severity === 'error' || i.code.startsWith('INT_'))).toEqual(
      [],
    );
    const merge = draw(`<deck-diagram intent="merge" also="accumulate">
      <dg-box role="source" name="a" label="A" value="2"></dg-box>
      <dg-box role="source" name="b" label="B" value="2"></dg-box>
      <dg-queue role="into stock" name="q" label="queue" count="8" fill="0 4"></dg-queue>
    </deck-diagram>`);
    expect(merge.issues.filter((i) => i.severity === 'error' || i.code.startsWith('INT_'))).toEqual(
      [],
    );
    expect(merge.parsed.children.filter((n) => n.kind === 'queue')).toHaveLength(1);
    // A stock the merge draws is fed by the merge's arrows · an outflow of its own
    // would not be drawn, and is said rather than dropped without a word.
    const drained = draw(`<deck-diagram intent="merge" also="accumulate">
      <dg-box role="source" name="a" label="A" value="2"></dg-box>
      <dg-box role="source" name="b" label="B" value="2"></dg-box>
      <dg-queue role="into stock" name="q" label="queue" count="8" fill="0 4"></dg-queue>
      <dg-box role="outflow" name="agents" label="Agents"></dg-box>
    </deck-diagram>`);
    const refused = drained.issues.find((i) => i.code === 'INT_ROLE_EXTRA');
    expect(refused).toMatchObject({ severity: 'error', items: ['agents'] });
    // The effect of a cause that is also the origin of a wave is drawn once, and said.
    const wave = draw(`<deck-diagram intent="propagate" also="cause">
      <dg-box role="cause" name="merge" label="Merge"></dg-box>
      <dg-box role="effect origin" name="config" label="Config"></dg-box>
      <dg-box role="reached" name="a" label="A"></dg-box>
      <dg-box role="reached" name="b" label="B"></dg-box>
      <dg-link from="config" to="a b"></dg-link>
    </deck-diagram>`);
    expect(wave.issues.find((i) => i.code === 'INT_ROLE_EXTRA')).toMatchObject({
      items: ['config'],
    });
    const drawnConfig = (nodes: DgNode[]): number =>
      nodes.reduce(
        (n, node) => n + (node.attrs.name === 'config' ? 1 : 0) + drawnConfig(node.children),
        0,
      );
    expect(drawnConfig(wave.parsed.children)).toBe(1);
    const driven = draw(
      INTENTS.threshold.compiled.skeleton
        .replace('intent="threshold"', 'intent="threshold" also="cause"')
        .replace(
          '</deck-diagram>',
          '<dg-box role="cause" name="batch" label="Nightly batch"></dg-box><dg-box role="effect" name="logs" label="Logs pile up"></dg-box></deck-diagram>',
        ),
    );
    expect(
      driven.issues.filter((i) => i.severity === 'error' || i.code.startsWith('INT_')),
    ).toEqual([]);
    // An effect larger than its bare cause (a note) still comes in after it.
    const noted = draw(
      INTENTS.threshold.compiled.skeleton
        .replace('intent="threshold"', 'intent="threshold" also="cause"')
        .replace(
          '</deck-diagram>',
          '<dg-box role="cause" name="batch" label="Batch"></dg-box><dg-box role="effect" name="logs" label="Logs pile up" note="a whole sentence of note"></dg-box></deck-diagram>',
        ),
    );
    expect(noted.issues.map((i) => i.code)).not.toContain('INT_CAUSE_EFFECT_FIRST');
  });
});

describe('what the compiler refuses', () => {
  it('an intent that does not exist', () => {
    expect(
      codes('<deck-diagram intent="whatever"><dg-box label="A"></dg-box></deck-diagram>'),
    ).toContain('INT_INTENT_UNKNOWN');
  });

  it('a secondary it does not compose with, and more than two', () => {
    const base = INTENTS.barrier.compiled!.skeleton;
    expect(codes(base.replace('intent="barrier"', 'intent="barrier" also="transform"'))).toContain(
      'INT_COMPOSE_INVALID',
    );
    // A whole-picture intent takes no secondary, and is never one.
    for (const name of [
      'scale',
      'contain',
      'parallel',
      'tradeoff',
      'drift',
      'compare',
      'partition',
    ] as const) {
      const skeleton = INTENTS[name].compiled.skeleton;
      expect(
        codes(skeleton.replace(`intent="${name}"`, `intent="${name}" also="cause"`)),
        name,
      ).toContain('INT_COMPOSE_INVALID');
    }
    expect(codes(base.replace('intent="barrier"', 'intent="barrier" also="merge"'))).toContain(
      'INT_COMPOSE_INVALID',
    );
    expect(
      codes(base.replace('intent="barrier"', 'intent="barrier" also="cause accumulate cause"')),
    ).toContain('INT_COMPOSE_MANY');
  });

  it('a role missing, too many marks in a role, a role of no intent here, a mark that cannot play it', () => {
    expect(
      intentCodes(
        '<deck-diagram intent="cause"><dg-box role="cause" label="A"></dg-box></deck-diagram>',
      ),
    ).toContain('INT_ROLE_MISSING');
    const four = '<dg-box role="cause" label="A"></dg-box>'.repeat(4);
    expect(
      intentCodes(
        `<deck-diagram intent="cause">${four}<dg-box role="effect" label="E"></dg-box></deck-diagram>`,
      ),
    ).toContain('INT_ROLE_EXTRA');
    expect(
      intentCodes(
        '<deck-diagram intent="cause"><dg-box role="neck" label="A"></dg-box></deck-diagram>',
      ),
    ).toContain('INT_ROLE_UNKNOWN');
    expect(
      intentCodes(
        '<deck-diagram intent="barrier"><dg-box role="flow" label="A"></dg-box></deck-diagram>',
      ),
    ).toContain('INT_ROLE_KIND');
    expect(
      intentCodes('<deck-diagram intent="cause"><dg-box label="A"></dg-box></deck-diagram>'),
    ).toContain('INT_ROLE_NONE');
  });

  it('a layout the intent owns, said and dropped', () => {
    const html = INTENTS.cause.compiled!.skeleton.replace(
      'intent="cause"',
      'intent="cause" layout="grid"',
    );
    const { parsed, issues } = draw(html);
    expect(issues.find((i) => i.code === 'INT_LAYOUT_FIXED')?.severity).toBe('warning');
    expect(parsed.attrs.layout).toBe('row');
  });

  it('a bottleneck without its rates', () => {
    expect(
      intentCodes(INTENTS.bottleneck.compiled!.skeleton.replace(' value="2 / h"', '')),
    ).toContain('INT_VALUE_MISSING');
  });

  it('a queue that never fills, and a sink narrower than the neck', () => {
    const skeleton = INTENTS.bottleneck.compiled!.skeleton;
    expect(
      intentCodes(skeleton.replace('label="waiting"', 'label="waiting" fill="3 3"')),
    ).toContain('INT_BOTTLENECK_NO_QUEUE');
    expect(
      intentCodes(skeleton.replace('label="Shipped"', 'label="Shipped" value="1 / h"')),
    ).toContain('INT_BOTTLENECK_NOT_NARROWEST');
  });

  it('a stock that never moves, and a transform where nothing changes', () => {
    expect(
      intentCodes(
        '<deck-diagram intent="accumulate"><dg-meter role="stock" name="m" label="M" value="40 40"></dg-meter></deck-diagram>',
      ),
    ).toContain('INT_ACCUMULATE_NOT_MONOTONE');
    const same = '<dg-box name="a" label="A"></dg-box>';
    expect(
      intentCodes(
        `<deck-diagram intent="transform"><dg-state role="before">${same}</dg-state><dg-state role="after">${same}</dg-state></deck-diagram>`,
      ),
    ).toContain('INT_TRANSFORM_NO_CHANGE');
  });

  it('an emphasis off the part the intent argues for', () => {
    const html = INTENTS.bottleneck.compiled!.skeleton.replace(
      'label="Arrivals"',
      'label="Arrivals" emphasis',
    );
    expect(intentCodes(html)).toContain('INT_FOCAL_OFF_ROLE');
  });
});

describe('from a sentence to an intent', () => {
  it('finds the intent a sentence points at, the same answer every time', () => {
    expect(closestIntents('La revue est notre goulot : les PR attendent')[0]!.name).toBe(
      'bottleneck',
    );
    expect(closestIntents('Un seul interrupteur coupe tous les appels')[0]!.name).toBe('barrier');
    expect(closestIntents('Les tickets s’accumulent et la dette déborde')[0]!.name).toBe(
      'accumulate',
    );
    expect(closestIntents('Avant, quatre champs ; après, un seul')[0]!.name).toBe('transform');
    expect(closestIntents('Le cache vidé provoque une panne')[0]!.name).toBe('cause');
    expect(closestIntents('Ça se répand en cascade')[0]!.name).toBe('propagate');
    expect(closestIntents('Bonjour à tous')).toEqual([]);
  });

  it('finds a cue at the start of a word, never inside one', () => {
    expect(closestIntents('un restockage')).toEqual([]);
    expect(closestIntents('le stock monte')[0]!.cues).toEqual(['stock']);
  });
});
