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
| 22 optional elements | `optInElements()` from the same source | “optional” |
| ~42 KB initial load | `rikiki/scripts/size-surfaces.mjs`; `size.test.mjs` | Core JavaScript, gzip; optional modules excluded in their section |
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
