// ════════════════════════════════════════════════════════════════
// RIKIKI · illustration rules, is this drawing clean, framed and balanced?
//
// The rules `rikiki check` applies to ANY illustration on a slide: a scene, a
// diagram, a hand-drawn SVG. They read an "ink model", the drawing as it is
// painted at its last frame (texts, shapes, motion, all in screen pixels), and
// say what is wrong in numbers an author can act on. Pure: no DOM, no browser,
// so every rule is tested on a model written by hand, and the extractor that
// builds a model from a live drawing lives in check.mjs.
//
// Two kinds of finding, kept apart on purpose:
//   - DEFECTS are objective: ink outside its frame, shapes half on top of each
//     other, a drawing that never stops moving. They are errors, and the verdict
//     fails whatever the score says.
//   - BALANCE is judgement with a number: a drawing leaning left, a margin much
//     wider on one side, two edges that almost line up. They are warnings with a
//     threshold, because an asymmetry can be meant, and a linter that refuses
//     every asymmetry is switched off. The score ranks variants · it does not
//     decide, so an agent cannot optimise a number past a defect.
// ════════════════════════════════════════════════════════════════

export interface Box {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export type Rgb = readonly [number, number, number];

/** A text as painted · its box is the ink it lays down, its size is on screen. */
export interface InkText extends Owned {
  text: string;
  box: Box;
  /** Font size on screen, in px. */
  size: number;
  weight: number;
}

/** What a painted thing belongs to, when its drawing says (a diagram does) · what a
 *  finding names, so its fix says which mark and which attribute to change. */
export interface Owned {
  /** Its part · `focal`, `barrier`, `overlay`, `frame`, `link-label`… */
  role?: string;
  /** The mark that drew it, by its name (`data-mark`). */
  mark?: string;
  /** That mark's kind · box, text, lane, gate, group, meter, link… */
  markKind?: string;
  /** For a note, the mark it points at. */
  markFor?: string;
}

/** A shape as painted · `fill` null for none, `accent` when its fill is the
 *  deck's accent (the thing put forward). */
export interface InkShape extends Owned {
  kind: 'rect' | 'circle' | 'path' | 'line';
  box: Box;
  fill: Rgb | null;
  /** The colour it paints and its opacity, a tint included · a surface at a fifth
   *  of its colour weighs nothing (`fill` null) and still tells its role apart. */
  paint?: readonly [number, number, number, number];
  accent: boolean;
  /** Stroke width on screen, in px · ink reaches half of it past the box. */
  stroke: number;
}

export interface InkMotion {
  /** When the last finite animation ends, in ms. */
  endMs: number;
  /** An animation with no end. */
  endless: boolean;
  /** When the first animation with no end starts, in ms · a loop of ambience that
   *  starts once a story has played is not a drawing that never rests. */
  endlessFromMs?: number;
}

/** One beat of a story, as the drawing scripted it. */
export interface InkBeat {
  /** steady, event, spread, effect or proof. */
  phase: string;
  /** The mark that plays it, by its name (`data-mark`). */
  mark: string;
  /** enter, change, swap, proof, dim, ride, lever, flow. */
  kind: string;
  atMs: number;
  /** Whether the resting picture keeps a trace of it. */
  lasting: boolean;
  /** Written by the author (`beat`) · not one the drawing adds after another. */
  declared: boolean;
  /** The mark it is played with, when the author said so (`with`). */
  with?: string;
}

/** A story played on entry (`<deck-diagram play="enter">`, its svg's `data-story`). */
export interface InkStory {
  playedMs: number;
  /** What it may last once played. */
  budgetMs: number;
  /** How long the system runs before the first event, played. */
  steadyMs: number;
  beats: InkBeat[];
}

export interface InkModel {
  /** The drawing's own frame (its viewBox on screen). */
  frame: Box;
  /** The room the drawing was given on the slide. */
  allocated: Box;
  texts: InkText[];
  shapes: InkShape[];
  /** Surfaces painted only as a tint, with no stroke · no weight for the rules, a
   *  paint for the richness (richness.ts). */
  tints?: InkShape[];
  motion: InkMotion;
  /** `balance="free"` declared · an asymmetry is meant and is not judged. */
  balance?: 'free';
  /** How the drawing was placed, when it says (`data-layout` on its svg) · a ring
   *  puts its marks on a circle, where edges and gaps are not to be aligned. */
  layout?: string;
  /** `x` when the drawing's structure sets its labels in a column at the left
   *  (lanes, an axis, a chart in rows) · its weight leans that way by construction,
   *  so the lean across is not judged; its margins and its height still are. */
  lean?: 'x';
  /** A story it plays on entry, as scripted · its motion is judged against its own
   *  budget, and its script against the shape of a story. */
  story?: InkStory;
}

export type IllSeverity = 'error' | 'warning';

/** Every code an illustration rule emits · `rikiki check` lists, selects and
 *  configures them by this table (bin/lib/check-registry.mjs). */
export const ILL_CODES = [
  'ILL_ESCAPE',
  'ILL_OFF_CENTRE',
  'ILL_MARGIN_UNEVEN',
  'ILL_SPARSE',
  'ILL_NEAR_ALIGN',
  'ILL_RHYTHM',
  'ILL_SHAPE_OVERLAP',
  'ILL_TEXT_OVER_SHAPE',
  'ILL_FOCAL_MANY',
  'ILL_FOCAL_WEAK',
  'ILL_TYPE_SCALE',
  'ILL_WORDY',
  'ILL_MOTION_LONG',
  'ILL_MOTION_ENDLESS',
  'ILL_NO_STEADY_STATE',
  'ILL_STORY_NO_PROOF',
  'ILL_FINAL_INCOMPLETE',
  'ILL_BEAT_OVERLAP',
] as const;
export type IllCode = (typeof ILL_CODES)[number];

export interface IllIssue {
  code: IllCode;
  severity: IllSeverity;
  message: string;
  /** What was measured, and against what · the numbers behind the message. */
  measurement: Record<string, number | string | string[]>;
  /** What to do about it, by name, for a reader that does not parse sentences. */
  fix?: { action: string; [detail: string]: unknown };
  /** Which of the six scores it counts against. */
  facet: Facet;
}

export type Facet = 'frame' | 'balance' | 'alignment' | 'hierarchy' | 'density' | 'motion';

/**
 * Every threshold, with where it comes from · in one table so that a reader can
 * argue with a number, and a change of a number shows in one place. Lengths are
 * fractions of the allocated width or height, so a drawing is judged the same at
 * any size; px values are screen pixels and say so.
 */
export const ILL_LIMITS = Object.freeze({
  /** Ink past the frame by more than this is an escape · the stroke antialiasing
   *  of a shape on the frame edge is under it (same value as SVG_TEXT_ESCAPES). */
  escapePx: 2,
  /** The visual centre of mass may sit this far from the centre of the room before
   *  the drawing is said to lean · 8% of the width, 10% of the height. Measured on
   *  the scenes, whose gate and emphasis sit up to 6% off by design. */
  offCentreX: 0.08,
  offCentreY: 0.15,
  /** The lean in height is a share of the drawing's height, but never of less than
   *  this share of its width · a strip as wide as a slide and a sixth as tall (a row
   *  of boxes, a link going round them above) was said to lean 20% for 36px, which
   *  no one sees. 0.375 is the height a diagram plans for its width (600 for 1600). */
  flatReference: 0.375,
  /** Left and right margins of the ink may differ by this share of the width. */
  marginUneven: 0.06,
  /** The ink must fill at least this share of the room to read as a drawing and
   *  not as a few marks in a large space. */
  sparse: 0.4,
  /** Edges of two shapes closer than this but not equal are a failed alignment ·
   *  under 1.5px they are the same edge (one pixel is rounding, and the eye does not
   *  see it), over 6px a deliberate offset. */
  alignMinPx: 1.5,
  alignMaxPx: 6,
  /** Gaps between neighbours vary less than this (coefficient of variation) or the
   *  rhythm reads as irregular · needs three gaps to mean anything. */
  rhythmCv: 0.15,
  /** A gap this many times the median one separates two groups (two panels, a
   *  closing band under a list) and is not part of the rhythm. */
  groupGapRatio: 3,
  /** Shapes overlapping by more than this on both axes, neither holding the other. */
  overlapPx: 2,
  /** One thing put forward · a second separate accent region says there are two. */
  focalMax: 1,
  /** Accent shapes this close are one region (a card made of two rects). */
  touchPx: 4,
  /** The accent region must be at least this much heavier than the next heaviest
   *  region, or nothing is put forward · and a fill in the accent weighs double its
   *  area, since colour puts a card forward at equal size (the scenes do exactly
   *  that), so only an accent that is much SMALLER than its neighbours is weak. */
  focalWeakRatio: 1.2,
  accentBoost: 2,
  /** At most this many font sizes, none within this ratio of the next. */
  typeSizes: 4,
  typeRatioMin: 1.15,
  /** Words on the drawing · a slide is read from the back of the room. Five rows
   *  with a note and a tag each, the scenes' own ceiling, come to about 50; the
   *  hand-drawn slides of a real 86-slide deck run from 70 to 160 words, so a limit
   *  under 90 would flag most of what its author meant. */
  words: 90,
  /** Motion · a drawing that is still moving after 3s is waiting to be understood. */
  motionWarnMs: 3000,
  motionErrorMs: 5000,
  /** A story is a scene, not an entrance · it may last its own budget (10 s unless
   *  it says otherwise), never past 12 s, a quarter second of rounding allowed. The
   *  remedies of the recipes play in 6.5 s, 8 s at most. */
  storyMaxMs: 12000,
  storyToleranceMs: 250,
  /** The system runs this long before it breaks, or the room never saw it run · the
   *  talk lets 28 tokens pass for 3 s before its kill switch. */
  steadyMinMs: 1500,
  /** Two beats of a story start this far apart at least · the talk never puts two
   *  events in the same half second. */
  beatGapMs: 500,
});

/** A threshold of the table, by name · what a deck's `check.limits` may set (`ill.<name>`). */
export type IllLimit = keyof typeof ILL_LIMITS;
export type IllLimits = Readonly<Record<IllLimit, number>>;

/** The thresholds the rules read while one drawing is judged · the table, or the
 *  table with a deck's own values over it (`lintIllustration(model, limits)`). */
let active: IllLimits = ILL_LIMITS;

// ── geometry ──────────────────────────────────────────────────────────────

const width = (b: Box) => b.right - b.left;
const height = (b: Box) => b.bottom - b.top;
const area = (b: Box) => Math.max(0, width(b)) * Math.max(0, height(b));
const centre = (b: Box): [number, number] => [(b.left + b.right) / 2, (b.top + b.bottom) / 2];

function union(boxes: Box[]): Box | null {
  if (!boxes.length) return null;
  return {
    left: Math.min(...boxes.map((b) => b.left)),
    top: Math.min(...boxes.map((b) => b.top)),
    right: Math.max(...boxes.map((b) => b.right)),
    bottom: Math.max(...boxes.map((b) => b.bottom)),
  };
}

const overlap = (a: Box, b: Box) => ({
  x: Math.min(a.right, b.right) - Math.max(a.left, b.left),
  y: Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top),
});

