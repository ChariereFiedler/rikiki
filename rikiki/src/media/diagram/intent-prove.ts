// ════════════════════════════════════════════════════════════════
// RIKIKI · diagram, proving an intent
//
// Once the layout has placed everything, the drawing is read back and checked
// against what it claims (`INT_*`): a gate across every lane, a neck narrower than
// what feeds it, a loop that comes back, a gap that widens, parts that add up to
// the whole, a wave that never jumps a rank. Read on the layout and the timeline,
// not on the pixels; a defect of meaning is an error whatever the picture's score.
// They prove the drawing says what the author declared, not that the declaration
// is true of the world.
//
// Pure: a layout in, findings out.
// ════════════════════════════════════════════════════════════════

import { cueIds } from './choreography.js';
import type { IntentPlan } from './intent.js';
import { INTENTS, type IntentName } from './intent-specs.js';
import type {
  DiagramLayout,
  LBar,
  LBox,
  LFrame,
  LGate,
  LItem,
  LLane,
  LMeter,
  LQueue,
  LSpan,
} from './layout.js';
import { atClick } from './layout.js';
import { type DgIssue, readNumber, words } from './model.js';
import type { Timing } from './motion.js';

/** One click's drawing, and when its parts came in · what the proof reads. */
export interface ProofFrame {
  drawn: DiagramLayout;
  stage: number;
  /** The click each item, link and note appears on, by cue id. */
  appears?: Map<string, number>;
  timing?: Map<string, Timing>;
}

type Prover = (plan: IntentPlan, frames: ProofFrame[]) => DgIssue[];

/** A crowd under this many times its unit is not an order of magnitude. */
export const MIN_SCALE_RATIO = 10;
/** A drift ends at least this many times wider than it starts, or it is not seen. */
export const MIN_DRIFT_GROWTH = 2;
/** A bar drawn this many times longer or shorter than its value says lies. */
export const MAX_LIE_FACTOR = 1.1;
/** Parts that miss their whole by more than this share of it do not add up. */
const SUM_TOLERANCE = 0.005;
/** Two entrances closer than this, in seconds, come in together. */
const TOGETHER_SECONDS = 0.05;
/** Two edges closer than this, in drawing units, touch. */
const TOUCH = 1;
/** Tones a mark stands in before anything has reached it. */
const UNTOUCHED: ReadonlySet<string> = new Set(['normal', 'muted']);

const named = (frame: ProofFrame, name: string): LItem | undefined =>
  frame.drawn.items.find((item) => item.node.attrs.name === name && item.kind !== 'frame') ??
  frame.drawn.items.find((item) => item.node.attrs.name === name);

const frameNamed = (frame: ProofFrame, name: string): LFrame | undefined =>
  frame.drawn.items.find((item): item is LFrame => item.kind === 'frame' && item.key === name);

/** When a named mark comes in · its click, then its start in that click. */
function entranceOf(frame: ProofFrame, name: string): { click: number; start: number } | null {
  const index = frame.drawn.items.findIndex((item) => item.node.attrs.name === name);
  if (index < 0) return null;
  const id = cueIds.item(index);
  return {
    click: frame.appears?.get(id) ?? 0,
    start: frame.timing?.get(id)?.start ?? 0,
  };
}

const sooner = (a: { click: number; start: number }, b: { click: number; start: number }) =>
  a.click < b.click || (a.click === b.click && a.start < b.start - TOGETHER_SECONDS);

/** Where the arrows of a drawing lead · plain arrows only, a dashed line is not one. */
function arrowsOf(frame: ProofFrame): Map<string, string[]> {
  const next = new Map<string, string[]>();
  for (const link of frame.drawn.links.filter((l) => l.head && !l.dashed))
    next.set(link.from, [...(next.get(link.from) ?? []), link.to]);
  return next;
}

/** Whether a chain of arrows leads from one mark to another. */
function reaches(next: Map<string, string[]>, from: string, to: string): boolean {
  const seen = new Set<string>([from]);
  const queue = [from];
  while (queue.length) {
    const here = queue.shift()!;
    if (here === to) return true;
    for (const n of next.get(here) ?? []) {
      if (seen.has(n)) continue;
      seen.add(n);
      queue.push(n);
    }
  }
  return false;
}

const arrowsDrawn = (frame: ProofFrame) =>
  frame.drawn.links.filter((l) => l.head).map((l) => `${l.from} → ${l.to}`);

/** The first click a box stands in a tone that says something reached it. */
function turnsOn(item: LItem | undefined): number {
  if (item?.kind !== 'box') return Number.POSITIVE_INFINITY;
  const index = (item as LBox).tones.findIndex((tone) => !UNTOUCHED.has(tone));
  return index < 0 ? Number.POSITIVE_INFINITY : index;
}

