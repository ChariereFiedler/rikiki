// ════════════════════════════════════════════════════════════════
// RIKIKI · diagram, the morph · one picture becoming the next
//
// A diagram with `dg-state` has a picture per click. What two pictures share
// keeps its identity: a mark with the same name (or the very mark written once,
// outside the states) moves and resizes from its place in the one to its place in
// the other, so the room sees the same thing reorganised, not two drawings. What
// only the first has leaves, what only the second has comes in.
//
// Three phases, never mixed, so that no line is seen crossing a moving box: the
// links and the marks that leave fade out, then what stays moves, then the new
// marks and links come in. Matching is one to one, by name · a merge or a split is
// two marks leaving and one coming, not a guess.
//
// Pure: two laid-out pictures in, what each part does and the cues of its motion
// out. The schedule (motion.ts) says when; the drawing plays it.
// ════════════════════════════════════════════════════════════════

import { cueIds, durationOf, itemEnter, linkEnter, noteEnter } from './choreography.js';
import type { DiagramLayout, LItem, LLink, LNote } from './layout.js';
import { atClick, gateStateAt, textsOf } from './layout.js';
import type { DgIssue } from './model.js';
import { type Cue, ENTER_SECONDS, EXIT_SECONDS, type Enter, MORPH_SECONDS } from './motion.js';
import type { Point } from './types.js';

/** More marks than this moving on one click is a shuffle the eye cannot follow. */
export const MORPH_CROWD = 7;
/** Under half a unit, a mark has not moved. */
const STILL = 0.5;

/** A picture as the room sees it on one click. */
export interface Picture {
  layout: DiagramLayout;
  /** The click it is the picture of. */
  stage: number;
  /** What is on it, by index into the layout's items, links and notes. */
  items: number[];
  links: number[];
  notes: number[];
  /** Where it is drawn from the layout's origin · each picture is centred in the
   *  frame all of them share, so the frame does not jump from one to the next. */
  shift: Point;
}

/** The picture of a layout on click `stage` · what has appeared by then, read off
 *  the click each part appears on (`Choreography.appears`). */
export function pictureOf(
  layout: DiagramLayout,
  appears: ReadonlyMap<string, number>,
  stage: number,
  shift: Point = { x: 0, y: 0 },
): Picture {
  const shown = (count: number, id: (n: number) => string) =>
    Array.from({ length: count }, (_, n) => n).filter((n) => (appears.get(id(n)) ?? 0) <= stage);
  return {
    layout,
    stage,
    shift,
    items: shown(layout.items.length, cueIds.item),
    links: shown(layout.links.length, cueIds.link),
    notes: shown(layout.notes.length, cueIds.note),
  };
}

/** A mark that stays and changes · drawn at its new place, played from the old one. */
export interface Move {
  /** Its index in the picture before. */
  from: number;
  /** Where it was, from where it is: an offset, and its old size over its new. */
  dx: number;
  dy: number;
  sx: number;
  sy: number;
  /** Its words changed · the new ones fade in while it moves. */
  relabel: boolean;
  /** Its fill before, for a meter or a queue that changes value. */
  fill?: number;
}

export interface Transition {
  /** By cue id of the new picture · what moves. Neither here nor entering: it stays. */
  moves: Map<string, Move>;
  /** By cue id of the new picture · what comes in. */
  entering: Set<string>;
  /** What leaves, by index into the picture before. */
  leaving: { items: number[]; links: number[]; notes: number[] };
  cues: Cue[];
  issues: DgIssue[];
}

/** The cue of a part of the picture before that leaves, and of a mark that moves. */
export const morphIds = {
  leave: (id: string) => `out:${id}`,
  move: (id: string) => `move:${id}`,
};

/** How a link comes in on a click that changes the picture · traced, unless it is
 *  dashed or says otherwise: the new connection is made under the eye. */
export const transitionLinkEnter = (link: LLink): Enter =>
  link.node?.attrs.enter || link.dashed ? linkEnter(link) : 'draw';

/** A mark's identity across pictures · its kind and its key, and a cell's rank. */
const identity = (item: LItem): string =>
  `${item.kind}:${item.key}${item.kind === 'dot' ? `:${item.index}` : ''}`;

