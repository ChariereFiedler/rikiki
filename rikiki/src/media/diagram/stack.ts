// ════════════════════════════════════════════════════════════════
// RIKIKI · diagram stack and grid, the two engines that line children up
//
// `stack` puts children in a row or a column: a row shares its width (each child
// starts at what it prefers, gives back toward its least when the row is short,
// takes the free room by weight toward its most when it is long) and wraps when
// even the least widths do not fit; a column gives each child the width of the
// box and squeezes its gaps before giving up. `grid` cuts the box into identical
// square cells (units of a crowd) or into the tracks of a table (a label, a track
// that fills, a tag).
//
// Pure, like every engine (see types.ts) · numbers in, numbers out. The content is
// placed from (0,0) in a box of `size`; centring it in the bounds is the caller's.
// ════════════════════════════════════════════════════════════════

import type { Align, Block, Bounds, Direction, EngineResult, Placed, Size } from './types.js';

/** How many lines a wrapping row breaks into at most, when the author does not say. */
export const DEFAULT_MAX_LINES = 3;
/** A grid of units with no aspect asked for is landscape, like the slide it sits on. */
export const DEFAULT_ASPECT = 2.2;
/** A column that runs out of height squeezes its gaps down to this share, not less ·
 *  below it the children read as one block. */
const MIN_GAP_SHARE = 0.5;
/** Two cells closer than this, in drawing units, are the same size to the eye · an
 *  auto grid then picks the shape nearest its aspect. */
const CELL_TIE = 0.5;
/** Below this, a difference between two lengths is rounding, not room. */
const EPSILON = 1e-6;

export interface StackInput {
  direction: Direction;
  blocks: Block[];
  bounds: Bounds;
  gap: number;
  align: Align;
  /** A row that does not fit even at its least widths breaks into lines. */
  wrap?: boolean;
  /** Every child gets the same cross size (height in a row, width in a column). */
  equalCross?: boolean;
  /** The most lines a wrapping row breaks into · `DEFAULT_MAX_LINES` when absent. */
  maxLines?: number;
}

export interface StackResult extends EngineResult {
  /** How many lines the children took · 0 with no child, 1 for a column. */
  lines: number;
}

export interface UniformGridInput {
  mode: 'uniform';
  count: number;
  /** Exactly this many columns, or the shape with the biggest cells near `aspect`. */
  columns: number | 'auto';
  bounds: Bounds;
  gap: number;
  minCell: number;
  maxCell: number;
  /** Columns over rows the auto shape aims at · `DEFAULT_ASPECT` when absent. */
  aspect?: number;
}

export interface UniformGridResult extends EngineResult {
  cell: number;
  columns: number;
  rows: number;
}

/** A table track: the width of its widest child, a share of what is left, or fixed. */
export type Track = 'auto' | 'fill' | number;

export interface TableGridInput {
  mode: 'table';
  rows: Block[][];
  tracks: Track[];
  bounds: Bounds;
  /** `w` between two tracks, `h` between two rows. */
  gap: Size;
}

export interface TableGridResult extends EngineResult {
  /** The width each track came out at, in order. */
  tracks: number[];
}

/** A length an engine can trust · finite and not negative, 0 otherwise. */
function len(n: number | undefined): number {
  return n !== undefined && Number.isFinite(n) && n > 0 ? n : 0;
}
const sum = (ns: number[]) => ns.reduce((a, b) => a + b, 0);
const gapsOf = (count: number, gap: number) => gap * Math.max(0, count - 1);
const fmt = (n: number) => Number(n.toFixed(1));
const maxOf = (b: Block) =>
  b.maxW !== undefined && Number.isFinite(b.maxW) ? Math.max(len(b.minW), b.maxW) : Infinity;
const prefOf = (b: Block) => Math.min(maxOf(b), Math.max(len(b.minW), len(b.prefW)));
const weightOf = (b: Block) => len(b.weight ?? 1);
const heightOf = (b: Block, width: number) => len(b.heightFor(width));

/** Where a thing `free` units shorter than its room starts · stretch starts at 0. */
function offset(align: Align, free: number): number {
  if (align === 'center') return free / 2;
  return align === 'end' ? free : 0;
}

function overflow(what: string, used: number, room: number, axis: 'wide' | 'tall'): string[] {
  if (used <= room + EPSILON) return [];
  return [`${what} is ${fmt(used)} ${axis}, ${fmt(used - room)} over the ${fmt(room)} of the box`];
}

