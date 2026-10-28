// ════════════════════════════════════════════════════════════════
// RIKIKI · diagram, the words of a story
//
// What `play="enter"` reads, apart from how it is timed (story.ts) · the parser
// checks the writing with it, and imports nothing, so the model and the story
// engine share it without importing each other.
// ════════════════════════════════════════════════════════════════

export const BEATS = ['steady', 'event', 'spread', 'effect', 'proof'] as const;
export type Beat = (typeof BEATS)[number];

/** How a story is played · on entry, with no click. */
export const PLAYS = ['enter'] as const;

/** What a story may last once played, unless its root says otherwise (`budget`),
 *  and the most it may ever say. */
export const STORY_BUDGET = 10;
export const STORY_MAX_BUDGET = 12;

/** The attributes only a story reads · on a diagram that plays on clicks they are
 *  dropped, and said. */
export const STORY_ATTRIBUTES = [
  'beat',
  'with',
  'duration',
  'swap',
  'swap-icon',
  'proof',
  'dim',
  'steady',
  'turn',
  'lever',
] as const;

/** `3s`, `3 s`, `2,5s`, `800ms`, `3` → seconds · NaN when it is not a duration. */
export function readSeconds(text: string | undefined): number {
  const match = /^\s*(\d+(?:[.,]\d+)?)\s*(ms|s)?\s*$/.exec(text ?? '');
  if (!match) return Number.NaN;
  const value = Number(match[1]!.replace(',', '.'));
  return match[2] === 'ms' ? value / 1000 : value;
}

/** Whether a story may last this long, written · the bound the parser checks. */
export const isStoryDuration = (seconds: number): boolean =>
  seconds > 0 && seconds <= STORY_MAX_BUDGET;

/** A duration of a story as it is played · the one written when it is one,
 *  `fallback` (the diagram's own) when it is written and is not (`DG_VALUE_INVALID`
 *  says so), NaN when nothing is written. */
export function storySeconds(text: string | undefined, fallback: number): number {
  if (text === undefined) return Number.NaN;
  const seconds = readSeconds(text);
  return isStoryDuration(seconds) ? seconds : fallback;
}
