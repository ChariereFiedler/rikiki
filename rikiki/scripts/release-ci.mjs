#!/usr/bin/env node
// The I/O around release-plan.mjs · git, the GitLab API, npm run bump.
//
//   node rikiki/scripts/release-ci.mjs <propose|tag|gitlab-release|mirror-check> [--dry-run]
//
// Run from the repository root. --dry-run reads git only, calls no API and
// writes nothing: it prints what the job would do. Errors name the operation
// and the HTTP status, never the token.

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { RELEASE_BRANCH, pushReleaseBranch, writeReleaseFiles } from './release-branch.mjs';
import {
  RELEASE_AUTHOR,
  RELEASE_SUBJECT,
  decide,
  pickReleaseMr,
  releaseNotes,
} from './release-plan.mjs';

const MIRROR_POLL_MS = 30_000;
const MIRROR_DEADLINE_MS = 10 * 60_000;
const DEFAULT_MIRROR_URL = 'https://github.com/ChariereFiedler/rikiki.git';

const [command, ...flags] = process.argv.slice(2);
const dryRun = flags.includes('--dry-run');
const env = process.env;

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
const say = (line) => console.log(`release · ${line}`);
const manifestVersion = () => JSON.parse(readFileSync('rikiki/package.json', 'utf8')).version;
const lastTag = () =>
  git('describe', '--tags', '--abbrev=0', '--match', 'v[0-9]*.[0-9]*.[0-9]*', 'HEAD');

function commitsSince(tag) {
  return git('log', '--no-merges', '--format=%s%x1f%b%x1e', `${tag}..HEAD`)
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

async function openReleaseMr() {
  const branch = encodeURIComponent(RELEASE_BRANCH);
  const mrs = await gitlab('GET', `/merge_requests?state=opened&source_branch=${branch}`);
  const mr = pickReleaseMr(mrs, env.CI_PROJECT_ID);
  if (!mr) return null;
  const head = await gitlab('GET', `/repository/commits/${mr.sha}`);
  return { iid: mr.iid, sha: mr.sha, headAuthorName: head.author_name };
}

/** The commit the push may replace · the MR head that was read, or whatever
 *  sits on the branch without an MR, or '' when the branch does not exist. */
function leasedSha(openMr) {
  if (openMr) return openMr.sha;
  return git('ls-remote', 'origin', `refs/heads/${RELEASE_BRANCH}`).split(/\s/)[0] ?? '';
}

function rebuildReleaseBranch(version, commits, expectedSha) {
  git('checkout', '-B', RELEASE_BRANCH);
  writeReleaseFiles('.', version, commits);
  git(
    '-c',
    `user.name=${RELEASE_AUTHOR.name}`,
    '-c',
    `user.email=${RELEASE_AUTHOR.email}`,
    'commit',
    '--quiet',
    '-am',
    RELEASE_SUBJECT(version),
  );
  const remote = `https://oauth2:${env.RELEASE_TOKEN}@${env.CI_SERVER_HOST}/${env.CI_PROJECT_PATH}.git`;
  pushReleaseBranch('.', remote, expectedSha);
}

async function upsertReleaseMr(version, tag, commits, existing) {
  const notes = releaseNotes(readFileSync('CHANGELOG.md', 'utf8'), version);
  const list = commits.map(({ subject }) => `- ${subject}`).join('\n');
  const description = `Proposed by CI from the commits since ${tag}. Merging this MR tags v${version}; publishing to npm is a manual job on the tag pipeline.\n\n## CHANGELOG\n\n${notes}\n\n## Commits\n\n${list}`;
  const fields = { title: RELEASE_SUBJECT(version), description };
  if (existing) return gitlab('PUT', `/merge_requests/${existing.iid}`, fields);
  return gitlab('POST', '/merge_requests', {
    ...fields,
    source_branch: RELEASE_BRANCH,
    target_branch: 'main',
    remove_source_branch: true,
  });
}

async function propose() {
  const tag = lastTag();
  const commits = commitsSince(tag);
  const openMr = dryRun ? null : await openReleaseMr();
  const decision = decide({
    tagVersion: tag.slice(1),
    manifestVersion: manifestVersion(),
    commits,
    override: env.RELEASE_VERSION || undefined,
    openMr,
    botName: RELEASE_AUTHOR.name,
  });
  if (decision.action === 'tag-pending') {
    return say(`v${manifestVersion()} is merged and waits for release:tag`);
  }
  if (decision.action === 'nothing') return say(`nothing to release · ${decision.reason}`);
  // Said in the job log only · a fine-grained token cannot write MR notes.
  if (decision.action === 'leave-mr') {
    return say(
      `!${decision.mrIid} was edited by hand · left as is, main is ${commits.length} commits past ${tag}: rebase it, or close it and the next pipeline proposes again`,
    );
  }
  if (dryRun) {
    return say(`would propose v${decision.version} from ${commits.length} commits since ${tag}`);
  }
  rebuildReleaseBranch(decision.version, commits, leasedSha(openMr));
  const mr = await upsertReleaseMr(decision.version, tag, commits, openMr);
  say(`proposed v${decision.version} · ${mr.web_url}`);
}

async function tag() {
  const version = manifestVersion();
  const name = `v${version}`;
  if (git('tag', '--list', name)) return say(`${name} already exists · nothing to tag`);
  if (dryRun) return say(`would tag ${name} on ${env.CI_COMMIT_SHA ?? git('rev-parse', 'HEAD')}`);
  await gitlab('POST', '/repository/tags', {
    tag_name: name,
    ref: env.CI_COMMIT_SHA,
    message: RELEASE_SUBJECT(version),
  });
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
    if (remoteMain('origin') !== expected) {
      return say('GitLab main moved on · the newer pipeline checks the mirror');
    }
    if (dryRun || Date.now() > deadline) {
      const mirrors = dryRun ? [] : await gitlab('GET', '/remote_mirrors').catch(() => []);
      const lastError = mirrors.map((mirror) => mirror.last_error).find(Boolean);
      const detail = lastError ? ` · mirror error: ${lastError}` : '';
      throw new Error(`GitHub main is ${mirrored}, GitLab main is ${expected}${detail}`);
    }
    await new Promise((resolve) => setTimeout(resolve, MIRROR_POLL_MS));
  }
}

const COMMANDS = {
  propose,
  tag,
  'gitlab-release': gitlabRelease,
  'mirror-check': mirrorCheck,
};

if (!COMMANDS[command]) {
  console.error(`usage: release-ci.mjs <${Object.keys(COMMANDS).join('|')}> [--dry-run]`);
  process.exit(2);
}
COMMANDS[command]().catch((error) => {
  console.error(`release · ${command} failed · ${error.message}`);
  process.exit(1);
});
