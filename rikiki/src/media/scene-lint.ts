// ════════════════════════════════════════════════════════════════
// RIKIKI · scene lint, what a scene draws silently instead of saying so
//
// A scene is forgiving on purpose: an item past the maximum is not drawn, a
// figure that is not a number is a flat bar, an icon it does not know is no icon,
// a status it does not know is "none". Each of those is a picture that looks
// finished and is wrong, and nothing on the slide says so.
//
// This is the pure part · it reads what the author wrote and names every such
// case, so `rikiki check` can report it. The same limits and the same readers
// as the drawing, so the lint cannot disagree with what is on screen.
// ════════════════════════════════════════════════════════════════

import { iconPath } from '../shared/icon-set.js';
import type { IntCode } from './diagram/intent.js';
import { readFigure } from './deck-scene-bars-layout.js';
import { MAX_OUTCOMES, MAX_SOURCES, flowRoles } from './deck-scene-flow-layout.js';
import { DEFAULT_PASSED, MAX_TOKENS, readCount } from './deck-scene-lanes-layout.js';
import {
  DEFAULT_TOTAL,
  MAX_COLUMNS,
  MAX_TOTAL,
  MIN_CELL,
  cellIsReadable,
  defaultColumns,
  panelWidth,
  readWhole,
} from './deck-scene-units-layout.js';
import { STATUSES, parseColumns } from './deck-scene-matrix-layout.js';
import { parseValue } from './deck-scene-ranges-layout.js';
import { MAX_SCENE_HEIGHT, SCENE_LIMITS } from './scene-layout.js';

export const SCENE_KINDS = [
  'cards',
  'steps',
  'flow',
  'bars',
  'matrix',
  'ranges',
  'lanes',
  'units',
] as const;
export type SceneKind = (typeof SCENE_KINDS)[number];

/** The kind of scene an element is, from its tag (`deck-scene-bars` → `bars`) ·
 *  null for a tag that is not one of ours, which then has nothing to lint. */
export function sceneKindOf(tagName: string): SceneKind | null {
  const kind = tagName.toLowerCase().replace(/^deck-scene-/, '');
  return (SCENE_KINDS as readonly string[]).includes(kind) ? (kind as SceneKind) : null;
}

/** An item as written · every attribute raw, null when absent. */
export interface ItemRecord {
  label: string | null;
  note: string | null;
  icon: string | null;
  tag: string | null;
  value: string | null;
  level: string | null;
  from: string | null;
  to: string | null;
  emphasis: boolean;
}

/** The attributes of `deck-scene-item`, which every scene accepts and none reads
 *  in full · the one element is the price of a single vocabulary. */
export const ITEM_ATTRIBUTES = [
  'label',
  'note',
  'icon',
  'tag',
  'value',
  'level',
  'from',
  'to',
  'emphasis',
] as const satisfies readonly (keyof ItemRecord)[];

/** What each scene reads of its items · kept equal to the code by a test that
 *  reads the scenes' sources, so an attribute can move without this going stale. */
export const SCENE_READS: Readonly<Record<SceneKind, readonly (typeof ITEM_ATTRIBUTES)[number][]>> =
  Object.freeze({
    cards: ['label', 'note', 'icon', 'tag', 'emphasis'],
    steps: ['label', 'note', 'tag', 'emphasis'],
    flow: ['label', 'note', 'icon', 'tag', 'emphasis'],
    bars: ['label', 'note', 'tag', 'value', 'emphasis'],
    matrix: ['label', 'level', 'emphasis'],
    ranges: ['label', 'note', 'tag', 'from', 'to'],
    lanes: ['label', 'note', 'icon', 'tag'],
    units: ['label', 'note', 'icon', 'value', 'emphasis'],
  });

/** Every code a scene or a diagram writes of itself (`data-scene-issues`), the
 *  intent findings apart (`INT_CODES`) · `rikiki check` lists, selects and
 *  configures them by this table (bin/lib/check-registry.mjs). */
