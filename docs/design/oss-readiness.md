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

---

## Second pass · 2026-09-19

Re-audited against the state of the tree rather than against the list above,
which was written on 2026-09-09 and had drifted. Everything below was
measured, not assumed.

### What was wrong, and is now fixed

- **Two shipped security advisories.** `npm audit --omit=dev` reported none,
  which is exactly the blind spot: mermaid and its dompurify are **vendored**
  into `dist/vendor/` and published, where audit cannot see them. Prototype
  pollution in mermaid's config APIs and a DOMPurify hook bypass, both closed
  by non-major bumps (10.9.6 → 10.9.8, 3.4.9 → 3.4.15). The guard in
  `packaging.test.mjs` that pins the vendored version to the declared one is
  what caught the lockfile-only half of the fix.
- **A licence notice went missing on the bump** and the inventory printed
  `NOTICE MISSING — release review required` rather than shipping a gap. The
  review was done for real: v10.9.8's LICENSE fetched and compared byte for
  byte with v10.9.6's.
- **89 absolute paths from the maintainer's machine**, and a client name, in
  six tracked files. Neutralised.
- **Docs described a source tree that no longer exists** (ADR-004). README,
  CONTRIBUTING, five site pages and two skills corrected.

### What was verified rather than claimed

- **A fresh clone builds and passes.** `git clone` → `npm ci` → `npm run
  build` → `npm run typecheck` → `vitest run`: 1210 tests green, and
  `git diff -- dist` empty, so the committed `dist/` is reproducible from a
  clean checkout by someone who is not the maintainer.
- **The published artifact works as installed.** `scripts/release-smoke.mjs`
  packs, installs into a temp workspace and drives the CLI to a PDF.
- **No secret anywhere in history** (scan over all refs, excluding generated
  bundles, for AWS keys, private keys, Stripe/GitLab/GitHub tokens).
- **Production dependencies: zero.** Nothing to audit, nothing to break.

### What remains, and why it is not done

- **Five dev-only advisories** need major bumps of vitest, vite and esbuild.
  They reach no consumer. A major toolchain bump is its own piece of work with
  its own regression surface, not a line in a release checklist.
- **The history still holds** the absolute paths and the client name, in the
  init commit among others. Purging means `git filter-repo`, which is worth
  its blast radius only if the repository is actually made public · today's
  decision (Lot 4) is that the OSS surface is the **npm package** and the repo
  stays on `gitlab.com/tordu-jardin`. **If that decision changes, this becomes
  a P0 and must happen before the repo is flipped.**
- **`dist/index.js` carries ~7.7 KB gzip of components a typical deck never
  uses** · 34 registered in the barrel against 5 to 14 written on a real
  deck. Removing any of them is a breaking change for existing decks. The
  non-breaking answer is an additional `dist/auto.js` entry that scans the DOM
  and imports only the tags present, which the flat `dist/` and the family
  split now make straightforward. Own ADR, own release.
- **npm workspaces** (Lot 6) still open. The root `rikiki-monorepo` shim is
  the first thing a visitor's `npm install` meets.
