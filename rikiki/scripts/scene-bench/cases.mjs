// ════════════════════════════════════════════════════════════════
// RIKIKI · scene bench, the cases
//
// A case is a scene written as data: which shape, how wide a canvas it gets, and
// the items. Generated from a seed, so any failure is reproduced by its seed and
// index alone. Pure · no browser, no DOM, so the generator is unit-tested and the
// same module loads in the bench page.
//
// The space it explores is the one an author really reaches: item counts from
// one under the minimum to one over the maximum, texts from a word to a sentence
// with the awkward ones (a long compound, accents, a figure and its unit, a
// comma), emphasis on none, one or all, values with extreme ratios, and the
// width a region of a composition leaves.
// ════════════════════════════════════════════════════════════════

/** Same small generator everywhere · a seed gives the same stream on any machine. */
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

export const KINDS = ['cards', 'steps', 'flow', 'bars', 'matrix', 'ranges', 'lanes', 'units'];

/** The canvas widths a scene is drawn at · the whole canvas, then what a region of
 *  a row of two and of three leaves. */
export const WIDTHS = [1600, 752, 469];

/** The narrowest width each shape is declared to draw cleanly at · mirrors
 *  MIN_SCENE_WIDTH (deck-scene-compose-layout.ts), and is checked against it by
 *  the unit test. Under it a composition says SCENE_REGION_TOO_NARROW, an error,
 *  for the whole region: the shape promises nothing there, so the bench does not
 *  judge it there unless the widths are asked for (the width sweep does). */
export const MIN_WIDTHS = {
  cards: 469,
  flow: 469,
  bars: 469,
  ranges: 469,
  units: 469,
  steps: 650,
  matrix: 1000,
  lanes: 1000,
};

/** The widths a shape is drawn at when none are asked for · those of WIDTHS it
 *  is declared clean at, and its own narrowest, where it is closest to failing. */
export function widthsFor(kind) {
  const min = MIN_WIDTHS[kind];
  return [...new Set([...WIDTHS.filter((width) => width >= min), min])];
}

/** The most and fewest items each shape draws · mirrors SCENE_LIMITS, and is
 *  checked against it by the bench itself (a drift shows as an unreported drop). */
export const COUNTS = {
  cards: { min: 2, max: 5 },
  steps: { min: 1, max: 6 },
  flow: { min: 2, max: 7 },
  bars: { min: 2, max: 8 },
  matrix: { min: 1, max: 6 },
  ranges: { min: 1, max: 8 },
  lanes: { min: 2, max: 5 },
  units: { min: 1, max: 3 },
};

const WORDS = [
  'cache',
  'index',
  'build',
  'ship',
  'verify',
  'review',
  'deploy',
  'rollback',
  'queue',
  'token',
  'gate',
  'lane',
  'trust',
  'signal',
  'budget',
  'owner',
  'audit',
  'scope',
  'données',
  'qualité',
  'été',
  'être',
  'où',
  'ça',
  'naïve',
  'œuvre',
  'Zürich',
];

/** Strings that break text layout, by what they break. */
const AWKWARD = [
  'Pneumonoultramicroscopicsilicovolcanoconiosis',
  'Donaudampfschifffahrtsgesellschaft',
  'internationalisation',
  'un très très très long libellé qui continue encore et encore',
  '12 500 €',
  '3,7 %',
  '98,6 % des cas',
  'a, b, c, d',
  'AI visits',
  'W',
  'iiiiiiiiiiii',
  'MMMMMMMMMM',
];

const ICONS = [
  'check',
  'cross',
  'alert',
  'info',
  'question',
  'ban',
  'arrow',
  'clock',
  'calendar',
  'refresh',
  'trend',
  'user',
  'team',
  'target',
  'flag',
  'lock',
  'search',
  'code',
  'database',
  'cloud',
  'document',
  'chart',
  'spark',
];

const LEVELS = ['prod', 'pilot', 'test', 'announced', 'none'];

