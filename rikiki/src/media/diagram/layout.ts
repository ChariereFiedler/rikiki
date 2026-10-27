// ════════════════════════════════════════════════════════════════
// RIKIKI · diagram layout, from the tree an author wrote to where everything goes
//
// The one place that knows how a diagram is placed. It reads the tree of
// `model.ts`, measures every mark (with a `Meter`, so a test can use a fake font
// and the browser the real one), asks the engine each group names to place its
// children, routes the links, puts each annotation beside its target, and
// returns coordinates ready to draw. Pure: no DOM, no Lit, no font.
//
// What it will not do: remove a mark, shorten a text, or go under the type
// scale. When the marks cannot be placed in the box, it walks a fixed ladder
// (tighter gaps, another direction), and if nothing fits it says `unresolved`
// with the reasons and still returns a drawing · a hidden word is worse than a
// long one.
// ════════════════════════════════════════════════════════════════

import { type Fitted, TYPE, fitText } from '../scene-layout.js';
import { axis, axisScale } from './axis.js';
import { CURVE_MAX_WIDTH, CURVE_MIN_WIDTH, CURVE_PREF_WIDTH, curve, niceMax } from './curve.js';
import {
  GATE_AT,
  type GateAt,
  type GateState,
  MAX_FLOW,
  type Speed,
  type Token,
  gateCentre,
  naturalTrack,
  lanes as placeLaneRows,
  planRun,
} from './lanes.js';
import { layers } from './layers.js';
import { type LPiece, type TextEnv, isPiece, layPiece, moved, pieceBlock } from './marks.js';
import {
  METER_FIGURE_GAP,
  METER_MAX_WIDTH,
  METER_MIN_WIDTH,
  METER_PREF_WIDTH,
  meter,
  shareOf,
} from './meter.js';
import {
  type Compose,
  DEFAULT_METER_MAX,
  type DgIssue,
  type DgNode,
  type Layout,
  type Paint,
  type ParsedDiagram,
  ROLE_PAINTS,
  isGroupLike,
  nameOf,
  readNumber,
  treeAt,
  words,
} from './model.js';
import { MAX_QUEUE, QUEUE_CELL, QUEUE_MIN_CELL, queue, rowWidth } from './queue.js';
import { ring } from './ring.js';
import { grid, stack } from './stack.js';
import type { Block, Point } from './types.js';

/** `meter(size, weight)(text)` is the width of a text in drawing units. */
export type Meter = (size: number, weight: number) => (text: string) => number;

export type Density = 'tight' | 'normal' | 'airy';

/** Space between and inside marks, per density · the grid of 8 the scenes keep. */
const SPACING: Readonly<Record<Density, { gap: number; pad: number }>> = Object.freeze({
  tight: { gap: 16, pad: 16 },
  normal: { gap: 32, pad: 24 },
  airy: { gap: 56, pad: 36 },
});

/** A surface that says its part (`paint="pale|gold|ink|ok|bad"`) is a panel, not a
 *  chip · it keeps this much room inside at least, whatever the density. */
const ROLE_PAD = 30;

/** The room inside a box · its density's, more on a surface that says its part. */
const padOf = (ctx: Ctx, node: DgNode): number =>
  (ROLE_PAINTS as readonly string[]).includes(node.attrs.paint ?? '')
    ? Math.max(ctx.spacing.pad, ROLE_PAD)
    : ctx.spacing.pad;

const ICON_SIZE = 40;
const ICON_GAP = 14;
const LINE_AFTER_VALUE = 4;
const BEFORE_NOTE = 8;
const BEFORE_TAG = 12;
const MAX_BOX_WIDTH = 440;
const MAX_TEXT_WIDTH = 360;
const CELL_MIN = 12;
const CELL_MAX = 44;
const GRID_MAX_HEIGHT = 340;
const DOT_SIZE = 40;
const LEADER_GAP = 14;
const BAR_HEIGHT = 72;
const FRAME_CAPTION_GAP = 12;
const HUGE = 1_000_000;

export interface LText {
  lines: string[];
  size: number;
  weight: number;
  line: number;
  role: 'label' | 'note' | 'tag' | 'value' | 'caption' | 'proof';
  fits: boolean;
  /** Top-left of the first line's box · the renderer adds the baseline. */
  x: number;
  y: number;
}

export interface LBox {
  kind: 'box';
  key: string;
  node: DgNode;
  x: number;
  y: number;
  w: number;
  h: number;
  paint: Paint;
  /** The tone at rest, the last click's. */
  tone: string;
  /** The tone on each click, the last holding after · a box that turns on a click. */
  tones: string[];
  emphasis: boolean;
  icon?: { name: string; x: number; y: number; size: number };
  texts: LText[];
  /** In a story, what the box says and shows before its beat (`swap`, `swap-icon`) ·
   *  `texts` and `icon` are what it says after, the picture at rest: `label` stands
   *  where `texts[replaces]` will, `icon` where `icon` will. */
  before?: {
    label?: LText;
    replaces?: number;
    icon?: { name: string; x: number; y: number; size: number };
  };
  /** In a story, the disc of the check before its proof (`proof`, a text of `texts`). */
  proofDisc?: { x: number; y: number; size: number };
}

export interface LDot {
  kind: 'dot';
  key: string;
  node: DgNode;
  x: number;
  y: number;
  size: number;
  emphasis: boolean;
  tone: string;
  /** 0-based position among the dots of its mark. */
  index: number;
}

export interface LBar {
  kind: 'bar';
  key: string;
  node: DgNode;
  x: number;
  y: number;
  w: number;
  h: number;
  emphasis: boolean;
  tone: string;
  texts: LText[];
}

/** A group's own surface and caption, drawn behind its children. */
export interface LFrame {
  kind: 'frame';
  key: string;
  node: DgNode;
  x: number;
  y: number;
  w: number;
  h: number;
  paint: Paint;
  tone: string;
  caption?: LText;
}

/** One run of a lane's tokens, the one that plays on click `stage` · tokens rest
 *  where the last run left them until the next one. */
export interface LRun {
  stage: number;
  tokens: Token[];
  duration: number;
}

/** A lane · its label at the left, the track its tokens run along. */
export interface LLane {
  kind: 'lane';
  key: string;
  node: DgNode;
  /** The row, label to track end. */
  x: number;
  y: number;
  w: number;
  h: number;
  /** The line the tokens run on, and where it starts and ends. */
  cy: number;
  track: { x0: number; x1: number };
  /** An arrow at the end of the track · it runs into something. */
  head: boolean;
  icon?: { name: string; x: number; y: number; size: number };
  texts: LText[];
  tone: string;
  flow: number;
  speed: Speed;
  runs: LRun[];
}

/** A gate across lanes · `states[i]` is how it stands on click i, the last one
 *  holding after. */
export interface LGate {
  kind: 'gate';
  key: string;
  node: DgNode;
  x: number;
  y: number;
  w: number;
  h: number;
  /** The keys of the lanes it stands across. */
  lanes: string[];
  states: GateState[];
  /** The click it appears on. */
  stage: number;
  texts: LText[];
  /** The line from the mark that drives it (`by`) down to its top. */
  feed?: Point[];
}

/** A value on an axis · a point (`value`) or a stretch (`from` to `to`), or, with
 *  neither, its label alone. */
export interface LSpan {
  kind: 'span';
  key: string;
  node: DgNode;
  x: number;
  y: number;
  w: number;
  h: number;
  shape: 'point' | 'stretch' | 'none';
  emphasis: boolean;
  tone: string;
  texts: LText[];
  /** The track it is drawn on, when it is the one that draws it. */
  track?: { x0: number; y0: number; x1: number; y1: number };
}

/** A cursor on an axis · a line across the tracks at its value, which travels
 *  there from the start of the axis. */
export interface LCursor {
  kind: 'cursor';
  key: string;
  node: DgNode;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Where it starts from, as an offset from where it rests. */
  travel: Point;
  tone: string;
  texts: LText[];
}

/** A gauge · its label, its figure and a track filled as far as its value goes.
 *  Each list holds one entry per click, the last holding after. */
export interface LMeter {
  kind: 'meter';
  key: string;
  node: DgNode;
  x: number;
  y: number;
  w: number;
  h: number;
  track: { x: number; y: number; w: number; h: number };
  /** The width filled on each click. */
  fills: number[];
  /** Where a threshold crosses the track · absent without one. */
  threshold?: number;
  tones: string[];
  emphasis: boolean;
  /** The label, and the figure of the last click. */
  texts: LText[];
  /** The figure of each click. */
  figures: LText[];
}

/** A row of places, some taken · `fills` says how many on each click. */
export interface LQueue {
  kind: 'queue';
  key: string;
  node: DgNode;
  x: number;
  y: number;
  w: number;
  h: number;
  cells: { x: number; y: number; w: number; h: number }[];
  fills: number[];
  tones: string[];
  emphasis: boolean;
  texts: LText[];
}

/** A curve · its words, its plot, the points of its series, its threshold. */
export interface LCurve {
  kind: 'curve';
  key: string;
  node: DgNode;
  x: number;
  y: number;
  w: number;
  h: number;
  plot: { x: number; y: number; w: number; h: number };
  points: Point[];
  /** The y of the threshold's line · absent without one. */
  threshold?: number;
  /** Where the curve crosses its threshold, and the share of its length traced by then. */
  crossing?: { at: Point; share: number };
  tone: string;
  emphasis: boolean;
  /** The label, the last figure, the words under the plot, and the threshold's figure. */
  texts: LText[];
}

export type LItem =
  | LBox
  | LDot
  | LBar
  | LFrame
  | LLane
  | LGate
  | LSpan
  | LCursor
  | LMeter
  | LQueue
  | LCurve
  | LPiece;

/** What a per-click list says on click `stage` · the last entry holds after. */
export const atClick = <T>(list: readonly T[], stage: number): T | undefined =>
  list[Math.min(stage, list.length - 1)];

export interface LLink {
  from: string;
  to: string;
  points: Point[];
  dashed: boolean;
  head: boolean;
  label?: LText;
  /** Tokens that travel along it, by `flow`. */
  flow: number;
  speed: Speed;
  node?: DgNode;
}

export interface LNote {
  texts: LText[];
  x: number;
  y: number;
  w: number;
  h: number;
  /** The short line from the note to what it points at. */
  leader?: [Point, Point];
  target: string;
  node: DgNode;
  /** A status (`dg-status`) · the disc before its words, and its state before and
   *  after its beat (one word: the same). */
  status?: { disc: { x: number; y: number; size: number }; before: string; after: string };
}

export interface DiagramLayout {
  size: { w: number; h: number };
  items: LItem[];
  links: LLink[];
  notes: LNote[];
  status: 'fit' | 'unresolved';
  reasons: string[];
  issues: DgIssue[];
  density: Density;
  /** How many clicks it takes after the slide is entered. */
  stages: number;
  /** The marks laid out · the picture of its click when the diagram has states. */
  tree: DgNode[];
  /** Where each mark, group and panel stands, by key · what a camera frames. */
  places: Map<string, { x: number; y: number; w: number; h: number }>;
}

/** The texts an item draws, whatever its kind. */
export const textsOf = (item: LItem): LText[] =>
  'texts' in item ? item.texts : item.kind === 'frame' && item.caption ? [item.caption] : [];

export interface LayoutOptions {
  meter: Meter;
  /** The room the diagram was given, in drawing units. */
  bounds: { w: number; h: number };
  density?: Density;
  /** Whether an icon name is in the closed set · an unknown one draws nothing. */
  hasIcon?: (name: string) => boolean;
  /** The click whose picture is laid out, for a diagram with `dg-state` · the
   *  last one when unsaid, the picture at rest. */
  stage?: number;
  /** The language the deck is written in (`lang`) · a figure the diagram prints
   *  from a number (a gauge's value, a curve's last point and its line) takes its
   *  decimal sign. Absent, figures are printed as written. */
  locale?: string;
}

// ── text ──────────────────────────────────────────────────────────────────

type Role = LText['role'];

const TYPE_OF: Record<Role, { size: number; weight: number; line: number }> = {
  label: TYPE.label,
  note: TYPE.note,
  tag: TYPE.tag,
  value: TYPE.value,
  caption: TYPE.tag,
  proof: TYPE.tag,
};

const MAX_LINES: Record<Role, number> = {
  label: 2,
  note: 3,
  tag: 1,
  value: 1,
  caption: 1,
  proof: 2,
};

/** The check before a proof, and the gap after it. */
const PROOF_DISC = 30;
const PROOF_GAP = 10;

/** A size word as the role the label is set in · small is a note, large a figure. */
function labelRole(size: string | undefined): Role {
  return size === 'small' ? 'note' : size === 'large' ? 'value' : 'label';
}

interface Ctx {
  options: LayoutOptions;
  spacing: { gap: number; pad: number };
  reasons: string[];
  issues: DgIssue[];
  cache: Map<string, Solved>;
  /** The largest value a bar of the diagram shows on any click · a bar chart that
   *  changes keeps one scale, so a shorter bar is a smaller number on every click. */
  barTop: number;
  /** Lanes groups that share a row with other marks, by node index · their tracks
   *  take their natural length, so the room left is the neighbours' and the lanes
   *  keep their length whatever stands beside them from one picture to the next. */
  besideLanes: Set<number>;
}

/** Wrap `text` for a role into a width. A figure never wraps. */
function setText(
  ctx: Ctx,
  role: Role,
  text: string,
  width: number,
): { fitted: Fitted; type: (typeof TYPE_OF)[Role] } {
  const type = TYPE_OF[role];
  const fitted = fitText(text, width, MAX_LINES[role], type.size, (size) =>
    ctx.options.meter(size, type.weight),
  );
  return { fitted, type };
}

/** The widest word of a text at a role's size · the least width it can live in. */
function longestWord(ctx: Ctx, role: Role, text: string): number {
  const measure = ctx.options.meter(TYPE_OF[role].size, TYPE_OF[role].weight);
  return Math.max(
    0,
    ...text
      .split(/[ \t\n\r]+/)
      .filter(Boolean)
      .map((word) => measure(word)),
  );
}

/** The width a text takes on one line. */
function oneLine(ctx: Ctx, role: Role, text: string): number {
  return text ? ctx.options.meter(TYPE_OF[role].size, TYPE_OF[role].weight)(text.trim()) : 0;
}

// ── leaf marks as blocks ──────────────────────────────────────────────────

interface BoxContent {
  /** The label at rest · after its beat, in a story that swaps it. */
  label: string;
  /** The label before a swap · absent when it does not change. */
  before?: string;
  note: string;
  tag: string;
  value: string;
  proof: string;
  /** The icon at rest, and the one before a swap. */
  icon?: string;
  beforeIcon?: string;
  labelRole: Role;
  inlineIcon: boolean;
  /** The note stands beside the icon too, under the label. */
  noteBeside: boolean;
}

function boxContent(ctx: Ctx, node: DgNode): BoxContent {
  const known = (name: string | undefined) =>
    name && (ctx.options.hasIcon?.(name) ?? true) ? name : undefined;
  const original = known(node.attrs.icon);
  const icon = known(node.attrs['swap-icon']) ?? original;
  const note = node.attrs.note ?? '';
  const tag = node.attrs.tag ?? '';
  const label = node.attrs.label ?? '';
  const swap = node.attrs.swap;
  // A surface that says its part sets its icon in a disc beside its words, the note
  // included, the way a panel does · a card sets it above them.
  const panel = (ROLE_PAINTS as readonly string[]).includes(node.attrs.paint ?? '');
  return {
    label: swap ?? label,
    ...(swap !== undefined ? { before: label } : {}),
    note,
    tag,
    value: node.attrs.value ?? '',
    proof: node.attrs.proof ?? '',
    ...(icon ? { icon } : {}),
    ...(original && original !== icon ? { beforeIcon: original } : {}),
    labelRole: labelRole(node.attrs.size),
    inlineIcon: !!icon && (!note || panel) && !tag,
    noteBeside: !!icon && panel && !!note && !tag,
  };
}

