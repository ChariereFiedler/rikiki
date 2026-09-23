#!/usr/bin/env node
// ════════════════════════════════════════════════════════════════
// rikiki CLI
//
//   rikiki init [name.html] [--standalone] [--title "…"] [--theme rikiki|siliceum]
//               [--with-mermaid] [--with-shiki] [--no-fonts] [--force]
//   rikiki bundle <deck.html> [out.html|-] [--with-mermaid] [--with-shiki] [--no-fonts]
//   rikiki assemble <deck.config.js> [out.html|-]
//   rikiki render <deck.html> [--out dir] [--slides a,b] [--steps]
//                             [--baseline dir] [--threshold pct] [--json]
//   rikiki check <deck.html> [--json] [--no-visual]
//   rikiki export <deck.html> [--output deck.pdf]
//   rikiki skills [--dir <path>] [--force]
//
// `init` writes an editable source deck plus the runtime it needs, next to it.
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
import { formatExternal, scanExternal } from './lib/scan-external.mjs';
import { pruneIcons } from './lib/prune-icons.mjs';
import { resolveCheckPlugins } from './lib/check-plugins.mjs';
import { exportPdf } from './lib/export-pdf.mjs';
import { ExpectedError, formatCliError } from './lib/cli-error.mjs';
import { assembleDeck } from './lib/assemble.mjs';
import { renderDeck } from './lib/render.mjs';
import { DEFAULT_THRESHOLD, diffFailed, formatDiff } from './lib/diff.mjs';
import { checkDeck, formatReport } from './lib/check.mjs';

