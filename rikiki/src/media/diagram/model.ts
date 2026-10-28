// ════════════════════════════════════════════════════════════════
// RIKIKI · diagram model, what an author wrote, read and checked
//
// `<deck-diagram>` holds marks (`dg-box`, `dg-text`, `dg-dot`, `dg-bar`,
// `dg-link`) and groups (`dg-group`) that choose how their children are placed.
// This module turns that markup into a tree and says what is wrong with the
// writing, before anything is measured or drawn: an attribute nobody reads, a
// link to a name that is not there, two things put forward.
//
// Pure: it reads a minimal view of an element (`ElementLike`), so the same code
// runs on a real DOM node in the browser and on a literal object in a test.
// ════════════════════════════════════════════════════════════════

import {
  COLUMNS_MAX,
  COLUMNS_MIN,
  PIE_SHAPES,
  SERIES_MAX,
  SLICES_MAX,
  SLICES_MIN,
  STEPS_MAX,
  STEPS_MIN,
  chartRow,
  figureValue,
} from './chart-words.js';
import { ACT_STEPS, actIndex, readActs } from './act.js';
import { composeTree } from './compose.js';
import { CURVE_MAX_POINTS, CURVE_MIN_POINTS } from './curve.js';
import type { IntCode, IntentPlan } from './intent.js';
import { GATE_AT, GATE_STATES, MAX_FLOW, SPEEDS } from './lanes.js';
import {
  MAX_PEOPLE,
  MAX_SCREEN_LINES,
  STATUS_STATES,
  SWITCH_STATES,
  TERMINAL_MAX_CHARS,
  linesOf,
} from './marks-words.js';
import { ENTERS, MAX_STEP } from './motion.js';
import { MAX_QUEUE } from './queue.js';
import {
  BEATS,
  PLAYS,
  STORY_ATTRIBUTES,
  STORY_MAX_BUDGET,
  isStoryDuration,
  readSeconds,
} from './story-words.js';

/** What the parser needs of an element · a DOM `Element` satisfies it as it is. */
export interface ElementLike {
  localName: string;
  getAttribute(name: string): string | null;
  hasAttribute(name: string): boolean;
  readonly children: ArrayLike<ElementLike>;
  /** The attribute names, to say which one is unknown · `Element.getAttributeNames`. */
  getAttributeNames(): string[];
}

export type MarkKind =
  | 'box'
  | 'text'
  | 'dot'
  | 'bar'
  | 'link'
  | 'group'
  | 'lane'
  | 'gate'
  | 'cursor'
  | 'meter'
  | 'queue'
  | 'curve'
  | 'state'
  | 'terminal'
  | 'table'
  | 'switch'
  | 'status'
  | 'timer'
  | 'band'
  | 'person'
  | 'screen'
  | 'counter'
  | 'pie'
  | 'columns'
  | 'waterfall'
  | 'panel'
  | 'camera';

export const MARK_TAGS: Readonly<Record<string, MarkKind>> = Object.freeze({
  'dg-box': 'box',
  'dg-text': 'text',
  'dg-dot': 'dot',
  'dg-bar': 'bar',
  'dg-link': 'link',
  'dg-group': 'group',
  'dg-lane': 'lane',
  'dg-gate': 'gate',
  'dg-cursor': 'cursor',
  'dg-meter': 'meter',
  'dg-queue': 'queue',
  'dg-curve': 'curve',
  'dg-state': 'state',
  'dg-terminal': 'terminal',
  'dg-table': 'table',
  'dg-switch': 'switch',
  'dg-status': 'status',
  'dg-timer': 'timer',
  'dg-band': 'band',
  'dg-person': 'person',
  'dg-screen': 'screen',
  'dg-counter': 'counter',
  'dg-pie': 'pie',
  'dg-columns': 'columns',
  'dg-waterfall': 'waterfall',
  'dg-panel': 'panel',
  'dg-camera': 'camera',
});

/** How a mark moves · read by every mark, the root excepted. */
export const MOTION_ATTRIBUTES = ['enter', 'after', 'step'] as const;

/** Read by every mark in a story (`play="enter"`) · its beat, what it goes with,
 *  how long it takes, and whether it pales on its beat. */
const STORY_SHARED = ['beat', 'with', 'duration', 'dim'] as const;

/** Read by every mark · how it moves, the part it plays in the intent of its
 *  diagram (`role`), its beat in a story, and the business object it stands for
 *  across the panels of a composition (`entity`, compose.ts). */
const SHARED_ATTRIBUTES = [...MOTION_ATTRIBUTES, 'role', ...STORY_SHARED, 'entity'] as const;

/** How the root lays its panels out (`compose`, compose.ts) · a mechanism beside its
 *  track at 1.65 to 1, a model beside its incident, a body over its time axis, a
 *  panel inside a panel, four widgets of a dashboard. */
export const COMPOSES = ['split', 'model-incident', 'body-axis', 'inset', 'dashboard'] as const;
export type Compose = (typeof COMPOSES)[number];

/** What a camera names for the whole picture, every panel in the frame. */
export const CAMERA_ALL = 'all';

/** `slide-id/panel.mark` → the slide a camera opens from and the mark it takes over ·
 *  null for anything else. */
export function readZoomFrom(text: string | undefined): { slide: string; mark: string } | null {
  const match = /^\s*([^/\s]+)\/([^/\s]+)\s*$/.exec(text ?? '');
  return match ? { slide: match[1]!, mark: match[2]! } : null;
}

/** A group or a panel · both hold marks and place them with their `layout`. */
export const isGroupLike = (node: { kind: MarkKind }): boolean =>
  node.kind === 'group' || node.kind === 'panel';

/** The attributes each mark reads · anything else is dropped without a word, so
 *  it is named. The table is the contract: the skill and the reference are
 *  generated from it. */
export const MARK_ATTRIBUTES: Readonly<Record<MarkKind, readonly string[]>> = Object.freeze({
  box: [
    'name',
    'label',
    'note',
    'tag',
    'icon',
    'value',
    'emphasis',
    'paint',
    'tone',
    'size',
    'swap',
    'swap-icon',
    'proof',
    ...SHARED_ATTRIBUTES,
  ],
  text: ['name', 'label', 'note', 'for', 'side', 'emphasis', 'tone', ...SHARED_ATTRIBUTES],
  dot: ['name', 'count', 'emphasis', 'tone', ...SHARED_ATTRIBUTES],
  bar: ['name', 'label', 'value', 'from', 'to', 'tag', 'emphasis', 'tone', ...SHARED_ATTRIBUTES],
  link: [
    'name',
    'from',
    'to',
    'label',
    'route',
    'dashed',
    'back',
    'flow',
    'speed',
    'steady',
    'turn',
    'lever',
    ...SHARED_ATTRIBUTES,
  ],
  group: [
    'name',
    'label',
    'layout',
    'direction',
    'columns',
    'align',
    'gap',
    'paint',
    'tone',
    'weights',
    'wrap',
    // A row, a column or a ring inside the drawing chains its children like the
    // root does · it was dropped here, and a sequence nested in a column lost its
    // arrows.
    'link',
    ...SHARED_ATTRIBUTES,
  ],
  lane: ['name', 'label', 'note', 'icon', 'flow', 'speed', 'tone', 'steady', ...SHARED_ATTRIBUTES],
  gate: ['name', 'label', 'over', 'at', 'by', 'state', ...SHARED_ATTRIBUTES],
  cursor: ['name', 'label', 'value', 'tone', ...SHARED_ATTRIBUTES],
  meter: [
    'name',
    'label',
    'value',
    'max',
    'unit',
    'threshold',
    'tone',
    'emphasis',
    ...SHARED_ATTRIBUTES,
  ],
  queue: ['name', 'label', 'count', 'fill', 'tone', 'emphasis', ...SHARED_ATTRIBUTES],
  curve: [
    'name',
    'label',
    'values',
    'ticks',
    'max',
    'unit',
    'threshold',
    'tone',
    'emphasis',
    ...SHARED_ATTRIBUTES,
  ],
  // A state is a place in the tree whose content changes on a click · its marks
  // say how they look, the state only says from which click.
  state: ['step', 'role'],
  // The marks that tell a story in their own words (marks.ts) · `lines`, `rows` and a
  // table's `swap` are written one item per line of the attribute.
  terminal: ['name', 'label', 'lines', 'tone', 'emphasis', ...SHARED_ATTRIBUTES],
  table: [
    'name',
    'label',
    'icon',
    'rows',
    'swap',
    'strike',
    'from',
    'paint',
    'tone',
    'emphasis',
    ...SHARED_ATTRIBUTES,
  ],
  switch: ['name', 'label', 'state', 'on', 'off', 'emphasis', ...SHARED_ATTRIBUTES],
  status: ['name', 'for', 'state', 'label', 'note', 'side', ...SHARED_ATTRIBUTES],
  timer: ['name', 'label', 'value', 'unit', 'tone', 'emphasis', ...SHARED_ATTRIBUTES],
  band: [
    'name',
    'label',
    'note',
    'from',
    'to',
    'cut',
    'until',
    'tag',
    'brace',
    'tone',
    'steady',
    'emphasis',
    ...SHARED_ATTRIBUTES,
  ],
  person: ['name', 'label', 'count', 'absent', 'tone', 'emphasis', ...SHARED_ATTRIBUTES],
  screen: ['name', 'label', 'note', 'count', 'emphasis', ...SHARED_ATTRIBUTES],
  counter: ['name', 'label', 'value', 'from', 'unit', 'tone', 'emphasis', ...SHARED_ATTRIBUTES],
  // The charts (charts.ts) · `slices` and `columns` are written one item per line,
  // its words then its figures (`Juin 42 51`), `series` one name per line.
  pie: [
    'name',
    'label',
    'slices',
    'shape',
    'unit',
    'value',
    'note',
    'focus',
    'emphasis',
    ...SHARED_ATTRIBUTES,
  ],
  columns: [
    'name',
    'label',
    'columns',
    'series',
    'stacked',
    'max',
    'unit',
    'threshold',
    'focus',
    'emphasis',
    ...SHARED_ATTRIBUTES,
  ],
  waterfall: ['name', 'label', 'steps', 'total', 'unit', 'focus', 'emphasis', ...SHARED_ATTRIBUTES],
  // A sub-picture of a composition (compose.ts) · its surface says its part, its
  // marks are named locally and reached from outside as `panel.mark`.
  panel: [
    'name',
    'label',
    'layout',
    'direction',
    'columns',
    'align',
    'gap',
    'paint',
    'tone',
    'link',
    'wrap',
    ...SHARED_ATTRIBUTES,
  ],
  // A camera draws nothing · it frames a mark or a panel (`focus`), then moves to
  // another (`to`, `all` the whole picture) on its beat. camera.ts computes how.
  // `zoom-from="slide-id/mark"` opens on the frame of the slide before (camera.ts).
  camera: ['name', 'focus', 'zoom-from', 'to', 'beat', 'after', 'with', 'duration'],
});

