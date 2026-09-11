#!/usr/bin/env node
// Vendor every third-party runtime dependency into dist/vendor/ so a rikiki
// deck runs fully offline · no CDN, no import map. Versions are pinned in
// package.json (lit@3, marked@12, mermaid@10, shiki@1.24) so the runtime
// loaders keep matching the APIs they expect.
//
//   node build-vendor.mjs
//
// Outputs (all self-contained ESM / UMD, no external imports left):
//   dist/vendor/lit.js          · LitElement + html + css + all decorators
//   dist/vendor/marked.js       · the markdown parser used by <deck-md>
//   dist/vendor/shiki.js        · createHighlighter, JS regex engine (no wasm)
//   dist/vendor/mermaid.min.js  · upstream UMD bundle, sets window.mermaid

import { build } from 'esbuild';
import { mkdirSync, copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { writeInventory } from './scripts/vendor-inventory.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const VENDOR = resolve(__dirname, 'dist', 'vendor');
mkdirSync(VENDOR, { recursive: true });

const common = {
  bundle: true,
  format: 'esm',
  target: 'es2022',
  platform: 'browser',
  minify: true,
  legalComments: 'inline',
  metafile: true,
  absWorkingDir: __dirname,
  logLevel: 'info',
};

// lit · merge the two specifiers components import ('lit' and 'lit/decorators.js')
// into one shared module so the browser fetches Lit exactly once for the whole deck.
const lit = await build({
  ...common,
  stdin: {
    contents: `export * from 'lit';\nexport * from 'lit/decorators.js';`,
    resolveDir: __dirname,
    loader: 'js',
  },
  outfile: resolve(VENDOR, 'lit.js'),
});

// marked · the markdown parser. <deck-md> imports the bare 'marked' specifier,
// rewritten to this file by build.mjs for the per-component build.
const marked = await build({
  ...common,
  stdin: {
    contents: `export * from 'marked';`,
    resolveDir: __dirname,
    loader: 'js',
  },
  outfile: resolve(VENDOR, 'marked.js'),
});

// Shiki · import the core and the exact grammars/theme Rikiki supports by
// default. Importing from bare `shiki` pulls every grammar and theme into the
// graph. Direct modules keep this offline bundle prunable by esbuild.
const shiki = await build({
  ...common,
  supported: { 'template-literal': false },
  stdin: {
    contents: `
      import { createHighlighterCore } from 'shiki/core';
      import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
      import typescript from 'shiki/langs/typescript.mjs';
      import javascript from 'shiki/langs/javascript.mjs';
      import html from 'shiki/langs/html.mjs';
      import css from 'shiki/langs/css.mjs';
      import json from 'shiki/langs/json.mjs';
      import oneDarkPro from 'shiki/themes/one-dark-pro.mjs';

      const languages = { ts: typescript, typescript, js: javascript, javascript, html, css, json };
      const themes = { 'one-dark-pro': oneDarkPro };

      export function createHighlighter(opts = {}) {
        const requestedLangs = opts.langs ?? ['ts', 'js', 'html', 'css', 'json'];
        const requestedThemes = opts.themes ?? ['one-dark-pro'];
        const langs = requestedLangs.map((lang) => languages[lang]).filter(Boolean);
        const selectedThemes = requestedThemes.map((theme) => themes[theme]).filter(Boolean);
        if (langs.length !== requestedLangs.length)
          throw new Error('Rikiki Shiki bundle supports: ts, typescript, js, javascript, html, css, json');
        if (selectedThemes.length !== requestedThemes.length)
          throw new Error('Rikiki Shiki bundle supports the one-dark-pro theme');
        return createHighlighterCore({
          langs,
          themes: selectedThemes,
          engine: opts.engine ?? createJavaScriptRegexEngine(),
        });
      }
    `,
    resolveDir: __dirname,
    loader: 'js',
  },
  outfile: resolve(VENDOR, 'shiki.js'),
});
const shikiFile = resolve(VENDOR, 'shiki.js');
writeFileSync(shikiFile, `${readFileSync(shikiFile, 'utf8').trimEnd()}\n`);

// mermaid · ship the upstream self-contained UMD bundle verbatim. It registers
// window.mermaid on load · deck-mermaid injects it as a <script> on first use.
copyFileSync(require.resolve('mermaid/dist/mermaid.min.js'), resolve(VENDOR, 'mermaid.min.js'));

writeInventory(__dirname, { 'lit.js': lit.metafile, 'marked.js': marked.metafile, 'shiki.js': shiki.metafile });

console.log('[vendor] wrote dist/vendor/{lit,marked,shiki}.js + mermaid.min.js');
