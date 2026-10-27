---
name: rikiki-illustrate
description: Use when a rikiki slide needs an illustration — a cause and its effect, a kill switch that cuts traffic, a bottleneck, a stock that fills, a before and after that morphs on a click, a graph of services, a funnel, a cycle, a grid of people, a timeline, an incident or a remedy told as a story played on entry, a graphic model filled from a brief (rikiki recipe) — or when an illustration overflows, is off-centre or looks like the one before. You write what the picture demonstrates (an intent) and the part each mark plays, or marks and how they are placed, never a coordinate; the diagram places, and `rikiki check` proves and scores. Triggers on "illustration", "schéma", "diagramme", "graphe animé", "deck-diagram", "intent", "goulot", "kill switch", "SVG slide", "ça dépasse", "pas équilibré", "tous les graphes se ressemblent".
---

# Illustrating a rikiki slide

You write what the picture contains and how it is arranged. The diagram measures the
text in the deck's font, places everything, routes the links, draws in the theme's
colours and animates on entry. **You never write a coordinate, a colour, a size or a
line break.** `rikiki check` then tells you, in numbers, whether the picture is
clean, centred and put forward · and how to fix it when it is not.

## Brief first, then the shape

Before you draw, write **four to six concrete facts**: the real system and its actors,
its normal pace with a unit, the event with its date or hour, the exact cause with its
identifier, the consequence counted, the proof or the remedy. Two of them at least are
precise (a date, a number, an identifier). No facts, no picture: a picture of nothing
precise is the same picture on every slide. Then pick the shape, in this order:

```
1. A relation (it cuts, waits, piles up, loops, spreads…)?  rikiki intent "<sentence>" → §0
2. A story (an incident, a remedy, a zoom out)?  rikiki recipe "<sentence>" → §4e
   intent exits 3 and names the recipes when the sentence tells a story
3. Two pictures that explain each other?                     compose + dg-panel → §4d
4. None of these?                                            the free grammar → §1 to §4c
5. Still red after three rounds of check?                    split the slide, do not bend it
```

## 0 · Start from an intent

When the sentence says how things relate · it causes, it cuts, it waits, it piles
up, it loops, it spreads, past a line, at the cost of, before and after · write the
**intent**, not the layout. The root says what the picture demonstrates, each mark
the part it plays (`role`); the diagram chooses the layout, the one thing put
forward and the motion, and `rikiki check` proves the drawing demonstrates it. Each
intent is drawn its own way, so slides with different intents never look alike.

```sh
npx rikiki intent "Six files arrive, review handles two, four wait"  # the closest skeleton
npx rikiki intent barrier                                             # one, by name
npx rikiki intent --list                                              # the sixteen, and their looks
```

| The sentence says… | Intent | Roles to fill | Drawn as |
|---|---|---|---|
| because, leads to, triggers | `cause` | `cause` · `via` (each link of the chain) · `effect` | a chain traced arrow after arrow |
| cuts, blocks, stops, kill switch | `barrier` | `flow` (a `dg-lane` each) · `barrier` (the `dg-gate`) · `control` · `beyond` | lanes of tokens, a gate dropping |
| bottleneck, waits, throughput | `bottleneck` | `source` (its rate in `value`) · `queue` (a `dg-queue`) · `neck` (its rate) · `sink` | many tokens in, few out, a queue |
| piles up, fills, backlog, debt | `accumulate` | `stock` (a queue or a meter, one value per click) · `inflow` · `outflow` | a stock between feed and drain |
| before and after, becomes | `transform` | `before` and `after`, on two `dg-state` whose parts are named alike | one picture reorganised |
| a loop, it feeds itself, flywheel | `feedback` | `stage` (2 to 5 boxes, in order) · `output` | a ring, the return arrow traced on the click |
| one in N, order of magnitude | `scale` | `unit` (a `dg-dot`) · `crowd` (a `dg-dot`, `count` ten times more) | one lit cell, a hollow crowd |
| inside, nested, layers | `contain` | `layer` (2 to 4 boxes, outside in) | frames inside frames |
| at the same time, in parallel | `parallel` | `branch` (a `dg-group` each, its steps inside) · `join` | columns, one rank at a time, then the join |
| spreads, cascade, domino | `propagate` | `origin` · `reached` (your `dg-link` say who reaches whom) | a graph that turns rank by rank |
| past a line, threshold, tips | `threshold` | `measure` (a `dg-meter` with `threshold`) · `consequence` | a gauge crossing its line, what tips under it |
| at the cost of, trade-off | `tradeoff` | `lever` · `gain` and `cost` (two meters that move apart) | a choice forking into two gauges |
| drifts, the gap widens | `drift` | `reference` (a `dg-cursor` at the plan) · `measure` (a `dg-bar` per period) | gaps in ink from a line, widening, the last in the accent |
| twice as, larger than | `compare` | `subject` · `other` (`dg-bar`s, one unit) | bars on one scale, the subject last |
| share of, split into | `partition` | `whole` (its `value` the total) · `share` · `part` (`dg-bar`s) | one band cut into its parts |
| converge, merge, come together | `merge` | `source` (2 to 4, an amount in `value`) · `into` (their sum) | straight arrows converging into one · into a queue, lines joining its tail |

The kill switch: a live test writes the flag, the one reader reads it, and the gate
it drives cuts the three lanes. The chain plays on the first click, the gate closes
on the second:
```html
<deck-diagram intent="barrier" also="cause">
  <dg-box role="cause" name="essai" icon="flag" label="essai réel" note="bascule le STOP"></dg-box>
  <dg-box role="via" name="drapeau" icon="database" label="DB 2 · drapeau"></dg-box>
  <dg-box role="effect" name="lit" icon="code" label="is_active()" note="le seul code qui lit le STOP"></dg-box>
  <dg-link from="essai" to="drapeau" label="écrit"></dg-link>
  <dg-link from="drapeau" to="lit" label="lu"></dg-link>
  <dg-lane role="flow" name="api" icon="cloud" label="API"></dg-lane>
  <dg-lane role="flow" name="tache" icon="clock" label="tâche"></dg-lane>
  <dg-lane role="flow" name="service" icon="database" label="service"></dg-lane>
  <dg-gate role="barrier" name="stop" label="STOP"></dg-gate>
  <dg-box role="beyond" name="acme" icon="target" label="ACME"></dg-box>
</deck-diagram>
```
A bottleneck reads its rates: six tokens in, two out of the neck, four places fill:
```html
<deck-diagram intent="bottleneck">
  <dg-box role="source" name="arrivees" icon="document" label="Arrivées" value="6 / min"></dg-box>
  <dg-queue role="queue" name="file" label="en attente"></dg-queue>
  <dg-box role="neck" name="validation" icon="search" label="Validation" value="2 / min"></dg-box>
  <dg-box role="sink" name="valides" icon="check" label="Validés" value="2 / min"></dg-box>
</deck-diagram>
```

A gauge that crosses its line, and what tips under it on that click:
```html
<deck-diagram intent="threshold">
  <dg-meter role="measure" name="disque" label="Disque" value="55 70 88" unit="%" threshold="80"></dg-meter>
  <dg-box role="consequence" name="ecritures" icon="alert" label="Écritures refusées"></dg-box>
</deck-diagram>
```
A loop whose return arrow is traced on the click:
```html
<deck-diagram intent="feedback">
  <dg-box role="stage" name="lecteurs" icon="team" label="Plus de lecteurs"></dg-box>
  <dg-box role="stage" name="auteurs" icon="document" label="Plus d'auteurs"></dg-box>
  <dg-box role="stage" name="articles" icon="search" label="Plus d'articles"></dg-box>
  <dg-box role="output" name="trafic" icon="chart" label="Plus de trafic"></dg-box>
</deck-diagram>
```

- No `layout` on the root of an intent (`INT_LAYOUT_FIXED`): it places. No
  `emphasis` either: the part it argues for (the effect, the gate, the neck, the
  stock, the core, the join, the origin, the choice…) is put forward for you, and an
  `emphasis` elsewhere is `INT_FOCAL_OFF_ROLE`. A drift and a comparison lean by
  nature; they say `balance="free"` for you.
