// ════════════════════════════════════════════════════════════════
// RIKIKI · application · deep links
//
// Orchestration only. The grammar lives in the domain (domain/deck-link.ts),
// the URL itself lives behind a port, and the rules about WHEN a deck may own
// the URL live here. See docs/design/adr-001-deck-navigation-domain.md.
//
// Depends on the domain and on its own port. Never on the DOM.
// ════════════════════════════════════════════════════════════════

import { formatHash, parseHash } from '../domain/deck-link.js';
import type { DeckOutline, DeckPosition, StepsOf } from '../domain/deck-outline.js';
import { coordsOf } from '../domain/deck-outline.js';
import { clampPosition, goToCoords, goToSlide } from '../domain/navigation.js';

/** The URL, as the application is allowed to see it. Implemented by the browser
 *  adapter; a test supplies a plain object. */
export interface LocationPort {
  /** The current fragment, `#` included, or an empty string. */
  read(): string;
  /** Replace the fragment without adding a history entry. Implementations
   *  swallow the SecurityError an opaque origin throws · see the adapter. */
  write(hash: string): void;
}

export interface DeepLinkContext {
  readonly outline: DeckOutline;
  readonly twoD: boolean;
  readonly stepsOf: StepsOf;
  /** False for an embedded deck · the fragment belongs to the host page. */
  readonly ownsUrl: boolean;
}

/**
 * The position the current URL asks for, or null when it asks for nothing.
 *
 * `coldLoad` matters: before the plugins have computed their step counts, the
 * model would clamp `#4.2` down to step 0 and lose the link. Until a count
 * exists the asked-for step is kept as-is; from then on it is clamped, so a
 * link to a click that no longer exists settles on the last available one.
 */
export function readDeepLink(
  port: LocationPort,
  ctx: DeepLinkContext,
  coldLoad = false,
): DeckPosition | null {
  if (!ctx.ownsUrl) return null;
  const link = parseHash(port.read(), ctx.twoD);
  if (!link) return null;

  const asked =
    link.kind === 'coords'
      ? goToCoords(ctx.outline, link.coords, ctx.stepsOf)
      : goToSlide(ctx.outline, link.slide, ctx.stepsOf);
  if (!asked) return null;

  const maxStep = ctx.stepsOf(asked.slide);
  if (maxStep > 0 || !coldLoad) {
    return clampPosition(ctx.outline, { slide: asked.slide, step: link.step }, ctx.stepsOf);
  }
  return { slide: asked.slide, step: Math.max(0, link.step) };
}

/** Write a position to the URL, in the grammar `readDeepLink` will read back.
 *  A deck that does not own the URL writes nothing at all. */
export function publishDeepLink(
  port: LocationPort,
  position: DeckPosition,
  ctx: Pick<DeepLinkContext, 'outline' | 'twoD' | 'ownsUrl'>,
): void {
  if (!ctx.ownsUrl) return;
  const hash = formatHash(position, {
    twoD: ctx.twoD,
    coords: ctx.twoD ? coordsOf(ctx.outline, position.slide) : undefined,
  });
  if (port.read() === hash) return;
  port.write(hash);
}
