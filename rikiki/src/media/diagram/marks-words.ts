// ════════════════════════════════════════════════════════════════
// RIKIKI · diagram, the words of the marks that tell a story
//
// What the parser checks about a terminal, a table, a switch, a status, a timer,
// a band, people, a screen and a counter, apart from how they are drawn
// (marks.ts) · it imports nothing, so the model and the layout share it without
// importing each other.
// ════════════════════════════════════════════════════════════════

/** The states a switch stands in, one word per click (or before and after its beat). */
export const SWITCH_STATES = ['on', 'off'] as const;
/** The states a status says · done, failed, still waiting. */
export const STATUS_STATES = ['ok', 'fail', 'wait'] as const;

/** A typed line holds this many characters at most · past it, a terminal is wider
 *  than a slide shows one, and the line is a paragraph, not a command. */
export const TERMINAL_MAX_CHARS = 56;
/** People in one row, and figured lines on one screen, are counted at a glance. */
export const MAX_PEOPLE = 12;
export const MAX_SCREEN_LINES = 10;
/** A screen shows this many figured lines when it does not say. */
export const DEFAULT_SCREEN_LINES = 5;

/** A list written one item per line (`lines`, `rows`, a table's `swap`) · blank lines
 *  and the indentation of the source are not part of it. */
export const linesOf = (value: string | undefined): string[] =>
  (value ?? '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
