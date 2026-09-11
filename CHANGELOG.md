# Changelog

All notable changes to Rikiki are documented in this file.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Added
- **`rikiki check --steps` measures every revealed state of a slide, not just
  its opening one.** Each slide is walked from its opening state through
  every state `advanceStep` (`ArrowRight`) reaches, running the same
  diagnostics on each; every diagnostic carries a `state` (`0` for the
  opening one) in the JSON and `· state N` on the human line, and a
  diagnostic identical on code, slide and path/message across several states
  of one slide is reported once, at the lowest state it held. `render` and
  `check` now share one walker (`goToSlide` / `advanceStep`, moved into
  `bin/lib/browser.mjs`) instead of each driving the deck on its own.
- **`rikiki check` reports content that paints outside its box or on top of a
  sibling.** `CONTENT_ESCAPES_BOX` (error) fires when a painted box leaves its
  nearest painted ancestor by more than 4px on any side and nothing clips it;
  `CONTENT_OVERLAPS_SIBLING` (error) fires when two unrelated painted boxes
  intersect by more than 8px on both axes. `CONTENT_CLIPPED` only sees an
  ancestor whose overflow is hidden, and most layouts never set that: a box
  simply too small for its content just paints past its own edges instead,
  silently, and the last sentence of a card can land on the callout below it
  with nothing in the report to say so.
- **`rikiki check` reports two graph nodes painted on top of each other.**
  `GRAPH_NODE_OVERLAPS_NODE` (error) fires when two `deck-node` of the same
  `deck-graph` intersect by more than 4px on both axes, naming both ids and
  the overlap in pixels. `GRAPH_NODE_OUT_OF_BOUNDS` already measured a node
  against its canvas; nobody was measuring the nodes against each other, and a
  node hidden behind another is a node nobody reads.
- **`deck-figure` · a screenshot, diagram or chart with its own caption and
  source.** OPT-IN, native `<figure>`/`<figcaption>` under the hood, so the
  image, its explanation and its credit stay one semantic unit instead of a
  `deck-image` with prose bolted beside it. `alt` is required unless the image
  is declared `decorative`; skip either and the element flags itself with
  `data-missing-alt` rather than silently shipping an unlabelled image.
  `caption` and `source` (with an optional `source-href`) print as one
  baseline-aligned line, `source` in mono type so it reads as a credit and not
  as more caption.
- **`deck-graph` edges now stop at the node's painted edge, not a fixed
  percentage gap.** A wide or boxed node could swallow the arrowhead entirely,
  because the old geometry aimed at a point short of the node regardless of
  its actual size. Edges are now measured against each node's real
  `getBoundingClientRect()` and meet its boundary. Three attributes come with
  it: `route="ortho"` on `deck-edge` for a right-angle path around nodes a
  straight line would cross, `label-offset="x,y"` to nudge an edge label off a
  crowded midpoint, and `width` on `deck-node` to force a label to wrap before
  it collides with its neighbour.
- **New attributes across five opt-in components.** `deck-annotate` gains
  `leader` with `offset`/`offsets` (`x,y` CSS pixels, `|`-separated per mark)
  to draw a line from the exact point being called out to a badge displaced
  away from it, for screenshots where the badge itself would cover the detail.
  `deck-persona` gains `compact` (a smaller portrait and type for a supporting
  persona) and `inline` (name, role and context on one wrapping row instead of
  the opening third of a slide). `deck-versus` gains `slide` to use the same
  before/after vocabulary as a complete slide, with its own `title`/`lead`
  slots and an `eyebrow`, instead of composing `deck-split` and two
  `deck-card`. `deck-callout` gains `on-dark` so a callout dropped into a
  cover, section or takeaway inherits readable inverse text and surface
  instead of the light-theme defaults going invisible. `deck-step` gains
  `note-position="below"` to keep a step's supporting note under its label
  instead of squeezed into the gutter between steps.
- **`rikiki check` gains two graph-specific codes.** `GRAPH_NODE_OUT_OF_BOUNDS`
  (error) fires when a node's painted box sits outside its `deck-graph`
  canvas; `GRAPH_EDGE_CROSSES_NODE` (warning) fires when a straight edge's
  path enters another node's content box on its way between the two it
  connects. Both are read off the rendered layout, the same geometry the
  arrowhead fix above relies on, not inferred from the authored `at`
  coordinates.

