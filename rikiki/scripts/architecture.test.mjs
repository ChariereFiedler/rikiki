import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// The dependency direction, enforced rather than trusted.
//
// docs/design/adr-001-deck-navigation-domain.md says everything points inward:
// the domain knows nothing of the DOM, of Lit, or of the engine around it. That
// is the property that makes the navigation rules testable in milliseconds, and
// it is one careless import away from being lost. A comment does not defend it;
// this file does.

const PKG_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DOMAIN_DIR = resolve(PKG_DIR, 'src/domain');

function sourcesIn(dir) {
  return readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) => {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) return sourcesIn(full);
      return entry.name.endsWith('.ts') ? [full] : [];
    })
    .filter((f) => !f.endsWith('.test.ts'));
}

const domainFiles = sourcesIn(DOMAIN_DIR);
const rel = (f) => relative(PKG_DIR, f);

/** Globals a browser provides · a domain file that touches one has stopped
 *  being testable without a browser, which is the whole point of the layer. */
const BROWSER_GLOBALS = [
  'document',
  'window',
  'location',
  'navigator',
  'history',
  'HTMLElement',
  'Element',
  'CustomEvent',
  'requestAnimationFrame',
  'setTimeout',
  'setInterval',
  'ResizeObserver',
];

/** Directories the domain must never import from · everything there depends on
 *  the domain, so an import back would make the cycle the ADR forbids. */
const OUTWARD = ['runtime', 'layouts', 'atoms', 'molecules', 'plugins', 'infrastructure'];

describe('the navigation domain stays pure', () => {
  it('has source files to check', () => {
    expect(domainFiles.length, 'src/domain is not empty').toBeGreaterThan(0);
  });

  it.each(domainFiles)('%s imports no framework', (file) => {
    const src = readFileSync(file, 'utf8');
    const imports = [...src.matchAll(/^\s*import\s[^;]*?from\s+['"]([^'"]+)['"]/gm)].map(
      (m) => m[1],
    );
    const framework = imports.filter((s) => !s.startsWith('.'));
    expect(framework, `${rel(file)} imports ${framework.join(', ')}`).toEqual([]);
  });

  it.each(domainFiles)('%s imports nothing from an outer layer', (file) => {
    const src = readFileSync(file, 'utf8');
    const imports = [...src.matchAll(/^\s*import\s[^;]*?from\s+['"]([^'"]+)['"]/gm)].map(
      (m) => m[1],
    );
    const outward = imports.filter((s) => OUTWARD.some((dir) => s.includes(`/${dir}/`)));
    expect(outward, `${rel(file)} reaches outward: ${outward.join(', ')}`).toEqual([]);
  });

  it.each(domainFiles)('%s touches no browser global', (file) => {
    const src = readFileSync(file, 'utf8')
      // Comments may name them freely · it is the code that must not use them.
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/(^|\s)\/\/[^\n]*/g, '');
    const used = BROWSER_GLOBALS.filter((g) => new RegExp(`\\b${g}\\b`).test(src));
    expect(used, `${rel(file)} uses ${used.join(', ')}`).toEqual([]);
  });

  it.each(domainFiles)('%s is covered by a sibling test file', (file) => {
    // A pure layer with no test is a pure layer nobody checks. Each module is
    // covered either by its own test or by the navigation suite that drives it.
    const own = file.replace(/\.ts$/, '.test.ts');
    const suite = resolve(DOMAIN_DIR, 'navigation.test.ts');
    const covered =
      existsSyncSafe(own) ||
      readFileSync(suite, 'utf8').includes(`./${file.split('/').pop()?.replace(/\.ts$/, '.js')}`);
    expect(covered, `${rel(file)} has no test`).toBe(true);
  });
});

function existsSyncSafe(path) {
  try {
    readFileSync(path);
    return true;
  } catch {
    return false;
  }
}
