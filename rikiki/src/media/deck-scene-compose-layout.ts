// ════════════════════════════════════════════════════════════════
// RIKIKI · deck-scene composition layout, the pure part of <deck-scene>
//
// How the width of a row of scenes is shared, and how a drawing of N units is
// laid out in CSS so that one unit is the same length in every region. The rule
// that keeps the type the same size everywhere: a region's CSS width is its
// viewBox width (content plus the EDGE margin on each side) times ONE unit
// length, and the gutters are the width that is left, in the same unit.
//
// Kept apart from the element so the arithmetic runs, and is tested, without a
// browser.
// ════════════════════════════════════════════════════════════════

import type { SceneIssue } from './scene-lint.js';
import { EDGE, SCENE_WIDTH } from './scene-layout.js';

/** Between two regions of a row, in drawing units of content · the room a link
 *  (an arrow, "vs") needs, and no more. */
export const REGION_GAP = 96;

/** Between two stacked regions, and before the closing band. */
export const STACK_GAP = 32;

export const MAX_ROW_REGIONS = 3;
export const MAX_STACK_REGIONS = 2;

/** The narrowest region each shape draws cleanly, in drawing units · measured,
 *  not guessed: `scripts/scene-bench/sweep.mjs` draws the same generated scenes
 *  (item counts from one under the minimum to one over the maximum, awkward
 *  texts, every emphasis) at a ladder of widths, and a shape is listed at the
 *  narrowest width with no silent failure, a text past its box or two over each
 *  other that the scene did not report. Below it the shape still draws, but it
 *  can draw wrong without saying so. 469 is also what each of three equal
 *  regions gets, the narrowest row a composition makes, so those shapes were
 *  not tried below it. */
export const MIN_SCENE_WIDTH: Readonly<Record<string, number>> = Object.freeze({
  cards: 469,
  flow: 469,
  bars: 469,
  ranges: 469,
  units: 469,
  steps: 650,
  matrix: 1000,
  lanes: 1000,
});

/** A region of a kind the table does not know (a band, a scene added later) gets
 *  the narrowest width a row of three leaves. */
export const MIN_REGION_WIDTH = 469;

/** The narrowest width a region of this tag is drawn at without a silent failure. */
export function minWidthOf(tag: string): number {
  return MIN_SCENE_WIDTH[tag.replace(/^deck-scene-/, '')] ?? MIN_REGION_WIDTH;
}

export const LAYOUTS = ['row', 'stack'] as const;
export type ComposeLayout = (typeof LAYOUTS)[number];

export const LINKS = ['arrow', 'vs', 'equals', 'plus'] as const;
export type LinkKind = (typeof LINKS)[number];

/** The words drawn in a gutter for the links that are words · an arrow is a glyph. */
export const LINK_WORDS: Readonly<Record<Exclude<LinkKind, 'arrow'>, string>> = Object.freeze({
  vs: 'vs',
  equals: '=',
  plus: '+',
});

export interface Split {
  shares: number[];
  /** False when the attribute was written and unusable · equal shares are used. */
  valid: boolean;
}

/** `split="2:1"` as shares · one positive number per region, joined by `:`.
 *  Absent, it is equal shares. A wrong count or a non-positive number is invalid
 *  and also equal, so the drawing is still right and the lint says why. */
export function parseSplit(split: string | null | undefined, count: number): Split {
  const equal = Array.from({ length: Math.max(1, count) }, () => 1);
  if (split === null || split === undefined || !split.trim()) return { shares: equal, valid: true };
  const parts = split.split(':').map((part) => Number(part.trim()));
  const usable = parts.length === count && parts.every((n) => Number.isFinite(n) && n > 0);
  return usable ? { shares: parts, valid: true } : { shares: equal, valid: false };
}

export interface RowFrame {
  /** Content width of each region, in drawing units. */
  widths: number[];
  /** The CSS grid track of each region, in units of the host's width. */
  tracks: number[];
  /** The gap between two regions in CSS, in units. */
  gap: number;
  /** The x of each gutter's centre, in units from the left edge of the host. */
  gutterCentres: number[];
}

/** The widths of `shares.length` regions that fill one canvas.
 *
 *  Content widths add up to the canvas minus the gutters. Each region is drawn
 *  `width + 2 EDGE` units wide, so the CSS gap is the gutter minus what the
 *  margins already take · otherwise a row would be wider than the canvas and
 *  every region a little smaller than the scale says. */
export function rowFrame(shares: number[], total = SCENE_WIDTH, gutter = REGION_GAP): RowFrame {
  const count = shares.length;
  const room = total - (count - 1) * gutter;
  // Shares are proportions · each is read against the largest first, so shares as
  // large as a number gets ("1e308:1e308") never add up past what a number holds.
  const largest = Math.max(...shares);
  const proportions = shares.map((share) => share / largest);
  const sum = proportions.reduce((a, b) => a + b, 0);
  const widths = proportions.map((share) => (room * share) / sum);
  const tracks = widths.map((w) => w + 2 * EDGE);
  const gap = gutter - 2 * EDGE;
  const gutterCentres: number[] = [];
  let cursor = 0;
  tracks.forEach((track, i) => {
    cursor += track;
    if (i < count - 1) gutterCentres.push(cursor + gap / 2);
    cursor += gap;
  });
  return { widths, tracks, gap, gutterCentres };
}

