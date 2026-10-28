// ════════════════════════════════════════════════════════════════
// RIKIKI · diversity, do the illustrations of a deck look alike?
//
// A deck of thirty illustrations can pass every rule one by one and still show the
// same picture thirty times with other words. This module compares the drawings of
// a deck with each other, on what they are made of and not on what they say:
//
//   - STRUCTURE · the intent, the layouts, the kinds of marks, how the arrows
//     connect, whether tokens ride, a gate drops or the picture reorganises;
//   - VISUAL · the surfaces and tones it paints, how many marks, and a coarse
//     thumbnail of where its ink sits;
//   - TIME · how many clicks it takes, and what moves on them.
//
// D = 0.5 structure + 0.3 visual + 0.2 time, each from 0 (the same) to 1 (nothing
// shared). Two drawings closer than `repeated` are the same look twice
// (`ILL_REPEATED_LOOK`), a warning about the deck, never an error of a slide: one
// drawing alone is not wrong for resembling another. A motif of the deck is no
// repeat when the later drawing moves on (deck-motifs.ts): the same named marks at
// another step of the act, over a wider scope, with other figures or in another
// state · such a pair is reported apart (`progressing`), never warned.
//
// Pure: signatures in, numbers out. A diagram writes its signature on its svg
// (`diagram/signature.ts`), `rikiki check` adds the thumbnail from the ink it
// measured, and any other drawing (a scene, a hand-drawn svg) is known by its tag
// and its thumbnail.
// ════════════════════════════════════════════════════════════════

import { type Motif, type Progress, progressOf } from './deck-motifs.js';
import type { Box, InkModel } from './ill-rules.js';

export type Topology = 'none' | 'chain' | 'fan-out' | 'fan-in' | 'graph' | 'cycle';

export interface StructureSignature {
  /** The element that drew it · `deck-diagram`, a scene's tag, `svg`. */
  kind: string;
  /** The intent and its secondaries (`barrier+cause`), null when written as layouts. */
  intent: string | null;
  layouts: string[];
  /** How many marks of each kind · `box`, `bar`, `meter`… */
  marks: Record<string, number>;
  links: number;
  topology: Topology;
  tokens: boolean;
  gates: boolean;
  morph: boolean;
}

export interface VisualSignature {
  /** The paints of its surfaces (`outline`, `solid`, `inverse`…). */
  surfaces: string[];
  /** The tones it turns to, and `accent` when something is put forward. */
  tones: string[];
  /** How many marks it draws. */
  density: number;
  /** Where the ink sits, cell by cell, row after row, from 0 to 1 · the heaviest 1. */
  thumb?: number[];
}

export interface TimeSignature {
  clicks: number;
  /** What moves: `tokens`, `gate`, `fill`, `turn`, `cursor`, `trace`, `reveal`, `sequence`, `morph`. */
  motifs: string[];
}

/** What a diagram says of itself · the thumbnail is added by whoever sees the ink. */
export interface DiagramSignature {
  structure: StructureSignature;
  visual: VisualSignature;
  time: TimeSignature;
}

export interface Signature extends DiagramSignature {
  visual: VisualSignature & { thumb: number[] };
}

/** Every weight and threshold, in one place, with where it comes from. */
export const DIVERSITY_LIMITS = Object.freeze({
  /** D = 0.5 structure + 0.3 visual + 0.2 time · what a drawing IS matters most,
   *  how it moves least (two stills of different shapes are different pictures). */
  weights: Object.freeze({ structure: 0.5, visual: 0.3, time: 0.2 }),
  /** Under this distance two drawings are one look twice · a clone with other words
   *  measures under 0.05, two graphs of the same layout and size about 0.12, a graph
   *  beside a chart over 0.4. */
  repeated: 0.15,
  /** The thumbnail · 8 columns by 4 rows of the drawing's frame. */
  thumbCols: 8,
  thumbRows: 4,
  /** What a gallery aims at · per hundred illustrations, distinct structures; intents
   *  covered; the largest share one family may take. */
  targets: Object.freeze({ structuresPer100: 40, intents: 12, familyShare: 0.1 }),
});

// ── the thumbnail ─────────────────────────────────────────────────────────

/** How much a painted thing weighs in the thumbnail · a filled shape its area, an
 *  outlined one a quarter of it (its edge), a text half of its box. A line weighs
 *  nothing: an arrow is where the eye goes, not where the drawing sits. */