- `also` adds one or two secondary intents. Only three are ever secondaries:
  `cause` above (it drives the main one, which plays a click later), `accumulate`
  and `threshold` below. `barrier` takes `cause` and `accumulate`; `accumulate` and
  `threshold` take each other and `cause`; `cause` takes `accumulate` and
  `threshold`; `bottleneck`, `feedback` and `merge` take `accumulate`; `propagate`
  takes `cause`. `transform`, `scale`, `contain`, `parallel`, `tradeoff`, `drift`,
  `compare` and `partition` take none: two shapes in one picture read as two
  pictures, split the slide. A mark may play two parts (`role="queue stock"`,
  `role="stock measure"`); it is drawn once. A stock another intent draws is fed
  by that intent's arrows, so it takes no `inflow` or `outflow` of its own, and the
  `effect` of a cause and the `origin` of a wave are two marks: either would not be
  drawn, which is `INT_ROLE_EXTRA`.
- A secondary is joined to the main picture by an arrow the intent draws: the
  chain's effect into what it drives, the gate, the loop's output or the queue
  into the stock (a loop keeps its stock in its middle), the gauge into what tips.
  A stock fed by an `inflow` of its own beside a loop joins nothing: two pictures
  side by side, `INT_COMPOSE_APART`.
- Your own `dg-link` between the marks of a cause, a loop, a wave or a merge replace
  the arrows it draws, and must still lead where the intent says
  (`INT_CAUSE_NO_ARROW`, `INT_FEEDBACK_OPEN`, `INT_PROPAGATE_NOT_REACHED`,
  `INT_MERGE_APART`).
- An `INT_*` finding is an **error whatever the score**: the drawing does not show
  what it declares (a gate that leaves a lane out, a neck as wide as what feeds it,
  a stock that goes up then down, parts that do not add up, a gap that shrinks).
  Fix the roles or the figures, not the picture. A figure you invented is said in
  `deck-source`.

## 1 · Start from the sentence, not the shape

Write the sentence the room must leave with. That is the title · **about 36
characters at most, on one line** (fewer in wide letters): a title that wraps
takes about 80 units from the 600 the drawing plans for, and the slide clips. The picture is its
evidence, with **one thing put forward** (`emphasis`) · the thing the title argues for.
Then ask what the items are to each other:

| They are… | Arrange them as | Not as |
|---|---|---|
| a flow of things into one, then out | `layout="layers"` (a graph) | a row of cards |
| a sequence | `layout="row" link="arrow"` or `column` | `grid` |
| a loop | `layout="ring" link="arrow"` | a row (it loses the return) |
| compared by size | a `column` of `dg-bar` | boxes with the figure in a note |
| a share of a crowd | `layout="grid"` of `dg-dot` + a `dg-text for=` | a percentage alone |
| the same thing before and after | a `row` of two `dg-group` with `link="arrow"` | two slides |
| stages that narrow | a `column` of `dg-bar` (a funnel) | a list |
| parallel options | a `row` of `dg-box` | steps (it says "in order") |
| a mechanism and its proof | a `row` of a `layers` group and a `column` of `dg-bar` | one crowded picture |
| traffic that one switch lets through or stops | `layout="lanes"`: `dg-lane` and a `dg-gate` across them | arrows with "blocked" in a note |
| a queue that fills, then load that is shed | a `dg-gate state="closed shed"` | two slides |
| a request that travels, and comes back | `dg-link flow="1"`, chained by `after`, on a `step` | a static arrow |
| moments in time, and where we are | `layout="axis"` of `dg-bar value` and a `dg-cursor` | a row of dated boxes |
| the same parts, reorganised on a click | two `dg-state`, the parts named alike in both | two drawings side by side |
| how full something is, and it fills | a `dg-meter value="40 62 85"` with a `threshold` | a percentage in a note |
| what waits in front of a bottleneck | a `dg-queue fill="0 4 8"` between the boxes | "backlog" written in a box |
| a series whose shape is the point (it climbs, levels off, turns at a knee, crosses a line) | a `dg-curve values="…"`, with a `threshold` when a line is crossed | a bar per period |
| a part seen up close inside its whole | the part named alike in a second `dg-state`, drawn larger | a hand-drawn zoom |

Different slides of one deck should differ in **layout** and **paint**, not only in
words. Two consecutive illustrations with the same layout read as the same slide.
`rikiki check` measures it: each drawing has a signature (structure, look, time)
and two closer than 0.15 are `ILL_REPEATED_LOOK`, a warning about the deck. The
report's `Diversity` line counts the distinct structures, the intents and the
largest family; `--diversity` names each drawing's nearest neighbour. A gallery
aims at 40 structures per 100 illustrations, 12 intents, no family over 10 %.

## 2 · The grammar, on one screen

```html
<script type="module" src="dist/deck-diagram.js"></script>
<deck-diagram layout="…" bounds="800x500">      <!-- the root is a group · play="enter" budget for a story (§4b) -->
  <dg-box name label note tag icon value paint tone size emphasis swap swap-icon proof>
  <dg-text label note for="name" side="right">   <!-- a note beside a mark -->
  <dg-dot count="362">   <dg-bar label value tag>   <dg-link from="a b" to="c" label flow speed>
  <dg-group layout label paint> …children… </dg-group>
  <dg-lane label note icon flow speed>   <dg-gate over="a b" by="name" state at label>   <!-- in lanes -->
  <dg-bar value from to>   <dg-cursor value label>                                    <!-- in an axis -->
  <dg-meter label value max unit threshold tone>   <dg-queue label count fill tone>   <!-- per click -->
  <dg-curve label values ticks max unit threshold tone>   <!-- a series, traced -->
  <dg-pie label slices unit value note focus>   <dg-columns label columns series max unit threshold focus>   <!-- charts -->
  <dg-waterfall label steps total unit focus>   <!-- a total walked up and down to the next one -->
                                                <!-- slices, columns, steps: one item a line, its words then its figures -->
  <dg-box tone="normal danger">                     <!-- a box turns on a click, once what rides into it arrives -->
  <dg-state step> …the marks of this place from that click on… </dg-state>
  <dg-terminal lines>   <dg-table rows from swap strike>   <dg-switch state on off>   <!-- §4c -->
  <dg-status for state>   <dg-timer value unit>   <dg-band from to cut until tag brace>
  <dg-person count absent>   <dg-screen label note count>   <dg-counter value from unit>
</deck-diagram>                <!-- every mark also reads enter · after · step · role · entity -->
<!-- or <deck-diagram intent="…" also="…">, each mark a role="…", and no layout (§0) -->
<!-- or <deck-diagram compose="…"> of <dg-panel name label layout paint>, and a <dg-camera focus to> (§4d) -->
<!-- in a story every mark also reads beat · with · duration · dim (§4b) -->
```

**Layouts**: `row` · `column` · `grid` (cells, or boxes in rows of `columns`) · `layers`
(a graph, `direction="right"` or `"down"`, 12 boxes and 24 links at most) · `ring` (3 to 8) ·
`lanes` (parallel `dg-lane`s that carry traffic, with a `dg-gate` standing `over` them) ·
`axis` (a scale of `dg-bar`s, each a `value` or a `from` and a `to`, and a `dg-cursor`).
**Treatments** (closed lists): `paint` none · outline · soft · solid · inverse, or the
part a surface plays, its icon in a disc of its state beside its words · pale (the
context) · gold (the control) · ink (the target) · ok (what is sound) · bad (the
incident); on those, `tone` is the state (ok, warn → gold, danger → bad, muted → pale) ·
`tone` normal · muted · accent · ok · warn · danger · `size` small · normal · large ·
`gap` tight · normal · airy · `align` start · center · end · stretch.
Everything else is computed. `link="arrow"` on a row, a column or a ring · the root or
a `dg-group` · chains the children, so a sequence needs no `dg-link`. `name` is what a
link or a note points at. A link that skips a box of its row goes round it; its label
finds a free place and the row widens its gaps for it. A note `side="top"` stands above
its mark even at the top. Figures take the decimal sign of the deck's `lang` (`0.2` →
`0,2 %`).

