---
name: rikiki-deck
description: Use when writing, composing or fixing a slide deck with rikiki — turning a brief into slides, choosing a composition, writing speaker notes, adding reveals, checking a deck and delivering it as HTML, a single file or a PDF. Triggers on "rikiki deck", "create a slide deck", "make slides", "presentation deck", "fais des slides", "une présentation".
---

# Writing a deck with rikiki

A deck is plain HTML: a theme stylesheet, then `dist/index.js`, then a
`<deck-root>` wrapping `deck-*` elements. Nothing compiles. You edit the file,
a browser renders it, and two commands let you see and measure what you wrote.

Work in this order. Skipping to step 4 is how a deck ends up correct and
useless.

```
1 contract → 2 plan → 3 composition → 4 write → 5 look & measure → 6 fix → 7 deliver
```

Full guide, with the nine recipes and their verified HTML:
`node_modules/rikiki-deck/docs/llms/rikiki-workflow.md`.
Every tag, attribute and token: `rikiki-reference.md` beside it.

## 1 · The contract, before any HTML

Eight lines. They decide everything after them.

```
Audience · Decision · Duration · Language · Context · Theme · Sources · Missing
Tone: sober unless asked otherwise · gifs only on explicit request
```

- **Ask for what is missing.** If you cannot ask, write the assumption into the
  deck where it will be seen and fixed, not into your own head.
- **Never invent a number, a quotation or a source.** Not a rounded figure, not
  a plausible date. A gap marked `TODO` gets filled before the talk; an invented
  figure gets presented.
- **Duration is words, not slides.** Speech runs at 100 to 130 words a minute
  for technical content, so twenty minutes is roughly 2,400 spoken words. Those
  words live in `<deck-notes>`. Nine thin slides fill ten minutes, whatever the
  plan says.

## 2 · The plan · three columns, not a table of contents

A list of subjects is not a plan. What makes a deck hold together is that each
slide answers a question the previous one opened. Write three columns:

```
#  Question the room is asking here    →  What this slide answers    →  With what
2  "Why should I care?"                   Recopying costs 40 min        two-column comparison
3  "So what would work instead?"          A slide is an HTML element    the code itself
5  "Does that actually hold?"             Valid code, broken slide      screenshot + marks
```

Two rules make it mechanical:

- **A slide answering no open question is cut or moved.** This is the single
  most useful check. It removes the "while we're at it" slides that a subject
  list always grows.
- **A question still open at the end needs a slide.** If nothing answers "what
  do I do Monday", the deck has no ending.

### The shape underneath

Two structures cover almost every technical talk. Pick one, name it, keep it.

- **Situation, complication, question, answer.** State the shared ground, then
  what disrupts it, then the question that follows, then your answer with its
  support. Barbara Minto's structure, from the consulting world, and the one
  that carries a recommendation best.
- **What is, what could be.** Alternate the present state and the possible one,
  each return to "what is" buying the next claim, tightening until the last
  slide only names the action.

For a tooling or migration talk, problem then solution then results works; for a
learning or migration story, the journey shape does.

### The title test, before writing any body

Read the slide titles in sequence, aloud. They must form a text that stands on
its own · that is the deck's argument. Any title that reads as a subject
("The architecture") rather than a claim breaks the chain, and any title you
could move elsewhere without loss means the order is not a story.

`rikiki render` writes the titles into its manifest, so the test can be run on
a deck already written. Run it on the plan first; it costs nothing there.

## 3 · Composition

### The rule the research supports

The title is a **full sentence stating what the slide argues**, eight to
fourteen words. The body is its **evidence**: a figure, a diagram, a number, a
comparison. Not a bullet list restating the title.

This is assertion-evidence, and it is here because it was measured: against the
usual topic headline over bullets, audiences understood and remembered more,
with fewer misconceptions and lower cognitive load. It is Mayer's multimedia
principles at slide scale.

Two consequences:

- **A bullet list read aloud is worse than no slide.** The room reads and
  listens to the same words at once, and pays for it.
- **Cutting is a design act.** Removing what does not serve the claim improves
  comprehension by itself.

`deck-cover` and `deck-section` are exempt: a chapter title is a boundary.

### Graphic composition, in seven decisions

What separates a slide that reads at ten metres from one that does not. The
first four are the ones that carry; spend effort there.

