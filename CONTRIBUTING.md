# Contributing to Rikiki

Thank you for considering a contribution. This document is short on purpose.

## Setup

Use Node 24 (`nvm use` or `mise use node@24`). The site requires Node >=22.12.0.

To validate the site from the repository root:

```sh
cd site
npm ci
npm run lint
npm run build
```

```bash
git clone https://gitlab.com/tordu-jardin/rikiki.git
cd rikiki/rikiki      # the npm package lives one level down
npm install
npm run build         # esbuild + tsc --emitDeclarationOnly
npm test              # release-consistency suite (vitest)
```

Run the dev server from the repo root:

```bash
cd ..                 # back to the repo root
python3 -m http.server 7799
```

Then open <http://localhost:7799/examples/rikiki-tour/> or
<http://localhost:7799/rikiki/starter.html>.

## Project layout

```
.
├── rikiki/src/              · TypeScript sources (where you edit)
├── rikiki/dist/             · build output, versioned (consumers import this)
├── rikiki/themes/           · the two ship-ready themes
├── examples/                · sample decks
├── MANIFESTO.md             · the principles · read first
└── ROADMAP.md               · what is planned, what is rejected
```

## Conventions

- **English** for code, comments and commit messages.
- **No emoji** in code or commit messages unless explicitly requested.
- **Magic numbers stay out of CSS** · everything routes through tokens (`--sp-*`, `--fs-*`, etc.).
- **No em-dashes (`—`)** in slide content; prefer ` · ` (middle dot with spaces).
- **Read [`MANIFESTO.md`](./MANIFESTO.md)** before proposing a new feature. The
  rejected-features list in [`ROADMAP.md`](./ROADMAP.md) saves time.

## Adding a component

Start with the generator, which writes a component that already passes every
guard, plus a fixture slide that renders it:

```sh
cd rikiki
npm run new:component -- <family> deck-<name>          # opt-in, the default
npm run new:component -- <family> deck-<name> --core   # joins the default bundle
```

Sources are organised by **family** — what a component serves, not how big it
is ([ADR-004](./docs/design/adr-004-source-modulith-by-family.md)):
`engine/` pilots the deck, `layout/` frames a whole slide, `structure/`
arranges blocks inside one, `text/` is what a slide says, `data/` what it
proves, `media/` what it embeds or draws. `shared/` holds only what two
families use; a helper with one consumer lives with that consumer, and a test
says so.

`rikiki/src/index.ts` is the manifest: what it imports is the default bundle,
everything else is opt-in and the deck loads it itself.

If you write one by hand instead:

1. Create `rikiki/src/<family>/deck-<name>.ts` extending `LitElement`.
2. Import shared styles from `../shared/shared-styles.js` if it is a slide layout.
3. Register the element with the decorator: `@customElement('deck-<name>')`,
   and declare it on `HTMLElementTagNameMap`.
4. Add it to `rikiki/src/index.ts` only if it belongs in the default bundle.
5. Document it in `rikiki/docs/llms/rikiki-reference.md` and in the catalogue
   page — both are checked by tests.
6. Rebuild: `npm run build`. The `dist/` change ships with the MR.

## Pull requests

- One self-contained change per PR.
- Include a short rationale in the PR body · what changed, why, what was rejected.
- If the change is visual, attach a before/after screenshot.
- The build must succeed (`npm run build`) and tests must pass.

## License

By contributing you agree that your contribution is licensed under the project's
[MIT license](./LICENSE).
