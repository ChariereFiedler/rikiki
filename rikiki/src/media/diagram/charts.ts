// ════════════════════════════════════════════════════════════════
// RIKIKI · diagram, the charts · a pie, columns, a waterfall
//
// A pie (parts that make a whole, as a ring with the figure of the whole in its
// hole or as a full disc, one part brought forward), columns (things compared side
// by side, in one to three series, grouped or stacked, against a threshold) and a
// waterfall (a total walked step by step, up and down, to the next one). Each is
// placed by its group like any mark that tells a story (marks.ts) and laid out
// here, its parts as offsets from its corner.
//
// What it does on its beat (its act) is timed here · the ring swept part after
// part, the columns grown one after the other, the steps of a waterfall taken in
// turn. At rest (print, PDF, reduced motion) all are drawn whole.
//
// Pure: a text setter in, offsets and lengths out · no DOM, no font.
// ════════════════════════════════════════════════════════════════

import { SERIES_MAX, chartRow, figureValue } from './chart-words.js';
import type { LText } from './layout.js';
import type { TextEnv } from './marks.js';
import { linesOf } from './marks-words.js';
import { type DgNode, readNumber } from './model.js';

type Rect = { x: number; y: number; w: number; h: number };
type Role = LText['role'];
/** A text drawn centred on `x` · its lines one under the other. */
export type Centred = { text: LText; x: number };

const withUnit = (figure: string, unit: string | undefined) =>
  unit ? `${figure} ${unit}` : figure;

/** The height of a line of a role. */
const lineOf = (env: TextEnv, role: Role) => env.set(role, '0', Number.MAX_SAFE_INTEGER, 0, 0).line;

/** Where the eye finds the middle of a first line · halfway up its capitals and
 *  figures, this share of its size under its top (the baseline sits at 0.8). */
const TEXT_MIDDLE = 0.47;
const middleOf = (t: LText) => t.y + t.size * TEXT_MIDDLE;

/** A text on one line, centred on `x`, its top at `y`. */
function centred(env: TextEnv, role: Role, text: string, x: number, y: number): Centred {
  const width = env.width(role, text);
  return { text: env.set(role, text, width, x - width / 2, y), x };
}

/** The rows of a chart · each its label, its `most` figures as written and as numbers. */
export function chartRows(value: string | undefined, most = 1) {
  return linesOf(value).map((line) => {
    const { label, figures } = chartRow(line, most);
    return { label, figures, values: figures.map(figureValue) };
  });
}

/** The title over a chart, and where what follows it starts. */
const TITLE_GAP = 18;

function titleOf(env: TextEnv, node: DgNode, width: number) {
  const title = node.attrs.label ? env.set('label', node.attrs.label, width, 0, 0) : undefined;
  return { title, top: title ? title.lines.length * title.line + TITLE_GAP : 0 };
}

/** The row of a chart brought forward by `focus` (its label) · -1 when none is. */
const focusOf = (node: DgNode, labels: string[]) =>
  node.attrs.focus === undefined ? -1 : labels.indexOf(node.attrs.focus.trim());

/** A total, as a figure written with the deck's decimal sign · three digits kept. */
const roundFigure = (n: number) => String(Number(n.toPrecision(3)));

// ── a pie ─────────────────────────────────────────────────────────────────

/** The ring · its radius (the middle of its stroke) and its thickness. A full disc
 *  is a ring as thick as its radius, so it is swept the same way. */
const PIE_R = 140;
const PIE_RING = 52;
const PIE_OUTER = PIE_R + PIE_RING / 2;
const PIE_SIZE = 2 * PIE_OUTER;
/** The room between two parts, as a length along the outer edge. */
const SLICE_GAP = 5;
const LEGEND_GAP = 52;
const SWATCH = 22;
const SWATCH_GAP = 14;
const FIGURE_GAP = 24;
const ROW_GAP = 16;
/** Between the figure of the whole and the legend, when a full disc has no hole. */
const HEAD_GAP = 22;
/** The figure in the hole holds this share of it · the rest is breathing room. */
const HOLE_SHARE = 0.84;

