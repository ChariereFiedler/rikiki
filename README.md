# Rikiki

> A tiny Lit Web Components framework for technical presentations · zero-build for consumers, TypeScript for contributors.

This documentation tracks rikiki v0.7.1.

Serve the folder with any static HTTP server and open `index.html`. There is no consumer build step or toolchain to maintain; the shipped folder contains the runtime. Offline bundle tests verify that the delivered HTML loads without network requests · everything is Web standards (Custom Elements, Shadow DOM, ES Modules, CSS Custom Properties).

```
.
├── rikiki/                 · the framework (Lit components, themes, fonts)
├── examples/               · example decks
└── MANIFESTO.md            · why this exists
```

See [`MANIFESTO.md`](./MANIFESTO.md) for principles and [`ROADMAP.md`](./ROADMAP.md) for what's next.

## Quickstart

Start a static server at the repo root:

```bash
python3 -m http.server 7799
```

Then open one of the examples:

- <http://localhost:7799/examples/rikiki-tour/> · a guided tour of the layouts, atoms and navigation keys
- <http://localhost:7799/rikiki/starter.html> · a blank template you can copy

To author your own deck:

1. Copy `rikiki/starter.html` to `examples/<my-deck>/index.html`
2. Adjust the two paths inside:
   ```html
   <link rel="stylesheet" href="../../rikiki/tokens.css">
   <script type="module" src="../../rikiki/dist/index.js"></script>
   ```
3. Write slides as `<deck-cover>`, `<deck-section>`, `<deck-feature>`, `<deck-split>`, `<deck-feature-cards>`, `<deck-takeaway>`, `<deck-photo>` · each is plain HTML with a few slots and attributes. See [`rikiki/docs/llms/rikiki-reference.md`](./rikiki/docs/llms/rikiki-reference.md) for the full tag/attribute/token list.
4. Credit what you show with `<deck-source>`, and pair an image with its caption using `<deck-figure>`; `<deck-annotate>` badges take `above` / `below` / `left` / `right` anchors as well as pixel offsets, and `<deck-versus slide>` takes a `footer` slot under both sides.

To see and measure the result: `npx rikiki render my-deck.html --steps` writes one picture per revealed state (`--baseline <dir>` says what moved since an earlier render), and `npx rikiki check my-deck.html --steps` reports what is wrong in every state, not only the opening one.

## Themes

Two themes ship by default. `tokens.css` is the **default theme** (Rikiki) · acid greens, mango orange, orchid pink on a deep nocturnal navy, with Unbounded + Inter + Space Mono. Use the alternative by importing it directly:

```html
<!-- Default Rikiki theme -->
<link rel="stylesheet" href="../../rikiki/tokens.css">

<!-- Or the warm-paper Siliceum theme -->
<link rel="stylesheet" href="../../rikiki/themes/siliceum.css">
```

Writing a third theme is a copy-paste of `rikiki/themes/rikiki.css` with the colors changed.

## Navigation

Decks are **linear by default** · arrows move to the next / previous slide:

- `←` / `→` (or `↑` / `↓`) · previous / next slide (or step)
- `Space` / `PageDown` · advance · `PageUp` · back
- `O` · overview grid · `Esc` to close
- `P` · presenter / speaker-notes window
- `Home` / `End` · first / last
- `?` · help

Mouse is on by default too: click to advance (Shift+click to go back), scroll
wheel, and the bottom-left hint chips are clickable. Opt out with
`mouse-nav="none"` on `<deck-root>`.

For chapter/slide **2D navigation**, opt in with `nav="2d"` on `<deck-root>`
(with `<deck-section>` chapters): then `←` / `→` move between chapters and
`↑` / `↓` within one.

URL hash stays flat (`#3` = slide 3, `#3.2` = slide 3 step 2) for shareability.

## Rendering

By default a deck renders into a fixed logical canvas (1920×1080) scaled
uniformly to fit, so every slide keeps an identical layout at any window size,
letterboxed when the aspect differs. Add `fluid` on `<deck-root>` to opt out ·
the deck then fills its box and reflows like a web page. Either way the deck is
embed-safe · drop a `<deck-root>` inside a larger page and it scales to (or
fills) its own container without touching the host page's scroll or typography.

## Contributing

Sources are in `rikiki/src/**/*.ts` (organised by DS bucket · runtime/, layouts/, molecules/, atoms/, plugins/). Build with:

```bash
cd rikiki
npm install
npm run build      # node build.mjs (esbuild) + tsc --emitDeclarationOnly
npm run typecheck  # tsc --noEmit
npm test           # release-consistency suite (vitest)
```

Browser-verification fixtures live in `rikiki/decks/tests/*.html`. See
[`CONTRIBUTING.md`](./CONTRIBUTING.md) for the full workflow.

## License

MIT.
