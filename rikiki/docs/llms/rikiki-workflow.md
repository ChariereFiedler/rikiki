# Writing a deck with an agent · the working guide

This is the short path from a brief to a file someone can present. It is
written for an agent driving `rikiki-deck` from an install, and it assumes no
particular tool beyond a shell and a browser.

Read this end to end once. After that, jump to the step you are on.

The exhaustive tag, attribute and token tables are in
[`rikiki-reference.md`](./rikiki-reference.md); this guide says when to reach
for them. What makes a slide worth projecting is §14 there, and it is the one
section to read before writing any content.

**The seven steps**

1. [Fill the gaps in the brief](#1--fill-the-gaps-in-the-brief)
2. [Propose a plan](#2--propose-a-plan)
3. [Choose the compositions](#3--choose-the-compositions)
4. [Write the slides](#4--write-the-slides)
5. [Render and check](#5--render-and-check)
6. [Fix](#6--fix)
7. [Deliver](#7--deliver)

---

## 1 · Fill the gaps in the brief

Before writing a single slide, write down the editorial contract. It is eight
lines and it decides everything after it.

```markdown
- Audience:      who is in the room, and what they already know
- Decision:      what they should do, decide or understand differently
- Duration:      minutes, which caps the slide count
- Language:      the deck's language, which sets `<html lang>`
- Context:       projected, read alone, or both
- Theme:         rikiki, siliceum, or a constraint from a brand
- Sources:       what you were given, and what is quotable from it
- Missing:       what you had to ask for or assume
```

Ask for what is missing rather than inventing it. If asking is not possible,
write the assumption into `Missing:` and carry it into the deck's notes, so the
person presenting knows what to verify before standing up.

**Duration caps the deck.** A spoken slide takes about a minute, a section
divider takes none. Twenty minutes is roughly fifteen content slides, not
thirty. Cutting at the plan stage costs a line; cutting after writing costs an
hour.

**Never invent a number, a quotation or a source.** Not a rounded figure, not a
plausible date, not an attribution. If the brief gives you a number, use it
exactly and keep where it came from in `<deck-notes>`. If a slide needs a figure
you were not given, mark it in the deck itself:

```html
<deck-stat num="TODO" tone="orange">
  <h3 slot="claim">conversion rate</h3>
  to confirm with the data team before the talk
</deck-stat>
```

A visible gap gets filled before the talk. An invented number gets presented.

## 2 · Propose a plan

One line per slide, before any HTML:

```
1  cover        · title, speaker, duration, audience
2  section      · The problem
3  assertion    · Deploys fail on Friday because nothing gates the tag → the CI graph
4  comparison   · Before / after, one column each
5  takeaway     · Gate the tag on the same checks as main
```

Each content line carries **the message and its evidence**. A line that reads
"talk about the CI" is not a plan, it is a subject. Show the plan and get it
agreed before writing: reordering a list is cheap, reordering slides is not.

## 3 · Choose the compositions

Pick per slide, from the intent, not from the tag you remember. The recipes are
in [§Recipes](#recipes) below. When two fit, take the one with fewer elements.

## 4 · Write the slides

Start from a real file:

```sh
npx rikiki init talk.html --title "…" --theme rikiki
```

That writes an editable deck and copies the runtime beside it. Then edit the
HTML directly. Two rules that save a rewrite:

- **Give every slide a stable `id`.** `<deck-feature id="ci-gate">`. It is how
  `render` selects it, how `check` reports it, and how you edit one slide later
  without touching the rest.
- **An attribute a component does not read is dropped in silence.** `deck-stat`
  takes `num` and its words as content; writing `label="…"` on it loses the
  label with no error anywhere. `check` reports these as `UNKNOWN_ATTRIBUTE`,
  and the reference tables say what each element accepts.
- **Put detail in `<deck-notes>`, not on the slide.** The presenter window (`P`)
  shows them, the projector does not. Sources, figures to verify and the
  sentence you would say belong there.

## 5 · Render and check

Never claim a deck works without having looked at it.

```sh
npx rikiki check talk.html          # what is wrong, where, and what to try
npx rikiki render talk.html         # one picture per slide + a gallery
npx rikiki render talk.html --steps # each revealed state, not just the first
```

`check` exits 0 when nothing blocks, 1 on defects, 2 when it could not look at
the deck at all. Read the pictures too: `check` measures, it does not judge. A
green report on an ugly slide is still an ugly slide.

Read what the report says it did **not** check. It does not read your wording,
your figures or your argument. Those are yours.

## 6 · Fix

When a slide is too full, try these in order and stop at the first that works.
The order matters: the early moves keep the deck's shape, the late ones change
it.

1. **Cut the repetition.** The title already says it; the body does not have to.
2. **Shorten.** Sentences to clauses, clauses to words.
3. **Move detail into `<deck-notes>`.** It is still said, just not projected.
4. **Split the slide.** Two slides with one idea each beat one with two.
5. **Change the composition.** A list that will not fit is often a comparison, a
   flow, or a single number.
6. **Adjust the type,** last and within the readable floor. Below the floor the
   back row loses the line, which is worse than a split.

**Edit narrowly.** A request about one slide changes that slide. Keep the ids
stable, leave the others byte for byte, and re-run `check` on the whole deck
afterwards to be sure the edit did not move anything else.

## 7 · Deliver

Three shapes, three audiences:

```sh
npx rikiki bundle talk.html          # one HTML file · opens offline, anywhere
npx rikiki export talk.html          # PDF, one page per slide
# the source folder itself           # for whoever will edit it next
```

The bundle needs `rolldown`, the PDF needs `playwright`; both are optional peers
and both say so when missing. `bundle` exits non-zero if the result would still
fetch anything, so a file it accepts really opens on a plane.

Before handing over: run `check` one last time, open the PDF, and say what you
did not verify.

---

## Recipes

Nine compositions by intent. Each says what it is for, what to put in it, how
much fits, what the notes carry, when to split, and one variant. Every HTML
block below is checked by the repository's test suite, so it is copy-paste
correct, but the words in it are placeholders: replace them with the brief's.

The house style behind all of them: the title states the message in a full
sentence, the body is the evidence, one loud thing per slide. See §14 of the
reference for why.

### 1 · Assertion and proof

**For:** the default content slide. A claim, and the thing that makes it true.

```html
<deck-feature id="ci-gate" eyebrow="Delivery">
  <h1 slot="title">A tag that publishes runs fewer checks than a branch push</h1>
  <deck-callout type="warn">
    On a tag pipeline the branch variable is empty, so only the publish job runs.
  </deck-callout>
  <deck-notes>Source: the pipeline definition, job rules. Say the consequence out loud.</deck-notes>
</deck-feature>
```

**Fits:** one claim, one block of proof, three lines at most in it.
**Notes:** the source, and the sentence you would add if asked.
**Split when:** the proof needs two blocks. Two claims are two slides.
**Variant:** swap the callout for a `<deck-code>` when the proof is code.

### 2 · Comparison

**For:** two options, two states, before and after.

```html
<deck-split id="before-after" eyebrow="Migration">
  <h1 slot="title">Moving the gate to the tag removes the only unchecked path</h1>
  <deck-card slot="left" color="grey">
    <h3>Before</h3>
    <p>The tag publishes on 61 unit tests.</p>
  </deck-card>
  <deck-card slot="right" color="green">
    <h3>After</h3>
    <p>The tag runs what a branch push runs.</p>
  </deck-card>
</deck-split>
```

**Fits:** two columns, one heading and two lines each. Never three columns of
prose; the eye compares two things, not three.
**Notes:** what the comparison costs, which never fits on the slide.
**Split when:** each side needs its own evidence. Then it is two assertion
slides and a takeaway.
**Variant:** `<deck-feature-cards>` for three short parallel items where nothing
is being weighed against anything.

### 3 · One number, and what it means

**For:** a figure that carries the slide on its own.

```html
<deck-feature id="drift" eyebrow="Measured" spread="center">
  <h1 slot="title">Nine tracked files drifted from their sources on a clean build</h1>
  <deck-stat num="9" tone="orange">
    <h3 slot="claim">files rebuilt differently</h3>
    plus one that was never committed at all
  </deck-stat>
  <deck-notes>Measured on a clean tree, 2026-09-08. The tenth file is the deck-point declaration.</deck-notes>
</deck-feature>
```

**Fits:** one number. A second number on the same slide halves the first one's
weight.
**Notes:** how it was measured, and when. A figure with no method is a rumour.
**Split when:** you have three numbers. That is a `deck-kpi-grid`, or three
slides if each deserves a sentence.
**Variant:** `<deck-punch>` when the point is a phrase rather than a figure.

### 4 · A process

**For:** ordered stages, where the shape is half the message.

```html
<deck-feature id="loop" eyebrow="Workflow" spread="center">
  <h1 slot="title">Every deck goes through the same four gestures</h1>
  <deck-step-list>
    <deck-step n="1">Write the HTML</deck-step>
    <deck-step n="2">Render and check</deck-step>
    <deck-step n="3">Fix what it names</deck-step>
    <deck-step n="4">Bundle or export</deck-step>
  </deck-step-list>
</deck-feature>
```

**Fits:** three to five stages, four words each.
**Notes:** what happens between the stages.
**Split when:** a stage needs a sentence. Give it its own slide and keep the
list as the map.
**Variant:** `<deck-flow>` (opt-in, one script tag) when the stages should
reveal one at a time under `steps`.

### 5 · Code, explained

**For:** the line that matters, not the file it lives in.

```html
<deck-feature id="peer" eyebrow="Packaging">
  <h1 slot="title">The bundler loads on first use, so an install never pays for it</h1>
  <deck-code lang="ts" hero>
async function loadRolldown() {
  try {
    return (await import('rolldown')).rolldown;
  } catch {
    throw new ExpectedError('install it next to rikiki-deck: npm i -D rolldown');
  }
}
  </deck-code>
  <deck-notes>~55 MB of native bindings · optional peer, reported when missing.</deck-notes>
</deck-feature>
```

**Fits:** eight to twelve lines. Past that nobody reads it, they wait for you to
explain it.
**Notes:** the part you will say instead of reading the code aloud.
**Split when:** two functions. Show the call site on one slide, the body on the
next, and use `data-morph` if you want them to connect.
**Variant:** `step-groups` on `<deck-code>` to walk through the same block line
group by line group.

### 6 · An architecture

**For:** how the parts sit together. Boxes and arrows, never paragraphs.

```html
<deck-feature id="layers" eyebrow="Architecture" spread="center">
  <h1 slot="title">The commands share one browser layer and own none of it</h1>
  <deck-mermaid>graph LR
  CLI[rikiki CLI] --> B[browser layer]
  B --> R[render]
  B --> C[check]
  B --> E[export]</deck-mermaid>
  <deck-notes>Lazy Playwright, a local server, the settle, and closing both on the way out.</deck-notes>
</deck-feature>
```

**Fits:** five to seven boxes. A diagram nobody can read in five seconds is a
handout, not a slide, and `check` reports in pixels when one stops fitting.
**Notes:** the boundary the diagram cannot draw.
**Split when:** the diagram has layers. Show the shape first, then one layer per
slide.
**Variant:** a screenshot with `<deck-annotate>` markers when the subject is a
real interface rather than a structure.

`<deck-mermaid>` needs the mermaid runtime: `rikiki init --with-mermaid`, or
`rikiki bundle --with-mermaid` when folding the deck into one file.

### 7 · Change over time

**For:** what moved, and in which direction.

```html
<deck-feature id="weight" eyebrow="Before / after">
  <h1 slot="title">Naming the published assets cut the site from 400 MB to 14</h1>
  <deck-metric-list>
    <deck-metric value="14.3 MB">Published site, down from 400 MB</deck-metric>
    <deck-metric value="7 entries">What a browser is allowed to fetch</deck-metric>
  </deck-metric-list>
  <deck-notes>The old build copied the sources, the fixtures and 366 MB of dependencies.</deck-notes>
</deck-feature>
```

**Fits:** two or three rows. A table of eight belongs in the notes or a handout.
**Notes:** what the change cost, and what it did not fix.
**Split when:** the trend needs a curve. That is an image, and it gets a slide.
**Variant:** `<deck-bar>` (opt-in) when a proportion, rather than a delta, is the
point.

### 8 · A decision and its trade-off

**For:** the choice made, and what was given up for it.

```html
<deck-split id="decision" eyebrow="Decision">
  <h1 slot="title">We ship the assembler rather than drop it from the reference</h1>
  <deck-card slot="left" color="green">
    <h3>What we gain</h3>
    <p>A documented command a consumer can actually run.</p>
  </deck-card>
  <deck-card slot="right" color="grey">
    <h3>What it costs</h3>
    <p>One more public surface to keep working.</p>
  </deck-card>
  <deck-notes>Alternative considered: delete the section. Rejected, the feature is useful.</deck-notes>
</deck-split>
```

**Fits:** one decision, one gain, one cost.
**Notes:** the alternatives you rejected, and why. That is the question you will
be asked.
**Split when:** there are three options. Compare them on one slide, then decide
on the next.
**Variant:** `<deck-checklist>` when the decision is a set of criteria rather
than a trade.

### 9 · The close

**For:** the last slide. What you want them to do.

```html
<deck-takeaway id="close">
  <h1>Gate the tag on the same checks as main, this sprint</h1>
  <p>One pipeline change, no new tooling.</p>
</deck-takeaway>
```

**Fits:** one sentence, one qualifier. No summary, no thank-you slide, no
questions slide.
**Notes:** the first thing you will say when the talk stops.
**Split when:** never. If two actions are needed, name the first one.
**Variant:** `<deck-cover>` again with the contact details when the deck will be
read alone rather than presented.

---

## Where to look next

| Question | Where |
|---|---|
| Every tag, attribute, slot and token | `rikiki-reference.md` |
| What makes a slide worth projecting | reference §14 |
| Themes and design tokens | reference §11 |
| Reveals, steps and animation | reference §7 |
| The three ways a deck runs | reference §16 |
| Diagnostic codes and the manifest | reference §12b |