/** Every pair of a role's marks with no chain of arrows between them. */
const unreached = (next: Map<string, string[]>, froms: string[], tos: string[]) =>
  froms.flatMap((from) =>
    tos.filter((to) => !reaches(next, from, to)).map((to) => `${from} → ${to}`),
  );

/** From every cause, a chain of arrows reaches every effect · and no effect comes
 *  in before the cause it follows. */
const proveCause: Prover = (plan, frames) => {
  const frame = frames.at(-1)!;
  const issues: DgIssue[] = [];
  const causes = plan.roles.cause ?? [];
  const effects = plan.roles.effect ?? [];
  const broken = unreached(arrowsOf(frame), causes, effects);
  if (broken.length)
    issues.push({
      code: 'INT_CAUSE_NO_ARROW',
      severity: 'error',
      items: broken,
      message: `no chain of arrows leads ${broken.join(', ')} · the picture shows things side by side, not one bringing about the other`,
      measurement: { arrows: arrowsDrawn(frame) },
      expected: 'a path of arrows from every cause to every effect, in that direction',
      fix: {
        action: 'link',
        pairs: broken,
        or: 'remove your dg-link and let the intent chain them',
      },
    });
  const early = effects.flatMap((effect) =>
    causes.flatMap((cause) => {
      const a = entranceOf(frame, cause);
      const b = entranceOf(frame, effect);
      const before = a && b && (b.click < a.click || (b.click === a.click && b.start < a.start));
      return before ? [{ cause, effect, a: a!, b: b! }] : [];
    }),
  );
  if (early.length)
    issues.push({
      code: 'INT_CAUSE_EFFECT_FIRST',
      severity: 'error',
      items: early.map((e) => `${e.effect} before ${e.cause}`),
      message: `the effect comes in before its cause · ${early.map((e) => `${e.effect} on click ${e.b.click}, ${e.cause} on click ${e.a.click}`).join('; ')}`,
      measurement: Object.fromEntries(early.map((e) => [e.effect, e.b])),
      expected: 'every effect comes in with or after its cause',
      fix: {
        action: 'remove-attribute',
        attributes: ['step', 'after'],
        on: early.map((e) => e.cause),
      },
    });
  return issues;
};

/** The gate stands across every lane that flows, and closes on some click. */
const proveBarrier: Prover = (plan, frames) => {
  const frame = frames.at(-1)!;
  const issues: DgIssue[] = [];
  const [gateName] = plan.roles.barrier ?? [];
  const gate = gateName ? (named(frame, gateName) as LGate | undefined) : undefined;
  if (gate?.kind !== 'gate') return issues;
  const lanes = (plan.roles.flow ?? [])
    .map((name) => named(frame, name))
    .filter((item): item is LLane => item?.kind === 'lane');
  const centre = gate.x + gate.w / 2;
  const missed = lanes.filter(
    (lane) =>
      !gate.lanes.includes(lane.key) ||
      lane.cy < gate.y ||
      lane.cy > gate.y + gate.h ||
      centre < lane.track.x0 ||
      centre > lane.track.x1,
  );
  if (missed.length)
    issues.push({
      code: 'INT_BARRIER_NOT_ACROSS',
      severity: 'error',
      items: missed.map((lane) => lane.key),
      message: `the gate does not stand across ${missed.map((l) => l.key).join(', ')} · that flow passes it, so the barrier does not stop what the title says`,
      measurement: { crosses: gate.lanes, lanes: lanes.map((lane) => lane.key) },
      expected: { crosses: lanes.map((lane) => lane.key) },
      fix: { action: 'remove-attribute', attribute: 'over', or: 'name every flow lane in `over`' },
    });
  if (!gate.states.some((state) => state === 'closed' || state === 'shed'))
    issues.push({
      code: 'INT_BARRIER_NEVER_CLOSES',
      severity: 'error',
      items: [gate.key],
      message: `the gate stays ${gate.states.join(', then ')} · it never stops anything`,
      measurement: { states: gate.states },
      expected: 'closed or shed on some click',
      fix: { action: 'set-attribute', attribute: 'state', value: 'open closed' },
    });
  return issues;
};

/** The neck takes less than arrives and no more than what follows takes · and the
 *  drawing shows it: fewer tokens leave it than reach it, the queue fills. */
