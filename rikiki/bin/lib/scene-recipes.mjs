// ════════════════════════════════════════════════════════════════
// rikiki scene · recipes
//
// A recipe is a relation with its habits written down: when to use it, what to
// write in it, what goes wrong, and how to build a good brief of that kind. It
// is the guideline and the generator in one place, so what the skill tells an
// author and what the bench builds cannot drift apart.
//
// `buildBrief(recipe, { pack, seed })` writes a VALID brief from a vocabulary
// pack and a seed: same inputs, same brief. It is how `rikiki scene recipe`
// gives a starting point, and how a gallery of varied illustrations is made
// without writing each by hand. Every figure it writes is invented, and the
// brief says so in its source.
// ════════════════════════════════════════════════════════════════

import { BRIEF_SCHEMA } from './scene-brief.mjs';

// ── a seeded stream · same seed, same brief ───────────────────────────────

export function mulberry32(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const between = (random, low, high) => low + Math.floor(random() * (high - low + 1));
const pick = (random, list) => list[Math.floor(random() * list.length)];

/** `count` distinct items of a list, in a stable shuffled order. */
function sample(random, list, count) {
  const pool = [...list];
  const out = [];
  while (out.length < count && pool.length) out.push(pool.splice(Math.floor(random() * pool.length), 1)[0]);
  return out;
}

// ── vocabulary packs · what a team talks about ────────────────────────────

/** Each pack is invented content of one kind of team · short labels (under
 *  14 characters) and short notes (under 36), because those are what fit. */
export const PACKS = Object.freeze({
  product: {
    name: 'a product team',
    entities: [
      { label: 'Search', note: 'finds an item in two keystrokes', tag: 'core', icon: 'search' },
      { label: 'Checkout', note: 'pays in one screen', tag: 'revenue', icon: 'lock' },
      { label: 'Mobile app', note: 'the same list, in a pocket', tag: 'growth', icon: 'user' },
      { label: 'Reports', note: 'a weekly page for managers', tag: 'retention', icon: 'chart' },
      { label: 'Onboarding', note: 'first success in ten minutes', tag: 'activation', icon: 'flag' },
      { label: 'Alerts', note: 'tells you before a customer does', tag: 'trust', icon: 'alert' },
      { label: 'API', note: 'what partners build on', tag: 'platform', icon: 'code' },
      { label: 'Billing', note: 'one invoice, no surprise', tag: 'revenue', icon: 'document' },
    ],
    actions: [
      { label: 'Scope', note: 'one page, one owner', tag: '1 day' },
      { label: 'Prototype', note: 'clickable, not coded', tag: '2 days' },
      { label: 'Build', note: 'behind a flag', tag: '2 weeks' },
      { label: 'Test', note: 'with five real users', tag: '3 days' },
      { label: 'Launch', note: 'to ten percent first', tag: '1 day' },
      { label: 'Learn', note: 'read the numbers, not the mood', tag: 'ongoing' },
    ],
    metrics: [
      { name: 'Latency', unit: 'ms', range: [80, 900], lowerIsBetter: true },
      { name: 'Conversion', unit: '%', range: [2, 14] },
      { name: 'Adoption', unit: '%', range: [20, 95] },
    ],
    columns: ['Web', 'Mobile', 'API', 'Partners', 'Support'],
    phases: ['Discovery', 'Design', 'Build', 'Pilot', 'Rollout', 'Review'],
    gates: [
      { gate: 'FREEZE', trigger: 'release week', lanes: ['Features', 'Fixes', 'Config'] },
      { gate: 'RATE LIMIT', trigger: '100 calls a minute', lanes: ['Web', 'Mobile', 'Partners'] },
    ],
    crowd: { noun: 'visitors', verb: 'buy', unit: 'people' },
    before: { noun: 'sign-ups', change: 'after the new onboarding' },
  },
  ops: {
    name: 'an operations team',
    entities: [
      { label: 'Deploys', note: 'one button, one log', tag: 'daily', icon: 'refresh' },
      { label: 'Backups', note: 'restored once a month', tag: 'weekly', icon: 'database' },
      { label: 'Alerts', note: 'paged only when it matters', tag: 'on call', icon: 'alert' },
      { label: 'Capacity', note: 'ordered a quarter ahead', tag: 'quarterly', icon: 'chart' },
      { label: 'Access', note: 'revoked the day someone leaves', tag: 'audit', icon: 'lock' },
      { label: 'Runbooks', note: 'written by whoever fixed it', tag: 'docs', icon: 'document' },
      { label: 'Cost', note: 'owned by a name, not a team', tag: 'finops', icon: 'trend' },
    ],
    actions: [
      { label: 'Detect', note: 'an alert, not a customer', tag: 'minutes' },
      { label: 'Triage', note: 'severity, owner, channel', tag: '10 min' },
      { label: 'Stabilise', note: 'stop the bleeding first', tag: '30 min' },
      { label: 'Fix', note: 'the cause, not the culprit', tag: 'hours' },
      { label: 'Review', note: 'written while it is fresh', tag: '3 days' },
    ],
    metrics: [
      { name: 'Recovery time', unit: 'min', range: [5, 240], lowerIsBetter: true },
      { name: 'Uptime', unit: '%', range: [96, 100] },
      { name: 'Incidents', unit: '', range: [1, 14], lowerIsBetter: true },
    ],
    columns: ['Auth', 'Billing', 'Search', 'Mail', 'Reports'],
    phases: ['Plan', 'Prepare', 'Migrate', 'Verify', 'Cut over', 'Retire'],
    gates: [
      { gate: 'WINDOW', trigger: '02:00 maintenance', lanes: ['Auth', 'Billing', 'Search', 'Mail'] },
      { gate: 'KILL SWITCH', trigger: 'error rate over 5%', lanes: ['Orders', 'Payments', 'Emails'] },
    ],
    crowd: { noun: 'requests', verb: 'fail', unit: 'requests' },
    before: { noun: 'recoveries', change: 'with the runbooks' },
  },
  sales: {
    name: 'a sales team',
    entities: [
      { label: 'Inbound', note: 'asked us first', tag: 'warm', icon: 'user' },
      { label: 'Referrals', note: 'a customer vouched', tag: 'best', icon: 'team' },
      { label: 'Outbound', note: 'a cold, targeted message', tag: 'slow', icon: 'search' },
      { label: 'Events', note: 'met in person', tag: 'costly', icon: 'calendar' },
      { label: 'Partners', note: 'sold alongside theirs', tag: 'scale', icon: 'cloud' },
      { label: 'Renewals', note: 'the quiet majority', tag: 'steady', icon: 'refresh' },
    ],
    actions: [
      { label: 'Qualify', note: 'budget, need, timing', tag: '1 call' },
      { label: 'Demo', note: 'their data, not ours', tag: '45 min' },
      { label: 'Pilot', note: 'two weeks, one team', tag: '2 weeks' },
      { label: 'Propose', note: 'one page, one price', tag: '3 days' },
      { label: 'Close', note: 'signed by a decider', tag: '1 week' },
    ],
    metrics: [
      { name: 'Win rate', unit: '%', range: [8, 45] },
      { name: 'Cycle', unit: 'days', range: [12, 120], lowerIsBetter: true },
      { name: 'Deal size', unit: 'k€', range: [6, 90] },
    ],
    columns: ['France', 'Germany', 'UK', 'Spain', 'Italy'],
    phases: ['Prospect', 'Qualify', 'Demo', 'Pilot', 'Negotiate', 'Onboard'],
    gates: [
      { gate: 'FREEZE', trigger: 'quarter end', lanes: ['New deals', 'Renewals', 'Upsells'] },
    ],
    crowd: { noun: 'leads', verb: 'sign', unit: 'leads' },
    before: { noun: 'meetings booked', change: 'after the new script' },
  },
  people: {
    name: 'a people team',
    entities: [
      { label: 'Referral', note: 'someone we trust vouches', tag: 'fast', icon: 'team' },
      { label: 'Job boards', note: 'wide, noisy, cheap', tag: 'volume', icon: 'search' },
      { label: 'Campus', note: 'a pipeline, not a hire', tag: 'long', icon: 'flag' },
      { label: 'Agencies', note: 'quick, and costly', tag: 'costly', icon: 'user' },
      { label: 'Returners', note: 'people who left on good terms', tag: 'low risk', icon: 'refresh' },
    ],
    actions: [
      { label: 'Source', note: 'a short list of five', tag: '1 week' },
      { label: 'Screen', note: 'twenty minutes, one question', tag: '2 days' },
      { label: 'Interview', note: 'the same grid for all', tag: '1 week' },
      { label: 'Offer', note: 'a number and a reason', tag: '2 days' },
      { label: 'Onboard', note: 'a buddy and a first fix', tag: '1 month' },
    ],
    metrics: [
      { name: 'Time to hire', unit: 'days', range: [18, 90], lowerIsBetter: true },
      { name: 'Retention', unit: '%', range: [55, 98] },
      { name: 'Offer accepts', unit: '%', range: [40, 92] },
    ],
    columns: ['Design', 'Backend', 'Data', 'Support', 'Sales'],
    phases: ['Brief', 'Source', 'Interview', 'Offer', 'Notice', 'Onboard'],
    gates: [
      { gate: 'HIRING FREEZE', trigger: 'budget review', lanes: ['Engineering', 'Sales', 'Support'] },
    ],
    crowd: { noun: 'applicants', verb: 'reach an offer', unit: 'applicants' },
    before: { noun: 'new hires still here', change: 'with a buddy' },
  },
  data: {
    name: 'a data team',
    entities: [
      { label: 'Ingest', note: 'every source, one format', tag: 'raw', icon: 'database' },
      { label: 'Clean', note: 'one rule per bad value', tag: 'trusted', icon: 'check' },
      { label: 'Model', note: 'a tested definition of revenue', tag: 'core', icon: 'code' },
      { label: 'Serve', note: 'the same number everywhere', tag: 'api', icon: 'cloud' },
      { label: 'Explore', note: 'for questions nobody planned', tag: 'adhoc', icon: 'search' },
      { label: 'Monitor', note: 'tells you when a figure drifts', tag: 'quality', icon: 'alert' },
    ],
    actions: [
      { label: 'Collect', note: 'only what a question needs', tag: 'daily' },
      { label: 'Validate', note: 'fail loud, early', tag: 'hourly' },
      { label: 'Transform', note: 'in SQL anyone can read', tag: 'nightly' },
      { label: 'Publish', note: 'one table, one owner', tag: 'weekly' },
      { label: 'Review', note: 'with the people who use it', tag: 'monthly' },
    ],
    metrics: [
      { name: 'Freshness', unit: 'h', range: [1, 48], lowerIsBetter: true },
      { name: 'Coverage', unit: '%', range: [40, 99] },
      { name: 'Failures', unit: '', range: [0, 12], lowerIsBetter: true },
    ],
    columns: ['Orders', 'Users', 'Traffic', 'Support', 'Finance'],
    phases: ['Inventory', 'Model', 'Backfill', 'Compare', 'Switch', 'Retire'],
    gates: [
      { gate: 'SCHEMA FREEZE', trigger: 'migration week', lanes: ['Orders', 'Users', 'Events'] },
    ],
    crowd: { noun: 'records', verb: 'pass every check', unit: 'records' },
    before: { noun: 'figures that agreed', change: 'after the shared model' },
  },
});

// ── helpers shared by the recipes ─────────────────────────────────────────

const cap = (text) => text.charAt(0).toUpperCase() + text.slice(1);

const SOURCE = { text: 'Illustration · invented figures', nature: 'illustration' };

/** A metric value in the metric's own range, as a whole number or one decimal. */
function valueOf(random, metric) {
  const [low, high] = metric.range;
  const raw = low + random() * (high - low);
  return high - low < 20 ? Math.round(raw * 10) / 10 : Math.round(raw);
}

/** Distinct values, so a ranking does not tie. */
function distinctValues(random, metric, count) {
  const seen = new Set();
  while (seen.size < count) seen.add(valueOf(random, metric));
  return [...seen];
}

const base = (relation, claim, extra) => ({
  schema: BRIEF_SCHEMA,
  claim,
  relation,
  source: SOURCE,
  ...extra,
});

const unitText = (metric) => (metric.unit ? ` ${metric.unit}` : '');

// ── the recipes ───────────────────────────────────────────────────────────

/**
 * Each recipe:
 *   id        · what `rikiki scene recipe <id>` is called
 *   relation  · the relation of the brief it writes
 *   name      · what it is, in a few words
 *   when      · the message that calls for it
 *   write     · what to put in it (the guideline)
 *   avoid     · what goes wrong
 *   build     · (random, pack, options) → a valid brief
 */
export const RECIPES = [
  {
    id: 'options-compared',
    relation: 'parallel',
    name: 'Options of the same rank',
    when: 'Three ways out, four pillars, who does what · nothing comes before anything else.',
    write: [
      'Two to five items, each one short label, a note of one sentence and a tag that judges it ("safe bet", "too early").',
      'Put forward the one the title argues for, and only that one.',
      'The tag is the verdict, the note is the reason · do not repeat one in the other.',
    ],
    avoid: ['Cards for a sequence: they lose the order.', 'Five long notes: five cards hold about 64 characters each.'],
    build(random, pack, { count = between(random, 2, 5) } = {}) {
      const items = sample(random, pack.entities, count);
      const focus = pick(random, items);
      return base('parallel', `${focus.label} is the one to back`, {
        focus: focus.label,
        items: items.map(({ label, note, tag, icon }) => ({ label, note, tag, icon })),
      });
    },
  },
  {
    id: 'ordered-plan',
    relation: 'sequence',
    name: 'Steps in order',
    when: 'Start with this, then that · the order is the message.',
    write: [
      'Three to five steps, a label of one or two words, a note of one sentence, a duration as the tag.',
      'Put forward the step that is new, or the one that is usually skipped.',
      'Close with a verdict when there is a sentence every step answers to (four steps at most with it).',
    ],
    avoid: ['More than four steps with the closing band: the slide cannot hold it.', 'A tag that is a sentence.'],
    build(random, pack, { count = between(random, 3, 4), verdict = random() < 0.6 } = {}) {
      const steps = sample(random, pack.actions, count).sort((a, b) => pack.actions.indexOf(a) - pack.actions.indexOf(b));
      const focus = pick(random, steps);
      return base('sequence', `${steps.length} steps from ${steps[0].label.toLowerCase()} to ${steps.at(-1).label.toLowerCase()}`, {
        focus: focus.label,
        items: steps.map(({ label, note, tag }) => ({ label, note, tag })),
        ...(verdict ? { verdict: { label: `Skip none of the ${steps.length}`, note: 'each one answers the next', icon: 'flag' } } : {}),
      });
    },
  },
  {
    id: 'inputs-to-decision',
    relation: 'converge',
    name: 'Inputs that converge',
    when: 'Several things feed one, which gives a result · how it works.',
    write: [
      'One to four inputs, one hub (the thing the slide is about), one or two outcomes.',
      'The hub is the emphasis: it is drawn in the accent, the inputs before it, the outcomes after.',
      'An outcome may carry a tag, drawn on the arrow into it.',
    ],
    avoid: ['A flow with no hub: that is a list.', 'More than four inputs: the extra ones are cut.'],
    build(random, pack, options = {}) {
      // A pack with few entities cannot feed four inputs, a hub and an outcome.
      const inputs = Math.min(options.inputs ?? between(random, 2, 4), pack.entities.length - 2);
      const items = sample(random, pack.entities, inputs + 2);
      const [hub, ...rest] = items;
      const ins = rest.slice(0, inputs);
      const out = rest[inputs];
      return base('converge', `${cap(hub.label.toLowerCase())} brings ${inputs} sources together`, {
        inputs: ins.map(({ label, note, icon }) => ({ label, note, icon })),
        hub: { label: hub.label, note: hub.note, icon: hub.icon },
        outcomes: [{ label: out.label, tag: out.tag }],
        focus: hub.label,
      });
    },
  },
  {
    id: 'metric-ranking',
    relation: 'compare-size',
    name: 'A metric compared',
    when: 'This one is bigger · one number each.',
    write: [
      'Three to eight items, one figure each, the unit stated once.',
      'Put forward the item the title is about, which is not always the biggest.',
      'Use `group` for before/after periods: items with the same group share a caption.',
    ],
    avoid: ['Figures with no unit.', 'A ratio of 1:1000: the small bar is a dot, give the figure in the tag.'],
    build(random, pack, { count = between(random, 3, 6), metric = pick(random, pack.metrics) } = {}) {
      const entities = sample(random, pack.entities, count);
      const values = distinctValues(random, metric, count);
      const ranked = entities.map((entity, i) => ({ entity, value: values[i] }));
      const sorted = [...ranked].sort((a, b) => (metric.lowerIsBetter ? a.value - b.value : b.value - a.value));
      const lead = sorted[0];
      return base('compare-size', `${lead.entity.label} ${metric.lowerIsBetter ? 'is lightest' : 'leads'} on ${metric.name.toLowerCase()}`, {
        unit: metric.unit || undefined,
        focus: lead.entity.label,
        items: ranked.map(({ entity, value }) => ({ label: entity.label, value })),
      });
    },
  },
  {
    id: 'status-grid',
    relation: 'position-2d',
    name: 'Who stands where',
    when: 'Where each one is, in what state · a grid of statuses.',
    write: [
      'Two or three rows (three fit with the legend), three to five columns.',
      'One status per column: prod, pilot, test, announced or none. Say the words in the deck language with `statuses`.',
      'Put forward the row the title is about.',
    ],
    avoid: ['More than three rows: the drawing is taller than the slide.', 'A status in every cell identical: nothing to read.'],
    build(random, pack, { rows = between(random, 2, 3), columns = between(random, 3, 4) } = {}) {
      const cols = sample(random, pack.columns, columns);
      const entities = sample(random, pack.entities, rows);
      const grid = entities.map((entity) => ({
        label: entity.label,
        levels: cols.map(() => pick(random, ['prod', 'prod', 'pilot', 'test', 'none'])),
      }));
      const focus = pick(random, grid);
      return base('position-2d', `${focus.label} is not live everywhere yet`, {
        columns: cols,
        rows: grid,
        statuses: { prod: 'live', pilot: 'pilot', test: 'in test', none: 'not yet' },
        focus: focus.label,
      });
    },
  },
  {
    id: 'schedule',
    relation: 'span-time',
    name: 'Phases on a timeline',
    when: 'How long each takes, from when to when.',
    write: [
      'Three to six phases on one scale, with its unit. Overlaps are the point.',
      'A phase with no dates is drawn dashed ("to be set") · say so rather than invent a date.',
      'Put the tag in plain words ("6 weeks"), not the numbers again.',
    ],
    avoid: ['Bars for durations: bars have no start.', 'A scale that is not the unit of the dates.'],
    build(random, pack, { count = between(random, 3, 5) } = {}) {
      const scale = pick(random, [12, 16, 24]);
      const phases = sample(random, pack.phases, count);
      let cursor = 0;
      const rows = phases.map((label, i) => {
        const length = between(random, 2, Math.max(2, Math.floor(scale / count) + 2));
        const from = Math.max(0, cursor - (i ? between(random, 0, 1) : 0));
        const to = Math.min(scale, from + length);
        cursor = to;
        return { label, from, to, tag: `${to - from} wk` };
      });
      return base('span-time', `${rows.length} phases in ${scale} weeks`, { scale, unit: 'weeks', rows });
    },
  },
  {
    id: 'freeze-gate',
    relation: 'gate',
    name: 'What happens when one thing changes',
    when: 'The same traffic until a switch, a freeze or a limit comes down.',
    write: [
      'Two to five lanes, the same kind of thing flowing in each.',
      'The gate is one or two words in capitals; the trigger says what brought it down.',
      'The tag is the outcome ("3 served, 3 held"), the token counts are an illustration, not a measure.',
    ],
    avoid: ['A flow for a before/after of one thing: lanes need several streams.', 'Token counts presented as data.'],
    build(random, pack, { lanes = between(random, 2, 3) } = {}) {
      const gate = pick(random, pack.gates);
      const passed = between(random, 1, 4);
      const blocked = between(random, 2, 5);
      return base('gate', `${cap(gate.gate.toLowerCase())} stops what is still on its way`, {
        gate: gate.gate,
        trigger: gate.trigger,
        passed,
        blocked,
        lanes: gate.lanes.slice(0, lanes).map((label) => ({ label, tag: `${passed} through, ${blocked} held` })),
      });
    },
  },
  {
    id: 'crowd-share',
    relation: 'share-of-crowd',
    name: 'A share of a crowd',
    when: 'Two hundred came, three stayed · the people, not a percentage.',
    write: [
      'One to three grids of the same total (up to 400 cells), the first `value` cells lit.',
      'Say what is counted in the label ("buyers") and what the rest did in the note.',
      'Put forward the grid the title argues for.',
    ],
    avoid: ['Grids of different totals side by side.', 'More than 400 cells: the cells are too small to count.'],
    build(random, pack, { panels = between(random, 1, 2) } = {}) {
      const total = pick(random, [20, 24, 40, 50, 60, 100, 200]);
      const labels = sample(random, [pack.crowd.noun, 'before', 'after', 'tried'], panels);
      const items = labels.map((label) => ({
        label: panels === 1 ? `${total} ${pack.crowd.noun}` : label,
        value: between(random, 1, Math.max(2, Math.floor(total * 0.6))),
        note: panels === 1 ? `the rest do not ${pack.crowd.verb}` : undefined,
      }));
      const focus = items.at(-1);
      return base('share-of-crowd', `Few ${pack.crowd.noun} ${pack.crowd.verb}`, {
        total,
        focus: focus.label,
        panels: items,
      });
    },
  },
  {
    id: 'before-after-crowd',
    relation: 'before-after',
    name: 'The same crowd, before and after',
    when: 'A change, measured on the same number of people.',
    write: [
      'Both sides have the same total `of` · two grids of different sizes are not comparable.',
      'Put the "after" forward. Say what changed in the verdict, in the words of the title.',
      'Give the unit of the count in the note, once.',
    ],
    avoid: ['Different totals.', 'A verdict that restates the title: it says what the picture shows, in the band.'],
    build(random, pack) {
      const of = pick(random, [40, 50, 60, 100]);
      const before = between(random, Math.floor(of * 0.15), Math.floor(of * 0.4));
      const after = Math.min(of, Math.round(before * pick(random, [1.5, 2, 2.5])));
      return base('before-after', `${cap(pack.before.noun)} rose ${pack.before.change}`, {
        before: { label: 'before', value: before, of, note: pack.before.noun },
        after: { label: 'after', value: after, of, note: pack.before.noun },
        focus: 'after',
        verdict: { label: `${after} against ${before}`, note: `out of ${of}, ${pack.before.change}`, icon: 'target' },
      });
    },
  },
  {
    id: 'before-after-size',
    relation: 'before-after',
    name: 'The same measure, before and after',
    when: 'A metric that moved · two bars on one scale.',
    write: [
      'The same metric and unit twice, on one scale (set `max` when one value may be zero).',
      'Put the "after" forward.',
      'The verdict says by how much, in words ("four times faster"), and is not a figure the bars do not show.',
    ],
    avoid: ['Two different metrics: that is a comparison, not a change.'],
    build(random, pack) {
      const metric = pick(random, pack.metrics.filter((m) => m.unit));
      const [low, high] = distinctValues(random, metric, 2).sort((a, b) => a - b);
      const before = metric.lowerIsBetter ? high : low;
      const after = metric.lowerIsBetter ? low : high;
      return base('before-after', `${metric.name} moved from ${before}${unitText(metric)} to ${after}${unitText(metric)}`, {
        unit: metric.unit,
        max: Math.ceil(Math.max(before, after) / 10) * 10,
        before: { label: 'before', value: before },
        after: { label: 'after', value: after },
        focus: 'after',
        verdict: { label: `${metric.name} ${metric.lowerIsBetter ? 'fell' : 'rose'}`, note: `${before}${unitText(metric)} to ${after}${unitText(metric)}`, icon: 'trend' },
      });
    },
  },
  {
    id: 'how-and-proof',
    relation: 'mechanism-proof',
    name: 'The mechanism and its proof',
    when: 'How it works, and the measure that shows it does.',
    write: [
      'The mechanism converges on one hub (one to four inputs, one outcome); the proof is two to four bars.',
      'The mechanism takes two thirds of the row, the proof one third.',
      'Put forward the bar the title is about; keep the proof to one metric and one unit.',
    ],
    avoid: ['A proof of unrelated numbers.', 'More than four bars: the third of the row cannot hold them.'],
    build(random, pack, options = {}) {
      const inputs = Math.min(options.inputs ?? between(random, 2, 3), pack.entities.length - 2);
      const bars = options.bars ?? between(random, 2, 3);
      const metric = pick(random, pack.metrics.filter((m) => m.unit));
      const entities = sample(random, pack.entities, inputs + 2);
      const [hub, ...rest] = entities;
      const values = distinctValues(random, metric, bars);
      const labels = sample(random, ['Before', 'Cache', 'Index', 'Batch', 'Edge'], bars);
      const focus = labels[labels.length - 1];
      return base('mechanism-proof', `${hub.label} changes ${metric.name.toLowerCase()}`, {
        mechanism: {
          inputs: rest.slice(0, inputs).map(({ label, icon }) => ({ label, icon })),
          hub: { label: hub.label, icon: hub.icon },
          outcomes: [{ label: rest[inputs].label }],
        },
        proof: {
          unit: metric.unit,
          items: labels.map((label, i) => ({ label, value: values[i] })),
        },
        focus,
      });
    },
  },
  {
    id: 'result-and-verdict',
    relation: 'compare-size',
    name: 'A comparison with its verdict',
    when: 'The numbers, and the sentence they add up to.',
    write: [
      'A compared metric (see metric-ranking) with a `verdict`: the sentence the slide ends on.',
      'The verdict goes in a band under the scene, in the words of the title.',
    ],
    avoid: ['A verdict that adds a claim the bars do not show.'],
    build(random, pack) {
      const brief = RECIPES.find((r) => r.id === 'metric-ranking').build(random, pack, { count: between(random, 3, 5) });
      return { ...brief, verdict: { label: `${brief.focus} sets the pace`, note: 'the rest follow', icon: 'flag' } };
    },
  },
];

const byId = new Map(RECIPES.map((recipe) => [recipe.id, recipe]));

export function recipeIds() {
  return RECIPES.map((r) => r.id);
}

export function recipeById(id) {
  return byId.get(id) ?? null;
}

export function packIds() {
  return Object.keys(PACKS);
}

/** A valid brief of a recipe, from a pack and a seed · same inputs, same brief. */
export function buildBrief(id, { pack = 'product', seed = 1, options = {} } = {}) {
  const recipe = recipeById(id);
  if (!recipe) throw new Error(`unknown recipe "${id}" · one of ${recipeIds().join(', ')}`);
  const vocabulary = PACKS[pack];
  if (!vocabulary) throw new Error(`unknown pack "${pack}" · one of ${packIds().join(', ')}`);
  const random = mulberry32(seed * 7919 + id.length * 104729);
  return recipe.build(random, vocabulary, options);
}
