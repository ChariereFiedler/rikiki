# Version bump skill + consistency tests

**Date:** 2026-06-12
**Status:** approved
**Target release using this tooling:** 0.4.0

## Problem

A rikiki release touches the version in many scattered places: the npm
package, the root `CHANGELOG.md`, the Astro site, the demo decks, and the LLM
docs. Today these drift — at design time the package was `0.3.1` while the site
changelog and the demo deck still said `0.3.0`. Nothing catches this.

We want (1) a deterministic way to bump every "current version" surface at once
and (2) tests that fail when any surface is out of sync, so a release can't ship
half-bumped.

## Key distinction: `exact` vs `historical` surfaces

Some version mentions are the **current** version and must move every release.
Others are **historical** facts that must never move:

- `README.md`, `llms.txt`, `docs/llms/rikiki-reference.md` say things like
  "on by default since 0.3.0" / "pre-0.3 behavior". These document *when* a
  feature landed. Bumping them would be a lie.

So surfaces are classified:

- **`exact`** — must equal the current package version.
- **`historical`** — may contain older versions; invariant is only that no
  mentioned version *exceeds* the current one (catches a typo like `0.9.0` or a
  reference to an unreleased version), while leaving `since X` notes intact.

### Versioned docs (doc stamp)

The docs themselves must declare which release they document, so a doc that
falls behind is caught. Each doc surface carries a single explicit stamp using
the sigil **`rikiki v<version>`** (note the `v`):

- `llms.txt` — version on the `# Rikiki` title line.
- `docs/llms/rikiki-reference.md` — a stamp line under the title.
- `README.md` — a stamp line near the top.

The `v` sigil disambiguates the stamp (current version, an `exact` capture) from
historical body mentions like `since 0.3.0` (no `v`, scanned as `historical`).
A doc file therefore appears in **both** lists: its `rikiki v…` stamp must equal
the current version, and its body must mention no version greater than current.
The site is versioned through its changelog section header (already covered).

## Architecture

Repo layout reminder: git root is `<repo>`; the npm package
lives in `rikiki/`; the Astro site in `site/`; the changelog at the root.

### 1. Shared manifest — `rikiki/scripts/version-surfaces.mjs`

A single module, imported by both the CLI and the tests, exporting:

- `PACKAGE_JSON` — path to the source-of-truth `rikiki/package.json`.
- `readCurrentVersion()` — reads that version.
- `EXACT` — array of `{ file, find }` where `find` is a RegExp with one capture
  group per version occurrence that must equal the current version. Covers:
  - `rikiki/package-lock.json` (top-level `version` fields)
  - `rikiki/decks/tests/demo.html` anchors (`speaker`, `.accent` span, `kicker`)
  - doc stamps (`rikiki v<version>`) in `llms.txt`, `docs/llms/rikiki-reference.md`,
    `README.md`
- `HISTORICAL` — array of `{ file }` scanned for any `\d+\.\d+\.\d+`; none may
  exceed current. Covers `README.md`, `llms.txt`,
  `docs/llms/rikiki-reference.md`.
- `CHANGELOG` / `SITE_CHANGELOG` — paths + helpers to locate the current
  version's section header and its date.

Paths are resolved relative to the git root so both tools agree.

### 2. CLI — `rikiki/scripts/bump-version.mjs` (`npm run bump <version>`)

Deterministic edits only — never writes release prose:

1. Validate the new version is greater than current (semver).
2. `package.json` + `package-lock.json` → new version.
3. `CHANGELOG.md`: rename `## [Unreleased]` → `## [X.Y.Z] - <today>`, insert a
   fresh empty `## [Unreleased]` above it.
4. `site/src/pages/docs/changelog.astro`: insert a stub
   `<h2 id="vXYZ">X.Y.Z · <today></h2>` at the top of the list (bullets left for
   the human/skill to fill).
5. Demo decks: rewrite the `exact` anchors to the new version.

Today's date is passed in / read from the system at run time (not hard-coded).

### 3. SKILL — `rikiki/.claude/skills/bump-version/SKILL.md`

Orchestrator the user invokes for a release. Checklist:

1. Run `npm run bump <version>`.
2. Write the release notes: read `git log <last tag>..HEAD`, fill the new
   `CHANGELOG.md` section and mirror it into the site changelog stub.
3. Review `README.md` / `llms.txt` / `reference.md` for prose that genuinely
   needs updating (new features) — but leave `since X` notes alone.
4. Run `npm test` (the consistency tests) and fix anything red.
5. Prepare the release commit (ask before committing, per global prefs).

The SKILL also carries a per-release reminder list — e.g. for 0.4.0, add
`llms.txt` + `docs/llms` to `package.json` `files`.

### 4. Tests — `rikiki/scripts/version.test.mjs` (Vitest)

Add `vitest` devDependency and a `test` script. Cases:

- every `EXACT` surface's captures all equal the current version
- every `HISTORICAL` surface mentions no version greater than current
- `CHANGELOG.md` has a `## [X.Y.Z] - <date>` section for the current version,
  and `[Unreleased]` holds no frozen version line
- `site/.../changelog.astro` mentions the current version (catches the live
  0.3.0-vs-0.3.1 drift)
- demo-deck anchors equal the current version

The first `npm test` run is expected to fail against the current drift; running
the bump to 0.4.0 makes it green — that is the acceptance signal.

## Out of scope

- Auto-generating the site changelog HTML from `CHANGELOG.md` (the CLI only
  inserts a header stub; prose stays human-written).
- Git tagging / npm publish automation.
- Bumping dependency versions.

## Testing strategy

TDD: write `version.test.mjs` + the manifest first (red against current drift),
then the CLI, then bump to 0.4.0 to reach green.