/** Attributes read as one word per click (`value="45 72 96"`), the last holding. */
const PER_CLICK: Readonly<Partial<Record<MarkKind, readonly string[]>>> = Object.freeze({
  box: ['tone'],
  gate: ['state'],
  meter: ['value', 'tone'],
  queue: ['fill', 'tone'],
  switch: ['state'],
});

/** The words a `state` reads, by mark · a gate's, a switch's, a status's. */
const STATES_OF: Readonly<Partial<Record<MarkKind, readonly string[]>>> = Object.freeze({
  gate: GATE_STATES,
  switch: SWITCH_STATES,
  status: STATUS_STATES,
});

/** Marks drawn only by one layout · a lane and a gate by `lanes`, a cursor by `axis`. */
const DRAWN_BY: Readonly<Partial<Record<MarkKind, Layout>>> = Object.freeze({
  lane: 'lanes',
  gate: 'lanes',
  cursor: 'axis',
});

/** What a root may say, beside its children · the bounds and the global treatment. */
export const ROOT_ATTRIBUTES: readonly string[] = Object.freeze([
  'intent',
  'also',
  'compose',
  'layout',
  'direction',
  'columns',
  'align',
  'gap',
  'paint',
  'weights',
  'wrap',
  'link',
  'bounds',
  'max-marks',
  'balance',
  'play',
  'budget',
  // The motifs of the deck (act.ts, deck-motifs.ts) · the strip of the act and the
  // step it is at, the slide of the remedy an incident pairs with.
  'acts',
  'act',
  'pair',
  'frame-width',
  'playing',
  'data-testid',
  'id',
  'class',
  'style',
  'slot',
]);

export const LAYOUTS = ['row', 'column', 'grid', 'layers', 'ring', 'lanes', 'axis'] as const;
export type Layout = (typeof LAYOUTS)[number];

/** The surfaces · `none` to `inverse` say how strong a surface is, the five after
 *  them say the part it plays, each with an icon in a disc of its colour: `pale` the
 *  context, `gold` the control, `ink` the target, `ok` what is sound, `bad` the
 *  incident. */
export const ROLE_PAINTS = ['pale', 'gold', 'ink', 'ok', 'bad'] as const;

/** On a surface that says its part, the tone is its state, drawn as the surface of
 *  that state: sound, the control that acts, the incident, what stepped back. */
const ROLE_OF_TONE: Readonly<Record<string, string>> = Object.freeze({
  ok: 'ok',
  warn: 'gold',
  accent: 'gold',
  danger: 'bad',
  muted: 'pale',
});

/** The part a surface plays at a tone · none for a surface that does not say one. */
export function roleOf(paint: string, tone: string): string | undefined {
  if (!(ROLE_PAINTS as readonly string[]).includes(paint)) return undefined;
  return ROLE_OF_TONE[tone] ?? paint;
}
export const PAINTS = ['none', 'outline', 'soft', 'solid', 'inverse', ...ROLE_PAINTS] as const;
export type Paint = (typeof PAINTS)[number];

export const TONES = ['normal', 'muted', 'accent', 'ok', 'warn', 'danger'] as const;
export const SIZES = ['small', 'normal', 'large'] as const;
export const GAPS = ['tight', 'normal', 'airy'] as const;
export const SIDES = ['top', 'right', 'bottom', 'left'] as const;
export const ROUTES = ['straight', 'ortho'] as const;
export const DIRECTIONS = ['right', 'down'] as const;
export const ALIGNS = ['start', 'center', 'end', 'stretch'] as const;

/** The hard ceilings · an author can tighten them (`max-marks`), never lift them. */
export const MAX_MARKS = 500;
export const MAX_DOTS = 400;
export const MAX_GROUP_DEPTH = 3;

export interface DgNode {
  kind: MarkKind;
  /** Attributes as written · `emphasis` and `dashed` are `'true'` when present. */
  attrs: Readonly<Record<string, string>>;
  children: DgNode[];
  /** Position in the source, depth first · what ties a tie. */
  index: number;
}

export type DgCode =
  | 'DG_ATTR_UNKNOWN'
  | 'DG_VALUE_INVALID'
  | 'DG_REF_UNKNOWN'
  | 'DG_NAME_DUPLICATE'
  | 'DG_EMPHASIS_MANY'
  | 'DG_CHILD_UNKNOWN'
  | 'DG_BUDGET'
  | 'DG_DEPTH'
  | 'DG_EMPTY'
  | 'DG_MARK_PLACE'
  | 'DG_GATE_LANE_UNKNOWN'
  | 'DG_TOKENS_MANY'
  | 'DG_MOTION_CYCLE'
  | 'DG_MOTION_BUDGET'
  | 'DG_STATE_STEP'
  | 'DG_VALUE_RANGE'
  | 'DG_MORPH_CROWD'
  | 'DG_CURVE_POINTS'
  | 'DG_STEP_WORDS_UNSEEN'
  | 'DG_LINK_CROSSES'
  | 'DG_LABEL_BLOCKED'
  | 'DG_STORY_ATTR'
  | 'DG_MARK_EMPTY'
  | 'DG_TYPED_WIDE'
  | 'DG_ROWS_MISMATCH'
  | 'DG_STATUS_NO_TARGET'
  | 'DG_BAND_NO_CUT'
  | 'DG_TIMER_NO_VALUE'
  | 'DG_CHART_DATA'
  | 'DG_PANEL_PLACE'
  | 'DG_PANEL_APART'
  | 'DG_PANEL_INTENT'
  | 'DG_CAMERA_TARGET'
  | 'DG_CAMERA_ILLEGIBLE'
  | 'DG_CAMERA_STORY';

export interface DgIssue {
  code: DgCode | IntCode;
  severity: 'error' | 'warning';
  /** The marks concerned, by name or position. */
  items: string[];
  message: string;
  /** What was measured, and what the intent needed · said by the `INT_*` findings. */
  measurement?: Record<string, unknown>;
  expected?: unknown;
  fix?: { action: string; [detail: string]: unknown };
}