const PKG_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const HELP = `rikiki · self-contained slide decks

  rikiki init [name.html] [options]                 write an editable deck + its runtime
  rikiki init --standalone [name.html] [options]    generate a single self-contained file
  rikiki assemble <deck.config.js> [out.html|-]     build one deck from ordered partials
  rikiki bundle <deck.html> [out.html|-] [options]  fold an existing deck into one file
  rikiki render <deck.html> [options]               one PNG per slide, plus a gallery and a manifest
  rikiki check <deck.html> [--json] [--no-visual] [--steps]  measure the deck and report what is wrong
  rikiki export <deck.html> [--output deck.pdf]     render the deck to PDF, one slide per page
  rikiki skills [--agent codex|claude] [--plugin package] [--dir path] [--force]
                                                  install core and module agent skills

Options:
  --title "…"          deck title (init)
  --standalone         init: emit one self-contained file instead of a source deck
  --force              init: overwrite an existing deck
  --theme rikiki|siliceum   theme · siliceum inlines its local fonts (default: rikiki)
  --with-mermaid       inline the mermaid runtime (+~3 MB)
  --with-shiki         inline the curated Shiki highlighter (+~0.7 MB raw)
  --output, -o <file>  PDF path (export · default <deck>.pdf)
  --out <dir>          picture directory (render · default <deck>.shots/)
  --slides a,b         render: which slides · numbers (1-based) or ids
  --steps              render: one picture per revealed state, not just the first
  --baseline <dir>     render: compare this render to an earlier one, slide by slide
  --threshold <pct>    render: percent of pixels that makes a slide changed (default 0.5)
  --width, --height    render/check: canvas size in pixels (default 1920×1080)
  --json               check / render --baseline: write the report to stdout as JSON
  --no-visual          check: skip the pixel pass (one screenshot per slide)
  --config <file>      check/skills: explicit rikiki.config.json
  --plugin <package>   check/skills: activate a module (repeatable)
  --no-plugins         check: disable module checks explicitly
  --quality-out <dir>      check: capture every state and prepare a design review
  --quality-review <file>  check: import a screenshot-based design review
  --require-quality       check: fail unless design review passes
  --narrative-out <file>    check: prepare review material for the current agent
  --narrative-review <file> check: import the current agent's structured review
  --plugin-timeout <ms>     check: execution deadline per plugin call (default 5000)
  --steps              check: measure every revealed state of each slide, not just the first
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

/** A pixel dimension from the flags · a size that is not a size is an error,
 *  not a silent fallback to the default. */
function pixels(values, flag, fallback) {
  if (values[flag] === undefined) return fallback;
  const n = Number(values[flag]);
  if (!Number.isInteger(n) || n < 1) {
    throw new ExpectedError(`--${flag} must be a positive whole number of pixels`);
  }
  return n;
}

/** A percentage from the flags · anything that is not one is an error, not a
 *  silent fallback to the default. `0` is a legitimate value. */
function percent(values, flag, fallback) {
  if (values[flag] === undefined) return fallback;
  const n = Number(values[flag]);
  if (!Number.isFinite(n) || n < 0 || n > 100) {
    throw new ExpectedError(`--${flag} must be a percentage between 0 and 100`);
  }
  return n;
}

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

// References that appear in a bundle but are provably never fetched from it.
// Each one needs a reason, and the offline e2e test is what actually proves it.
const INERT_IN_BUNDLE = new Map([
  [
    './index.js',
    'deck-presenter computes it as a fallback bundle href · a bundled deck always ' +
      'takes the inline branch instead (bundleInline is non-empty)',
  ],
]);

/** Report anything a "self-contained" file could still fetch at runtime.
 *  Returns true when the file really reaches for nothing.
 *
 *  `inlined` names the heavy runtimes folded into this file. Their loaders keep
 *  a `new URL('./vendor/…')` in the code, but that branch is dead once the
 *  global is already set · which is exactly what inlining does. */
function checkSelfContained(html, inlined = {}) {
  const dead = new Map(INERT_IN_BUNDLE);
  if (inlined.mermaid) {
    dead.set(
      './vendor/mermaid.min.js',
      'the mermaid UMD is inlined above and sets window.mermaid, so the loader ' +
        'returns before it builds this URL',
    );
  }
  if (inlined.shiki) {
    dead.set(
      './vendor/shiki.js',
      'the Shiki highlighter is inlined above and registered on globalThis',
    );
  }
  const hits = scanExternal(html);
  const real = hits.filter((h) => !dead.has(h.ref));
  const inert = hits.filter((h) => dead.has(h.ref));

  for (const h of inert) {
    console.error(`rikiki · note · ${h.ref} stays in the file but is never fetched`);
    console.error(`         (${dead.get(h.ref)})`);
  }
  if (real.length === 0) return true;

  console.error('rikiki · ERROR · the bundle is NOT self-contained · it still fetches:');
  console.error(formatExternal(real));
  const wantsMermaid = real.some((h) => h.ref.includes('mermaid'));
  const wantsShiki = real.some((h) => h.ref.includes('shiki'));
  if (wantsMermaid) console.error('  → this deck uses <deck-mermaid> · re-run with --with-mermaid');
  if (wantsShiki) console.error('  → this deck uses Shiki · re-run with --with-shiki');
  return false;
}

/** Inject the heavy vendor runtimes the inliner then folds into the file.
 *  mermaid's UMD sets window.mermaid, so deck-mermaid skips its network load. */
function injectVendors(html, { withMermaid, withShiki }) {
  // Shiki goes FIRST · it publishes globalThis.__rikikiShiki from a module, and
  // modules run in document order, so a deck whose own <script> calls
  // installShiki() must not be reached before the global exists.
  const first = withShiki
    ? `<script type="module">\n` +
      `import { createHighlighter } from '${PKG_ROOT}/dist/vendor/shiki.js';\n` +
      `globalThis.__rikikiShiki = createHighlighter;\n` +
      `</script>\n`
    : '';
  // mermaid goes LAST · it is a classic script, so it runs during parsing, well
  // before any module, wherever it sits. Keeping it after the deck's own markup
  // also keeps the inliner's asset passes away from its 3 MB of minified JS.
  const last = withMermaid
    ? `<script src="${PKG_ROOT}/dist/vendor/mermaid.min.js"></script>\n`
    : '';
  if (!first && !last) return html;

  let out = html;
  const headOpen = out.match(/<head\b[^>]*>/i);
  if (first) out = headOpen ? out.replace(headOpen[0], headOpen[0] + '\n' + first) : first + out;
  if (last) out = out.includes('</head>') ? out.replace('</head>', last + '</head>') : out + last;
  return out;
}

function writeOut(html, outputPath) {
  if (outputPath === '-') { process.stdout.write(html); return; }
  writeFileSync(outputPath, html);
  const kb = (Buffer.byteLength(html) / 1024).toFixed(0);
  console.error(`rikiki · wrote ${outputPath} · ${kb} KB`);
}

// The runtime a source deck loads from next to itself. `dist/vendor` also
// holds lit and marked, which every deck needs · only the two heavy plugin
// payloads (~12 MB) wait until a deck asks for them.
const ASSET_DIR = 'rikiki';
const RUNTIME_ASSETS = ['dist', 'tokens.css', 'themes', 'fonts'];
const HEAVY_VENDORS = /[\\/]dist[\\/]vendor[\\/](mermaid\.min\.js|shiki\.js)$/;

/** Copy the runtime next to the deck. */
function copyRuntime(destRoot, { withVendor }) {
  const skipVendor = (src) => withVendor || !HEAVY_VENDORS.test(src);
  for (const asset of RUNTIME_ASSETS) {
    const src = join(PKG_ROOT, asset);
    if (!existsSync(src)) continue; // a trimmed install (e.g. no fonts) stays usable
    cpSync(src, join(destRoot, asset), { recursive: true, filter: skipVendor });
  }
}

async function cmdInit(argv) {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      standalone: { type: 'boolean', default: false },
      force: { type: 'boolean', default: false },
      title: { type: 'string' },
      theme: { type: 'string', default: 'rikiki' },
      'with-mermaid': { type: 'boolean', default: false },
      'with-shiki': { type: 'boolean', default: false },
      ...SHARED_OPTIONS,
    },
  });

  const theme = values.theme === 'siliceum' ? 'siliceum' : 'rikiki';
  const name = positionals[0] || 'slides.html';
  const outputPath = name === '-' ? '-' : resolve(process.cwd(), name.endsWith('.html') ? name : name + '.html');
  const title = values.title || basename(name, '.html').replace(/[-_]/g, ' ') || 'My deck';

  // Someone's deck is not ours to replace · the second `init` in a directory is
  // far more often a mistake than an intent.
  if (outputPath !== '-' && existsSync(outputPath) && !values.force) {
    throw new ExpectedError(`init · ${name} already exists · pass --force to overwrite it`);
  }

  const starter = {
    title, theme,
    withMermaid: values['with-mermaid'],
    withShiki: values['with-shiki'],
  };

  // Default: a source deck. It needs nothing but Node, stays readable, and is
  // what `bundle` later folds into a single file.
  if (!values.standalone) {
    const html = starterHtml({ ...starter, assetBase: ASSET_DIR + '/' });
    if (outputPath === '-') {
      console.error(`rikiki · note · run \`rikiki init <name>.html\` to also copy the runtime into ./${ASSET_DIR}/`);
      writeOut(html, outputPath);
      return;
    }
    copyRuntime(join(dirname(outputPath), ASSET_DIR), {
      withVendor: values['with-mermaid'] || values['with-shiki'],
    });
    writeOut(html, outputPath);
    console.error(`rikiki · runtime copied to ./${ASSET_DIR}/ · serve this folder over HTTP, ES modules do not load from file://`);
    console.error(`rikiki · next · edit ${basename(outputPath)} · then \`rikiki bundle ${basename(outputPath)}\` for one shareable file`);
    return;
  }

  const html = starterHtml(starter);
  const inlined = await inlineDeck({ html, baseDir: PKG_ROOT, pkgRoot: PKG_ROOT, ...inlineOpts(values) });
  writeOut(inlined, outputPath);
  // Same contract as `bundle` · a starter that would 404 offline is not a
  // starter, so the exit code says so.
  const ok = checkSelfContained(inlined, {
    mermaid: values['with-mermaid'],
    shiki: values['with-shiki'],
  });
  if (!ok) process.exit(1);
}