export const SCENE_ISSUE_CODES = [
  'SCENE_ITEMS_DROPPED',
  'SCENE_ATTRIBUTE_IGNORED',
  'SCENE_TOO_FEW_ITEMS',
  'SCENE_ITEM_NO_LABEL',
  'SCENE_ICON_UNKNOWN',
  'SCENE_VALUE_INVALID',
  'SCENE_GRID_TOO_DENSE',
  'SCENE_TOO_TALL',
  'SCENE_LEVEL_INVALID',
  'SCENE_EMPHASIS_MANY',
  'SCENE_LABEL_LONG',
  'SCENE_NOTE_LONG',
  'SCENE_TEXT_TOO_LONG',
  'SCENE_ATTRIBUTE_INVALID',
  'SCENE_GROUP_SPLIT',
  'SCENE_VALUE_CLIPPED',
  'SCENE_LAYOUT_INVALID',
  'SCENE_REGION_TOO_NARROW',
  'SCENE_EMPHASIS_SCATTERED',
  'DG_ATTR_UNKNOWN',
  'DG_VALUE_INVALID',
  'DG_REF_UNKNOWN',
  'DG_NAME_DUPLICATE',
  'DG_EMPHASIS_MANY',
  'DG_CHILD_UNKNOWN',
  'DG_BUDGET',
  'DG_DEPTH',
  'DG_EMPTY',
  'DG_NO_FIT',
  'DG_MARK_PLACE',
  'DG_GATE_LANE_UNKNOWN',
  'DG_TOKENS_MANY',
  'DG_MOTION_CYCLE',
  'DG_MOTION_BUDGET',
  'DG_STATE_STEP',
  'DG_VALUE_RANGE',
  'DG_MORPH_CROWD',
  'DG_CURVE_POINTS',
  'DG_STEP_WORDS_UNSEEN',
  'DG_LINK_CROSSES',
  'DG_LABEL_BLOCKED',
  'DG_STORY_ATTR',
  'DG_MARK_EMPTY',
  'DG_TYPED_WIDE',
  'DG_ROWS_MISMATCH',
  'DG_STATUS_NO_TARGET',
  'DG_BAND_NO_CUT',
  'DG_TIMER_NO_VALUE',
  'DG_CHART_DATA',
  'DG_PANEL_PLACE',
  'DG_PANEL_APART',
  'DG_PANEL_INTENT',
  'DG_CAMERA_TARGET',
  'DG_CAMERA_ILLEGIBLE',
  'DG_CAMERA_STORY',
] as const;
export type SceneIssueCode = (typeof SCENE_ISSUE_CODES)[number] | IntCode;

/** One field that did not fit its box, as the drawing measured it · the item and
 *  the field are what an author fixes, the widths say by how much. */
export interface Overflow {
  item: string;
  /** `label`, `note`, `tag`, `figure`, `caption`… the text that did not fit. */
  field: string;
  text?: string;
  /** Width the text asked for at the size it was drawn, and the width it had. */
  measured?: number;
  budget?: number;
  size?: number;
}

export interface SceneIssue {
  code: SceneIssueCode;
  /** A defect draws a wrong picture · a warning draws a right one that reads badly. */
  severity: 'error' | 'warning';
  /** The items concerned, by label (by position when they have none). */
  items: string[];
  message: string;
  /** For `SCENE_TEXT_TOO_LONG` · each field that did not fit, with its measure. */
  fields?: Overflow[];
  /** What the scene was when it said so · the shape, its canvas width and its item
   *  count, so a reader can look up how much a field holds there. */
  scene?: { kind: string; width: number; count: number };
  /** What was measured, and what was needed · a diagram's intent says both. */
  measurement?: Record<string, unknown>;
  expected?: unknown;
  /** What to do about it, by name, with the numbers that size it · a diagram says it. */
  fix?: { action: string; [detail: string]: unknown };
}