const contains = (outer: Box, inner: Box, slack = 1) =>
  inner.left >= outer.left - slack &&
  inner.right <= outer.right + slack &&
  inner.top >= outer.top - slack &&
  inner.bottom <= outer.bottom + slack;

/** The box of a shape with its stroke · ink reaches half the stroke past the geometry. */
function inked(shape: InkShape): Box {
  const half = shape.stroke / 2;
  return {
    left: shape.box.left - half,
    top: shape.box.top - half,
    right: shape.box.right + half,
    bottom: shape.box.bottom + half,
  };
}

/** Every painted thing of the drawing, as boxes. */
function allInk(model: InkModel): Box[] {
  return [...model.texts.map((t) => t.box), ...model.shapes.map(inked)];
}

const round = (n: number, digits = 1) => Math.round(n * 10 ** digits) / 10 ** digits;

// ── the rules ─────────────────────────────────────────────────────────────

type Rule = (model: InkModel) => IllIssue[];

/** DEFECT · ink outside the drawing's own frame, strokes included. Texts have their
 *  own rule (`SVG_TEXT_ESCAPES`, which also knows the card a text is written in),
 *  so this one is for shapes: a bar or a ring that leaves the viewBox is cropped
 *  by the slide, and nothing else says so. */
const shapeEscape: Rule = (model) => {
  const past = model.shapes
    .map((shape) => {
      const box = inked(shape);
      return Math.max(
        0,
        model.frame.left - box.left,
        box.right - model.frame.right,
        model.frame.top - box.top,
        box.bottom - model.frame.bottom,
      );
    })
    .filter((px) => px > active.escapePx);
  if (!past.length) return [];
  return [
    {
      code: 'ILL_ESCAPE',
      severity: 'error',
      facet: 'frame',
      message: `${past.length} shape${past.length === 1 ? '' : 's'} run${past.length === 1 ? 's' : ''} past the drawing's frame, by up to ${round(Math.max(...past))}px · the slide crops what leaves it`,
      measurement: {
        shapes: past.length,
        maxPx: round(Math.max(...past)),
        limitPx: active.escapePx,
      },
      fix: { action: 'move-inside', where: 'frame', needsPx: round(Math.max(...past)) },
    },
  ];
};

/** The ink a shape lays down · a filled shape its area, an outlined card or cell
 *  its edge (a crowd of hollow cells weighs where it stands), a line nothing. */
function weightOf(shape: InkShape): number {
  if (shape.fill !== null) return area(shape.box);
  if (shape.kind !== 'rect' && shape.kind !== 'circle') return 0;
  return 2 * (width(shape.box) + height(shape.box)) * shape.stroke;
}

/** A painted thing and the weight it pulls with · what it belongs to, to name it. */
interface Weighed {
  box: Box;
  weight: number;
  owner: Owned;
}

