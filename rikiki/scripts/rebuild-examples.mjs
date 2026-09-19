#!/usr/bin/env node
// Regenerate the committed single-file examples.
//
// examples/*/index.html are built from their source.html and inline the whole
// runtime, so ANY change to dist/ makes them stale. They are served in
// production, and `.gitlab-ci.yml` fails the pipeline on the drift.
//
// This exists because forgetting it cost two red pipelines in one day: the
// step lived only inside the CI file, as a shell loop nobody runs locally.
// One command, next to `npm run build`, is the difference between a habit and
// a trap.
//
//   npm run examples        rebuild, report what moved
//   npm run examples -- --check   report drift and exit 1, changing nothing

import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const PKG_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const EXAMPLES = resolve(PKG_DIR, '..', 'examples');
const check = process.argv.includes('--check');

const decks = readdirSync(EXAMPLES, { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => join(EXAMPLES, e.name, 'source.html'))
  .filter((source) => {
    try {
      readFileSync(source);
      return true;
    } catch {
      // A directory without a source.html is hand-written, not generated.
      return false;
    }
  });

if (decks.length === 0) {
  console.error('examples · no source.html found · has the layout changed?');
  process.exit(1);
}

const stale = [];
for (const source of decks) {
  const out = join(dirname(source), 'index.html');
  const before = (() => {
    try {
      return readFileSync(out, 'utf8');
    } catch {
      return null;
    }
  })();

  execFileSync(process.execPath, [resolve(PKG_DIR, 'bundle.mjs'), source, out], {
    cwd: PKG_DIR,
    stdio: 'pipe',
  });

  const after = readFileSync(out, 'utf8');
  const moved = before !== after;
  if (moved) stale.push(out.slice(EXAMPLES.length + 1));
  // --check must not leave the tree modified · put back what was there.
  if (check && moved && before !== null) writeFileSync(out, before);
  console.log(`  ${moved ? 'stale ' : 'current'}  ${out.slice(EXAMPLES.length + 1)}`);
}

if (check && stale.length > 0) {
  console.error(`\nexamples · ${stale.length} stale · run \`npm run examples\` and commit`);
  process.exit(1);
}
console.log(
  stale.length === 0
    ? '\nexamples · already current'
    : `\nexamples · ${stale.length} rebuilt · commit them with the source`,
);
