# Advanced testing - reference

Automated safeguards to underpin a test strategy. Generic tooling: adapt the commands to the project's framework (read `package.json` / `Cargo.toml` / `Makefile` / CI config). All the stack examples below are neutral and interchangeable.

## Table of contents

1. [Test pyramid](#1-test-pyramid)
2. [Quality gates](#2-quality-gates)
3. [Mutation testing](#3-mutation-testing)
4. [Parser fuzzing](#4-parser-fuzzing)
5. [API snapshot (contract)](#5-api-snapshot-contract)
6. [UAT (real-condition acceptance)](#6-uat-real-condition-acceptance)
7. [Confidence metrics for a multi-agent flow](#7-confidence-metrics-for-a-multi-agent-flow)

## 1. Test pyramid

The shares below are an illustration, not a project quota. Choose levels by risk and boundary; package/CLI projects may need more integration tests.

| Level | Illustrative share | What it covers | Cost / speed |
|--------|-----------|-----------------|----------------|
| Unit | ~70% | pure logic, invariants, branches, boundaries | very fast, no I/O |
| Integration / contract | ~20% | handlers + persistence, API contract, authorization policies against a real database | medium |
| E2E | ~10% | critical end-to-end journeys, real backend + seeded data | slow, fragile, expensive |

Rules: moving up the pyramid must be justified; an E2E that could have been a contract test is waste. Mock only at the boundaries (external network, clock), never in the middle of the system under test - otherwise an "E2E" becomes a UI test blind to backend contract breaks.

## 2. Quality gates

Automated barrier to pass before push/merge. Discuss these example thresholds against the existing project baseline; do not impose them automatically:

| Gate | Typical threshold |
|------|---------------|
| Compilation + static lint | 0 warnings |
| Unit tests | 100% pass |
| Dependency audit (vulnerabilities) | 0 critical |
| Coverage vs baseline | ≥ -5% (no sharp regression) |
| Frontend typecheck + lint | 0 errors |

Keep a versioned coverage baseline and compare each run to that baseline rather than to an absolute threshold: you block a **regression**, not a historically low project.

## 3. Mutation testing

Measures whether the tests actually **detect** a defect, not just whether they pass. The tool introduces mutations (flip a condition, change a constant, remove a call) and checks that at least one test fails ("mutant killed").

- **Goal**: detect representative defects in critical behavior; agree any numeric kill-rate target with the project.
- Target the at-risk (P0) modules first; full mutation testing is expensive - sample (e.g. 20%) for a fast loop.
- A surviving non-equivalent mutant points to a missing or too-permissive test → draft a follow-up; publish only when authorized.

Manual substitute when no tool is available: mutate an isolated copy/worktree, observe a relevant assertion failure (not a setup or syntax failure), then rerun the clean version. Never mutate or stash the user's dirty working tree. Bound the experiment to the changed behavior and report any missing evidence.

## 4. Parser fuzzing

For any code that parses untrusted input (file formats, protocols, user input), generate random/malformed inputs and look for crashes, panics or unhandled behavior.

- Prioritize parsers exposed to external input.
- Run in short repeated campaigns (e.g. 30–60 s/target) integrated into CI.
- Any input that causes a crash becomes a deterministic regression test case.

## 5. API snapshot (contract)

Freeze the shape of API responses (statuses, schema, fields) in versioned snapshots; any unintended deviation breaks the test.

- Store the snapshots in the repo, reviewed in code review like code.
- A snapshot update is a **deliberate contract change**, never a reflexive "update" to make the test pass.
- Cover at minimum: status codes, response schema, sensitive fields (presence/absence depending on authorization).

## 6. UAT (real-condition acceptance)

End-to-end scenarios run against a near-production environment, grouped by functional domain (e.g. auth/core, features, settings) and runnable in parallel.

- Parameterize the target URL and credentials via environment variables, never hard-coded.
- Provide a "dry run" mode (no ticket creation) to validate the harness.
- Output: PASS/FAIL report + screenshots; each failure generates a prioritized finding (P0/P1/P2), published as a ticket only when authorized.

## 7. Confidence metrics for a multi-agent flow

When authorized agents/contributors develop in parallel, agree a common quality barrier before integration. These are example thresholds, not mandatory defaults:

| Metric | Threshold | Action if failing |
|----------|-------|--------------|
| Lint warnings | 0 | block the commit |
| Test pass rate | 100% | block the merge |
| Coverage delta | ≥ -5% | block the merge |
| Mutation kill rate | ≥ 70% | create a test ticket |
| Critical vulnerabilities | 0 | block the push + alert |

Typical chain: development → quality gates → review → mutation testing → security scan → integration. Any failure sends the work back to the development step rather than bypassing the barrier.