/** An attribute list as a set of words · `from="web app"` names two marks. */
export const words = (value: string | undefined): string[] =>
  (value ?? '').split(/\s+/).filter(Boolean);

const nameOf = (node: DgNode) =>
  node.attrs.name || node.attrs.label || `${node.kind} ${node.index + 1}`;

interface ParseState {
  index: number;
  issues: DgIssue[];
}

function readAttributes(
  element: ElementLike,
  kind: MarkKind | 'root',
  state: ParseState,
): Record<string, string> {
  const allowed = kind === 'root' ? ROOT_ATTRIBUTES : MARK_ATTRIBUTES[kind];
  const attrs: Record<string, string> = {};
  const unknown: string[] = [];
  for (const name of element.getAttributeNames()) {
    // Global attributes, and the `data-*` a scene writes about itself, are not the
    // author's to get wrong.
    if (
      name === 'id' ||
      name === 'class' ||
      name === 'style' ||
      name === 'slot' ||
      name === 'lang' ||
      name === 'playing' ||
      name.startsWith('data-')
    )
      continue;
    if (!allowed.includes(name)) {
      unknown.push(name);
      continue;
    }
    attrs[name] = element.getAttribute(name) ?? '';
  }
  if (unknown.length) {
    state.issues.push({
      code: 'DG_ATTR_UNKNOWN',
      severity: 'warning',
      items: unknown.map((name) => `${element.localName} · ${name}`),
      message: `${element.localName} does not read ${unknown.join(', ')} · dropped, and the picture does not change · it reads ${allowed.join(', ')}`,
      fix: { action: 'remove-attributes', attributes: unknown },
    });
  }
  return attrs;
}

/** Panels nest this deep at most · a scope inside a scope inside a scope, the rings
 *  of a zoom from the code to the client. A panel is a sub-picture, not a group: the
 *  groups inside it nest as deep as they do at the root. */
export const MAX_PANEL_DEPTH = 4;

function parseChildren(
  parent: ElementLike,
  depth: number,
  state: ParseState,
  panels = 0,
): DgNode[] {
  const nodes: DgNode[] = [];
  for (const child of Array.from(parent.children)) {
    const kind = MARK_TAGS[child.localName];
    if (!kind) {
      // Notes, comments and scripts are not marks and are not the author's mistake.
      if (child.localName === 'deck-notes' || child.localName === 'script') continue;
      state.issues.push({
        code: 'DG_CHILD_UNKNOWN',
        severity: 'error',
        items: [child.localName],
        message: `<${child.localName}> is not a mark · only ${Object.keys(MARK_TAGS).join(', ')} go in a diagram · it is not drawn`,
        fix: { action: 'remove-child', child: child.localName },
      });
      continue;
    }
    const node: DgNode = { kind, attrs: {}, children: [], index: state.index };
    state.index += 1;
    const attrs = readAttributes(child, kind, state);
    if (child.hasAttribute('emphasis')) attrs.emphasis = 'true';
    if (child.hasAttribute('dashed')) attrs.dashed = 'true';
    if (child.hasAttribute('back')) attrs.back = 'true';
    if (child.hasAttribute('dim')) attrs.dim = 'true';
    if (child.hasAttribute('lever')) attrs.lever = 'true';
    (node as { attrs: Record<string, string> }).attrs = attrs;
    // A state holds the marks of one click in place of its siblings' · it is not a
    // group, so it adds no depth.
    if (kind === 'state') node.children = parseChildren(child, depth, state, panels);
    else if (kind === 'panel') {
      if (panels >= MAX_PANEL_DEPTH) {
        state.issues.push({
          code: 'DG_DEPTH',
          severity: 'error',
          items: [nameOf(node)],
          message: `panels nest ${MAX_PANEL_DEPTH} deep at most · this one is deeper`,
          fix: { action: 'flatten', maxDepth: MAX_PANEL_DEPTH },
        });
      } else node.children = parseChildren(child, 0, state, panels + 1);
    } else if (kind === 'group') {
      if (depth >= MAX_GROUP_DEPTH) {
        state.issues.push({
          code: 'DG_DEPTH',
          severity: 'error',
          items: [nameOf(node)],
          message: `groups nest ${MAX_GROUP_DEPTH} deep at most · this one is deeper`,
          fix: { action: 'flatten', maxDepth: MAX_GROUP_DEPTH },
        });
      } else {
        node.children = parseChildren(child, depth + 1, state, panels);
      }
    }
    nodes.push(node);
  }
  return nodes;
}

const walk = (nodes: DgNode[], visit: (node: DgNode) => void): void => {
  for (const node of nodes) {
    visit(node);
    walk(node.children, visit);
  }
};

function oneOf(
  value: string | undefined,
  allowed: readonly string[],
  where: string,
  attribute: string,
  state: ParseState,
): void {
  if (value === undefined || value === '' || allowed.includes(value)) return;
  state.issues.push({
    code: 'DG_VALUE_INVALID',
    severity: 'error',
    items: [`${where} · ${attribute}="${value}"`],
    message: `${attribute} is one of ${allowed.join(', ')} · "${value}" is not · the default is used`,
    fix: { action: 'set-attribute', attribute, oneOf: [...allowed] },
  });
}

/** A click is a whole number from 1 · 0 is the slide being entered, which needs no word. */
function checkStep(value: string | undefined, where: string, state: ParseState): void {
  if (value === undefined || value === '') return;
  const step = Number(value);
  if (Number.isInteger(step) && step >= 1 && step <= MAX_STEP) return;
  state.issues.push({
    code: 'DG_VALUE_INVALID',
    severity: 'error',
    items: [`${where} · step="${value}"`],
    message: `step is the click a mark appears on, a whole number from 1 to ${MAX_STEP} · "${value}" is not · it appears on entry`,
    fix: { action: 'set-attribute', attribute: 'step', from: 1, to: MAX_STEP },
  });
}

/** Tokens are counted, not measured · a whole number, and few enough to count. */
function checkFlow(node: DgNode, where: string, state: ParseState): void {
  const value = node.attrs.flow;
  if (value === undefined || value === '') return;
  const flow = Number(value);
  if (!Number.isInteger(flow) || flow < 0) {
    state.issues.push({
      code: 'DG_VALUE_INVALID',
      severity: 'error',
      items: [`${where} · flow="${value}"`],
      message: `flow is how many tokens travel, a whole number · "${value}" is not · none travel`,
      fix: { action: 'set-attribute', attribute: 'flow', from: 0, to: MAX_FLOW },
    });
  } else if (flow > MAX_FLOW) {
    state.issues.push({
      code: 'DG_TOKENS_MANY',
      severity: 'error',
      items: [`${where} · flow="${value}"`],
      message: `${flow} tokens on one ${node.kind}, over ${MAX_FLOW} · a queue nobody counts · ${MAX_FLOW} are drawn`,
      fix: { action: 'set-attribute', attribute: 'flow', keep: MAX_FLOW },
    });
  }
}

/** A lane and a gate are drawn by a `lanes` group, a cursor by an `axis` · placed
 *  anywhere else they are drawn as a plain text, and said. A gate crosses lanes of
 *  its own group, named in `over`. */
function checkPlacement(nodes: DgNode[], layout: string, state: ParseState): void {
  const misplaced: string[] = [];
  const unknownLanes: string[] = [];
  const laneNames = new Set(
    nodes
      .flatMap((n) => (n.kind === 'state' ? n.children : [n]))
      .filter((n) => n.kind === 'lane')
      .map((n) => n.attrs.name)
      .filter(Boolean),
  );
  for (const node of nodes) {
    const home = DRAWN_BY[node.kind];
    if (home && home !== layout)
      misplaced.push(`${node.kind} ${nameOf(node)} · in ${layout}, drawn by ${home}`);
    if (node.kind === 'gate' && layout === 'lanes')
      for (const lane of words(node.attrs.over)) if (!laneNames.has(lane)) unknownLanes.push(lane);
    if (isGroupLike(node)) checkPlacement(node.children, node.attrs.layout ?? 'row', state);
    // A state's marks are placed by the group that holds the state.
    if (node.kind === 'state') checkPlacement(node.children, layout, state);
  }
  if (misplaced.length)
    state.issues.push({
      code: 'DG_MARK_PLACE',
      severity: 'error',
      items: misplaced,
      message:
        'a dg-lane and a dg-gate go in a group with layout="lanes", a dg-cursor in one with layout="axis" · elsewhere they are drawn as a plain text',
      fix: { action: 'move-into', layouts: { lane: 'lanes', gate: 'lanes', cursor: 'axis' } },
    });
  if (unknownLanes.length)
    state.issues.push({
      code: 'DG_GATE_LANE_UNKNOWN',
      severity: 'error',
      items: unknownLanes,
      message: `a gate stands across lanes of its own group, by name · ${unknownLanes.map((l) => `"${l}"`).join(', ')} is not one · the gate crosses the lanes it can find`,
      fix: { action: 'name-the-lanes', known: [...laneNames] },
    });
}

