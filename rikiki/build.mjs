#!/usr/bin/env node
// Build script · esbuild compiles src/*.ts → dist/*.js (ESM, not bundled)
// Each module stays its own file so consumers can lazy-load any component.
// Type declarations (.d.ts) come from `tsc --emitDeclarationOnly` (see package.json).

import { build, context } from 'esbuild';
import { readdirSync, mkdirSync, statSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { minifyTemplates } from './minify-templates.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(__dirname, 'src');
const OUT = resolve(__dirname, 'dist');

mkdirSync(OUT, { recursive: true });

// src/ is organised in design-system buckets · runtime/, layouts/,
// molecules/, atoms/, plugins/ · plus a few files at the root
// (index.ts, shared-styles.ts, livereload.ts). Walk recursively so
// each .ts becomes its own entry point. dist/ is FLAT regardless of
// the bucket the source lives in (see entryNames in config below).
//
// Why flat dist/ · deck-root's dynamic imports (`await import(
// './deck-help.js')` etc.) get marked external by the plugin below
// so esbuild leaves them verbatim in the bundle. The bundle is then
// served as `/rikiki/dist/index.js`, where `./deck-help.js` resolves
// to `/rikiki/dist/deck-help.js`. If dist/ mirrored src/ that path
// would be `/rikiki/dist/runtime/deck-help.js` and presenter/help/
// overview would 404 at runtime. Flat keeps the contract correct
// for both the bundled file and the per-component sub-files.
function walkTs(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walkTs(full));
    else if (entry.endsWith('.ts')) out.push(full);
  }
  return out;
}

const entryPoints = walkTs(SRC);

// Two files with the same basename would collide once flattened.
const seen = new Map();
for (const p of entryPoints) {
  const base = p.slice(p.lastIndexOf('/') + 1);
  if (seen.has(base)) {
    throw new Error(`build · duplicate basename ${base}: ${seen.get(base)} vs ${p}`);
  }
  seen.set(base, p);
}

// Rewrite bare module specs ('lit', 'marked') to their jsdelivr CDN URLs at build time.
// Consumers get plain ES modules that resolve in any browser without an import map.
const CDN_ALIASES = {
  lit:                 'https://cdn.jsdelivr.net/npm/lit@3/+esm',
  'lit/decorators.js': 'https://cdn.jsdelivr.net/npm/lit@3/decorators.js/+esm',
  marked:              'https://cdn.jsdelivr.net/npm/marked@12/+esm',
};

const cdnRewrite = {
  name: 'cdn-rewrite',
  setup(b) {
    b.onResolve({ filter: /^(lit|lit\/.*|marked)$/ }, (args) => {
      const target = CDN_ALIASES[args.path];
      if (!target) return null;
      return { path: target, external: true };
    });
    // Keep dynamic imports of sibling lazy modules out of the bundle so the
    // browser fetches them on demand. deck-root uses
    //   await import('./deck-overview.js')
    // which would otherwise be inlined back into deck-root.
    b.onResolve({ filter: /^\.\/(deck-overview|deck-help|deck-transition|deck-presenter|livereload)\.js$/ }, (args) => ({
      path: args.path,
      external: true,
    }));
  },
};

// Production build is minified. Use `--watch` for an unminified dev build with
// sourcemaps. The `--dev` flag forces the same dev-style output for one-shots.
const isDev = process.argv.includes('--watch') || process.argv.includes('--dev');

const config = {
  entryPoints,
  outdir: OUT,
  // Flatten · entryNames '[name]' strips the bucket from the output
  // path so dist/atoms/deck-badge.js becomes dist/deck-badge.js. See
  // the note above walkTs() for why · TLDR runtime dynamic imports.
  entryNames: '[name]',
  format: 'esm',
  target: 'es2022',
  platform: 'browser',
  bundle: true,                 // resolve relative imports + apply plugin
  splitting: false,
  outExtension: { '.js': '.js' },
  sourcemap: isDev,
  minify: !isDev,
  legalComments: 'none',
  plugins: [cdnRewrite, minifyTemplates(!isDev)],
  // Keep each component its own file (no chunk merging since splitting is off
  // and entryPoints is the full walked src/**/*.ts list).
  logLevel: 'info',
};

if (process.argv.includes('--watch')) {
  const ctx = await context(config);
  await ctx.watch();
  console.log('[esbuild] watching src/*.ts → dist/');
} else {
  await build(config);
}
