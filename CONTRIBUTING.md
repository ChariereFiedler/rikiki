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

Sources are organised by design-system bucket: `atoms/`, `molecules/`,
`layouts/`, `runtime/`, `plugins/`.

1. Create `rikiki/src/<bucket>/deck-<name>.ts` extending `LitElement` (pick the
   bucket: a slide is a `layout`, an inline element an `atom`/`molecule`).
2. Import shared styles from `../shared-styles.js` if it is a slide layout.
3. Register the element with the decorator: `@customElement('deck-<name>')`.
4. Export and register it in `rikiki/src/index.ts`.
5. Rebuild: `npm run build`. The `dist/` change ships with the PR.

## Pull requests

- One self-contained change per PR.
- Include a short rationale in the PR body · what changed, why, what was rejected.
- If the change is visual, attach a before/after screenshot.
- The build must succeed (`npm run build`) and tests must pass.

## License

By contributing you agree that your contribution is licensed under the project's
[MIT license](./LICENSE).
