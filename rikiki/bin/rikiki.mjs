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
//   rikiki check <deck.html> [--json] [--no-visual] [--slides a,b] [--diversity] [--richness]
//   rikiki export <deck.html> [--output deck.pdf]
//   rikiki skills [--dir <path>] [--force]
//   rikiki scene plan <brief.json> [--out dir] [--json] [--measure] [--theme rikiki|siliceum]
//   rikiki scene compile <brief.json> --candidate <id> [--out file]
//   rikiki scene budgets <kind> [--width N] [--json]
//   rikiki intent "<sentence>" | <name> | --list
//   rikiki recipe "<sentence>" | <name> | --list [--brief | --example | --fill brief.json]
//
// `init` writes an editable source deck plus the runtime it needs, next to it.
// `init --standalone` generates a self-contained, share-anywhere deck with no
// external links. `bundle` folds an existing deck into the same single file.
// Both use the rolldown-powered inliner in lib/inline.mjs. `skills` installs the
// bundled Claude Code skills into a project so the agent auto-discovers them.
// ════════════════════════════════════════════════════════════════

import { parseArgs } from 'node:util';
import { readFileSync, writeFileSync, existsSync, statSync, cpSync, mkdirSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
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
import { LEVELS } from './lib/check-config.mjs';
import { buildPolicy } from './lib/check-policy.mjs';
import { compileSlide, planScenes } from './lib/scene-plan.mjs';
import {
  SCENE_KINDS,
  SCENE_WIDTH,
  compiledSlide,
  formatBudgets,
  formatPlan,
  formatProblems,
  sceneBudgets,
} from './lib/scene-report.mjs';
import { MEASURE_THEMES, measureCandidates } from './lib/scene-measure.mjs';
import { answerIntent, formatIntentList } from './lib/intent.mjs';
import {
  answerRecipe,
  exampleBrief,
  fillRecipe,
  formatRecipeList,
  recipeOrFail,
} from './lib/recipe.mjs';

const PKG_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const HELP = `rikiki · self-contained slide decks

  rikiki init [name.html] [options]                 write an editable deck + its runtime
  rikiki init --standalone [name.html] [options]    generate a single self-contained file
  rikiki assemble <deck.config.js> [out.html|-]     build one deck from ordered partials
  rikiki bundle <deck.html> [out.html|-] [options]  fold an existing deck into one file
  rikiki render <deck.html> [options]               one PNG per slide, plus a gallery and a manifest
  rikiki check <deck.html> [--json] [--no-visual] [--steps] [--slides a,b] [--diversity]
               [--richness] [--checks rules] [--severity rule=level] [--list-checks]
                                                  measure the deck (or some slides) and report what is wrong
  rikiki export <deck.html> [--output deck.pdf]     render the deck to PDF, one slide per page
  rikiki skills [--agent codex|claude] [--plugin package] [--dir path] [--force]
                                                  install core and module agent skills
  rikiki scene plan <brief.json> [--out dir] [--json] [--measure] [--theme rikiki|siliceum]
                                                  the scenes that can say a brief, written and sized
  rikiki scene compile <brief.json> --candidate <id> [--out file]
                                                  the slide of one candidate of the plan
  rikiki scene budgets <kind> [--width N] [--json]  characters each field of a shape holds
  rikiki intent "<sentence>" | <name> | --list     the skeleton of a diagram written as an
                                                  intent, its roles and what the check rejects ·
                                                  exit 3 when no intent fits and recipes do
  rikiki recipe "<sentence>" | <name> | --list     a graphic model told as a story: the brief
                                                  to fill, its skeleton, its sequence, its pitfalls
  rikiki recipe <name> --brief | --example | --fill <brief.json>
                                                  its example brief as JSON · the slide it draws ·
                                                  your brief drawn, or why it is refused

Options:
  --title "…"          deck title (init)
  --standalone         init: emit one self-contained file instead of a source deck
  --force              init: overwrite an existing deck
  --theme rikiki|siliceum   theme · siliceum inlines its local fonts (default: rikiki)
                       scene plan --measure: the theme the scenes are drawn in
  --with-mermaid       inline the mermaid runtime (+~3 MB)
  --with-shiki         inline the curated Shiki highlighter (+~0.7 MB raw)
  --output, -o <file>  PDF path (export · default <deck>.pdf)
  --out <dir>          picture directory (render · default <deck>.shots/)
                       scene plan: where candidates.json, <id>.html and <id>.png go
                       scene compile: the file the slide is written to (default stdout)
  --slides a,b         render/check: which slides · a number (1-based), an id, an interval
                       (4-9, -3, 8-) or two ends (intro..outro), comma-separated
  --steps              render: one picture per revealed state, not just the first
  --baseline <dir>     render: compare this render to an earlier one, slide by slide
  --threshold <pct>    render: percent of pixels that makes a slide changed (default 0.5)
  --width, --height    render/check: canvas size in pixels (default 1920×1080)
                       scene budgets: --width is the scene's width in drawing units (default 1600)
  --json               check / render --baseline / scene: write the report to stdout as JSON
  --measure            scene plan: draw each candidate in Chromium, read its height and
                       its issues, and photograph it
  --candidate <id>     scene compile: the candidate of the plan to write as a slide
  --list               intent: every intent of the grammar, and which compile today
                       recipe: the twelve recipes, their model and their tempo
  --brief              recipe: the example brief, as JSON to copy and edit
  --example            recipe: the slide the example brief draws
  --fill <brief.json>  recipe: the slide your brief draws · refused (exit 1) when a field is
                       empty, generic, too long, or the brief holds under two precise values
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
  --diversity          check: how alike the illustrations are · each one's nearest neighbour,
                       and the matrix of every distance in the JSON
  --richness           check: each illustration's richness on its five criteria, and the
                       warnings ILL_GENERIC, ILL_FLAT_PAINT, ILL_MODEL_REPEAT (a measure, off by default)
  --checks <rules>     check: rules taken back or dropped, after the config's · comma list,
                       '-' drops, '*' matches, by name or code (-text-*,ill-wordy)
  --severity <rule=level>   check: error, warning or off for a rule or a glob (repeatable)
  --warnings-as-errors <rules>  check: the warnings of these rules fail the run
  --limit <name=value>      check: a threshold (minTextPx=20, ill.words=120) (repeatable)
  --check-option <CODE.option=value>  check: an option a plugin rule reads (repeatable)
  --no-inline-exceptions    check: ignore the data-check-off exceptions written in the deck
  --list-checks        check: every rule the deck can meet, and whether its policy keeps it
  --show-suppressed    check: list what the deck's policy left out, with the reason
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

/** `--slides -3` reads as two options to parseArgs · glue the value to its flag
 *  so an interval that opens at the start of the deck can be typed as it reads. */
function glueSlidesValue(argv) {
  return argv.flatMap((arg, i) => {
    if (argv[i - 1] === '--slides' && /^-\d/.test(arg)) return [];
    const next = argv[i + 1];
    return arg === '--slides' && next !== undefined && /^-\d/.test(next) ? [`--slides=${next}`] : [arg];
  });
}

async function cmdRender(argv) {
  const { values, positionals } = parseArgs({
    args: glueSlidesValue(argv),
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

/** `--checks -text-*` · a value that starts with a dash is the flag's, not a flag. */
function glueRuleLists(argv) {
  const flags = ['--checks', '--warnings-as-errors'];
  return argv.flatMap((arg, i) => {
    if (flags.includes(argv[i - 1]) && arg.startsWith('-') && !arg.startsWith('--')) return [];
    const next = argv[i + 1];
    return flags.includes(arg) && next?.startsWith('-') && !next.startsWith('--') ? [`${arg}=${next}`] : [arg];
  });
}

/** `--severity ill-wordy=error` and its kind, as `[name, value]` pairs · a pair
 *  without `=` is the caller's mistake, said before a browser is spent. */
function pairsOf(list, flag) {
  return (list ?? []).map((entry) => {
    const at = entry.indexOf('=');
    if (at < 1) throw new ExpectedError(`check · --${flag} expects <name>=<value>, got "${entry}"`, { exitCode: 2 });
    return [entry.slice(0, at), entry.slice(at + 1)];
  });
}

/** The policy written on the command line · refused here, exit 2, when it cannot work. */
function selectionOf(values) {
  const severity = Object.fromEntries(pairsOf(values.severity, 'severity'));
  const limits = Object.fromEntries(
    pairsOf(values.limit, 'limit').map(([name, raw]) => {
      const value = Number(raw);
      if (!Number.isFinite(value)) throw new ExpectedError(`check · --limit ${name} must be a number, got "${raw}"`, { exitCode: 2 });
      return [name, value];
    }),
  );
  const options = Object.create(null);
  for (const [key, raw] of pairsOf(values['check-option'], 'check-option')) {
    if (!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(key))
      throw new ExpectedError(`check · --check-option expects <rule>.<option>=<value>, got "${key}"`, { exitCode: 2 });
    let value = raw;
    try {
      value = JSON.parse(raw);
    } catch {
      // A bare word is a string.
    }
    options[key] = value;
  }
  const selection = {
    ...(values.checks !== undefined ? { checks: values.checks } : {}),
    ...(values['warnings-as-errors'] !== undefined ? { warningsAsErrors: values['warnings-as-errors'] } : {}),
    ...(Object.keys(severity).length ? { severity } : {}),
    ...(Object.keys(limits).length ? { limits } : {}),
    ...(Object.keys(options).length ? { options: { ...options } } : {}),
    ...(values['no-inline-exceptions'] ? { inline: 'none' } : {}),
  };
  const problems = [
    ...(selection.severity ? Object.entries(selection.severity).filter(([, level]) => !LEVELS.includes(level)).map(([rule, level]) => `--severity ${rule}=${level}: the level is one of ${LEVELS.join(', ')}`) : []),
  ];
  if (problems.length) throw new ExpectedError(`check · ${problems.join(' · ')}`, { exitCode: 2 });
  try {
    buildPolicy({ cli: selection });
  } catch (error) {
    throw new ExpectedError(`check · ${error.message}`, { exitCode: 2 });
  }
  return selection;
}

/** `--list-checks` in words · one line per rule, kept (+), dropped (-) or kept on
 *  some slides only (~). */
function formatChecks(report) {
  const mark = { true: '+', false: '-', mixed: '~' };
  const lines = report.checks.map((c) => {
    const notes = [
      c.origin,
      ...(c.alwaysOn ? ['always on'] : []),
      ...(c.severity ? [c.severity] : []),
      ...(c.slides ? [`off on slides ${c.slides.off.join(', ')}`] : []),
      ...(c.decidedBy ? [`by ${c.decidedBy}`] : []),
    ];
    return `${mark[String(c.enabled)]} ${c.name}  (${c.code} · ${notes.join(' · ')})`;
  });
  for (const d of report.diagnostics) lines.push(`${d.severity === 'error' ? '✗' : '!'} ${d.code} · ${d.message}`);
  return lines.join('\n');
}

async function cmdCheck(argv) {
  const { values, positionals } = parseArgs({
    args: glueRuleLists(glueSlidesValue(argv)),
    allowPositionals: true,
    options: {
      checks: { type: 'string' },
      severity: { type: 'string', multiple: true },
      'warnings-as-errors': { type: 'string' },
      limit: { type: 'string', multiple: true },
      'check-option': { type: 'string', multiple: true },
      'no-inline-exceptions': { type: 'boolean', default: false },
      'list-checks': { type: 'boolean', default: false },
      'show-suppressed': { type: 'boolean', default: false },
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
      diversity: { type: 'boolean', default: false },
      richness: { type: 'boolean', default: false },
      slides: { type: 'string' },
      width: { type: 'string' },
      height: { type: 'string' },
    },
  });
  const inputPath = deckArgument('check', positionals[0], { exitCode: 2 });
  const selection = selectionOf(values);
  const report = await checkDeck(inputPath, {
    selection,
    listChecks: values['list-checks'],
    slides: values.slides,
    diversity: values.diversity,
    richness: values.richness,
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

  if (values['list-checks']) {
    if (values.json) process.stdout.write(JSON.stringify(report, null, 2) + '\n');
    else console.error(formatChecks(report));
    // A policy that cannot be read is the caller's to fix · the list would lie.
    if (report.diagnostics.some((d) => d.severity === 'error')) process.exit(2);
    return;
  }

  // In --json mode stdout carries the report and nothing else, so a caller can
  // pipe it without stripping anything · including when the deck is broken.
  if (values.json) process.stdout.write(JSON.stringify(report, null, 2) + '\n');
  else console.error(formatReport(report, { showSuppressed: values['show-suppressed'], richness: values.richness }));

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

// ── rikiki scene · from a brief to a slide ──────────────────────
// Exit codes follow `check`: 2 when the call cannot be carried out (no brief, a
// brief that is not JSON or not valid, an unknown candidate or shape), 1 when
// the plan holds no candidate that fits, 0 otherwise.

const SCENE_SUBCOMMANDS = ['plan', 'compile', 'budgets'];

/** A scene call that cannot be carried out is the call's fault, not the brief's. */
const sceneCallError = (message, options = {}) =>
  new ExpectedError(`scene · ${message}`, { exitCode: 2, ...options });

/** parseArgs for a scene sub-command · an unknown flag is a bad call (exit 2),
 *  said in one line rather than as a stack. */
function parseSceneArgs(argv, options) {
  try {
    return parseArgs({ args: argv, allowPositionals: true, options });
  } catch (cause) {
    if (!String(cause?.code).startsWith('ERR_PARSE_ARGS')) throw cause;
    throw sceneCallError(cause.message, { cause });
  }
}

/** Read a brief · a file that is not there, or not JSON, is a bad call. */
function readBrief(input, fail = sceneCallError) {
  if (!input) throw fail('missing <brief.json>');
  const path = resolve(process.cwd(), input);
  if (!existsSync(path) || !statSync(path).isFile()) throw fail(`brief not found: ${path}`);
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (cause) {
    throw fail(`${path} is not JSON · ${cause.message}`, { cause });
  }
}

/** Plan a brief, or stop on what is wrong with it · in --json mode stdout still
 *  carries the result, the errors included, and nothing else. */
function planOrStop(brief, { json }) {
  const plan = planScenes(brief);
  if (plan.ok) return plan;
  if (json) {
    process.stdout.write(JSON.stringify(plan, null, 2) + '\n');
    throw sceneCallError(`the brief is not valid · ${plan.errors.length} error(s)`);
  }
  throw sceneCallError(
    ['the brief is not valid', ...formatProblems(plan.errors, 'error'), ...formatProblems(plan.warnings, 'warning')].join('\n'),
  );
}

function writePlan(plan, outDir) {
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'candidates.json'), JSON.stringify(plan, null, 2) + '\n');
  for (const candidate of plan.candidates) {
    writeFileSync(join(outDir, `${candidate.id}.html`), candidate.html + '\n');
  }
  console.error(`rikiki · wrote candidates.json and ${plan.candidates.length} candidate(s) to ${outDir}`);
}

async function cmdScenePlan(argv) {
  const { values, positionals } = parseSceneArgs(argv, {
    out: { type: 'string' },
    json: { type: 'boolean', default: false },
    measure: { type: 'boolean', default: false },
    theme: { type: 'string', default: 'rikiki' },
  });
  if (!MEASURE_THEMES.includes(values.theme)) {
    throw sceneCallError(`--theme is one of ${MEASURE_THEMES.join(', ')}`);
  }
  let plan = planOrStop(readBrief(positionals[0]), { json: values.json });
  const outDir = values.out === undefined ? undefined : resolve(process.cwd(), values.out);

  if (values.measure) {
    const shotsDir = outDir ?? mkdtempSync(join(tmpdir(), 'rikiki-scene-'));
    if (!outDir) console.error(`rikiki · scene · pictures go to ${shotsDir}`);
    const measured = await measureCandidates(plan.candidates, { outDir: shotsDir, theme: values.theme });
    for (const line of measured.notes) console.error(`rikiki · scene · note · ${line}`);
    plan = { ...plan, candidates: measured.candidates };
  }
  if (outDir) writePlan(plan, outDir);

  if (values.json) process.stdout.write(JSON.stringify(plan, null, 2) + '\n');
  else console.error(formatPlan(plan));
  if (!plan.candidates.some((candidate) => candidate.fits)) process.exit(1);
}

function cmdSceneCompile(argv) {
  const { values, positionals } = parseSceneArgs(argv, {
    candidate: { type: 'string' },
    out: { type: 'string' },
  });
  const brief = readBrief(positionals[0]);
  const plan = planOrStop(brief, { json: false });
  const ids = plan.candidates.map((candidate) => candidate.id).join(', ');
  const candidate = plan.candidates.find((c) => c.id === values.candidate);
  if (!candidate) {
    throw sceneCallError(
      values.candidate === undefined
        ? `compile needs --candidate, one of ${ids}`
        : `no candidate "${values.candidate}" in this plan · one of ${ids}`,
    );
  }
  if (!candidate.fits) {
    console.error(`rikiki · scene · WARNING · ${candidate.id} does not fit · \`rikiki scene plan\` says why`);
  }
  const slide = compiledSlide(compileSlide(brief, candidate), candidate.id);
  writeOut(slide, values.out === undefined ? '-' : resolve(process.cwd(), values.out));
}