const proveBottleneck: Prover = (plan, frames) => {
  const frame = frames.at(-1)!;
  const issues: DgIssue[] = [];
  const sources = plan.roles.source ?? [];
  const [neck] = plan.roles.neck ?? [];
  const [queueName] = plan.roles.queue ?? [];
  if (!neck) return issues;
  const rate = (name: string) => plan.rates[name];
  const arriving = sources.reduce((sum, name) => sum + (rate(name) ?? 0), 0);
  const through = rate(neck);
  const slowerSinks = (plan.roles.sink ?? []).filter(
    (name) => rate(name) !== undefined && through !== undefined && rate(name)! < through,
  );
  const tokens = (from: (n: string) => boolean) =>
    frame.drawn.links.filter((l) => from(l.from)).reduce((sum, l) => sum + l.flow, 0);
  const tokensIn = tokens((n) => sources.includes(n));
  const tokensOut = tokens((n) => n === neck);
  const rateWide = through !== undefined && arriving > 0 && through >= arriving;
  const drawnWide = tokensIn > 0 && tokensOut >= tokensIn;
  if (rateWide || drawnWide || slowerSinks.length)
    issues.push({
      code: 'INT_BOTTLENECK_NOT_NARROWEST',
      severity: 'error',
      items: [neck, ...slowerSinks],
      message: slowerSinks.length
        ? `${slowerSinks.join(', ')} takes less than ${neck} · the narrow point is downstream, not where the picture says`
        : `${neck} is not narrower than what arrives · ${through ?? '?'} through it for ${arriving} arriving, ${tokensOut} tokens out for ${tokensIn} in`,
      measurement: {
        rates: {
          arriving,
          neck: through,
          sinks: Object.fromEntries((plan.roles.sink ?? []).map((n) => [n, rate(n)])),
        },
        tokens: { in: tokensIn, out: tokensOut },
      },
      expected: 'the neck takes less than arrives, and no sink takes less than the neck',
      fix: { action: 'set-attribute', attribute: 'value', on: neck, below: arriving },
    });
  const queue = queueName ? named(frame, queueName) : undefined;
  if (queue?.kind === 'queue') {
    const first = queue.fills[0] ?? 0;
    const last = queue.fills.at(-1) ?? 0;
    if (last <= first)
      issues.push({
        code: 'INT_BOTTLENECK_NO_QUEUE',
        severity: 'error',
        items: [queue.key],
        message: `the queue in front of ${neck} goes from ${first} to ${last} · nothing waits, so nothing shows the neck holds things back`,
        measurement: { fills: queue.fills },
        expected: 'the last fill above the first',
        fix: { action: 'set-attribute', attribute: 'fill', example: `0 ${Math.max(1, last)}` },
      });
  }
  return issues;
};

/** The stock moves one way, click after click, and moves at least once. */
const proveAccumulate: Prover = (plan, frames) => {
  const frame = frames.at(-1)!;
  const [stockName] = plan.roles.stock ?? [];
  const stock = stockName ? named(frame, stockName) : undefined;
  if (!stock || (stock.kind !== 'queue' && stock.kind !== 'meter')) return [];
  const fills = (stock as LQueue | LMeter).fills;
  const steps = fills.slice(1).map((value, k) => value - fills[k]!);
  const rises = steps.some((d) => d > 0);
  const falls = steps.some((d) => d < 0);
  if (rises !== falls) return [];
  return [
    {
      code: 'INT_ACCUMULATE_NOT_MONOTONE',
      severity: 'error',
      items: [stock.key],
      message: rises
        ? `${stock.key} rises and falls (${words(stock.node.attrs.fill ?? stock.node.attrs.value).join(' → ')}) · a stock that accumulates goes one way · show the drain as a picture of its own`
        : `${stock.key} never changes · nothing accumulates`,
      measurement: { values: words(stock.node.attrs.fill ?? stock.node.attrs.value), drawn: fills },
      expected: 'each click at or above the one before (or at or below), and at least one change',
      fix: {
        action: 'set-attribute',
        attribute: stock.kind === 'queue' ? 'fill' : 'value',
        example: '0 4 8',
      },
    },
  ];
};

/** What a part of a picture looks like · where it is, its size, its words, its fill. */
const looks = (item: LItem): string =>
  JSON.stringify([
    item.kind,
    ...('w' in item ? [item.x, item.y, item.w, item.h].map(Math.round) : [item.x, item.y]),
    'texts' in item ? item.texts.map((t) => t.lines.join(' ')) : [],
    'fills' in item ? item.fills : [],
  ]);