async function cmdAssemble(argv) {
  const { positionals } = parseArgs({ args: argv, allowPositionals: true, options: {} });
  const config = positionals[0];
  if (!config) throw new ExpectedError('assemble · missing <deck.config.{js,json}>\n\n' + HELP);

  const { html, outputPath, slides, unbundleable } = await assembleDeck(config, positionals[1]);
  for (const href of unbundleable) {
    console.error(`rikiki · note · ${href} is not a \`rikiki/…\` path · it serves, but \`rikiki bundle\` will not inline it`);
  }
  if (!outputPath) { process.stdout.write(html); return; }
  const kb = (Buffer.byteLength(html) / 1024).toFixed(0);
  console.error(`rikiki · wrote ${outputPath} · ${slides} partial(s) · ${kb} KB`);
}

async function cmdRender(argv) {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      out: { type: 'string' },
      slides: { type: 'string' },
      steps: { type: 'boolean', default: false },
      width: { type: 'string' },
      height: { type: 'string' },
      baseline: { type: 'string' },
      threshold: { type: 'string' },
      json: { type: 'boolean', default: false },
    },
  });
  const inputPath = deckArgument('render', positionals[0]);
  const outDir = resolve(process.cwd(), values.out ?? basename(inputPath, '.html') + '.shots');
  // Checked before the render, not after: a baseline that is not there is
  // worth knowing before spending a browser on thirty screenshots.
  const baseline = baselineArgument(values.baseline);
  const { manifest, galleryPath, diff, diffPath } = await renderDeck(inputPath, {
    outDir,
    slides: values.slides,
    steps: values.steps,
    width: pixels(values, 'width', 1920),
    height: pixels(values, 'height', 1080),
    baseline,
    threshold: percent(values, 'threshold', DEFAULT_THRESHOLD),
  });

  for (const url of manifest.missing.slice(0, 5)) {
    console.error(`rikiki · WARNING · the deck could not load: ${url}`);
  }
  console.error(
    `rikiki · wrote ${manifest.captured} shot(s) to ${outDir} · ${manifest.canvas.width}×${manifest.canvas.height}`,
  );
  if (!manifest.stepsCaptured) {
    console.error('rikiki · note · stepped slides are shown in their opening state · pass --steps for the rest');
  }
  console.error(`rikiki · gallery ${galleryPath}`);

  if (!diff) return;
  // In --json mode stdout carries the report and nothing else, so a caller can
  // pipe it straight into a tool · same contract as `check --json`.
  if (values.json) process.stdout.write(JSON.stringify(diff, null, 2) + '\n');
  else console.error(formatDiff(diff));
  console.error(`rikiki · diff ${diffPath}`);
  if (diffFailed(diff.summary)) process.exit(1);
}

