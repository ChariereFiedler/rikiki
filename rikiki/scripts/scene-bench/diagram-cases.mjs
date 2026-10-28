// ════════════════════════════════════════════════════════════════
// RIKIKI · diagram bench, the cases
//
// A case is a diagram written as data: a root with attributes and a tree of marks
// and groups, plus the room it is drawn in. Generated from a seed, so a failure
// is reproduced by `seed:index`. Pure · it loads in the bench page and in Node.
//
// The space it explores is the one an agent reaches with the grammar: every
// engine (row, column, grid, layers, ring, lanes, axis), groups nested two deep,
// boxes with and without a note, a tag, an icon and a paint, dots, bars, links (a
// random DAG for layers), lanes with tokens and gates that change on a click,
// points and stretches on an axis with a cursor, annotations, texts from a word to
// a sentence with the awkward ones, and rooms from the whole canvas to a third of it.
// Two families more: `states`, pictures of named boxes that change place, layout
// and company from one click to the next (the morph), and `gauges`, meters and
// queues whose value changes on each click, now and then out of their range.
// ════════════════════════════════════════════════════════════════

import { mulberry32 } from './cases.mjs';

const LAYOUTS = ['row', 'column', 'grid', 'layers', 'ring', 'lanes', 'axis'];
/** What a case draws · a layout of the grammar, or one of the two families. */
const FAMILIES = [...LAYOUTS, 'states', 'gauges'];
const TONES_OF_A_CLICK = ['normal', 'ok', 'warn', 'danger', 'muted', 'accent'];
const GATE_STATES = ['open', 'closed', 'shed'];
const ENTERS = ['fade', 'rise', 'pop', 'draw'];
const PAINTS = ['none', 'outline', 'soft', 'solid', 'inverse'];
const TONES = ['normal', 'muted', 'accent', 'ok', 'warn', 'danger'];
const SIZES = ['small', 'normal', 'large'];
const GAPS = ['tight', 'normal', 'airy'];
const ICONS = [
  'check',
  'user',
  'team',
  'lock',
  'database',
  'cloud',
  'code',
  'chart',
  'flag',
  'search',
  'spark',
];
const ROOMS = [
  { w: 1600, h: 600 },
  { w: 1600, h: 500 },
  { w: 1200, h: 600 },
  { w: 800, h: 500 },
  { w: 560, h: 480 },
];

const WORDS = [
  'cache',
  'index',
  'gateway',
  'auth',
  'billing',
  'search',
  'queue',
  'token',
  'worker',
  'report',
  'données',
  'qualité',
  'être',
  'Zürich',
];
const AWKWARD = [
  'Pneumonoultramicroscopicsilicovolcanoconiosis',
  'internationalisation',
  'un très très long libellé qui continue encore et encore',
  '12 500 €',
  'a, b, c',
  'MMMMMMMMMM',
  'W',
];

const pick = (random, list) => list[Math.floor(random() * list.length)];
const between = (random, low, high) => low + Math.floor(random() * (high - low + 1));
const maybe = (random, odds, make) => (random() < odds ? make() : undefined);