function boxBlock(ctx: Ctx, node: DgNode): Block {
  const pad = padOf(ctx, node);
  const c = boxContent(ctx, node);
  const iconRoom = c.inlineIcon ? ICON_SIZE + ICON_GAP : 0;
  // A label that swaps on its beat takes the room of the longer of its two words.
  const labels = [c.label, c.before ?? ''];
  const proofRoom = c.proof ? PROOF_DISC + PROOF_GAP : 0;
  const noteRoom = c.noteBeside ? iconRoom : 0;
  const minInner = Math.max(
    ...labels.map((label) => longestWord(ctx, c.labelRole, label) + iconRoom),
    longestWord(ctx, 'note', c.note) + noteRoom,
    longestWord(ctx, 'tag', c.tag),
    oneLine(ctx, 'value', c.value),
    c.proof ? longestWord(ctx, 'proof', c.proof) + proofRoom : 0,
    c.icon ? ICON_SIZE : 0,
  );
  const prefInner = Math.min(
    MAX_BOX_WIDTH - 2 * pad,
    Math.max(
      ...labels.map((label) => oneLine(ctx, c.labelRole, label) + iconRoom),
      oneLine(ctx, 'note', c.note) + noteRoom,
      oneLine(ctx, 'tag', c.tag),
      oneLine(ctx, 'value', c.value),
      c.proof ? oneLine(ctx, 'proof', c.proof) + proofRoom : 0,
      c.icon ? ICON_SIZE : 0,
    ),
  );
  const minW = Math.ceil(minInner + 2 * pad);
  const prefW = Math.max(minW, Math.ceil(prefInner + 2 * pad));
  // A box with no surface is as wide as what it says · grown, it would leave an
  // invisible margin between its words and the links that reach its edge.
  const bare = node.attrs.paint === 'none';
  return {
    key: keyOf(node),
    minW,
    prefW,
    maxW: bare ? prefW : Math.max(prefW, MAX_BOX_WIDTH),
    heightFor: (w) => boxLayout(ctx, node, w).h,
  };
}

/** The text blocks of a box at a width, top to bottom, and its height. */
function boxLayout(
  ctx: Ctx,
  node: DgNode,
  width: number,
): Pick<LBox, 'texts' | 'icon' | 'before' | 'proofDisc'> & { h: number } {
  const pad = padOf(ctx, node);
  const c = boxContent(ctx, node);
  const inner = Math.max(1, width - 2 * pad);
  let y = pad;
  const texts: LText[] = [];
  let iconAt: { x: number; y: number } | undefined;
  if (c.icon && !c.inlineIcon) {
    iconAt = { x: pad, y };
    y += ICON_SIZE + ICON_GAP;
  }
  const iconRoom = c.inlineIcon ? ICON_SIZE + ICON_GAP : 0;
  const set = (role: Role, text: string, x: number, room: number): LText => {
    const { fitted, type } = setText(ctx, role, text, room);
    return {
      lines: fitted.lines,
      size: fitted.size,
      weight: type.weight,
      line: type.line,
      role,
      fits: fitted.fits,
      x,
      y,
    };
  };
  const put = (role: Role, text: string, x: number, room: number, before: number) => {
    if (!text.trim()) return 0;
    y += before;
    const laid = set(role, text, x, room);
    texts.push(laid);
    const used = laid.lines.length * laid.line;
    y += used;
    return used;
  };
  if (c.value) put('value', c.value, pad, inner, 0);
  const labelTop = y;
  const labelX = pad + iconRoom;
  const labelRoom = inner - iconRoom;
  const labelBefore = c.value ? LINE_AFTER_VALUE : 0;
  // The label before a swap stands where the one after it will · the taller of the two
  // sets the room.
  const swapped = c.before?.trim() ? set(c.labelRole, c.before, labelX, labelRoom) : undefined;
  if (swapped) swapped.y += labelBefore;
  const start = y;
  const labelIndex = texts.length;
  let labelH = put(c.labelRole, c.label, labelX, labelRoom, labelBefore);
  if (swapped) {
    const tallest = Math.max(labelH, swapped.lines.length * swapped.line);
    y = start + labelBefore + tallest;
    labelH = tallest;
  }
  if (c.inlineIcon) {
    iconAt = { x: pad, y: labelTop + Math.max(0, (labelH - ICON_SIZE) / 2) };
    if (!c.noteBeside) y = Math.max(y, labelTop + ICON_SIZE);
  }
  const noteX = c.noteBeside ? labelX : pad;
  put('note', c.note, noteX, inner - (noteX - pad), labelH ? BEFORE_NOTE : 0);
  if (c.noteBeside) y = Math.max(y, labelTop + ICON_SIZE);
  put('tag', c.tag, pad, inner, c.note || labelH ? BEFORE_TAG : 0);
  let proofDisc: LBox['proofDisc'];
  if (c.proof.trim()) {
    const top = y + (texts.length ? BEFORE_TAG : 0);
    put('proof', c.proof, pad + PROOF_DISC + PROOF_GAP, inner - PROOF_DISC - PROOF_GAP, top - y);
    const first = texts.at(-1)!;
    proofDisc = { x: pad, y: top + (first.line - PROOF_DISC) / 2, size: PROOF_DISC };
  }
  const icon = c.icon && iconAt ? { name: c.icon, ...iconAt, size: ICON_SIZE } : undefined;
  const beforeIcon =
    c.beforeIcon && iconAt ? { name: c.beforeIcon, ...iconAt, size: ICON_SIZE } : undefined;
  const before =
    swapped || beforeIcon
      ? {
          ...(swapped && texts[labelIndex] ? { label: swapped, replaces: labelIndex } : {}),
          ...(beforeIcon ? { icon: beforeIcon } : {}),
        }
      : undefined;
  return {
    h: Math.max(y + pad, 2 * pad + 1),
    texts,
    ...(icon ? { icon } : {}),
    ...(before ? { before } : {}),
    ...(proofDisc ? { proofDisc } : {}),
  };
}

function textBlock(ctx: Ctx, node: DgNode): Block {
  const label = node.attrs.label ?? '';
  const note = node.attrs.note ?? '';
  const minW = Math.ceil(
    Math.max(longestWord(ctx, 'label', label), longestWord(ctx, 'note', note)),
  );
  const prefW = Math.max(
    minW,
    Math.ceil(
      Math.min(MAX_TEXT_WIDTH, Math.max(oneLine(ctx, 'label', label), oneLine(ctx, 'note', note))),
    ),
  );
  return {
    key: keyOf(node),
    minW,
    prefW,
    maxW: Math.max(prefW, MAX_TEXT_WIDTH),
    heightFor: (w) => textLayout(ctx, node, w).h,
  };
}

function textLayout(ctx: Ctx, node: DgNode, width: number): { h: number; texts: LText[] } {
  let y = 0;
  const texts: LText[] = [];
  for (const [role, text] of [
    ['label', node.attrs.label ?? ''],
    ['note', node.attrs.note ?? ''],
  ] as const) {
    if (!text.trim()) continue;
    const { fitted, type } = setText(ctx, role, text, width);
    if (texts.length) y += BEFORE_NOTE;
    texts.push({
      lines: fitted.lines,
      size: fitted.size,
      weight: type.weight,
      line: type.line,
      role,
      fits: fitted.fits,
      x: 0,
      y,
    });
    y += fitted.lines.length * type.line;
  }
  return { h: Math.max(y, 1), texts };
}

const keyOf = (node: DgNode): string => node.attrs.name || `#${node.index}`;

// ── a meter and a queue ───────────────────────────────────────────────────

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

/** A text set on one line at a role, its corner at `x`, `y`. */
function lineAt(ctx: Ctx, role: Role, text: string, width: number, x: number, y: number): LText {
  const { fitted, type } = setText(ctx, role, text, Math.max(1, width));
  return {
    lines: fitted.lines,
    size: fitted.size,
    weight: type.weight,
    line: type.line,
    role,
    fits: fitted.fits,
    x,
    y,
  };
}

const meterMax = (node: DgNode): number => {
  const max = node.attrs.max ? readNumber(node.attrs.max) : DEFAULT_METER_MAX;
  return max > 0 ? max : DEFAULT_METER_MAX;
};

/** A decimal number as written (`0.2`, `0,2`) · its decimal sign is the language's. */
const DECIMAL = /^([-−]?\d+)[.,](\d+)$/;

/** A figure written as a number, with the decimal sign of `locale` · "0.2" in a
 *  French deck reads "0,2". Anything else, or no locale, is kept as written. */
function localFigure(ctx: Ctx, written: string): string {
  const match = DECIMAL.exec(written);
  const locale = ctx.options.locale;
  if (!match || !locale) return written;
  const sign = decimalSign(locale);
  return sign ? `${match[1]}${sign}${match[2]}` : written;
}

/** The decimal sign of a language · undefined for a language the runtime does not know. */
function decimalSign(locale: string): string | undefined {
  try {
    return new Intl.NumberFormat(locale).formatToParts(1.5).find((p) => p.type === 'decimal')
      ?.value;
  } catch (error) {
    // `lang` is written by the author · a tag that is not one keeps the figure as written.
    if (error instanceof RangeError) return undefined;
    throw error;
  }
}

/** A meter's figure on each click, as written · with its unit, or against its maximum. */
function meterFigures(ctx: Ctx, node: DgNode): string[] {
  const values = words(node.attrs.value).map((v) => localFigure(ctx, v));
  const max = localFigure(ctx, node.attrs.max || String(DEFAULT_METER_MAX));
  return (values.length ? values : ['0']).map((value) =>
    node.attrs.unit ? `${value} ${node.attrs.unit}` : `${value} / ${max}`,
  );
}

/** One word per click, or the one default when the list is empty. */
const perClick = (list: string | undefined, fallback: string): string[] => {
  const all = words(list);
  return all.length ? all : [fallback];
};

function meterBlock(ctx: Ctx, node: DgNode): Block {
  const label = node.attrs.label ?? '';
  const figure = Math.max(...meterFigures(ctx, node).map((f) => oneLine(ctx, 'value', f)));
  const minW = Math.ceil(
    Math.max(METER_MIN_WIDTH, longestWord(ctx, 'label', label) + METER_FIGURE_GAP + figure),
  );
  const wanted = oneLine(ctx, 'label', label) + METER_FIGURE_GAP + figure;
  const prefW = Math.ceil(Math.max(minW, clamp(wanted, METER_PREF_WIDTH, METER_MAX_WIDTH)));
  return {
    key: keyOf(node),
    minW,
    prefW,
    maxW: Math.max(prefW, METER_MAX_WIDTH),
    heightFor: (w) => meterLayout(ctx, node, w).h,
  };
}

/** A meter at a width · its words and its track, offsets from its corner. */
function meterLayout(
  ctx: Ctx,
  node: DgNode,
  width: number,
): Pick<LMeter, 'track' | 'fills' | 'texts' | 'figures' | 'threshold'> & { h: number } {
  const figures = meterFigures(ctx, node);
  const figureW = Math.max(...figures.map((f) => oneLine(ctx, 'value', f)));
  const labelRoom = Math.max(1, width - figureW - METER_FIGURE_GAP);
  const label = node.attrs.label?.trim()
    ? lineAt(ctx, 'label', node.attrs.label, labelRoom, 0, 0)
    : null;
  const max = meterMax(node);
  const placed = meter({
    width,
    label: label ? { w: labelRoom, h: label.lines.length * label.line } : { w: 0, h: 0 },
    figure: { w: figureW, h: TYPE_OF.value.line },
    shares: words(node.attrs.value).map((v) => shareOf(readNumber(v), max)),
    ...(node.attrs.threshold ? { threshold: shareOf(readNumber(node.attrs.threshold), max) } : {}),
  });
  const set = figures.map((f) =>
    lineAt(ctx, 'value', f, figureW, width - oneLine(ctx, 'value', f), placed.figure.y),
  );
  return {
    h: placed.size.h,
    track: placed.track,
    fills: placed.fills.length ? placed.fills : [0],
    ...(placed.threshold === undefined ? {} : { threshold: placed.threshold }),
    texts: [...(label ? [{ ...label, y: placed.label.y }] : []), set.at(-1)!],
    figures: set,
  };
}

const queueCount = (node: DgNode): number => {
  const count = readNumber(node.attrs.count ?? '');
  return Number.isInteger(count) ? clamp(count, 1, MAX_QUEUE) : 1;
};

/** How many places are taken on each click · whole, and never more than there are. */
function queueFills(node: DgNode): number[] {
  const count = queueCount(node);
  return perClick(node.attrs.fill, '0').map((word) => {
    const fill = readNumber(word);
    return Number.isFinite(fill) ? clamp(Math.floor(fill), 0, count) : 0;
  });
}

function queueBlock(ctx: Ctx, node: DgNode): Block {
  const count = queueCount(node);
  // A caption is a tag, set on one line · the queue is never narrower than it.
  const caption = oneLine(ctx, 'tag', node.attrs.label ?? '');
  const minW = Math.ceil(Math.max(rowWidth(count, QUEUE_MIN_CELL), caption));
  const prefW = Math.ceil(Math.max(rowWidth(count, QUEUE_CELL), caption));
  return {
    key: keyOf(node),
    minW,
    prefW,
    maxW: prefW,
    heightFor: (w) => queueLayout(ctx, node, w).h,
  };
}

function queueLayout(
  ctx: Ctx,
  node: DgNode,
  width: number,
): Pick<LQueue, 'cells' | 'texts'> & { w: number; h: number } {
  const label = node.attrs.label?.trim() ?? '';
  const captionW = label ? oneLine(ctx, 'tag', label) : 0;
  const placed = queue({
    count: queueCount(node),
    width,
    caption: label ? { w: captionW, h: TYPE_OF.tag.line } : { w: 0, h: 0 },
  });
  return {
    w: placed.size.w,
    h: placed.size.h,
    cells: placed.cells,
    texts: label ? [lineAt(ctx, 'tag', label, Math.max(width, captionW), 0, 0)] : [],
  };
}

// ── a curve ───────────────────────────────────────────────────────────────

/** Between the threshold's figure and its line, and from the plot's left edge. */
const THRESHOLD_TAG_GAP = 8;

/** A curve's series, as numbers · what is not one is left out (`DG_VALUE_INVALID`). */
const curveValues = (node: DgNode): number[] =>
  words(node.attrs.values)
    .map(readNumber)
    .filter((v) => Number.isFinite(v))
    .map((v) => Math.max(0, v));

/** The top of a curve's scale · its `max`, else a round number over every value. */
function curveMax(node: DgNode, values: number[]): number {
  const written = node.attrs.max ? readNumber(node.attrs.max) : Number.NaN;
  if (written > 0) return written;
  const threshold = node.attrs.threshold ? readNumber(node.attrs.threshold) : 0;
  return niceMax(Math.max(0, ...values, Number.isFinite(threshold) ? threshold : 0));
}

/** A figure as written in the deck's decimal sign, with its unit when it has one. */
const withUnit = (ctx: Ctx, node: DgNode, value: string) => {
  const figure = localFigure(ctx, value);
  return node.attrs.unit ? `${figure} ${node.attrs.unit}` : figure;
};

function curveBlock(ctx: Ctx, node: DgNode): Block {
  const last = words(node.attrs.values).at(-1);
  const figure = last ? oneLine(ctx, 'value', withUnit(ctx, node, last)) : 0;
  const label = oneLine(ctx, 'label', node.attrs.label ?? '');
  const minW = Math.ceil(
    Math.max(
      CURVE_MIN_WIDTH,
      longestWord(ctx, 'label', node.attrs.label ?? '') + METER_FIGURE_GAP + figure,
    ),
  );
  const prefW = Math.ceil(
    Math.max(minW, clamp(label + METER_FIGURE_GAP + figure, CURVE_PREF_WIDTH, CURVE_MAX_WIDTH)),
  );
  return {
    key: keyOf(node),
    minW,
    prefW,
    maxW: Math.max(prefW, CURVE_MAX_WIDTH),
    heightFor: (w) => curveLayout(ctx, node, w).h,
  };
}

