# Rikiki

[![npm](https://img.shields.io/npm/v/rikiki-deck)](https://www.npmjs.com/package/rikiki-deck)
[![license](https://img.shields.io/npm/l/rikiki-deck)](./LICENSE)
![zero-build](https://img.shields.io/badge/build-zero-brightgreen)

A tiny **Lit Web Components** framework for technical presentations. Drop a folder anywhere, open `index.html`, give the talk. No build step on the consumer side · the framework itself is built from TypeScript, but the output is plain ES modules you import directly.

This documentation tracks rikiki v0.5.0.

## TL;DR

```sh
cp starter.html my-deck.html
```

Edit `my-deck.html`. Each slide is a custom element. Markdown is available anywhere via `<deck-md>`. Navigate with `←` / `→` (or click, or the scroll wheel), `O` for the overview grid. Decks are linear by default; add `nav="2d"` on `<deck-root>` for chapter/slide grid navigation.

## Layout

```
rikiki/
├── tokens.css                ← entry point · re-exports the default theme
├── themes/
│   ├── rikiki.css            ← default theme (acid greens + mango, on dark)
│   ├── siliceum.css          ← alternative theme (warm paper + yellow)
│   └── siliceum-fonts.css    ← self-hosted Source Sans Pro + JetBrains Mono
├── fonts/                    ← woff2 files used by the Siliceum theme
├── src/                      ← TypeScript sources · organised by DS bucket
│   ├── index.ts              ← registers every component
│   ├── shared-styles.ts
│   ├── livereload.ts
│   ├── runtime/              ← deck-root, deck-help, deck-overview,
│   │                            deck-presenter, deck-transition, deck-notes
│   ├── layouts/              ← deck-cover, deck-section, deck-feature,
│   │                            deck-split, deck-feature-cards, deck-takeaway,
│   │                            deck-photo
│   ├── molecules/            ← deck-callout, deck-card, deck-md, deck-mermaid,
│   │                            deck-stat, deck-metric, deck-tier-list,
│   │                            deck-step-list, deck-shortcut, deck-stack,
│   │                            deck-grid
│   ├── atoms/                ← deck-badge, deck-kicker, deck-punch, deck-code
│   └── plugins/              ← opt-in (shiki for advanced syntax highlighting)
├── dist/                     ← built output · FLAT regardless of src bucket
│                                (deck-root's dynamic imports rely on it)
├── build.mjs                 ← esbuild script
├── tsconfig.json
└── starter.html              ← blank template, one slide per layout type
```

## Three-layer styling

1. **Theme tokens** (`themes/<name>.css`) at `:root` · custom properties cross the Shadow DOM, so they reach every component.
2. **Shared styles** (`src/shared-styles.ts`) · base typography, helpers, imported by every layout via `static styles`.
3. **Layout-specific CSS** · each component's own Shadow DOM.

To re-theme: copy a theme file, change the values, that's it. All components follow.

## Components

### Layouts

| Tag | When to use it |
|---|---|
| `<deck-cover>` | Opening slide (dark, XL title, meta block) |
| `<deck-section>` | Chapter separator (dark, number + title) |
| `<deck-feature>` | One focal block, full width (code, table, mermaid) |
| `<deck-split cols="1-1\|1-2\|2-1\|3">` | Two or three columns |
| `<deck-feature-cards>` | Hero + two detail cards underneath |
| `<deck-takeaway>` | Centered punchline on dark · the take-home line |

### Atoms

| Tag | When to use it |
|---|---|
| `<deck-md>` | Markdown content (headings, paragraphs, lists, inline code) |
| `<deck-code lang="js" hero?>` | Code block with light syntax highlighting |
| `<deck-callout type="info\|warn\|danger\|ok">` | Information callout |
| `<deck-card color="yellow\|orange\|green\|red?">` | Tinted card |
| `<deck-mermaid>` | Diagram via Mermaid (loaded on demand from CDN) |

Plus `<deck-badge>`, `<deck-metric>`, `<deck-tier-list>`, `<deck-step-list>`, `<deck-kicker>`, `<deck-stack>`, `<deck-grid>`, `<deck-punch>`.

## Common patterns

### Slide with markdown + code

```html
<deck-feature eyebrow="Module">
  <h1 slot="title">Side effects</h1>
  <p slot="lead" class="lead">A module can **act** on import.</p>
  <deck-code lang="ts" hero>
    import './polyfill';  // executed at import time
  </deck-code>
</deck-feature>
```

### Side-by-side comparison

```html
<deck-split eyebrow="ESM">
  <h1 slot="title">Static vs dynamic</h1>
  <deck-card slot="left" color="yellow">
    <h3>Static</h3>
    <deck-md>Resolved at startup. **Tree-shakable.**</deck-md>
  </deck-card>
  <deck-card slot="right" color="green">
    <h3>Dynamic</h3>
    <deck-md>Loaded on demand. *Asynchronous.*</deck-md>
  </deck-card>
</deck-split>
```

### Three columns

```html
<deck-split eyebrow="Actions" cols="3">
  <h1 slot="title">Three levers</h1>
  <deck-card slot="a" color="yellow"><h3>① …</h3>…</deck-card>
  <deck-card slot="b" color="orange"><h3>② …</h3>…</deck-card>
  <deck-card slot="c" color="green"><h3>③ …</h3>…</deck-card>
</deck-split>
```

## Markdown support (`<deck-md>`)

Parser: `marked` 12 from CDN. Supports GFM (tables, task lists), code blocks, inline code, **bold**, *italic*, lists, blockquotes, links, `---`.

## Navigation

By default navigation is **linear**: arrows move to the next / previous slide.
Add `nav="2d"` on `<deck-root>` (with `<deck-section>` chapters) to opt into grid
navigation, where `←` / `→` move between chapters and `↑` / `↓` within one.

| Key | Effect (linear default) |
|---|---|
| `→` / `←` | Next / previous slide (or step) |
| `Space` / `PageDown` | Advance · `PageUp` back |
| `Home` / `End` | First / last slide |
| `O` | Toggle overview grid (type to filter) |
| `P` | Presenter / speaker-notes window |
| `?` / `H` | Show keyboard help |

The bottom-left hint chips (`← → O P ?`) are clickable shortcuts for the same
actions.

### Mouse

On by default since 0.3.0: click to advance (Shift+click to go back), scroll
wheel, discreet chevrons bottom-right, and mouse back/forward buttons. The wheel
yields to scrollable content (a tall `deck-code`, a zoomable `<svg>`): it scrolls
that element and only advances the deck once it reaches its scroll edge. Links,
buttons and inputs never trigger navigation; add `data-no-advance` to opt any
element out.

```html
<deck-root>                          <!-- everything on (default) -->
<deck-root mouse-nav="none">         <!-- keyboard-only, pre-0.3 behavior -->
<deck-root mouse-nav="wheel arrows"> <!-- pick from: click wheel arrows aux -->
```

## Rendering

By default a deck renders into a fixed logical canvas (1920×1080, set via
`width` / `height` on `<deck-root>`) scaled uniformly to fit, so a slide's
layout is identical at any window size and the deck is letterboxed when the
screen aspect differs. Add `fluid` to opt out · the deck then fills its box and
reflows like a web page:

```html
<deck-root>        <!-- zoom-to-fit canvas (default) -->
<deck-root fluid>  <!-- fills its box, reflows, no letterbox -->
```

A single slide can also escape the canvas by carrying its own `fluid` attribute
· that slide gets the real viewport (handy for an embedded live demo) while the
rest of the deck stays on the fixed canvas:

```html
<deck-feature fluid>
  <iframe src="playground.html" style="position:fixed; inset:0; border:0;"></iframe>
</deck-feature>
```

Both modes are embed-safe · a `<deck-root>` placed inside a larger page scales
to (or fills) its own container and never touches the host page's scroll or
typography.

## Themes

Picking a theme is one `<link>` change:

```html
<!-- Default Rikiki theme (tropical, on dark) -->
<link rel="stylesheet" href="rikiki/tokens.css">

<!-- Alternative Siliceum theme (warm paper, yellow accent) -->
<link rel="stylesheet" href="rikiki/themes/siliceum.css">
```

### Override one token

```css
:root { --yellow: #ff0066; }
```

The whole system follows · titles, accents, callouts, etc.

### Override one component locally

```css
deck-cover::part(brand) { font-family: 'Comic Sans'; }
```

```html
<deck-cover style="--yellow: #00ffaa">...</deck-cover>
```

### Add a layout

Create `src/layouts/deck-my-layout.ts`, `import { slideBase } from '../shared-styles.js'`, extend `LitElement`, register in `src/index.ts`. Rebuild.

## Build

```bash
npm install
npm run build      # node build.mjs (esbuild) + tsc --emitDeclarationOnly
npm run watch      # esbuild watch mode
npm run typecheck  # tsc --noEmit
```

`dist/` is versioned · consumers don't run a build.

## Reveals & animations

Per-element click-through builds are an opt-in plugin (`installClickStages()` from
`dist/click-stages.js`): annotate elements with `data-click`, `data-click-hide`,
`data-click-auto`, `data-click-stagger`, and `data-morph` (Keynote-style Magic
Move via View Transitions). Slide transitions are driven by `transition="…"` on
`<deck-root>`. See `docs/llms/rikiki-reference.md` §7 for the full attribute set,
and `decks/tests/demo.html` for a runnable feature tour.

## Known limits

- **Step reveal on code blocks** uses `step-groups` on `<deck-code>` but is not exposed elsewhere yet.
- **Syntax highlighting** is ~10 keywords of JS/TS, no AST. Hook a real highlighter (Prism, Shiki) if you need more, via `installShiki()`.
