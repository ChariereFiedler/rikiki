// ════════════════════════════════════════════════════════════════
// RIKIKI · deck-scene-matrix layout, the pure part
//
// Reading what an author wrote in attributes (columns, groups, status words,
// one level per column) and the two sequences the drawing needs (the legend
// order, the pop delays). Kept apart from the element so it runs, and is
// tested, without a browser.
// ════════════════════════════════════════════════════════════════

/** From furthest along to nothing yet · the legend follows this order. */
export const STATUSES = ['prod', 'pilot', 'test', 'announced', 'none'] as const;
export type Status = (typeof STATUSES)[number];

export const MAX_COLUMNS = 12;

export const DEFAULT_STATUS_WORDS: Readonly<Record<Status, string>> = Object.freeze({
  prod: 'in production',
  pilot: 'pilot',
  test: 'in test',
  announced: 'announced',
  none: 'nothing yet',
});

export interface Group {
  name: string;
  start: number;
  count: number;
}

const isStatus = (word: string): word is Status => (STATUSES as readonly string[]).includes(word);

const entries = (attribute: string | undefined) =>
  (attribute ?? '')
    .split('|')
    .map((entry) => entry.trim())
    .filter(Boolean);

export function parseColumns(attribute: string | undefined): string[] {
  return entries(attribute).slice(0, MAX_COLUMNS);
}

/** `name:count` pairs laid side by side from the first column. The count is
 *  read after the last colon, so a name may hold one. A group that runs past
 *  the last column is cut there · the drawing has no column to put it on. */
export function parseGroups(attribute: string | undefined, columnCount: number): Group[] {
  const groups: Group[] = [];
  let start = 0;
  for (const entry of entries(attribute)) {
    const colon = entry.lastIndexOf(':');
    const count = colon < 0 ? Number.NaN : Number(entry.slice(colon + 1));
    if (!Number.isInteger(count) || count <= 0 || start >= columnCount) continue;
    groups.push({
      name: entry.slice(0, colon).trim(),
      start,
      count: Math.min(count, columnCount - start),
    });
    start += count;
  }
  return groups;
}

/** `status=word` pairs over the English defaults · the deck's language is the
 *  author's, and only the words the author changed need writing. */
export function parseStatusWords(attribute: string | undefined): Record<Status, string> {
  const words: Record<Status, string> = { ...DEFAULT_STATUS_WORDS };
  for (const entry of entries(attribute)) {
    const equals = entry.indexOf('=');
    const status = entry.slice(0, equals).trim();
    const word = entry.slice(equals + 1).trim();
    if (equals > 0 && isStatus(status) && word) words[status] = word;
  }
  return words;
}

/** One status per column. A missing or unknown one reads as `none` · the dot
 *  that says "nothing" is the honest default for a column nobody filled in. */
export function parseLevels(attribute: string | null, columnCount: number): Status[] {
  const words = (attribute ?? '').trim().split(/\s+/);
  return Array.from({ length: columnCount }, (_, i) => {
    const word = words[i] ?? '';
    return isStatus(word) ? word : 'none';
  });
}

/** The words of a row that did not fit their column, each text once · all of
 *  them, not the first: a second word wider than its column runs into the next
 *  one, and only a word that is named is not silent. */
export function unfitWords<T extends { lines: string[]; fits: boolean }>(words: T[]): T[] {
  const named = new Set<string>();
  return words.filter((word) => {
    const text = word.lines.join(' ');
    if (word.fits || named.has(text)) return false;
    named.add(text);
    return true;
  });
}

/** The statuses that appear, once each, in the order of the scale · a legend
 *  entry for a dot nobody can find on the slide is noise. */
export function legendStatuses(levels: Status[][]): Status[] {
  const present = new Set(levels.flat());
  return STATUSES.filter((status) => present.has(status));
}

const MS = 1000;
const toMs = (seconds: number) => Math.round(seconds * MS) / MS;

/** When each dot pops, in seconds · column by column along a row, then the next
 *  row. The step is `maxStep` unless that would start the last dot after
 *  `lastStart`, then it tightens, so a full twelve-column grid still lands in time. */
export function dotDelays(
  rows: number,
  columns: number,
  start: number,
  maxStep: number,
  lastStart: number,
): number[][] {
  const count = rows * columns;
  const step = count > 1 ? Math.min(maxStep, (lastStart - start) / (count - 1)) : 0;
  return Array.from({ length: rows }, (_, row) =>
    Array.from({ length: columns }, (_, column) => toMs(start + (row * columns + column) * step)),
  );
}

/** Entries of these widths placed left to right, wrapping to a new line when
 *  the next one would run past `maxWidth`. */
export function flowLine(
  widths: number[],
  gap: number,
  maxWidth: number,
): { x: number; line: number }[] {
  let x = 0;
  let line = 0;
  return widths.map((width) => {
    if (x > 0 && x + width > maxWidth) {
      x = 0;
      line += 1;
    }
    const placed = { x, line };
    x += width + gap;
    return placed;
  });
}
