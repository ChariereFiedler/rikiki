// ════════════════════════════════════════════════════════════════
// Shared single-file inliner · turns a rikiki deck HTML into one
// self-contained file with ZERO external references (JS, CSS, fonts and
// images inlined). JS bundling + per-deck curation (tree-shaking unused
// components) is delegated to rolldown · CSS / font / image inlining is
// plain Node string work, bundler-agnostic.
//
// Used by both `rikiki bundle <deck.html>` and `rikiki init --standalone`.
// ════════════════════════════════════════════════════════════════

import { readFileSync, existsSync, writeFileSync, rmSync, mkdtempSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

// rolldown is an OPTIONAL peer dependency · it weighs ~55 MB of native bindings
// and is only ever needed by `rikiki bundle` / `rikiki init --standalone`.
// A consumer who only loads dist/index.js must not pay for it, so it is
// imported on first use and its absence is reported, never swallowed.
let rolldownFn = null;
async function loadRolldown() {
  if (rolldownFn) return rolldownFn;
  try {
    ({ rolldown: rolldownFn } = await import('rolldown'));
  } catch (cause) {
    throw new Error(
      'rikiki bundle needs rolldown, which is an optional peer dependency.\n' +
        '  Install it next to rikiki-deck:  npm i -D rolldown\n' +
        '  (it is optional so that decks which only load the runtime do not pull ~55 MB of native bindings)',
      { cause },
    );
  }
  return rolldownFn;
}

// A literal `</script>` inside the bundled JS (deck-presenter builds popup HTML
// at runtime) would close the inline <script> early · the backslash is a no-op
// for JS string semantics but hides the tag from the HTML parser.
const escapeScript = (js) => js.replace(/<\/script>/gi, '<\\/script>');

const isExternal = (url) => /^(https?:)?\/\//i.test(url) || url.startsWith('//');

const MIME = {
  woff2: 'font/woff2', woff: 'font/woff', ttf: 'font/ttf', otf: 'font/otf',
  svg: 'image/svg+xml', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
  gif: 'image/gif', webp: 'image/webp', avif: 'image/avif',
};

/** Read a local file as a `data:<mime>;base64,…` URI. */
function dataUri(absPath) {
  const ext = absPath.split('.').pop().toLowerCase();
  const mime = MIME[ext] || 'application/octet-stream';
  return `data:${mime};base64,${readFileSync(absPath).toString('base64')}`;
}

/** Resolve a deck reference to an absolute path · rikiki package assets
 *  (dist/, themes/, tokens.css) resolve against pkgRoot when not found next to
 *  the deck, so a deck may use whichever path style it likes. */
function resolveRef(ref, baseDir, pkgRoot) {
  const clean = ref.replace(/^\//, '').replace(/.*?rikiki\//, '');
  const candidates = [
    resolve(baseDir, ref),
    /(?:^|\/)(dist|themes)\/|tokens\.css$/.test(ref) ? resolve(pkgRoot, clean) : null,
  ].filter(Boolean);
  return candidates.find(existsSync) ?? candidates[0];
}

/** Bundle a JS entry file to one ESM string (lazy imports folded in). */
async function bundleEntry(absEntry, { minify = true } = {}) {
  const rolldown = await loadRolldown();
  const bundle = await rolldown({ input: absEntry, logLevel: 'silent' });
  const { output } = await bundle.generate({ format: 'esm', codeSplitting: false, minify });
  await bundle.close?.();
  return output[0].code.trimEnd();
}

/** Bundle a snippet of module JS (with imports) by staging it in a temp dir. */
async function bundleInlineModule(code, resolveDir, pkgRoot, opts) {
  const dir = mkdtempSync(join(tmpdir(), 'rikiki-inline-'));
  const entry = join(dir, 'entry.mjs');
  try {
    // Rewrite relative imports to absolute so they resolve from the original
    // location rather than the temp dir · rikiki paths (./dist/…) fall back to
    // the package root via resolveRef, so a deck anywhere can reference them.
    const fixed = code.replace(/(from\s+|import\s*\(\s*)(['"])(\.[^'"]+)\2/g,
      (_m, kw, q, p) => `${kw}${q}${resolveRef(p, resolveDir, pkgRoot)}${q}`);
    writeFileSync(entry, fixed);
    return await bundleEntry(entry, opts);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** Modules the deck loads through its own <script src>, by basename.
 *
 *  An opt-in component (src/extras/**) is loaded that way AND is now found by
 *  the tag scan below, because it has a dist/<tag>.js like any other. Including
 *  it twice registers the custom element twice, which throws
 *  NotSupportedError and leaves the rest of that module unevaluated. */
function explicitlyLoaded(html) {
  const names = new Set();
  for (const m of html.matchAll(/<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>/gi)) {
    const file = m[1].split('/').pop() ?? '';
    if (file.endsWith('.js')) names.add(file.slice(0, -3));
  }
  return names;
}

/** Scan the deck for the <deck-*> components it actually uses · so the bundle
 *  carries only those (+ deck-root, + forced includes), not every element. */
function scanComponents(html, pkgRoot, include = []) {
  const tags = new Set(['deck-root', ...include]);
  for (const m of html.matchAll(/<(deck-[a-z0-9-]+)[\s/>]/gi)) tags.add(m[1].toLowerCase());
  const already = explicitlyLoaded(html);
  return [...tags]
    .filter((t) => !already.has(t))
    .filter((t) => existsSync(resolve(pkgRoot, 'dist', `${t}.js`)));
}

/** Build the curated component bundle · one side-effect import per used tag. */
async function curatedBundle(html, pkgRoot, { include, minify }) {
  const comps = scanComponents(html, pkgRoot, include);
  const entry = comps.map((t) => `import ${JSON.stringify(resolve(pkgRoot, 'dist', `${t}.js`))};`).join('\n');
  return bundleInlineModule(entry, pkgRoot, pkgRoot, { minify });
}

const minifyCssText = (css) => css
  .replace(/\/\*[\s\S]*?\*\//g, '')          // comments
  .replace(/\s+/g, ' ')                       // collapse whitespace
  .replace(/\s*([{}:;,>])\s*/g, '$1')         // around punctuation
  .replace(/;}/g, '}')
  .trim();

/** Inline one CSS file: follow local @imports, drop external ones, turn local
 *  url(...) assets (woff2, images, …) into data URIs. */
function inlineCss(absCssPath, { noFonts } = {}, seen = new Set()) {
  if (seen.has(absCssPath) || !existsSync(absCssPath)) return '';
  seen.add(absCssPath);
  const dir = dirname(absCssPath);
  let css = readFileSync(absCssPath, 'utf8');

  // @import · inline local ones recursively, strip external (CSP-proof).
  css = css.replace(/@import\s+url\(\s*['"]?([^'")]+)['"]?\s*\)\s*;?/g, (_m, href) => {
    if (isExternal(href)) return '';                       // e.g. Google Fonts
    return inlineCss(resolve(dir, href), { noFonts }, seen);
  });

  // url(...) assets · inline local files as data URIs, blank external ones.
  css = css.replace(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g, (m, ref) => {
    if (ref.startsWith('data:') || ref.startsWith('#')) return m;
    if (isExternal(ref)) return 'none';                    // no external fetch
    if (noFonts && /\.(woff2?|ttf|otf|eot)(\?.*)?$/i.test(ref)) return 'none';
    const assetPath = resolve(dir, ref.split(/[?#]/)[0]);
    if (!existsSync(assetPath)) return m;
    return `url(${dataUri(assetPath)})`;
  });

  return css;
}

const attr = (tag, name) => (tag.match(new RegExp(`\\b${name}=["']([^"']*)["']`, 'i')) || [])[1];

/**
 * Inline a deck HTML into a self-contained string.
 *   baseDir/pkgRoot · resolution roots (deck dir / rikiki package)
 *   cure/all/include · component tree-shaking (default cured; --all keeps all)
 *   minifyJs/minifyCss/minifyHtml · default: JS minified, HTML+CSS readable
 *   noFonts · drop fonts instead of inlining them
 */
export async function inlineDeck({
  html, baseDir, pkgRoot,
  cure = true, all = false, include = [],
  minifyJs = true, minifyCss = false, minifyHtml = false,
  noFonts = false,
}) {
  let out = html;

  // Precompute the curated component bundle from the original markup (before we
  // inline big <script> blocks the tag scan must not see).
  const curated = (cure && !all) ? await curatedBundle(html, pkgRoot, { include, minify: minifyJs }) : null;

  // ── Asset passes run BEFORE script bundling · their regexes must never see
  //    the inlined JS (which contains <img>/style= in string literals). ──────

  // a. <img src="*.svg"> · replace with the inline <svg> markup (stylable).
  out = out.replace(/<img\b[^>]*>/gi, (tag) => {
    const src = attr(tag, 'src');
    if (!src || isExternal(src) || src.startsWith('data:') || !/\.svg$/i.test(src)) return tag;
    const abs = resolveRef(src, baseDir, pkgRoot);
    if (!existsSync(abs)) return tag;
    let svg = readFileSync(abs, 'utf8')
      .replace(/<\?xml[\s\S]*?\?>/i, '').replace(/<!DOCTYPE[\s\S]*?>/i, '').trim();
    const cls = attr(tag, 'class'), id = attr(tag, 'id'), sty = attr(tag, 'style');
    const extra = (cls ? ` class="${cls}"` : '') + (id ? ` id="${id}"` : '') + (sty ? ` style="${sty}"` : '');
    return extra ? svg.replace(/<svg\b/, `<svg${extra}`) : svg;
  });

  // b. any image-bearing attribute (img/deck-photo src, deck-cover brand-src,
  //    video poster, …) pointing at a local image → base64 data URI.
  out = out.replace(/\b(src|brand-src|poster|data-src)=(["'])([^"']+)\2/gi, (m, name, q, ref) => {
    if (ref.startsWith('data:') || isExternal(ref)) return m;
    if (!/\.(png|jpe?g|gif|webp|avif|svg)$/i.test(ref)) return m;   // only images, never JS
    const abs = resolveRef(ref, baseDir, pkgRoot);
    return existsSync(abs) ? `${name}=${q}${dataUri(abs)}${q}` : m;
  });

  // c. inline style="… url(local) …" → base64.
  out = out.replace(/\bstyle=(["'])([\s\S]*?)\1/gi, (m, q, body) => {
    if (!/url\(/i.test(body)) return m;
    const fixed = body.replace(/url\(\s*['"]?([^'")]+)['"]?\s*\)/gi, (um, ref) => {
      if (ref.startsWith('data:') || ref.startsWith('#') || isExternal(ref)) return um;
      const abs = resolve(baseDir, ref.split(/[?#]/)[0]);
      return existsSync(abs) ? `url(${dataUri(abs)})` : um;
    });
    return `style=${q}${fixed}${q}`;
  });

  // 1. <link rel="stylesheet" href="..."> → inline <style>
  out = out.replace(/<link\b[^>]*\brel=["']stylesheet["'][^>]*>/gi, (tag) => {
    const href = attr(tag, 'href');
    if (!href || isExternal(href)) return '';              // drop external sheets
    let css = inlineCss(resolveRef(href, baseDir, pkgRoot), { noFonts });
    if (minifyCss) css = minifyCssText(css);
    return `<style>\n${css}\n</style>`;
  });

  // 2. inline <script type="module">…</script> WITH imports → bundle.
  out = await replaceAsync(out, /<script\b[^>]*\btype=["']module["'][^>]*>([\s\S]*?)<\/script>/gi,
    async (full, body) => {
      if (!/\bimport\b/.test(body)) return full;
      const code = await bundleInlineModule(body, baseDir, pkgRoot, { minify: minifyJs });
      return `<script type="module">\n${escapeScript(code)}\n</script>`;
    });

  // 3. <script src="..."> → inline. The rikiki barrel (dist/index.js) is swapped
  //    for the curated bundle; other module scripts bundle as-is; classic
  //    scripts (mermaid UMD) are inlined verbatim.
  out = await replaceAsync(out, /<script\b([^>]*)\bsrc=["']([^"']+)["']([^>]*)><\/script>/gi,
    async (full, pre, src, post) => {
      if (isExternal(src)) return full;
      const abs = resolveRef(src, baseDir, pkgRoot);
      const isModule = /type=["']module["']/.test(pre + post);
      const isBarrel = abs === resolve(pkgRoot, 'dist', 'index.js');
      const code = curated && isBarrel ? curated
        : isModule ? await bundleEntry(abs, { minify: minifyJs })
        : readFileSync(abs, 'utf8');
      // Tag the inlined framework bundle so the presenter can re-inject it into
      // its preview iframes (no external index.js to <script src> in one file).
      const attrs = isModule ? ' type="module" data-rikiki-bundle' : '';
      return `<script${attrs}>\n${escapeScript(code)}\n</script>`;
    });

  // Optional · collapse blank lines / trailing spaces (safe, conservative).
  if (minifyHtml) out = out.replace(/[ \t]+$/gm, '').replace(/\n{2,}/g, '\n');

  return out;
}

/** async String.replace · awaits each replacement in order. */
async function replaceAsync(str, regex, fn) {
  const parts = [];
  let last = 0;
  for (const m of str.matchAll(regex)) {
    parts.push(str.slice(last, m.index));
    parts.push(await fn(...m, m.index, m.input));
    last = m.index + m[0].length;
  }
  parts.push(str.slice(last));
  return parts.join('');
}