| Decision | The rule | The failure it prevents |
|---|---|---|
| **Hierarchy** | Two type sizes, and the gap between them *is* the design. A statement size and a reading size, nothing between. But the title is not free: a headline that wraps to two lines eats a third of the canvas, and everything under it then looks small. Prefer a title that fits one line. | A title at 1.5× reads as bold body text · the single commonest reason a deck looks flat. Its opposite: a three-line headline over one small box. |
| **Mass** | One filled area at most. Everything else sits on the page ground. | Two masses and the eye picks the wrong one. |
| **Text density** | The strongest measurable predictor of how a room judges a slide. When in doubt, remove a sentence. | A wall of text: nobody reads it, they wait for you to say it. |
| **Balance** | One alignment axis for the whole slide. Left-align by default; centre only when a single block is the whole slide. | Content massed in the top fifth with a dead half below · fix it with `spread`, not with more content. |
| **Colour** | The accent is a **mark**, not a surface: a rule, a stroke, a number, a word. Real emphasis on a light theme is the inverse surface. | An accent-tinted panel that is invisible on one of the two shipped themes. |
| **Whitespace** | Empty space is a choice, not a defect. It is what makes the one loud thing loud. But a lone callout on an otherwise empty slide is not restraint, it is a slide with nothing on it: either the claim deserves real evidence, or it belongs in the notes of the slide before. | Filling the space because it is there · and its opposite, a slide carrying one small box. |
| **Structure** | A device must encode information: number a list only when it is a sequence, label a block only when the label adds something. | Numbered markers on three unordered items, eyebrows above everything. |

### The density floor

A content slide carries at least one of: a figure, an image, three comparable
items, a diagram, or code. A headline over one sentence is not a slide · it is
a sentence that belongs in the notes of the slide before it.

`rikiki check` measures this on the pixels and reports `SLIDE_TOP_HEAVY` when
the ink sits in the top of the canvas with a dead band under it. It reports the
imbalance, never the amount of empty space: space that the composition uses is
left alone.

### Emphasis, icons, and the occasional gif

Flat prose on a slide reads as flat prose in the room. Three cheap tools:

- **Bold for the word that carries the claim**, italic for the aside or the term
  you are introducing. One or two per slide · past that nothing stands out.
- **`deck-icon`** (opt-in, 24 drawn glyphs) beside a status, a step or a
  verdict. It gives a shape to what would otherwise be another line of text.
  Give it a `label` when it carries meaning, leave it off when it decorates.
**Gifs are asked for, never offered.** Add one only when the person writing the
deck asks for it in so many words. No gif by default, none "because the slide
felt dry", none in a deck whose tone was never discussed. A steering committee
and a Friday internal talk do not want the same thing, and guessing wrong is
worse than a sober slide.

When asked: place one between two dense passages, or right after the hardest
slide. One per talk, maybe two. It works because it is rare, and never on a
slide that already has something to say.

**Where the file comes from matters as much as the file.** Tenor and Giphy both
require an API key, and their catalogue is largely clips from films and shows:
fine for a Friday internal talk, a risk for a recorded conference. Without a key
in the environment, use a source whose licence is explicit · Wikimedia Commons
has one on every file · or draw the animation yourself in the deck's own
colours. Either way, credit it on the slide: author, licence, source, one line.

The file must live next to the deck. A gif left on a remote URL breaks the
single-file promise, and `rikiki bundle` exits non-zero for it. Downloaded, it
inlines as base64 like any image (a 400 KB gif costs 400 KB there) and exports
to PDF as its first frame. Say so when you use one.

### Show the mechanism, do not describe it

A technical audience reads a diagram faster than a sentence about the same
thing. Three habits separate a deck that argues from one that recites:

- **A boxed sentence is not evidence.** A `deck-callout` carrying two lines of
  prose is the claim restated in a frame. Either the slide has something to
  show, or the sentence belongs in the notes of the slide before it.
- **Show your own artefacts.** A screenshot of the broken thing, the real
  report, the actual output. `deck-annotate` puts numbered marks on an image
  and reveals them one per step · one photograph of a defect beats a paragraph
  describing it.
- **Draw the flow.** A pipeline, a fan-out, a set of layers: `deck-graph` with
  positioned nodes says in one look what three bullets say badly. Reserve
  `deck-flow` for what is genuinely a sequence · one source with three outputs
  is a fan-out, and numbering it is a lie about the content.

### Choosing the element

Pick from what the slide has to say, not from the tag you remember. Reach for
the opt-in components when they fit · one `<script type="module">` each, after
the core bundle.