function tooNarrow(blocks: Block[], room: number, where: string): string[] {
  return blocks
    .filter((b) => len(b.minW) > room + EPSILON)
    .map((b) => `"${b.key}" needs at least ${fmt(len(b.minW))} wide, ${where} is ${fmt(room)}`);
}

function result(placed: Placed[], size: Size, reasons: string[]): EngineResult {
  return { placed, size, status: reasons.length ? 'unresolved' : 'fit', reasons };
}

/** The widths of one line in `room` · what each prefers, given back toward the least
 *  in proportion to what each can give when short, grown by weight when long. */
function lineWidths(blocks: Block[], room: number): number[] {
  const mins = blocks.map((b) => len(b.minW));
  const prefs = blocks.map(prefOf);
  const over = sum(prefs) - room;
  if (over <= 0) return grow(blocks, prefs, -over);
  const slack = sum(prefs) - sum(mins);
  if (slack <= over) return mins;
  return prefs.map((pref, i) => pref - ((pref - mins[i]) * over) / slack);
}

/** Shares `extra` by weight · a child that reaches its most stops there and the rest
 *  is shared again among the others. What no one can take is left over. */
function grow(blocks: Block[], widths: number[], extra: number): number[] {
  const out = [...widths];
  let open = blocks.map((_, i) => i).filter((i) => maxOf(blocks[i]) > out[i]);
  let left = extra;
  while (left > EPSILON && open.length) {
    const total = sum(open.map((i) => weightOf(blocks[i])));
    if (total <= 0) break;
    const share = (i: number) => (left * weightOf(blocks[i])) / total;
    const capped = open.filter((i) => out[i] + share(i) >= maxOf(blocks[i]));
    if (!capped.length) {
      for (const i of open) out[i] += share(i);
      break;
    }
    for (const i of capped) {
      left -= maxOf(blocks[i]) - out[i];
      out[i] = maxOf(blocks[i]);
    }
    open = open.filter((i) => !capped.includes(i));
  }
  return out;
}

/** Greedy lines · each takes children, in order, while their `widthOf` and the gaps
 *  fit in `room`. A child wider than the room alone gets a line of its own. */
function breakLines(blocks: Block[], room: number, gap: number, widthOf: (b: Block) => number) {
  const lines: Block[][] = [];
  let line: Block[] = [];
  let used = 0;
  for (const block of blocks) {
    const width = widthOf(block);
    if (line.length && used + gap + width > room + EPSILON) {
      lines.push(line);
      line = [];
    }
    used = line.length ? used + gap + width : width;
    line.push(block);
  }
  if (line.length) lines.push(line);
  return lines;
}

/** At most `maxLines` lines · whatever did not fit goes on the last one, too wide. */
function capLines(lines: Block[][], maxLines: number): Block[][] {
  if (lines.length <= maxLines) return lines;
  return [...lines.slice(0, maxLines - 1), lines.slice(maxLines - 1).flat()];
}

/** A row drawn as these lines · a shorter line sits along the widest by `align`. */
function placeRow(groups: Block[][], input: StackInput, needed: number, maxLines: number) {
  const gap = len(input.gap);
  const room = len(input.bounds.w);
  const lines = groups.map((blocks) => {
    const widths = lineWidths(blocks, room - gapsOf(blocks.length, gap));
    const heights = blocks.map((b, i) => heightOf(b, widths[i]));
    return { blocks, widths, heights, width: sum(widths) + gapsOf(blocks.length, gap) };
  });
  const tallest = Math.max(0, ...lines.flatMap((line) => line.heights));
  const width = Math.max(0, ...lines.map((line) => line.width));
  const sameHeight = input.equalCross || input.align === 'stretch';
  const placed: Placed[] = [];
  let y = 0;
  for (const line of lines) {
    const lineH = input.equalCross ? tallest : Math.max(0, ...line.heights);
    let x = offset(input.align, width - line.width);
    line.blocks.forEach((block, i) => {
      const h = sameHeight ? lineH : line.heights[i];
      const top = y + offset(input.align, lineH - h);
      placed.push({ key: block.key, x, y: top, w: line.widths[i], h });
      x += line.widths[i] + gap;
    });
    y += lineH + gap;
  }
  const height = Math.max(0, y - gap);
  const reasons = [
    ...tooNarrow(input.blocks, room, 'the box'),
    ...overflow('the row', width, room, 'wide'),
    ...(needed > maxLines ? [`the row needs ${needed} lines, ${maxLines} at most`] : []),
    ...overflow('the row', height, len(input.bounds.h), 'tall'),
  ];
  return { ...result(placed, { w: width, h: height }, reasons), lines: lines.length };
}

