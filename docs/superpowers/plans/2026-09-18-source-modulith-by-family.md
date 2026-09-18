# Source modulith by family · implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: use `superpowers:subagent-driven-development`
> (recommended) or `superpowers:executing-plans` to implement this plan lot by lot.
> Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the three-axis `src/` tree with one modulith by family, and
make the component contract impossible to break silently — gates plus a
generator.

**Architecture:** Six family modules (`engine`, `layout`, `structure`, `text`,
`data`, `media`) plus the untouched ADR-001 core under `src/core/`. A helper
lives with its only consumer; `shared/` keeps only what two families use. Opt-in
is a manifest, not a directory. Build-time code leaves `src/`. Every rule is
held by a test in `scripts/`, and a generator produces code that passes them.

**Tech Stack:** TypeScript 5.6, Lit 3, esbuild, vitest (unit + guards),
Playwright (3 engines), biome.

**Spec:** `docs/design/adr-004-source-modulith-by-family.md`

## Global constraints

- **No public API change.** `dist/*.js` is flat and must stay byte-identical
  through lots 1–9. `build.mjs` throws on duplicate basenames — that check is
  the safety net for every move.
- **`dist/` is committed.** Rebuild and commit it with the source in the same
  commit. CI (`.gitlab-ci.yml`) fails on `git diff --exit-code -- dist`.
- **Moves use `git mv`**, never a copy-delete, so the history follows the file.
- **Import rewrites use `Edit`**, never `sed -i` or a Python replace script:
  a silent miss is the failure mode, and `tsc --noEmit` is what makes a loud one.
- **No literal em-dash in source** (`·` instead) — `site/scripts/lint-dashes.mjs`
  fails the `lint` CI job on `—`.
- Commit format `type(scope): description`, first line ≤ 72 chars, no mention of
  AI. Ask before every commit.
- Target release **0.8.0**. 0.7.1 is published; `main` is clean.

## Verification loop · run at the end of every lot

```bash
cd rikiki
npm run lint                 # biome, src + scripts
npm run typecheck            # tsc --noEmit · catches every missed import
npm run test                 # vitest · unit + all scripts/*.test.mjs guards
npm run build                # rebuild dist/
git diff --stat -- dist      # lots 1-9: must be EMPTY except where the lot says
npx playwright test --project=chromium
```

Full three-engine Playwright (`npx playwright test`) runs at lots 0, 9 and 13.
A red check is fixed inside its own lot, never carried to the next.

---

### Lot 0: Branch and recorded baseline

**Files:** none modified.

- [ ] **Step 1: Branch from a clean `main`**

```bash
cd <repo>
git switch -c refactor/source-modulith
```

- [ ] **Step 2: Record the green baseline**

```bash
cd rikiki
npm run lint && npm run typecheck && npm run test && npm run build
git diff --stat -- dist          # expect: empty · proves dist is in sync BEFORE
npx playwright test              # all three engines
```

Write the counts (vitest passed, playwright passed per engine) into the lot's
commit message. Every later lot is compared against these numbers: a suite that
was already red must not be mistaken for a regression this plan caused.

- [ ] **Step 3: Snapshot the published JS surface**

```bash
cd rikiki && ls dist/*.js | sort > /tmp/dist-before.txt && wc -l /tmp/dist-before.txt
```

Lots 1–9 end with `ls dist/*.js | sort | diff /tmp/dist-before.txt -` being
empty, except lot 1 which removes exactly one line (`dist/contrast.js`).

- [ ] **Step 4: Commit the ADR and this plan**

```bash
git add docs/design/adr-004-source-modulith-by-family.md docs/superpowers/plans/2026-09-18-source-modulith-by-family.md
git commit -m "docs(adr): one axis for the source tree, a modulith by family"
```

---

### Lot 1: Build-time code leaves the published package

`src/shared/contrast.ts` has no runtime consumer. It is imported by
`scripts/theme-contrast.test.mjs` and five e2e specs, and it ships as
`dist/contrast.js` to everyone who installs the package.

**Files:**
- Move: `rikiki/src/shared/contrast.ts` → `rikiki/tools/contrast.ts`
- Move: `rikiki/src/shared/contrast.test.ts` → `rikiki/tools/contrast.test.ts`
- Modify: `rikiki/scripts/theme-contrast.test.mjs:12`
- Modify: `rikiki/e2e/component-context-variants.spec.ts:2`, `e2e/emphasis.spec.ts:24`,
  `e2e/component-variants.spec.ts:2`, `e2e/extensions.spec.ts:2`,
  `e2e/transition-cover.spec.ts:22`, `e2e/support/ink.ts:15`
- Modify: `rikiki/tsconfig.json` (`include`), `rikiki/biome.json` (`includes`)
- Delete: `rikiki/dist/contrast.js`, `rikiki/dist/shared/contrast.d.ts`

