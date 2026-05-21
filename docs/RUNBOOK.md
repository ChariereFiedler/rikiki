# Rikiki · Operations Runbook

Operating procedures for the live deployment at https://rikiki.tordu-jardin.fr.

## Stack at a glance

| Concern | Value |
|---------|-------|
| Git repo | https://gitlab.com/tordu-jardin/rikiki |
| Default branch | `main` (push-protected, Maintainers only) |
| CI template | `tordu-jardin/cloud:ci/deploy-static.gitlab-ci.yml` |
| Image registry | `registry.tordu-jardin.fr/rikiki` |
| Tags published | `:latest` (mutable) and `:<commit-short-sha>` (immutable) |
| Orchestrator | Portainer · stack `rikiki` (id 54), endpoint 1 |
| Reverse proxy | traefik · routes `Host(rikiki.tordu-jardin.fr)` to port 80 |
| TLS | Let's Encrypt via the platform's `letsencrypt` resolver |
| Public assets host | nginx 1.27-alpine inside the container |

## Pipeline stages

`check` → `build` → `deploy` (all on `main`).

- **check · lint** runs `npm run lint` (em-dash linter + `astro check`) before the Docker build. Fail-fast on type errors or style violations.
- **build · build-image** generates the Dockerfile, runs `npm run build` inside (which delegates to `cd site && npm ci && npm run build && node ../scripts/post-build-inline-lit.mjs`), tags the image as `:latest` + `:<sha>`, and pushes both with `docker buildx build --push`.
- **deploy · deploy** asks Portainer to redeploy the stack with `PullImage: true, ForceRecreate: true`.
- **deploy · smoke-test** curls the live URL after redeploy to verify the home, docs and assets respond 200 and the `index.js` no longer references jsdelivr for `marked`.

## Rollback

### Quick rollback (recommended)

```sh
# from anywhere with TJ_* secrets sourced
./scripts/rollback.sh <short-sha>
```

The script:
1. Pulls `registry.tordu-jardin.fr/rikiki:<short-sha>`
2. Retags it as `:latest` and pushes
3. Calls the Portainer API to redeploy the stack with `PullImage`+`ForceRecreate`
4. Appends a `# rolled-back to <sha> at <timestamp>` marker to the compose to force Portainer's diff (same workaround the regular deploy job uses)

Verify with `curl -I https://rikiki.tordu-jardin.fr/` · HTTP/2 200 means traefik is routing again. The smoke-test CI job is *not* re-run by a rollback · run it manually if you need the assertions.

### Required env vars

```
TJ_REGISTRY            registry.tordu-jardin.fr
TJ_REGISTRY_USER       <user>
TJ_REGISTRY_PASSWORD   <token>
TJ_PORTAINER_URL       https://portainer.tordu-jardin.fr
TJ_PORTAINER_KEY       <api key>
```

These are the same secrets the CI job uses · they live in the group-level CI/CD settings of `tordu-jardin`.

### Finding the SHA to roll back to

```sh
# Last 10 deploys, newest first
git log --oneline -10 main
# Or via the GitLab API:
curl -s -H "PRIVATE-TOKEN: $GITLAB_TOKEN" \
  "https://gitlab.com/api/v4/projects/82405490/pipelines?status=success&per_page=10" \
  | jq -r '.[] | "\(.sha[:8])  \(.created_at)  \(.web_url)"'
```

Pick the previous "success" pipeline's SHA. Each successful build pushed `<short-sha>` as an immutable tag · use the short form (first 8 chars).

## When the deploy fails

Two failure modes the CI distinguishes:

| What failed | Where to look | Fix |
|-------------|---------------|-----|
| `lint` | `npm run lint` output in the CI job log | Fix the .astro / em-dash locally, push again |
| `build-image` | `docker buildx build` output · usually an npm/Astro error | Reproduce locally with `npm run build` from the repo root |
| `deploy` | Portainer API response (HTTP code + body) | Check the Portainer UI · stack may be in a broken state. Manual recreate from compose works |
| `smoke-test` | URL probe failures in the job log | Deploy already happened · roll back with `scripts/rollback.sh <previous-sha>` |

## Reading the live state

```sh
# Container health from Portainer
curl -sk -H "X-API-Key: $TJ_PORTAINER_KEY" \
  "https://portainer.tordu-jardin.fr/api/endpoints/1/docker/containers/rikiki-site/json" \
  | jq '.State | {Status, Health: .Health.Status, StartedAt}'

# nginx logs (last 50 lines)
curl -sk -H "X-API-Key: $TJ_PORTAINER_KEY" \
  "https://portainer.tordu-jardin.fr/api/endpoints/1/docker/containers/rikiki-site/logs?stdout=true&stderr=true&tail=50"

# Live response headers
curl -skI https://rikiki.tordu-jardin.fr/
```

## Manual stack update (compose change without code change)

The CI's `deploy` job re-uses the compose already stored in Portainer · it does not push the compose from git. To roll out a `docker-compose.cloud.yml` change you must update the stack directly:

```sh
COMPOSE=$(cat docker-compose.cloud.yml)
COMPOSE="$COMPOSE" python3 -c "
import json, os
print(json.dumps({
  'StackFileContent': os.environ['COMPOSE'],
  'Env': [],
  'Prune': False,
  'PullImage': True,
}))" > /tmp/stack.json

curl -sk -X PUT \
  -H "X-API-Key: $TJ_PORTAINER_KEY" \
  -H "Content-Type: application/json" \
  --data @/tmp/stack.json \
  "https://portainer.tordu-jardin.fr/api/stacks/54?endpointId=1"
```

(Followed by `git commit docker-compose.cloud.yml` so the repo stays the source of truth.)

## Known gotchas

- **localhost in healthchecks**: Alpine wget tries IPv6 first; nginx listens IPv4 only. Always use `127.0.0.1` in healthcheck `test:` for this stack.
- **First deploy after creating the stack**: Portainer will reject `ForceRecreate: true` if the compose string is byte-identical to the cached one; the deploy job appends a timestamp marker. The rollback script does the same.
- **CSP and `marked`**: `dist/index.js` from the framework imports `marked@12` from cdn.jsdelivr.net. The platform CSP blocks it. The `post-build-inline-lit.mjs` step downloads marked at build time, vendors it under `/rikiki/dist/vendor/marked.js`, and rewrites the URL in the bundle. If you upgrade the framework and the script's URL pattern changes, fix the regex there.
- **Single environment**: there is no staging. Local dev (`npm run dev` in `site/`) is the validation environment. Push to `main` lands directly in production.