/** One line when the least widths fit; otherwise, when it may wrap, lines at the
 *  preferred widths, then the fewest lines at the least widths, the first that fits. */
function row(input: StackInput): StackResult {
  const gap = len(input.gap);
  const room = len(input.bounds.w);
  const least = sum(input.blocks.map((b) => len(b.minW))) + gapsOf(input.blocks.length, gap);
  if (least <= room + EPSILON || !input.wrap) return placeRow([input.blocks], input, 1, 1);
  const maxLines = Math.max(1, Math.floor(len(input.maxLines ?? DEFAULT_MAX_LINES)));
  const byPref = breakLines(input.blocks, room, gap, prefOf);
  const byMin = breakLines(input.blocks, room, gap, (b) => len(b.minW));
  const tries = byPref.length <= maxLines ? [placeRow(byPref, input, byPref.length, maxLines)] : [];
  tries.push(placeRow(capLines(byMin, maxLines), input, byMin.length, maxLines));
  return tries.find((t) => t.status === 'fit') ?? tries[tries.length - 1];
}

/** Each child as wide as the box allows, stacked · the gaps give way first. */
function column(input: StackInput): StackResult {
  const { blocks, align } = input;
  const room = len(input.bounds.w);
  const roomH = len(input.bounds.h);
  const gap = len(input.gap);
  const own = blocks.map((b) =>
    Math.max(len(b.minW), align === 'stretch' ? room : Math.min(maxOf(b), room)),
  );
  const widest = Math.max(0, ...own);
  const widths = input.equalCross ? own.map(() => widest) : own;
  const heights = blocks.map((b, i) => heightOf(b, widths[i]));
  const content = sum(heights);
  let squeezed = gap;
  if (content + gapsOf(blocks.length, gap) > roomH && blocks.length > 1) {
    squeezed = Math.max(gap * MIN_GAP_SHARE, (roomH - content) / (blocks.length - 1));
  }
  let y = 0;
  const placed = blocks.map((block, i) => {
    const x = offset(align, widest - widths[i]);
    const at = { key: block.key, x, y, w: widths[i], h: heights[i] };
    y += heights[i] + squeezed;
    return at;
  });
  const height = content + gapsOf(blocks.length, squeezed);
  const reasons = [
    ...tooNarrow(blocks, room, 'the box'),
    ...overflow('the column', height, roomH, 'tall'),
  ];
  return { ...result(placed, { w: widest, h: height }, reasons), lines: 1 };
}

/** A row or a column of children · see the file header for the rules. */
export function stack(input: StackInput): StackResult {
  if (!input.blocks.length) return { ...result([], { w: 0, h: 0 }, []), lines: 0 };
  return input.direction === 'column' ? column(input) : row(input);
}

/** The side of a square cell when `count` cells take `columns` columns of the box. */
function cellFor(count: number, columns: number, bounds: Bounds, gap: number, maxCell: number) {
  const rows = Math.ceil(count / columns);
  const across = (len(bounds.w) - gapsOf(columns, gap)) / columns;
  const down = (len(bounds.h) - gapsOf(rows, gap)) / rows;
  return Math.max(0, Math.min(maxCell, across, down));
}

/** The columns giving the biggest cells · among shapes the eye sees as the same
 *  size, the one nearest `aspect`, and the fewest columns on a tie. */
function autoColumns(count: number, bounds: Bounds, gap: number, maxCell: number, aspect: number) {
  const shapes = Array.from({ length: count }, (_, i) => {
    const columns = i + 1;
    const ratio = columns / Math.ceil(count / columns);
    const cell = cellFor(count, columns, bounds, gap, maxCell);
    return { columns, cell, distance: Math.abs(Math.log(ratio / aspect)) };
  });
  const biggest = Math.max(...shapes.map((s) => s.cell));
  const sameSize = shapes.filter((s) => s.cell >= biggest - CELL_TIE);
  return sameSize.reduce((best, s) => (s.distance < best.distance ? s : best)).columns;
}

/** Cells in the order they light · down a column, then the next. Exactly `columns`
 *  columns: the ragged edge is the last row, the first columns one cell longer. */
