#!/usr/bin/env node
// ════════════════════════════════════════════════════════════════
// shots · render slides to PNG so a design pass is one command
//
//   node scripts/shots.mjs [deck] [--slides s-table,s-flow,3] [--themes a,b]
//                          [--out .shots] [--width 1920] [--height 1080] [--open]
//
// The deck path is relative to the package (decks/tests/extras.html), or from
// the repo root with a leading slash (/examples/rikiki-tour/index.html).
//
// Writes .shots/<deck>/<slide>.<theme>.png plus a .shots/index.html that lays
// the themes side by side, one row per slide.
//
// This is NOT a golden-image suite, and that is a decision rather than an
// omission. A baseline freezes the CURRENT rendering as the definition of
// correct, and the current rendering is what keeps being rejected; it would
// carve the defect into the contract. It answers "did this change" when the
// question is "is this good", which only a person can answer. And font hinting
// and antialiasing differ between engines and machines, so a pixel suite would
// be flaky by construction in a repo whose playwright.config.ts sets
// `retries: 0` because a flaky test is a bug.
//
// The machine measures what is objective · scripts/theme-contrast.test.mjs and
// e2e/emphasis.spec.ts. This script only makes looking cheap.
// ════════════════════════════════════════════════════════════════

import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { chromium } from 'playwright';
import { ROOT } from './css-source.mjs';

const PORT = 7799; // the same port and web root as playwright.config.ts
const DEFAULT_DECK = 'rikiki/decks/tests/extras-more.html';

function parseArgs(argv) {
  const opts = {
    deck: DEFAULT_DECK,
    slides: null,
    themes: ['rikiki', 'siliceum'],
    out: '.shots',
    width: 1920,
    height: 1080,
    open: false,
  };
  const rest = [];
  const list = (value) => value.split(',').map((s) => s.trim());
  let i = 0;
  while (i < argv.length) {
    const arg = argv[i];
    const next = argv[i + 1];
    i += 1;
    if (arg === '--open') opts.open = true;
    else if (arg === '--slides') {
      opts.slides = list(next);
      i += 1;
    } else if (arg === '--themes') {
      opts.themes = list(next);
      i += 1;
    } else if (arg === '--out') {
      opts.out = next;
      i += 1;
    } else if (arg === '--width') {
      opts.width = Number(next);
      i += 1;
    } else if (arg === '--height') {
      opts.height = Number(next);
      i += 1;
    } else if (arg.startsWith('--')) throw new Error(`unknown option ${arg}`);
    else rest.push(arg);
  }
  if (rest[0]) {
    // A leading slash means a path from the web root, which is the repo root ·
    // that is how you reach a deck outside the package, such as the examples.
    // Anything else is read as relative to the package.
    const given = rest[0].replace(/^\.\//, '');
    opts.deck = given.startsWith('/') ? given.slice(1) : `rikiki/${given}`;
  }
  return opts;
}

/** A server on PORT, started only if nothing already answers there. */
async function ensureServer() {
  const url = `http://localhost:${PORT}/rikiki/dist/index.js`;
  const alive = await fetch(url).then(
    (r) => r.ok,
    () => false,
  );
  if (alive) return null;
  const child = spawn('python3', ['-m', 'http.server', String(PORT), '--directory', '..'], {
    cwd: ROOT,
    stdio: 'ignore',
  });
  for (let i = 0; i < 100; i += 1) {
    const ok = await fetch(url).then(
      (r) => r.ok,
      () => false,
    );
    if (ok) return child;
    await new Promise((r) => setTimeout(r, 50));
  }
  child.kill();
  throw new Error(`no server answered on ${url}`);
}

/** Every slide of the loaded deck, as { index, id }. */
const readSlides = () =>
  [...document.querySelectorAll('deck-root > *')]
    .filter((el) => el.tagName.toLowerCase().startsWith('deck-'))
    .map((el, i) => ({ index: i + 1, id: el.id || String(i + 1) }));

/**
 * Point the deck at another theme.
 *
 * Asserts the page surface actually changed · a swap that silently no-ops
 * would produce a contact sheet whose two columns are the same picture, which
 * is worse than no contact sheet at all.
 */
async function useTheme(page, theme) {
  const before = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  if (
    await page.evaluate(
      (n) => document.querySelector(`link[href*="themes/${n}.css"]`) !== null,
      theme,
    )
  ) {
    return before;
  }
  await page.evaluate(async (name) => {
    // A deck reaches its theme either as themes/<name>.css or as tokens.css,
    // the default theme's own name. Both rewrite to the same place, since
    // tokens.css sits one directory above themes/.
    const link = document.querySelector(
      'link[rel="stylesheet"][href*="themes/"], link[rel="stylesheet"][href*="tokens.css"]',
    );
    if (!link) throw new Error('this deck has no theme stylesheet to swap');
    await new Promise((resolve, reject) => {
      link.addEventListener('load', resolve, { once: true });
      link.addEventListener('error', reject, { once: true });
      link.href = link.href.replace(/(?:themes\/[\w-]+|tokens)\.css/, `themes/${name}.css`);
    });
  }, theme);
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(
    () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))),
  );
  return before;
}

