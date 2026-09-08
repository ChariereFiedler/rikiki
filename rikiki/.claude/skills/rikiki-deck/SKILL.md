---
name: rikiki-deck
description: Use when creating or editing a rikiki presentation deck (HTML decks using <deck-root> and deck-* Web Components), assembling multi-file decks, adding click-stage animations, enabling livereload, or bundling a deck to a single file. Triggers on "rikiki deck", "create a slide deck", "rikiki slides", "presentation deck".
---

# Authoring rikiki decks

Rikiki is a Lit Web Components presentation framework. Decks are plain HTML: a
theme stylesheet + `dist/index.js`, then a `<deck-root>` wrapping `deck-*` slide
elements. No build step is required to author or run a deck.

## Before you start

Read the full component + attribute reference first:
`docs/llms/rikiki-reference.md` (in the rikiki repo). It is the source of truth
for every tag, attribute, slot, and design token. Do not invent tags,
attributes, or tokens — use only what the reference lists.

## What a good slide is, before how to wire one

This skill used to describe only the wiring, and decks wired correctly from it
were rejected in a room three times. The reference now carries the composition
rules as §14; read that section before writing slides, not just the tables.

The short version, because it decides most of the work:

- **A slide is read at ten metres for forty seconds.** Area, size, position,
  one saturated colour and empty space survive that. Hairlines, small type,
  letter spacing and pale tints do not.
- **The title states the message, the body proves it.** A content slide's title
  is a full sentence of roughly eight to fourteen words saying what the slide
  argues, and the body is its evidence · a figure, a table, a number. A title
  that names a topic leaves the body carrying everything. Covers and chapter
  titles are exempt.
- **One loud thing per slide.** The statement is more than twice the reading
  size · the theme enforces it, and a title at 1.5x is why a deck looks flat.
- **One filled area at most**, carrying whatever the content marks. On these
  themes a pale tint is invisible in a room; real emphasis is the inverse
  surface.
- **Left, ragged right.** Never centre one column inside a row of columns.
- **A slide that fills a fifth of the canvas is not finished.** Use `spread`
  when the rhythm is wrong and `fill` when the type is too small (§19). If it
  needs a third size to fit, it is two slides · `<deck-notes>` and stepped
  reveals take the rest.
- **`<deck-point>` for a bento item made of words, `<deck-cell>` for one that
  holds something measured** (fit-to-cell text, a diagram, an image). A row of
  points shares its baselines; a row of cells takes a share of the slide.

## Before the first slide

Read `docs/llms/rikiki-workflow.md` in the installed package. It carries the
editorial contract to fill in before writing, the nine compositions by intent
with verified HTML, and the order to try fixes in when a slide is too full.
This skill is the short form; that guide is the working one.

## Workflow

1. **Skeleton** — run `npx rikiki init <name>.html`. It writes an editable deck
   and copies the runtime into `./rikiki/` beside it, so the head already reads
   theme `<link>` first, then
   `<script type="module" src="rikiki/dist/index.js">`. Serve the folder over
   HTTP · ES modules do not load from `file://`.
2. **Pick layouts per slide** — one focal idea each. `deck-cover` to open,
   `deck-section` for chapters, `deck-feature` / `deck-split` /
   `deck-feature-cards` for content, `deck-takeaway` to close. Respect named
   `slot=` attributes (`title`, `lead`, `left`/`right`, `a`/`b`/`c`).
3. **Prose & code** — put Markdown inside `<deck-md>`; code inside
   `<deck-code lang="…">`. The built-in highlighter only understands
   `js`/`ts`/`json`/`html`/`xml`/`svg`/`css`/`scss`/`less`. Any other `lang`
   (`python`, `rust`, `bash`, `go`, `sql`, …) is silently colored as JS — no
   error — so it looks fine but is wrong. If the deck uses any language outside
   that set, install Shiki **after** `dist/index.js`:
   `import { installShiki } from './dist/shiki.js'; await installShiki({ theme: 'one-dark-pro', langs: ['ts','rust','bash'] });`
   (list every language the deck uses in `langs`). See the reference's Shiki
   section.
4. **Reveals** — for stepped builds use `steps="N"` + `[data-step-block]` or
   `deck-code[step-groups]`; for per-element reveals install the click-stages
   plugin (`import { installClickStages } from './dist/click-stages.js';
   installClickStages();`) and annotate elements with `data-click`,
   `data-click="N"`, `data-click-hide`, and
   `data-anim="fade|slide-up|slide-down|slide-left|slide-right|scale|blur|flip-up|draw"`.
   Fine-tune with `data-anim-duration` / `data-anim-delay` (ms) and
   `data-anim-ease="out|spring|in-out|cubic-bezier(…)"`. One-click
   choreographies: `data-click-auto="800"` (chains after the previous stage,
   no click), `data-click-stagger="80"` (container children cascade on one
   click), `data-click-children` (one click per child). Magic move:
   `data-morph="key"` pairs an element across steps or consecutive slides
   (explicit steps for same-click swaps: `data-click-hide="1"` +
   `data-click="1"`). Mouse navigation is on by default (click/wheel/
   chevrons/buttons 4-5) · disable with `mouse-nav="none"` or pick a subset
   like `mouse-nav="wheel arrows"` on `<deck-root>`.
5. **Speaker notes** — add `<deck-notes>` inside a slide; press `P` to present.
6. **Livereload (authoring)** — add `?live` to the deck URL (e.g.
   `…/deck.html?live`) so `index.js` lazy-loads the poller and auto-reloads on
   file changes. Never ship it in a presented or bundled deck.
7. **Look before you claim it works** — `npx rikiki check <deck>.html` names
   what is broken and where, `npx rikiki render <deck>.html` writes one picture
   per slide plus a manifest tying each one to its slide id. Pass `--steps` when
   the deck reveals content, or you are judging the emptiest state of it. Fix,
   re-run, and only then say it is done.
8. **Share** — `npx rikiki bundle <deck>.html` produces one self-contained file
   (`--no-fonts` strips the web fonts). It needs the optional peer `rolldown`;
   without it the command says so and installs nothing behind your back. It
   rewrites `rikiki/(dist|themes|tokens.css)`-style references, not plain
   relative paths like `../../dist/index.js`.
9. **Hand over a PDF** — `npx rikiki export <deck>.html` writes one page per
   slide. It needs the optional peer `playwright`.

## Verify

`npx rikiki check <deck>.html` first: it measures what a glance cannot, and its
exit code is 1 when the deck has defects. Then `npx rikiki render <deck>.html`
and read the pictures · a green check with an ugly slide is still an ugly
slide. For the presented behaviour, serve the folder and click through every
slide and every step.

## Rules

- Never nest `<deck-root>`.
- **Asset paths are relative to your deck file** — adjust the theme `<link>`,
  the `dist/index.js` script, and any `click-stages.js` import together. A deck
  written by `rikiki init` uses `rikiki/tokens.css` / `rikiki/dist/…`, which is
  also the spelling the bundler recognises. Pointing straight at
  `node_modules/rikiki-deck/…` works in a browser but only bundles from a path
  spelled that way.
- Load theme CSS before `dist/index.js`.
- Use semantic `--rik-*` tokens for any color/spacing override, at `:root` (or
  component `--deck-*-…` tokens on one host). Do not hardcode colors.
- Keep one idea per slide; move detail into `<deck-notes>`.
- Only use tags, attributes, and tokens listed in `docs/llms/rikiki-reference.md`.
