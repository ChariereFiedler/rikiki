# Proposed release and GitHub mirror · Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** CI proposes each release as a merge request, a human validates it twice (merge, then a manual publish job), and GitHub mirrors GitLab exactly with a job that turns red when it does not.

**Architecture:** A pure decision module (`release-plan.mjs`) computes versions, CHANGELOG entries and what to do; a thin I/O shell (`release-ci.mjs`) runs git and the GitLab API around it, with `--dry-run`. `.gitlab-ci.yml` wires four jobs to it. The mirror is GitLab's native push mirror, set up once through the API.

**Tech Stack:** Node 24 ESM scripts, Vitest, GitLab CI on self-hosted runners (`node:24-alpine`), GitLab REST API v4, git.

**Spec:** `docs/superpowers/specs/2026-10-02-release-and-mirror-design.md`

## Global Constraints

- No new dependency, dev or prod. `fetch` and `node:child_process` only.
- Commit types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore` · first line ≤ 72 chars · never mention Claude, AI or LLM.
- The release commit and MR title are `chore(release): vX.Y.Z`.
- Bump rules: `!`/`BREAKING CHANGE:` → minor while `0.x`, major from `1.0.0` · `feat` → minor · `fix`, `perf` → patch · anything else → none.
- Never move, delete or recreate an existing tag.
- Tokens never appear in logs: error messages name the operation and the HTTP status only.
- The owner's personal `GITLAB_TOKEN` never enters CI; CI uses `RELEASE_TOKEN` (project access token).
- No forbidden em-dash in any file (`lint` job). Use `·` as the repo does.
- Ask the owner before every `git commit` and every push.

## Review Focus

- A `RELEASE_VERSION` override lower than or equal to the last tag · must fail with a message naming both versions, not propose a downgrade (Task 1).
- A human pushes a fix onto `release/next` · the next `main` pipeline must leave the MR alone and note it once per `main` SHA, not overwrite the edit (Task 1 tests the decision; the note dedup is API I/O, checked by hand in Task 7 by re-running the `main` pipeline once and counting the notes).
- `[Unreleased]` already filled by hand · the generated entries must not be added on top (Task 2).
- The release MR is merged: the `main` pipeline that follows must tag, not propose a second release of the same commits (Task 1 `tag-pending`).
- A non-conventional subject (`Polish example copy…`, merge commits) · must count as no bump and never crash parsing (Task 1).

---

## File Structure

| File | Responsibility |
|---|---|
| `rikiki/scripts/release-plan.mjs` (create) | Pure: parse subjects, bump, next version, CHANGELOG entries, decision. No I/O. |
| `rikiki/scripts/release-plan.test.mjs` (create) | Vitest for the above. |
| `rikiki/scripts/release-ci.mjs` (create) | I/O shell: `propose`, `tag`, `gitlab-release`, `mirror-check` subcommands, `--dry-run`. |
| `rikiki/scripts/release-ci.test.mjs` (create) | Runs `propose --dry-run` against a throwaway git repository. |
| `rikiki/scripts/bump-version.mjs` (modify) | Drop the obsolete site-changelog stub (step 4). |
| `rikiki/scripts/bump-version.test.mjs` (create) | Runs the bump on a scratch clone, asserts which files change. |
| `.gitlab-ci.yml` (modify) | Jobs `release:propose`, `release:tag`, `release:gitlab`, `mirror-check`; manual `publish-npm` with npm guard. |
| `.github/workflows/mirror.yml`, `publish.yml` (delete) | Second publisher and reverse mirror. |
| `.github/workflows/ci.yml` (modify header) | Says GitHub is a mirror. |
| `docs/RUNBOOK.md`, `.claude/skills/ci-pipeline-orchestration/SKILL.md`, `rikiki/.claude/skills/bump-version/SKILL.md` (modify) | The release path as it now is. |

---

### Task 1: Release decisions, pure

**Files:**
- Create: `rikiki/scripts/release-plan.mjs`
- Test: `rikiki/scripts/release-plan.test.mjs`

**Interfaces:**
- Consumes: `parseSemver(v) → [major, minor, patch]` (throws on non-semver), `compareSemver(a, b) → number` from `rikiki/scripts/version-surfaces.mjs`.
- Produces:
  - `parseSubject(subject: string, body?: string) → { type, scope, breaking, description } | null`
  - `bumpFor(commits: {subject, body}[], current: string) → 'none'|'patch'|'minor'|'major'`
  - `nextVersion(current: string, bump) → string | null` (null for `'none'`)
  - `decide({ tagVersion, manifestVersion, commits, override, openMr, botName }) → { action: 'tag-pending' } | { action: 'nothing', reason } | { action: 'leave-mr', mrIid } | { action: 'propose', version }`
    where `openMr` is `null | { iid: number, headAuthorName: string }`.
  - `RELEASE_SUBJECT(version) → 'chore(release): vX.Y.Z'`

- [ ] **Step 1: Write the failing tests**

```js
// rikiki/scripts/release-plan.test.mjs
import { describe, expect, it } from 'vitest';
import { RELEASE_SUBJECT, bumpFor, decide, nextVersion, parseSubject } from './release-plan.mjs';

const c = (subject, body = '') => ({ subject, body });

