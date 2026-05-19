# Rikiki · Roadmap

Milestones aimed at "publishable releases". Every milestone is shippable and usable on its own · no "all or nothing".

## v0.1 · Public MVP · *OSS foundations*

**Goal**: a repo we can point publicly without shame.

- [x] **Migrate `rikiki/*.js` to TypeScript**
  - `deck-*.ts` sources in `src/`, compiled to `dist/*.js` + `dist/*.d.ts`
  - Build script: `node build.mjs` (esbuild) + `tsc --emitDeclarationOnly`
  - Consumers import from `dist/`; sources stay in `src/`
- [x] Detach product branding from the core package
  - `<deck-cover>` accepts a `brand-src` attribute (optional logo URL); no hardcoded mark
  - `<deck-cover>` meta labels (`Présenté par`, `Entreprise`…) overridable via attributes
- [x] Two ship-ready themes: `rikiki` (default, tropical) and `siliceum` (warm paper, legacy)
- [ ] `LICENSE` (MIT)
- [x] Minimal `package.json` (name `rikiki`, version `0.1.0-pre`, type module, files, exports, build script)
- [ ] Rewrite `rikiki/README.md`: install, quickstart, component API, theming
- [x] `MANIFESTO.md` at repo root
- [ ] Initialize `CHANGELOG.md`
- [ ] `.editorconfig`

**Acceptance**: an external dev clones the repo, opens `index.html` of an example, it just works. Edits a deck file, sees the change. A contributor runs `npm run build` to compile TS → JS.

## v0.2 · Full theming · *unhardcoding colors*

**Goal**: a consumer can fully re-theme without touching component code.

- [ ] Tokenize `deck-callout.ts` (4 rgba variants → custom properties `--deck-callout-{info,warn,danger,ok}-{bg,border,stroke}`)
- [ ] Tokenize `deck-card.ts` (4 rgba colors)
- [ ] Tokenize `deck-code.ts`:
  - chrome (block background, border) → `--deck-code-{bg,border,text}`
  - syntax (kw/fn/str/num/cmt/ty/prop) → `--deck-syntax-*`
- [ ] Tokenize `deck-mermaid.ts` theme config (background, mainBkg, nodeBorder, lineColor, textColor)
- [ ] Tokenize `deck-md.ts` pre styling
- [ ] Theme files document the protocol: **public** tokens (`--deck-*`, `--sp-*`, `--fs-*`) vs **private** (`--_*`)
- [ ] One example demonstrates theme switching (toggle widget)

**Acceptance**: copy a theme file, change 5 values, watch the whole deck adopt the new palette.

## v0.3 · Presenter & navigation · *tools for live talks*

**Goal**: support real-world presenting (timer, notes, second screen, 2D nav, overview mode).

### Navigation

- [x] **2D navigation** using `<deck-section>` as chapter boundaries:
  - `←` / `→` move between chapters (with linear fallback at edges)
  - `↑` / `↓` move inside the current chapter
  - `Space` keeps the linear sequence
  - URL hash stays `#N` (canonical); `#C.N` accepted as input
  - Zero impact for decks without `<deck-section>` (stays 1D flat)
- [x] **Overview mode** triggered by `O` (`Esc` to close):
  - Path layout · each chapter is a row, sub-slides flow right, separated by connectors (à la reveal.js)
  - Click a slide to zoom back in
  - ~50 lines of CSS + handler, no dependency

### Presenter

- [ ] `<deck-timer minutes="30">` · optional component, shown as a bottom-right overlay, color-coded (green/orange/red)
- [ ] `<deck-notes>…</deck-notes>` · per-slide slot, not rendered by default, visible in presenter mode
- [ ] Opt-in `deck-presenter.ts` module:
  - Detects a second screen (`window.screen.isExtended` or manual open)
  - Detached window shows: current slide (small), next slide (preview), notes, timer
  - Sync via `BroadcastChannel` (no WebSocket)
- [ ] Shortcuts: `B` (black out), `W` (white out), `T` (toggle timer), `N` (toggle inline notes)