/** `after` that comes back to itself waits for ever · named, then played as written order. */
function checkCycles(nodes: DgNode[], state: ParseState): void {
  const after = new Map<string, string[]>();
  walk(nodes, (node) => {
    if (node.attrs.name && node.attrs.after) after.set(node.attrs.name, words(node.attrs.after));
  });
  const looping = new Set<string>();
  const visit = (name: string, path: string[]): void => {
    if (path.includes(name)) {
      for (const n of path.slice(path.indexOf(name))) looping.add(n);
      return;
    }
    for (const next of after.get(name) ?? []) visit(next, [...path, name]);
  };
  for (const name of after.keys()) visit(name, []);
  if (looping.size)
    state.issues.push({
      code: 'DG_MOTION_CYCLE',
      severity: 'error',
      items: [...looping],
      message: `${[...looping].join(', ')} wait for each other through after · nothing can start, so they come in reading order`,
      fix: { action: 'break-the-loop', names: [...looping] },
    });
}

/** How many clicks the diagram takes · the highest `step` (a state's included), or
 *  the last word of a per-click list (`state="open closed"` closes on the first
 *  click, `value="45 72 96"` changes twice). */
function stagesOf(nodes: DgNode[]): number {
  let stages = 0;
  walk(nodes, (node) => {
    const step = Number(node.attrs.step);
    if (Number.isInteger(step) && step >= 1 && step <= MAX_STEP) stages = Math.max(stages, step);
    for (const attribute of PER_CLICK[node.kind] ?? [])
      stages = Math.max(stages, Math.min(MAX_STEP, words(node.attrs[attribute]).length - 1));
  });
  return stages;
}

/** Whether a tree holds a `dg-state` anywhere · then a click is a change of picture. */
const holdsState = (node: DgNode): boolean =>
  node.kind === 'state' || node.children.some(holdsState);

/** The click a state stands from · the first of a place needs no `step`. */
const stateStep = (node: DgNode): number => {
  const step = Number(node.attrs.step);
  return Number.isInteger(step) && step > 0 ? step : 0;
};

/** The tree as it stands on click `stage` · where siblings are `dg-state`s, the one
 *  whose `step` was reached last stands in their place, and the others are not
 *  there. A tree without states is returned as it is. */
export function treeAt(nodes: DgNode[], stage: number): DgNode[] {
  if (!nodes.some(holdsState)) return nodes;
  const reached = nodes.filter((n) => n.kind === 'state' && stateStep(n) <= stage);
  const standing = reached.reduce<DgNode | undefined>(
    (best, n) => (!best || stateStep(n) > stateStep(best) ? n : best),
    undefined,
  );
  return nodes.flatMap((node) => {
    if (node.kind === 'state') return node === standing ? treeAt(node.children, stage) : [];
    if (!node.children.some(holdsState)) return [node];
    return [{ ...node, children: treeAt(node.children, stage) }];
  });
}

/** Two states of one place on the same click · the later in the source is never shown. */
function checkStates(nodes: DgNode[], state: ParseState): void {
  const seen = new Map<number, number>();
  for (const node of nodes.filter((n) => n.kind === 'state')) {
    const step = stateStep(node);
    seen.set(step, (seen.get(step) ?? 0) + 1);
  }
  const clashing = [...seen].filter(([, count]) => count > 1).map(([step]) => step);
  if (clashing.length)
    state.issues.push({
      code: 'DG_STATE_STEP',
      severity: 'error',
      items: clashing.map((step) => `dg-state step="${step}"`),
      message: `two dg-state of one place stand from click ${clashing.join(', ')} · only the first is ever shown · each state after the first says its click with step`,
      fix: { action: 'set-attribute', attribute: 'step', distinct: true },
    });
  for (const node of nodes) if (node.children.length) checkStates(node.children, state);
}

/** The attributes a mark reads as a number · a box's `value` is a figure printed as
 *  written ("9 €", "−68 %"), not a number. */
const NUMBERS_OF: Readonly<Partial<Record<MarkKind, readonly string[]>>> = Object.freeze({
  bar: ['value', 'from', 'to'],
  dot: ['count'],
  cursor: ['value'],
  meter: ['max', 'threshold'],
  queue: ['count'],
  curve: ['max', 'threshold'],
  timer: ['value'],
  band: ['from', 'to', 'cut', 'until'],
  person: ['count'],
  screen: ['count'],
  counter: ['value', 'from'],
  columns: ['max', 'threshold'],
});

/** Attributes read as a list of numbers, one word each · a value on each click, or a
 *  curve's series, or how many people are missing before and after a beat. */
const NUMBERS_PER_CLICK: Readonly<Partial<Record<MarkKind, string>>> = Object.freeze({
  meter: 'value',
  queue: 'fill',
  curve: 'values',
  person: 'absent',
  table: 'strike',
});

/** A number as an author writes it · `1 200`, `72,5`. NaN when it is not one. */
export const readNumber = (text: string): number =>
  Number(text.replace(',', '.').replace(/\s/g, ''));

/** The maximum of a meter, 100 when unsaid. */
export const DEFAULT_METER_MAX = 100;

/** A meter fills against its maximum, a queue holds what it has places for · a
 *  value outside that range would draw a lie, so it is drawn at the bound, and said. */
function checkRanges(node: DgNode, where: string, state: ParseState): void {
  const outside: string[] = [];
  if (node.kind === 'meter') {
    const max = node.attrs.max ? readNumber(node.attrs.max) : DEFAULT_METER_MAX;
    if (!(max > 0)) outside.push(`max="${node.attrs.max}" is not above 0`);
    for (const value of words(node.attrs.value).map(readNumber))
      if (value < 0 || value > max) outside.push(`value ${value} outside 0 to ${max}`);
    const threshold = node.attrs.threshold ? readNumber(node.attrs.threshold) : 0;
    if (threshold < 0 || threshold > max)
      outside.push(`threshold ${threshold} outside 0 to ${max}`);
  }
  if (node.kind === 'curve') {
    const max = node.attrs.max ? readNumber(node.attrs.max) : Number.POSITIVE_INFINITY;
    if (!(max > 0)) outside.push(`max="${node.attrs.max}" is not above 0`);
    for (const value of words(node.attrs.values).map(readNumber))
      if (value < 0 || value > max) outside.push(`value ${value} outside 0 to ${max}`);
    const threshold = node.attrs.threshold ? readNumber(node.attrs.threshold) : 0;
    if (threshold < 0 || threshold > max)
      outside.push(`threshold ${threshold} outside 0 to ${max}`);
  }
  if (node.kind === 'columns' && node.attrs.max) {
    const max = readNumber(node.attrs.max);
    if (!(max > 0)) outside.push(`max="${node.attrs.max}" is not above 0`);
    const series = Math.max(1, linesOf(node.attrs.series).length);
    const stacked =
      node.attrs.stacked !== undefined && node.attrs.stacked !== 'false' && series > 1;
    for (const line of linesOf(node.attrs.columns)) {
      const row = chartRow(line, series);
      const values = row.figures.map(figureValue);
      for (const value of values) if (value > max) outside.push(`value ${value} above max ${max}`);
      const total = values.reduce((sum, value) => sum + Math.max(0, value), 0);
      if (stacked && total > max)
        outside.push(`stacked total ${total} above max ${max} for "${row.label}"`);
    }
    const threshold = node.attrs.threshold ? readNumber(node.attrs.threshold) : 0;
    if (threshold < 0 || threshold > max)
      outside.push(`threshold ${threshold} outside 0 to ${max}`);
  }
  if (node.kind === 'queue') {
    const count = node.attrs.count ? readNumber(node.attrs.count) : 0;
    if (!Number.isInteger(count) || count < 1 || count > MAX_QUEUE)
      outside.push(
        `count="${node.attrs.count ?? ''}" is not a whole number from 1 to ${MAX_QUEUE}`,
      );
    for (const fill of words(node.attrs.fill).map(readNumber))
      if (!Number.isInteger(fill) || fill < 0 || fill > count)
        outside.push(`fill ${fill} outside 0 to ${count}`);
  }
  if (node.kind === 'person') {
    const count = node.attrs.count ? readNumber(node.attrs.count) : 1;
    if (!Number.isInteger(count) || count < 1 || count > MAX_PEOPLE)
      outside.push(`count="${node.attrs.count}" is not a whole number from 1 to ${MAX_PEOPLE}`);
    for (const absent of words(node.attrs.absent).map(readNumber))
      if (!Number.isInteger(absent) || absent < 0 || absent > count)
        outside.push(`absent ${absent} outside 0 to ${count}`);
  }
  if (node.kind === 'screen' && node.attrs.count) {
    const count = readNumber(node.attrs.count);
    if (!Number.isInteger(count) || count < 1 || count > MAX_SCREEN_LINES)
      outside.push(
        `count="${node.attrs.count}" is not a whole number from 1 to ${MAX_SCREEN_LINES}`,
      );
  }
  if (outside.length)
    state.issues.push({
      code: 'DG_VALUE_RANGE',
      severity: 'error',
      items: outside.map((o) => `${where} · ${o}`),
      message: `${where}: ${outside.join('; ')} · drawn at the nearest bound, which is not what was written`,
      fix: {
        action: 'set-attribute',
        meter: 'each value from 0 to max',
        queue: `count from 1 to ${MAX_QUEUE}, each fill from 0 to count`,
        curve: 'each value and the threshold from 0 to max',
        columns: 'each value and the threshold from 0 to max, or no max',
        person: `count from 1 to ${MAX_PEOPLE}, each absent from 0 to count`,
        screen: `count from 1 to ${MAX_SCREEN_LINES}`,
      },
    });
}