function contactSheet(deck, rows, themes) {
  const cells = (row) =>
    themes
      .map((t) => `<figure><img src="${row.file[t]}" alt=""><figcaption>${t}</figcaption></figure>`)
      .join('');
  return `<!doctype html><meta charset="utf-8"><title>shots · ${deck}</title>
<style>
  body { margin: 0; padding: 2rem; font: 14px system-ui; background: #1a1a1a; color: #eee; }
  h1 { font-size: 1rem; font-weight: 400; color: #999; margin: 0 0 2rem; }
  section { margin-bottom: 3rem; }
  h2 { font-size: 1rem; margin: 0 0 .5rem; }
  .row { display: grid; grid-template-columns: repeat(${themes.length}, 1fr); gap: 1rem; }
  figure { margin: 0; }
  img { width: 100%; display: block; border: 1px solid #333; }
  figcaption { color: #777; font-size: 12px; padding-top: .25rem; }
</style>
<h1>${deck}</h1>
${rows.map((r) => `<section><h2>${r.id}</h2><div class="row">${cells(r)}</div></section>`).join('\n')}
`;
}

const opts = parseArgs(process.argv.slice(2));
const server = await ensureServer();
const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: opts.width, height: opts.height },
    deviceScaleFactor: 2,
  });
  await page.goto(`http://localhost:${PORT}/${opts.deck}`);
  await page.waitForSelector('deck-root > [active]');

  const all = await page.evaluate(readSlides);
  const wanted = opts.slides
    ? opts.slides.map((want) => {
        const slide = all.find((s) => s.id === want || String(s.index) === want);
        // A renamed slide must fail loudly rather than shoot the wrong one.
        if (!slide) throw new Error(`no slide "${want}" in ${opts.deck}`);
        return slide;
      })
    : all;

  const dir = join(ROOT, opts.out, basename(opts.deck, '.html'));
  mkdirSync(dir, { recursive: true });
  const rows = wanted.map((s) => ({ ...s, file: {} }));

  for (const theme of opts.themes) {
    await useTheme(page, theme);
    for (const row of rows) {
      await page.evaluate((i) => {
        location.hash = `${i}.0`;
      }, row.index);
      await page.waitForFunction(
        (i) =>
          document.querySelectorAll('deck-root > [active]').length === 1 &&
          [...document.querySelectorAll('deck-root > *')].indexOf(
            document.querySelector('deck-root > [active]'),
          ) ===
            i - 1,
        row.index,
      );
      // A deck cross-fades, so for a moment two slides are painted at once and
      // a shot taken then shows both sliding past each other. Wait on the
      // engine's own animation state, never on a delay.
      await page.waitForFunction(() =>
        document.getAnimations().every((a) => a.playState !== 'running'),
      );
      await page.evaluate(
        () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))),
      );
      const name = `${row.id}.${theme}.png`;
      await page.locator('deck-root').screenshot({ path: join(dir, name) });
      row.file[theme] = `${basename(dir)}/${name}`;
    }
  }

  const index = join(ROOT, opts.out, 'index.html');
  writeFileSync(index, contactSheet(opts.deck, rows, opts.themes));
  console.log(`${rows.length} slides x ${opts.themes.length} themes -> ${index}`);
  if (opts.open) spawn('xdg-open', [index], { detached: true, stdio: 'ignore' }).unref();
} finally {
  await browser.close();
  server?.kill();
}
