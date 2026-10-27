---
name: rikiki-scenes
description: Use when a rikiki slide needs an animated diagram instead of text — cards to compare, numbered steps, a flow into a hub, a few bars, a status matrix, durations on a scale — or when a hand-drawn SVG illustration overflows, overlaps or is cropped. Triggers on "animated diagram", "illustration animée", "schéma animé", "graphe animé", "deck-scene", "SVG slide".
---

# Animated scenes in a rikiki deck

> **For a new illustration, start with `rikiki-illustrate`**: marks and layouts, no
> coordinate, and the whole range of shapes. This skill covers the eight fixed scenes
> (`deck-scene-cards`, `-steps`, `-flow`, `-bars`, `-matrix`, `-ranges`, `-lanes`,
> `-units`), which stay for the cases they say exactly, and the checks they share.

A scene is a slide's illustration written as data: the author gives words and
figures, the scene measures the text in the deck's own font, lays everything out
on a 1600-unit canvas, draws the SVG in the theme's colours and animates it when
the slide is shown. Nothing is placed by hand, so nothing is placed wrong.

One illustration per slide, and the title states what it proves (rikiki-deck,
"Composition"). A scene is the evidence, not a decoration.

## Start from the intent, then pick the shape

Write down what the room must understand before choosing a scene. A shape chosen
first is the usual failure: five arrows for "five independent things", three
boxes joined by dotted lines for "a cycle". **The form must be the reasoning,
not its packaging** · if the scene could be swapped for a bullet list without
losing anything, it is not earning its place.

Ask what *relation* the items have:

| The items are… | Say it with | Not with |
|---|---|---|
| parallel, of the same rank: options, actors, pillars | `cards` (2 to 5) | `steps`, which says "in this order" |
| ordered in time: do this, then that | `steps` | `cards`, which loses the order |
| converging: several inputs, one thing, one result | `flow` | `steps`, which has no hub |
| compared by size: one number each | `bars` | `cards` with the figure in the note |
| placed on two axes: who is where, in what state | `matrix` | `cards`, one per cell |
| spread over time: how long, from when to when | `ranges` | `bars`, which has no start |
| the same traffic, until one thing changes: a switch, a freeze, a limit | `lanes` | `flow`, which has no "before" and "after" |
| a share of a crowd, one cell per person: 200 who came, none who stayed | `units` | `bars`, which loses the people |

The title states what the scene proves, and the emphasis is the item the title
argues for. A scene with nothing to emphasise is a list. Keep that title to about
36 characters, on one line: a scene has about 620 units under one line of title,
and a title that wraps takes about 80 of them.

## Pick the scene from the message

| The slide says | Scene | Items carry |
|---|---|---|
| "These options side by side", "who does what" | `deck-scene-cards` (2 to 5) | `icon`, `label`, `note`, `tag`, one `emphasis` |
| "Start with this, then that" | `deck-scene-steps` (1 to 6, about 4 with the band) | `label`, `note`, `tag`, `emphasis`; scene `conclusion`, `conclusion-note`, `conclusion-icon` |
| "How it works" | `deck-scene-flow` | 1 to 4 sources, then the hub (`emphasis`), then 1 or 2 outcomes (`tag` on the arrow) |
| "This one is bigger" | `deck-scene-bars` (up to 8) | `value`, `label`, `tag`, `note` as group caption, `emphasis`; scene `unit`, `max`, `height` |
| "Where each one stands" | `deck-scene-matrix` (3 rows fit a slide, 6 are allowed and too tall) | row `label`, `level` per column (`prod`/`pilot`/`test`/`announced`/`none`), `emphasis`; scene `columns`, `groups`, `statuses` |
| "How long each takes" | `deck-scene-ranges` (up to 8) | `label`, `note`, `from`, `to`, `tag`; scene `scale`, `unit`, `caption`, `open-label` |
| "What happens when one thing changes" | `deck-scene-lanes` (2 to 5 lanes) | `label`, `note`, `icon`, `tag` (the outcome); scene `gate`, `trigger`, `passed`, `blocked` |
| "One cell per person" | `deck-scene-units` (1 to 3 grids) | `label`, `icon`, `value` (cells lit), `note`, `emphasis`; scene `total`, `columns` |

Details that save a round trip:

- **Flow roles come from order.** Items before the `emphasis` are sources,
  items after it are outcomes. Without an emphasis the last item is the hub.
- **Bars group by `note`.** Consecutive items with the same note share a
  caption and a divider. `tag` prints instead of the figure (`×3`).
