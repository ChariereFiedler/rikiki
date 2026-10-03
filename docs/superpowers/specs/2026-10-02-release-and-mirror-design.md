# Release proposed by CI, validated twice · GitHub as an exact mirror

**Status**: approved design · 2026-10-02

## Context

- GitLab (`tordu-jardin/rikiki`, public) is the source of truth: merges,
  merge requests, issues and the site deployment happen there. External
  contributors fork it.
- GitHub (`ChariereFiedler/rikiki`) used to receive a rewritten history,
  replayed by hand. The last replay was eleven days late, and nothing said so.
  The history was purged on 2026-10-02 and both forges now hold the same
  commits, so there is no rewrite left to replay.
- Two workflows published to npm on a `v*` tag: `publish-npm` on GitLab and
  `.github/workflows/publish.yml`. 0.7.2 left from GitLab; a lone push of the
  never-published `v0.7.0` tag to GitHub would have published it.
- A release today is a hand-run sequence: `npm run bump`, CHANGELOG prose,
  commit, tag, push. Nothing proposes it, so releases lag behind `main`.

## Goals

1. GitHub always holds what GitLab's `main` and tags hold, and a gap is
   visible within one pipeline.
2. CI proposes the next release on its own; a human validates twice: once on
   the content (a merge request), once on the publication (a manual job).
3. Exactly one place publishes to npm.

Out of scope: moving issues or contributions to GitHub, changing the site
deploy.

**Revised 2026-10-03** during implementation, see §2 Credentials: no bot
identity (project access tokens need Premium; the owner declined a technical
account), and npm trusted publishing instead of an npm token, which brings
provenance back in scope.

## 1 · GitLab pushes, GitHub mirrors

- A **GitLab push mirror** to `ssh://git@github.com/ChariereFiedler/rikiki.git`,
  `auth_method: ssh_public_key`, `only_protected_branches: true` (so `main`),
  `keep_divergent_refs: false`. Created through the API. GitLab generates the
  key pair; its public key is added **once, by hand,** as a write deploy key on
  the GitHub repository · the only step that needs the GitHub web UI.
- Tags reach GitHub through the same mirror. Whether `only_protected_branches`
  also filters tags is verified when the mirror is created; if it does, `v*`
  tags are protected (see §2), which puts them back in scope.
- **Removed from GitHub**: `.github/workflows/mirror.yml` (it pushed the other
  way) and `.github/workflows/publish.yml` (second publisher). `ci.yml` stays:
  it replays the checks on every mirrored `main` and is the contributor-facing
  signal on GitHub. Its header comment is corrected.
- **`mirror-check`** · a job in every `main` pipeline, started at once
  (`needs: []`) since the mirror pushes on the push, not after the pipeline.
  It reads `refs/heads/main` on GitHub anonymously (`git ls-remote`, no
  secret) and polls until it equals `$CI_COMMIT_SHA`, for at most ten
  minutes. If GitLab's own `main` has moved past `$CI_COMMIT_SHA` meanwhile,
  the newer pipeline owns the check and this one exits 0. Otherwise it fails
  with both SHAs and the mirror's `last_error` when the token allows reading
  it. A red `mirror-check` is the alarm; it never blocks the deploy
  (`allow_failure: true`).

## 2 · The release flow

```
merge to main ──► main pipeline green ──► release:propose
                                             │ commits since last tag?
                                             ├─ none ─► exit 0 "nothing to release"
                                             └─ some ─► branch release/next, MR "chore(release): vX.Y.Z"
human merges the MR  (validation 1)
                  ──► main pipeline ──► release:tag ──► tag vX.Y.Z
tag pipeline: every gate ──► publish-npm  (manual · validation 2)
                                   └─► release:gitlab (Release notes from CHANGELOG)
push mirror ──► tag on GitHub (nothing publishes there)
```

### `release:propose` (main pipelines, after every gate)

1. Read the latest `vX.Y.Z` tag reachable from `main` and `package.json`'s
   version. If the version is **greater** than the tag, a release is merged
   but not tagged: do nothing, `release:tag` owns that state.
2. Collect commit subjects since the tag (`--no-merges`) and compute the bump:

   | commits contain | bump |
   |---|---|
   | `!` after the type, or a `BREAKING CHANGE:` footer | minor while `0.x`, major from `1.0.0` |
   | `feat` | minor |
   | `fix`, `perf` | patch |
   | only `docs`, `chore`, `test`, `refactor`, `ci`, `build`, non-conventional | none |

   `RELEASE_VERSION=x.y.z`, set on a manually run pipeline, overrides the
   computation; it must be greater than the tag.
