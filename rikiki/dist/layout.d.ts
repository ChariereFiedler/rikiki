import { type GateState, type Speed, type Token } from './lanes.js';
import { type LPiece } from './marks.js';
import { type DgIssue, type DgNode, type Paint, type ParsedDiagram, nameOf } from './model.js';
import type { Point } from './types.js';
/** `meter(size, weight)(text)` is the width of a text in drawing units. */
export type Meter = (size: number, weight: number) => (text: string) => number;
export type Density = 'tight' | 'normal' | 'airy';
export interface LText {
    lines: string[];
    size: number;
    weight: number;
    line: number;
    role: 'label' | 'note' | 'tag' | 'value' | 'caption' | 'proof';
    fits: boolean;
    /** Top-left of the first line's box · the renderer adds the baseline. */
    x: number;
    y: number;
}
export interface LBox {
    kind: 'box';
    key: string;
    node: DgNode;
    x: number;
    y: number;
    w: number;
    h: number;
    paint: Paint;
    /** The tone at rest, the last click's. */
    tone: string;
    /** The tone on each click, the last holding after · a box that turns on a click. */
    tones: string[];
    emphasis: boolean;
    icon?: {
        name: string;
        x: number;
        y: number;
        size: number;
    };
    texts: LText[];
    /** In a story, what the box says and shows before its beat (`swap`, `swap-icon`) ·
     *  `texts` and `icon` are what it says after, the picture at rest: `label` stands
     *  where `texts[replaces]` will, `icon` where `icon` will. */
    before?: {
        label?: LText;
        replaces?: number;
        icon?: {
            name: string;
            x: number;
            y: number;
            size: number;
        };
    };
    /** In a story, the disc of the check before its proof (`proof`, a text of `texts`). */
    proofDisc?: {
        x: number;
        y: number;
        size: number;
    };
}
export interface LDot {
    kind: 'dot';
    key: string;
    node: DgNode;
    x: number;
    y: number;
    size: number;
    emphasis: boolean;
    tone: string;
    /** 0-based position among the dots of its mark. */
    index: number;
}
export interface LBar {
    kind: 'bar';
    key: string;
    node: DgNode;
    x: number;
    y: number;
    w: number;
    h: number;
    emphasis: boolean;
    tone: string;
    texts: LText[];
}
/** A group's own surface and caption, drawn behind its children. */
export interface LFrame {
    kind: 'frame';
    key: string;
    node: DgNode;
    x: number;
    y: number;
    w: number;
    h: number;
    paint: Paint;
    tone: string;
    caption?: LText;
}
/** One run of a lane's tokens, the one that plays on click `stage` · tokens rest
 *  where the last run left them until the next one. */
export interface LRun {
    stage: number;
    tokens: Token[];
    duration: number;
}
/** A lane · its label at the left, the track its tokens run along. */
export interface LLane {
    kind: 'lane';
    key: string;
    node: DgNode;
    /** The row, label to track end. */
    x: number;
    y: number;
    w: number;
    h: number;
    /** The line the tokens run on, and where it starts and ends. */
    cy: number;
    track: {
        x0: number;
        x1: number;
    };
    /** An arrow at the end of the track · it runs into something. */
    head: boolean;
    icon?: {
        name: string;
        x: number;
        y: number;
        size: number;
    };
    texts: LText[];
    tone: string;
    flow: number;
    speed: Speed;
    runs: LRun[];
}
/** A gate across lanes · `states[i]` is how it stands on click i, the last one
 *  holding after. */
export interface LGate {
    kind: 'gate';
    key: string;
    node: DgNode;
    x: number;
    y: number;
    w: number;
    h: number;
    /** The keys of the lanes it stands across. */
    lanes: string[];
    states: GateState[];
    /** The click it appears on. */
    stage: number;
    texts: LText[];
    /** The line from the mark that drives it (`by`) down to its top. */
    feed?: Point[];
}
/** A value on an axis · a point (`value`) or a stretch (`from` to `to`), or, with
 *  neither, its label alone. */
export interface LSpan {
    kind: 'span';
    key: string;
    node: DgNode;
    x: number;
    y: number;
    w: number;
    h: number;
    shape: 'point' | 'stretch' | 'none';
    emphasis: boolean;
    tone: string;
    texts: LText[];
    /** The track it is drawn on, when it is the one that draws it. */
    track?: {
        x0: number;
        y0: number;
        x1: number;
        y1: number;
    };
}
/** A cursor on an axis · a line across the tracks at its value, which travels
 *  there from the start of the axis. */
export interface LCursor {
    kind: 'cursor';
    key: string;
    node: DgNode;
    x: number;
    y: number;
    w: number;
    h: number;
    /** Where it starts from, as an offset from where it rests. */
    travel: Point;
    tone: string;
    texts: LText[];
}
/** A gauge · its label, its figure and a track filled as far as its value goes.
 *  Each list holds one entry per click, the last holding after. */