**Acceptance**: navigate a deck with `↑↓←→`, `O` for overview, `Cmd+Shift+P` for the presenter window. Notes readable, timer visible, next slide preview rendered.

## v0.4 · Export · *out of the browser*

**Goal**: produce a clean PDF from a deck, scriptable in CI.

- [ ] Complete `@media print`: one slide per A4 landscape page, hide chrome (counter, progress, kb hints)
- [ ] `tools/export-pdf.mjs` script: headless Playwright → PDF, one command
- [ ] `?export` mode: forces sequential layout for print (all slides stacked vertically)
- [ ] Document per-slide PNG export (useful for tweets / threads)

**Acceptance**: `node tools/export-pdf.mjs my-deck/index.html out.pdf` produces a PDF identical to the on-screen render, fonts embedded, vector graphics.

## v0.5 · Extended components · *richer library*

**Goal**: cover recurring needs in technical decks without bloating the core.

- [ ] `<deck-chart>` · simple bar/line chart via SVG, declarative data
- [ ] `<deck-timeline>` · horizontal or vertical time line
- [ ] `<deck-quote>` · pull quote with attribution
- [ ] `<deck-table>` (wrapper on `table.dense`, attributes for zebra striping, visual sort)
- [ ] `<deck-diff>` · before/after with syntax-aware diff
- [ ] Improve syntax highlighting: extend `deck-code.ts` stash to cover python, rust, go, css, yaml, json, sql

**Acceptance**: half of a typical technical deck's slides can be built with no local `<style>`.

## v1.0 · Stabilization · *frozen API*

**Goal**: backward compatibility promise.

- [ ] Per-component isolation tests (`tests/components/<name>.spec.mjs`)
- [ ] Exhaustive API docs: for each component, table of attributes / slots / events / custom properties / parts
- [ ] Online playground: `playground/index.html` shows the 20+ components in isolation, deployed to GitHub Pages
- [ ] CI: GitHub Actions tests + lint + deploy playground on tag
- [ ] `CONTRIBUTING.md`: conventions, how to add a component, naming, where tokens live
- [ ] a11y audit: focus visible everywhere, full keyboard nav, ARIA roles on key regions, `prefers-reduced-motion` support
- [ ] Documented browser support (Chromium 91+, Firefox 90+, Safari 15+)
- [ ] Public launch (blog post, tweet, /r/webdev, /r/javascript, HN?)

**Acceptance**: tag `v1.0.0`. From this point, breaking changes = major bump.

---

## Anti-features · what we won't do

Considered and **explicitly rejected**, to keep the project light and faithful to the manifesto:

| Anti-feature | Reason |
|---|---|
| Custom markdown DSL (`---` separators, per-slide front matter) | Non-portable source, breaks the "source = output" promise. Stays HTML. |
| Embedded code editor (Monaco) | +500 KB, out of scope. If you want to live-edit code, open your editor. |
| Drawing / whiteboard tools | Rare use case for technical decks, huge complexity. External plugin if needed. |
| Built-in video recording | OS-native (QuickTime, OBS) does it better. No reason to reinvent. |
| Multiplexing (synced multi-client presentation) | Niche use case. External plugin if anyone wants it. |
| SSR / SSG | The HTML is already static. No need. |
| Formal plugin system | ES modules already are a plugin system. `import './my-plugin.js'` suffices. |
| Built-in bundler (Vite-like) | Breaks "source = output". If you want a prod bundle, run esbuild yourself. |
| JS theming (`props.theme=…`) | CSS custom properties do the job, no JS runtime needed. |
| State management (Redux-like) | These are slides. Not a SPA. |

## Indicative cadence

No commitment on dates · milestones land at the rhythm of real needs:

- **v0.1**: 1 day of focused work
- **v0.2**: 1 day
- **v0.3**: 2–3 days (presenter mode is non-trivial)
- **v0.4**: 1 day
- **v0.5**: spread across multiple presentations that surface real needs
- **v1.0**: when v0.x are stable and 3+ decks are in production