/** What the marks that tell a story need to say anything · a terminal its lines, a
 *  table its rows (as many after a swap as before), a status the mark it is for, a
 *  band where it is cut, a timer the delay it runs, a counter its figure. Each is
 *  drawn as written, and what is missing or too long is said. */
function checkStoryMarks(node: DgNode, where: string, state: ParseState): void {
  const say = (code: DgCode, items: string[], message: string, fix: DgIssue['fix']) =>
    state.issues.push({ code, severity: 'error', items, message, fix });
  const { attrs } = node;
  if (node.kind === 'terminal') {
    const lines = linesOf(attrs.lines);
    if (!lines.length)
      say(
        'DG_MARK_EMPTY',
        [where],
        `${where} has no line · write lines, one per line of the attribute`,
        {
          action: 'set-attribute',
          attribute: 'lines',
        },
      );
    const wide = lines.filter((line) => [...line].length > TERMINAL_MAX_CHARS);
    if (wide.length)
      say(
        'DG_TYPED_WIDE',
        wide.map((line) => `${where} · "${line}"`),
        `${where}: ${wide.length} typed line${wide.length === 1 ? '' : 's'} over ${TERMINAL_MAX_CHARS} characters (${wide.map((l) => [...l].length).join(', ')}) · a terminal never wraps, so it is drawn wider than a slide holds one`,
        { action: 'shorten-lines', holds: TERMINAL_MAX_CHARS, or: 'split the line in two' },
      );
  }
  if (node.kind === 'table') {
    const rows = linesOf(attrs.rows);
    if (!rows.length)
      say(
        'DG_MARK_EMPTY',
        [where],
        `${where} has no row · write rows, one per line of the attribute`,
        {
          action: 'set-attribute',
          attribute: 'rows',
        },
      );
    const swapped = linesOf(attrs.swap);
    const struck = words(attrs.strike).map(readNumber);
    const wrong = [
      ...(attrs.swap !== undefined && swapped.length !== rows.length
        ? [`swap has ${swapped.length} rows for ${rows.length}`]
        : []),
      ...struck
        .filter((n) => Number.isFinite(n) && (!Number.isInteger(n) || n < 1 || n > rows.length))
        .map((n) => `strike ${n} is not a row from 1 to ${rows.length}`),
    ];
    if (wrong.length && rows.length)
      say(
        'DG_ROWS_MISMATCH',
        wrong.map((w) => `${where} · ${w}`),
        `${where}: ${wrong.join('; ')} · a row changes into one row, and a struck row is one of its rows`,
        { action: 'set-attribute', swap: 'one line per row', strike: 'row numbers from 1' },
      );
  }
  if (node.kind === 'status' && !attrs.for)
    say(
      'DG_STATUS_NO_TARGET',
      [where],
      `${where} is the state of a mark, and names none · it is not drawn · write for="name"`,
      { action: 'set-attribute', attribute: 'for' },
    );
  if (node.kind === 'band') {
    const [from, to, cut] = [attrs.from, attrs.to, attrs.cut].map((v) =>
      v === undefined ? Number.NaN : readNumber(v),
    ) as [number, number, number];
    const until = attrs.until === undefined ? to : readNumber(attrs.until);
    const holds = from < to && cut > from && cut < to && until > cut && until <= to;
    if (!holds)
      say(
        'DG_BAND_NO_CUT',
        [where],
        `${where} is a stretch of time cut once · it needs from < cut < until ≤ to (from="${attrs.from ?? ''}" to="${attrs.to ?? ''}" cut="${attrs.cut ?? ''}" until="${attrs.until ?? ''}") · without a cut it is a bar, a dg-bar on an axis says it`,
        { action: 'set-attribute', attributes: ['from', 'to', 'cut', 'until'] },
      );
  }
  if (node.kind === 'timer' && !(readNumber(attrs.value ?? '') > 0))
    say(
      'DG_TIMER_NO_VALUE',
      [where],
      `${where} runs for no delay · value="${attrs.value ?? ''}" · write the delay it stands for, value="5" unit="min"`,
      { action: 'set-attribute', attribute: 'value', with: 'unit' },
    );
  if (node.kind === 'counter' && !attrs.value)
    say('DG_MARK_EMPTY', [where], `${where} counts to no figure · write value`, {
      action: 'set-attribute',
      attribute: 'value',
    });
}

/** The charts, what each is written in and how many lines it reads. */
const CHARTS = {
  pie: { attribute: 'slices', least: SLICES_MIN, most: SLICES_MAX, what: 'parts' },
  columns: { attribute: 'columns', least: COLUMNS_MIN, most: COLUMNS_MAX, what: 'columns' },
  waterfall: { attribute: 'steps', least: STEPS_MIN, most: STEPS_MAX, what: 'steps' },
} as const;
type ChartKind = keyof typeof CHARTS;
const isChart = (kind: MarkKind): kind is ChartKind => kind in CHARTS;

/** What a waterfall needs to walk · it starts from a total, written with no sign,
 *  and never goes below 0 on its way. */
function walkProblems(rows: { label: string; figures: string[] }[]): string[] {
  const wrong: string[] = [];
  const start = rows[0]?.figures[0];
  if (start !== undefined && /^[+−-]/.test(start))
    wrong.push(`"${rows[0]!.label}" is where the walk starts, a total · write it with no sign`);
  let level = 0;
  for (const row of rows) {
    level += figureValue(row.figures[0] ?? '0');
    if (level < 0) {
      wrong.push(`the walk falls below 0 at "${row.label}"`);
      break;
    }
  }
  return wrong;
}

/** What a chart says has to read · a pie two to six parts of one figure each, above
 *  0; columns two to twelve, one figure per series each (one to three series), none
 *  below 0; a waterfall a total and its steps, one figure each; the part, the column
 *  or the step brought forward one of its own. Drawn as written otherwise, which
 *  does not read. */
