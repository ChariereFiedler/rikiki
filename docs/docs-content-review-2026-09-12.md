# Docs content review · 2026-09-12

This review covers the `/docs/*` section of the site (15 pages), rebuilt lot
by lot to compute its own figures instead of retyping them.

## Purpose and audience

The docs section serves two readers on two different paths:

- **Developers and their coding agents**, who need the exact command line, the
  exact flag, the exact JSON field name · `cli.astro`, `api.astro` and the
  packaged `docs/llms/*` reference are written at that level of precision.
- **Newcomers, authors and maintainers**, who arrive at different points of
  the same tree: a newcomer starts at the overview and the quickstart, an
  author returns to the component catalogue and the recipes, a maintainer
  works from the contributing page and the changelog.

No page assumes the reader has already read another one; every page ends with
an explicit "Next" pointer instead.

## The reading path now offered

The sidebar (`site/src/components/Sidebar.astro`) groups the 15 pages into
three sections, in this order:

1. **Getting started** · Overview, Install · Quickstart, Cheatsheet
   (5 components), Anatomy of a slide, Navigation.
2. **Guides** · Check & deliver (CLI), Theming · design tokens, Multi-file
   decks, Recipes.
3. **Reference** · Component library (with computed Layouts / Building blocks
   / Opt-in elements sub-links), `deck-root` API, Runtime modules
   (transitions, presenter, Shiki), Lit & Shadow DOM, the packaged coding-agent
   reference, Changelog, Contributing.

The order matches the sequence a first session actually follows: understand
the format, build something, check and ship it, then go deeper on components,
API and internals only when needed.

## What changed, by lot

### Lot A · CLI page and quickstart step 4

- New page `site/src/pages/docs/cli.astro` ("Check and deliver"). Reads
  `rikiki/package.json` at build time for the Node, Playwright and Rolldown
  ranges (same pattern as the rest of the site), then documents `init`,
  `init --standalone`, `check` (with sub-sections on exit codes, the JSON
  report, and an explicit "what it does not test" list), `render`, `bundle`,
  `export`, `assemble` and `skills`, each with the exact command line on
  `index.html` and a flag table. Guarded by ten new tests in
  `rikiki/scripts/cli-docs.test.mjs`.
- `getting-started.astro` gained a fourth quickstart step,
  `<h2 id="check">4 · Check and deliver</h2>`, right after "3 · Serve it":
  `npx rikiki check index.html`, `npx rikiki export index.html`, and a link to
  `/docs/cli`. The clone instructions were corrected to
  `git clone https://gitlab.com/tordu-jardin/rikiki.git` · `cd rikiki/rikiki` ·
  `npm install` · `npm run build`, and `/docs/cli` was added to "Where to go
  next".

### Lot B · docs index, sidebar, navigation rules, Next blocks

- `docs/index.astro` rewritten: opens on what a deck physically is (a folder
  of readable HTML, `index.html` first, no build step, checked by the CLI,
  delivered as HTML or PDF), a prerequisites line sourced from
  `rikiki/package.json` `engines.node`, the "For coding agents" callout moved
  below "Where to start", a fifth card "Ready to deliver?" pointing at
  `/docs/cli`, and the un-guarded figure "~100 CSS custom properties" replaced
  by the qualitative "one layer of CSS custom properties" (the guarded size
  sentences from `size-surfaces.mjs` were left untouched).
- `Sidebar.astro` reordered into the three sections above and now computes its
  three Reference sub-counts (`layouts`, `atoms`, `optIn`) from
  `rikiki/scripts/component-surfaces.mjs` at build time instead of typing them.
- Every `/docs/*` page carries `index.html` as its running example (not
  `deck.html` or another placeholder); the sole surviving `deck.html` mention
  is a legitimate CLI example (`rikiki export deck.html --output deck.pdf`) in
  `site/src/components/Faq.astro`, not a docs page.
- All 15 `/docs/*` pages now end with the same `<h2 id="next">Next</h2>`
  pattern, deduplicating what used to be inconsistent closing sections.

### Lot C · figures computed, invented figures removed

