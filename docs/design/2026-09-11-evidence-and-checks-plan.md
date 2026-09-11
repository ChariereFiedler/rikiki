# Evidence lines and output checks · verdict and plan

> Answer to the request written on 2026-09-11 after the `bib_eco` deck (64 slides,
> theme `siliceum`, delivered as a document) was re-based on runtime `15e1966`.
> The request lists seven component gaps (A1..A7) and seven check gaps (B1..B7).
> Part 1 is the critical verdict the request asked for before any code. Part 2 is
> the implementation plan for the entries that earned code.

## Part 1 · Verdict, entry by entry

Decision rule, from `MANIFESTO.md`: composition before options, one
responsibility per component, hand-editable in 2031. From `ROADMAP.md`: nothing
that turns a deck into a solver's output.

| # | Request | Verdict | Why |
|---|---------|---------|-----|
| A1 | `source` on every evidence block | **Code, as one atom** | The need is real and the contract of an evidence deck depends on it. But five new attribute pairs is the wrong shape: the manifesto prefers a slot to an option. One `deck-source` atom, placed by the author under any block, gives a single implementation and a single rendering. `deck-figure` keeps its `source`/`source-href` attributes and renders the same atom, so the two paths cannot drift. |
| A2 | `deck-annotate` as a figure | **Code, cheap path** | An annotated screenshot is a figure. `deck-annotate` gains `caption`, `source`, `source-href` and the `figure`/`figcaption` markup of `deck-figure`, reusing `deck-source`. Wrapping a `deck-figure` inside `deck-annotate` was the cleaner idea but it doubles the measuring code for the letterboxed image rectangle; not worth it. |
| A3 | Named anchors for badges | **Code, option 3** | Seven badges placed in three or four round trips each is the cost signal. `offset`/`offsets` accept the keywords `above`, `below`, `left`, `right` next to the pixel form. The displacement is the badge diameter plus a gap, measured from the rendered badge, so it lives in the badge's own unit. A keyword implies `leader`. The "stay inside the slide" clamping is left out: it needs the slide box at layout time and adds a solver for a case one can fix by picking another keyword. |
| A4 | `footer` slot in slide mode | **Code, `deck-versus` only** | `deck-versus` is the only opt-in component with a `slide` attribute, so "everywhere slide mode exists" is one component today. A `footer` slot under the two sides, at reading size, is a few lines. |
| A5 | `layout` on `deck-graph` | **No new code** | `layout="row"` and `layout="column"` already exist and are documented in the reference. `serpentine`, `fan-in` and `fan-out` are the auto-layout the source explicitly refuses (`deck-graph.ts`, "WHY NO AUTO-LAYOUT"): a solver whose output moves when a node is added breaks source = output. The defect on the `vote` slide is a detection problem, answered by B2. |
| A6 | `wrap` on `deck-flow` | **Deferred** | Real but not cheap: the value is entirely in the elbow connector between two rows, which is a second connector geometry to maintain in a component whose point is being a plain grid. The serpentine graph the author wired by hand is the supported answer today. Revisit when a second deck asks. |
| A7 | `deck-record` | **No new code, a recipe** | `deck-table` already has `highlight-rows`, `highlight-cols` and `reveal`, which covers per-field emphasis and field-by-field reveal. A three-column table (field, value, what makes it authoritative) styled as a record is a recipe, documented in the reference under section 22. |
| B1 | `CONTENT_ESCAPES_BOX` | **Code, error** | The most serious defect of the three and the easiest to measure. Two codes: a child's painted box leaving its parent's box, and two siblings whose painted boxes overlap. The author's own sixty-line script found the defect at the first run; the check should. |
| B2 | `GRAPH_NODE_OVERLAPS_NODE` | **Code, error** | Same rectangles the edge check already reads. |
| B3 | `GRAPH_EDGE_CROSSES_NODE` misses | **Bug fix** | The check recomputes a centre-to-centre segment from the host boxes, while the component draws the edge from anchor to painted edge and never publishes what it drew. The check must test the segment that is painted, read from the component, not a private re-derivation. A regression test uses the reported coordinates. |
| B4 | `ANNOTATION_HIDES_TARGET` | **Deferred** | Without the uniformity test, the warning fires on every badge without a leader, which is the common and legitimate case in most decks; a warning that fires everywhere stops being read. With the uniformity test, the check must sample image pixels under a canvas, which taints on `file://` decks. Named anchors (A3) remove most of the cause. |
| B5 | `check --steps` | **Code, opt-in** | `render --steps` already walks the revealed states; `check` reuses the same walker and measures each state. `notChecked` drops the corresponding line when the flag is on. |
| B6 | `render --baseline` | **Code** | The request that serves every deck. No image library is installed and none is added: the comparison runs inside the browser the CLI already drives, by drawing both PNGs on a canvas and counting the pixels that differ beyond a colour tolerance. Output: the slides that moved, ranked by the share of changed pixels, with the bounding box of the change, `--json` for scripting, exit 1 when something moved beyond the threshold. |
| B7 | `check --pdf` | **Deferred** | Print layout is one settled DOM state per deck; measuring it means a second rule set tuned to print media. Low priority for most decks, as the request says. |

