// ════════════════════════════════════════════════════════════════
// RIKIKI · deck-scene-bars layout, the pure part of the bars scene
//
// Reading a figure as an author writes it, the scale a bar is drawn on, and the
// columns the bars and their groups take across the drawing · kept apart from
// the element so they run, and are tested, without a browser.
// ════════════════════════════════════════════════════════════════

import {
  type Fitted,
  type Measure,
  SCENE_LIMITS,
  SCENE_WIDTH,
  SHRINK_RATIO,
} from './scene-layout.js';

/** Past eight bars the slide is a chart, and a chart is deck-chart's job. */
export const MAX_BARS = SCENE_LIMITS.bars.max;

/** A bar wider than this stops reading as a bar and starts reading as a card. */
export const MAX_BAR_WIDTH = 200;

/** Between two bars of a group, and between two groups · twice the gap is what
 *  tells the eye where one comparison ends and the next begins, and no more,
 *  since every unit spent between groups is taken from the bars' figures. */
export const BAR_GAP = 48;
export const GROUP_GAP = 96;

/** Room kept clear between the labels of two neighbouring bars. */
export const LABEL_CLEAR = 16;

/** A label is centred on its bar and may run this far past either side of it. */
export const LABEL_OVERHANG = (BAR_GAP - LABEL_CLEAR) / 2;

/** A bar keeps at least this width · the radius of its rounded top. In a region
 *  too narrow for the gaps as written, the gaps give way first. */
export const MIN_BAR_WIDTH = 8;

/** Between a figure and its unit · narrow and unbreakable, so "1,7 %" never
 *  leaves its sign alone on a line and reads the same in French and SI. */
export const UNIT_SPACE = ' ';

/** A figure as an author writes it: "1,7" and "1.7" are the same number, and a
 *  space inside it ("12 500") is a thousands separator. Anything that is not a
 *  number reads as zero · the bar is flat, the text still shows what was written. */
export function parseFigure(text: string | null | undefined): number {
  return readFigure(text) ?? 0;
}

/** The number an author wrote, or null when there is none to read · `parseFigure`
 *  draws null as a flat bar, and the lint is what tells the author it was one. */
export function readFigure(text: string | null | undefined): number | null {
  const normalised = (text ?? '').replace(/\s/g, '').replace(',', '.');
  if (!normalised) return null;
  const figure = Number(normalised);
  return Number.isFinite(figure) ? figure : null;
}

/** The figure printed above a bar: as written, so the author's decimal sign is
 *  kept, then the unit after a narrow no-break space. */
export function formatFigure(text: string | null | undefined, unit: string): string {
  const figure = (text ?? '').trim();
  if (!figure) return '';
  const sign = unit.trim();
  return sign ? `${figure}${UNIT_SPACE}${sign}` : figure;
}

/** How far a figure may shrink to fit, as a share of its size · a figure is the
 *  first thing read, so it gives up size in steps, never below the point where
 *  it stops being the biggest text of the bar (and the room reads it at 50 px). */
export const FIGURE_FLOOR = 0.7;

/** A figure that did not fit, with what it needed · `measured` is its width at
 *  the size it was finally drawn. */
export interface FittedFigure extends Fitted {
  measured: number;
}

/** A figure is one line, whole · the kit's wrap breaks at any white space, the
 *  narrow one before the unit included, and "12 / ms" over two lines would run
 *  into the bar. It steps down, a step at a time, to the floor, and only then
 *  reports itself as not fitting. */
export function fitFigure(
  text: string,
  maxWidth: number,
  size: number,
  measureAt: (size: number) => Measure,
): FittedFigure {
  const lines = text ? [text] : [];
  const floor = Math.round(size * FIGURE_FLOOR);
  let current = size;
  for (;;) {
    const measured = measureAt(current)(text);
    if (measured <= maxWidth) return { lines, fits: true, size: current, measured };
    if (current <= floor) return { lines, fits: false, size: current, measured };
    current = Math.max(floor, Math.round(current * SHRINK_RATIO));
  }
}

/** The top of the scale: the author's `max` when given, otherwise the largest
 *  value, so the tallest bar fills the area. Never zero · nothing divides by it. */
export function scaleMax(values: number[], max?: number): number {
  const top = max !== undefined && max > 0 ? max : Math.max(0, ...values);
  return top > 0 ? top : 1;
}

/** A bar's height in drawing units. A value past the scale stops at the top of
 *  the area, a negative one stays on the baseline · neither leaves the drawing. */
export function barHeight(value: number, max: number, area: number): number {
  const ratio = Math.min(1, Math.max(0, value / max));
  return ratio * area;
}

export interface BarGroup {
  /** The caption under the group, empty when the items carry no note. */
  note: string;
  /** The index of the group's first bar. */
  first: number;
  count: number;
}

/** Consecutive items with the same note form one group · the note is written on
 *  every item of it, so moving an item moves its group with it. */
export function groupByNote(notes: string[]): BarGroup[] {
  const groups: BarGroup[] = [];
  notes.forEach((raw, index) => {
    const note = raw.trim();
    const last = groups.at(-1);
    if (last && last.note === note) last.count += 1;
    else groups.push({ note, first: index, count: 1 });
  });
  return groups;
}

export interface GroupSpan extends BarGroup {
  /** Left edge of the group's first bar, and the width up to its last bar's right edge. */
  x: number;
  width: number;
}

export interface BarColumns {
  barWidth: number;
  /** The width a label, a figure or a tag may take, centred on its bar. */
  labelWidth: number;
  /** Left edge of every bar. */
  xs: number[];
  groups: GroupSpan[];
  /** The x of the divider drawn in the middle of every gap between two groups. */
  dividers: number[];
}

/** Same width for every bar, equal gaps inside a group, a wider one between
 *  groups, the whole set centred · a handful of bars does not stretch to the
 *  edges of the drawing, it sits in the middle at a width that reads as bars. */
export function barColumns(groups: BarGroup[], width = SCENE_WIDTH): BarColumns {
  const bars = groups.reduce((sum, group) => sum + group.count, 0);
  if (!bars) return { barWidth: 0, labelWidth: 0, xs: [], groups: [], dividers: [] };

  const written = (bars - groups.length) * BAR_GAP + (groups.length - 1) * GROUP_GAP;
  const available = width - 2 * LABEL_OVERHANG;
  // Every gap gives way alike, so a group still reads apart from the next, and only
  // as much as a bar needs to keep its minimum · never past zero.
  const fit = written ? Math.min(1, Math.max(0, (available - bars * MIN_BAR_WIDTH) / written)) : 1;
  const barGap = BAR_GAP * fit;
  const groupGap = GROUP_GAP * fit;
  const gaps = written * fit;
  const barWidth = Math.max(0, Math.min(MAX_BAR_WIDTH, (available - gaps) / bars));
  const total = bars * barWidth + gaps;

  const xs: number[] = [];
  const spans: GroupSpan[] = [];
  const dividers: number[] = [];
  let cursor = (width - total) / 2;
  groups.forEach((group, index) => {
    if (index > 0) {
      dividers.push(cursor + groupGap / 2);
      cursor += groupGap;
    }
    const start = cursor;
    for (let bar = 0; bar < group.count; bar += 1) {
      if (bar > 0) cursor += barGap;
      xs.push(cursor);
      cursor += barWidth;
    }
    spans.push({ ...group, x: start, width: cursor - start });
  });

  // A label may take its bar and the gap beside it, less the room kept clear.
  const labelWidth = Math.max(0, barWidth + barGap - LABEL_CLEAR);
  return { barWidth, labelWidth, xs, groups: spans, dividers };
}
