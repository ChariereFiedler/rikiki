# OSS readiness — checklist

Status of the work needed to publish rikiki as a credible open-source project.
Tick items as they land. Severity: **P0** blocker · **P1** expected · **P2** nice.

Analysis date: 2026-09-09. The v1.0 release pass has completed; remaining
architecture items are deliberately post-release work.

## Lot 1 · Truth (P0 — wrong docs kill credibility)

- [x] `LICENSE` copyright name corrected to **Cédric Chariere Fiedler** (was the
      typo "Chartier"). Fixed in both root `LICENSE` and `rikiki/LICENSE`.
- [x] `rikiki/package.json` gained an `author` field.
- [x] Root `README.md` rewritten against the **real** API: dropped the phantom
      `<deck-hero>` / `<deck-hero-detail>` / `<deck-hook>` for the real layouts
      `deck-cover/section/feature/split/feature-cards/takeaway/photo`.
- [x] Root `README.md` navigation section fixed: linear default, 2D opt-in
      (`nav="2d"`), mouse on by default.
- [x] `CONTRIBUTING.md` fixed: real clone URL, correct `cd rikiki/rikiki`,
      working example links, decorator-based "Adding a component".
- [x] `examples/rikiki-tour/` — the **root** copy already holds a rich, valid
      deck (real components, correct paths). Removed the stray empty duplicate
      `rikiki/examples/rikiki-tour/`. (Analysis had checked the wrong copy.)
- [x] Root `README.md` registered as a version surface (exact stamp + historical)
      in `rikiki/scripts/version-surfaces.mjs`; `bump-version` SKILL updated.

## Lot 2 · Guardrails (P1 — contributor safety net)

- [x] Linter + formatter via **biome**, scoped to `src/` + `scripts/`
      (`rikiki/biome.json`, `npm run lint` / `format`). Adopted + applied.
- [x] CI `package-check` job for `rikiki/`: `typecheck` + `lint` + `test`, in
      the cheap `check` stage. Today the suite runs in CI, not just locally.
- [x] Playwright render net (`e2e/`): smoke over every fixture deck + a
      navigation contract spec + a scaling regression spec. Page object,
      state-based waits, console-error capture (granit-golem discipline). Wired
      into CI as the `e2e` job (official Playwright image).

## Lot 3 · OSS hygiene files (P1)

- [x] `CODE_OF_CONDUCT.md` — Contributor Covenant 2.1 by reference (short form).
- [x] `SECURITY.md` — disclosure policy + private contact.
- [x] `.gitattributes` — `rikiki/dist/** linguist-generated`, EOL normalized,
      bundled examples marked generated.
- [x] GitLab templates: `.gitlab/issue_templates/{Bug,Feature}.md` +
      `.gitlab/merge_request_templates/Default.md`. *(CODEOWNERS: optional,
      single maintainer — skipped.)*
- [x] README badges (npm version, license, zero-build) on the published README.
- [x] `AUTHORS` file.

## Lot 4 · Publication (P1)

- [x] **Decision: host.** Stays on `gitlab.com/tordu-jardin/rikiki` — no public
      GitLab/GitHub mirror. The OSS surface is the **public npm package**
      (`rikiki-deck`); the repo stays self-hosted. ⇒ templates use GitLab format
      (`.gitlab/`), publish CI runs from the tordu-jardin runner.
- [x] `npm publish` automation: tag-triggered GitLab `publish-npm` job in a new
      `release` stage; `prepublishOnly` rebuilds `dist/` and runs the test suite
      so a stale/ drifted tag fails before publishing. Needs the masked
      `NPM_TOKEN` CI variable. *(npm provenance via GitLab OIDC left as a future
      enhancement — needs `id_tokens` config.)*

## Lot 5 · Architecture & modularity (P2 — do behind tests)

- [ ] **Post-1.0:** Split `runtime/deck-root.ts` (808 lines, too many roles): extract
      `hash-router`, `nav-controller`, keyboard input, pointer/wheel input.
- [ ] **Post-1.0:** Reassess `runtime/deck-overview.ts` (681) and `plugins/click-stages.ts` (517).
- [x] Decide the `dist/` strategy: keep committed (document the "zero-build"
      promise loudly) **or** build in release CI. At minimum the `.gitattributes`
      generated-marker above so diffs/language-stats collapse it.
- [x] Render coverage via the Playwright net (smoke + navigation + scaling).
      Pure-logic unit tests will land WITH the deck-root split (test-first).
- [ ] **Post-1.0:** Tidy internal process artifacts: `rikiki/docs/superpowers/` and
      `.claude/skills/` — keep for transparency but file under `docs/design/`.

## Lot 6 · Repo shape (P2)

- [ ] **Post-1.0:** Declare npm workspaces across root / `rikiki/` / `site/` so the CI shim
      `rikiki-monorepo` becomes a real workspace root (`npm -w rikiki test`).
