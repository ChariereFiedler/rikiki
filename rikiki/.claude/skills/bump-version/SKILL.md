---
name: bump-version
description: Use when cutting a new rikiki release — bumping the version across the npm package, CHANGELOG, site, docs and demo decks, then verifying everything is in sync. Triggers on "bump version", "cut a release", "release rikiki", "new rikiki version", "prepare release".
---

# Bumping a rikiki release

**CI proposes releases on its own** (`release:propose`, see `docs/RUNBOOK.md` →
Release): it runs this same bump on a `release/next` branch and opens the MR
`chore(release): vX.Y.Z`. Use this skill to improve that MR's notes and docs
(push to its branch · CI then leaves it alone), or to cut a release by hand
when CI is down.

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
- `CHANGELOG.md` (repo root). The site page `changelog.astro` renders it, so it
  needs no edit.

## Checklist

Create a todo per step and do them in order.

1. **Pick the version.** Semver from the nature of the changes (breaking → major,
   feature → minor, fix → patch). Confirm with the user.
2. **Run the CLI:** `npm run bump <version>` (add `--date=YYYY-MM-DD` only to
   override today). It rewrites the exact surfaces, opens a dated `CHANGELOG.md`
   section and reopens an empty `[Unreleased]`.
3. **Write the release notes.** Read `git log $(git describe --tags --abbrev=0)..HEAD`
   and fill the new `CHANGELOG.md` section (Added / Changed / Fixed). The site
   changelog page renders this file, nothing to mirror.
4. **Evolve the docs for the new features.** A release is not just a version
   bump — bring the user-facing docs up to date with what shipped: the package
   `README.md` and the **root `README.md`** (TL;DR, component lists, navigation),
   `llms.txt`, and `docs/llms/rikiki-reference.md`. Cross-check `CONTRIBUTING.md`
   if the contributor workflow changed. Add new tags/attributes/behaviours; leave
   `since X` / `pre-X` historical notes untouched. The `rikiki v…` stamps were
   already bumped by the CLI (both READMEs carry one).

**Language:** all user-facing release content — `CHANGELOG.md`, the site, the
`README.md`, `llms.txt`, and the reference — is written in **English**, even when
the working conversation is in French. Do not let French slip into these files.
5. **Per-release reminders** (see below) — apply any that match this version.
6. **Verify:** `npm test`. It must be green. Fix any red surface and re-run.
   Then `npm run typecheck` if any TypeScript changed.
7. **Commit.** Stage the bump + notes. Ask the user before committing (global
   pref). Message: `chore(release): vX.Y.Z` (`release` is not an allowed commit
   type). Do not tag by hand · merging to `main` runs `release:tag`, and
   publishing is the manual `publish-npm` job on the tag pipeline.

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