const INK_WEIGHT = Object.freeze({ filled: 1, outlined: 0.25, text: 0.5 });

const areaOf = (b: Box) => Math.max(0, b.right - b.left) * Math.max(0, b.bottom - b.top);

function overlapArea(a: Box, b: Box): number {
  return areaOf({
    left: Math.max(a.left, b.left),
    top: Math.max(a.top, b.top),
    right: Math.min(a.right, b.right),
    bottom: Math.min(a.bottom, b.bottom),
  });
}

/** Where the ink of a drawing sits, on a grid over its frame · each cell from 0 to 1,
 *  the heaviest cell 1, so a small drawing and a large one of the same shape match. */
export function thumbOf(model: InkModel): number[] {
  const { thumbCols: cols, thumbRows: rows } = DIVERSITY_LIMITS;
  const { frame } = model;
  const cw = (frame.right - frame.left) / cols;
  const ch = (frame.bottom - frame.top) / rows;
  const painted = [
    ...model.shapes
      .filter((s) => s.kind === 'rect' || s.kind === 'circle')
      .map((s) => ({ box: s.box, weight: s.fill ? INK_WEIGHT.filled : INK_WEIGHT.outlined })),
    ...model.texts.map((t) => ({ box: t.box, weight: INK_WEIGHT.text })),
  ];
  const cells = Array.from({ length: cols * rows }, (_, n) => {
    if (!(cw > 0 && ch > 0)) return 0;
    const cell = {
      left: frame.left + (n % cols) * cw,
      top: frame.top + Math.floor(n / cols) * ch,
      right: frame.left + ((n % cols) + 1) * cw,
      bottom: frame.top + (Math.floor(n / cols) + 1) * ch,
    };
    const ink = painted.reduce((sum, p) => sum + overlapArea(cell, p.box) * p.weight, 0);
    return Math.min(1, ink / areaOf(cell));
  });
  const heaviest = Math.max(...cells);
  return cells.map((c) => (heaviest > 0 ? Math.round((c / heaviest) * 100) / 100 : 0));
}

/** The signature of a drawing as `check` saw it · what the diagram wrote of itself,
 *  or only its tag for a drawing that says nothing, and the thumbnail of its ink. */
export function signatureFromInk(
  kind: string,
  model: InkModel,
  declared?: DiagramSignature | null,
): Signature {
  const thumb = thumbOf(model);
  if (declared) return { ...declared, visual: { ...declared.visual, thumb } };
  return {
    structure: {
      kind,
      intent: null,
      layouts: [],
      marks: {},
      links: 0,
      topology: 'none',
      tokens: false,
      gates: false,
      morph: false,
    },
    visual: {
      surfaces: [],
      tones: model.shapes.some((s) => s.accent) ? ['accent'] : [],
      density: model.shapes.length,
      thumb,
    },
    time: { clicks: 0, motifs: [] },
  };
}

// ── distances ─────────────────────────────────────────────────────────────

/** 1 minus what two sets share of what they hold together · 0 for two empty sets. */
function jaccard(a: readonly string[], b: readonly string[]): number {
  const union = new Set([...a, ...b]);
  if (!union.size) return 0;
  const shared = new Set(a.filter((x) => b.includes(x)));
  return 1 - shared.size / union.size;
}

/** How far apart two counts are, from 0 to 1. */
const ratio = (a: number, b: number) => Math.abs(a - b) / Math.max(a, b, 1);

/** How differently two drawings spend their marks · the kinds they use, and the share
 *  of each. */
function marksDistance(a: Record<string, number>, b: Record<string, number>): number {
  const kinds = [...new Set([...Object.keys(a), ...Object.keys(b)])];
  if (!kinds.length) return 0;
  const total = (m: Record<string, number>) => Object.values(m).reduce((s, n) => s + n, 0) || 1;
  const ta = total(a);
  const tb = total(b);
  const shares = kinds.reduce((s, k) => s + Math.abs((a[k] ?? 0) / ta - (b[k] ?? 0) / tb), 0) / 2;
  return 0.5 * jaccard(Object.keys(a), Object.keys(b)) + 0.5 * shares;
}

