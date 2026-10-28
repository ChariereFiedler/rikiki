// ════════════════════════════════════════════════════════════════
// RIKIKI · diagram, the words of the charts
//
// What the parser checks about a pie, columns and a waterfall, apart from how
// they are drawn (charts.ts) · it imports nothing, so the model and the layout
// share it without importing each other.
// ════════════════════════════════════════════════════════════════

/** A pie reads at a glance with two to six parts · past six, the small ones are
 *  slivers nobody tells apart, and they belong together as "other". */
export const SLICES_MIN = 2;
export const SLICES_MAX = 6;
/** Columns compare two to twelve things, in one to three series side by side. */
export const COLUMNS_MIN = 2;
export const COLUMNS_MAX = 12;
export const SERIES_MAX = 3;
/** A waterfall starts from a total and walks two to ten steps to the next one. */
export const STEPS_MIN = 2;
export const STEPS_MAX = 11;

/** How a pie is drawn · a ring with the figure of the whole in its hole, or a full disc. */
export const PIE_SHAPES = ['ring', 'pie'] as const;

/** A figure as an author writes it at the end of a line · `42`, `72,5`, `3.2`, and
 *  in a waterfall a step up or down, `+12`, `−8`. */
const FIGURE = /^[+−-]?\d+(?:[.,]\d+)?$/;

/** The number a figure says · its sign and its decimal comma read. */
export const figureValue = (figure: string): number =>
  Number(figure.replace('−', '-').replace('+', '').replace(',', '.'));

/** A line of a chart · its words, then its figures (`Juin 42 51` is the column
 *  "Juin" at 42 and 51). The figures are the numbers at its end, `most` of them at
 *  most (one per series), so words may end with a number of their own (`marge 2025
 *  120` is the step "marge 2025" at 120). */
export function chartRow(
  line: string,
  most = Number.POSITIVE_INFINITY,
): { label: string; figures: string[] } {
  const tokens = line.split(/\s+/).filter(Boolean);
  let cut = tokens.length;
  while (cut > 0 && tokens.length - cut < most && FIGURE.test(tokens[cut - 1]!)) cut -= 1;
  return { label: tokens.slice(0, cut).join(' '), figures: tokens.slice(cut) };
}
