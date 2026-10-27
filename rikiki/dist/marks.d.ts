import { type ColumnsParts, type PieParts, type WaterfallParts } from './charts.js';
import type { LText } from './layout.js';
import { type DgNode, type Paint } from './model.js';
import type { Block } from './types.js';
type Role = LText['role'];
type Rect = {
    x: number;
    y: number;
    w: number;
    h: number;
};
type Spot = {
    x: number;
    y: number;
};
/** What the marks need to set text · `layout.ts` gives it, a test fakes it. */
export interface TextEnv {
    /** A text in a role, wrapped into `width`, its corner at `x`, `y`. */
    set(role: Role, text: string, width: number, x: number, y: number): LText;
    /** The width of a text on one line in a role. */
    width(role: Role, text: string): number;
    /** A figure written as a number, with the decimal sign of the deck. */
    figure(written: string): string;
}
export declare const PIECE_KINDS: readonly ["terminal", "table", "switch", "timer", "band", "person", "screen", "counter", "pie", "columns", "waterfall"];
export type PieceKind = (typeof PIECE_KINDS)[number];
export declare const isPiece: (kind: string) => kind is PieceKind;
/** A typed line is set in the deck's monospace at the size of a note · the width of
 *  a character is this share of the size (Space Mono is 0.61, JetBrains Mono 0.6). */
export declare const MONO_SIZE = 25;
export declare const MONO_ADVANCE = 0.62;
export interface TerminalLine {
    text: LText;
    /** A command, typed one character after the other · a result line comes in whole. */
    typed: boolean;
    /** Its length in characters, and on screen. */
    chars: number;
    width: number;
    /** The prompt at its head, in characters (`$ `) · drawn in the accent. */
    prompt: number;
    /** The mark of a result at its head (`✓`, `✗`) · drawn in its state's colour. */
    result?: 'ok' | 'fail';
}
export interface TerminalParts {
    bar: Rect;
    title?: LText;
    lines: TerminalLine[];
    /** Where the cursor rests, after the last line. */
    cursor: Rect;
    texts: LText[];
}
/** When each line of a terminal is typed, in seconds from the start of its act. */
export declare function typingPlan(lines: Pick<TerminalLine, 'typed' | 'chars'>[]): {
    lines: {
        start: number;
        duration: number;
    }[];
    total: number;
};
export interface TableRow {
    rect: Rect;
    /** What it says before its beat · the row at rest says `after` when it swaps. */
    before: LText;
    after?: LText;
    struck: boolean;
    /** How wide its words are at rest · how far a strike runs. */
    textW: number;
}
export interface TableParts {
    icon?: {
        name: string;
        x: number;
        y: number;
        size: number;
    };
    label?: LText;
    rows: TableRow[];
    /** Where each row comes from when it is carried from another table (`from`), as an
     *  offset from where it rests · set once every mark is placed. */
    travel?: {
        dx: number;
        dy: number;
    }[];
    texts: LText[];
}
export declare function tablePhases(rows: number, carried: boolean, changed: number, strikes: boolean): {
    carry?: [number, number];
    change?: [number, number];
    strike?: [number, number];
    total: number;
};
/** When each of `count` things of an act starts and how long it lasts, as shares of
 *  the slice they share · `length` each, `stagger` apart, the slice their sum. */
export declare function staggered(count: number, length: number, stagger: number): {
    from: number;
    share: number;
}[];
export declare const CARRY_SECONDS = 1;
export declare const CARRY_STAGGER_SECONDS = 0.14;
export declare const CHANGE_SECONDS = 0.45;
export declare const CHANGE_STAGGER_SECONDS = 0.3;
export interface SwitchParts {
    label?: LText;
    track: Rect;
    knob: {
        on: Spot;
        off: Spot;
        r: number;
    };
    words: {
        on: LText;
        off: LText;
    };
    /** The state on each click, the last holding · before and after its beat in a story. */
    states: string[];
    texts: LText[];
}
/** The figures a rolling value shows, from `from` to the value written, each with the
 *  share of the roll it shows from · whole steps when there are few, else eased so it
 *  slows into its last value. The last is the value as written (its unit kept). */
