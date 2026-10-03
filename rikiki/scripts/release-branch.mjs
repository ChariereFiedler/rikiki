// The two writes release:propose makes, apart from the API: the files a
// release MR carries, and the push of its branch. Kept out of release-ci.mjs
// so both run in tests against real repositories.

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fillUnreleased } from './release-plan.mjs';

export const RELEASE_BRANCH = 'release/next';

/**
 * Bump every version surface, with a CHANGELOG section for `version`.
 *
 * Unreleased is filled first: the bump promotes it into the version section
 * and reopens an empty one. Filled after, the entries landed in the reopened
 * Unreleased · empty release notes, and entries that the next release then
 * took for hand-written ones.
 */
export function writeReleaseFiles(root, version, commits) {
  const changelog = join(root, 'CHANGELOG.md');
  writeFileSync(changelog, fillUnreleased(readFileSync(changelog, 'utf8'), commits));
  execFileSync('node', ['scripts/bump-version.mjs', version], {
    cwd: join(root, 'rikiki'),
    stdio: 'ignore',
  });
}

/**
 * Push HEAD to the release branch, replacing only the commit that was read
 * (`expectedSha`, '' when the branch did not exist). A human push landed in
 * between is never overwritten.
 */
export function pushReleaseBranch(root, remote, expectedSha) {
  const lease = `--force-with-lease=refs/heads/${RELEASE_BRANCH}:${expectedSha}`;
  try {
    // stdio ignored · git echoes the remote URL, token included, on some errors.
    execFileSync('git', ['push', '--quiet', lease, remote, `HEAD:refs/heads/${RELEASE_BRANCH}`], {
      cwd: root,
      stdio: 'ignore',
    });
  } catch {
    throw new Error(
      `git push ${RELEASE_BRANCH} refused · it moved since it was read, or the token cannot push`,
    );
  }
}
