// ════════════════════════════════════════════════════════════════
// RIKIKI · diagram, the axis engine
//
// Lays items on one linear scale: `domain` mapped onto `length`, an interval drawn
// as a bar from `from` to `to`, a point (`at`) as a bar `trackThickness` wide, an
// item with no value as its label alone. Each item has its own track, stacked in
// the order given, or all share one (`lane: 'shared'`). A label sits on the near
// side of its track first (above, or left when vertical), goes to the far side
// when that collides, then one more row out, `labelGap` further each time · two
// labels never overlap. Along the axis `start`/`end` run from 0 to `length`;
// across it, a track's `start`/`end` is the band it is drawn in. Coordinates are
// the content's own, top-left at 0,0.
//
// A reason starting `info: ` (an item with no value) leaves the placement `fit` · a
// value outside the domain does not: drawn at the edge, it is not where it says.
// ════════════════════════════════════════════════════════════════

import type { Bounds, EngineResult, Placed, Size } from './types.js';

export type AxisOrientation = 'horizontal' | 'vertical';
export type AxisLane = 'own' | 'shared';

/** The key of the one track every item is drawn on when the lane is shared. */
export const SHARED_TRACK = 'shared';
export const INFO_PREFIX = 'info: ';

/** The near side of the track comes first, then the far side. */
const SIDES = ['before', 'after'] as const;
type Side = (typeof SIDES)[number];

export interface AxisItem {
  key: string;
  from?: number;
  to?: number;
  at?: number;
  /** The label's box, as measured. */
  w: number;
  h: number;
}

export interface AxisInput {
  items: AxisItem[];
  domain: [number, number];
  length: number;
  orientation: AxisOrientation;
  bounds: Bounds;
  labelGap: number;
  trackThickness: number;
  lane?: AxisLane;
  /** Labels of one track take turns: the first on the near side, the second on
   *  the far one, and so on · a frise read both sides of its line. Each still
   *  moves out a row when its side is taken. */
  alternate?: boolean;
}

/** A stretch along the axis (a mark) or across it (a track's band). */
export interface AxisSpan {
  key: string;
  start: number;
  end: number;
}

export interface AxisResult extends EngineResult {
  marks: AxisSpan[];
  labels: Placed[];
  tracks: AxisSpan[];
}

/** A label as the axis sees it · its size along and across, where it starts along. */
interface Label {
  key: string;
  along: number;
  across: number;
  start: number;
}

type Slot = { side: Side; rank: number };

type Extent = [start: number, size: number];

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const format = (value: number) => Number(value.toFixed(1));
const valuesOf = (item: AxisItem) =>
  [item.from, item.to, item.at].filter((v): v is number => v !== undefined);

/** Where a value lands, clamped to the domain · the middle of a single-value domain.
 *  Exported for a mark that rides the axis without being one of its items (a cursor). */
export function axisScale(domain: [number, number], length: number) {
  const [low, high] = [Math.min(...domain), Math.max(...domain)];
  const span = domain[1] - domain[0];
  return (value: number) => {
    if (span === 0) return length / 2;
    const bounded = Number.isNaN(value) ? low : clamp(value, low, high);
    return ((bounded - domain[0]) / span) * length;
  };
}

function domainReasons(items: AxisItem[], domain: [number, number]): string[] {
  const [low, high] = [Math.min(...domain), Math.max(...domain)];
  return items.flatMap((item) =>
    valuesOf(item)
      .filter((value) => !(value >= low && value <= high))
      .map((value) => `${item.key}: ${value} is outside the domain [${low}, ${high}]`),
  );
}

/** The bar of an item, null with no value · a lone `from` or `to` is a point, like `at`. */
function markOf(item: AxisItem, place: (v: number) => number, input: AxisInput) {
  if (item.from !== undefined && item.to !== undefined) {
    const [a, b] = [place(item.from), place(item.to)];
    return { key: item.key, start: Math.min(a, b), end: Math.max(a, b) };
  }
  const value = item.at ?? item.from ?? item.to;
  if (value === undefined) return null;
  const width = input.trackThickness;
  const start = clamp(place(value) - width / 2, 0, Math.max(0, input.length - width));
  return { key: item.key, start, end: start + width };
}

/** A label centred on its mark, kept over the track · at its start for an item with no mark. */
function labelOf(item: AxisItem, mark: AxisSpan | null, input: AxisInput): Label {
  const vertical = input.orientation === 'vertical';
  const along = vertical ? item.h : item.w;
  const centre = mark ? (mark.start + mark.end) / 2 : along / 2;
  const start = clamp(centre - along / 2, 0, Math.max(0, input.length - along));
  return { key: item.key, along, across: vertical ? item.w : item.h, start };
}

/** Near side, far side, then a row further out, until the label clears its row by
 *  `gap` · the far side first for every second label when they alternate. */
function assignSlots(labels: Label[], gap: number, alternate = false): Slot[] {
  const rows = new Map<string, Label[]>();
  return labels.map((label, index) => {
    const order = alternate && index % 2 === 1 ? [...SIDES].reverse() : SIDES;
    for (let rank = 0; ; rank++) {
      for (const side of order) {
        const row = rows.get(`${side}${rank}`) ?? [];
        const clear = row.every(
          (o) =>
            label.start >= o.start + o.along + gap || label.start + label.along <= o.start - gap,
        );
        if (clear) {
          rows.set(`${side}${rank}`, [...row, label]);
          return { side, rank };
        }
      }
    }
  });
}