function chartProblems(node: DgNode, kind: ChartKind): string[] {
  const { attribute, least, most, what } = CHARTS[kind];
  const series = kind === 'columns' ? Math.max(1, linesOf(node.attrs.series).length) : 1;
  const rows = linesOf(node.attrs[attribute]).map((line) => chartRow(line, series));
  const wrong: string[] = [];
  if (rows.length < least || rows.length > most)
    wrong.push(`${rows.length} ${what}, a dg-${kind} takes ${least} to ${most}`);
  if (series > SERIES_MAX) wrong.push(`${series} series, columns compare ${SERIES_MAX} at most`);
  for (const row of rows) {
    if (!row.label) wrong.push(`"${row.figures.join(' ')}" has no words before its figures`);
    if (row.figures.length !== series)
      wrong.push(
        `"${row.label}" has ${row.figures.length} figure${row.figures.length === 1 ? '' : 's'}, it needs ${series}`,
      );
    const values = row.figures.map(figureValue);
    if (kind !== 'waterfall' && values.some((v) => v < 0))
      wrong.push(`"${row.label}" is below 0 · a chart of parts and heights draws none`);
    if (kind === 'pie' && values.length === 1 && values[0] === 0)
      wrong.push(`"${row.label}" is 0 · a part of nothing is not drawn`);
  }
  if (kind === 'waterfall') wrong.push(...walkProblems(rows));
  const named = [...rows.map((row) => row.label), node.attrs.total?.trim()];
  const focus = node.attrs.focus?.trim();
  if (focus !== undefined && !named.includes(focus))
    wrong.push(`focus="${focus}" is none of its ${what}`);
  return wrong;
}

function checkChart(node: DgNode, where: string, state: ParseState): void {
  if (!isChart(node.kind)) return;
  oneOf(node.attrs.shape, PIE_SHAPES, where, 'shape', state);
  const wrong = chartProblems(node, node.kind);
  if (!wrong.length) return;
  const counts = {
    pie: { parts: [SLICES_MIN, SLICES_MAX], or: 'gather the smallest parts as "Autres"' },
    columns: { columns: [COLUMNS_MIN, COLUMNS_MAX], series: [1, SERIES_MAX] },
    waterfall: { steps: [STEPS_MIN, STEPS_MAX], start: 'a total with no sign, then +n or −n' },
  }[node.kind];
  state.issues.push({
    code: 'DG_CHART_DATA',
    severity: 'error',
    items: wrong.map((w) => `${where} · ${w}`),
    message: `${where}: ${wrong.join('; ')} · drawn as written, which does not read`,
    fix: {
      action: 'set-attribute',
      attribute: CHARTS[node.kind].attribute,
      write: 'one item per line, its words then its figures (Juin 42 51)',
      ...counts,
    },
  });
}

/** A curve is a shape · two values at least, twelve at most, and the words under it
 *  one per value or the first and the last. */
function checkCurve(node: DgNode, where: string, state: ParseState): void {
  if (node.kind !== 'curve') return;
  const count = words(node.attrs.values).length;
  const ticks = words(node.attrs.ticks).length;
  const wrong: string[] = [];
  if (count < CURVE_MIN_POINTS || count > CURVE_MAX_POINTS)
    wrong.push(`${count} values, a curve takes ${CURVE_MIN_POINTS} to ${CURVE_MAX_POINTS}`);
  if (ticks > 0 && ticks !== 2 && ticks !== count)
    wrong.push(
      `${ticks} words in ticks for ${count} values · one per value, or the first and the last`,
    );
  if (!wrong.length) return;
  state.issues.push({
    code: 'DG_CURVE_POINTS',
    severity: 'error',
    items: wrong.map((w) => `${where} · ${w}`),
    message: `${where}: ${wrong.join('; ')} · drawn as written, which does not read as a shape`,
    measurement: { values: count, ticks },
    expected: { values: [CURVE_MIN_POINTS, CURVE_MAX_POINTS], ticks: [0, 2, count] },
    fix: {
      action: 'set-attribute',
      attribute: count < CURVE_MIN_POINTS || count > CURVE_MAX_POINTS ? 'values' : 'ticks',
    },
  });
}

/** A per-click list is read from the slide's entry, one word per click, whatever
 *  click its mark appears on · a gate written `step="2" state="open closed"` shows
 *  `closed` on click 2 and its `open` is never seen. The reading is kept (the
 *  intents pad their lists to it), and the words lost are named with the list that
 *  shows them: the first word repeated up to the click the mark appears on. */
function checkLateWords(nodes: DgNode[], heldFrom: number, state: ParseState): void {
  for (const node of nodes) {
    const own = Number(node.attrs.step);
    const appears = Math.max(heldFrom, Number.isInteger(own) && own > 0 ? own : 0);
    if (node.kind === 'state') {
      checkLateWords(node.children, Math.max(heldFrom, stateStep(node)), state);
      continue;
    }
    for (const attribute of appears > 0 ? (PER_CLICK[node.kind] ?? []) : []) {
      const list = words(node.attrs[attribute]);
      const shown = list[Math.min(appears, list.length - 1)];
      const unseen = [...new Set(list.slice(0, appears))].filter((word) => word !== shown);
      const lost = unseen.filter((word) => !list.slice(appears).includes(word));
      if (!lost.length) continue;
      const write = [...Array<string>(appears).fill(list[0]!), ...list].join(' ');
      state.issues.push({
        code: 'DG_STEP_WORDS_UNSEEN',
        severity: 'warning',
        items: [`${node.kind} ${nameOf(node)} · ${attribute}="${list.join(' ')}"`],
        message: `${node.kind} ${nameOf(node)} appears on click ${appears}, and ${attribute} is read one word per click from the slide's entry · ${lost.map((w) => `"${w}"`).join(', ')} is never seen · to show the list from click ${appears}, write ${attribute}="${write}"`,
        measurement: { appears, words: list },
        fix: { action: 'pad-per-click', mark: nameOf(node), attribute, write },
      });
    }
    if (isGroupLike(node)) checkLateWords(node.children, appears, state);
  }
}

/** A duration of a story · seconds, above 0 and within the most a story lasts. */
function checkSeconds(
  value: string | undefined,
  where: string,
  attribute: string,
  state: ParseState,
) {
  if (value === undefined) return;
  const seconds = readSeconds(value);
  if (isStoryDuration(seconds)) return;
  state.issues.push({
    code: 'DG_VALUE_INVALID',
    severity: 'error',
    items: [`${where} · ${attribute}="${value}"`],
    message: `${attribute} is a duration of a story, from 0 to ${STORY_MAX_BUDGET}s ("3s", "800ms") · "${value}" is not · the diagram's own is used`,
    fix: { action: 'set-attribute', attribute, from: 0, to: STORY_MAX_BUDGET, unit: 's' },
  });
}

/** A story plays on entry and reads beats · a diagram that plays on clicks drops
 *  what only a story reads, and a story drops the clicks (`step`), which it does not
 *  have. `dg-state` and an `intent` are pictures of clicks: with them, `play` is
 *  dropped and the clicks play. Both are said. */
function checkStory(
  nodes: DgNode[],
  root: Readonly<Record<string, string>>,
  story: boolean,
  state: ParseState,
): void {
  oneOf(root.play, PLAYS, 'deck-diagram', 'play', state);
  checkSeconds(root.budget, 'deck-diagram', 'budget', state);
  const dropped: string[] = [];
  const clicks: string[] = [];
  const cameras: string[] = [];
  walk(nodes, (node) => {
    const where = `${node.kind} ${nameOf(node)}`;
    oneOf(node.attrs.beat, BEATS, where, 'beat', state);
    oneOf(node.attrs.turn, TONES, where, 'turn', state);
    checkSeconds(node.attrs.duration, where, 'duration', state);
    checkSeconds(node.attrs.steady, where, 'steady', state);
    if (story && node.attrs.step) clicks.push(`${where} · step`);
    if (node.kind === 'camera' && !story) cameras.push(where);
    else if (!story)
      for (const attribute of STORY_ATTRIBUTES)
        if (node.attrs[attribute] !== undefined) dropped.push(`${where} · ${attribute}`);
  });
  if (cameras.length)
    state.issues.push({
      code: 'DG_CAMERA_STORY',
      severity: 'warning',
      items: cameras,
      message: `a camera moves on the beats of a story (play="enter") · this diagram plays on clicks, so ${cameras.join(', ')} ${cameras.length === 1 ? 'is' : 'are'} dropped and the whole picture stands in the frame`,
      fix: {
        action: 'set-attribute',
        on: 'deck-diagram',
        attribute: 'play',
        value: 'enter',
        or: 'remove the dg-camera',
      },
    });
  if (root.play === 'enter' && !story)
    state.issues.push({
      code: 'DG_STORY_ATTR',
      severity: 'warning',
      items: ['deck-diagram · play'],
      message:
        'a story plays one scene on entry · an intent or dg-state are pictures of clicks, so play="enter" is dropped and the clicks play',
      fix: {
        action: 'remove-attributes',
        attributes: ['play'],
        or: 'write the marks without intent and dg-state',
      },
    });
  if (dropped.length)
    state.issues.push({
      code: 'DG_STORY_ATTR',
      severity: 'warning',
      items: dropped,
      message: `${dropped.join(', ')} ${dropped.length === 1 ? 'is' : 'are'} read only by a story (play="enter" on the diagram) · dropped, and the picture does not change`,
      fix: {
        action: 'set-attribute',
        on: 'deck-diagram',
        attribute: 'play',
        value: 'enter',
        or: 'remove-attributes',
      },
    });
  if (clicks.length)
    state.issues.push({
      code: 'DG_STORY_ATTR',
      severity: 'warning',
      items: clicks,
      message: `a story plays on entry, with no click · ${clicks.join(', ')} ${clicks.length === 1 ? 'is' : 'are'} not read · say when with beat, after and with`,
      fix: {
        action: 'remove-attributes',
        attributes: ['step'],
        use: 'beat="steady|event|spread|effect|proof"',
      },
    });
}

