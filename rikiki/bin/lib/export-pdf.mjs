// ════════════════════════════════════════════════════════════════
// rikiki export · render a deck to PDF, one slide per page.
//
// The page geometry, the page breaks and the backgrounds all come from the
// deck's own print stylesheet (see slideShell in src/shared-styles.ts and the
// @page rule deck-root writes from its canvas). This module only drives a
// browser: it must not know anything about slide layout.
//
// Playwright is an OPTIONAL peer · it downloads a browser, which nobody who
// only shows decks in their own browser should be made to install. It is
// imported on first use and its absence is reported, not swallowed.
// ════════════════════════════════════════════════════════════════

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
};

async function loadChromium() {
  for (const pkg of ['playwright', 'playwright-core', '@playwright/test']) {
    try {
      const mod = await import(pkg);
      if (mod.chromium) return mod.chromium;
    } catch {
      // Try the next one · only the last failure is worth reporting.
    }
  }
  throw new Error(
    'rikiki export needs Playwright, which is an optional peer dependency.\n' +
      '  Install it next to rikiki-deck:  npm i -D playwright && npx playwright install chromium\n' +
      '  (it is optional so that decks which only run in your own browser do not\n' +
      '   have to download one)',
  );
}

/** Serve `rootDir` on an ephemeral port · ES modules need http://, not file://.
 *  Resolves to `{ origin, close }`. */
async function serveDir(rootDir) {
  const server = createServer(async (req, res) => {
    try {
      const rel = decodeURIComponent((req.url ?? '/').split('?')[0]);
      const abs = resolve(rootDir, '.' + rel);
      if (!abs.startsWith(rootDir)) {
        res.writeHead(403).end('forbidden');
        return;
      }
      const info = await stat(abs);
      const file = info.isDirectory() ? join(abs, 'index.html') : abs;
      const body = await readFile(file);
      res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
      res.end(body);
    } catch (cause) {
      res.writeHead(404, { 'content-type': 'text/plain' }).end(`not found: ${req.url}`);
      // Surfaced through the caller's missing-asset check, not silently dropped.
      if (process.env.RIKIKI_DEBUG) console.error('export · 404', req.url, String(cause));
    }
  });
  await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
  const { port } = server.address();
  return {
    origin: `http://127.0.0.1:${port}`,
    close: () => new Promise((ok) => server.close(ok)),
  };
}

/** How far above its own folder a deck reaches.
 *
 *  A served deck points at the framework with `../../dist/index.js`, so serving
 *  only the deck's directory 404s every module and the page never upgrades.
 *  Counting the deepest `../` prefix gives the smallest root that still
 *  contains everything the deck asks for · no wider than necessary. */
export function rootDepthFor(html) {
  let depth = 0;
  for (const m of html.matchAll(/(?:src|href)\s*=\s*["']((?:\.\.\/)+)/g)) {
    depth = Math.max(depth, m[1].split('../').length - 1);
  }
  return depth;
}

/**
 * Render `deckPath` to `outputPath`.
 * @returns {Promise<{pages: number, missing: string[]}>}
 */
export async function exportPdf(deckPath, outputPath, { timeoutMs = 30_000 } = {}) {
  const chromium = await loadChromium();
  const deckDir = resolve(dirname(deckPath));
  const depth = rootDepthFor(readFileSync(deckPath, 'utf8'));
  const rootDir = resolve(deckDir, ...Array(depth).fill('..'));
  const deckUrlPath = relative(rootDir, resolve(deckPath)).split(sep).join('/');
  const server = await serveDir(rootDir);
  const browser = await chromium.launch();
  const missing = [];

  try {
    const page = await browser.newPage();
    page.on('requestfailed', (r) => missing.push(r.url()));
    page.on('response', (r) => {
      if (r.status() >= 400) missing.push(`${r.url()} (HTTP ${r.status()})`);
    });

    await page.goto(`${server.origin}/${deckUrlPath}`, {
      waitUntil: 'load',
      timeout: timeoutMs,
    });
    // The deck must have upgraded and picked a first slide · printing before
    // that yields a blank page with no error.
    await page.waitForFunction(() => !!document.querySelector('deck-root > [active]'), null, {
      timeout: timeoutMs,
    });
    // Fonts and diagrams settle before the snapshot · a diagram still rendering
    // prints as an empty box.
    await page.evaluate(async () => {
      await document.fonts.ready;
      const diagrams = Array.from(document.querySelectorAll('deck-mermaid'));
      await Promise.all(diagrams.map((d) => d.whenRendered ?? Promise.resolve()));
    });

    await page.pdf({
      path: outputPath,
      printBackground: true,
      preferCSSPageSize: true,
      // A bookmark per slide title · without an outline a reader has no way to
      // jump around, and several viewers fall back to a continuous scroll with
      // no page stops at all.
      outline: true,
      // Tagged output carries the reading order and the headings · it is what
      // makes the outline above meaningful, and what a screen reader needs.
      tagged: true,
    });
    const pages = await page.evaluate(
      () =>
        document.querySelectorAll('deck-root > *:not(script):not(style):not(template)').length,
    );
    return { pages, missing };
  } finally {
    await browser.close();
    await server.close();
  }
}
