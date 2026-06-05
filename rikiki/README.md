# Rikiki

A tiny **Lit Web Components** framework for technical presentations. Drop a folder anywhere, open `index.html`, give the talk. No build step on the consumer side · the framework itself is built from TypeScript, but the output is plain ES modules you import directly.

## TL;DR

```sh
cp starter.html my-deck.html
```

Edit `my-deck.html`. Each slide is a custom element. Markdown is available anywhere via `<deck-md>`. Navigate with `←` / `→` for sections, `↑` / `↓` within a section, `Space` for linear, `O` for overview.

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

| Key | Effect |
|---|---|
| `→` / `←` | Next / previous section (chapter) · falls back to linear at deck edges |
| `↓` / `↑` | Next / previous slide within the current section |
| `Space` / `PageDown` | Linear next (any axis) |
| `PageUp` | Linear back |
| `Home` / `End` | First / last slide |
| `O` | Toggle overview |
| `?` / `H` | Show keyboard help |

### Mouse

On by default since 0.3.0: click to advance (Shift+click to go back), scroll
wheel, discreet chevrons bottom-right, and mouse back/forward buttons. Links,
buttons and inputs never trigger navigation; add `data-no-advance` to opt any
element out.

```html
<deck-root>                          <!-- everything on (default) -->
<deck-root mouse-nav="none">         <!-- keyboard-only, pre-0.3 behavior -->
<deck-root mouse-nav="wheel arrows"> <!-- pick from: click wheel arrows aux -->
```

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

## Known limits

- **Step reveal on code blocks** uses `step-groups` on `<deck-code>` but is not exposed elsewhere yet.
- **No transitions** between slides · plain `display: none` toggle. Extend via opacity transition if needed.
- **Syntax highlighting** is ~10 keywords of JS/TS, no AST. Hook a real highlighter (Prism, Shiki) if you need more.
