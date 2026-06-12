#!/usr/bin/env node
// Deterministic version bump across every rikiki release surface.
//
//   npm run bump <version> [--date=YYYY-MM-DD]
//
// Edits package.json + package-lock.json, opens a dated CHANGELOG section,
// stubs a site changelog section, and restamps the demo deck + doc stamps.
// It never writes the release prose itself — the bump-version skill does that.

import { readFileSync, writeFileSync } from 'node:fs';
import {
  CHANGELOG,
  EXACT,
  PACKAGE_JSON,
  SITE_CHANGELOG,
  compareSemver,
  parseSemver,
  readCurrentVersion,
} from './version-surfaces.mjs';

const args = process.argv.slice(2);
const next = args.find((a) => !a.startsWith('--'));
const dateArg = args.find((a) => a.startsWith('--date='))?.slice('--date='.length);

if (!next) {
  console.error('usage: npm run bump <version> [--date=YYYY-MM-DD]');
  process.exit(1);
}

parseSemver(next); // throws on a non-semver argument

const current = readCurrentVersion();
if (compareSemver(next, current) <= 0) {
  console.error(`refusing to bump: ${next} is not greater than current ${current}`);
  process.exit(1);
}

const today = dateArg ?? new Date().toISOString().slice(0, 10);
const slug = `v${next.replace(/\./g, '')}`;

const edit = (file, fn) => {
  const before = readFileSync(file, 'utf8');
  const after = fn(before);
  if (after !== before) writeFileSync(file, after);
  return after !== before;
};

// 1. package.json — the source of truth.
edit(PACKAGE_JSON, (t) => t.replace(/("version":\s*")\d+\.\d+\.\d+(")/, `$1${next}$2`));

// 2. + 5. every EXACT surface (package-lock, demo deck anchors, doc stamps):
// rewrite each captured version to the new one, in place.
const touched = new Set();
for (const { file } of EXACT) touched.add(file);
for (const file of touched) {
  edit(file, (t) => {
    let out = t;
    for (const { file: f, find } of EXACT) {
      if (f !== file) continue;
      out = out.replace(new RegExp(find.source, 'g'), (full, v) => full.replace(v, next));
    }
    return out;
  });
}

// 3. CHANGELOG.md — promote [Unreleased] to a dated section, reopen Unreleased.
edit(CHANGELOG, (t) =>
  t.replace(/^## \[Unreleased\]\s*$/m, `## [Unreleased]\n\n## [${next}] - ${today}`),
);

// 4. site changelog — insert a stub section above the latest one.
edit(SITE_CHANGELOG, (t) => {
  const stub =
    `<h2 id="${slug}">${next} · ${today}</h2>\n\n` +
    `<h3>Added</h3>\n<ul>\n  <li>TODO: write release notes</li>\n</ul>\n\n`;
  return t.replace(/(<h2\b)/, `${stub}$1`);
});

console.log(`bumped ${current} → ${next} (${today})`);
console.log('next: fill the CHANGELOG + site release notes, then run `npm test`.');
