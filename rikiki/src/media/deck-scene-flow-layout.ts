// ════════════════════════════════════════════════════════════════
// RIKIKI · deck-scene-flow layout, the pure part of the flow scene
//
// Who is a source, who is the hub, and where each column and box goes · kept
// apart from the element so the geometry is tested without a browser.
// ════════════════════════════════════════════════════════════════

import { GAP, PAD, SCENE_WIDTH } from './scene-layout.js';

/** More than four inputs stop reading as "these feed that" and start reading as
 *  a list · and more than two outcomes dilute the one result the slide argues. */
export const MAX_SOURCES = 4;
export const MAX_OUTCOMES = 2;

/** Each column's share of the drawing width · the rest is split evenly between
 *  the two connector lanes, so the arrows get the same room on both sides. */
export const SHARE = Object.freeze({ sources: 0.3, hub: 0.22, outcomes: 0.26 });
const LINK_SHARE = (1 - SHARE.sources - SHARE.hub - SHARE.outcomes) / 2;

/** Every column edge lands on this grid, so a scene lines up with its neighbours. */
export const GRID = 8;

export interface Roles<T> {
  sources: T[];
  hub: T | undefined;
  outcomes: T[];
}

/** Roles come from order · the emphasised item is the hub, what precedes it
 *  feeds it, what follows it comes out of it. Without an emphasis the last item
 *  is the hub: a flow that only converges is still a flow. */
export function flowRoles<T>(items: T[], isEmphasis: (item: T) => boolean): Roles<T> {
  const marked = items.findIndex(isEmphasis);
  const hubIndex = marked >= 0 ? marked : items.length - 1;
  return {
    sources: items.slice(0, Math.max(0, hubIndex)).slice(0, MAX_SOURCES),
    hub: items[hubIndex],
    outcomes: items.slice(hubIndex + 1, hubIndex + 1 + MAX_OUTCOMES),
  };
}

export interface Span {
  x: number;
  width: number;
}

export interface FlowColumns {
  sources: Span | null;
  hub: Span;
  outcomes: Span | null;
  /** The width of each connector lane between two columns. */
  link: number;
}

const snap = (value: number) => Math.round(value / GRID) * GRID;

/** The columns for the roles present · the shares are scaled to fill the width,
 *  so a flow without outcomes is as wide as one with them, and the last column
 *  takes the rounding so the drawing ends exactly at its edge. */
export function flowColumns(
  hasSources: boolean,
  hasOutcomes: boolean,
  width = SCENE_WIDTH,
): FlowColumns {
  const total =
    SHARE.hub +
    (hasSources ? SHARE.sources + LINK_SHARE : 0) +
    (hasOutcomes ? SHARE.outcomes + LINK_SHARE : 0);
  const scale = width / total;
  const link = snap(LINK_SHARE * scale);
  let x = 0;
  let sources: Span | null = null;
  if (hasSources) {
    sources = { x, width: snap(SHARE.sources * scale) };
    x += sources.width + link;
  }
  const hubWidth = hasOutcomes ? snap(SHARE.hub * scale) : width - x;
  const hub = { x, width: hubWidth };
  x += hubWidth + link;
  const outcomes = hasOutcomes ? { x, width: width - x } : null;
  return { sources, hub, outcomes, link };
}

/** The height of `count` equal boxes stacked with GAP between them. */
export function stackHeight(count: number, boxHeight: number): number {
  return count > 0 ? count * boxHeight + (count - 1) * GAP : 0;
}

/** The top of each of `count` equal boxes, stacked and centred on `centre`. */
export function stackTops(count: number, boxHeight: number, centre: number): number[] {
  const top = centre - stackHeight(count, boxHeight) / 2;
  return Array.from({ length: count }, (_, i) => top + i * (boxHeight + GAP));
}

/** Arrows leave the hub straight, at the height of each outcome · so the hub
 *  must reach past the outermost outcome's middle by a PAD, or an arrow would
 *  start from a rounded corner or from nowhere. */
export function hubHeight(
  contentHeight: number,
  outcomeHeight: number,
  outcomeCount: number,
): number {
  const spread = outcomeCount > 1 ? stackHeight(outcomeCount, outcomeHeight) - outcomeHeight : 0;
  return Math.max(contentHeight, spread + 2 * PAD);
}
