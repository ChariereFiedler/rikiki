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
  for (const name of ['rikiki', 'siliceum']) {
    const file = join(ROOT, 'themes', `${name}.css`);
    const src = readFileSync(file, 'utf8');
    chunks.push({ file, css: src, offset: 0, src, theme: name });
  }
  return chunks;
}
