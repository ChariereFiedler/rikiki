# Rikiki · Operations

Site live · https://rikiki.tordu-jardin.fr · Portainer stack `rikiki` (id 54).

## Pipeline

`check → build → deploy` on every push to `main`.

- `lint` · em-dash linter + `astro check`
- `build-image` · generates the Dockerfile, builds with `docker buildx build --push`, tags both `:latest` and `:<short-sha>`
- `deploy` · asks Portainer to redeploy with `PullImage` + `ForceRecreate`
- `smoke-test` · curls the home, docs and bundle in `:deploy` after the deploy job

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
