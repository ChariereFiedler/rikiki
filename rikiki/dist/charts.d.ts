import type { LText } from './layout.js';
import type { TextEnv } from './marks.js';
import { type DgNode } from './model.js';
type Rect = {
    x: number;
    y: number;
    w: number;
    h: number;
};
/** A text drawn centred on `x` · its lines one under the other. */
export type Centred = {
    text: LText;
    x: number;
};
/** The rows of a chart · each its label, its `most` figures as written and as numbers. */
export declare function chartRows(value: string | undefined, most?: number): {
    label: string;
    figures: string[];
    values: number[];
}[];
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
    centre: {
        x: number;
        y: number;
    };
    r: number;
    ring: number;
    /** The gap between two parts, in turns. */
    gap: number;
    slices: PieSlice[];
    legend: {
        swatch: Rect;
        label: LText;
        figure: LText;
    }[];
    /** The figure of the whole and its note · in the hole of a ring, over the legend
     *  of a full disc. */
    value?: Centred;
    note?: Centred;
    texts: LText[];
}
export declare function pieWidth(env: TextEnv, node: DgNode): number;
export declare function pieParts(env: TextEnv, node: DgNode, width: number): PieParts & {
    h: number;
};
/** A pie's act · the ring swept part after part, then the figure of the whole. */
export declare const PIE_SWEEP_SECONDS = 1.6;
export declare const PIE_VALUE_SECONDS = 0.35;
export declare const pieSeconds: (parts: Pick<PieParts, "value" | "note">) => number;
/** The top of a scale that holds `n` · a round figure at or just above it. */
export declare function niceTop(n: number): number;
export interface PlotFrame {
    title?: LText;
    /** The plot · the baseline is its bottom edge. */
    plot: Rect;
    /** Lines across the plot at round values, each with its figure at the left. */
    grid: {
        y: number;
        text: LText;
    }[];
    /** The words under each slot. */
    labels: Centred[];
    threshold?: {
        y: number;
        text: LText;
    };
    /** The figures over the bars, when every one says it. */
    everyFigure: boolean;
}
export interface ColumnBar {
    rect: Rect;
    series: number;
    column: number;
    /** Its figure above it · when every bar has one, or on the column brought forward. */
    figure?: Centred;
}
export interface ColumnsParts extends PlotFrame {
    legend: {
        swatch: Rect;
        text: LText;
        series: number;
    }[];
    bars: ColumnBar[];
    /** The column brought forward · -1 when none is. */
    focus: number;
    series: number;
    /** The series stand on one another, one column each, its total over it. */
    stacked: boolean;
    texts: LText[];
}
export declare function columnsWidths(env: TextEnv, node: DgNode): {
    min: number;
    pref: number;
    max: number;
};
export declare function columnsParts(env: TextEnv, node: DgNode, width: number): ColumnsParts & {
    h: number;
};
/** Columns' act · they grow one after the other from the baseline, each this long,
 *  this far apart, and their figures come in as they reach them. */
export declare const COLUMN_GROW_SECONDS = 0.55;
export declare const COLUMN_STAGGER_SECONDS = 0.18;
export declare const COLUMN_FIGURE_SECONDS = 0.25;
export declare const columnsSeconds: (columns: number) => number;
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
    links: {
        x: number;
        y: number;
        w: number;
    }[];
    focus: number;
    texts: LText[];
}
export declare function waterfallWidths(env: TextEnv, node: DgNode): {
    min: number;
    pref: number;
    max: number;
};
export declare function waterfallParts(env: TextEnv, node: DgNode, width: number): WaterfallParts & {
    h: number;
};
/** A waterfall's act · each step taken after the one before, in this long. */
export declare const STEP_SECONDS = 0.45;
export declare const STEP_STAGGER_SECONDS = 0.32;
export declare const waterfallSeconds: (steps: number) => number;
export {};
