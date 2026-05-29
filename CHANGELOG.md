# Changelog

All notable changes to Rikiki are documented in this file.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