| The slide says | Reach for |
|---|---|
| A claim and its proof | `deck-feature` + `deck-callout` / `deck-code` |
| Two options, before and after | `deck-split` with two `deck-card` |
| One figure that carries the slide | `deck-stat` (`num` + a `claim` slot) |
| Several figures as one family | `deck-kpi-grid` + `deck-kpi` (opt-in) |
| An ordered process | `deck-flow` + `deck-flow-step` (opt-in) |
| How the parts sit together | `deck-graph` + `deck-node` / `deck-edge` (opt-in) |
| What works and what does not | `deck-checklist` + `deck-check` (opt-in) |
| A trajectory in time | `deck-timeline` + `deck-milestone` (opt-in) |
| Code, explained | `deck-code lang="…" hero` |
| The close | `deck-takeaway` |

`deck-mermaid` renders a diagram from text, but a hand-placed `deck-graph`
reads better for anything you can position yourself.

## 4 · Writing

```sh
npx rikiki init talk.html --title "…" --theme rikiki   # or siliceum
```

Then edit the HTML. Three rules that save a rewrite:

- **Give every slide a stable `id`.** It is how `render` selects it, how
  `check` names it, and how you edit one slide later without touching the rest.
- **An attribute a component does not read is dropped in silence.** `deck-stat`
  takes `num` and its words as content; `label="…"` on it loses the label with
  no error. `check` reports these.
- **Slotted content only renders if a slot takes it.** A `deck-card slot="a"`
  inside the wrong parent leaves a blank slide.

## 5 · The presentation mode · what the speaker gets

Press **P** and rikiki opens a second window: the current slide, the next one as
a preview, a running timer, and the `<deck-notes>` of the slide on screen. With
a second display it sends the slides fullscreen to the projector and keeps this
view on the speaker's screen. Both windows stay in sync through
`BroadcastChannel`.

Design for that window from the start:

- **The notes are the script, not a summary.** Write what you would say. The
  slide already carries what is projected; repeating it there wastes the one
  surface the speaker actually reads.
- **Put in the notes what must not be projected**: the source of a figure, the
  method behind it, the answer to the question you expect, the sentence you
  would add if asked, what to say if a demo fails.
- **The notes are what `check` measures for length.** A deck whose cover says
  `duration="20 min"` and whose notes carry two minutes of speech gets a
  warning. Either the notes are thin, or the slot is shorter than announced.
- **`<deck-notes>` never appears on the slide** and is not counted in what the
  room sees. It is the only place where being long is free.

### Reveals, when the slide would otherwise be a wall

```html
<deck-feature steps="2">
  <h1 slot="title">Two things happen, in order</h1>
  <p data-step-block="1">The first.</p>
  <p data-step-block="2">The second.</p>
</deck-feature>
```

Use a reveal when the order is the message: the speaker comments each state
before the next appears. Do not use it to fit more on one slide · that is a
split, not a reveal. Render them with `--steps`, or you are judging the emptiest
state of the deck.

## 6 · Fixing, in this order

Stop at the first that works. The early moves keep the deck's shape.

1. **Cut the repetition.** The title already says it.
2. **Shorten.** Sentences to clauses, clauses to words.
3. **Move detail into `<deck-notes>`.** Still said, no longer projected.
4. **Split the slide.** Two slides with one idea each beat one with two.
5. **Change the composition.** A list that will not fit is often a comparison,
   a flow, or a single number.
6. **Adjust the type,** last, and within the readable floor.

A request about one slide changes that slide. Keep the ids stable, leave the
others byte for byte, and re-run `check` on the whole deck afterwards.

## 7 · Look, measure, deliver

```sh
npx rikiki check talk.html            # 0 clean · 1 defects · 2 could not look
npx rikiki render talk.html --steps   # one picture per state + a manifest
npx rikiki bundle talk.html           # one file, opens offline  (needs rolldown)
npx rikiki export talk.html           # PDF, one page per slide  (needs playwright)
```

**Do both.** `check` measures what is objective: content clipped away, an
element that renders as nothing, a missing file, text too small for a room, an
attribute being ignored, a deck shorter than it claims. It does not judge
whether the slide is any good. So read the pictures too · a green report on an
ugly slide is still an ugly slide.

Read what the report says it did **not** check: your wording, your figures, your
argument, accessibility. Silence there is not approval.

## Before saying it is done

- [ ] Every figure in the deck comes from the brief, and nothing else does.
- [ ] The titles, read in sequence, form a text that holds together.
- [ ] Each slide answers a question an earlier slide opened.
- [ ] Each content slide's title is a sentence that states its message.
- [ ] No slide is a headline over a single sentence.
- [ ] Notes are written as speech, and their length matches the announced slot.
- [ ] `rikiki check` exits 0.
- [ ] You looked at the rendered pictures, including revealed states.
- [ ] What you did not verify is said out loud.