/** Resolve `--baseline` · a directory that is not there is the one thing this
 *  command cannot work around, so it stops rather than render into silence. */
function baselineArgument(input) {
  if (input === undefined) return undefined;
  const dir = resolve(process.cwd(), input);
  if (!existsSync(dir) || !statSync(dir).isDirectory()) {
    throw new ExpectedError(`render · baseline directory not found: ${dir}`, { exitCode: 2 });
  }
  return dir;
}

/** Resolve a deck argument · shared by the commands that read one. */
function deckArgument(command, input, { exitCode = 1 } = {}) {
  if (!input) throw new ExpectedError(`${command} · missing <deck.html>\n\n` + HELP, { exitCode });
  const inputPath = resolve(process.cwd(), input);
  if (!existsSync(inputPath) || !statSync(inputPath).isFile()) {
    throw new ExpectedError(`${command} · input not found: ` + inputPath, { exitCode });
  }
  return inputPath;
}

async function cmdCheck(argv) {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      json: { type: 'boolean', default: false },
      'no-visual': { type: 'boolean', default: false },
      config: { type: 'string' },
      plugin: { type: 'string', multiple: true },
      'no-plugins': { type: 'boolean', default: false },
      'quality-out': { type: 'string' },
      'quality-review': { type: 'string' },
      'require-quality': { type: 'boolean', default: false },
      'narrative-out': { type: 'string' },
      'narrative-review': { type: 'string' },
      'plugin-timeout': { type: 'string' },
      steps: { type: 'boolean', default: false },
      width: { type: 'string' },
      height: { type: 'string' },
    },
  });
  const inputPath = deckArgument('check', positionals[0], { exitCode: 2 });
  const report = await checkDeck(inputPath, {
    width: pixels(values, 'width', 1920),
    height: pixels(values, 'height', 1080),
    visual: !values['no-visual'],
    steps: values.steps,
    config: values.config,
    plugins: values.plugin,
    noPlugins: values['no-plugins'],
    qualityOut: values['quality-out'],
    qualityReview: values['quality-review'],
    requireQuality: values['require-quality'],
    narrativeOut: values['narrative-out'],
    narrativeReview: values['narrative-review'],
    pluginTimeoutMs: values['plugin-timeout'] === undefined ? 5000 : Number(values['plugin-timeout']),
  });

  // In --json mode stdout carries the report and nothing else, so a caller can
  // pipe it without stripping anything · including when the deck is broken.
  if (values.json) process.stdout.write(JSON.stringify(report, null, 2) + '\n');
  else console.error(formatReport(report));

  if (report.summary.error > 0) process.exit(1);
}

