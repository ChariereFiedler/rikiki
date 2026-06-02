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

## Workflow

1. **Skeleton** — start from the head + `<deck-root>` shape in `starter.html`
   (theme `<link>` first, then `<script type="module" src="./dist/index.js">`).
2. **Pick layouts per slide** — one focal idea each. `deck-cover` to open,
   `deck-section` for chapters, `deck-feature` / `deck-split` /
   `deck-feature-cards` for content, `deck-takeaway` to close. Respect named
   `slot=` attributes (`title`, `lead`, `left`/`right`, `a`/`b`/`c`).
3. **Prose & code** — put Markdown inside `<deck-md>`; code inside
   `<deck-code lang="…">`.
4. **Reveals** — for stepped builds use `steps="N"` + `[data-step-block]` or
   `deck-code[step-groups]`; for per-element reveals install the click-stages
   plugin (`import { installClickStages } from './dist/click-stages.js';
   installClickStages();`) and annotate elements with `data-click`,
   `data-click="N"`, `data-click-hide`, and `data-anim="fade|slide-up|slide-left|scale"`.
5. **Speaker notes** — add `<deck-notes>` inside a slide; press `P` to present.
6. **Livereload (authoring)** — add `?live` to the deck URL (e.g.
   `…/deck.html?live`) so `index.js` lazy-loads the poller and auto-reloads on
   file changes. Never ship it in a presented or bundled deck.
7. **Multi-file decks** — split slides into `parts/*.html` / `*.md`, list them in
   `deck.config.js`, run `npm run deck decks/<name>/deck.config.js` (or
   `node build/vite-deck.mjs <config>`).
8. **Share** — `node bundle.mjs <deck>.html` produces one self-contained file
   (`--no-fonts` strips Google Fonts). Note: `bundle.mjs` only rewrites
   `rikiki/(dist|themes|tokens.css)`-style references, not plain relative paths
   like `../../dist/index.js` — see the reference's multi-deck caveat.

## Verify

Serve with `python3 -m http.server` and open the deck; click through every slide
and every step. Confirm slides are styled and reveals fire in order.

## Rules

- Never nest `<deck-root>`.
- Load theme CSS before `dist/index.js`.
- Use semantic `--rik-*` tokens for any color/spacing override, at `:root` (or
  component `--deck-*-…` tokens on one host). Do not hardcode colors.
- Keep one idea per slide; move detail into `<deck-notes>`.
- Only use tags, attributes, and tokens listed in `docs/llms/rikiki-reference.md`.