- `plugins.astro` and `docs/index.astro` load
  `rikiki/scripts/size-surfaces.mjs` at build time (via `pathToFileURL` +
  dynamic `import()`, kept out of the prerender bundle) and derive every size
  they quote from `measureSizes()` / `toKb()`: the six module sizes in the
  runtime-modules table, the Shiki runtime figure, and the engine/initial-load
  split. The previous single figure "the core (`dist/index.js`, ~43 KB gzip)"
  conflated the engine with the initial load; the two are now stated
  separately (engine `dist/index.js` ≈ 26 KB gzip; initial load, engine plus
  Lit and marked, ≈ 43 KB gzip together).
- An invented figure was removed: "~10 keywords per language" for the
  built-in syntax highlighter. `rikiki/src/atoms/deck-code.ts:61` lists 24
  JavaScript/TypeScript keywords alone, so the page now says "over a fixed
  keyword list" instead of a wrong count.

### Lot D · catalogue entries, attribute guard, "optional modules"

- `rikiki/scripts/component-surfaces.mjs` (new) is the single source for
  "how many components does rikiki have": `coreElements()` walks
  `src/index.ts`'s static imports (currently **35** elements), `optInElements()`
  is the complement of the full registered set (currently **23**), and
  `catalogueCounts()` counts the catalogue's own `layouts` / `atoms` /
  `optionalComponents` / `optionalChildren` arrays directly from
  `components.astro`'s frontmatter (currently 8 / 26 / 15 / 8).
- `components.astro`'s atoms array was rewritten and reordered by theme (text,
  data, structure, media) with new entries added so the catalogue matches the
  source, closing the gap `component-surfaces.mjs`'s own comment describes:
  "published as 23, 26 and 30 on different pages while the source registered
  34".
- New attribute guard: `rikiki/scripts/component.test.mjs` fails the build if
  any element's declared `@property` attributes are absent from its own
  catalogue entry text, unless excused in `UNDOCUMENTED_ATTRIBUTES` (currently
  `deck-point`'s `banded` and `deck-mermaid`'s `rendered`, both internal state
  markers, each excuse required to carry a reason longer than 20 characters).