/** Some part persists from before to after, and something changes. */
const proveTransform: Prover = (_plan, frames) => {
  if (frames.length < 2) return [];
  const before = frames[0]!.drawn.items;
  const after = frames.at(-1)!.drawn.items;
  const namesOf = (items: LItem[]) => new Set(items.map((i) => i.node.attrs.name).filter(Boolean));
  const was = namesOf(before);
  const is = namesOf(after);
  const shared = [...is].filter((name) => was.has(name!)) as string[];
  if (!shared.length)
    return [
      {
        code: 'INT_TRANSFORM_NO_PAIR',
        severity: 'error',
        items: [...is].filter(Boolean) as string[],
        message:
          'no part is named alike before and after · the room sees two drawings, not one that changes',
        measurement: { before: [...was], after: [...is] },
        expected: 'at least one name in both pictures',
        fix: { action: 'name-alike', before: [...was], after: [...is] },
      },
    ];
  const signature = (items: LItem[]) => items.map(looks).sort().join('|');
  if (signature(before) === signature(after))
    return [
      {
        code: 'INT_TRANSFORM_NO_CHANGE',
        severity: 'error',
        items: shared,
        message: 'before and after are the same picture · nothing moves, nothing comes or goes',
        measurement: { shared },
        expected: 'a part that moves, resizes, changes its words, or comes or goes',
        fix: { action: 'change-after' },
      },
    ];
  return [];
};

/** The output comes back to the first stage · a chain of arrows runs all the way
 *  round, out and back. */
const proveFeedback: Prover = (plan, frames) => {
  const frame = frames.at(-1)!;
  const [first] = plan.roles.stage ?? [];
  const [output] = plan.roles.output ?? [];
  if (!first || !output) return [];
  const next = arrowsOf(frame);
  const open = unreached(next, [output, first], [first, output]).filter(
    (pair) => pair !== `${output} → ${output}` && pair !== `${first} → ${first}`,
  );
  if (!open.length) return [];
  return [
    {
      code: 'INT_FEEDBACK_OPEN',
      severity: 'error',
      items: open,
      message: `no chain of arrows leads ${open.join(', ')} · the picture is a chain that ends, not a loop that comes back`,
      measurement: { arrows: arrowsDrawn(frame) },
      expected: `arrows from ${first} round to ${output}, and from ${output} back to ${first}`,
      fix: {
        action: 'link',
        from: output,
        to: first,
        or: 'remove your dg-link and let the intent close the loop',
      },
    },
  ];
};

/** The crowd is an order of magnitude more than the unit, counted on the cells. */
const proveScale: Prover = (plan, frames) => {
  const frame = frames.at(-1)!;
  const cells = (role: string) =>
    frame.drawn.items.filter((i) => i.kind === 'dot' && (plan.roles[role] ?? []).includes(i.key))
      .length;
  const unit = cells('unit');
  const crowd = cells('crowd');
  if (!unit || !crowd || crowd / unit >= MIN_SCALE_RATIO) return [];
  return [
    {
      code: 'INT_SCALE_TOO_CLOSE',
      severity: 'error',
      items: [...(plan.roles.unit ?? []), ...(plan.roles.crowd ?? [])],
      message: `${crowd} cells for ${unit} · ${Math.round((crowd / unit) * 10) / 10} times, under the ${MIN_SCALE_RATIO} that make an order of magnitude · the eye compares them, it does not feel the crowd`,
      measurement: { unit, crowd, ratio: crowd / unit },
      expected: { ratio: MIN_SCALE_RATIO },
      fix: {
        action: 'change-intent',
        to: 'compare',
        or: `count="${unit * MIN_SCALE_RATIO}" or more`,
      },
    },
  ];
};

/** Each layer is drawn with an edge, and holds the next one whole. */
const proveContain: Prover = (plan, frames) => {
  const frame = frames.at(-1)!;
  const layers = plan.roles.layer ?? [];
  const loose = layers.slice(0, -1).filter((name, k) => {
    const outer = frameNamed(frame, name);
    const inner = frameNamed(frame, layers[k + 1]!) ?? named(frame, layers[k + 1]!);
    if (!outer || outer.paint === 'none' || !inner || !('w' in inner)) return true;
    return !(
      outer.x <= inner.x + TOUCH &&
      outer.y <= inner.y + TOUCH &&
      outer.x + outer.w >= inner.x + inner.w - TOUCH &&
      outer.y + outer.h >= inner.y + inner.h - TOUCH
    );
  });
  if (!loose.length) return [];
  return [
    {
      code: 'INT_CONTAIN_NOT_NESTED',
      severity: 'error',
      items: loose,
      message: `${loose.join(', ')} draws no edge round what it holds · the inside reads as beside it, not in it`,
      measurement: {
        layers: layers.map((name) => ({ name, paint: frameNamed(frame, name)?.paint ?? 'mark' })),
      },
      expected: 'every layer but the innermost drawn as a surface that holds the next',
      fix: { action: 'remove-attribute', attribute: 'paint', on: loose },
    },
  ];
};

/** Every branch starts on the same click at the same moment · and the join comes
 *  once every branch has ended. */