/** A copy in another order · Fisher–Yates on the case's own random. */
function shuffle(random, list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function text(random, maxWords) {
  if (random() < 0.08) return pick(random, AWKWARD);
  return Array.from({ length: between(random, 1, maxWords) }, () => pick(random, WORDS)).join(' ');
}

const clean = (attrs) =>
  Object.fromEntries(Object.entries(attrs).filter(([, v]) => v !== undefined && v !== false));

function box(random, name) {
  return {
    tag: 'dg-box',
    attrs: clean({
      name,
      label: text(random, 3),
      note: maybe(random, 0.45, () => text(random, 8)),
      tag: maybe(random, 0.2, () => text(random, 2)),
      icon: maybe(random, 0.35, () => pick(random, ICONS)),
      paint: maybe(random, 0.3, () => pick(random, PAINTS)),
      tone: maybe(random, 0.2, () => pick(random, TONES)),
      size: maybe(random, 0.15, () => pick(random, SIZES)),
    }),
    children: [],
  };
}

/** A group of boxes, sometimes with a surface and a caption, sometimes one level deeper. */
function group(random, depth, names) {
  const layout = pick(random, ['row', 'column']);
  const count = between(random, 1, 4);
  const children = Array.from({ length: count }, () =>
    depth < 1 && random() < 0.25
      ? group(random, depth + 1, names)
      : box(random, `n${names.next++}`),
  );
  return {
    tag: 'dg-group',
    attrs: clean({
      name: `g${names.next++}`,
      layout,
      label: maybe(random, 0.5, () => text(random, 2)),
      paint: maybe(random, 0.5, () => pick(random, PAINTS)),
      gap: maybe(random, 0.2, () => pick(random, GAPS)),
    }),
    children,
  };
}

function nodeNames(root) {
  const found = [];
  const walk = (n) => {
    if (n.attrs?.name) found.push({ name: n.attrs.name, tag: n.tag });
    for (const child of n.children ?? []) walk(child);
  };
  for (const child of root.children) walk(child);
  return found;
}

/** Lanes carrying tokens, gates across some of them (open, closed, shedding, and
 *  changing on a click), and what the lanes run into. */
function lanesCase(random, root, names) {
  const lanes = Array.from({ length: between(random, 1, 5) }, () => ({
    tag: 'dg-lane',
    attrs: clean({
      name: `l${names.next++}`,
      label: text(random, 2),
      note: maybe(random, 0.2, () => text(random, 3)),
      icon: maybe(random, 0.6, () => pick(random, ICONS)),
      flow: maybe(random, 0.7, () => String(between(random, 0, 8))),
      speed: maybe(random, 0.3, () => pick(random, ['slow', 'normal', 'fast'])),
      enter: maybe(random, 0.2, () => pick(random, ENTERS)),
    }),
    children: [],
  }));
  root.children.push(...lanes);
  for (let g = 0; g < between(random, 0, 2); g += 1) {
    const over = lanes.filter(() => random() < 0.6).map((lane) => lane.attrs.name);
    root.children.push({
      tag: 'dg-gate',
      attrs: clean({
        name: `g${names.next++}`,
        label: maybe(random, 0.5, () => text(random, 2)),
        over: over.length && random() < 0.5 ? over.join(' ') : undefined,
        at: maybe(random, 0.5, () => pick(random, ['start', 'middle', 'end'])),
        state: Array.from({ length: between(random, 1, 3) }, () => pick(random, GATE_STATES)).join(
          ' ',
        ),
      }),
      children: [],
    });
  }
  for (let s = 0; s < between(random, 0, 2); s += 1)
    root.children.push(box(random, `n${names.next++}`));
}

/** Points on one line, or stretches each on a track, and a cursor now and then. */
function axisCase(random, root) {
  const stretches = random() < 0.4;
  const count = between(random, 1, 8);
  for (let i = 0; i < count; i += 1) {
    const from = between(random, 0, 90);
    root.children.push({
      tag: 'dg-bar',
      attrs: clean({
        label: text(random, 2),
        tag: maybe(random, 0.4, () => text(random, 1)),
        value: stretches ? undefined : String(from),
        from: stretches ? String(from) : undefined,
        to: stretches ? String(from + between(random, 1, 30)) : undefined,
        emphasis: i === 0 && random() < 0.4 ? 'true' : undefined,
      }),
      children: [],
    });
  }
  if (random() < 0.5)
    root.children.push({
      tag: 'dg-cursor',
      attrs: clean({
        label: maybe(random, 0.7, () => text(random, 1)),
        value: String(between(random, 0, 100)),
      }),
      children: [],
    });
}

/** Named boxes in a picture of their own, one per click · the same names, shuffled,
 *  in another layout, a few gone, a few new; links in a graph. */
function statesCase(random, root) {
  const pool = Array.from({ length: between(random, 3, 8) }, (_, i) => `s${i}`);
  const labels = new Map(pool.map((name) => [name, text(random, 2)]));
  const clicks = between(random, 1, 2);
  for (let step = 0; step <= clicks; step += 1) {
    const layout = pick(random, ['row', 'column', 'grid', 'layers']);
    const shown = pool.filter(() => random() < 0.75);
    const names = shuffle(random, shown.length >= 2 ? shown : pool.slice(0, 2));
    const children = names.map((name) => ({
      tag: 'dg-box',
      attrs: clean({
        name,
        // Now and then a mark says something else on the next click.
        label: random() < 0.15 ? text(random, 2) : labels.get(name),
        icon: maybe(random, 0.3, () => pick(random, ICONS)),
        emphasis: name === names[0] && random() < 0.3 ? 'true' : undefined,
      }),
      children: [],
    }));
    if (layout === 'layers')
      for (let i = 1; i < names.length; i += 1)
        children.push({
          tag: 'dg-link',
          attrs: { from: names[between(random, 0, i - 1)], to: names[i] },
          children: [],
        });
    root.children.push({
      tag: 'dg-state',
      attrs: clean({ step: step ? String(step) : undefined }),
      children: [
        {
          tag: 'dg-group',
          attrs: clean({
            layout,
            paint: maybe(random, 0.3, () => pick(random, ['outline', 'soft'])),
            label: maybe(random, 0.3, () => text(random, 2)),
          }),
          children,
        },
      ],
    });
  }
}

/** One word per click · numbers from a range, `out` of them now and then past it. */
const perClick = (random, clicks, low, high, out) =>
  Array.from({ length: clicks + 1 }, () =>
    String(random() < out ? high + between(random, 1, 20) : between(random, low, high)),
  ).join(' ');

/** A curve · two to twelve values (now and then one too many), a scale that may be
 *  written or left to the curve, a threshold, words under it. Values past a written
 *  scale now and then, as for a meter. */
function curveNode(random, names) {
  const count = random() < 0.05 ? 13 : between(random, 2, 12);
  const top = pick(random, [10, 100, 2000]);
  const written = random() < 0.5;
  const values = Array.from({ length: count }, () =>
    String(written && random() < 0.05 ? top + between(random, 1, 20) : between(random, 0, top)),
  );
  const ticks = pick(random, [
    undefined,
    [text(random, 1), text(random, 1)],
    values.map((_, k) => `S${k + 1}`),
  ]);
  return {
    tag: 'dg-curve',
    attrs: clean({
      name: `c${names.next++}`,
      label: maybe(random, 0.8, () => text(random, 3)),
      values: values.join(' '),
      max: written ? String(top) : undefined,
      unit: maybe(random, 0.5, () => pick(random, ['%', 'ms', 'k€'])),
      threshold: maybe(random, 0.5, () => String(between(random, 0, top))),
      ticks: ticks?.join(' '),
      emphasis: maybe(random, 0.3, () => 'true'),
    }),
    children: [],
  };
}

/** Meters, queues and curves in a row or a column, the gauges' values changing on
 *  each click. */
function gaugesCase(random, root, names) {
  const clicks = between(random, 0, 3);
  for (let i = 0; i < between(random, 1, 4); i += 1) {
    if (random() < 0.2) {
      root.children.push(curveNode(random, names));
      continue;
    }
    if (random() < 0.5) {
      const max = pick(random, [10, 100, 250]);
      root.children.push({
        tag: 'dg-meter',
        attrs: clean({
          name: `m${names.next++}`,
          label: maybe(random, 0.85, () => text(random, 3)),
          value: perClick(random, clicks, 0, max, 0.05),
          max: String(max),
          unit: maybe(random, 0.5, () => pick(random, ['%', 'Go', 'req/s'])),
          threshold: maybe(random, 0.4, () => String(between(random, 0, max))),
          tone: maybe(random, 0.4, () =>
            Array.from({ length: clicks + 1 }, () => pick(random, TONES_OF_A_CLICK)).join(' '),
          ),
        }),
        children: [],
      });
    } else {
      const count = between(random, 1, 12);
      root.children.push({
        tag: 'dg-queue',
        attrs: clean({
          name: `q${names.next++}`,
          label: maybe(random, 0.7, () => text(random, 2)),
          count: String(count),
          fill: perClick(random, clicks, 0, count, 0.05),
          tone: maybe(random, 0.3, () => pick(random, TONES_OF_A_CLICK)),
        }),
        children: [],
      });
    }
  }
}

/** One case from a seed and an index · same pair, same case, everywhere. */
export function generateDiagramCase(seed, index) {
  const random = mulberry32((seed * 7_000_003 + index * 104_729) >>> 0);
  const family = pick(random, FAMILIES);
  const layout =
    family === 'states' ? 'row' : family === 'gauges' ? pick(random, ['row', 'column']) : family;
  const room = pick(random, ROOMS);
  const names = { next: 0 };
  const root = {
    tag: 'deck-diagram',
    attrs: clean({
      layout,
      direction: layout === 'layers' ? pick(random, ['right', 'down']) : undefined,
      gap: maybe(random, 0.2, () => pick(random, GAPS)),
      align: maybe(random, 0.2, () => pick(random, ['start', 'center', 'end'])),
      link: layout === 'ring' || (layout === 'row' && random() < 0.4) ? 'arrow' : undefined,
      columns:
        layout === 'grid' ? maybe(random, 0.5, () => String(between(random, 2, 8))) : undefined,
    }),
    children: [],
  };

  if (family === 'states') {
    statesCase(random, root);
  } else if (family === 'gauges') {
    gaugesCase(random, root, names);
  } else if (layout === 'lanes') {
    lanesCase(random, root, names);
  } else if (layout === 'axis') {
    axisCase(random, root);
  } else if (layout === 'grid' && random() < 0.6) {
    // A grid of dots, up to the ceiling, with an annotation on one series.
    const total = pick(random, [12, 40, 100, 200, 400]);
    const lit = between(random, 1, Math.max(1, Math.floor(total / 3)));
    root.children.push({ tag: 'dg-dot', attrs: { count: String(total - lit) }, children: [] });
    root.children.push({
      tag: 'dg-dot',
      attrs: { name: 'lit', count: String(lit), emphasis: 'true' },
      children: [],
    });
    if (random() < 0.7)
      root.children.push({
        tag: 'dg-text',
        attrs: clean({
          for: 'lit',
          side: pick(random, ['right', 'left', 'top', 'bottom']),
          label: text(random, 3),
          note: maybe(random, 0.5, () => text(random, 5)),
        }),
        children: [],
      });
  } else if (layout === 'column' && random() < 0.35) {
    // A chart in rows.
    for (let i = 0; i < between(random, 2, 6); i += 1) {
      root.children.push({
        tag: 'dg-bar',
        attrs: clean({
          label: text(random, 2),
          value: String(between(random, 1, 5000)),
          tag: maybe(random, 0.6, () => text(random, 2)),
          emphasis: i === 0 && random() < 0.5 ? 'true' : undefined,
        }),
        children: [],
      });
    }
  } else {
    const count = between(random, 1, layout === 'ring' ? 9 : 10);
    for (let i = 0; i < count; i += 1)
      root.children.push(
        random() < 0.2 && layout !== 'ring' && layout !== 'layers'
          ? group(random, 0, names)
          : box(random, `n${names.next++}`),
      );
    // Exactly one emphasis, most of the time.
    const boxes = root.children.filter((c) => c.tag === 'dg-box');
    if (boxes.length && random() < 0.7)
      boxes[between(random, 0, boxes.length - 1)].attrs.emphasis = 'true';
    if (layout === 'layers') {
      const named = nodeNames(root).filter((n) => n.tag === 'dg-box');
      for (let i = 1; i < named.length; i += 1) {
        if (random() < 0.85)
          root.children.push({
            tag: 'dg-link',
            attrs: clean({
              from: named[between(random, 0, i - 1)].name,
              to: named[i].name,
              label: maybe(random, 0.25, () => text(random, 1)),
            }),
            children: [],
          });
      }
    }
    if (random() < 0.25 && boxes.length) {
      root.children.push({
        tag: 'dg-text',
        attrs: clean({
          for: pick(random, boxes).attrs.name,
          side: pick(random, ['right', 'left', 'top', 'bottom']),
          label: text(random, 3),
        }),
        children: [],
      });
    }
  }
  return { id: `d${seed}:${index}`, seed, index, family, room, root };
}

/** Lines of a terminal · a command after a prompt, results with their mark, now and then
 *  an awkward one. */
function terminalLines(random) {
  return Array.from({ length: between(random, 1, 5) }, (_, n) =>
    n === 0
      ? `$ ${text(random, 3)}`
      : `${pick(random, ['✓ ', '✗ ', ''])}${random() < 0.05 ? 'x'.repeat(60) : text(random, 4)}`,
  ).join('\n');
}

/** One of the marks that tell a story · every kind, with what it reads. */
function storyMark(random, name, others) {
  const kind = pick(random, [
    'terminal',
    'table',
    'switch',
    'timer',
    'band',
    'person',
    'screen',
    'counter',
  ]);
  const rows = () =>
    Array.from({ length: between(random, 1, 5) }, () => text(random, 3)).join('\n');
  const attrs = {
    terminal: () => ({
      label: maybe(random, 0.8, () => text(random, 2)),
      lines: terminalLines(random),
    }),
    table: () => ({
      label: maybe(random, 0.8, () => text(random, 2)),
      icon: maybe(random, 0.6, () => pick(random, ICONS)),
      paint: maybe(random, 0.6, () => pick(random, ['pale', 'gold', 'ink', 'ok', 'bad'])),
      rows: rows(),
      from: others.length && random() < 0.4 ? pick(random, others) : undefined,
      strike: maybe(random, 0.3, () => '1'),
    }),
    switch: () => ({
      label: maybe(random, 0.8, () => text(random, 2)),
      state: pick(random, ['on', 'off', 'on off', 'off on']),
      on: maybe(random, 0.5, () => text(random, 1)),
      off: maybe(random, 0.5, () => text(random, 1)),
    }),
    timer: () => ({
      label: maybe(random, 0.8, () => text(random, 3)),
      value: String(between(random, random() < 0.05 ? 0 : 1, 90)),
      unit: maybe(random, 0.7, () => pick(random, ['min', 's', 'h'])),
    }),
    band: () => {
      const to = between(random, 4, 48);
      return {
        label: maybe(random, 0.8, () => text(random, 2)),
        note: maybe(random, 0.4, () => text(random, 4)),
        from: '0',
        to: String(to),
        cut: String(random() < 0.05 ? to + 1 : between(random, 1, to - 1)),
        tag: maybe(random, 0.6, () => text(random, 3)),
        brace: maybe(random, 0.6, () => text(random, 3)),
      };
    },
    person: () => {
      const count = between(random, 1, random() < 0.05 ? 20 : 12);
      return {
        label: maybe(random, 0.7, () => text(random, 2)),
        count: String(count),
        absent: String(between(random, 0, count)),
      };
    },
    screen: () => ({
      label: maybe(random, 0.8, () => `app.${pick(random, WORDS)}.io`),
      note: maybe(random, 0.7, () => text(random, 3)),
      count: maybe(random, 0.6, () => String(between(random, 1, 10))),
    }),
    counter: () => ({
      label: maybe(random, 0.8, () => text(random, 3)),
      value: pick(random, ['15 000', '64', '2,5', '312', '1 240']),
      unit: maybe(random, 0.5, () => pick(random, ['leads', '%', 'k€'])),
    }),
  }[kind]();
  return { tag: `dg-${kind}`, attrs: clean({ name, ...attrs }), children: [] };
}

/** A case of the marks that tell a story · two to five of them in a row or a column, a
 *  link now and then, a status on one. Drawn on a random of its own, after the cases of
 *  the other families, so a seed draws the same cases of those as before. */
export function generateStoryCase(seed, index) {
  const random = mulberry32((seed * 9_000_011 + index * 130_363) >>> 0);
  const layout = pick(random, ['row', 'column']);
  const root = {
    tag: 'deck-diagram',
    attrs: clean({ layout, gap: maybe(random, 0.3, () => pick(random, GAPS)) }),
    children: [],
  };
  const names = [];
  for (let i = 0; i < between(random, 2, 5); i += 1) {
    const name = `s${i}`;
    root.children.push(
      storyMark(
        random,
        name,
        names.filter((n) => n !== name),
      ),
    );
    names.push(name);
  }
  if (random() < 0.5)
    root.children.push({ tag: 'dg-link', attrs: { from: 's0', to: 's1' }, children: [] });
  if (random() < 0.6)
    root.children.push({
      tag: 'dg-status',
      attrs: clean({
        for: pick(random, names),
        state: pick(random, ['ok', 'fail', 'wait']),
        label: text(random, 2),
        side: maybe(random, 0.5, () => pick(random, ['right', 'left', 'top', 'bottom'])),
      }),
      children: [],
    });
  return {
    id: `d${seed}:story${index}`,
    seed,
    index,
    family: 'story',
    room: pick(random, ROOMS),
    root,
  };
}

/** The cases of a seed · `total` of every family, and one in eight more of the marks
 *  that tell a story. */
export function generateDiagramCases(seed, total) {
  return [
    ...Array.from({ length: total }, (_, i) => generateDiagramCase(seed, i)),
    ...Array.from({ length: Math.ceil(total / 8) }, (_, i) => generateStoryCase(seed, i)),
  ];
}

const quote = (value) => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;');

function markup(node) {
  const attrs = Object.entries(node.attrs ?? {})
    .map(([name, value]) =>
      value === 'true' && (name === 'emphasis' || name === 'dashed' || name === 'back')
        ? ` ${name}`
        : ` ${name}="${quote(value)}"`,
    )
    .join('');
  return `<${node.tag}${attrs}>${(node.children ?? []).map(markup).join('')}</${node.tag}>`;
}

/** The HTML an author would write for a case. */
export function diagramMarkup(testCase) {
  return markup({
    ...testCase.root,
    attrs: { ...testCase.root.attrs, bounds: `${testCase.room.w}x${testCase.room.h}` },
  });
}
