// ════════════════════════════════════════════════════════════════
// The browser rikiki drives, and the server it drives it against.
//
// `export`, `render` and `check` all need the same five things: a Playwright
// that is loaded only when used, a local server on a free port, a deck settled
// enough to look at, the errors the page reported along the way, and both
// resources closed whatever happens. This module owns all five so the commands
// own none of them.
// ════════════════════════════════════════════════════════════════

import { readFile, stat } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';
import { ExpectedError } from './cli-error.mjs';

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
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
};

/** Playwright is an optional peer · loaded on first use, never at import. */
export async function loadChromium() {
  for (const pkg of ['playwright', 'playwright-core', '@playwright/test']) {
    try {
      const mod = await import(pkg);
      if (mod.chromium) return mod.chromium;
    } catch {
      // Try the next one · only the last failure is worth reporting.
    }
  }
  throw new ExpectedError(
    'this command needs Playwright, which is an optional peer dependency.\n' +
      '  Install it next to rikiki-deck:  npm i -D playwright && npx playwright install chromium\n' +
      '  (it is optional so that decks which only run in your own browser do not\n' +
      '   have to download one)',
  );
}

/** True when `abs` is inside `root` · `/srv/deck` must not admit `/srv/deck-x`.
 *  Exported because a path check nobody can test is a path check nobody trusts. */
