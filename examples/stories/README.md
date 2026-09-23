# Fictional presentation briefs

Three complete fifteen-slide stories, each with its own narrative device (see `review/narrative-direction.md`), written with the Rikiki authoring workflow:

- `quidditch.html`: an equipment committee chooses a broom trial before placing an order. A saddler's catalogue at night: claret ground from the photograph, bone cards, brass marks, Bodoni Moda with Jost.
- `acme.html`: ACME reviews a Road Runner capture rehearsal, including its missing dependency, failure modes and an abort condition. A cartoon storyboard: the painting's desert sky, machine vermilion, letterbox black, Barlow Condensed with Barlow.
- `three-pigs.html`: the three little pigs scope a shared refuge and decide what to survey, build and accept. Three points of view converging on one refuge: the lamplit wall behind the model, the wolf's shadow as a night register, brick for weak points and straw gold for agreements, Fraunces with Archivo.

All three are fictional exercises. Recommendations are proposed scenario decisions, not canonical specifications or measured product claims. Each deck contains a full narrative, stable slide IDs and presenter notes. No prices, performance results or schedules have been fabricated.

`rikiki.html` is the dedicated one-slide product introduction embedded in the landing hero. `check-fixed.html` is the visually revised, explicitly illustrative retention fixture used in the recorded before/after example. `incident.html` supplies the small HTML source example on the landing.

From the repository root:

```sh
node rikiki/bin/rikiki.mjs check examples/stories/quidditch.html --json
node rikiki/bin/rikiki.mjs render examples/stories/quidditch.html --out /tmp/quidditch-shots --steps
```

The website stages the linked decks from these sources. Cover thumbnails in `site/public/stories/thumbs/` are rendered from the same files and should be regenerated after cover changes. The landing's recorded check result lives in `site/src/data/landing-check.json`; update it together with the corresponding screenshot after rerunning the fixture.

## Art direction

Each deck owns one theme file in `art/` (palette, semantic tokens, component tokens, then the few light-DOM rules a component leaves to the author), loaded after `rikiki/themes/rikiki.css`. Fonts are self-hosted OFL subsets in `art/fonts/`. The three supplied Midjourney illustrations are reused unchanged and cropped in CSS for detail slides. The decks contain fictional proposals, not measured product rankings or construction specifications.

The current plan and review records are `review/art-direction.md` and `review/visual-review-2026-09-23.md`; they supersede the earlier files in `review/`.

## Native component showcase

- Quidditch: `deck-photo`, `deck-bento` with `deck-stat` and `deck-icon`, a three-column `deck-split`, a `deck-point` shortlist, `deck-checklist`, `deck-flow` (revealed), `deck-feature-cards`, `deck-graph` with a `deck-group`, a row `deck-step-list`, `deck-table`, `deck-versus`, `deck-bar`, `deck-persona`.
- ACME: `deck-photo`, `deck-versus` (twice), `deck-checklist`, two row `deck-graph`s, `deck-step-list`, `deck-annotate` (revealed), `deck-flow` (revealed), `deck-bento`, two `deck-table`s, `deck-kpi-grid`, `deck-feature-cards` with `deck-punch`.
- Refuge: `deck-photo`, `deck-bento`, two `deck-annotate`s (revealed), `deck-versus`, `deck-flow`, three `deck-split` material slides, `deck-step-list`, `deck-tier-list`, `deck-timeline` (revealed), `deck-table`, `deck-checklist`.

Detail crops are CSS background crops of the supplied images, so they render identically in Chromium, Firefox and WebKit.

Regenerate the landing thumbnails from the real cover slides with `node site/scripts/capture-story-thumbnails.mjs` from the repository root. The landing versions image URLs by content hash to invalidate stale cached covers.

Mechanical checks do not constitute visual approval. Review every screenshot and reveal state; track typography, spacing, icon/text alignment and narrative usefulness separately.

## Interactive product tour

`rikiki.html` is the ten-slide tour embedded in the landing hero. It demonstrates
bento, split, versus, flow reveals, code highlighting, semantic theming and the
check/review/delivery workflow. Its speaker notes explain the commands and their
optional dependencies. The landing's external previous/next buttons drive the
native keyboard navigation, including reveal states.
