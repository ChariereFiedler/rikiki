import type { IntCode, IntentPlan } from './intent.js';
/** What the parser needs of an element · a DOM `Element` satisfies it as it is. */
export interface ElementLike {
    localName: string;
    getAttribute(name: string): string | null;
    hasAttribute(name: string): boolean;
    readonly children: ArrayLike<ElementLike>;
    /** The attribute names, to say which one is unknown · `Element.getAttributeNames`. */
    getAttributeNames(): string[];
}
export type MarkKind = 'box' | 'text' | 'dot' | 'bar' | 'link' | 'group' | 'lane' | 'gate' | 'cursor' | 'meter' | 'queue' | 'curve' | 'state' | 'terminal' | 'table' | 'switch' | 'status' | 'timer' | 'band' | 'person' | 'screen' | 'counter' | 'pie' | 'columns' | 'waterfall' | 'panel' | 'camera';
export declare const MARK_TAGS: Readonly<Record<string, MarkKind>>;
/** How a mark moves · read by every mark, the root excepted. */
export declare const MOTION_ATTRIBUTES: readonly ["enter", "after", "step"];
/** How the root lays its panels out (`compose`, compose.ts) · a mechanism beside its
 *  track at 1.65 to 1, a model beside its incident, a body over its time axis, a
 *  panel inside a panel, four widgets of a dashboard. */
export declare const COMPOSES: readonly ["split", "model-incident", "body-axis", "inset", "dashboard"];
export type Compose = (typeof COMPOSES)[number];
/** What a camera names for the whole picture, every panel in the frame. */
export declare const CAMERA_ALL = "all";
/** A group or a panel · both hold marks and place them with their `layout`. */
export declare const isGroupLike: (node: {
    kind: MarkKind;
}) => boolean;
/** The attributes each mark reads · anything else is dropped without a word, so
 *  it is named. The table is the contract: the skill and the reference are
 *  generated from it. */
export declare const MARK_ATTRIBUTES: Readonly<Record<MarkKind, readonly string[]>>;
/** What a root may say, beside its children · the bounds and the global treatment. */
export declare const ROOT_ATTRIBUTES: readonly string[];
export declare const LAYOUTS: readonly ["row", "column", "grid", "layers", "ring", "lanes", "axis"];
export type Layout = (typeof LAYOUTS)[number];
/** The surfaces · `none` to `inverse` say how strong a surface is, the five after
 *  them say the part it plays, each with an icon in a disc of its colour: `pale` the
 *  context, `gold` the control, `ink` the target, `ok` what is sound, `bad` the
 *  incident. */