async function cmdExport(argv) {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: { output: { type: 'string', short: 'o' } },
  });
  const input = positionals[0];
  if (!input) {
    console.error('rikiki export · missing <deck.html>\n\n' + HELP);
    process.exit(1);
  }
  const inputPath = resolve(process.cwd(), input);
  if (!existsSync(inputPath) || !statSync(inputPath).isFile()) {
    console.error('rikiki export · input not found: ' + inputPath);
    process.exit(1);
  }
  const outputPath = resolve(
    process.cwd(),
    values.output ?? positionals[1] ?? basename(inputPath, '.html') + '.pdf',
  );

  let result;
  try {
    result = await exportPdf(inputPath, outputPath);
  } catch (e) {
    console.error('rikiki export · ' + (e instanceof Error ? e.message : String(e)));
    process.exit(1);
  }
  // A missing asset means a page printed without something the author put
  // there · reporting it beats handing over a silently incomplete PDF.
  if (result.missing.length) {
    console.error('rikiki export · WARNING · the deck could not load:');
    for (const url of [...new Set(result.missing)].slice(0, 10)) console.error('    · ' + url);
  }
  // One slide, one page · any gap either way means the paper does not match
  // the deck, whether a slide was dropped or one spilled onto a second page.
  if (result.pages !== result.slides) {
    console.error(
      `rikiki export · WARNING · ${result.slides} slides but ${result.pages} pages · ` +
        'compare the PDF with the deck outline',
    );
  }
  console.error(`rikiki · wrote ${outputPath} · ${result.pages} pages`);
}

