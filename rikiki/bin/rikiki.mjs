#!/usr/bin/env node
// ════════════════════════════════════════════════════════════════
// rikiki CLI
//
//   rikiki init --standalone [name.html] [--title "…"] [--theme rikiki|siliceum]
//                            [--with-mermaid] [--with-shiki] [--no-fonts]
//   rikiki bundle <deck.html> [out.html|-] [--no-fonts]
//   rikiki skills [--dir <path>] [--force]
//
// `init --standalone` generates a self-contained, share-anywhere deck with no
// external links. `bundle` folds an existing deck into the same single file.
// Both use the rolldown-powered inliner in lib/inline.mjs. `skills` installs the
// bundled Claude Code skills into a project so the agent auto-discovers them.
// ════════════════════════════════════════════════════════════════

import { parseArgs } from 'node:util';
import { readFileSync, writeFileSync, existsSync, statSync, cpSync, mkdirSync } from 'node:fs';
import { resolve, dirname, basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inlineDeck } from './lib/inline.mjs';
import { starterHtml } from './lib/starter.mjs';

const PKG_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const HELP = `rikiki · self-contained slide decks

  rikiki init --standalone [name.html] [options]   generate a new single-file deck
  rikiki bundle <deck.html> [out.html|-] [options]  fold an existing deck into one file
  rikiki skills [--dir <path>] [--force]            install the Claude Code skills into a project

Options:
  --title "…"          deck title (init)
  --theme rikiki|siliceum   theme · siliceum inlines its local fonts (default: rikiki)
  --with-mermaid       inline the mermaid runtime (+~3 MB)
  --with-shiki         inline the Shiki highlighter (+~9 MB)
  --no-fonts           drop fonts instead of inlining them (smaller, system fonts)
  --all                bundle every component (skip the used-only curation)
  --include a,b        force-include components used only from JS
  --minify-css         minify the inlined CSS (default: readable)
  --minify-html        collapse blank lines in the HTML (default: readable)
  --no-minify-js       keep the framework JS readable (default: minified)
  -h, --help           show this help

Output is one HTML file with zero external references · open it offline.
The bundle is curated to the components the deck uses; HTML and CSS stay
readable so you can keep editing the file. Images are inlined as base64 and
SVGs as inline markup.`;

/** Shared inlining options derived from the parsed flags. */
const inlineOpts = (v) => ({
  all: v.all,
  include: v.include ? v.include.split(',').map((s) => s.trim()).filter(Boolean) : [],
  minifyCss: v['minify-css'],
  minifyHtml: v['minify-html'],
  minifyJs: !v['no-minify-js'],
  noFonts: v['no-fonts'],
});

const SHARED_OPTIONS = {
  all: { type: 'boolean', default: false },
  include: { type: 'string' },
  'minify-css': { type: 'boolean', default: false },
  'minify-html': { type: 'boolean', default: false },
  'no-minify-js': { type: 'boolean', default: false },
  'no-fonts': { type: 'boolean', default: false },
};

