# Rikiki · Operations

Site live · https://rikiki.tordu-jardin.fr · Portainer stack `rikiki` (id 54).

## Pipeline

`check → build → deploy` on every push to `main`.

- `lint` · em-dash linter + `astro check`
- `build-image` · generates the Dockerfile, builds with `docker buildx build --push`, tags both `:latest` and `:<short-sha>`
- `deploy` · asks Portainer to redeploy with `PullImage` + `ForceRecreate`
- `smoke-test` · curls the home, docs and bundle in `:deploy` after the deploy job
- `mirror-check` · starts at once, fails (without blocking anything) if GitHub's `main` has not caught up with this commit within ten minutes
- `release:propose`, `release:tag` · see below

## Release

CI proposes, a human validates twice. Design: `docs/superpowers/specs/2026-10-02-release-and-mirror-design.md`.

1. **Proposed** · after a green `main` pipeline, `release:propose` reads the commits since the last `vX.Y.Z` tag. `feat` gives a minor, `fix`/`perf` a patch, a breaking change a minor while `0.x`. If there is anything to release it rebuilds the `release/next` branch (`npm run bump`, an empty `[Unreleased]` filled from the commit subjects) and opens or updates the MR `chore(release): vX.Y.Z`. Edit that MR freely: once a human has pushed to it, CI leaves it alone and only says, in the `release:propose` log, that `main` moved on. Rebase it, or close it and the next pipeline proposes again.
2. **Validation 1 · merge the MR.** The next `main` pipeline runs `release:tag`, which creates `vX.Y.Z`. It never moves an existing tag.
3. **Validation 2 · publish.** The tag pipeline runs every gate, then waits on the manual `publish-npm` job: press play in the pipeline view. It refuses a version already on npm. `release:gitlab` then creates the GitLab Release from the CHANGELOG section.

To force a version, run a pipeline on `main` by hand (Build → Pipelines → Run pipeline) with the variable `RELEASE_VERSION=x.y.z`; it must be greater than the last tag.

Credentials:

- `RELEASE_TOKEN` · a personal access token of the owner, dedicated to this use (`rikiki-release`, `api` + `write_repository`, one-year expiry), masked and protected · protected variables reach only `main` and `v*` tag pipelines, never a fork's MR. CI commits under the git author `rikiki release (CI)`, which is how it tells its own release MR from one a human has edited.
- **No npm token.** npm trusted publishing: on npmjs.com, `rikiki-deck` trusts the GitLab project `tordu-jardin/rikiki`, the CI file `.gitlab-ci.yml` and the environment `npm`. `publish-npm` proves its identity with an OIDC token (`NPM_ID_TOKEN`) and npm signs provenance. npm accepts that proof only from GitLab.com shared runners: they are enabled on the project, `publish-npm` is the only job tagged for them (`saas-linux-small-amd64`), and `default: tags: [self-hosted]` keeps every other job on the self-hosted runner.
- `v*` tags are protected.

## GitHub mirror

GitLab is the source of truth; a push mirror (Settings → Repository → Mirroring repositories) sends `main` and the tags to `github.com/ChariereFiedler/rikiki`, authenticated by a deploy key with write access on the GitHub side. GitHub's `ci.yml` replays the checks as a second signal and publishes nothing.

The mirror pushes, it does not delete: a tag removed on GitLab stays on GitHub until it is removed there by hand (`git push github --delete <tag>`). Release tags are never removed, so this only matters for a mistake.

A red `mirror-check` means GitHub is behind: read the mirror's last error in the mirroring settings. The usual causes are a revoked deploy key and a host key GitLab no longer trusts (edit the mirror, **Detect host keys**).

## Rollback

```sh
# Source TJ_REGISTRY_USER / TJ_REGISTRY_PASSWORD / TJ_PORTAINER_URL / TJ_PORTAINER_KEY
./scripts/rollback.sh <short-sha>
```

The script pulls the image tagged with `<short-sha>` (every build pushes one), retags it as `:latest`, pushes, and asks Portainer to recreate the stack with `PullImage` + `ForceRecreate`. Verify with `curl -I https://rikiki.tordu-jardin.fr/`.

Find the SHA to roll back to:

```sh
git log --oneline -10 main
```

## Known gotchas

- **healthcheck on `localhost`** · nginx listens on 0.0.0.0:80 only and Alpine wget tries IPv6 first. Use `127.0.0.1` in `docker-compose.cloud.yml`.
- **CSP and `marked`** · the framework's `dist/index.js` imports `marked@12` from `cdn.jsdelivr.net`, which the platform CSP blocks. `scripts/post-build-inline-lit.mjs` runs after the Astro build to vendor marked at `/rikiki/dist/vendor/marked.js` and rewrite the URL in the bundle. If the framework changes that import, fix the regex there.
- **Single environment** · no staging. Local dev (`npm run dev` in `site/`) is the validation environment.