export function structureDistance(a: StructureSignature, b: StructureSignature): number {
  if (a.kind !== b.kind) return 1;
  const intents = jaccard(a.intent?.split('+') ?? [], b.intent?.split('+') ?? []);
  const flags = (['tokens', 'gates', 'morph'] as const).filter((f) => a[f] !== b[f]).length / 3;
  const links = 0.5 * (a.topology === b.topology ? 0 : 1) + 0.5 * ratio(a.links, b.links);
  return (
    0.3 * intents +
    0.2 * jaccard(a.layouts, b.layouts) +
    0.2 * marksDistance(a.marks, b.marks) +
    0.15 * links +
    0.15 * flags
  );
}

/** How far apart two thumbnails are · the mean difference of their cells. */
function thumbDistance(a: readonly number[] = [], b: readonly number[] = []): number {
  const n = Math.max(a.length, b.length);
  if (!n) return 0;
  let sum = 0;
  for (let i = 0; i < n; i += 1) sum += Math.abs((a[i] ?? 0) - (b[i] ?? 0));
  return sum / n;
}

export function visualDistance(a: VisualSignature, b: VisualSignature): number {
  return (
    0.25 * jaccard(a.surfaces, b.surfaces) +
    0.25 * jaccard(a.tones, b.tones) +
    0.1 * ratio(a.density, b.density) +
    0.4 * thumbDistance(a.thumb, b.thumb)
  );
}

export function timeDistance(a: TimeSignature, b: TimeSignature): number {
  return 0.5 * ratio(a.clicks, b.clicks) + 0.5 * jaccard(a.motifs, b.motifs);
}