/** Warn if anything external slipped through. */
function warnExternal(html) {
  const hits = [...html.matchAll(/\b(?:https?:)?\/\/[^\s"')]+/g)]
    .map((m) => m[0])
    .filter((u) => !u.startsWith('//W') && /cdn|googleapis|gstatic|unpkg|jsdelivr|esm\.sh|fonts\./.test(u));
  if (hits.length) {
    console.error('rikiki · WARNING · external references remain:');
    [...new Set(hits)].slice(0, 5).forEach((u) => console.error('    · ' + u));
  }
  return hits.length === 0;
}

function writeOut(html, outputPath) {
  if (outputPath === '-') { process.stdout.write(html); return; }
  writeFileSync(outputPath, html);
  const kb = (Buffer.byteLength(html) / 1024).toFixed(0);
  console.error(`rikiki · wrote ${outputPath} · ${kb} KB`);
}

async function cmdInit(argv) {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      standalone: { type: 'boolean', default: false },
      title: { type: 'string' },
      theme: { type: 'string', default: 'rikiki' },
      'with-mermaid': { type: 'boolean', default: false },
      'with-shiki': { type: 'boolean', default: false },
      ...SHARED_OPTIONS,
    },
  });

  // `init` only produces standalone single-file decks for now · accept the flag
  // explicitly but don't require it (the whole point is the self-contained file).
  if (!values.standalone) {
    console.error('rikiki · init currently generates standalone single-file decks · assuming --standalone');
  }
  const theme = values.theme === 'siliceum' ? 'siliceum' : 'rikiki';
  const name = positionals[0] || 'slides.html';
  const outputPath = name === '-' ? '-' : resolve(process.cwd(), name.endsWith('.html') ? name : name + '.html');
  const title = values.title || basename(name, '.html').replace(/[-_]/g, ' ') || 'My deck';

  const html = starterHtml({
    title, theme,
    withMermaid: values['with-mermaid'],
    withShiki: values['with-shiki'],
  });
  const inlined = await inlineDeck({ html, baseDir: PKG_ROOT, pkgRoot: PKG_ROOT, ...inlineOpts(values) });
  writeOut(inlined, outputPath);
  if (outputPath !== '-') warnExternal(inlined);
}

async function cmdBundle(argv) {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: { ...SHARED_OPTIONS },
  });
  const input = positionals[0];
  if (!input) { console.error('rikiki bundle · missing <deck.html>\n\n' + HELP); process.exit(1); }
  const inputPath = resolve(process.cwd(), input);
  if (!existsSync(inputPath) || !statSync(inputPath).isFile()) {
    console.error('rikiki bundle · input not found: ' + inputPath); process.exit(1);
  }
  const outArg = positionals[1];
  const outputPath = outArg === '-' ? '-'
    : outArg ? resolve(process.cwd(), outArg)
    : join(dirname(inputPath), basename(inputPath, '.html') + '.bundle.html');

  const html = readFileSync(inputPath, 'utf8');
  const inlined = await inlineDeck({ html, baseDir: dirname(inputPath), pkgRoot: PKG_ROOT, ...inlineOpts(values) });
  writeOut(inlined, outputPath);
  if (outputPath !== '-') warnExternal(inlined);
}

// Consumer-facing skills shipped in the npm tarball. `rikiki-component` and
// `bump-version` stay repo-only (they need the TS sources / release scripts a
// package consumer doesn't have).
const DISTRIBUTED_SKILLS = ['rikiki-deck', 'rikiki-theme', 'rikiki-debug'];

function cmdSkills(argv) {
  const { values } = parseArgs({
    args: argv,
    options: { dir: { type: 'string' }, force: { type: 'boolean', default: false } },
  });
  const targetRoot = resolve(process.cwd(), values.dir || '.claude/skills');
  let copied = 0;
  for (const name of DISTRIBUTED_SKILLS) {
    const src = join(PKG_ROOT, '.claude', 'skills', name);
    if (!existsSync(src)) continue; // not in this install (e.g. running from a trimmed tarball)
    const dest = join(targetRoot, name);
    if (existsSync(dest) && !values.force) {
      console.error(`rikiki skills · ${name} already exists · use --force to overwrite`);
      continue;
    }
    mkdirSync(dirname(dest), { recursive: true });
    cpSync(src, dest, { recursive: true });
    console.error(`rikiki skills · installed ${name} → ${join(values.dir || '.claude/skills', name)}`);
    copied++;
  }
  if (copied) console.error(`rikiki skills · ${copied} skill(s) installed · restart Claude Code to pick them up`);
  else console.error('rikiki skills · nothing installed');
}

const [cmd, ...rest] = process.argv.slice(2);
try {
  if (cmd === 'init') await cmdInit(rest);
  else if (cmd === 'bundle') await cmdBundle(rest);
  else if (cmd === 'skills') cmdSkills(rest);
  else if (!cmd || cmd === '-h' || cmd === '--help' || cmd === 'help') { console.log(HELP); }
  else { console.error('rikiki · unknown command: ' + cmd + '\n\n' + HELP); process.exit(1); }
} catch (e) {
  console.error('rikiki · error · ' + (e && e.stack || e));
  process.exit(1);
}