- **Matrix words are yours.** `statuses="prod=en production|test=en test|none=rien à ce jour"`
  puts the deck's language under the dots and in the legend.
- **Ranges show the unknown.** A row with no `to` is drawn dashed with
  `open-label`; `to` alone is a single point, not "0 to N".
- **A figure and its unit stay together** across a no-break space (`12 ms`).

Load the module after the core bundle; it brings `deck-scene-item` with it:

```html
<script type="module" src="dist/deck-scene-cards.js"></script>

<deck-feature eyebrow="Protocols">
  <h1 slot="title">Only one protocol is a safe bet today</h1>
  <deck-scene-cards>
    <deck-scene-item icon="target" label="MCP" tag="safe bet" emphasis
      note="one connector serves ChatGPT, Claude and Copilot"></deck-scene-item>
    <deck-scene-item icon="cloud" label="UCP" tag="publish too"
      note="real volume, but American"></deck-scene-item>
    <deck-scene-item icon="ban" label="AP2" tag="too early"
      note="no production deployment found"></deck-scene-item>
  </deck-scene-cards>
  <deck-source>Protocol specifications, October 2026</deck-source>
</deck-feature>
```

## When the message is a relation between two pictures

One scene says one thing. **Before and after, this against that, a mechanism and
its proof** are a relation between two things, and two slides lose it. Put the
scenes in a `deck-scene` (`dist/deck-scene.js`):

| The message is… | Compose |
|---|---|
| a change: before then after, the same measure twice | `row` + `link="arrow"` of two scenes of the same shape, one `emphasis` on the "after", a `deck-scene-band` with the verdict |
| a rival: this against that | `row` + `link="vs"`, equal split |
| a mechanism and its proof | `row` + `split="2:1"`: a `flow` (the how) beside `bars` or `units` (the measure) |
| a result and what follows | `stack`: a scene above, a `deck-scene-band` under it |

Rules that keep it one illustration, not two stuck together:

- **Same shape for a comparison, different shapes for an explanation.** Two
  `units` for before/after; a `flow` and `bars` for a mechanism and its proof.
- **One thing put forward in the whole composition.** `emphasis` in one region
  only (`SCENE_EMPHASIS_SCATTERED`).
- **Two scenes of a row, three at most**, and nothing under 440 units wide
  (`SCENE_REGION_TOO_NARROW`): in a narrow region fewer items and shorter words,
  never smaller type · a region is laid out for its width, not shrunk.
- **The verdict goes in the band**, once, in the words of the title.
- **The height budget is the slide's**: the tallest scene of a row, or the scenes
  of a stack and the gaps between them, plus the band (`SCENE_TOO_TALL`).

If none of the eight shapes carries the message, draw the SVG by hand · the
check below measures hand-drawn SVG too.

## Writing rules that keep a scene readable

- **One emphasis per scene.** It is the item the title argues for. Two emphases
  are none.
- **Labels of one to three words, notes of one sentence.** The scene wraps a note
  to its box; it does not make a paragraph readable at ten metres.
- **Explain a term the first time it appears**, in the note, in plain words.
- **Every figure has its source** in `deck-source` under the scene, and its
  nature (vendor figure, correlation, forecast) in the notes.
- **Icons come from the closed 24-glyph set** of `deck-icon` (check, cross,
  alert, info, question, ban, arrow, arrow-down, clock, calendar, refresh, trend,
  user, team, target, flag, lock, search, code, database, cloud, document, chart,
  spark). An unknown name draws no icon.
- **Re-theme with tokens, never with scene CSS**: `--deck-scene-card-bg`,
  `--deck-scene-card-stroke`, `--deck-scene-emphasis-bg`,
  `--deck-scene-emphasis-text`, `--deck-scene-muted`, `--deck-scene-tag`,
  `--deck-scene-icon`, `--deck-scene-line`, on top of the theme's `--rik-*`.
  Steps' band adds `--deck-scene-band-bg/-text/-muted/-icon`, bars
  `--deck-scene-value` and `--deck-scene-value-emphasis`, the matrix
  `--deck-scene-row-emphasis-bg`. On a photo background, set the card tokens to
  a translucent surface rather than restyling the SVG.

## Animation

A scene plays when its slide is entered and rests at its final state everywhere
else: overview, presenter preview, `rikiki render`, print, PDF, and
`prefers-reduced-motion`. Do not add reveals or `data-step-block` around a scene ·
the motion is inside the drawing, which is the point.

