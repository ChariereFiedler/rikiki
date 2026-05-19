# Rikiki

> A tiny Lit Web Components framework for technical presentations · zero-build for consumers, TypeScript for contributors.

Open `index.html` in a browser and you get a deck. No dev server, no build step, no `dist/` to ship. Reopen the same folder in 2031 and it still runs · everything is Web standards (Custom Elements, Shadow DOM, ES Modules, CSS Custom Properties).

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

- <http://localhost:7799/examples/web-components-in-5min/> · a 5-minute mini-tutorial showcasing the components
- <http://localhost:7799/rikiki/starter.html> · a blank template you can copy

To author your own deck:

1. Copy `rikiki/starter.html` to `examples/<my-deck>/index.html`
2. Adjust the two paths inside:
   ```html
   <link rel="stylesheet" href="../../rikiki/tokens.css">
   <script type="module" src="../../rikiki/dist/index.js"></script>
   ```
3. Write slides as `<deck-cover>`, `<deck-hero>`, `<deck-split>`, `<deck-hero-detail>`, `<deck-hook>` · each is plain HTML with a few slots and attributes.

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

- `←` / `→` · between sections (chapters)
- `↑` / `↓` · within a section
- `Space` / `PageDown` · linear next (any axis)
- `O` · overview · `Esc` to close
- `Home` / `End` · first / last
- `?` · help

URL hash stays flat (`#3` = slide 3) for shareability.

## Contributing

Sources are in `rikiki/src/*.ts`. Build with:

```bash
cd rikiki
npm install
npm run build      # node build.mjs (esbuild) + tsc --emitDeclarationOnly
```

Tests use Playwright; see existing test specs alongside examples.

## License

MIT.
