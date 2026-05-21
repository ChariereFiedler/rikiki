#!/usr/bin/env node
// Forbid the em-dash (—) in source files. Authoring convention is
// middle-dot ( · ) instead. Run via `npm run lint:dashes`.
//
// Exit 0 if clean, 1 if any em-dash is found · prints file:line: snippet
// for each occurrence.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOTS = ['src', '../rikiki/src', '../rikiki/themes', '../examples'];
const EXTENSIONS = new Set(['.astro', '.ts', '.tsx', '.js', '.mjs', '.css', '.html', '.md']);
const IGNORE = new Set(['node_modules', 'dist', '.astro', '.vscode', '.git']);
const FORBIDDEN = '—';                // em-dash
const SUGGESTED  = '·';               // middle-dot · for narrative
const CWD = process.cwd();

let hits = 0;

function walk(dir) {
  let entries;
  try { entries = readdirSync(dir); } catch { return; }
  for (const name of entries) {
    if (IGNORE.has(name)) continue;
    const p = join(dir, name);
    let s;
    try { s = statSync(p); } catch { continue; }
    if (s.isDirectory()) { walk(p); continue; }
    const dot = name.lastIndexOf('.');
    if (dot === -1) continue;
    const ext = name.slice(dot);
    if (!EXTENSIONS.has(ext)) continue;
    scan(p);
  }
}

function scan(path) {
  const raw = readFileSync(path, 'utf8');
  const lines = raw.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(FORBIDDEN)) {
      hits++;
      const rel = relative(CWD, path);
      const trimmed = lines[i].trim().slice(0, 120);
      console.error(`${rel}:${i + 1}: ${trimmed}`);
    }
  }
}

for (const r of ROOTS) walk(r);

if (hits > 0) {
  console.error(`\n  ${hits} em-dash occurrence(s) · use "${SUGGESTED}" (middle-dot) instead.\n`);
  process.exit(1);
}
process.stdout.write(`lint:dashes · OK · no em-dash found in ${ROOTS.join(', ')}\n`);