/** Every painted thing of the drawing with its weight · a fill in the accent weighs
 *  half as much again, a text by its box. */
function weighedParts(model: InkModel): Weighed[] {
  return [
    ...model.shapes.map((s) => ({
      box: s.box,
      weight: weightOf(s) * (s.accent ? 1.5 : 1),
      owner: s,
    })),
    ...model.texts.map((t) => ({ box: t.box, weight: area(t.box), owner: t })),
  ].filter((p) => p.weight > 0);
}

type Axis = 'x' | 'y';

/** The length a lean is a share of · the room's width across, its height (or, for a
 *  flat drawing, a share of its width) in height. */
const spanOf = (model: InkModel, axis: Axis): number =>
  axis === 'x'
    ? width(model.allocated)
    : Math.max(height(model.allocated), width(model.allocated) * active.flatReference);

/** How far a share of the room the weight of `parts` sits from the room's middle. */
function leanOf(model: InkModel, parts: Weighed[]): { x: number; y: number } {
  const total = parts.reduce((sum, p) => sum + p.weight, 0);
  if (!total) return { x: 0, y: 0 };
  const [mx, my] = centre(model.allocated);
  let x = 0;
  let y = 0;
  for (const p of parts) {
    const [cx, cy] = centre(p.box);
    x += ((cx - mx) * p.weight) / total;
    y += ((cy - my) * p.weight) / total;
  }
  return { x: x / spanOf(model, 'x'), y: y / spanOf(model, 'y') };
}

const limitOf = (axis: Axis): number => (axis === 'x' ? active.offCentreX : active.offCentreY);

/** A box moved to the other side of `about` along an axis · a note that changes side. */
function mirrored(box: Box, about: Box, axis: Axis): Box {
  const [cx, cy] = centre(about);
  if (axis === 'x') return { ...box, left: 2 * cx - box.right, right: 2 * cx - box.left };
  return { ...box, top: 2 * cy - box.bottom, bottom: 2 * cy - box.top };
}

/** Which marks pull the weight toward the side it leans to, and by what share of
 *  the lean · then the changes of one attribute that would bring it back under the
 *  limit, each tried on the ink as it is drawn: a note moved to the other side of
 *  its mark, an outlined box on the light side given a surface. Only the changes
 *  that do are returned. */
function rebalance(model: InkModel, axis: Axis): Record<string, unknown> {
  const parts = weighedParts(model);
  const lean = leanOf(model, parts)[axis];
  const total = parts.reduce((sum, p) => sum + p.weight, 0);
  const span = spanOf(model, axis);
  const middle = centre(model.allocated)[axis === 'x' ? 0 : 1];
  const pullOf = new Map<string, { kind?: string; pull: number }>();
  for (const p of parts) {
    if (!p.owner.mark) continue;
    const at = centre(p.box)[axis === 'x' ? 0 : 1];
    const seen = pullOf.get(p.owner.mark) ?? { kind: p.owner.markKind, pull: 0 };
    seen.pull += ((at - middle) * p.weight) / total / span;
    pullOf.set(p.owner.mark, seen);
  }
  const pulls = [...pullOf]
    .filter(([, p]) => Math.sign(p.pull) === Math.sign(lean))
    .sort((a, b) => Math.abs(b[1].pull) - Math.abs(a[1].pull))
    .slice(0, 3)
    .map(([mark, p]) => ({ mark, kind: p.kind, sharePct: round((p.pull / lean) * 100) }));
  const after = (changed: Weighed[]) => round(leanOf(model, changed)[axis] * 100);
  const tries: { mark: string; set: string; leanAfterPct: number }[] = [];
  for (const note of new Set(parts.filter((p) => p.owner.markFor).map((p) => p.owner.mark!))) {
    const own = parts.filter((p) => p.owner.mark === note);
    const target = union(
      parts.filter((p) => p.owner.mark === own[0]!.owner.markFor).map((p) => p.box),
    );
    if (!target) continue;
    const [nx, ny] = centre(union(own.map((p) => p.box))!);
    const [tx, ty] = centre(target);
    const before = axis === 'x' ? nx - tx : ny - ty;
    if (Math.abs(before) < 1) continue;
    const side = axis === 'x' ? (before < 0 ? 'right' : 'left') : before < 0 ? 'bottom' : 'top';
    const moved = parts.map((p) =>
      p.owner.mark === note ? { ...p, box: mirrored(p.box, target, axis) } : p,
    );
    tries.push({ mark: note, set: `side="${side}"`, leanAfterPct: after(moved) });
  }
  // An outline weighs its edge, a surface its area · the light side gains weight.
  for (const shape of model.shapes) {
    if (shape.fill !== null || shape.kind !== 'rect' || shape.markKind !== 'box' || !shape.mark)
      continue;
    const at = centre(shape.box)[axis === 'x' ? 0 : 1];
    if (Math.sign(at - middle) === Math.sign(lean)) continue;
    const filled = parts.map((p) => (p.owner === shape ? { ...p, weight: area(shape.box) } : p));
    tries.push({ mark: shape.mark, set: 'paint="soft"', leanAfterPct: after(filled) });
  }
  const passing = tries
    .filter((t) => Math.abs(t.leanAfterPct) <= limitOf(axis) * 100)
    .sort((a, b) => Math.abs(a.leanAfterPct) - Math.abs(b.leanAfterPct))
    .slice(0, 3);
  return { pulls, try: passing };
}

/** BALANCE · where the weight of the drawing sits against the middle of its room.
 *  Weight is ink, and a text counts by its box: what is big and dark pulls the
 *  eye. A drawing may be meant to lean (`balance="free"`) and is then not judged;
 *  one whose structure sets its labels at the left (`lean="x"`) is judged in height
 *  only. A stroke weighs nothing: measured on the galleries, counting tracks and
 *  links by their length moves the lean by a tenth of a point at most, so the lean
 *  of lanes is their label column, not their weightless tracks. */
const offCentre: Rule = (model) => {
  if (model.balance === 'free') return [];
  const lean = leanOf(model, weighedParts(model));
  const dx = model.lean === 'x' ? 0 : lean.x;
  const dy = lean.y;
  const leaning = Math.abs(dx) > active.offCentreX || Math.abs(dy) > active.offCentreY;
  if (!leaning) return [];
  const axis: Axis =
    Math.abs(dx) / active.offCentreX >= Math.abs(dy) / active.offCentreY ? 'x' : 'y';
  const side = axis === 'x' ? (dx < 0 ? 'left' : 'right') : dy < 0 ? 'top' : 'bottom';
  return [
    {
      code: 'ILL_OFF_CENTRE',
      severity: 'warning',
      facet: 'balance',
      message: `the drawing's weight sits ${round(Math.abs(axis === 'x' ? dx : dy) * 100)}% of the room toward the ${side} · it leans`,
      measurement: {
        dxPct: round(lean.x * 100),
        dyPct: round(dy * 100),
        limitXPct: active.offCentreX * 100,
        limitYPct: active.offCentreY * 100,
      },
      fix: {
        action: 'centre',
        toward:
          side === 'left' ? 'right' : side === 'right' ? 'left' : side === 'top' ? 'bottom' : 'top',
        ...rebalance(model, axis),
        or: 'balance="free" if it is meant',
      },
    },
  ];
};

