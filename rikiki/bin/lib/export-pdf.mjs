// ════════════════════════════════════════════════════════════════
// rikiki export · render a deck to PDF, one slide per page.
//
// The page geometry, the page breaks and the backgrounds all come from the
// deck's own print stylesheet (see slideShell in shared styles and the @page
// rule deck-root writes from its canvas). This module only asks for the PDF:
// the browser, the server and the settling live in browser.mjs, which render
// and check share with it.
// ════════════════════════════════════════════════════════════════

import { PAGE_LOAD_TIMEOUT_MS, waitForStillFrame, withDeck } from './browser.mjs';

export { rootDepthFor } from './browser.mjs';

/** Page objects in a PDF written by Chrome, which keeps them out of object
 *  streams · `/Type /Pages` (the tree) and `/Count` on the outline are not pages. */
export function pdfPageCount(buffer) {
  return buffer.toString('latin1').match(/\/Type\s*\/Page(?![s\w])/g)?.length ?? 0;
}

/**
 * Lay the deck out as paper before the PDF is taken.
 *
 * Components that measure themselves (graph edges, annotation marks) only draw
 * once the layout they measure exists, and a slide never shown on screen has
 * none. page.pdf() switches to print media and snapshots in the same breath, so
 * their ResizeObservers never ran: every diagram printed without its arrows.
 * Switching first and letting frames pass gives them that layout.
 */
export async function preparePrint(page) {
  await page.emulateMedia({ media: 'print' });
  await waitForStillFrame(page);
}

/**
 * Render `deckPath` to `outputPath`.
 * @returns {Promise<{pages: number, slides: number, missing: string[]}>}
 *   `pages` is read from the PDF itself, so a slide lost on paper shows up as
 *   `pages < slides` instead of being reported as printed.
 */
export async function exportPdf(deckPath, outputPath, { timeoutMs = PAGE_LOAD_TIMEOUT_MS } = {}) {
  return withDeck(
    deckPath,
    async ({ page, missing }) => {
      await preparePrint(page);
      const pdf = await page.pdf({
        path: outputPath,
        printBackground: true,
        preferCSSPageSize: true,
        // A bookmark per slide title · without an outline a reader has no way
        // to jump around, and several viewers fall back to a continuous scroll
        // with no page stops at all.
        outline: true,
        // Tagged output carries the reading order and the headings · it is what
        // makes the outline above meaningful, and what a screen reader needs.
        tagged: true,
      });
      const slides = await page.evaluate(
        () => document.querySelectorAll('deck-root > *:not(script):not(style):not(template)').length,
      );
      return { pages: pdfPageCount(pdf), slides, missing };
    },
    { timeoutMs },
  );
}