/** The depth of each row of one side, nearest the track first. */
function rowDepths(labels: Label[], slots: Slot[], side: Side): number[] {
  const depths: number[] = [];
  slots.forEach((slot, i) => {
    if (slot.side === side) depths[slot.rank] = Math.max(depths[slot.rank] ?? 0, labels[i].across);
  });
  return Array.from(depths, (depth) => depth ?? 0);
}

/** How far a side's rows reach from the track, a gap before each. */
const sideDepth = (depths: number[], gap: number) =>
  depths.reduce((sum, depth) => sum + gap + depth, 0);

/** How far from the track row `rank` starts. */
const reach = (depths: number[], rank: number, gap: number) =>
  sideDepth(depths.slice(0, rank), gap) + gap;

/** One track and its label rows, from `top` across · where each label starts across. */
function layoutBand(labels: Label[], top: number, input: AxisInput) {
  const gap = input.labelGap;
  const slots = assignSlots(labels, gap, input.alternate);
  const before = rowDepths(labels, slots, 'before');
  const after = rowDepths(labels, slots, 'after');
  const trackStart = top + sideDepth(before, gap);
  const trackEnd = trackStart + input.trackThickness;
  const across = slots.map((slot, i) =>
    slot.side === 'before'
      ? trackStart - reach(before, slot.rank, gap) - labels[i].across
      : trackEnd + reach(after, slot.rank, gap),
  );
  const end = trackEnd + sideDepth(after, gap);
  return { trackStart, trackEnd, across, end };
}

/** The items of each track, in order · one track each, or one for all. */
function groupTracks(items: AxisItem[], lane: AxisLane): { key: string; items: number[] }[] {
  if (lane === 'shared')
    return items.length ? [{ key: SHARED_TRACK, items: items.map((_, i) => i) }] : [];
  return items.map((item, i) => ({ key: item.key, items: [i] }));
}

function openReasons(items: AxisItem[]): string[] {
  return items
    .filter((item) => !valuesOf(item).length)
    .map((item) => `${INFO_PREFIX}${item.key} has no value, drawn as its label alone`);
}

/** A box from where it starts and how far it runs, along the axis and across it. */
function boxOn(vertical: boolean, key: string, along: Extent, across: Extent): Placed {
  const [a, alongSize] = along;
  const [c, acrossSize] = across;
  return vertical
    ? { key, x: c, y: a, w: acrossSize, h: alongSize }
    : { key, x: a, y: c, w: alongSize, h: acrossSize };
}

/** Every track and its labels, one band after the other across the axis. */
function stackTracks(input: AxisInput, marks: (AxisSpan | null)[], labels: Label[]) {
  const vertical = input.orientation === 'vertical';
  const result = { placed: [] as Placed[], labels: [] as Placed[], tracks: [] as AxisSpan[] };
  let top = 0;
  for (const track of groupTracks(input.items, input.lane ?? 'own')) {
    const band = layoutBand(
      track.items.map((i) => labels[i]),
      top,
      input,
    );
    result.tracks.push({ key: track.key, start: band.trackStart, end: band.trackEnd });
    const across: Extent = [band.trackStart, input.trackThickness];
    track.items.forEach((i, j) => {
      const { key, start, along, across: depth } = labels[i];
      result.labels.push(boxOn(vertical, key, [start, along], [band.across[j], depth]));
      const mark = marks[i];
      if (mark)
        result.placed.push(boxOn(vertical, key, [mark.start, mark.end - mark.start], across));
    });
    top = band.end + input.labelGap;
  }
  return { ...result, depth: result.tracks.length ? top - input.labelGap : 0 };
}

function boundsReasons(size: Size, bounds: Bounds): string[] {
  if (size.w <= bounds.w && size.h <= bounds.h) return [];
  const needs = `${format(size.w)}×${format(size.h)}`;
  return [`axis needs ${needs}, bounds are ${format(bounds.w)}×${format(bounds.h)}`];
}

export function axis(input: AxisInput): AxisResult {
  const { items, domain, length } = input;
  const place = axisScale(domain, length);
  const marks = items.map((item) => markOf(item, place, input));
  const labels = items.map((item, i) => labelOf(item, marks[i], input));
  const stacked = stackTracks(input, marks, labels);
  const along = Math.max(length, ...labels.map((l) => l.start + l.along));
  const vertical = input.orientation === 'vertical';
  const size = vertical ? { w: stacked.depth, h: along } : { w: along, h: stacked.depth };
  const reasons = [...domainReasons(items, domain), ...boundsReasons(size, input.bounds)];
  return {
    placed: stacked.placed,
    size,
    status: reasons.length ? 'unresolved' : 'fit',
    reasons: [...reasons, ...openReasons(items)],
    marks: marks.filter((mark): mark is AxisSpan => mark !== null),
    labels: stacked.labels,
    tracks: stacked.tracks,
  };
}
