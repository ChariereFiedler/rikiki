---
name: rikiki-visual-design
description: Use before making any VISUAL decision on a rikiki deck component or theme — what a slide looks like, not how it is wired. Triggers on "the component is ugly", "c'est moche", "make it look better", "redesign deck-*", a new visual in src/extras/, or any change to a colour, a surface, a type scale or a layout rhythm. Repo-only. Load frontend-design FIRST, this second, rikiki-component third.
---

# Designing what a rikiki slide looks like

The other rikiki skills are contracts of completeness: `rikiki-theme` says define
every semantic token, `rikiki-component` says never hardcode a colour. Neither
says anything about whether the result is any good. This one carries the visual
constraints that are specific to rikiki and measured in this repo.

## Order of loading, and it matters

1. **`frontend-design`** decides the direction. It is the authority on what
   currently reads as machine-generated, and it is maintained; nothing in this
   file overrides it. Its two-pass process applies here in full: write the plan,
   review the plan against its calibration list, revise, only then write code.
2. **This file** adds the rikiki constraints below, which `frontend-design`
   cannot know.
3. **`rikiki-component`** for the Lit mechanics, the buckets, the build.
4. **`de-ai-slop-frontend`** last, as a sweep for named surface effects.

Skipping step 1 is how `src/extras/` ended up with a signature made entirely of
the 2026 tells · mono uppercase micro-labels, hairline rules at zero radius,
01 / 02 / 03 numbering, middle-dot meta strings · and was rejected three times.

## What is fixed and what is free

**Fixed, do not spend design effort here.** The palette is the siliceum brand:
warm paper `#faf8f5` with a mango accent `#f07020`, and a night scale for the
inverse surfaces. It happens to sit in a well-known generic cluster. That is not
a reason to change it; it is a product decision that predates any of this, and
an explicit constraint always wins. The type families are set by the themes.

**Free, and therefore where the work is.** Structure, hierarchy, the type scale
and its rhythm, the layout concept, what carries emphasis, what motion exists.
Because the palette axis is spent, do not spend the free axes on the other
clusters either · that is how you end up generic twice over.

## The measured facts about surfaces

Contrast against `--rik-surface-page`, computed from the theme files (rerun with
`scripts/theme-contrast.test.mjs`, never copy these numbers forward by hand):

| token | rikiki | siliceum |
|---|---|---|
| `--rik-surface-raised` | 1.10 | 1.05 |
| `--rik-surface-sunken` | 1.10 | 1.04 |
| `--rik-accent` | 2.81 | 1.48 |
| `--rik-surface-inverse` | 18.88 | 18.94 |

Consequences, and they are not stylistic opinions:

- **There is no pale surface that reads.** A tinted tile on the light theme is
  invisible in the room. Every attempt to build emphasis out of `raised`,
  `sunken` or a status tint has failed here, and the numbers say why.
- **Real emphasis on a light theme is the inverse surface**, with
  `--rik-text-inverse` on it. That is the only fill that carries at 18:1.
- **`--rik-accent` is a mark, not a surface.** It is legitimate as a rule, a
  stroke, a text colour on paper. It is illegitimate as the background of
  anything large, and under siliceum at 1.48 it does not exist at all.
- Emphasis that is a fill must clear **3:1** against what surrounds it; text on
  it must clear **4.5:1**. Both are checked in CI.

## The medium is a projected slide, not a page

Design for the room, which is the constraint `frontend-design` cannot infer:

- **Ten metres and a mediocre projector.** Thin strokes, low-contrast greys and
  small type disappear. When in doubt, fewer things, larger.
- **Both themes ship.** Every visual must work under `themes/rikiki.css` and
  `themes/siliceum.css`. A component tested under one is untested.
- **Four rendering contexts, not one.** The slide, the presenter view, the
  overview grid at thumbnail size, and the PDF export. A device that only works
  at full size is broken in three of the four. Colour-only distinctions die in
  the PDF unless `print-color-adjust: exact` is set.
- **The audience is reading while someone talks.** One idea per slide has a
  visual consequence: one thing may be loud, everything else is quiet.
- **Steps are the medium's own device.** Progressive reveal through `applyStep`
  is available and costs nothing; use it instead of cramming.

## Where the vertical emptiness comes from

Most slides render their content in the top fifth and look unfinished. This is
almost never a component bug: the layouts already expose `spread`
(`start|center|end|between|around|evenly`, see `src/shared/slide-fill.ts`) and
`fill`. A slide that looks empty is usually a fixture or a deck that never asked
for distribution. Check the authoring before restyling the component.

## Rules that survive every redesign

- Every value is a token. Per-instance knobs are `--deck-<tag>-*` and default to
  a `--rik-*` value. No literal colour, no literal length. This is the one part
  of the old signature that was never wrong.
- A structural device must encode information. Number a list only when the
  content is a sequence, label a block only when the label adds something.
- Motion is one gesture, optional, and `prefers-reduced-motion` is honoured.
- English in code, comments and commits. No emoji. No em-dash in source, use the
  middle dot · the CI dash linter scans `rikiki/src`.

## The verification loop · look, do not guess

Green tests have never once caught a visual defect in this repo. Every one was
found by measuring or by looking.

```
node scripts/shots.mjs --open        # both themes side by side, one page
npm run lint && npm run typecheck && npx vitest run
npx playwright test
```

The machine measures what is objective: surface contrast against the page
(`scripts/theme-contrast.test.mjs`), rendered emphasis against its own backdrop
and text on it (`e2e/emphasis.spec.ts`), and whether a layout keeps the
distribution promise it made (`e2e/ink.spec.ts`). It does not judge taste, and
there is deliberately no pixel-diff suite: baselines would freeze the current
rendering as the definition of correct.

You look at the screenshots. Take them before claiming a visual change works,
and show them.