const rectOf = (item: LItem) =>
  item.kind === 'dot'
    ? { x: item.x, y: item.y, w: item.size, h: item.size }
    : { x: item.x, y: item.y, w: item.w, h: item.h };

/** The words a mark shows on a click. */
const wordsOf = (item: LItem, stage: number): string =>
  JSON.stringify([
    textsOf(item).map((t) => t.lines),
    item.kind === 'meter' ? atClick(item.figures, stage)?.lines : null,
  ]);

/** How a mark looks on a click, its words aside · its paint, tone, emphasis, and
 *  what a meter, a queue or a gate shows then. */
const lookOf = (item: LItem, stage: number): string =>
  JSON.stringify([
    'paint' in item ? item.paint : null,
    'tone' in item ? item.tone : null,
    'emphasis' in item ? item.emphasis : null,
    item.kind === 'meter' || item.kind === 'queue'
      ? [atClick(item.fills, stage), atClick(item.tones, stage)]
      : item.kind === 'box'
        ? atClick(item.tones, stage)
        : null,
    item.kind === 'gate' ? gateStateAt(item, stage) : null,
  ]);

/** A link's identity, and whether it is drawn the same in both pictures. */
const linkKey = (link: LLink) => `${link.from}>${link.to}`;
const linkLook = (link: LLink, shift: Point) =>
  JSON.stringify([
    link.points.map((p) => [Math.round(p.x + shift.x), Math.round(p.y + shift.y)]),
    link.label?.lines,
    link.dashed,
    link.head,
  ]);
const noteLook = (note: LNote, shift: Point) =>
  JSON.stringify([
    note.target,
    note.texts.map((t) => [t.lines, Math.round(t.x + shift.x), Math.round(t.y + shift.y)]),
  ]);

/** What each part of `after` does as `before` becomes it, and when. */
export function planTransition(before: Picture, after: Picture): Transition {
  const moves = new Map<string, Move>();
  const entering = new Set<string>();
  const kept = new Set<number>();
  const beforeItems = new Map(
    before.items.map((i) => [identity(before.layout.items[i]!), i] as const),
  );
  for (const i of after.items) {
    const item = after.layout.items[i]!;
    const from = beforeItems.get(identity(item));
    // One to one · a mark the picture before had is matched once, a second of the
    // same name (a duplicate, already reported) comes in as a new one.
    if (from === undefined || kept.has(from)) {
      entering.add(cueIds.item(i));
      continue;
    }
    kept.add(from);
    const move = moveOf(before, from, after, i);
    if (move) moves.set(cueIds.item(i), move);
  }
  const leaving = {
    items: before.items.filter((i) => !kept.has(i)),
    links: [] as number[],
    notes: [] as number[],
  };
  const linksOf = (picture: Picture) =>
    picture.links.map((j) => {
      const link = picture.layout.links[j]!;
      return { j, key: linkKey(link), look: linkLook(link, picture.shift) };
    });
  const notesOf = (picture: Picture) =>
    picture.notes.map((k) => {
      const look = noteLook(picture.layout.notes[k]!, picture.shift);
      return { j: k, key: look, look };
    });
  matchByLook(
    linksOf(before),
    linksOf(after),
    (j) => leaving.links.push(j),
    (j) => entering.add(cueIds.link(j)),
  );
  matchByLook(
    notesOf(before),
    notesOf(after),
    (k) => leaving.notes.push(k),
    (k) => entering.add(cueIds.note(k)),
  );
  const cues = transitionCues(after, { moves, entering, leaving });
  return { moves, entering, leaving, cues, issues: crowdIssues(after, moves) };
}

/** How a kept mark changes, or nothing when it stays as it was. */
function moveOf(before: Picture, from: number, after: Picture, to: number): Move | null {
  const old = before.layout.items[from]!;
  const now = after.layout.items[to]!;
  const a = rectOf(old);
  const b = rectOf(now);
  const dx = a.x + before.shift.x - (b.x + after.shift.x);
  const dy = a.y + before.shift.y - (b.y + after.shift.y);
  const sx = b.w > 0 ? a.w / b.w : 1;
  const sy = b.h > 0 ? a.h / b.h : 1;
  const relabel = wordsOf(old, before.stage) !== wordsOf(now, after.stage);
  const restyled = lookOf(old, before.stage) !== lookOf(now, after.stage);
  const moved =
    Math.abs(dx) > STILL ||
    Math.abs(dy) > STILL ||
    Math.abs(a.w - b.w) > STILL ||
    Math.abs(a.h - b.h) > STILL;
  if (!moved && !relabel && !restyled) return null;
  const fill =
    old.kind === 'meter' || old.kind === 'queue' ? atClick(old.fills, before.stage) : undefined;
  return { from, dx, dy, sx, sy, relabel, ...(fill === undefined ? {} : { fill }) };
}

