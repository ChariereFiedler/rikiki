// ════════════════════════════════════════════════════════════════
// RIKIKI · shared CSS-grid helpers
// Pure string→string mappers shared by deck-grid and deck-bento · no DOM,
// unit-testable in the node env.
// ════════════════════════════════════════════════════════════════

/** `cols`/`rows` value · integer 1..12 → `repeat(N, minmax(0, 1fr))`, else the
 *  value is passed through as an explicit track template ("1fr 2fr"). */
export function expandTracks(value: string | undefined): string | null {
  if (!value) return null;
  const n = parseInt(value, 10);
  if (!Number.isNaN(n) && String(n) === value.trim() && n >= 1 && n <= 12) {
    return `repeat(${n}, minmax(0, 1fr))`;
  }
  return value;
}

/** `gap` value · integer 1..6 → `var(--rik-space-N)`, else any CSS length. */
export function expandGap(value: string | undefined): string | null {
  if (!value) return null;
  const n = parseInt(value, 10);
  // Same guard as expandTracks · only a bare integer is a token index. Without
  // `String(n) === value.trim()`, a length like "2rem" (parseInt → 2) would be
  // swallowed as var(--rik-space-2) instead of passing through as the length.
  if (!Number.isNaN(n) && String(n) === value.trim() && n >= 1 && n <= 6) {
    return `var(--rik-space-${n})`;
  }
  return value;
}

export interface CellSpan {
  /** grid-column value */
  col: string;
  /** grid-row value */
  row: string;
}

/** Turn one axis of a span into a grid-* value · a positive integer becomes
 *  `span N`, anything else (raw line syntax like "1 / 3") passes through. */
export function toTrack(value: string | undefined): string {
  if (!value) return 'auto';
  const trimmed = value.trim();
  return /^\d+$/.test(trimmed) ? `span ${trimmed}` : trimmed;
}

/** Parse a bento cell span. Accepts "CxR" (e.g. "2x1"), a bare column count
 *  ("2" → span 2 columns, 1 row), or empty (→ a single auto-placed cell). */
export function parseSpan(value: string | undefined): CellSpan {
  if (!value) return { col: 'auto', row: 'auto' };
  const [c, r] = value.toLowerCase().split('x');
  return { col: toTrack(c), row: toTrack(r) };
}