describe('parseSubject', () => {
  it('reads type, scope and description', () => {
    expect(parseSubject('fix(graph): measure in canvas pixels (Closes #26)')).toEqual({
      type: 'fix', scope: 'graph', breaking: false, description: 'measure in canvas pixels (Closes #26)',
    });
  });
  it('marks a bang or a BREAKING CHANGE footer as breaking', () => {
    expect(parseSubject('feat(check)!: drop --legacy').breaking).toBe(true);
    expect(parseSubject('feat: x', 'BREAKING CHANGE: y').breaking).toBe(true);
  });
  it('returns null for a subject that is not conventional', () => {
    expect(parseSubject('Polish example copy and use semantic graph layout')).toBeNull();
    expect(parseSubject("Merge branch 'x' into 'main'")).toBeNull();
  });
});

describe('bumpFor', () => {
  it('takes the largest bump', () => {
    expect(bumpFor([c('docs: a'), c('fix: b'), c('feat(check): c')], '0.7.2')).toBe('minor');
  });
  it('turns a breaking change into a minor while 0.x, a major from 1.0.0', () => {
    expect(bumpFor([c('feat!: a')], '0.7.2')).toBe('minor');
    expect(bumpFor([c('feat!: a')], '1.2.0')).toBe('major');
  });
  it('ignores docs, chore, tests and non-conventional subjects', () => {
    expect(bumpFor([c('docs: a'), c('chore(release): v0.7.2'), c('Polish copy')], '0.7.2')).toBe('none');
  });
  it('counts perf as a patch', () => {
    expect(bumpFor([c('perf(docs): lazy previews')], '0.7.2')).toBe('patch');
  });
});

describe('nextVersion', () => {
  it('resets the lower fields', () => {
    expect(nextVersion('0.7.2', 'minor')).toBe('0.8.0');
    expect(nextVersion('0.7.2', 'patch')).toBe('0.7.3');
    expect(nextVersion('1.4.2', 'major')).toBe('2.0.0');
    expect(nextVersion('0.7.2', 'none')).toBeNull();
  });
});

describe('decide', () => {
  const base = { tagVersion: '0.7.2', manifestVersion: '0.7.2', commits: [c('feat: a')], override: undefined, openMr: null, botName: 'release-bot' };

  it('proposes the computed version', () => {
    expect(decide(base)).toEqual({ action: 'propose', version: '0.8.0' });
  });
  it('waits for the tag when a release is merged but not tagged', () => {
    expect(decide({ ...base, manifestVersion: '0.8.0' })).toEqual({ action: 'tag-pending' });
  });
  it('says why there is nothing to release', () => {
    expect(decide({ ...base, commits: [c('docs: a')] })).toEqual({ action: 'nothing', reason: 'no feat, fix or perf commit since v0.7.2' });
  });
  it('honours an override above the tag, even with nothing releasable', () => {
    expect(decide({ ...base, commits: [], override: '0.9.0' })).toEqual({ action: 'propose', version: '0.9.0' });
  });
  it('refuses an override at or below the tag', () => {
    expect(() => decide({ ...base, override: '0.7.2' })).toThrow('RELEASE_VERSION 0.7.2 is not greater than v0.7.2');
  });
  it('leaves a release MR a human has edited', () => {
    expect(decide({ ...base, openMr: { iid: 21, headAuthorName: 'Cédric Chariere Fiedler' } })).toEqual({ action: 'leave-mr', mrIid: 21 });
  });
  it('rebuilds a release MR the bot still owns', () => {
    expect(decide({ ...base, openMr: { iid: 21, headAuthorName: 'release-bot' } })).toEqual({ action: 'propose', version: '0.8.0' });
  });
});