export interface Distance {
  d: number;
  structure: number;
  visual: number;
  time: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** D between two drawings, and its three parts · 0 the same look, 1 nothing shared. */
export function distance(a: DiagramSignature, b: DiagramSignature): Distance {
  const { weights } = DIVERSITY_LIMITS;
  const structure = structureDistance(a.structure, b.structure);
  const visual = visualDistance(a.visual, b.visual);
  const time = timeDistance(a.time, b.time);
  return {
    d: round2(weights.structure * structure + weights.visual * visual + weights.time * time),
    structure: round2(structure),
    visual: round2(visual),
    time: round2(time),
  };
}

// ── a gallery ─────────────────────────────────────────────────────────────

/** A structure written as a key · two drawings with the same key are one structure
 *  with other words or other counts. Links are counted in bands (none, a few, some,
 *  many), so one arrow more is not a new structure. */
export function structuralKey(s: StructureSignature): string {
  const band = s.links === 0 ? 0 : s.links <= 2 ? 1 : s.links <= 5 ? 2 : 3;
  const flags = (['tokens', 'gates', 'morph'] as const).filter((f) => s[f]).join(',');
  return [
    s.kind,
    s.intent ?? '-',
    s.layouts.join(','),
    Object.keys(s.marks).sort().join(','),
    s.topology,
    band,
    flags,
  ].join('|');
}

/** The family a drawing belongs to · its intent, else the layouts it is written in,
 *  else the element that drew it. */
export function familyOf(s: StructureSignature): string {
  if (s.intent) return s.intent.split('+')[0]!;
  if (s.layouts.length) return `layout:${s.layouts.join('+')}`;
  return s.kind;
}

export interface GalleryEntry {
  slide: number;
  slideId?: string | null;
  element?: string;
  signature: DiagramSignature;
  /** Its named marks and their words, its act · whether it moves on from a look-alike. */
  motif?: Motif | null;
}

export interface ClosePair {
  a: { slide: number; slideId?: string | null };
  b: { slide: number; slideId?: string | null };
  distance: Distance;
  /** How the later moves on from the earlier · a motif that progresses, no repeat. */
  progress?: Progress[];
}

export interface DiversityReport {
  illustrations: number;
  /** Distinct structures, by `structuralKey`. */
  structures: number;
  /** The same per hundred illustrations · what the target is written in. */
  structuresPer100: number;
  intents: string[];
  families: Record<string, number>;
  largestFamily: { name: string; count: number; share: number } | null;
  /** Pairs closer than `repeated`, the closest first. */
  repeated: ClosePair[];
  /** Pairs as close, whose later drawing moves on from the earlier (a step, a scope,
   *  figures, a state) · a motif of the deck, not the same picture twice. */
  progressing: ClosePair[];
  /** The mean distance of each drawing to its nearest neighbour. */
  meanNearest: number;
  /** Where each target stands. */
  targets: { structuresPer100: boolean; intents: boolean; familyShare: boolean };
  /** Every distance · row and column in the order given. */
  matrix: number[][];
}

const whereOf = (e: GalleryEntry) => ({ slide: e.slide, slideId: e.slideId ?? null });

/** Compare every drawing of a gallery with every other. */
export function measureDiversity(entries: readonly GalleryEntry[]): DiversityReport {
  const n = entries.length;
  const matrix = entries.map(() => entries.map(() => 0));
  const repeated: ClosePair[] = [];
  const progressing: ClosePair[] = [];
  for (let i = 0; i < n; i += 1) {
    for (let j = i + 1; j < n; j += 1) {
      const dist = distance(entries[i]!.signature, entries[j]!.signature);
      matrix[i]![j] = dist.d;
      matrix[j]![i] = dist.d;
      if (dist.d >= DIVERSITY_LIMITS.repeated) continue;
      const [first, later] =
        entries[i]!.slide <= entries[j]!.slide
          ? [entries[i]!, entries[j]!]
          : [entries[j]!, entries[i]!];
      const pair = { a: whereOf(first), b: whereOf(later), distance: dist };
      const progress = progressOf(first.motif, later.motif);
      if (progress.length) progressing.push({ ...pair, progress });
      else repeated.push(pair);
    }
  }
  repeated.sort((x, y) => x.distance.d - y.distance.d);
  progressing.sort((x, y) => x.distance.d - y.distance.d);
  const structures = new Set(entries.map((e) => structuralKey(e.signature.structure))).size;
  const intents = [
    ...new Set(entries.flatMap((e) => e.signature.structure.intent?.split('+').slice(0, 1) ?? [])),
  ].sort();
  const families: Record<string, number> = {};
  for (const e of entries) {
    const family = familyOf(e.signature.structure);
    families[family] = (families[family] ?? 0) + 1;
  }
  const [name, count] = Object.entries(families).sort((x, y) => y[1] - x[1])[0] ?? [];
  const largestFamily =
    name !== undefined && count !== undefined ? { name, count, share: round2(count / n) } : null;
  const nearest = matrix.map((row, i) => Math.min(...row.filter((_, j) => j !== i)));
  const meanNearest = n > 1 ? round2(nearest.reduce((s, d) => s + d, 0) / n) : 0;
  const structuresPer100 = n ? Math.round((structures / n) * 100) : 0;
  const { targets } = DIVERSITY_LIMITS;
  return {
    illustrations: n,
    structures,
    structuresPer100,
    intents,
    families,
    largestFamily,
    repeated,
    progressing,
    meanNearest,
    targets: {
      structuresPer100: structuresPer100 >= targets.structuresPer100,
      intents: intents.length >= targets.intents,
      familyShare: !largestFamily || largestFamily.share <= targets.familyShare,
    },
    matrix,
  };
}

export interface DiversityIssue {
  code: 'ILL_REPEATED_LOOK';
  severity: 'warning';
  /** The later slide of the pair · where the reader goes to change it. */
  slide: number;
  slideId: string | null;
  message: string;
  measurement: Record<string, number | string | number[]>;
  fix: { action: string; [detail: string]: unknown };
}

const nameSlide = (w: { slide: number; slideId?: string | null }) =>
  `slide ${w.slide}${w.slideId ? ` (#${w.slideId})` : ''}`;

/** One warning per pair of drawings that are the same look twice · about the deck,
 *  not about either slide alone. */
export function repeatedLookIssues(report: DiversityReport): DiversityIssue[] {
  return report.repeated.map(({ a, b, distance: dist }) => ({
    code: 'ILL_REPEATED_LOOK',
    severity: 'warning',
    slide: b.slide,
    slideId: b.slideId ?? null,
    message: `${nameSlide(b)} looks like ${nameSlide(a)} · distance ${dist.d}, under ${DIVERSITY_LIMITS.repeated} (structure ${dist.structure}, visual ${dist.visual}, time ${dist.time}) · the room sees the same picture twice`,
    measurement: {
      slides: [a.slide, b.slide],
      distance: dist.d,
      structure: dist.structure,
      visual: dist.visual,
      time: dist.time,
      limit: DIVERSITY_LIMITS.repeated,
    },
    fix: {
      action: 'vary-the-look',
      options: [
        'another intent, if the sentence says another relation',
        'another layout or other marks (a chart, lanes, an axis, a ring, a state that morphs)',
        'merge the two slides if they say the same thing',
      ],
    },
  }));
}