/** `--width` of a scene, in drawing units · not a size is an error, not a fallback. */
function drawingUnits(input) {
  if (input === undefined) return SCENE_WIDTH;
  const n = Number(input);
  if (!Number.isInteger(n) || n < 1) throw sceneCallError('--width must be a positive whole number of drawing units');
  return n;
}

function cmdSceneBudgets(argv) {
  const { values, positionals } = parseSceneArgs(argv, {
    width: { type: 'string' },
    json: { type: 'boolean', default: false },
  });
  const kind = positionals[0];
  if (!SCENE_KINDS.includes(kind)) {
    const what = kind === undefined ? 'budgets needs a shape' : `unknown shape "${kind}"`;
    throw sceneCallError(`${what} · one of ${SCENE_KINDS.join(', ')}`);
  }
  const budgets = sceneBudgets(kind, drawingUnits(values.width));
  if (values.json) process.stdout.write(JSON.stringify(budgets, null, 2) + '\n');
  else console.error(formatBudgets(budgets));
}

async function cmdScene(argv) {
  const [sub, ...rest] = argv;
  if (sub === 'plan') return cmdScenePlan(rest);
  if (sub === 'compile') return cmdSceneCompile(rest);
  if (sub === 'budgets') return cmdSceneBudgets(rest);
  const what = sub === undefined ? 'missing sub-command' : `unknown sub-command "${sub}"`;
  throw sceneCallError(`${what} · one of ${SCENE_SUBCOMMANDS.join(', ')}\n\n${HELP}`);
}

