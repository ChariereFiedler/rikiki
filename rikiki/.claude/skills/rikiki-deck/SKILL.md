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
- **Asset paths are relative to your deck file** — adjust the theme `<link>`,
  the `dist/index.js` script, and any `click-stages.js` import together. Next to
  `starter.html` it's `./tokens.css` / `./dist/…`; a deck under `examples/<name>/`
  uses `../../rikiki/tokens.css` / `../../rikiki/dist/…`; an npm consumer points
  at their `node_modules/rikiki-deck/…` (or an import map).
- Load theme CSS before `dist/index.js`.
- Use semantic `--rik-*` tokens for any color/spacing override, at `:root` (or
  component `--deck-*-…` tokens on one host). Do not hardcode colors.
- Keep one idea per slide; move detail into `<deck-notes>`.
- Only use tags, attributes, and tokens listed in `docs/llms/rikiki-reference.md`.
