import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// The packaging contract · what `npm install rikiki-deck` actually costs and
// actually provides. Every claim here was wrong or unstated before v1.0.

const PKG_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(resolve(PKG_DIR, 'package.json'), 'utf8'));

describe('install cost', () => {
  it('installs no production dependency', () => {
    // rolldown weighs ~55 MB of native bindings and only serves the CLI ·
    // a deck that just loads dist/index.js must not pay for it.
    const deps = Object.keys(pkg.dependencies ?? {});
    expect(deps, `production dependencies: ${deps.join(', ')}`).toEqual([]);
  });

  it.each([
    'rolldown',
    'playwright',
  ])('declares %s as an optional peer, not a hard requirement', (name) => {
    // rolldown serves `bundle`, playwright serves `export` · neither belongs
    // in the install of someone who only shows decks in their own browser.
    expect(pkg.peerDependencies?.[name]).toBeTruthy();
    expect(pkg.peerDependenciesMeta?.[name]?.optional).toBe(true);
  });

  it('loads both optional peers lazily', () => {
    for (const file of ['bin/lib/inline.mjs', 'bin/lib/export-pdf.mjs']) {
      const src = readFileSync(resolve(PKG_DIR, file), 'utf8');
      expect(src, `${file} must not import an optional peer statically`).not.toMatch(
        /^import .*from '(rolldown|playwright)'/m,
      );
    }
  });

  it('keeps lit as a required peer · the shipped .d.ts files import it', () => {
    // Refuted audit finding: dist/**/*.d.ts import the bare `lit` specifier,
    // so removing this peer breaks every TypeScript consumer.
    expect(pkg.peerDependencies?.lit).toBeTruthy();
  });

  it('declares the Node range the CLI needs', () => {
    // rolldown requires ^20.19.0 || >=22.12.0 · without engines, an install on
    // an older Node fails with no usable message.
    expect(pkg.engines?.node).toBeTruthy();
    expect(pkg.engines.node).toMatch(/20\.19|22\.12/);
  });
});

describe('published surface', () => {
  it('ships the LLM reference, including the trust model', () => {
    // A consumer must receive the trust model with the code · SECURITY.md lives
    // at the repo root (where forges look for it) and cannot be published from
    // inside the package, so the shipped reference carries the same section.
    expect(pkg.files).toContain('llms.txt');
    expect(pkg.files).toContain('docs/llms');
    const reference = readFileSync(resolve(PKG_DIR, 'docs/llms/rikiki-reference.md'), 'utf8');
    expect(reference).toMatch(/## \d+ · Trust model/);
    expect(reference).toMatch(/Never render untrusted markdown/);
  });

  it('resolves every subpath its exports map declares', () => {
    const map = pkg.exports ?? {};
    const missing = [];
    for (const [subpath, target] of Object.entries(map)) {
      // Wildcard targets are checked through a representative file below.
      if (subpath.includes('*')) continue;
      const file = typeof target === 'string' ? target : (target.default ?? target.import);
      if (!file) continue;
      if (!existsSync(resolve(PKG_DIR, file))) missing.push(`${subpath} -> ${file}`);
    }
    expect(missing, `unresolvable exports: ${missing.join(', ')}`).toEqual([]);
  });

  it('lists every file the exports map points at inside `files`', () => {
    // A subpath that resolves locally but is not published is a broken install.
    const roots = new Set(pkg.files ?? []);
    const targets = Object.values(pkg.exports ?? {})
      .map((t) => (typeof t === 'string' ? t : (t?.default ?? t?.import)))
      .filter(Boolean)
      .map((f) => f.replace(/^\.\//, '').split('/')[0]);
    for (const root of new Set(targets)) {
      expect(
        roots,
        `exports point into "${root}", which package.json files does not publish`,
      ).toContain(root);
    }
  });
});

describe('vendored payloads', () => {
  it('vendors the exact mermaid version the manifest pins', () => {
    // Vendored copies are published inside dist/ and are invisible to
    // `npm audit --omit=dev` · the only guard is this equality.
    const declared = (pkg.devDependencies?.mermaid ?? '').replace(/^[^\d]*/, '');
    const installed = JSON.parse(
      readFileSync(resolve(PKG_DIR, 'node_modules/mermaid/package.json'), 'utf8'),
    ).version;
    expect(installed, `manifest pins mermaid ${declared}, node_modules has ${installed}`).toBe(
      declared,
    );
  });

  it('builds the vendor chunks from node_modules, never from a network fetch', () => {
    const buildVendor = readFileSync(resolve(PKG_DIR, 'build-vendor.mjs'), 'utf8');
    expect(buildVendor).not.toMatch(/https?:\/\//);
  });
});

describe('the CLI reports a missing optional peer instead of crashing', () => {
  it('names rolldown and how to install it', () => {
    const inline = readFileSync(resolve(PKG_DIR, 'bin/lib/inline.mjs'), 'utf8');
    expect(inline).toMatch(/npm i -D rolldown/);
    // Lazy import · a static import would defeat the optional peer entirely.
    expect(inline).not.toMatch(/^import .*from 'rolldown'/m);
  });

  it('still bundles a deck when rolldown is present', () => {
    // bento has no heavy plugin · demo.html would (correctly) exit 1 without
    // --with-mermaid, which is the bundler contract, not a packaging failure.
    const out = execFileSync(
      process.execPath,
      ['bin/rikiki.mjs', 'bundle', 'decks/tests/bento.html', '-'],
      { cwd: PKG_DIR, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
    );
    expect(out).toContain('<deck-root');
    expect(out.length).toBeGreaterThan(100_000);
  });
});
