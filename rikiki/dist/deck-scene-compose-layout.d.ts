import type { SceneIssue } from './scene-lint.js';
/** Between two regions of a row, in drawing units of content · the room a link
 *  (an arrow, "vs") needs, and no more. */
export declare const REGION_GAP = 96;
/** Between two stacked regions, and before the closing band. */
export declare const STACK_GAP = 32;
export declare const MAX_ROW_REGIONS = 3;
export declare const MAX_STACK_REGIONS = 2;
/** The narrowest region each shape draws cleanly, in drawing units · measured,
 *  not guessed: `scripts/scene-bench/sweep.mjs` draws the same generated scenes
 *  (item counts from one under the minimum to one over the maximum, awkward
 *  texts, every emphasis) at a ladder of widths, and a shape is listed at the
 *  narrowest width with no silent failure, a text past its box or two over each
 *  other that the scene did not report. Below it the shape still draws, but it
 *  can draw wrong without saying so. 469 is also what each of three equal
 *  regions gets, the narrowest row a composition makes, so those shapes were
 *  not tried below it. */
export declare const MIN_SCENE_WIDTH: Readonly<Record<string, number>>;
/** A region of a kind the table does not know (a band, a scene added later) gets
 *  the narrowest width a row of three leaves. */
export declare const MIN_REGION_WIDTH = 469;
/** The narrowest width a region of this tag is drawn at without a silent failure. */
export declare function minWidthOf(tag: string): number;
export declare const LAYOUTS: readonly ["row", "stack"];
export type ComposeLayout = (typeof LAYOUTS)[number];
export declare const LINKS: readonly ["arrow", "vs", "equals", "plus"];
export type LinkKind = (typeof LINKS)[number];
/** The words drawn in a gutter for the links that are words · an arrow is a glyph. */
export declare const LINK_WORDS: Readonly<Record<Exclude<LinkKind, 'arrow'>, string>>;
export interface Split {
    shares: number[];
    /** False when the attribute was written and unusable · equal shares are used. */
    valid: boolean;
}
/** `split="2:1"` as shares · one positive number per region, joined by `:`.
 *  Absent, it is equal shares. A wrong count or a non-positive number is invalid
 *  and also equal, so the drawing is still right and the lint says why. */
export declare function parseSplit(split: string | null | undefined, count: number): Split;
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
export declare function rowFrame(shares: number[], total?: number, gutter?: number): RowFrame;
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
export declare function layoutOf(layout: string | null): ComposeLayout;
/** What an author wrote in a composition that would be drawn wrong or not at all:
 *  a layout or link the composition does not know, a split that does not match
 *  the regions, too few or too many regions, a region too narrow to say its
 *  piece, a child that is not a scene, and, as a warning, more than one region
 *  that puts something forward. Pure · the element asks it with what it found. */
export declare function lintCompose(input: ComposeInput, emphasised: string[]): SceneIssue[];
/** How tall a composition comes out, from the heights of its regions. A row is as
 *  tall as its tallest region, a stack is the regions and the gaps between them ·
 *  and a closing band sits under either. */
export declare function composedHeight(layout: ComposeLayout, heights: number[], bandHeight: number): number;
