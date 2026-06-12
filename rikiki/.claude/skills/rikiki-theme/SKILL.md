---
name: rikiki-theme
description: Use when creating, customizing, or debugging a rikiki theme — defining a new color/typography look, overriding design tokens, porting an existing brand into a deck, or fixing a theme where colors/fonts don't apply. Triggers on "rikiki theme", "new theme", "custom theme", "theme tokens", "rebrand a deck".
---

# Authoring rikiki themes

A rikiki theme is one CSS file. Most of it is `--rik-*` custom properties at
`:root`, but **the rules below `:root` are load-bearing** — the reset,
`::selection`, the `html/body` binding, and slotted-element styles
(`deck-cover > h1`, `.lead`, `table.dense`, …) paint the page and slide content.
Components read only the **semantic** tokens, so re-theming never touches
component code — you swap one `<link>`.

`docs/llms/rikiki-reference.md` lists every semantic token. It is the source of
truth — do not invent token names.

## Start from a copy

**Copy the entire `themes/siliceum.css` (the cleanest example) — not just its
`:root`** — and change values. A `:root`-only theme renders bodies and slide
titles unstyled because the painting rules sit below `:root`. Keep the layering:

1. **Palette (private).** `--rik-palette-*` raw brand colors (`paper-50`,
   `ink-900`, `accent-500`…). Only this layer holds hex values. Nothing outside
   the theme reads these.
2. **Semantic (public).** The names components consume, mapped onto the palette.
   These names match `themes/rikiki.css` **1:1** — keep every one, change only
   the value. The full set is large; the families below are representative, not
   exhaustive — copy the whole `:root` from `themes/rikiki.css` and re-point
   values rather than hand-listing: `--rik-surface-*` (page/raised/inverse),
   `--rik-text-*` (default/inverse/`--faint`), `--rik-accent` (+`--soft`),
   `--rik-status-*` (success/danger/warn/info, each `bg`/`border`/`text`),
   `--rik-interactive-*`, `--rik-border-*`, `--rik-link-*`, `--rik-focus-*`,
   `--rik-selection-*`, `--rik-decor-*`, `--rik-elevation-*`, `--rik-code-*`
   (syntax surface), `--rik-font-*`, `--rik-font-size-*`, `--rik-space-*`,
   `--rik-radius-*`, `--rik-icon-*`, `--rik-opacity-*`, `--rik-motion-*`,
   `--rik-z-*`.

Keep the `@media (prefers-reduced-motion: reduce)` block too — it zeroes the
`--rik-motion-*` durations and neutralizes the spring ease.

## Fonts

Declare `@font-face` (or import a `*-fonts.css`, like `siliceum-fonts.css`) and
point `--rik-font-sans` / `--rik-font-mono` / `--rik-font-display` at them. The
default theme pulls Unbounded + Inter + Space Mono from Google Fonts; self-host
for offline decks.

## Rules

- Define the **full** semantic set. A missing token falls back to nothing and
  breaks a component silently — diff your `:root` against `themes/rikiki.css`
  (e.g. `comm -23` of the two token lists must be empty).
- Put hex only in the palette layer; semantic tokens reference it via `var(...)`.
  Two sanctioned exceptions, as in both shipped themes: `--rik-code__*` (the
  syntax surface) holds raw hex, and alpha tints use `rgba(...)` literals.
- For a **dark** theme, keep the inverse surfaces (`--rik-palette-night-*`)
  *darker* than the dark page so cover/section/takeaway stay a distinct layer.
- Don't restyle components in the theme. Per-component tweaks are `--deck-*-…`
  tokens set on that host, not in the theme file.
- Keep `--rik-*` lowercase; match WCAG contrast (the default theme documents the
  link-contrast caveat inline — read it before lowering contrast).

## Verify

Load a deck (e.g. `examples/rikiki-tour/`) with your theme `<link>`. Click
through covers, sections, callouts, code, and a `deck-takeaway` (it uses
`--rik-surface-inverse` + `--rik-accent`). Every surface, text tone, accent and
status color must be intentional — no browser-default black or unstyled blocks.