- Vocabulary unified on "optional module" (`docs/index.astro`,
  `docs/contributing.astro`, `docs/components.astro`, `PluginShelf.astro`,
  the home page's `deck-kpi-grid` tile) replacing the earlier "opt-in module"
  wording, matched by the sidebar label "Opt-in elements (23)" only where it
  names the catalogue section, not the general vocabulary.

### Lot E · contributing, changelog, multi-deck, recipes, Lit page, API page, theming

- `contributing.astro` documents the real command set from
  `rikiki/package.json`: `npm run build`, `npm run watch`,
  `npm run typecheck`, `npm test`, `npm run lint`, plus the merge bar
  (`npm run build` must succeed, `npm run typecheck` must stay at 0 errors,
  `npm test` must pass) and the `npm run lint:dashes` rule against em-dashes.
- `changelog.astro` no longer retypes release notes: it reads
  `../CHANGELOG.md` at build time and renders it through the new
  `site/src/lib/changelog.mjs` (a small Keep-a-Changelog-subset renderer,
  HTML-escaping the source first so no changelog text can inject markup),
  injected via `<Fragment set:html>` so headings stay direct children of
  `<article>` and keep the auto-generated table of contents. No `marked`
  dependency was added.
- `multi-deck.astro` documents the manifest-driven multi-file config end to
  end: why to split a deck (`#why`), the manifest shape (`#config`), the part
  files (`#partials`), building it (`#build`), and checking/bundling an
  assembled deck (`#bundle`).
- `recipes.astro` counts its "More compositions" figure from
  `rikiki/docs/llms/rikiki-workflow.md` at build time (`### n · ` headings
  inside that file's `## Recipes` section, currently **9**), instead of a
  typed number, and cross-links that file as the fuller catalogue.
- `lit-and-shadow-dom.astro` covers three override patterns (tokens on one
  instance, tokens globally, light-DOM slots) and a one-line rule for when
  each applies.
- `api.astro` documents `deck-root`'s reactive properties, the fixed-canvas
  vs. fluid choice, events, `use()`, carousel mode, the built-in key bindings
  (linear mode: `←` `→` and `↑` `↓`; `nav="2d"`: `←` `→` for sections, `↑` `↓`
  for sub-slides, matching `src/application/keymap.ts`), the URL hash
  contract, step-reveal in `<deck-code>`, and the customization tokens.
- `theming.astro` keeps its computed WCAG AA contrast figures
  (`WCAG_AA.normalText`, from the same ratio-checking module the page's own
  live samples use) and its `prefers-reduced-motion` snippet, neutralising the
  spring-ease overshoot for readers who ask for reduced motion.

## Claim ledger

| Claim on the docs pages | Computed from | Guarded by |
| --- | --- | --- |
| 35 core components | `coreElements()` in `rikiki/scripts/component-surfaces.mjs`, from `src/index.ts`'s static imports | `rikiki/scripts/component.test.mjs` |
| 23 optional elements | `optInElements()` (registered set minus `coreElements()`) in the same file | same test file |
| Catalogue counts (8 layouts, 26 building blocks, 15 optional modules, 8 child elements) | `catalogueCounts()`, parsing `components.astro`'s own `layouts` / `atoms` / `optionalComponents` / `optionalChildren` arrays | same test file (`the catalogue no longer derives its counts`) |
| Every element documents every attribute it declares | `elementAttributes()` (Lit `@property` scan) checked against `catalogueEntries()` text, with `UNDOCUMENTED_ATTRIBUTES` as the only excuse list | `component.test.mjs`, `it.each(catalogued)('%s documents every attribute it declares', …)` |
| Node / Playwright / Rolldown ranges on `cli.astro`, `index.astro`, `getting-started.astro` | `rikiki/package.json` `engines.node` and `peerDependencies`, read at build time | build fails if the file cannot be read; no separate size/version test needed since the value is inlined at render time |
| Engine size (≈26 KB gzip), initial load (≈43 KB gzip), the six runtime-module sizes, Shiki and mermaid runtime sizes | `measureSizes()` / `toKb()` in `rikiki/scripts/size-surfaces.mjs`, measuring `dist/` with gzip level 9 | `rikiki/scripts/size.test.mjs` |
| Overview layout switch threshold on `plugins.astro` | Read live from `deck-overview.ts`'s `const useSidebar = total > (\d+)` | build throws if the pattern no longer matches, rather than silently keeping a stale number |
| 9 more compositions in the workflow guide (`recipes.astro`) | Count of `### n · ` headings inside `## Recipes` in `rikiki/docs/llms/rikiki-workflow.md` | none dedicated; the number is derived at render time so it cannot drift, though no test currently re-asserts it independently |
| Changelog content | `../CHANGELOG.md`, rendered by `site/src/lib/changelog.mjs` | none dedicated; correctness depends on the markdown subset the renderer supports, and on `CHANGELOG.md` staying in that subset |
| WCAG AA contrast ratios on `theming.astro` | Shared ratio/threshold module (`WCAG_AA.normalText`) also used by the page's live contrast samples | same module, no separate guard test found |

## Verification run

1. `npm run build` (site) · pass. `stage-assets` (8 entries), `astro build`
   (17 pages), `check-dist` (clean, 7.7 MB), `check-links` (all local links
   and anchors resolve).
2. `npm run lint:dashes` · pass. No em-dash found in `src`, `../rikiki/src`,
   `../rikiki/themes`, `../examples`.
3. `npx vitest run scripts/` (rikiki) · pass. 17 test files, 428 tests
   (component, browser, packaging, theme-contrast, css-template, cli,
   assemble, init-source, and more).
4. Manual pass with a local static server (`python3 -m http.server` on
   `site/dist`) and Playwright, on all 15 `/docs/*` pages listed in
   `Sidebar.astro`, at 1440×900 and 390×844:
   - no horizontal overflow (`scrollWidth <= innerWidth`) on any of the 30
     page × viewport combinations;
   - zero console or page errors on the same 30 combinations;
   - every sidebar link resolves to HTTP 200 (through the test server's
     trailing-slash redirects, not through anything astro itself does);
   - the in-page anchors the sidebar targets (`#layouts`, `#atoms`,
     `#optional` on `/docs/components`) exist;
   - every `/docs/*` page has an `<h2 id="next">`;
   - `/docs/cli` exists and mentions `check`, `render`, `bundle`, `export`;
   - the sole remaining `deck.html` mention in `site/src` is the legitimate
     CLI example in `Faq.astro`, not a broken link.

No step was skipped and none failed.

## Independent review

Weighted score **7.9/10** · audience 8.3, proposition 9.0, factual accuracy
8.8, completeness 7.9, narrative 8.6, clarity 8.7, scannability 8.0, proof 9.0,
calls to action 8.8. Nine of ten content gates passed; gate 4 (numerical
accuracy) failed and caps the raw weighted score from 8.56 down to 7.9. The
failure and the other findings, most to least material:

- **Blocking (gate 4).** `index.astro`'s "Custom Elements and Shadow DOM …
  have shipped in every major browser since 2018" is wrong for EdgeHTML,
  which never shipped either; Chromium Edge only arrived January 2020. Should
  read "in every current browser" or "since 2020".
- `getting-started.astro`'s description promises "three steps" while the page
  now has four numbered sections (Install, Your first deck, Serve it, Check
  and deliver). Either say "four steps" or fold step 4 into an unnumbered
  closing note.
- `theming.astro`'s "WCAG 2.3.3 compliance, vestibular safety" overstates:
  2.3.3 is an AAA criterion satisfied here by honouring
  `prefers-reduced-motion`, not a compliance claim the page can make on its
  own. Rephrase as "honours `prefers-reduced-motion`, the technique behind
  WCAG 2.3.3".
- `cli.astro`'s JSON report paragraph calls a field "the thresholds that were
  applied"; the actual field is `limits` (`rikiki/bin/lib/check.mjs`), and
  `settled` / `statesInspected` / `visualMeasured` also exist unnamed. Name
  the field or link a schema.
- `navigation.astro`'s linear-mode key table lists only `←` `→`, while
  `src/application/keymap.ts:113-114` also advances/reverses on `↓` `↑` in
  linear mode, and `api.astro`'s own key table already includes them. Add
  `↑` `↓` to the linear row so the two pages agree.
- `components.astro` claims "the core catalog fits in five practical
  buckets", but ten core elements sit in none of them (`deck-kbd`, `deck-fit`,
  `deck-csv`, `deck-cell`, `deck-point`, `deck-metric-list`, `deck-tier`,
  `deck-tier-arrow`, `deck-step`, `deck-shortcut-list`). Add a sixth bucket
  ("Sub-elements and helpers") or reword to "the 24 you will meet first".
- `theming.astro`'s "Why tokens, not CSS selectors" section restates the
  page's own override section and the whole Lit page without new evidence.
  Merge it or replace it with a one-line link to `lit-and-shadow-dom`.
- `cli.astro`'s check output block is captioned only "stderr"; label it "an
  example report" so a reader does not go looking for slide `#pricing` in
  their own deck.
- `plugins.astro` claims unsupported Shiki language names "are rejected
  during installation instead of silently growing the bundle"; there is no
  such guard in `src/plugins/shiki.ts`, only the vendored highlighter
  throwing at runtime. Add the guard, or soften to "fails at
  `installShiki()`".
- Several unexplained terms in reference summaries: GFM (`deck-md`), `cqw` /
  `cqh` and "size container" (`deck-cell`, the bento guide), "TextMate-quality"
  (`plugins.astro`). One clarifying parenthesis each would resolve it.
- Several label-only headings (Contributing's "Setup" / "Conventions" /
  "License"; Theming's "Contrast notes" / "Type scale" / "Naming convention";
  API's "Events") are fine in context but would not stand alone in a sidebar
  or table of contents.
- `Sidebar.astro` has no entry leading to embedding, and the label "Check &
  deliver" differs from the page's own title "Check and deliver" (the
  contributing page bans em-dashes, but the site mixes `&` and `and` for the
  same page).
- `index.astro`'s "Design principles" and `getting-started.astro`'s
  "Via CDN" both restate "zero build / no toolchain"; the CDN section could
  carry the evidence instead (a static server and two `<link>`/`<script>`
  lines is everything `rikiki init` writes).

Known and accepted, not counted against any gate: `getting-started.astro`
pins `https://cdn.jsdelivr.net/npm/rikiki-deck@1.0.0/…`, and the index and
changelog pages announce 1.0.0, while `rikiki-deck@1.0.0` is not yet published
to npm.

## What could not be verified, and what stays out of scope

- Real reader outcomes (whether a newcomer actually completes the quickstart,
  whether an agent actually succeeds against `docs/llms/*` unattended) cannot
  be verified without analytics or a live user session; only structural and
  factual checks were run.
- The README and the packaged `docs/llms/*` files were read as evidence for
  claims made on the site but were not themselves in scope for rewriting.
- Publication of `rikiki-deck@1.0.0` to npm is out of scope for this review;
  the CDN pin and the version claims are accurate to the repository state,
  not yet to what `npm install` currently returns.
