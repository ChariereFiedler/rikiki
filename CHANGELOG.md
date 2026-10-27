# Changelog

All notable changes to Rikiki are documented in this file.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.8.0] - 2026-10-27

Illustration is the theme of this release: a slide's picture is now written as data or as an intent, never as a coordinate, and `check` proves it.

- **Scenes** (`deck-scene-*`): eight animated scenes and their composition, plus `rikiki scene` to turn a JSON brief into a slide.
- **Diagrams** (`deck-diagram`): intents, pictures that change on a click, stories played on entry, nine story marks, three charts (pie, columns, waterfall), panels and a camera, with twelve recipes and `rikiki intent`.
- **Check**: it judges every illustration (frame, balance, richness, diversity, meaning), measures the text of every SVG, selects its rules from a policy in `rikiki.config.json`, and can be pointed at a few slides with `--slides`.

### Added
- Animated scenes, a slide's illustration written as data: `deck-scene-cards`, `-steps`, `-flow`, `-bars`, `-matrix`, `-ranges`, `-lanes` and `-units`, each an opt-in module filled with `deck-scene-item` children. The scene measures every string in the font the slide renders, wraps it without cutting a word, draws on a 1600-unit canvas in theme tokens, plays when the slide is entered and rests at its final state in the overview, print, PDF and under reduced motion. `deck-scene-lanes` tells what happens when one thing changes: lanes of tokens, a gate that comes down across them, the late ones queued against it. `deck-scene-units` draws one cell per person, a grid beside the same grid switched off. A `rikiki-scenes` skill picks the shape from what the items have in common.
- `deck-scene` composes scenes into one illustration: two or three side by side or two stacked, a link in each gutter (`arrow`, `vs`, `equals`, `plus`), an uneven `split`, and a closing `deck-scene-band`. A unit is the same length in every region, so a scene in half a row is laid out for half the canvas and keeps the size of its text, and the scenes enter one after another. `check` reports a composition of one scene, a region too narrow to say its piece, a second thing put forward, and a height past the slide.
- `check` reports what a scene would draw silently, under `SCENE_*` codes that name the items concerned: items past the maximum, too few, a missing label, an unknown icon, a bar value or a range bound that is not a number or lies past `max` / `scale`, an unusable `max`, `height` or `scale`, a matrix `level` that does not match its columns, an attribute the scene never reads, and, as warnings, a second emphasis, a label of five words or more, a note of more than one sentence, a bar group split by a note that comes back. `SCENE_TEXT_TOO_LONG` names the item and the field that did not fit, with the width it needed, and suggests that field's fix.
- `check` warns with `SCENE_FONT_FALLBACK` when the font a scene is measured in is not installed or did not load: a clean report on a fallback measures nothing.
- `rikiki skills` installs `rikiki-scenes` with the other skills.
- `rikiki scene` turns a JSON brief into a slide: `plan` lists the scenes that can say its relation, each written, linted and sized against the measured character table (`--measure` also draws each one in Chromium, reads its height and its issues and saves a PNG), `compile --candidate <id>` writes the slide of the one chosen, and `budgets <kind>` prints how many characters each field of a shape holds at a width.
- `check` measures the text of every SVG on a slide, hand-drawn or a component's own: `SVG_TEXT_ESCAPES` when a label runs past the rectangle or circle it is written in, or past the viewBox, `SVG_TEXT_OVERLAP` when two labels paint over each other, `SVG_TEXT_TOO_SMALL` when a label is set under 18px on screen (a drawing's font-size is not what the room sees), and `SVG_TEXT_CONTRAST_LOW` when its colour is too close to what it is drawn on.
- `check` judges every illustration of a slide, scene or hand-drawn SVG, for frame and balance: `ILL_ESCAPE`, `ILL_SHAPE_OVERLAP` and an endless or very long animation are defects; the weight of the drawing off-centre, uneven margins, a sparse drawing, edges that almost align, an uneven rhythm, two things put forward, too many font sizes and too many words are warnings with a threshold. The report scores each drawing (0 to 100, six facets) and says `ship`, `reread`, `redo` or `fail`.
- `check` findings on a scene carry a `fix` an agent can act on: `shorten` with, per field, its length, how many characters that field holds at this width and item count (a table measured on the real fonts by the scene bench), and the units it needs against what it has.
- `rikiki check --slides` measures only the slides it names: a number, an id, an interval (`4-9`, `-3`, `8-`) or two ends (`intro..pricing`), comma-separated, the same list `render --slides` now takes. The report keeps the deck's `slideCount`, lists the positions measured in `slidesChecked` and says in `notChecked` that the others were not looked at. A name that matches no slide stops before any measure and exits 2.
- `check` warns with `ICON_DOUBLED` when a component that paints its own icon holds text opening with an emoji (contributed by Clément Grégoire).
- `check` warns with `SCROLL_SLIVER` when a box that scrolls, a `deck-code` shrunk by a full slide for instance, overflows by less than one of its own lines: a scrollbar and a sliced last line for content that almost fits (contributed by Clément Grégoire).