const proveParallel: Prover = (plan, frames) => {
  const frame = frames.at(-1)!;
  const issues: DgIssue[] = [];
  const branches = (plan.roles.branch ?? []).map((name) => ({
    name,
    steps: plan.inside[name] ?? [],
  }));
  const starts = branches
    .map((b) => ({ name: b.name, at: b.steps[0] ? entranceOf(frame, b.steps[0]) : null }))
    .filter((s): s is { name: string; at: { click: number; start: number } } => !!s.at);
  const first = starts.reduce<(typeof starts)[number] | null>(
    (best, s) => (!best || sooner(s.at, best.at) ? s : best),
    null,
  );
  const late = first ? starts.filter((s) => sooner(first.at, s.at)) : [];
  if (late.length)
    issues.push({
      code: 'INT_PARALLEL_NOT_TOGETHER',
      severity: 'error',
      items: late.map((s) => s.name),
      message: `${late.map((s) => `${s.name} starts on click ${s.at.click} at ${s.at.start.toFixed(2)} s`).join(', ')}, after ${first!.name} (click ${first!.at.click}, ${first!.at.start.toFixed(2)} s) · one after the other, not at once`,
      measurement: Object.fromEntries(starts.map((s) => [s.name, s.at])),
      expected: 'every branch starts on the same click, at the same moment',
      fix: {
        action: 'remove-attribute',
        attributes: ['step', 'after'],
        on: late.map((s) => s.name),
      },
    });
  const [join] = plan.roles.join ?? [];
  const joined = join ? entranceOf(frame, join) : null;
  const ends = branches
    .map((b) => ({ name: b.name, at: b.steps.at(-1) ? entranceOf(frame, b.steps.at(-1)!) : null }))
    .filter((e): e is { name: string; at: { click: number; start: number } } => !!e.at);
  const unfinished = joined ? ends.filter((e) => sooner(joined, e.at)) : [];
  if (unfinished.length)
    issues.push({
      code: 'INT_PARALLEL_JOIN_EARLY',
      severity: 'error',
      items: [join!, ...unfinished.map((e) => e.name)],
      message: `${join} comes in before ${unfinished.map((e) => e.name).join(', ')} has finished · the branches do not meet, the join waits for nothing`,
      measurement: { join: joined, branches: Object.fromEntries(ends.map((e) => [e.name, e.at])) },
      expected: 'the join after the last step of every branch',
      fix: { action: 'remove-attribute', attributes: ['step', 'after'], on: join },
    });
  return issues;
};

/** Every mark is reached by arrows from the origin, and turns only after a mark
 *  that reaches it has turned · the change never jumps a rank. */
const provePropagate: Prover = (plan, frames) => {
  const frame = frames.at(-1)!;
  const issues: DgIssue[] = [];
  const [origin] = plan.roles.origin ?? [];
  if (!origin) return issues;
  const reached = plan.roles.reached ?? [];
  const next = arrowsOf(frame);
  const turns = (name: string) => (name === origin ? 0 : turnsOn(named(frame, name)));
  const cut = reached.filter(
    (name) => !reaches(next, origin, name) || !Number.isFinite(turns(name)),
  );
  if (cut.length)
    issues.push({
      code: 'INT_PROPAGATE_NOT_REACHED',
      severity: 'error',
      items: cut,
      message: `the change never reaches ${cut.join(', ')} · no chain of arrows from ${origin}, or it never turns`,
      measurement: {
        arrows: arrowsDrawn(frame),
        turns: Object.fromEntries(cut.map((n) => [n, turns(n)])),
      },
      expected: `a path of arrows from ${origin} to every mark it reaches`,
      fix: {
        action: 'link',
        to: cut,
        or: 'remove your dg-link and let the intent spread from the origin',
      },
    });
  const before = (name: string) =>
    [...next].filter(([, tos]) => tos.includes(name)).map(([from]) => from);
  const skipping = reached.filter((name) => {
    const own = turns(name);
    const from = before(name).map(turns);
    return Number.isFinite(own) && from.length > 0 && own <= Math.min(...from);
  });
  if (skipping.length)
    issues.push({
      code: 'INT_PROPAGATE_SKIPS',
      severity: 'error',
      items: skipping,
      message: `${skipping.map((n) => `${n} turns on click ${turns(n)}`).join(', ')}, no later than what reaches it · the change jumps ahead of itself`,
      measurement: Object.fromEntries(
        skipping.map((n) => [n, { turns: turns(n), after: before(n).map((f) => [f, turns(f)]) }]),
      ),
      expected: 'each mark turns on a later click than a mark with an arrow into it',
      fix: { action: 'remove-attribute', attributes: ['tone', 'step'], on: skipping },
    });
  return issues;
};