/** The scene's own attributes the lint needs. */
export interface SceneContext {
  columns?: string | null;
  passed?: string | null;
  blocked?: string | null;
  total?: string | null;
  max?: string | null;
  height?: string | null;
  scale?: string | null;
  /** The scene's canvas width in units · the whole 1600 unless it is composed. */
  width?: number;
}

/** `SCENE_TEXT_TOO_LONG` from what the drawing measured · it names the field, so
 *  "shorten the label" is not said about a figure that is too wide. */
export function overflowIssue(
  kind: string,
  fields: Overflow[],
  scene?: { width: number; count: number },
): SceneIssue | null {
  if (!fields.length) return null;
  const names = fields.map((f) => `${f.item} · ${f.field}`);
  const detail = fields
    .filter((f) => f.measured !== undefined && f.budget !== undefined)
    .map(
      (f) =>
        `${f.item} · ${f.field} needs ${Math.round(f.measured ?? 0)} of ${Math.round(f.budget ?? 0)} units`,
    );
  return {
    code: 'SCENE_TEXT_TOO_LONG',
    severity: 'error',
    items: names,
    fields,
    ...(scene ? { scene: { kind, ...scene } } : {}),
    message: `a ${kind} scene could not fit ${names.join(', ')} even one size down · drawn anyway, past its box${detail.length ? ` (${detail.join('; ')})` : ''}`,
  };
}

/** A flow needs something to flow from, and a hub to flow into. */
const FLOW_MIN = 2;
const FLOW_MAX = MAX_SOURCES + 1 + MAX_OUTCOMES;

/** A label of five words is a sentence · the writing rule is one to three, and
 *  the margin keeps a name like "Explore The Vault" out of the report. */
const LABEL_MAX_WORDS = 4;

const SENTENCE_BREAK = /(?<=[.!?…])\s+(?=\p{Lu})/u;

const nameOf = (item: ItemRecord, index: number) => item.label?.trim() || `item ${index + 1}`;
const wordsOf = (text: string) => text.trim().split(/\s+/).filter(Boolean);

/** A drawing taller than a slide leaves room for · known only once it is drawn,
 *  so the element asks after rendering, with the height it came to. */
export function heightIssue(kind: string, height: number, items: number): SceneIssue | null {
  if (height <= MAX_SCENE_HEIGHT) return null;
  return {
    code: 'SCENE_TOO_TALL',
    severity: 'error',
    items: [`${items} ${items === 1 ? 'item' : 'items'}, ${Math.round(height)} units tall`],
    message: `a slide leaves room for about ${MAX_SCENE_HEIGHT} units and this ${kind} scene is taller · the slide clips it · fewer items, or split the slide`,
  };
}

