// ════════════════════════════════════════════════════════════════
// What the built site is allowed to contain.
//
// A published site is a public surface: development data in it is at best
// weight, at worst disclosure. This runs after `astro build` and fails the
// build rather than reporting afterwards.
// ════════════════════════════════════════════════════════════════

import { readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(SITE_DIR, 'dist');

// Each rule names what it keeps out and why the reader should care.
const FORBIDDEN = [
  { test: (p) => /(^|\/)node_modules(\/|$)/.test(p), why: 'dependency tree' },
  { test: (p) => p.endsWith('.ts') && !p.endsWith('.d.ts'), why: 'TypeScript source' },
  { test: (p) => /(^|\/)(src|e2e|scripts|test-results|playwright-report)(\/|$)/.test(p), why: 'development directory' },
  // `decks/` at the root is the published example gallery · the same segment
  // anywhere else is a working directory that must not ship.
  { test: (p) => /(^|\/)decks(\/|$)/.test(p) && !p.startsWith('decks/'), why: 'development directory' },
  { test: (p) => /(^|\/)\.(env|git|astro)(\/|$)/.test(p), why: 'local or version-control data' },
  { test: (p) => /(^|\/)(package(-lock)?\.json|tsconfig[^/]*\.json|vitest\.config\.[cm]?[jt]s|playwright\.config\.[cm]?[jt]s|biome\.json)$/.test(p), why: 'build manifest' },
  { test: (p) => /\.(map|tsbuildinfo|log)$/.test(p), why: 'build by-product' },
];

const MAX_MB = 60;

function* walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const abs = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(abs);
    else yield abs;
  }
}

const offences = [];
let bytes = 0;
for (const abs of walk(DIST)) {
  const rel = relative(DIST, abs).split('\\').join('/');
  bytes += statSync(abs).size;
  const rule = FORBIDDEN.find((r) => r.test(rel));
  if (rule) offences.push(`${rel} · ${rule.why}`);
}

const megabytes = bytes / 1024 / 1024;
if (megabytes > MAX_MB) {
  offences.push(`the built site weighs ${megabytes.toFixed(0)} MB · budget is ${MAX_MB} MB`);
}

if (offences.length) {
  console.error('check-dist · the built site contains what it must not publish:');
  for (const o of offences.slice(0, 20)) console.error('  · ' + o);
  if (offences.length > 20) console.error(`  · … and ${offences.length - 20} more`);
  process.exit(1);
}

console.log(`check-dist · clean · ${megabytes.toFixed(1)} MB published`);
