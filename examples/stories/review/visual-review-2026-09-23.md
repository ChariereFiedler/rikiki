# Visual review · 2026-09-23 · fifteen-slide decks

Screenshot review of the three decks after their expansion to fifteen slides each, following `narrative-direction.md`. Every slide and reveal state was walked in **Playwright Firefox** at 1920×1080 (Quidditch 19 states, ACME 22, refuge 25); ACME was also walked at 2048×1056 and its two graphs captured at 2317×1032, the size of the user's report. Chromium renders from `rikiki render` were used earlier in the same pass. A clean `rikiki check` is not design approval; the notes below come from looking at the images.

## Three narrative treatments

- **Quidditch, an equipment hearing.** Candidates audition for jobs: squad needs, outcomes, shortlist, one slide per candidate with a different native form each (checklist beside a portrait crop, a revealed four-phase `deck-flow`, a `deck-feature-cards` with a photo band), then the shared course graph, station order, a blank observation rubric table, the rejection rule, the allocation bar, upkeep, a four-person procurement gate (`deck-persona`) and the ask.
- **ACME, a postmortem.** Confident pitch, goal versus mechanism, observed versus assumed, the dependency graph, the designer's own sequence, then three comic beats (empty mark crop, annotated walk into the scene, revealed flow), the causal flaw, operator risk, alternatives table, a deliberately shorter Revision B graph, stop conditions, an observation log with one row marked illustrative, and the funding split. Capitals are reserved for the punchline beats; review slides use sentence case.
- **Refuge, three points of view converging.** Each sibling's perspective and blind spot, the wolf's reading of the model (annotated, on the night register), the shared decision, "usable" as four verbs, one slide per material alternating wall / sheet / night, the roof-wall junctions, the route, priorities, programme timeline, open roles, acceptance walk and the ask back on the opening image.

## Refuge graphic treatment (rejected grey version replaced)

The page is now the lamplit wall behind the model; the wolf's shadow is the dark mass and a full "night" register; technical beats sit on a paler pinned sheet. Fraunces tells the story, Archivo carries details, brick marks weak points and straw gold marks agreements. Material slides crop the supplied model.

## ACME graph labels in Firefox · root cause and fix

Reproduced with Playwright Firefox. `deck-graph` measured nodes with `getBoundingClientRect()`, which includes the deck's fit-to-screen scale, then placed edge captions with `left: …px` inside the graph's own unscaled box. On any viewport that is not exactly 1920×1080 the caption drifted towards the origin by the scale factor, onto the node on its left, and it was painted **before** the slotted nodes, so it disappeared under them. Chromium CLI captures run at scale 1, which is why they looked right.

Fix in `rikiki/src/media/deck-graph.ts` (rebuilt into `rikiki/dist/deck-graph.js`):

- captions are positioned in percent of the measured box plus the author's pixel offset, which is scale-free;
- they are anchored on the painted segment (boundary to boundary), not on the centre-to-centre midpoint;
- they render after the node slot with `z-index: 1`, so a caption is never under a node.

Regression test added in `rikiki/e2e/graph.spec.ts` (a caption wider than the gap, in a scaled deck, must paint on top and be centred on the gap). The graph suite passes 30/30 on Chromium, Firefox and WebKit; the CLI and source unit tests pass 364/364.

## Cross-browser crops

`object-view-box` (Chromium only) is gone. Every detail crop is a CSS background crop of the supplied image with `role="img"` and a label, verified in Firefox on all three decks.

## Residual notes

- Quidditch slide 8 keeps `GRAPH_NODE_SIZES_MIXED`: the plain rider and the boxed comparison differ on purpose.
- Refuge slide 10 keeps `SLIDE_TOP_HEAVY` (33 % below the content); the route is four short steps and a caveat, and filling the space would add text for its own sake.
- In `deck-annotate` states, the newest legend line can be captured during its 0.2 s fade-in.
- Crops are upscales of the supplied images and are slightly soft at full size.
- The screenshot-review import still cannot be completed: capture hashes differ between two runs of an unchanged deck, so no verdict can be imported honestly. No passing import was fabricated.
- Presenter view, PDF export and mobile widths were not inspected.
