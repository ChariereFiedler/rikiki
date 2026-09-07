// ════════════════════════════════════════════════════════════════
// A slide the engine composed, measured against what it composed
//
// Three slides were rejected in a room for the same three geometric reasons,
// and none of them was an authoring mistake · each is what the defaults do.
//
//   1 · A row gives every cell the height of the tallest one, so the single
//       cell that carries a surface shows a box twice the height of its text.
//   2 · That cell's padding pushes its text inward, so the left reading edge
//       breaks between it and its plain neighbours · which is the one thing
//       ragged-right alignment exists to give you.
//   3 · Cells in a row are independent flows, so a title that wraps to a
//       second line drags its own body text down and no row shares a baseline.
//
// All three are objective: they compare the slide against a promise the layout
// made itself, never against a taste threshold. The fourth question · whether
// the ink sits well on the canvas · IS taste while the engine does not own the
// distribution, so it is reported here and not failed. e2e/ink.spec.ts makes
// the same distinction for the same reason.
// ════════════════════════════════════════════════════════════════

import { expect, test } from '@playwright/test';
import { createDeckPage } from './pages/deck.page';
import { settled } from './support/settle';

const DECK = '/rikiki/decks/tests/balance.html';

/** A box may exceed what it holds by this much before it reads as a hole ·
 *  a few pixels are rounding, a hundred are a defect. */
const SLACK = 24;

/** Two edges within this are the same edge to the eye at projection size. */
const ALIGNED = 1.5;

interface Cell {
  id: string;
  box: { top: number; bottom: number; left: number; height: number };
  /** The union of what the cell actually holds, in viewport pixels. */
  content: { top: number; bottom: number; left: number; height: number } | null;
  /** The top edge of each direct child, in order · a row's baselines. */
  childTops: number[];
  paints: boolean;
}

/** Measure every cell of a slide from the boxes the browser resolved. */
async function readCells(page: import('@playwright/test').Page, slideId: string): Promise<Cell[]> {
  return page.evaluate((id) => {
    const slide = document.querySelector(`#${id}`);
    if (!slide) throw new Error(`no slide #${id} in this deck`);
    const cells = [...slide.querySelectorAll('deck-point, deck-cell')];
    if (cells.length === 0) throw new Error(`#${id} holds nothing to measure`);

    const rect = (el: Element) => {
      const b = el.getBoundingClientRect();
      return { top: b.top, bottom: b.bottom, left: b.left, height: b.height };
    };

    return cells.map((cell) => {
      const children = [...cell.children] as HTMLElement[];
      const boxes = children.map(rect).filter((b) => b.height > 0);
      const style = getComputedStyle(cell);
      const background = style.backgroundColor;
      return {
        id: cell.id,
        box: rect(cell),
        content: boxes.length
          ? {
              top: Math.min(...boxes.map((b) => b.top)),
              bottom: Math.max(...boxes.map((b) => b.bottom)),
              left: Math.min(...boxes.map((b) => b.left)),
              height: Math.max(...boxes.map((b) => b.bottom)) - Math.min(...boxes.map((b) => b.top)),
            }
          : null,
        childTops: boxes.map((b) => b.top),
        // A cell that paints nothing has no mass to be too tall for · its own
        // height is invisible, so only a painted one is held to rule 1.
        paints: background !== 'rgba(0, 0, 0, 0)' && background !== 'transparent',
      };
    });
  }, slideId);
}

test.describe('a row of cells', () => {
  test('gives a painted cell no more height than it holds', async ({ page }) => {
    const deck = createDeckPage(page);
    await deck.goto(`${DECK}#2`);
    await settled(page);

    const cells = await readCells(page, 'stretched');
    const painted = cells.filter((c) => c.paints);
    expect(
      painted.length,
      'no cell in this row paints a surface · the rule has nothing to bite on',
    ).toBeGreaterThan(0);

    for (const cell of painted) {
      expect(cell.content, `${cell.id} paints a surface around nothing`).not.toBeNull();
      const padding = await page.evaluate((id) => {
        const style = getComputedStyle(document.querySelector(`#${id}`)!);
        return Number.parseFloat(style.paddingTop) + Number.parseFloat(style.paddingBottom);
      }, cell.id);
      const slack = cell.box.height - cell.content!.height - padding;
      expect(
        slack,
        `${cell.id} is ${Math.round(slack)}px taller than its content and its padding · ` +
          'the row stretched it, and the surface makes the hole visible',
      ).toBeLessThan(SLACK);
    }
  });

  test('keeps one reading edge across painted and plain cells', async ({ page }) => {
    const deck = createDeckPage(page);
    await deck.goto(`${DECK}#2`);
    await settled(page);

    const cells = await readCells(page, 'stretched');
    // The edge is measured against the cell box, so a cell that insets its text
    // shows up as a non-zero offset whatever its neighbours do.
    const offsets = cells.map((c) => ({
      id: c.id,
      offset: c.content ? c.content.left - c.box.left : Number.NaN,
    }));
    const spread = Math.max(...offsets.map((o) => o.offset)) - Math.min(...offsets.map((o) => o.offset));
    expect(
      spread,
      `the text of these cells starts at different insets (${offsets
        .map((o) => `${o.id} ${Math.round(o.offset)}px`)
        .join(', ')}) · a box that pads its text off the edge its neighbours share ` +
        'removes the vertical scanning edge left alignment exists for',
    ).toBeLessThan(ALIGNED);
  });

  test('shares a baseline per row, whatever a title wraps to', async ({ page }) => {
    const deck = createDeckPage(page);
    await deck.goto(`${DECK}#3`);
    await settled(page);

    const cells = await readCells(page, 'ragged');
    const depth = Math.min(...cells.map((c) => c.childTops.length));
    expect(depth, 'these cells hold nothing to line up').toBeGreaterThan(1);

    for (let row = 0; row < depth; row += 1) {
      const tops = cells.map((c) => ({ id: c.id, top: c.childTops[row]! }));
      const spread = Math.max(...tops.map((t) => t.top)) - Math.min(...tops.map((t) => t.top));
      expect(
        spread,
        `row ${row + 1} of these cells starts at different heights (${tops
          .map((t) => `${t.id} ${Math.round(t.top)}px`)
          .join(', ')}) · a title that wraps to a second line must not drag its ` +
          'own body text below its neighbours',
      ).toBeLessThan(ALIGNED);
    }
  });
});