export interface LMeter {
    kind: 'meter';
    key: string;
    node: DgNode;
    x: number;
    y: number;
    w: number;
    h: number;
    track: {
        x: number;
        y: number;
        w: number;
        h: number;
    };
    /** The width filled on each click. */
    fills: number[];
    /** Where a threshold crosses the track · absent without one. */
    threshold?: number;
    tones: string[];
    emphasis: boolean;
    /** The label, and the figure of the last click. */
    texts: LText[];
    /** The figure of each click. */
    figures: LText[];
}
/** A row of places, some taken · `fills` says how many on each click. */
export interface LQueue {
    kind: 'queue';
    key: string;
    node: DgNode;
    x: number;
    y: number;
    w: number;
    h: number;
    cells: {
        x: number;
        y: number;
        w: number;
        h: number;
    }[];
    fills: number[];
    tones: string[];
    emphasis: boolean;
    texts: LText[];
}
/** A curve · its words, its plot, the points of its series, its threshold. */
export interface LCurve {
    kind: 'curve';
    key: string;
    node: DgNode;
    x: number;
    y: number;
    w: number;
    h: number;
    plot: {
        x: number;
        y: number;
        w: number;
        h: number;
    };
    points: Point[];
    /** The y of the threshold's line · absent without one. */
    threshold?: number;
    /** Where the curve crosses its threshold, and the share of its length traced by then. */
    crossing?: {
        at: Point;
        share: number;
    };
    tone: string;
    emphasis: boolean;
    /** The label, the last figure, the words under the plot, and the threshold's figure. */
    texts: LText[];
}
export type LItem = LBox | LDot | LBar | LFrame | LLane | LGate | LSpan | LCursor | LMeter | LQueue | LCurve | LPiece;
/** What a per-click list says on click `stage` · the last entry holds after. */
export declare const atClick: <T>(list: readonly T[], stage: number) => T | undefined;
export interface LLink {
    from: string;
    to: string;
    points: Point[];
    dashed: boolean;
    head: boolean;
    label?: LText;
    /** Tokens that travel along it, by `flow`. */
    flow: number;
    speed: Speed;
    node?: DgNode;
}
export interface LNote {
    texts: LText[];
    x: number;
    y: number;
    w: number;
    h: number;
    /** The short line from the note to what it points at. */
    leader?: [Point, Point];
    target: string;
    node: DgNode;
    /** A status (`dg-status`) · the disc before its words, and its state before and
     *  after its beat (one word: the same). */
    status?: {
        disc: {
            x: number;
            y: number;
            size: number;
        };
        before: string;
        after: string;
    };
}
export interface DiagramLayout {
    size: {
        w: number;
        h: number;
    };
    items: LItem[];
    links: LLink[];
    notes: LNote[];
    status: 'fit' | 'unresolved';
    reasons: string[];
    issues: DgIssue[];
    density: Density;
    /** How many clicks it takes after the slide is entered. */
    stages: number;
    /** The marks laid out · the picture of its click when the diagram has states. */
    tree: DgNode[];
    /** Where each mark, group and panel stands, by key · what a camera frames. */
    places: Map<string, {
        x: number;
        y: number;
        w: number;
        h: number;
    }>;
}
/** The texts an item draws, whatever its kind. */
export declare const textsOf: (item: LItem) => LText[];
export interface LayoutOptions {
    meter: Meter;
    /** The room the diagram was given, in drawing units. */
    bounds: {
        w: number;
        h: number;
    };
    density?: Density;
    /** Whether an icon name is in the closed set · an unknown one draws nothing. */
    hasIcon?: (name: string) => boolean;
    /** The click whose picture is laid out, for a diagram with `dg-state` · the
     *  last one when unsaid, the picture at rest. */
    stage?: number;
    /** The language the deck is written in (`lang`) · a figure the diagram prints
     *  from a number (a gauge's value, a curve's last point and its line) takes its
     *  decimal sign. Absent, figures are printed as written. */
    locale?: string;
}
/** The widths of a row of panels · by their shares, except that a panel is never
 *  narrower than the least it can hold its marks in: it takes that, and the others
 *  share what is left by their shares. */
export declare function bendShares(shares: number[], least: number[], free: number): number[];
/** A lane's icon sits in a disc this wide, left of its label. */
export declare const LANE_ICON_DISC = 48;
/** Tokens a lane carries when it does not say. */
export declare const DEFAULT_LANE_FLOW = 3;
/** The click a mark appears on · 0 when it does not say. */
export declare const stepOf: (node: DgNode) => number;
/** How a gate stands on click `stage` · absent before the click it appears on. */
export declare function gateStateAt(gate: LGate, stage: number, appears?: number): GateState | null;
/** How many of the diagram's top-level marks, taken from the first, would fit the
 *  box · the number an agent is told to keep when it asked for more than the box
 *  holds. Links and annotations stay (those that point at a removed mark are
 *  simply not drawn). 0 when not even one fits. Found by trying fewer and fewer,
 *  since a diagram has a handful of marks and every attempt is a pure layout. */
export declare function marksThatFit(parsed: ParsedDiagram, options: LayoutOptions): number;
/** Lay out a parsed diagram in a box. */
export declare function layoutDiagram(parsed: ParsedDiagram, options: LayoutOptions): DiagramLayout;
export { nameOf };
