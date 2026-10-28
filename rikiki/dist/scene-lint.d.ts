import type { IntCode } from './diagram/intent.js';
export declare const SCENE_KINDS: readonly ["cards", "steps", "flow", "bars", "matrix", "ranges", "lanes", "units"];
export type SceneKind = (typeof SCENE_KINDS)[number];
/** The kind of scene an element is, from its tag (`deck-scene-bars` → `bars`) ·
 *  null for a tag that is not one of ours, which then has nothing to lint. */
export declare function sceneKindOf(tagName: string): SceneKind | null;
/** An item as written · every attribute raw, null when absent. */
export interface ItemRecord {
    label: string | null;
    note: string | null;
    icon: string | null;
    tag: string | null;
    value: string | null;
    level: string | null;
    from: string | null;
    to: string | null;
    emphasis: boolean;
}
/** The attributes of `deck-scene-item`, which every scene accepts and none reads
 *  in full · the one element is the price of a single vocabulary. */
export declare const ITEM_ATTRIBUTES: readonly ["label", "note", "icon", "tag", "value", "level", "from", "to", "emphasis"];
/** What each scene reads of its items · kept equal to the code by a test that
 *  reads the scenes' sources, so an attribute can move without this going stale. */
export declare const SCENE_READS: Readonly<Record<SceneKind, readonly (typeof ITEM_ATTRIBUTES)[number][]>>;
/** Every code a scene or a diagram writes of itself (`data-scene-issues`), the
 *  intent findings apart (`INT_CODES`) · `rikiki check` lists, selects and
 *  configures them by this table (bin/lib/check-registry.mjs). */
export declare const SCENE_ISSUE_CODES: readonly ["SCENE_ITEMS_DROPPED", "SCENE_ATTRIBUTE_IGNORED", "SCENE_TOO_FEW_ITEMS", "SCENE_ITEM_NO_LABEL", "SCENE_ICON_UNKNOWN", "SCENE_VALUE_INVALID", "SCENE_GRID_TOO_DENSE", "SCENE_TOO_TALL", "SCENE_LEVEL_INVALID", "SCENE_EMPHASIS_MANY", "SCENE_LABEL_LONG", "SCENE_NOTE_LONG", "SCENE_TEXT_TOO_LONG", "SCENE_ATTRIBUTE_INVALID", "SCENE_GROUP_SPLIT", "SCENE_VALUE_CLIPPED", "SCENE_LAYOUT_INVALID", "SCENE_REGION_TOO_NARROW", "SCENE_EMPHASIS_SCATTERED", "DG_ATTR_UNKNOWN", "DG_VALUE_INVALID", "DG_REF_UNKNOWN", "DG_NAME_DUPLICATE", "DG_EMPHASIS_MANY", "DG_CHILD_UNKNOWN", "DG_BUDGET", "DG_DEPTH", "DG_EMPTY", "DG_NO_FIT", "DG_MARK_PLACE", "DG_GATE_LANE_UNKNOWN", "DG_TOKENS_MANY", "DG_MOTION_CYCLE", "DG_MOTION_BUDGET", "DG_STATE_STEP", "DG_VALUE_RANGE", "DG_MORPH_CROWD", "DG_CURVE_POINTS", "DG_STEP_WORDS_UNSEEN", "DG_LINK_CROSSES", "DG_LABEL_BLOCKED", "DG_STORY_ATTR", "DG_MARK_EMPTY", "DG_TYPED_WIDE", "DG_ROWS_MISMATCH", "DG_STATUS_NO_TARGET", "DG_BAND_NO_CUT", "DG_TIMER_NO_VALUE", "DG_CHART_DATA", "DG_PANEL_PLACE", "DG_PANEL_APART", "DG_PANEL_INTENT", "DG_CAMERA_TARGET", "DG_CAMERA_ILLEGIBLE", "DG_CAMERA_STORY"];
export type SceneIssueCode = (typeof SCENE_ISSUE_CODES)[number] | IntCode;
/** One field that did not fit its box, as the drawing measured it · the item and
 *  the field are what an author fixes, the widths say by how much. */
export interface Overflow {
    item: string;
    /** `label`, `note`, `tag`, `figure`, `caption`… the text that did not fit. */
    field: string;
    text?: string;
    /** Width the text asked for at the size it was drawn, and the width it had. */
    measured?: number;
    budget?: number;
    size?: number;
}
export interface SceneIssue {
    code: SceneIssueCode;
    /** A defect draws a wrong picture · a warning draws a right one that reads badly. */
    severity: 'error' | 'warning';
    /** The items concerned, by label (by position when they have none). */
    items: string[];
    message: string;
    /** For `SCENE_TEXT_TOO_LONG` · each field that did not fit, with its measure. */
    fields?: Overflow[];
    /** What the scene was when it said so · the shape, its canvas width and its item
     *  count, so a reader can look up how much a field holds there. */
    scene?: {
        kind: string;
        width: number;
        count: number;
    };
    /** What was measured, and what was needed · a diagram's intent says both. */
    measurement?: Record<string, unknown>;
    expected?: unknown;
    /** What to do about it, by name, with the numbers that size it · a diagram says it. */
    fix?: {
        action: string;
        [detail: string]: unknown;
    };
}
/** The scene's own attributes the lint needs. */
export interface SceneContext {
    columns?: string | null;
    passed?: string | null;
    blocked?: string | null;
    total?: string | null;
    max?: string | null;
    height?: string | null;
    scale?: string | null;
    /** The scene's canvas width in units · the whole 1600 unless it is composed. */
    width?: number;
}
/** `SCENE_TEXT_TOO_LONG` from what the drawing measured · it names the field, so
 *  "shorten the label" is not said about a figure that is too wide. */
export declare function overflowIssue(kind: string, fields: Overflow[], scene?: {
    width: number;
    count: number;
}): SceneIssue | null;
/** A drawing taller than a slide leaves room for · known only once it is drawn,
 *  so the element asks after rendering, with the height it came to. */
export declare function heightIssue(kind: string, height: number, items: number): SceneIssue | null;
/** Everything an author wrote that a scene would draw wrong or not at all. */
export declare function lintScene(kind: SceneKind, items: ItemRecord[], scene?: SceneContext): SceneIssue[];