/** A curve at a width · its words, its plot and its points, offsets from its corner. */
function curveLayout(
  ctx: Ctx,
  node: DgNode,
  width: number,
): Pick<LCurve, 'plot' | 'points' | 'threshold' | 'crossing' | 'texts'> & { h: number } {
  const values = curveValues(node);
  const max = curveMax(node, values);
  const last = words(node.attrs.values).at(-1);
  const figureText = last ? withUnit(ctx, node, last) : '';
  const figureW = figureText ? oneLine(ctx, 'value', figureText) : 0;
  const labelRoom = Math.max(1, width - figureW - METER_FIGURE_GAP);
  const label = node.attrs.label?.trim()
    ? lineAt(ctx, 'label', node.attrs.label, labelRoom, 0, 0)
    : null;
  const ticks = words(node.attrs.ticks);
  const threshold = node.attrs.threshold ? readNumber(node.attrs.threshold) : Number.NaN;
  const placed = curve({
    width,
    label: label ? { w: labelRoom, h: label.lines.length * label.line } : { w: 0, h: 0 },
    figure: figureText ? { w: figureW, h: TYPE_OF.value.line } : { w: 0, h: 0 },
    values,
    max,
    ...(Number.isFinite(threshold) ? { threshold } : {}),
    ticks: ticks.map((t) => ({ w: oneLine(ctx, 'tag', t), h: TYPE_OF.tag.line })),
  });
  const texts: LText[] = [
    ...(label ? [{ ...label, y: placed.label.y }] : []),
    ...(figureText
      ? [lineAt(ctx, 'value', figureText, figureW, placed.figure.x, placed.figure.y)]
      : []),
    ...ticks.map((t, k) =>
      lineAt(ctx, 'tag', t, oneLine(ctx, 'tag', t), placed.ticks[k]!.x, placed.ticks[k]!.y),
    ),
  ];
  // The line's own figure sits on it, at its left, where a rising curve has not yet come.
  if (placed.threshold !== undefined) {
    const said = withUnit(ctx, node, node.attrs.threshold!);
    texts.push(
      lineAt(
        ctx,
        'tag',
        said,
        oneLine(ctx, 'tag', said),
        placed.plot.x + THRESHOLD_TAG_GAP,
        placed.threshold - THRESHOLD_TAG_GAP - TYPE_OF.tag.line,
      ),
    );
  }
  const total = pathLength(placed.points);
  const crossing = placed.crossing && {
    at: placed.crossing.at,
    share:
      total > 0
        ? (pathLength(placed.points.slice(0, placed.crossing.index)) +
            Math.hypot(
              placed.crossing.at.x - placed.points[placed.crossing.index - 1]!.x,
              placed.crossing.at.y - placed.points[placed.crossing.index - 1]!.y,
            )) /
          total
        : 0,
  };
  return {
    h: placed.size.h,
    plot: placed.plot,
    points: placed.points,
    ...(placed.threshold === undefined ? {} : { threshold: placed.threshold }),
    ...(crossing ? { crossing } : {}),
    texts,
  };
}

/** The length of a polyline. */
const pathLength = (points: Point[]) =>
  points
    .slice(1)
    .reduce((sum, p, i) => sum + Math.hypot(p.x - points[i]!.x, p.y - points[i]!.y), 0);

// ── groups ────────────────────────────────────────────────────────────────

interface Kid {
  node: DgNode;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Absent for a mark placed by position only. */
  solved?: Solved;
  /** For a bar of a chart · where its label column, its bar and its tag sit. */
  bar?: { labelW: number; barX: number; barW: number; tagW: number };
  /** For a lane · offsets from the kid's corner. */
  lane?: { cy: number; track: { x0: number; x1: number }; head: boolean; label: LaneLabel };
  /** For a gate · offsets from the kid's corner, and the range its centre may take. */
  gate?: {
    label?: { x: number; y: number };
    centreMin: number;
    centreMax: number;
    lanes: string[];
  };
  /** For a mark on an axis · its mark and its label, offsets from the kid's corner. */
  span?: {
    mark?: { x: number; y: number; w: number; h: number };
    label: { x: number; y: number };
    shape: LSpan['shape'];
    track?: { x0: number; y0: number; x1: number; y1: number };
  };
  /** For a cursor · where it starts from, and its label, offsets from its corner. */
  cursor?: { travel: Point; label?: { x: number; y: number } };
  /** For a panel of a composition · it is drawn as large as its share, and what it
   *  holds stands this far from its corner (centred, past the notes it keeps room for). */
  inset?: Point;
}

interface Solved {
  w: number;
  h: number;
  kids: Kid[];
  status: 'fit' | 'unresolved';
  reasons: string[];
  /** Routes the engine found, by `from→to` key. */
  routes: Map<string, Point[]>;
}

const GAPS = { tight: 16, normal: 32, airy: 56 } as const;

function gapOf(ctx: Ctx, node: DgNode): number {
  const word = node.attrs.gap;
  return word && word in GAPS ? GAPS[word as keyof typeof GAPS] : ctx.spacing.gap;
}

/** Whether a child takes a place in its group · a link and an annotation do not,
 *  and neither does a group with nothing in it (it has no size to place). */
function isLayoutChild(node: DgNode): boolean {
  if (node.kind === 'link' || node.kind === 'status' || node.kind === 'camera') return false;
  if (node.kind === 'text' && node.attrs.for) return false;
  if (isGroupLike(node)) return node.children.some(isLayoutChild);
  return true;
}

/** How the marks that tell a story set their words · in the deck's font and decimal sign. */
const envOf = (ctx: Ctx): TextEnv => ({
  set: (role, text, width, x, y) => lineAt(ctx, role, text, width, x, y),
  width: (role, text) => oneLine(ctx, role, text),
  figure: (written) => localFigure(ctx, written),
});

const iconKnown = (ctx: Ctx) => (name: string) => ctx.options.hasIcon?.(name) ?? true;

function blockOf(ctx: Ctx, node: DgNode, widthHint: number): Block {
  if (isPiece(node.kind)) return pieceBlock(envOf(ctx), node, keyOf(node), iconKnown(ctx));
  switch (node.kind) {
    case 'box':
      return boxBlock(ctx, node);
    case 'text':
    // A lane, a gate or a cursor outside the layout that draws it is its label
    // alone, as a text · `DG_MARK_PLACE` says so.
    case 'lane':
    case 'gate':
    case 'cursor':
      return textBlock(ctx, node);
    case 'dot':
      return {
        key: keyOf(node),
        minW: DOT_SIZE,
        prefW: DOT_SIZE,
        maxW: DOT_SIZE,
        heightFor: () => DOT_SIZE,
      };
    case 'bar':
      return { key: keyOf(node), minW: 120, prefW: 120, heightFor: () => BAR_HEIGHT };
    case 'meter':
      return meterBlock(ctx, node);
    case 'queue':
      return queueBlock(ctx, node);
    case 'curve':
      return curveBlock(ctx, node);
    default:
      return groupBlock(ctx, node, widthHint);
  }
}

/** A group as a block · it is as wide as its children want at the room it has, and
 *  as tall as the engine makes it at the width it is given. */
function groupBlock(ctx: Ctx, node: DgNode, hint: number): Block {
  const wide = solveGroup(ctx, node, Math.max(hint, 1));
  const narrow = solveGroup(ctx, node, 1);
  return {
    key: keyOf(node),
    minW: Math.ceil(Math.min(wide.w, narrow.w)),
    prefW: Math.ceil(wide.w),
    // A group is as wide as its children make it · it does not stretch to fill a
    // row, which would draw a surface much wider than what it holds.
    maxW: Math.ceil(wide.w),
    heightFor: (w) => solveGroup(ctx, node, w).h,
  };
}

function solveGroup(ctx: Ctx, node: DgNode, width: number): Solved {
  const cacheKey = `${node.index}@${Math.round(width)}`;
  const hit = ctx.cache.get(cacheKey);
  if (hit) return hit;
  const solved = place(ctx, node, width);
  ctx.cache.set(cacheKey, solved);
  return solved;
}

/** The surface of a group or a panel · a panel is a surface that says its part, pale
 *  (the context) unless it says another. */
const paintOf = (node: DgNode): Paint =>
  ((node.attrs.paint as Paint | undefined) ?? (node.kind === 'panel' ? 'pale' : 'none')) as Paint;

/** Group paint takes room · a surface needs padding, a caption needs a line. A panel
 *  keeps the room a surface that says its part keeps. */
function frameOf(ctx: Ctx, node: DgNode): { pad: number; caption: number; has: boolean } {
  const paint = paintOf(node);
  const hasCaption = !!node.attrs.label;
  const has = paint !== 'none' || hasCaption;
  const pad =
    paint === 'none'
      ? 0
      : node.kind === 'panel'
        ? Math.max(ctx.spacing.pad, ROLE_PAD)
        : ctx.spacing.pad;
  return { pad, caption: hasCaption ? TYPE.tag.line + FRAME_CAPTION_GAP : 0, has };
}

function place(ctx: Ctx, node: DgNode, available: number): Solved {
  const frame = frameOf(ctx, node);
  const room = Math.max(1, available - 2 * frame.pad);
  const kids = node.children.filter(isLayoutChild);
  const layout = (node.attrs.layout ?? 'row') as Layout;
  const gap = gapOf(ctx, node);
  const reasons: string[] = [];
  let inner: {
    w: number;
    h: number;
    kids: Kid[];
    routes: Map<string, Point[]>;
    status: 'fit' | 'unresolved';
    reasons: string[];
  };

  if (node.attrs.compose && node.index < 0) inner = placeCompose(ctx, node, kids, room, gap);
  else if (layout === 'grid') inner = placeGrid(ctx, node, kids, room, gap);
  else if (layout === 'lanes')
    inner = placeLanes(ctx, kids, room, gap, ctx.besideLanes.has(node.index));
  else if (layout === 'axis') inner = placeAxis(ctx, node, kids, room);
  else if (layout === 'layers') inner = placeLayers(ctx, node, kids, room, gap);
  else if (layout === 'ring') inner = placeRing(ctx, kids, room, gap);
  else inner = placeStack(ctx, node, kids, room, gap, layout === 'column' ? 'column' : 'row');

  reasons.push(...inner.reasons);
  // A group placed at a width it cannot hold its children in says so in its own
  // solution · that is a defect of this group too, not only of the one inside.
  const crowded = inner.kids.filter((k) => k.solved?.status === 'unresolved');
  for (const kid of crowded) reasons.push(...kid.solved!.reasons);
  const dx = frame.pad;
  const dy = frame.pad + frame.caption;
  return {
    w: inner.w + 2 * frame.pad,
    h: inner.h + 2 * frame.pad + frame.caption,
    kids: inner.kids.map((k) => ({ ...k, x: k.x + dx, y: k.y + dy })),
    routes: shiftRoutes(inner.routes, dx, dy),
    status: inner.status === 'unresolved' || crowded.length ? 'unresolved' : 'fit',
    reasons,
  };
}

function shiftRoutes(routes: Map<string, Point[]>, dx: number, dy: number): Map<string, Point[]> {
  return new Map(
    [...routes].map(([key, points]) => [key, points.map((p) => ({ x: p.x + dx, y: p.y + dy }))]),
  );
}

const align = (node: DgNode) =>
  (node.attrs.align as 'start' | 'center' | 'end' | 'stretch' | undefined) ?? 'center';

// ── a composition of panels ───────────────────────────────────────────────

/** Two panels side by side share the width in this ratio · the mechanism of a split
 *  is 1.65 times its track (the recipes draw their remedies so). */
const SPLIT_SHARES = [1.65, 1];

/** The rows of panels a composition lays out, each with the share of the width each
 *  panel takes · a split and a model beside its incident in one row, a body over its
 *  axis, a dashboard two by two, an inset in one panel as wide as the room. */
function composeRows(compose: Compose, panels: DgNode[]): { panels: DgNode[]; shares: number[] }[] {
  const equal = (list: DgNode[]) => ({ panels: list, shares: list.map(() => 1) });
  if (compose === 'split' && panels.length === SPLIT_SHARES.length)
    return [{ panels, shares: SPLIT_SHARES }];
  if (compose === 'body-axis') {
    const foot = panels.filter((p) => p.attrs.layout === 'axis');
    const body = panels.filter((p) => !foot.includes(p));
    return [body, foot].filter((row) => row.length).map(equal);
  }
  if (compose === 'dashboard') {
    const rows: DgNode[][] = [];
    for (let i = 0; i < panels.length; i += 2) rows.push(panels.slice(i, i + 2));
    return rows.map(equal);
  }
  return [equal(panels)];
}

/** A panel laid out in its share · the room its side notes need kept free at its
 *  edges, what it holds laid out in the rest. */
function solvePanel(
  ctx: Ctx,
  panel: DgNode,
  width: number,
): { solved: Solved; left: number; top: number; h: number } {
  const reserve = reserveForNotes(ctx, panel);
  const room = Math.max(1, width - reserve.left - reserve.right);
  const solved = solveGroup(ctx, panel, room);
  return {
    solved,
    left: reserve.left + Math.max(0, (room - solved.w) / 2),
    top: reserve.top,
    h: solved.h + reserve.top + reserve.bottom,
  };
}

/** The widths of a row of panels · by their shares, except that a panel is never
 *  narrower than the least it can hold its marks in: it takes that, and the others
 *  share what is left by their shares. */
export function bendShares(shares: number[], least: number[], free: number): number[] {
  const widths = shares.map(() => 0);
  const fixed = new Set<number>();
  for (let round = 0; round <= shares.length; round += 1) {
    const open = shares.map((_, i) => i).filter((i) => !fixed.has(i));
    const left = free - [...fixed].reduce((sum, i) => sum + widths[i]!, 0);
    const total = open.reduce((sum, i) => sum + shares[i]!, 0);
    for (const i of open) widths[i] = (left * shares[i]!) / total;
    const short = open.filter((i) => widths[i]! < least[i]!);
    if (!short.length) break;
    for (const i of short) {
      widths[i] = least[i]!;
      fixed.add(i);
    }
  }
  return widths;
}

/** The panels of a composition · each row shares the width by its panels' shares, the
 *  panels of a row are as tall as the tallest, and what each holds is centred in it. */
function placeCompose(ctx: Ctx, node: DgNode, kids: DgNode[], room: number, gap: number): Inner {
  const rows = composeRows(node.attrs.compose as Compose, kids);
  const out: Kid[] = [];
  const reasons: string[] = [];
  let y = 0;
  let width = room;
  for (const row of rows) {
    const free = room - gap * (row.panels.length - 1);
    const least = row.panels.map((panel) => {
      const reserve = reserveForNotes(ctx, panel);
      return groupBlock(ctx, panel, free).minW + reserve.left + reserve.right;
    });
    const widths = bendShares(row.shares, least, free);
    const laid = row.panels.map((panel, i) => solvePanel(ctx, panel, widths[i]!));
    const h = Math.max(...laid.map((l) => l.h));
    let x = 0;
    laid.forEach(({ solved, left, top, h: own }, i) => {
      // Never narrower than what it holds · a row too narrow for its panels is said.
      const w = Math.max(widths[i]!, solved.w);
      const inset = { x: left, y: top + (h - own) / 2 };
      out.push({ node: row.panels[i]!, x, y, w, h, solved, inset });
      x += w + gap;
    });
    if (x - gap > room + 0.5)
      reasons.push(
        `the panels ${row.panels.map((p) => `"${p.attrs.name}"`).join(', ')} need ${Math.ceil(x - gap)} units side by side, the room holds ${Math.round(room)}`,
      );
    width = Math.max(width, x - gap);
    y += h + gap;
  }
  const crowded = out.some((k) => k.solved?.status === 'unresolved');
  return {
    w: width,
    h: Math.max(0, y - gap),
    kids: out,
    routes: new Map(),
    status: reasons.length || crowded ? 'unresolved' : 'fit',
    reasons,
  };
}

interface Inner {
  w: number;
  h: number;
  kids: Kid[];
  routes: Map<string, Point[]>;
  status: 'fit' | 'unresolved';
  reasons: string[];
}

function placeStack(
  ctx: Ctx,
  node: DgNode,
  kids: DgNode[],
  room: number,
  gap: number,
  direction: 'row' | 'column',
): Inner {
  // A column of bars is a bar chart in rows · a label, a bar sized by its value, a tag.
  if (direction === 'column' && kids.length > 0 && kids.every((kid) => kid.kind === 'bar')) {
    return placeBars(ctx, kids, room, gap);
  }
  if (direction === 'row' && kids.length > 1)
    for (const kid of kids) if (kid.attrs.layout === 'lanes') ctx.besideLanes.add(kid.index);
  const blocks = kids.map((kid) => blockOf(ctx, kid, room));
  const result = stack({
    direction,
    blocks,
    bounds: { w: room, h: HUGE },
    gap: Math.max(gap, labelGap(ctx, node, kids, direction)),
    align: align(node),
    wrap: direction === 'row' && node.attrs.wrap !== 'false',
    equalCross: false,
  });
  const out: Kid[] = result.placed.map((p, i) => ({
    node: kids[i]!,
    x: p.x,
    y: p.y,
    w: p.w,
    h: p.h,
  }));
  attachSolved(ctx, out);
  return {
    w: result.size.w,
    h: result.size.h,
    kids: out,
    routes: new Map(),
    status: result.status,
    reasons: result.reasons,
  };
}

/** The gap a row or a column needs for the labels of the links between neighbours ·
 *  a label sits in the gap its line crosses, and a gap narrower than it puts the
 *  label on the boxes either side. Every gap of the line takes it, so the rhythm holds. */
