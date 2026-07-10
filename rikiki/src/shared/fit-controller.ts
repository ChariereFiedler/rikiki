// ════════════════════════════════════════════════════════════════
// RIKIKI · fit-to-box controller
// Opt-in "shrink text to fit its box" behavior (the PowerPoint move). A
// ReactiveController watches the host's box and binary-searches the largest
// font-size for which the content stops overflowing.
//
// Why it survives the zoom-to-fit transform: it measures via scrollWidth /
// clientWidth (layout px in the logical canvas space), never getBounding
// ClientRect (screen px scaled by #stage's transform).
//
// Why it doesn't loop: the host fills its grid cell (width/height 100%,
// overflow hidden), so clientW/H is dictated by the grid · changing the
// font-size only moves scrollW/H, so the ResizeObserver never re-fires.
// ════════════════════════════════════════════════════════════════

import type { ReactiveController, ReactiveControllerHost } from 'lit';

/** Largest size in [min, max] for which `fits(px)` holds, found by bisection.
 *  `fits` must be monotonic (true up to some threshold, false above). If even
 *  `min` overflows, returns `min` · a tiny clip beats vanishing text. Pure and
 *  DOM-free so the search is unit-testable with a mock predicate. */
export function bestFitSize(
  min: number,
  max: number,
  fits: (px: number) => boolean,
  epsilon = 0.5,
): number {
  if (max <= min) return min;
  if (fits(max)) return max;
  let lo = min;
  let hi = max;
  while (hi - lo > epsilon) {
    const mid = (lo + hi) / 2;
    if (fits(mid)) lo = mid;
    else hi = mid;
  }
  return lo;
}

type FitHost = ReactiveControllerHost & HTMLElement;

export interface FitOptions {
  /** When false, the controller clears its sizing and stays idle. */
  enabled?: () => boolean;
  /** Floor size in rem (resolved against the root font-size). Default 1. */
  minRem?: () => number;
  /** Ceiling size in rem. Default 12. */
  maxRem?: () => number;
}

export class FitController implements ReactiveController {
  private ro?: ResizeObserver;

  constructor(
    private host: FitHost,
    private opts: FitOptions = {},
  ) {
    host.addController(this);
  }

  hostConnected() {
    this.ro = new ResizeObserver(() => this.refit());
    this.ro.observe(this.host);
    this.refit();
    // Web fonts load after first paint and widen the text without resizing the
    // grid-sized host · the ResizeObserver (which watches the host box, not the
    // text) never fires, so an early fit would stay too big and overflow. Refit
    // once fonts settle · guard on `ro` so a disconnected host is a no-op.
    document.fonts?.ready?.then(() => {
      if (this.ro) this.refit();
    });
  }

  hostDisconnected() {
    this.ro?.disconnect();
    this.ro = undefined;
  }

  /** Re-measure and size the host · safe to call after content or attribute
   *  changes (the host's updated() hook should call it). */
  refit() {
    const el = this.host;
    if (this.opts.enabled && !this.opts.enabled()) {
      el.style.removeProperty('font-size');
      return;
    }
    // Hidden (inactive slide / display:none) · the box is 0, so a measure is
    // meaningless · skip and let the ResizeObserver re-fire on reveal.
    if (el.clientWidth === 0 || el.clientHeight === 0) return;

    const rootPx = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const min = (this.opts.minRem?.() ?? 1) * rootPx;
    const max = (this.opts.maxRem?.() ?? 12) * rootPx;

    const fits = (px: number) => {
      el.style.fontSize = `${px}px`;
      return el.scrollWidth <= el.clientWidth && el.scrollHeight <= el.clientHeight;
    };
    el.style.fontSize = `${bestFitSize(min, max, fits)}px`;
  }
}
