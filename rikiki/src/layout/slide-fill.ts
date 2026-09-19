// ════════════════════════════════════════════════════════════════
// RIKIKI · vertical distribution of a slide body
//
// A slide body already takes the height left under the title, but its children
// stack at the top, so a short slide leaves most of the canvas empty. Two
// opt-in knobs share that space:
//
//   spread="between|around|evenly|center|end|start"  distribute the leftover
//   fill                                             children take it instead
//
// Pure and DOM-free so the mapping is unit-testable · the components only
// apply the value it returns.
// ════════════════════════════════════════════════════════════════

/** The `spread` vocabulary, and the flexbox value each one means. */
export const SPREAD = new Map<string, string>([
  ['start', 'flex-start'],
  ['center', 'center'],
  ['end', 'flex-end'],
  ['between', 'space-between'],
  ['around', 'space-around'],
  ['evenly', 'space-evenly'],
]);

/** Resolve a `spread` attribute to its flexbox value.
 *
 *  An unknown value falls back to the default distribution instead of being
 *  passed through: a typo must degrade to the documented default, never remove
 *  the layout it was meant to change. */
export function spreadValue(raw: string | null | undefined): string {
  const key = (raw ?? '').trim().toLowerCase();
  // Absent, unknown, or the explicit word `theme` · defer to the theme default
  // (--rik-slide-spread), which the layouts read behind this value.
  if (key === '' || key === 'theme') return '';
  return SPREAD.get(key) ?? '';
}