function labelGap(ctx: Ctx, node: DgNode, kids: DgNode[], direction: 'row' | 'column'): number {
  const at = (name: string) =>
    kids.findIndex(
      (kid) => kid.attrs.name === name || (!kid.attrs.name && kid.attrs.label === name),
    );
  const needs = node.children
    .filter((child) => child.kind === 'link' && child.attrs.label)
    .filter((link) =>
      words(link.attrs.from).some((from) =>
        words(link.attrs.to).some((to) => Math.abs(at(from) - at(to)) === 1 && at(from) >= 0),
      ),
    )
    .map((link) =>
      direction === 'row'
        ? oneLine(ctx, 'tag', link.attrs.label!) + 2 * LABEL_CLEAR
        : TYPE.tag.line + 2 * LABEL_CLEAR,
    );
  return Math.max(0, ...needs);
}

const BAR_LABEL_MAX = 320;
const BAR_TAG_MAX = 280;
const BAR_TEXT_GAP = 24;
const BAR_MIN = 12;

const readValue = (text: string | undefined) =>
  Math.max(0, Number((text ?? '0').replace(',', '.').replace(/\s/g, '')) || 0);

/** A column of bars as rows of a chart · the label in a column of its own, the bar
 *  as long as its value against the largest, the tag after it. Text beside the bar
 *  and not inside it, so a short bar never has to hold a long word. */
function placeBars(ctx: Ctx, kids: DgNode[], room: number, gap: number): Inner {
  const widest = (key: 'label' | 'tag', role: Role, cap: number) =>
    Math.min(
      cap,
      room * 0.3,
      Math.max(0, ...kids.map((kid) => oneLine(ctx, role, kid.attrs[key] ?? ''))),
    );
  const labelCol = Math.ceil(widest('label', 'label', BAR_LABEL_MAX));
  const tagCol = Math.ceil(widest('tag', 'tag', BAR_TAG_MAX));
  const barMax = Math.max(
    BAR_MIN,
    room - labelCol - tagCol - (labelCol ? BAR_TEXT_GAP : 0) - (tagCol ? BAR_TEXT_GAP : 0),
  );
  const values = kids.map((kid) => readValue(kid.attrs.value));
  const top = Math.max(...values, ctx.barTop, 1);
  const result = stack({
    direction: 'column',
    blocks: kids.map((kid) => ({
      key: keyOf(kid),
      minW: room,
      prefW: room,
      maxW: room,
      heightFor: () => BAR_HEIGHT,
    })),
    bounds: { w: room, h: HUGE },
    gap,
    align: 'start',
  });
  const barX = labelCol + (labelCol ? BAR_TEXT_GAP : 0);
  const out: Kid[] = result.placed.map((p, i) => ({
    node: kids[i]!,
    x: p.x,
    y: p.y,
    w: p.w,
    h: p.h,
    bar: {
      labelW: labelCol,
      barX,
      barW: Math.max(BAR_MIN, Math.round((values[i]! / top) * barMax)),
      tagW: tagCol,
    },
  }));
  return {
    w: room,
    h: result.size.h,
    kids: out,
    routes: new Map(),
    status: result.status,
    reasons: result.reasons,
  };
}

function placeGrid(ctx: Ctx, node: DgNode, kids: DgNode[], room: number, gap: number): Inner {
  const dots = kids.length > 0 && kids.every((kid) => kid.kind === 'dot');
  if (dots) return placeDots(node, kids, room);
  // A grid of boxes · rows of `columns`, each row a stack, stacked.
  const blocks = kids.map((kid) => blockOf(ctx, kid, room));
  const cellW = Math.max(...blocks.map((b) => b.prefW), 1);
  const leastCell = Math.max(...blocks.map((b) => b.minW), 1);
  const asked = Math.floor(Number(node.attrs.columns));
  // Without `columns` the grid takes as many as the room holds at the least width
  // its boxes live in, not more than a square would use.
  const holds = Math.max(1, Math.floor((room + gap) / (leastCell + gap)));
  const columns = Math.max(1, asked || Math.min(Math.ceil(Math.sqrt(kids.length)), holds));
  const rows: DgNode[][] = [];
  for (let i = 0; i < kids.length; i += columns) rows.push(kids.slice(i, i + columns));
  const cell = Math.min(cellW, Math.floor((room - gap * (columns - 1)) / columns));
  const out: Kid[] = [];
  let y = 0;
  const reasons: string[] = [];
  // `columns` is exact, so a room that cannot hold that many columns of boxes at the
  // least width they live in is said, not squeezed · the boxes would overlap.
  if (cell < leastCell) {
    reasons.push(
      `${columns} columns need ${Math.ceil(columns * leastCell + gap * (columns - 1))} units, the room holds ${Math.round(room)}`,
    );
  }
  for (const row of rows) {
    // Never narrower than the least a box lives in · past the room, and said.
    const drawn = Math.max(cell, leastCell);
    const rowBlocks = row.map((kid) => ({
      ...blockOf(ctx, kid, drawn),
      minW: drawn,
      prefW: drawn,
      maxW: drawn,
    }));
    const result = stack({
      direction: 'row',
      blocks: rowBlocks,
      bounds: { w: room, h: HUGE },
      gap,
      align: 'stretch',
      equalCross: true,
    });
    reasons.push(...result.reasons);
    for (const [i, p] of result.placed.entries())
      out.push({ node: row[i]!, x: p.x, y: y + p.y, w: p.w, h: p.h });
    y += result.size.h + gap;
  }
  attachSolved(ctx, out);
  const w = out.length ? Math.max(...out.map((k) => k.x + k.w)) : 0;
  return {
    w,
    h: Math.max(0, y - gap),
    kids: out,
    routes: new Map(),
    status: reasons.length ? 'unresolved' : 'fit',
    reasons,
  };
}

/** `dg-dot count="N"` marks expand to N cells on one grid · the count is exact,
 *  and the cells light in reading order (the first `count` of a mark, then the next). */
function placeDots(node: DgNode, kids: DgNode[], room: number): Inner {
  const counts = kids.map((kid) => Math.max(1, Math.floor(Number(kid.attrs.count ?? 1)) || 1));
  const total = counts.reduce((a, b) => a + b, 0);
  const columns = Number(node.attrs.columns);
  const result = grid({
    mode: 'uniform',
    count: total,
    columns: Number.isFinite(columns) && columns >= 1 ? Math.floor(columns) : 'auto',
    bounds: { w: room, h: GRID_MAX_HEIGHT },
    gap: 0,
    minCell: CELL_MIN,
    maxCell: CELL_MAX,
  });
  // The engine returns square cells with no gap · the visible cell is inset so the
  // grid reads as cells, with the gap a quarter of the cell.
  const out: Kid[] = [];
  let at = 0;
  kids.forEach((kid, k) => {
    for (let n = 0; n < counts[k]!; n += 1) {
      const cell = result.placed[at]!;
      out.push({ node: kid, x: cell.x, y: cell.y, w: cell.w, h: cell.h });
      at += 1;
    }
  });
  const size = result.size;
  return {
    w: size.w,
    h: size.h,
    kids: out,
    routes: new Map(),
    status: result.status,
    reasons: result.reasons,
  };
}

function edgesOf(
  node: DgNode,
  kids: DgNode[],
): { from: number; to: number; back: boolean; link: DgNode }[] {
  const index = new Map<string, number>();
  kids.forEach((kid, i) => {
    if (kid.attrs.name) index.set(kid.attrs.name, i);
    if (kid.attrs.label && !index.has(kid.attrs.label)) index.set(kid.attrs.label, i);
  });
  const edges: { from: number; to: number; back: boolean; link: DgNode }[] = [];
  for (const link of node.children.filter((child) => child.kind === 'link')) {
    for (const from of words(link.attrs.from)) {
      for (const to of words(link.attrs.to)) {
        const a = index.get(from);
        const b = index.get(to);
        if (a !== undefined && b !== undefined && a !== b)
          edges.push({ from: a, to: b, back: link.attrs.back === 'true', link });
      }
    }
  }
  return edges;
}

/** How far apart the ranks of a graph may be pushed when there is room, as a multiple
 *  of the gap, widest first. */
const RANK_SPREAD = [5, 4, 3, 2.5] as const;

function placeLayers(ctx: Ctx, node: DgNode, kids: DgNode[], room: number, gap: number): Inner {
  const direction = (node.attrs.direction as 'right' | 'down' | undefined) ?? 'right';
  const edges = edgesOf(node, kids);
  const nodes = kids.map((kid, i) => {
    const b = blockOf(ctx, kid, room);
    const w = Math.min(b.prefW, room);
    return { key: String(i), w, h: b.heightFor(w) };
  });
  const solveWith = (rankGap: number, dir: 'right' | 'down') =>
    layers({
      nodes,
      edges: edges.map((e) => ({ from: String(e.from), to: String(e.to), back: e.back })),
      direction: dir,
      // No group is taller than the room · a graph that runs down spreads its
      // ranks only as far as the room's height lets it.
      bounds: { w: room, h: ctx.options.bounds.h },
      nodeGap: gap,
      rankGap: Math.max(rankGap, gap * 2),
    });
  let result = solveWith(gap, direction);
  const reasons = [...result.reasons];
  if (result.status === 'unresolved' && direction === 'right') {
    const down = solveWith(gap, 'down');
    if (down.status === 'fit') {
      result = down;
      reasons.length = 0;
    }
  }
  // A graph that fits with room to spare uses it · the ranks are spread apart, as
  // far as the room allows, so labels on the links have somewhere to sit.
  if (result.status === 'fit') {
    for (const factor of RANK_SPREAD) {
      const wider = solveWith(gap * factor, direction);
      if (wider.status === 'fit') {
        result = wider;
        break;
      }
    }
  }
  const out: Kid[] = result.placed.map((p) => {
    const i = Number(p.key);
    return { node: kids[i]!, x: p.x, y: p.y, w: p.w, h: p.h };
  });
  attachSolved(ctx, out);
  const routes = new Map<string, Point[]>();
  for (const r of result.routes) {
    routes.set(`${kids[Number(r.from)]!.index}->${kids[Number(r.to)]!.index}`, r.points);
  }
  for (const issue of result.issues)
    ctx.issues.push({
      code: 'DG_REF_UNKNOWN',
      severity: 'warning',
      items: issue.items,
      message: issue.message,
      fix: { action: 'check-links' },
    });
  return { w: result.size.w, h: result.size.h, kids: out, routes, status: result.status, reasons };
}

const RING_SPREAD = [6, 4.5, 3, 2] as const;
const RING_MAX_HEIGHT = 520;

/** What a loop fills stands in the middle of its ring · a gauge or a queue. */
const isRingMiddle = (node: DgNode) => node.kind === 'queue' || node.kind === 'meter';

function placeRing(ctx: Ctx, kids: DgNode[], room: number, gap: number): Inner {
  const middle = kids.find(isRingMiddle);
  const around = kids.filter((kid) => kid !== middle);
  const nodes = around.map((kid, i) => {
    const b = blockOf(ctx, kid, room);
    const w = Math.min(b.prefW, Math.floor(room / 3));
    return { key: String(i), w, h: b.heightFor(w) };
  });
  const held = middle && blockOf(ctx, middle, room);
  const size = held && { w: held.prefW, h: held.heightFor(held.prefW) };
  const spaced = (g: number, centre?: { w: number; h: number }) =>
    ring({
      nodes,
      bounds: { w: room, h: HUGE },
      gap: g,
      closed: true,
      ...(centre ? { centre } : {}),
    });
  // A ring spreads out as far as a slide holds · the widest gap whose height stays
  // inside it, then tighter, down to the gap it was given.
  const spread = (tallest: number, centre?: { w: number; h: number }) => {
    for (const factor of RING_SPREAD) {
      const wider = spaced(gap * factor, centre);
      if (wider.status === 'fit' && wider.size.h <= tallest) return wider;
    }
    return spaced(gap, centre);
  };
  // What the loop fills stands in its middle when the ring holds it there and stays
  // within a slide's height · a ring is as wide as it is tall, so a wide queue in the
  // middle of four stages would make it too tall · it then stands under the ring,
  // which leaves it the room.
  const inMiddle = size ? spread(RING_MAX_HEIGHT, size) : null;
  const inside = !!inMiddle && inMiddle.size.h <= RING_MAX_HEIGHT;
  const result = inside ? inMiddle! : spread(RING_MAX_HEIGHT - (size ? size.h + gap : 0));
  const under = !!size && !inside;
  const w = under ? Math.max(result.size.w, size.w) : result.size.w;
  // Under the ring, the ring and what it fills are centred on one another.
  const dx = (w - result.size.w) / 2;
  const out: Kid[] = result.placed.map((p) => ({
    node: around[Number(p.key)]!,
    x: p.x + dx,
    y: p.y,
    w: p.w,
    h: p.h,
  }));
  if (middle && size)
    out.push({
      node: middle,
      x: inside ? result.centre.x - size.w / 2 : (w - size.w) / 2,
      y: inside ? result.centre.y - size.h / 2 : result.size.h + gap,
      ...size,
    });
  attachSolved(ctx, out);
  const routes = new Map<string, Point[]>();
  for (const r of result.routes)
    routes.set(
      `${around[Number(r.from)]!.index}->${around[Number(r.to)]!.index}`,
      r.points.map((p) => ({ x: p.x + dx, y: p.y })),
    );
  return {
    w,
    h: under ? result.size.h + gap + size.h : result.size.h,
    kids: out,
    routes,
    status: result.status,
    reasons: result.reasons,
  };
}

// ── lanes ─────────────────────────────────────────────────────────────────

/** A lane's icon sits in a disc this wide, left of its label. */
export const LANE_ICON_DISC = 48;
const LANE_ICON_GAP = 16;
const LANE_TEXT_MAX = 300;
/** Tokens a lane carries when it does not say. */
export const DEFAULT_LANE_FLOW = 3;
const GATE_LABEL_BESIDE = 12;

interface LaneLabel {
  w: number;
  h: number;
  texts: LText[];
  icon?: { name: string; x: number; y: number; size: number };
}

/** A lane's label block · an icon in a disc, its label, a note under it. */
function laneLabel(ctx: Ctx, node: DgNode): LaneLabel {
  const hasIcon = !!node.attrs.icon && (ctx.options.hasIcon?.(node.attrs.icon) ?? true);
  const iconRoom = hasIcon ? LANE_ICON_DISC + LANE_ICON_GAP : 0;
  const label = node.attrs.label ?? '';
  const note = node.attrs.note ?? '';
  const textW = Math.ceil(
    Math.max(
      longestWord(ctx, 'label', label),
      longestWord(ctx, 'note', note),
      Math.min(LANE_TEXT_MAX, Math.max(oneLine(ctx, 'label', label), oneLine(ctx, 'note', note))),
    ),
  );
  const laid = textLayout(ctx, node, Math.max(1, textW));
  const h = Math.max(hasIcon ? LANE_ICON_DISC : 0, laid.h);
  const top = (h - laid.h) / 2;
  return {
    w: iconRoom + textW,
    h,
    texts: laid.texts.map((t) => ({ ...t, x: t.x + iconRoom, y: t.y + top })),
    icon: hasIcon
      ? { name: node.attrs.icon!, x: 0, y: (h - LANE_ICON_DISC) / 2, size: LANE_ICON_DISC }
      : undefined,
  };
}

/** The tokens a lane carries · a whole number, the ceiling at most. */
const flowOf = (node: DgNode, fallback: number) => {
  const flow = Number(node.attrs.flow);
  return Number.isInteger(flow) && flow >= 0 ? Math.min(flow, MAX_FLOW) : fallback;
};

/** How a gate stands on each click · open, closed or shedding, closed when unsaid. */
const statesOf = (node: DgNode): GateState[] => {
  const written = words(node.attrs.state).filter((w): w is GateState =>
    ['open', 'closed', 'shed'].includes(w),
  );
  return written.length ? written : ['closed'];
};

/** The click a mark appears on · 0 when it does not say. */
export const stepOf = (node: DgNode): number => {
  const step = Number(node.attrs.step);
  return Number.isInteger(step) && step > 0 ? step : 0;
};

/** The most gates any one lane crosses · a gate with no `over` crosses them all. */
function gatesInSeries(gates: { lanes: number[] }[], lanes: number): number {
  const counts = Array.from(
    { length: lanes },
    (_, i) => gates.filter((g) => !g.lanes.length || g.lanes.includes(i)).length,
  );
  return Math.max(0, ...counts);
}

/** A group of lanes · rows with a track each, gates across them, and whatever else
 *  the group holds stacked at the right, where the lanes run. */
