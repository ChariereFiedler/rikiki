import { describe, expect, it } from 'vitest';
import {
  RELEASE_AUTHOR,
  RELEASE_SUBJECT,
  bumpFor,
  decide,
  fillUnreleased,
  nextVersion,
  parseSubject,
  releaseNotes,
  unreleasedBody,
} from './release-plan.mjs';

const c = (subject, body = '') => ({ subject, body });

describe('parseSubject', () => {
  it('reads type, scope and description', () => {
    expect(parseSubject('fix(graph): measure in canvas pixels (Closes #26)')).toEqual({
      type: 'fix',
      scope: 'graph',
      breaking: false,
      description: 'measure in canvas pixels (Closes #26)',
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
    expect(bumpFor([c('docs: a'), c('chore(release): v0.7.2'), c('Polish copy')], '0.7.2')).toBe(
      'none',
    );
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
  const base = {
    tagVersion: '0.7.2',
    manifestVersion: '0.7.2',
    commits: [c('feat: a')],
    override: undefined,
    openMr: null,
    botName: 'release-bot',
  };

  it('proposes the computed version', () => {
    expect(decide(base)).toEqual({ action: 'propose', version: '0.8.0' });
  });
  it('waits for the tag when a release is merged but not tagged', () => {
    expect(decide({ ...base, manifestVersion: '0.8.0' })).toEqual({ action: 'tag-pending' });
  });
  it('says why there is nothing to release', () => {
    expect(decide({ ...base, commits: [c('docs: a')] })).toEqual({
      action: 'nothing',
      reason: 'no feat, fix or perf commit since v0.7.2',
    });
  });
  it('honours an override above the tag, even with nothing releasable', () => {
    expect(decide({ ...base, commits: [], override: '0.9.0' })).toEqual({
      action: 'propose',
      version: '0.9.0',
    });
  });
  it('refuses an override at or below the tag', () => {
    expect(() => decide({ ...base, override: '0.7.2' })).toThrow(
      'RELEASE_VERSION 0.7.2 is not greater than v0.7.2',
    );
  });
  it('leaves a release MR a human has edited', () => {
    expect(
      decide({ ...base, openMr: { iid: 21, headAuthorName: 'Cédric Chariere Fiedler' } }),
    ).toEqual({ action: 'leave-mr', mrIid: 21 });
  });
  it('rebuilds a release MR the bot still owns', () => {
    expect(decide({ ...base, openMr: { iid: 21, headAuthorName: 'release-bot' } })).toEqual({
      action: 'propose',
      version: '0.8.0',
    });
  });
});

it('signs release commits with a name no human commits under', () => {
  // The token is a person's, so the GitLab account cannot tell CI from its
  // owner · the git author name is what separates them.
  expect(RELEASE_AUTHOR.name).toBe('rikiki release (CI)');
  expect(
    decide({
      tagVersion: '0.7.2',
      manifestVersion: '0.7.2',
      commits: [c('feat: a')],
      openMr: { iid: 3, headAuthorName: 'Cédric Chariere Fiedler' },
      botName: RELEASE_AUTHOR.name,
    }),
  ).toEqual({ action: 'leave-mr', mrIid: 3 });
});

it('names the release commit with an allowed type', () => {
  expect(RELEASE_SUBJECT('0.8.0')).toBe('chore(release): v0.8.0');
});

const LOG = '# Changelog\n\n## [Unreleased]\n\n## [0.7.2] - 2026-09-23\n\n### Fixed\n- a fix.\n';

describe('CHANGELOG', () => {
  it('reads an empty Unreleased section as empty', () => {
    expect(unreleasedBody(LOG)).toBe('');
  });
  it('fills an empty Unreleased section, Added before Fixed, scope kept', () => {
    const out = fillUnreleased(LOG, [
      c('fix(graph): measure (Closes #26)'),
      c('feat(check): ICON_DOUBLED'),
      c('docs: x'),
    ]);
    expect(unreleasedBody(out)).toBe(
      '### Added\n- check: ICON_DOUBLED\n\n### Fixed\n- graph: measure (Closes #26)',
    );
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