- `deck-diagram` tells a concept in time, still without a coordinate. `layout="lanes"` draws `dg-lane` rows that carry tokens (`flow`, `speed`), `dg-gate` bars across them (`over`, `at`, `by` to stand under the mark that drives it, `state="open closed shed"` one word per click) and what the lanes run into: tokens pass an open gate, queue against a closed one, and half are refused by one that sheds. `layout="axis"` puts `dg-bar` points (`value`) and stretches (`from` `to`) on one scale, labels on both sides of a frise, and a `dg-cursor` that travels to its value. Every mark reads `enter` (`fade` `rise` `pop` `draw`), `after="name"` and `step="N"`: the diagram raises its slide's steps, brings each mark on its click, replays the tokens when a gate moves, and sends `flow` tokens along a `dg-link` (tracing it with `enter="draw"`). Each click moves for 2.8 s at most and rests at its final state in the overview, print, PDF and under reduced motion. New findings: `DG_MARK_PLACE`, `DG_GATE_LANE_UNKNOWN`, `DG_TOKENS_MANY`, `DG_MOTION_CYCLE` and `DG_MOTION_BUDGET`. The lanes and the motion are pure engines with their unit tests, and the diagram bench draws random lanes, gates and axes against oracles of their own (a gate crosses its lanes, a token rests on its track, off a gate's bar, never on another).
- `deck-diagram` changes its picture on a click. Sibling `dg-state` elements hold what one place shows from their `step` on; marks outside them are in every picture. A mark named alike in two pictures moves and resizes from its old place to its new one, its new words fading in, in three phases that never overlap: what leaves fades, what stays moves, what is new comes in and its links are traced. Matching is one to one by name, every picture is centred in one shared frame, a bar chart keeps one scale across clicks, a click lands on its picture directly (`applyStep`), rests as the last picture in the overview, print and PDF, and switches without movement under reduced motion. `dg-meter` draws a gauge filled exactly to `value` against `max`, with a `unit`, a `threshold` and, like `dg-queue` (a row of `count` places, `fill` of them taken from the end that leads out), one value and one `tone` per click: the fill grows, the places pop in. New findings: `DG_STATE_STEP`, `DG_VALUE_RANGE` (a value outside its scale) and `DG_MORPH_CROWD` (over seven marks moving at once). The meter, the queue and the morph planner are pure engines with their unit tests; the diagram bench draws random pictures per click and random gauges against oracles of their own (marks kept one to one, a click within its budget, a frame that does not jump, a fill exactly to scale, every place drawn); `decks/tests/deck-diagram-morph.html` holds four concepts that change on a click.
- `deck-diagram` is written as an intent. `intent="cause|barrier|bottleneck|accumulate|transform"` says what the picture demonstrates and `role="…"` the part each mark plays; a pure compiler chooses the layout, the one thing put forward (the effect, the gate, the neck, the stock) with quieter neighbours, and the motion (a chain traced link after link, a gate that closes on the click, tokens in proportion to the rates written in `value`, a queue filled with what does not get through, the after picture on the click), and writes no coordinate. `also` adds one or two secondary intents: a cause that drives a barrier (it plays on the first click, the gate under its effect closes on the second), a stock under a barrier, a queue that is also a stock (`role="queue stock"`).
- The eleven other intents of the grammar compile, each to a structure no other intent draws: `feedback` (a ring whose return arrow is traced on the click), `scale` (one lit cell, a hollow crowd unfolding from it), `contain` (frames inside frames, coming in from the outside), `parallel` (columns whose steps of one rank come in at one moment, then the join), `propagate` (a graph that turns one rank per click, a token riding into each), `threshold` (a gauge crossing its line, and what tips under it), `tradeoff` (a choice forking down into two gauges that move apart on one click), `drift` (gaps from a planned line, widening period after period), `compare` (bars on one scale, the one in question growing last), `partition` (one band cut end to end into its parts) and `merge` (straight arrows converging into one, every token at once). Each has bounded roles, one part put forward, a skeleton and a counter-example the check rejects with a code of its own: `INT_FEEDBACK_OPEN`, `INT_SCALE_TOO_CLOSE`, `INT_CONTAIN_NOT_NESTED`, `INT_PARALLEL_NOT_TOGETHER`, `INT_PARALLEL_JOIN_EARLY`, `INT_PROPAGATE_NOT_REACHED`, `INT_PROPAGATE_SKIPS`, `INT_THRESHOLD_NEVER_CROSSED`, `INT_THRESHOLD_EARLY`, `INT_TRADEOFF_ONE_SIDED`, `INT_DRIFT_NOT_WIDENING`, `INT_COMPARE_LIE`, `INT_PARTITION_NOT_WHOLE`, `INT_MERGE_APART` and `INT_MERGE_NOT_SUM`, read on the layout. `INT_INTENT_PLANNED` is gone. Composition covers every pair that has a region of its own (`cause` above, `accumulate` and `threshold` below: a stock that crosses its line, a chain that starts a wave, a loop that feeds a stock, sources merging into a stock); the whole-picture intents take none, and `rikiki intent <name>` says which. `decks/tests/deck-diagram-intents-all.html` holds one slide per new intent, clean on every click.
- `check` says how alike the illustrations of a deck are. Each drawing has a signature: its structure (the intent, the layouts, the kinds of marks, how many arrows and how they connect, tokens, gates, a picture that reorganises · a diagram writes it on its svg as `data-signature`), its look (surfaces, tones, how many marks, a coarse thumbnail of its ink) and its time (clicks, what moves). Two drawings are `D = 0.5 structure + 0.3 visual + 0.2 time` apart, and two closer than 0.15 are `ILL_REPEATED_LOOK`, a warning about the deck, never an error of a slide. The report gains a `diversity` object and line (distinct structures and their rate per hundred, intents covered, the largest family, the pairs alike, the mean distance to the nearest), and `--diversity` adds the matrix of every distance and each drawing's nearest neighbour. The measure is a pure module (`diversity.ts`) with its unit tests: six clones of one graph are fifteen pairs alike, six different pictures none.
- `examples/diagrams-generated` is rewritten: thirty-two illustrations, each from a sentence of intent (reliability, queues, cache, security, organisation, costs, migration, performance, quality, product, operations, data, tooling), twenty-two written as intents (the sixteen, none more than twice) and ten in the free grammar (lanes and a gate that sheds, a frise and its cursor, a state graph with tokens, a grid, two pictures that reorganise, a ring, two groups, a graph with tokens, a curve that crosses its line, a curve that levels off and makes room on the click for what holds it back). `check --steps` reports nothing on any of its states, and `--diversity` thirty-two distinct structures, sixteen intents, no family over 7 % and no pair alike.
- `dg-curve` draws a series read as one shape: `values` (2 to 12, at equal steps) on a scale from zero to `max` (a round number over them when unsaid), joined by straight segments, never smoothed, the ground under them, its label and last figure on one band, `ticks` under it (one per value, or the first and the last), and a `threshold` whose crossing is a dot put forward. It is traced from its first value to its last on entry. New finding `DG_CURVE_POINTS` (a series of one value or more than twelve, ticks that match neither); `DG_VALUE_RANGE` covers a curve's values and threshold. The curve is a pure engine with its unit tests, the diagram bench draws random curves against oracles of their own (every value at its exact height and step, the crossing on its line), and `decks/tests/deck-diagram-curve.html` holds two. No lens mark: a part seen up close is the part named alike in a second `dg-state`, which moves and grows from its place.
- A secondary intent is joined to the main one by an arrow the intent draws: the chain's effect into what it drives (the origin of a wave, a gauge), the gate, a loop's output or a bottleneck's queue into the stock it fills (its tokens riding on the click the stock changes), the gauge into what tips under it even when another intent draws the gauge. A loop keeps its stock in its middle. `INT_COMPOSE_APART` says a secondary no arrow joins to the main picture.
- A `dg-link` written on the root may join marks of two groups, each laid out on its own; one above the other, it drops straight. A ring holds a `dg-queue` or a `dg-meter` in its middle, or under it when the middle would make it taller than a slide.
- `rikiki intent "<sentence>"` hears more French: "en chaîne", "fait tomber", "n'en traite que", "qui ramènent", "une sur", "restent dans", "franchit", "dépasse", "se paie", "se creuse", "deux fois le", "la moitié du", "remplissent".
- A `dg-box` turns on a click: its `tone` takes one word per click (`tone="normal danger"`), and it turns once the tokens riding into it on that click have arrived. Stretches of an `axis` that lie end to end, each starting where the one before ends, are the parts of one whole: one thicker band cut into them, not a track each.
- A `deck-diagram` names what it draws: every mark, link and note is drawn under `data-mark` (its name, else its label) and `data-kind`, a note under `data-for`, a group's surface as `data-role="frame"` and a link's label as `data-role="link-label"`. `check` reads them, so `ILL_OFF_CENTRE`, `ILL_NEAR_ALIGN`, `ILL_FOCAL_WEAK`, `ILL_FOCAL_MANY` and `ILL_SPARSE` on a diagram name the marks concerned in their `fix`, with the attribute to change, tried on the ink before it is proposed: `pulls` (the marks that make the drawing lean, and their share of the lean) and `try` (a note moved to the other side of its mark, an outlined box on the light side given a surface, each with the lean it leaves, only when that is under the limit); the two marks that miss each other, the cause (`heights`, `widths`) and `align="stretch"` when stretching them aligns them; the mark put forward, its rival, how much larger the accent must be (`need`) and the rival as an outline when that leaves the accent leading; the marks of each accent region; where the room is empty (`emptyPct`).
- New findings: `DG_STEP_WORDS_UNSEEN` (a per-click list on a mark that appears late: its first words are never seen, and the padded list that shows them is given), `DG_LINK_CROSSES` (a link that still runs under a mark that is not one of its ends, with the marks it crosses), `DG_LABEL_BLOCKED` (a link's label with no free place beside its line, with how many of its characters the line holds) and `ILL_TEXT_OVER_SHAPE` (a defect: a link's label drawn on a mark that is not its own, the mark named).
- `deck-diagram` writes the figures it prints from a number (a gauge's value and maximum, a curve's last value and its line) with the decimal sign of the deck's language, `lang` on the document or on any element around the diagram: `value="0.2"` reads `0,2 %` in a French deck, `0,2` reads `0.2` in an English one. Without `lang`, figures are printed as written.
- `deck-diagram` tells a story: with `play="enter"` it plays one scene when its slide is entered, with no click, six to ten seconds written and played at the pace of the room (`clamp(written / 6.5 s, 1, 2)` times faster, never so fast that two beats come within half a second, under a `budget` of 10 s, 12 s at most). The system runs, an event lands, it spreads, its effect shows, the proof comes last in the target: each mark says when with `beat` (`steady`, `event`, `spread`, `effect`, `proof`), `after` and `with`, and how long with `duration`; what it does is its own attributes. `steady="3s"` on a `dg-lane` or a `dg-link` is an established flow that passes before the first event and stops where the event cuts it (only the tokens that reach a gate before it closes leave; then the queue forms and what lies past the gate pales); `swap` and `swap-icon` change a box's word and icon on its beat; `proof` draws a check and its words inside the target; `dim` pales a mark; `turn` changes the colour of a link's tokens on the way; `lever` turns a lever from the route that is cut to the new one, both leaving from one pivot, the traffic following. Pause, Replay and Loop buttons show at the drawing's corner while it plays (never in print nor under reduced motion), and `seek(seconds)` holds the story at one instant for a test or a capture. The picture at rest is the end of the story: the overview, print, PDF, `render` and reduced motion show it. The script is pure and deterministic (`diagram/story.ts`, with its unit tests), published on the drawing as `data-story`; `decks/tests/deck-diagram-story.html` tells four remedies this way (a kill switch, a blue/green switch, an incident frise whose gap is its duration, a race for a lock), each with at least eight beats, clean under `check --steps`.
- `paint` takes the part a surface plays: `pale` (the context), `gold` (the control), `ink` (the target), `ok` (what is sound), `bad` (the incident). Such a surface is a panel, with more room inside and tighter corners, its icon in a disc of its state beside its words (the note included), and its `tone` read as that state (`warn` turns it gold, `danger` bad, `ok` ok, `muted` pale), so a switch turns on its beat.
- `check` judges a story against its own budget and its script: `ILL_MOTION_LONG` warns past the story's budget and is an error past 12 s, `ILL_MOTION_ENDLESS` lets a loop of ambience start once the story has played, and four new findings say what a story needs: `ILL_NO_STEADY_STATE` (an event with under 1.5 s of established flow before it), `ILL_STORY_NO_PROOF` (a break with no proof after it), `ILL_BEAT_OVERLAP` (two beats within half a second, not meant together) and, a defect, `ILL_FINAL_INCOMPLETE` (the picture at rest lost a break, an effect or a proof, told by tokens alone). In a story `DG_TOKENS_MANY` counts the established flow with the queue, 12 a lane and 40 in all, and `DG_MOTION_BUDGET` says a story past its budget. New finding `DG_STORY_ATTR`: a story attribute on a diagram of clicks (dropped), a `step` in a story, or `play` with `dg-state` or an `intent`.
- `deck-diagram` gains nine marks that tell a story in their own words, placed with no coordinate and acting on their beat: `dg-terminal` (lines typed one after the other, a command a character at a time with its caret, `✓` and `✗` in their colour, the last line in its `tone`), `dg-table` (rows of real strings carried from another mark one by one, changed one by one with `swap`, struck with `strike`), `dg-switch` (`state="off on"`, its words `on` and `off`, the knob sliding and the track turning, on a click or on its beat), `dg-status` (a disc ✓ ✗ or a clock beside the mark it is `for`, turning on its beat with its words), `dg-timer` (a ring that fills while its figure counts the delay), `dg-band` (a time cut once: the normal time with its regular events, the void as long as it lasted growing on its beat, a brace with its length, the word at the cut), `dg-person` (people, the last `absent` hollow, going missing one after the other), `dg-screen` (a page in a browser frame, its address, its heading, grey lines for its text) and `dg-counter` (a large figure that counts, eased, its grouping and decimal sign kept). `lines`, `rows` and a table's `swap` are written one item per line of the attribute. With no beat these marks stand as at rest; the act of a mark of the steady beat keeps the system running until it ends. New findings, each an error with its counter-example in the unit tests: `DG_MARK_EMPTY`, `DG_TYPED_WIDE` (a typed line over 56 characters), `DG_ROWS_MISMATCH`, `DG_STATUS_NO_TARGET`, `DG_BAND_NO_CUT`, `DG_TIMER_NO_VALUE`; `DG_REF_UNKNOWN`, `DG_VALUE_INVALID` and `DG_VALUE_RANGE` cover them too. Their layout and the timing of their acts are a pure module (`diagram/marks.ts`, with its unit tests); `decks/tests/deck-diagram-marks.html` tells six graphic models with them (a terminal and its consequence, a probe that fails, an incident frise, records through a filter, an escalation with a timer, a switch with a lever), each six to ten seconds with eight beats at least, clean under `check --steps`, read by `e2e/diagram-marks.spec.ts`. `rikiki bundle` keeps the glyphs a status, people and a timer draw.
- `deck-diagram` gains three charts, placed with no coordinate: `dg-pie` (parts of a whole as a ring, 2 to 6 parts written one per line as their words then their figure, the part named by `focus` in the accent and the others in shades of the ink, a legend at its right, the figure of the whole in its hole with its `note`; swept part after part on its beat or its entrance) and `dg-columns` (2 to 12 columns on one scale, one to three `series`, a `threshold`, the column named by `focus` brought forward; each figure over its column when there is room, else a scale; the columns grow one after the other) and `dg-waterfall` (a total walked step by step to the next one: `steps` one line each, the first a total written with no sign, then `+n` or `−n`, never below 0 on the way; a closing `total` computed from the walk; the step named by `focus` put forward; a dotted line carries the level reached from one bar to the next, and each step is taken after the one before). The accent is never a series: it marks the one bar or part brought forward. New finding `DG_CHART_DATA` (an error: too few or too many parts, columns or steps, a waterfall that does not start from a total or falls below 0, a line without its figures, a part of 0, a `focus` that names nothing), and `DG_VALUE_RANGE` covers a figure above `max`. Pure layout in `diagram/charts.ts`, with its unit tests; `decks/tests/deck-diagram-charts.html` shows them, a waterfall among them, clean under `check --steps --diversity`, read by `e2e/diagram-charts.spec.ts`.
- `deck-diagram` composes several sub-pictures in one illustration: `compose="split|model-incident|body-axis|inset|dashboard"` on the root lays out `dg-panel`s (a mechanism beside its track at 1.65 to 1, a model beside its incident, a body over its time axis, a panel inside a panel, a dashboard two by two), each holding its marks directly with its own `layout`, a caption and a `paint` that says its part (`pale` by default; on `ink`, what has no surface of its own is set in the light ink and the tints of the parts are mixed over white). The engine computes the shares (never narrower than what a panel holds), stretches the panels of a row to one height, centres what they hold, keeps a note inside the panel of its mark and the room its side, top and bottom notes need. Names are local to a panel and reached from outside as `panel.mark`. Panels must share an `entity` (the same business object, on a mark of each) or an axis (a gauge, a curve, a timer or a counter of one unit over ranges that meet): `DG_PANEL_APART` refuses panels only side by side, with its fix. New findings `DG_PANEL_PLACE` (the wrong panels for the composition, a mark at its root, a panel or an `entity` outside one) and `DG_PANEL_INTENT` (`intent` beside `compose`: neither drawn nor proved, said). One story (or one series of clicks, `dg-state` inside a panel) plays across the panels; a panel's `beat` brings it in with what it holds, as one beat.
- `dg-camera` frames a mark or a panel in a story: the picture opens on its `focus` and, on its `beat` (`after`, `with`, `duration`), moves to another one (`to`) or to the whole composition (`all`). The scale and the margin are computed (2.6 times at most, never past the edge of the picture), the caption of the scope shown is kept whole and the one around it slid off; a camera that ends on a detail goes back to the whole picture once the story is told, so print, PDF, the overview, reduced motion and the picture at rest show the whole composition. Pure geometry in `diagram/camera.ts`, with its unit tests. New findings `DG_CAMERA_TARGET` (a name with no place, a late `focus`), `DG_CAMERA_ILLEGIBLE` (a frame that would show text under the scale) and `DG_CAMERA_STORY` (a camera on clicks, dropped). `decks/tests/deck-diagram-panels.html` tells five compositions this way (a kill switch and its incident, a fail-over over its RPO/RTO axis, the test set lost in production with a pull back, a dashboard of four widgets, a zoom out in rings from the code to the client), each six to ten seconds, eight beats at least, clean under `check --steps`, read by `e2e/diagram-panels.spec.ts`.
- `rikiki recipe` prints twelve recipes, each a graphic model told as a story: `incident-band` (M15, an incident frise), `lanes-gate` (M22, lanes and a gate), `probe-stations` (M16, a probe), `wiring` (M17, wiring and fan-in), `switch-over` (M21, a topology that switches over its RPO/RTO axis), `race-lock` (M23, a race for a lock), `filter-records` (M19, records through a filter), `version-lanes` (M20, users moving one by one from a version to the next), `escalation-runbook` (M24), `pulse-threshold` (M25), `scope-rings` (M14, a zoom out in rings) and `data-replay` (M3, without a `dg-replay`: the period, the total, the series and the milestones moving together). Each is a skeleton whose marks are named for their part, whose `{{fields}}` are the facts of a brief and whose beats are the sequence the model imposes, with what the check guarantees, when not to use it, its neighbours and its pitfalls. `rikiki recipe "<sentence>"` picks the closest from the cues of the sentence, no model; `--brief` prints the example brief as JSON, `--example` the slide it draws, `--fill brief.json` your slide, or refuses the brief (exit 1, each field said) when a field is empty, generic, longer than its place holds, or when it holds fewer than two precise values (a date, a number, an identifier). Every skeleton filled with its example is laid out and timed in the unit tests and passes `check --steps` clean in the browser; `decks/tests/deck-diagram-recipes.html` fills the twelve with twelve other briefs, each slide the output of `--fill`, clean on every check, no two alike under `--diversity`.
- `rikiki intent "<sentence>"` names the closest recipes when no intent fits a sentence that tells a story, on stderr with exit code `3` (a sentence with no cue at all still exits `1`); with an intent found, its comment names the recipes near it.
- `rikiki check` takes a policy, from the `check` section of `rikiki.config.json` (every such file from the deck's folder up, outermost first, until `"root": true` or the repository's root, never a home folder) and from the command line. `checks` drops or takes back rules in order, on what is inherited (`-slide-dense`, `-ill-*`, `-*,content-*`), by name or by code; `severity` sets a rule to `error`, `warning` or `off`; `warningsAsErrors` fails the run on some warnings; `limits` moves a threshold of the check (`minTextPx`) or of the illustrations (`ill.words`); `options` reach plugin rules as `ctx.options`. `overrides` do the same for the slides (the `--slides` grammar), the kinds of slide, the slides tagged `data-tags="…"` or the elements (a CSS selector) they name. A deck may write an exception on itself, `data-check-off="rule …"` with a mandatory `data-check-reason`, which silences warnings only unless the policy says `inline: "all"`. New flags: `--checks`, `--severity`, `--warnings-as-errors`, `--limit`, `--check-option`, `--no-inline-exceptions`, `--list-checks` (every rule the deck can meet, whether it is kept and why, per slide with `--slides`) and `--show-suppressed`. What the policy silences is listed under `suppressed` with what silenced it and why, `summary.suppressed` counts it, `selection` says where the policy came from and what each override and exception did, and an illustration is scored again on the findings kept. Findings about the run (a page that threw, a missing file, a stalled walk, an unreadable review, `CHECK_*`) are never silenced. New findings: `CHECK_SELECTION_UNMATCHED` (a name that names no rule, an override whose slides the deck lacks), `CHECK_SELECTION_IGNORED`, `CHECK_SUPPRESSION_UNJUSTIFIED`, `CHECK_SUPPRESSION_UNKNOWN`, `CHECK_SUPPRESSION_UNUSED` (said only when the finding was looked for) and `CHECK_SUPPRESSION_REFUSED`. Every code comes from the table its rules are written against (`ILL_CODES`, `SCENE_ISSUE_CODES`, `INT_CODES`, the review criteria), gathered in `bin/lib/check-registry.mjs`. Built on the clang-tidy selection Clément Grégoire proposed (MR !26), reworked after review: the list applies on what is inherited instead of starting empty, no home folder, camelCase keys under `check`.
- `check` measures the richness of each illustration, out of 100, on five criteria of 20 points: `content` (two precise facts of two kinds, when, which and how much, and a `deck-source` on the slide · a word and one figure like `appli 1` is an enumeration, not a fact), `demonstration` (two devices of relation: a link, a flow, a gate, a scale, a marker, a callout, a state that turns, panels), `story` (a story runs steady, breaks, proves after; an event told click by click is half, in one still nothing; a still that tells no event is not judged), `paint` (as many flat fills, tints included, as the drawing holds roles, up to three) and `result` (a lasting proof, or the figure in the thing put forward). Each criterion gives its measurement and its fix; one that does not apply is left out and the total renormalised; nothing is counted for its own sake. Every illustration row gains `richness` (its score, its graphic model, its criteria), the report a `richness` object and a `Richness` line. It is a measure: it changes no score, no verdict and no exit code, and says its findings only with `--richness`, which also prints each drawing's points: `ILL_GENERIC` (no precise fact), `ILL_FLAT_PAINT` (roles painted alike) and `ILL_MODEL_REPEAT` (the same graphic model a third time in five illustrated slides, unless its named marks stay and their words move on), warnings registered with the other rules. The pure module is `richness.ts`, with its unit tests; calibrated on the story decks (37 drawings, mean 95, 70 to 100) against the galleries written before them (47, mean 61, 38 to 88) and pictures poor on purpose (6, mean 20, 0 to 40). `rikiki recipe --fill` reads precise values with the same pattern.

