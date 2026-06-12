# Fluid mode for `<deck-root>` — design

Date: 2026-06-12
Status: approved

## Problem

Since the uniform zoom-to-fit rewrite (`eac5998`), every deck renders into a
fixed logical canvas (1920×1080 by default) scaled to fit the window. That is
the right default for presentations, but it removed any way to get a
document-like deck:

- on a phone in portrait, the 16:9 stage shrinks to ~0.2× and is unreadable;
- a deck embedded in a docs/blog page cannot fill its container — the scale is
  computed against the window, and the injected globals (`overflow:hidden`,
  `html` font-size) stomp on the host page;
- authors who want a deck that reflows like a web page have no opt-in.

## Decision summary

- Zoom-to-fit stays the default. `<deck-root fluid>` opts into fluid rendering.
- The scale measurement moves from the window to the host element's box
  (ResizeObserver), fixing embedded zoom-to-fit decks as well.
- The injected globals become `:has()`-scoped CSS that only matches when the
  deck is a direct child of `<body>` — embedded decks never touch the host
  page.

## API

`fluid` — boolean, reflected, default `false`.

In fluid mode:

- the host fills its box (100% × 100%);
- `#stage` has no fixed canvas size and no `transform: scale` — it fills the
  host and stays `container-type: size`, so the slides' `cqw`/`cqh` resolve
  against the real box and content reflows;
- there is no letterbox (nothing to letterbox);
- `width`/`height` are ignored (they only describe the logical canvas).

## Scale mechanism

`_applyScale` measures the host's content box via a `ResizeObserver` on the
element, replacing the `window` resize listener.

- Full-window deck: identical behaviour to today.
- Embedded zoom-to-fit deck: the canvas scales to the container, not the
  window (fixes the review finding about `window.innerWidth/Height`).
- Fluid deck: the observer does not set `--deck-scale` at all.

## Scoped globals

The injected `#rik-deck-globals` style becomes:

```css
html:has(> body > deck-root) { overflow: hidden; margin: 0 }
html:has(> body > deck-root) body { margin: 0; overflow: hidden }
html:has(> body > deck-root:not([fluid])) {
  font-size: calc(var(--deck-canvas-h, 1080) * 0.0235px);
}
html:has(> body > deck-root[fluid]) {
  font-size: clamp(14px, 2.35vh, 42px); /* the pre-eac5998 baseline */
}
```

A deck that is not a direct `<body>` child matches nothing: the host page
keeps its scroll and rem sizing, and the embedded deck's rem-based typography
follows the page. The disconnect-time style removal stays but is no longer
load-bearing.

Accepted limitation: embedded fluid decks inherit the host page's rem
baseline — that is the "web-native" behaviour the scoping buys. Authors who
want larger type set it in CSS.

## Periphery

- Overview: already measures `#stage`; in fluid mode the stage is the host
  box, so thumbnails stay 1:1. No change.
- Presenter: the `srcdoc` preview keeps zoom-to-fit (clean 16:9 thumbnail).
- Transitions / click-stages: mode-independent. No change.

## Testing

E2e (Playwright):

- fluid full-window deck reflows: the cover-title fraction *changes* between
  two viewport sizes (the inverse of the zoom-to-fit invariant);
- embedded zoom-to-fit deck scales to its container, and the host page is
  untouched (scroll preserved, rem unchanged);
- the whole existing suite stays green (zoom-to-fit default unchanged).

No new unit tests: the feature adds no pure logic.

## Rejected alternatives

- Separate `<deck-fluid-root>` element: duplicates all navigation/chrome.
- Auto-fluid heuristic (reflow below a scale threshold): implicit and hard to
  predict; could come back later as `fluid="auto"` if mobile demand shows up.
