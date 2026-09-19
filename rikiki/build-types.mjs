#!/usr/bin/env node
// Emit the .d.ts files, then flatten them next to the .js they type.
//
// dist/*.js is flat · esbuild strips the source directory (see build.mjs and
// the note above its walkTs). The declarations were not: tsc mirrors src/, so
// dist/deck-table.js was typed by dist/extras/deck-table.d.ts and a consumer
// importing `rikiki-deck/dist/deck-table.js` resolved no types at all.
//
// Flattening also makes the source tree's shape invisible to dist/, which is
// what lets a directory move produce no change in the published package.

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, renameSync, rmSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const PKG = dirname(fileURLToPath(import.meta.url));
const DIST = resolve(PKG, 'dist');
const STAGE = resolve(DIST, '.types');

rmSync(STAGE, { recursive: true, force: true });
execFileSync('npx', ['tsc', '--emitDeclarationOnly', '-p', 'tsconfig.build.json', '--outDir', STAGE], {
  cwd: PKG,
  stdio: 'inherit',
});

function declarations(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = join(dir, e.name);
    if (e.isDirectory()) return declarations(full);
    return e.name.endsWith('.d.ts') ? [full] : [];
  });
}

const emitted = declarations(STAGE);

// The same guard the JS entry points get · two modules with one basename would
// silently overwrite each other's types once flattened.
const seen = new Map();
for (const file of emitted) {
  const base = file.slice(file.lastIndexOf('/') + 1);
  if (seen.has(base)) {
    throw new Error(
      `build-types · duplicate basename ${base}: ${relative(PKG, seen.get(base))} vs ${relative(PKG, file)}`,
    );
  }
  seen.set(base, file);
}

// Whatever the previous layout left behind · a directory move would otherwise
// leave the old tree beside the new one, both shipped.
for (const entry of readdirSync(DIST, { withFileTypes: true })) {
  if (!entry.isDirectory() || entry.name === 'vendor' || entry.name === '.types') continue;
  const dir = join(DIST, entry.name);
  if (declarations(dir).length > 0) rmSync(dir, { recursive: true, force: true });
}

mkdirSync(DIST, { recursive: true });
for (const [base, file] of seen) renameSync(file, join(DIST, base));
rmSync(STAGE, { recursive: true, force: true });

console.log(`[types] ${seen.size} declarations, flat beside their modules`);
