// Release-consistency tests: fail when any "current version" surface drifts
// from rikiki/package.json. See scripts/version-surfaces.mjs for the manifest.

import { describe, expect, it } from 'vitest';
import {
  CHANGELOG,
  EXACT,
  HISTORICAL,
  SITE_CHANGELOG,
  changelogEntry,
  compareSemver,
  read,
  readCurrentVersion,
  releasedSectionsWithoutDate,
  siteMentionsVersion,
  versionsIn,
} from './version-surfaces.mjs';

const current = readCurrentVersion();

describe(`rikiki version consistency (current: ${current})`, () => {
  describe('exact surfaces equal the current version', () => {
    for (const surface of EXACT) {
      it(surface.label, () => {
        const text = read(surface.file);
        const hits = [...text.matchAll(surface.find)].map((m) => m[1]);
        expect(hits, `no version match in ${surface.label}`).not.toHaveLength(0);
        for (const v of hits) expect(v).toBe(current);
      });
    }
  });

  describe('historical surfaces mention no future version', () => {
    for (const surface of HISTORICAL) {
      it(surface.label, () => {
        const offenders = versionsIn(read(surface.file)).filter(
          (v) => compareSemver(v, current) > 0,
        );
        expect(offenders, `${surface.label} mentions unreleased version(s)`).toEqual([]);
      });
    }
  });

  describe('CHANGELOG.md', () => {
    const text = read(CHANGELOG);

    it('has a dated entry for the current version', () => {
      const entry = changelogEntry(text, current);
      expect(entry.found, `no "## [${current}] - <date>" section`).toBe(true);
    });

    it('gives every released section a date', () => {
      expect(releasedSectionsWithoutDate(text)).toEqual([]);
    });
  });

  describe('site changelog', () => {
    it('mentions the current version', () => {
      expect(
        siteMentionsVersion(read(SITE_CHANGELOG), current),
        `site changelog has no "<h2>${current} ·" section`,
      ).toBe(true);
    });
  });
});