### Fixed
- **`GRAPH_EDGE_CROSSES_NODE` no longer misses a visible crossing.** The check
  re-derived a centre-to-centre segment of its own, tested it as a
  mathematical line against the node box shrunk by 2px, and ignored
  `route="ortho"` entirely · an edge running a pixel outside a node's corner,
  which a 4px stroke paints straight over, was reported as clean.
  `deck-graph` now publishes the polyline it actually paints on each
  `deck-edge` as `data-path` (graph-relative CSS pixels, bends included), and
  the check tests that polyline, widened by half the stroke, against every
  node it does not connect. A runtime older than the attribute still falls
  back to the straight centre-to-centre test.

## [1.0.0] - 2026-09-09
### Added
- **`rikiki init` writes a deck you can edit, not only one you can ship.** The
  default is now a source deck plus the runtime it loads, copied into `rikiki/`
  beside it. It needs nothing but Node · the previous behaviour, a single
  self-contained file, moved behind `--standalone` and still needs the optional
  `rolldown` peer. `--force` is what overwrites an existing deck; without it the
  command stops rather than replacing someone's work. mermaid and Shiki, ~12 MB
  together, are copied only when the deck asks for them.
- **`rikiki assemble` builds one deck from ordered partials.** The multi-file
  assembler was documented for a year as `build/vite-deck.mjs`, a path `files`
  never published: the instruction could not be followed from an install. It is
  now a command of the CLI, with `-` for stdout, a title-derived default output,
  a `lang` option, and a note on stderr when a configured href will not inline
  at bundle time. Its `theme` and `bundle` default to the `rikiki/…` spelling
  `init` writes, which is the one `bundle` rewrites.

- **`rikiki render` · one picture per slide, plus a manifest.** An agent cannot
  see a deck. This writes a PNG per slide, a dependency-free gallery, and a
  versioned `manifest.json` tying each picture to the slide index, id and title
  it came from. Slides are picked by number or id, the canvas size is explicit,
  and `--steps` captures each revealed state instead of only the opening one,
  which on a stepped slide is usually the emptiest. File names derived from a
  slide id are always safe; the manifest keeps the id verbatim.
- **`rikiki check` · what is wrong, where, and what to try.** Ten stable codes,
  a severity, the slide, an element path that reaches into the Shadow DOM, the
  measurement behind the finding and a suggestion. `--json` writes a versioned
  report to stdout and nothing else, even when the deck is broken. Exit 0 clean,
  1 defects, 2 could not look. The report names what was *not* checked, because
  silence about a check that never ran reads as approval. It will not call empty
  space a defect, and it does not claim to audit accessibility.
- **One browser layer behind export, render and check.** Lazy Playwright, a
  local server on a free port, the narrowest served root that still holds the
  deck, error and missing-resource collection, a settle that waits on animations
  rather than on a clock, and both resources closed even when the command fails.

- **A working guide ships with the package.** `docs/llms/rikiki-workflow.md` is
  the short path from a brief to a file someone can present: an editorial
  contract to fill in before writing, a plan whose lines each carry a message
  and its evidence, nine compositions by intent, the render-and-check loop, the
  order to try fixes in, and the three delivery shapes. Every HTML block in it
  is assembled into a deck and measured by `rikiki check` in the test suite, so
  a renamed component breaks the docs before a reader does.

- **`check` reports an attribute the element does not read.** `deck-metric`
  takes its label from its content, so `label="Budget consumed"` was dropped in
  silence and the slide rendered a number with nothing beside it. The new
  `UNKNOWN_ATTRIBUTE` diagnostic compares what is written against what the
  element observes *and* what its own stylesheet selects on, because an
  attribute can act through CSS alone.

- **`check` compares the announced duration with what there is to say.** A cover
  that promises twenty minutes over notes carrying two gets a warning. Speech
  runs at 100 to 130 words a minute on technical material, and those words live
  in `<deck-notes>`, so the slide count was never the right proxy. Reported as
  an estimate from the notes, never as a verdict.
- **`check` reports content no slot takes.** A `deck-card` written inside a
  `deck-feature-cards` that sits in another layout is dropped: the slide renders
  blank and nothing said why. `CONTENT_NOT_RENDERED` names the element, the slot
  it asked for and the slots the parent offers. Components that read their own
  text rather than slot it, like `deck-code` and `deck-mermaid`, are left alone.
