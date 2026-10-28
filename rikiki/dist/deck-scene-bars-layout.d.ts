import { type Fitted, type Measure } from './scene-layout.js';
/** Past eight bars the slide is a chart, and a chart is deck-chart's job. */
export declare const MAX_BARS: number;
/** A bar wider than this stops reading as a bar and starts reading as a card. */
export declare const MAX_BAR_WIDTH = 200;
/** Between two bars of a group, and between two groups · twice the gap is what
 *  tells the eye where one comparison ends and the next begins, and no more,
 *  since every unit spent between groups is taken from the bars' figures. */
export declare const BAR_GAP = 48;
export declare const GROUP_GAP = 96;
/** Room kept clear between the labels of two neighbouring bars. */
export declare const LABEL_CLEAR = 16;
/** A label is centred on its bar and may run this far past either side of it. */
export declare const LABEL_OVERHANG: number;
/** A bar keeps at least this width · the radius of its rounded top. In a region
 *  too narrow for the gaps as written, the gaps give way first. */
export declare const MIN_BAR_WIDTH = 8;
/** Between a figure and its unit · narrow and unbreakable, so "1,7 %" never
 *  leaves its sign alone on a line and reads the same in French and SI. */
export declare const UNIT_SPACE = "\u202F";
/** A figure as an author writes it: "1,7" and "1.7" are the same number, and a
 *  space inside it ("12 500") is a thousands separator. Anything that is not a
 *  number reads as zero · the bar is flat, the text still shows what was written. */
export declare function parseFigure(text: string | null | undefined): number;
/** The number an author wrote, or null when there is none to read · `parseFigure`
 *  draws null as a flat bar, and the lint is what tells the author it was one. */
export declare function readFigure(text: string | null | undefined): number | null;
/** The figure printed above a bar: as written, so the author's decimal sign is
 *  kept, then the unit after a narrow no-break space. */
export declare function formatFigure(text: string | null | undefined, unit: string): string;
/** How far a figure may shrink to fit, as a share of its size · a figure is the
 *  first thing read, so it gives up size in steps, never below the point where
 *  it stops being the biggest text of the bar (and the room reads it at 50 px). */
export declare const FIGURE_FLOOR = 0.7;
/** A figure that did not fit, with what it needed · `measured` is its width at
 *  the size it was finally drawn. */
export interface FittedFigure extends Fitted {
    measured: number;
}
/** A figure is one line, whole · the kit's wrap breaks at any white space, the
 *  narrow one before the unit included, and "12 / ms" over two lines would run
 *  into the bar. It steps down, a step at a time, to the floor, and only then
 *  reports itself as not fitting. */
export declare function fitFigure(text: string, maxWidth: number, size: number, measureAt: (size: number) => Measure): FittedFigure;
/** The top of the scale: the author's `max` when given, otherwise the largest
 *  value, so the tallest bar fills the area. Never zero · nothing divides by it. */
export declare function scaleMax(values: number[], max?: number): number;
/** A bar's height in drawing units. A value past the scale stops at the top of
 *  the area, a negative one stays on the baseline · neither leaves the drawing. */
export declare function barHeight(value: number, max: number, area: number): number;
export interface BarGroup {
    /** The caption under the group, empty when the items carry no note. */
    note: string;
    /** The index of the group's first bar. */
    first: number;
    count: number;
}
/** Consecutive items with the same note form one group · the note is written on
 *  every item of it, so moving an item moves its group with it. */
export declare function groupByNote(notes: string[]): BarGroup[];
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
export declare function barColumns(groups: BarGroup[], width?: number): BarColumns;
