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
| Reveals / click-stages don't fire | `installClickStages()` not called, or wrong attribute (`data-click`, `data-anim=…` — check the reference's exact values) |
| Steps don't advance | missing `steps="N"` + `[data-step-block]`, or `deck-code[step-groups]` JSON malformed |
| Navigation dead | `mouse-nav="none"`, focus trapped in an input, or an overlay (`?`/`O`) open |
| Embedded deck breaks the host page | older build — 0.5.0+ scopes globals to full-page decks; rebuild/upgrade |
| Livereload silent | `?live` missing from the URL, or the static server doesn't see file changes |
| Bundled single-file deck unstyled | `bundle.mjs` resolves a plain relative ref against the deck's own dir; the `rikiki/(dist\|themes\|tokens.css)` convention is what triggers the package-root fallback. A deck pointing outside its dir (`../../dist/index.js`) won't inline — repoint at `rikiki/…`-style paths. See reference §9 |

## Isolate

Reproduce against a known-good fixture (`examples/rikiki-tour/`,
`rikiki/starter.html`). If the fixture works and your deck doesn't, the deck
markup is the fault — diff its `<head>` and slide tags against the reference.
For rendering regressions in the engine itself, the Playwright render net
(`e2e/`) is the fast reproduction harness.

## Rules

- Don't patch a symptom with hardcoded px or `!important` — find the wrong
  token, path, or attribute.
- Only trust tags/attributes/tokens listed in the reference; a silent no-op is
  usually an invented name.