export function isInside(root, abs) {
  return abs === root || abs.startsWith(root.endsWith(sep) ? root : root + sep);
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

/** Serve `rootDir` on an ephemeral port · ES modules need http://, not file://.
 *  Resolves to `{ origin, close }`. */
export async function serveDir(rootDir) {
  const root = resolve(rootDir);
  const server = createServer(async (req, res) => {
    let abs;
    try {
      const rel = decodeURIComponent((req.url ?? '/').split('?')[0]);
      abs = resolve(root, '.' + rel);
    } catch {
      // A malformed percent-escape is a bad request, not a missing file.
      res.writeHead(400, { 'content-type': 'text/plain' }).end('bad request');
      return;
    }
    if (!isInside(root, abs)) {
      res.writeHead(403, { 'content-type': 'text/plain' }).end('forbidden');
      return;
    }
    try {
      const info = await stat(abs);
      const file = info.isDirectory() ? join(abs, 'index.html') : abs;
      const body = await readFile(file);
      res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
      res.end(body);
    } catch (cause) {
      res.writeHead(404, { 'content-type': 'text/plain' }).end(`not found: ${req.url}`);
      // Reported to the caller through the page's own failed requests, never
      // swallowed here.
      if (process.env.RIKIKI_DEBUG) console.error('rikiki · 404', req.url, String(cause));
    }
  });
  await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
  const { port } = server.address();
  return {
    origin: `http://127.0.0.1:${port}`,
    close: () => new Promise((ok) => server.close(ok)),
  };
}

/** The URL a deck file takes once its smallest containing root is served. */
export function deckLocation(deckPath) {
  const abs = resolve(deckPath);
  const depth = rootDepthFor(readFileSync(abs, 'utf8'));
  const rootDir = resolve(dirname(abs), ...Array(depth).fill('..'));
  return { rootDir, urlPath: relative(rootDir, abs).split(sep).join('/') };
}

/** The title of a slide, as a line of text.
 *
 *  Runs in the page. `textContent` alone joins across a `<br>`, which is how a
 *  two-line title became "Clickstages" in a manifest whose whole job is to name
 *  the slide you are looking at. */
export const SLIDE_TITLE_READER = `(el) => {
  const source = el.querySelector('h1, [slot="title"]');
  if (!source) return null;
  const copy = source.cloneNode(true);
  for (const br of copy.querySelectorAll('br')) br.replaceWith(' ');
  return copy.textContent.trim().replace(/\\s+/g, ' ') || null;
}`;

/** Wait until nothing is moving any more.
 *
 *  A reveal is a CSS transition, and a screenshot taken while it runs catches
 *  the text mid-fade. The Web Animations API knows when each one is done, so
 *  the wait is on the animations themselves; the deadline is only there for an
 *  animation that never ends (a looping accent, a spinner). */
export async function waitForStillFrame(page, deadlineMs = 2_000) {
  await page
    .evaluate(async (ms) => {
      const ending = document
        .getAnimations()
        .filter((a) => a.effect?.getComputedTiming?.().iterations !== Number.POSITIVE_INFINITY)
        .map((a) => a.finished.catch(() => {}));
      await Promise.race([
        Promise.all(ending),
        new Promise((done) => setTimeout(done, ms)),
      ]);
      // One painted frame after the last change · the screenshot reads what the
      // eye would see, not the state the compositor is still catching up with.
      await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
    }, deadlineMs)
    .catch(() => {});
}

/** How long a slide change may take before the walk gives up on it. A deck
 *  switches slides in milliseconds; the margin is for a loaded machine (a
 *  single-core CI runner took over 5 s once), not for the deck. */
export const NAVIGATION_TIMEOUT_MS = 15_000;

/** Go to slide `index` (1-based) and report the state actually reached.
 *  Shared by `render` and `check` · both walk a deck the same way. */
export async function goToSlide(page, index) {
  await page.evaluate((i) => {
    window.location.hash = `#${i}`;
  }, index);
  await page.waitForFunction(
    (i) => document.querySelector('deck-root')?.current === i - 1,
    index,
    { timeout: NAVIGATION_TIMEOUT_MS },
  );
  await page.evaluate(() => document.fonts.ready);
  await waitForStillFrame(page);
}

/** Advance one step inside the current slide · false when there is none left
 *  (either the last state of the deck, or the step moved on to the next
 *  slide). */
export async function advanceStep(page) {
  const before = await page.evaluate(() => {
    const root = document.querySelector('deck-root');
    return { slide: root.current, step: root.step };
  });
  await page.keyboard.press('ArrowRight');
  try {
    await page.waitForFunction(
      (b) => {
        const root = document.querySelector('deck-root');
        return root.current !== b.slide || root.step !== b.step;
      },
      before,
      { timeout: 2_000 },
    );
  } catch {
    return false; // the deck did not move · this was the last state
  }
  await waitForStillFrame(page);
  const after = await page.evaluate(() => {
    const root = document.querySelector('deck-root');
    return { slide: root.current, step: root.step };
  });
  return after.slide === before.slide;
}

/** Wait for the deck to be worth looking at: upgraded, on a slide, fonts and
 *  diagrams settled. Returns false when it never got there. */
async function settle(page, timeoutMs) {
  try {
    await page.waitForFunction(() => !!document.querySelector('deck-root > [active]'), null, {
      timeout: timeoutMs,
    });
  } catch {
    return false;
  }
  // A diagram still rendering photographs as an empty box, and a font still
  // loading shifts every line · both are worth the wait, neither is worth
  // failing over.
  await page
    .evaluate(async () => {
      await document.fonts.ready;
      const diagrams = Array.from(document.querySelectorAll('deck-mermaid'));
      await Promise.all(diagrams.map((d) => d.whenRendered ?? Promise.resolve()));
    })
    .catch(() => {});
  await waitForStillFrame(page);
  return true;
}

/**
 * Open a deck in a real browser and hand it to `fn`.
 *
 * `fn` receives `{ page, browser, origin, url, settled, missing, errors }`, where
 * `missing` lists the requests the page could not load and `errors` the
 * exceptions it threw. The browser and the server are closed on the way out,
 * including when `fn` throws.
 *
 * @returns {Promise<*>} whatever `fn` returns.
 */
export async function withDeck(deckPath, fn, { timeoutMs = 30_000, viewport } = {}) {
  const chromium = await loadChromium();
  const { rootDir, urlPath } = deckLocation(deckPath);
  const server = await serveDir(rootDir);
  const browser = await chromium.launch();
  const missing = [];
  const errors = [];

  try {
    const page = await browser.newPage(viewport ? { viewport } : {});
    page.on('requestfailed', (r) => missing.push(r.url()));
    page.on('response', (r) => {
      if (r.status() >= 400) missing.push(`${r.url()} (HTTP ${r.status()})`);
    });
    page.on('pageerror', (e) => errors.push(e instanceof Error ? e.message : String(e)));

    const url = `${server.origin}/${urlPath}`;
    let loaded = true;
    try {
      await page.goto(url, { waitUntil: 'load', timeout: timeoutMs });
    } catch (e) {
      // A deck that will not even load is a result to report, not a crash: the
      // caller turns it into a diagnostic.
      loaded = false;
      errors.push(e instanceof Error ? e.message : String(e));
    }
    const settled = loaded && (await settle(page, timeoutMs));
    return await fn({ page, browser, origin: server.origin, url, settled, missing, errors });
  } finally {
    await browser.close().catch(() => {});
    await server.close().catch(() => {});
  }
}