3. If there is nothing to release, exit 0 and say so.
4. If an open MR from `release/next` exists and its head commit was **not**
   authored by the release bot, a human edited it: leave it untouched, say in
   the job log that `main` moved ahead of it (N commits), and exit 0. (A note
   on the MR was the first design; fine-grained tokens cannot write MR notes.)
5. Otherwise rebuild `release/next` from `main`: `npm run bump <version>`; if
   `[Unreleased]` is empty, fill it from the commit subjects (`feat` → Added,
   `fix`/`perf` → Fixed, scope kept, ticket reference kept); commit
   `chore(release): vX.Y.Z` as the bot (`release` is not an allowed commit
   type here, and `chore` never triggers a release of its own); force-push;
   create or update the MR (same title, description: the CHANGELOG section
   and the commit list).

### `release:tag` (main pipelines)

Runs when `package.json`'s version has no tag. Creates `vX.Y.Z` on
`$CI_COMMIT_SHA` through the API. Never moves or recreates an existing tag.

### Tag pipeline

- Every gate `main` runs, unchanged.
- `publish-npm` becomes `when: manual`, `allow_failure: false`. Before
  publishing it checks, in order: the tag equals the manifest (existing check),
  and `npm view rikiki-deck@<version>` finds nothing (new · a version already
  on npm fails with that message instead of npm's 403).
- `release:gitlab`, after `publish-npm` succeeds: creates the GitLab Release
  for the tag with the CHANGELOG section as notes.

### Credentials and protections

- **`RELEASE_TOKEN`**: a personal access token of the owner, dedicated to
  this use (`api` + `write_repository`, one-year expiry), distinct from any
  token used on a workstation, stored as a masked, protected CI variable:
  only `main` and `v*` pipelines read it. Project access tokens would scope it
  to this project, but they need Premium on gitlab.com. MRs appear opened by
  the owner; CI commits under the fixed git author `rikiki release (CI)`
  (`RELEASE_AUTHOR`), which is what "authored by the release bot" means in
  `release:propose` step 4.
- **npm trusted publishing**, no npm token: `rikiki-deck` on npmjs.com trusts
  the project `tordu-jardin/rikiki`, the CI file `.gitlab-ci.yml` and the
  environment `npm`. `publish-npm` carries `id_tokens: NPM_ID_TOKEN` (aud
  `npm:registry.npmjs.org`) and npm signs provenance. npm accepts the OIDC
  proof from GitLab.com shared runners only: they are enabled on the project,
  `publish-npm` alone is tagged `saas-linux-small-amd64`, and
  `default: tags: [self-hosted]` keeps every other job where it runs today.
- **Protected tags `v*`**: creation allowed to Maintainers.

## 3 · Code layout

- `rikiki/scripts/release-plan.mjs` · pure functions, no I/O: parse a commit
  subject, compute the bump, compute the next version, render the Unreleased
  entries from subjects, decide propose / skip / leave-alone from
  (tag, manifest version, commits, MR head author).
- `rikiki/scripts/release-plan.test.mjs` · Vitest, alongside the other
  `scripts/*.test.mjs`.
- `rikiki/scripts/release-ci.mjs` · the I/O shell for the three jobs
  (`propose`, `tag`, `gitlab-release`): git commands, GitLab API calls with
  `fetch`, `--dry-run` that prints the plan and calls nothing. No new
  dependency.
- `.gitlab-ci.yml` · jobs `release:propose`, `release:tag`, `release:gitlab`,
  `mirror-check`; `publish-npm` made manual.

## Error handling

- Missing `RELEASE_TOKEN`, a failed git push or a non-2xx API response fails
  the job with the operation and the HTTP status, never the token.
- A job that finds nothing to do exits 0 with one line saying why.
- `release:propose` failing never blocks the deploy: it runs in the `release`
  stage, after `smoke-test`.

## Verification

- Unit tests for every decision in `release-plan.mjs`, including the 0.x
  breaking rule, an override lower than the tag, a human-edited MR, a release
  merged but not tagged, and subjects that are not conventional.
- `release-ci.mjs propose --dry-run` run locally on the real history before
  any CI change; its output is quoted in the merge request.
- `.gitlab-ci.yml` validated with the GitLab `ci/lint` API.
- End to end, once: the first real proposal is the next release, driven
  through both validations. Two `feat` commits since `v0.7.2` make it 0.8.0.

## Docs updated in the same change

`docs/RUNBOOK.md`, `.claude/skills/ci-pipeline-orchestration/SKILL.md`, the
`bump-version` skill (now the manual fallback, not the default path), and the
header of `.github/workflows/ci.yml`.
