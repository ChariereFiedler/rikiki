# ADR 004 · One axis for the source tree · a modulith by family

**Status**: proposed · 2026-09-18 · targets 0.8
**Scope**: `rikiki/src/**` (76 source files) and the guards that hold it.
**Extends**: ADR-001, whose layering is kept unchanged and moved under `src/core/`.

## Context

`src/` sorts its files on **three incompatible axes at the same level**:

| Axis | Directories | Criterion |
|---|---|---|
| Layer | `domain/` `application/` `infrastructure/` `runtime/` | dependency direction |
| Size | `atoms/` `molecules/` `layouts/` | visual granularity |
| Distribution | `extras/` `plugins/` | in `index.ts`, or opt-in |
| None | `shared/` + 3 root files | — |

A contributor adding `deck-thing` gets three answers at once and no rule.

Four measurements say this is not a cosmetic complaint.

**1 · The atomic hierarchy has no dependency reality.** Across the whole import
matrix there is not one `molecules → atoms` edge, and not one
`layouts → molecules` edge. The buckets never compose each other; they share
only `shared/` and `shared-styles`. The hierarchy classifies, it does not hold.

**2 · `shared/` is a locker room for single-consumer modules.** Six of eleven
have exactly one importer, in another directory:

```
graph-layout      <- extras/deck-graph.ts        cards-syntax <- molecules/deck-md.ts
bar-segments      <- extras/deck-bar.ts          parse-csv    <- molecules/deck-csv.ts
annotation-marks  <- extras/deck-annotate.ts     contrast     <- nobody, at runtime
```

ADR-001 already named this — *"`shared/` is a bag of pure helpers with no
boundary"* — and rejected putting the domain in it. It then kept growing.

**3 · One feature spans three directories.** The bento is
`layouts/deck-bento` + `molecules/deck-cell` + `molecules/deck-point` +
`molecules/deck-grid` + `shared/grid-tracks`. ADR-003 records three failed
attempts on exactly that group: the four files that jointly decide one sizing
constraint are never side by side. Same shape for the fit
(`shared/fit-controller` + `molecules/deck-fit` + `atoms/deck-punch` +
`molecules/deck-csv`).

**4 · The documentation already routed around the tree.** The component
catalogue carries the comment *"Ordered by theme rather than by source folder"*
and groups every component under **Text, Data, Structure, Media**. The
user-facing taxonomy exists, it is maintained by hand, and the source tree
contradicts it.

Two further facts decide how safe the move is:

- `dist/*.js` is **flat** (`entryNames: '[name]'`, and `build.mjs` throws on a
  duplicate basename). Moving a source file changes no published `.js`. There
  is no public API surface to this decision.
- `dist/**.d.ts` is **not** flat (`rootDir: ./src`). `dist/deck-table.js` is
  typed by `dist/extras/deck-table.d.ts`, so a consumer importing
  `rikiki-deck/dist/deck-table.js` resolves no types at all. That is a
  pre-existing defect, independent of this ADR, and this is the moment to fix
  it rather than move it.

## Decision

**One axis: the family a component serves.** `src/` is a modulith of six
modules plus the ADR-001 core, and a module owns the pure helpers only it uses.

```
src/
  core/        domain/ application/ infrastructure/   · ADR-001, moved, unchanged
  engine/      what pilots the deck · deck-root and the chrome around it
  layout/      the frame of a whole slide
  structure/   how blocks are arranged inside a slide
  text/        what a slide says
  data/        what a slide proves
  media/       what a slide embeds or draws
  shared/      only what ≥2 families use
  index.ts     the entry point and the opt-in manifest
tools/         build-time code · not published
```

### What lands where

| Module | Files |
|---|---|
| `core/` | `domain/{navigation,deck-link,deck-outline,viewport}`, `application/{deep-link,keymap,mouse-nav}`, `infrastructure/browser-location` |
| `engine/` | `deck-root`, `deck-transition`, `deck-overview`, `deck-presenter`, `deck-notes`, `deck-help`, `color`, `livereload`, `click-stages` |
| `layout/` | `deck-cover`, `deck-section`, `deck-feature`, `deck-split`, `deck-feature-cards`, `deck-photo`, `deck-takeaway`, `slide-fill` |
| `structure/` | `deck-bento`, `deck-cell`, `deck-point`, `deck-grid`, `grid-tracks`, `deck-stack`, `deck-card`, `deck-source` |
| `text/` | `deck-md`, `cards-syntax`, `deck-punch`, `deck-fit`, `deck-kicker`, `deck-badge`, `deck-callout`, `deck-quote`, `deck-pull`, `deck-annotate`, `annotation-marks`, `deck-agenda` |
| `data/` | `deck-stat`, `deck-metric`, `deck-csv`, `parse-csv`, `deck-tier-list`, `deck-step-list`, `deck-shortcut`, `deck-table`, `deck-kpi-grid`, `deck-bar`, `bar-segments`, `deck-checklist`, `deck-timeline` |
| `media/` | `deck-code`, `deck-code-highlighter`, `shiki`, `deck-mermaid`, `deck-figure`, `deck-graph`, `graph-layout`, `deck-flow`, `deck-icon`, `deck-persona`, `deck-versus` |
| `shared/` | `escape-html`, `fit-controller`, `icon-set`, `signature`, `shared-styles` |
| `tools/` | `contrast` |

