// ════════════════════════════════════════════════════════════════
// RIKIKI · proportion arithmetic for <deck-bar>
//
// Pure and DOM-free, so "does a 0/0 bar render, and does a stack of five
// rounded percentages still add up to 100?" is a unit test rather than a
// squint at a projector.
// ════════════════════════════════════════════════════════════════

/** One slice of a bar · a share of the whole with a label and a tone. */
export interface Segment {
  readonly label: string;
  readonly value: number;
  readonly tone?: string;
}

export interface SizedSegment extends Segment {
  /** Share of the total, 0..100, rounded for display. */
  readonly percent: number;
  /** Exact share before rounding · used to lay the bar out without drift. */
  readonly exact: number;
}

/** Parse the `segments` attribute · `label:value:tone` triples separated by
 *  `|`, because a deck author writes attributes, not JSON. The tone is
 *  optional; a malformed triple is skipped rather than rendered as garbage. */
export function parseSegments(raw: string | null | undefined): Segment[] {
  if (!raw) return [];
  return raw
    .split('|')
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const [label = '', value = '', tone = ''] = chunk.split(':').map((s) => s.trim());
      // An EMPTY value is malformed, not zero · `Number('')` is 0, which would
      // draw a nameless zero-width slice instead of skipping the typo.
      return { label, value: value === '' ? Number.NaN : Number(value), tone: tone || undefined };
    })
    .filter((s) => s.label.length > 0 && Number.isFinite(s.value) && s.value >= 0);
}

/**
 * Size each segment against the total.
 *
 * `total` defaults to the sum, which is what a stacked bar wants. Passing a
 * larger one is what makes "160 of 538" show the remaining 70% as empty track.
 *
 * Rounding is corrected on the largest segment so the displayed percentages
 * always add to 100 · five segments of 16.67 must not print as 85.
 */
export function sizeSegments(segments: readonly Segment[], total?: number): SizedSegment[] {
  const sum = segments.reduce((acc, s) => acc + Math.max(0, s.value), 0);
  const whole = total !== undefined && total > 0 ? total : sum;
  if (whole <= 0) return segments.map((s) => ({ ...s, percent: 0, exact: 0 }));

  const sized = segments.map((s) => {
    const exact = (Math.max(0, s.value) / whole) * 100;
    return { ...s, exact, percent: Math.round(exact) };
  });

  // Only a partition must add up to exactly 100. With an explicit total the bar
  // measures a part of a stated whole: 160 of 538 is 30%, and 90 of 50 is 180%,
  // which the component caps visually while the figure stays honest.
  if (total !== undefined && total > 0) return sized;

  const drift = 100 - sized.reduce((acc, s) => acc + s.percent, 0);
  if (drift === 0 || sized.length === 0) return sized;
  let biggest = 0;
  for (let i = 1; i < sized.length; i++) {
    if (sized[i]!.exact > sized[biggest]!.exact) biggest = i;
  }
  sized[biggest] = { ...sized[biggest]!, percent: sized[biggest]!.percent + drift };
  return sized;
}

/** The share of the track left empty · 0 for a stacked bar that fills it. */
export function remainder(sized: readonly SizedSegment[]): number {
  const used = sized.reduce((acc, s) => acc + s.exact, 0);
  return Math.max(0, 100 - used);
}
