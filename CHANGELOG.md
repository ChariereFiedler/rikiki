# Changelog

All notable changes to Rikiki are documented in this file.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Bento grid slides.** `<deck-bento>` lays out `<deck-cell>` children on a
  multi-row, multi-column canvas · cells take a `span` (`2x1`), a `tone`, and
  per-axis `col`/`row` overrides. Each cell is a size container, so `cqw`/`cqh`
  type scales against the cell rather than the slide. `<deck-csv>` renders inline
  CSV as a styled table and `<deck-fit>` shrinks slotted text to its box.
- **Trust model, stated and tested.** `SECURITY.md` and the shipped LLM
  reference now spell out the line: deck content is the author's code and renders
  as written; text *derived* from it is escaped. Frozen by `e2e/security.spec.ts`.
- **Accessibility baseline, tested.** An Axe pass over the reference decks
  (`e2e/a11y.spec.ts`) plus targeted keyboard assertions. The keyboard hint chips
  were `<kbd>` elements with click handlers, unreachable by keyboard; the
  overview grid was `<div>` cells, so it could not be opened, walked or used at
  all without a mouse. Both are real buttons now, with accessible names, a
  visible focus ring and arrow-key movement. A polite live region announces each
  slide change.
- **Three browser engines.** Firefox and WebKit join Chromium in Playwright and
  pass the full base contract. They skip only what is genuinely Chromium-only:
  PDF printing and the presenter's multi-screen APIs.
- **Print and PDF export.** A deck now carries a real print stylesheet: one
  slide per page at the deck's own canvas size (A4 cropped a 16:9 slide),
  backgrounds kept, navigation chrome dropped, click-stages printed once fully
  revealed. `rikiki export deck.html --output deck.pdf` drives a headless
  Chromium, waits for fonts and mermaid diagrams, and reports any asset it could
  not load. Playwright is an optional peer dependency.
- **`rikiki bundle --with-mermaid` / `--with-shiki`.** The flags existed on
  `init` only, so a bundled mermaid deck fetched `./vendor/mermaid.min.js` at
  runtime and rendered an empty diagram offline, with exit code 0. The command
  now folds the runtime in, or fails and names it.
- **Size, component-count and packaging contracts.** Every published figure is
  measured from the artifacts it describes (`scripts/size.test.mjs`,
  `scripts/component.test.mjs`) and the install cost is asserted
  (`scripts/packaging.test.mjs`). A page that drifts fails the build.

### Fixed
- **XSS through a mermaid error message.** mermaid folds the offending source
  into `UnknownDiagramError`, and that text reached an `innerHTML` sink unescaped
  in both the slide and the overview thumbnail. mermaid now also runs at its
  `strict` security level, and the presenter escapes the theme URL and the
  inlined stylesheet it writes into its popup.
- **Four contrast failures Axe found.** The cover's meta labels used a
  decoration-grade alpha (2.43:1), the eyebrow badge put white on mango
  (2.98:1), the faint text token sat at 4.30:1, and siliceum's link colour at
  3.56:1. All four now clear AA, without inventing a new brand hue.
- **Status tones failing WCAG.** `deck-punch` and `deck-stat` rendered text in
  surface-grade tones · `ok` sat at 2.15:1 on the rikiki theme. Both now route to
  text-grade token companions that clear the large-text threshold on both themes.
- **CSV data loss.** A quoted empty field dropped the whole row, a lone `\r` never
  terminated a row, a multi-character delimiter was ignored, and a row shorter
  than the header rendered an invalid table.
- **`deck-cell` alignment axes.** `align` is horizontal and `justify` vertical
  (the cell is a column flex box) · documented, pinned by a test, and corrected
  in the showcase deck, which had them swapped.

### Changed
- **Print promises are now backed by tests.** `e2e/print.spec.ts` reads the
  produced PDF back with poppler: page count, page geometry, text on every page,
  no chrome, and a rasterised check that the backgrounds printed.
- **`rolldown` is no longer a production dependency.** It serves the CLI only and
  weighed ~55 MB of native bindings on every install · it is now an optional peer
  loaded on first use, with an actionable message when it is missing.
  `engines.node` is declared (`^20.19.0 || >=22.12.0`).
