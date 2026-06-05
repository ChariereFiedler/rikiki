# Rikiki — Overview×SVG fix · click-stages v2 · Mouse navigation

**Date**: 2026-06-05
**Status**: Approved design

Three independent chantiers for the rikiki presentation framework, executed in
sequence (1 → 2 → 3). Chantiers 2 and 3 both touch `deck-root.ts`; chantier 1
is isolated to the overview module + `deck-mermaid`.

---

## Background

Rikiki is a Lit-based Web Components presentation framework. Decks are plain
HTML (`<deck-root>` wrapping `deck-*` slides), no build step. Source lives in
`src/{runtime,layouts,molecules,atoms,plugins}`, transpiled flat into `dist/`.

Relevant existing pieces:

- **Overview** (`src/runtime/deck-overview.ts`): lazy-mounted thumbnail grid.
  Each cell builds its thumbnail via `cloneNode(true)` of the live slide inside
  an IntersectionObserver callback, scaled with `transform: scale(--overview-scale)`.
- **click-stages plugin** (`src/plugins/click-stages.ts`): opt-in, patches the
  `deck-root` prototype (`_maxSteps`, `_applyStep`). Supports `data-click[="n"]`,
  `data-click-hide`, `data-anim="fade|slide-up|slide-left|scale"` with a fixed
  0.32 s transition.
- **deck-transition plugin** (`src/runtime/deck-transition.ts`): lazy-loaded when
  `<deck-root transition="…">` is set; animates enter/exit on `slide-change`.
- **Navigation** (`src/runtime/deck-root.ts`): keyboard only by default; opt-in
  `swipe` (pointer) and `autoplay` attributes exist.

---

## Chantier 1 — Overview × SVG (bug fix)

### Problem

Thumbnails are raw `cloneNode(true)` copies. Three failures with SVG content:

1. **Duplicate IDs**: every clone re-declares the same SVG `id`s inside the one
   shadow root hosting the grid. `url(#…)` references (mermaid arrow markers,
   inline-SVG gradients/clip-paths/masks) resolve to the first or wrong element
   → arrows and gradients break.
2. **Blank mermaid**: `<deck-mermaid>` keeps its rendered SVG in Lit state
   (`_svg`) inside its shadow root. A clone re-upgrades with empty state →
   blank box. Slides never visited haven't rendered at all.
3. **Wrong scale**: SVGs without intrinsic dimensions fall back to defaults
   (300×150) or overflow the cell; nothing freezes the live layout size.

### Fix — snapshot + ID namespacing

Replace the bare clone in the lazy-load callback with `snapshotSlide(slide, idx)`:

1. **Mermaid snapshots**: each cloned `<deck-mermaid>` is replaced by a static
   `<div>` reproducing the host's box styles and containing the SVG serialized
   from the live component's shadow root. `deck-mermaid` gains a small public
   accessor (`renderedSvg`) so the overview doesn't reach into its shadow DOM.
   For never-rendered mermaids, `mountOverview` triggers `render()` at open;
   the cell keeps its shimmer and populates when the render resolves.
2. **ID namespacing**: on the full clone, suffix every `[id]` with `-ov{idx}`
   and rewrite all references: `url(#…)` occurrences in `fill`, `stroke`,
   `marker-start/mid/end`, `clip-path`, `mask`, `filter` and the `style`
   attribute; plus `href`/`xlink:href="#…"`.
3. **Frozen dimensions**: every `<svg>` in the clone receives explicit
   `width`/`height` attributes measured on its live counterpart
   (`getBoundingClientRect`, matched by `querySelectorAll` document order).

No public API change, no dependency, overview still opens < 50 ms (all work
stays inside the existing lazy callback).

**Accepted limitation**: mermaid snapshots are frozen at clone time; a live
re-render while the overview is open is not reflected (marginal — livereload
closes the overview anyway).

### Files

- `src/runtime/deck-overview.ts` — `snapshotSlide()`, ID rewrite, dimension freeze
- `src/molecules/deck-mermaid.ts` — `renderedSvg` accessor

---

## Chantier 2 — click-stages v2 (animation plugin)

Single opt-in plugin file, same import, fully backward compatible: decks using
the current attributes behave identically.

### Per-element timing

Read at `prepare()` time, fed into the existing inline transition:

```html
<p data-click data-anim="slide-up"
   data-anim-duration="600" data-anim-delay="120" data-anim-ease="spring">
```

- `data-anim-duration` — ms, default 320 (current behavior)
- `data-anim-delay` — ms, default 0
- `data-anim-ease` — presets `out` (default) | `spring` | `in-out`, or any raw
  `cubic-bezier(…)` value

### Extended presets