- **Text inside `deck-code` is measured for size.** Slotted content is measured
  in the light DOM, but this element rebuilds the author's own text into its
  shadow tree, where the size check never looked.

### Changed
- **`deck-kpi-grid` / `deck-kpi` · the figures are one family, and the marked
  one is a mass.** The grid now owns three rows (value, label, note) and every
  figure adopts them with `grid-template-rows: subgrid`, so all the values share
  one baseline and one size, all the labels sit on one line, and a column
  without a note costs no height anywhere else. The value scales with the slide
  and with `cols` instead of being fixed at reading size. A `tone` of `accent`,
  `ok`, `warn` or `danger` puts the figure on the inverse surface with inverse
  digits, and says the tone in the colour of the label under it rather than
  recolouring the figure · a coloured number on paper is a different colour, not
  more emphasis; `default` and `muted` paint nothing at all. `ruled` draws a divider that can
  actually be seen: it was written with
  `::slotted(deck-kpi:not(:first-child))`, which Chromium does not match, so the
  attribute had never drawn anything. No attribute changed.
- **`deck-persona` · the portrait block is the one mass.** The initials were
  faint grey type parked left of the name, attached to nothing. They now sit in
  a square of the inverse surface in inverse ink at statement scale, or the
  photo fills the same square, so the person has a place on the slide; the name
  lines up with the block's top edge, and the context is the quiet line, gapped
  away from the identity rather than stacked flush against it. `compact` and
  `inline` shrink the block and the name together instead of only the block, and
  `on-dark` flips the block to paper with ink initials. No attribute changed.
- **The authoring skill covers the whole job.** It carried the wiring; it now
  carries the seven steps from brief to delivery, the editorial contract, seven
  graphic composition decisions with the failure each one prevents, a table
  mapping what a slide has to say to the element that says it, and the
  presentation mode: what the speaker window shows, what belongs in the notes
  rather than on the slide, and when a reveal is right.
- **The guide states why assertion-evidence, rather than asserting it.** The
  measured comprehension and recall results, and the two consequences that
  follow: a bullet list read aloud costs the room, and cutting is a design act.

### Fixed
- **`deck-step` reads as a list, not as three stacked cards.** The label was in
  the mono face for no reason, the number sat in a 16px accent disc that read as
  a speck from the back of a room, and each row was a white card with a shadow ·
  the card kit, three times over. The number now carries the sequence at reading
  size in accent, the label is in the sans face, the note follows it instead of
  being pushed to the far edge, and a hairline separates the rows.
- **The tour deck's cover line was invisible.** It was written `slot="sub"` on a
  component that offers only a default slot, so the sentence never rendered.
  Found by the diagnostic above, on the repository's own showcase deck.
- **Three recipes in the authoring guide used attributes their components
  ignore**, and one example deck promised an arrow head that is not drawn.
  Both found by the diagnostic above, on its first run.
- **Text size is measured on the author's own text.** A component's chrome is
  sized by the theme; telling an author to fix a span they never wrote fired on
  three shipped decks and helped nobody.
- **A diagram is capped against the box it sits in, not the slide.**
  `deck-mermaid` capped its SVG at 60% of the slide height, which ignores the
  padding of its own host: beside a two-line title the drawing outgrew the room
  left for it and the box clipped. Found by checking a recipe in the new guide.
- **The cover speaks the deck's language.** Its four meta labels were French
  whatever the document declared, so an English deck opened on "PRÉSENTÉ PAR"
  while every other word the engine writes was in English. They now follow the
  document's `lang`, and the per-label attributes still win over both.
- **The served root no longer admits a sibling with a similar name.** The path
  check was a string prefix, so serving `/srv/deck` also admitted
  `/srv/deck-secrets`. Traversals, escaped traversals and prefix collisions are
  now covered by tests.
- **The starter deck no longer plants a phantom element.** Its own prose said
  `<deck-*>`, which the HTML parser turned into an element node. `rikiki check`
  found it in the deck `rikiki init` writes, which is how it was noticed.
- **An assemble config is read whatever dialect the host project uses.** `.js`
  is CommonJS or ESM depending on the nearest package.json, and `npm init -y`
  writes `"type": "commonjs"`. A config that did not match crashed with a parse
  trace; both dialects now load, and a mismatch names the three ways out.
- **`--no-fonts` drops the whole font rule, not just its source.** It left
  twelve `@font-face` blocks declaring `src: none`, which is invalid CSS the
  browser discards anyway.
