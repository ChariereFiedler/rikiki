# Changelog

All notable changes to Rikiki are documented in this file.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.3.0] - 2026-06-08

### Added
- Mouse navigation: click / Shift-click, scroll wheel (yields to scrollable
  content, navigates at the edge), bottom-right chevrons, and mouse back/forward
  buttons. Configurable via the `mouse-nav` attribute (`none`, or a subset of
  `click wheel arrows aux`).
- Click-stages plugin reveals (`installClickStages()`): `data-click`,
  `data-click="N"`, `data-click-hide`, `data-click-auto`, `data-click-stagger`,
  `data-click-children`, per-element `data-anim*`, and `data-morph` Magic Move
  (View Transitions, with a WAAPI FLIP fallback on Firefox).
- Overview grid (`O`): viewport-faithful thumbnails, type-to-filter search, and
  click-to-jump. Mermaid diagrams render in their thumbnails.
- Clickable bottom-left key-hint chips (`← → O P ?`): each chip now triggers its
  action (back / advance / overview / presenter / help), not just hints the key.

### Fixed
- **Overview thumbnails · mermaid/SVG rendered unstyled.** Cloned slide SVGs get
  their ids namespaced per-thumbnail to avoid collisions, but the `<style>`
  selectors weren't rewritten, so mermaid's id-scoped rules (`#mmd-N …`) stopped
  matching and the diagram fell back to black. `namespaceIds` now rewrites `#id`
  selectors inside `<style>` blocks too. A thumbnail build that fails retries on
  the next scroll-into-view, capped so a deterministic failure can't re-warn
  forever.
- **Deep links clamp to the nearest valid position** instead of resetting to the
  first slide: an out-of-range slide/chapter index lands on the last one, and a
  step past a slide's range settles on its last step (keeps a bookmarked
  `#4.3` usable while iterating).
- **Wheel navigation yields to scrollable descendants**, including inline `<svg>`
  (the check was limited to `HTMLElement`), and navigates once the element
  reaches its scroll edge instead of trapping the wheel inside it.
- **click-stages edge cases:** `data-click-stagger="0"` flips children
  simultaneously (was falling back to 80 ms); stagger children honor
  `data-click-hide` and `data-anim-delay`; `data-anim-delay` is no longer applied
  twice on auto/stagger entries; delayed reveals no longer flicker during a
  `data-morph` view transition; morph visibility is judged from computed style so
  CSS-class visibility counts; a synchronous `startViewTransition` throw no longer
  strands the animation/morph state.
- click-stages step counting is unified on the entry walk, so the step count can
  no longer disagree with the reveals (no unreachable stage / dead step), and an
  explicit `data-click="N"` floors the running cursor so a later bare element
  lands after it in document order. Morph visibility prefers the inline target
  opacity over the mid-transition computed value, so a fading element isn't
  briefly mistaken for the visible one.

### Changed
- **2D navigation is now opt-in** via `nav="2d"` on `<deck-root>` (it was
  auto-enabled whenever a deck had 2+ sections). Without it, arrows stay linear,
  so adding a `<deck-section>` no longer silently remaps `←`/`→` to chapter
  jumps. `<v-clicks>` wrapper elements remain unsupported · rikiki drives reveals
  with the `data-click` attribute.
- The CSS-in-JS template minifier is extracted to a shared `minify-templates.mjs`
  imported by both `build.mjs` and `build-standalone.mjs`.

## [0.2.0] - 2026-06-02

### Added
- `click-stages` plugin: per-element click-through reveals on any element, in
  the spirit of Slidev's `v-click`. Attributes `data-click`, `data-click="N"`,
  `data-click-hide`, and `data-anim="fade|slide-up|slide-left|scale"`. Opt-in
  via `installClickStages()`, reverses cleanly, honors `prefers-reduced-motion`.
- Multi-file deck assembly: `build/vite-deck.mjs` stitches ordered `.html` and
  `.md` partials listed in a `deck.config.{js,json}` into one deck. A single
  `.md` file can hold many slides, split on lines that are exactly `---`
  (reveal.js convention).
- `?live` opt-in: append `?live` to a deck URL and the core lazy-imports the
  livereload poller. The poller now watches the document's own stylesheets
  (same-origin only) instead of a hard-coded path.
- LLM-facing reference (`docs/llms/rikiki-reference.md`) and a `rikiki-deck`
  authoring skill, surfaced from the documentation site.

### Fixed
- Presenter window showed slides unstyled. The rikiki bundle URL is now derived
  from `import.meta.url` instead of a fragile theme-path guess, the mirrored
  slide is marked `active`, and the popup grid clips its panels and goes
  single-column on small screens.
- `deck-root` no longer throws a `SecurityError` when navigating inside a
  `srcdoc` / sandboxed iframe; the `history.replaceState` call is guarded.

### Changed
- `npm run build` regenerates `dist/standalone.js` as well (via
  `build-standalone.mjs`), so the Lit-inlined bundle no longer drifts out of
  sync with the source.

## [0.1.1] - 2026-05-29

### Fixed
- `<deck-code>` `hero` and `nested` variants now honor the documented
  `--deck-code-padding-x` / `--deck-code-padding-y` custom properties. They
  were hard-coded, so deck authors could not tune the padding as the component
  contract promised. Defaults are unchanged.

## [0.1.0] - 2026-05-21

### Added
- Initial public release.
- 20 `<deck-*>` Web Components (cover, section, hero, hero-detail, split, hook,
  md, code, callout, card, mermaid, badge, metric, tier-list, step-list,
  kicker, stack, grid, punch, root).
- Two ship-ready themes: `rikiki` (default, tropical-jungle palette on dark)
  and `siliceum` (warm paper with a yellow accent).
- 2D keyboard navigation: `←`/`→` between sections, `↑`/`↓` within a section,
  `Space` for linear progress, with linear fallback at deck edges.
- Path-style overview mode (`O`), one row per chapter, sub-slides flowing right.
- Live-reload helper (`?live`) ~70 lines, no WebSocket.
- `rikiki/dist/` is versioned so deck authors run zero build.