it('names the release commit with an allowed type', () => {
  expect(RELEASE_SUBJECT('0.8.0')).toBe('chore(release): v0.8.0');
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd rikiki && npx vitest run scripts/release-plan.test.mjs`
Expected: FAIL, `Failed to load url ./release-plan.mjs`.

- [ ] **Step 3: Implement**

```js
// rikiki/scripts/release-plan.mjs
// What the release jobs decide, with no I/O · every input is passed in, so
// every decision is a unit test rather than a pipeline run.

import { compareSemver, parseSemver } from './version-surfaces.mjs';

const CONVENTIONAL = /^(?<type>[a-z]+)(?:\((?<scope>[^)]*)\))?(?<bang>!)?:\s*(?<description>.+)$/;
const BREAKING_FOOTER = /^BREAKING[ -]CHANGE:/m;
const RANK = { none: 0, patch: 1, minor: 2, major: 3 };
const BUMP_OF_TYPE = { feat: 'minor', fix: 'patch', perf: 'patch' };

export const RELEASE_SUBJECT = (version) => `chore(release): v${version}`;

export function parseSubject(subject, body = '') {
  const match = CONVENTIONAL.exec(subject.trim());
  if (!match) return null;
  const { type, scope = null, bang, description } = match.groups;
  return { type, scope, breaking: Boolean(bang) || BREAKING_FOOTER.test(body), description };
}

function bumpOfCommit({ subject, body }, current) {
  const parsed = parseSubject(subject, body);
  if (!parsed) return 'none';
  if (parsed.breaking) return parseSemver(current)[0] === 0 ? 'minor' : 'major';
  return BUMP_OF_TYPE[parsed.type] ?? 'none';
}

export function bumpFor(commits, current) {
  return commits
    .map((commit) => bumpOfCommit(commit, current))
    .reduce((largest, bump) => (RANK[bump] > RANK[largest] ? bump : largest), 'none');
}

export function nextVersion(current, bump) {
  const [major, minor, patch] = parseSemver(current);
  if (bump === 'major') return `${major + 1}.0.0`;
  if (bump === 'minor') return `${major}.${minor + 1}.0`;
  if (bump === 'patch') return `${major}.${minor}.${patch + 1}`;
  return null;
}

export function decide({ tagVersion, manifestVersion, commits, override, openMr, botName }) {
  if (compareSemver(manifestVersion, tagVersion) > 0) return { action: 'tag-pending' };
  if (override && compareSemver(override, tagVersion) <= 0) {
    throw new Error(`RELEASE_VERSION ${override} is not greater than v${tagVersion}`);
  }
  const version = override ?? nextVersion(tagVersion, bumpFor(commits, tagVersion));
  if (!version) return { action: 'nothing', reason: `no feat, fix or perf commit since v${tagVersion}` };
  if (openMr && openMr.headAuthorName !== botName) return { action: 'leave-mr', mrIid: openMr.iid };
  return { action: 'propose', version };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd rikiki && npx vitest run scripts/release-plan.test.mjs`
Expected: PASS, 16 tests.

- [ ] **Step 5: Commit** (ask the owner first)

```bash
git add rikiki/scripts/release-plan.mjs rikiki/scripts/release-plan.test.mjs
git commit -m "feat(release): decide the next release from conventional commits"
```

---

### Task 2: CHANGELOG entries from commits

**Files:**
- Modify: `rikiki/scripts/release-plan.mjs` (append)
- Test: `rikiki/scripts/release-plan.test.mjs` (append)

**Interfaces:**
- Consumes: `parseSubject` (Task 1).
- Produces:
  - `unreleasedBody(changelog: string) → string` (trimmed text between `## [Unreleased]` and the next `## `)
  - `fillUnreleased(changelog: string, commits) → string` (unchanged when the body is not empty)
  - `releaseNotes(changelog: string, version: string) → string` (body of `## [version]`, throws if absent)

- [ ] **Step 1: Write the failing tests**

Add `fillUnreleased, releaseNotes, unreleasedBody` to the existing import from `./release-plan.mjs` at the top of the file, then append:

```js
// append to rikiki/scripts/release-plan.test.mjs
const LOG = `# Changelog\n\n## [Unreleased]\n\n## [0.7.2] - 2026-09-23\n\n### Fixed\n- a fix.\n`;

describe('CHANGELOG', () => {
  it('reads an empty Unreleased section as empty', () => {
    expect(unreleasedBody(LOG)).toBe('');
  });
  it('fills an empty Unreleased section, Added before Fixed, scope kept', () => {
    const out = fillUnreleased(LOG, [c('fix(graph): measure (Closes #26)'), c('feat(check): ICON_DOUBLED'), c('docs: x')]);
    expect(unreleasedBody(out)).toBe('### Added\n- check: ICON_DOUBLED\n\n### Fixed\n- graph: measure (Closes #26)');
    expect(out).toContain('## [0.7.2] - 2026-09-23');
  });
  it('never adds to a section a human already wrote', () => {
    const written = LOG.replace('## [Unreleased]\n', '## [Unreleased]\n\n### Fixed\n- by hand.\n');
    expect(fillUnreleased(written, [c('feat: generated')])).toBe(written);
  });
  it('returns the notes of a released version', () => {
    expect(releaseNotes(LOG, '0.7.2')).toBe('### Fixed\n- a fix.');
    expect(() => releaseNotes(LOG, '0.9.0')).toThrow('CHANGELOG.md has no [0.9.0] section');
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `cd rikiki && npx vitest run scripts/release-plan.test.mjs`
Expected: FAIL, `fillUnreleased is not a function`.

- [ ] **Step 3: Implement**

```js
// append to rikiki/scripts/release-plan.mjs
const GROUP_OF_TYPE = { feat: 'Added', fix: 'Fixed', perf: 'Fixed' };
const GROUP_ORDER = ['Added', 'Fixed'];

function sectionBounds(changelog, heading) {
  const start = changelog.indexOf(heading);
  if (start < 0) return null;
  const bodyStart = start + heading.length;
  const next = changelog.indexOf('\n## ', bodyStart);
  return { bodyStart, bodyEnd: next < 0 ? changelog.length : next };
}

function sectionBody(changelog, heading) {
  const bounds = sectionBounds(changelog, heading);
  return bounds ? changelog.slice(bounds.bodyStart, bounds.bodyEnd).trim() : null;
}

export const unreleasedBody = (changelog) => sectionBody(changelog, '## [Unreleased]') ?? '';

function entriesFrom(commits) {
  const groups = new Map(GROUP_ORDER.map((group) => [group, []]));
  for (const { subject, body } of commits) {
    const parsed = parseSubject(subject, body);
    const group = parsed && GROUP_OF_TYPE[parsed.type];
    if (!group) continue;
    groups.get(group).push(`- ${parsed.scope ? `${parsed.scope}: ` : ''}${parsed.description}`);
  }
  return [...groups]
    .filter(([, lines]) => lines.length)
    .map(([group, lines]) => `### ${group}\n${lines.join('\n')}`)
    .join('\n\n');
}

export function fillUnreleased(changelog, commits) {
  if (unreleasedBody(changelog)) return changelog;
  const entries = entriesFrom(commits);
  if (!entries) return changelog;
  return changelog.replace(/^## \[Unreleased\]\s*$/m, `## [Unreleased]\n\n${entries}\n`);
}

export function releaseNotes(changelog, version) {
  const heading = new RegExp(`^## \\[${version.replace(/\./g, '\\.')}\\][^\\n]*`, 'm').exec(changelog);
  if (!heading) throw new Error(`CHANGELOG.md has no [${version}] section`);
  return sectionBody(changelog, heading[0]);
}
```

- [ ] **Step 4: Run to verify they pass**

Run: `cd rikiki && npx vitest run scripts/release-plan.test.mjs`
Expected: PASS, 20 tests.

- [ ] **Step 5: Commit** (ask first)

```bash
git add rikiki/scripts/release-plan.mjs rikiki/scripts/release-plan.test.mjs
git commit -m "feat(release): fill an empty Unreleased section from commits"
```

---

### Task 3: The bump stops writing a stub into the site changelog

The site page renders `CHANGELOG.md` since `site/src/lib/changelog.mjs`; step 4 of `bump-version.mjs` still inserts `TODO: write release notes` before the page's only `<h2>` ("Next"). Every automated release MR would carry it.

**Files:**
- Modify: `rikiki/scripts/bump-version.mjs:14-16` (import), `:70-77` (step 4)
- Test: `rikiki/scripts/bump-version.test.mjs`

**Interfaces:**
- Produces: `npm run bump <version>` changes `package.json`, `package-lock.json`, `CHANGELOG.md` and the EXACT surfaces, and nothing under `site/src/pages/`.

- [ ] **Step 1: Write the failing test**

```js
// rikiki/scripts/bump-version.test.mjs
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, expect, it } from 'vitest';

// The bump runs on a scratch clone · it rewrites the version surfaces of the
// tree it lives in, and this repository's must not move under a test.
const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const scratch = mkdtempSync(join(tmpdir(), 'rikiki-bump-'));
afterAll(() => rmSync(scratch, { recursive: true, force: true }));

it('bumps the version surfaces and leaves the generated site changelog alone', () => {
  execFileSync('git', ['clone', '--quiet', '--local', REPO, scratch]);
  const current = JSON.parse(execFileSync('node', ['-p', 'JSON.stringify(require("./rikiki/package.json").version)'], { cwd: scratch, encoding: 'utf8' }));
  const [major, minor] = current.split('.').map(Number);
  execFileSync('node', ['rikiki/scripts/bump-version.mjs', `${major}.${minor + 1}.0`, '--date=2026-10-02'], { cwd: scratch });
  const changed = execFileSync('git', ['diff', '--name-only'], { cwd: scratch, encoding: 'utf8' }).split('\n').filter(Boolean);
  expect(changed).toEqual(expect.arrayContaining(['CHANGELOG.md', 'rikiki/package.json', 'rikiki/package-lock.json']));
  expect(changed.filter((f) => f.startsWith('site/src/pages/'))).toEqual([]);
}, 60_000);
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd rikiki && npx vitest run scripts/bump-version.test.mjs`
Expected: FAIL, `site/src/pages/docs/changelog.astro` in the changed list.

- [ ] **Step 3: Remove step 4 and its import**

In `rikiki/scripts/bump-version.mjs`, delete `SITE_CHANGELOG,` from the import list and delete the whole block:

```js
// 4. site changelog — insert a stub section above the latest one.
edit(SITE_CHANGELOG, (t) => {
  const stub =
    `<h2 id="${slug}">${next} · ${today}</h2>\n\n` +
    `<h3>Added</h3>\n<ul>\n  <li>TODO: write release notes</li>\n</ul>\n\n`;
  return t.replace(/(<h2\b)/, `${stub}$1`);
});
```

If `slug` is now unused, delete `const slug = ...` too. Update the header comment line `stubs a site changelog section,` to `(the site page renders CHANGELOG.md itself),`.

- [ ] **Step 4: Run to verify it passes, then the whole unit suite**

Run: `cd rikiki && npx vitest run scripts/bump-version.test.mjs && npx vitest run`
Expected: PASS; full suite 1247 + new tests, 0 failed.

- [ ] **Step 5: Commit** (ask first)

```bash
git add rikiki/scripts/bump-version.mjs rikiki/scripts/bump-version.test.mjs
git commit -m "fix(release): stop stubbing the generated site changelog on bump"
```

---

### Task 4: The CI shell, with a dry run

**Files:**
- Create: `rikiki/scripts/release-ci.mjs`
- Test: `rikiki/scripts/release-ci.test.mjs`

**Interfaces:**
- Consumes: `decide`, `fillUnreleased`, `releaseNotes`, `RELEASE_SUBJECT` (Tasks 1-2); `npm run bump` (Task 3).
- Produces: `node rikiki/scripts/release-ci.mjs <propose|tag|gitlab-release|mirror-check> [--dry-run]`, run from the repository root. Environment: `CI_API_V4_URL`, `CI_PROJECT_ID`, `CI_PROJECT_PATH`, `CI_SERVER_HOST`, `CI_COMMIT_SHA`, `CI_COMMIT_TAG`, `RELEASE_TOKEN`, optional `RELEASE_VERSION`, `MIRROR_URL` (default `https://github.com/ChariereFiedler/rikiki.git`). Exit 0 when there is nothing to do, with one line saying why.

- [ ] **Step 1: Write the failing test**

```js
// rikiki/scripts/release-ci.test.mjs
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';

const SCRIPT = resolve(dirname(fileURLToPath(import.meta.url)), 'release-ci.mjs');
const repo = mkdtempSync(join(tmpdir(), 'rikiki-release-'));
afterAll(() => rmSync(repo, { recursive: true, force: true }));

const git = (...args) => execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', ...args], { cwd: repo });
const commit = (subject) => git('commit', '--quiet', '--allow-empty', '-m', subject);
const run = (...args) =>
  execFileSync('node', [SCRIPT, ...args, '--dry-run'], { cwd: repo, encoding: 'utf8', env: { ...process.env, RELEASE_TOKEN: '', RELEASE_VERSION: '' } });

describe('release-ci --dry-run', () => {
  git('init', '--quiet', '-b', 'main');
  mkdirSync(join(repo, 'rikiki'));
  writeFileSync(join(repo, 'rikiki/package.json'), JSON.stringify({ version: '0.7.2' }));
  writeFileSync(join(repo, 'CHANGELOG.md'), '# Changelog\n\n## [Unreleased]\n\n## [0.7.2] - 2026-09-23\n');
  git('add', '.');
  commit('chore(release): v0.7.2');
  git('tag', 'v0.7.2');

  it('has nothing to release after docs only', () => {
    commit('docs: a');
    expect(run('propose')).toContain('nothing to release · no feat, fix or perf commit since v0.7.2');
  });

  it('proposes a minor after a feat, and writes nothing', () => {
    commit('feat(check): b');
    expect(run('propose')).toContain('would propose v0.8.0');
    expect(execFileSync('git', ['status', '--porcelain'], { cwd: repo, encoding: 'utf8' })).toBe('');
  });

  it('tags nothing when the manifest version is already tagged', () => {
    expect(run('tag')).toContain('v0.7.2 already exists');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd rikiki && npx vitest run scripts/release-ci.test.mjs`
Expected: FAIL, `Cannot find module .../release-ci.mjs`.

- [ ] **Step 3: Implement**

```js
// rikiki/scripts/release-ci.mjs
// The I/O around release-plan.mjs · git, the GitLab API, npm run bump.
//
//   node rikiki/scripts/release-ci.mjs <propose|tag|gitlab-release|mirror-check> [--dry-run]
//
// --dry-run reads git only, calls no API and writes nothing: it prints what
// the job would do. Errors name the operation and the HTTP status, never the
// token.

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { RELEASE_SUBJECT, decide, fillUnreleased, releaseNotes } from './release-plan.mjs';

const RELEASE_BRANCH = 'release/next';
const MIRROR_POLL_MS = 30_000;
const MIRROR_DEADLINE_MS = 10 * 60_000;
const DEFAULT_MIRROR_URL = 'https://github.com/ChariereFiedler/rikiki.git';

const [command, ...flags] = process.argv.slice(2);
const dryRun = flags.includes('--dry-run');
const env = process.env;

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
const say = (line) => console.log(`release · ${line}`);
const manifestVersion = () => JSON.parse(readFileSync('rikiki/package.json', 'utf8')).version;
const lastTag = () => git('describe', '--tags', '--abbrev=0', '--match', 'v[0-9]*.[0-9]*.[0-9]*', 'HEAD');

function commitsSince(tag) {
  const log = git('log', '--no-merges', '--format=%s%x1f%b%x1e', `${tag}..HEAD`);
  return log
    .split('\x1e')
    .map((record) => record.trim())
    .filter(Boolean)
    .map((record) => {
      const [subject, body = ''] = record.split('\x1f');
      return { subject, body };
    });
}

async function gitlab(method, path, body) {
  if (!env.RELEASE_TOKEN) throw new Error(`${method} ${path} · RELEASE_TOKEN is not set`);
  const response = await fetch(`${env.CI_API_V4_URL}/projects/${env.CI_PROJECT_ID}${path}`, {
    method,
    headers: { 'PRIVATE-TOKEN': env.RELEASE_TOKEN, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) throw new Error(`${method} ${path} · HTTP ${response.status}`);
  return response.status === 204 ? null : response.json();
}

async function bot() {
  const response = await fetch(`${env.CI_API_V4_URL}/user`, { headers: { 'PRIVATE-TOKEN': env.RELEASE_TOKEN } });
  if (!response.ok) throw new Error(`GET /user · HTTP ${response.status}`);
  const user = await response.json();
  return { name: user.name, email: `${user.username}@noreply.${env.CI_SERVER_HOST}` };
}

async function openReleaseMr() {
  const [mr] = await gitlab('GET', `/merge_requests?state=opened&source_branch=${encodeURIComponent(RELEASE_BRANCH)}`);
  if (!mr) return null;
  const head = await gitlab('GET', `/repository/commits/${mr.sha}`);
  return { iid: mr.iid, headAuthorName: head.author_name };
}

async function noteOnce(mrIid, mainSha, behind) {
  const notes = await gitlab('GET', `/merge_requests/${mrIid}/notes?per_page=100`);
  if (notes.some((note) => note.body.includes(mainSha))) return;
  await gitlab('POST', `/merge_requests/${mrIid}/notes`, {
    body: `main moved ahead of this release MR (${behind} commits, now at ${mainSha}). It was edited by hand, so CI leaves it as is: rebase it, or close it and let the next pipeline propose again.`,
  });
}

function rebuildReleaseBranch(version, commits, identity) {
  git('checkout', '-B', RELEASE_BRANCH);
  execFileSync('npm', ['run', '--silent', 'bump', '--', version], { cwd: 'rikiki', stdio: 'inherit' });
  writeFileSync('CHANGELOG.md', fillUnreleased(readFileSync('CHANGELOG.md', 'utf8'), commits));
  git('-c', `user.name=${identity.name}`, '-c', `user.email=${identity.email}`, 'commit', '--quiet', '-am', RELEASE_SUBJECT(version));
  const remote = `https://oauth2:${env.RELEASE_TOKEN}@${env.CI_SERVER_HOST}/${env.CI_PROJECT_PATH}.git`;
  execFileSync('git', ['push', '--quiet', '--force', remote, `HEAD:refs/heads/${RELEASE_BRANCH}`], { stdio: 'ignore' });
}

async function upsertReleaseMr(version, tag, commits, existing) {
  const notes = releaseNotes(readFileSync('CHANGELOG.md', 'utf8'), version);
  const list = commits.map(({ subject }) => `- ${subject}`).join('\n');
  const description = `Proposed by CI from the commits since ${tag}. Merging this MR tags v${version}; publishing to npm is a manual job on the tag pipeline.\n\n## CHANGELOG\n\n${notes}\n\n## Commits\n\n${list}`;
  const fields = { title: RELEASE_SUBJECT(version), description };
  if (existing) return gitlab('PUT', `/merge_requests/${existing.iid}`, fields);
  return gitlab('POST', '/merge_requests', { ...fields, source_branch: RELEASE_BRANCH, target_branch: 'main', remove_source_branch: true });
}

async function propose() {
  const tag = lastTag();
  const commits = commitsSince(tag);
  const openMr = dryRun ? null : await openReleaseMr();
  const identity = dryRun ? { name: 'release-bot' } : await bot();
  const decision = decide({
    tagVersion: tag.slice(1),
    manifestVersion: manifestVersion(),
    commits,
    override: env.RELEASE_VERSION || undefined,
    openMr,
    botName: identity.name,
  });
  if (decision.action === 'tag-pending') return say(`v${manifestVersion()} is merged and waits for release:tag`);
  if (decision.action === 'nothing') return say(`nothing to release · ${decision.reason}`);
  if (decision.action === 'leave-mr') {
    say(`!${decision.mrIid} was edited by hand · left as is`);
    if (!dryRun) await noteOnce(decision.mrIid, env.CI_COMMIT_SHA, commits.length);
    return;
  }
  if (dryRun) return say(`would propose v${decision.version} from ${commits.length} commits since ${tag}`);
  rebuildReleaseBranch(decision.version, commits, identity);
  const mr = await upsertReleaseMr(decision.version, tag, commits, openMr);
  say(`proposed v${decision.version} · ${mr.web_url}`);
}

async function tag() {
  const version = manifestVersion();
  const name = `v${version}`;
  if (git('tag', '--list', name)) return say(`${name} already exists · nothing to tag`);
  if (dryRun) return say(`would tag ${name} on ${env.CI_COMMIT_SHA ?? git('rev-parse', 'HEAD')}`);
  await gitlab('POST', '/repository/tags', { tag_name: name, ref: env.CI_COMMIT_SHA, message: RELEASE_SUBJECT(version) });
  say(`tagged ${name} · its pipeline holds the manual publish-npm job`);
}

async function gitlabRelease() {
  const name = env.CI_COMMIT_TAG;
  const notes = releaseNotes(readFileSync('CHANGELOG.md', 'utf8'), name.slice(1));
  if (dryRun) return say(`would create the ${name} release:\n${notes}`);
  await gitlab('POST', '/releases', { tag_name: name, name, description: notes });
  say(`released ${name}`);
}

async function mirrorCheck() {
  const url = env.MIRROR_URL || DEFAULT_MIRROR_URL;
  const expected = env.CI_COMMIT_SHA;
  const remoteMain = (remote) => git('ls-remote', remote, 'refs/heads/main').split(/\s/)[0];
  const deadline = Date.now() + MIRROR_DEADLINE_MS;
  for (;;) {
    const mirrored = remoteMain(url);
    if (mirrored === expected) return say(`GitHub main is ${expected}`);
    if (remoteMain('origin') !== expected) return say('GitLab main moved on · the newer pipeline checks the mirror');
    if (dryRun || Date.now() > deadline) {
      const mirrors = dryRun ? [] : await gitlab('GET', '/remote_mirrors').catch(() => []);
      const lastError = mirrors.map((m) => m.last_error).find(Boolean);
      throw new Error(`GitHub main is ${mirrored}, GitLab main is ${expected}${lastError ? ` · mirror error: ${lastError}` : ''}`);
    }
    await new Promise((resolve) => setTimeout(resolve, MIRROR_POLL_MS));
  }
}

const COMMANDS = { propose, tag, 'gitlab-release': gitlabRelease, 'mirror-check': mirrorCheck };

if (!COMMANDS[command]) {
  console.error(`usage: release-ci.mjs <${Object.keys(COMMANDS).join('|')}> [--dry-run]`);
  process.exit(2);
}
COMMANDS[command]().catch((error) => {
  console.error(`release · ${command} failed · ${error.message}`);
  process.exit(1);
});
```

- [ ] **Step 4: Run to verify it passes, then a dry run on the real history**

Run: `cd rikiki && npx vitest run scripts/release-ci.test.mjs`
Expected: PASS, 3 tests.

Run: `node rikiki/scripts/release-ci.mjs propose --dry-run` (from the repository root)
Expected: `release · would propose v0.8.0 from N commits since v0.7.2`. Paste the line into the Task 6 merge request.

- [ ] **Step 5: Commit** (ask first)

```bash
git add rikiki/scripts/release-ci.mjs rikiki/scripts/release-ci.test.mjs
git commit -m "feat(release): propose, tag and release from CI, with a dry run"
```

---

### Task 5: Token, tag protection and push mirror (API, run by the owner's session)

No code. Each command runs from the owner's machine with the personal `GITLAB_TOKEN`, which never leaves it. `A=https://gitlab.com/api/v4/projects/tordu-jardin%2Frikiki`, `H="PRIVATE-TOKEN: $GITLAB_TOKEN"`.

- [ ] **Step 1: Create the project access token**

```bash
curl -s -X POST -H "$H" -H 'Content-Type: application/json' "$A/access_tokens" \
  --data '{"name":"release-bot","scopes":["api","write_repository"],"access_level":40,"expires_at":"2027-10-01"}' \
  | python3 -c "import json,sys; print(json.load(sys.stdin)['token'], end='')" > "$SCRATCH/release-token"
```

Expected: a `glpat-…` value in `$SCRATCH/release-token` (scratchpad, never the repo, never printed).

- [ ] **Step 2: Store it as a masked, protected variable, then delete the local copy**

```bash
curl -s -X POST -H "$H" "$A/variables" --form key=RELEASE_TOKEN --form "value=<$SCRATCH/release-token" \
  --form masked=true --form protected=true | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['key'], d['masked'], d['protected'])"
rm "$SCRATCH/release-token"
```

Expected: `RELEASE_TOKEN True True`.

- [ ] **Step 3: Protect `v*` tags for Maintainers**

```bash
curl -s -X POST -H "$H" "$A/protected_tags?name=v*&create_access_level=40" | python3 -c "import json,sys; print(json.load(sys.stdin)['name'])"
```

Expected: `v*`.

- [ ] **Step 4: Create the push mirror and read its public key**

```bash
curl -s -X POST -H "$H" -H 'Content-Type: application/json' "$A/remote_mirrors" \
  --data '{"url":"ssh://git@github.com/ChariereFiedler/rikiki.git","enabled":true,"auth_method":"ssh_public_key","only_protected_branches":true,"keep_divergent_refs":false}' \
  | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['id'])"
curl -s -H "$H" "$A/remote_mirrors/<id>/public_key" | python3 -c "import json,sys; print(json.load(sys.stdin)['public_key'])"
```

Expected: a mirror id, then an `ssh-ed25519 …` or `ssh-rsa …` key. If Step 6 later reports a host-key verification error, the owner opens Settings → Repository → Mirroring repositories, edits the mirror and clicks **Detect host keys** · the API does not expose that step. If SSH cannot be made to work, fall back to HTTPS: the owner creates a GitHub fine-grained token limited to `ChariereFiedler/rikiki` with `Contents: write`, and the mirror URL becomes `https://<user>:<token>@github.com/ChariereFiedler/rikiki.git` with `auth_method: password`.

- [ ] **Step 5: The owner adds the key on GitHub**

Hand the key to the owner: GitHub → `ChariereFiedler/rikiki` → Settings → Deploy keys → Add deploy key · title `gitlab-push-mirror` · **Allow write access**. Wait for confirmation.

- [ ] **Step 6: Force a sync and verify**

```bash
curl -s -X POST -H "$H" "$A/remote_mirrors/<id>/sync" -o /dev/null -w '%{http_code}\n'
sleep 60
curl -s -H "$H" "$A/remote_mirrors/<id>" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['update_status'], d['last_error'])"
git ls-remote https://github.com/ChariereFiedler/rikiki.git refs/heads/main
git ls-remote origin refs/heads/main
```

Expected: `finished None`, and the two `main` SHAs equal.

- [ ] **Step 7: Settle the tag question from the spec**

Create a throwaway lightweight tag through the API on `main` (`POST $A/repository/tags` with `tag_name=mirror-probe`), sync, and check `git ls-remote --tags https://github.com/ChariereFiedler/rikiki.git mirror-probe`. Delete it on both sides afterwards (`DELETE $A/repository/tags/mirror-probe`, then sync). If it did not reach GitHub, `only_protected_branches` filters tags and the `v*` protection from Step 3 is what carries release tags · verify that with the next real `v*` tag in Task 7.

---

### Task 6: CI wiring, GitHub workflows, docs

**Files:**
- Modify: `.gitlab-ci.yml` (append four jobs after `publish-npm`, change `publish-npm`)
- Delete: `.github/workflows/mirror.yml`, `.github/workflows/publish.yml`
- Modify: `.github/workflows/ci.yml:1-10` (header), `docs/RUNBOOK.md`, `.claude/skills/ci-pipeline-orchestration/SKILL.md`, `rikiki/.claude/skills/bump-version/SKILL.md`

- [ ] **Step 1: Make `publish-npm` manual and guard against a version already on npm**

In `.gitlab-ci.yml`, inside `publish-npm.script`, insert after the tag/manifest check:

```yaml
    - |
      # npm answers a republish with a bare 403 · say what happened instead.
      # Each script item is its own shell, so the version is read again here.
      manifest=$(node -p "require('./package.json').version")
      if npm view "rikiki-deck@${manifest}" version >/dev/null 2>&1; then
        echo "ERROR: rikiki-deck@${manifest} is already on npm · nothing to publish"
        exit 1
      fi
```

Replace its `rules:` with:

```yaml
  # Second validation · the tag pipeline runs every gate, then waits here for
  # a human. The first validation was merging the release MR.
  rules:
    - if: $CI_COMMIT_TAG =~ /^v\d+\.\d+\.\d+$/
      when: manual
  allow_failure: false
```

- [ ] **Step 2: Append the release and mirror jobs**

```yaml
# Release · proposed by CI, validated twice. See
# docs/superpowers/specs/2026-10-02-release-and-mirror-design.md.
.release-job:
  stage: release
  image: ${NODE_IMAGE}
  variables:
    # The decision reads every commit since the last tag.
    GIT_DEPTH: 0
    GIT_FETCH_EXTRA_FLAGS: --tags
  before_script:
    - apk add --no-cache git >/dev/null

release:propose:
  extends: .release-job
  needs: [smoke-test]
  script:
    - cd rikiki && npm ci --prefer-offline --no-audit && cd ..
    - node rikiki/scripts/release-ci.mjs propose
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH

release:tag:
  extends: .release-job
  needs: [smoke-test]
  script:
    - node rikiki/scripts/release-ci.mjs tag
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH

release:gitlab:
  extends: .release-job
  needs: [publish-npm]
  script:
    - node rikiki/scripts/release-ci.mjs gitlab-release
  rules:
    - if: $CI_COMMIT_TAG =~ /^v\d+\.\d+\.\d+$/

# The push mirror runs on the push, not after this pipeline · start at once,
# and never hold the deploy: a red job here is the alarm, not a gate.
mirror-check:
  extends: .release-job
  needs: []
  allow_failure: true
  script:
    - node rikiki/scripts/release-ci.mjs mirror-check
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
```

- [ ] **Step 3: Validate the YAML with GitLab's linter**

```bash
python3 -c "import json; print(json.dumps({'content': open('.gitlab-ci.yml').read()}))" \
  | curl -s -X POST -H "$H" -H 'Content-Type: application/json' --data @- "$A/ci/lint" \
  | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['valid'], d['errors'], d['warnings'])"
```

Expected: `True [] []`.

- [ ] **Step 4: GitHub workflows**

```bash
git rm .github/workflows/mirror.yml .github/workflows/publish.yml
```

Replace the header comment of `.github/workflows/ci.yml` (lines 1-10) with:

```yaml
# The verification a contributor sees on GitHub.
#
# GitHub is a mirror: GitLab (tordu-jardin/rikiki) is where merges, issues and
# releases happen, and its push mirror sends main and the tags here. This
# workflow replays the checks on what arrives, as a second signal. Nothing on
# GitHub publishes · npm publishing is a manual job on GitLab's tag pipeline.
```

- [ ] **Step 5: Docs**

- `docs/RUNBOOK.md`: add a `## Release` section: the four steps of the spec's §2 diagram in prose, the `RELEASE_VERSION` override, where the manual `publish-npm` button is, and "a red `mirror-check` means GitHub is behind · read the mirror's `last_error` in Settings → Repository → Mirroring repositories".
- `.claude/skills/ci-pipeline-orchestration/SKILL.md`: in the rikiki-specific notes, list `release:propose`, `release:tag`, `publish-npm` (manual), `release:gitlab`, `mirror-check`, and that a blocked tag pipeline waiting on `publish-npm` is normal.
- `rikiki/.claude/skills/bump-version/SKILL.md`: first line of the body becomes "CI proposes releases on its own (`release:propose`). Use this skill only to cut a release by hand, e.g. when CI is down." Step 7's suggested message becomes `chore(release): vX.Y.Z`, and the "consider tagging" sentence becomes "do not tag by hand · merging to main runs `release:tag`".
- Grep for stale claims: `git grep -n -e publish.yml -e mirror.yml -e "source of truth"` and correct every hit that describes GitHub as the source of truth.

- [ ] **Step 6: Verify**

Run: `cd rikiki && npx vitest run && npm run lint` and the em-dash linter the `lint` job runs (`grep -n "lint:" -A12 .gitlab-ci.yml` shows the command).
Expected: all green.

- [ ] **Step 7: Commit, as two commits** (ask first)

```bash
git add .gitlab-ci.yml
git commit -m "chore(ci): propose releases, gate publishing, watch the mirror"
git add -A .github docs/RUNBOOK.md .claude/skills/ci-pipeline-orchestration/SKILL.md rikiki/.claude/skills/bump-version/SKILL.md
git commit -m "docs(release): GitHub mirrors GitLab, CI proposes releases"
```

---

### Task 7: First run, end to end

- [ ] **Step 1: Push `main`** (ask first). Watch the `main` pipeline: `mirror-check` green within ten minutes; `release:tag` says `v0.7.2 already exists`; `release:propose` opens `chore(release): v0.8.0` with a CHANGELOG section holding the #26 fix and `ICON_DOUBLED`.
- [ ] **Step 2: Check the MR diff**: `rikiki/package.json`, `package-lock.json`, `CHANGELOG.md`, the EXACT surfaces, and nothing under `site/src/pages/`. Its pipeline must be green.
- [ ] **Step 3: Owner merges the MR** (validation 1). Expected: `release:propose` says `v0.8.0 is merged and waits for release:tag`; `release:tag` creates `v0.8.0`.
- [ ] **Step 4: Tag pipeline**: every gate green, `publish-npm` waiting. Owner clicks it (validation 2). Expected: `npm view rikiki-deck version` → `0.8.0`; `release:gitlab` creates the Release; `git ls-remote --tags https://github.com/ChariereFiedler/rikiki.git v0.8.0` returns the tag; no workflow publishes on GitHub.
- [ ] **Step 5: Update the memory notes** `v1-not-published-blocks-landing.md` and `github-cutover-state.md`: the release path and the mirror as they now are.
