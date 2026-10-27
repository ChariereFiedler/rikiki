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
export declare const ILL_CODES: readonly ["ILL_ESCAPE", "ILL_OFF_CENTRE", "ILL_MARGIN_UNEVEN", "ILL_SPARSE", "ILL_NEAR_ALIGN", "ILL_RHYTHM", "ILL_SHAPE_OVERLAP", "ILL_TEXT_OVER_SHAPE", "ILL_FOCAL_MANY", "ILL_FOCAL_WEAK", "ILL_TYPE_SCALE", "ILL_WORDY", "ILL_MOTION_LONG", "ILL_MOTION_ENDLESS", "ILL_NO_STEADY_STATE", "ILL_STORY_NO_PROOF", "ILL_FINAL_INCOMPLETE", "ILL_BEAT_OVERLAP"];
export type IllCode = (typeof ILL_CODES)[number];
export interface IllIssue {
    code: IllCode;
    severity: IllSeverity;
    message: string;
    /** What was measured, and against what · the numbers behind the message. */
    measurement: Record<string, number | string | string[]>;
    /** What to do about it, by name, for a reader that does not parse sentences. */
    fix?: {
        action: string;
        [detail: string]: unknown;
    };
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
export declare const ILL_LIMITS: Readonly<{
    /** Ink past the frame by more than this is an escape · the stroke antialiasing
     *  of a shape on the frame edge is under it (same value as SVG_TEXT_ESCAPES). */
    escapePx: 2;
    /** The visual centre of mass may sit this far from the centre of the room before
     *  the drawing is said to lean · 8% of the width, 10% of the height. Measured on
     *  the scenes, whose gate and emphasis sit up to 6% off by design. */
    offCentreX: 0.08;
    offCentreY: 0.15;
    /** The lean in height is a share of the drawing's height, but never of less than
     *  this share of its width · a strip as wide as a slide and a sixth as tall (a row
     *  of boxes, a link going round them above) was said to lean 20% for 36px, which
     *  no one sees. 0.375 is the height a diagram plans for its width (600 for 1600). */
    flatReference: 0.375;
    /** Left and right margins of the ink may differ by this share of the width. */
    marginUneven: 0.06;
    /** The ink must fill at least this share of the room to read as a drawing and
     *  not as a few marks in a large space. */
    sparse: 0.4;
    /** Edges of two shapes closer than this but not equal are a failed alignment ·
     *  under 1.5px they are the same edge (one pixel is rounding, and the eye does not
     *  see it), over 6px a deliberate offset. */
    alignMinPx: 1.5;
    alignMaxPx: 6;
    /** Gaps between neighbours vary less than this (coefficient of variation) or the
     *  rhythm reads as irregular · needs three gaps to mean anything. */
    rhythmCv: 0.15;
    /** A gap this many times the median one separates two groups (two panels, a
     *  closing band under a list) and is not part of the rhythm. */
    groupGapRatio: 3;
    /** Shapes overlapping by more than this on both axes, neither holding the other. */
    overlapPx: 2;
    /** One thing put forward · a second separate accent region says there are two. */
    focalMax: 1;
    /** Accent shapes this close are one region (a card made of two rects). */
    touchPx: 4;
    /** The accent region must be at least this much heavier than the next heaviest
     *  region, or nothing is put forward · and a fill in the accent weighs double its
     *  area, since colour puts a card forward at equal size (the scenes do exactly
     *  that), so only an accent that is much SMALLER than its neighbours is weak. */
    focalWeakRatio: 1.2;
    accentBoost: 2;
    /** At most this many font sizes, none within this ratio of the next. */
    typeSizes: 4;
    typeRatioMin: 1.15;
    /** Words on the drawing · a slide is read from the back of the room. Five rows
     *  with a note and a tag each, the scenes' own ceiling, come to about 50; the
     *  hand-drawn slides of a real 86-slide deck run from 70 to 160 words, so a limit
     *  under 90 would flag most of what its author meant. */
    words: 90;
    /** Motion · a drawing that is still moving after 3s is waiting to be understood. */
    motionWarnMs: 3000;
    motionErrorMs: 5000;
    /** A story is a scene, not an entrance · it may last its own budget (10 s unless
     *  it says otherwise), never past 12 s, a quarter second of rounding allowed. The
     *  remedies of the recipes play in 6.5 s, 8 s at most. */
    storyMaxMs: 12000;
    storyToleranceMs: 250;
    /** The system runs this long before it breaks, or the room never saw it run · the
     *  talk lets 28 tokens pass for 3 s before its kill switch. */
    steadyMinMs: 1500;
    /** Two beats of a story start this far apart at least · the talk never puts two
     *  events in the same half second. */
    beatGapMs: 500;
}>;
/** A threshold of the table, by name · what a deck's `check.limits` may set (`ill.<name>`). */
export type IllLimit = keyof typeof ILL_LIMITS;
export type IllLimits = Readonly<Record<IllLimit, number>>;
export interface IllVerdict {
    /** 0 to 100 · ranks variants, never overrules a defect. */
    score: number;
    /** `fail` if any defect, else by the score: 85 ships, 70 is reread, under it is redone. */
    verdict: 'ship' | 'reread' | 'redo' | 'fail';
    facets: Record<Facet, number>;
    issues: IllIssue[];
}
/** Run every rule on an ink model and say how it did · `limits` sets some thresholds
 *  of the table for this drawing (a deck's `check.limits`), the rest keep theirs. */
export declare function lintIllustration(model: InkModel, limits?: Partial<IllLimits>): IllVerdict;
/** The score, the facets and the verdict of a set of findings · what a drawing is
 *  worth once a deck's policy has dropped some findings or changed their severity. */
export declare function scoreIssues(issues: readonly Pick<IllIssue, 'code' | 'severity' | 'facet'>[]): Omit<IllVerdict, 'issues'>;
