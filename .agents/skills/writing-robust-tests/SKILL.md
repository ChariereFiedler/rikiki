---
name: writing-robust-tests
description: Use when writing tests for existing code that lacks coverage - "write tests for X", "cover this file", "add tests", "écris des tests pour X", "couvre ce fichier", "ajoute des tests", a module or file with no tests at all, code shipped without sufficient tests, flaky or fragile test suites to harden.
metadata:
  version: "1.1.0"
  last-reviewed: 2026-09-22
  category: test
---

# Writing Robust Tests - ISTQB design + evidence

> If the current repo has a dedicated test skill, it wins - it knows the golden dataset and the project commands.

## Runtime compatibility (Codex / Claude Code)

Use this workflow in the current agent. Named MCP tools are examples of capabilities: use the available equivalent or report the missing evidence. Delegate only when the host permits it and the user authorizes it; otherwise perform the scoped steps sequentially. No external plugin or Claude hook is required.

Resolve local resources relative to this SKILL.md, sibling skills in the parent skills directory, and project commands/output paths in the target repository. Use the user's request as arguments; do not assume slash-command variables exist. Read only relevant references. Project-specific skills and host instructions take precedence.

An audit or diagnosis stays read-only: instructions below to fix, publish tickets/comments, retry CI, deploy, stage or commit apply only when those actions are authorized. Otherwise return findings or drafts and the required next decision. Never treat missing tools or skipped checks as successful evidence.

Superpowers references are optional: use the matching installed skill when available. Otherwise apply its method in the current agent: clarify requirements, reproduce and isolate bugs, or use the red → green → refactor test loop. A skill reference does not authorize delegation.

## This skill vs. others

- **This skill**: the code exists, the tests are missing or fragile
- **superpowers:test-driven-development**: the code does not exist yet (test first)
- **detection-sweep**: a whole-project audit, not a targeted file

## Principle

**A green test you have never seen red proves nothing.** The output of this skill is not "tests written" but "tests whose failure has been demonstrated".

## 1. Adapt to the project (2 min, before writing)

- Framework + commands: read `package.json` scripts / `Cargo.toml` / `Makefile` / CI config
- **Read an existing neighboring test** and copy its conventions (page objects, helpers, fixtures) before inventing
- Data: reuse relevant reference fixtures, or define a minimal valid fixture with explicit values. Do not import an entire demo merely to obtain one valid input.

## 2. Design (ISTQB, apply don't copy)

- **Level first**: unit / integration-contract / E2E. Choose the cheapest level that detects the targeted failure; no fixed percentage quota - see the mock trap §4.
- **Black-box**: Equivalence Partitioning · Boundary Value Analysis (threshold 100 → 99/100/101) · Decision Table · State Transition (an entity's lifecycle) · Use Case
- **Experience-based**: error guessing (null/empty/negative/Unicode/SQLi/XSS), regression checklist
- **FIRST**: Fast (unit without DB/network) · Isolated · Repeatable (no clock or random) · Self-validating · Timely

## 3. Test structure and E2E discipline

1. **Stable locators**: follow the project's convention; prefer accessible roles/names when they express the contract, scoped test IDs for ambiguous or dynamic controls. Avoid CSS structure and incidental text. Do not modify production code just to impose a new locator convention.
2. **Small named cases**: one behavior per case, explicit arrange/act/assert. Reuse page objects when they simplify repeated interactions; do not introduce a framework around a single action.
3. **ZERO hard waits** (`waitForTimeout`, `sleep`) - wait for a concrete state: visible, URL, network response
4. **Zero assertion coupled to the implementation's timing** (a toast that disappears after 3 s tested with a 5 s timeout = fragile coupling) - drive or neutralize the clock, or test the state not the duration
5. Use runner lifecycle hooks for resources. Give subprocesses bounded timeouts and include command, exit status and stderr in failures. Clean up temporary directories and browsers on failure as well as success; retaining artifacts is an explicit diagnostic option.

For CLI/package tests, assert public exit codes and structured diagnostics rather than implementation text or private functions. Test the installed tarball in a separate consumer directory when distribution is the boundary under test; a source symlink cannot prove packaging. Keep setup failures distinct from assertion failures. Avoid top-level scripts that perform all scenarios in a single opaque run.

## 4. The total-mock trap

Mocking the whole API in an "E2E" test makes it a UI component test: it will never detect a backend contract break. Choose explicitly:
- **True E2E**: real backend + seeded data - covers the contract
- **Component test**: mocked API - fast, but declare it as such and complete it with a contract test

Mock at the boundaries only (external network, clock), never in the middle of the system under test.

## 5. Mandatory evidence: the test can fail

For each test (or homogeneous group):
1. Run → green
2. **Introduce a representative defect in an isolated copy/worktree** (invert the condition, return a wrong value) → the relevant assertion must fail for that defect, not a syntax, dependency or setup error. Never mutate, stash or reset the user's dirty working tree.
3. Discard the isolated mutation; run the unmodified code → green. For a bug fix, the reproduction on the pre-fix revision can supply the red evidence.

Bound the experiment to the changed behavior or homogeneous group. If isolation or execution is unavailable, report the evidence gap rather than inventing a red result or escalating to a full mutation campaign.

A test that stays green with broken code is a Liar - rewrite it.

## Traps & rationalizations

| Excuse | Reality |
|--------|---------|
| "No time to run it, the test code is correct" | Tests never run = tests not written. Run them. |
| "Every control needs a new test ID" | Use the stable contract already exposed by the component; add IDs only where needed. |
| "The import failed, so I proved red" | Only a relevant behavioral assertion failing proves sensitivity to the defect. |
| "I mock the API, it's more stable" | You just turned your E2E into a UI test. Decide the level deliberately. |
| "The suite passed, so every path is covered" | Name the behavior exercised and the cases left unverified. |

## Exit condition

- [ ] Project conventions reused (neighboring test read)
- [ ] Independent named cases, minimal fixtures, appropriate public boundary and resource cleanup
- [ ] ZERO hard waits, zero fragile locator, zero timing coupling
- [ ] Representative defect detected for each changed behavior/group, then green; any missing red evidence disclosed
- [ ] Suite run, output pasted in the summary - never "it should pass"

## Tooling

- Advanced techniques (automated mutation testing, contract harness, fuzzing, quality gates): see `../comprehensive-test-strategy/reference/testing-advanced.md` - shared with the strategy skill.
