// ════════════════════════════════════════════════════════════════
// RIKIKI · diagram gallery, the builders
//
// Sixteen ways to build an illustration in the grammar, each a different STRUCTURE
// (a graph by layers, a chart in rows, a ring, a grid of cells with a note, two
// groups side by side, a dashboard of figures, a stack, a hub and its spokes…),
// not a different theme of one shape. Each takes a seeded random stream and a
// vocabulary pack and returns a slide: a claim of one line, the diagram as HTML,
// a source and notes. Every figure is invented, and says so.
//
// Variety is built in at two levels: which builder (structure), and the treatments
// each draws from (`paint`, `tone`, `size`, `gap`, `align`) so that two slides of
// one structure do not look alike either.
// ════════════════════════════════════════════════════════════════

import { PACKS, mulberry32 } from '../../bin/lib/scene-recipes.mjs';

const between = (random, low, high) => low + Math.floor(random() * (high - low + 1));
const pick = (random, list) => list[Math.floor(random() * list.length)];

function sample(random, list, count) {
  const pool = [...list];
  const out = [];
  while (out.length < count && pool.length)
    out.push(pool.splice(Math.floor(random() * pool.length), 1)[0]);
  return out;
}

const esc = (value) => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;');

/** A mark as HTML · attributes in the order an author would write them. */
function mark(tag, attrs = {}, children = '') {
  const written = Object.entries(attrs)
    .filter(([, value]) => value !== undefined && value !== null && value !== false && value !== '')
    .map(([name, value]) => (value === true ? ` ${name}` : ` ${name}="${esc(value)}"`))
    .join('');
  return `<${tag}${written}>${children}</${tag}>`;
}

const diagram = (attrs, children) =>
  mark('deck-diagram', attrs, `\n${children.map((c) => `  ${c}`).join('\n')}\n`);
const box = (attrs) => mark('dg-box', attrs);
const bar = (attrs) => mark('dg-bar', attrs);
const dot = (attrs) => mark('dg-dot', attrs);
const text = (attrs) => mark('dg-text', attrs);
const link = (attrs) => mark('dg-link', attrs);
const group = (attrs, children) =>
  mark('dg-group', attrs, `\n${children.map((c) => `    ${c}`).join('\n')}\n  `);

const SOURCE = 'Illustration · invented figures';
const slug = (s) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const short = (s, n = 34) => (s.length <= n ? s : `${s.slice(0, n - 1).trimEnd()}…`);

const valueIn = (random, metric) => {
  const [low, high] = metric.range;
  const raw = low + random() * (high - low);
  return high - low < 20 ? Math.round(raw * 10) / 10 : Math.round(raw);
};

/** A slide · the structure it is built on is its `structure`, for the variety test. */
const slide = (structure, claim, html, extra = {}) => ({
  structure,
  claim: short(claim),
  html,
  source: SOURCE,
  ...extra,
});

