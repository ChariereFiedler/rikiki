# Rikiki · scenes: animated diagrams from declarative HTML

**Status**: design, 2026-10-19 · **Family**: `media/` (ADR-004) · **Bundle**: opt-in

## Background

A real deck built on rikiki in October 2026 ("Commerce agentique, l'état des
lieux", 86 slides, three themed variants) drew one animated SVG illustration per
slide, in one consistent style: a card row, a numbered
sequence, a flow into a hub, a bar comparison, a France/United States matrix, a
duration chart. Sixty-odd of these were written by hand, coordinate by
coordinate, and the cost landed in three places:

1. **Placement.** Every card, line and label is an absolute `x`/`y`. Changing one
   word means re-measuring the string (≈ 15 units per bold character, 12.5 per
   regular one) and moving its neighbours.
2. **Silent overflow.** Nothing measures the inside of an SVG. A label that runs
   past its card, two texts that collide, a stroke cropped at the edge of the
   `viewBox` · all of them pass `rikiki check` and are found by looking at
   pictures, one slide at a time.
3. **Repetition.** The same eight shapes came back over and over. One of them was
   turned into a component in the deck (`veille-offre`): eleven slides switched
   to it with a pixel-identical render, and a text change became one attribute.

People who saw the deck asked how to make "graphs like that". This spec moves the
recurring shapes and the missing measurement into rikiki.

## Goals

- **Declarative scenes.** An author writes data and words; the component computes
  the layout, wraps the text to the space it has, draws the SVG and animates it.
- **Measured, not guessed.** Text is measured with the font the slide actually
  uses. A string that cannot fit is reported, never clipped in silence.
- **Themed by tokens.** A scene reads `--rik-*` tokens and its own
  `--deck-scene-*` properties only. The same markup renders on `rikiki`,
  `siliceum` and a dark brand theme without a line changed.
- **Animated inside the drawing, never by blocks.** The scene plays when its
  slide is shown and rests at its final state everywhere else: overview,
  presenter preview, print, PDF, `prefers-reduced-motion`.
- **A check for every SVG.** `rikiki check` reports text that leaves its card and
  texts that overlap, in scenes and in hand-drawn SVG alike.
- **A skill.** `rikiki-scenes` tells an agent which scene answers which message,
  and how to verify it.

## Non-goals

- A charting library. `deck-scene-bars` compares a handful of values; axes,
  scales and series stay out (ROADMAP keeps `<deck-chart>` separate).
- Free drawing, a node editor, or a layout DSL (MANIFESTO §3, ROADMAP
  anti-features). A scene that does not fit the six shapes is still hand-drawn
  SVG · and now gets checked.
- New icons. Scenes use the closed 24-glyph set of `deck-icon`.

## Design

### One item element, six scenes

Every scene is filled with the same child, `<deck-scene-item>`, carrying
attributes only: `label`, `note`, `icon`, `tag`, `value`, `level`, `from`, `to`,
`emphasis`. One child vocabulary is less to learn and less to document than six.
Each scene reads the attributes it needs and ignores the others (the check
already reports ignored attributes).

| Scene | Draws | Message it carries |
|---|---|---|
| `deck-scene-cards` | 2 to 5 equal cards in a row: icon, label, wrapped note, tag | "three options", "who does what" |
| `deck-scene-steps` | numbered rows, label, wrapped note, tag on the right, optional closing band | "start with this, then that" |
| `deck-scene-flow` | sources → one hub → one outcome, arrows and a travelling token | "how it works" |
| `deck-scene-bars` | grouped vertical bars with value and label, one emphasised | "this one is bigger" |
| `deck-scene-matrix` | rows × columns of status dots (`prod`, `test`, `none`…), legend | "where each stands" |
| `deck-scene-ranges` | one row per item, a bar from `from` to `to` on a shared scale, open ranges dashed | "how long each takes" |

Example:

```html
<deck-scene-cards>
  <deck-scene-item icon="target" label="MCP" tag="safe bet" emphasis
    note="one connector for every assistant"></deck-scene-item>
  <deck-scene-item icon="cloud" label="UCP" tag="publish too"
    note="volume is American, no settlement in the EU"></deck-scene-item>
  <deck-scene-item icon="ban" label="AP2" tag="too early"
    note="no production deployment found"></deck-scene-item>
</deck-scene-cards>
```

### Layout and measurement

- The drawing is an SVG with a fixed width of 1600 user units and a computed
  height, so it scales with the slide like an image and keeps proportions.
- Text is measured with `CanvasRenderingContext2D.measureText`, using the
  computed `font` of the host, and wrapped to the width available in its box.
  Each scene sets a maximum number of lines per field (a card note: three).
- When a field still does not fit, the scene reduces that field's size by one
  step, once. If it still does not fit, it draws it, sets `data-overflow` on the
  host and on the item, and logs one warning naming the item. The check turns
  that into an error.
- Measurement runs again on `document.fonts.ready` and on resize, so a web font
  that arrives late does not leave a stale layout.
- No `id` attributes inside the drawing: the overview clones slides, and
  duplicated ids are the bug its snapshot code exists to avoid.

### Theming

Scenes read `--rik-accent`, `--rik-surface-*`, `--rik-text-*`,
`--rik-border-default`, `--rik-font-sans` and `--rik-font-display`. Their own
properties, all optional: `--deck-scene-card-bg`, `--deck-scene-card-stroke`,
`--deck-scene-emphasis-bg`, `--deck-scene-emphasis-text`, `--deck-scene-line`,
`--deck-scene-muted`, `--deck-scene-icon`. A dark theme re-tints a scene by
setting the surface and text tokens it already sets; the "VAULT" variant of the
reference deck is the acceptance case.

Text placed on the emphasis fill takes `--deck-scene-emphasis-text`, decided by
the scene that drew both · not inferred from coordinates afterwards.

### Animation

- The engine calls `applyStep()` on every element of the slide it shows. A scene
  uses that call to set `playing` on itself, restarting the animation each time
  the slide is entered.
- Keyframes exist only under `:host([playing])`: grow (bars, ranges), pop
  (cards, rows), fade (labels), and a token that travels along flow arrows.
  Everything ends within 2.5 s.
- Without `playing` · overview, presenter preview, `rikiki render`, print, PDF ·
  the scene renders its final state. `prefers-reduced-motion: reduce` removes
  the keyframes.

### The check

Two rules, added to `rikiki check`, run on every `<svg>` inside a slide,
including shadow roots:

- `SVG_TEXT_ESCAPES` · a `<text>` whose box leaves the smallest `<rect>` or
  `<circle>` that contains its anchor point, by more than 2 px, or that leaves
  the `viewBox`.
- `SVG_TEXT_OVERLAP` · two `<text>` boxes intersecting by more than 2 px.

Both use `getBBox()` after fonts are ready and report the slide id, the text and
the overflow in pixels, like the existing geometry rules. A scene that set
`data-overflow` is reported as `SCENE_TEXT_TOO_LONG` with the item name.

### The skill

`rikiki/.claude/skills/rikiki-scenes/SKILL.md`: the six scenes and the message
each one carries, the writing rules that keep them readable (one emphasis per
scene, a label of one to three words, a note of one sentence), the verification
loop (`rikiki check`, `rikiki render --steps`), and when to fall back to
hand-drawn SVG. `rikiki-deck` points to it from its "Choosing the element" table.

## Testing

- **Unit** (Vitest): text wrapping against a fake measurer, layout of each scene
  from item counts (positions, heights, equal gaps), range scale, matrix legend.
- **E2E** (Playwright, page objects, `data-testid`): each scene renders in
  `siliceum` and `rikiki`; final state without `playing` and under reduced
  motion; `playing` restarts on re-entry; a fixture with a long note is reported
  by `rikiki check`; a hand-drawn SVG fixture with an escaping text is reported.
- **Docs parity**: reference entry and catalogue page for each element, enforced
  by the existing published-docs tests.

## Rollout

1. `scene-kit.ts` (SVG building, measurement, wrap, playing) and
   `deck-scene-item`, then `deck-scene-cards` and `deck-scene-steps`.
2. `deck-scene-flow`, `deck-scene-bars`, `deck-scene-matrix`,
   `deck-scene-ranges`.
3. The two check rules.
4. Reference, catalogue page, example deck, skill.
5. Acceptance: rebuild five slides of the reference deck with scenes and compare
   them with the hand-drawn originals, in the light and the dark theme.

## Addendum · 2026-10-21 · what the second pass added

Reading two more decks (a technical talk and a live site)
showed what six shapes could not say, and that the check had a blind side.

**Two shapes that tell a story over time**, both with the final state as the picture:

- `deck-scene-lanes` · several lanes carry the same traffic as tokens, a gate comes
  down across all of them, and the tokens still on their way queue against it. The
  kill switch of the live site, generalised (a freeze, a rate limit). The gate waits
  for the last token that passes, on the lane that started last, and drops before
  the first one that stops arrives; that invariant is swept over every count.
- `deck-scene-units` · one cell per person: one to three grids of the same size, the
  first `value` cells of each lit. 200 lit beside the same 200 switched off. The
  height of a grid is capped, because a scene taller than the slide is clipped.

**The check now speaks for the scene, not about its pixels.** A scene is forgiving,
and each of its forgivings is a picture that looks finished and is wrong. `scene-lint.ts`
names them (`SCENE_*`, under the codes of the reference): items past the maximum,
too few, no label, an unknown icon, a value or a bound that is not a number, a
`level` that does not match the columns, an attribute the scene never reads
(`SCENE_READS`, checked against the sources by a test), a grid too dense to count, a
drawing taller than a slide holds (`SCENE_TOO_TALL`), and, as warnings, the writing
rules of the skill. The lint runs in the element and writes `data-scene-issues`, the
way `data-overflow` already worked.

**`check --slides`** takes the list `render --slides` takes, with intervals
(`4-9`, `-3`, `8-`) and two ends (`intro..outro`), so one slide checks in seconds
instead of the deck in minutes.

**Intent first.** The skill now asks what relation the items have before it names a
shape (the talk's lesson: the form must be the reasoning, not its packaging).

**Acceptance on real content.** The new SVG rules, run on the 86-slide deck whose
authors had iterated with their own checker, found four labels that spill out of
their card, one of 86 px that visibly runs into its neighbour. The check on the
example deck found the scenes' own flaw: none had a maximum height, a matrix of six
rows measured 1136 units.