## 3 · Six pictures, no coordinate

A graph of services:
```html
<deck-diagram layout="layers" direction="right">
  <dg-box name="web" icon="user" label="Web"></dg-box>
  <dg-box name="gw" label="Gateway" note="one entry, one policy" emphasis></dg-box>
  <dg-box name="auth" icon="lock" label="Auth"></dg-box>
  <dg-box name="db" icon="database" label="Postgres"></dg-box>
  <dg-link from="web" to="gw"></dg-link>
  <dg-link from="gw" to="auth"></dg-link>
  <dg-link from="auth" to="db" label="SQL"></dg-link>
</deck-diagram>
```
A funnel (a chart in rows, the figure in the tag):
```html
<deck-diagram layout="column" align="start" gap="tight">
  <dg-bar label="Visitors" value="12000" tag="12 000"></dg-bar>
  <dg-bar label="Sign-ups" value="2400" tag="2 400 · 20 %"></dg-bar>
  <dg-bar label="Paying" value="310" tag="310 · 34 %" emphasis></dg-bar>
</deck-diagram>
```
A cycle:
```html
<deck-diagram layout="ring" link="arrow">
  <dg-box label="Build" icon="code"></dg-box>
  <dg-box label="Measure" icon="chart"></dg-box>
  <dg-box label="Learn" icon="spark" emphasis></dg-box>
  <dg-box label="Decide" icon="flag"></dg-box>
</deck-diagram>
```
A crowd, one cell per person, with a note on the lit ones:
```html
<deck-diagram layout="grid">
  <dg-dot count="362"></dg-dot>
  <dg-dot name="lost" count="38" emphasis></dg-dot>
  <dg-text for="lost" side="right" label="38 leave in year one" note="about one in ten"></dg-text>
</deck-diagram>
```
In a story, `beat` on a `dg-dot count="…"` is one beat for the whole crowd: its cells
come in as one wave of 0.6 s, whatever the count.

The parts of a whole, the figure of the whole in the hole, one part put forward
(`focus` names it), and what it leads to · a `dg-pie` takes two to six parts, one
line each, its words then its figure; in a story its ring is swept part after part:
```html
<deck-diagram play="enter" layout="row" align="center" gap="airy">
  <dg-pie name="tickets" focus="3 grands comptes" value="62 %" note="des tickets" unit="%" beat="steady" emphasis
    slices="3 grands comptes 62
            41 PME 23
            212 indépendants 15"></dg-pie>
  <dg-box name="plan" icon="user" label="un interlocuteur dédié" note="pour les 3 comptes" paint="ok" proof="−40 % de tickets" beat="proof"></dg-box>
</deck-diagram>
```
Things compared side by side, in one to three series (`series`, one name a line),
against a `threshold` · a `dg-columns` takes two to twelve columns, one line each,
its words then one figure per series; the column named by `focus` is put forward:
```html
<deck-diagram layout="column" align="stretch">
  <dg-columns name="ventes" focus="T3" unit="k€"
    series="2025
            2026"
    columns="T1 42 51
             T2 47 58
             T3 38 79
             T4 55 64"></dg-columns>
</deck-diagram>
```
How one total became the next · a `dg-waterfall` starts from a total (a line with no
sign), walks two to eleven steps written `+n` or `−n`, one line each, and closes on
the `total` it names, computed from the walk; the step named by `focus` is put forward:
```html
<deck-diagram layout="column" align="stretch">
  <dg-waterfall name="marge" unit="k€" total="Marge 2026" focus="Remises"
    steps="Marge 2025 120
           Nouveaux clients +45
           Remises −18
           Coûts −12"></dg-waterfall>
</deck-diagram>
```
Too few or too many parts, columns or steps, a row with no words or not one figure per
series, a part of 0, a waterfall that does not start from a total, a `focus` that names
no row are `DG_CHART_DATA`, an error: the chart is drawn as written, which does not read.

Before and after, each side a surface, a note under each:
```html
<deck-diagram layout="row" link="arrow">
  <dg-group name="before" label="Before" paint="outline" layout="column">
    <dg-box label="12 fields"></dg-box>
    <dg-box label="Captcha"></dg-box>
  </dg-group>
  <dg-group name="after" label="After" paint="inverse" layout="column">
    <dg-box label="Email only" emphasis></dg-box>
  </dg-group>
  <dg-text for="before" side="bottom" label="41 % finish"></dg-text>
  <dg-text for="after" side="bottom" label="78 % finish"></dg-text>
</deck-diagram>
```
Options of the same rank, one backed:
```html
<deck-diagram layout="row" gap="airy">
  <dg-box label="Build" tag="slow" note="six months, our own team"></dg-box>
  <dg-box label="Buy" tag="fast" note="live in a quarter" emphasis></dg-box>
  <dg-box label="Wait" tag="risky" note="the market decides"></dg-box>
</deck-diagram>
```

## 4 · Motion, lanes, gates, an axis, gauges and states

A deep concept is told in time: what happens, then what changes. The drawing still
holds no number of seconds · you name **how** a mark comes in, **what** it waits for
and **on which click**, and the diagram times it inside a budget.

- `enter` · `fade` `rise` `pop` `draw` (a line is traced, a bar or a box grows, a gate
  drops, a cursor travels). Each kind has its own default.
- `after="name"` · starts once everything of that name has moved (its entrance, its
  tokens). A chain of `after` is a sequence; a loop is `DG_MOTION_CYCLE`.
- `step="1"` · appears on that click (1 to 9). The diagram adds the clicks to its slide;
  what follows a mark with `after` comes on its click. In the overview, print, PDF and a
  render without `--steps`, the picture is the last click.
- `flow="N"` on a `dg-lane` or a `dg-link` · N tokens (8 at most). On a link with
  `enter="draw"` the tokens trace the line on its `step`; on any other link the line is
  there from the start and only the tokens wait for `step` and `after`.
- `dg-gate state="open closed"` · how the gate stands on entry, then on each click:
  `open` lets every token through, `closed` queues them against it, `shed` lets one in
  two through and leaves the others hollow in the queue. `by="name"` stands the gate
  under that mark with a line down from it; `at` (`start` `middle` `end`) places it
  otherwise; `over` names the lanes it crosses (all, by default). Gates in series on
  one lane filter in cascade, and count as one thing put forward. A list is read from
  the slide's entry whatever the mark's `step`: a gate on `step="2"` open then closed is
  `state="open open open closed"` (`DG_STEP_WORDS_UNSEEN` gives the list).
- Lanes beside a box in a row take their natural length, the same in every
  `dg-state`; alone, or in a column, they run across the room.
- On clicks there is no `loop`: an endless animation is `ILL_MOTION_ENDLESS`, a long one
  `ILL_MOTION_LONG`. A click that would move for more than 2.8 s is played faster and
  said (`DG_MOTION_BUDGET`) · give it a second `step`, or tell it as a story (§4b).
  Reduced motion shows each click's picture with no movement.