export interface PieSlice {
  /** Where it starts and ends on the ring, as turns from the top, clockwise. */
  from: number;
  to: number;
  focus: boolean;
  /** Its shade among the parts not brought forward, darkest first. */
  shade: number;
}

export interface PieParts {
  title?: LText;
  centre: { x: number; y: number };
  r: number;
  ring: number;
  /** The gap between two parts, in turns. */
  gap: number;
  slices: PieSlice[];
  legend: { swatch: Rect; label: LText; figure: LText }[];
  /** The figure of the whole and its note · in the hole of a ring, over the legend
   *  of a full disc. */
  value?: Centred;
  note?: Centred;
  texts: LText[];
}

const isDisc = (node: DgNode) => node.attrs.shape === 'pie';

/** What the legend says of each part · its words, and its figure with its unit. */
function legendWords(env: TextEnv, node: DgNode) {
  return chartRows(node.attrs.slices).map((row) => ({
    label: row.label,
    figure: withUnit(env.figure(row.figures[0] ?? ''), node.attrs.unit),
  }));
}

function legendColumns(env: TextEnv, node: DgNode) {
  const said = legendWords(env, node);
  const label = Math.max(0, ...said.map((r) => env.width('note', r.label)));
  const figure = Math.max(0, ...said.map((r) => env.width('label', r.figure)));
  return { said, label, figure };
}

export function pieWidth(env: TextEnv, node: DgNode): number {
  const { label, figure } = legendColumns(env, node);
  const legend = SWATCH + SWATCH_GAP + label + FIGURE_GAP + figure;
  const head = isDisc(node)
    ? Math.max(
        node.attrs.value ? env.width('value', env.figure(node.attrs.value)) : 0,
        node.attrs.note ? env.width('tag', node.attrs.note) : 0,
      )
    : 0;
  const title = node.attrs.label ? env.width('label', node.attrs.label) : 0;
  return Math.ceil(Math.max(title, PIE_SIZE + LEGEND_GAP + Math.max(legend, head)));
}

function pieSlices(node: DgNode): PieSlice[] {
  const rows = chartRows(node.attrs.slices);
  const values = rows.map((r) => (r.values[0]! > 0 ? r.values[0]! : 0));
  const whole = values.reduce((sum, v) => sum + v, 0) || 1;
  const focus = focusOf(
    node,
    rows.map((r) => r.label),
  );
  let turned = 0;
  let shade = 0;
  return values.map((value, n) => {
    const from = turned;
    turned += value / whole;
    const isFocus = n === focus;
    return { from, to: turned, focus: isFocus, shade: isFocus ? 0 : shade++ };
  });
}

/** The figure of the whole and its note, set from `top`, centred on `x` and `room` wide. */
function pieHead(env: TextEnv, node: DgNode, x: number, top: number, room: number) {
  const valueLine = node.attrs.value ? lineOf(env, 'value') : 0;
  const value = node.attrs.value
    ? centred(env, 'value', env.figure(node.attrs.value), x, top)
    : undefined;
  const note = node.attrs.note
    ? { text: env.set('tag', node.attrs.note, room, x - room / 2, top + valueLine), x }
    : undefined;
  const h = valueLine + (note ? note.text.lines.length * note.text.line : 0);
  return { value, note, h };
}

