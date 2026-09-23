#!/usr/bin/env node
// Guard against placeholder / wrong outbound references creeping back into the
// site. Two regressions were shipped once and must not return:
//
//   · `github.com`  · rikiki is GitLab-hosted (gitlab.com/tordu-jardin/rikiki),
//                     there is no public GitHub mirror. The "Source" links used
//                     to point at the bare github.com landing page.
//   · `rikiki.dev`  · the canonical domain is rikiki.tordu-jardin.fr. An old
//                     placeholder domain lived in astro.config.mjs.
//
// Run via `npm run lint:links`. Exit 0 if clean, 1 if any forbidden token is
// found · prints file:line: snippet for each occurrence.

import { readdirSync, readFileSync, lstatSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

// Site-owned surfaces only. public/ holds the framework and the example decks
// (rikiki, embed, decks, sample, stress) · those are vendored, so we lint only
// what the site itself authors. Some arrive as symlinks and some as copies made
// by scripts/stage-assets.mjs, so both are skipped: a bundled deck carries its
// vendors' strings, and marked's error message names github.com.
const ROOTS = ['src', 'public'];
const STAGED = new Set(['public/rikiki', 'public/embed', 'public/decks', 'public/sample', 'public/stress']);
// Third-party OFL notices retain their authors' original attribution URLs.
const VENDOR_LICENSES = /^public\/stories\/art\/fonts\/[a-z-]+-OFL\.txt$/;
const FILES = ['astro.config.mjs'];
const EXTENSIONS = new Set(['.astro', '.ts', '.tsx', '.js', '.mjs', '.css', '.html', '.md', '.txt', '.json']);
const IGNORE = new Set(['node_modules', 'dist', '.astro', '.vscode', '.git']);

// token · substring to forbid · fix · the correct replacement to steer toward.
const FORBIDDEN = [
  { token: 'github.com', fix: 'link to https://gitlab.com/tordu-jardin/rikiki (the project is GitLab-hosted)' },
  { token: 'rikiki.dev', fix: 'use the canonical domain https://rikiki.tordu-jardin.fr' },
];
const CWD = process.cwd();

let hits = 0;

function walk(dir) {
  let entries;
  try { entries = readdirSync(dir); } catch { return; }
  for (const name of entries) {
    if (IGNORE.has(name)) continue;
    const p = join(dir, name);
    let s;
    try { s = lstatSync(p); } catch { continue; }
    if (s.isSymbolicLink()) continue;              // vendored symlink · out of scope
    if (STAGED.has(relative(CWD, p).split(sep).join('/'))) continue; // staged copy · same
    if (s.isDirectory()) { walk(p); continue; }
    const dot = name.lastIndexOf('.');
    if (dot === -1) continue;
    if (!EXTENSIONS.has(name.slice(dot))) continue;
    if (VENDOR_LICENSES.test(relative(CWD, p).split(sep).join('/'))) continue;
    scan(p);
  }
}

function scan(path) {
  let raw;
  try { raw = readFileSync(path, 'utf8'); } catch { return; }
  const lines = raw.split('\n');
  for (let i = 0; i < lines.length; i++) {
    for (const { token, fix } of FORBIDDEN) {
      if (lines[i].includes(token)) {
        hits++;
        const rel = relative(CWD, path);
        const trimmed = lines[i].trim().slice(0, 120);
        console.error(`${rel}:${i + 1}: [${token}] ${trimmed}\n    ↳ ${fix}`);
      }
    }
  }
}

for (const r of ROOTS) walk(r);
for (const f of FILES) scan(f);

if (hits > 0) {
  console.error(`\n  ${hits} forbidden reference(s) found · see fixes above.\n`);
  process.exit(1);
}
process.stdout.write(`lint:links · OK · no forbidden references in ${[...ROOTS, ...FILES].join(', ')}\n`);