/** BALANCE · the ink is centred in its room if its left and right margins match. */
const marginUneven: Rule = (model) => {
  if (model.balance === 'free') return [];
  const ink = union(allInk(model));
  if (!ink) return [];
  const left = ink.left - model.allocated.left;
  const right = model.allocated.right - ink.right;
  const gap = Math.abs(left - right) / width(model.allocated);
  if (gap <= active.marginUneven) return [];
  return [
    {
      code: 'ILL_MARGIN_UNEVEN',
      severity: 'warning',
      facet: 'balance',
      message: `the left margin is ${round(left)}px and the right ${round(right)}px · ${round(gap * 100)}% of the width apart`,
      measurement: {
        leftPx: round(left),
        rightPx: round(right),
        gapPct: round(gap * 100),
        limitPct: active.marginUneven * 100,
      },
      fix: { action: 'centre', shiftPx: round((right - left) / 2) },
    },
  ];
};

/** Where the room is empty, and what to change on a diagram (whose marks are named)
 *  to fill it · the drawing grows to fill its room, up to a ceiling, so what fills it
 *  more is spacing (`gap="airy"`) and the thing put forward drawn larger, which the
 *  ink cannot try: they are proposed, not measured. */
function densify(model: InkModel, ink: Box): Record<string, unknown> {
  const room = model.allocated;
  const emptyPct = {
    left: round(((ink.left - room.left) / width(room)) * 100),
    right: round(((room.right - ink.right) / width(room)) * 100),
    top: round(((ink.top - room.top) / height(room)) * 100),
    bottom: round(((room.bottom - ink.bottom) / height(room)) * 100),
  };
  const named = [...model.shapes, ...model.texts].some((p) => p.mark);
  if (!named) return { emptyPct };
  const focal = model.shapes.find((s) => s.role === 'focal' && s.mark && s.markKind === 'box');
  return {
    emptyPct,
    try: [
      { on: 'deck-diagram', set: 'gap="airy"', simulated: false },
      ...(focal ? [{ mark: focal.mark, set: 'size="large"', simulated: false }] : []),
    ],
  };
}

/** DENSITY · a few marks in a large room read as unfinished. */
const sparse: Rule = (model) => {
  const ink = union(allInk(model));
  if (!ink) return [];
  const share = area(ink) / area(model.allocated);
  if (share >= active.sparse) return [];
  return [
    {
      code: 'ILL_SPARSE',
      severity: 'warning',
      facet: 'density',
      message: `the drawing fills ${round(share * 100)}% of its room, under ${active.sparse * 100}% · a few marks in a large space`,
      measurement: { sharePct: round(share * 100), limitPct: active.sparse * 100 },
      fix: {
        action: 'enlarge-or-simplify',
        options: ['fewer words around it', 'a larger scene', 'a composition with a second scene'],
        ...densify(model, ink),
      },
    },
  ];
};

/** The box edges of the shapes big enough to be a card or a bar, not a dot or a rule. */
function structuralShapes(model: InkModel): InkShape[] {
  const floor = area(model.allocated) * 0.004;
  return model.shapes.filter(
    (s) => s.kind === 'rect' && s.role !== 'overlay' && area(s.box) >= floor,
  );
}

type Edge = 'left' | 'right' | 'top' | 'bottom';

/** The middle of a shape across an edge · its centre x for a left or a right edge,
 *  its centre y for a top or a bottom one. */
const middleAcross = (shape: InkShape, edge: Edge): number =>
  edge === 'left' || edge === 'right'
    ? (shape.box.left + shape.box.right) / 2
    : (shape.box.top + shape.box.bottom) / 2;

/** Two edges that miss each other, and the shapes they belong to. */
interface Miss {
  edge: Edge;
  delta: number;
  at: number;
  shapes: [InkShape, InkShape];
}

/** The pairs of edges that miss each other by a slip. */
function nearMisses(shapes: InkShape[]): Miss[] {
  const found: Miss[] = [];
  for (const edge of ['left', 'right', 'top', 'bottom'] as const) {
    const sorted = [...shapes].sort((a, b) => a.box[edge] - b.box[edge]);
    for (let i = 1; i < sorted.length; i += 1) {
      const [before, here] = [sorted[i - 1]!, sorted[i]!];
      const delta = here.box[edge] - before.box[edge];
      const centred =
        Math.abs(middleAcross(here, edge) - middleAcross(before, edge)) <= active.alignMinPx;
      if (delta > active.alignMinPx && delta <= active.alignMaxPx && !centred)
        found.push({ edge, delta, at: before.box[edge], shapes: [before, here] });
    }
  }
  return found;
}

/** Which two marks miss, why, and what lines them up · two boxes of one line whose
 *  heights differ by a note or a tag miss at the top or the bottom; stretched to the
 *  taller, they meet, which is tried on the ink. */
function alignFix(model: InkModel, worst: Miss, pairs: number): Record<string, unknown> {
  const [a, b] = worst.shapes;
  const across = worst.edge === 'top' || worst.edge === 'bottom' ? height : width;
  const sizes = Math.abs(across(a.box) - across(b.box));
  const cause = sizes > active.alignMinPx ? (across === height ? 'heights' : 'widths') : 'offset';
  const marks = [a.mark, b.mark].filter((m): m is string => !!m);
  if (cause === 'offset') return { marks, cause };
  // Both stretched to the larger along the edge that misses · the pair is aligned.
  const grown = { ...b.box, [worst.edge]: a.box[worst.edge] } as Box;
  const shapes = model.shapes.map((s) => (s === b ? { ...s, box: grown } : s));
  const pairsAfter = nearMisses(structuralShapes({ ...model, shapes })).length;
  if (pairsAfter >= pairs) return { marks, cause };
  return {
    marks,
    cause,
    try: [{ set: 'align="stretch"', on: 'the group that holds them', pairsAfter }],
  };
}

/** ALIGNMENT · two edges that are almost, but not quite, the same line. Under
 *  half a pixel they are one edge; past six it is an offset someone chose. Two
 *  shapes centred on one line (a column of boxes of different widths) are aligned
 *  on their middle, by choice · their edges differ by half their difference in size,
 *  which is no slip. */
const nearAlign: Rule = (model) => {
  if (model.layout === 'ring') return [];
  const found = nearMisses(structuralShapes(model));
  if (!found.length) return [];
  const worst = found.reduce((a, b) => (b.delta > a.delta ? b : a));
  return [
    {
      code: 'ILL_NEAR_ALIGN',
      severity: 'warning',
      facet: 'alignment',
      message: `${found.length} pair${found.length === 1 ? '' : 's'} of edges miss each other by ${round(Math.min(...found.map((f) => f.delta)))} to ${round(worst.delta)}px · they read as a slip, not a choice`,
      measurement: {
        pairs: found.length,
        worstPx: round(worst.delta),
        edge: worst.edge,
        minPx: active.alignMinPx,
        maxPx: active.alignMaxPx,
      },
      fix: {
        action: 'align',
        edge: worst.edge,
        to: round(worst.at),
        deltaPx: round(worst.delta),
        ...alignFix(model, worst, found.length),
      },
    },
  ];
};