- [ ] **Step 1: Move the two files**

```bash
cd rikiki && mkdir -p tools
git mv src/shared/contrast.ts tools/contrast.ts
git mv src/shared/contrast.test.ts tools/contrast.test.ts
```

- [ ] **Step 2: Repoint the seven importers with `Edit`**

In `scripts/theme-contrast.test.mjs`: `'../src/shared/contrast.ts'` → `'../tools/contrast.ts'`.
In each of the six e2e files: `'../src/shared/contrast.js'` → `'../../tools/contrast.js'`
for `e2e/support/ink.ts`, `'../tools/contrast.js'` for the five specs at `e2e/` root.

- [ ] **Step 3: Widen the tool configs**

`tsconfig.json` — `"include": ["src/**/*.ts", "tools/**/*.ts"]`, and add
`"tools"` to `tsconfig.build.json`'s `exclude` so declarations are not emitted
for it. `biome.json` — `"includes": ["src/**", "scripts/**", "tools/**"]`.

- [ ] **Step 4: Verify, and confirm the intended dist change**

Run the verification loop. `ls dist/*.js | sort | diff /tmp/dist-before.txt -`
must show exactly one removed line: `dist/contrast.js`. Delete the stale
`dist/shared/contrast.d.ts` if the rebuild leaves it behind.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "refactor(build): move contrast out of the published sources"
```

---

### Lot 2: Single-consumer helpers go home

Five helpers have exactly one importer each. They move next to it, keeping
their current directory for now — the component moves happen in lots 4–8.

**Files:** move each helper and its test beside its only consumer.

| Helper | Lands in | Only consumer |
|---|---|---|
| `shared/annotation-marks.ts` | `extras/` | `extras/deck-annotate.ts` |
| `shared/bar-segments.ts` | `extras/` | `extras/deck-bar.ts` |
| `shared/graph-layout.ts` | `extras/` | `extras/deck-graph.ts` |
| `shared/cards-syntax.ts` | `molecules/` | `molecules/deck-md.ts` |
| `shared/parse-csv.ts` | `molecules/` | `molecules/deck-csv.ts` |
| `shared/grid-tracks.ts` | `molecules/` | 4 consumers, all future `structure/` |
| `shared/slide-fill.ts` | `layouts/` | 3 consumers, all future `layout/` |

- [ ] **Step 1: Move the fourteen files (helper + test each)**

```bash
cd rikiki/src
git mv shared/annotation-marks.ts shared/annotation-marks.test.ts extras/
git mv shared/bar-segments.ts shared/bar-segments.test.ts extras/
git mv shared/graph-layout.ts shared/graph-layout.test.ts extras/
git mv shared/cards-syntax.ts shared/cards-syntax.test.ts molecules/
git mv shared/parse-csv.ts shared/parse-csv.test.ts molecules/
git mv shared/grid-tracks.ts shared/grid-tracks.test.ts molecules/
git mv shared/slide-fill.ts shared/slide-fill.test.ts layouts/
```

- [ ] **Step 2: Rewrite the imports with `Edit`, one file at a time**

Consumers to edit — `../shared/X.js` becomes `./X.js`:
`extras/deck-annotate.ts`, `extras/deck-bar.ts`, `extras/deck-graph.ts`,
`molecules/deck-md.ts`, `molecules/deck-csv.ts`, `molecules/deck-point.ts`,
`molecules/deck-grid.ts`, `molecules/deck-cell.ts`, `layouts/deck-feature.ts`,
`layouts/deck-takeaway.ts`, `layouts/deck-split.ts`.
Cross-directory: `layouts/deck-bento.ts` imports `../molecules/grid-tracks.js`.
Each moved test file's own `./X.js` import is already correct.

- [ ] **Step 3: Verify**

Run the loop. `tsc --noEmit` is the gate that catches a missed rewrite.
`git diff --stat -- dist` must be empty — `dist/` is flat, so the `.js` files
do not move. The `.d.ts` do move; that is expected and lot 10 settles them.

- [ ] **Step 4: Commit**

```bash
git commit -am "refactor(src): move single-consumer helpers next to their consumer"
```

---

### Lot 3: `shared/` cannot refill · the guard

`shared/` now holds `escape-html`, `fit-controller`, `icon-set`, `signature`,
`shared-styles`. The rule that keeps it that way is written as a test before
the tree moves, so lots 4–8 are checked as they land.

**Files:**
- Create: `rikiki/scripts/modulith.test.mjs`
- Test: itself

- [ ] **Step 1: Write the failing guard**

```js
// rikiki/scripts/modulith.test.mjs
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// ADR-004 · shared/ is not a locker room.
//
// Six of its eleven modules once had exactly one importer, in another
// directory. A helper with one consumer is that consumer's internal, and the
// only thing that keeps it from drifting back is this file.

