#!/usr/bin/env node
// Build a fully-standalone Rikiki bundle · everything inlined, no externals.
// Used to produce a single self-contained sample.html that works offline.
//
//   node build-standalone.mjs
//
// Output: dist/standalone.js · contains the framework + Lit + lit/decorators,
// no `import` left in the file. Drop into a <script type="module"> and the
// custom elements register on parse.

import { build } from 'esbuild';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { minifyTemplates } from './minify-templates.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(__dirname, 'src');
const OUT = resolve(__dirname, 'dist');

const outFile = resolve(OUT, 'standalone.js');

await build({
  entryPoints: [resolve(SRC, 'index.ts')],
  outfile: outFile,
  format: 'esm',
  target: 'es2022',
  platform: 'browser',
  bundle: true,
  // Lit lives in node_modules · bundle it in instead of rewriting to a CDN URL.
  // No plugins that externalise anything.
  splitting: false,
  sourcemap: false,
  minify: true,
  legalComments: 'none',
  plugins: [minifyTemplates()],
  logLevel: 'info',
});

// Post-process · escape every `</script>` and `<script>` in the bundle's
// JS-string literals to `<\/script>` / `<\/script>`. Both forms are
// identical in JS · the backslash is a no-op for string semantics but
// hides the tags from the HTML parser when this bundle is embedded as
// a <script type="module"> in another HTML file (the standalone sample).
// Without this, the deck-presenter's templated popup HTML (which legitimately
// contains </script> as literal text) terminates the outer script tag
// prematurely · everything after that point gets rendered as text content.
let js = readFileSync(outFile, 'utf8');
js = js.replace(/<\/script>/gi, '<\\/script>');
writeFileSync(outFile, js);
console.log(`[standalone] post-process · escaped </script> sequences for HTML embedding`);
