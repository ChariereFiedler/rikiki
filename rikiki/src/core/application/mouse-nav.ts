// ════════════════════════════════════════════════════════════════
// RIKIKI · application · which mouse gestures navigate
//
// `mouse-nav` on deck-root selects the pointer mechanisms the deck claims.
// Small, but it decides whether an embedded deck swallows the host page's
// scroll, so it is worth stating once and testing rather than re-reading an
// inline expression.
// ════════════════════════════════════════════════════════════════

/** The pointer mechanisms a deck can claim. */
export type MouseMechanism = 'click' | 'wheel' | 'arrows' | 'aux';

export const MOUSE_MECHANISMS: readonly MouseMechanism[] = ['click', 'wheel', 'arrows', 'aux'];

/**
 * Is `mechanism` enabled by this `mouse-nav` value?
 *
 * Absent or `all` enables everything (the default), `none` disables everything,
 * and anything else is a space-separated allowlist. An unknown word simply
 * matches nothing, so `mouse-nav="whel"` disables the wheel rather than
 * silently enabling it.
 */
export function mouseEnabled(raw: string | null | undefined, mechanism: MouseMechanism): boolean {
  const value = (raw ?? 'all').trim();
  if (value === 'none') return false;
  if (value === '' || value === 'all') return true;
  return value.split(/\s+/).includes(mechanism);
}