Nine entries earn code: A1, A2, A3, A4, B1, B2, B3, B5, B6. Two are documentation only: A5 and A7. Three are deferred with the reason above: A6, B4, B7.

## Part 2 · Implementation plan

Spec: this file, Part 1, plus the original request at
`~/games/juju/bib_eco/docs/presentation/bib-eco/deck-work/demande-rikiki.md`.

### Global constraints

- Package root: `rikiki/` (sources `rikiki/src`, CLI `rikiki/bin`, tests `rikiki/e2e` and colocated `*.test.ts` / `*.test.mjs`). Register new elements in `rikiki/src/index.ts`. `dist/` is committed and flat: run `npm run build` in `rikiki/` and commit the rebuilt output with the source.
- English for code, comments, commit messages and documentation. No emoji. No literal em-dash in source (use `·`; `—` when a glyph is needed).
- CSS: only `--rik-*` tokens and `--deck-*` knobs defaulting to a token. No literal colour or length. Correct under both themes (`rikiki`, `siliceum`).
- Zero network call at run time. Survives `rikiki bundle`. Works from `file://`.
- Legible in presenter mode, in the overview grid and in the PDF export.
- Every change updates `rikiki/docs/llms/rikiki-reference.md` in the same commit (`doc-code-parity` rule). Every component change adds a demonstration slide in `examples/rikiki-tour/index.html`. Every CLI change updates the `HELP` string in `rikiki/bin/rikiki.mjs` and `rikiki/README.md` when user-facing.
- Tests: pure helpers get Vitest tests colocated with the module (`src/shared/*.test.ts`, `bin/lib/*.test.mjs`); behaviour that needs a browser goes in `rikiki/e2e/*.spec.ts` (Playwright, decks built inline in a temp dir like `e2e/render-check.spec.ts` does). No `waitForTimeout`. Every bug fix ships with a failing-then-passing test.
- Before claiming done: `npm run typecheck`, `npm run lint`, `npm test`, and the e2e spec(s) touched, all run from `rikiki/`.
- Commit format: `type(scope): description`, first line at most 72 characters, no mention of Claude, AI or LLM. Commit on the branch `feat/evidence-and-checks`.
- Error handling: no swallowed error, `ExpectedError` from `bin/lib/cli-error.mjs` for expected CLI failures.
- CHANGELOG: add one entry per task under `## [Unreleased]` in `CHANGELOG.md` at the repo root, in the existing style.

### Task 1 · Graph checks: fix `GRAPH_EDGE_CROSSES_NODE`, add `GRAPH_NODE_OVERLAPS_NODE`

Covers B3 and B2.

**Reproduction (B3).** Build a deck with one `deck-graph` holding boxed nodes
`t3` at `at="55,24"`, `t4` at `at="80,24"`, `t5` at `at="16,76"`, each with a
label and a `note`, and one `deck-edge from="t4" to="t5"`. Render at 1920×1080.
Confirm visually (a screenshot is fine) that the painted edge crosses the
bottom-right corner of `t3`, then confirm `rikiki check --json --no-visual`
emits no `GRAPH_EDGE_CROSSES_NODE`. Record the observed geometry in the report.