A kill switch: three lanes, a gate under the code that reads the switch, open on entry
and closed on the click:
```html
<deck-diagram layout="column" align="start">
  <dg-group layout="row" gap="airy">
    <dg-box name="essai" icon="flag" label="essai réel" note="bascule STOP" paint="none"></dg-box>
    <dg-box name="db" icon="database" label="DB 2 · MARCHE" paint="outline"></dg-box>
    <dg-box name="lit" icon="code" label="is_active()" note="le seul code qui lit le STOP" paint="outline"></dg-box>
    <dg-link from="essai" to="db" label="écrit"></dg-link>
    <dg-link from="lit" to="db" label="lu"></dg-link>
  </dg-group>
  <dg-group layout="lanes" gap="tight">
    <dg-lane name="api" icon="cloud" label="API"></dg-lane>
    <dg-lane name="tache" icon="clock" label="tâche"></dg-lane>
    <dg-lane name="service" icon="database" label="service"></dg-lane>
    <dg-gate name="stop" by="lit" state="open closed"></dg-gate>
    <dg-box name="acme" icon="target" label="ACME" paint="outline"></dg-box>
    <dg-text for="stop" side="bottom" label="STOP · plus rien ne passe" step="1"></dg-text>
  </dg-group>
</deck-diagram>
```
A queue that fills, then a gate that sheds load on the click:
```html
<deck-diagram layout="lanes">
  <dg-lane name="web" icon="user" label="web" flow="6"></dg-lane>
  <dg-lane name="batch" icon="clock" label="batch" flow="6" speed="fast"></dg-lane>
  <dg-gate name="limit" label="100 req/s" state="closed shed"></dg-gate>
  <dg-box name="api" icon="code" label="API" note="saturated" paint="outline"></dg-box>
</deck-diagram>
```
A state machine whose token walks the transitions on the click, the last one late:
```html
<deck-diagram layout="layers" direction="right">
  <dg-box name="idle" icon="clock" label="Waiting"></dg-box>
  <dg-box name="run" icon="refresh" label="Running" emphasis></dg-box>
  <dg-box name="done" icon="check" label="Done"></dg-box>
  <dg-box name="fail" icon="alert" label="Failed" tone="danger"></dg-box>
  <dg-link name="start" from="idle" to="run" label="start" flow="1" step="1"></dg-link>
  <dg-link from="run" to="done" label="success"></dg-link>
  <dg-link name="crash" from="run" to="fail" label="error" flow="1" after="start"></dg-link>
  <dg-link from="fail" to="idle" back dashed label="after 30 s" flow="1" after="crash"></dg-link>
</deck-diagram>
```
A frise and where we are · points share one line, labels both sides of it; stretches
(`from` `to`) take a track each:
```html
<deck-diagram layout="axis">
  <dg-bar label="launch" tag="2023" value="2023"></dg-bar>
  <dg-bar label="pilot" tag="2024" value="2024"></dg-bar>
  <dg-bar label="rollout" tag="2025" value="2025" emphasis></dg-bar>
  <dg-bar label="review" tag="2026" value="2026"></dg-bar>
  <dg-cursor label="today" value="2025"></dg-cursor>
</deck-diagram>
```

A picture that changes on a click keeps its place for what is to come: a note that
appears late is room left empty before it, and `check` judges the balance of each
click (`--steps`). Put the late notes where the drawing is light.

**Gauges.** A `dg-meter` fills its track exactly as far as `value` goes against
`max` (100 by default), its figure flush right (`unit="%"` reads `85 %`, without
it `85 / 100`), a `threshold` standing across the track. A `dg-queue` is `count`
places (12 at most), `fill` of them taken from the right end, the one that leads
out. Both take **one word per click** for `value` / `fill` and for `tone`, like a
gate's `state`: the fill grows from its old value, the places pop in one after the
other. A value outside its scale is `DG_VALUE_RANGE`, an error: the drawing would
lie. A queue fills between what feeds it and what drains it:
```html
<deck-diagram layout="row" link="arrow">
  <dg-box name="arrivees" icon="team" label="Arrivées" note="6 par heure"></dg-box>
  <dg-queue name="file" label="en attente" count="8" fill="0 4 8" tone="normal warn danger"></dg-queue>
  <dg-box name="revue" icon="search" label="Revue" note="2 par heure" emphasis></dg-box>
  <dg-box name="prod" icon="check" label="En production" note="2 par heure"></dg-box>
</deck-diagram>
```
A disk that saturates, against one that does not:
```html
<deck-diagram layout="column" align="stretch" gap="airy">
  <dg-meter name="disque" label="Disque · alerte à 80 %" value="40 62 85" unit="%" threshold="80" tone="ok warn danger"></dg-meter>
  <dg-meter name="cpu" label="Processeur" value="35 38 36" unit="%" tone="muted"></dg-meter>
</deck-diagram>
```

**Curves.** A `dg-curve` reads its `values` (2 to 12, at equal steps) on a scale from
zero to `max` (a round number over them when unsaid), joins them with straight
segments, never smoothed, and is traced from the first to the last. `ticks` are the
words under it, one per value or the first and the last; a `threshold` draws its
line, and the point where the curve crosses it is the dot put forward:
```html
<deck-diagram>
  <dg-curve name="build" label="Durée du build" values="6 6,4 6,9 7,5 8,3 9,4 10,6 12,1" max="14" unit="min" threshold="10" ticks="S1 S2 S3 S4 S5 S6 S7 S8" emphasis></dg-curve>
</deck-diagram>
```
A value off its scale is `DG_VALUE_RANGE`, a series too short or too long
`DG_CURVE_POINTS`.

**States · the same parts, reorganised.** Sibling `dg-state`s hold what one place
shows on successive clicks: the first needs no `step`, each next one says from
which click it stands. Marks outside the states are in every picture. **A mark
named alike in two pictures moves** from its old place to its new one and resizes;
what only the old picture has fades, then what stays moves, then what is new comes
in and its links are traced, never at once. Name every part that must be seen
travelling; a part without a name is a new one. Each picture is laid out on its
own and checked on its own (`check --steps`), all in one frame, and a bar chart
keeps one scale across clicks. Seven marks moving at once is the most the eye
follows (`DG_MORPH_CROWD`); a merge or a split is parts leaving and one coming:
```html
<deck-diagram>
  <dg-state>
    <dg-group layout="column" gap="airy">
      <dg-group name="bloc" label="un seul déploiement" paint="outline" layout="row" gap="tight">
        <dg-box name="commandes" icon="document" label="Commandes"></dg-box>
        <dg-box name="paiement" icon="lock" label="Paiement"></dg-box>
        <dg-box name="comptes" icon="user" label="Comptes"></dg-box>
      </dg-group>
      <dg-box name="base" icon="database" label="une base pour tout"></dg-box>
      <dg-link from="bloc" to="base"></dg-link>
    </dg-group>
  </dg-state>
  <dg-state step="1">
    <dg-group layout="layers" direction="down">
      <dg-box name="passerelle" icon="cloud" label="Passerelle" emphasis></dg-box>
      <dg-box name="commandes" icon="document" label="Commandes"></dg-box>
      <dg-box name="paiement" icon="lock" label="Paiement"></dg-box>
      <dg-box name="comptes" icon="user" label="Comptes"></dg-box>
      <dg-link from="passerelle" to="commandes paiement comptes"></dg-link>
    </dg-group>
  </dg-state>
</deck-diagram>
```
A ranking that reverses · the bars are named, so they trade places; a ranking is
heavy at the top by nature, which `balance="free"` says:
```html
<deck-diagram layout="column" align="start" balance="free">
  <dg-state>
    <dg-bar name="mobile" label="Mobile" value="58" tag="58 % · 2025" emphasis></dg-bar>
    <dg-bar name="web" label="Web" value="27" tag="27 %"></dg-bar>
  </dg-state>
  <dg-state step="1">
    <dg-bar name="web" label="Web" value="51" tag="51 % · 2026" emphasis></dg-bar>
    <dg-bar name="mobile" label="Mobile" value="38" tag="38 %"></dg-bar>
  </dg-state>
</deck-diagram>
```
In a diagram with states a click is a change of picture: gates and tokens play on
entry only, and `after` orders the entrance, not the clicks.

## 4b · A story played on entry

Clicks cut a story into pictures. An incident or a remedy is told in time instead:
the system **runs** (an established flow), an **event** lands, it **spreads**, its
**effect** shows, and the **proof** comes last, in the target. `play="enter"` plays that
scene when the slide is entered, with no click: six to ten seconds written, played at
the pace of the room (a story longer than 6.5 s is played up to twice as fast, never
so fast that two beats come within half a second), under its `budget` ("10s" unless
said, "12s" at most). Pause, Replay and Loop buttons show under the drawing's corner
when the speaker reaches for them; print, PDF, the overview, a render and reduced
motion show the **end** of the story, which must tell it alone.

