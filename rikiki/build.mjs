#!/usr/bin/env node
// Build script · esbuild compiles src/*.ts → dist/*.js (ESM, not bundled)
// Each module stays its own file so consumers can lazy-load any component.
// Type declarations (.d.ts) come from `tsc --emitDeclarationOnly` (see package.json).

import { build, context } from 'esbuild';
import { readdirSync, readFileSync, mkdirSync, statSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(__dirname, 'src');
const OUT = resolve(__dirname, 'dist');

mkdirSync(OUT, { recursive: true });

// src/ is organised in design-system buckets · runtime/, layouts/,
// molecules/, atoms/, plugins/ · plus a few files at the root
// (index.ts, shared-styles.ts, livereload.ts). Walk recursively so
// each .ts becomes its own entry point. dist/ MIRRORS the src/ shape
// (esbuild's default behaviour) so the public URL contract is
// /rikiki/dist/<bucket>/deck-<name>.js · the index module's static
// imports and deck-root's dynamic imports both resolve naturally.
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
    b.onResolve({ filter: /^\.\/(deck-overview|deck-help|deck-transition|deck-presenter)\.js$/ }, (args) => ({
      path: args.path,
      external: true,
    }));
  },
};

// Minify CSS-in-JS · esbuild's --minify doesn't touch template-literal
// contents, so every `css`...`` block ships verbatim with comments and
// whitespace. This plugin strips comments + collapses whitespace inside
// css` and html` blocks before esbuild ever sees them.
//
// Disabled in dev mode (sourcemaps wouldn't line up otherwise).
function minifyTemplates(enabled) {
  return {
    name: 'minify-templates',
    setup(b) {
      if (!enabled) return;
      b.onLoad({ filter: /\.ts$/ }, (args) => {
        let src = readFileSync(args.path, 'utf8');
        // Walk every `css\`...\`` (and `html\`...\``) and minify its body.
        src = src.replace(/(css|html)`([\s\S]*?)`/g, (_, tag, body) => {
          let m = body;
          // Block comments
          m = m.replace(/\/\*[\s\S]*?\*\//g, '');
          // Collapse runs of whitespace · keep newlines as single spaces
          m = m.replace(/\s+/g, ' ');
          // Tighten around CSS punctuation
          m = m.replace(/\s*([{}:;,])\s*/g, '$1');
          // Drop the final ; before }
          m = m.replace(/;}/g, '}');
          return tag + '`' + m.trim() + '`';
        });
        return { contents: src, loader: 'ts' };
      });
    },
  };
}

// Production build is minified. Use `--watch` for an unminified dev build with
// sourcemaps. The `--dev` flag forces the same dev-style output for one-shots.
const isDev = process.argv.includes('--watch') || process.argv.includes('--dev');

const config = {
  entryPoints,
  outdir: OUT,
  // outbase: SRC ensures dist/ mirrors src/ exactly (without it, esbuild
  // would pick the common ancestor and add a stray level). entryNames
  // is left at its default '[dir]/[name]'.
  outbase: SRC,
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