/** ALIGNMENT · the gaps between neighbours in a row or a column are even. The
 *  neighbours are shapes of the same size class, in reading order along an axis;
 *  three or more gaps are needed for "even" to mean anything. */
const rhythm: Rule = (model) => {
  if (model.layout === 'ring') return [];
  const shapes = structuralShapes(model);
  const issues: IllIssue[] = [];
  for (const axis of ['x', 'y'] as const) {
    const [start, end, cross] =
      axis === 'x' ? (['left', 'right', 'top'] as const) : (['top', 'bottom', 'left'] as const);
    // Shapes sharing a line along the other axis (within a quarter of their size).
    const lines = new Map<number, InkShape[]>();
    for (const shape of shapes) {
      const key = Math.round(
        shape.box[cross] / Math.max(8, (axis === 'x' ? height(shape.box) : width(shape.box)) / 4),
      );
      lines.set(key, [...(lines.get(key) ?? []), shape]);
    }
    for (const line of lines.values()) {
      if (line.length < 4) continue;
      const ordered = [...line].sort((a, b) => a.box[start] - b.box[start]);
      const gaps = ordered
        .slice(1)
        .map((shape, i) => shape.box[start] - ordered[i]!.box[end])
        .filter((g) => g > 0);
      if (gaps.length < 3) continue;
      // A gap much wider than the rest separates two groups (two panels side by
      // side, a closing band under a list) · the rhythm is judged inside each, and
      // a lone wider gap at an end is a separation the author chose, not a slip.
      const median = [...gaps].sort((a, b) => a - b)[Math.floor(gaps.length / 2)]!;
      const inner = gaps.filter((g) => g <= median * active.groupGapRatio);
      if (inner.length < 3) continue;
      const mean = inner.reduce((a, b) => a + b, 0) / inner.length;
      const spread = Math.sqrt(inner.reduce((sum, g) => sum + (g - mean) ** 2, 0) / inner.length);
      const cv = mean > 0 ? spread / mean : 0;
      if (cv > active.rhythmCv) {
        issues.push({
          code: 'ILL_RHYTHM',
          severity: 'warning',
          facet: 'alignment',
          message: `${ordered.length} neighbours in a ${axis === 'x' ? 'row' : 'column'} are spaced unevenly (gaps ${round(Math.min(...inner))} to ${round(Math.max(...inner))}px) · the rhythm breaks`,
          measurement: {
            neighbours: ordered.length,
            gapMinPx: round(Math.min(...inner)),
            gapMaxPx: round(Math.max(...inner)),
            cv: round(cv, 2),
            limitCv: active.rhythmCv,
          },
          fix: { action: 'even-gaps', axis, toPx: round(mean) },
        });
        break;
      }
    }
    if (issues.length) break;
  }
  return issues;
};

/** DEFECT · two shapes half on top of each other. One inside the other is a card
 *  holding a bar, and is fine; so is a shape declared `overlay` or `barrier`. */
const shapeOverlap: Rule = (model) => {
  const shapes = model.shapes.filter(
    (s) =>
      (s.kind === 'rect' || s.kind === 'circle') && s.role !== 'overlay' && s.role !== 'barrier',
  );
  const pairs: number[] = [];
  for (let i = 0; i < shapes.length; i += 1) {
    for (let j = i + 1; j < shapes.length; j += 1) {
      const a = shapes[i]!.box;
      const b = shapes[j]!.box;
      const o = overlap(a, b);
      if (o.x <= active.overlapPx || o.y <= active.overlapPx) continue;
      if (contains(a, b) || contains(b, a)) continue;
      pairs.push(Math.min(o.x, o.y));
    }
  }
  if (!pairs.length) return [];
  return [
    {
      code: 'ILL_SHAPE_OVERLAP',
      severity: 'error',
      facet: 'frame',
      message: `${pairs.length} pair${pairs.length === 1 ? '' : 's'} of shapes overlap without one holding the other, by up to ${round(Math.max(...pairs))}px`,
      measurement: {
        pairs: pairs.length,
        maxPx: round(Math.max(...pairs)),
        limitPx: active.overlapPx,
      },
      fix: {
        action: 'separate',
        minGapPx: round(Math.max(...pairs)),
        or: 'role="overlay" if it is meant',
      },
    },
  ];
};

/** The parts that are grounds, not marks · a label may sit on a group's surface. */
const GROUNDS: ReadonlySet<string> = new Set(['frame', 'overlay', 'link-label']);

/** DEFECT · a link's label set on a mark that is not its own. A label is set beside
 *  its line; one that lands on a box reads as that box's words, or is hidden by it.
 *  Read where the drawing names its labels (`role="link-label"`, a diagram). */
const textOverShape: Rule = (model) => {
  const shapes = model.shapes.filter(
    (s) => (s.kind === 'rect' || s.kind === 'circle') && !GROUNDS.has(s.role ?? ''),
  );
  const found = model.texts
    .filter((t) => t.role === 'link-label')
    .flatMap((t) =>
      shapes
        .filter((s) => s.mark !== t.mark)
        .map((s) => ({ text: t, shape: s, o: overlap(t.box, inked(s)) }))
        .filter(({ o }) => o.x > active.overlapPx && o.y > active.overlapPx),
    );
  if (!found.length) return [];
  const worst = found.reduce((a, b) => (Math.min(b.o.x, b.o.y) > Math.min(a.o.x, a.o.y) ? b : a));
  const on = [...new Set(found.map((f) => f.shape.mark).filter((m): m is string => !!m))];
  return [
    {
      code: 'ILL_TEXT_OVER_SHAPE',
      severity: 'error',
      facet: 'frame',
      message: `the label "${worst.text.text}" of a link sits on ${on.length ? on.map((m) => `"${m}"`).join(', ') : 'a mark'}, by up to ${round(Math.min(worst.o.x, worst.o.y))}px · it reads as that mark's words`,
      measurement: {
        labels: [...new Set(found.map((f) => f.text.text))],
        on,
        maxPx: round(Math.min(worst.o.x, worst.o.y)),
        limitPx: active.overlapPx,
      },
      fix: {
        action: 'move-label',
        ...(worst.text.mark ? { link: worst.text.mark } : {}),
        options: ['a shorter label', 'gap="airy" on the group that holds its ends'],
      },
    },
  ];
};

/** Accent shapes that touch or nearly touch are one region (a row of lit cells is
 *  one focal, not forty) · found by a flood over the shapes, nearer than their size. */
