// ════════════════════════════════════════════════════════════════
// RIKIKI · diagram, the marks that tell a story in their own words
//
// A terminal typed line by line, a table whose rows travel and change, a switch
// with two states, a timer that runs, a band of time cut once, a row of people, a
// browser screen, a counter, and the charts (a pie, columns, a waterfall · charts.ts) · the
// vocabulary that boxes and arrows could not say. Each is placed by its group like any mark (a
// block: how narrow it can be, how wide it likes, how tall at a width) and laid out
// here, its parts as offsets from its corner. A status is a note with a disc,
// placed by layout.ts beside the mark it is `for`.
//
// What a mark does on its beat in a story (its act) is timed here too, as shares
// of its own length · typed, counted, filled, cut, carried. The renderer scales
// the shares to the time the story gives it.
//
// Pure: a text setter in, offsets and shares out · no DOM, no font.
// ════════════════════════════════════════════════════════════════

import {
  type ColumnsParts,
  type PieParts,
  columnsParts,
  columnsSeconds,
  columnsWidths,
  type WaterfallParts,
  pieParts,
  pieSeconds,
  pieWidth,
  waterfallParts,
  waterfallSeconds,
  waterfallWidths,
} from './charts.js';
import type { LText } from './layout.js';
import { DEFAULT_SCREEN_LINES, MAX_PEOPLE, MAX_SCREEN_LINES, linesOf } from './marks-words.js';
import { type DgNode, type Paint, readNumber, words } from './model.js';
import type { Block } from './types.js';

type Role = LText['role'];
type Rect = { x: number; y: number; w: number; h: number };
type Spot = { x: number; y: number };

/** What the marks need to set text · `layout.ts` gives it, a test fakes it. */
export interface TextEnv {
  /** A text in a role, wrapped into `width`, its corner at `x`, `y`. */
  set(role: Role, text: string, width: number, x: number, y: number): LText;
  /** The width of a text on one line in a role. */
  width(role: Role, text: string): number;
  /** A figure written as a number, with the decimal sign of the deck. */
  figure(written: string): string;
}

export const PIECE_KINDS = [
  'terminal',
  'table',
  'switch',
  'timer',
  'band',
  'person',
  'screen',
  'counter',
  'pie',
  'columns',
  'waterfall',
] as const;
export type PieceKind = (typeof PIECE_KINDS)[number];
export const isPiece = (kind: string): kind is PieceKind =>
  (PIECE_KINDS as readonly string[]).includes(kind);

/** Room inside a panel, and the line height of the four type roles. */
const PAD = 24;
const LINE = { label: 38, note: 34, tag: 30, value: 64 } as const;

// ── a terminal ────────────────────────────────────────────────────────────

/** A typed line is set in the deck's monospace at the size of a note · the width of
 *  a character is this share of the size (Space Mono is 0.61, JetBrains Mono 0.6). */
