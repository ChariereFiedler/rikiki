// ════════════════════════════════════════════════════════════════
// rikiki assemble · build one deck HTML from ordered partials.
//
// A long talk is easier to write, review and diff in pieces. This joins them
// back into the single HTML file everything else in rikiki expects: `bundle`
// folds it, `export` prints it, a browser serves it.
//
// deck.config.{js,json} shape:
//   export default {
//     title: 'My talk',
//     theme: 'rikiki/tokens.css',      // href, relative to the OUTPUT file
//     bundle: 'rikiki/dist/index.js',  // runtime href, relative to OUTPUT
//     transition: 'slide',             // optional <deck-root transition="…">
//     lang: 'fr',                      // optional <html lang="…">
//     slides: ['parts/cover.html', 'parts/intro.md', 'parts/closing.html'],
//   };
//
// .html partials are inlined verbatim (one or more <deck-*> elements).
// .md partials become slides · a line that is exactly `---` starts a new one.
// ════════════════════════════════════════════════════════════════

import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, extname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ExpectedError } from './cli-error.mjs';

// What `rikiki init` writes, so an assembled deck bundles like any other.
const DEFAULT_THEME = 'rikiki/tokens.css';
const DEFAULT_RUNTIME = 'rikiki/dist/index.js';

const escapeHtml = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Split a markdown file into slides on lines that are exactly `---`
 *  (reveal.js convention). One file, many slides. A blank chunk collapses. */
function splitMarkdownSlides(body) {
  const chunks = [];
  let current = [];
  for (const line of body.split(/\r?\n/)) {
    if (/^[ \t]*---[ \t]*$/.test(line)) {
      chunks.push(current.join('\n'));
      current = [];
    } else current.push(line);
  }
  chunks.push(current.join('\n'));
  return chunks.map((c) => c.trim()).filter((c) => c.length > 0);
}

function renderPartial(absPath) {
  const body = readFileSync(absPath, 'utf8');
  if (extname(absPath) !== '.md') return body.trimEnd();
  // <deck-md> deindents and parses the raw markdown at runtime, so the body is
  // inlined verbatim. `***` stays available as an in-slide rule.
  return splitMarkdownSlides(body)
    .map((slide) => `<deck-feature>\n<deck-md>\n${slide}\n</deck-md>\n</deck-feature>`)
    .join('\n\n');
}

async function loadConfig(absPath) {
  if (!existsSync(absPath) || !statSync(absPath).isFile()) {
    throw new ExpectedError(`assemble · config not found: ${absPath}`);
  }
  if (extname(absPath) === '.json') {
    try {
      return JSON.parse(readFileSync(absPath, 'utf8'));
    } catch (cause) {
      throw new ExpectedError(`assemble · ${absPath} is not valid JSON · ${cause.message}`);
    }
  }
  try {
    const mod = await import(pathToFileURL(absPath).href);
    return mod.default ?? mod;
  } catch (cause) {
    // A `.js` file is read as CommonJS or as an ES module depending on the
    // nearest package.json, and `npm init -y` writes "type": "commonjs". Both
    // dialects are legitimate here; only the mismatch is worth a message.
    if (cause?.code === 'ERR_REQUIRE_ESM' || cause instanceof SyntaxError) {
      throw new ExpectedError(
        `assemble · ${absPath} looks like an ES module, but the nearest package.json\n` +
          '  does not declare "type": "module". Use `module.exports = {…}`, rename the\n' +
          '  file to .mjs, or use a .json config.',
      );
    }
    throw cause;
  }
}

/** The default output path: the title, slugged, next to the config. */
export function defaultOutputPath(configPath, title) {
  const slug = String(title || 'deck')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return resolve(dirname(configPath), (slug || 'deck') + '.html');
}

/**
 * Assemble a deck from its config.
 * @returns {Promise<{ html: string, outputPath: string, slides: number, unbundleable: string[] }>}
 *          `outputPath` is null when the caller asked for stdout · `unbundleable`
 *          lists the hrefs `rikiki bundle` will not be able to inline.
 */
export async function assembleDeck(configPath, outputPath) {
  const absConfig = resolve(process.cwd(), configPath);
  const config = await loadConfig(absConfig);
  const configDir = dirname(absConfig);

  if (!Array.isArray(config.slides) || config.slides.length === 0) {
    throw new ExpectedError(`assemble · ${configPath} · \`slides\` must be a non-empty array`);
  }

  const slidesHtml = config.slides
    .map((rel) => {
      const abs = resolve(configDir, rel);
      if (!existsSync(abs)) throw new ExpectedError(`assemble · partial not found: ${rel}`);
      return renderPartial(abs);
    })
    .join('\n\n');

  const transitionAttr = config.transition ? ` transition="${escapeHtml(config.transition)}"` : '';
  const html = `<!doctype html>
<html lang="${escapeHtml(config.lang ?? 'en')}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(config.title ?? 'Rikiki deck')}</title>
<link rel="stylesheet" href="${escapeHtml(config.theme ?? DEFAULT_THEME)}">
<script type="module" src="${escapeHtml(config.bundle ?? DEFAULT_RUNTIME)}"></script>
</head>
<body>
<deck-root${transitionAttr}>
${slidesHtml}
</deck-root>
</body>
</html>
`;

  // A href that does not follow the `rikiki/…` spelling serves fine but will
  // not inline · saying so here beats a silent surprise at bundle time.
  const hrefs = [config.theme ?? DEFAULT_THEME, config.bundle ?? DEFAULT_RUNTIME];
  const unbundleable = hrefs.filter((href) => !/(^|\/)rikiki\//.test(href));

  if (outputPath === '-') {
    return { html, outputPath: null, slides: config.slides.length, unbundleable };
  }

  const absOutput = outputPath
    ? resolve(process.cwd(), outputPath)
    : defaultOutputPath(absConfig, config.title);
  mkdirSync(dirname(absOutput), { recursive: true });
  writeFileSync(absOutput, html);
  return { html, outputPath: absOutput, slides: config.slides.length, unbundleable };
}