- `beat` on a mark says **when**: `steady`, `event`, `spread`, `effect`, `proof`. Its own
  attributes say **what**: a gate's `state="open closed"`, a box's `tone="normal warn"`,
  `swap` (its label after the beat) and `swap-icon`, `proof` (a check and its words,
  drawn inside the box), `dim` (it pales), a link's `flow` (tokens ride it). A mark with
  a beat and nothing that changes comes in on its beat; a group's beat brings its marks.
- One beat per mark. Inside a beat, marks play in source order, one after the other;
  `after="name"` waits for that mark to end, `with="name"` starts with it (one beat,
  played together · in the steady beat too, so the tracks of a replay move as one),
  `duration="2s"` gives a mark its own time (a stretch of an axis grows for as long as
  the time it stands for).
- `steady="3s"` on a `dg-lane` or a `dg-link` is the established flow: tokens pass for
  that long before the first event. A lane's flow runs on until a gate on it closes,
  and only the tokens that reach the gate before it does leave; then the lane's `flow`
  queues against it and what lies past the gate pales. A link's flow stops at the first
  event, at its own beat when it is cut (`dim`), or runs on while a link it feeds
  carries the flow after a switch (`steady` with a beat and no `flow`).
- `turn="danger"` on a link: its tokens change colour on the way. `lever` on a link: a
  lever at its start turns, on its beat, from the link of the same start that is cut
  (`dim`) · both then leave from one pivot.
- A story reads no click: `step` is dropped, `dg-state` and `intent` keep their clicks
  and drop `play` (`DG_STORY_ATTR`). What only a story reads is dropped elsewhere.
- Contents are concrete: names, times, identifiers, figures (`value` is a large one).
  A figure you invented is said in `deck-source`.

The kill switch, told: the traffic runs for three seconds, the test writes STOP, the
one reader reads it, the gate drops, the tokens stop against it, and the target proves
nothing was created:
```html
<deck-diagram play="enter" layout="column" align="start">
  <dg-group layout="row" gap="airy">
    <dg-box name="essai" icon="flag" label="essai réel" note="mardi 14:02" paint="ok"></dg-box>
    <dg-box name="drapeau" icon="database" label="DB 2 · MARCHE" swap="DB 2 · STOP" swap-icon="ban" paint="pale" tone="normal warn" beat="event" after="ecrit"></dg-box>
    <dg-box name="lit" icon="code" label="is_active()" note="seul lecteur du STOP" paint="ink"></dg-box>
    <dg-link name="ecrit" from="essai" to="drapeau" label="écrit" flow="1" beat="event"></dg-link>
    <dg-link name="lu" from="drapeau" to="lit" label="lu" flow="1" beat="spread"></dg-link>
  </dg-group>
  <dg-group layout="lanes" gap="tight">
    <dg-lane name="api" icon="cloud" label="API" note="POST /devis" steady="3s"></dg-lane>
    <dg-lane name="tache" icon="clock" label="tâche" note="relance 15 min" steady="3s"></dg-lane>
    <dg-gate name="stop" by="lit" state="open closed" beat="spread" after="lu"></dg-gate>
    <dg-box name="acme" icon="target" label="ACME · prod" paint="pale" proof="0 devis créé" beat="proof"></dg-box>
  </dg-group>
</deck-diagram>
```
A switch of route: the traffic runs to blue, green starts, the lever turns, the old
route pales and the traffic follows the new one, fed by the same entry:
```html
<deck-diagram play="enter" layout="layers" direction="right" gap="airy">
  <dg-box name="clients" icon="team" label="clients" note="1 240 req/min" paint="pale" proof="0 requête perdue" beat="proof"></dg-box>
  <dg-box name="traefik" icon="refresh" label="Traefik · blue" swap="Traefik · green" paint="gold" beat="effect" with="vers-green"></dg-box>
  <dg-box name="blue" icon="database" label="blue · v1.8.2" paint="pale"></dg-box>
  <dg-box name="green" icon="database" label="green · v1.9.0" paint="ok" beat="event"></dg-box>
  <dg-link from="clients" to="traefik" steady="3s"></dg-link>
  <dg-link name="vers-blue" from="traefik" to="blue" route="straight" steady="3s" dim beat="effect" with="vers-green"></dg-link>
  <dg-link name="vers-green" from="traefik" to="green" route="straight" steady="3s" lever beat="effect"></dg-link>
</deck-diagram>
```
`rikiki check` judges a story against its own budget and its script, beside the ink:
an event with no established flow before it (`ILL_NO_STEADY_STATE`), a break with no
proof after it (`ILL_STORY_NO_PROOF`), two beats within half a second
(`ILL_BEAT_OVERLAP`), and, an error, a resting picture that lost a beat: a break told
by tokens alone is gone once they arrive (`ILL_FINAL_INCOMPLETE`). The element's
`seek(seconds)` holds the story at one instant, for a test or a capture.

## 4c · Marks that tell a story in their own words

Boxes and arrows say a structure. A talk shows **things**: the terminal Claude typed in,
the rows that went through a filter, the switch someone turned, the five minutes nobody
answered, the nineteen hours without a lead. Nine marks say them, placed like any mark
(no coordinate), each acting **on its beat** in a story and standing at rest as the end
of that act. With no beat, a mark stands from the start as at rest; on clicks it comes
in already done (a switch still turns on its click).

| Mark | Says | On its beat |
|---|---|---|
| `dg-terminal label lines tone` | lines in a dark panel · `$ `, `> `, `❯ ` starts a command, `✓` / `✗` a result | commands typed a character at a time with a caret, results whole · the last line in its `tone` |
| `dg-table label icon rows paint strike` | rows of real strings in a panel | rows carried from `from` (a table, or any mark) one by one, then changed to `swap` one by one, then struck |
| `dg-switch label state on off` | a switch, `on` green, `off` in the accent, its words (`on="MARCHE" off="STOP"`) | `state="off on"`: the knob slides, the track turns, the word changes |
| `dg-status for state label note side` | the state of a mark, a disc beside it: `ok` ✓, `fail` ✗, `wait` a clock | `state="wait fail"`: the disc turns, its words come with it |
| `dg-timer label value unit tone` | a delay: a ring and its figure | the ring fills, the figure counts from 0 to `value` |
| `dg-band label note from to cut until tag brace tone` | a time cut once: normal time with its regular events, a void as long as it lasted, a brace with its length | `steady="3s"` grows the normal time · on its beat the cut, the void, the brace |
| `dg-person label count absent tone` | people, one disc each, the last `absent` hollow | `absent="0 3"`: three go missing one after the other |
| `dg-screen label note count` | a page in a browser: its address, its heading, `count` grey lines for its text | comes in, its lines drawn one by one |
| `dg-counter label value from unit tone` | a large figure, its grouping and decimal sign as written | counts from `from` (0) to `value`, slowing |

`lines`, `rows` and a table's `swap` are written **one item per line of the attribute**;
the indentation of the source is dropped. A mark of the `steady` beat that acts (a
terminal typing what runs) keeps the system running until it ends. Each model of the
talk takes two of them at least: a terminal and its consequence, a probe that fails (a
link cut, statuses that turn), a frise of incident (a band), records through a filter
(tables carried and changed), an escalation (people, a timer, a table ticked row by
row), a switch with a lever. Contents are real strings: names, ids, hours, versions.

