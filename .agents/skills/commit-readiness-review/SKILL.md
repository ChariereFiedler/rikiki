---
name: commit-readiness-review
description: Use before any agent-initiated git commit - "ready to commit", "commit that", "quick commit", "prêt à commit", "commit ça", "vite un commit", time pressure to ship, diff containing test/debug leftovers or touching multiple stacks.
metadata:
  version: "1.1.0"
  last-reviewed: 2026-09-22
  category: process
---

# Commit Readiness Review - self-review before committing

> If the current repo has a project-specific pre-commit skill, it wins - it knows the exact commands.

## Runtime compatibility (Codex / Claude Code)

Use this workflow in the current agent. Named MCP tools are examples of capabilities: use the available equivalent or report the missing evidence. Delegate only when the host permits it and the user authorizes it; otherwise perform the scoped steps sequentially. No external plugin or Claude hook is required.

Resolve local resources relative to this SKILL.md, sibling skills in the parent skills directory, and project commands/output paths in the target repository. Use the user's request as arguments; do not assume slash-command variables exist. Read only relevant references. Project-specific skills and host instructions take precedence.

An audit or diagnosis stays read-only: instructions below to fix, publish tickets/comments, retry CI, deploy, stage or commit apply only when those actions are authorized. Otherwise return findings or drafts and the required next decision. Never treat missing tools or skipped checks as successful evidence.

Superpowers references are optional: use the matching installed skill when available. Otherwise apply its method in the current agent: clarify requirements, reproduce and isolate bugs, or use the red → green → refactor test loop. A skill reference does not authorize delegation.

## This skill vs. others

- **This skill** when: an agent-initiated commit is imminent - "commit that", "ready to commit", a diff with debug leftovers or touching several stacks, time pressure
- **`validating-features-end-to-end`** instead if: the question is "does it work" (functional proof), not "is it committable"
- **The repo's git skill** if it exists: the project's branch/message/tracker conventions win over this generic checklist

## Context to gather (before acting)

- `git status` + `git diff --stat`: real scope, stacks touched, at-risk files
- Per-stack format/lint/typecheck/test commands (`package.json` / `Makefile` / CI config)
- The repo's message format: `git log --oneline -5`
- The associated ticket (number to put in `Closes #` if the convention requires it)

## Principle

- **Before the commit, never after** - no catch-up via `--amend` once pushed
- **Time pressure does not change the checklist** - a committed secret costs a key rotation + history purge, not a revert
- Targeted scope: check what changed, not the whole suite

## Workflow

1. **Map the diff**: `git status` + `git diff --stat`. Identify the stacks touched (each extension → its checks) and at-risk files (`.env`, `*.pem`, `*.key`, credentials) → immediate STOP if present.
2. **Secret scan** on the content. Two levels:
   - **Dedicated tool if available** (preferred, fewer false negatives): `gitleaks protect --staged --redact` on the staged diff, or `gitleaks detect --no-git --redact` on the tree. If it is not installed, do not block on it - fall back to the grep below.
   - **Fallback grep**: `git diff HEAD | grep -qiE "(password|api[_-]?key|secret|token|sk_live|ghp_|glpat-|AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----)\s*[:=]?"` (exit status only, no secret output) plus at-risk files `git diff --name-only HEAD | grep -iE "\.env|\.pem|\.key|credentials|secret"`.
   - Any detection = show the path and a redacted finding to the user and wait for their decision. "It's just for debugging" is not an exception. False positive: exclude it ad hoc with a `gitleaks:allow` comment on the line, or systemically via the allowlist of a repo-level `.gitleaks.toml` config - never by loosening the global scan.
   - Follow the repository’s secret-handling policy if present. Never echo the raw value. If a credential was exposed, request revocation/rotation; deleting the line alone does not revoke it. Do not install tools, change allowlists or rewrite history without authorization.
3. **Per touched stack, in order format → lint → typecheck → targeted tests** (commands: `package.json` scripts, `Makefile`, repo conventions). Test the changed scope only; the full suite is for before push.
4. **Problematic patterns in the diff** (added lines only):
   - hardcoded waits in tests (`waitForTimeout`, `sleep`)
   - debug leftovers (`console.log`, `print(`, `dbg!`, `debugger`)
   - `TODO`/`FIXME` added → track in a ticket or remove
   - disabled tests (`.skip`, `xit`, `#[ignore]`) with no justification
5. **Only when preparing an authorized commit, stage file by file** - never a blind `git add -A`/`git add .`. Verify each staged file belongs to the change.
6. **Summary + confirmation**: files, check results (real ✅/❌, not assumed), proposed message in the repo format (`git log --oneline -5` for the format). Ask for confirmation before `git commit` unless an autonomous mode is explicitly active.

## Traps & rationalizations

| Excuse | Reality |
|--------|---------|
| "It's just for debugging, I'll commit the secret for 2 min" | A pushed secret = key rotation + history purge. No exception |
| "We're in a hurry, I'll skip the lint" | Pressure does not change the checklist. A rushed broken commit costs more |
| "`git add -A` is faster" | Blind staging pulls in `.env`, builds, files from other changes. File by file |
| "`--no-verify` to get past the hook" | The hook protects the branch. No `--no-verify` without an explicit user request |
| "The checks will probably pass" | ✅ = executed with pasted output, never assumed |
| "I'll fix it with `--amend` after the push" | No `--amend` on a pushed commit. Verify beforehand |

## Exit condition

- [ ] Format/lint/typecheck green on each touched stack (real output)
- [ ] Targeted tests of the changed scope passed - or, when the suite was already red before this change, that failure named and shown to predate it
- [ ] Zero secret / sensitive file in the diff
- [ ] Zero forbidden pattern (debug, hardcoded wait, disabled test, TODO) or explicitly justified
- [ ] Files staged one by one, all legitimate
- [ ] Message in the repo format + user confirmation obtained (unless autonomous mode)

A missing box = no commit. The one exception is a failure that predates the change: it does not block the commit, it has to be stated. Silently committing on a red suite and refusing to commit at all are both wrong, and the second is how a checklist read literally forbids every commit in a repository that has been red for a fortnight.

## Tooling

- Test procedure: `scripts/precommit-scan.test.ts` - deterministic behavioral test of the script (positive + negative fixture). Run `npx tsx scripts/precommit-scan.test.ts` from the canonical repo after any change to the script (also picked up by `npm test`). Not distributed to target repos.

- `scripts/precommit-scan.ts` - scans the staged diff (`npx tsx scripts/precommit-scan.ts`): secrets via gitleaks or regex fallback, sensitive files, debug leftovers. Read-only, exit 1 on a secret/sensitive file. Wireable as a hook (see `hooks/`).