export function pieParts(env: TextEnv, node: DgNode, width: number): PieParts & { h: number } {
  const disc = isDisc(node);
  const { title, top } = titleOf(env, node, width);
  const { said, label: labelW } = legendColumns(env, node);
  const noteLine = lineOf(env, 'note');
  const figureLine = lineOf(env, 'label');
  const rowH = Math.max(noteLine, figureLine, SWATCH);
  const swatchX = PIE_SIZE + LEGEND_GAP;
  const rowsH = said.length * rowH + Math.max(0, said.length - 1) * ROW_GAP;

  // A full disc has no hole · the figure of the whole heads its legend instead.
  const legendW = width - swatchX;
  const headProbe = disc ? pieHead(env, node, 0, 0, legendW) : undefined;
  const headH = headProbe?.h ? headProbe.h + HEAD_GAP : 0;
  const legendH = headH + rowsH;
  const body = Math.max(PIE_SIZE, legendH);
  const centre = { x: PIE_SIZE / 2, y: top + body / 2 };
  const legendTop = top + (body - legendH) / 2;

  const labelX = swatchX + SWATCH + SWATCH_GAP;
  const figureX = labelX + labelW + FIGURE_GAP;
  const legend = said.map((r, n) => {
    const y = legendTop + headH + n * (rowH + ROW_GAP);
    const label = env.set('note', r.label, labelW, labelX, y + (rowH - noteLine) / 2);
    return {
      swatch: { x: swatchX, y: middleOf(label) - SWATCH / 2, w: SWATCH, h: SWATCH },
      label,
      figure: env.set(
        'label',
        r.figure,
        env.width('label', r.figure),
        figureX,
        y + (rowH - figureLine) / 2,
      ),
    };
  });

  // In a ring the figure of the whole sits in its hole · a full disc heads its legend with it.
  const hole = (PIE_R - PIE_RING / 2) * 2 * HOLE_SHARE;
  const { value, note } = disc
    ? pieHead(env, node, swatchX + legendW / 2, legendTop, legendW)
    : pieHead(env, node, centre.x, centre.y - pieHead(env, node, 0, 0, hole).h / 2, hole);
  return {
    h: Math.ceil(top + body),
    ...(title ? { title } : {}),
    centre,
    r: disc ? PIE_OUTER / 2 : PIE_R,
    ring: disc ? PIE_OUTER : PIE_RING,
    gap: SLICE_GAP / (2 * Math.PI * PIE_OUTER),
    slices: pieSlices(node),
    legend,
    ...(value ? { value } : {}),
    ...(note ? { note } : {}),
    texts: [
      ...(title ? [title] : []),
      ...legend.flatMap((l) => [l.label, l.figure]),
      ...(value ? [value.text] : []),
      ...(note ? [note.text] : []),
    ],
  };
}

/** A pie's act · the ring swept part after part, then the figure of the whole. */
export const PIE_SWEEP_SECONDS = 1.6;
export const PIE_VALUE_SECONDS = 0.35;

export const pieSeconds = (parts: Pick<PieParts, 'value' | 'note'>) =>
  PIE_SWEEP_SECONDS + (parts.value || parts.note ? PIE_VALUE_SECONDS : 0);

// ── a plot · what columns and a waterfall share ──────────────────────────

/** The height of the plot, from the baseline to the top of the scale. */
const PLOT_H = 280;
/** A column takes this share of its slot, the rest is the air between two. */
const GROUP_SHARE = 0.62;
const BAR_GAP = 4;
const BAR_MAX_W = 110;
const MIN_SLOT = 64;
const PREF_SLOT = 120;
const PLOT_MIN_W = 480;
const PLOT_MAX_W = 1400;
const TICK_GAP = 14;
const FIGURE_ABOVE = 8;
/** A figure over a bar takes at most this share of its slot · past it, it touches
 *  the next one, and the scale says the figures instead. */
const FIGURE_ROOM = 0.92;
const LABEL_BELOW = 12;
const LABEL_INSET = 8;
const LEGEND_SWATCH = 18;
const LEGEND_SWATCH_GAP = 10;
const LEGEND_ITEM_GAP = 32;
const LEGEND_AFTER = 18;
const THRESHOLD_GAP = 14;
/** The steps a scale rounds its top up to, per power of ten. */
const NICE_STEPS = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];

/** The top of a scale that holds `n` · a round figure at or just above it. */
export function niceTop(n: number): number {
  if (!(n > 0)) return 1;
  const power = 10 ** Math.floor(Math.log10(n));
  const step = NICE_STEPS.find((m) => m * power >= n * (1 - 1e-9)) ?? 10;
  return step * power;
}

