import { expect, test } from '@playwright/test';
import { createDeckPage } from './pages/deck.page';

// deck-graph · the primitive behind every boxes-and-arrows slide. What matters
// is that the LINES actually paint, that they connect the nodes the author
// named, and that the author's percentages are what places everything.
const DECK = '/rikiki/decks/tests/extras-more.html';

/** Open the slide that CONTAINS an element, by id · a deep link by number
 *  breaks the moment a slide is inserted before it, which it just did. */
async function gotoSlideWith(page: import('@playwright/test').Page, id: string) {
  const deck = createDeckPage(page);
  await deck.goto(DECK);
  const index = await page.evaluate((target) => {
    const slides = [...document.querySelectorAll('deck-root > *')];
    return slides.findIndex((s) => s.querySelector(`#${CSS.escape(target)}`)) + 1;
  }, id);
  expect(index, `no slide contains #${id}`).toBeGreaterThan(0);
  await page.goto(`${DECK}#${index}`);
  await expect(page.locator('deck-root > [active]')).toHaveCount(1);
  await page.evaluate(
    () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))),
  );
}

/** Painted edge segments, in element pixels. */
async function edges(page: import('@playwright/test').Page, id: string) {
  return page.evaluate((graphId) => {
    const shadow = document.getElementById(graphId)!.shadowRoot!;
    return [...shadow.querySelectorAll('line')].map((l) => ({
      x1: Number(l.getAttribute('x1')),
      y1: Number(l.getAttribute('y1')),
      x2: Number(l.getAttribute('x2')),
      y2: Number(l.getAttribute('y2')),
      // Zero means the element was created in the wrong namespace and paints
      // nothing while still reporting correct coordinates.
      painted: l.getBoundingClientRect().width > 0 || l.getBoundingClientRect().height > 0,
      dashed: l.hasAttribute('data-dashed'),
    }));
  }, id);
}

test('every edge is a painted SVG line, not an unknown element', async ({ page }) => {
  await gotoSlideWith(page, 'gr');

  const drawn = await edges(page, 'gr');
  expect(drawn, 'one line per deck-edge').toHaveLength(4);
  expect(
    drawn.every((e) => e.painted),
    'a nested html`` fragment would give unknown elements that never paint',
  ).toBe(true);
});

test('an edge connects the two nodes it names', async ({ page }) => {
  await gotoSlideWith(page, 'gr');

  const geometry = await page.evaluate(() => {
    const graph = document.getElementById('gr')!;
    const box = graph.getBoundingClientRect();
    const centre = (id: string) => {
      const r = document.getElementById(id)!.getBoundingClientRect();
      return { x: r.left + r.width / 2 - box.left, y: r.top + r.height / 2 - box.top };
    };
    const line = graph.shadowRoot!.querySelector('line')!;
    return {
      from: centre('n-client'),
      to: centre('n-edge'),
      target: (() => {
        const r = document.getElementById('n-edge')!.getBoundingClientRect();
        return { left: r.left - box.left, right: r.right - box.left };
      })(),
      line: {
        x1: Number(line.getAttribute('x1')),
        x2: Number(line.getAttribute('x2')),
        y1: Number(line.getAttribute('y1')),
        markerEnd: line.getAttribute('marker-end'),
      },
    };
  });

  // The segment runs between the two nodes, shortened at both ends so it does
  // not strike through their labels.
  expect(geometry.line.x1).toBeGreaterThan(geometry.from.x);
  expect(geometry.line.x2).toBeLessThan(geometry.to.x);
  expect(geometry.line.x2, 'arrow tip meets the target boundary instead of hiding below it')
    .toBeCloseTo(geometry.target.left, 0);
  expect(geometry.line.markerEnd).toBe('url(#arrow)');
  expect(Math.abs(geometry.line.y1 - geometry.from.y)).toBeLessThan(30);
});

test('an orthogonal edge and label offset are author controlled', async ({ page }) => {
  await gotoSlideWith(page, 'gr');
  const result = await page.evaluate(async () => {
    const graph = document.getElementById('gr')!;
    const edge = graph.querySelector('deck-edge')!;
    edge.setAttribute('route', 'ortho');
    edge.setAttribute('label-offset', '0,-18');
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const path = graph.shadowRoot!.querySelector('path.edge');
    const label = graph.shadowRoot!.querySelector<HTMLElement>('.edge-label');
    return {
      route: path?.getAttribute('data-route'),
      path: path?.getAttribute('d'),
      labelTop: label?.style.top,
    };
  });
  expect(result.route).toBe('ortho');
  expect(result.path).toMatch(/H .* V .* H/);
  expect(result.labelTop).toMatch(/px$/);
});

test('a node accepts an explicit CSS width', async ({ page }) => {
  await gotoSlideWith(page, 'gr');
  const width = await page.evaluate(async () => {
    const node = document.getElementById('n-client')!;
    node.setAttribute('width', '240px');
    await (node as any).updateComplete;
    return Math.round((node as HTMLElement).offsetWidth);
  });
  expect(width).toBe(240);
});

test('a dashed edge is dashed, and only that one', async ({ page }) => {
  await gotoSlideWith(page, 'gr');
  const drawn = await edges(page, 'gr');
  expect(drawn.filter((e) => e.dashed)).toHaveLength(1);
});

test('the author percentages place the nodes', async ({ page }) => {
  await gotoSlideWith(page, 'gr');

  const placed = await page.evaluate(() => {
    const graph = document.getElementById('gr')!;
    const box = graph.getBoundingClientRect();
    const node = document.getElementById('n-client')!.getBoundingClientRect();
    return Math.round(((node.left + node.width / 2 - box.left) / box.width) * 100);
  });
  // at="8,50"
  expect(placed).toBeGreaterThan(5);
  expect(placed).toBeLessThan(11);
});

test('the row layout spaces the nodes evenly and ignores any stale position', async ({ page }) => {
  await gotoSlideWith(page, 'gr-row');

  const xs = await page.evaluate(() => {
    const graph = document.getElementById('gr-row')!;
    const box = graph.getBoundingClientRect();
    return ['c1', 'c2', 'c3', 'c4'].map((id) => {
      const r = document.getElementById(id)!.getBoundingClientRect();
      return Math.round(((r.left + r.width / 2 - box.left) / box.width) * 100);
    });
  });

  expect(xs, 'four nodes, evenly spaced, ends kept off the edge').toEqual([12, 37, 63, 88]);
});

test('walking the graph emphasises rather than hides', async ({ page }) => {
  // Step 0 must show the whole diagram · the shape of the architecture is half
  // the message, and hiding it behind five clicks tells the room nothing.
  await gotoSlideWith(page, 'gr');

  const pending = () =>
    page.evaluate(
      () => document.querySelectorAll('#gr deck-node[pending]').length,
    );
  expect(await pending(), 'nothing is pending before the walk starts').toBe(0);

  await page.keyboard.press('ArrowRight');
  await expect.poll(pending).toBeGreaterThan(0);
  await expect(page.locator('#gr deck-node[active]')).toHaveCount(1);
});
