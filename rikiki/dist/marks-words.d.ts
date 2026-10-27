/** The states a switch stands in, one word per click (or before and after its beat). */
export declare const SWITCH_STATES: readonly ["on", "off"];
/** The states a status says · done, failed, still waiting. */
export declare const STATUS_STATES: readonly ["ok", "fail", "wait"];
/** A typed line holds this many characters at most · past it, a terminal is wider
 *  than a slide shows one, and the line is a paragraph, not a command. */
export declare const TERMINAL_MAX_CHARS = 56;
/** People in one row, and figured lines on one screen, are counted at a glance. */
export declare const MAX_PEOPLE = 12;
export declare const MAX_SCREEN_LINES = 10;
/** A screen shows this many figured lines when it does not say. */
export declare const DEFAULT_SCREEN_LINES = 5;
/** A list written one item per line (`lines`, `rows`, a table's `swap`) · blank lines
 *  and the indentation of the source are not part of it. */
export declare const linesOf: (value: string | undefined) => string[];
