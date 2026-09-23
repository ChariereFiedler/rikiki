import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { expect, test } from '@playwright/test';

// The standalone contract · "one file, opens from a USB stick, works in 2031".
//
// Every bundle is written OUTSIDE the repository and opened over file://, so a
// deck that still reaches for `./vendor/…` cannot accidentally find it next to
// the source. The proof is the request log: a self-contained deck issues one
// request, for itself.

const PKG_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
let workDir: string;

test.beforeAll(() => {
  workDir = mkdtempSync(join(tmpdir(), 'rikiki-bundle-'));
});

test.afterAll(() => {
  rmSync(workDir, { recursive: true, force: true });
});

function bundle(deck: string, out: string, ...flags: string[]): string {
  const target = join(workDir, out);
  execFileSync(process.execPath, ['bin/rikiki.mjs', 'bundle', deck, target, ...flags], {
    cwd: PKG_DIR,
    encoding: 'utf8',
    stdio: 'pipe',
    maxBuffer: 64 * 1024 * 1024,
  });
  return target;
}

/** Open a bundle over file:// and return every URL it asked for. */
async function requestsFor(page: import('@playwright/test').Page, file: string) {
  const requested: string[] = [];
  const failed: string[] = [];
  page.on('request', (r) => requested.push(r.url()));
  page.on('requestfailed', (r) => failed.push(r.url()));
  const url = pathToFileURL(file).href;
  await page.goto(url);
  await expect(page.locator('deck-root:not([data-overview-snapshot])')).toBeAttached();
  await expect(page.locator('deck-root:not([data-overview-snapshot]) > [active]')).toHaveCount(1);
  return { requested: requested.filter((u) => u !== url), failed, url };
}

test('a bundled deck with no heavy plugin fetches nothing', async ({ page }) => {
  const file = bundle('decks/tests/bento.html', 'bento.html');
  const { requested, failed } = await requestsFor(page, file);

  expect(failed, `no request may fail · ${failed.join(', ')}`).toEqual([]);
  expect(requested, 'a self-contained deck requests nothing beyond itself').toEqual([]);
});

test('bundling a mermaid deck without --with-mermaid fails loudly', async () => {
  // The old behaviour: exit 0, and an empty diagram for the reader offline.
  let code = 0;
  let stderr = '';
  try {
    execFileSync(
      process.execPath,
      ['bin/rikiki.mjs', 'bundle', 'decks/tests/demo.html', join(workDir, 'demo-bad.html')],
      { cwd: PKG_DIR, encoding: 'utf8', stdio: 'pipe', maxBuffer: 64 * 1024 * 1024 },
    );
  } catch (e) {
    const err = e as { status: number; stderr: string };
    code = err.status;
    stderr = err.stderr;
  }
  expect(code, 'a deck that would 404 offline must not exit 0').toBe(1);
  expect(stderr).toContain('NOT self-contained');
  expect(stderr).toContain('vendor/mermaid.min.js');
  expect(stderr).toContain('--with-mermaid');
});

test('a bundled mermaid deck renders its diagram offline', async ({ page }) => {
  const file = bundle('decks/tests/demo.html', 'demo.html', '--with-mermaid');
  const { requested, failed } = await requestsFor(page, file);

  expect(failed, `no request may fail · ${failed.join(', ')}`).toEqual([]);
  expect(requested, 'the mermaid runtime must be inside the file').toEqual([]);

  // The diagram is really drawn, not just absent from the network log.
  const svg = await page.evaluate(async () => {
    const el = document.querySelector('deck-mermaid') as unknown as {
      whenRendered: Promise<void>;
      renderedSvg: string;
    } | null;
    if (!el) return null;
    await el.whenRendered;
    return el.renderedSvg;
  });
  expect(svg, 'the deck has a mermaid diagram').not.toBeNull();
  expect(svg, 'the diagram rendered to SVG rather than an error box').toContain('<svg');
});

test('a bundled shiki deck highlights offline', async ({ page }) => {
  const file = bundle('decks/tests/shiki.html', 'shiki.html', '--with-shiki');
  const { requested, failed } = await requestsFor(page, file);

  expect(failed, `no request may fail · ${failed.join(', ')}`).toEqual([]);
  expect(requested, 'the Shiki highlighter must be inside the file').toEqual([]);
});

test('a bundled deck keeps its opt-in components and renders them offline', async ({ page }) => {
  // The extras are separate modules loaded by their own <script> · the bundler
  // must fold them in like any other, or a standalone deck loses them silently.
  const file = bundle('decks/tests/extras.html', 'extras.html');
  const { requested, failed } = await requestsFor(page, file);

  expect(failed, `no request may fail · ${failed.join(', ')}`).toEqual([]);
  expect(requested, 'nothing is fetched at runtime').toEqual([]);

  const registered = await page.evaluate(() => ({
    bar: customElements.get('deck-bar') !== undefined,
    quote: customElements.get('deck-quote') !== undefined,
  }));
  expect(registered.bar, 'deck-bar survived the bundle').toBe(true);
  expect(registered.quote, 'deck-quote survived the bundle').toBe(true);

  // And it actually drew something, not just registered.
  const drawn = await page.evaluate(
    () => document.getElementById('bar-part')?.shadowRoot?.querySelectorAll('.seg').length ?? 0,
  );
  expect(drawn).toBe(1);
});

test('a bundled deck carries the components its components render', async ({ page }) => {
  // deck-figure renders <deck-source> for its credit line, and figure.html
  // never writes that tag. The curated bundle is built from the tags in the
  // DECK, so deck-source used to be left out: the credit line still showed
  // its text (it is slotted) but as an unregistered element, unstyled and
  // without its shadow root. Nothing caught it · the text was identical, and
  // `rikiki check` only walks the light DOM.
  const file = bundle('decks/tests/figure.html', 'figure.html');
  const { failed } = await requestsFor(page, file);
  expect(failed, `no request may fail · ${failed.join(', ')}`).toEqual([]);

  const rendered = await page.evaluate(() => {
    const figure = document.querySelector('deck-figure');
    const source = figure?.shadowRoot?.querySelector('deck-source');
    return {
      defined: customElements.get('deck-source') !== undefined,
      upgraded: !!source?.shadowRoot,
    };
  });
  expect(rendered.defined, 'deck-source is registered in the bundle').toBe(true);
  expect(rendered.upgraded, 'deck-figure’s credit line is drawn by the component').toBe(true);
});