export const BUILDERS = [
  {
    id: 'service-graph',
    build(random, pack) {
      const [hub, ...rest] = sample(random, pack.entities, 6);
      const ins = rest.slice(0, between(random, 2, 3));
      const outs = rest.slice(ins.length, ins.length + between(random, 2, 3));
      const direction = pick(random, ['right', 'right', 'down']);
      const nodes = [
        ...ins.map((e, i) => box({ name: `in${i}`, label: e.label, icon: e.icon })),
        box({ name: 'hub', label: hub.label, note: hub.note, emphasis: true }),
        ...outs.map((e, i) =>
          box({
            name: `out${i}`,
            label: e.label,
            icon: e.icon,
            paint: pick(random, ['soft', 'outline']),
          }),
        ),
      ];
      const links = [
        link({ from: ins.map((_, i) => `in${i}`).join(' '), to: 'hub' }),
        link({
          from: 'hub',
          to: outs.map((_, i) => `out${i}`).join(' '),
          label: pick(random, ['reads', 'calls', 'feeds']),
        }),
      ];
      return slide(
        'layers',
        `${hub.label} is the single entry`,
        diagram({ layout: 'layers', direction }, [...nodes, ...links]),
      );
    },
  },
  {
    id: 'funnel',
    build(random, pack) {
      const steps = sample(random, pack.actions, 4);
      let value = between(random, 800, 12000);
      const bars = steps.map((s, i) => {
        const shown = value;
        value = Math.round(value * (0.18 + random() * 0.4));
        return bar({
          label: s.label,
          value: shown,
          tag: `${shown.toLocaleString('en').replace(/,/g, ' ')}`,
          emphasis: i === 3,
        });
      });
      return slide(
        'chart-rows',
        `Most ${pack.crowd.noun} stop early`,
        diagram({ layout: 'column', align: 'start', gap: pick(random, ['tight', 'normal']) }, bars),
      );
    },
  },
  {
    id: 'loop',
    build(random, pack) {
      const steps = sample(random, pack.actions, between(random, 3, 5));
      const nodes = steps.map((s, i) =>
        box({
          label: s.label,
          icon: pick(random, ['refresh', 'code', 'chart', 'flag', 'spark']),
          emphasis: i === steps.length - 1,
          paint: i === 0 ? 'outline' : undefined,
        }),
      );
      return slide(
        'ring',
        `${steps.length} steps, then again`,
        diagram({ layout: 'ring', link: 'arrow' }, nodes),
      );
    },
  },
  {
    id: 'crowd',
    build(random, pack) {
      const total = pick(random, [100, 200, 300, 400]);
      const lit = between(random, 6, Math.floor(total / 4));
      const side = pick(random, ['right', 'right', 'left']);
      return slide(
        'cells-note',
        `${lit} of ${total} ${pack.crowd.verb}`,
        diagram({ layout: 'grid' }, [
          dot({ count: total - lit }),
          dot({ name: 'lit', count: lit, emphasis: true }),
          text({
            for: 'lit',
            side,
            label: `${lit} ${pack.crowd.verb}`,
            note: `of ${total} ${pack.crowd.unit}`,
          }),
        ]),
      );
    },
  },
  {
    id: 'before-after',
    build(random, pack) {
      const problems = sample(random, pack.actions, 3);
      const fix = pick(random, pack.entities);
      const before = between(random, 22, 48);
      const after = Math.min(96, before + between(random, 25, 45));
      return slide(
        'two-groups',
        `${cap(fix.label.toLowerCase())} changed the outcome`,
        diagram({ layout: 'row', link: 'arrow' }, [
          group(
            { name: 'before', label: 'Before', paint: 'outline', layout: 'column' },
            problems.map((p) => box({ label: p.label })),
          ),
          group(
            {
              name: 'after',
              label: 'After',
              paint: pick(random, ['inverse', 'soft']),
              layout: 'column',
            },
            [box({ name: 'fix', label: fix.label, emphasis: true })],
          ),
          text({ for: 'before', side: 'bottom', label: `${before} % get there` }),
          text({ for: 'after', side: 'bottom', label: `${after} % get there` }),
        ]),
      );
    },
  },
  {
    id: 'options',
    build(random, pack) {
      const items = sample(random, pack.entities, 3);
      const verdicts = ['backed', 'maybe', 'later'];
      const focus = between(random, 0, 2);
      const paint = pick(random, ['soft', 'outline']);
      return slide(
        'row-options',
        `Back ${items[focus].label.toLowerCase()} first`,
        diagram(
          {
            layout: 'row',
            gap: pick(random, ['normal', 'airy']),
            align: pick(random, ['center', 'stretch']),
          },
          items.map((e, i) =>
            box({
              label: e.label,
              tag: verdicts[(i + (2 - focus) + 3) % 3 === 0 ? 0 : i === focus ? 0 : 1 + (i % 2)],
              note: e.note,
              paint: i === focus ? undefined : paint,
              emphasis: i === focus,
            }),
          ),
        ),
      );
    },
  },
  {
    id: 'sequence',
    build(random, pack) {
      const steps = sample(random, pack.actions, 4);
      return slide(
        'row-chain',
        `${steps[0].label} to ${steps.at(-1).label.toLowerCase()}`,
        diagram(
          { layout: 'row', link: 'arrow', gap: 'airy' },
          steps.map((s, i) =>
            box({
              label: s.label,
              tag: s.tag,
              note: s.note,
              paint: i === 1 ? 'outline' : undefined,
              emphasis: i === 2,
            }),
          ),
        ),
      );
    },
  },
  {
    id: 'mechanism-proof',
    build(random, pack) {
      const [hub, ...rest] = sample(random, pack.entities, 4);
      const metric = pick(
        random,
        pack.metrics.filter((m) => m.unit),
      );
      const labels = sample(random, ['Before', 'Cache', 'Index', 'Batch'], 3);
      const values = labels.map(() => valueIn(random, metric));
      const top = Math.max(...values);
      return slide(
        'mechanism-chart',
        `${hub.label} changes ${metric.name.toLowerCase()}`,
        diagram({ layout: 'row', link: 'arrow', gap: 'airy' }, [
          group({ name: 'how', layout: 'layers' }, [
            box({ name: 'a', label: rest[0].label }),
            box({ name: 'b', label: rest[1].label }),
            box({ name: 'h', label: hub.label, emphasis: true }),
            link({ from: 'a b', to: 'h' }),
          ]),
          group(
            { name: 'proof', layout: 'column', align: 'start', gap: 'tight' },
            labels.map((label, i) =>
              bar({
                label,
                value: values[i],
                tag: `${values[i]}${metric.unit ? ` ${metric.unit}` : ''}`,
                emphasis: values[i] === top && false,
              }),
            ),
          ),
        ]),
      );
    },
  },
  {
    id: 'kpi-tiles',
    build(random, pack) {
      const metrics = sample(random, pack.metrics, 3);
      const focus = between(random, 0, 2);
      return slide(
        'figures',
        `${cap(metrics[focus].name.toLowerCase())} is what moved`,
        diagram(
          { layout: 'row', gap: 'airy', align: 'stretch' },
          metrics.map((m, i) =>
            box({
              value: `${valueIn(random, m)}${m.unit ? ` ${m.unit}` : ''}`,
              label: m.name,
              paint: i === focus ? 'solid' : pick(random, ['outline', 'soft']),
              size: 'normal',
            }),
          ),
        ),
      );
    },
  },
  {
    id: 'two-columns',
    build(random, pack) {
      const [left, right] = [sample(random, pack.actions, 3), sample(random, pack.entities, 3)];
      return slide(
        'two-groups',
        `Keep the ${pack.name.replace(/^an? /, '').split(' ')[0]} part simple`,
        diagram({ layout: 'row', gap: 'airy', align: 'start' }, [
          group(
            { label: 'What costs us', paint: 'outline', layout: 'column' },
            left.map((a) => box({ label: a.label, tone: 'danger', paint: 'soft' })),
          ),
          group(
            { label: 'What helps', paint: 'inverse', layout: 'column' },
            right.map((e, i) => box({ label: e.label, tone: 'ok', emphasis: i === 0 })),
          ),
        ]),
      );
    },
  },
  {
    id: 'stack',
    build(random, pack) {
      const layers = sample(random, pack.entities, 4);
      const paints = ['inverse', 'solid', 'soft', 'outline'];
      return slide(
        'column-stack',
        `Four layers, one owner each`,
        diagram(
          { layout: 'column', gap: 'tight', align: 'stretch' },
          layers.map((e, i) =>
            box({ label: e.label, note: e.note, paint: paints[i], emphasis: false }),
          ),
        ),
      );
    },
  },
  {
    id: 'hub-spokes',
    build(random, pack) {
      const [hub, ...spokes] = sample(random, pack.entities, between(random, 4, 6));
      return slide(
        'layers',
        `Everything runs through ${hub.label.toLowerCase()}`,
        diagram({ layout: 'layers', direction: 'down' }, [
          box({ name: 'hub', label: hub.label, note: hub.note, emphasis: true }),
          ...spokes.map((s, i) =>
            box({ name: `s${i}`, label: s.label, icon: s.icon, paint: 'soft' }),
          ),
          link({ from: 'hub', to: spokes.map((_, i) => `s${i}`).join(' ') }),
        ]),
      );
    },
  },
  {
    id: 'big-number',
    build(random, pack) {
      const metric = pick(
        random,
        pack.metrics.filter((m) => m.unit),
      );
      const facts = sample(random, pack.entities, 3);
      return slide(
        'figure-and-facts',
        `${cap(metric.name.toLowerCase())}, one number`,
        diagram({ layout: 'row', gap: 'airy', align: 'center' }, [
          box({
            value: `${valueIn(random, metric)} ${metric.unit}`,
            label: metric.name,
            size: 'large',
            paint: 'solid',
            emphasis: true,
          }),
          group(
            { layout: 'column', gap: 'tight' },
            facts.map((f) => box({ label: f.label, note: f.note, paint: 'outline' })),
          ),
        ]),
      );
    },
  },
  {
    id: 'ranking',
    build(random, pack) {
      const metric = pick(
        random,
        pack.metrics.filter((m) => m.unit),
      );
      const items = sample(random, pack.entities, between(random, 4, 6));
      const values = items.map(() => valueIn(random, metric));
      const best = values.indexOf(metric.lowerIsBetter ? Math.min(...values) : Math.max(...values));
      return slide(
        'chart-rows',
        `${items[best].label} ${metric.lowerIsBetter ? 'is lightest' : 'leads'}`,
        diagram(
          { layout: 'column', align: 'start', gap: 'tight' },
          items.map((e, i) =>
            bar({
              label: e.label,
              value: values[i],
              tag: `${values[i]} ${metric.unit}`,
              emphasis: i === best,
            }),
          ),
        ),
      );
    },
  },
  {
    id: 'feature-grid',
    build(random, pack) {
      const items = sample(random, pack.entities, 6);
      const focus = between(random, 0, 5);
      return slide(
        'grid-boxes',
        `Six parts, ${items[focus].label.toLowerCase()} first`,
        diagram(
          { layout: 'grid', columns: 3, gap: 'normal' },
          items.map((e, i) =>
            box({
              label: e.label,
              icon: e.icon,
              paint: i === focus ? undefined : pick(random, ['soft', 'outline']),
              emphasis: i === focus,
            }),
          ),
        ),
      );
    },
  },
  {
    id: 'pipeline',
    build(random, pack) {
      const stages = sample(random, pack.actions, 4);
      return slide(
        'column-chain',
        `${stages.length} stages, top to bottom`,
        diagram(
          { layout: 'column', link: 'arrow', gap: 'tight', align: 'center' },
          stages.map((s, i) =>
            box({
              label: s.label,
              tag: s.tag,
              paint: i === 0 ? 'inverse' : i === stages.length - 1 ? 'solid' : 'soft',
              emphasis: i === stages.length - 1,
            }),
          ),
        ),
      );
    },
  },
  {
    id: 'split-by-gate',
    build(random, pack) {
      const gate = pick(random, pack.gates);
      const passed = gate.lanes.slice(0, 2);
      return slide(
        'groups-gate',
        `${cap(gate.gate.toLowerCase())} stops late work`,
        diagram({ layout: 'row', link: 'arrow', gap: 'airy', align: 'center' }, [
          group(
            { label: 'Still moving', paint: 'outline', layout: 'column' },
            passed.map((l) => box({ label: l, tone: 'ok' })),
          ),
          box({
            name: 'gate',
            label: gate.gate,
            note: gate.trigger,
            paint: 'solid',
            emphasis: true,
          }),
          group(
            { label: 'Held', paint: 'soft', layout: 'column' },
            gate.lanes
              .slice(2)
              .concat(passed.slice(0, 1))
              .map((l) => box({ label: l, tone: 'danger' })),
          ),
        ]),
      );
    },
  },
];

export const PACK_IDS = Object.keys(PACKS);

/** One slide of a builder, from a pack and a seed. */
export function buildSlide(builderId, packId, seed) {
  const builder = BUILDERS.find((b) => b.id === builderId);
  if (!builder) throw new Error(`unknown builder "${builderId}"`);
  const random = mulberry32(seed * 7919 + builderId.length * 104729);
  const built = builder.build(random, PACKS[packId]);
  return { ...built, builder: builderId, pack: packId, seed, id: slug(built.claim) };
}

export { slug };