export declare const ROLE_PAINTS: readonly ["pale", "gold", "ink", "ok", "bad"];
/** The part a surface plays at a tone · none for a surface that does not say one. */
export declare function roleOf(paint: string, tone: string): string | undefined;
export declare const PAINTS: readonly ["none", "outline", "soft", "solid", "inverse", "pale", "gold", "ink", "ok", "bad"];
export type Paint = (typeof PAINTS)[number];
export declare const TONES: readonly ["normal", "muted", "accent", "ok", "warn", "danger"];
export declare const SIZES: readonly ["small", "normal", "large"];
export declare const GAPS: readonly ["tight", "normal", "airy"];
export declare const SIDES: readonly ["top", "right", "bottom", "left"];
export declare const ROUTES: readonly ["straight", "ortho"];
export declare const DIRECTIONS: readonly ["right", "down"];
export declare const ALIGNS: readonly ["start", "center", "end", "stretch"];
/** The hard ceilings · an author can tighten them (`max-marks`), never lift them. */
export declare const MAX_MARKS = 500;
export declare const MAX_DOTS = 400;
export declare const MAX_GROUP_DEPTH = 3;
export interface DgNode {
    kind: MarkKind;
    /** Attributes as written · `emphasis` and `dashed` are `'true'` when present. */
    attrs: Readonly<Record<string, string>>;
    children: DgNode[];
    /** Position in the source, depth first · what ties a tie. */
    index: number;
}
export type DgCode = 'DG_ATTR_UNKNOWN' | 'DG_VALUE_INVALID' | 'DG_REF_UNKNOWN' | 'DG_NAME_DUPLICATE' | 'DG_EMPHASIS_MANY' | 'DG_CHILD_UNKNOWN' | 'DG_BUDGET' | 'DG_DEPTH' | 'DG_EMPTY' | 'DG_MARK_PLACE' | 'DG_GATE_LANE_UNKNOWN' | 'DG_TOKENS_MANY' | 'DG_MOTION_CYCLE' | 'DG_MOTION_BUDGET' | 'DG_STATE_STEP' | 'DG_VALUE_RANGE' | 'DG_MORPH_CROWD' | 'DG_CURVE_POINTS' | 'DG_STEP_WORDS_UNSEEN' | 'DG_LINK_CROSSES' | 'DG_LABEL_BLOCKED' | 'DG_STORY_ATTR' | 'DG_MARK_EMPTY' | 'DG_TYPED_WIDE' | 'DG_ROWS_MISMATCH' | 'DG_STATUS_NO_TARGET' | 'DG_BAND_NO_CUT' | 'DG_TIMER_NO_VALUE' | 'DG_CHART_DATA' | 'DG_PANEL_PLACE' | 'DG_PANEL_APART' | 'DG_PANEL_INTENT' | 'DG_CAMERA_TARGET' | 'DG_CAMERA_ILLEGIBLE' | 'DG_CAMERA_STORY';
export interface DgIssue {
    code: DgCode | IntCode;
    severity: 'error' | 'warning';
    /** The marks concerned, by name or position. */
    items: string[];
    message: string;
    /** What was measured, and what the intent needed · said by the `INT_*` findings. */
    measurement?: Record<string, unknown>;
    expected?: unknown;
    fix?: {
        action: string;
        [detail: string]: unknown;
    };
}
/** An attribute list as a set of words · `from="web app"` names two marks. */
export declare const words: (value: string | undefined) => string[];
declare const nameOf: (node: DgNode) => string;
/** Panels nest this deep at most · a scope inside a scope inside a scope, the rings
 *  of a zoom from the code to the client. A panel is a sub-picture, not a group: the
 *  groups inside it nest as deep as they do at the root. */
export declare const MAX_PANEL_DEPTH = 4;
/** The tree as it stands on click `stage` · where siblings are `dg-state`s, the one
 *  whose `step` was reached last stands in their place, and the others are not
 *  there. A tree without states is returned as it is. */
export declare function treeAt(nodes: DgNode[], stage: number): DgNode[];
/** A number as an author writes it · `1 200`, `72,5`. NaN when it is not one. */
export declare const readNumber: (text: string) => number;
/** The maximum of a meter, 100 when unsaid. */
export declare const DEFAULT_METER_MAX = 100;
export interface ParsedDiagram {
    attrs: Readonly<Record<string, string>>;
    children: DgNode[];
    issues: DgIssue[];
    /** How many marks the diagram holds once repeats are counted. */
    marks: number;
    /** How many clicks it takes after the slide is entered · 0 for none. */
    stages: number;
    /** It holds `dg-state`s · each click is a picture of its own, and what two
     *  pictures share by name moves from one place to the other. */
    states: boolean;
    /** It plays one scene on entry (`play="enter"`, story.ts) · a per-click list is
     *  then the mark before and after its beat, and the slide takes no click. */
    story: boolean;
    /** What the diagram set out to demonstrate, and which marks play which part ·
     *  present when it was written with `intent` and compiled. */
    intent?: IntentPlan;
}
/** Turns a tree written as an intent into a tree of layouts · `intent.ts`. It runs
 *  before the writing is checked, so what it adds (links, waits, clicks) is checked
 *  like what the author wrote. `fresh` numbers the nodes it creates. */
export type CompileTree = (tree: {
    attrs: Record<string, string>;
    children: DgNode[];
}, fresh: () => number) => {
    attrs: Record<string, string>;
    children: DgNode[];
    issues: DgIssue[];
    intent?: IntentPlan;
};
/** Read a `<deck-diagram>` into a tree and name everything wrong with the writing ·
 *  compiled first when a compiler is given (`compileIntent`). */
export declare function parseDiagram(root: ElementLike, compile?: CompileTree): ParsedDiagram;
export { nameOf };