function placeLanes(ctx: Ctx, kids: DgNode[], room: number, gap: number, beside: boolean): Inner {
  const laneKids = kids.filter((kid) => kid.kind === 'lane');
  const gateKids = kids.filter((kid) => kid.kind === 'gate');
  const sinkKids = kids.filter((kid) => kid.kind !== 'lane' && kid.kind !== 'gate');
  const labels = laneKids.map((kid) => laneLabel(ctx, kid));
  const flows = laneKids.map((kid) => flowOf(kid, DEFAULT_LANE_FLOW));
  const indexOf = new Map(laneKids.map((kid, i) => [kid.attrs.name ?? `#${kid.index}`, i]));
  const gateSpecs = gateKids.map((gate) => {
    const over = words(gate.attrs.over)
      .map((name) => indexOf.get(name))
      .filter((i): i is number => i !== undefined);
    const covered = over.length ? over : laneKids.map((_, i) => i);
    const blocks = statesOf(gate).some((s) => s !== 'open');
    const label = gate.attrs.label
      ? { w: oneLine(ctx, 'tag', gate.attrs.label), h: TYPE.tag.line }
      : undefined;
    return {
      key: keyOf(gate),
      lanes: over,
      at: GATE_AT[(gate.attrs.at as GateAt | undefined) ?? 'middle'] ?? GATE_AT.middle,
      label,
      queue: blocks ? Math.max(0, ...covered.map((i) => flows[i] ?? 0)) : 0,
    };
  });
  const result = placeLaneRows({
    lanes: laneKids.map((kid, i) => ({
      key: keyOf(kid),
      label: { w: labels[i]!.w, h: labels[i]!.h },
    })),
    gates: gateSpecs,
    sinks: sinkKids.map((kid) => {
      const block = blockOf(ctx, kid, room);
      return { key: keyOf(kid), minW: block.minW, prefW: block.prefW, heightFor: block.heightFor };
    }),
    width: room,
    gap,
    ...(beside ? { track: naturalTrack(gatesInSeries(gateSpecs, laneKids.length)) } : {}),
  });
  const head = sinkKids.length > 0;
  const out: Kid[] = [
    ...result.lanes.map((lane, i) => ({
      node: laneKids[i]!,
      x: lane.x,
      y: lane.y,
      w: lane.w,
      h: lane.h,
      lane: {
        cy: lane.cy - lane.y,
        track: { x0: lane.track.x0 - lane.x, x1: lane.track.x1 - lane.x },
        head,
        label: {
          ...labels[i]!,
          texts: labels[i]!.texts.map((t) => ({ ...t, y: t.y + lane.label.y - lane.y })),
          icon: labels[i]!.icon && {
            ...labels[i]!.icon!,
            y: labels[i]!.icon!.y + lane.label.y - lane.y,
          },
        },
      },
    })),
    ...result.gates.map((gate, i) => ({
      node: gateKids[i]!,
      x: gate.x,
      y: gate.y,
      w: gate.w,
      h: gate.h,
      gate: {
        label: gate.label && { x: gate.label.x - gate.x, y: gate.label.y - gate.y },
        centreMin: gate.centreMin - gate.x,
        centreMax: gate.centreMax - gate.x,
        lanes: (gate.lanes.length ? gate.lanes : laneKids.map((_, k) => k)).map((k) =>
          keyOf(laneKids[k]!),
        ),
      },
    })),
    ...result.sinks.map((sink, i) => ({
      node: sinkKids[i]!,
      x: sink.x,
      y: sink.y,
      w: sink.w,
      h: sink.h,
    })),
  ];
  attachSolved(ctx, out);
  return {
    w: result.size.w,
    h: result.size.h,
    kids: out,
    routes: new Map(),
    status: result.status,
    reasons: result.reasons,
  };
}

// ── axis ──────────────────────────────────────────────────────────────────

/** A vertical axis is this long · a slide's height, less a title. */
const AXIS_DOWN_LENGTH = 440;
const AXIS_LABEL_GAP = 12;
const AXIS_THICKNESS = 20;
/** A band cut into the parts of a whole is a surface, not a line · thick enough to read
 *  each part as a piece of it. */
const AXIS_BAND_THICKNESS = 48;
const AXIS_LABEL_MAX = 260;
const CURSOR_WIDTH = 4;
const CURSOR_LABEL_GAP = 8;
/** A cursor's word keeps this far from a label beside it, or the two read as one. */
const CURSOR_LABEL_CLEAR = 32;
/** A cursor stands this far past the tracks it crosses. */
const CURSOR_REACH = 18;
/** A cursor's line stops this far short of a label it would run into. */
const LABEL_AIR = 4;
/** A cursor's word is moved aside by steps of this, looking for a free place. */
const CURSOR_SHIFT_STEP = 8;

const numberOf = (text: string | undefined): number | undefined => {
  if (text === undefined || text.trim() === '') return undefined;
  const value = Number(text.replace(',', '.').replace(/\s/g, ''));
  return Number.isFinite(value) ? value : undefined;
};

/** Where a mark stands on the axis · a stretch from `from` to `to`, else a point
 *  at `value` (or a lone `from` or `to`), else nowhere. */
function valuesOn(node: DgNode): { from?: number; to?: number; at?: number } {
  const from = numberOf(node.attrs.from);
  const to = numberOf(node.attrs.to);
  if (from !== undefined && to !== undefined) return { from, to };
  const at = numberOf(node.attrs.value) ?? from ?? to;
  return at === undefined ? {} : { at };
}

/** Whether stretches lie end to end, each starting where the one before ends · the
 *  parts of one whole, drawn as one band cut into them rather than a track each. */
function tiles(values: { from?: number; to?: number }[]): boolean {
  if (values.length < 2) return false;
  const spans = values.map((v) => (v.from !== undefined && v.to !== undefined ? v : null));
  if (spans.some((s) => !s || s.to! <= s.from!)) return false;
  return spans.every((s, k) => k === 0 || Math.abs(s!.from! - spans[k - 1]!.to!) < 1e-9);
}

/** A mark's label on an axis · its label, and its tag under it. */
function axisLabel(ctx: Ctx, node: DgNode): { w: number; texts: LText[]; h: number } {
  const texts: LText[] = [];
  let y = 0;
  let w = 0;
  for (const [role, text] of [
    ['label', node.attrs.label ?? ''],
    ['tag', node.attrs.tag ?? ''],
  ] as const) {
    if (!text.trim()) continue;
    const width = Math.min(
      AXIS_LABEL_MAX,
      Math.max(oneLine(ctx, role, text), longestWord(ctx, role, text)),
    );
    const { fitted, type } = setText(ctx, role, text, Math.max(1, width));
    if (texts.length) y += LINE_AFTER_VALUE;
    texts.push({
      lines: fitted.lines,
      size: fitted.size,
      weight: type.weight,
      line: type.line,
      role,
      fits: fitted.fits,
      x: 0,
      y,
    });
    y += fitted.lines.length * type.line;
    w = Math.max(w, Math.ceil(width));
  }
  return { w, h: Math.max(1, y), texts };
}

type Area = { x: number; y: number; w: number; h: number };

/** How far a cursor's line runs across a horizontal axis · past the tracks either
 *  side, down to its word under them (`down`), but never into a label it passes: a
 *  cursor in a small part stands under that part's label, or beside its neighbour's,
 *  and went through it. */
function cursorReach(x: number, band: number[], down: number, labels: readonly Area[]) {
  const line = { x: x - CURSOR_LABEL_GAP / 2, w: CURSOR_WIDTH + CURSOR_LABEL_GAP };
  const crossed = labels.filter((l) => l.x < line.x + line.w && l.x + l.w > line.x);
  const inner = [band[0]! + CURSOR_REACH, band[1]! - CURSOR_REACH];
  const above = crossed.filter((l) => l.y + l.h <= inner[0]!).map((l) => l.y + l.h + LABEL_AIR);
  const below = crossed.filter((l) => l.y >= inner[1]!).map((l) => l.y - LABEL_AIR);
  return {
    top: Math.min(inner[0]!, Math.max(band[0]!, ...above)),
    bottom: Math.max(inner[1]!, Math.min(Math.max(band[1]!, down), ...below)),
  };
}

/** Whether a cursor's word of `width` sits at (`at`, `y`) clear of every label · a
 *  word that touches a label reads as one with it. */
const wordIsFree = (at: number, y: number, width: number, labels: readonly Area[]) =>
  !labels.some((l) =>
    overlaps(
      { x: at - CURSOR_LABEL_CLEAR, y, w: width + 2 * CURSOR_LABEL_CLEAR, h: TYPE.tag.line },
      l,
    ),
  );

/** Where a cursor's word goes · just under the tracks; else just above them, where
 *  the labels of the parts beside it leave room; else under them, moved aside to the
 *  nearest free place, no further than its width and the air around it; else under
 *  every label (`y` undefined), its line still stopping at the tracks. */
function cursorWord(
  from: number,
  band: number[],
  width: number,
  length: number,
  labels: readonly Area[],
): { x: number; y?: number } {
  const close = band[1]! + CURSOR_LABEL_GAP;
  const above = band[0]! - CURSOR_LABEL_GAP - TYPE.tag.line;
  if (wordIsFree(from, close, width, labels)) return { x: from, y: close };
  if (above >= 0 && wordIsFree(from, above, width, labels)) return { x: from, y: above };
  const within = (at: number) => Math.min(Math.max(at, 0), Math.max(0, length - width));
  for (let shift = 0; shift <= width + 2 * CURSOR_LABEL_CLEAR; shift += CURSOR_SHIFT_STEP)
    for (const at of [within(from - shift), within(from + shift)])
      if (wordIsFree(at, close, width, labels)) return { x: at, y: close };
  return { x: from };
}

/** A group on one scale · its marks at their values, labels clear of each other,
 *  points on one shared track, stretches one track each; cursors across them. */
function placeAxis(ctx: Ctx, node: DgNode, kids: DgNode[], room: number): Inner {
  const vertical = node.attrs.direction === 'down';
  const cursors = kids.filter((kid) => kid.kind === 'cursor');
  const marks = kids.filter((kid) => kid.kind !== 'cursor');
  const values = marks.map(valuesOn);
  const labels = marks.map((kid) => axisLabel(ctx, kid));
  const every = [
    ...values.flatMap((v) => [v.from, v.to, v.at]),
    ...cursors.map((c) => numberOf(c.attrs.value)),
  ].filter((v): v is number => v !== undefined);
  const low = every.length ? Math.min(...every) : 0;
  const high = every.length ? Math.max(...every) : 1;
  const domain: [number, number] = low === high ? [low - 1, high + 1] : [low, high];
  const whole = tiles(values);
  const shared = values.every((v) => v.from === undefined) || whole;
  const length = vertical ? AXIS_DOWN_LENGTH : room;
  const result = axis({
    items: marks.map((_, i) => ({
      key: String(i),
      ...values[i],
      w: labels[i]!.w,
      h: labels[i]!.h,
    })),
    domain,
    length,
    orientation: vertical ? 'vertical' : 'horizontal',
    bounds: { w: room, h: HUGE },
    labelGap: AXIS_LABEL_GAP,
    trackThickness: whole ? AXIS_BAND_THICKNESS : AXIS_THICKNESS,
    lane: shared ? 'shared' : 'own',
    // Points on one line read both sides of it, a frise · stretches each have a track.
    alternate: shared,
  });
  const along = (start: number, end: number, across: number) =>
    vertical
      ? { x0: across, y0: start, x1: across, y1: end }
      : { x0: start, y0: across, x1: end, y1: across };
  const trackLine = (key: string) => {
    const track = result.tracks.find((t) => t.key === key);
    return track ? along(0, length, (track.start + track.end) / 2) : undefined;
  };
  const out: Kid[] = marks.map((kid, i) => {
    const mark = result.placed.find((p) => p.key === String(i));
    const label = result.labels.find((p) => p.key === String(i))!;
    const parts = [label, ...(mark ? [mark] : [])];
    const x = Math.min(...parts.map((p) => p.x));
    const y = Math.min(...parts.map((p) => p.y));
    const w = Math.max(...parts.map((p) => p.x + p.w)) - x;
    const h = Math.max(...parts.map((p) => p.y + p.h)) - y;
    const own = shared ? (i === 0 ? trackLine('shared') : undefined) : trackLine(String(i));
    return {
      node: kid,
      x,
      y,
      w,
      h,
      span: {
        mark: mark && { x: mark.x - x, y: mark.y - y, w: mark.w, h: mark.h },
        label: { x: label.x - x, y: label.y - y },
        shape:
          values[i]!.from !== undefined
            ? 'stretch'
            : values[i]!.at !== undefined
              ? 'point'
              : 'none',
        track: own && { x0: own.x0 - x, y0: own.y0 - y, x1: own.x1 - x, y1: own.y1 - y },
      },
    };
  });
  const place = axisScale(domain, length);
  // A cursor crosses the tracks, a little past them either side, and not the
  // labels · its own word sits past its far end, where no label is.
  const band = result.tracks.length
    ? [
        Math.min(...result.tracks.map((t) => t.start)) - CURSOR_REACH,
        Math.max(...result.tracks.map((t) => t.end)) + CURSOR_REACH,
      ]
    : [0, AXIS_THICKNESS];
  const reach = band[1]! - band[0]!;
  let past = 0;
  for (const cursor of cursors) {
    // A cursor at an end of the axis stands inside it, its whole width.
    const at = Math.min(
      Math.max(place(numberOf(cursor.attrs.value) ?? domain[0]), CURSOR_WIDTH / 2),
      length - CURSOR_WIDTH / 2,
    );
    const label = cursor.attrs.label ? oneLine(ctx, 'tag', cursor.attrs.label) : 0;
    if (vertical) {
      // Across a vertical axis the line runs left to right · its word after it.
      past = Math.max(past, label ? label + CURSOR_LABEL_GAP : 0);
      out.push({
        node: cursor,
        x: band[0]!,
        y: at - CURSOR_WIDTH / 2,
        w: reach,
        h: CURSOR_WIDTH,
        cursor: {
          travel: { x: 0, y: -at },
          label: label
            ? { x: reach + CURSOR_LABEL_GAP, y: CURSOR_WIDTH / 2 - TYPE.tag.line / 2 }
            : undefined,
        },
      });
      continue;
    }
    const x = at - CURSOR_WIDTH / 2;
    const centred = Math.min(Math.max(at - label / 2, 0), Math.max(0, length - label));
    const word = label
      ? cursorWord(centred, band, label, length, result.labels)
      : { x: centred, y: band[1]! };
    const labelX = word.x;
    const labelY =
      word.y ?? Math.max(band[1]!, ...result.labels.map((l) => l.y + l.h)) + CURSOR_LABEL_GAP;
    // The line reaches down to a word under the tracks, as far as no label stands in its way.
    const down = label && labelY > band[1]! ? labelY - CURSOR_LABEL_GAP : band[1]!;
    const { top, bottom } = cursorReach(x, band, down, result.labels);
    past = Math.max(past, label ? labelY + TYPE.tag.line - band[1]! : 0);
    out.push({
      node: cursor,
      x,
      y: top,
      w: CURSOR_WIDTH,
      h: bottom - top,
      cursor: {
        travel: { x: -at, y: 0 },
        label: label ? { x: labelX - x, y: labelY - top } : undefined,
      },
    });
  }
  const far = Math.max(vertical ? result.size.w : result.size.h, band[1]! + past);
  const size = vertical ? { w: far, h: result.size.h } : { w: result.size.w, h: far };
  return {
    w: size.w,
    h: size.h,
    kids: out,
    routes: new Map(),
    status: result.status,
    reasons: result.reasons.filter((r) => !r.startsWith('info: ')),
  };
}

/** A kid that is itself a group is laid out at the width it was given. */
function attachSolved(ctx: Ctx, kids: Kid[]): void {
  for (const kid of kids) {
    if (isGroupLike(kid.node)) kid.solved = solveGroup(ctx, kid.node, kid.w);
  }
}

// ── emitting ──────────────────────────────────────────────────────────────

interface Emitted {
  items: LItem[];
  boxes: Map<string, { x: number; y: number; w: number; h: number }>;
  links: LLink[];
  /** The range each gate's centre may take, by key · where `by` may move it. */
  gates: Map<string, { centreMin: number; centreMax: number }>;
}

const shiftText = (t: LText, x: number, y: number): LText => ({ ...t, x: t.x + x, y: t.y + y });

/** A tag set on one line at a corner · a gate's word, a cursor's. */
function tagAt(ctx: Ctx, text: string, x: number, y: number): LText {
  const { fitted, type } = setText(ctx, 'tag', text, MAX_TEXT_WIDTH);
  return {
    lines: fitted.lines,
    size: fitted.size,
    weight: type.weight,
    line: type.line,
    role: 'tag',
    fits: fitted.fits,
    x,
    y,
  };
}