function accentRegions(shapes: InkShape[]): InkShape[][] {
  // A disc that says the state of a mark (`role="state"`) is a colour of state, not
  // a thing put forward · a control drawn in gold is not the focal.
  const accent = shapes.filter((s) => s.accent && s.fill !== null && s.role !== 'state');
  const regions: InkShape[][] = [];
  const seen = new Set<number>();
  accent.forEach((_, index) => {
    if (seen.has(index)) return;
    const region: InkShape[] = [];
    const queue = [index];
    seen.add(index);
    while (queue.length) {
      const current = accent[queue.pop() as number]!;
      region.push(current);
      accent.forEach((other, k) => {
        if (seen.has(k)) return;
        // Touching shapes are one region · a card made of two rects. Neighbours with
        // a gap between them are not: two cards side by side are two things put
        // forward, and a run of equal marks (lit cells) is a series, merged below.
        const reach = active.touchPx;
        const o = overlap(
          {
            left: current.box.left - reach,
            top: current.box.top - reach,
            right: current.box.right + reach,
            bottom: current.box.bottom + reach,
          },
          other.box,
        );
        if (o.x >= 0 && o.y >= 0) {
          seen.add(k);
          queue.push(k);
        }
      });
    }
    regions.push(region);
  });
  return mergeBarriers(mergeSeries(regions, accent));
}

/** Gates are one thing put forward however many stand · a filter in layers, a cut
 *  on one lane and not the next: the barrier is the point, and its gates are its
 *  parts (`role="barrier"`). */
function mergeBarriers(regions: InkShape[][]): InkShape[][] {
  const isBarrier = (region: InkShape[]) => region.every((s) => s.role === 'barrier');
  const barriers = regions.filter(isBarrier);
  if (barriers.length < 2) return regions;
  return [...regions.filter((region) => !isBarrier(region)), barriers.flat()];
}

/** A mark repeated at the same size (three or more) is a series · the status dots
 *  of a matrix, the lit cells of two grids · and a series is one thing put forward
 *  however far apart its members sit. */
function mergeSeries(regions: InkShape[][], accent: InkShape[]): InkShape[][] {
  const key = (s: InkShape) => `${Math.round(width(s.box) / 2)}x${Math.round(height(s.box) / 2)}`;
  const counts = new Map<string, number>();
  for (const s of accent) counts.set(key(s), (counts.get(key(s)) ?? 0) + 1);
  const isSeries = (region: InkShape[]) => region.every((s) => (counts.get(key(s)) ?? 0) >= 3);
  const series = regions.filter(isSeries);
  if (series.length < 2) return regions;
  return [...regions.filter((region) => !isSeries(region)), series.flat()];
}

/** The marks each accent region belongs to, when the drawing names them. */
function markedRegions(regions: InkShape[][]): { marks?: string[][] } {
  const marks = regions.map((region) => [
    ...new Set(region.map((s) => s.mark).filter((m): m is string => !!m)),
  ]);
  return marks.some((m) => m.length) ? { marks } : {};
}

/** HIERARCHY · one thing is put forward. Regions of the accent colour that do not
 *  touch are separate things being put forward, which is none. */
const focalMany: Rule = (model) => {
  const regions = accentRegions(model.shapes);
  if (regions.length <= active.focalMax) return [];
  return [
    {
      code: 'ILL_FOCAL_MANY',
      severity: 'warning',
      facet: 'hierarchy',
      message: `${regions.length} separate regions are drawn in the accent · the drawing puts one thing forward, and ${regions.length} are none`,
      measurement: { regions: regions.length, limit: active.focalMax },
      fix: {
        action: 'one-emphasis',
        keep: 'the item the title argues for',
        ...markedRegions(regions),
      },
    },
  ];
};

/** HIERARCHY · the accent must weigh more than what is next to it, or it puts nothing forward. */
/** Marks that take a `paint` · a rival of one of these steps back as an outline. */
const PAINTED_KINDS: ReadonlySet<string> = new Set(['box', 'group', 'panel']);

const focalWeak: Rule = (model) => {
  const regions = accentRegions(model.shapes);
  if (regions.length !== 1) return [];
  const region = regions[0]!;
  // A gate is a bar across lanes · it is put forward by its colour and by how far it
  // reaches across them, not by its area, and any card beside it is larger.
  if (region.every((s) => s.role === 'barrier')) return [];
  const focal = region.reduce((sum, s) => sum + area(s.box), 0) * active.accentBoost;
  // The surface the accent sits in is its ground, not a rival · the track of a gauge
  // that fills in the accent, the frame round the mark put forward.
  const holdsFocal = (s: InkShape) => region.some((f) => contains(s.box, f.box));
  // A panel of a composition is the ground of a sub-picture, not a mark that competes ·
  // the panel beside the one that holds the accent is as large by construction.
  const rivals = model.shapes
    .filter(
      (s) =>
        !s.accent &&
        s.fill !== null &&
        s.kind === 'rect' &&
        !holdsFocal(s) &&
        s.markKind !== 'panel',
    )
    .sort((a, b) => area(b.box) - area(a.box));
  const next = rivals.length ? area(rivals[0]!.box) : 0;
  if (!next || focal / next >= active.focalWeakRatio) return [];
  return [
    {
      code: 'ILL_FOCAL_WEAK',
      severity: 'warning',
      facet: 'hierarchy',
      message: `the accent region is ${round(focal / next, 2)} times the next shape, under ${active.focalWeakRatio} · it barely stands out`,
      measurement: { ratio: round(focal / next, 2), limit: active.focalWeakRatio },
      fix: {
        action: 'strengthen-focal',
        options: ['larger size', 'quieter neighbours'],
        ...strengthen(region, rivals, focal),
      },
    },
  ];
};

/** Which mark is put forward, which one outweighs it, how much larger the accent
 *  must be · and the rivals that, drawn as an outline, would no longer outweigh it,
 *  each tried: an outline has no surface, so it is no rival. */
function strengthen(
  region: InkShape[],
  rivals: InkShape[],
  focal: number,
): Record<string, unknown> {
  const focalMark = region.find((s) => s.mark)?.mark;
  const rival = rivals[0]!;
  const need = round((active.focalWeakRatio * area(rival.box)) / focal, 2);
  const tries: Record<string, unknown>[] = [];
  if (rival.mark && PAINTED_KINDS.has(rival.markKind ?? '')) {
    const rest = rivals.filter((r) => r.mark !== rival.mark);
    const ratioAfter = rest.length ? round(focal / area(rest[0]!.box), 2) : null;
    if (ratioAfter === null || ratioAfter >= active.focalWeakRatio)
      tries.push({ mark: rival.mark, set: 'paint="outline"', ratioAfter });
  }
  const focalBox = region.find((s) => s.markKind === 'box');
  if (focalBox?.mark) tries.push({ mark: focalBox.mark, set: 'size="large"', simulated: false });
  return {
    ...(focalMark ? { focal: focalMark } : {}),
    ...(rival.mark ? { rival: rival.mark } : {}),
    need,
    try: tries,
  };
}

/** HIERARCHY · a few font sizes, clearly different · four at most, and two sizes
 *  within 15% of each other are one size written twice. */
