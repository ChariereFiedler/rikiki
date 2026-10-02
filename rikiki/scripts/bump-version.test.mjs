import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, expect, it } from 'vitest';

// The bump runs on a scratch clone · it rewrites the version surfaces of the
// tree it lives in, and this repository's must not move under a test.
const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const scratch = mkdtempSync(join(tmpdir(), 'rikiki-bump-'));
afterAll(() => rmSync(scratch, { recursive: true, force: true }));

// The scripts under test come from the working tree, not from the last commit:
// the clone gives a clean tree to diff, the copies give the code being tested.
const SCRIPTS_UNDER_TEST = [
  'rikiki/scripts/bump-version.mjs',
  'rikiki/scripts/version-surfaces.mjs',
];

it('bumps the version surfaces and leaves the generated site changelog alone', () => {
  // --shared · a hard-linked --local clone fails when tmp is another filesystem.
  execFileSync('git', ['clone', '--quiet', '--shared', REPO, scratch]);
  for (const file of SCRIPTS_UNDER_TEST) copyFileSync(join(REPO, file), join(scratch, file));
  execFileSync('git', ['update-index', '--assume-unchanged', ...SCRIPTS_UNDER_TEST], {
    cwd: scratch,
  });
  const manifest = JSON.parse(readFileSync(join(scratch, 'rikiki/package.json'), 'utf8'));
  const [major, minor] = manifest.version.split('.').map(Number);
  execFileSync(
    'node',
    ['rikiki/scripts/bump-version.mjs', `${major}.${minor + 1}.0`, '--date=2026-10-02'],
    {
      cwd: scratch,
    },
  );
  const changed = execFileSync('git', ['diff', '--name-only'], { cwd: scratch, encoding: 'utf8' })
    .split('\n')
    .filter(Boolean);
  expect(changed).toEqual(
    expect.arrayContaining(['CHANGELOG.md', 'rikiki/package.json', 'rikiki/package-lock.json']),
  );
  // The page renders CHANGELOG.md itself · a stub written into it would ship
  // as "TODO: write release notes" in every automated release.
  expect(changed).not.toContain('site/src/pages/docs/changelog.astro');
}, 60_000);