**Root cause to verify.** `bin/lib/check.mjs` (around lines 256-321) tests the
straight centre-to-centre segment between the host boxes of `from` and `to`,
inset 2 px on the candidate, and ignores `route="ortho"`. `deck-graph.ts`
draws from a different anchor (`meetRect`, around lines 49-58 and 315-340) and
publishes nothing. When the host box of a node with a `note` is taller than
its icon, the centre used by the check sits lower than the painted line.

**Fix.**
- `deck-graph` publishes the segment it paints: for each edge, the painted
  polyline in graph-relative CSS pixels, as a `data-path` attribute on the
  `deck-edge` element, format `x1,y1 x2,y2[ x3,y3 ...]` (two points for a
  straight edge, three or four for `route="ortho"`). Update it whenever the
  component re-measures. This is the geometry commit `20e9a39` already
  computes; it only needs to be exposed.
- `check.mjs` reads `data-path` for each edge, converts it to viewport
  coordinates with the graph's bounding rect, and tests every segment of the
  polyline against every node other than `from` and `to`. Keep the 2 px inset.
  Fall back to the current centre-to-centre test only when `data-path` is
  absent (older runtime), and say so in a code comment.
- Add `GRAPH_NODE_OVERLAPS_NODE`, severity `error`: two `deck-node` elements of
  the same `deck-graph` whose bounding rects intersect by more than 4 px on
  both axes (the existing `clipPx` limit). Message names both node ids and the
  overlap in pixels. `deck-group` and `deck-lane` are not nodes.

**Tests.**
- Vitest: extract the polyline-versus-rect test into a pure helper in
  `bin/lib/` (or `src/shared/graph-layout.ts` if it fits better) with unit
  tests: straight hit, corner graze that hits, tangent that does not, ortho
  polyline hitting on its second segment.
- Playwright in `e2e/render-check.spec.ts`, `graph geometry` block: the
  reproduction deck must now emit `GRAPH_EDGE_CROSSES_NODE`; a deck with two
  nodes at `at="50,50"` and `at="52,50"` emits `GRAPH_NODE_OVERLAPS_NODE`; the
  existing collinear test still passes.

**Docs.** Reference section 12b, the `check` diagnostics table: add the new
code and reword the edge code if its description changed. CHANGELOG entry
under Fixed (B3) and Added (B2).

### Task 2 · `CONTENT_ESCAPES_BOX` and `CONTENT_OVERLAPS_SIBLING`

Covers B1.

**What to measure.** For every slide, in its measured state, walk the author's
light DOM and the shadow DOM of components (same walk as `clippersIn` in
`check.mjs`, depth-limited), collecting elements that are rendered
(`display` not `none`, `visibility` not `hidden`), not `position: absolute`
or `fixed`, with a bounding box larger than 40×20 px and non-empty text
content. These are the "painted boxes".

