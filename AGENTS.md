# Rikiki agent guide

Read `CONTRIBUTING.md` before changing the project, and `MANIFESTO.md` and
`ROADMAP.md` before proposing features. The npm package lives in `rikiki/`;
the Astro website lives in `site/`. The root package is a CI wrapper.

## Shared Ronce Racine rules

Use `.claude/rules/shared/` as the shared source of conventions. Read rules
without a YAML `paths` filter at the beginning of work; before editing a file,
read the rules whose `paths` match it. Codex must perform this routing explicitly:
this setup does not install a hook that injects rules or blocks commands.

User instructions take precedence over these local workflows. An existing
authorization to commit, review, merge or release remains valid for that scope;
do not ask again merely because a generic rule or skill requests confirmation.
Preserve unrelated work and inspect the working tree before changing it.

## Skills

`.agents/skills/` contains the Codex distribution of Ronce Racine. Read the
relevant `SKILL.md` when the task calls for it, and resolve its references from
that skill's directory. Use the smallest relevant workflow:

- Review an MR: `merge-request-review`.
- Prepare a commit: `commit-readiness-review`.
- Investigate a bug: `bug-triage-structured`, then `bug-ticket-root-cause` if needed.
- Design tests: `writing-robust-tests` or `comprehensive-test-strategy`.
- Validate visible behavior: `validating-features-end-to-end` and, for visual
  changes, `visual-regression-check`.
- Investigate CI: `ci-pipeline-orchestration`.

Generic skills do not imply that this project has a database, backend API or
production daemon. Apply the relevant checks to the actual change and existing
stack. Do not introduce infrastructure or tests solely to satisfy a generic
example. Project-specific conventions and existing test patterns take precedence.

Legacy tool names in skills describe operations: `Read`/`Grep`/`Glob` mean the
available read/search tools, `Bash` means the shell, and `Edit`/`Write` mean the
editing tools. `Skill` means reading the named workflow. `Task`/`Agent` requires
explicit user authorization for delegation or parallel agents. A referenced
Claude plugin, hook, command or MCP server is not automatically available here.

## Validation and generated artifacts

Use Node 24, as in CI. Read the relevant `package.json` and `.gitlab-ci.yml` for
the current commands and gates. For package changes, run typecheck, lint and
tests in `rikiki/`; build before browser checks. For site changes, run lint and
build in `site/`. Run browser coverage appropriate to the changed behavior.

`rikiki/dist/`, bundled examples and the root README are generated and versioned.
Use the existing build, examples and readme scripts; edit `README.template.md`
instead of the generated root README. Include regenerated artifacts when their
sources change and verify the CI drift checks. Report actual results and any
checks that could not run.

## Review and release

GitLab is the canonical repository; GitHub is a read-only mirror. Review the
complete MR diff and relevant callers, identify actionable findings with file
locations, and check the pipeline for the current source SHA before merging.
Resolve discussions only after their findings have been addressed. Recheck the
resulting default-branch pipeline before a release.

Read the existing release scripts and CI jobs before choosing a version or
tagging. Use the package's bump workflow to keep versions and generated files
consistent. Never move or overwrite an existing release tag. A local tag, a
pushed tag, a successful release pipeline and a published npm version are
different outcomes: report which ones have actually completed.

Distribution provenance and maintenance: `.agents/README.md`.