A terminal and its consequence · the page fails, three clients leave, the proof says
what Claude saw:
```html
<deck-diagram play="enter" layout="row" link="arrow" gap="airy">
  <dg-terminal name="claude" label="claude · ~/rodz" beat="steady" lines="
    $ git push prod main
    ✓ tests : 312 passent
    ✓ envoyé en production
    Terminé. Autre chose ?"></dg-terminal>
  <dg-screen name="page" label="app.rodz.io/signaux" note="Signaux du jour" count="4"></dg-screen>
  <dg-person name="clients" label="clients en ligne" count="4" absent="0 3" beat="spread"></dg-person>
  <dg-status for="page" state="ok fail" label="14:02 · page blanche" note="erreur 500" side="bottom" beat="event"></dg-status>
  <dg-text for="page" side="top" label="Claude n'a pas vu la page" beat="proof"></dg-text>
</deck-diagram>
```
Records through a filter · the rows are carried, the names replaced, the address struck:
```html
<deck-diagram play="enter" layout="row" gap="airy">
  <dg-table name="prod" label="production" icon="database" paint="pale" rows="
    Marie Dubois · DG
    王伟 · 销售总监
    m.dubois@acme.fr"></dg-table>
  <dg-table name="anon" label="anonymiser" icon="lock" paint="ink" from="prod" beat="event" strike="3" rows="
    Marie Dubois · DG
    王伟 · 销售总监
    m.dubois@acme.fr" swap="
    Claire Martin · DG
    李娜 · 销售总监
    m.dubois@acme.fr"></dg-table>
  <dg-link name="prelever" from="prod" to="anon" label="prélever" steady="3s"></dg-link>
  <dg-status for="anon" state="ok" label="noms remplacés" note="cas difficiles gardés" side="bottom" beat="proof"></dg-status>
</deck-diagram>
```
A frise of incident · the normal time runs, then the cut, then nineteen hours of void:
```html
<deck-diagram play="enter" layout="column" align="stretch" gap="airy">
  <dg-counter name="perdus" value="64" unit="leads" label="perdus, estimés" tone="danger" beat="effect"></dg-counter>
  <dg-band name="leads" label="leads" note="un toutes les 20 min" from="6" to="34" cut="12.63" until="31.63" tag="mer. 12:38 · v2.4 en ligne" brace="19 h sans lead" steady="3s" beat="event"></dg-band>
  <dg-status for="leads" state="ok" label="jeu. 07:52 · retour v2.3" side="bottom" beat="proof"></dg-status>
</deck-diagram>
```
An escalation · Peter does not answer, the timer runs its five minutes, the switch hands over:
```html
<deck-diagram play="enter" layout="row" link="arrow" gap="normal">
  <dg-box name="alerte" icon="alert" label="checkout" note="42 commandes / h" paint="pale" tone="normal danger" swap="checkout · 500" beat="event"></dg-box>
  <dg-person name="peter" label="Peter · astreinte" count="1" absent="0 1" beat="spread"></dg-person>
  <dg-timer name="delai" label="sans réponse" value="5" unit="min" tone="warn" beat="spread" after="peter"></dg-timer>
  <dg-switch name="relais" label="relais" state="off on" on="Inès" off="Peter" beat="effect"></dg-switch>
  <dg-link name="pings" from="alerte" to="peter" steady="3s"></dg-link>
  <dg-status for="relais" state="ok" label="03:18 · pris en charge" side="bottom" beat="proof"></dg-status>
</deck-diagram>
```
What only these marks get wrong is said, an error each: a terminal with no line or a
table with no row (`DG_MARK_EMPTY`), a typed line over 56 characters (`DG_TYPED_WIDE`:
a terminal never wraps), a `swap` that is not one line per row or a `strike` past the
rows (`DG_ROWS_MISMATCH`), a status `for` no mark (`DG_STATUS_NO_TARGET`, or
`DG_REF_UNKNOWN` for a name that is not there), a band with no cut inside its time
(`DG_BAND_NO_CUT`: without a cut it is a bar), a timer with no delay
(`DG_TIMER_NO_VALUE`).

## 4d · Several pictures in one: panels, and a camera

A talk often shows two pictures that explain each other: the mechanism, and the
incident where it failed; a topology, and the time axis of its outage; the test set,
lost in the production around it; four widgets of one dashboard. `compose` lays out
such a composition, one `dg-panel` per sub-picture, under **one** story:

| `compose` | Lays out | Panels at the root |
|---|---|---|
| `split` | a mechanism beside its track, 1.65 to 1 | 2 |
| `model-incident` | the model beside the incident, as wide as each other | 2 |
| `body-axis` | the body in a row, the panel with `layout="axis"` at its foot, across the room | 2 to 4, one axis |
| `inset` | one panel as wide as the room, a panel inside it | 1, holding a panel |
| `dashboard` | four widgets, two by two | 4 |

- A `dg-panel` holds its marks and groups directly, with its own `layout` (and the
  attributes of a group), a `label` for its caption and a `paint` that says its part
  (`pale` by default; `ink` sets what has no surface in the light ink). Panels are as
  tall as the others of their row, and what they hold is centred in them; a panel is
  never narrower than the least it holds its marks in, and the others share the rest.
  A note stays in the panel of its mark.
- **Names are local to a panel**: `name="lecteur"` in the panel `modele` is
  `modele.lecteur`, and a link, a note, an `after` written in that panel find it by
  `lecteur`. From outside, write the qualified name. A panel's own name is global.
- **Panels must be joined** (`DG_PANEL_APART`, an error): the same business object
  drawn in two panels says `entity="stop"` on both marks (a mark may stand for several:
  `entity="v25 checkout"`), or they share an axis · a `dg-meter`, a `dg-curve`, a
  `dg-timer` or a `dg-counter` of the same `unit` over ranges that meet. A panel inside
  another one is joined to it. A common title joins nothing.
- At the root of a composition stand panels and cameras only; anything else is not
  drawn and said (`DG_PANEL_PLACE`). `compose` and `intent` are exclusive: an intent
  beside it is `DG_PANEL_INTENT`, an error, and is neither drawn nor proved. A `layout`
  on the root is dropped and said. `dg-state` works inside a panel (clicks).
- A panel's `beat` brings it in with all it holds, together, as one beat; what has a
  beat of its own comes in with its panel and acts on its own beat.

The kill switch and its incident, joined by the flag both draw:
```html
<deck-diagram play="enter" compose="model-incident">
  <dg-panel name="modele" label="le mécanisme" layout="column" gap="airy">
    <dg-box name="drapeau" entity="stop" icon="flag" label="MARCHE" swap="STOP" paint="gold" beat="event"></dg-box>
    <dg-group layout="row" gap="airy" align="stretch">
      <dg-box name="lecteur" icon="code" label="is_active()" paint="ink"></dg-box>
      <dg-box name="acme" icon="target" label="ACME" paint="pale" proof="0 recherche" beat="proof"></dg-box>
      <dg-link name="cree" from="lecteur" to="acme" steady="3s" dim beat="spread"></dg-link>
    </dg-group>
    <dg-link from="lecteur" to="drapeau" label="lit"></dg-link>
  </dg-panel>
  <dg-panel name="incident" label="26 avril" layout="column" gap="airy" beat="effect">
    <dg-group layout="row" gap="normal">
      <dg-box name="db2" entity="stop" icon="database" label="DB 2 · STOP" paint="gold"></dg-box>
      <dg-box name="db3" icon="database" label="DB 3 · vide" paint="pale"></dg-box>
    </dg-group>
    <dg-box name="code" icon="code" label="is_active()" paint="ink"></dg-box>
    <dg-link from="code" to="db3" label="lit" flow="1" turn="danger" beat="proof" after="modele.acme"></dg-link>
  </dg-panel>
</deck-diagram>
```