/** `rikiki intent` · the skeleton of an intent, by name or from a sentence, to stdout. */
function cmdIntent(argv) {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: { list: { type: 'boolean', default: false } },
  });
  if (values.list) {
    console.log(formatIntentList());
    return;
  }
  const query = positionals.join(' ').trim();
  if (!query) throw new ExpectedError('intent needs a sentence or a name · `rikiki intent --list` names them');
  console.log(answerIntent(query));
}

/** `rikiki recipe` · a graphic model, its brief, its skeleton and its sequence, to stdout. */
function cmdRecipe(argv) {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      list: { type: 'boolean', default: false },
      brief: { type: 'boolean', default: false },
      example: { type: 'boolean', default: false },
      fill: { type: 'string' },
    },
  });
  if (values.list) {
    console.log(formatRecipeList());
    return;
  }
  const query = positionals.join(' ').trim();
  if (!query) throw new ExpectedError('recipe needs a sentence or a name · `rikiki recipe --list` names them');
  if (!values.brief && !values.example && !values.fill) {
    console.log(answerRecipe(query));
    return;
  }
  const recipe = recipeOrFail(query);
  if (values.brief) console.log(JSON.stringify(exampleBrief(recipe), null, 2));
  else if (values.example) console.log(fillRecipe(recipe, exampleBrief(recipe)));
  else console.log(fillRecipe(recipe, readBrief(values.fill, recipeCallError)));
}

const recipeCallError = (message, options = {}) => new ExpectedError(`recipe · ${message}`, options);

// Consumer-facing skills shipped in the npm tarball. `rikiki-component` and
// `bump-version` stay repo-only (they need the TS sources / release scripts a
// package consumer doesn't have).
const DISTRIBUTED_SKILLS = [
  'rikiki-deck',
  'rikiki-theme',
  'rikiki-debug',
  'rikiki-illustrate',
  'rikiki-scenes',
];

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
  else if (cmd === 'scene') await cmdScene(rest);
  else if (cmd === 'intent') cmdIntent(rest);
  else if (cmd === 'recipe') cmdRecipe(rest);
  else if (!cmd || cmd === '-h' || cmd === '--help' || cmd === 'help') { console.log(HELP); }
  else { console.error('rikiki · unknown command: ' + cmd + '\n\n' + HELP); process.exit(1); }
} catch (e) {
  console.error(formatCliError(e));
  process.exit(e?.exitCode ?? 1);
}