/** The scale of a plot · its top, and the threshold drawn across it. */
interface Scale {
  top: number;
  threshold?: number;
}

/** A scale that holds `highest` and the threshold · or the `max` written. */
function scaleOf(node: DgNode, highest: number): Scale {
  const said = node.attrs.threshold ? readNumber(node.attrs.threshold) : Number.NaN;
  const threshold = Number.isFinite(said) ? said : undefined;
  const max = node.attrs.max ? readNumber(node.attrs.max) : Number.NaN;
  const top = max > 0 ? max : niceTop(Math.max(0, highest, threshold ?? 0));
  return { top, ...(threshold === undefined ? {} : { threshold }) };
}

const tickValues = (scale: Scale) => [scale.top / 2, scale.top];

/** The gutters of the plot · the scale at its left, the threshold's figure at its right. */
function gutters(env: TextEnv, node: DgNode, scale: Scale, ticks: boolean) {
  const left = ticks
    ? Math.max(...tickValues(scale).map((v) => env.width('tag', env.figure(roundFigure(v))))) +
      TICK_GAP
    : 0;
  const thresholdText =
    scale.threshold === undefined
      ? undefined
      : withUnit(env.figure(node.attrs.threshold!), node.attrs.unit);
  const right = thresholdText ? env.width('tag', thresholdText) + THRESHOLD_GAP : 0;
  return { left, right, thresholdText };
}

/** How wide a plot of `n` slots can be, likes to be, and is at most. */
function plotWidths(env: TextEnv, node: DgNode, scale: Scale, n: number, slotShare: number) {
  const { left, right } = gutters(env, node, scale, true);
  const title = node.attrs.label ? env.width('label', node.attrs.label) : 0;
  const min = Math.ceil(Math.max(PLOT_MIN_W, left + right + n * MIN_SLOT));
  const wide = left + right + n * PREF_SLOT * slotShare;
  const pref = Math.ceil(Math.min(PLOT_MAX_W, Math.max(min, title, wide)));
  return { min, pref, max: Math.max(pref, PLOT_MAX_W) };
}

export interface PlotFrame {
  title?: LText;
  /** The plot · the baseline is its bottom edge. */
  plot: Rect;
  /** Lines across the plot at round values, each with its figure at the left. */
  grid: { y: number; text: LText }[];
  /** The words under each slot. */
  labels: Centred[];
  threshold?: { y: number; text: LText };
  /** The figures over the bars, when every one says it. */
  everyFigure: boolean;
}

/** The frame of a plot of `labels.length` slots · a title, a legend's room, the
 *  scale when the figures over the bars do not all fit, the words under the slots,
 *  the threshold. `figures` are the words over each slot, to see whether they fit. */
