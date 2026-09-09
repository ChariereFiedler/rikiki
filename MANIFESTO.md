# Rikiki · Manifesto

## The goal in one sentence

A presentation framework for people who write code, designed to stay **readable, modifiable, and archivable five years from now**, without a toolchain to resurrect.

## The problem

Current presentation frameworks have drifted. Reveal.js (2011) is a fossil still speaking in global CSS classes and imperative JS plugins. Slidev (2021) ships Vue + Vite + UnoCSS + Shiki + Monaco + Mermaid · 250 MB of `node_modules` to render 20 slides. Both made defensible choices. Neither fits a team that just wants to **write a technical deck, give the talk, and reopen it next year without drama**.

We want three things:

1. **Open `index.html` from a static HTTP server** in a browser. No consumer build or toolchain.
2. **Edit a component file** and see the change immediately. No toolchain.
3. **Keep a deck alive long-term** · 5 years, 10 years later, it still runs. No dependency that breaks at the next major.

These three criteria rule out build-based frameworks. They point to **Web standards**: Custom Elements, Shadow DOM, ES Modules, CSS Custom Properties. All are stable W3C specs since 2018 and will outlive any JS library.

## The principles

### 1. Standards first, framework second

Everything rests on native Web Components. Lit is used for its ergonomics (~5 KB gzip), not as a vital dependency. If Lit disappears, we replace it with `customElements.define` and template strings. The components keep running.

### 2. Source = output · for the consumer

No build step **between an author and their finished deck**. A presentation folder contains the entire app. No transpilation or consumer toolchain. You serve the folder and open `index.html`; it runs.

Upside: no "it worked before the Vite update". No build regression on the deck side. No toolchain for the author to maintain.

**The framework itself is built from TypeScript sources.** Contributors work in `.ts` and run a small build (`tsc` / `esbuild`) that produces the `dist/*.js` files consumed by decks. That build step is invisible to deck authors · they get the compiled JS, period. The promise applies to the consumer, not the contributor.

### 3. Light by default, extensible on demand

The core (`rikiki/index.js` + every base component) stays **under 25 KB gzip**. Every non-essential feature is an opt-in module: `deck-presenter.js`, `deck-transition.js`, `shiki.js`. You pay only for what you import.

Explicit refusals:

- Complex plugin system
- Custom DSL or proprietary syntax (enhanced markdown, `---` separators, etc.)
- Embedded code editor (Monaco)
- Drawing tools (Excalidraw, Konva)
- SSR / SSG
- Built-in video recording
- Multiplexing (multi-client sync)

Those can live as external community plugins. Not in the core.

### 4. Theming by tokens, not by packages

A deck is re-themed by editing one CSS file. ~100 variables · colors, type, spacing, radii. Two themes ship by default (`rikiki`, `siliceum`); writing a third is copy-paste-edit. No `clone-this-npm-package`, no Vue components to override, no CSS spaghetti. Components declare their visual values through custom properties that cross the Shadow DOM.

### 5. Composition through slots and attributes

A slide is not an object configured via JS. It's declarative HTML:

```html
<deck-hero-detail eyebrow="Step 1">
  <h1 slot="title">Parsing</h1>
  <deck-callout type="warn">…</deck-callout>
</deck-hero-detail>
```

Readable by anyone who knows HTML. No DSL to learn.

### 6. Markdown optional, never mandatory

`<deck-md>…</deck-md>` is just another component. You can write your deck 100% in HTML, 100% in encapsulated markdown, or mix freely. No proprietary syntax beyond standard markdown.

### 7. Hand-editable, five years from now

Decision rule for every new feature: **can someone opening the repo in 2031 understand the code and modify it without restarting a 50-dependency stack?** If not, we don't add it.

## How it works

### Three-layer architecture

```
┌────────────────────────────────────────────┐
│  Your presentation                         │
│  index.html · slides as <deck-*> components│
└────────────────┬───────────────────────────┘
                 │ import
┌────────────────▼───────────────────────────┐
│  rikiki                                    │
│  · tokens.css           (default theme)    │
│  · themes/{rikiki,siliceum}.css            │
│  · dist/deck-*.js       (Lit components)   │
│  · dist/index.js        (entry point)      │
└────────────────┬───────────────────────────┘
                 │ import
┌────────────────▼───────────────────────────┐
│  Web standards                             │
│  Custom Elements · Shadow DOM · CSS vars   │
│  ES Modules · Lit 3 (thin layer)           │
└────────────────────────────────────────────┘
```

### A slide's life cycle

1. Browser loads `index.html`.
2. A theme CSS defines ~100 variables (`--yellow`, `--sp-3`, `--fs-h1`, etc.).
3. `dist/index.js` registers each `<deck-*>` via `customElements.define()`.
4. Declarative HTML is parsed: each custom element instantiates, attaches its Shadow DOM, reads attributes and slots.
5. `<deck-root>` handles navigation: `←` / `→` / `Space`, URL hash `#N`, progress bar, step dots, overview.
6. The global stylesheet does not leak into components (Shadow DOM). Components expose theming via custom properties.

### Development

```bash
python3 -m http.server 7799       # from the repo root
open http://localhost:7799/my-deck/index.html?live
```

The `?live` query enables `livereload.js`: poll `Last-Modified` on deck files every 800 ms and reload on change. No WebSocket, no Vite, no HMR magic. 70 lines of JS.

### Archiving

A finished deck is a folder. You copy it, zip it, push it to S3, serve it from any HTTP server. **No build step between author and final render.** You can open the folder locally with a plain `python -m http.server` five years from now.

## The promise

You write a presentation today. Five years from now, you can reopen it, edit one character, give it again. No `npm install`. No toolchain error. No need to figure out why the 2026 build doesn't run in 2031.

That's it.
