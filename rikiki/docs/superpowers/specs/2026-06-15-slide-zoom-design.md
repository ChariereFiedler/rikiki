# Slide zoom · design

Date: 2026-06-15
Status: approved (brainstorming) · pending implementation plan

## Problem

A deck reader (Lectem) wants to zoom into a slide "like a PDF · or at minimum
have the fonts scale up". In the default fixed-canvas mode this does nothing:
the `#stage` is letterboxed with `transform: scale(var(--deck-scale))` where
`--deck-scale = min(clientW/1920, clientH/1080)`. Browser zoom shrinks the CSS
viewport, the ResizeObserver recomputes a smaller `--deck-scale`, and the deck
refits · net zero. "The content stays fixed" is the intended fit-to-viewport
behaviour, so honoring browser zoom is not enough.

Key technical truth: in a fixed canvas you cannot scale fonts alone without
overflowing fixed-size containers (rem and `cqw/cqh` resolve against the
1920×1080 canvas). The only coherent "bigger text, layout preserved" is to
**magnify the whole slide uniformly** · which scales the fonts and everything
else proportionally. So a magnify-and-pan zoom serves both the PDF feel and the
"scale the fonts" minimum.

## Goal

An opt-out, on-by-default zoom that magnifies the active slide beyond the fit
scale and lets the reader pan around it, in fixed-canvas mode only. No reflow ·
the 16:9 layout is preserved (true magnification).

Non-goals: zoom in `fluid` mode (no fixed layout to magnify), honoring native
browser zoom, persisting zoom across slides, a zoom-level HUD.

## Approach (chosen: A · extend the stage transform)

Reuse the existing `#stage` transform. Multiply the fit scale by a user zoom
factor and add a pan translation:

```
#stage {
  transform: translate(var(--deck-pan-x, 0px), var(--deck-pan-y, 0px))
             scale(calc(var(--deck-scale, 1) * var(--deck-zoom, 1)));
}
```

The scale (fit × zoom) applies around `transform-origin: center center`; the
translate then shifts the stage in viewport pixels. The host stays
`overflow: hidden` · the pan moves the stage within it. Because `cqw/cqh` keep
resolving against the unchanged 1920×1080 stage, content does not reflow · it is
genuinely magnified.

Rejected alternatives:
- **B · native scroll container**: scrolling a `transform`-scaled element does
  not work (scroll area is layout size, not transformed size) and it would
  rework the overflow/centering/letterbox model. Invasive.
- **C · CSS `zoom` property**: interacts unevenly with container queries and the
  existing transform. Risky.

## State (deck-root)

- `_zoom: number = 1` · 1 = fit. Clamped to `[1, ZOOM_MAX]`, `ZOOM_MAX = 4`.
- `_panX, _panY: number = 0` · viewport pixels, applied as the translate.
- `@property({type: Boolean, attribute: 'no-zoom'}) noZoom = false` · opt-out.
- A reflected `data-zoomed` marker (set when `_zoom > 1`) drives the grab cursor
  and lets handlers branch.

`_applyZoom()` writes `--deck-zoom`, `--deck-pan-x`, `--deck-pan-y` on the host
and toggles `data-zoomed`. `_applyScale()` keeps writing `--deck-scale` (fit);
the CSS multiplies the two.

## Enabled / no-op conditions

Zoom is a no-op (and any zoom gesture falls through to default behaviour) when
any of: `noZoom`, `_effectiveFluid()` (fluid deck or per-slide fluid),
`overview`, or `blank`. A single helper `_zoomEnabled()` gates all entry points.

## Triggers

- **Ctrl/⌘ + wheel** (trackpad pinch arrives as `ctrlKey` wheel events): when
  `_zoomEnabled()`, `preventDefault()` and zoom around the cursor by an amount
  derived from `deltaY`. When zoom is disabled, do **not** intercept · let the
  browser zoom (this is the only path where the earlier ctrl+wheel passthrough
  still applies).
- **`+` / `=`** zoom in, **`-`** zoom out by a fixed step (×1.25), centred on the
  viewport. **`0`** resets to fit. Ignored inside inputs and when zoom disabled.
- **While `_zoom > 1`**:
  - plain wheel (no ctrl) **pans** instead of navigating (`preventDefault`,
    `deltaX/deltaY` move the pan), returning to wheel-nav once back at fit;
  - pointer drag **pans** (pointer capture, grab cursor); swipe-nav and
    click-to-advance are suspended.
- **Navigation keys** (arrows, space, PageUp/Down, Home, End) navigate as usual
  **and** reset zoom via the slide-change reset.

## Zoom math (cursor-anchored)

Let the stage be centred in the viewport (host is flex-centred). For a zoom from
`z0` to `z1` at cursor `(cx, cy)`, keep the point under the cursor fixed:

```
pan' = pan + (cursor - center - pan) * (1 - z1 / z0)
```

computed per axis, where `center` is the viewport centre. Then clamp.

## Pan clamp

Rendered stage size at total scale `S = fit × zoom`: `1920·S × 1080·S`. Allowed
pan keeps the stage covering the viewport (no gaps):

```
maxPanX = max(0, (1920·S - viewportW) / 2)   // clamp panX to [-maxPanX, +maxPanX]
maxPanY = max(0, (1080·S - viewportH) / 2)
```

At `zoom = 1` the scaled stage is ≤ the viewport, so `maxPan = 0` → pan forced to
0 (recentred · the existing letterbox centring is preserved). Re-clamp on resize
(reuse the ResizeObserver that already drives `_applyScale`).

## Reset & lifecycle

- `_resetZoom()` sets `_zoom = 1`, pan = 0, re-applies.
- Called from `_goToNow` (every slide change) and on the `0` key, so each slide
  starts at fit.
- `_applyScale` already runs on resize · it also re-clamps the pan.

## Interaction notes

- Zoom is local to the projected (main) window · it is not serialized to the
  presenter popup (which mirrors slide HTML, not live interaction state).
- `_onClickNav`, swipe (`_onPointerUp`), and `_onWheel` nav branches check
  `_zoom > 1` (or reuse the drag-pan path) so they don't fire while zoomed.
- The earlier ctrl+wheel browser-zoom passthrough is now the disabled-zoom
  fallback (no-zoom / fluid). Default decks zoom the slide on ctrl+wheel.

## Testing

Unit (where pure): the pan-clamp and cursor-anchored pan math as small pure
helpers if extracted.

e2e (Playwright, fixed-canvas fixture):
- ctrl+wheel zooms in → host gets `data-zoomed`, `--deck-zoom > 1`.
- `+` / `-` change zoom; `0` resets to fit (`data-zoomed` cleared).
- while zoomed, a plain wheel pans (pan vars change) and does **not** change the
  slide; at fit, a plain wheel still navigates.
- navigating to another slide resets zoom to fit.
- pan is clamped (cannot exceed the computed bounds · no gap at the edge).
- `no-zoom` disables it (ctrl+wheel is not `preventDefault`ed, no `data-zoomed`).
- a `fluid` deck: ctrl+wheel is a no-op for zoom.

## Docs

- `docs/llms/rikiki-reference.md`: new "Slide zoom" subsection + the `no-zoom`
  attribute in the table; update the wheel/zoom note (ctrl+wheel zooms the slide
  by default · `no-zoom` restores browser zoom).
- `CHANGELOG.md` (Unreleased · Added), `llms.txt`, site `plugins.astro` /
  `api.astro`, skill `rikiki-debug` (refine the "ça zoom pas" row).