`data-anim` additionally accepts: `slide-down`, `slide-right`, `blur`
(blur → sharp), `flip-up` (3D tilt), `draw` (SVG path tracing via
`stroke-dasharray`/`stroke-dashoffset`).

### Auto stages (one click → choreography)

`data-click-auto="800"`: the element consumes **no** click — it reveals 800 ms
after the previous stage (in document order) is reached, or after slide
activation when no click stage precedes it. Consecutive `data-click-auto`
elements chain (delays accumulate). Navigating back cancels
pending timers and hides the elements. `_maxSteps()` does not count them.

### Group stagger

Two container-level sugars:

- `data-click-children` — each direct child becomes a sequential bare
  `data-click` (one click per child), inheriting the container's `data-anim*`
- `data-click-stagger="80"` — the container consumes **one** click; children
  cascade in, 80 ms apart

### Morph (Magic Move)

`data-morph="key"` on two elements — across two steps of one slide, or across
two consecutive slides. On change, the plugin assigns
`view-transition-name: rk-morph-<key>` to matched pairs and wraps the
navigation in `document.startViewTransition()`: the element glides/resizes
from position A to position B.

- **Fallback**: no View Transitions support (e.g. Firefox ESR 140) → WAAPI
  FLIP fallback: the incoming element glides from the outgoing element's
  measured box via `el.animate()` (universal support). Same visual intent,
  no View Transitions required.
- **deck-transition interaction**: when morph keys match between two slides,
  the view transition takes over and the classic transition is skipped for
  that navigation (no double animation).
- **Documented constraint**: morph targets must live in light DOM (slide
  content already does; no morphing of nodes inside a molecule's shadow root).

`prefers-reduced-motion`: durations ≈ 0, view transitions skipped, auto-stage
timers kept (the sequence advances, without animation).

### Files

- `src/plugins/click-stages.ts` — all of the above

---

## Chantier 3 — Mouse navigation (default on, opt-out)

Core runtime behavior (not a plugin), in `src/runtime/deck-root.ts`.

### API

New `mouse-nav` attribute on `<deck-root>`:

- **absent** → everything active (`click`, `wheel`, `arrows`, `aux`) — the default
- `mouse-nav="none"` → all off
- `mouse-nav="wheel arrows"` → granular space-separated subset

### Mechanisms

1. **Click to advance** — left click anywhere → `_advance()`, Shift+click →
   `_back()`. Guards: ignored when the target closes over
   `a, button, input, textarea, select, [contenteditable], [data-no-advance]`,
   when a text selection is active, when overview/help/blank is open, or when
   the pointer moved > ~5 px between down and up (no conflict with `swipe`).
2. **On-screen chevrons** — discreet buttons bottom-right in deck-root's shadow,
   low opacity at rest like the kb-hint. 1D nav: `‹ ›`; 2D nav: `‹ › ˄ ˅`
   mirroring chapter/sub-slide arrow keys. Disabled states at deck edges
   (unless `loop`). Themable via `--deck-root-nav-*` tokens.
3. **Wheel** — `deltaY` accumulation with threshold (~50) then a ~400 ms
   lockout, so trackpad inertia doesn't skip slides. Disabled while the
   overview is open (the wheel scrolls the grid there).
4. **Mouse buttons 4/5** — `mouseup`/`auxclick` buttons 3 & 4 mapped to
   back/advance, with best-effort `preventDefault` on browser history
   navigation (documented limit: some browsers navigate anyway).

### Integrations

- Any mouse navigation resets the `autoplay` countdown (same as keyboard).
- Presenter window stays in sync (everything goes through `_advance`/`_back`/`_goTo`).
- `deck-help` overlay gains a mouse section.
- **Behavior change for existing decks** (clicks now navigate) → minor bump
  v0.3.0, documented in README, `docs/llms/rikiki-reference.md`, and the
  `rikiki-deck` skill.

### Files

- `src/runtime/deck-root.ts` — `mouse-nav` parsing, the four mechanisms, chevron UI
- `src/runtime/deck-help.ts` — mouse shortcuts section
- `README.md`, `docs/llms/rikiki-reference.md`, `.claude/skills/rikiki-deck/SKILL.md` — docs

---

## Verification (all chantiers)

- `npx tsc --noEmit` + `node build.mjs` after each chantier.
- Interactive Playwright pass on the example deck:
  - overview with mermaid + inline SVG (arrows, gradients, scale, never-visited slides)
  - click-stages choreography (timing, auto chain, stagger, back navigation cancelling timers)
  - morph between two steps and between two slides (+ fallback with VT disabled)
  - the four mouse mechanisms and their `mouse-nav="none"` opt-out
- `prefers-reduced-motion` spot check via emulation.