export declare function rollingFigures(env: TextEnv, written: string, from: number, unit: string | undefined, ease: boolean): {
    text: string;
    at: number;
}[];
export interface TimerParts {
    ring: {
        x: number;
        y: number;
        r: number;
        stroke: number;
    };
    icon: {
        name: string;
        x: number;
        y: number;
        size: number;
    };
    /** The figures it counts through, the last the delay at rest, each from a share. */
    figures: {
        text: LText;
        at: number;
    }[];
    label?: LText;
    texts: LText[];
}
export interface CounterParts {
    figures: {
        text: LText;
        at: number;
    }[];
    label?: LText;
    texts: LText[];
}
export interface BandParts {
    label?: LText;
    note?: LText;
    track: Rect;
    /** The time it ran as it should, the void after the cut, and the time after it. */
    normal: Rect;
    gap: Rect;
    after?: Rect;
    /** The regular events of the normal time · short strokes across it. */
    ticks: {
        x: number;
        y: number;
        h: number;
    }[];
    cut: {
        x: number;
        y: number;
        h: number;
    };
    /** The word at the cut, above it · when it broke. */
    tag?: LText;
    /** The brace under the void, and how long it lasted. */
    brace?: Rect;
    braceLabel?: LText;
    texts: LText[];
}
export declare function bandPhases(): {
    cut: [number, number];
    void: [number, number];
    brace: [number, number];
    total: number;
};
export interface PersonParts {
    caption?: LText;
    people: {
        x: number;
        y: number;
        size: number;
    }[];
    /** How many of them are missing (the last ones), before and after its beat. */
    absent: {
        before: number;
        after: number;
    };
    texts: LText[];
}
/** People go missing one after the other, this far apart, each in this long. */
export declare const ABSENT_STAGGER = 0.22;
export declare const ABSENT_SECONDS = 0.4;
export interface ScreenParts {
    bar: Rect;
    dots: Spot[];
    address: Rect;
    addressText?: LText;
    heading?: LText;
    /** Lines that figure text · they say how much there is without a word. */
    texture: Rect[];
    texts: LText[];
}
export type PieceParts = ({
    kind: 'terminal';
} & TerminalParts) | ({
    kind: 'table';
} & TableParts) | ({
    kind: 'switch';
} & SwitchParts) | ({
    kind: 'timer';
} & TimerParts) | ({
    kind: 'band';
} & BandParts) | ({
    kind: 'person';
} & PersonParts) | ({
    kind: 'screen';
} & ScreenParts) | ({
    kind: 'counter';
} & CounterParts) | ({
    kind: 'pie';
} & PieParts) | ({
    kind: 'columns';
} & ColumnsParts) | ({
    kind: 'waterfall';
} & WaterfallParts);
/** A mark that tells a story, placed · its parts are where they are drawn. */
export type LPiece = PieceParts & {
    key: string;
    node: DgNode;
    x: number;
    y: number;
    w: number;
    h: number;
    tone: string;
    emphasis: boolean;
    paint: Paint;
};
/** How wide a mark can be drawn · it is as wide as what it says, a band and a
 *  screen stretch with the room. */
export declare function pieceBlock(env: TextEnv, node: DgNode, key: string, hasIcon: (name: string) => boolean): Block;
/** A mark laid out at a width · its parts as offsets from its corner, and its height. */
export declare function layPiece(env: TextEnv, node: DgNode, width: number, hasIcon: (name: string) => boolean): PieceParts & {
    h: number;
};
/** Parts moved by `dx`, `dy` · every `x` and `y` of them, a copy. Offsets (`dx`, `dy`)
 *  and sizes stay. */
export declare function moved<T>(parts: T, dx: number, dy: number): T;
/** What a mark does on its beat, in seconds written · 0 when it has nothing to do
 *  (it then comes in, or stands from the start, as it is at rest). */
export declare function actSeconds(piece: LPiece): number;
/** A timer fills, a counter counts, in this long when the author does not say. */
export declare const TIMER_SECONDS = 2;
export declare const COUNTER_SECONDS = 1.4;
export {};