const typeScale: Rule = (model) => {
  const sizes = [...new Set(model.texts.map((t) => Math.round(t.size)))].sort((a, b) => a - b);
  const issues: IllIssue[] = [];
  if (sizes.length > active.typeSizes) {
    issues.push({
      code: 'ILL_TYPE_SCALE',
      severity: 'warning',
      facet: 'hierarchy',
      message: `${sizes.length} font sizes (${sizes.join(', ')}px) · more than ${active.typeSizes} stops reading as a hierarchy`,
      measurement: { sizes: sizes.map(String), limit: active.typeSizes },
      fix: { action: 'fewer-sizes', keep: active.typeSizes },
    });
  }
  // Two sizes close to each other are one size written twice · unless they differ
  // in weight (a regular note beside a semibold tag are two voices, not one), so
  // the pairs are looked for within a weight class.
  const classes = new Map<number, number[]>();
  for (const t of model.texts) {
    const weightClass = Math.round(t.weight / 200);
    classes.set(weightClass, [
      ...new Set([...(classes.get(weightClass) ?? []), Math.round(t.size)]),
    ]);
  }
  const close = [...classes.values()].flatMap((list) => {
    const sorted = [...list].sort((a, b) => a - b);
    return sorted.slice(1).filter((s, i) => s / sorted[i]! < active.typeRatioMin);
  });
  if (close.length) {
    issues.push({
      code: 'ILL_TYPE_SCALE',
      severity: 'warning',
      facet: 'hierarchy',
      message: `${close.length} pair${close.length === 1 ? '' : 's'} of font sizes within ${Math.round((active.typeRatioMin - 1) * 100)}% of each other (${sizes.join(', ')}px) · too close to be a hierarchy`,
      measurement: { sizes: sizes.map(String), minRatio: active.typeRatioMin },
      fix: { action: 'merge-sizes', toPx: Math.max(...close) },
    });
  }
  return issues;
};

/** DENSITY · words on the drawing. */
const wordy: Rule = (model) => {
  const words = model.texts.reduce(
    (sum, t) => sum + t.text.trim().split(/\s+/).filter(Boolean).length,
    0,
  );
  if (words <= active.words) return [];
  return [
    {
      code: 'ILL_WORDY',
      severity: 'warning',
      facet: 'density',
      message: `${words} words on the drawing, over ${active.words} · a drawing is read from the back of the room, and a paragraph is not`,
      measurement: { words, limit: active.words },
      fix: { action: 'cut-words', to: active.words },
    },
  ];
};

/** MOTION · a bounded entrance that rests at the end · or a story, a scene played on
 *  entry, bounded by its own budget, whose loops of ambience may start once it ends. */
const motion: Rule = (model) => {
  const issues: IllIssue[] = [];
  const story = model.story;
  const ambience =
    !!story &&
    model.motion.endlessFromMs !== undefined &&
    model.motion.endlessFromMs >= story.playedMs - active.storyToleranceMs;
  if (model.motion.endless && !ambience) {
    issues.push({
      code: 'ILL_MOTION_ENDLESS',
      severity: 'error',
      facet: 'motion',
      message: story
        ? `an animation never ends and starts at ${round((model.motion.endlessFromMs ?? 0) / 1000)}s, before the story ends at ${round(story.playedMs / 1000)}s · a loop of ambience starts once the story has played`
        : 'an animation never ends · a slide rests at its final state, and print, PDF and reduced motion have no frame to stop on',
      measurement: {
        endless: 'true',
        ...(story
          ? {
              endlessFromMs: Math.round(model.motion.endlessFromMs ?? 0),
              storyEndMs: story.playedMs,
            }
          : {}),
      },
      fix: story
        ? { action: 'start-after-story', fromMs: story.playedMs }
        : { action: 'finite-animation', iterations: 1 },
    });
  }
  const { endMs } = model.motion;
  const warnMs = story ? story.budgetMs + active.storyToleranceMs : active.motionWarnMs;
  const errorMs = story ? active.storyMaxMs + active.storyToleranceMs : active.motionErrorMs;
  if (endMs > warnMs) {
    issues.push({
      code: 'ILL_MOTION_LONG',
      severity: endMs > errorMs ? 'error' : 'warning',
      facet: 'motion',
      message: story
        ? `the story ends at ${round(endMs / 1000)}s, past its budget of ${story.budgetMs / 1000}s · the room waits on the drawing`
        : `the last animation ends at ${round(endMs / 1000)}s · the room waits on the drawing past ${active.motionWarnMs / 1000}s`,
      measurement: {
        endMs: Math.round(endMs),
        warnMs: story ? story.budgetMs : active.motionWarnMs,
        errorMs: story ? active.storyMaxMs : active.motionErrorMs,
      },
      fix: story
        ? { action: 'shorten-story', toMs: story.budgetMs, use: 'fewer beats or a shorter steady' }
        : { action: 'shorten-motion', toMs: active.motionWarnMs },
    });
  }
  return issues;
};

/** The beats of a story after its established flow · what happens to the system. */
const BREAKS: ReadonlySet<string> = new Set(['event', 'spread', 'effect', 'proof']);

/** STORY · the system runs before it breaks. An event the room did not see coming
 *  from a working system is a picture of a broken one, not a story of how it broke. */
const noSteadyState: Rule = (model) => {
  const story = model.story;
  const event = story?.beats.find((b) => b.phase === 'event');
  if (!story || !event || story.steadyMs >= active.steadyMinMs) return [];
  return [
    {
      code: 'ILL_NO_STEADY_STATE',
      severity: 'warning',
      facet: 'motion',
      message: `"${event.mark}" breaks the system ${round(story.steadyMs / 1000)}s into its established flow, under the ${active.steadyMinMs / 1000}s the room needs to see it run first`,
      measurement: { steadyMs: story.steadyMs, minMs: active.steadyMinMs, event: event.mark },
      fix: {
        action: 'add-steady',
        use: 'steady="3s" on a dg-lane or a dg-link, or beat="steady" on what the system does normally',
      },
    },
  ];
};

/** STORY · a break has a consequence, proven in the target, last. */
const storyNoProof: Rule = (model) => {
  const story = model.story;
  const events = story?.beats.filter((b) => b.phase === 'event') ?? [];
  if (!story || !events.length) return [];
  const lastEvent = Math.max(...events.map((b) => b.atMs));
  const proofs = story.beats.filter((b) => b.phase === 'proof');
  const after = proofs.filter((b) => b.lasting && b.atMs >= lastEvent);
  if (after.length) return [];
  const effects = story.beats.filter((b) => b.phase === 'effect');
  return [
    {
      code: 'ILL_STORY_NO_PROOF',
      severity: 'warning',
      facet: 'motion',
      message: `the story breaks ("${events[0]!.mark}") and ${proofs.length ? 'proves it before the break' : effects.length ? 'shows its effect, but nothing in the target says what it amounts to' : 'shows neither its effect nor a proof'}`,
      measurement: {
        events: events.length,
        effects: effects.length,
        proofs: proofs.length,
        proofsBeforeEvent: proofs.length - after.length,
      },
      fix: {
        action: 'add-proof',
        use: 'proof="…" on the target box, or a dg-text with beat="proof" beside it',
      },
    },
  ];
};