**A camera.** `dg-camera` draws nothing: the picture opens framed on a mark or a panel
(`focus`) and, on its beat, moves to another (`to`) or back to the whole composition
(`all`, the default). `beat`, `after`, `with` and `duration` time it like a mark, and
each later camera starts where the one before ended. You write no scale, no offset:
the camera frames what it names with a margin, as close as the frame allows (2.6 times
at most), never past the edge of the picture, keeps the caption of the scope it shows
whole and slides off the one around it. A camera that ends on a detail goes back to
the whole picture once the story is told · print, PDF, the overview, reduced motion
and a slide entered directly show the whole composition at rest, and the story plays
from its opening frame. The frame is the drawing's own, as tall as the picture: a mark
tall in a short picture is barely closed in on, so frame a part that is small in it.
The test set, then the production it is lost in:
```html
<deck-diagram play="enter" compose="inset">
  <dg-panel name="prod" label="production · 25 000 contacts" paint="ink" layout="row" gap="airy">
    <dg-panel name="jeu" label="jeu de test · 3 sur 3" paint="ok" layout="column">
      <dg-table name="cas" paint="ok" beat="steady" rows="
        CEO
        DRH" swap="
        ✓ CEO
        ✓ DRH"></dg-table>
    </dg-panel>
    <dg-table name="reels" label="intitulés réels" icon="database" paint="pale" beat="spread" rows="
      CEO | fournisseur
      Leiter Außendienst
      销售总监
      (vide)"></dg-table>
    <dg-box name="verdict" icon="spark" label="« CEO de lemlist ? »" paint="bad" beat="effect"></dg-box>
    <dg-link from="reels" to="verdict" flow="2" turn="danger" beat="effect" with="verdict"></dg-link>
  </dg-panel>
  <dg-camera name="recul" focus="jeu" to="all" beat="event"></dg-camera>
</deck-diagram>
```
A zoom out in rings: three cameras in a row, `focus="environnement.code"
to="environnement"`, then `to="exploitation"`, then `to="all"`, each ring's satellites
in a group whose `beat` waits for its camera (`after="cadre-env"`).

What only a composition gets wrong is said: `DG_PANEL_PLACE` (a panel with no name, the
wrong number of panels, a body with no axis, an inset with no panel inside, a mark at
the root, a panel or an `entity` outside a composition), `DG_PANEL_APART`,
`DG_PANEL_INTENT`, `DG_CAMERA_TARGET` (a name with no place on the picture, a `focus`
on a later camera), `DG_CAMERA_ILLEGIBLE` (a frame that would show text under the
scale), `DG_CAMERA_STORY` (a camera in a diagram of clicks: dropped).

## 4e · Recipes · twelve graphic models, filled with a brief

A recipe is a skeleton told as a story (§4b, §4c, §4d) taken from one graphic model: its marks are named for the part they play, its `{{fields}}`
are the facts of a brief, its beats are the sequence the model imposes. You do not
arrange it; you fill it. Different recipes look different by construction, and the
same recipe filled with two briefs tells two stories.

```sh
npx rikiki recipe --list                          # the twelve, their model, their tempo
npx rikiki recipe "Tout est vert, et 19 h sans un lead"   # the closest, the same every time
npx rikiki recipe incident-band                   # the brief to fill, the sequence, the pitfalls, the skeleton
npx rikiki recipe incident-band --brief > b.json  # the example brief, to edit
npx rikiki recipe incident-band --fill b.json     # your slide · or why the brief is refused
```

| Recipe | Model (talk slides) | The story it plays |
|---|---|---|
| `incident-band` | M15 incident frise (42, 52) | normal pace → dated cut → a void as long as it lasted → the loss counted → who found it |
| `lanes-gate` | M22 lanes and a gate (56, 57) | traffic runs → a command is written → its one reader drops the gate → nothing reaches the target |
| `probe-stations` | M16 a probe (41, 43, 59) | a fake item rides the chain → a station fails at its minute → the runs judged → the alert, before the client |
| `wiring` | M17 wiring, fan-in (44, 45, 68) | items wired to runners → the control finds the one with no wire → the wire is added → the report proves it ran |
| `switch-over` | M21 topology that switches (53, 86) | traffic to the primary → it falls → the lever turns to the standby → RPO and RTO on the axis below |
| `race-lock` | M23 a race (55, 61) | the job runs → a second actor arrives → one takes the lock, the other does nothing → one delivered |
| `filter-records` | M19 records through a filter (47) | real rows taken → changed and struck on the way → the tests on the copy find a real case |
| `version-lanes` | M20 lanes of versions (49) | old version runs → announcement → the new one opens → users move one by one → the old one stops |
| `escalation-runbook` | M24 escalation (65, 71, 72) | the watch pings → it fails → nobody answers, the delay runs → the backup → the runbook ticked |
| `pulse-threshold` | M25 pulse and threshold (67, 70, 87) | beats ride → silence → the series falls under its line → the grace delay → one alert |
| `scope-rings` | M14 rings of scope (40, 51, 63, 74) | close on the part we trust → pull back ring by ring → each ring names what it adds |
| `data-replay` | M3 a replay of data (15, 16, 17) | the period, the total, the series and the milestones move together → the arrival stays |

- **A brief is refused** (`--fill`, exit 1) when a field is empty, generic (`service A`,
  `client`, `TODO`), longer than its place holds, left as `{{field}}`, or when it holds
  fewer than two precise values. Invented facts say so in the `source` field
  ("Illustration · … inventé pour l'exemple"); a real incident names its source.
- Keep the names and the beats of the skeleton: the sequence is the recipe. Change the
  words, the figures, the rows · and check: `npx rikiki check deck.html --steps`.
- **Tempo.** An incident (`incident-band`) is short and hard; the remedy that follows
  takes its time; an opener (`scope-rings`) pulls back fast. Alternate them.
- What the recipes cannot do yet, said rather than faked: a probe does not pause at each
  station, the rings are rectangles, `data-replay` swaps its period once instead of
  ticking a clock week by week (no stacked bars, no phase bands, no milestones on the
  curve: that needs a `dg-replay` reading frames of data).

## 5 · Bounds

