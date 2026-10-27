// ════════════════════════════════════════════════════════════════
// RIKIKI · diagram, how large a drawing is drawn
//
// A drawing that leaves most of its room empty is enlarged, up to a ceiling. The
// enlargement is the room over the drawing's ink, on the tighter of the two axes ·
// so a drawing laid out as wide as its room (a graph whose ranks spread, an axis,
// lanes) could never grow, however short it was: it filled the width with empty
// track, and its type stayed at the floor of the scale in a slide two thirds empty.
// `widthToGrow` says how wide to lay it out instead, so that the height it has
// sets the enlargement and the width follows.
//
// Pure: a layout and a meter in, numbers out.
// ════════════════════════════════════════════════════════════════

import { type DiagramLayout, type LText, type Meter, textsOf } from './layout.js';
import type { Point } from './types.js';

/** A drawing that leaves most of its room empty is drawn larger, never past this. */
export const MAX_GROWTH = 1.5;
/** The share of the room a grown drawing may take · the rest is breathing room. */
export const GROWN_FILL = 0.92;
/** A narrower layout is worth it when the drawing grows at least this much more. */
export const WORTH_GROWING = 1.15;
/** The share of the room's height a drawing laid out narrower to grow may reach · less
 *  than a drawing that already fits, since the room a diagram plans for assumes a title
 *  of one line, and a title on two takes about 80 units of it. */
export const NARROWED_FILL = 0.8;
/** How far a capital's accent rises above the line box it is set in, a share of the
 *  type size · "É" on the top line of a drawing enlarged to its height is past the
 *  frame by that much, and the slide crops it. */
const ACCENT_RISE = 0.2;

export interface Ink {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/** The corners of a text's lines, as measured in the font it is drawn in. A text
 *  set centred on its x (a link's label) spreads half its width either side. */
function textCorners(text: LText, meter: Meter, centred = false): [number, number][] {
  const width = Math.max(...text.lines.map((line) => meter(text.size, text.weight)(line)));
  const height = text.lines.length * text.line;
  const left = centred ? text.x - width / 2 : text.x;
  return [
    [left, text.y - ACCENT_RISE * text.size],
    [left + width, text.y + height],
  ];
}

/** An arrow head's wings are this long, this far either side of its line, in radians. */
export const ARROW_LENGTH = 14;
export const ARROW_SPREAD = 0.45;

/** The two wing tips of the arrow head at the end of a polyline. */
export function arrowWings(points: Point[]): [Point, Point] | null {
  const end = points.at(-1);
  const before = points.at(-2);
  if (!end || !before) return null;
  const angle = Math.atan2(end.y - before.y, end.x - before.x);
  const wing = (side: number): Point => ({
    x: end.x - ARROW_LENGTH * Math.cos(angle - side * ARROW_SPREAD),
    y: end.y - ARROW_LENGTH * Math.sin(angle - side * ARROW_SPREAD),
  });
  return [wing(1), wing(-1)];
}

/** The box around everything drawn · marks, link routes and their arrow heads, notes
 *  and their text. */
export function inkOf(drawn: DiagramLayout, meter: Meter): Ink | null {
  const corners: [number, number][] = [
    ...drawn.items.flatMap((i) => textsOf(i)).flatMap((t) => textCorners(t, meter)),
    ...drawn.links.flatMap((l) => (l.label ? textCorners(l.label, meter, true) : [])),
    ...drawn.notes.flatMap((n) => n.texts).flatMap((t) => textCorners(t, meter)),
    ...drawn.items.flatMap((i): [number, number][] =>
      i.kind === 'dot'
        ? [
            [i.x, i.y],
            [i.x + i.size, i.y + i.size],
          ]
        : [
            [i.x, i.y],
            [i.x + i.w, i.y + i.h],
          ],
    ),
    ...drawn.items
      .flatMap((i) => (i.kind === 'gate' && i.feed ? i.feed : []))
      .map((p): [number, number] => [p.x, p.y]),
    ...drawn.links.flatMap((l) => l.points.map((p): [number, number] => [p.x, p.y])),
    ...drawn.links
      .flatMap((l) => (l.head ? (arrowWings(l.points) ?? []) : []))
      .map((p): [number, number] => [p.x, p.y]),
    ...drawn.notes.flatMap((n): [number, number][] => [
      [n.x, n.y],
      [n.x + n.w, n.y + n.h],
    ]),
  ];
  if (!corners.length) return null;
  const xs = corners.map(([x]) => x);
  const ys = corners.map(([, y]) => y);
  return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
}

/** The box around the ink of every picture · the frame they share. */
export function unionOf(inks: (Ink | null)[]): Ink | null {
  const present = inks.filter((ink): ink is Ink => !!ink);
  if (!present.length) return null;
  return {
    x0: Math.min(...present.map((i) => i.x0)),
    y0: Math.min(...present.map((i) => i.y0)),
    x1: Math.max(...present.map((i) => i.x1)),
    y1: Math.max(...present.map((i) => i.y1)),
  };
}

/** How much to enlarge a drawing so its ink fills its room · 1 when it already does. */
export function growthFor(ink: Ink | null, room: { w: number; h: number }): number {
  if (!ink) return 1;
  const w = ink.x1 - ink.x0;
  const h = ink.y1 - ink.y0;
  if (w <= 0 || h <= 0) return 1;
  const fits = Math.min((room.w * GROWN_FILL) / w, (room.h * GROWN_FILL) / h);
  return Math.min(MAX_GROWTH, Math.max(1, fits));
}

/** The width to lay a drawing out in so it is drawn larger · when its width holds
 *  it back and its height would let it grow by `WORTH_GROWING` more, the width that,
 *  enlarged as far as the height allows, fills the room. Null when the width it was
 *  laid out in already lets it be drawn as large as it can. */
export function widthToGrow(ink: Ink | null, room: { w: number; h: number }): number | null {
  if (!ink) return null;
  const h = ink.y1 - ink.y0;
  if (h <= 0) return null;
  const now = growthFor(ink, room);
  const byHeight = Math.min(MAX_GROWTH, (room.h * NARROWED_FILL) / h);
  if (byHeight < now * WORTH_GROWING) return null;
  return Math.floor((room.w * GROWN_FILL) / byHeight);
}
