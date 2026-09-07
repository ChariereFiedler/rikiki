// ════════════════════════════════════════════════════════════════
// Reading the CSS a component actually ships
//
// A rikiki visual lives in two places: a css`` template literal inside a Lit
// component, and a light-DOM rule in a theme file. Any check that only looks at
// one of the two has a blind spot, and the blind spot is not theoretical · the
// deck-table emphasis defect lived entirely in themes/*.css.
//
// One parser, several consumers · scripts/css-template.test.mjs looks for a
// stray backtick, scripts/paint-surfaces.mjs looks for painted surfaces.
// ════════════════════════════════════════════════════════════════

import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** Every non-test TypeScript source under a directory, recursively. */
export function sources(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return sources(full);
    return entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts') ? [full] : [];
  });
}

/** The body of every css`` literal in a file, with the offset it starts at. */
export function cssBlocks(src) {
  const blocks = [];
  const re = /\bcss`/g;
  let m = re.exec(src);
  while (m) {
    const start = m.index + m[0].length;
    const end = src.indexOf('`', start);
    if (end === -1) break;
    blocks.push({ start, body: src.slice(start, end) });
    re.lastIndex = end + 1;
    m = re.exec(src);
  }
  return blocks;
}

/** The 1-based line an offset falls on · for citing file:line in a failure. */
export function lineAt(src, offset) {
  return src.slice(0, offset).split('\n').length;
}

/** Every stylesheet rikiki ships, as { file, css, offset } chunks.
 *
 *  A component contributes one chunk per css`` literal, offset into the source
 *  file so a line number still points at the real line. A theme contributes the
 *  whole file. */
export function styleChunks() {
  const chunks = [];
  for (const file of sources(join(ROOT, 'src'))) {
    const src = readFileSync(file, 'utf8');
    for (const block of cssBlocks(src)) {
      chunks.push({ file, css: block.body, offset: block.start, src });
    }
  }
  for (const { file, name } of themeFiles()) {
    const src = readFileSync(file, 'utf8');
    chunks.push({ file, css: src, offset: 0, src, theme: name });
  }
  return chunks;
}

/** Every shipped theme, discovered rather than listed.
 *
 *  A theme is a stylesheet under themes/ that declares the page surface · that
 *  is what makes it a theme, and it is a property of the file rather than of
 *  its name. Naming them here instead would leave a third theme, the extension
 *  path the theme header advertises, outside every check in this directory. */
export function themeFiles() {
  const dir = join(ROOT, 'themes');
  return readdirSync(dir)
    .filter((name) => name.endsWith('.css'))
    .map((name) => ({ file: join(dir, name), name: name.replace(/\.css$/, '') }))
    .filter(({ file }) => readFileSync(file, 'utf8').includes('--rik-surface-page:'));
}

/** Strip comments · they are prose, and prose is allowed to differ. */
function withoutComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

/**
 * Drop the at-rules that carry no block · @import, @charset, @namespace.
 *
 * Walked rather than matched. An @import URL routinely contains a semicolon
 * (a Google Fonts `wght@400;700` axis list does), so a regex that reads to the
 * next `;` stops inside the URL and glues its tail onto the rule that follows.
 * That is not hypothetical: it swallowed the entire :root token block of both
 * shipped themes while every check stayed green.
 */
function withoutStatementAtRules(css) {
  let out = '';
  let i = 0;
  while (i < css.length) {
    if (css[i] !== '@') {
      out += css[i];
      i += 1;
      continue;
    }
    // Read the at-rule prelude, tracking what a bare scan would trip over.
    let j = i;
    let depth = 0;
    let quote = '';
    while (j < css.length) {
      const ch = css[j];
      if (quote) {
        if (ch === '\\') j += 1;
        else if (ch === quote) quote = '';
      } else if (ch === '"' || ch === "'") quote = ch;
      else if (ch === '(') depth += 1;
      else if (ch === ')') depth -= 1;
      else if (depth === 0 && (ch === ';' || ch === '{')) break;
      j += 1;
    }
    if (css[j] === '{') {
      // A block at-rule · hand it back untouched, flatten() owns it.
      out += css.slice(i, j + 1);
      i = j + 1;
      continue;
    }
    i = j + 1; // statement at-rule · dropped, semicolon included
  }
  return out;
}

/**
 * The declared shape of a stylesheet: selector → the property names it sets.
 *
 * Deliberately blind to values, and that is the whole point · a theme exists to
 * change values. Nested blocks (@media, @supports) are flattened under their
 * at-rule so a rule that lives in one theme's print block and the other's body
 * still reads as a difference.
 */
export function declaredShape(css) {
  const shape = new Map();
  const flatten = (source, prefix) => {
    let text = source;
    const atRule = /@([a-z-]+)([^{]*)\{/i;
    let match = atRule.exec(text);
    while (match) {
      const open = match.index + match[0].length;
      let depth = 1;
      let i = open;
      while (i < text.length && depth > 0) {
        if (text[i] === '{') depth += 1;
        else if (text[i] === '}') depth -= 1;
        i += 1;
      }
      const inner = text.slice(open, i - 1);
      const label = `@${match[1]}${match[2].trim() ? ` ${match[2].trim()}` : ''}`;
      // A token block (:root inside an at-rule) still declares properties, so
      // recurse rather than skip · that is where prefers-reduced-motion lives.
      flatten(inner, `${prefix}${label} `);
      text = text.slice(0, match.index) + text.slice(i);
      match = atRule.exec(text);
    }
    for (const rule of text.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      const selector = rule[1].trim().replace(/\s+/g, ' ');
      if (!selector) continue;
      const properties = [...rule[2].matchAll(/(--[\w-]+|[a-z-]+)\s*:/gi)].map((p) => p[1]);
      const key = `${prefix}${selector}`;
      const seen = shape.get(key) ?? new Set();
      for (const property of properties) seen.add(property);
      shape.set(key, seen);
    }
  };
  flatten(withoutStatementAtRules(withoutComments(css)), '');
  return shape;
}