const pick = (random, list) => list[Math.floor(random() * list.length)];
const between = (random, low, high) => low + Math.floor(random() * (high - low + 1));

/** `n` words, sometimes one awkward string instead · the length is the lever. */
function text(random, maxWords) {
  if (random() < 0.12) return pick(random, AWKWARD);
  const count = between(random, 1, maxWords);
  return Array.from({ length: count }, () => pick(random, WORDS)).join(' ');
}

const maybe = (random, odds, make) => (random() < odds ? make() : null);

/** How many items · one under the minimum to one over the maximum, with the
 *  boundaries more likely than the middle, since that is where shapes break. */
function countFor(random, kind) {
  const { min, max } = COUNTS[kind];
  const roll = random();
  if (roll < 0.1) return Math.max(1, min - 1);
  if (roll < 0.2) return max + 1;
  if (roll < 0.4) return max;
  if (roll < 0.5) return min;
  return between(random, min, max);
}

/** Which items carry `emphasis` · none, one, or all, as an author might. */
function emphasisFor(random, count) {
  const roll = random();
  if (roll < 0.3) return () => false;
  if (roll < 0.85) {
    const only = between(random, 0, count - 1);
    return (i) => i === only;
  }
  return () => true;
}

function item(random, over = {}) {
  return {
    label: text(random, 3),
    note: maybe(random, 0.7, () => text(random, 12)),
    tag: maybe(random, 0.4, () => text(random, 3)),
    icon: maybe(random, 0.5, () => pick(random, ICONS)),
    ...over,
  };
}

const figure = (random) => {
  const roll = random();
  if (roll < 0.15) return String(between(random, 0, 9));
  if (roll < 0.3) return String(between(random, 1000, 99999));
  if (roll < 0.4) return `${between(random, 0, 99)},${between(random, 0, 9)}`;
  if (roll < 0.5) return String(between(random, 1, 3000000));
  return String(between(random, 1, 999));
};

