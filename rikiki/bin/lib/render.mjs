// ════════════════════════════════════════════════════════════════
// rikiki render · one picture per slide, plus a manifest and a gallery.
//
// An agent cannot see a deck. This turns one into files it can look at, and
// into a manifest that ties each picture back to the slide it came from, so a
// finding about "the third picture" can become an edit to a known element.
// ════════════════════════════════════════════════════════════════

import { mkdirSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { ExpectedError } from './cli-error.mjs';
import { SLIDE_TITLE_READER, advanceStep, goToSlide, withDeck } from './browser.mjs';
import { diffRender } from './diff.mjs';

export const MANIFEST_SCHEMA = 1;

/** A file name from a slide id · never a path, never a surprise.
 *  `../../etc/passwd` and `Chapitre 2 · Détails` both have to land in one
 *  predictable file inside the output directory. */
export function safeName(index, id) {
  const slug = String(id ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
  return `${String(index).padStart(2, '0')}${slug ? '-' + slug : ''}`;
}

/** Read what the deck says about itself · one entry per slide, in order. */
const readOutline = (titleReader) => {
  const titleOf = new Function('return ' + titleReader)();
  const root = document.querySelector('deck-root');
  if (!root) return [];
  return Array.from(root.children)
    .filter((el) => el.tagName.toLowerCase().startsWith('deck-'))
    .map((el, i) => ({
      index: i + 1,
      id: el.id || null,
      tag: el.tagName.toLowerCase(),
      title: titleOf(el),
    }));
};

/** Resolve `--slides 2,intro,4` against the outline · order follows the deck,
 *  and an unknown name is an error rather than a silently missing picture. */
export function selectSlides(outline, selector) {
  if (!selector) return outline;
  const wanted = selector
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const chosen = new Map();
  const unknown = [];
  for (const token of wanted) {
    const byNumber = /^\d+$/.test(token) ? outline.find((s) => s.index === Number(token)) : null;
    const byId = outline.find((s) => s.id === token);
    const slide = byNumber ?? byId;
    if (slide) chosen.set(slide.index, slide);
    else unknown.push(token);
  }
  if (unknown.length) {
    const known = outline
      .map((s) => (s.id ? `${s.index} (${s.id})` : String(s.index)))
      .join(', ');
    throw new ExpectedError(
      `render · no slide matches ${unknown.map((u) => `"${u}"`).join(', ')}\n` +
        `  this deck has: ${known}`,
    );
  }
  return [...chosen.values()].sort((a, b) => a.index - b.index);
}

/** The gallery is a rikiki-free page on purpose · it has to open from a file
 *  manager, offline, with nothing installed. */
function galleryHtml(deckName, canvas, shots) {
  const cards = shots
    .map(
      (s) => `  <figure>
    <img src="${s.file}" alt="${escapeHtml(s.title ?? s.tag)}" width="${canvas.width}" height="${canvas.height}">
    <figcaption><b>${s.index}${s.step ? '.' + s.step : ''}</b> ${escapeHtml(s.title ?? s.tag)}${s.id ? ` <code>#${escapeHtml(s.id)}</code>` : ''}</figcaption>
  </figure>`,
    )
    .join('\n');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(deckName)} · ${shots.length} shots</title>
<style>
  :root { color-scheme: light dark; }
  body { margin: 0; padding: 2rem; font: 15px/1.5 system-ui, sans-serif; background: Canvas; color: CanvasText; }
  h1 { font-size: 1.2rem; margin: 0 0 1.5rem; }
  .grid { display: grid; gap: 1.5rem; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); }
  figure { margin: 0; }
  img { width: 100%; height: auto; display: block; border: 1px solid color-mix(in srgb, CanvasText 20%, transparent); }
  figcaption { margin-top: .4rem; font-size: .85rem; }
  code { font-size: .8rem; opacity: .7; }
</style>
</head>
<body>
<h1>${escapeHtml(deckName)} · ${shots.length} shots · ${canvas.width}×${canvas.height}</h1>
<div class="grid">
${cards}
</div>
</body>
</html>
`;
}

const escapeHtml = (s) =>
  String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

/**
 * Photograph a deck.
 *
 * @param {string} deckPath
 * @param {object} options
 * @param {string} options.outDir       where the pictures go
 * @param {string} [options.slides]     `2,intro,4` · every slide when absent
 * @param {boolean} [options.steps]     also capture each revealed state
 * @param {number} [options.width]      canvas width in CSS pixels
 * @param {number} [options.height]     canvas height
 * @param {string} [options.baseline]   earlier captures to compare this render against
 * @param {number} [options.threshold]  percent of pixels · at or above is `changed`
 * @returns {Promise<{manifest: object, manifestPath: string, galleryPath: string, diff?: object, diffPath?: string}>}
 */
export async function renderDeck(
  deckPath,
  { outDir, slides, steps = false, width = 1920, height = 1080, baseline, threshold } = {},
) {
  const canvas = { width, height };
  return withDeck(
    deckPath,
    async ({ page, browser, settled, missing, errors }) => {
      if (!settled) {
        throw new ExpectedError(
          `render · ${basename(deckPath)} never showed a slide.\n` +
            (errors.length ? `  the page reported: ${errors[0]}\n` : '') +
            (missing.length ? `  it could not load: ${missing[0]}\n` : '') +
            '  run `rikiki check` on it for the full picture.',
        );
      }

      const outline = await page.evaluate(readOutline, SLIDE_TITLE_READER);
      const chosen = selectSlides(outline, slides);
      mkdirSync(outDir, { recursive: true });

      const shots = [];
      for (const slide of chosen) {
        await goToSlide(page, slide.index);
        let step = 0;
        for (;;) {
          const name = `${safeName(slide.index, slide.id ?? slide.tag.replace(/^deck-/, ''))}${step ? `-s${step}` : ''}.png`;
          await page.screenshot({ path: join(outDir, name) });
          shots.push({ ...slide, step, file: name });
          if (!steps || !(await advanceStep(page))) break;
          step = await page.evaluate(() => document.querySelector('deck-root').step);
        }
      }

      const manifest = {
        schema: MANIFEST_SCHEMA,
        deck: basename(deckPath),
        canvas,
        slideCount: outline.length,
        captured: shots.length,
        // Said out loud: without --steps a stepped slide is photographed in its
        // opening state, which is often the emptiest one it has.
        stepsCaptured: steps,
        missing: [...new Set(missing)],
        errors: [...new Set(errors)],
        shots,
      };
      const manifestPath = join(outDir, 'manifest.json');
      const galleryPath = join(outDir, 'index.html');
      writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
      writeFileSync(galleryPath, galleryHtml(basename(deckPath), canvas, shots));
      if (!baseline) return { manifest, manifestPath, galleryPath };

      // The comparison rides the browser that just took the pictures · a
      // second launch to read two PNGs would cost more than the diff itself.
      const { report, diffPath } = await diffRender({
        browser,
        outDir,
        baselineDir: baseline,
        threshold,
        shots,
      });
      return { manifest, manifestPath, galleryPath, diff: report, diffPath };
    },
    { viewport: canvas },
  );
}
