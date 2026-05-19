#!/usr/bin/env node
// Build script · esbuild compiles src/*.ts → dist/*.js (ESM, not bundled)
// Each module stays its own file so consumers can lazy-load any component.
// Type declarations (.d.ts) come from `tsc --emitDeclarationOnly` (see package.json).

import { build, context } from 'esbuild';
import { readdirSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(__dirname, 'src');
const OUT = resolve(__dirname, 'dist');

mkdirSync(OUT, { recursive: true });

const entryPoints = readdirSync(SRC)
  .filter((f) => f.endsWith('.ts'))
  .map((f) => resolve(SRC, f));

// Rewrite bare module specs ('lit', 'marked') to their jsdelivr CDN URLs at build time.
// Consumers get plain ES modules that resolve in any browser without an import map.
const CDN_ALIASES = {
  lit:    'https://cdn.jsdelivr.net/npm/lit@3/+esm',
  marked: 'https://cdn.jsdelivr.net/npm/marked@12/+esm',
};

const cdnRewrite = {
  name: 'cdn-rewrite',
  setup(b) {
    b.onResolve({ filter: /^(lit|marked)$/ }, (args) => ({
      path: CDN_ALIASES[args.path],
      external: true,
    }));
  },
};

const config = {
  entryPoints,
  outdir: OUT,
  format: 'esm',
  target: 'es2022',
  platform: 'browser',
  bundle: true,                 // resolve relative imports + apply plugin
  splitting: false,
  outExtension: { '.js': '.js' },
  sourcemap: true,
  plugins: [cdnRewrite],
  // Keep each component its own file (no chunk merging since splitting is off
  // and entryPoints is the full src/*.ts list).
  logLevel: 'info',
};

if (process.argv.includes('--watch')) {
  const ctx = await context(config);
  await ctx.watch();
  console.log('[esbuild] watching src/*.ts → dist/');
} else {
  await build(config);
}