`grid-tracks` goes to `structure/` and `slide-fill` to `layout/` because every
one of their consumers is already there · they were never shared. The five that
stay in `shared/` are the five with consumers in **two different families**,
which is the rule below.

### Four rules, each enforced by a test

The point of ADR-001 was that a comment does not defend a boundary. The same
applies here, or the tree drifts back within two releases.

1. **A module imports another module's files, never another module's helper.**
   Cross-module imports are allowed between components; a pure helper is a
   module internal.
2. **`shared/` holds only what ≥2 families import.** A helper that falls back to
   one consumer moves in with it. This is the rule that makes the locker room
   impossible to refill.
3. **`src/` root holds `index.ts` and nothing else.** No orphan may accumulate.
4. **Nothing under `src/` exists only for the build.** Build-time code lives in
   `tools/` and is not published.

`core/` keeps every rule ADR-001 already enforces, unchanged.

### Opt-in becomes data, not a directory

`extras/` conflated "opt-in" with "kind of component". `src/index.ts` already
*is* the core manifest — `scripts/component-surfaces.mjs` derives the core
element list by parsing its imports, and the opt-in list as "registered, but
not core". Both stay correct after the move at no cost, because neither reads a
directory. Only `scripts/component.test.mjs` reads `src/extras/` literally, and
it is repointed at the derived list.

`plugins/` disappears for the same reason: `shiki` extends the code component
and lives in `media/`, `click-stages` extends navigation and lives in
`engine/`. Being opt-in is a distribution trait, which the manifest records.

### `dist/` keeps its shape, and gains its types

`dist/*.js` stays flat, byte-for-byte identical through the whole move. The
declarations are flattened to match it, which fixes the mismatch above: every
`dist/X.js` gets its `dist/X.d.ts` beside it, and a test asserts the pairing.

## Second decision · one shape per component, generated and enforced

Moving files gives a tree a contributor can read. It does nothing about the
other half: **every component already has the same shape, and nothing says so.**
The shape is written in `.claude/skills/rikiki-component/SKILL.md` — header
comment showing the intended HTML, `@customElement`, `static override styles`
with a token comment, `--deck-*` knobs defaulting to `--rik-*`, `part=` on
structural nodes, `declare global` tag map, an entry in
`docs/llms/rikiki-reference.md`, a fixture that renders it. A skill is read by
whoever thinks to read it.

Measured against the 44 component files, the convention is real and mostly
honoured, which is what makes it enforceable now rather than aspirational:

| Rule | Conformance when measured | Outcome |
|---|---|---|
| Leading `//` header block | 45/45 | gate, green on arrival |
| `declare global` tag map | 44/45 | gate · one file fixed, see below |
| `static override styles` | 45/45 | gate, green on arrival |
| File defines the tag it is named after | 45/45 | gate, green on arrival |
| Tag documented in the LLM reference | 59/59 tags | gate, green on arrival |
| No literal hex in styles | 43/45 | gate with a named-exception comment |
| Rendered by at least one fixture deck | **13 tags rendered by nothing** | gate + one fixture deck |
| Declared props documented | already enforced elsewhere | **no new gate** · see below |
| `part=` on structural nodes | 21/45 | **not** a gate · needs taste, see below |

Two of those rows changed under measurement, and the corrections are the
interesting part.

**45 files, not 44.** The first count scanned for `@customElement`, which
misses `deck-kicker` · it registers with a bare `customElements.define`, a
distinction `scripts/component.test.mjs` already had a comment about. Counting
both registration styles found the one file with no `declare global` block,
which is exactly the kind of gap a rule that ratifies 44/44 is supposed to
surface. It now has one.

**Property documentation needed no new gate at all.** The first reading — 27
files, 83 undocumented properties — measured the wrong thing. Every declared
attribute is *already* checked, by `scripts/component.test.mjs`, against its
catalogue entry, with a reasoned per-attribute exception list. The 83 were
documented where this project decided documentation lives; they were simply
not repeated in the file header. A gate demanding that repetition would have
created a third copy of the same information, and a third thing to keep in
sync. Dropped.