function plotFrame(
  env: TextEnv,
  node: DgNode,
  width: number,
  scale: Scale,
  slots: { labels: string[]; figures: string[] | undefined; figured: boolean; above: number },
) {
  const n = Math.max(1, slots.labels.length);
  const tagLine = lineOf(env, 'tag');
  const { title, top: afterTitle } = titleOf(env, node, width);
  const top = afterTitle + slots.above;
  const bare = gutters(env, node, scale, false);
  const bareSlot = (width - bare.left - bare.right) / n;
  const everyFigure =
    !!slots.figures &&
    slots.figures.every((figure) => env.width('tag', figure) <= bareSlot * FIGURE_ROOM);
  const ticks = !everyFigure;
  const { left, right, thresholdText } = gutters(env, node, scale, ticks);
  const figured = everyFigure || slots.figured;
  const headroom = Math.max(figured ? tagLine + FIGURE_ABOVE : 0, ticks ? tagLine / 2 : 0);
  const plot = { x: left, y: top + headroom, w: Math.max(1, width - left - right), h: PLOT_H };
  const baseline = plot.y + plot.h;
  const yOf = (v: number) => baseline - (Math.max(0, Math.min(v, scale.top)) / scale.top) * PLOT_H;
  const slot = plot.w / n;

  const grid = ticks
    ? tickValues(scale).map((v) => {
        const text = env.figure(roundFigure(v));
        const textW = env.width('tag', text);
        const y = yOf(v);
        return { y, text: env.set('tag', text, textW, left - TICK_GAP - textW, y - tagLine / 2) };
      })
    : [];
  const labelW = Math.max(1, slot - LABEL_INSET);
  const labels = slots.labels.map((label, k) => {
    const x = plot.x + slot * (k + 0.5);
    return { text: env.set('tag', label, labelW, x - labelW / 2, baseline + LABEL_BELOW), x };
  });
  const labelsH = Math.max(0, ...labels.map((l) => l.text.lines.length * l.text.line));
  const threshold =
    thresholdText !== undefined && scale.threshold !== undefined
      ? {
          y: yOf(scale.threshold),
          text: env.set(
            'tag',
            thresholdText,
            env.width('tag', thresholdText),
            plot.x + plot.w + THRESHOLD_GAP,
            yOf(scale.threshold) - tagLine / 2,
          ),
        }
      : undefined;
  const frame: PlotFrame = {
    ...(title ? { title } : {}),
    plot,
    grid,
    labels,
    ...(threshold ? { threshold } : {}),
    everyFigure,
  };
  /** A figure over a bar whose top is at `y`, centred on `x`. */
  const figureAt = (text: string, x: number, y: number) =>
    centred(env, 'tag', text, x, y - FIGURE_ABOVE - tagLine);
  return {
    frame,
    yOf,
    slot,
    baseline,
    figureAt,
    afterTitle,
    h: Math.ceil(baseline + LABEL_BELOW + labelsH),
  };
}

/** The texts of a frame, in reading order, around the figures over the bars. */
const frameTexts = (frame: PlotFrame, figures: Centred[], legend: LText[] = []) => [
  ...(frame.title ? [frame.title] : []),
  ...legend,
  ...frame.grid.map((g) => g.text),
  ...figures.map((f) => f.text),
  ...frame.labels.map((l) => l.text),
  ...(frame.threshold ? [frame.threshold.text] : []),
];

// ── columns ───────────────────────────────────────────────────────────────

export interface ColumnBar {
  rect: Rect;
  series: number;
  column: number;
  /** Its figure above it · when every bar has one, or on the column brought forward. */
  figure?: Centred;
}

export interface ColumnsParts extends PlotFrame {
  legend: { swatch: Rect; text: LText; series: number }[];
  bars: ColumnBar[];
  /** The column brought forward · -1 when none is. */
  focus: number;
  series: number;
  /** The series stand on one another, one column each, its total over it. */
  stacked: boolean;
  texts: LText[];
}

const isStacked = (node: DgNode) =>
  node.attrs.stacked !== undefined && node.attrs.stacked !== 'false';

function columnsData(node: DgNode) {
  const seriesNames = linesOf(node.attrs.series).slice(0, SERIES_MAX);
  const series = Math.max(1, seriesNames.length);
  const rows = chartRows(node.attrs.columns, series);
  const values = rows.map((r) =>
    Array.from({ length: series }, (_, s) => (r.values[s]! > 0 ? r.values[s]! : 0)),
  );
  const stacked = isStacked(node) && series > 1;
  const totals = values.map((v) => v.reduce((sum, x) => sum + x, 0));
  const scale = scaleOf(node, Math.max(0, ...(stacked ? totals : values.flat())));
  const focus = focusOf(
    node,
    rows.map((r) => r.label),
  );
  return { rows, seriesNames, series, values, totals, stacked, scale, focus };
}

type ColumnsData = ReturnType<typeof columnsData>;

export function columnsWidths(env: TextEnv, node: DgNode) {
  const data = columnsData(node);
  const share = data.stacked ? 1 : Math.min(2, data.series);
  return plotWidths(env, node, data.scale, Math.max(1, data.rows.length), share);
}

