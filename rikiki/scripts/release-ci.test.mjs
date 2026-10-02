import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';

// The I/O shell, driven in --dry-run against a throwaway repository: it reads
// git, calls no API and writes nothing, so what it would do is all it prints.

const SCRIPT = resolve(dirname(fileURLToPath(import.meta.url)), 'release-ci.mjs');
const repo = mkdtempSync(join(tmpdir(), 'rikiki-release-'));
afterAll(() => rmSync(repo, { recursive: true, force: true }));

const git = (...args) =>
  execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', ...args], { cwd: repo });
const commit = (subject) => git('commit', '--quiet', '--allow-empty', '-m', subject);
const run = (...args) =>
  execFileSync('node', [SCRIPT, ...args, '--dry-run'], {
    cwd: repo,
    encoding: 'utf8',
    env: { ...process.env, RELEASE_TOKEN: '', RELEASE_VERSION: '' },
  });

describe('release-ci --dry-run', () => {
  git('init', '--quiet', '-b', 'main');
  mkdirSync(join(repo, 'rikiki'));
  writeFileSync(join(repo, 'rikiki/package.json'), JSON.stringify({ version: '0.7.2' }));
  writeFileSync(
    join(repo, 'CHANGELOG.md'),
    '# Changelog\n\n## [Unreleased]\n\n## [0.7.2] - 2026-09-23\n',
  );
  git('add', '.');
  commit('chore(release): v0.7.2');
  git('tag', 'v0.7.2');

  it('has nothing to release after docs only', () => {
    commit('docs: a');
    expect(run('propose')).toContain(
      'nothing to release · no feat, fix or perf commit since v0.7.2',
    );
  });

  it('proposes a minor after a feat, and writes nothing', () => {
    commit('feat(check): b');
    expect(run('propose')).toContain('would propose v0.8.0');
    expect(execFileSync('git', ['status', '--porcelain'], { cwd: repo, encoding: 'utf8' })).toBe(
      '',
    );
  });

  it('tags nothing when the manifest version is already tagged', () => {
    expect(run('tag')).toContain('v0.7.2 already exists');
  });
});
