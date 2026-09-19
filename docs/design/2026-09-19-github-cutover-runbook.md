# Cutover · GitHub as the source of truth, GitLab as the deployment

**Status**: prepared, not executed · 2026-09-19

Reverses the hosting decision in `oss-readiness.md` lot 4 ("no public mirror,
the OSS surface is the npm package"). The package was already public and MIT;
what changes is that the **repository** becomes public, on GitHub, while the
site keeps deploying from GitLab where the registry, the Portainer stack and
the self-hosted runners live.

## Why this shape

The CI turned out to be almost free of secrets already. Only two jobs need a
credential:

| job | needs |
|---|---|
| `build-image` | `TJ_REGISTRY`, `TJ_REGISTRY_USER`, `TJ_REGISTRY_PASSWORD` |
| `publish-npm` | `NPM_TOKEN` |

Everything else — `lint`, `package-check`, `e2e`, `site-release-check`,
`nginx-release-check` — already ran on public images with no variable at all.
So the split is not a rewrite, it is a move.

**`rules:` is not isolation.** It stops a job from running; it does not stop
anyone from reading the registry host, the stack name, the variable names and
the `include:` of the private `tordu-jardin/cloud` template. Only moving the
file out of the public tree does that, which is why the deployment config
leaves the repository entirely and the history rewrite removes it from the
past as well.

**Publishing moves to GitHub, and gains something.** `oss-readiness.md` lists
npm provenance as a future enhancement blocked on GitLab `id_tokens`. GitHub
Actions issues that OIDC token natively, so the same publish now signs a
verifiable link between the tarball and the commit. For a package with zero
dependencies, that is the most valuable thing a consumer can be given.

## Where everything ends up

| | GitHub Actions | GitLab |
|---|---|---|
| lint, typecheck, unit tests | `ci.yml` | — |
| e2e, three engines | `ci.yml` | — |
| `dist/` and examples drift | `ci.yml` | — |
| site build + nginx image | `ci.yml` | — |
| image build and registry push | — | ✅ |
| Portainer redeploy | — | ✅ (private template) |
| smoke test on the live URL | — | ✅ |
| npm publish | `publish.yml`, **with provenance** | removed |

GitLab receives only `main` and release tags, pushed by `mirror.yml` **after
CI passes**, so it runs on an already-verified commit and does not pay for the
three-engine suite twice.

## Prepared, in this repository

- `.github/workflows/ci.yml` · the check suite a contributor sees
- `.github/workflows/mirror.yml` · pushes `main` and tags to the deployment
  remote. The remote URL is a secret, not a literal, for the same reason the
  deploy config moves out.
- `.github/workflows/publish.yml` · tag-triggered publish with provenance,
  and a guard that the tag matches `package.json`

## Prepared, outside this repository · `~/lab/rikiki-cutover/`

Deliberately not committed. `rewrite-history.sh` lists exactly what was
scrubbed, so publishing it would undo the scrubbing; `gitlab-deploy.yml` is
the topology itself.

- `gitlab-deploy.yml` → a **private** repo. Point the GitLab project at it via
  *Settings → CI/CD → CI configuration file*
  (`rikiki/deploy.gitlab-ci.yml@tordu-jardin/cloud`).
- `rewrite-history.sh` → run on a clone. Backup bundle first, census before
  and after, and it **fails** if anything survives. It pushes nothing.
- `rikiki-before-rewrite.bundle` → the way back. `git clone` it.

### Dry run, 2026-09-19

Run against `main` at `fd5a0e3`, and verified rather than trusted:

| check | result |
|---|---|
| absolute paths left in history | 0 |
| mentions of the client | 0 |
| commits touching the removed topology | 0 |
| author identities | **1** |
| tags carried over | v0.3.0 … v0.7.0 |
| files at the tip | 612 → 609 |
| **file contents changed at the tip** | **0** |

And the rewritten repository was not merely inspected, it was **used**: cloned
fresh, `npm ci`, typecheck, **1226 tests**, `npm run build` with no `dist`
drift, and the site builds with its links resolving. Removing three files from
every commit broke nothing, which is what the earlier check ("no test or
script reads them") predicted and this confirms.

The last row is the one that matters: the only difference at the tip is the
three intended removals. Every other blob is byte-identical, so the text
replacements touched history and nothing else.

**Eight commits disappear**, all legitimately: seven touched only the CI or
the deploy files, and the eighth is the commit that neutralised the paths in
the working tree · the rewrite does globally what it did locally, so its diff
becomes empty. Verified one by one, by subject.

**The client's deck was never committed.** Checked against every path that
ever existed in history: no `js-loading/` file was tracked, so no deliverable
is in there. What was in there was the *mention* · a `.gitignore` comment, a
few planning docs, one commit subject.

**Replacing the name was not enough.** The `.gitignore` comment read
`Local-only client deck, not part of the OSS project`, and the middleware plus the product identify a studio as precisely
as its name does to anyone in that industry. Renaming to "client" would have
published the same fact in two words instead of one. All three go, and the
census now counts all three · a first pass reported "0 mentions" while the
line was still sitting there.

`.cloud/nginx.conf` and `.cloud/site-check.Dockerfile` are **kept**, and the
script fails if they are not: they describe how the static site is served and
how that is checked, hold nothing internal, and `ci.yml` builds that image.
An earlier draft removed all of `.cloud/` and would have broken the public CI
it was written alongside.

## Order, and why it is this order

1. **Merge every open MR first.** An MR against a history about to be
   rewritten cannot be rebased onto it.
2. **Rewrite on a clone**, keep the backup bundle, read the result. The
   original repository is untouched at this point, and remains the fallback.
3. **Create the GitHub repository private**, push the rewritten history,
   recreate the tags, let `ci.yml` run, then *look at what is visible*.
   Reviewing a private repository costs nothing and is the last cheap moment.
4. **Flip to public** only after that review.
5. **Repoint GitLab last**: force-push the rewritten history, set the external
   CI config path, delete nothing by hand (the rewrite already removed the
   deploy files), and restrict write access to the mirror token alone.

## Docs that go stale the day of the cutover

No test or script reads the three removed files · checked. Only prose refers
to them, and it must be corrected in the same change rather than left to rot:

- `docs/RUNBOOK.md` and `.claude/skills/ci-pipeline-orchestration/SKILL.md`
  describe a GitLab pipeline that will no longer hold the checks.
- `rikiki/.claude/skills/rikiki-component/SKILL.md` points a contributor at
  `.gitlab-ci.yml` for the `dist/` drift guard, which moves to `ci.yml`.

## What breaks, and what it costs

- **Every commit SHA changes.** Verified before planning this: the CHANGELOG
  contains **no** commit or tag link, and npm provenance is not yet enabled,
  so no published artifact references a SHA. The cost is recreating the tags
  `v0.3.0`…`v0.7.0` and re-cloning locally. That is all.
- **Existing clones must be re-cloned.** There is one.
- **The first mirror push is a force push**, since the histories diverge.
  Every push after it is a fast-forward.

## Decided

- **The public contact is `chariere.fiedler.cedric@gmail.com`**, everywhere:
  `SECURITY.md` and `CODE_OF_CONDUCT.md` already said so, and `AUTHORS` and
  the npm `author` field now agree. A reporter reading the package page and a
  reporter reading the repository reach the same inbox.

## Still open

- **Author identities in the history.** Three of them, and the commits are
  authored as `chariere.fiedler.cedric@gmail.com` while the package now names the personal
  address · the inconsistency moved rather than disappeared. Normalising
  rewrites the authorship of every commit and pairs naturally with the history
  rewrite; a `.mailmap` fixes only the display and touches nothing. The
  rewrite script deliberately does neither, so this stays a decision.
