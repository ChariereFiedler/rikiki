# ADR-003 · A slide composes itself

Status: accepted, 2026-09-07. Extends ADR-002 from the opt-in components to the
core layouts and the themes.

## Why this exists

Four slides were rejected in a room. None of them was an authoring mistake;
each is what the defaults produced from correct markup. That is the finding.

1. A dark slide wore a paper-coloured frame during every transition.
2. A row of three columns gave the one column carrying a surface a box several
   times the height of its text, and pushed its text off the reading edge its
   two plain neighbours shared.
3. A slide of text on an empty canvas, with nothing to look at.
4. A row of four items where two titles wrapped to a second line and dragged
   their own body text below their neighbours', so no row shared a baseline.

The reflex reading is that the author under-specified. The measured reading is
that the engine composes by flow · a flex column, each block sized by its own
content, the leftover dropped wherever it falls · and a flow only ever knows
about local boxes. It cannot be asked about the canvas, so it cannot be asked
for balance.

## The decision

**Balance is the engine's job, not the author's.** An author supplies content
and roles. Where the geometry cannot be settled by the engine, it is measured
and failed rather than left to taste.

Three things follow, and they are what this ADR fixes.

### 1 · A transition covers, or it tiles. It never does half of each

A transition that scales or rotates the incoming slide leaves it smaller than
the canvas for part of the animation. Painting the outgoing slide underneath
then frames the new slide in the old slide's surface, and the room reads that
as a border rather than as motion.

Transitions are therefore split by what they promise. The translating ones tile
and both slides are painted, because showing both is the point. Every other
transition covers, and the outgoing slide is not painted at all · `deck-root`
has already repainted the letterbox in the incoming slide's own colour by then,
so the uncovered edge carries the right colour.

Rejected: compensating the scale so the incoming slide always clears the
outgoing one. It works, and it is three magic numbers that the next transition
would have to re-derive.

### 2 · A bento item is sized by the grid or by its content · never both

This is the constraint the whole effort ran into, and it is worth writing down
because it is not obvious and it cost three attempts.

`deck-cell` is a size container. That is what lets its children be measured
against it: fit-to-cell text, a diagram capped in `cqh`, a contained image. A
size container reports no height of its own, so **its row can never be sized by
its content**, and the layout containment it implies makes **`subgrid` compute
to `none`**. Those two consequences are exactly defects 2 and 4.

Every way of having both in one element was tried and each failed differently,
all measured:

| attempt | result |
|---|---|
| drop the containment | the row hugs · the whole bento showcase clips |
| reduce it to the inline axis | the fit sizes the text, the text the row, the row the cell · WebKit reports the loop, Chromium swallows it |
| scope it to the cells holding a fit | passes on Chromium, fails on WebKit |

So the two behaviours are two elements. `deck-cell` is unchanged. `deck-point`
is the item made of words: no containment, so a row of points is as tall as its
tallest point, and a row made only of points shares the grid's bands, so a
title that wraps no longer drags its body text down.

A `deck-point` has no `justify`, deliberately. It is as tall as its content, so
there is no leftover height inside it, and offering to distribute one would be
offering back the hole the element exists to remove.

### 3 · The step between the two sizes is the design

ADR-002 asks for two sizes, a statement and a reading size, and says the third
step is what must be cut. It did not say how far apart the two are, and the
answer here was 1.56× · which is not two sizes, it is one size in two weights.
That single number is why decks obeying every other rule still read flat from
the back of a room.

A slide title is 2.44× the body now, a chapter title 3.05×. The ceiling is
measured rather than chosen: `e2e/slide-budget.spec.ts` fails when a slide
clips, and that is what decided how far this could go.

The ladder underneath is an invariant, not a preference: reading, lead, title,
punchline, chapter, each at least as loud as the last. It had already regressed
once and been fixed by hand without a test. It is a test now.

## What is still open

**The vertical distribution default.** A short slide still stacks at the top
and leaves the bottom empty. Two replacements have now been tried and measured,
and neither is shipped.

Centring the body inside the leftover detaches the block and leaves a hole above
*and* below. The honest reading is that such a slide is under-filled rather
than badly distributed, so the answer is `fill` plus larger type rather than a
different `justify-content` value, and making that the default is a separate
decision with its own blast radius.

Splitting the leftover 1:2 above and below the content was the answer to that
detachment · keep the space under the content clearly larger than the space over
it, so the block stays attached to its title. It was implemented as a
three-track grid on the field, with the gap moved onto the slot and an escape
for `fill` and an explicit `spread`. It works, in the sense that nothing broke.
It also **moves no number**: with it in, `deck-feature` still ranges 0.32 to
0.79 across 37 slides, exactly as without. A mechanism that adds a track system
and two escape hatches and changes no measurement is not worth its surface, so
it was removed rather than kept "because it is more correct".

What that null result says is that the spread is not made of free space being
dropped at the bottom. It is made of the head moving: the shoulder ranges from
0.19 to 0.32 of slide height, and the field starts wherever the title stopped.
The next attempt should be the fixed shoulder, not another distribution.

Until it is taken, `e2e/ink.spec.ts` keeps reporting the ink centroid without
failing on it, for the reason it always gave: while the engine does not own the
distribution, a threshold here would be taste, and a test that encodes taste
gets worked around within a month.

**Defect 3, the slide with nothing to look at.** ADR-002 removed the accent
rule, the micro-label, the numbering and the third type step, for measured and
correct reasons, and the doctrine that remains is entirely subtractive. ADR-002
lists what survives a room · area, size, position, one saturated colour, empty
space · and **figure** belongs to that list and was never forbidden. The ADR
rules out ornament, not image. Giving the figure a role of its own is the next
piece of work, and it is additive by construction.

## The rules an author is now told

The reference used to be a complete catalogue of what may be written and said
nothing about the result, which is why decks assembled correctly from it were
rejected. Section 14 now carries the medium and the five rules that follow from
it, and the `rikiki-deck` skill carries the short version. A catalogue answers
"may I write this". Neither it nor a component can answer "is this worth
projecting" unless somebody writes the answer down.
