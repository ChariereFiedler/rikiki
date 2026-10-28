# Ronce Racine for Codex

This directory contains 10 skills selected from Ronce Racine's native Codex
distribution for Rikiki's frontend, testing, review and CI work. `AGENTS.md`
routes the existing shared rules in `.claude/rules/shared/`
and supplies Rikiki's project conventions. No Claude settings or global Codex
configuration were modified, and no hooks were installed.

## Provenance

- Source: local checkout `/home/cedric/lab/ronce-racine`.
- Package version: `0.8.0`.
- Checkout HEAD: `05ef7b2bbcc57732a4f4dc728a3fbadb15675745`.
- Installation date: 2026-10-28.
- The Codex adapter and skill adaptations were uncommitted in that checkout.
  The HEAD and package version alone therefore do not reproduce this snapshot.
  The committed copies under `skills/` are the portable project snapshot.

The adapter copies each skill and its distributed resources, excluding evaluation
fixtures and tests. It moves the canonical top-level `version` into
`metadata.version` and includes `agents/openai.yaml`. It does not install rules,
hooks, Claude agents, or a Codex lockfile. The existing
`.claude/.ronce-racine.json` continues to track only the Claude rule installation.

## Maintenance

The source adapter supports these commands, run from its checkout:

```sh
node_modules/.bin/tsx install.ts plan /home/cedric/lab/rikiki --agent codex
```

Substitute the checkout paths on another machine. This command was verified
against the local source above; do not assume the published 0.8.0 CLI includes
the uncommitted Codex adapter. Its install command installs all 36 skills and
does not support selecting a subset. For updates, install into a temporary
directory, compare the ten retained skill directories, then review and copy
the intended changes. A strict full-catalog check against this project will
report the deliberately omitted skills as missing.

The initial full installation passed a strict comparison and an idempotent
second installation before narrowing the selection. Every retained file was
then compared with the source distribution, including the version metadata
transformation. No installed workflow was customized.

Skills are available for Codex discovery in a new project session. In an existing
session they can be read explicitly by path. This installation does not provide
Ronce's Claude event hooks, automatic memory injection or command enforcement.