/** The kids a lanes or an axis group placed with more than a rectangle · a lane,
 *  a gate, a mark on an axis, a cursor. False for any other kid. */
function emitPlaced(ctx: Ctx, kid: Kid, x: number, y: number, out: Emitted): boolean {
  const node = kid.node;
  const key = keyOf(node);
  const tone = node.attrs.tone ?? 'normal';
  const rect = { x, y, w: kid.w, h: kid.h };
  if (kid.lane) {
    const { cy, track, head, label } = kid.lane;
    out.items.push({
      kind: 'lane',
      key,
      node,
      ...rect,
      cy: y + cy,
      track: { x0: x + track.x0, x1: x + track.x1 },
      head,
      icon: label.icon && { ...label.icon, x: x + label.icon.x, y: y + label.icon.y },
      texts: label.texts.map((t) => shiftText(t, x, y)),
      tone,
      flow: flowOf(node, DEFAULT_LANE_FLOW),
      speed: (node.attrs.speed as Speed | undefined) ?? 'normal',
      runs: [],
    });
  } else if (kid.gate) {
    const { label } = kid.gate;
    out.items.push({
      kind: 'gate',
      key,
      node,
      ...rect,
      lanes: kid.gate.lanes,
      states: statesOf(node),
      stage: stepOf(node),
      texts:
        label && node.attrs.label ? [tagAt(ctx, node.attrs.label, x + label.x, y + label.y)] : [],
    });
    out.gates.set(key, { centreMin: x + kid.gate.centreMin, centreMax: x + kid.gate.centreMax });
  } else if (kid.span) {
    const { mark, label, shape, track } = kid.span;
    const laid = axisLabel(ctx, node);
    const drawn = mark ? { x: x + mark.x, y: y + mark.y, w: mark.w, h: mark.h } : rect;
    out.items.push({
      kind: 'span',
      key,
      node,
      ...drawn,
      shape,
      emphasis: node.attrs.emphasis === 'true',
      tone,
      texts: laid.texts.map((t) => shiftText(t, x + label.x, y + label.y)),
      track: track && { x0: x + track.x0, y0: y + track.y0, x1: x + track.x1, y1: y + track.y1 },
    });
  } else if (kid.cursor) {
    const { travel, label } = kid.cursor;
    out.items.push({
      kind: 'cursor',
      key,
      node,
      ...rect,
      travel,
      tone,
      texts:
        label && node.attrs.label ? [tagAt(ctx, node.attrs.label, x + label.x, y + label.y)] : [],
    });
  } else return false;
  out.boxes.set(key, rect);
  return true;
}

function emitKids(ctx: Ctx, solved: Solved, ox: number, oy: number, out: Emitted): void {
  const dotIndex = new Map<DgNode, number>();
  for (const kid of solved.kids) {
    const x = ox + kid.x;
    const y = oy + kid.y;
    const key = keyOf(kid.node);
    const tone = kid.node.attrs.tone ?? 'normal';
    const emphasis = kid.node.attrs.emphasis === 'true';
    if (emitPlaced(ctx, kid, x, y, out)) continue;
    if (isPiece(kid.node.kind)) {
      const laid = layPiece(envOf(ctx), kid.node, kid.w, iconKnown(ctx));
      const { h, ...parts } = laid;
      out.items.push({
        ...moved(parts, x, y),
        key,
        node: kid.node,
        x,
        y,
        w: kid.w,
        h: Math.max(kid.h, h),
        tone,
        emphasis,
        paint: (kid.node.attrs.paint as Paint | undefined) ?? 'pale',
      } as LPiece);
      out.boxes.set(key, { x, y, w: kid.w, h: Math.max(kid.h, h) });
      continue;
    }
    switch (kid.node.kind) {
      case 'box': {
        const laid = boxLayout(ctx, kid.node, kid.w);
        const h = Math.max(kid.h, laid.h);
        const tones = perClick(kid.node.attrs.tone, 'normal');
        out.items.push({
          kind: 'box',
          key,
          node: kid.node,
          x,
          y,
          w: kid.w,
          h,
          paint: ((kid.node.attrs.paint as Paint | undefined) ??
            (emphasis ? 'solid' : 'soft')) as Paint,
          tone: tones.at(-1)!,
          tones,
          emphasis,
          icon: laid.icon ? { ...laid.icon, x: x + laid.icon.x, y: y + laid.icon.y } : undefined,
          texts: laid.texts.map((t) => shiftText(t, x, y)),
          ...(laid.before
            ? {
                before: {
                  ...laid.before,
                  ...(laid.before.label ? { label: shiftText(laid.before.label, x, y) } : {}),
                  ...(laid.before.icon
                    ? {
                        icon: {
                          ...laid.before.icon,
                          x: x + laid.before.icon.x,
                          y: y + laid.before.icon.y,
                        },
                      }
                    : {}),
                },
              }
            : {}),
          ...(laid.proofDisc
            ? { proofDisc: { ...laid.proofDisc, x: x + laid.proofDisc.x, y: y + laid.proofDisc.y } }
            : {}),
        });
        out.boxes.set(key, { x, y, w: kid.w, h });
        break;
      }
      case 'text':
      case 'lane':
      case 'gate':
      case 'cursor': {
        const laid = textLayout(ctx, kid.node, kid.w);
        out.items.push({
          kind: 'box',
          key,
          node: kid.node,
          x,
          y,
          w: kid.w,
          h: kid.h,
          paint: 'none',
          tone,
          tones: [tone],
          emphasis,
          texts: laid.texts.map((t) => ({ ...t, x: x + t.x, y: y + t.y })),
        });
        out.boxes.set(key, { x, y, w: kid.w, h: kid.h });
        break;
      }
      case 'dot': {
        const index = dotIndex.get(kid.node) ?? 0;
        dotIndex.set(kid.node, index + 1);
        out.items.push({
          kind: 'dot',
          key,
          node: kid.node,
          x,
          y,
          size: kid.w,
          emphasis,
          tone,
          index,
        });
        // The cells of one mark are one target · a note points at all of them.
        const cell = { x, y, w: kid.w, h: kid.h };
        const seen = out.boxes.get(key);
        out.boxes.set(key, seen ? unionRect(seen, cell) : cell);
        break;
      }
      case 'bar': {
        const label = kid.node.attrs.label ?? '';
        const tag = kid.node.attrs.tag ?? '';
        const bar = kid.bar ?? { labelW: 0, barX: 0, barW: kid.w, tagW: 0 };
        const barX = x + bar.barX;
        const texts: LText[] = [];
        const beside = (role: 'label' | 'tag', text: string, left: number, room: number) => {
          if (!text) return;
          const { fitted, type } = setText(ctx, role, text, Math.max(1, room));
          texts.push({
            lines: fitted.lines,
            size: fitted.size,
            weight: type.weight,
            line: type.line,
            role,
            fits: fitted.fits,
            x: left,
            y: y + (kid.h - fitted.lines.length * type.line) / 2,
          });
        };
        beside('label', label, x, bar.labelW);
        beside('tag', tag, barX + bar.barW + BAR_TEXT_GAP, bar.tagW || BAR_TAG_MAX);
        // The bar itself is the mark · its text sits beside it.
        out.items.push({
          kind: 'bar',
          key,
          node: kid.node,
          x: barX,
          y,
          w: bar.barW,
          h: kid.h,
          emphasis,
          tone,
          texts,
        });
        out.boxes.set(key, { x, y, w: kid.w, h: kid.h });
        break;
      }
      case 'meter': {
        const laid = meterLayout(ctx, kid.node, kid.w);
        const shift = (t: LText) => shiftText(t, x, y);
        out.items.push({
          kind: 'meter',
          key,
          node: kid.node,
          x,
          y,
          w: kid.w,
          h: laid.h,
          track: { ...laid.track, x: x + laid.track.x, y: y + laid.track.y },
          fills: laid.fills,
          ...(laid.threshold === undefined ? {} : { threshold: x + laid.threshold }),
          tones: perClick(kid.node.attrs.tone, 'normal'),
          emphasis,
          texts: laid.texts.map(shift),
          figures: laid.figures.map(shift),
        });
        out.boxes.set(key, { x, y, w: kid.w, h: laid.h });
        break;
      }
      case 'queue': {
        const laid = queueLayout(ctx, kid.node, kid.w);
        out.items.push({
          kind: 'queue',
          key,
          node: kid.node,
          x,
          y,
          w: laid.w,
          h: laid.h,
          cells: laid.cells.map((c) => ({ ...c, x: x + c.x, y: y + c.y })),
          fills: queueFills(kid.node),
          tones: perClick(kid.node.attrs.tone, 'normal'),
          emphasis,
          texts: laid.texts.map((t) => shiftText(t, x, y)),
        });
        out.boxes.set(key, { x, y, w: laid.w, h: laid.h });
        break;
      }
      case 'curve': {
        const laid = curveLayout(ctx, kid.node, kid.w);
        const shift = (p: Point) => ({ x: x + p.x, y: y + p.y });
        out.items.push({
          kind: 'curve',
          key,
          node: kid.node,
          x,
          y,
          w: kid.w,
          h: laid.h,
          plot: { ...laid.plot, x: x + laid.plot.x, y: y + laid.plot.y },
          points: laid.points.map(shift),
          ...(laid.threshold === undefined ? {} : { threshold: y + laid.threshold }),
          ...(laid.crossing
            ? { crossing: { at: shift(laid.crossing.at), share: laid.crossing.share } }
            : {}),
          tone,
          emphasis,
          texts: laid.texts.map((t) => shiftText(t, x, y)),
        });
        out.boxes.set(key, { x, y, w: kid.w, h: laid.h });
        break;
      }
      case 'group':
      case 'panel': {
        const inner = kid.solved ?? solveGroup(ctx, kid.node, kid.w);
        const frame = frameOf(ctx, kid.node);
        if (frame.has) {
          const caption = kid.node.attrs.label
            ? setText(ctx, 'caption', kid.node.attrs.label, Math.max(1, kid.w - 2 * frame.pad))
            : null;
          out.items.push({
            kind: 'frame',
            key,
            node: kid.node,
            x,
            y,
            w: kid.w,
            h: Math.max(kid.h, inner.h),
            paint: paintOf(kid.node),
            tone,
            caption: caption
              ? {
                  lines: caption.fitted.lines,
                  size: caption.fitted.size,
                  weight: caption.type.weight,
                  line: caption.type.line,
                  role: 'caption',
                  fits: caption.fitted.fits,
                  x: x + frame.pad,
                  y: y + (frame.pad || FRAME_CAPTION_GAP / 2),
                }
              : undefined,
          });
        }
        out.boxes.set(key, { x, y, w: kid.w, h: Math.max(kid.h, inner.h) });
        emitKids(ctx, inner, x + (kid.inset?.x ?? 0), y + (kid.inset?.y ?? 0), out);
        break;
      }
      default:
        break;
    }
  }
}

// ── links and annotations ─────────────────────────────────────────────────

const centreOf = (b: { x: number; y: number; w: number; h: number }): Point => ({
  x: b.x + b.w / 2,
  y: b.y + b.h / 2,
});

/** Where a line from a box's centre toward a point leaves the box · so a link ends
 *  on the edge, not in the middle. */
function meet(b: { x: number; y: number; w: number; h: number }, toward: Point): Point {
  const c = centreOf(b);
  const dx = toward.x - c.x;
  const dy = toward.y - c.y;
  if (dx === 0 && dy === 0) return c;
  const scale = Math.min(
    dx === 0 ? Number.POSITIVE_INFINITY : b.w / 2 / Math.abs(dx),
    dy === 0 ? Number.POSITIVE_INFINITY : b.h / 2 / Math.abs(dy),
  );
  return { x: c.x + dx * scale, y: c.y + dy * scale };
}

/** Whether the segment p→q passes through the inside of a rect, `pad` in from its
 *  edges · Liang–Barsky, so a diagonal is tested as the line it is. A line that
 *  touches an edge, as a link does the boxes it joins, does not pass through. */
function segmentHitsRect(p: Point, q: Point, r: Rect, pad = 1): boolean {
  const [left, right, top, bottom] = [r.x + pad, r.x + r.w - pad, r.y + pad, r.y + r.h - pad];
  if (left >= right || top >= bottom) return false;
  const dx = q.x - p.x;
  const dy = q.y - p.y;
  let near = 0;
  let far = 1;
  for (const [step, room] of [
    [-dx, p.x - left],
    [dx, right - p.x],
    [-dy, p.y - top],
    [dy, bottom - p.y],
  ] as const) {
    if (step === 0) {
      if (room < 0) return false;
      continue;
    }
    const t = room / step;
    if (step < 0) near = Math.max(near, t);
    else far = Math.min(far, t);
    if (near > far) return false;
  }
  return near < far;
}

/** The rects a polyline runs through. */
const crossed = (points: Point[], rects: Rect[]): Rect[] =>
  rects.filter((r) => points.slice(1).some((q, k) => segmentHitsRect(points[k]!, q, r)));

/** A link goes round what stands between its ends this far from it. */
const DETOUR_CLEAR = 24;

/** Round the boxes between two boxes of one line · out of the top of one, along
 *  above everything in between, into the top of the other; under them when the way
 *  above is taken. Null when neither way is clear. */
function detour(a: Rect, b: Rect, obstacles: Rect[]): Point[] | null {
  const ca = centreOf(a);
  const cb = centreOf(b);
  const [lo, hi] = [Math.min(ca.x, cb.x), Math.max(ca.x, cb.x)];
  const spanned = [a, b, ...obstacles.filter((o) => o.x < hi && o.x + o.w > lo)];
  const above = Math.min(...spanned.map((r) => r.y)) - DETOUR_CLEAR;
  const below = Math.max(...spanned.map((r) => r.y + r.h)) + DETOUR_CLEAR;
  const over = [
    { x: ca.x, y: a.y },
    { x: ca.x, y: above },
    { x: cb.x, y: above },
    { x: cb.x, y: b.y },
  ];
  const under = [
    { x: ca.x, y: a.y + a.h },
    { x: ca.x, y: below },
    { x: cb.x, y: below },
    { x: cb.x, y: b.y + b.h },
  ];
  if (!crossed(over, obstacles).length) return over;
  return crossed(under, obstacles).length ? null : under;
}

/** An elbow between two boxes when they are not level · out of the sides, one bend
 *  in the middle of the gap; a straight line when they are. */
function routeBetween(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number },
  ortho: boolean,
  neighbours: { x: number; y: number; w: number; h: number }[] = [],
  obstacles: Rect[] = [],
): Point[] {
  const ca = centreOf(a);
  const cb = centreOf(b);
  // Two boxes on different lines of a wrapped row, side by side or not · the link
  // runs down the gutter between the lines (out of the bottom of one, into the top
  // of the other), where nothing is drawn, not across the boxes in between. The
  // gutter lies below the lowest box of a's line and above the highest of b's: a
  // neighbour that is taller than a is also in the way.
  const apart = a.y + a.h <= b.y || b.y + b.h <= a.y;
  if (apart) {
    const down = cb.y > ca.y;
    const line = (r: { y: number; h: number }) =>
      neighbours.filter((n) => n.y < r.y + r.h && n.y + n.h > r.y);
    const bottomOf = (r: { y: number; h: number }) =>
      Math.max(r.y + r.h, ...line(r).map((n) => n.y + n.h));
    const topOf = (r: { y: number; h: number }) => Math.min(r.y, ...line(r).map((n) => n.y));
    // One above the other, the line drops straight where both stand · a jog of a few
    // units between two centres reads as a slip.
    const left = Math.max(a.x, b.x) + FEED_INSET;
    const right = Math.min(a.x + a.w, b.x + b.w) - FEED_INSET;
    if (left <= right) {
      const x = Math.min(Math.max(ca.x, left), right);
      return [
        { x, y: down ? a.y + a.h : a.y },
        { x, y: down ? b.y : b.y + b.h },
      ];
    }
    const from = down ? bottomOf(a) : topOf(a);
    const to = down ? topOf(b) : bottomOf(b);
    const lane = (from + to) / 2;
    return [
      { x: ca.x, y: down ? a.y + a.h : a.y },
      { x: ca.x, y: lane },
      { x: cb.x, y: lane },
      { x: cb.x, y: down ? b.y : b.y + b.h },
    ];
  }
  const horizontal = Math.abs(cb.x - ca.x) >= Math.abs(cb.y - ca.y);
  if (!ortho || Math.abs(horizontal ? cb.y - ca.y : cb.x - ca.x) < 8) {
    const start = meet(a, cb);
    const end = meet(b, ca);
    const straight = [start, end];
    // Two boxes of one line with another between them · the straight line would run
    // under the box in between (links are painted first), so it goes round it.
    const between = obstacles.filter((o) => o !== a && o !== b);
    return horizontal && crossed(straight, between).length
      ? (detour(a, b, between) ?? straight)
      : straight;
  }
  if (horizontal) {
    const sx = cb.x > ca.x ? a.x + a.w : a.x;
    const ex = cb.x > ca.x ? b.x : b.x + b.w;
    const mid = (sx + ex) / 2;
    return [
      { x: sx, y: ca.y },
      { x: mid, y: ca.y },
      { x: mid, y: cb.y },
      { x: ex, y: cb.y },
    ];
  }
  const sy = cb.y > ca.y ? a.y + a.h : a.y;
  const ey = cb.y > ca.y ? b.y : b.y + b.h;
  const mid = (sy + ey) / 2;
  return [
    { x: ca.x, y: sy },
    { x: ca.x, y: mid },
    { x: cb.x, y: mid },
    { x: cb.x, y: ey },
  ];
}