### Changed
- In a story, a mark of the steady beat that says `with` another mark of that beat starts with it, as on any other beat, instead of taking its own share of the steady time: the tracks of a replay (a counter, a curve, a table) move together.
- In a story, the marks a group brings in on its `beat` come in together, a little apart, as one beat, instead of one beat each; a mark with a beat of its own in such a group comes in with it and acts on its own beat, and the first mark of a group with no surface plays the beat written on the group (with its `after` and `with`).
- A gauge with two values in a story shows its value, its figure and its tone before its beat until the beat, instead of its last tone from the start and no figure.
- A note no longer stands over the caption of a group or a panel: captions are in the way when a note looks for its side.
- `ILL_FINAL_INCOMPLETE` keeps a camera that pulls back to the whole picture (the picture at rest is that picture), and `ILL_FOCAL_WEAK` does not set the accent against a panel of a composition beside it.
- In a story, the event waits for the marks of the steady beat to end (a terminal typing what runs), instead of starting at the end of the steady length while they still move.
- `rikiki render` and `check` bring a story to its end before they look at it, instead of waiting three seconds into it.
- A check plugin may no longer take a built-in family as its namespace (`TEXT`, `ILL`, `DG`, `SVG`, `CHECK`…): it could name a rule like a built-in one (`CHECK_PLUGIN_LOAD_FAILED`). The `element` of a plugin's finding is written like a built-in one's (one `pathOf`, `bin/lib/element-path.mjs`), so a policy finds both under an element.
- An illustration row keeps its worst state by failure first, then by score · a failing state at a higher score is no longer hidden by a passing one at a lower score.
- A disc that says the state of a mark (`data-role="state"`, a role surface's icon) is not counted as a region put forward by `ILL_FOCAL_MANY` and `ILL_FOCAL_WEAK`.
- A `deck-diagram` laid out as a column holding a group of lanes is judged for balance in height only, like lanes alone: its labels stand in a column at the left by construction.
- A diagram as wide as its room and much shorter (an axis, lanes, a graph whose ranks spread) is laid out narrower so it is drawn larger, its height setting the size, kept under 80 % of the room for a title on two lines; a graph whose links carry labels keeps its width. The growth counts arrow heads and the accents over a first line, so nothing grown leaves the frame.
- A merge into a queue joins its tail: the sources stand outlined in a column at its left, their lines meeting the end the queue is entered by, no longer diagonals converging on its middle.
- `ILL_NEAR_ALIGN` no longer reports shapes centred on one line (a rank of boxes of different widths): their edges differ by half their difference in size, by choice.
- The architecture recipe of the working guide draws what its title says (three commands sharing one browser layer, fan in, not the layer fanning out to them), under a title of one line: its graph filled 39 % of its panel (`ILL_SPARSE`).
- A `drift` is drawn in ink: the gaps before the last are filled (`tone="muted"`) instead of pale cards, their rails step back, and the widest stays in the accent. A stretch of an `axis` with a `tone` is filled in it.
- A diagram without `bounds` plans for a room 600 high (`DIAGRAM_ROOM_HEIGHT`), as the skill and the reference already said, no longer the 620 at which a slide clips a scene (`MAX_SCENE_HEIGHT`, unchanged: a matrix of three rows and its legend is 606 and fits). A title that wraps past about 36 characters costs about 80 units: the skills and the reference say to keep an illustrated slide's title to about 36 characters, on one line.
- In a graph laid out in layers, a box a few units narrower than the widest of its rank takes the rank's width, so their edges line up instead of missing by a pixel or two (`ILL_NEAR_ALIGN`).
- A `dg-link` with `route="straight"` is one straight line even in a graph the engine routes, so arrows can converge in a funnel instead of on a bus.
- `check` weighs an outlined card or cell by its edge when it judges balance (a crowd of hollow cells weighs where it stands), and no longer sets the accent against the surface it sits in (the track of a gauge filling in the accent, the frame round the mark put forward) when it judges whether the accent leads.
- `check` proves a diagram written as an intent demonstrates it, on the layout and not the pixels: `INT_BARRIER_NOT_ACROSS`, `INT_BARRIER_NEVER_CLOSES`, `INT_BOTTLENECK_NOT_NARROWEST`, `INT_BOTTLENECK_NO_QUEUE`, `INT_CAUSE_NO_ARROW`, `INT_CAUSE_EFFECT_FIRST`, `INT_ACCUMULATE_NOT_MONOTONE`, `INT_TRANSFORM_NO_PAIR`, `INT_TRANSFORM_NO_CHANGE`, the roles (`INT_ROLE_MISSING`, `_EXTRA`, `_NONE`, `_UNKNOWN`, `_KIND`), the focal (`INT_FOCAL_MULTIPLE`, `INT_FOCAL_OFF_ROLE`) and the composition, each with its `measurement`, what was `expected`, the items and a `fix`. A defect of meaning is an error: the illustration fails whatever its score, and its report row gains the `intent` and a seventh facet, `meaning`.
- Lanes that share a row with other marks (a `dg-group layout="lanes"` beside a box) take tracks of their natural length, 640 units and a gate's room more for each gate after the first on one lane, instead of the whole room: the box beside them keeps its width, and the lanes keep their length from one `dg-state` to the next whatever stands beside them. Lanes that are the whole drawing, or in a column, still run across the room.
- A link's label is painted after the marks, so a label that lands on a mark shows instead of hiding under it; it sits above its line, else under it, else beside a vertical run, on the first place clear of every mark of the drawing (it was tested against its own group only, and never under the line), and a row or a column widens its gaps for the labels of the links between neighbours.
- `check` judges the balance of drawings whose structure sets their labels in a column at the left (lanes, an axis across, a column of bars, said by `data-lean="x"` on the diagram's svg) in height only: their weight leans left by that column, by 5 to 10 % on the galleries. Their margins and their height are still judged. The lean in height is a share of the drawing's height, but never of less than 0.375 of its width (`flatReference`): a strip a slide wide and a sixth as tall, a link going round a row above it, was said to lean 20 % for 36 px. Counting strokes by their length, the alternative, moved the lean of the 92 judged drawings of the galleries by 0.1 point at most, so lines and paths still weigh nothing.
- `check` counts a fill as the accent only at half its strength or more: an open gate, a third of the accent, is a mark that stepped back, no longer the thing put forward. Gates in any number are one thing put forward (`role="barrier"`, `ILL_FOCAL_MANY`), and a gate is not judged by its area against the cards beside it (`ILL_FOCAL_WEAK`).
- `rikiki intent "<sentence>"` prints the skeleton of the closest intent, its roles with their bounds and the mistakes the check rejects, as a comment above a diagram ready to paste; `rikiki intent <name>` prints one, `rikiki intent --list` the sixteen. No model: the same sentence always gives the same skeleton. The `rikiki-illustrate` skill now starts from an intent, `decks/tests/deck-diagram-intent.html` holds six slides written only as intents (a kill switch, a 6/2/4 bottleneck, a queue that fills, a before and after that morphs, a chain of three, a barrier with its stock), and the diagram bench checks every intent's skeleton and counter-examples in the real element.

### Fixed
- Traps of the free grammar in `deck-diagram`, each found by authors drawing fifteen concepts (`examples/diagrams-prompts`) and each the engine's: `link="arrow"` on a `dg-group` was dropped (`DG_ATTR_UNKNOWN`), and a nested row, column or ring now chains its children; a link between two boxes of a row ran in a straight line under the box between them, and now goes round it, above, or under when above is taken; a `tone` on a `dg-bar` was read and never painted, and now fills the bar; gates in series on one lane filtered once, and now filter in cascade (each shedding gate lets half of what reaches it through, a closed one holds it); a `dg-text side="top"` on a mark at the top of the drawing, or on what lanes run into, found no side and was reported as `DG_NO_FIT`, and now stands above it, the drawing moved down to hold it, and a note above or under a mark flush with an edge slides inside the room.
- A gate standing on the last lanes only had its word on the track of the lane above it: the word goes under the gate. A cursor's word glued to an axis label beside it now goes under every label.
- An intent no longer drops a mark without a word: an `inflow` or `outflow` of a stock another intent draws (a merge's `into`, a cause's `effect`, a threshold's `measure`) was not drawn, and is now `INT_ROLE_EXTRA`; a mark that is both the `effect` of a cause and the `origin` of a wave was drawn twice, and is now drawn once and reported the same way.
- A cause that drives another intent brings its chain in from the cause on, stage after stage: an effect larger than its cause (a note) no longer came in first and failed `INT_CAUSE_EFFECT_FIRST`.
- In a `deck-diagram`, a group laid out at a width it cannot hold its children in (a graph inside a framed group, in a narrow room) said it fitted and drew past its frame: it now says so, and the diagram tries tighter spacing before reporting `DG_NO_FIT`.
- `deck-graph` measures in its own canvas pixels, so edge labels, strokes and arrowheads keep their place and weight on any screen that is not exactly the canvas size (#26).
- `check` reads the findings of a `deck-diagram` (`DG_*`, and a text too long for its box) with the fix the diagram gives: they were written on the element and never reported.
- `deck-diagram` reads a box's `value` as a figure printed as written (`9 €`, `−68 %`), no longer as a number it then said it dropped.
- `deck-diagram` stays in its frame when a word is wider than its box: it is centred on its ink only when the ink fits across.
- In a `deck-diagram`, a box with no surface is as wide as what it says, a note beside a mark inside a group is no longer refused for touching that group, and a link's label moves under its line when a box stands above it.
- A `layout="layers"` graph running down spreads its ranks only as far as the room's height.
- In a story, a `dg-dot count="100"` with a `beat` was a hundred beats one after the other (a story of over a minute written, played much faster to fit its budget): a crowd is one beat, its cells coming in as one wave of 0.6 s whatever their count.
- A `dg-cursor` in a small part of an axis ran its line through the label of the part beside it on its way down to its word: the line stops short of any label, and its word goes just under the tracks, else just above them, else moved aside to the nearest free place, else under every label.
- `render` and `check` wait for the animations of a scene or a diagram, which run inside a shadow root `document.getAnimations()` does not list, before taking a picture: the first slide was photographed in the middle of its entrance.

## [0.7.2] - 2026-09-23

### Fixed
- Preserve author themes and desktop layouts in overview and presenter previews.
- Prepare overview thumbnails during idle time and reuse the complete grid.
- Keep presenter preview documents alive during navigation and synchronize slide steps and annotations.
- Show slide numbers on cover layouts.
- Preserve shared module registrations when bundling extension components.

### Added
- Extensible check API and module checks, with narrative and rendered-layout diagnostics.

## [0.7.1] - 2026-09-12
### Fixed
- **`deck-annotate` never keeps a collapsed frame as the picture rectangle.**
  The letterboxed rectangle the markers are placed against was measured from a
  `ResizeObserver` on `.frame` plus the image's `load` event, and a single
  missed or early notification froze it : a measurement taken while the frame
  was still collapsed (or none at all) stayed published forever, and every
  badge sat next to what it names. It now re-measures on a bounded animation
  frame loop until the geometry holds still, observes the host, the figure and
  the image as well as the frame, re-arms itself when the element is moved in
  the DOM (`firstUpdated` runs once, so a re-attached figure had no observers
  left), and settles again once web fonts land.

- **`deck-annotate` measures synchronously before its settle loop**, so the
  first paint already places the badges against the picture; the animation
  frame loop only re-measures when the geometry moves.
- **The CLI walker gives a deck time on a busy machine.** A slide change may
  take 15 s and a deck 60 s to load before `render`, `check` or `export`
  gives up (shared constants in `bin/lib/browser.mjs`), instead of the 5 s
  and 30 s that failed under load with no defect in the deck.
- **`package.json` declares its `bin` path in the form npm keeps** and the
  lockfile carries the `@emnapi` entries `npm ci` requires, so a fresh
  install on a runner no longer fails before the tests.
- **Bundled examples regenerated on the current runtime**, so the drift guard
  in the browser suite passes on a clean checkout.

### Changed
- **CI runs the browser suite with one Playwright worker** and the smoke
  test reads the deployed bundle from a file instead of a pipe, removing two
  sources of false negatives.
- **The site serves Markdown and text with an explicit UTF-8 charset**, so
  the published LLM reference reads correctly in a browser.
- **The site tells the product's story for two authors.** The landing opens
  on the manifesto argument for a human author and a coding agent, shows the
  example decks with thumbnails rendered by `rikiki render`, and its layout
  library, command rail, module shelf and closing block carry their own
  weight again; the docs gain a "Check and deliver" CLI page, a sidebar in
  reading order with build-time counts, a changelog rendered from this file,
  and a component catalogue guarded attribute by attribute.

## [0.7.0] - 2026-09-12
### Added
- **`deck-versus` gains a `footer` slot in slide mode.** Renders full width
  under both sides, at reading size, separated by `--deck-versus-footer-gap`
  (defaults to `--rik-space-3`); a slotted `deck-callout` keeps its own size.
  Hidden outside `slide`, like `title` and `lead`.
- **`deck-annotate` badges accept a named anchor, not just pixels.** `offset`
  and `offsets` take `above`, `below`, `left` or `right` next to `x,y` CSS
  pixels, mixable in one list (`offsets="above|0,-40|right"`). A keyword
  displaces the badge by its own rendered diameter plus one
  `--deck-annotate-anchor-gap` (defaults to `--rik-space-2`) in that
  direction, and turns the leader on for that mark whether or not `leader`
  is set · the author states the intent, the component measures the badge to
  place it. `parseOffset` lives in `src/shared/annotation-marks.ts`; an
  unreadable token still falls back to `0,0`.
- **`deck-source` atom** for crediting evidence blocks. Place it under any
  `deck-csv`, `deck-table`, `deck-bar`, `deck-kpi-grid`, `deck-annotate`, or
  plain prose · `<deck-source href="…">Word, p. 12</deck-source>` renders the
  credit line, linked when `href` is set. It is a core atom, not an opt-in
  module. `deck-figure` now renders one internally for its own `source` /
  `source-href` attributes, so both paths share one implementation; its
  `--deck-figure-source-color` token keeps working, forwarded to the new
  `--deck-source-color`.
- **`deck-annotate` is now a figure too.** `caption`, `source` and
  `source-href` render a real `<figure>`/`<figcaption>` around the screenshot,
  legend and marks, crediting it with the same `deck-source` atom
  `deck-figure` uses · `--deck-annotate-gap` and `--deck-annotate-caption-color`
  default to `deck-figure`'s own `--deck-figure-gap` and
  `--deck-figure-caption-color`, so both authoring paths read as one line
  under either kind of image. Marker placement is unaffected: `_measure()`
  still reads the `.frame` box, not the figure the caption grows.
- **`rikiki render --baseline <dir>` says what moved since an earlier render.**
  Each fresh PNG is compared to the same-named capture in `<dir>`, in the
  browser that just took the pictures (both images on a canvas,
  `getImageData`, a pixel counted when its worst channel moves by more than 32
  of 255) · no image library, no new dependency. Slides are ranked by
  `changedRatio`, each with the bounding box of what moved; a file only one
  side has is `added` or `missing`, two captures of different sizes are
  `resized`. `--threshold` (percent of pixels, default `0.5`) is what keeps
  anti-aliasing noise out of the report · `--threshold 0` lists every pixel
  change. `--json` writes the report to stdout, and it is always written to
  `diff.json` beside `manifest.json`. Exit 1 on a changed, missing or resized
  slide; exit 2 on a baseline directory that is not there.
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
- **Documented the "single record, field by field" recipe.** §22 of the LLM
  reference shows a `deck-table` with `highlight-rows` and `reveal` as the
  composition for one entity's fields, instead of a new `deck-record`
  component.
- **`deck-kpi-grid` / `deck-kpi` · the figures are one family, and the marked
  one is a mass.** The grid now owns three rows (value, label, note) and every
  figure adopts them with `grid-template-rows: subgrid`, so all the values share
  one baseline and one size, all the labels sit on one line, and a column
  without a note costs no height anywhere else. The value keeps the statement
  size it has always had · a fluid scale that grew with the viewport pushed a
  row of three three-line metrics off the bottom of a slide that used to fit,
  and it is reachable when a deck has room with
  `--deck-kpi-value-size: clamp(2.25rem, 6cqw, 7rem)`. A `tone` of `accent`,
  `ok`, `warn` or `danger` puts the figure on the inverse surface with inverse
  digits, and says the tone in the colour of the label under it rather than
  recolouring the figure · a coloured number on paper is a different colour, not
  more emphasis; `default` and `muted` paint nothing at all. `ruled` draws a divider that
  can actually be seen: its 1px `--rik-border-default` hairline was invisible at
  projection distance, so it is now a `--deck-kpi-grid-rule-width` (default 2px)
  in ink. It had also never rendered at all, for the unrelated build reason
  recorded under Fixed above, so this is a visible change for a deck that
  already carried the attribute: it gains the separators it asked for, and the
  `--deck-kpi-grid-gap` of padding that keeps a figure off its own rule. No
  attribute changed.
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

### Fixed
- **`rikiki check` measured only the slide that was on screen.** `deck-root`
  lays out the active slide and hides the rest, and the default mode inspected
  the document once · every other slide reported empty rects, so
  `CONTENT_ESCAPES_BOX`, `CONTENT_OVERLAPS_SIBLING`, `GRAPH_NODE_OVERLAPS_NODE`,
  `GRAPH_EDGE_CROSSES_NODE` and `GRAPH_NODE_OUT_OF_BOUNDS` (the last one since
  it shipped, the others since this branch added them) fired only when the
  defect happened to sit on slide 1. Default mode now walks the deck with the
  same `goToSlide` walker `--steps` uses and measures each slide in its opening
  state; `statesInspected` still reads the slide count, and no diagnostic
  carries a `state` unless `--steps` was asked for. The inspection is scoped to
  the slide being measured, and what does not depend on which slide is showing
  (unknown tags, stray attributes, unslotted content, the notes word count) is
  asked once for the whole document instead of once per state · `--steps` used
  to re-walk every element of the deck on every state. A deck the walk cannot
  navigate no longer kills the command: it stops at that slide with a new
  `NAVIGATION_STALLED` error and the report still carries every slide measured
  before it, so `--json` always has a report to hand back. A graph node's own
  label no longer reads as a painted box either: it sits two levels under
  `deck-graph`, and the exclusion only looked at the nearest `deck-*` ancestor,
  so `GRAPH_NODE_OVERLAPS_NODE` came with a `CONTENT_OVERLAPS_SIBLING` saying
  the same thing. This is a coverage trade, not only a deduplication: nothing
  inside a `deck-graph` or a `deck-annotate` is compared against its
  neighbours any more, slotted content included, so a graph's insides are
  covered by the graph codes alone.
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
- **The CSS-in-JS minifier silently deleted the descendant combinator in front
  of a pseudo-class or pseudo-element.** `minify-templates.mjs` tightened the
  whitespace around EVERY `:`, so `:host([banded]) ::slotted(*)` shipped as
  `:host([banded])::slotted(*)` · valid CSS that matches nothing. Three shipped
  rules were dead in `dist/` and nowhere else: `:host([banded]) ::slotted(*)`
  in `deck-point` (a banded bento cell aligning its children to the top of the
  band), and both `:host([direction='row']) ::slotted(*)` and the
  `:not([no-connectors])) ::slotted(* + *)::before` connector in
  `deck-step-list` (a horizontal step list sharing the width and drawing the
  arrow between steps). The minifier now tracks whether it is inside a
  declaration block, so a declaration colon still collapses and a selector
  colon keeps the space in front of it; `scripts/minify-templates.test.mjs`
  covers the three shapes and the four real selectors. A follow-up fixed the
  same loss under CSS nesting: `:host { & ::slotted(*) { … } }` tightened to
  `&::slotted(*)`, because a colon inside a declarations block was always read
  as a declaration colon even when its own run opened a nested rule.
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
