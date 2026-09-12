# Landing content review · 2026-09-11

This review applies `docs/landing-content-rubric.md` to the English landing page.
It treats the primary audience as developers and technical teams who create
presentations in code. Documentation, training and coding-agent use are
secondary paths.

## Decision path

The page now follows the questions a prospective user asks:

1. What is this and is it for me?
2. Can I inspect the source and the result?
3. Can a coding agent author the same source?
4. Which layouts and theme controls are available?
5. Can I embed the material in another page?
6. What is optional, how large is it, and when does it load?
7. Which requirements make Rikiki a poor fit?
8. What do I need to start?

## Claim ledger

| Landing claim | Evidence | Qualification on page |
| --- | --- | --- |
| 35 core components | `rikiki/scripts/component-surfaces.mjs`; `component.test.mjs` | “core components” |
| 23 optional elements | `optInElements()` from the same source | “optional” |
| ~43 KB initial load | `rikiki/scripts/size-surfaces.mjs`; `size.test.mjs` | Core JavaScript, gzip; optional modules excluded in their section |
| Standalone HTML | `rikiki/bin/lib/bundle.mjs`; bundle E2E tests | Result of `rikiki bundle` |
| PDF export | `rikiki/bin/lib/export-pdf.mjs`; print E2E tests | Playwright requirement stated in FAQ |
| Structural, runtime, timing and visual checks | `rikiki/bin/lib/check.mjs` | Accessibility exclusions stated next to the claim |
| Agent authoring workflow | Packaged `llms.txt`, `docs/llms`, and three packaged skills | Rikiki supplies the contract and diagnostics; an external coding agent authors the file |
| Embedded carousel | `rikiki/e2e/embed.spec.ts`; live landing demo | Container scaling and focus requirement stated |
| Optional-module sizes | Current files under `rikiki/dist`, measured by the component with gzip level 9 | Shiki loader and the Shiki engine listed separately |
| MIT | `rikiki/LICENSE`; package metadata | Applies to Rikiki |

## Corrections made after the first audit

- Named the primary audience and in the first viewport.
- Reduced the main proposition to technical presentations in readable HTML.
- Moved embedded training after the core authoring, layout and theming path.
- Added a dedicated coding-agent workflow and linked the packaged reference.
- Relabeled the browser-side checker as simplified markup hints and removed
  invented diagnostic codes, runtime claims and accessibility claims.
- Replaced sample counts and duration figures with the actual output type of
  each CLI command.
- Added the required file argument to every CLI example.
- Corrected the npm package name to `rikiki-deck`.
- Replaced copied plugin weights with build-time measurements and exposed the
  full vendored Shiki payload.
- Added a fit section for visual-editor, SaaS, `.pptx`, animation and Web
  Component requirements.
- Rewrote the FAQ around adoption questions and the limits of automated checks.

## Findability check

| Task | Heading or first sentence that answers it |
| --- | --- |
| Identify the product | Hero eyebrow and lead |
| Create and inspect a deck | “Write. Inspect. Deliver.” |
| Use a coding agent | “Give an agent a contract, then check its work” |
| Select components | “Compose with purpose-built layouts” |
| Customize the brand | “Brand the same source with tokens” |
| Embed training | “Put the deck inside the page” |
| Evaluate payload | “Bring only the pieces the deck needs” |
| Reject a poor fit | “Know when Rikiki fits” |
| Install and start | Final “Create your first deck” action |

## Independent result

The final independent review passed all ten content gates and scored the page
**9.0/10 weighted**: audience 9.2, proposition 9.2, factual accuracy 9.1,
adoption completeness 9.0, narrative 8.8, clarity 8.7, scannability 8.6,
proof 9.1 and calls to action 9.1. The five non-blocking findings from that
review were then fixed: agent-section order, internal jargon, hero size guard,
optional-component count guard and copy-button feedback nuance.

A numerical target never overrides an unsupported claim. The claim ledger and
automated guards remain the release criteria when the product changes.

## Second pass · argument, proof and journey

A second editing pass reworked the argument, the proof and the reading order.
Changes are grouped by lot.

### Lot A · hero double promise

The hero now states two authoring paths instead of one: a human writes the
HTML, or a coding agent does, against the same packaged contract. The eyebrow
and lead carry the manifesto argument (readable HTML, no build step, the
runtime sits in the folder) so the page opens on the proposition rather than
on a feature list.

### Lot B · journey order

The decision path was reordered so init comes before check: a reader first
creates a deck, then verifies it, matching the order a first session actually
follows. Vocabulary was unified on a single pair, “deck checks” and
`rikiki check`, replacing the mixed “checker” / “markup hints” language from
the first pass. The coding-agent section moved up to position 02, right after
the create step, since agent authoring is a primary path and not an
afterthought.

### Lot C · proof by artefact