`part=` stays out. A component with no structural wrapper legitimately has
none, and a test that cannot tell the two apart teaches contributors to add
`part="wrapper"` to silence it. Same reasoning as ADR-003's refusal to
threshold the ink centroid: a test that encodes taste gets worked around.

The dead-property check is also refused, after being written and measured. Ten
apparent orphans survived the CSS-selector pass, and every one is a real
cross-element read — `deck-graph` reads `from`/`to`/`at` off its children's
attributes. A gate with a 100 % false-positive rate on its remaining findings
is a gate that gets disabled.

### What the two colour exceptions turned out to be

Both were read before being excused, and neither was a lazy hardcode.

`deck-root`'s blank overlay paints `#000` and `#fff`: blanking a projector is
not a theme decision, and the room goes to true black whatever the deck is
wearing. Excused. Its step dot was a genuine miss and is now
`var(--rik-border-default)`, matching the active dot on the line below it.

`deck-mermaid` was the interesting one. Three of its seven mermaid theme
variables were **byte-identical to `--rik-code__*` in both shipped themes** — a
hand-copy of the token values, one theme change away from drifting, in a
project whose contrast figures are measured rather than copied precisely to
avoid this. Mermaid takes concrete colours and not CSS variables, so the fix is
to read the tokens from the theme at init; an unresolved token now drops the
key instead of falling back to a second copy. The remaining three describe a
diagram's own geometry, which no token covers, and stay excused.

Its error message is excused with a measurement rather than an opinion:
`--rik-status-danger__text` is a paper colour and measures **4.92:1 on rikiki
and 3.97:1 on siliceum** against the code surface, under the 4.5 AA floor,
where the current red measures 6.93:1. Substituting the token would have been
an accessibility regression dressed as token discipline.

### The fixture gap was twice the size it looked

`scripts/component.test.mjs` had the right guard — *"an extras component that
appears in no fixture is checked by nothing at all"* — pointed at
`src/extras/`. So the opt-in half was held and the core half never was:
**thirteen core elements had shipped without being written on a single slide**,
which means the render nets that measure `decks/tests/` — slide budget, ink,
a11y — had never once looked at them.

The guard now reads the element registry instead of a directory, so it cannot
lose coverage again when a bucket moves, which is precisely what the family
move above does to `src/extras/`. `decks/tests/core-catalogue.html` renders the
thirteen in real compositions rather than as specimens, because a component
that only ever renders alone has its spacing against a neighbour still
unmeasured.

### The generator is the enforcement's other half

A gate tells a contributor they are wrong after the fact. `npm run new:component
<family> <deck-tag>` writes a component that is right to begin with: the source
file from the contract template, its registration in `src/index.ts` or the
opt-in manifest, a fixture slide in `decks/tests/`, and the reference entry
stub. One flag, `--opt-in`, decides which manifest it lands in.

The generator and the gates are pinned to each other by one test: it runs the
generator into a temporary directory and asserts the output **passes every
gate**. Neither can drift from the other without a red test, which is the
failure mode that makes scaffolding rot — a template that no longer produces
conforming code, and a contributor who copies it anyway.

`.claude/skills/rikiki-component/SKILL.md` is rewritten to point at the
generator first and to describe the buckets as families, since it currently
documents the three-axis tree this ADR removes.

## Rejected alternatives

- **Keep the three axes, document them.** The catalogue comment is that
  document, and it was written *because* the tree could not be used. Writing it
  down a second time changes nothing that a contributor does.
- **One directory per component (60 of them).** Removes the taxonomy debate and
  replaces it with sixty one-file directories, no shared vocabulary with the
  docs, and no place for the helper two components share.
- **Invent a fresh family taxonomy.** The catalogue's Text/Data/Structure/Media
  is already maintained, already user-facing, and already the words the
  reference uses. A second vocabulary would need a glossary to reconcile them.
- **Mirror `dist/` on the new tree.** `deck-root` dynamically imports
  `./deck-help.js` and the bundle is served from `/rikiki/dist/`; a nested
  `dist/` 404s those at runtime. `build.mjs` documents this at length. Flat
  stays.
- **Do it in one commit.** 76 files, a committed `dist/`, and 235 browser tests.
  One commit spends the whole safety net at once and makes a bisect useless.

## Consequences

- A contributor has one question to answer, and the answer matches the word the
  docs already use for the component.
- `shared/` shrinks from 11 modules to 5, and cannot refill without a red test.
- The published package loses `dist/contrast.js` (build-time code, undocumented,
  never imported by the runtime) and gains a `.d.ts` for every `.js`. Both are
  noted in the 0.8 changelog.
- Eleven commits and a large `git mv` diff to review · mitigated by `dist/*.js`
  being provably unchanged, which makes each lot's review a source-only read.
