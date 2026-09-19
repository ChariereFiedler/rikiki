#!/usr/bin/env node
// Generate the root README from its template, with every figure measured now.
//
// The README claims its numbers are derived rather than typed. Two ways to
// make that true: check them after the fact, or produce them. This is the
// second, and it is the pattern the repository already uses twice · dist/ and
// examples/*/index.html are generated, committed, and guarded against drift.
// A third instance is one habit, not one more mechanism.
//
//   npm run readme            regenerate, report whether it moved
//   npm run readme -- --check report drift and exit 1, changing nothing
//
// A value that cannot be measured fails the build rather than falling back to
// a plausible number · a README that silently prints a default is exactly the
// failure this replaces.

import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { bundledElements, separateElements } from './component-surfaces.mjs';
import { measureSizes, toKb } from './size-surfaces.mjs';

const PKG_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const REPO_ROOT = resolve(PKG_DIR, '..');
const TEMPLATE = resolve(REPO_ROOT, 'README.template.md');
const TARGET = resolve(REPO_ROOT, 'README.md');

const check = process.argv.includes('--check');
const pkg = JSON.parse(readFileSync(resolve(PKG_DIR, 'package.json'), 'utf8'));

/** What each CLI command is for, in the words a reader needs.
 *
 *  The command LIST comes from `rikiki --help`, so a new command cannot be
 *  quietly missing from the README · but its one-line description is prose,
 *  and prose belongs to a person. A command with no entry here stops the
 *  build. */
const CLI_DESCRIPTIONS = {
  init: 'write an editable deck and its runtime, or one self-contained file',
  assemble: 'build a deck from ordered partials',
  bundle: 'fold an existing deck into a single offline file',
  render: 'one PNG per slide, plus a gallery · `--steps` for each revealed state',
  check:
    'measure the deck and report what is wrong, from clipped text to a slide that says nothing',
  export: 'PDF, one slide per page',
  skills: 'install the Claude Code skills into a project',
};

function cliCommands() {
  const help = execFileSync(process.execPath, [resolve(PKG_DIR, 'bin/rikiki.mjs'), '--help'], {
    encoding: 'utf8',
  });
  const names = [...help.matchAll(/^ {2}rikiki ([a-z]+)/gm)].map((m) => m[1]);
  const unique = [...new Set(names)];
  if (unique.length === 0) throw new Error('readme · no command found in `rikiki --help`');
  const undocumented = unique.filter((name) => !CLI_DESCRIPTIONS[name]);
  if (undocumented.length > 0) {
    throw new Error(
      `readme · these commands have no description in build-readme.mjs: ${undocumented.join(', ')}`,
    );
  }
  return unique.map((name) => `| \`${name}\` | ${CLI_DESCRIPTIONS[name]} |`).join('\n');
}

function themeList() {
  const themes = readdirSync(resolve(PKG_DIR, 'themes'))
    .filter((f) => f.endsWith('.css') && !f.includes('-fonts'))
    .map((f) => f.slice(0, -4))
    .sort();
  if (themes.length === 0) throw new Error('readme · no theme found');
  return themes.map((t) => `\`${t}\``).join(' and ');
}

/** The skills the PACKAGE ships, read from package.json `files` · a skill that
 *  exists in the repository but is not published would be a promise the
 *  installed package cannot keep. */
function shippedSkills() {
  // Manifest order, not alphabetical · the author listed them in the order a
  // reader meets them, and sorting puts `rikiki-debug` first.
  const skills = (pkg.files ?? [])
    .filter((entry) => entry.startsWith('.claude/skills/'))
    .map((entry) => entry.slice('.claude/skills/'.length));
  if (skills.length === 0) throw new Error('readme · package.json ships no skill');
  return skills;
}

function lineCount(relative) {
  const text = readFileSync(resolve(PKG_DIR, relative), 'utf8');
  return text.split('\n').filter((line, i, all) => i < all.length - 1 || line !== '').length;
}

function nodeRange() {
  const majors = [...pkg.engines.node.matchAll(/(\d+)\.(\d+)\.\d+/g)].map(
    (m) => `${m[1]}.${m[2]}+`,
  );
  if (majors.length === 0)
    throw new Error(`readme · cannot read engines.node: ${pkg.engines.node}`);
  return majors.join(' or ');
}

const sizes = measureSizes();
const bundled = bundledElements().length;
const separate = separateElements().length;

if (!pkg.homepage) throw new Error('readme · package.json has no homepage to link to');

const VALUES = {
  version: pkg.version,
  site: pkg.homepage,
  bundled: String(bundled),
  separate: String(separate),
  initialLoadKb: String(toKb(sizes.initialLoadGzip)),
  engineKb: String(toKb(sizes.bundleGzip)),
  standaloneKb: String(toKb(sizes.standaloneGzip)),
  themeCount: String(themeList().split(' and ').length),
  themes: themeList(),
  cliTable: cliCommands(),
  // "20.19+ or 22.12+", not the raw range. Two reasons: it is what a reader
  // needs, and a bare three-part version in this file reads as a RIKIKI
  // version to scripts/version.test.mjs, which then reports 20.19.0 as a
  // release from the future.
  node: nodeRange(),
  prodDeps: String(Object.keys(pkg.dependencies ?? {}).length),
  skills: shippedSkills()
    .map((s) => `\`${s}\``)
    .join(', '),
  skillCount: String(shippedSkills().length),
  referenceLines: String(lineCount('docs/llms/rikiki-reference.md')),
  workflowLines: String(lineCount('docs/llms/rikiki-workflow.md')),
};

const BANNER = `<!-- Generated from README.template.md · run \`npm run readme\` in rikiki/. Do not edit this file. -->\n`;

const template = readFileSync(TEMPLATE, 'utf8');
const unknown = [...template.matchAll(/\{\{\s*([a-zA-Z]+)\s*\}\}/g)]
  .map((m) => m[1])
  .filter((name) => !(name in VALUES));
if (unknown.length > 0) {
  throw new Error(`readme · template asks for unknown values: ${[...new Set(unknown)].join(', ')}`);
}

const rendered = BANNER + template.replace(/\{\{\s*([a-zA-Z]+)\s*\}\}/g, (_, name) => VALUES[name]);

const before = (() => {
  try {
    return readFileSync(TARGET, 'utf8');
  } catch {
    return null;
  }
})();

if (rendered === before) {
  console.log('readme · already current');
  process.exit(0);
}

if (check) {
  console.error('readme · stale · run `npm run readme` and commit README.md');
  process.exit(1);
}

writeFileSync(TARGET, rendered);
console.log('readme · regenerated');
for (const [name, value] of Object.entries(VALUES)) {
  if (name === 'cliTable') continue;
  console.log(`    ${name.padEnd(14)} ${value}`);
}
