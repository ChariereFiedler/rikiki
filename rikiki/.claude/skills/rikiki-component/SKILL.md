---
name: rikiki-component
description: Use when adding or modifying a rikiki deck component — a new deck-* layout, molecule, or atom in the framework source (Lit/TypeScript). Triggers on "new rikiki component", "add a deck- element", "rikiki layout/molecule/atom", "extend rikiki". Repo-only — needs the TypeScript sources, not the npm package.
---

# Adding a rikiki component

Components are Lit elements in `src/`, organized by design-system bucket:
`runtime/` (engine), `layouts/` (full-slide), `molecules/` (composite),
`atoms/` (leaf). A consumer of the npm package can't do this — it needs the repo
sources and a rebuild.

Read a sibling in the same bucket before writing; `src/layouts/deck-takeaway.ts`
is the canonical minimal example. Match its shape exactly.

## Pattern

```ts
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { slideBase } from '../shared-styles.js'; // layouts only

@customElement('deck-thing')
export class DeckThing extends LitElement {
  /* Tokens:
       --deck-thing-bg  (defaults to --rik-surface-page) */
  static override styles = [
    ...slideBase, // a full-slide layout; omit for molecules/atoms
    css`
      :host { background: var(--deck-thing-bg, var(--rik-surface-page)); }
      ::slotted(.lead) { color: var(--rik-text-default--faint); }
    `,
  ];

  @property({ type: String }) label?: string;

  override render() {
    // Render every declared property · a declared-but-unrendered prop is dead.
    return html`
      <div class="body" part="body">
        ${this.label ? html`<span class="label">${this.label}</span>` : ''}
        <slot></slot>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'deck-thing': DeckThing; }
}
```

## Steps

1. **Create** `src/<bucket>/deck-thing.ts` from the pattern. Lead with a comment
   block showing the intended HTML usage (every component does this).
2. **Style** with semantic `--rik-*` tokens only; expose per-instance knobs as
   `--deck-thing-*` tokens that default to a `--rik-*` value. Never hardcode
   colors. Use `part=` on structural nodes so authors can `::part()` them, and
   container-query units (`cqw`/`cqh`) for type that scales with the slide.
   What the component should LOOK like is a separate question with its own
   skill: load `frontend-design` then `rikiki-visual-design` before deciding a
   surface, a scale or a layout rhythm. Token discipline is not taste, and this
   list only covers the former.
3. **Register** by adding `import './<bucket>/deck-thing.js';` to `src/index.ts`
   in the matching bucket section (note the `.js` extension — these are ESM
   specifiers resolved post-build).
4. **Build** with `npm run build` (esbuild flattens the `dist/` **`.js`** files
   regardless of bucket — deck-root's dynamic imports rely on the flat layout;
   the emitted `.d.ts` keep the bucket tree, which is fine). `dist/` is
   committed; commit the rebuilt output with the source.
5. **Document** the new tag, its slots, attributes, and `--deck-*` tokens in
   `docs/llms/rikiki-reference.md` (in the matching Layouts / Molecules / Atoms
   table) — it is the source of truth and the tests and skills read it.
6. **Cover** it in the Playwright render net if it changes rendering (add a
   fixture deck or extend `e2e/`).

## Rules

- One responsibility per component; compose rather than add options.
- `npm run typecheck` and `npm run lint` (biome) must pass. No em-dashes in
  source — use `·`. The parent repo's dash-linter (`site/scripts/lint-dashes.mjs`,
  run by the `lint` CI job) scans `rikiki/src` and fails on `—`.
- Keep `src/` and the committed `dist/` in sync; the repo-root `.gitlab-ci.yml`
  e2e job fails on drift (`git diff --exit-code -- dist`).
- To render an em-dash glyph (e.g. a citation) without a literal em-dash byte
  in source, use its escape: `\u2014` in a JS/TS template literal, or
  `content: '\2014'` in CSS. A literal em-dash in source trips the dash-linter.
- **A component may render another component's tag without importing its
  module, but never both.** `esbuild` flattens `dist/` per entry point, so
  each bundle carries its own copy of everything it imports; if two loaded
  bundles both import the same `customElements.define`, the second one
  throws, and the whole module's evaluation aborts with it · including any
  element defined *after* that point in the same file. Two existing
  components rely on the tag being registered elsewhere instead of importing
  it: `deck-figure` renders `<deck-source>` trusting it's a core atom
  index.ts always registers (see the atoms table in section 6 of
  `docs/llms/rikiki-reference.md`), and `deck-graph`/`deck-flow` render
  `<deck-icon>` trusting the deck author loaded `dist/deck-icon.js`
  themselves (documented in-component as "needs dist/deck-icon.js loaded
  too"). If your component nests a tag from another bucket or another
  opt-in module, do the same thing · use the tag, add a one-line comment
  saying what must already be loaded and why, and do **not** `import` that
  module's file.