export const MONO_SIZE = 25;
export const MONO_ADVANCE = 0.62;
const TERMINAL_BAR = 44;
const TERMINAL_MIN_W = 380;
const CURSOR = { w: 13, h: 26 };
/** What a line starts with when it is typed by someone · a prompt. */
const PROMPT = /^(\$|>|❯|›|#)\s/;
/** The mark at the head of a line of result · it is drawn in the colour of its state. */
const RESULT = /^([✓✔✗✘×])\s/;

export interface TerminalLine {
  text: LText;
  /** A command, typed one character after the other · a result line comes in whole. */
  typed: boolean;
  /** Its length in characters, and on screen. */
  chars: number;
  width: number;
  /** The prompt at its head, in characters (`$ `) · drawn in the accent. */
  prompt: number;
  /** The mark of a result at its head (`✓`, `✗`) · drawn in its state's colour. */
  result?: 'ok' | 'fail';
}

export interface TerminalParts {
  bar: Rect;
  title?: LText;
  lines: TerminalLine[];
  /** Where the cursor rests, after the last line. */
  cursor: Rect;
  texts: LText[];
}

const monoWidth = (text: string) => [...text].length * MONO_SIZE * MONO_ADVANCE;

function terminalWidth(env: TextEnv, node: DgNode): number {
  const lines = linesOf(node.attrs.lines);
  const widest = Math.max(0, ...lines.map(monoWidth));
  const title = node.attrs.label ? env.width('tag', node.attrs.label) : 0;
  return Math.ceil(Math.max(TERMINAL_MIN_W, widest + CURSOR.w + 8, title) + 2 * PAD);
}

function terminalParts(env: TextEnv, node: DgNode, width: number): TerminalParts & { h: number } {
  const title = node.attrs.label
    ? env.set('tag', node.attrs.label, width - 2 * PAD, PAD, (TERMINAL_BAR - LINE.tag) / 2)
    : undefined;
  const top = TERMINAL_BAR + PAD * 0.75;
  const lines = linesOf(node.attrs.lines).map((line, n): TerminalLine => {
    const typed = PROMPT.test(line);
    const result = RESULT.exec(line)?.[1];
    const text: LText = {
      lines: [line],
      size: MONO_SIZE,
      weight: 400,
      line: LINE.note,
      role: 'note',
      fits: monoWidth(line) <= width - 2 * PAD,
      x: PAD,
      y: top + n * LINE.note,
    };
    return {
      text,
      typed,
      chars: [...line].length,
      width: monoWidth(line),
      prompt: typed ? (PROMPT.exec(line)?.[0].length ?? 0) : 0,
      ...(result ? { result: '✓✔'.includes(result) ? 'ok' : 'fail' } : {}),
    };
  });
  const last = lines.at(-1);
  const lastY = last ? last.text.y : top;
  const cursor = {
    x: PAD + (last?.width ?? 0) + 6,
    y: lastY + (LINE.note - CURSOR.h) / 2,
    w: CURSOR.w,
    h: CURSOR.h,
  };
  const h = Math.ceil(top + Math.max(1, lines.length) * LINE.note + PAD * 0.75);
  return {
    h,
    bar: { x: 0, y: 0, w: width, h: TERMINAL_BAR },
    ...(title ? { title } : {}),
    lines,
    cursor,
    texts: [...(title ? [title] : []), ...lines.map((l) => l.text)],
  };
}

/** How long a terminal types, in seconds · a character takes this long, a line of
 *  command at least and at most this long, a line of result comes in at once, and
 *  the machine takes a breath before it answers. */
const TYPE_PER_CHAR = 0.03;
const TYPE_MIN = 0.3;
const TYPE_MAX = 1.2;
const RESULT_LINE = 0.25;
const LINE_GAP = 0.12;
const ANSWER_GAP = 0.3;

/** When each line of a terminal is typed, in seconds from the start of its act. */
export function typingPlan(lines: Pick<TerminalLine, 'typed' | 'chars'>[]): {
  lines: { start: number; duration: number }[];
  total: number;
} {
  let at = 0;
  const out = lines.map((line, n) => {
    const before = n === 0 ? 0 : lines[n - 1]!.typed && !line.typed ? ANSWER_GAP : LINE_GAP;
    const start = at + before;
    const duration = line.typed
      ? Math.min(TYPE_MAX, Math.max(TYPE_MIN, line.chars * TYPE_PER_CHAR))
      : RESULT_LINE;
    at = start + duration;
    return { start, duration };
  });
  return { lines: out, total: at };
}

// ── a table of rows ───────────────────────────────────────────────────────

/** A row and the gap under it are twice the room inside the table · two tables a row
 *  apart, set side by side on their middles, then share the line of a row's edge,
 *  instead of missing it by two units. */
const ROW_H = 42;
const ROW_GAP = 6;
const ROW_PAD = 14;
const HEADER = 40;
const HEADER_GAP = 14;
const HEADER_AFTER = 16;
const TABLE_MIN_W = 280;
const TABLE_MAX_W = 620;

export interface TableRow {
  rect: Rect;
  /** What it says before its beat · the row at rest says `after` when it swaps. */
  before: LText;
  after?: LText;
  struck: boolean;
  /** How wide its words are at rest · how far a strike runs. */
  textW: number;
}

export interface TableParts {
  icon?: { name: string; x: number; y: number; size: number };
  label?: LText;
  rows: TableRow[];
  /** Where each row comes from when it is carried from another table (`from`), as an
   *  offset from where it rests · set once every mark is placed. */
  travel?: { dx: number; dy: number }[];
  texts: LText[];
}

function tableWidth(env: TextEnv, node: DgNode, hasIcon: boolean): { min: number; pref: number } {
  const rows = [...linesOf(node.attrs.rows), ...linesOf(node.attrs.swap)];
  const widest = Math.max(0, ...rows.map((r) => env.width('note', r)));
  const header = (hasIcon ? HEADER + HEADER_GAP : 0) + env.width('label', node.attrs.label ?? '');
  const inner = Math.max(widest + 2 * ROW_PAD, header);
  const pref = Math.ceil(Math.min(TABLE_MAX_W, Math.max(TABLE_MIN_W, inner + 2 * PAD)));
  return { min: pref, pref };
}

function tableParts(
  env: TextEnv,
  node: DgNode,
  width: number,
  icon: string | undefined,
): TableParts & { h: number } {
  const label = node.attrs.label
    ? env.set(
        'label',
        node.attrs.label,
        width - 2 * PAD - (icon ? HEADER + HEADER_GAP : 0),
        PAD + (icon ? HEADER + HEADER_GAP : 0),
        PAD + (HEADER - LINE.label) / 2,
      )
    : undefined;
  const rows = linesOf(node.attrs.rows);
  const swapped = linesOf(node.attrs.swap);
  const struck = new Set(words(node.attrs.strike).map(readNumber));
  const top = PAD + (label || icon ? HEADER + HEADER_AFTER : 0);
  const room = width - 2 * PAD - 2 * ROW_PAD;
  const parts = rows.map((row, n): TableRow => {
    const y = top + n * (ROW_H + ROW_GAP);
    const textY = y + (ROW_H - LINE.note) / 2;
    const after = swapped.length === rows.length ? swapped[n] : undefined;
    return {
      rect: { x: PAD, y, w: width - 2 * PAD, h: ROW_H },
      before: env.set('note', row, room, PAD + ROW_PAD, textY),
      ...(after !== undefined && after !== row
        ? { after: env.set('note', after, room, PAD + ROW_PAD, textY) }
        : {}),
      struck: struck.has(n + 1),
      textW: Math.min(room, env.width('note', after ?? row)),
    };
  });
  const h = rows.length ? top + rows.length * (ROW_H + ROW_GAP) - ROW_GAP + PAD : top + PAD;
  return {
    h,
    ...(icon ? { icon: { name: icon, x: PAD, y: PAD, size: HEADER } } : {}),
    ...(label ? { label } : {}),
    rows: parts,
    texts: [...(label ? [label] : []), ...parts.map((r) => r.after ?? r.before)],
  };
}

/** A table's act · its rows are carried from their source, one after the other,
 *  then change one after the other (a box ticked, a name replaced), then the struck
 *  ones are struck. Lengths in seconds. */
const CARRY = 1;
const CARRY_STAGGER = 0.14;
const CHANGE = 0.45;
const CHANGE_STAGGER = 0.3;
const STRIKE = 0.4;

export function tablePhases(
  rows: number,
  carried: boolean,
  changed: number,
  strikes: boolean,
): {
  carry?: [number, number];
  change?: [number, number];
  strike?: [number, number];
  total: number;
} {
  let at = 0;
  const span = (length: number): [number, number] => {
    const from = at;
    at += length;
    return [from, at];
  };
  const carry = carried ? span(CARRY + CARRY_STAGGER * Math.max(0, rows - 1)) : undefined;
  if (carried && (changed || strikes)) at += 0.1;
  const change = changed ? span(CHANGE + CHANGE_STAGGER * (changed - 1)) : undefined;
  const strike = strikes ? span(STRIKE) : undefined;
  return {
    ...(carry ? { carry } : {}),
    ...(change ? { change } : {}),
    ...(strike ? { strike } : {}),
    total: at,
  };
}

/** When each of `count` things of an act starts and how long it lasts, as shares of
 *  the slice they share · `length` each, `stagger` apart, the slice their sum. */
export function staggered(
  count: number,
  length: number,
  stagger: number,
): { from: number; share: number }[] {
  const total = length + stagger * Math.max(0, count - 1);
  return Array.from({ length: count }, (_, n) => ({
    from: (stagger * n) / total,
    share: length / total,
  }));
}

export const CARRY_SECONDS = CARRY;
export const CARRY_STAGGER_SECONDS = CARRY_STAGGER;
export const CHANGE_SECONDS = CHANGE;
export const CHANGE_STAGGER_SECONDS = CHANGE_STAGGER;

// ── a switch ──────────────────────────────────────────────────────────────

const TRACK = { w: 68, h: 36 };
const KNOB_R = 13;
const SWITCH_GAP = 16;
const SWITCH_PAD = { x: 22, y: 18 };

export interface SwitchParts {
  label?: LText;
  track: Rect;
  knob: { on: Spot; off: Spot; r: number };
  words: { on: LText; off: LText };
  /** The state on each click, the last holding · before and after its beat in a story. */
  states: string[];
  texts: LText[];
}

const switchWords = (node: DgNode) => ({
  on: node.attrs.on || 'on',
  off: node.attrs.off || 'off',
});

function switchWidth(env: TextEnv, node: DgNode): number {
  const said = switchWords(node);
  const label = node.attrs.label ? env.width('label', node.attrs.label) + SWITCH_GAP : 0;
  const word = Math.max(env.width('tag', said.on), env.width('tag', said.off));
  return Math.ceil(2 * SWITCH_PAD.x + label + TRACK.w + 12 + word);
}

function switchParts(env: TextEnv, node: DgNode): SwitchParts & { h: number } {
  const said = switchWords(node);
  const h = 2 * SWITCH_PAD.y + Math.max(LINE.label, TRACK.h);
  const middle = h / 2;
  const label = node.attrs.label
    ? env.set(
        'label',
        node.attrs.label,
        env.width('label', node.attrs.label),
        SWITCH_PAD.x,
        middle - LINE.label / 2,
      )
    : undefined;
  const trackX = SWITCH_PAD.x + (label ? env.width('label', node.attrs.label!) + SWITCH_GAP : 0);
  const track = { x: trackX, y: middle - TRACK.h / 2, w: TRACK.w, h: TRACK.h };
  const wordX = trackX + TRACK.w + 12;
  const word = (text: string) =>
    env.set('tag', text, env.width('tag', text), wordX, middle - LINE.tag / 2);
  const states = words(node.attrs.state).length ? words(node.attrs.state) : ['on'];
  const on = word(said.on);
  const off = word(said.off);
  return {
    h,
    ...(label ? { label } : {}),
    track,
    knob: {
      on: { x: trackX + TRACK.w - TRACK.h / 2, y: middle },
      off: { x: trackX + TRACK.h / 2, y: middle },
      r: KNOB_R,
    },
    words: { on, off },
    states,
    texts: [...(label ? [label] : []), states.at(-1) === 'off' ? off : on],
  };
}

// ── a figure that rolls (a timer, a counter) ──────────────────────────────

/** A figure rolls through this many values at most · the eye reads them as counting. */
const MAX_FRAMES = 12;
/** The most decimals a figure on its way is written with · what `toFixed` can write.
 *  The last figure is the value as written, whatever its decimals. */
const MAX_ROLLING_DECIMALS = 100;

/** The figures a rolling value shows, from `from` to the value written, each with the
 *  share of the roll it shows from · whole steps when there are few, else eased so it
 *  slows into its last value. The last is the value as written (its unit kept). */
export function rollingFigures(
  env: TextEnv,
  written: string,
  from: number,
  unit: string | undefined,
  ease: boolean,
): { text: string; at: number }[] {
  const target = readNumber(written);
  if (!Number.isFinite(target)) return [{ text: withUnit(env.figure(written), unit), at: 0 }];
  const decimals = /[.,](\d+)\s*$/.exec(written)?.[1]?.length ?? 0;
  const group = /\d([\s  ])\d{3}(?!\d)/.exec(written)?.[1];
  const comma = /\d,\d+\s*$/.test(written);
  const format = (n: number) => {
    const [whole, part] = Math.abs(n).toFixed(Math.min(decimals, MAX_ROLLING_DECIMALS)).split('.');
    const grouped = group ? whole!.replace(/\B(?=(\d{3})+(?!\d))/g, group) : whole!;
    const sign = n < 0 ? '−' : '';
    const figure = part ? `${grouped}${comma ? ',' : '.'}${part}` : grouped;
    return comma || group ? `${sign}${figure}` : env.figure(`${sign}${figure}`);
  };
  const span = Math.abs(target - from);
  const whole = decimals === 0 && Number.isInteger(from) && span <= MAX_FRAMES;
  const count = whole ? Math.max(1, span) : MAX_FRAMES;
  const out: { text: string; at: number }[] = [];
  for (let k = 0; k <= count; k += 1) {
    const share = k / count;
    const progress = ease && !whole ? 1 - (1 - share) ** 3 : share;
    const value = k === count ? target : from + (target - from) * progress;
    const text = k === count ? withUnit(env.figure(written), unit) : withUnit(format(value), unit);
    if (out.at(-1)?.text !== text) out.push({ text, at: share });
  }
  return out;
}

const withUnit = (figure: string, unit: string | undefined) =>
  unit ? `${figure} ${unit}` : figure;

// ── a timer ───────────────────────────────────────────────────────────────

const RING_R = 44;
const RING_STROKE = 10;
const TIMER_GAP = 22;
const TIMER_ICON = 40;

export interface TimerParts {
  ring: { x: number; y: number; r: number; stroke: number };
  icon: { name: string; x: number; y: number; size: number };
  /** The figures it counts through, the last the delay at rest, each from a share. */
  figures: { text: LText; at: number }[];
  label?: LText;
  texts: LText[];
}

const ringSize = 2 * RING_R + RING_STROKE;

function timerWidth(env: TextEnv, node: DgNode): number {
  const figure = env.width('value', withUnit(env.figure(node.attrs.value ?? ''), node.attrs.unit));
  const label = Math.min(320, env.width('note', node.attrs.label ?? ''));
  return Math.ceil(ringSize + TIMER_GAP + Math.max(figure, label));
}

function timerParts(env: TextEnv, node: DgNode, width: number): TimerParts & { h: number } {
  const textX = ringSize + TIMER_GAP;
  const room = Math.max(1, width - textX);
  const label = node.attrs.label
    ? env.set('note', node.attrs.label, room, textX, LINE.value + 4)
    : undefined;
  const textH = LINE.value + (label ? 4 + label.lines.length * LINE.note : 0);
  const h = Math.max(ringSize, textH);
  const textTop = (h - textH) / 2;
  if (label) label.y += textTop;
  const figures = rollingFigures(env, node.attrs.value ?? '0', 0, node.attrs.unit, false).map(
    ({ text, at }) => ({
      text: env.set('value', text, env.width('value', text), textX, textTop),
      at,
    }),
  );
  const cy = h / 2;
  return {
    h,
    ring: { x: ringSize / 2, y: cy, r: RING_R, stroke: RING_STROKE },
    icon: {
      name: 'clock',
      x: ringSize / 2 - TIMER_ICON / 2,
      y: cy - TIMER_ICON / 2,
      size: TIMER_ICON,
    },
    figures,
    ...(label ? { label } : {}),
    texts: [...(label ? [label] : []), figures.at(-1)!.text],
  };
}

// ── a counter ─────────────────────────────────────────────────────────────

export interface CounterParts {
  figures: { text: LText; at: number }[];
  label?: LText;
  texts: LText[];
}

function counterWidth(env: TextEnv, node: DgNode): number {
  const figure = env.width('value', withUnit(env.figure(node.attrs.value ?? ''), node.attrs.unit));
  return Math.ceil(Math.max(figure, Math.min(340, env.width('note', node.attrs.label ?? ''))));
}

function counterParts(env: TextEnv, node: DgNode, width: number): CounterParts & { h: number } {
  const from = node.attrs.from ? readNumber(node.attrs.from) : 0;
  const figures = rollingFigures(
    env,
    node.attrs.value ?? '0',
    Number.isFinite(from) ? from : 0,
    node.attrs.unit,
    true,
  ).map(({ text, at }) => ({ text: env.set('value', text, env.width('value', text), 0, 0), at }));
  const label = node.attrs.label
    ? env.set('note', node.attrs.label, width, 0, LINE.value + 4)
    : undefined;
  return {
    h: LINE.value + (label ? 4 + label.lines.length * LINE.note : 0),
    figures,
    ...(label ? { label } : {}),
    texts: [...(label ? [label] : []), figures.at(-1)!.text],
  };
}

// ── a band of time, cut once ──────────────────────────────────────────────

const BAND_H = 56;
const BAND_LABEL_GAP = 28;
const BAND_LABEL_MAX = 260;
const BAND_MIN_TRACK = 380;
const BAND_PREF_TRACK = 820;
/** The regular events of the normal time are figured this far apart · a texture. */
const TICK_EVERY = 34;
const TICK_INSET = 14;
const BRACE_H = 16;
const BRACE_GAP = 8;

export interface BandParts {
  label?: LText;
  note?: LText;
  track: Rect;
  /** The time it ran as it should, the void after the cut, and the time after it. */
  normal: Rect;
  gap: Rect;
  after?: Rect;
  /** The regular events of the normal time · short strokes across it. */
  ticks: { x: number; y: number; h: number }[];
  cut: { x: number; y: number; h: number };
  /** The word at the cut, above it · when it broke. */
  tag?: LText;
  /** The brace under the void, and how long it lasted. */
  brace?: Rect;
  braceLabel?: LText;
  texts: LText[];
}

function bandLabelWidth(env: TextEnv, node: DgNode): number {
  const label = Math.max(
    env.width('label', node.attrs.label ?? ''),
    env.width('note', node.attrs.note ?? ''),
  );
  return label ? Math.min(BAND_LABEL_MAX, label) + BAND_LABEL_GAP : 0;
}

function bandParts(env: TextEnv, node: DgNode, width: number): BandParts & { h: number } {
  const labelW = bandLabelWidth(env, node);
  const num = (name: string, fallback: number) => {
    const n = node.attrs[name] === undefined ? Number.NaN : readNumber(node.attrs[name]!);
    return Number.isFinite(n) ? n : fallback;
  };
  const from = num('from', 0);
  // Any end past the start is kept as written, however short · one unit only stands
  // in for an end that is missing or not past the start (DG_BAND_NO_CUT says so).
  const written = num('to', from + 1);
  const to = written > from ? written : from + 1;
  const clampTo = (n: number) => Math.min(to, Math.max(from, n));
  const cut = clampTo(num('cut', (from + to) / 2));
  const until = clampTo(Math.max(cut, num('until', to)));
  const trackW = Math.max(1, width - labelW);
  const xOf = (t: number) => labelW + ((t - from) / (to - from)) * trackW;
  const tag = node.attrs.tag ? env.width('tag', node.attrs.tag) : 0;
  const top = tag ? LINE.tag + 6 : 0;
  const track = { x: labelW, y: top, w: trackW, h: BAND_H };
  const cutX = xOf(cut);
  const untilX = xOf(until);
  const normal = { x: labelW, y: top, w: cutX - labelW, h: BAND_H };
  const gap = { x: cutX, y: top, w: untilX - cutX, h: BAND_H };
  const after =
    untilX < labelW + trackW - 1
      ? { x: untilX, y: top, w: labelW + trackW - untilX, h: BAND_H }
      : undefined;
  const ticks: { x: number; y: number; h: number }[] = [];
  for (let x = labelW + TICK_EVERY; x < cutX - TICK_EVERY / 2; x += TICK_EVERY)
    ticks.push({ x, y: top + TICK_INSET, h: BAND_H - 2 * TICK_INSET });
  // The word at the cut starts there, or ends there when the room after it is short.
  const tagText = node.attrs.tag
    ? env.set(
        'tag',
        node.attrs.tag,
        tag,
        cutX + tag <= labelW + trackW ? cutX : Math.max(labelW, cutX - tag),
        0,
      )
    : undefined;
  const braceTop = top + BAND_H + BRACE_GAP;
  const brace = node.attrs.brace
    ? { x: cutX, y: braceTop, w: untilX - cutX, h: BRACE_H }
    : undefined;
  const braceW = node.attrs.brace ? env.width('label', node.attrs.brace) : 0;
  const braceLabel = node.attrs.brace
    ? env.set(
        'label',
        node.attrs.brace,
        braceW,
        Math.min(labelW + trackW - braceW, Math.max(labelW, (cutX + untilX) / 2 - braceW / 2)),
        braceTop + BRACE_H + 6,
      )
    : undefined;
  const labelBlock = node.attrs.label ? LINE.label + (node.attrs.note ? LINE.note : 0) : 0;
  const labelY = top + BAND_H / 2 - labelBlock / 2;
  const label = node.attrs.label
    ? env.set('label', node.attrs.label, labelW - BAND_LABEL_GAP, 0, labelY)
    : undefined;
  const note =
    node.attrs.label && node.attrs.note
      ? env.set('note', node.attrs.note, labelW - BAND_LABEL_GAP, 0, labelY + LINE.label)
      : undefined;
  const h = braceLabel ? braceLabel.y + LINE.label : top + BAND_H;
  return {
    h,
    ...(label ? { label } : {}),
    ...(note ? { note } : {}),
    track,
    normal,
    gap,
    ...(after ? { after } : {}),
    ticks,
    cut: { x: cutX, y: top - 4, h: BAND_H + 8 },
    ...(tagText ? { tag: tagText } : {}),
    ...(brace ? { brace } : {}),
    ...(braceLabel ? { braceLabel } : {}),
    texts: [label, note, tagText, braceLabel].filter((t): t is LText => !!t),
  };
}

/** A band's act · the cut, then the void grows for as long as it lasted, then its brace. */
const CUT_SECONDS = 0.35;
const VOID_SECONDS = 1.8;
const BRACE_SECONDS = 0.5;

export function bandPhases(): {
  cut: [number, number];
  void: [number, number];
  brace: [number, number];
  total: number;
} {
  const voidEnd = CUT_SECONDS + VOID_SECONDS;
  return {
    cut: [0, CUT_SECONDS],
    void: [CUT_SECONDS, voidEnd],
    brace: [voidEnd, voidEnd + BRACE_SECONDS],
    total: voidEnd + BRACE_SECONDS,
  };
}

// ── people ────────────────────────────────────────────────────────────────

const PERSON = 54;
const PERSON_GAP = 12;

export interface PersonParts {
  caption?: LText;
  people: { x: number; y: number; size: number }[];
  /** How many of them are missing (the last ones), before and after its beat. */
  absent: { before: number; after: number };
  texts: LText[];
}

const peopleCount = (node: DgNode) => {
  const n = readNumber(node.attrs.count ?? '1');
  return Number.isInteger(n) ? Math.min(MAX_PEOPLE, Math.max(1, n)) : 1;
};

function personWidth(env: TextEnv, node: DgNode): number {
  const count = peopleCount(node);
  return Math.ceil(
    Math.max(count * (PERSON + PERSON_GAP) - PERSON_GAP, env.width('tag', node.attrs.label ?? '')),
  );
}

function personParts(env: TextEnv, node: DgNode): PersonParts & { h: number } {
  const count = peopleCount(node);
  const caption = node.attrs.label
    ? env.set('tag', node.attrs.label, env.width('tag', node.attrs.label), 0, 0)
    : undefined;
  const top = caption ? LINE.tag + 8 : 0;
  const absent = words(node.attrs.absent).map((w) => {
    const n = readNumber(w);
    return Number.isInteger(n) ? Math.min(count, Math.max(0, n)) : 0;
  });
  return {
    h: top + PERSON,
    ...(caption ? { caption } : {}),
    people: Array.from({ length: count }, (_, n) => ({
      x: n * (PERSON + PERSON_GAP),
      y: top,
      size: PERSON,
    })),
    absent: { before: absent[0] ?? 0, after: absent.at(-1) ?? 0 },
    texts: caption ? [caption] : [],
  };
}

/** People go missing one after the other, this far apart, each in this long. */
export const ABSENT_STAGGER = 0.22;
export const ABSENT_SECONDS = 0.4;

// ── a screen ──────────────────────────────────────────────────────────────

const SCREEN_BAR = 44;
const SCREEN_MIN_W = 340;
const SCREEN_PREF_W = 540;
const SCREEN_MAX_W = 600;
const TEXTURE_H = 10;
const TEXTURE_GAP = 16;
/** The widths of the figured lines, a share of the room · fixed, so a screen looks
 *  the same on every render, and uneven, so it reads as text. */
const TEXTURE_SHARES = [0.92, 0.78, 0.86, 0.6, 0.82, 0.7, 0.9, 0.55, 0.76, 0.66];

export interface ScreenParts {
  bar: Rect;
  dots: Spot[];
  address: Rect;
  addressText?: LText;
  heading?: LText;
  /** Lines that figure text · they say how much there is without a word. */
  texture: Rect[];
  texts: LText[];
}

function screenWidth(env: TextEnv, node: DgNode): { min: number; pref: number } {
  const address = env.width('tag', node.attrs.label ?? '') + 2 * 14 + 3 * 18 + 24;
  const heading = env.width('label', node.attrs.note ?? '');
  const pref = Math.min(
    SCREEN_MAX_W,
    Math.max(SCREEN_PREF_W, address + 2 * PAD, Math.min(heading, SCREEN_MAX_W - 2 * PAD) + 2 * PAD),
  );
  return { min: Math.max(SCREEN_MIN_W, Math.min(pref, address + 2 * PAD)), pref: Math.ceil(pref) };
}

function screenParts(env: TextEnv, node: DgNode, width: number): ScreenParts & { h: number } {
  const dots = [0, 1, 2].map((n) => ({ x: PAD + n * 18, y: SCREEN_BAR / 2 }));
  const addressX = PAD + 3 * 18 + 8;
  const address = { x: addressX, y: 8, w: width - addressX - 12, h: SCREEN_BAR - 16 };
  const addressText = node.attrs.label
    ? env.set('tag', node.attrs.label, address.w - 28, addressX + 14, (SCREEN_BAR - LINE.tag) / 2)
    : undefined;
  let y = SCREEN_BAR + PAD;
  const heading = node.attrs.note
    ? env.set('label', node.attrs.note, width - 2 * PAD, PAD, y)
    : undefined;
  if (heading) y += heading.lines.length * LINE.label + 14;
  const said = readNumber(node.attrs.count ?? '');
  const count = Number.isInteger(said)
    ? Math.min(MAX_SCREEN_LINES, Math.max(1, said))
    : DEFAULT_SCREEN_LINES;
  const room = width - 2 * PAD;
  const texture = Array.from({ length: count }, (_, n) => ({
    x: PAD,
    y: y + n * (TEXTURE_H + TEXTURE_GAP),
    w: Math.round(room * TEXTURE_SHARES[n % TEXTURE_SHARES.length]!),
    h: TEXTURE_H,
  }));
  const h = y + count * (TEXTURE_H + TEXTURE_GAP) - TEXTURE_GAP + PAD;
  return {
    h,
    bar: { x: 0, y: 0, w: width, h: SCREEN_BAR },
    dots,
    address,
    ...(addressText ? { addressText } : {}),
    ...(heading ? { heading } : {}),
    texture,
    texts: [addressText, heading].filter((t): t is LText => !!t),
  };
}

// ── the marks as blocks, and laid out ─────────────────────────────────────

export type PieceParts =
  | ({ kind: 'terminal' } & TerminalParts)
  | ({ kind: 'table' } & TableParts)
  | ({ kind: 'switch' } & SwitchParts)
  | ({ kind: 'timer' } & TimerParts)
  | ({ kind: 'band' } & BandParts)
  | ({ kind: 'person' } & PersonParts)
  | ({ kind: 'screen' } & ScreenParts)
  | ({ kind: 'counter' } & CounterParts)
  | ({ kind: 'pie' } & PieParts)
  | ({ kind: 'columns' } & ColumnsParts)
  | ({ kind: 'waterfall' } & WaterfallParts);

/** A mark that tells a story, placed · its parts are where they are drawn. */
export type LPiece = PieceParts & {
  key: string;
  node: DgNode;
  x: number;
  y: number;
  w: number;
  h: number;
  tone: string;
  emphasis: boolean;
  paint: Paint;
};

/** How wide a mark can be drawn · it is as wide as what it says, a band and a
 *  screen stretch with the room. */
export function pieceBlock(
  env: TextEnv,
  node: DgNode,
  key: string,
  hasIcon: (name: string) => boolean,
): Block {
  const fixed = (w: number): Pick<Block, 'minW' | 'prefW' | 'maxW'> => ({
    minW: w,
    prefW: w,
    maxW: w,
  });
  const widths = (() => {
    switch (node.kind) {
      case 'terminal': {
        const w = terminalWidth(env, node);
        return { minW: w, prefW: w, maxW: Math.max(w, 900) };
      }
      case 'table': {
        const { min, pref } = tableWidth(env, node, !!iconOf(node, hasIcon));
        return { minW: min, prefW: pref, maxW: Math.max(pref, TABLE_MAX_W) };
      }
      case 'switch':
        return fixed(switchWidth(env, node));
      case 'timer':
        return fixed(timerWidth(env, node));
      case 'counter':
        return fixed(counterWidth(env, node));
      case 'band': {
        const label = bandLabelWidth(env, node);
        return { minW: label + BAND_MIN_TRACK, prefW: label + BAND_PREF_TRACK };
      }
      case 'person':
        return fixed(personWidth(env, node));
      case 'pie':
        return fixed(pieWidth(env, node));
      case 'columns':
      case 'waterfall': {
        const widthsOf = node.kind === 'columns' ? columnsWidths : waterfallWidths;
        const { min, pref, max } = widthsOf(env, node);
        return { minW: min, prefW: pref, maxW: max };
      }
      default: {
        const { min, pref } = screenWidth(env, node);
        return { minW: min, prefW: pref, maxW: SCREEN_MAX_W };
      }
    }
  })();
  return { key, ...widths, heightFor: (w) => layPiece(env, node, w, hasIcon).h };
}

const iconOf = (node: DgNode, hasIcon: (name: string) => boolean) =>
  node.attrs.icon && hasIcon(node.attrs.icon) ? node.attrs.icon : undefined;

/** A mark laid out at a width · its parts as offsets from its corner, and its height. */
export function layPiece(
  env: TextEnv,
  node: DgNode,
  width: number,
  hasIcon: (name: string) => boolean,
): PieceParts & { h: number } {
  switch (node.kind) {
    case 'terminal':
      return { kind: 'terminal', ...terminalParts(env, node, width) };
    case 'table':
      return { kind: 'table', ...tableParts(env, node, width, iconOf(node, hasIcon)) };
    case 'switch':
      return { kind: 'switch', ...switchParts(env, node) };
    case 'timer':
      return { kind: 'timer', ...timerParts(env, node, width) };
    case 'band':
      return { kind: 'band', ...bandParts(env, node, width) };
    case 'person':
      return { kind: 'person', ...personParts(env, node) };
    case 'counter':
      return { kind: 'counter', ...counterParts(env, node, width) };
    case 'pie':
      return { kind: 'pie', ...pieParts(env, node, width) };
    case 'columns':
      return { kind: 'columns', ...columnsParts(env, node, width) };
    case 'waterfall':
      return { kind: 'waterfall', ...waterfallParts(env, node, width) };
    default:
      return { kind: 'screen', ...screenParts(env, node, width) };
  }
}

/** Parts moved by `dx`, `dy` · every `x` and `y` of them, a copy. Offsets (`dx`, `dy`)
 *  and sizes stay. */
export function moved<T>(parts: T, dx: number, dy: number): T {
  if (Array.isArray(parts)) return parts.map((p) => moved(p, dx, dy)) as T;
  if (!parts || typeof parts !== 'object') return parts;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(parts)) {
    if (key === 'x' && typeof value === 'number') out[key] = value + dx;
    else if (key === 'y' && typeof value === 'number') out[key] = value + dy;
    else out[key] = typeof value === 'object' ? moved(value, dx, dy) : value;
  }
  return out as T;
}

/** What a mark does on its beat, in seconds written · 0 when it has nothing to do
 *  (it then comes in, or stands from the start, as it is at rest). */
export function actSeconds(piece: LPiece): number {
  switch (piece.kind) {
    case 'terminal':
      return typingPlan(piece.lines).total;
    case 'table':
      return tablePhases(
        piece.rows.length,
        !!piece.travel,
        piece.rows.filter((r) => r.after).length,
        piece.rows.some((r) => r.struck),
      ).total;
    case 'timer':
      return TIMER_SECONDS;
    case 'counter':
      return COUNTER_SECONDS;
    case 'band':
      return bandPhases().total;
    case 'person': {
      const changed = Math.abs(piece.absent.after - piece.absent.before);
      return changed ? ABSENT_SECONDS + ABSENT_STAGGER * (changed - 1) : 0;
    }
    case 'pie':
      return pieSeconds(piece);
    case 'columns':
      return columnsSeconds(piece.labels.length);
    case 'waterfall':
      return waterfallSeconds(piece.bars.length);
    default:
      return 0;
  }
}

/** A timer fills, a counter counts, in this long when the author does not say. */
export const TIMER_SECONDS = 2;
export const COUNTER_SECONDS = 1.4;