## Verify

Work one slide at a time, and check the whole deck once at the end:

```sh
npx rikiki check deck.html --slides 7          # a few seconds, only slide 7
npx rikiki render deck.html --slides 7         # the picture of that slide · look at it
npx rikiki check deck.html --slides 5-9        # a run of slides (-3 · 8- · intro..outro too)
npx rikiki check deck.html                     # the whole deck, before shipping
```

`--slides` takes numbers, ids, intervals and two ends, comma-separated · the same
list for `check` and `render`. A clean report on three slides is not a clean deck.

A scene is forgiving, so it can draw a wrong picture without a word. `check`
says so, under codes that name the items concerned:

| Code | Means · what to do |
|---|---|
| `SCENE_TEXT_TOO_LONG` | a field did not fit even one size down · the report names the item **and the field** (`label`, `note`, `figure`, `caption`) with the width it needed · shorten that field, do not widen the scene · a bar's figure shrinks to 70% on its own first, then wants a shorter `tag`, no unit or fewer bars |
| `SCENE_ATTRIBUTE_INVALID` | bars `max` / `height` or ranges `scale` is not a positive number · the scene drew its default |
| `SCENE_VALUE_CLIPPED` | a bar value past `max`, or a range bound past `scale`, or negative · the bar stops at the edge and lies about its size · raise `max` / `scale` |
| `SCENE_LAYOUT_INVALID` | a `deck-scene` with an unknown `layout`, `link` or `split`, fewer than two scenes, or a child that is neither a scene nor the band |
| `SCENE_REGION_TOO_NARROW` | a scene of a row under 440 units · fewer scenes, or a `split` that gives it more |
| `SCENE_EMPHASIS_SCATTERED` | more than one scene of a composition puts something forward · one only |
| `SCENE_FONT_FALLBACK` | the theme's font is not there, so the scene measured the fallback's widths · a clean report means nothing until this is gone · serve the theme's fonts |
| `SCENE_GROUP_SPLIT` | bars: a `note` comes back after another · only neighbours share a group · put the items of a group side by side (the group goes in `note`, the series in `label`) |
| `SCENE_ITEMS_DROPPED` | more items than the scene draws · the extra ones are cut · remove them or split the slide |
| `SCENE_TOO_FEW_ITEMS` | too few for the shape · a card alone compares nothing |
| `SCENE_TOO_TALL` | the drawing is taller than a slide holds (about 620 units under a title of one line · a title over about 36 characters wraps and costs about 80 more) and the slide clips it · a matrix of more than 3 rows, a steps of 5 with its band · fewer items, or two slides |
| `SCENE_ITEM_NO_LABEL` | an item with no `label` |
| `SCENE_ICON_UNKNOWN` | not one of the 24 glyphs · no icon is drawn |
| `SCENE_VALUE_INVALID` | bars: `value` is not a number (flat bar) · ranges: a bound that is not a number, or `from` after `to` · lanes: `passed` / `blocked` not a whole number 0 to 8 · units: `total`, `columns` or a panel's `value` out of range |
| `SCENE_GRID_TOO_DENSE` | units: the cells would be under 12 units wide · fewer panels, or fewer cells |
| `SCENE_LEVEL_INVALID` | matrix: not one known status per column |
| `SCENE_ATTRIBUTE_IGNORED` | the scene never reads that attribute (`icon` on a step, `emphasis` in ranges) · the picture does not change |
| `SCENE_EMPHASIS_MANY`, `SCENE_LABEL_LONG`, `SCENE_NOTE_LONG` | the writing rules above, as warnings |
| `SVG_TEXT_ESCAPES`, `SVG_TEXT_OVERLAP` | every SVG of a slide, scenes and hand-drawn alike |
| `SVG_TEXT_TOO_SMALL`, `SVG_TEXT_CONTRAST_LOW` | a hand-drawn SVG label under 18px on screen, or too close in colour to what it sits on (4.5:1, 3:1 for large text) · a scene sets its own sizes and takes its colours from theme tokens, so these mostly catch hand-drawn SVG |

A row with no `from` and no `to` is not an error: it is a duration still to be
fixed, drawn dashed. Bars count their emphasis per group, so one bar per period
may be put forward.

Then look at the picture: `check` measures, it does not judge. One focal point,
the emphasis where the title points, nothing competing with it. Look at it in
the dark theme too when the deck has one · a scene re-tints by token, and
that is what to confirm.