const PKG_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = resolve(PKG_DIR, 'src');

export function sources(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = join(dir, e.name);
    if (e.isDirectory()) return sources(full);
    return e.name.endsWith('.ts') && !e.name.endsWith('.test.ts') ? [full] : [];
  });
}

const familyOf = (file) => file.slice(SRC.length + 1).split('/')[0];

function importersOf(name) {
  const hit = [];
  for (const file of sources(SRC)) {
    if (familyOf(file) === 'shared') continue;
    if (readFileSync(file, 'utf8').includes(`/shared/${name}.js`)) hit.push(file);
  }
  return hit;
}

describe('shared/ holds only what two families need', () => {
  const sharedModules = sources(resolve(SRC, 'shared')).map((f) =>
    f.slice(f.lastIndexOf('/') + 1, -3),
  );

  it('has modules to check', () => {
    expect(sharedModules.length).toBeGreaterThan(0);
  });

  it.each(sharedModules)('%s is used by at least two families', (name) => {
    const families = new Set(importersOf(name).map(familyOf));
    expect(
      [...families],
      `src/shared/${name}.ts is used by ${families.size} family · move it in with its consumer`,
    ).not.toHaveLength(1);
  });

  it.each(sharedModules)('%s is used at all', (name) => {
    expect(importersOf(name), `src/shared/${name}.ts has no consumer`).not.toEqual([]);
  });
});
```

- [ ] **Step 2: Run it and check it passes on the post-lot-2 tree**

Run: `npx vitest run scripts/modulith.test.mjs`
Expected: PASS · 5 shared modules, each with ≥2 families.

- [ ] **Step 3: Prove the guard bites**

Temporarily move `shared/escape-html.ts` back a consumer — delete the import in
`src/runtime/deck-presenter.ts` — and re-run. Expected: FAIL naming
`escape-html`. Restore the import. A guard never verified to fail is a guard
that defends nothing (ADR-001's standard, applied here).

- [ ] **Step 4: Commit**

```bash
git add scripts/modulith.test.mjs && git commit -m "test(arch): shared/ holds only what two families need"
```

---

### Lot 4: `core/` · the ADR-001 layers move intact

**Files:**
- Move: `src/domain/` `src/application/` `src/infrastructure/` → `src/core/`
- Modify: `scripts/architecture.test.mjs:15,27,67,110,139,170`
- Modify: importers of the three layers — `src/runtime/deck-root.ts` (domain,
  application), `src/runtime/deck-*.ts`, `src/extras/*` (1 domain import),
  `src/infrastructure/browser-location.ts` (application)

- [ ] **Step 1: Move**

```bash
cd rikiki/src && mkdir -p core
git mv domain application infrastructure core/
```

- [ ] **Step 2: Repoint `scripts/architecture.test.mjs`**

`'src/domain'` → `'src/core/domain'`, `'src/application'` → `'src/core/application'`,
`'src/infrastructure'` → `'src/core/infrastructure'`. `'src/runtime/deck-root.ts'`
stays until lot 5. The `OUTWARD` array keeps its bare directory names — it
matches on `/runtime/`, `/layouts/` and friends, which the move does not change.

- [ ] **Step 3: Repoint the importers with `Edit`**

`../domain/` → `../core/domain/`, same for the other two. `tsc --noEmit` lists
every one that was missed.

- [ ] **Step 4: Verify and commit**

Run the loop; `git diff -- dist` empty for `.js`.

```bash
git commit -am "refactor(src): group the ADR-001 layers under core/"
```

---

### Lot 5: `engine/`

**Files:** `src/runtime/` → `src/engine/`, plus `src/livereload.ts` and
`src/plugins/click-stages.ts` into it.

Contents after the lot: `deck-root`, `deck-transition`, `deck-overview`,
`deck-presenter`, `deck-notes`, `deck-help`, `color`, `livereload`,
`click-stages`.

- [ ] **Step 1: Move**

```bash
cd rikiki/src
git mv runtime engine
git mv livereload.ts engine/
git mv plugins/click-stages.ts engine/
```

- [ ] **Step 2: Repoint**

- `src/index.ts`: `./runtime/X.js` → `./engine/X.js` (6 imports), and the
  `DeckPlugin`/`DeckContext` type re-export.
- `engine/livereload.ts`: `./shared-styles.js` → `../shared-styles.js`.
- `engine/click-stages.ts`: `../runtime/deck-root.js` → `./deck-root.js`.
- Every `../runtime/` elsewhere → `../engine/`.
- `scripts/architecture.test.mjs`: `'src/runtime/deck-root.ts'` → `'src/engine/deck-root.ts'`,
  and `OUTWARD`'s `'runtime'` entry → `'engine'`.
- `build.mjs`: the `cdnRewrite` external filter lists `deck-overview|deck-help|deck-transition|deck-presenter|livereload`
  by **basename only** — unchanged by the move. Verify the comment above
  `walkTs()` still describes the tree, and update its bucket list.

- [ ] **Step 3: Verify · the dynamic-import contract**

Beyond the loop, this lot is the one that can break lazy loading. Run:

```bash
npx playwright test e2e/presenter.spec.ts e2e/navigation.spec.ts e2e/click-stages.spec.ts
```

These exercise `await import('./deck-help.js')` and friends against the flat
`dist/`. Expected: same pass count as the lot 0 baseline.

- [ ] **Step 4: Commit**

```bash
git commit -am "refactor(src): the deck engine becomes one module"
```

---

### Lot 6: `layout/` and `structure/`

**Files:**
- `src/layout/`: `deck-cover`, `deck-section`, `deck-feature`, `deck-split`,
  `deck-feature-cards`, `deck-photo`, `deck-takeaway`, `slide-fill`
- `src/structure/`: `deck-bento`, `deck-cell`, `deck-point`, `deck-grid`,
  `grid-tracks`, `deck-stack`, `deck-card`, `deck-source`

- [ ] **Step 1: Move**

```bash
cd rikiki/src && mkdir -p structure
git mv layouts layout
git mv layout/deck-bento.ts structure/
git mv layout/slide-fill.ts layout/slide-fill.test.ts layout/ 2>/dev/null || true
git mv molecules/deck-cell.ts molecules/deck-point.ts molecules/deck-grid.ts structure/
git mv molecules/grid-tracks.ts molecules/grid-tracks.test.ts structure/
git mv molecules/deck-stack.ts molecules/deck-card.ts structure/
git mv atoms/deck-source.ts structure/
```

- [ ] **Step 2: Repoint**

`src/index.ts` (`./layouts/` → `./layout/`, and the 6 tags that moved to
`./structure/`), `../shared-styles.js` paths, and `deck-bento`'s `grid-tracks`
import, which becomes `./grid-tracks.js` now that both are in `structure/`.
`deck-figure` renders `<deck-source>` without importing it — per the skill's
rule that is correct and must stay an un-imported tag; only its comment needs
the new path if it names one.

- [ ] **Step 3: Verify and commit**

```bash
npx playwright test e2e/bento.spec.ts e2e/balance.spec.ts e2e/fill.spec.ts
git commit -am "refactor(src): split the slide frame from what it arranges"
```

---

### Lot 7: `text/` and `data/`

**Files:**
- `src/text/`: `deck-md`, `cards-syntax`, `deck-punch`, `deck-fit`,
  `deck-kicker`, `deck-badge`, `deck-callout`, `deck-quote`, `deck-pull`,
  `deck-annotate`, `annotation-marks`, `deck-agenda`
- `src/data/`: `deck-stat`, `deck-metric`, `deck-csv`, `parse-csv`,
  `deck-tier-list`, `deck-step-list`, `deck-shortcut`, `deck-table`,
  `deck-kpi-grid`, `deck-bar`, `bar-segments`, `deck-checklist`, `deck-timeline`

- [ ] **Step 1: Move** (`git mv` each, sources and their `.test.ts` together)

- [ ] **Step 2: Repoint** `src/index.ts`, `../shared/fit-controller.js` from
`text/deck-fit.ts`, `text/deck-punch.ts` and `data/deck-csv.ts`,
`../shared/icon-set.js` from `data/deck-checklist.ts`, `./cards-syntax.js` from
`text/deck-md.ts`, `./parse-csv.js` from `data/deck-csv.ts`,
`./annotation-marks.js` from `text/deck-annotate.ts`, `./bar-segments.js` from
`data/deck-bar.ts`, `../shared/signature.js` from `data/deck-kpi-grid.ts`.

- [ ] **Step 3: Verify and commit**

```bash
npx playwright test e2e/extras.spec.ts e2e/emphasis.spec.ts
git commit -am "refactor(src): what a slide says, and what it proves"
```

---

### Lot 8: `media/` and the empty directories

**Files:**
- `src/media/`: `deck-code`, `deck-code-highlighter`, `shiki`, `deck-mermaid`,
  `deck-figure`, `deck-graph`, `graph-layout`, `deck-flow`, `deck-icon`,
  `deck-persona`, `deck-versus`
- Move `src/shared-styles.ts` → `src/shared/shared-styles.ts`
- Remove the now-empty `src/atoms/`, `src/molecules/`, `src/extras/`, `src/plugins/`

- [ ] **Step 1: Move, then confirm nothing is left behind**

```bash
cd rikiki/src && mkdir -p media
# ... git mv each file ...
git mv shared-styles.ts shared/
find atoms molecules extras plugins -type f 2>/dev/null   # must print nothing
rmdir atoms molecules extras plugins
ls *.ts                                                    # must print only index.ts
```

- [ ] **Step 2: Repoint** every `../shared-styles.js` → `../shared/shared-styles.js`
(9 consumers), `src/index.ts`, and `media/shiki.ts`'s
`../atoms/deck-code-highlighter.js` → `./deck-code-highlighter.js`.

- [ ] **Step 3: Verify · the whole suite, three engines**

```bash
npm run lint && npm run typecheck && npm run test && npm run build
git diff --stat -- dist                                   # .js: empty
ls dist/*.js | sort | diff /tmp/dist-before.txt -         # only contrast.js removed
npx playwright test                                        # all three engines
```

- [ ] **Step 4: Commit**

```bash
git commit -am "refactor(src): one axis · the tree is a modulith by family"
```

---

### Lot 9: The tree's own guard

**Files:** extend `rikiki/scripts/modulith.test.mjs`.

- [ ] **Step 1: Add the three remaining ADR-004 rules**

```js
const FAMILIES = ['core', 'engine', 'layout', 'structure', 'text', 'data', 'media', 'shared'];

describe('the tree has one axis', () => {
  it('src/ root holds index.ts and nothing else', () => {
    const loose = readdirSync(SRC, { withFileTypes: true })
      .filter((e) => e.isFile() && e.name !== 'index.ts')
      .map((e) => e.name);
    expect(loose, `orphans at src/ root: ${loose.join(', ')}`).toEqual([]);
  });

  it('every directory under src/ is a declared family', () => {
    const dirs = readdirSync(SRC, { withFileTypes: true })
      .filter((e) => e.isDirectory() && e.name !== 'core')
      .map((e) => e.name);
    expect(dirs.sort()).toEqual(FAMILIES.filter((f) => f !== 'core').sort());
  });

  it.each(sources(SRC).filter((f) => familyOf(f) !== 'shared'))(
    '%s imports no other family’s helper',
    (file) => {
      // A component may import another family's COMPONENT. A pure helper is
      // that family's internal · if two families need it, it belongs in
      // shared/, which the rule above keeps honest.
      const mine = familyOf(file);
      const reach = [...readFileSync(file, 'utf8').matchAll(/from '\.\.\/([a-z]+)\/([a-z-]+)\.js'/g)]
        .filter(([, fam, mod]) => fam !== mine && fam !== 'shared' && fam !== 'core' && !mod.startsWith('deck-'));
      expect(reach.map((m) => m[0]), `${file} reaches into another family's internals`).toEqual([]);
    },
  );
});
```

- [ ] **Step 2: Run, then prove each rule bites**

Run: `npx vitest run scripts/modulith.test.mjs` · expected PASS.
Then break each one in turn and confirm the matching failure: `touch src/stray.ts`
(rule 1), `mkdir src/misc && touch src/misc/a.ts` (rule 2), and add
`import { x } from '../data/parse-csv.js'` to a `text/` file (rule 3). Undo each.

- [ ] **Step 3: Commit**

```bash
git commit -am "test(arch): the source tree keeps one axis"
```

---

### Lot 10: Every published `.js` gets its `.d.ts`

`dist/deck-table.js` is typed by `dist/extras/deck-table.d.ts`, so a consumer
importing `rikiki-deck/dist/deck-table.js` resolves no types. Pre-existing,
independent of the move, fixed here because the tree just changed under it.

**Files:** `rikiki/tsconfig.build.json`, a post-build flatten step in
`rikiki/build.mjs`, `rikiki/scripts/packaging.test.mjs`

- [ ] **Step 1: Write the failing guard** in `scripts/packaging.test.mjs`

```js
it('every published module has its declaration beside it', () => {
  const js = readdirSync(DIST).filter((f) => f.endsWith('.js') && f !== 'standalone.js');
  const orphans = js.filter((f) => !existsSync(join(DIST, f.replace(/\.js$/, '.d.ts'))));
  expect(orphans, `no .d.ts beside: ${orphans.join(', ')}`).toEqual([]);
});
```

- [ ] **Step 2: Run it · expected FAIL** listing ~50 files.

Run: `npx vitest run scripts/packaging.test.mjs`

- [ ] **Step 3: Flatten the declarations**

Emit to a staging directory and move the `.d.ts` up, in `build.mjs` after the
`tsc` step, reusing the same duplicate-basename check the JS entry points get.
Then delete the nested declaration directories from `dist/`.

- [ ] **Step 4: Run · expected PASS**, and check the vendor/ and standalone
exclusions are still right. Rebuild, review `git diff --stat -- dist`: the
`.d.ts` move is the whole of it, no `.js` line.

- [ ] **Step 5: Commit**

```bash
git commit -am "fix(types): ship each declaration beside the module it types"
```

---

### Lot 11: The component contract, enforced · ✅ DONE 2026-09-18

Delivered ahead of the tree move, on branch `refactor/component-contract`, and
the guard walks `src/` recursively so it survives lots 4–8 unchanged.

What the execution corrected in this plan:

- **45 component files, not 44.** `deck-kicker` registers with a bare
  `customElements.define`; the first scan only looked for `@customElement`.
  It was the one file with no `declare global` block · fixed.
- **`deck-root`'s step dot** was a real miss → `var(--rik-border-default)`.
  Its blank overlay (`#000`/`#fff`) is excused with a reason.
- **`deck-mermaid`** had three theme variables byte-identical to `--rik-code__*`
  → now read from the theme at init. Three others, and the error colour, are
  excused with measurements (the danger token measures 3.97:1 on siliceum
  against the code surface, under the AA floor).
- The exception marker covers **its line and the block below it up to the next
  blank line**, not a fixed window of lines.
- All six rules were **verified to fail** when broken, one at a time.

**Files:** create `rikiki/scripts/component-contract.test.mjs`

- [ ] **Step 1: Write the guard**

```js
// ADR-004 · one shape per component.
//
// The shape was already universal when this was written · 44 of 44 files on
// each rule below. That is the point: the test does not impose a convention,
// it stops the next file from being the first exception.

const componentFiles = sources(SRC).filter((f) =>
  readFileSync(f, 'utf8').includes('@customElement('),
);
const tagsIn = (src) => [...src.matchAll(/@customElement\('([^']+)'\)/g)].map((m) => m[1]);

describe('every component has the same shape', () => {
  it('has components to check', () => {
    expect(componentFiles.length).toBeGreaterThan(40);
  });

  it.each(componentFiles)('%s opens with a usage header', (file) => {
    const first = readFileSync(file, 'utf8').split('\n')[0];
    expect(first.startsWith('//'), `${file} has no header block`).toBe(true);
  });

  it.each(componentFiles)('%s declares its tags on HTMLElementTagNameMap', (file) => {
    expect(readFileSync(file, 'utf8')).toContain('HTMLElementTagNameMap');
  });

  it.each(componentFiles)('%s styles with `static override styles`', (file) => {
    expect(readFileSync(file, 'utf8')).toContain('static override styles');
  });

  it.each(componentFiles)('%s defines the element it is named after', (file) => {
    const base = file.slice(file.lastIndexOf('/') + 1, -3);
    expect(tagsIn(readFileSync(file, 'utf8')), `${file} defines no <${base}>`).toContain(base);
  });

  it.each(componentFiles)('%s hardcodes no color', (file) => {
    // A named exception is spelled `rikiki:allow-hex <reason>` on the line.
    const bad = readFileSync(file, 'utf8')
      .split('\n')
      .filter((l) => /#[0-9a-fA-F]{3,8}\b/.test(l) && !l.includes('rikiki:allow-hex'));
    expect(bad, `${file} hardcodes a color · use a --rik-* token`).toEqual([]);
  });
});

describe('every registered tag is documented', () => {
  const reference = readFileSync(resolve(PKG_DIR, 'docs/llms/rikiki-reference.md'), 'utf8');
  const tags = componentFiles.flatMap((f) => tagsIn(readFileSync(f, 'utf8')));

  it.each(tags)('<%s> appears in the LLM reference', (tag) => {
    expect(reference, `<${tag}> is registered but undocumented`).toContain(tag);
  });
});
```

- [ ] **Step 2: Run · expected two failures only**, both hex:
`media/deck-mermaid.ts` and `engine/deck-root.ts`.

- [ ] **Step 3: Read each of the two and decide**

If the color is genuinely outside the token system (mermaid's own theme config
object, the letterbox repaint), add `rikiki:allow-hex <reason>` on the line. If
it is a token that was inlined, replace it with the `--rik-*` variable. Do not
add the exception comment without reading what the value is for.

- [ ] **Step 4: Run · expected PASS, and prove it bites**

Add a `#ff0000` to any component, confirm the failure names it, remove it.

- [ ] **Step 5: Commit**

```bash
git commit -am "test(component): hold the component contract with a guard"
```

---

### Lot 12: The contract rules that needed work first

**12a · Props documented in their own header** · ❌ **DROPPED 2026-09-18.**

The premise was wrong. `scripts/component.test.mjs` already checks every
declared attribute against its catalogue entry, with a reasoned exception
list, and it was green. The 83 properties were documented where this project
decided documentation lives · they were only absent from the file headers.
Adding this gate would have created a third copy of the same information and a
third thing to keep in sync. The steps below are kept for the record; do not
execute them.

~~27 files, 83 properties.~~

- [ ] **Step 1: Write the guard, disabled with a countdown**

```js
// Every declared property is documented in the file's own header block.
// `doc-code-parity` as a test rather than a review habit.
it.each(componentFiles)('%s documents every property it declares', (file) => {
  const src = readFileSync(file, 'utf8');
  const header = src.split('\n').filter((l, i, a) => a.slice(0, i).every((p) => p.startsWith('//'))).join('\n');
  const props = [...src.matchAll(/@property\([^)]*\)\s*(?:override\s+)?(?:accessor\s+)?([a-zA-Z_]+)/g)].map((m) => m[1]);
  const missing = props.filter((p) => {
    const kebab = p.replace(/([A-Z])/g, '-$1').toLowerCase();
    return !new RegExp(`\\b(${p}|${kebab})\\b`, 'i').test(header);
  });
  expect(missing, `${file} declares undocumented props: ${missing.join(', ')}`).toEqual([]);
});
```

- [ ] **Step 2: Run · expected FAIL on 27 files, 83 props.** Record the list.

- [ ] **Step 3: Document them, one file per `Edit`**, in the header's existing
style: the attribute name, a `·`, and what it does. Read the property's CSS
selector or its use in `render()` to write what is true, never a guess from the
name. Re-run after each file; the count must fall monotonically.

- [ ] **Step 4: Commit** `docs(component): document every declared property`

**12b · Every registered tag is rendered by a fixture** · ✅ **DONE 2026-09-18.**

The gap was **13 tags, not 7** — the first count again missed the
`customElements.define` registrations, and searched a wider deck set than the
guard actually reads. The thirteen: `deck-badge`, `deck-feature-cards`,
`deck-kbd`, `deck-kicker`, `deck-metric`, `deck-metric-list`, `deck-photo`,
`deck-shortcut`, `deck-shortcut-list`, `deck-source`, `deck-tier`,
`deck-tier-arrow`, `deck-tier-list`.

The guard now reads `registeredElements()` minus `NOT_IN_CATALOGUE` instead of
`src/extras/`, and matches on a tag boundary — `<deck-tier` was being satisfied
by `<deck-tier-list`, which is how two of the thirteen hid. Coverage comes from
`decks/tests/core-catalogue.html`. Verified red without it (13 failures) and
green with it.

The feared budget failures did not happen: the new deck passes `slide-budget`
and `a11y`, and `ink.spec.ts` turned out to measure four named decks rather
than the whole directory, so it never sees it.

- [ ] **Step 5: Generalise the existing guard.** `scripts/component.test.mjs:157`
reads `src/extras/` literally — replace `EXTRAS_DIR` with the registered-tag
list from `component-surfaces.mjs`, so the check covers core and opt-in alike.
Search `decks/tests/`, `decks/example/` **and** `site/public/decks/`.

- [ ] **Step 6: Run · expected FAIL naming the 7.**

- [ ] **Step 7: Add the fixture slides.** One slide per missing tag in
`decks/tests/` — extend `extras.html` for the two-element families
(`deck-tier-list`/`deck-tier`/`deck-tier-arrow`, `deck-metric-list`/`deck-metric`)
so each renders in a real composition, not in isolation.

- [ ] **Step 8: Run · expected PASS.** Then `npx playwright test` — the new
fixtures are now measured by `e2e/slide-budget.spec.ts` and `e2e/ink.spec.ts`,
and a clipping slide fails there. Fix the slide, not the threshold.

- [ ] **Step 9: Commit** `test(fixtures): render every component in a deck`

---

### Lot 13: The generator, pinned to the gates

**Files:** create `rikiki/scripts/new-component.mjs`,
`rikiki/scripts/new-component.test.mjs`; modify `rikiki/package.json`,
`rikiki/.claude/skills/rikiki-component/SKILL.md`

- [ ] **Step 1: Write the generator's test first**

```js
// The template and the gates are pinned to each other here.
//
// A scaffold that stops producing conforming code is worse than none: the
// contributor copies it, the guard fires, and the fix goes into the file
// instead of the template. So the generator's output is run through the
// contract guard itself.
it('generates a component that passes every contract rule', () => {
  const dir = mkdtempSync(join(tmpdir(), 'rikiki-gen-'));
  execFileSync('node', [GENERATOR, 'text', 'deck-probe', '--into', dir]);
  const file = join(dir, 'src/text/deck-probe.ts');
  const src = readFileSync(file, 'utf8');

  expect(src.split('\n')[0].startsWith('//')).toBe(true);
  expect(src).toContain('HTMLElementTagNameMap');
  expect(src).toContain('static override styles');
  expect(src).toContain("@customElement('deck-probe')");
  expect(src).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  expect(src).not.toContain('—');            // the dash linter
  expect(readFileSync(join(dir, 'decks/tests/deck-probe.html'), 'utf8')).toContain('<deck-probe');
});

it('refuses a family that is not one', () => {
  expect(() => execFileSync('node', [GENERATOR, 'misc', 'deck-probe'])).toThrow();
});

it('refuses a tag that already exists', () => {
  expect(() => execFileSync('node', [GENERATOR, 'text', 'deck-md'])).toThrow();
});
```

- [ ] **Step 2: Run · expected FAIL**, generator does not exist.

- [ ] **Step 3: Write `scripts/new-component.mjs`**

Arguments: `<family> <deck-tag> [--opt-in] [--into <dir>]`. It validates the
family against the `FAMILIES` list from `modulith.test.mjs`, refuses a tag that
is already registered, then writes: the component from the contract template
(header block, `@customElement`, `static override styles` with the token
comment, one `@property` documented in the header, `render()` with a `part=`,
`declare global`), a fixture slide in `decks/tests/`, and — unless `--opt-in` —
the `import './<family>/<tag>.js';` line in `src/index.ts` under its family
section. It prints the two things it cannot do: the reference entry to write in
`docs/llms/rikiki-reference.md`, and `npm run build`.

- [ ] **Step 4: Run · expected PASS.**

- [ ] **Step 5: Wire it up and check it end to end**

Add `"new:component": "node scripts/new-component.mjs"` to `package.json`.
Then really run it, inside the repo:

```bash
npm run new:component -- text deck-probe
npm run lint && npm run typecheck && npx vitest run scripts/
git checkout -- src/index.ts && rm src/text/deck-probe.ts decks/tests/deck-probe.html
```

Every guard must pass on the generated file before it is deleted. That is the
claim the generator makes, verified rather than asserted.

- [ ] **Step 6: Rewrite the skill**

`.claude/skills/rikiki-component/SKILL.md` currently documents the three-axis
tree this plan removed. Rewrite: families instead of buckets, `npm run
new:component` as step 1, the guards named as what will fail and where. Keep
the two rules the measurements confirmed still matter: the un-imported nested
tag, and the em-dash.

- [ ] **Step 7: Commit**

```bash
git commit -am "feat(scripts): generate a component that already conforms"
```

---

### Lot 14: Release 0.8.0

- [ ] **Step 1: Full suite, three engines, from a clean build**

```bash
cd rikiki && npm run clean && npm run build
npm run lint && npm run typecheck && npm run test && npx playwright test
git diff --exit-code -- dist     # must be clean after a from-scratch rebuild
node scripts/release-smoke.mjs
```

- [ ] **Step 2: Update the docs the move invalidated**

`rikiki/README.md` (the source layout section), `CONTRIBUTING.md`,
`docs/llms/rikiki-workflow.md` — search for `atoms/`, `molecules/`, `extras/`,
`runtime/` and fix every path. `npx vitest run scripts/published-docs.test.mjs`
checks part of this.

- [ ] **Step 3: CHANGELOG for 0.8.0**

Three entries, written for a consumer, not a contributor: `dist/contrast.js` is
gone (build-time code, never part of the API); every `dist/*.js` now has its
`.d.ts` beside it, so subpath imports are typed; no other published change.

- [ ] **Step 4: Bump and ask before tagging**

```bash
npm run bump -- 0.8.0
```

Stop here. The tag and the publish are the user's call · v0.7.0 failed at
`npm ci` and the recovery was a fresh 0.7.1 cut from `main`, so the release is
run deliberately, not as the tail of a refactor.

---

## Self-review

**Spec coverage.** ADR-004's tree decision → lots 1–9. `shared/` rule → lot 3.
Opt-in as data → lots 5, 8, 12b (the last literal `src/extras/` reader).
`dist/` flat + typed → lots 0, 8, 10. The four enforced rules → lots 3 and 9.
The component contract table → lots 11 (5 green-on-arrival rules), 12a (props),
12b (fixtures). `part=` and dead props → explicitly refused in the ADR, no task.
Generator → lot 13. Skill rewrite → lot 13 step 6.

**Ordering risk.** Lot 3's guard lands before the moves it polices, so lots 4–8
are checked as they go. Lot 11's contract guard lands after the moves, because
`sources(SRC)` walks whatever tree exists — running it earlier would pass just
as well, but the two-failure expectation in step 2 is written against the final
paths.

**Known gap.** Lot 12b's new fixtures feed `e2e/ink.spec.ts` and
`e2e/slide-budget.spec.ts`, which measure real rendering. Seven components that
no deck has ever rendered may well fail a budget on first sight. That is the
guard doing its job, and the fix belongs in the slide or the component · step 8
says so explicitly rather than leaving the executor to discover it.