const LABEL_CLEAR = 8;
/** How far a label may graze a mark's edge and still be beside it, in units. */
const LABEL_TOUCH = 4;

/** The runs of a polyline, longest first · horizontal ones apart from vertical ones. */
function runsOf(points: Point[]): { x: number; y: number; length: number; flat: boolean }[] {
  return points
    .slice(1)
    .map((b, i) => {
      const a = points[i]!;
      const dx = Math.abs(b.x - a.x);
      const dy = Math.abs(b.y - a.y);
      return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, length: Math.max(dx, dy), flat: dx >= dy };
    })
    .sort((p, q) => q.length - p.length);
}

/** The rect a label set centred on `x` takes. */
const labelRect = (x: number, y: number, width: number, height: number): Rect => ({
  x: x - width / 2,
  y,
  w: width,
  h: height,
});

/** A link's label · above a horizontal run, centred, else under it; beside a
 *  vertical run, right then left · on the longest run first, and on the first place
 *  that touches no mark (the ends included, never what holds them). When none is
 *  free it stays on the first, and is said (`blocked`): drawn there, it would sit on
 *  a mark. */
function linkLabel(
  ctx: Ctx,
  text: string,
  points: Point[],
  avoid: Rect[] = [],
): { text: LText; blocked: boolean } {
  const { fitted, type } = setText(ctx, 'tag', text, MAX_TEXT_WIDTH);
  const width = oneLine(ctx, 'tag', text);
  const height = fitted.lines.length * type.line;
  const runs = runsOf(points);
  // A horizontal run too short for the label still takes it, above, when no vertical
  // run can · as before, a short link keeps its word on it.
  const worth = (run: (typeof runs)[number]) =>
    run.flat && run.length >= Math.min(width + 2 * LABEL_CLEAR, 64);
  const ordered = [...runs.filter(worth), ...runs.filter((r) => !worth(r))];
  const candidates = ordered.flatMap((run) =>
    run.flat
      ? [
          { x: run.x, y: run.y - height - LABEL_CLEAR },
          { x: run.x, y: run.y + LABEL_CLEAR },
        ]
      : [
          { x: run.x + LABEL_CLEAR + width / 2, y: run.y - height / 2 },
          { x: run.x - LABEL_CLEAR - width / 2, y: run.y - height / 2 },
        ],
  );
  // A label that grazes a mark's edge by a unit or two is beside it, not on it · the
  // ink rule (`ILL_TEXT_OVER_SHAPE`) allows as much.
  const inside = (r: Rect): Rect => ({
    x: r.x + LABEL_TOUCH,
    y: r.y + LABEL_TOUCH,
    w: r.w - 2 * LABEL_TOUCH,
    h: r.h - 2 * LABEL_TOUCH,
  });
  const free = candidates.find(
    (c) => !avoid.some((r) => overlaps(labelRect(c.x, c.y, width, height), inside(r))),
  );
  const chosen = free ?? candidates[0] ?? { x: points[0]!.x, y: points[0]!.y };
  return {
    text: {
      lines: fitted.lines,
      size: fitted.size,
      weight: type.weight,
      line: type.line,
      role: 'tag',
      fits: fitted.fits,
      x: chosen.x,
      y: chosen.y,
    },
    blocked: !free,
  };
}

/** A label with no free place beside its line · drawn on a mark. How many of its
 *  characters the longest run of its line holds, the gap it would need. */
function labelBlocked(ctx: Ctx, text: string, from: string, to: string, points: Point[]): DgIssue {
  const width = oneLine(ctx, 'tag', text);
  const run = runsOf(points)[0]?.length ?? 0;
  const free = Math.max(0, run - 2 * LABEL_CLEAR);
  const fitting = width > 0 ? Math.floor((text.length * Math.min(free, width)) / width) : 0;
  return {
    code: 'DG_LABEL_BLOCKED',
    severity: 'warning',
    items: [`${from} → ${to} · label="${text}"`],
    message: `the label "${text}" of the link ${from} → ${to} finds no place beside its line that is clear of the marks · it is drawn on one · its line holds ${fitting} of its ${text.length} characters`,
    measurement: { labelWidth: Math.round(width), runLength: Math.round(run) },
    fix: {
      action: 'shorten-label',
      link: `${from} → ${to}`,
      holds: fitting,
      or: ['gap="airy" on the group that holds both ends', 'a dg-text beside one end instead'],
    },
  };
}

/** Whether two rects are the same · an end of a link is not what holds it. */
const sameRect = (a: Rect, b: Rect) =>
  Math.abs(a.x - b.x) < EPSILON &&
  Math.abs(a.y - b.y) < EPSILON &&
  Math.abs(a.w - b.w) < EPSILON &&
  Math.abs(a.h - b.h) < EPSILON;

/** What a link's label must keep off · every mark drawn and every label set before
 *  it, but not the surfaces that hold one of its ends (its words sit inside them). */
function labelObstacles(ctx: Ctx, items: LItem[], links: LLink[], a: Rect, b: Rect): Rect[] {
  const holder = (r: Rect) => (holds(r, a) && !sameRect(r, a)) || (holds(r, b) && !sameRect(r, b));
  const marks = items
    .map((i) =>
      i.kind === 'dot'
        ? { x: i.x, y: i.y, w: i.size, h: i.size }
        : { x: i.x, y: i.y, w: i.w, h: i.h },
    )
    .filter((r) => !holder(r));
  const labels = links.flatMap((l) => {
    if (!l.label) return [];
    const w = Math.max(...l.label.lines.map((line) => oneLine(ctx, 'tag', line)));
    return [labelRect(l.label.x, l.label.y, w, l.label.lines.length * l.label.line)];
  });
  return [...marks, ...labels];
}

/** A mark a link must not run through · a box (with a surface or its words alone), a
 *  gauge, a queue, a curve. */
interface Solid {
  key: string;
  rect: Rect;
}

function solidsOf(items: LItem[]): Solid[] {
  return items
    .filter(
      (i) =>
        i.kind === 'box' ||
        i.kind === 'meter' ||
        i.kind === 'queue' ||
        i.kind === 'curve' ||
        isPiece(i.kind),
    )
    .map((i) => ({ key: i.key, rect: { x: i.x, y: i.y, w: (i as LBox).w, h: (i as LBox).h } }));
}

/** What stands in the way of a link between two rects · not its ends, nor what
 *  either end holds (a link to a group leaves its edge, not its marks). */
const obstaclesFor = (solids: Solid[], a: Rect, b: Rect): Solid[] =>
  solids.filter(
    (s) => !holds(s.rect, a) && !holds(s.rect, b) && !holds(a, s.rect) && !holds(b, s.rect),
  );

function collectLinks(
  ctx: Ctx,
  node: DgNode,
  solved: Solved,
  ox: number,
  oy: number,
  out: Emitted,
  solids: Solid[] = [],
): void {
  const { boxes, links } = out;
  const kids = solved.kids;
  const byName = new Map<string, Kid>();
  for (const kid of kids) {
    if (kid.node.attrs.name) byName.set(kid.node.attrs.name, kid);
    if (kid.node.attrs.label && !byName.has(kid.node.attrs.label))
      byName.set(kid.node.attrs.label, kid);
  }
  const boxOf = (kid: Kid) =>
    boxes.get(keyOf(kid.node)) ?? { x: ox + kid.x, y: oy + kid.y, w: kid.w, h: kid.h };
  const layout = node.attrs.layout ?? 'row';
  const explicit = node.children.filter((child) => child.kind === 'link');
  const arrowChain = node.attrs.link === 'arrow' || node.attrs.link === 'line';
  const used = new Set<string>();
  const labelled = new Set<DgNode>();

  // An end is a child of this group, or a mark placed deeper in another one · a link
  // may join two parts of a picture, each laid out on its own.
  const endOf = (name: string): { key: string; rect: Rect; kid?: Kid } | undefined => {
    const kid = byName.get(name);
    if (kid) return { key: keyOf(kid.node), rect: boxOf(kid), kid };
    const placed = boxes.get(name);
    return placed ? { key: name, rect: placed } : undefined;
  };
  for (const link of explicit) {
    for (const from of words(link.attrs.from)) {
      for (const to of words(link.attrs.to)) {
        const a = endOf(from);
        const b = endOf(to);
        if (!a || !b || a.key === b.key) continue;
        const routeKey = a.kid && b.kid ? `${a.kid.node.index}->${b.kid.node.index}` : '';
        if (routeKey) used.add(routeKey);
        // A link asked straight is a straight line, even where an engine routed it ·
        // a funnel converges in diagonals, not on a bus.
        const straight = link.attrs.route === 'straight';
        const engineRoute = routeKey ? solved.routes.get(routeKey) : undefined;
        const points = straight
          ? [meet(a.rect, centreOf(b.rect)), meet(b.rect, centreOf(a.rect))]
          : engineRoute
            ? engineRoute.map((p) => ({ x: ox + p.x, y: oy + p.y }))
            : routeBetween(
                a.rect,
                b.rect,
                true,
                kids.map(boxOf),
                obstaclesFor(solids, a.rect, b.rect).map((s) => s.rect),
              );
        // A link mark written for several pairs ("a b" to "c") is labelled once, on
        // the first pair · a label per pair would print the same word twice.
        const labelHere = !!link.attrs.label && !labelled.has(link);
        if (labelHere) labelled.add(link);
        const label = labelHere
          ? linkLabel(
              ctx,
              link.attrs.label!,
              points,
              labelObstacles(ctx, out.items, links, a.rect, b.rect),
            )
          : undefined;
        if (label?.blocked)
          ctx.issues.push(labelBlocked(ctx, link.attrs.label!, a.key, b.key, points));
        links.push({
          from: a.key,
          to: b.key,
          points,
          dashed: link.attrs.dashed === 'true',
          head: true,
          label: label?.text,
          flow: flowOf(link, 0),
          speed: (link.attrs.speed as Speed | undefined) ?? 'normal',
          node: link,
        });
      }
    }
  }
  // `link="arrow"` on a row, a column or a ring chains its children.
  if (arrowChain && (layout === 'row' || layout === 'column' || layout === 'ring')) {
    const chain = kids.filter(
      (kid) => kid.node.kind !== 'dot' && !(layout === 'ring' && isRingMiddle(kid.node)),
    );
    const pairs =
      layout === 'ring'
        ? chain.map((kid, i) => [kid, chain[(i + 1) % chain.length]!] as const)
        : chain.slice(1).map((kid, i) => [chain[i]!, kid] as const);
    for (const [a, b] of pairs) {
      if (a === b) continue;
      const routeKey = `${a.node.index}->${b.node.index}`;
      if (used.has(routeKey)) continue;
      const engineRoute = solved.routes.get(routeKey);
      const points = engineRoute
        ? engineRoute.map((p) => ({ x: ox + p.x, y: oy + p.y }))
        : routeBetween(boxOf(a), boxOf(b), false, kids.map(boxOf));
      links.push({
        from: keyOf(a.node),
        to: keyOf(b.node),
        points,
        dashed: false,
        head: node.attrs.link === 'arrow',
        flow: 0,
        speed: 'normal',
      });
    }
  }
  for (const kid of kids) {
    if (isGroupLike(kid.node) && kid.solved)
      collectLinks(
        ctx,
        kid.node,
        kid.solved,
        ox + kid.x + (kid.inset?.x ?? 0),
        oy + kid.y + (kid.inset?.y ?? 0),
        out,
        solids,
      );
  }
}

/** A link that runs through a mark that is not one of its ends · drawn under it,
 *  the line seems cut. The engine goes round what it can; what is left is said, with
 *  the marks it crosses. */
function linksThrough(links: LLink[], boxes: Emitted['boxes'], solids: Solid[]): DgIssue[] {
  const found = links.flatMap((link) => {
    const a = boxes.get(link.from);
    const b = boxes.get(link.to);
    if (!a || !b) return [];
    const hit = obstaclesFor(solids, a, b).filter((s) => crossed(link.points, [s.rect]).length);
    return hit.length
      ? [{ link: `${link.from} → ${link.to}`, crosses: hit.map((s) => s.key) }]
      : [];
  });
  return found.map(({ link, crosses }) => ({
    code: 'DG_LINK_CROSSES',
    severity: 'warning',
    items: [link],
    message: `the link ${link} runs under ${crosses.map((c) => `"${c}"`).join(', ')} · the mark is painted over it and the line seems cut there`,
    measurement: { link, crosses },
    fix: {
      action: 'reroute',
      crosses,
      try: ['drop route="straight"', `place ${link.split(' → ').join(' and ')} side by side`],
    },
  }));
}

const EPSILON = 0.5;

/** The width a note is set in · what it wants, up to a comfortable measure, and
 *  never less than its longest word, which cannot be cut. */
const noteWidth = (block: Block) => Math.max(block.minW, Math.min(block.prefW, MAX_TEXT_WIDTH));

const SIDE_ORDER = ['right', 'left', 'top', 'bottom'] as const;

/** Put each annotation beside its target, on the side asked first and then the
 *  others, where it touches no other box. The leader is a short line from the note
 *  to the target's edge. */