/** The series named over the plot, one swatch each, when there are several. */
function seriesLegend(env: TextEnv, data: ColumnsData, top: number): ColumnsParts['legend'] {
  if (data.series < 2) return [];
  let x = 0;
  return data.seriesNames.map((name, series) => {
    const textW = env.width('tag', name);
    const text = env.set('tag', name, textW, x + LEGEND_SWATCH + LEGEND_SWATCH_GAP, top);
    const swatch = { x, y: middleOf(text) - LEGEND_SWATCH / 2, w: LEGEND_SWATCH, h: LEGEND_SWATCH };
    x += LEGEND_SWATCH + LEGEND_SWATCH_GAP + textW + LEGEND_ITEM_GAP;
    return { swatch, text, series };
  });
}

export function columnsParts(
  env: TextEnv,
  node: DgNode,
  width: number,
): ColumnsParts & { h: number } {
  const data = columnsData(node);
  const tagLine = lineOf(env, 'tag');
  const unit = node.attrs.unit;
  // A stacked column says its total · a column of one series its figure as written.
  const written = (s: number, k: number) =>
    withUnit(env.figure(data.rows[k]?.figures[s] ?? '0'), unit);
  const total = (k: number) => withUnit(env.figure(roundFigure(data.totals[k] ?? 0)), unit);
  const legendAbove = data.series > 1 ? tagLine + LEGEND_AFTER : 0;
  const { frame, yOf, slot, baseline, figureAt, h, afterTitle } = plotFrame(
    env,
    node,
    width,
    data.scale,
    {
      labels: data.rows.map((r) => r.label),
      figures: data.stacked
        ? data.rows.map((_, k) => total(k))
        : data.series === 1
          ? data.rows.map((_, k) => written(0, k))
          : undefined,
      figured: data.focus >= 0,
      above: legendAbove,
    },
  );
  const legend = seriesLegend(env, data, afterTitle);
  const { plot } = frame;
  const across = data.stacked ? 1 : data.series;
  const groupW = Math.min(slot * GROUP_SHARE, across * BAR_MAX_W + (across - 1) * BAR_GAP);
  const barW = (groupW - (across - 1) * BAR_GAP) / across;
  const said = (column: number) => frame.everyFigure || column === data.focus;

  const bars = data.values.flatMap((values, column) => {
    let stack = 0;
    return values.map((value, series): ColumnBar => {
      const left = plot.x + slot * column + (slot - groupW) / 2;
      const x = data.stacked ? left : left + series * (barW + BAR_GAP);
      const foot = data.stacked ? yOf(stack) : baseline;
      if (data.stacked) stack += value;
      const y = data.stacked ? yOf(stack) : yOf(value);
      const topOfColumn = !data.stacked || series === data.series - 1;
      const text = data.stacked ? total(column) : written(series, column);
      const figure = said(column) && topOfColumn ? figureAt(text, x + barW / 2, y) : undefined;
      return {
        rect: { x, y, w: barW, h: foot - y },
        series,
        column,
        ...(figure ? { figure } : {}),
      };
    });
  });
  const figures = bars.flatMap((b) => (b.figure ? [b.figure] : []));
  return {
    h,
    ...frame,
    legend,
    bars,
    focus: data.focus,
    series: data.series,
    stacked: data.stacked,
    texts: frameTexts(
      frame,
      figures,
      legend.map((l) => l.text),
    ),
  };
}

/** Columns' act · they grow one after the other from the baseline, each this long,
 *  this far apart, and their figures come in as they reach them. */
export const COLUMN_GROW_SECONDS = 0.55;
export const COLUMN_STAGGER_SECONDS = 0.18;
export const COLUMN_FIGURE_SECONDS = 0.25;

export const columnsSeconds = (columns: number) =>
  COLUMN_GROW_SECONDS + COLUMN_STAGGER_SECONDS * Math.max(0, columns - 1) + COLUMN_FIGURE_SECONDS;

// ── a waterfall ───────────────────────────────────────────────────────────

/** A step of a waterfall · a total stands on the baseline, a step up or down
 *  floats from where the walk was to where it goes. */
export type StepKind = 'total' | 'up' | 'down';

