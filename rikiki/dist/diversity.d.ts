import { type Motif, type Progress } from './deck-motifs.js';
import type { InkModel } from './ill-rules.js';
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
    visual: VisualSignature & {
        thumb: number[];
    };
}
/** Every weight and threshold, in one place, with where it comes from. */
export declare const DIVERSITY_LIMITS: Readonly<{
    /** D = 0.5 structure + 0.3 visual + 0.2 time · what a drawing IS matters most,
     *  how it moves least (two stills of different shapes are different pictures). */
    weights: Readonly<{
        structure: 0.5;
        visual: 0.3;
        time: 0.2;
    }>;
    /** Under this distance two drawings are one look twice · a clone with other words
     *  measures under 0.05, two graphs of the same layout and size about 0.12, a graph
     *  beside a chart over 0.4. */
    repeated: 0.15;
    /** The thumbnail · 8 columns by 4 rows of the drawing's frame. */
    thumbCols: 8;
    thumbRows: 4;
    /** What a gallery aims at · per hundred illustrations, distinct structures; intents
     *  covered; the largest share one family may take. */
    targets: Readonly<{
        structuresPer100: 40;
        intents: 12;
        familyShare: 0.1;
    }>;
}>;
/** Where the ink of a drawing sits, on a grid over its frame · each cell from 0 to 1,
 *  the heaviest cell 1, so a small drawing and a large one of the same shape match. */
export declare function thumbOf(model: InkModel): number[];
/** The signature of a drawing as `check` saw it · what the diagram wrote of itself,
 *  or only its tag for a drawing that says nothing, and the thumbnail of its ink. */
export declare function signatureFromInk(kind: string, model: InkModel, declared?: DiagramSignature | null): Signature;
export declare function structureDistance(a: StructureSignature, b: StructureSignature): number;
export declare function visualDistance(a: VisualSignature, b: VisualSignature): number;
export declare function timeDistance(a: TimeSignature, b: TimeSignature): number;
export interface Distance {
    d: number;
    structure: number;
    visual: number;
    time: number;
}
/** D between two drawings, and its three parts · 0 the same look, 1 nothing shared. */
export declare function distance(a: DiagramSignature, b: DiagramSignature): Distance;
/** A structure written as a key · two drawings with the same key are one structure
 *  with other words or other counts. Links are counted in bands (none, a few, some,
 *  many), so one arrow more is not a new structure. */
export declare function structuralKey(s: StructureSignature): string;
/** The family a drawing belongs to · its intent, else the layouts it is written in,
 *  else the element that drew it. */
export declare function familyOf(s: StructureSignature): string;
export interface GalleryEntry {
    slide: number;
    slideId?: string | null;
    element?: string;
    signature: DiagramSignature;
    /** Its named marks and their words, its act · whether it moves on from a look-alike. */
    motif?: Motif | null;
}
export interface ClosePair {
    a: {
        slide: number;
        slideId?: string | null;
    };
    b: {
        slide: number;
        slideId?: string | null;
    };
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
    largestFamily: {
        name: string;
        count: number;
        share: number;
    } | null;
    /** Pairs closer than `repeated`, the closest first. */
    repeated: ClosePair[];
    /** Pairs as close, whose later drawing moves on from the earlier (a step, a scope,
     *  figures, a state) · a motif of the deck, not the same picture twice. */
    progressing: ClosePair[];
    /** The mean distance of each drawing to its nearest neighbour. */
    meanNearest: number;
    /** Where each target stands. */
    targets: {
        structuresPer100: boolean;
        intents: boolean;
        familyShare: boolean;
    };
    /** Every distance · row and column in the order given. */
    matrix: number[][];
}
/** Compare every drawing of a gallery with every other. */
export declare function measureDiversity(entries: readonly GalleryEntry[]): DiversityReport;
export interface DiversityIssue {
    code: 'ILL_REPEATED_LOOK';
    severity: 'warning';
    /** The later slide of the pair · where the reader goes to change it. */
    slide: number;
    slideId: string | null;
    message: string;
    measurement: Record<string, number | string | number[]>;
    fix: {
        action: string;
        [detail: string]: unknown;
    };
}
/** One warning per pair of drawings that are the same look twice · about the deck,
 *  not about either slide alone. */
export declare function repeatedLookIssues(report: DiversityReport): DiversityIssue[];
