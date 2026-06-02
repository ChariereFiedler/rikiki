#!/usr/bin/env node
// rikiki/build/vite-deck.mjs · assemble one deck HTML from partials.
//
//   node build/vite-deck.mjs decks/example/deck.config.js
//   node build/vite-deck.mjs decks/example/deck.config.js dist-decks/example.html
//
// deck.config.{js,json} shape:
//   export default {
//     title: 'My talk',
//     theme: 'tokens.css',            // href, relative to the OUTPUT file
//     bundle: 'dist/index.js',        // rikiki bundle href, relative to OUTPUT
//     transition: 'slide',            // optional <deck-root transition="...">
//     slides: ['parts/cover.html', 'parts/intro.md', 'parts/closing.html'],
//   };
//
// .html partials are inlined verbatim (one or more <deck-*> elements).
// .md partials are wrapped into a <deck-feature><deck-md>…</deck-md></deck-feature>
// slide so plain Markdown files become slides with zero ceremony.

import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { resolve, dirname, relative, extname } from 'node:path';
import { pathToFileURL } from 'node:url';

const args = process.argv.slice(2);
if (args.length < 1) {
  console.error('usage: node build/vite-deck.mjs <deck.config.{js,json}> [output.html]');
  process.exit(1);
}

const configPath = resolve(process.cwd(), args[0]);
if (!existsSync(configPath) || !statSync(configPath).isFile()) {
  console.error('vite-deck · config not found: ' + configPath);
  process.exit(1);
}
const configDir = dirname(configPath);

async function loadConfig(p) {
  if (extname(p) === '.json') return JSON.parse(readFileSync(p, 'utf8'));
  const mod = await import(pathToFileURL(p).href);
  return mod.default ?? mod;
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Split a markdown file into slides on lines that are exactly `---`
 *  (reveal.js convention). One file, many slides. A blank file or a stray
 *  separator just collapses away. */
function splitMarkdownSlides(body) {
  const chunks = [];
  let cur = [];
  for (const line of body.split(/\r?\n/)) {
    if (/^[ \t]*---[ \t]*$/.test(line)) { chunks.push(cur.join('\n')); cur = []; }
    else cur.push(line);
  }
  chunks.push(cur.join('\n'));
  return chunks.map((c) => c.trim()).filter((c) => c.length > 0);
}

function renderPartial(absPath) {
  const body = readFileSync(absPath, 'utf8');
  if (extname(absPath) === '.md') {
    // reveal.js-style: one markdown file can hold many slides, separated by a
    // line containing only `---`. Each chunk becomes its own deck-feature.
    // <deck-md> deindents + parses the raw markdown at runtime, so the body is
    // inlined verbatim (no build-time escaping). Use `***` for an in-slide rule.
    return splitMarkdownSlides(body)
      .map((s) => '<deck-feature>\n<deck-md>\n' + s + '\n</deck-md>\n</deck-feature>')
      .join('\n\n');
  }
  return body.trimEnd();
}

const config = await loadConfig(configPath);
if (!Array.isArray(config.slides) || config.slides.length === 0) {
  console.error('vite-deck · config.slides must be a non-empty array');
  process.exit(1);
}

const outputPath = args[1]
  ? resolve(process.cwd(), args[1])
  : resolve(configDir, (config.title || 'deck').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.html');

const slidesHtml = config.slides.map((rel) => {
  const abs = resolve(configDir, rel);
  if (!existsSync(abs)) {
    console.error('vite-deck · partial not found: ' + abs);
    process.exit(1);
  }
  return renderPartial(abs);
}).join('\n\n');

const themeHref  = config.theme  ?? 'tokens.css';
const bundleHref = config.bundle ?? 'dist/index.js';
const transitionAttr = config.transition ? ` transition="${config.transition}"` : '';

const doc = `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(config.title ?? 'Rikiki deck')}</title>
<link rel="stylesheet" href="${themeHref}">
<script type="module" src="${bundleHref}"></script>
</head>
<body>
<deck-root${transitionAttr}>
${slidesHtml}
</deck-root>
</body>
</html>
`;

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, doc);
console.error('vite-deck · wrote ' + relative(process.cwd(), outputPath) + ' · ' + config.slides.length + ' partial(s)');