function unitCells(count: number, columns: number, rows: number, cell: number, gap: number) {
  const longer = count - (rows - 1) * columns;
  const placed: Placed[] = [];
  for (let c = 0; c < columns && placed.length < count; c++) {
    const height = c < longer ? rows : rows - 1;
    for (let r = 0; r < height; r++) {
      const at = { x: c * (cell + gap), y: r * (cell + gap), w: cell, h: cell };
      placed.push({ key: String(placed.length), ...at });
    }
  }
  return placed;
}

function uniformGrid(input: UniformGridInput): UniformGridResult {
  const count = Math.floor(len(input.count));
  const gap = len(input.gap);
  const minCell = len(input.minCell);
  const maxCell = Math.max(minCell, len(input.maxCell));
  const asked = input.columns === 'auto' ? 0 : Math.max(1, Math.floor(len(input.columns)));
  if (!count) return { ...result([], { w: 0, h: 0 }, []), cell: 0, columns: asked, rows: 0 };
  const aspect = len(input.aspect) || DEFAULT_ASPECT;
  const columns = asked || autoColumns(count, input.bounds, gap, maxCell, aspect);
  const rows = Math.ceil(count / columns);
  const fitted = cellFor(count, columns, input.bounds, gap, maxCell);
  const cell = Math.max(minCell, fitted);
  const size = { w: columns * cell + gapsOf(columns, gap), h: rows * cell + gapsOf(rows, gap) };
  const left = `${count} cells in ${columns} columns leave ${fmt(fitted)} a cell`;
  const readable = `under the ${fmt(minCell)} a unit reads at`;
  const reasons = fitted < minCell - EPSILON ? [`${left}, ${readable}`] : [];
  const placed = unitCells(count, columns, rows, cell, gap);
  return { ...result(placed, size, reasons), cell, columns, rows };
}

/** Each track's width · auto takes its widest child, a number is kept, the fill
 *  tracks share what is left, and none is narrower than its narrowest-possible child. */
function trackWidths(rows: Block[][], tracks: Track[], room: number, gap: number): number[] {
  const count = Math.max(tracks.length, ...rows.map((r) => r.length));
  const kinds = Array.from({ length: count }, (_, c) => tracks[c] ?? 'auto');
  const columnOf = (c: number) => rows.flatMap((r) => (r[c] ? [r[c]] : []));
  const sized = kinds.map((kind, c) => {
    if (kind === 'fill') return 0;
    return kind === 'auto' ? Math.max(0, ...columnOf(c).map(prefOf)) : len(kind);
  });
  const fills = kinds.filter((kind) => kind === 'fill').length;
  const free = Math.max(0, room - sum(sized) - gapsOf(count, gap)) / Math.max(1, fills);
  return kinds.map((kind, c) =>
    kind === 'fill' ? Math.max(free, ...columnOf(c).map((b) => len(b.minW))) : sized[c],
  );
}

function tableGrid(input: TableGridInput): TableGridResult {
  const gapW = len(input.gap.w);
  const gapH = len(input.gap.h);
  const tracks = trackWidths(input.rows, input.tracks, len(input.bounds.w), gapW);
  const xs = tracks.map((_, c) => sum(tracks.slice(0, c)) + c * gapW);
  const placed: Placed[] = [];
  const reasons: string[] = [];
  let y = 0;
  input.rows.forEach((cells, r) => {
    const widths = cells.map((b, c) => Math.max(len(b.minW), Math.min(maxOf(b), tracks[c])));
    const heights = cells.map((b, c) => heightOf(b, widths[c]));
    cells.forEach((b, c) => {
      placed.push({ key: `${r},${c}`, x: xs[c], y, w: widths[c], h: heights[c] });
      reasons.push(...tooNarrow([b], tracks[c], `its track`));
    });
    y += Math.max(0, ...heights) + gapH;
  });
  const size = { w: sum(tracks) + gapsOf(tracks.length, gapW), h: Math.max(0, y - gapH) };
  reasons.push(
    ...overflow('the table', size.w, len(input.bounds.w), 'wide'),
    ...overflow('the table', size.h, len(input.bounds.h), 'tall'),
  );
  return { ...result(placed, size, reasons), tracks };
}

/** Identical square cells (`uniform`) or the tracks of a table (`table`). */
export function grid(input: UniformGridInput): UniformGridResult;
export function grid(input: TableGridInput): TableGridResult;
export function grid(input: UniformGridInput | TableGridInput) {
  return input.mode === 'uniform' ? uniformGrid(input) : tableGrid(input);
}
