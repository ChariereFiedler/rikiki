# OSS readiness — checklist

Status of the work needed to publish rikiki as a credible open-source project.
Tick items as they land. Severity: **P0** blocker · **P1** expected · **P2** nice.

Analysis date: 2026-06-12.

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
- [ ] *(deferred)* Automated render smoke test (Playwright over
      `decks/tests/*.html`) wired into CI. Needs a browser image on the
      tordu-jardin runner — scoped as its own follow-up, not bundled into the
      cheap check stage.

## Lot 3 · OSS hygiene files (P1)

- [ ] `CODE_OF_CONDUCT.md` (Contributor Covenant).
- [ ] `SECURITY.md` (disclosure policy + contact).
- [ ] `.gitattributes` — `rikiki/dist/** linguist-generated`, normalized EOL.
- [ ] Issue / MR (or PR) templates + `CODEOWNERS`. *(host-dependent — see Lot 4)*
- [ ] README badges (version, license, CI status).
- [ ] `AUTHORS` or a credits section.

## Lot 4 · Publication (P1)

- [x] **Decision: host.** Stays on `gitlab.com/tordu-jardin/rikiki` — no public
      GitLab/GitHub mirror. The OSS surface is the **public npm package**
      (`rikiki-deck`); the repo stays self-hosted. ⇒ templates use GitLab format
      (`.gitlab/`), publish CI runs from the tordu-jardin runner.
- [ ] `npm publish` automation: tag-triggered GitLab job, `prepublishOnly`
      rebuilds `dist/`, npm provenance via `NPM_TOKEN`. Stop hand-publishing
      (0.3.1 shipped untagged).

## Lot 5 · Architecture & modularity (P2 — do behind tests)

- [ ] Split `runtime/deck-root.ts` (808 lines, too many roles): extract
      `hash-router`, `nav-controller`, keyboard input, pointer/wheel input.
- [ ] Reassess `runtime/deck-overview.ts` (681) and `plugins/click-stages.ts` (517).
- [ ] Decide the `dist/` strategy: keep committed (document the "zero-build"
      promise loudly) **or** build in release CI. At minimum the `.gitattributes`
      generated-marker above so diffs/language-stats collapse it.
- [ ] Component unit/render test coverage (currently only `version.test.mjs`).
- [ ] Tidy internal process artifacts: `rikiki/docs/superpowers/` and
      `.claude/skills/` — keep for transparency but file under `docs/design/`.

## Lot 6 · Repo shape (P2)

- [ ] Declare npm workspaces across root / `rikiki/` / `site/` so the CI shim
      `rikiki-monorepo` becomes a real workspace root (`npm -w rikiki test`).
