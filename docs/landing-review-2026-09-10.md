# Landing review — 2026-09-10

Build under review: working tree after the first rubric-driven correction.

## Evidence

- Full page: 1440 by 900 and 390 by 844.
- Playground at actual size: 1880 by 1134, 1440 by 900, 768 by 1024,
  390 by 844, and 320 by 720.
- Browser console: no errors.
- Horizontal overflow: 0 px at all five playground widths.
- Anchored section top: 72 px below the sticky navigation at all widths.

## Gate status

| Gate | Status | Evidence or remaining check |
| --- | --- | --- |
| No horizontal overflow | Pass | Measured at 320, 390, 768, 1440, and 1880 px. |
| No overlap | Pass for playground | Anchor offset fixed; remaining sections require actual-size recapture. |
| WCAG AA contrast | Pending | Automated theme checks pass; landing-specific pairs require an audit. |
| Keyboard and focus | Pending | Editors and links require a full traversal recording. |
| Target size | Pending | Primary actions must be measured across the whole page. |
| 200% text zoom | Pending | Whole-page check still required. |
| Runtime integrity | Pass | No console errors; production build and links pass. |
| Reduced motion | Pending | Carousel, theme preview, and transitions require verification. |
| First-viewport comprehension | Pass | Product, workflow, outputs, and primary action are explicit. |

## Final gate result

The final pass completed every gate:

- zero page overflow at 320, 390, 768, 1440, and 1920 px;
- zero page overflow with text enlarged to 200% at 320, 390, and 1280 px;
- no browser or page errors;
- every non-inline control is at least 24 by 24 px and primary controls are at
  least 44 by 44 px;
- complete keyboard traversal retains a visible focus indicator;
- reduced-motion mode leaves no meaningful animation or transition;
- the editor, Doctor output, carousel controls, theme picker, live token editor,
  FAQ disclosures, and copy actions respond as expected;
- landing contrast pairs meet WCAG AA after correcting faint text, light-surface
  status text, labels, and accent text;
- new component styles contain no raw color values; new color primitives live
  in the palette and semantic tokens reference them;
- local Chromium measurements recorded LCP at 168 ms mobile / 224 ms desktop
  and CLS at 0.050 / 0.061. These are laboratory checks, not field p75 data.

## Final weighted score

| Category | Weight | Score |
| --- | ---: | ---: |
| Message and positioning | 18% | 9.4 |
| Information architecture | 12% | 9.2 |
| Visual hierarchy | 14% | 9.3 |
| Composition and rhythm | 12% | 9.1 |
| Product proof | 12% | 9.5 |
| Conversion and orientation | 10% | 9.2 |
| Interaction and feedback | 8% | 9.5 |
| Responsive design | 8% | 9.1 |
| Accessibility | 4% | 9.2 |
| Performance and resilience | 2% | 9.0 |

Weighted total: **9.29/10**. All gates pass and no category is below 8.0.

## Playground correction

The first actual-size review invalidated the previous 9/10 claim. It exposed a
hidden eyebrow at anchored navigation, unequal panel widths, unused space in the
rendered preview, duplicated workflow and proof rows, and a detached CTA.

The current correction:

- reserves 72 px above anchor targets;
- uses two equal source/result columns;
- reduces the preview's artificial minimum height;
- combines each command with its verified result in one four-step rail;
- keeps the primary action directly below the completed workflow.

## Next highest-value checks

1. Recapture and grade the carousel, theme switcher, plugins, FAQ, and final CTA
   at actual size on desktop and mobile.
2. Run the keyboard, focus, target-size, contrast, zoom, and reduced-motion gates.
3. Fix every failed gate before scoring aesthetics.
4. Score all ten weighted categories and continue until the total reaches 9.0,
   with no category below 8.0.

## Visual pass · 2026-09-12

A peer visual audit of the working tree (24 defects: 4 blocking, 14 important,
6 polish) was applied on the site side and re-measured with Playwright at
1440 and 390 px:

- no text run under 13 px (`--rik-font-size-xs` raised to 0.8125rem, no
  composed `em` reductions on inline code);
- no accent-coloured text under 15 px on paper; small labels use the muted
  text tokens;
- one sentence-case `Eyebrow.astro` for every section, no tracked-out caps;
- no `→` or `↗` in link or button labels; the orphan chevron in the module
  list is gone;
- one 1080 px container for every section (`--rik-measure-page`), FAQ and
  closing block included;
- one button style (`.btn`, `.btn-primary`, `.btn-ghost`, `.btn-icon` in
  `tokens.css`): pill, sans, 16 px, 44 px, applied to all nine controls;
- six layout previews in one 16:9 box at one scale; fixtures mark one cell
  or one card only; gallery and library tiles lost their card chrome;
- the rendered code block in the interactive example carries a full 1 px
  border instead of a single-side inset shadow; the embed snippet renders
  through `CodeBlock`; the embedded carousel hides the runtime counter and
  hint so the host bar is the only chrome;
- the agent-loop arc stays inside its panel; the module list is no longer
  numbered; the limits list has no icons; the closing block is left-aligned
  with a plain command block and no accent span.

Kept on purpose: the accent span in the hero headline, which mirrors the
`deck-cover` signature shown in the gallery thumbnails below it. Left to the
runtime: the accent rule under slide titles (D16) lives in
`rikiki/src/shared-styles.ts`.

Docs tables: `th` at 14 px minimum, `td` at 15 px, copy labels at 13 px.