/** Values the marks read as words or numbers, checked against what they accept. */
function checkValues(nodes: DgNode[], root: Record<string, string>, state: ParseState): void {
  oneOf(root.layout, LAYOUTS, 'deck-diagram', 'layout', state);
  oneOf(root.compose, COMPOSES, 'deck-diagram', 'compose', state);
  oneOf(root.direction, DIRECTIONS, 'deck-diagram', 'direction', state);
  oneOf(root.gap, GAPS, 'deck-diagram', 'gap', state);
  oneOf(root.align, ALIGNS, 'deck-diagram', 'align', state);
  oneOf(root.paint, PAINTS, 'deck-diagram', 'paint', state);
  walk(nodes, (node) => {
    const where = `${node.kind} ${nameOf(node)}`;
    oneOf(node.attrs.layout, LAYOUTS, where, 'layout', state);
    oneOf(node.attrs.direction, DIRECTIONS, where, 'direction', state);
    oneOf(node.attrs.gap, GAPS, where, 'gap', state);
    oneOf(node.attrs.align, ALIGNS, where, 'align', state);
    oneOf(node.attrs.paint, PAINTS, where, 'paint', state);
    const tones = PER_CLICK[node.kind]?.includes('tone')
      ? words(node.attrs.tone)
      : [node.attrs.tone];
    for (const tone of tones) oneOf(tone, TONES, where, 'tone', state);
    oneOf(node.attrs.size, SIZES, where, 'size', state);
    oneOf(node.attrs.side, SIDES, where, 'side', state);
    oneOf(node.attrs.route, ROUTES, where, 'route', state);
    oneOf(node.attrs.enter, ENTERS, where, 'enter', state);
    oneOf(node.attrs.speed, Object.keys(SPEEDS), where, 'speed', state);
    oneOf(node.attrs.at, Object.keys(GATE_AT), where, 'at', state);
    for (const word of words(node.attrs.state))
      oneOf(word, STATES_OF[node.kind] ?? GATE_STATES, where, 'state', state);
    checkStoryMarks(node, where, state);
    checkStep(node.attrs.step, where, state);
    checkFlow(node, where, state);
    const perClick = NUMBERS_PER_CLICK[node.kind];
    const numbers = [
      ...(NUMBERS_OF[node.kind] ?? []).map((name) => ({ name, text: node.attrs[name] })),
      ...(perClick ? words(node.attrs[perClick]).map((text) => ({ name: perClick, text })) : []),
    ];
    const invalid = numbers.filter(
      ({ text }) => text !== undefined && text !== '' && !Number.isFinite(readNumber(text)),
    );
    for (const { name, text } of invalid) {
      state.issues.push({
        code: 'DG_VALUE_INVALID',
        severity: 'error',
        items: [`${where} · ${name}="${text}"`],
        message: `${name} is a number · "${text}" is not · the mark is drawn without it`,
        fix: { action: 'set-attribute', attribute: name },
      });
    }
    if (!invalid.length) checkRanges(node, where, state);
    checkCurve(node, where, state);
    checkChart(node, where, state);
  });
}

/** Every name a link or an annotation may point at · `name`, else a unique `label`. */
function namesOf(nodes: DgNode[], state: ParseState): Set<string> {
  const seen = new Set<string>();
  const dup = new Set<string>();
  walk(nodes, (node) => {
    const name = node.attrs.name;
    if (!name) return;
    if (seen.has(name)) dup.add(name);
    seen.add(name);
  });
  if (dup.size) {
    state.issues.push({
      code: 'DG_NAME_DUPLICATE',
      severity: 'error',
      items: [...dup],
      message: `these names are used by more than one mark · a link cannot tell which it means`,
      fix: { action: 'rename', names: [...dup] },
    });
  }
  return seen;
}

function checkReferences(nodes: DgNode[], names: Set<string>, state: ParseState): void {
  const missing = new Set<string>();
  walk(nodes, (node) => {
    const refs = [
      ...(node.kind === 'link' ? [...words(node.attrs.from), ...words(node.attrs.to)] : []),
      ...((node.kind === 'text' || node.kind === 'status') && node.attrs.for
        ? [node.attrs.for]
        : []),
      ...(node.kind === 'gate' && node.attrs.by ? [node.attrs.by] : []),
      ...(node.kind === 'table' && node.attrs.from ? [node.attrs.from] : []),
      ...(node.kind === 'camera'
        ? [
            ...words(node.attrs.focus),
            ...words(node.attrs.to),
            ...words(readZoomFrom(node.attrs['zoom-from'])?.mark),
          ].filter((n) => n !== CAMERA_ALL)
        : []),
      ...words(node.attrs.after),
      ...words(node.attrs.with),
    ];
    for (const ref of refs) if (!names.has(ref)) missing.add(ref);
  });
  if (missing.size) {
    state.issues.push({
      code: 'DG_REF_UNKNOWN',
      severity: 'error',
      items: [...missing],
      message: `no mark is named ${[...missing].map((m) => `"${m}"`).join(', ')} · a link, an annotation, a gate's \`by\` and an \`after\` point at a \`name\`, and that mark has none or does not exist · the link is not drawn, the wait is dropped`,
      fix: { action: 'name-the-mark', names: [...missing], known: [...names].slice(0, 12) },
    });
  }
}

/** One thing put forward · marks with `emphasis`, not counting a mark that repeats
 *  (`count`) or the marks of one group that are meant as a series. */
function checkEmphasis(nodes: DgNode[], state: ParseState): void {
  const emphasised: string[] = [];
  walk(nodes, (node) => {
    if (node.attrs.emphasis === 'true' && node.kind !== 'link') emphasised.push(nameOf(node));
  });
  if (emphasised.length > 1) {
    state.issues.push({
      code: 'DG_EMPHASIS_MANY',
      severity: 'warning',
      items: emphasised,
      message: `${emphasised.length} marks are put forward · the diagram puts one thing forward, and ${emphasised.length} are none`,
      fix: { action: 'one-emphasis', keep: 'the mark the title argues for' },
    });
  }
}

/** The cells a `dg-dot` stands for · its `count` read as the parser checks it, one
 *  when it is unsaid or no number (`DG_VALUE_INVALID`: drawn without it). */
export function dotCount(node: DgNode): number {
  const count = Math.floor(readNumber(node.attrs.count ?? '1'));
  return Number.isFinite(count) ? Math.max(1, count) : 1;
}

/** The `max-marks` an author wrote, when it is a whole number of marks · null otherwise. */
function askedCeiling(rootAttrs: Readonly<Record<string, string>>): number | null {
  const asked = Number(rootAttrs['max-marks']);
  return Number.isInteger(asked) && asked >= 1 ? asked : null;
}

/** The most marks a diagram may hold · `max-marks` tightens the ceiling, never lifts
 *  it, and one that is no whole number is said (`DG_VALUE_INVALID`) and left out. */
export function marksCeiling(rootAttrs: Readonly<Record<string, string>>): number {
  return Math.min(askedCeiling(rootAttrs) ?? MAX_MARKS, MAX_MARKS);
}

function checkCeiling(rootAttrs: Readonly<Record<string, string>>, state: ParseState): void {
  const written = rootAttrs['max-marks'];
  if (written === undefined || askedCeiling(rootAttrs) !== null) return;
  state.issues.push({
    code: 'DG_VALUE_INVALID',
    severity: 'error',
    items: [`deck-diagram · max-marks="${written}"`],
    message: `max-marks is a whole number of marks, 1 or more · "${written}" is not · the diagram's own ceiling of ${MAX_MARKS} is used`,
    fix: { action: 'set-attribute', attribute: 'max-marks' },
  });
}