/** The click a meter first stands on the other side of its line, -1 when never. */
export function crossingOf(meter: LMeter): number {
  if (meter.threshold === undefined) return -1;
  const line = meter.threshold;
  const side = (fill: number) => meter.track.x + fill >= line;
  const start = side(meter.fills[0] ?? 0);
  return meter.fills.findIndex((fill) => side(fill) !== start);
}

/** The measure crosses its line on some click, and what tips does not tip before. */
const proveThreshold: Prover = (plan, frames) => {
  const frame = frames.at(-1)!;
  const issues: DgIssue[] = [];
  const [measureName] = plan.roles.measure ?? [];
  const measure = measureName ? named(frame, measureName) : undefined;
  if (measure?.kind !== 'meter' || measure.threshold === undefined) return issues;
  const crossing = crossingOf(measure);
  if (crossing < 0)
    issues.push({
      code: 'INT_THRESHOLD_NEVER_CROSSED',
      severity: 'error',
      items: [measure.key],
      message: `${measure.key} stays on one side of its line (${words(measure.node.attrs.value).join(' → ')} against ${measure.node.attrs.threshold}) · nothing tips`,
      measurement: {
        values: words(measure.node.attrs.value),
        threshold: measure.node.attrs.threshold,
      },
      expected: 'a value on the other side of the threshold on some click',
      fix: {
        action: 'set-attribute',
        attribute: 'value',
        on: measure.key,
        crossing: measure.node.attrs.threshold,
      },
    });
  const [consequence] = plan.roles.consequence ?? [];
  const tips = consequence ? turnsOn(named(frame, consequence)) : Number.POSITIVE_INFINITY;
  const appears = consequence ? (entranceOf(frame, consequence)?.click ?? 0) : 0;
  const early =
    consequence && crossing >= 0 && (tips < crossing || (appears > 0 && appears < crossing));
  if (early)
    issues.push({
      code: 'INT_THRESHOLD_EARLY',
      severity: 'error',
      items: [consequence!],
      message: `${consequence} tips on click ${Number.isFinite(tips) ? tips : appears}, before the line is crossed on click ${crossing} · the consequence comes before its cause`,
      measurement: { tips, appears, crossing },
      expected: `${consequence} turns on click ${crossing}`,
      fix: { action: 'remove-attribute', attributes: ['tone', 'step'], on: consequence },
    });
  return issues;
};

/** On every click one gauge moves, the gain rises and the cost falls together. */
const proveTradeoff: Prover = (plan, frames) => {
  const frame = frames.at(-1)!;
  const [gainName] = plan.roles.gain ?? [];
  const [costName] = plan.roles.cost ?? [];
  const gain = gainName ? named(frame, gainName) : undefined;
  const cost = costName ? named(frame, costName) : undefined;
  if (gain?.kind !== 'meter' || cost?.kind !== 'meter') return [];
  const clicks = Math.max(gain.fills.length, cost.fills.length);
  const moves = Array.from({ length: Math.max(0, clicks - 1) }, (_, k) => ({
    click: k + 1,
    gain: (atClick(gain.fills, k + 1) ?? 0) - (atClick(gain.fills, k) ?? 0),
    cost: (atClick(cost.fills, k + 1) ?? 0) - (atClick(cost.fills, k) ?? 0),
  })).filter((m) => m.gain !== 0 || m.cost !== 0);
  const wrong = moves.filter((m) => !(m.gain > 0 && m.cost < 0));
  if (moves.length && !wrong.length) return [];
  return [
    {
      code: 'INT_TRADEOFF_ONE_SIDED',
      severity: 'error',
      items: [gain.key, cost.key],
      message: moves.length
        ? `on click ${wrong.map((m) => m.click).join(', ')} ${gain.key} and ${cost.key} do not move apart · a trade-off wins one and pays with the other, together`
        : `${gain.key} and ${cost.key} never move · nothing is traded`,
      measurement: {
        gain: words(gain.node.attrs.value),
        cost: words(cost.node.attrs.value),
        moves,
      },
      expected: 'on each click that moves them, the gain rises and the cost falls',
      fix: { action: 'set-attribute', attribute: 'value', gain: '40 85', cost: '90 35' },
    },
  ];
};

/** The gap to the reference grows period after period, and ends at least twice
 *  as wide as it starts. */