/** DEFECT · the picture at rest tells the story · overview, print and PDF show the
 *  end, so each break, effect and proof keeps a mark in it. A ride is gone once it
 *  arrives: a beat told by tokens alone leaves nothing. */
const finalIncomplete: Rule = (model) => {
  const story = model.story;
  if (!story) return [];
  const inked = new Set(
    [...model.texts, ...model.shapes].map((part) => part.mark).filter((m): m is string => !!m),
  );
  const lost: { phase: string; marks: string[] }[] = [];
  // A camera that pulls back to the whole picture leaves that picture · it is the
  // picture at rest, and draws no mark of its own.
  const kept = (b: InkBeat) => b.lasting && (inked.has(b.mark) || b.kind === 'camera');
  for (const phase of ['event', 'effect', 'proof']) {
    const here = story.beats.filter((b) => b.phase === phase && b.declared);
    if (!here.length) continue;
    if (!here.some(kept)) lost.push({ phase, marks: here.map((b) => b.mark) });
  }
  if (!lost.length) return [];
  return [
    {
      code: 'ILL_FINAL_INCOMPLETE',
      severity: 'error',
      facet: 'motion',
      message: `the picture at rest loses the ${lost.map((l) => `${l.phase} (${l.marks.map((m) => `"${m}"`).join(', ')})`).join(' and the ')} · once played, nothing of it is left, and print, PDF and the overview show that end`,
      measurement: {
        phases: lost.map((l) => l.phase),
        marks: [...new Set(lost.flatMap((l) => l.marks))],
      },
      fix: {
        action: 'make-it-last',
        use: 'a swap, a tone, a gate that stays closed, a proof or a note on that beat',
      },
    },
  ];
};

/** STORY · one thing at a time · two beats that start within half a second are two
 *  things at once, and the room sees neither. Beats meant as one say `with`. */
const beatOverlap: Rule = (model) => {
  const beats = (model.story?.beats ?? []).filter((b) => b.declared && BREAKS.has(b.phase));
  const together = (a: InkBeat, b: InkBeat) =>
    a.with === b.mark || b.with === a.mark || (!!a.with && a.with === b.with);
  const pairs: { a: InkBeat; b: InkBeat; gap: number }[] = [];
  for (let i = 0; i < beats.length; i += 1)
    for (let j = i + 1; j < beats.length; j += 1) {
      const [a, b] = [beats[i]!, beats[j]!];
      const gap = Math.abs(a.atMs - b.atMs);
      if (a.mark !== b.mark && gap < active.beatGapMs && !together(a, b)) pairs.push({ a, b, gap });
    }
  if (!pairs.length) return [];
  const worst = pairs.reduce((x, y) => (y.gap < x.gap ? y : x));
  return [
    {
      code: 'ILL_BEAT_OVERLAP',
      severity: 'warning',
      facet: 'motion',
      message: `${pairs.length} pair${pairs.length === 1 ? '' : 's'} of beats start under ${active.beatGapMs}ms apart ("${worst.a.mark}" and "${worst.b.mark}", ${worst.gap}ms) · two things at once, the room sees neither`,
      measurement: {
        pairs: pairs.length,
        minGapMs: worst.gap,
        limitMs: active.beatGapMs,
        marks: [worst.a.mark, worst.b.mark],
      },
      fix: {
        action: 'one-beat-at-a-time',
        use: `after="${worst.a.mark}" on "${worst.b.mark}", or with="${worst.a.mark}" if they are one beat`,
        or: 'fewer beats, or a larger budget',
      },
    },
  ];
};

const RULES: readonly Rule[] = [
  shapeEscape,
  shapeOverlap,
  textOverShape,
  offCentre,
  marginUneven,
  sparse,
  nearAlign,
  rhythm,
  focalMany,
  focalWeak,
  typeScale,
  wordy,
  motion,
  noSteadyState,
  storyNoProof,
  finalIncomplete,
  beatOverlap,
];

// ── the verdict ───────────────────────────────────────────────────────────

/** How much a warning of each facet takes off · plus a cap per rule so that
 *  fifty near-aligned pairs do not read as fifty defects. */
const WEIGHT: Readonly<Record<IllCode, number>> = Object.freeze({
  ILL_ESCAPE: 15,
  ILL_SHAPE_OVERLAP: 15,
  ILL_TEXT_OVER_SHAPE: 15,
  ILL_MOTION_ENDLESS: 15,
  ILL_MOTION_LONG: 6,
  ILL_FINAL_INCOMPLETE: 15,
  ILL_NO_STEADY_STATE: 6,
  ILL_STORY_NO_PROOF: 6,
  ILL_BEAT_OVERLAP: 4,
  ILL_OFF_CENTRE: 8,
  ILL_MARGIN_UNEVEN: 6,
  ILL_SPARSE: 6,
  ILL_NEAR_ALIGN: 4,
  ILL_RHYTHM: 4,
  ILL_FOCAL_MANY: 8,
  ILL_FOCAL_WEAK: 4,
  ILL_TYPE_SCALE: 4,
  ILL_WORDY: 4,
});

export interface IllVerdict {
  /** 0 to 100 · ranks variants, never overrules a defect. */
  score: number;
  /** `fail` if any defect, else by the score: 85 ships, 70 is reread, under it is redone. */
  verdict: 'ship' | 'reread' | 'redo' | 'fail';
  facets: Record<Facet, number>;
  issues: IllIssue[];
}

const FACETS: readonly Facet[] = [
  'frame',
  'balance',
  'alignment',
  'hierarchy',
  'density',
  'motion',
];

/** Run every rule on an ink model and say how it did · `limits` sets some thresholds
 *  of the table for this drawing (a deck's `check.limits`), the rest keep theirs. */
export function lintIllustration(model: InkModel, limits: Partial<IllLimits> = {}): IllVerdict {
  active = { ...ILL_LIMITS, ...limits };
  try {
    const issues = RULES.flatMap((rule) => rule(model));
    return { ...scoreIssues(issues), issues };
  } finally {
    active = ILL_LIMITS;
  }
}

/** The score, the facets and the verdict of a set of findings · what a drawing is
 *  worth once a deck's policy has dropped some findings or changed their severity. */
export function scoreIssues(
  issues: readonly Pick<IllIssue, 'code' | 'severity' | 'facet'>[],
): Omit<IllVerdict, 'issues'> {
  const facets = Object.fromEntries(FACETS.map((f) => [f, 100])) as Record<Facet, number>;
  let score = 100;
  for (const issue of issues) {
    const cost = WEIGHT[issue.code];
    score -= cost;
    facets[issue.facet] = Math.max(0, facets[issue.facet] - cost * 2);
  }
  score = Math.max(0, score);
  const defect = issues.some((issue) => issue.severity === 'error');
  const verdict = defect ? 'fail' : score >= 85 ? 'ship' : score >= 70 ? 'reread' : 'redo';
  return { score, verdict, facets };
}