- **A missing optional peer prints its remedy, not a stack trace.** The advice
  to run `npm i -D rolldown` was buried under six lines of package internals.
- **The published documents no longer send the reader to files they do not
  ship.** The README opened on `cp starter.html my-deck.html`, and the shipped
  skills pointed at `bundle.mjs`, `npm run deck` and `examples/rikiki-tour/` ·
  none of which exist after `npm install`. A test now walks every published
  document and fails on any citation of an unpublished path.
- **The built site no longer carries the whole package.** `site/public/rikiki`
  was a symlink to `rikiki/`, so a build copied the TypeScript sources, the
  fixtures and 366 MB of node_modules into `dist/`: 400 MB published. A staging
  script now copies seven named entries, and a post-build check fails on
  node_modules, sources, development directories, build manifests or a site over
  60 MB. The built site weighs 14.3 MB.
- **Opt-in components, outside the default bundle.** `src/extras/` holds
  components a deck loads on purpose, each its own module. The core stays at 34
  registered elements and a deck that never uses them pays nothing.
  `rikiki bundle` folds a loaded one into the single file like any other script,
  so a standalone deck keeps it and stays offline.
  - `deck-bar` · a proportion, drawn. One value against a total (`160 / 538`
    leaves the rest of the track empty, which is the point), or a stack of
    categories on one track with its legend. The printed percentages of a stack
    always add to exactly 100; the rounding drift lands on the largest slice.
  - `deck-quote` · someone else's words, attributed. Distinct from `deck-punch`,
    which is the speaker's own line. The attribution attribute is `author-role`,
    never `role`, which belongs to ARIA.
  - `deck-annotate` · a screenshot the speaker can point at. Numbered markers
    positioned in percent, so they hold under zoom-to-fit, in the overview
    thumbnail and in the PDF. They reveal one per step through the engine's own
    step mechanism, with no plugin. The percentages are relative to the PAINTED
    picture, not to the element box: an image is letterboxed inside its box, and
    anchoring to the box put markers on the empty margin beside the screenshot.
  - `deck-agenda` · the running order and where the talk is. It reads the deck's
    own chapter structure through the navigation domain, so adding a
    `deck-section` grows a line and there is nothing to keep in sync.
- **Nine more opt-in components**, all outside the default bundle.
  `deck-icon` (24 drawn glyphs, nothing vendored, pruned by the bundler to what
  the deck writes), `deck-checklist`/`deck-check`, `deck-kpi-grid`/`deck-kpi`,
  `deck-pull`, `deck-persona`, `deck-versus`, `deck-flow`/`deck-flow-step`,
  `deck-timeline`/`deck-milestone`, `deck-table`.
- **`deck-graph`, `deck-node`, `deck-edge`** · nodes and edges, the primitive
  behind every boxes-and-arrows slide. Unlike mermaid it inherits the theme,
  reveals with the engine's own steps, prints, and weighs 2.5 KB gzip instead of
  1 MB. It runs no layout solver on purpose: an automatic layout moves every
  node when you add one, which breaks "source = output". `at="x,y"` in percent
  is the layout language, plus `row` and `column` for the common cases.
- **One visual signature for all of them** (`src/extras/signature.ts`): an
  accent rule marks what matters, a mono uppercase micro-label carries the
  metadata, and structure comes from hairlines and space rather than filled
  boxes. The first pass rendered a row of identical tinted tiles, which gives a
  projected slide no hierarchy at all.
- **Icon curation in `rikiki bundle`** · the set is one JSON string literal, so
  pruning it to the glyphs a deck writes is an exact swap the CLI verifies,
  reported like the component curation already is.
- **Four knobs on components that already existed**, chosen over four new
  elements that would have duplicated a vocabulary the project already has.
  `deck-split` takes `pivot` and `winner` for a directed comparison;
  `deck-step-list` takes `direction="row"` with connectors for a chain across
  the width; `deck-csv` takes `highlight-rows`, `highlight-cols` and `reveal`;
  `deck-stat` takes `compact` for a row of figures. All opt-in, all absent by
  default.
- **A deck-wide density default**, as a theme token (`--rik-slide-spread`)
  rather than a deck attribute · density is a per-slide judgement, so the
  per-slide `spread` still wins and `spread="theme"` defers explicitly.