- **Release tags run the same gates as `main`.** A tag pipeline previously ran
  `publish-npm` alone · no typecheck, no lint, no browser suite, no `dist/` drift
  guard. It now waits on all three check jobs and refuses a tag that disagrees
  with `package.json`.
- **Published sizes corrected.** The headline figure was `~14 KB gzip` for a
  runtime that costs 38 KB gzip once Lit and marked are counted. Every occurrence
  now states the measured initial load.
- **The site build no longer downloads anything.** The post-build step that
  fetched `marked` and `mermaid` from jsdelivr on every deploy, overwriting the
  pinned vendored artifacts, is gone · its reason to exist disappeared when the
  bundle started vendoring its dependencies locally.


## [0.6.0] - 2026-06-19
### Added
- **Slide zoom.** Ctrl/⌘ + wheel, trackpad pinch and `+`/`-`/`0` magnify the
  active slide around the cursor and pan it (drag or wheel), fixed-canvas only,
  on by default. Scales fonts and layout together (no reflow). Opt out with
  `no-zoom` on `<deck-root>`.
- **Per-slide fluid escape.** A single slide can carry its own `fluid` attribute
  to escape the fixed canvas and use the real viewport (no zoom-to-fit scale, no
  letterbox), while the rest of the deck stays on the canvas · for one slide that
  embeds a live interactive demo. The canvas is restored on navigation away.
- **Plugin hook API.** `<deck-root>` exposes a public `use(plugin)` method and a
  `DeckPlugin` / `DeckContext` contract (`steps`, `applyStep`, `navigate`,
  `setup` hooks) so plugins extend the deck through a stable surface instead of
  patching engine internals. `setDeckCodeHighlighter()` is the matching hook for
  `<deck-code>` syntax highlighting. All three (`DeckPlugin`, `DeckContext`,
  `setDeckCodeHighlighter`) are re-exported from `dist/index.js`.
- **Presenter multi-screen placement.** With the Window Management API the deck
  goes fullscreen on the external screen (the projector) and the speaker window
  opens on the speaker's current screen · released when the presenter closes,
  with a fallback to leaving the deck in place otherwise.
- **Preview (inert) mode.** `preview` on `<deck-root>` renders and letterboxes a
  deck but wires no input, autoplay or presenter handlers · used internally so
  the presenter's Current preview can act as a control surface without spawning a
  nested presenter. A `no-counter` attribute hides the slide counter outright.

### Changed
- **Presenter Current preview is a live control surface.** Keyboard, click and
  wheel events on the Current preview are forwarded to the projected deck, with
  an opt-in advance-on-click. The preview renders the inert `preview` deck.
- **Slide counter is hidden on cover, overview and blank screens** (in addition
  to the new `no-counter` opt-out).
- **Default slide typography scaled up for projection.** Body, lead and heading
  sizes step up the type scale (body ≈32px on the 1080 canvas) in both shipped
  themes so text reads from the back of a room; the hierarchy stays monotonic.
- **Presenter Current/Next previews are constrained to 16:9**, so the laptop
  thumbnail matches the projected slide's geometry regardless of window shape.
- **Presenter mode auto-hides the projected window's key-hint chips and nav
  arrows** while the speaker window is open (restored on close).
- **Click-stages and Shiki plugins migrated to the hook API.** They no longer
  monkey-patch `deck-root` / `deck-code` prototypes. `installClickStages()` and
  `installShiki()` keep working as back-compat shims that attach the plugin to
  every `<deck-root>` already on the page · a deck created dynamically after the
  call must now register the plugin itself via `deckRoot.use()`.

### Documented
- `no-hint` and `no-arrows` attributes on `<deck-root>` are now in the reference
  attribute table (they already existed).

### Fixed
- **Wheel navigation no longer swallows browser zoom.** Ctrl/⌘ + wheel and
  trackpad pinch (which fire `ctrlKey` wheel events) are left for the browser
  instead of being `preventDefault`ed for slide navigation.