export interface ComposeInput {
  /** The `layout` attribute as written, null when absent. */
  layout: string | null;
  /** The `link` attribute as written, null when absent. */
  link: string | null;
  /** The `split` attribute as written, null when absent. */
  split: string | null;
  /** The tags of the regions found, in order (`deck-scene-bars`…). */
  regions: string[];
  /** Children that are neither a region nor a band, by tag. */
  strays: string[];
  /** Whether a `deck-scene-band` closes the composition. */
  band?: boolean;
}

export function layoutOf(layout: string | null): ComposeLayout {
  return (LAYOUTS as readonly string[]).includes(layout ?? '') ? (layout as ComposeLayout) : 'row';
}

/** What an author wrote in a composition that would be drawn wrong or not at all:
 *  a layout or link the composition does not know, a split that does not match
 *  the regions, too few or too many regions, a region too narrow to say its
 *  piece, a child that is not a scene, and, as a warning, more than one region
 *  that puts something forward. Pure · the element asks it with what it found. */
export function lintCompose(input: ComposeInput, emphasised: string[]): SceneIssue[] {
  const issues: SceneIssue[] = [];
  const add = (
    code: SceneIssue['code'],
    severity: SceneIssue['severity'],
    items: string[],
    message: string,
  ) => {
    if (items.length) issues.push({ code, severity, items, message });
  };
  const layout = layoutOf(input.layout);
  const count = input.regions.length;
  const max = layout === 'row' ? MAX_ROW_REGIONS : MAX_STACK_REGIONS;
  // A scene closed by a band is a composition too · "a result, and what follows".
  const minRegions = layout === 'stack' && input.band ? 1 : 2;

  add(
    'SCENE_LAYOUT_INVALID',
    'error',
    input.layout !== null && !(LAYOUTS as readonly string[]).includes(input.layout)
      ? [`layout="${input.layout}"`]
      : [],
    `\`layout\` is one of ${LAYOUTS.join(', ')} · a row is drawn instead`,
  );
  add(
    'SCENE_LAYOUT_INVALID',
    'error',
    input.link !== null && !(LINKS as readonly string[]).includes(input.link)
      ? [`link="${input.link}"`]
      : [],
    `\`link\` is one of ${LINKS.join(', ')} · no link is drawn`,
  );
  add(
    'SCENE_LAYOUT_INVALID',
    'error',
    count > 0 && !parseSplit(input.split, count).valid ? [`split="${input.split}"`] : [],
    `\`split\` is one positive number per region, joined by ":" (${count} here) · equal shares are drawn instead`,
  );
  add(
    'SCENE_LAYOUT_INVALID',
    'error',
    count < minRegions ? [`${count} region${count === 1 ? '' : 's'}`] : [],
    layout === 'stack' && !input.band
      ? 'a stack puts a scene above another, or above a `deck-scene-band` · one scene alone needs no composition'
      : 'a composition puts at least two scenes side by side · one scene needs no composition',
  );
  add(
    'SCENE_ITEMS_DROPPED',
    'error',
    count > max ? input.regions.slice(max) : [],
    `a ${layout} composes at most ${max} scenes · these are not given a place`,
  );
  add(
    'SCENE_LAYOUT_INVALID',
    'error',
    input.strays,
    'only scenes and one `deck-scene-band` go in a composition · this child is not drawn',
  );
  if (layout === 'row' && count >= 2 && count <= max) {
    const split = parseSplit(input.split, count);
    const { widths } = rowFrame(split.shares);
    const narrow = input.regions.filter((tag, i) => widths[i] < minWidthOf(tag));
    add(
      'SCENE_REGION_TOO_NARROW',
      'error',
      narrow.map((tag) => `${tag} (needs ${minWidthOf(tag)})`),
      'a scene gets less width than it draws cleanly at · below it the scene can draw wrong without saying so · give it more with `split`, put it in a stack, or use fewer scenes',
    );
  }
  add(
    'SCENE_EMPHASIS_SCATTERED',
    'warning',
    emphasised.length > 1 ? emphasised : [],
    'more than one region puts something forward · the composition argues for one, and two are none',
  );
  return issues;
}

/** How tall a composition comes out, from the heights of its regions. A row is as
 *  tall as its tallest region, a stack is the regions and the gaps between them ·
 *  and a closing band sits under either. */
export function composedHeight(
  layout: ComposeLayout,
  heights: number[],
  bandHeight: number,
): number {
  const body =
    layout === 'row'
      ? Math.max(0, ...heights)
      : heights.reduce((a, b) => a + b, 0) + STACK_GAP * Math.max(0, heights.length - 1);
  return bandHeight > 0 ? body + STACK_GAP + bandHeight : body;
}
