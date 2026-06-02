# Changelog

All notable changes to Rikiki are documented in this file.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
