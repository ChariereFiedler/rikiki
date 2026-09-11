---
name: rikiki-debug
description: Use when a rikiki deck renders or behaves wrong — slides unstyled or tiny, letterbox bands clash, content overflows or won't reflow, click-stages/reveals don't fire, navigation dead, livereload silent, or a bundled single-file deck breaks. Triggers on "rikiki not rendering", "deck broken", "slides unstyled", "reveals don't work", "debug a deck".
---

# Debugging a rikiki deck

Work from the symptom. Most breakage is load order, a wrong selector/token, or
the rendering model — not the engine. `docs/llms/rikiki-reference.md` is the
source of truth for tags, attributes, and tokens.

## First checks (do these before anything)

- **Console + network.** A `Failed to load resource` on `dist/index.js` or the
  theme means a wrong relative path — the deck never upgrades. Fix the two paths
  in the `<head>` first.
- **Load order.** Theme `<link>` must come **before** `dist/index.js`. Reversed,
  components upgrade with no tokens and render unstyled.
- **Upgrade.** In the console, `customElements.get('deck-root')` must be defined
  and `document.querySelector('deck-root > [active]')` must match one slide.

## Symptom → cause

| Symptom | Likely cause |
|---|---|
| Whole deck unstyled / browser-default fonts | theme `<link>` missing or after `index.js`; or a non-rikiki page consuming theme CSS without the engine |
| Slides tiny / letterboxed on mobile | working as designed — zoom-to-fit canvas (1920×1080) scaled to fit. Want reflow? add `fluid` on `<deck-root>` |
| Letterbox bands clash with a slide | slide background isn't opaque or uses a gradient/image; bands match only an opaque `background-color` |
| Content overflows the slide | authored past the logical canvas; use `cqw/cqh` and `--rik-*` sizing, not fixed px |
| Content missing or in the wrong place / a title/lead doesn't show | wrong or missing `slot=` name — each layout names its slots (e.g. `deck-split` uses `left`/`right` or `a`/`b`/`c`, not arbitrary names). Check the layout's slots in the reference |
| Arrows don't jump between chapters / `↑↓` does nothing | 2D navigation is opt-in: add `nav="2d"` on `<deck-root>` (needs `<deck-section>` chapters). Without it arrows are linear — by design |
| One slide's `<style>` leaks deck-wide | the `<style>` lacks `scoped` — without it a light-DOM `<style>` is a global stylesheet |
| Reveals / click-stages don't fire | `installClickStages()` not called, or wrong attribute (`data-click`, `data-anim=…` — check the reference's exact values). On a deck created **dynamically after** `installClickStages()`, register per instance: `deckRoot.use(clickStagesPlugin())` |
| `customElements.define` "already used" crash from a plugin | a plugin (or custom code) did a **value** import from a per-component dist file (`dist/deck-code.js`, `dist/deck-root.js`) which re-bundles + re-defines the element. Import types with `import type`, and reach shared state via `customElements.get(...)` or the re-exports from `dist/index.js` |
| Steps don't advance | missing `steps="N"` + `[data-step-block]`, or `deck-code[step-groups]` JSON malformed |
| Navigation dead | `mouse-nav="none"`, focus trapped in an input, or an overlay (`?`/`O`) open |
| Zoom does nothing / "ça zoom pas" | Slide zoom is on by default in the fixed canvas: Ctrl/⌘+wheel, pinch, or `+`/`-`/`0` magnify the slide (drag/wheel to pan, any nav resets). If it does nothing: the deck is in `fluid` mode (no fixed layout to magnify · use the fixed canvas), `no-zoom` is set, or an overlay (`?`/`O`) is open. For reflowing bigger text instead of magnification, use `fluid` + `cqw/cqh` |
| Embedded deck breaks the host page | an older runtime — 0.5.0+ scopes globals to full-page decks; upgrade the package |
| Livereload silent | `?live` missing from the URL, or the static server doesn't see file changes |
| Bundled single-file deck unstyled | `rikiki bundle` resolves a plain relative ref against the deck's own dir; the `rikiki/(dist\|themes\|tokens.css)` convention is what triggers the package-root fallback. A deck pointing outside its dir (`../../dist/index.js`) won't inline — repoint at `rikiki/…`-style paths. See reference §9 |
| A `deck-graph` node sits outside its canvas | `check` reports `GRAPH_NODE_OUT_OF_BOUNDS` (error) · move the node inward with `at`, shorten its note, or constrain it with `width` / `--deck-node-size` |
| Two `deck-graph` nodes are painted on top of each other | `check` reports `GRAPH_NODE_OVERLAPS_NODE` (error) · move one with `at`, or narrow both with `width` / `--deck-node-size` |
| A `deck-graph` arrow or line passes under an unrelated node | `check` reports `GRAPH_EDGE_CROSSES_NODE` (warning) · move the obstructing node or split the route into a clear path; an orthogonal route (`route="ortho"` on `deck-edge`) is preferable when available |

## Measure first

`npx rikiki check <deck>.html --json` before reading anything. It names the
runtime that never loaded, the file that did not arrive, the misspelled element
that renders as nothing, and the content the slide clips away · each with the
element path, inside the Shadow DOM when that is where it is. Most of the table
above is answered by that one command.

## Isolate

Reproduce against a known-good deck: `npx rikiki init probe.html` writes one,
with its runtime, in a directory of its own. If that deck works and yours
doesn't, the fault is in your markup — diff its `<head>` and its slide tags
against the reference.

## Rules

- Don't patch a symptom with hardcoded px or `!important` — find the wrong
  token, path, or attribute.
- Only trust tags/attributes/tokens listed in the reference; a silent no-op is
  usually an invented name.
