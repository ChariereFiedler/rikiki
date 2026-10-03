import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';
import { pushReleaseBranch, writeReleaseFiles } from './release-branch.mjs';
import { releaseNotes, unreleasedBody } from './release-plan.mjs';

// The files a release MR carries, written on a scratch clone · the bump
// rewrites the version surfaces of the tree it runs in.
const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const SCRIPTS_UNDER_TEST = [
  'rikiki/scripts/bump-version.mjs',
  'rikiki/scripts/version-surfaces.mjs',
];
const scratches = [];
afterAll(() => {
  for (const dir of scratches) rmSync(dir, { recursive: true, force: true });
});

const git = (cwd, ...args) =>
  execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', ...args], {
    cwd,
    encoding: 'utf8',
  }).trim();

function scratchClone() {
  const dir = mkdtempSync(join(tmpdir(), 'rikiki-release-branch-'));
  scratches.push(dir);
  execFileSync('git', ['clone', '--quiet', '--shared', REPO, dir]);
  for (const file of SCRIPTS_UNDER_TEST) copyFileSync(join(REPO, file), join(dir, file));
  return dir;
}

const nextMinor = (root) => {
  const { version } = JSON.parse(readFileSync(join(root, 'rikiki/package.json'), 'utf8'));
  const [major, minor] = version.split('.').map(Number);
  return `${major}.${minor + 1}.0`;
};

const withUnreleased = (root, body) => {
  const file = join(root, 'CHANGELOG.md');
  const emptied = readFileSync(file, 'utf8').replace(
    /## \[Unreleased\][\s\S]*?(?=\n## \[\d)/,
    `## [Unreleased]\n\n${body}`,
  );
  writeFileSync(file, emptied);
};

describe('writeReleaseFiles', () => {
  it('puts the generated entries in the new version section, not in a reopened Unreleased', () => {
    const root = scratchClone();
    withUnreleased(root, '');
    const version = nextMinor(root);
    writeReleaseFiles(root, version, [{ subject: 'feat(check): warn on doubled icons', body: '' }]);
    const changelog = readFileSync(join(root, 'CHANGELOG.md'), 'utf8');
    expect(releaseNotes(changelog, version)).toBe('### Added\n- check: warn on doubled icons');
    expect(unreleasedBody(changelog)).toBe('');
  }, 60_000);

  it('promotes a hand-written Unreleased untouched and adds nothing to it', () => {
    const root = scratchClone();
    withUnreleased(root, '### Fixed\n- written by hand.\n');
    const version = nextMinor(root);
    writeReleaseFiles(root, version, [{ subject: 'feat: generated', body: '' }]);
    const changelog = readFileSync(join(root, 'CHANGELOG.md'), 'utf8');
    expect(releaseNotes(changelog, version)).toBe('### Fixed\n- written by hand.');
    expect(unreleasedBody(changelog)).toBe('');
  }, 60_000);
});

describe('pushReleaseBranch', () => {
  function remoteWithBranch() {
    const remote = mkdtempSync(join(tmpdir(), 'rikiki-release-remote-'));
    const work = mkdtempSync(join(tmpdir(), 'rikiki-release-work-'));
    scratches.push(remote, work);
    git(remote, 'init', '--quiet', '--bare');
    git(work, 'init', '--quiet', '-b', 'main');
    git(work, 'commit', '--quiet', '--allow-empty', '-m', 'base');
    git(work, 'push', '--quiet', remote, 'HEAD:refs/heads/release/next');
    return { remote, work, leased: git(work, 'rev-parse', 'HEAD') };
  }

  it('replaces the branch it read', () => {
    const { remote, work, leased } = remoteWithBranch();
    git(work, 'commit', '--quiet', '--allow-empty', '-m', 'chore(release): v9.9.9');
    pushReleaseBranch(work, remote, leased);
    expect(git(remote, 'rev-parse', 'release/next')).toBe(git(work, 'rev-parse', 'HEAD'));
  });

  it('refuses to overwrite a push that landed after the branch was read', () => {
    const { remote, work, leased } = remoteWithBranch();
    const human = mkdtempSync(join(tmpdir(), 'rikiki-release-human-'));
    scratches.push(human);
    execFileSync('git', ['clone', '--quiet', '-b', 'release/next', remote, human]);
    git(human, 'commit', '--quiet', '--allow-empty', '-m', 'fix the notes by hand');
    git(human, 'push', '--quiet', 'origin', 'HEAD:refs/heads/release/next');
    git(work, 'commit', '--quiet', '--allow-empty', '-m', 'chore(release): v9.9.9');
    expect(() => pushReleaseBranch(work, remote, leased)).toThrow('git push release/next refused');
    expect(git(remote, 'log', '-1', '--format=%s', 'release/next')).toBe('fix the notes by hand');
  });

  it('creates the branch only when it does not exist yet', () => {
    const remote = mkdtempSync(join(tmpdir(), 'rikiki-release-remote-'));
    const work = mkdtempSync(join(tmpdir(), 'rikiki-release-work-'));
    scratches.push(remote, work);
    git(remote, 'init', '--quiet', '--bare');
    git(work, 'init', '--quiet', '-b', 'main');
    git(work, 'commit', '--quiet', '--allow-empty', '-m', 'chore(release): v9.9.9');
    pushReleaseBranch(work, remote, '');
    expect(git(remote, 'rev-parse', 'release/next')).toBe(git(work, 'rev-parse', 'HEAD'));
  });
});