- `CONTENT_ESCAPES_BOX`, error: a painted box whose rect leaves the rect of its
  nearest painted ancestor by more than 4 px on any side. Skip the case where
  the ancestor has `overflow: hidden|clip` (that is `CONTENT_CLIPPED`'s job).
- `CONTENT_OVERLAPS_SIBLING`, error: two painted boxes, neither containing the
  other in the DOM and neither rect enclosing the other (1 px tolerance), whose
  rects intersect by more than 8 px on both axes.

Report at most one diagnostic per code per slide, the worst offender, with
the element path (`pathOf`), the text head of both boxes (36 characters), and
the escape or overlap size in pixels. Exclude `deck-notes` and the slide's own
chrome. Exclude `deck-annotate` marks and leaders and `deck-graph` internals
(they overlap by design and have their own codes): skip any painted box whose
nearest `deck-*` host is `deck-annotate` or `deck-graph`.

**Tests.**
- Vitest: the rect comparison helpers (escape distance, overlap size,
  encloses) as pure functions with unit tests.
- Playwright in `e2e/render-check.spec.ts`: a slide with two `deck-card` in a
  `deck-grid` whose text is long enough to spill under a following
  `deck-callout` (force it with a small canvas via `--height`) emits both
  codes; a well-sized slide emits neither; a slide where `em` sits in its `h1`
  emits nothing.

**Docs.** Reference 12b diagnostics table, README check bullet if it lists
codes, CHANGELOG Added.

### Task 3 · `check --steps`

Covers B5.

- Move `advanceStep` (and `goToSlide` if needed) from `bin/lib/render.mjs`
  into `bin/lib/browser.mjs` so both commands share one walker. No behaviour
  change for `render`.
- `check` gains `--steps`. When set, for each slide, measure the opening state
  then every revealed state reached by `advanceStep`, running the same
  diagnostics on each state. A diagnostic carries `state: N` (0 for opening)
  in the JSON and `· state N` in the human line. `statesInspected` counts all
  measured states. The `notChecked` line about revealed steps is omitted when
  `--steps` is on. Dedupe identical diagnostics across states of one slide.
- The visual pass (`measureSlides`) keeps measuring the opening state only;
  say so in `notChecked` ("pixels of revealed states").

**Tests.** Playwright: a `deck-step-list`-free deck with a `deck-graph reveal`
of three nodes where the third node overflows the graph box only once
revealed: `check` without `--steps` reports nothing, with `--steps` reports
`GRAPH_NODE_OUT_OF_BOUNDS` with `state: 2` (or the state number that
matches). Existing render `--steps` test still passes.

**Docs.** Reference 12b `check` section, `HELP` string, README, CHANGELOG.

### Task 4 · `render --baseline <dir>`

Covers B6.

- `rikiki render deck.html --baseline <dir> [--threshold <percent>] [--json]`.
  Render as today, then for each produced PNG that has a same-named file in
  `<dir>`, compare. Files present on one side only are reported as `added` /
  `missing`, never as a diff.
- Comparison runs in the browser already open: a blank page loads both images
  as `data:` URLs, draws each on a canvas, reads `getImageData`, and counts
  pixels whose max channel delta exceeds 32 (a constant with a name). Sizes
  that differ are reported as `resized` with both sizes, without a pixel
  count. Put the in-page function in `bin/lib/diff.mjs`, exported, so the
  pure parts (ranking, threshold, bounding box) are unit-testable in Node.
- For each compared slide: `changedRatio` (changed pixels over total), and the
  bounding box of changed pixels `{left, top, width, height}` so the author
  can look at the right place. Threshold default `0.5` (percent of pixels);
  a slide at or above it is `changed`, below it is `stable`.
- Human output on stderr: one line per changed slide, ranked by `changedRatio`
  descending, then counts (changed / stable / added / missing / resized).
  `--json` writes the full report to stdout, in the shape
  `{ schema: 'rikiki.render-diff/1', baseline, threshold, slides: [...], summary }`.
- Exit code 1 when at least one slide is `changed`, `missing` or `resized`;
  0 otherwise. `--baseline` pointing to a missing directory is an
  `ExpectedError` with exit 2.
- Also write `diff.json` next to `manifest.json` in the output dir.

**Tests.**
- Vitest for `bin/lib/diff.mjs` pure parts: ranking, threshold edge (exactly
  at threshold is `changed`), bounding box from a changed-pixel list, and
  classification (added / missing / resized).
- Playwright in `e2e/render-check.spec.ts`: render a deck to `A`, render the
  same deck to `B`, `--baseline A` reports all stable and exits 0; change one
  slide's title, render to `C`, `--baseline A --json` ranks that slide first,
  marks it `changed`, exits 1; remove a slide, `missing` is reported.

**Docs.** Reference 12b `render` section (example, report shape), `HELP`,
README, CHANGELOG. Mention that anti-aliasing noise stays under the default
threshold and that `--threshold 0` lists every pixel change.

### Task 5 · `deck-source` atom, reused by `deck-figure`

Covers A1.

- New atom `rikiki/src/atoms/deck-source.ts`, tag `deck-source`, attribute
  `href` (optional). Renders `<cite part="source">` with the slotted text, in a
  link when `href` is set. Visual: the exact rendering `deck-figure` gives its
  source today (mono, discreet, reading size), so extract those declarations
  into the atom and let `deck-figure` render `<deck-source>` inside its
  `figcaption` instead of its own `<cite>`. Tokens: `--deck-source-color`
  defaulting to what `--deck-figure-source-color` defaults to; keep
  `--deck-figure-source-color` working by forwarding it.
- `deck-source` is a core atom (registered in `src/index.ts` in the atoms
  section), not an opt-in extra, because five opt-in components and the
  author's prose all need it. Check the initial-load size budget in
  `scripts/size.test.mjs` still passes; update published size figures if the
  test asks for it.
- Placement: an author writes `<deck-source href="…">Word, p. 12</deck-source>`
  right after a `deck-csv`, `deck-table`, `deck-bar`, `deck-kpi-grid` or any
  block. As a direct child of a slide it must sit flush under the previous
  block: give `:host` `display: block` and a top margin token
  `--deck-source-gap` defaulting to a small `--rik-sp-*` value. Verify in the
  three layouts the tour uses that the line reads as belonging to the block
  above, not floating.
- `deck-figure` behaviour and attributes unchanged; e2e `figure-versus.spec.ts`
  keeps passing.

**Tests.** Playwright: `deck-source` renders the text, the link when `href`
is set and no link otherwise; `deck-figure` with `source` renders one
`deck-source` in its shadow root with the same text. Add a tour slide: a
`deck-csv` followed by a `deck-source`, and a `deck-kpi-grid` followed by a
`deck-source` with `href`.

**Docs.** Reference section 6 atoms table, section 20 note that every
evidence block takes a `deck-source` under it, CHANGELOG.

### Task 6 · `deck-annotate` becomes a figure

Covers A2. Depends on Task 5.

- `deck-annotate` gains `caption`, `source`, `source-href`. Markup becomes
  `<figure part="figure">` wrapping the existing `.frame` (image, marks,
  leaders, edge overlay), then `<figcaption part="caption">` with the caption
  text (or a `caption` slot), the `deck-source` atom when `source` is set, and
  the existing legend. Keep the legend where it is visually (below the image)
  and the caption line under it, matching `deck-figure`'s caption line.
- `_measure()` must keep measuring the `.frame`, not the figure, so mark
  coordinates do not move. Verify with the existing `e2e` annotate tests.
- Tokens: `--deck-annotate-caption-color` and `--deck-annotate-gap`, defaulting
  to the same tokens `deck-figure` uses.

**Tests.** Playwright: `deck-annotate` with `caption` and `source` renders a
`figure`, a `figcaption` with the caption, and a `deck-source`; marks stay at
the same viewport coordinates as without caption (measure before and after).
Tour: give the existing annotate demo a caption and a source.

**Docs.** Reference section 20 table row, CHANGELOG.

### Task 7 · Named anchors for `deck-annotate` badges

Covers A3. Depends on Task 6.

- `offset` and `offsets` accept, next to `x,y` pixels, one of the keywords
  `above`, `below`, `left`, `right`. A keyword displaces the badge by the
  badge's rendered diameter plus one gap in that direction, and turns the
  leader on for that mark whether or not `leader` is set. Diameter and gap
  come from the rendered badge: measure `.mark` once per `_measure()` and
  publish `--mark-size`; the gap is a token `--deck-annotate-anchor-gap`
  defaulting to a `--rik-sp-*` value.
- Parsing lives in `src/shared/annotation-marks.ts` next to the existing
  `marks` parser (there is an `annotation-marks.test.ts`): `parseOffset(text)`
  returns `{ kind: 'px', dx, dy }` or `{ kind: 'anchor', side }`, and an
  invalid token falls back to `0,0` as today.
- Mixed forms are allowed in `offsets`: `offsets="above|0,-40|right"`.

**Tests.** Vitest on the parser (keywords, pixels, invalid, mixed list).
Playwright: a mark with `offset="above"` renders its badge fully above the
target point (badge bottom above the anchor y) with a leader; `offset="right"`
puts the badge to the right; pixel form unchanged. Tour: the annotate demo
uses one keyword and one pixel offset.

**Docs.** Reference section 20 row for `deck-annotate`, CHANGELOG.

### Task 8 · `footer` slot on `deck-versus` in slide mode

Covers A4.

- `deck-versus` renders `<slot name="footer">` under the two sides, only
  visible in slide mode (like `title`/`lead`). Reading size, full width,
  separated from the sides by one `--rik-sp-*` gap token
  (`--deck-versus-footer-gap`). A `deck-callout` in the footer must render at
  its normal size.
- `rikiki check` must not emit `CONTENT_NOT_RENDERED` for `slot="footer"`.

**Tests.** Playwright in `e2e/figure-versus.spec.ts`: a `deck-versus slide`
with a `deck-callout slot="footer"` renders it below both sides; without
`slide`, the footer is not displayed. Tour: the versus demo gets a footer
callout.

**Docs.** Reference section 20 row for `deck-versus`, the section 21
comparison recipe if it shows `deck-versus`, CHANGELOG.

### Task 9 · Recipes for the record and the graph layouts

Covers A5 and A7, documentation only.

- Reference section 22 ("Recipes for things that are NOT components"): add
  "A single record, field by field" showing a `deck-table` with three columns
  (field, value, source), `highlight-rows` on the field that carries the
  argument, `reveal` for field-by-field disclosure, a `deck-source` under it.
  Render the recipe in a temp deck once to confirm it displays (doc-code
  parity), and add it to the tour.
- Reference section 20 `deck-graph` row: say explicitly that `layout="row"`
  and `layout="column"` ignore `at`, and that there is no automatic
  placement, with the reason in one sentence. Add a pointer to
  `GRAPH_NODE_OVERLAPS_NODE` as the net for hand placement.
- CHANGELOG: nothing for A5; a one-line Docs entry for the record recipe.

### Task 10 · Redesign `deck-kpi-grid` and `deck-persona`

Added on 2026-09-12 at the user's request: both components look unfinished.
Observed at 1920×1080 under the `rikiki` theme, in `decks/tests/extras-more.html`
slides 3 and 5 and `examples/showcase/index.html` slides 13 and 22:

- `deck-kpi-grid`: three figures at roughly 80 px float in the middle third of
  an empty slide. Nothing makes them one family: no shared baseline is visible,
  the label sits a full line below the figure, the optional `ruled` hairline is
  invisible at distance, and `tone="accent"` only colours the digits, which
  under `siliceum` (accent contrast 1.48) is no emphasis at all. The row reads
  as three unrelated numbers pasted on a page.
- `deck-persona`: the initials are faint grey type parked left of the name,
  attached to nothing; name, role and context stack as three lines of the same
  weight family. It reads as an unstyled contact card, not as someone being
  introduced.

**Process, binding.** Load `frontend-design`, then `rikiki-visual-design`,
then `rikiki-component`. Write the design plan first (what carries emphasis,
the two sizes, where the one mass goes), review it against the four rules of
`docs/design/adr-002-extras-visual-direction.md`, then code. Take screenshots
under both themes before and after (`node scripts/shots.mjs` or `rikiki render`
on the fixture deck) and save them in the plan workspace; the controller looks
at them.

**Direction, inside ADR-002.**
- `deck-kpi`: the figure is the statement and must be large enough to own its
  column: scale the value with the slide (container units) so three figures
  fill the row, and align all values of a grid on one baseline so they read as
  one family. The label sits tight under the figure at reading size; the note
  stays quiet under it. A marked figure (`tone` other than `default` and
  `muted`) is the one mass: an inverse block behind that figure with
  `--rik-text-inverse` digits, the tone as a mark on the block (a left stroke
  or the label colour), never a pale tint. Keep `ruled` working. Keep every
  attribute; no new attribute unless the direction cannot be expressed without
  one, and say why.
- `deck-persona`: the portrait block is the one mass: a square of the inverse
  surface holding the initials in `--rik-text-inverse` at statement scale, or
  the photo, so the person has a place on the slide. The name is the statement
  next to it, aligned on the block's top edge; the role line reads under it;
  the context is the quiet line and gets a top gap that separates it from the
  identity. `compact` and `inline` shrink the block and the name consistently.
  `on-dark` inverts the block (paper surface, ink initials).
- Both must hold in the overview grid, the presenter view and the PDF export
  (`print-color-adjust: exact` where a fill carries meaning), under both
  themes, with every value a token and per-instance knobs as `--deck-*`.

**Tests.** `e2e/component-context-variants.spec.ts` and `e2e/extras.spec.ts`
keep passing; `e2e/emphasis.spec.ts` covers the new mass (extend it if it only
lists components by tag). Add an e2e that asserts the values of a three-figure
grid share a baseline (same bottom coordinate within 1 px) and that the persona
initials block has the inverse surface background.

**Docs.** Reference section 20 rows for both components and their token lists;
CHANGELOG Changed entry for each. Update the tour and the showcase only if an
attribute changed.
