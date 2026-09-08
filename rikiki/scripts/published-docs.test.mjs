import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// What ships must only speak of what ships.
//
// Before v1.0 the published README opened on `cp starter.html my-deck.html`,
// and two of the three shipped skills sent the agent to `bundle.mjs`,
// `npm run deck` and `examples/rikiki-tour/`. None of those exist after
// `npm install rikiki-deck`. The reader follows the instruction, it fails, and
// nothing in the repo noticed. This test notices.

const PKG_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(join(PKG_DIR, 'package.json'), 'utf8'));

// npm ships these whatever `files` says · they are published, not omitted.
const ALWAYS_PUBLISHED = ['package.json', 'README.md', 'LICENSE', 'CHANGELOG.md'];

/** Every top-level entry of the repo package that `files` does not publish. */
function unpublishedEntries() {
  const published = new Set(pkg.files.map((f) => f.split('/')[0]));
  return readdirSync(PKG_DIR)
    .filter((name) => !published.has(name) && !ALWAYS_PUBLISHED.includes(name))
    .filter((name) => !['node_modules', 'package-lock.json', '.claude'].includes(name));
}

/** The documents a consumer receives · READMEs, the agent reference, the skills. */
function publishedDocs() {
  const docs = [];
  const visit = (abs) => {
    if (statSync(abs).isDirectory()) {
      for (const name of readdirSync(abs)) visit(join(abs, name));
    } else if (abs.endsWith('.md') || abs.endsWith('.txt')) {
      docs.push(abs);
    }
  };
  for (const entry of pkg.files) {
    const abs = join(PKG_DIR, entry);
    try {
      visit(abs);
    } catch {
      // `files` may name something a build produces · covered by packaging.test.
    }
  }
  return docs;
}

// `dist` and `bin` ship, but their .md/.txt files are not prose for a reader.
const DOCS = publishedDocs().filter((p) => !/[\\/](dist|bin)[\\/]/.test(p));
const UNPUBLISHED = unpublishedEntries();

describe('a published document never sends the reader to a file it did not ship', () => {
  it('has documents to check at all', () => {
    expect(DOCS.length).toBeGreaterThan(3);
    expect(UNPUBLISHED).toContain('src');
  });

  it.each(DOCS.map((p) => [p.slice(PKG_DIR.length + 1), p]))('%s', (_name, abs) => {
    const text = readFileSync(abs, 'utf8');
    const cited = UNPUBLISHED.filter((entry) => {
      // A directory only counts when spelled as a path (`src/`), which keeps
      // the plain English word ("decks", `src="…"`) out of it. A file counts by
      // name. A link into the repository is a fair pointer, not a citation.
      const escaped = entry.replace(/\./g, '\\.');
      const isDir = statSync(join(PKG_DIR, entry)).isDirectory();
      const pattern = new RegExp(
        `(?<!gitlab\\.com/[\\w./-]{0,80})(?<![\\w"'=./-])${escaped}${isDir ? '/' : '\\b'}`,
      );
      return pattern.test(text);
    });
    expect(cited, `cites what an install does not deliver: ${cited.join(', ')}`).toEqual([]);
  });

  it('never tells a consumer to run a repo-only npm script', () => {
    // `npm run build` / `npm run deck` are contributor gestures · in a consumer
    // document they name a script the reader's package.json does not have.
    for (const abs of DOCS) {
      const text = readFileSync(abs, 'utf8');
      const scripts = [...text.matchAll(/npm run ([a-z:]+)/g)].map((m) => m[1]);
      expect(scripts, `${abs.slice(PKG_DIR.length + 1)} runs repo scripts`).toEqual([]);
    }
  });
});