function placeNotes(
  ctx: Ctx,
  node: DgNode,
  out: Emitted,
  bounds: { w: number; h: number },
): LNote[] {
  const notes: LNote[] = [];
  // A link's label is in the way as much as a box · it is set centred on its x.
  const labels = out.links.flatMap((link) => {
    if (!link.label) return [];
    const w = Math.max(...link.label.lines.map((line) => oneLine(ctx, 'tag', line)));
    return [
      { x: link.label.x - w / 2, y: link.label.y, w, h: link.label.lines.length * link.label.line },
    ];
  });
  // The caption of a group or a panel is in the way too · a note over it hides its name.
  const captions = out.items.flatMap((item) =>
    item.kind === 'frame' && item.caption
      ? [
          {
            x: item.caption.x,
            y: item.caption.y,
            w: Math.max(...item.caption.lines.map((line) => oneLine(ctx, 'tag', line))),
            h: item.caption.lines.length * item.caption.line,
          },
        ]
      : [],
  );
  const taken: { x: number; y: number; w: number; h: number }[] = [
    ...out.boxes.values(),
    ...labels,
    ...captions,
  ];
  const annotations: DgNode[] = [];
  // The panel each mark belongs to · a note stays in the panel of its mark, where its
  // picture is, never in the gap between two panels or over the next one.
  const homeOf = new Map<string, string>();
  const visit = (n: DgNode, panel?: string) => {
    for (const child of n.children) {
      if (isAnnotation(child)) annotations.push(child);
      if (panel && child.attrs.name) homeOf.set(child.attrs.name, panel);
      if (isGroupLike(child))
        visit(child, child.kind === 'panel' ? (child.attrs.name ?? panel) : panel);
    }
  };
  visit(node);
  for (const annotation of annotations) {
    const target = out.boxes.get(annotation.attrs.for!);
    if (!target) continue;
    const homeName = homeOf.get(annotation.attrs.for!);
    const home = homeName ? out.boxes.get(homeName) : undefined;
    const status = annotation.kind === 'status';
    const block = annotationBlock(ctx, annotation);
    const w = noteWidth(block);
    const h = block.heightFor(w);
    const first =
      annotation.attrs.side && (SIDE_ORDER as readonly string[]).includes(annotation.attrs.side)
        ? [annotation.attrs.side as (typeof SIDE_ORDER)[number]]
        : [];
    const tried = [...first, ...SIDE_ORDER.filter((s) => !first.includes(s))];
    let chosen: { x: number; y: number; side: (typeof SIDE_ORDER)[number] } | null = null;
    // Above or under, a note wider than its target slides inside the room while it
    // still stands over the target · a mark flush with an edge keeps its note.
    const across = Math.min(
      Math.max(target.x + target.w / 2 - w / 2, 0, target.x - w + LEADER_GAP),
      bounds.w - w,
      target.x + target.w - LEADER_GAP,
    );
    for (const side of tried) {
      const candidate = {
        right: { x: target.x + target.w + LEADER_GAP, y: target.y + target.h / 2 - h / 2 },
        left: { x: target.x - LEADER_GAP - w, y: target.y + target.h / 2 - h / 2 },
        top: { x: across, y: target.y - LEADER_GAP - h },
        bottom: { x: across, y: target.y + target.h + LEADER_GAP },
      }[side];
      const rect = { ...candidate, w, h };
      // A note asked on top of a mark at the top of the drawing goes there · the
      // drawing is moved down to make the room (`layoutAt`). Any other note keeps the
      // top as a wall, so a note that did not ask is not moved above the drawing.
      const aboveAllowed = side === 'top' && first[0] === 'top';
      // The groups around the target hold it · a note beside it is in them too.
      const free =
        !taken.some((t) => t !== target && !holds(t, target) && overlaps(rect, t)) &&
        // Inside the room, with a half unit of slack: a note asked for exactly the
        // room that was reserved for it must not be refused by a rounding error.
        candidate.x >= -EPSILON &&
        (candidate.y >= -EPSILON || aboveAllowed) &&
        candidate.x + w <= bounds.w + EPSILON &&
        (!home || holds(home, rect));
      if (free) {
        chosen = { ...candidate, side };
        break;
      }
    }
    if (!chosen) {
      ctx.reasons.push(`no free side beside "${annotation.attrs.for}" for its note`);
      chosen = { x: target.x + target.w + LEADER_GAP, y: target.y, side: 'right' };
    }
    const laid = status ? statusLayout(ctx, annotation, w) : textLayout(ctx, annotation, w);
    const note: LNote = {
      texts: laid.texts.map((t) => ({ ...t, x: chosen!.x + t.x, y: chosen!.y + t.y })),
      x: chosen.x,
      y: chosen.y,
      w,
      h: laid.h,
      target: annotation.attrs.for!,
      node: annotation,
      ...(status
        ? { status: statusOf(annotation, chosen.x, chosen.y + (laid.h - STATUS_DISC) / 2) }
        : {}),
    };
    const from: Point = {
      x:
        chosen.side === 'right'
          ? chosen.x
          : chosen.side === 'left'
            ? chosen.x + w
            : clamp(target.x + target.w / 2, chosen.x, chosen.x + w),
      y:
        chosen.side === 'top'
          ? chosen.y + laid.h
          : chosen.side === 'bottom'
            ? chosen.y
            : chosen.y + laid.h / 2,
    };
    // A status stands against its mark, with no line to it · a disc beside a box.
    if (!status) note.leader = [from, meet(target, from)];
    taken.push({ x: chosen.x, y: chosen.y, w, h: laid.h });
    notes.push(note);
  }
  return notes;
}

/** A note beside a mark · a `dg-text` with `for`, or a status. */
const isAnnotation = (node: DgNode) =>
  (node.kind === 'text' || node.kind === 'status') && !!node.attrs.for;

/** A status's disc, and the room between it and its words. */
const STATUS_DISC = 32;
const STATUS_GAP = 10;

/** A status's words · its label as a tag, its note under it, after the disc. */
function statusLayout(ctx: Ctx, node: DgNode, width: number): { h: number; texts: LText[] } {
  const room = Math.max(1, width - STATUS_DISC - STATUS_GAP);
  const texts: LText[] = [];
  let y = 0;
  for (const [role, text] of [
    ['tag', node.attrs.label ?? ''],
    ['note', node.attrs.note ?? ''],
  ] as const) {
    if (!text.trim()) continue;
    const laid = lineAt(ctx, role, text, room, STATUS_DISC + STATUS_GAP, y);
    texts.push(laid);
    y += laid.lines.length * laid.line;
  }
  const h = Math.max(STATUS_DISC, y);
  // Words shorter than the disc stand in its middle.
  const shift = (h - y) / 2;
  return { h, texts: texts.map((t) => ({ ...t, y: t.y + shift })) };
}

function statusBlock(ctx: Ctx, node: DgNode): Block {
  const words = [
    { role: 'tag' as const, text: node.attrs.label ?? '' },
    { role: 'note' as const, text: node.attrs.note ?? '' },
  ];
  const disc = STATUS_DISC + STATUS_GAP;
  const minW = Math.ceil(disc + Math.max(0, ...words.map((w) => longestWord(ctx, w.role, w.text))));
  const prefW = Math.max(
    minW,
    Math.ceil(
      disc +
        Math.min(MAX_TEXT_WIDTH, Math.max(0, ...words.map((w) => oneLine(ctx, w.role, w.text)))),
    ),
  );
  // A status says a few words · it keeps them on one line, up to the measure of a note.
  return {
    key: keyOf(node),
    minW: Math.max(prefW, STATUS_DISC),
    prefW: Math.max(prefW, STATUS_DISC),
    maxW: Math.max(prefW, STATUS_DISC),
    heightFor: (w) => statusLayout(ctx, node, w).h,
  };
}

const annotationBlock = (ctx: Ctx, node: DgNode): Block =>
  node.kind === 'status' ? statusBlock(ctx, node) : textBlock(ctx, node);

/** A status's disc and its state before and after its beat. */
function statusOf(node: DgNode, x: number, y: number): NonNullable<LNote['status']> {
  const states = words(node.attrs.state);
  return {
    disc: { x, y, size: STATUS_DISC },
    before: states[0] ?? 'ok',
    after: states.at(-1) ?? 'ok',
  };
}

/** The width each side of the diagram must keep free for the notes asked to stand
 *  there · the widest note of each side, and the leader's gap. Top and bottom notes
 *  take height: the drawing counts it when it is measured, a panel keeps it inside
 *  its own frame (`top`, `bottom`, the tallest of each side). */
function reserveForNotes(
  ctx: Ctx,
  root: DgNode,
): { left: number; right: number; top: number; bottom: number } {
  const reserve = { left: 0, right: 0, top: 0, bottom: 0 };
  const visit = (node: DgNode) => {
    for (const child of node.children) {
      if (isAnnotation(child)) {
        const side = child.attrs.side;
        const block = annotationBlock(ctx, child);
        const width = noteWidth(block) + LEADER_GAP;
        const height = block.heightFor(noteWidth(block)) + LEADER_GAP;
        if (side === 'left') reserve.left = Math.max(reserve.left, width);
        else if (side === 'top') reserve.top = Math.max(reserve.top, height);
        else if (side === 'bottom') reserve.bottom = Math.max(reserve.bottom, height);
        else if (side === undefined || side === 'right')
          reserve.right = Math.max(reserve.right, width);
      }
      if (isGroupLike(child)) visit(child);
    }
  };
  // A composition keeps the room of its notes inside each panel (`solvePanel`).
  if (!root.attrs.compose) visit(root);
  return reserve;
}

type Rect = { x: number; y: number; w: number; h: number };

function unionRect(a: Rect, b: Rect): Rect {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  return { x, y, w: Math.max(a.x + a.w, b.x + b.w) - x, h: Math.max(a.y + a.h, b.y + b.h) - y };
}

const overlaps = (
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number },
) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

/** Whether `outer` holds `inner` whole · a group holding one of its marks. */
const holds = (outer: Rect, inner: Rect) =>
  outer.x <= inner.x + EPSILON &&
  outer.y <= inner.y + EPSILON &&
  outer.x + outer.w >= inner.x + inner.w - EPSILON &&
  outer.y + outer.h >= inner.y + inner.h - EPSILON;

// ── gates and runs ────────────────────────────────────────────────────────

/** How a gate stands on click `stage` · absent before the click it appears on. */
export function gateStateAt(gate: LGate, stage: number, appears = gate.stage): GateState | null {
  if (stage < appears) return null;
  return gate.states[Math.min(stage, gate.states.length - 1)] ?? null;
}

/** A gate driven by a mark (`by`) stands under it, as far as its queue and its far
 *  side let it, and a line comes down from that mark to it · elbowed when the gate
 *  could not stand right under. Its word moves beside the line. */
function alignGate(
  ctx: Ctx,
  gate: LGate,
  feeder: Rect,
  range: { centreMin: number; centreMax: number },
): void {
  const wanted = feeder.x + feeder.w / 2;
  const centre = gateCentre(range, wanted);
  gate.x += centre - (gate.x + gate.w / 2);
  const [label] = gate.texts;
  if (label) {
    const width = oneLine(ctx, 'tag', gate.node.attrs.label ?? '');
    const right = centre + GATE_LABEL_BESIDE;
    label.x = right + width <= ctx.options.bounds.w ? right : centre - GATE_LABEL_BESIDE - width;
  }
  const below = feeder.y + feeder.h <= gate.y;
  const top = below ? feeder.y + feeder.h : feeder.y;
  const to = { x: centre, y: below ? gate.y : gate.y + gate.h };
  // Under the feeder still, the line drops straight from it · else it leaves the
  // feeder's middle and bends once, half way.
  const under = centre >= feeder.x + FEED_INSET && centre <= feeder.x + feeder.w - FEED_INSET;
  const middle = (top + to.y) / 2;
  gate.feed = under
    ? [{ x: centre, y: top }, to]
    : [{ x: wanted, y: top }, { x: wanted, y: middle }, { x: centre, y: middle }, to];
}

/** A feed line leaves its feeder this far in from a corner at least. */
const FEED_INSET = 24;

/** Gates under the marks that drive them, then the runs of every lane: one when
 *  the slide is entered, and one more on each click where a gate on it moves. */
function resolveLanes(ctx: Ctx, out: Emitted, stages: number): void {
  const gates = out.items.filter((i): i is LGate => i.kind === 'gate');
  for (const gate of gates) {
    const feeder = gate.node.attrs.by ? out.boxes.get(gate.node.attrs.by) : undefined;
    const range = out.gates.get(gate.key);
    if (!feeder || !range) continue;
    alignGate(ctx, gate, feeder, range);
    out.boxes.set(gate.key, { x: gate.x, y: gate.y, w: gate.w, h: gate.h });
  }
  for (const lane of out.items.filter((i): i is LLane => i.kind === 'lane')) {
    const on = gates.filter((g) => g.lanes.includes(lane.key));
    for (let stage = 0; stage <= stages; stage += 1) {
      const moved =
        stage === 0 || on.some((g) => gateStateAt(g, stage) !== gateStateAt(g, stage - 1));
      if (!moved) continue;
      const standing = on.flatMap((g) => {
        const state = gateStateAt(g, stage);
        return state ? [{ x: g.x, w: g.w, state }] : [];
      });
      lane.runs.push({
        stage,
        ...planRun({ track: lane.track, gates: standing, flow: lane.flow, speed: lane.speed }),
      });
    }
  }
}

/** Where the rows of a table carried from another mark (`from`) come from · each row
 *  from the row of the same rank of a table (a struck row is not carried), from the
 *  middle of any other mark. */
function resolveCarried(out: Emitted): void {
  for (const table of out.items) {
    if (table.kind !== 'table' || !table.node.attrs.from) continue;
    const box = out.boxes.get(table.node.attrs.from);
    if (!box) continue;
    const source = out.items.find((item) => item.key === table.node.attrs.from);
    const sourceRows = source?.kind === 'table' ? source.rows.filter((r) => !r.struck) : [];
    table.travel = table.rows.map((row, n) => {
      const from = sourceRows[Math.min(n, sourceRows.length - 1)]?.rect ?? {
        x: box.x + box.w / 2 - row.rect.w / 2,
        y: box.y + box.h / 2 - row.rect.h / 2,
      };
      return { dx: from.x - row.rect.x, dy: from.y - row.rect.y };
    });
  }
}

// ── the diagram ───────────────────────────────────────────────────────────

/** How many of the diagram's top-level marks, taken from the first, would fit the
 *  box · the number an agent is told to keep when it asked for more than the box
 *  holds. Links and annotations stay (those that point at a removed mark are
 *  simply not drawn). 0 when not even one fits. Found by trying fewer and fewer,
 *  since a diagram has a handful of marks and every attempt is a pure layout. */
export function marksThatFit(parsed: ParsedDiagram, options: LayoutOptions): number {
  const picture = treeAt(parsed.children, options.stage ?? parsed.stages);
  const carrying = picture.filter(isLayoutChild);
  for (let keep = carrying.length - 1; keep >= 1; keep -= 1) {
    const kept = new Set(carrying.slice(0, keep));
    const children = picture.filter((child) => !isLayoutChild(child) || kept.has(child));
    if (layoutDiagram({ ...parsed, children }, options).status === 'fit') return keep;
  }
  return 0;
}

/** Lay out a parsed diagram in a box. */
export function layoutDiagram(parsed: ParsedDiagram, options: LayoutOptions): DiagramLayout {
  const ladder: Density[] = options.density ? [options.density] : ['normal', 'tight'];
  let best: DiagramLayout | null = null;
  for (const density of ladder) {
    const attempt = layoutAt(parsed, { ...options, density });
    if (!best || attempt.reasons.length < best.reasons.length) best = attempt;
    if (attempt.status === 'fit') return attempt;
  }
  return best as DiagramLayout;
}

/** The largest `value` of any bar in a tree, every state included. */
function largestBar(nodes: DgNode[]): number {
  return Math.max(
    0,
    ...nodes.map((node) =>
      Math.max(node.kind === 'bar' ? readValue(node.attrs.value) : 0, largestBar(node.children)),
    ),
  );
}

function layoutAt(
  parsed: ParsedDiagram,
  options: LayoutOptions & { density: Density },
): DiagramLayout {
  const ctx: Ctx = {
    options,
    spacing: SPACING[options.density],
    reasons: [],
    issues: [],
    cache: new Map(),
    barTop: parsed.states ? largestBar(parsed.children) : 0,
    besideLanes: new Set(),
  };
  const root: DgNode = {
    kind: 'group',
    attrs: { ...parsed.attrs, layout: parsed.attrs.layout ?? 'row' },
    children: treeAt(parsed.children, options.stage ?? parsed.stages),
    index: -1,
  };
  // A note beside a mark needs room beside it · it is reserved before anything is
  // placed, not looked for afterwards on a drawing that is already full.
  const reserve = reserveForNotes(ctx, root);
  const roomW = Math.max(1, options.bounds.w - reserve.left - reserve.right);
  const solved = solveGroup(ctx, root, roomW);
  // The content is centred in the room that is left.
  const ox = reserve.left + Math.max(0, (roomW - solved.w) / 2);
  const said = { issues: ctx.issues.length, reasons: ctx.reasons.length };
  const emit = (oy: number) => {
    ctx.issues.length = said.issues;
    ctx.reasons.length = said.reasons;
    const emitted: Emitted = { items: [], boxes: new Map(), links: [], gates: new Map() };
    emitKids(ctx, solved, ox, oy, emitted);
    resolveLanes(ctx, emitted, parsed.stages);
    resolveCarried(emitted);
    const solids = solidsOf(emitted.items);
    collectLinks(ctx, root, solved, ox, oy, emitted, solids);
    ctx.issues.push(...linksThrough(emitted.links, emitted.boxes, solids));
    return { out: emitted, notes: placeNotes(ctx, root, emitted, options.bounds) };
  };
  // A note asked on top of a mark at the top stands above the drawing · the drawing
  // is laid out again that much lower, so the note is inside the frame.
  let { out, notes } = emit(0);
  const above = Math.min(0, ...notes.map((n) => n.y));
  if (above < -EPSILON) ({ out, notes } = emit(-above));

  const reasons = [...solved.reasons, ...ctx.reasons];
  const bottoms = [
    solved.h - above,
    ...notes.map((n) => n.y + n.h),
    ...out.items.map((i) => ('h' in i ? i.y + i.h : i.y + i.size)),
  ];
  const height = Math.ceil(Math.max(...bottoms, 1));
  if (solved.w > options.bounds.w + 0.5)
    reasons.push(`the content is ${Math.round(solved.w)} units wide in ${options.bounds.w}`);
  if (height > options.bounds.h)
    reasons.push(`the content is ${height} units tall in ${options.bounds.h}`);
  return {
    size: { w: options.bounds.w, h: height },
    items: out.items,
    links: out.links,
    notes,
    status: reasons.length ? 'unresolved' : 'fit',
    reasons,
    issues: ctx.issues,
    density: options.density,
    stages: parsed.stages,
    tree: root.children,
    places: out.boxes,
  };
}

export { nameOf };
