---
name: bump-version
description: Use when cutting a new rikiki release — bumping the version across the npm package, CHANGELOG, site, docs and demo decks, then verifying everything is in sync. Triggers on "bump version", "cut a release", "release rikiki", "new rikiki version", "prepare release".
---

# Bumping a rikiki release

A release version lives in many scattered places. The CLI `npm run bump` handles
the deterministic edits; you handle the prose; the Vitest suite proves nothing
drifted. Work from `rikiki/` (the npm package dir).

## What the version touches

The single source of truth is `rikiki/package.json`. Every other surface is
listed in `scripts/version-surfaces.mjs` — the same manifest the tests read:

- **`exact`** — must equal the current version: `package-lock.json`, the demo
  deck anchors (`decks/tests/demo.html`), and the `rikiki v<version>` doc stamps
  in `llms.txt`, `docs/llms/rikiki-reference.md`, `README.md`.
- **`historical`** — prose like "on by default since 0.3.0". Never bump these;
  the tests only forbid mentioning a version *newer* than the current release.
- `CHANGELOG.md` (repo root) and `site/src/pages/docs/changelog.astro`.

## Checklist

Create a todo per step and do them in order.

1. **Pick the version.** Semver from the nature of the changes (breaking → major,
   feature → minor, fix → patch). Confirm with the user.
2. **Run the CLI:** `npm run bump <version>` (add `--date=YYYY-MM-DD` only to
   override today). It rewrites the exact surfaces, opens a dated `CHANGELOG.md`
   section, reopens an empty `[Unreleased]`, and stubs a site changelog section.
3. **Write the release notes.** Read `git log $(git describe --tags --abbrev=0)..HEAD`
   (note: tags can lag — cross-check against the previous `CHANGELOG.md` entry).
   Fill the new `CHANGELOG.md` section (Added / Changed / Fixed) and mirror it
   into the `<ul>` stub the CLI left in `changelog.astro`, replacing the TODO.
4. **Evolve the docs for the new features.** A release is not just a version
   bump — bring the user-facing docs up to date with what shipped: `README.md`
   (TL;DR, component tables, navigation, the relevant sections), `llms.txt`, and
   `docs/llms/rikiki-reference.md`. Add new tags/attributes/behaviours; leave
   `since X` / `pre-X` historical notes untouched. The `rikiki v…` stamp was
   already bumped by the CLI.

**Language:** all user-facing release content — `CHANGELOG.md`, the site, the
`README.md`, `llms.txt`, and the reference — is written in **English**, even when
the working conversation is in French. Do not let French slip into these files.
5. **Per-release reminders** (see below) — apply any that match this version.
6. **Verify:** `npm test`. It must be green. Fix any red surface and re-run.
   Then `npm run typecheck` if any TypeScript changed.
7. **Commit.** Stage the bump + notes. Ask the user before committing (global
   pref). Suggested message: `release(rikiki): X.Y.Z`. Consider tagging
   `vX.Y.Z` — note v0.3.1 shipped untagged, so tags currently lag reality.

## Per-release reminders

One-off tasks tied to a specific upcoming release. Tick off and remove once done.

- **0.4.0** — ship the LLM docs in the npm package: add `llms.txt` and
  `docs/llms` to the `files` array in `package.json` so the reference installs
  with `npm install rikiki-deck`.

## If a test fails

The failure names the surface. Common cases:

- *"expected '0.3.0' to be '0.4.0'"* on a demo deck anchor → the CLI's regex
  didn't reach a hand-edited string; fix it and re-add it to `EXACT` in
  `version-surfaces.mjs` so it's covered next time.
- *site changelog has no section* → you skipped step 3's mirror.
- *historical surface mentions unreleased version* → a typo'd or premature
  version reference in the prose docs.

When you add a brand-new version surface (a new doc, a new deck that shows the
version), register it in `scripts/version-surfaces.mjs` so both the CLI and the
tests cover it.
