# Rikiki

[![npm](https://img.shields.io/npm/v/rikiki-deck)](https://www.npmjs.com/package/rikiki-deck)
[![license](https://img.shields.io/npm/l/rikiki-deck)](./LICENSE)
![zero-build](https://img.shields.io/badge/build-zero-brightgreen)

A tiny **Lit Web Components** framework for technical presentations. Drop a folder anywhere, open `index.html`, give the talk. No build step on the consumer side · the framework itself is built from TypeScript, but the output is plain ES modules you import directly.

This documentation tracks rikiki v0.7.0.

## TL;DR

```sh
npm install rikiki-deck
npx rikiki init my-deck.html
python3 -m http.server        # ES modules need http://, not file://
```

`init` writes the deck and copies the runtime it loads into `./rikiki/` beside
it. Edit `my-deck.html`. Each slide is a custom element. Markdown is available anywhere via `<deck-md>`. Navigate with `←` / `→` (or click, or the scroll wheel), `O` for the overview grid. Decks are linear by default; add `nav="2d"` on `<deck-root>` for chapter/slide grid navigation.

## Look at it, and measure it

You cannot review a deck you cannot see. Two commands stand in for eyes, both
needing the optional peer `playwright`:

```sh
npx rikiki render talk.html            # one PNG per slide + a gallery + a manifest
npx rikiki render talk.html --steps    # every revealed state, not just the first
npx rikiki render talk.html --out after/ --baseline before/   # what moved since last time
npx rikiki check talk.html             # what is wrong, where, and what to try
npx rikiki check talk.html --json      # the same, as a versioned report
npx rikiki check talk.html --steps     # measure every revealed state, not just the first
```

`render --baseline <dir>` compares the fresh pictures to an earlier set, slide
by slide, and ranks them by how much changed, with the bounding box of what
moved and a `diff.json` beside the manifest. It exits 1 on a slide that
changed, disappeared or changed size. The default `--threshold 0.5` (percent of
pixels) keeps anti-aliasing noise out of the report; `--threshold 0` lists
every pixel change.

`check` reports a runtime that never loaded, a file that did not arrive, a
misspelled `deck-*` element that renders as nothing, content the slide clips
away, text too small for a room, and duplicate slide ids. It exits 0 when
nothing blocks, 1 on defects, 2 when it could not look at the deck at all. It
also lists what it did **not** check, because silence would read as approval.
Under `--steps`, each slide is measured in its opening state and in every
state its own reveals step through, and each diagnostic says which one
(`state: 2`).

## For LLMs / coding assistants

If you point a coding assistant (Claude Code, Copilot, …) at this package, give it
the machine-oriented docs — they are the single source of truth and ship with the
npm package:

- **[`llms.txt`](./llms.txt)** — concise capability map and entry points (the
  [llms.txt convention](https://llmstxt.org)).
- **[`docs/llms/rikiki-workflow.md`](./docs/llms/rikiki-workflow.md)** — the
  working guide: brief to plan to slides to checks to delivery, with nine
  compositions by intent whose HTML is verified by the test suite. The one to
  read first.
- **[`docs/llms/rikiki-reference.md`](./docs/llms/rikiki-reference.md)** — every
  tag, attribute, slot, design token, plugin, and recipe in one file. Have the
  assistant read this first; tell it not to invent tags or tokens outside it.
- **Claude Code skills** — `rikiki-deck`, `rikiki-theme`, `rikiki-debug` ship in
  `.claude/skills/` (see [Claude Code skills](#claude-code-skills) to install
  them); they teach an assistant the authoring/theming/debugging workflows.

## What the install gives you

```
node_modules/rikiki-deck/
├── tokens.css                ← entry point · re-exports the default theme
├── themes/
│   ├── rikiki.css            ← default theme (acid greens + mango, on dark)
│   ├── siliceum.css          ← alternative theme (warm paper + yellow)
│   └── siliceum-fonts.css    ← self-hosted Source Sans Pro + JetBrains Mono
├── fonts/                    ← woff2 files used by the Siliceum theme
├── dist/                     ← the runtime · plain ES modules, FLAT layout
│   └── vendor/               ← lit and marked · mermaid and Shiki when asked
├── bin/                      ← the rikiki CLI
├── docs/llms/                ← the full agent reference
└── .claude/skills/           ← three agent skills · install with `rikiki skills`
```

`init` copies the first five of those next to your deck, minus the heavy
plugin payloads unless you ask for them.

## Three-layer styling

1. **Theme tokens** (`themes/<name>.css`) at `:root` · custom properties cross the Shadow DOM, so they reach every component.
2. **Shared styles** · base typography and helpers, compiled into every layout's own Shadow DOM.
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
| `<deck-mermaid>` | Diagram via the vendored Mermaid runtime (opt-in bundle) |
| `<deck-figure>` | An image with its own caption and credit (opt-in bundle) |
| `<deck-source>` | The credit line under a table, chart, screenshot or quote |

Plus `<deck-badge>`, `<deck-metric>`, `<deck-tier-list>`, `<deck-step-list>`, `<deck-kicker>`, `<deck-stack>`, `<deck-grid>`, `<deck-punch>`.

Opt-in components add `<deck-annotate>` (numbered badges on a screenshot, placed by `above` / `below` / `left` / `right` anchors as well as pixel offsets) and `<deck-versus slide>` (a before/after slide with its own `title`, `lead` and `footer` slots).

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

Parser: vendored `marked` 12. Supports GFM (tables, task lists), code blocks, inline code, **bold**, *italic*, lists, blockquotes, links, `---`.

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

Adding a `deck-*` element means changing the framework itself, which lives in
the repository rather than in this package. See
[CONTRIBUTING](https://gitlab.com/tordu-jardin/rikiki/-/blob/main/CONTRIBUTING.md).

## No build step

The published runtime is plain ES modules. Nothing here needs compiling,
bundling or transpiling to author, serve or present a deck.

## Claude Code skills

The package ships three Claude Code skills so an assistant authoring your deck
knows the framework: `rikiki-deck` (build a deck), `rikiki-theme` (theming), and
`rikiki-debug` (diagnose a deck).

```sh
npx rikiki skills                       # into ./.claude/skills/
npx rikiki skills --dir ~/.claude/skills   # or once, for every project
```

Claude Code discovers them on the next session. Re-run the command with
`--force` after upgrading the package to pick up skill changes.

## Reveals & animations

Per-element click-through builds are an opt-in plugin (`installClickStages()` from
`dist/click-stages.js`): annotate elements with `data-click`, `data-click-hide`,
`data-click-auto`, `data-click-stagger`, and `data-morph` (Keynote-style Magic
Move via View Transitions). Slide transitions are driven by `transition="…"` on
`<deck-root>`. See `docs/llms/rikiki-reference.md` §7 for the full attribute set.

## Known limits

- **Step reveal on code blocks** uses `step-groups` on `<deck-code>` but is not exposed elsewhere yet.
- **Syntax highlighting** is ~10 keywords of JS/TS, no AST. Hook a real highlighter (Prism, Shiki) if you need more, via `installShiki()`.