/** Parts kept from one picture to the next when they are drawn the same · the others
 *  leave and come in again, since a line cannot bend from one route to another. */
function matchByLook(
  before: { j: number; key: string; look: string }[],
  after: { j: number; key: string; look: string }[],
  leave: (j: number) => void,
  enter: (j: number) => void,
): void {
  const same = new Set<number>();
  for (const part of after) {
    const twin = before.find((b) => b.key === part.key && b.look === part.look && !same.has(b.j));
    if (twin) same.add(twin.j);
    else enter(part.j);
  }
  for (const part of before) if (!same.has(part.j)) leave(part.j);
}

/** The cues of a change of picture · leave, then move, then come in. */
function transitionCues(
  after: Picture,
  plan: Pick<Transition, 'moves' | 'entering' | 'leaving'>,
): Cue[] {
  const stage = after.stage;
  const leaving: Cue[] = [
    ...plan.leaving.items.map((i) => cueIds.item(i)),
    ...plan.leaving.links.map((j) => cueIds.link(j)),
    ...plan.leaving.notes.map((k) => cueIds.note(k)),
  ].map((id, order) => ({
    id: morphIds.leave(id),
    role: 'exit' as const,
    stage,
    duration: EXIT_SECONDS,
    order,
  }));
  const afterLeaving = leaving.map((c) => ({ id: c.id, edge: 'end' as const }));
  const moving: Cue[] = [...plan.moves.keys()].map((id, order) => ({
    id: morphIds.move(id),
    role: 'morph' as const,
    stage,
    duration: MORPH_SECONDS,
    order,
    waits: afterLeaving,
  }));
  const afterMoving = moving.length
    ? moving.map((c) => ({ id: c.id, edge: 'end' as const }))
    : afterLeaving;
  const coming: Cue[] = [];
  after.layout.items.forEach((item, i) => {
    if (!plan.entering.has(cueIds.item(i))) return;
    coming.push({
      id: cueIds.item(i),
      role: item.kind === 'frame' ? 'frame' : 'mark',
      stage,
      duration: durationOf(item, itemEnter(item)),
      order: item.y * 10_000 + item.x,
      waits: afterMoving,
    });
  });
  after.layout.links.forEach((link, j) => {
    if (!plan.entering.has(cueIds.link(j))) return;
    coming.push({
      id: cueIds.link(j),
      role: 'link',
      stage,
      duration: ENTER_SECONDS[transitionLinkEnter(link)],
      order: j,
      waits: afterMoving,
    });
  });
  after.layout.notes.forEach((note, k) => {
    if (!plan.entering.has(cueIds.note(k))) return;
    coming.push({
      id: cueIds.note(k),
      role: 'note',
      stage,
      duration: ENTER_SECONDS[noteEnter(note)],
      order: k,
      waits: afterMoving,
    });
  });
  return [...leaving, ...moving, ...coming];
}

/** Too many marks moving at once · a series of cells counts once. */
function crowdIssues(after: Picture, moves: Map<string, Move>): DgIssue[] {
  const moving = new Set<string>();
  after.layout.items.forEach((item, i) => {
    const move = moves.get(cueIds.item(i));
    if (move && (Math.abs(move.dx) > STILL || Math.abs(move.dy) > STILL)) moving.add(item.key);
  });
  if (moving.size <= MORPH_CROWD) return [];
  return [
    {
      code: 'DG_MORPH_CROWD',
      severity: 'warning',
      items: [...moving].slice(0, 8),
      message: `${moving.size} marks move at once on click ${after.stage}, over ${MORPH_CROWD} · the eye follows a few, the rest is a shuffle`,
      fix: {
        action: 'split-motion',
        keep: MORPH_CROWD,
        use: 'a dg-state more, or fewer marks that change place',
      },
    },
  ];
}