`bounds="800x500"` is the room (default: the scene's width, 600 high); `max-marks`
tightens the ceiling of 500 marks. **The diagram never removes a mark, shortens a
text or sets type below its scale.** If the marks do not fit, it tries tighter
spacing and, for a graph, the other direction; if nothing fits it draws them anyway
and reports `DG_NO_FIT` with `fix.keep`, how many marks would fit. Take that number
seriously: cut to it, or split the slide. Labels are one to three words; a note is one
sentence. `rikiki scene budgets <shape>` says how many characters a field holds.

## 6 · The loop

```sh
npx rikiki check deck.html --slides 7 --json     # a few seconds · only slide 7
npx rikiki render deck.html --slides 7           # look at the picture
npx rikiki check deck.html --slides 7 --steps    # a diagram with `step`: every click
npx rikiki render deck.html --slides 7 --steps   # one picture per click
npx rikiki check deck.html --diversity           # the whole deck · which drawings look alike
npx rikiki check deck.html --richness            # the whole deck · what each drawing holds to see
```

Each row of `illustrations[]` also carries `richness` (0 to 100): five criteria of
20 points · `content` (two precise facts of two kinds · when, which, how much ·
and a `deck-source`), `demonstration` (two devices of relation), `story` (steady,
event, proof · only for a story, or a drawing that shows an event), `paint` (as
many flat fills as roles, up to three), `result` (a lasting proof, or the figure in
the thing put forward). A criterion that does not apply is left out. **It is a
measure, not a verdict**: no score, no exit code, and its warnings only with
`--richness`. Read each criterion's `fix`, then change what the brief says, not
the number: more marks, colours or seconds earn nothing.

Read `illustrations[]` in the report: `score` (0 to 100), `verdict`, seven `facets`
(frame, balance, alignment, hierarchy, density, motion, and meaning for an
intent: a defect of meaning fails the verdict). **A defect is an error and
fails the picture whatever its score; balance is a warning with a threshold.** Every
finding carries `measurement` and a `fix`:

| Finding | Means | Do |
|---|---|---|
| `DG_NO_FIT` | the marks do not fit | cut to `fix.keep`, or `bounds`, `direction="down"`, `gap="tight"` |
| `DG_REF_UNKNOWN` | a link or a note points at no `name` | name that mark |
| `SCENE_TEXT_TOO_LONG` | a word or field is wider than its box | shorten to `fix.targets[].holds` characters |
| `ILL_ESCAPE` · `ILL_SHAPE_OVERLAP` · `ILL_TEXT_OVER_SHAPE` | a shape leaves its frame · two overlap · a link's label sits on a mark | defects: fix, do not argue |
| `ILL_OFF_CENTRE` · `ILL_MARGIN_UNEVEN` | the weight leans · margins differ | apply `fix.try` (one attribute on a named mark, already tried); `fix.pulls` names what leans · or `balance="free"` if meant |
| `ILL_FOCAL_MANY` · `ILL_FOCAL_WEAK` | two things put forward · the accent barely leads | one `emphasis` on the item the title argues for · `fix.rival`, `fix.try` name the mark to quiet |
| `ILL_NEAR_ALIGN` · `ILL_SPARSE` | two edges miss · a few marks in a large room | `fix.marks`, `fix.cause`, `fix.try` · `fix.emptyPct`, fewer words or a larger drawing |
| `ILL_WORDY` | over 90 words | fewer words |
| `DG_LINK_CROSSES` · `DG_LABEL_BLOCKED` | a link runs under a mark · its label has no free place | drop `route="straight"`, neighbour the ends · shorten to `fix.holds` |
| `DG_STEP_WORDS_UNSEEN` | a late mark's first words per click are never seen | write `fix.write` |
| `ILL_TYPE_SCALE` | more than four sizes, or two nearly equal | use `size` sparingly |
| `ILL_MOTION_ENDLESS` · `ILL_MOTION_LONG` | never stops · over 3s (a story: past its budget, 12 s at most; a loop that starts once it has played is allowed) | no looping animation · a `step`, or a story |
| `ILL_NO_STEADY_STATE` · `ILL_STORY_NO_PROOF` | a story breaks with under 1.5 s of flow before · or with no proof after | `steady="3s"` on a lane or a link · `proof="…"` on the target, `beat="proof"` |
| `ILL_BEAT_OVERLAP` | two beats of a story start under half a second apart | `after` on the second, `with` if they are one beat, or fewer beats |
| `ILL_FINAL_INCOMPLETE` | the end of a story lost a break, an effect or a proof (tokens alone) | a swap, a tone, a gate that stays closed, a proof or a note on that beat |
| `ILL_REPEATED_LOOK` | two drawings of the deck are the same look (distance under 0.15) | another intent, layout or marks for one · or merge the slides |
| `ILL_GENERIC` (`--richness`) | no precise fact on the drawing, generic labels | the facts of the case: an hour or a date, an identifier, a count · `fix.kinds` says which kinds are missing |
| `ILL_FLAT_PAINT` (`--richness`) | roles that differ painted alike | `paint="pale"` context, `gold` control, `ink` target, `bad` incident, `ok` sound |
| `ILL_MODEL_REPEAT` (`--richness`) | the same graphic model a third time in five illustrated slides, not progressing | another model if the sentence says another relation · or a motif: the same named marks, their words moving on |
| `DG_MOTION_BUDGET` | a click moves for more than 2.8 s, played faster · a story past its `budget` | a `step` for what can wait · fewer beats, a shorter steady |
| `DG_STORY_ATTR` | a story attribute on a diagram of clicks · a `step` in a story · `play` with `intent` or `dg-state` | `play="enter"` on the root, or drop it · `beat` instead of `step` |
| `DG_MOTION_CYCLE` | marks wait for each other through `after` | break the loop |
| `DG_MARK_EMPTY` · `DG_TYPED_WIDE` · `DG_ROWS_MISMATCH` | a terminal, a table or a counter with nothing to say · a typed line over 56 characters · a `swap` not one line per row, a `strike` past the rows | write the lines, the rows, the value · split the line · one line per row |
| `DG_STATUS_NO_TARGET` · `DG_BAND_NO_CUT` · `DG_TIMER_NO_VALUE` | a status for no mark · a band whose `from < cut < until ≤ to` does not hold · a timer with no delay | `for="name"` · a cut inside its time, or a `dg-bar` · `value="5" unit="min"` |
| `DG_MARK_PLACE` | a lane or a gate outside `layout="lanes"`, a cursor outside `axis` | move it into one |
| `DG_PANEL_APART` | two panels share no entity and no axis · two slides in one frame | `entity="…"` on the same object in each, or a gauge, a curve, a timer, a counter of one unit · or split the slide |
| `DG_PANEL_PLACE` · `DG_PANEL_INTENT` | a composition with the wrong panels, a mark at its root · an intent beside `compose` | the panels its shape takes, the mark in a panel · drop the intent or the composition |
| `DG_CAMERA_TARGET` · `DG_CAMERA_ILLEGIBLE` · `DG_CAMERA_STORY` | a camera on a name with no place · a frame that shows text too small · a camera on clicks | name a mark, a group or a panel · fewer marks · `play="enter"` |
| `DG_GATE_LANE_UNKNOWN` | a gate's `over` names a lane its group does not have | name a `dg-lane` of the group |
| `DG_TOKENS_MANY` | `flow` over 8 · in a story, over 12 a lane or 40 in all, flow and queue | 8 tokens say a queue; more say nothing · a shorter steady |
| `DG_VALUE_RANGE` | a meter's or a curve's value past its `max`, a queue's `fill` past its `count` | write the true scale · the drawing would lie |
| `DG_CURVE_POINTS` | a curve of one value or more than twelve, `ticks` neither one per value nor two | a bar chart for fewer, a coarser step for more |
| `DG_STATE_STEP` | two `dg-state` of one place on the same click | give each next state its own `step` |
| `DG_MORPH_CROWD` | over seven marks change place on one click | a state more, or fewer parts that move |
| `INT_ROLE_MISSING` · `INT_ROLE_EXTRA` | a part of the intent has too few or too many marks | `npx rikiki intent <name>` gives the bounds |
| `INT_COMPOSE_APART` | a secondary no arrow joins to the main picture | drop the `inflow` of its own · let the intent feed it |
| `INT_BARRIER_NOT_ACROSS` · `INT_BOTTLENECK_NOT_NARROWEST` | the gate leaves a lane out · the neck is as wide as what feeds it | drop `over` · write the true rates |
| `INT_CAUSE_NO_ARROW` · `INT_ACCUMULATE_NOT_MONOTONE` · `INT_TRANSFORM_NO_PAIR` | no arrow from cause to effect · a stock up then down · no part named alike before and after | fix the links, the values, the names |
| `INT_FEEDBACK_OPEN` · `INT_PROPAGATE_NOT_REACHED` · `INT_MERGE_APART` | the loop never comes back · a mark no arrow from the origin reaches · a source that never meets the others | remove your `dg-link` and let the intent draw them |
| `INT_SCALE_TOO_CLOSE` · `INT_COMPARE_LIE` | under ten times the unit · values too far apart for one scale | the other intent (`compare`, `scale`) |
| `INT_PARTITION_NOT_WHOLE` · `INT_MERGE_NOT_SUM` · `INT_DRIFT_NOT_WIDENING` · `INT_TRADEOFF_ONE_SIDED` · `INT_THRESHOLD_NEVER_CROSSED` | the parts miss the whole · the sources miss their sum · a gap that shrinks · two gauges that move one way · a line never crossed | write the true figures, or another intent |
| `INT_CONTAIN_NOT_NESTED` · `INT_PARALLEL_NOT_TOGETHER` · `INT_PROPAGATE_SKIPS` · `INT_THRESHOLD_EARLY` | a layer with no edge · a branch that starts later · a far mark lit first · a consequence before its line | drop the `paint`, `step`, `after` or `tone` you wrote: the intent sets them |

At most three rounds. If a slide still fails, change the layout, or split it · do not
retouch what the grammar computes. Look at the picture, then at the deck once:
`npx rikiki check deck.html`. A clean report measures; it does not judge · the title
and the picture must still say the same thing.

## 7 · What not to do

- No coordinates, colours, font sizes, `<svg>`, `style=`. If the grammar cannot say it,
  draw a hand-written SVG and let `check` measure it, scoring and all.
- Two marks with `emphasis`; a figure with no unit and no source in `deck-source`.
- Dozens of words in a picture. A picture is read from the back of the room.
- A graph over 12 boxes: group them, or split the slide.
- The same layout twice in a row.
