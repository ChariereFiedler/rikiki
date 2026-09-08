// ════════════════════════════════════════════════════════════════
// rikiki export · render a deck to PDF, one slide per page.
//
// The page geometry, the page breaks and the backgrounds all come from the
// deck's own print stylesheet (see slideShell in shared styles and the @page
// rule deck-root writes from its canvas). This module only asks for the PDF:
// the browser, the server and the settling live in browser.mjs, which render
// and check share with it.
// ════════════════════════════════════════════════════════════════

import { withDeck } from './browser.mjs';

export { rootDepthFor } from './browser.mjs';

/**
 * Render `deckPath` to `outputPath`.
 * @returns {Promise<{pages: number, missing: string[]}>}
 */
export async function exportPdf(deckPath, outputPath, { timeoutMs = 30_000 } = {}) {
  return withDeck(
    deckPath,
    async ({ page, missing }) => {
      await page.pdf({
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
      const pages = await page.evaluate(
        () => document.querySelectorAll('deck-root > *:not(script):not(style):not(template)').length,
      );
      return { pages, missing };
    },
    { timeoutMs },
  );
}