- **Shiki-highlighted code keeps its colors.** The vendored Shiki emits token
  colors as inline styles, so stripping them left every token monochrome · the
  palette is now preserved while the `class="line"` wrappers survive for step
  dimming.
- **Presenter places the speaker window on the right screen on the first press**
  and closes its `BroadcastChannel` on teardown, so reopening no longer doubles
  forwarded input.
- Shiki reference docs no longer mention a non-existent `cdn` option · the
  highlighter loads from the vendored offline bundle, not a CDN.

## [0.5.0] - 2026-06-12

This release reworks the rendering model. Every deck now renders into a fixed
logical canvas scaled uniformly to fit the viewport, with an opt-in fluid mode
for decks that should reflow like a web page, and embedded decks no longer
disturb the page that hosts them.

### Added
- **Opt-in fluid mode.** `<deck-root fluid>` makes a deck fill its box and
  reflow like a web page · no logical canvas, no zoom-to-fit scale, no
  letterbox. It can be toggled at runtime. The default stays zoom-to-fit.
- **Playwright render net.** A browser-level test suite (smoke, navigation,
  scaling, embedding) loads every fixture deck and asserts the engine upgrades,
  slides render, navigation works and the host page is left intact.

### Changed
- **Uniform zoom-to-fit is now the default rendering mode.** Every deck renders
  into a fixed logical canvas (1920×1080 by default, set via `width`/`height`)
  scaled uniformly to fit, so a slide's layout is identical at any window size
  and letterboxed when the screen aspect differs. Decks previously stretched
  fluidly to the viewport; author fluid layouts now opt in with `fluid`.
- **Embedded decks leave the host page alone.** The framework's global baseline
  (scroll lock, rem sizing) is now scoped to full-page decks, so a `<deck-root>`
  placed inside a larger document no longer hijacks the page's scroll or
  typography.
- **Zoom-to-fit measures the deck's own box.** Scaling is driven by a
  `ResizeObserver` on the host instead of the window, so an embedded deck scales
  to its container and re-fits on container resize.

### Removed
- **The `fixed` attribute.** Zoom-to-fit is now the only canvas mode, so `fixed`
  no longer has any effect and has been removed. Decks that still carry it
  render identically.

### Fixed
- **Letterbox bands now match slides whose background has a zero blue channel**
  (black, red, yellow). The opacity check parsed the blue channel as the alpha,
  so those slides wrongly fell back to the page surface for their bands.
- **The deck no longer leaves marks on the host page.** Removing the last deck
  from the DOM restores the page's scroll and rem baseline; changing
  `width`/`height` after first render re-fits the canvas; a deck moved or
  re-attached in the DOM keeps rescaling on resize.

## [0.4.0] - 2026-06-12

### Added
- Release tooling: `npm run bump <version>` rewrites every version surface at
  once (package.json/lock, CHANGELOG, site changelog, demo deck, doc stamps),
  backed by a shared manifest (`scripts/version-surfaces.mjs`) and a Vitest
  suite (`npm test`) that fails when any surface drifts. A `bump-version` skill
  orchestrates the release.
- The docs now declare which release they document via a `rikiki v<version>`
  stamp in `README.md`, `llms.txt`, and the LLM reference.

### Changed
- The npm package now ships the LLM docs: `llms.txt` and `docs/llms` are
  included in the published tarball, so the reference is available after
  `npm install rikiki-deck`.

## [0.3.1] - 2026-06-09

### Fixed
- **Presenter mode showed the wrong, un-styled slides in single-file bundled
  decks.** The presenter mirrors each slide in an iframe that reloads the rikiki
  bundle via `new URL('./index.js', import.meta.url)`. In a bundled deck that
  resolves to a `data:` URI; loaded as `<script src="data:…">` the module's own
  `import.meta.url` is that data: URL, where a top-level
  `new URL(relative, import.meta.url)` throws and aborts custom-element
  registration, so the iframes rendered raw, un-upgraded markup. The presenter
  now inlines the bundle as a module when the URL is a `data:` URI; file-served
  decks keep loading it via `<script src>` unchanged.

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