/** Everything an author wrote that a scene would draw wrong or not at all. */
export function lintScene(
  kind: SceneKind,
  items: ItemRecord[],
  scene: SceneContext = {},
): SceneIssue[] {
  const issues: SceneIssue[] = [];
  const report = (
    code: SceneIssueCode,
    severity: SceneIssue['severity'],
    named: string[],
    message: string,
  ) => {
    if (named.length) issues.push({ code, severity, items: named, message });
  };
  const named = (pick: (item: ItemRecord, index: number) => boolean) =>
    items.flatMap((item, index) => (pick(item, index) ? [nameOf(item, index)] : []));

  lintCount(kind, items, report);

  report(
    'SCENE_ITEM_NO_LABEL',
    'error',
    named((item) => !item.label?.trim()),
    'an item has no label · the scene would draw it as an empty box',
  );
  report(
    'SCENE_ATTRIBUTE_IGNORED',
    'warning',
    items.flatMap((item, index) =>
      ignoredAttributes(kind, item).map((attribute) => `${nameOf(item, index)} · ${attribute}`),
    ),
    `a ${kind} scene does not read this attribute · it is dropped, and the picture does not change`,
  );
  report(
    'SCENE_ICON_UNKNOWN',
    'error',
    named((item) => !!item.icon && !iconPath(item.icon)),
    'the icon is not in the 24-glyph set · it draws nothing, silently',
  );

  if (kind === 'bars') {
    report(
      'SCENE_VALUE_INVALID',
      'error',
      named((item) => readFigure(item.value) === null),
      '`value` is missing or is not a number · the bar is drawn flat',
    );
    lintBars(items, scene, report, named);
  }
  if (kind === 'ranges') {
    report('SCENE_VALUE_INVALID', 'error', named(rangeIsInvalid), RANGE_MESSAGE);
    lintScale(scene, report, named);
  }
  if (kind === 'matrix') lintLevels(scene, report, named);
  if (kind === 'lanes') lintTokenCounts(scene, report);
  if (kind === 'units') lintUnits(items, scene, report, named);

  report(
    'SCENE_EMPHASIS_MANY',
    'warning',
    kind === 'bars' ? crowdedBarGroups(items) : crowdedScene(items),
    'more than one item is emphasised · the scene puts one forward, and two are none',
  );
  report(
    'SCENE_LABEL_LONG',
    'warning',
    named((item) => wordsOf(item.label ?? '').length > LABEL_MAX_WORDS),
    `a label past ${LABEL_MAX_WORDS} words reads as a sentence · one to three words, the detail goes in the note`,
  );
  report(
    'SCENE_NOTE_LONG',
    'warning',
    named((item) => (item.note ?? '').trim().split(SENTENCE_BREAK).length > 1),
    'a note of more than one sentence · the scene is read from the back of the room, one sentence each',
  );
  return issues;
}

/** Attributes written on an item that its scene never looks at. */
function ignoredAttributes(kind: SceneKind, item: ItemRecord) {
  const read: readonly string[] = SCENE_READS[kind];
  return ITEM_ATTRIBUTES.filter((attribute) => {
    const written = attribute === 'emphasis' ? item.emphasis : item[attribute] !== null;
    return written && !read.includes(attribute);
  });
}

const emphasised = (items: ItemRecord[]) =>
  items.flatMap((item, index) => (item.emphasis ? [nameOf(item, index)] : []));

/** The emphasised items when there is more than one, else none. */
const crowdedScene = (items: ItemRecord[]) => {
  const names = emphasised(items);
  return names.length > 1 ? names : [];
};

/** Bars sharing a `note` are one group, and each group puts one bar forward
 *  (the same series, emphasised in every period) · so the count is per group. */
function crowdedBarGroups(items: ItemRecord[]): string[] {
  const groups: ItemRecord[][] = [];
  for (const item of items) {
    const last = groups.at(-1);
    if (last && (last[0].note ?? '') === (item.note ?? '')) last.push(item);
    else groups.push([item]);
  }
  return groups.flatMap(crowdedScene);
}

type Reporter = (
  code: SceneIssueCode,
  severity: SceneIssue['severity'],
  named: string[],
  message: string,
) => void;

/** Items past the maximum are cut, and too few leave the shape without its point. */
function lintCount(kind: SceneKind, items: ItemRecord[], report: Reporter) {
  const labelOf = (item: ItemRecord) => nameOf(item, items.indexOf(item));
  if (kind === 'flow') {
    const roles = flowRoles(items, (item) => item.emphasis);
    const drawn = new Set<ItemRecord | undefined>([...roles.sources, roles.hub, ...roles.outcomes]);
    report(
      'SCENE_ITEMS_DROPPED',
      'error',
      items.filter((item) => !drawn.has(item)).map(labelOf),
      `a flow draws ${MAX_SOURCES} sources before the hub and ${MAX_OUTCOMES} outcomes after it at most · these are not drawn`,
    );
    if (items.length < FLOW_MIN) tooFew(report, items.length, FLOW_MIN, FLOW_MAX);
    return;
  }
  const { min, max } = SCENE_LIMITS[kind];
  report(
    'SCENE_ITEMS_DROPPED',
    'error',
    items.slice(max).map(labelOf),
    `a ${kind} scene draws at most ${max} items · these are not drawn`,
  );
  if (items.length < min) tooFew(report, items.length, min, max);
}