export interface WaterfallBar {
  rect: Rect;
  column: number;
  kind: StepKind;
  figure?: Centred;
}

export interface WaterfallParts extends PlotFrame {
  bars: WaterfallBar[];
  /** The dotted line from the top of a step to the next one, at the level reached. */
  links: { x: number; y: number; w: number }[];
  focus: number;
  texts: LText[];
}

function waterfallData(node: DgNode) {
  const rows = chartRows(node.attrs.steps);
  const closing = node.attrs.total?.trim();
  let level = 0;
  const steps = rows.map((row, n) => {
    const value = Number.isFinite(row.values[0]) ? row.values[0]! : 0;
    const from = n === 0 ? 0 : level;
    level = n === 0 ? value : level + value;
    const kind: StepKind = n === 0 ? 'total' : value < 0 ? 'down' : 'up';
    return { label: row.label, written: row.figures[0] ?? '0', from, to: level, kind };
  });
  if (closing)
    steps.push({ label: closing, written: roundFigure(level), from: 0, to: level, kind: 'total' });
  const scale = scaleOf(node, Math.max(0, ...steps.map((s) => Math.max(s.from, s.to))));
  const focus = focusOf(
    node,
    steps.map((s) => s.label),
  );
  return { steps, scale, focus };
}

/** A step as it is said · its sign always written, the minus a true one. */
function stepFigure(env: TextEnv, kind: StepKind, written: string, unit: string | undefined) {
  if (kind === 'total') return withUnit(env.figure(written), unit);
  const magnitude = written.replace(/^[+−-]/, '');
  return withUnit(`${kind === 'down' ? '−' : '+'}${env.figure(magnitude)}`, unit);
}

export function waterfallWidths(env: TextEnv, node: DgNode) {
  const data = waterfallData(node);
  return plotWidths(env, node, data.scale, Math.max(1, data.steps.length), 1);
}

export function waterfallParts(
  env: TextEnv,
  node: DgNode,
  width: number,
): WaterfallParts & { h: number } {
  const data = waterfallData(node);
  const unit = node.attrs.unit;
  const said = data.steps.map((s) => stepFigure(env, s.kind, s.written, unit));
  const { frame, yOf, slot, figureAt, h } = plotFrame(env, node, width, data.scale, {
    labels: data.steps.map((s) => s.label),
    figures: said,
    figured: true,
    above: 0,
  });
  const { plot } = frame;
  const barW = Math.min(slot * GROUP_SHARE, BAR_MAX_W);
  const bars = data.steps.map((step, column): WaterfallBar => {
    const x = plot.x + slot * column + (slot - barW) / 2;
    const top = yOf(Math.max(step.from, step.to));
    const bottom = yOf(Math.min(step.from, step.to));
    // A step that does not say its figure still says it when it is a total or brought forward.
    const shows = frame.everyFigure || step.kind === 'total' || column === data.focus;
    const figure = shows ? figureAt(said[column]!, x + barW / 2, top) : undefined;
    return {
      rect: { x, y: top, w: barW, h: Math.max(0, bottom - top) },
      column,
      kind: step.kind,
      ...(figure ? { figure } : {}),
    };
  });
  const links = bars.slice(0, -1).map((bar, n) => ({
    x: bar.rect.x + bar.rect.w,
    y: yOf(data.steps[n]!.to),
    w: Math.max(0, bars[n + 1]!.rect.x - (bar.rect.x + bar.rect.w)),
  }));
  const figures = bars.flatMap((b) => (b.figure ? [b.figure] : []));
  return {
    h,
    ...frame,
    bars,
    links,
    focus: data.focus,
    texts: frameTexts(frame, figures),
  };
}

/** A waterfall's act · each step taken after the one before, in this long. */
export const STEP_SECONDS = 0.45;
export const STEP_STAGGER_SECONDS = 0.32;

export const waterfallSeconds = (steps: number) =>
  STEP_SECONDS + STEP_STAGGER_SECONDS * Math.max(0, steps - 1) + COLUMN_FIGURE_SECONDS;