const BUILDERS = {
  cards(random, count) {
    const emph = emphasisFor(random, count);
    return {
      attrs: {},
      items: Array.from({ length: count }, (_, i) => ({ ...item(random), emphasis: emph(i) })),
    };
  },
  steps(random, count) {
    const emph = emphasisFor(random, count);
    return {
      attrs: {
        ...maybe(random, 0.5, () => ({
          conclusion: text(random, 9),
          'conclusion-note': maybe(random, 0.5, () => text(random, 8)) ?? undefined,
          'conclusion-icon': maybe(random, 0.5, () => pick(random, ICONS)) ?? undefined,
        })),
      },
      items: Array.from({ length: count }, (_, i) => ({
        ...item(random, { icon: null }),
        emphasis: emph(i),
      })),
    };
  },
  flow(random, count) {
    // Roles come from order: items before the emphasised one are sources, after it
    // outcomes. count is the whole row; the hub sits after 1 to 4 sources.
    const sources = Math.max(0, Math.min(4, between(random, 0, count - 1)));
    return {
      attrs: {},
      items: Array.from({ length: count }, (_, i) => ({
        ...item(random),
        emphasis: i === sources,
      })),
    };
  },
  bars(random, count) {
    const grouped = random() < 0.4;
    const groups = grouped ? between(random, 2, Math.max(2, Math.ceil(count / 2))) : 1;
    const perGroup = Math.max(1, Math.ceil(count / groups));
    const emph = emphasisFor(random, count);
    return {
      attrs: {
        unit:
          maybe(random, 0.6, () => pick(random, ['%', 'ms', 'k€', 'M€', 'jours', 'users'])) ??
          undefined,
        max: maybe(random, 0.2, () => String(between(random, 100, 5000))) ?? undefined,
      },
      items: Array.from({ length: count }, (_, i) => ({
        ...item(random, { icon: null }),
        note: grouped ? `Group ${Math.floor(i / perGroup) + 1}` : null,
        value: figure(random),
        emphasis: emph(i),
      })),
    };
  },
  matrix(random, count) {
    const columns = between(random, 2, 6);
    const emph = emphasisFor(random, count);
    return {
      attrs: {
        columns: Array.from({ length: columns }, () => text(random, 2)).join('|'),
        ...maybe(random, 0.4, () => ({
          statuses: `prod=${text(random, 2)}|none=${text(random, 3)}`,
        })),
      },
      items: Array.from({ length: count }, (_, i) => ({
        label: text(random, 3),
        level: Array.from({ length: columns }, () => pick(random, LEVELS)).join(' '),
        emphasis: emph(i),
      })),
    };
  },
  ranges(random, count) {
    const scale = between(random, 4, 60);
    return {
      attrs: {
        scale: String(scale),
        unit: pick(random, ['weeks', 'days', 'months', 'h']),
        caption: maybe(random, 0.5, () => text(random, 4)) ?? undefined,
      },
      items: Array.from({ length: count }, () => {
        const from = between(random, 0, scale - 1);
        const to = between(random, from, scale);
        const open = random() < 0.15;
        return {
          ...item(random, { icon: null }),
          from: open ? null : String(from),
          to: open ? null : String(to),
        };
      }),
    };
  },
  lanes(random, count) {
    return {
      attrs: {
        gate:
          maybe(random, 0.8, () => pick(random, ['STOP', 'FREEZE', 'RATE LIMIT', 'KILL SWITCH'])) ??
          undefined,
        trigger: maybe(random, 0.6, () => text(random, 5)) ?? undefined,
        passed: String(between(random, 0, 8)),
        blocked: String(between(random, 0, 8)),
      },
      items: Array.from({ length: count }, () => item(random)),
    };
  },
  units(random, count) {
    const total = pick(random, [1, 10, 24, 50, 100, 200, 400]);
    return {
      attrs: {
        total: String(total),
        columns: maybe(random, 0.5, () => String(between(random, 1, 40))) ?? undefined,
      },
      items: Array.from({ length: count }, (_, i) => ({
        ...item(random),
        value: String(between(random, 0, total)),
        emphasis: i === count - 1 && random() < 0.7,
      })),
    };
  },
};

/** One case from a seed and an index · same pair, same case, everywhere. Without
 *  `widths`, each shape is drawn at its own (`widthsFor`). */
export function generateCase(seed, index, only = KINDS, widths = undefined) {
  const random = mulberry32((seed * 1_000_003 + index * 7919) >>> 0);
  const kind = pick(random, only);
  const count = countFor(random, kind);
  const width = pick(random, widths ?? widthsFor(kind));
  const built = BUILDERS[kind](random, count);
  // Undefined attributes are dropped · a case is plain JSON.
  const attrs = Object.fromEntries(Object.entries(built.attrs).filter(([, v]) => v !== undefined));
  const items = built.items.map((it) =>
    Object.fromEntries(
      Object.entries(it).filter(([, v]) => v !== null && v !== undefined && v !== false),
    ),
  );
  return { id: `${seed}:${index}`, seed, index, kind, width, count, attrs, items };
}

/** The cases of one run. */
export function generateCases(seed, total, only = KINDS, widths = undefined) {
  return Array.from({ length: total }, (_, i) => generateCase(seed, i, only, widths));
}

/** HTML for a case · exactly what an author would write, so the bench drives the
 *  same path a deck does (attributes, not properties). */
export function caseMarkup(testCase) {
  const quote = (value) => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;');
  const attrs = Object.entries(testCase.attrs)
    .map(([name, value]) => ` ${name}="${quote(value)}"`)
    .join('');
  const items = testCase.items
    .map((it) => {
      const parts = Object.entries(it)
        .map(([name, value]) => (name === 'emphasis' ? ' emphasis' : ` ${name}="${quote(value)}"`))
        .join('');
      return `<deck-scene-item${parts}></deck-scene-item>`;
    })
    .join('');
  return `<deck-scene-${testCase.kind}${attrs}>${items}</deck-scene-${testCase.kind}>`;
}
