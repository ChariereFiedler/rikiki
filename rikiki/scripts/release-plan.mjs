// What the release jobs decide, with no I/O · every input is passed in, so
// every decision is a unit test rather than a pipeline run.
//
// release-ci.mjs is the shell around it: git, the GitLab API, npm run bump.
// See docs/superpowers/specs/2026-10-02-release-and-mirror-design.md.

import { compareSemver, parseSemver } from './version-surfaces.mjs';

const CONVENTIONAL = /^(?<type>[a-z]+)(?:\((?<scope>[^)]*)\))?(?<bang>!)?:\s*(?<description>.+)$/;
const BREAKING_FOOTER = /^BREAKING[ -]CHANGE:/m;
const RANK = { none: 0, patch: 1, minor: 2, major: 3 };
const BUMP_OF_TYPE = { feat: 'minor', fix: 'patch', perf: 'patch' };

// `release` is not an allowed commit type here, and `chore` never triggers a
// release of its own, so the release commit cannot propose itself again.
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
  // Before 1.0.0 semver gives no stability promise, so a breaking change is
  // the next minor rather than a jump to 1.0.0 nobody decided.
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
  if (!version) {
    return { action: 'nothing', reason: `no feat, fix or perf commit since v${tagVersion}` };
  }
  // A release MR whose head the bot did not write was edited by a human ·
  // rebuilding it would throw that edit away.
  if (openMr && openMr.headAuthorName !== botName) return { action: 'leave-mr', mrIid: openMr.iid };
  return { action: 'propose', version };
}

const GROUP_OF_TYPE = { feat: 'Added', fix: 'Fixed', perf: 'Fixed' };
const GROUP_ORDER = ['Added', 'Fixed'];

function sectionBody(changelog, heading) {
  const start = changelog.indexOf(heading);
  if (start < 0) return null;
  const bodyStart = start + heading.length;
  const next = changelog.indexOf('\n## ', bodyStart);
  return changelog.slice(bodyStart, next < 0 ? changelog.length : next).trim();
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

/** Fill an empty `[Unreleased]` from the commit subjects. A section somebody
 *  already wrote is theirs: it is returned untouched, never appended to. */
export function fillUnreleased(changelog, commits) {
  if (unreleasedBody(changelog)) return changelog;
  const entries = entriesFrom(commits);
  if (!entries) return changelog;
  return changelog.replace(/^## \[Unreleased\]\s*$/m, `## [Unreleased]\n\n${entries}\n`);
}

export function releaseNotes(changelog, version) {
  const heading = new RegExp(`^## \\[${version.replace(/\./g, '\\.')}\\][^\\n]*`, 'm').exec(
    changelog,
  );
  if (!heading) throw new Error(`CHANGELOG.md has no [${version}] section`);
  return sectionBody(changelog, heading[0]);
}