function tooFew(report: Reporter, count: number, min: number, max: number) {
  report(
    'SCENE_TOO_FEW_ITEMS',
    'error',
    [`${count} item${count === 1 ? '' : 's'}`],
    `the scene is built for ${min} to ${max} items · with ${count} it has nothing to compare`,
  );
}

/** A positive number when the author wrote one, `null` when absent, `false` when
 *  written and not usable · the scene reads `false` as absent and draws a default. */
function positiveNumber(text: string | null | undefined, read: (t: string) => number | null) {
  if (!text?.trim()) return null;
  const value = read(text);
  return value !== null && value > 0 ? value : false;
}

/** The scale of bars is `max`, the height of their area `height` · both read as
 *  the default when unusable, a value past `max` is cut at the top, and a note
 *  that comes back after another splits what the author meant as one group. */
function lintBars(
  items: ItemRecord[],
  scene: SceneContext,
  report: Reporter,
  named: (pick: (item: ItemRecord, index: number) => boolean) => string[],
) {
  const max = positiveNumber(scene.max, readFigure);
  const height = positiveNumber(scene.height, readFigure);
  report(
    'SCENE_ATTRIBUTE_INVALID',
    'error',
    [...(max === false ? ['max'] : []), ...(height === false ? ['height'] : [])],
    '`max` and `height` must be positive numbers · the scene drew its default instead',
  );
  report(
    'SCENE_VALUE_CLIPPED',
    'error',
    named((item) => {
      const value = readFigure(item.value);
      return value !== null && (value < 0 || (typeof max === 'number' && value > max));
    }),
    typeof max === 'number'
      ? `a value is outside the scale (0 to ${max}) · its bar stops at the edge · use non-negative values, or raise \`max\` for values above it`
      : 'a value is negative · the automatic scale starts at zero, so its bar stays flat · use non-negative values or a chart with a signed scale',
  );
  report(
    'SCENE_GROUP_SPLIT',
    'warning',
    splitNotes(items),
    'a note comes back after another · only neighbours with the same note share a group, so these are drawn as separate groups · keep the items of a group together',
  );
}

/** Notes that start more than one group. */
function splitNotes(items: ItemRecord[]): string[] {
  const seen = new Set<string>();
  const split = new Set<string>();
  let previous: string | null = null;
  for (const item of items) {
    const note = (item.note ?? '').trim();
    if (note && note !== previous && seen.has(note)) split.add(note);
    if (note) seen.add(note);
    previous = note;
  }
  return [...split];
}

/** The scale of ranges is `scale` · a bound past it sits at the edge. */
function lintScale(
  scene: SceneContext,
  report: Reporter,
  named: (pick: (item: ItemRecord, index: number) => boolean) => string[],
) {
  const scale = positiveNumber(scene.scale, (t) => parseValue(t));
  report(
    'SCENE_ATTRIBUTE_INVALID',
    'error',
    scale === false ? ['scale'] : [],
    '`scale` must be a positive number · the scene fitted the scale to the rows instead',
  );
  const past = (text: string | null) => {
    const value = parseValue(text);
    return value !== null && (value < 0 || (typeof scale === 'number' && value > scale));
  };
  report(
    'SCENE_VALUE_CLIPPED',
    'error',
    named((item) => past(item.from) || past(item.to)),
    typeof scale === 'number'
      ? `a bound is outside the scale (0 to ${scale}) · the bar stops at the edge · use non-negative bounds, or raise \`scale\` for bounds above it`
      : 'a bound is negative · the automatic scale starts at zero, so the bar stops at the edge · use non-negative bounds',
  );
}

