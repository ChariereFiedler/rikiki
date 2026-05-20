# Contributing to Rikiki

Thank you for considering a contribution. This document is short on purpose.

## Setup

```bash
git clone <repo>
cd rikiki
npm install
npm run build      # esbuild + tsc --emitDeclarationOnly
```

Run the dev server from the repo root:

```bash
python3 -m http.server 7799
```

Then open <http://localhost:7799/examples/web-components-in-5min/>.

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

1. Create `rikiki/src/deck-<name>.ts` extending `LitElement`.
2. Import shared styles from `./shared-styles.js` if it is a slide layout.
3. Define the element at the bottom: `customElements.define('deck-<name>', Deck<Name>);`.
4. Register it in `rikiki/src/index.ts`.
5. Rebuild: `npm run build`. The `dist/` change ships with the PR.

## Pull requests

- One self-contained change per PR.
- Include a short rationale in the PR body · what changed, why, what was rejected.
- If the change is visual, attach a before/after screenshot.
- The build must succeed (`npm run build`) and tests must pass.

## License

By contributing you agree that your contribution is licensed under the project's
[MIT license](./LICENSE).