A gallery of the three example decks shipped under `examples/` now backs the
component and size claims with artefacts instead of prose: a thumbnail
rendered by `npx rikiki render`, and a slide count computed at build time from
the deck's own `<deck-root>` markup, not typed by hand. The release version,
release date and maintainer, previously stated near the FAQ, moved into the
gallery footer next to the decks they describe.

### Lot D · FAQ objections

The FAQ now answers the objections a developer evaluating the tool would
raise before adoption: why not reveal.js or Slidev, why not Markdown as the
deck format, and what the ongoing maintenance commitment is. The Markdown
question in particular clarifies that Markdown is not the deck format by
design choice, while the packaged `<deck-md>` component still renders
GitHub-flavoured Markdown inside a slide.

### Lot E · cleanup

`StickyCta` was removed as dead code (unused, not imported anywhere). The nav
now separates the plain source link from a single accented call to action.
Library tile copy was rewritten as full sentences in the page's register, and
the two theme-swap descriptions were corrected to name visible colors instead
of internal palette labels.

### Claim ledger additions

| Landing claim | Evidence | Qualification on page |
| --- | --- | --- |
| Example-deck slide counts | `site/src/components/DeckGallery.astro` (`slideCount()`, reading direct `deck-*` children of `<deck-root>` from each staged deck's own HTML, the same set the runtime collects in `src/runtime/deck-root.ts`) | Computed at build time, not typed by hand |
| Example-deck thumbnails | `site/src/components/DeckGallery.astro`; images staged under `public/decks/thumbs/` | Caption states they are rendered by `npx rikiki render`, one picture per first slide |
| Current release version and date | `site/src/components/DeckGallery.astro` and `Faq.astro`, both reading `rikiki/package.json` and the dated entry in `CHANGELOG.md` | Build fails if the changelog has no entry for the running version |
| Maintainer and repository | `site/src/components/DeckGallery.astro` and `Faq.astro` | Links to `gitlab.com/tordu-jardin/rikiki` |
| Deck is not a Markdown format, by design | `site/src/components/Faq.astro` (“Can I write my slides in Markdown?”); `rikiki` custom-element model | Qualified: `<deck-md>` renders GitHub-flavoured Markdown inside a slide, a deck can mix HTML slides and Markdown bodies |

### Corrected figures

The first pass's `~42 KB` initial-load figure and `22` optional-element count
were stale against the currently tested surfaces. Both rows in the claim
ledger above are corrected to `~43 KB` and `23 optional elements`.

### Verification run

All four checks passed against this repository: `npm run build` in `site/`
(asset staging, 16 pages built, clean dist, all local links and anchors
resolved), `npm run lint:dashes` in `site/` (no em-dash found), `npx vitest
run` in `rikiki/` (3 files, 64 tests, all green), and a Playwright pass
against the built `site/dist` at 1440x900 and 390x844 (no horizontal
overflow, no console errors, the `#decks` section present with its three
deck links returning HTTP 200 and their thumbnails loaded, the hero's
secondary call to action scrolling to `#decks`).

### Independent review

Two independent reviews ran without a target score. The first returned
7.9/10 with three gate failures, all fixed in the same pass: prerequisites
stated next to the CLI commands (Playwright, the rolldown bundler), the
interactive panel relabelled as sample rules rather than a subset of the
product's checks, and an accessibility item added to the FAQ from the axe
end-to-end suite and the tagged PDF export.

The second review returned 7.7/10 weighted, capped by gates 1 and 2, for one
reason outside the page: `rikiki/package.json` and `CHANGELOG.md` announce
v1.0.0 dated 9 September 2026, but the repository's latest tag is v0.6.0 and
the npm registry serves `rikiki-deck` 0.6.0, whose CLI has none of the
`init deck.html`, `check`, `render` or `export` commands the page quotes. The
page is accurate for the announced release and false for the published one.
This finding predates the second pass (the first pass already stated
v1.0.0) and is a release decision, not a copy decision: publish 1.0.0
before deploying the landing, or relabel the release line and pin the
install command until then. Without that gate failure the raw weighted total
was 8.0, with accuracy at 5.5 and calls to action at 6.5 for the same reason.

The remaining minor findings from that review were then fixed: the
`deck-cover` tile no longer promises a date attribute, the `deck-feature`
tile names a Markdown table since `deck-table` is opt-in, both theme
descriptions name the paper page surface, "rolldown" is glossed as a
bundler, the export step reads "PDF", and the FAQ no longer promises "five
years from now". The docs-tour cover was corrected from "in 14 slides" to
"in 20 slides" to match the runtime count the gallery displays, and its
thumbnail re-rendered with `rikiki render`. Still open: the "35 core
components" figure counts `deck-root`, which authors never write, and the
CLI example filename differs between the landing (`deck.html`) and the
getting-started page (`index.html`).

### What could not be verified

Real conversion impact: there is no analytics on the site to measure it.