const RANGE_MESSAGE =
  '`from` and `to` must be numbers when written, with `from` first · otherwise the bar lands where the scene guessed';

/** A row is a range, a point (`to` alone) or open (no `to`: a duration still to
 *  be fixed, drawn dashed) · all three are meant. What is not: a bound that is
 *  written and is not a number, which the scene reads as absent, or a range that
 *  ends before it starts, which it draws reversed. */
function rangeIsInvalid(item: ItemRecord): boolean {
  const from = parseValue(item.from);
  const to = parseValue(item.to);
  const wroteFrom = !!item.from?.trim();
  const wroteTo = !!item.to?.trim();
  if ((wroteFrom && from === null) || (wroteTo && to === null)) return true;
  return from !== null && to !== null && from > to;
}

/** `passed` and `blocked` are whole numbers of tokens · anything else is read as
 *  the default, and the story on the slide is not the one that was written. */
function lintTokenCounts(scene: SceneContext, report: Reporter) {
  const wrong = (['passed', 'blocked'] as const).filter(
    (name) => !readCount(scene[name], DEFAULT_PASSED).valid,
  );
  report(
    'SCENE_VALUE_INVALID',
    'error',
    wrong,
    `these must be whole numbers from 0 to ${MAX_TOKENS} · the scene drew its default instead`,
  );
}

/** A grid of units: `total` and `columns` are whole numbers in range, every panel
 *  says how many of its cells are lit and not more than the grid holds, and the
 *  cells stay big enough to count. */
function lintUnits(
  items: ItemRecord[],
  scene: SceneContext,
  report: Reporter,
  named: (pick: (item: ItemRecord, index: number) => boolean) => string[],
) {
  const total = readWhole(scene.total, DEFAULT_TOTAL, 1, MAX_TOTAL);
  const columns = readWhole(scene.columns, defaultColumns(total.value), 1, MAX_COLUMNS);
  const wrongScene = [...(total.valid ? [] : ['total']), ...(columns.valid ? [] : ['columns'])];
  report(
    'SCENE_VALUE_INVALID',
    'error',
    wrongScene,
    `\`total\` is a whole number from 1 to ${MAX_TOTAL} and \`columns\` from 1 to ${MAX_COLUMNS} · the scene drew its default instead`,
  );
  report(
    'SCENE_VALUE_INVALID',
    'error',
    named((item) => !readWhole(item.value, 0, 0, total.value).valid || !item.value?.trim()),
    `\`value\` is how many cells are lit, a whole number from 0 to ${total.value} · missing or out of range, the grid is drawn empty or full`,
  );
  report(
    'SCENE_GRID_TOO_DENSE',
    'error',
    columns.valid &&
      !cellIsReadable(total.value, columns.value, panelWidth(items.length, scene.width))
      ? [`${total.value} cells in ${columns.value} columns`]
      : [],
    `the cells are under ${MIN_CELL} units wide at this size · fewer cells, fewer columns would not help, fewer panels would`,
  );
}

/** One status word per column, each of them a status the scene knows. */
function lintLevels(
  scene: SceneContext,
  report: Reporter,
  named: (pick: (item: ItemRecord, index: number) => boolean) => string[],
) {
  const columns = parseColumns(scene.columns ?? undefined).length;
  const wordsIn = (item: ItemRecord) => wordsOf(item.level ?? '');
  const known = new Set<string>(STATUSES);
  report(
    'SCENE_LEVEL_INVALID',
    'error',
    named((item) => {
      const words = wordsIn(item);
      const wrongCount = columns > 0 && words.length !== columns;
      return wrongCount || words.some((word) => !known.has(word));
    }),
    `\`level\` needs one status per column${columns ? ` (${columns})` : ''}, each one of ${STATUSES.join(', ')} · a missing or unknown one is drawn as "none"`,
  );
}