/** The cells one grid of dots draws at most · past it, the first ones are drawn and
 *  `DG_BUDGET` says the rest are not. */
export const dotCeiling = (rootAttrs: Readonly<Record<string, string>>): number =>
  Math.min(MAX_DOTS, marksCeiling(rootAttrs));

function checkBudget(
  nodes: DgNode[],
  rootAttrs: Record<string, string>,
  state: ParseState,
): number {
  let marks = 0;
  let dots = 0;
  walk(nodes, (node) => {
    if (node.kind === 'link' || node.kind === 'camera') return;
    const repeat = node.kind === 'dot' ? dotCount(node) : 1;
    if (node.kind === 'dot') dots += repeat;
    marks += repeat;
  });
  const ceiling = marksCeiling(rootAttrs);
  const drawn = dotCeiling(rootAttrs);
  if (marks > ceiling || dots > MAX_DOTS) {
    state.issues.push({
      code: 'DG_BUDGET',
      severity: 'error',
      items: [dots > MAX_DOTS ? `${dots} dots` : `${marks} marks`],
      message:
        (dots > MAX_DOTS
          ? `${dots} dots, over ${MAX_DOTS} · the cells are too small to count`
          : `${marks} marks, over the ${ceiling} the diagram allows`) +
        (dots > drawn ? ` · a grid draws its first ${drawn} dots, not the others` : ''),
      fix: { action: 'remove-marks', keep: dots > MAX_DOTS ? MAX_DOTS : ceiling },
    });
  }
  return marks;
}

export interface ParsedDiagram {
  attrs: Readonly<Record<string, string>>;
  children: DgNode[];
  issues: DgIssue[];
  /** How many marks the diagram holds once repeats are counted. */
  marks: number;
  /** How many clicks it takes after the slide is entered · 0 for none. */
  stages: number;
  /** It holds `dg-state`s · each click is a picture of its own, and what two
   *  pictures share by name moves from one place to the other. */
  states: boolean;
  /** It plays one scene on entry (`play="enter"`, story.ts) · a per-click list is
   *  then the mark before and after its beat, and the slide takes no click. */
  story: boolean;
  /** What the diagram set out to demonstrate, and which marks play which part ·
   *  present when it was written with `intent` and compiled. */
  intent?: IntentPlan;
}

/** Turns a tree written as an intent into a tree of layouts · `intent.ts`. It runs
 *  before the writing is checked, so what it adds (links, waits, clicks) is checked
 *  like what the author wrote. `fresh` numbers the nodes it creates. */
export type CompileTree = (
  tree: { attrs: Record<string, string>; children: DgNode[] },
  fresh: () => number,
) => {
  attrs: Record<string, string>;
  children: DgNode[];
  issues: DgIssue[];
  intent?: IntentPlan;
};

/** Read a `<deck-diagram>` into a tree and name everything wrong with the writing ·
 *  compiled first when a compiler is given (`compileIntent`). */
export function parseDiagram(root: ElementLike, compile?: CompileTree): ParsedDiagram {
  const state: ParseState = { index: 0, issues: [] };
  let attrs = readAttributes(root, 'root', state);
  if (root.hasAttribute('balance')) attrs.balance = root.getAttribute('balance') ?? '';
  let children = parseChildren(root, 0, state);
  let intent: IntentPlan | undefined;
  // A composition qualifies the names of its panels before anything reads them, and
  // drops an intent it cannot hold (DG_PANEL_INTENT) · the compiler then only says
  // the roles that play no part.
  const composed = composeTree({ attrs, children });
  ({ attrs, children } = composed);
  state.issues.push(...composed.issues);
  if (compile) {
    const compiled = compile({ attrs, children }, () => state.index++);
    ({ attrs, children, intent } = compiled);
    state.issues.push(...compiled.issues);
  }
  if (!children.length) {
    state.issues.push({
      code: 'DG_EMPTY',
      severity: 'error',
      items: [],
      message: 'a diagram with no mark draws nothing',
      fix: { action: 'add-marks' },
    });
  }
  checkValues(children, attrs, state);
  checkStates(children, state);
  checkPlacement(children, attrs.layout ?? 'row', state);
  checkCycles(children, state);
  checkLateWords(children, 0, state);
  const stages = stagesOf(children);
  const states = children.some(holdsState);
  const story = attrs.play === 'enter' && !intent && !states;
  checkStory(children, attrs, story, state);
  checkMotifs(children, attrs, state);
  // Dropped, as said · a diagram that plays on clicks lays out no swap nor proof.
  if (!story)
    walk(children, (node) => {
      for (const attribute of STORY_ATTRIBUTES)
        delete (node.attrs as Record<string, string>)[attribute];
    });
  // Names, references, the thing put forward and the budget hold for the picture
  // of each click · two states may show the same mark, never twice at once.
  const pictures = states
    ? Array.from({ length: stages + 1 }, (_, stage) => treeAt(children, stage))
    : [children];
  let marks = 0;
  for (const picture of pictures) {
    const names = namesOf(picture, state);
    checkReferences(picture, names, state);
    checkEmphasis(picture, state);
    marks = Math.max(marks, checkBudget(picture, attrs, state));
  }
  checkCeiling(attrs, state);
  return {
    attrs,
    children,
    issues: once(state.issues),
    marks,
    stages,
    states,
    story,
    ...(intent ? { intent } : {}),
  };
}

/** The motifs a diagram declares for its deck · a strip whose step is one of its
 *  steps, a camera that opens from `slide-id/mark`. What they name on other slides
 *  is for `rikiki check` (deck-motifs.ts), which sees the whole deck. */
function checkMotifs(nodes: DgNode[], root: Readonly<Record<string, string>>, state: ParseState) {
  const steps = readActs(root.acts);
  const invalid = (items: string[], message: string, fix: DgIssue['fix']) =>
    state.issues.push({ code: 'DG_VALUE_INVALID', severity: 'error', items, message, fix });
  if (root.acts !== undefined && (steps.length < ACT_STEPS.min || steps.length > ACT_STEPS.max))
    invalid(
      [`deck-diagram · acts="${root.acts}"`],
      `acts names the steps of the act, ${ACT_STEPS.min} to ${ACT_STEPS.max}, separated by "·" · ${steps.length} ${steps.length === 1 ? 'is' : 'are'} written, and the strip is not drawn`,
      { action: 'set-attribute', attribute: 'acts', use: 'terminal · code · environnement' },
    );
  else if (root.acts !== undefined && actIndex(steps, root.act) < 0)
    invalid(
      [`deck-diagram · act="${root.act ?? ''}"`],
      `act says which step of acts the slide stands at · ${root.act === undefined ? 'it is not written' : `"${root.act}" is none of them`}, and the strip is not drawn`,
      { action: 'set-attribute', attribute: 'act', known: steps },
    );
  else if (root.act !== undefined && root.acts === undefined)
    invalid(
      ['deck-diagram · act'],
      'act is a step of the strip that acts writes · with no acts, there is no strip to stand on',
      { action: 'set-attribute', attribute: 'acts', use: 'the steps of the act, separated by "·"' },
    );
  walk(nodes, (node) => {
    const written = node.kind === 'camera' ? node.attrs['zoom-from'] : undefined;
    if (written === undefined) return;
    const where = `${node.kind} ${nameOf(node)}`;
    if (!readZoomFrom(written))
      invalid(
        [`${where} · zoom-from="${written}"`],
        `zoom-from is the slide the camera opens from and the mark both draw, "slide-id/mark" (a mark in a panel: "slide-id/panel.mark") · "${written}" is not, and the camera opens on the whole picture`,
        { action: 'set-attribute', attribute: 'zoom-from', use: 'slide-id/mark' },
      );
    else if (node.attrs.focus !== undefined)
      state.issues.push({
        code: 'DG_CAMERA_TARGET',
        severity: 'warning',
        items: [`${where} · focus`],
        message: `zoom-from opens on the frame of the slide before, and on its own mark when the slide is reached another way · focus says the same twice, and is read first`,
        fix: { action: 'remove-attributes', attributes: ['focus'], on: [nameOf(node)] },
      });
  });
}

/** Each finding once · the pictures of several clicks find the same ones. */
function once(issues: DgIssue[]): DgIssue[] {
  const seen = new Set<string>();
  return issues.filter((issue) => {
    const key = `${issue.code} ${issue.items.join('|')}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export { nameOf };