const proveDrift: Prover = (plan, frames) => {
  const frame = frames.at(-1)!;
  const gaps = (plan.roles.measure ?? [])
    .map((name) => named(frame, name))
    .filter((item): item is LSpan => item?.kind === 'span')
    .map((span) => ({ name: span.key, gap: span.shape === 'stretch' ? span.w : 0 }));
  if (gaps.length < 2) return [];
  const shrinks = gaps.slice(1).filter((g, k) => g.gap < gaps[k]!.gap - TOUCH);
  const first = gaps[0]!.gap;
  const last = gaps.at(-1)!.gap;
  if (!shrinks.length && last >= MIN_DRIFT_GROWTH * first) return [];
  return [
    {
      code: 'INT_DRIFT_NOT_WIDENING',
      severity: 'error',
      items: shrinks.length ? shrinks.map((g) => g.name) : [gaps.at(-1)!.name],
      message: shrinks.length
        ? `the gap narrows at ${shrinks.map((g) => g.name).join(', ')} · a drift widens with time, it does not come back`
        : `the gap ends ${Math.round((last / Math.max(first, 1)) * 10) / 10} times as wide as it starts, under ${MIN_DRIFT_GROWTH} · the drift does not show`,
      measurement: { gaps: gaps.map((g) => [g.name, Math.round(g.gap)]) },
      expected: { growing: true, lastOverFirst: MIN_DRIFT_GROWTH },
      fix: { action: 'set-attribute', attribute: 'value', or: 'compare the periods instead' },
    },
  ];
};

/** Each bar is as long, against the longest, as its value against the largest ·
 *  a scale that cannot show a value draws it larger than it is. */
const proveCompare: Prover = (plan, frames) => {
  const frame = frames.at(-1)!;
  const bars = [...(plan.roles.subject ?? []), ...(plan.roles.other ?? [])]
    .map((name) => named(frame, name))
    .filter((item): item is LBar => item?.kind === 'bar')
    .map((bar) => ({ name: bar.key, w: bar.w, value: readNumber(bar.node.attrs.value ?? '') }))
    .filter((bar) => Number.isFinite(bar.value) && bar.value >= 0);
  const longest = Math.max(0, ...bars.map((b) => b.w));
  const largest = Math.max(0, ...bars.map((b) => b.value));
  if (!longest || !largest) return [];
  const lying = bars
    .filter((b) => b.value > 0)
    .map((b) => ({ ...b, factor: b.w / longest / (b.value / largest) }))
    .filter((b) => b.factor > MAX_LIE_FACTOR || b.factor < 1 / MAX_LIE_FACTOR);
  if (!lying.length) return [];
  return [
    {
      code: 'INT_COMPARE_LIE',
      severity: 'error',
      items: lying.map((b) => b.name),
      message: `${lying.map((b) => `${b.name} is drawn ${Math.round(b.factor * 10) / 10} times its value`).join(', ')} · on one scale the values are too far apart to be drawn true`,
      measurement: Object.fromEntries(
        lying.map((b) => [b.name, { value: b.value, factor: b.factor }]),
      ),
      expected: { factor: [1 / MAX_LIE_FACTOR, MAX_LIE_FACTOR] },
      fix: { action: 'change-intent', to: 'scale', or: 'leave out the bar too small to draw' },
    },
  ];
};

/** The parts add up to the whole, and lie end to end on one band. */
const provePartition: Prover = (plan, frames) => {
  const frame = frames.at(-1)!;
  const parts = [...(plan.roles.share ?? []), ...(plan.roles.part ?? [])]
    .map((name) => named(frame, name))
    .filter((item): item is LSpan => item?.kind === 'span')
    .sort((a, b) => a.x - b.x);
  const values = parts.map((p) => readNumber(p.node.attrs.value ?? ''));
  const sum = values.reduce((total, v) => total + (Number.isFinite(v) ? v : 0), 0);
  const [wholeName] = plan.roles.whole ?? [];
  const whole = wholeName ? plan.rates[wholeName] : undefined;
  const short = whole !== undefined && Math.abs(sum - whole) > SUM_TOLERANCE * Math.abs(whole);
  const apart = parts
    .slice(1)
    .filter((p, k) => Math.abs(p.x - (parts[k]!.x + parts[k]!.w)) > TOUCH || p.y !== parts[k]!.y);
  if (!short && !apart.length) return [];
  return [
    {
      code: 'INT_PARTITION_NOT_WHOLE',
      severity: 'error',
      items: short ? [wholeName!, ...parts.map((p) => p.key)] : apart.map((p) => p.key),
      message: short
        ? `the parts add up to ${sum}, the whole says ${whole} · a share is missing or counted twice`
        : `${apart.map((p) => p.key).join(', ')} does not follow the part before it on the band · the parts do not tile the whole`,
      measurement: { sum, whole: whole ?? null, parts: parts.map((p, k) => [p.key, values[k]]) },
      expected: whole !== undefined ? { sum: whole } : 'the parts end to end on one band',
      fix: {
        action: 'set-attribute',
        attribute: 'value',
        on: short ? wholeName : apart.map((p) => p.key),
      },
    },
  ];
};

