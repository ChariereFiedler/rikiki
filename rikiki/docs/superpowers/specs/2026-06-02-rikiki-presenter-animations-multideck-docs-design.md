# Rikiki — Presenter fix · Animations plugin · Multi-deck · LLM docs

**Date**: 2026-06-02
**Status**: Approved design

Four independent chantiers for the rikiki presentation framework, executed in
sequence (1 → 2 → 3 → 4) because several touch shared files (`deck-root.ts`,
`index.ts`, `build.mjs`).

---

## Background

Rikiki is a Lit-based Web Components presentation framework. Consumers write
plain HTML decks (`<deck-root>` wrapping `deck-*` slide elements), no build step
required. Source lives in `src/{runtime,layouts,molecules,atoms,plugins}` and is
transpiled by esbuild into a **flat** `dist/` so that `deck-root`'s dynamic
imports (`./deck-presenter.js`, etc.) resolve. Plugins are opt-in and patch
component prototypes at runtime (see `src/plugins/shiki.ts`).

A step/fragment system already exists: `deck-root` counts steps from a slide's
`steps` attribute or from `deck-code[step-groups]`, calls `applyStep(n)` on
slides and children, and toggles opacity on `[data-step-block="N"]` elements.
It is opacity-only and limited to `deck-code` + `[data-step-block]`.

---

## Chantier 1 — Fix presenter mode styles (bug)

### Problem

`P` opens a popup window (`src/runtime/deck-presenter.ts`) that mirrors slides
into iframes via `wrapFrame()`. Slides render **unstyled** because:

1. **Fragile bundle resolution** (`deck-presenter.ts:188`): the rikiki module URL
   is guessed by regex `themeHref.replace(/themes\/[^/]+\.css.*$/, 'dist/index.js')`.
   This only works when the theme CSS is served from `.../themes/<name>.css`. With
   a CDN or any other layout the bundle never loads, so the `deck-*` custom
   elements never upgrade and the slide stays raw HTML.
2. **Slide not activated**: the cloned slide in the iframe lacks the `[active]`
   attribute that layouts gate their display on (`:host([active]){display:flex}`),
   papered over today by a `deck-root>*{display:flex!important}` hack.

Secondary: `border-radius` on the iframe isn't clipped; the grid has no
responsive fallback for small second screens.

### Fix

- **Robust bundle URL**: capture the real module URL of the loaded rikiki runtime
  (`import.meta.url` in `deck-root.ts`, exported as a constant) and carry it in
  `PresenterState` alongside `themeHref`. `wrapFrame()` uses it directly; keep the
  regex guess only as a last-resort fallback.
- **Activate the slide**: inject the cloned slide with `active` (and the current
  `step`) set, then drop the `display:flex!important` hack and rely on real
  component CSS.
- **Clip + responsive**: `overflow:hidden` on `.panel .body`; `clamp()` the gap;
  collapse to a single column under ~1000px via a media query.

### Verification

Use **systematic-debugging**: reproduce the unstyled-slide state with Playwright
(open a starter deck, press `P`, screenshot the popup), confirm root cause, then
fix and re-screenshot to prove styled slides.

---

## Chantier 2 — Animations plugin "click stages" (`src/plugins/click-stages.ts`)

Per-element reveal animations, Slidev `v-click` style, as an opt-in plugin
mirroring `installShiki()`.

### API (declarative attributes, any element in a slide)

| Attribute | Meaning |
|-----------|---------|
| `data-click` | element is hidden until the next click step, then revealed |
| `data-click="2"` | element revealed at step 2 specifically |
| `data-click-hide` | element visible initially, hidden at the next click step |
| `data-click-hide="3"` | hidden at step 3 |
| `data-anim="fade\|slide-up\|slide-left\|scale"` | reveal animation (default `fade`) |

Respects `prefers-reduced-motion` (falls back to instant/opacity).

### Integration

- `installClickStages()` patches `deck-root` prototype:
  - `_maxSteps()` also counts the highest `data-click` / `data-click-hide` step in
    the active slide (today it only reads `steps` and `deck-code[step-groups]`).
  - `_applyStep(n)` applies enter/leave state + transforms to `[data-click*]`
    elements, in addition to the existing `[data-step-block]` handling.
- State-driven only (derived from the slide's `step`), **no hidden JS state**, so
  it serializes cleanly into presenter iframes (contact point with Chantier 1).
- Reset on `slide-change`.
- Injects its keyframe/transition CSS into `deck-root`'s shadow root on install.
- Flattened to `dist/click-stages.js`; exported from neither `index.ts` core nor
  bundled by default (opt-in like shiki).

---

## Chantier 3 — Multi-deck assembly via Vite

Assemble one deck from multiple ordered partial files.

### Manifest

`deck.config.js` (or `.json`) describing an ordered list of partials:

```js
export default {
  title: 'My talk',
  theme: 'themes/rikiki.css',
  transition: 'slide',
  slides: [
    'parts/cover.html',
    'parts/intro.md',
    'parts/architecture.html',
    'parts/closing.md',
  ],
};
```

- Partials are slide fragments: one or more `deck-*` elements (`.html`) or
  Markdown (`.md`) that becomes a `deck-md` slide (or front-matter-driven layout)
  at build time.
- Reusable across decks.

### Build plugin

`build/vite-deck.mjs` — a Vite plugin + entry that:

1. Reads `deck.config`.
2. Concatenates the resolved partial contents inside a single `<deck-root>` with
   the configured `theme`/`transition` attributes.
3. Converts `.md` partials to slide markup at build time.
4. Emits a standalone deck HTML.

Integrates with the existing `bundle.mjs` single-file export (the assembled deck
is a valid input to `bundle.mjs`). Adds an npm script (e.g. `npm run deck`).
Zero added runtime weight.

---

## Chantier 4 — LLM docs + skill

Written **last** so it covers chantiers 1–3.

### Reference doc — `docs/llms/rikiki-reference.md`

Exhaustive, self-consistent, LLM-ingestible reference:

- Every atom / molecule / layout / runtime component with its tag, attributes,
  slots, and the design tokens it consumes.
- The step system + the new `data-click` animation attributes.
- Multi-deck `deck.config` format.
- Authoring patterns and a minimal-to-rich deck example.

### Skill — `.claude/skills/rikiki-deck/`

A repo-local Claude Code skill that teaches an agent to generate and edit valid
rikiki decks, pointing at the reference doc. Standard skill layout
(`SKILL.md` with name/description frontmatter).

---

## Execution plan

1. Spec (this doc) → committed.
2. Implementation plan via writing-plans.
3. Sequenced subagents: Chantier 1 → 2 → 3 → 4. After each, run `npm run
   typecheck` (and `build`) and verify before moving on.

## Non-goals

- No automated test framework introduction (repo has none today); verification is
  typecheck + build + Playwright screenshots for the presenter.
- No multi-deck *registry/picker UI* or per-deck presenter namespacing — only
  build-time assembly of one deck from partials.
- No new theme; reuse existing token system.