async function cmdBundle(argv) {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      'with-mermaid': { type: 'boolean', default: false },
      'with-shiki': { type: 'boolean', default: false },
      ...SHARED_OPTIONS,
    },
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

  const html = injectVendors(readFileSync(inputPath, 'utf8'), {
    withMermaid: values['with-mermaid'],
    withShiki: values['with-shiki'],
  });
  let inlined = await inlineDeck({
    html,
    baseDir: dirname(inputPath),
    pkgRoot: PKG_ROOT,
    ...inlineOpts(values),
  });
  // Curate the icon set the way components are already curated · a bundled deck
  // carries the glyphs it writes and nothing else.
  const icons = pruneIcons(inlined, html);
  if (icons.pruned) {
    inlined = icons.js;
    console.error(
      `rikiki · icons · kept ${icons.kept.length}, dropped ${icons.dropped} (${icons.saved} bytes)`,
    );
  } else if (icons.reason?.startsWith('unknown icon name')) {
    // Worth saying out loud · the glyph will not render.
    console.error(`rikiki · WARNING · ${icons.reason}`);
  }
  writeOut(inlined, outputPath);
  // A bundle that still fetches is a broken deliverable, not a warning · the
  // exit code is the only thing a CI job or a script can act on.
  const ok = checkSelfContained(inlined, {
    mermaid: values['with-mermaid'],
    shiki: values['with-shiki'],
  });
  if (!ok) process.exit(1);
}

// Consumer-facing skills shipped in the npm tarball. `rikiki-component` and
// `bump-version` stay repo-only (they need the TS sources / release scripts a
// package consumer doesn't have).
const DISTRIBUTED_SKILLS = ['rikiki-deck', 'rikiki-theme', 'rikiki-debug'];

function cmdSkills(argv) {
  const { values } = parseArgs({
    args: argv,
    options: { dir: { type: 'string' }, force: { type: 'boolean', default: false },
      agent: { type: 'string', default: 'claude' }, plugin: { type: 'string', multiple: true }, config: { type: 'string' } },
  });
  if (!['codex', 'claude'].includes(values.agent)) throw new ExpectedError('--agent must be codex or claude');
  const targetRoot = resolve(process.cwd(), values.dir || (values.agent === 'codex' ? '.agents/skills' : '.claude/skills'));
  const sources = DISTRIBUTED_SKILLS.map(name => ({ name, src: join(PKG_ROOT, '.claude', 'skills', name) }));
  const resolution = resolveCheckPlugins(join(process.cwd(), 'deck.html'), { config: values.config, plugins: values.plugin });
  if (resolution.diagnostics.length) throw new ExpectedError(resolution.diagnostics.map(d => d.message).join('\n'));
  for (const plugin of resolution.plugins) for (const skill of plugin.skills ?? []) sources.push(skill);
  const skillNames = new Set();
  for (const { name } of sources) {
    if (skillNames.has(name)) throw new ExpectedError(`duplicate skill name: ${name}`);
    skillNames.add(name);
  }
  let copied = 0;
  for (const { name, src } of sources) {
    if (!existsSync(src)) continue; // not in this install (e.g. running from a trimmed tarball)
    const dest = join(targetRoot, name);
    if (existsSync(dest) && !values.force) {
      console.error(`rikiki skills · ${name} already exists · use --force to overwrite`);
      continue;
    }
    mkdirSync(dirname(dest), { recursive: true });
    cpSync(src, dest, { recursive: true });
    console.error(`rikiki skills · installed ${name} → ${dest}`);
    copied++;
  }
  if (copied) console.error(`rikiki skills · ${copied} skill(s) installed for ${values.agent} · reload the agent if needed`);
  else console.error('rikiki skills · nothing installed');
}

const [cmd, ...rest] = process.argv.slice(2);
try {
  if (cmd === 'init') await cmdInit(rest);
  else if (cmd === 'assemble') await cmdAssemble(rest);
  else if (cmd === 'bundle') await cmdBundle(rest);
  else if (cmd === 'render') await cmdRender(rest);
  else if (cmd === 'check') await cmdCheck(rest);
  else if (cmd === 'export') await cmdExport(rest);
  else if (cmd === 'skills') cmdSkills(rest);
  else if (!cmd || cmd === '-h' || cmd === '--help' || cmd === 'help') { console.log(HELP); }
  else { console.error('rikiki · unknown command: ' + cmd + '\n\n' + HELP); process.exit(1); }
} catch (e) {
  console.error(formatCliError(e));
  process.exit(e?.exitCode ?? 1);
}