/** Every source has arrows into where they meet, and, when they say amounts, what
 *  they meet in is their sum. */
const proveMerge: Prover = (plan, frames) => {
  const frame = frames.at(-1)!;
  const issues: DgIssue[] = [];
  const sources = plan.roles.source ?? [];
  const [into] = plan.roles.into ?? [];
  if (!into) return issues;
  const apart = sources.filter((source) => !reaches(arrowsOf(frame), source, into));
  if (apart.length)
    issues.push({
      code: 'INT_MERGE_APART',
      severity: 'error',
      items: apart,
      message: `no chain of arrows leads from ${apart.join(', ')} to ${into} · that source never meets the others`,
      measurement: { arrows: arrowsDrawn(frame) },
      expected: `an arrow from every source to ${into}`,
      fix: {
        action: 'link',
        from: apart,
        to: into,
        or: 'remove your dg-link and let the intent converge them',
      },
    });
  const amounts = sources.map((name) => plan.rates[name]);
  const total = plan.rates[into];
  if (total !== undefined && amounts.every((a) => a !== undefined)) {
    const sum = amounts.reduce((s, a) => s + a!, 0);
    if (Math.abs(sum - total) > SUM_TOLERANCE * Math.abs(total))
      issues.push({
        code: 'INT_MERGE_NOT_SUM',
        severity: 'error',
        items: [into, ...sources],
        message: `the sources add up to ${sum}, ${into} says ${total} · something leaks on the way, or comes from nowhere`,
        measurement: {
          sum,
          into: total,
          sources: Object.fromEntries(sources.map((s, k) => [s, amounts[k]])),
        },
        expected: { into: sum },
        fix: { action: 'set-attribute', attribute: 'value', on: into, value: sum },
      });
  }
  return issues;
};

const PROVERS: Readonly<Record<IntentName, Prover>> = Object.freeze({
  cause: proveCause,
  barrier: proveBarrier,
  bottleneck: proveBottleneck,
  accumulate: proveAccumulate,
  transform: proveTransform,
  feedback: proveFeedback,
  scale: proveScale,
  contain: proveContain,
  parallel: proveParallel,
  propagate: provePropagate,
  threshold: proveThreshold,
  tradeoff: proveTradeoff,
  drift: proveDrift,
  compare: proveCompare,
  partition: provePartition,
  merge: proveMerge,
});

/** The names of the marks that play a part of an intent. */
const castOf = (plan: IntentPlan, intent: IntentName): Set<string> =>
  new Set(INTENTS[intent].compiled.roles.flatMap((spec) => plan.roles[spec.role] ?? []));

/** Each secondary is joined to the main intent · an arrow between a mark of each, or
 *  the line from a mark of the secondary down to the main intent's gate. A secondary
 *  that shares every mark with the main one is drawn as one with it. */
const proveJoined: Prover = (plan, frames) => {
  const frame = frames.at(-1)!;
  const main = castOf(plan, plan.main);
  return plan.also.flatMap((secondary): DgIssue[] => {
    const own = new Set([...castOf(plan, secondary)].filter((name) => !main.has(name)));
    if (!own.size) return [];
    const across = (a: string, b: string) =>
      (own.has(a) && main.has(b)) || (main.has(a) && own.has(b));
    const linked = frame.drawn.links.some((link) => link.head && across(link.from, link.to));
    const fed = frame.drawn.items.some(
      (item) => item.kind === 'gate' && !!item.feed && across(item.node.attrs.by ?? '', item.key),
    );
    if (linked || fed) return [];
    return [
      {
        code: 'INT_COMPOSE_APART',
        severity: 'error',
        items: [...own],
        message: `${secondary} stands apart from ${plan.main} · no arrow joins ${[...own].join(', ')} to the main picture, so the room reads two pictures side by side`,
        measurement: { arrows: arrowsDrawn(frame) },
        expected: `an arrow between a mark of ${secondary} and a mark of ${plan.main}`,
        fix: {
          action: 'remove-links',
          or: 'remove your dg-link between the two parts and let the intent join them',
        },
      },
    ];
  });
};

/** Read the drawing back and say where it does not demonstrate its intent · the
 *  main one, each secondary, and how they are joined. */
export function proveIntent(plan: IntentPlan, frames: ProofFrame[]): DgIssue[] {
  if (!frames.length) return [];
  return [
    ...[plan.main, ...plan.also].flatMap((name) => PROVERS[name](plan, frames)),
    ...proveJoined(plan, frames),
  ];
}