- **A guard against a backtick inside a `css` template literal**
  (`scripts/css-template.test.mjs`). It closes the literal, and the parse error
  it produces points nowhere near the comment that caused it. Three debugging
  rounds went into that trap before the test did.
- **A slide budget guard** (`e2e/slide-budget.spec.ts`). The engine never lets
  content overflow, it CLIPS it, so an over-filled slide silently loses its last
  lines. Every shipped deck is walked slide by slide and a clipping box that
  loses more than a few pixels fails the build. Under-filled slides are measured
  and reported, never failed · that one is a judgement, not a defect.
- **Vertical distribution on content layouts.** A three-line slide left 62% of
  the canvas empty, with no way to use it short of switching to a bento grid.
  `deck-feature`, `deck-split` and `deck-takeaway` now take `spread`
  (`between` / `around` / `evenly` / `center` / `end` / `start`) to share the
  leftover height between the blocks, and `fill` to give that height to the
  blocks themselves · paired with `<deck-fit>` the text grows into it. Both are
  opt-in and absent means unchanged. An unknown `spread` value falls back to the
  documented default rather than dropping the layout.
- **Bento grid slides.** `<deck-bento>` lays out `<deck-cell>` children on a
  multi-row, multi-column canvas · cells take a `span` (`2x1`), a `tone`, and
  per-axis `col`/`row` overrides. Each cell is a size container, so `cqw`/`cqh`
  type scales against the cell rather than the slide. `<deck-csv>` renders inline
  CSV as a styled table and `<deck-fit>` shrinks slotted text to its box.
- **Trust model, stated and tested.** `SECURITY.md` and the shipped LLM
  reference now spell out the line: deck content is the author's code and renders
  as written; text *derived* from it is escaped. Frozen by `e2e/security.spec.ts`.
- **Embedded decks stop touching the host page.** A `<deck-root>` that is not a
  direct child of `<body>` no longer rewrites the URL hash, no longer captures
  the arrow keys until it is focused (it gains `tabindex="0"`), and lets the
  wheel scroll the page it sits in. The themes' reset, page background and
  helper classes (`.accent`, `.lead`, `.display`, `table.dense` …) are scoped to
  the deck subtree, so importing a theme no longer restyles the document around
  it. Pinned by `e2e/embed.spec.ts` against a host page that styles itself
  *before* importing the theme.
- **Several decks per document are supported**, and now say so. Each keeps its
  own canvas, slide index and navigation; focus decides which one the keyboard
  drives. Verified by `e2e/multi-deck.spec.ts`.
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
- **Print and PDF export.** (fixed twice: the print rules were declared before
  the on-screen ones they override, at equal ID specificity, so the keyboard
  chips and the nav arrows printed in the corners anyway; and the export now
  carries a bookmark outline and a tag tree, so a viewer can navigate it page by
  page.) A deck now carries a real print stylesheet: one
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
- **Going back into a slide lost its steps when a morph deferred the move.**
  Crossing a `data-morph` pair backwards landed on step 0 instead of the slide's
  last step. The engine decided "previous slide" and "its last step" in two
  statements; the morph plugin defers the first into a View Transition, so the
  second ran against the old slide and the deferred move then reset the step.
  The navigation model now returns one complete position, so the two cannot come
  apart. Reproduced and pinned by `e2e/navigation.spec.ts`.
- **A 2D deck wrote a deep link it could not read back.** With `nav="2d"` and
  steps, the engine wrote the linear form (`#3.1` for slide 3, step 1) and parsed
  it as "chapter 3, slide 1". Both sides now use the same grammar.
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
- **The engine's rules moved out of the component.** A domain layer
  (`src/domain/`) holds the slide/step position, the chapter outline, the 2D
  coordinates, the loop, the deep-link grammar and the zoom/pan arithmetic; an
  application layer (`src/application/`) holds the deep-link use case, the
  keyboard map and the `mouse-nav` selection; one adapter
  (`src/infrastructure/`) owns the URL. 165 of these run without a browser, so
  "what does ArrowUp do in a 2D deck at the top of a chapter?" and "can the
  reader drag the slide off screen at 4x?" are unit tests now. `deck-root` now asks it where to go and applies the
  answer. The layering and its five gates are recorded in
  `docs/design/adr-001-deck-navigation-domain.md`, and the dependency direction
  is enforced by `scripts/architecture.test.mjs` rather than by convention. No
  public API change.
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
