import { expect, test } from '@playwright/test';
import { createDeckPage } from './pages/deck.page';

// deck-graph · the primitive behind every boxes-and-arrows slide. What matters
// is that the LINES actually paint, that they connect the nodes the author
// named, and that the author's percentages are what places everything.
const DECK = '/rikiki/decks/tests/extras-more.html';

test.beforeEach(async ({ page }) => {
  // Geometry tests must not wait for the theme's optional remote fonts.
  await page.route('https://fonts.googleapis.com/**', (route) =>
    route.fulfill({ contentType: 'text/css', body: '' }),
  );
});

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
  await expect(page.locator('deck-root:not([data-overview-snapshot]) > [active]')).toHaveCount(1);
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
  // Four points: out of the source, across, down, into the target.
  expect(result.path).toMatch(/^M [-\d.]+ [-\d.]+( L [-\d.]+ [-\d.]+){3}$/);
  // Percent of the box plus the author's pixel offset.
  // Browsers serialise `+ -18px` as `- 18px`.
  expect(result.labelTop).toMatch(/^calc\([\d.]+% - 18px\)$/);
});

// Regression: on a screen that is not exactly the canvas size (reported in
// Firefox at 2317 px wide), edge captions drifted by the deck's scale factor
// onto the node on their left and were painted UNDER it. Captions are now
// placed in percent of the measured box, on the painted segment, above nodes.
test('an edge caption wider than the gap stays on top of the nodes', async ({ page }) => {
  await gotoSlideWith(page, 'gr-row');
  const probe = await page.evaluate(async () => {
    const graph = document.getElementById('gr-row')!;
    for (const id of ['c1', 'c2']) {
      const node = document.getElementById(id)!;
      node.setAttribute('boxed', '');
      // Wide enough to leave a narrow gap, not so wide that the nodes overlap.
      node.setAttribute('width', '15rem');
    }
    graph.querySelector('deck-edge')!.setAttribute('label', 'a caption far wider than the gap');
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const label = graph.shadowRoot!.querySelector<HTMLElement>('.edge-label')!;
    const l = label.getBoundingClientRect();
    const a = document.getElementById('c1')!.getBoundingClientRect();
    const b = document.getElementById('c2')!.getBoundingClientRect();
    // A point of the caption that lies inside the first node's box.
    const x = Math.min(l.left + 4, a.right - 4);
    const y = l.top + l.height / 2;
    const top = graph.shadowRoot!.elementFromPoint(x, y);
    return {
      overlapsNode: l.left < a.right,
      topmostIsLabel: top === label,
      centredOnGap: Math.abs((l.left + l.right) / 2 - (a.right + b.left) / 2),
    };
  });
  expect(probe.overlapsNode, 'the fixture must actually put the caption over a node').toBe(true);
  expect(probe.topmostIsLabel, 'the caption paints above the node it overlaps').toBe(true);
  // The test viewport is smaller than the canvas, so the deck is scaled down ·
  // exactly the condition under which pixel positioning drifted.
  expect(probe.centredOnGap, 'the caption is centred on the visible gap at any scale').toBeLessThan(2);
});

// `rikiki check` tests the line that was painted rather than re-deriving one of
// its own, so the published path is a contract and not an internal detail.
test('every edge publishes the polyline it paints as data-path', async ({ page }) => {
  await gotoSlideWith(page, 'gr');
  const published = await page.evaluate(async () => {
    const graph = document.getElementById('gr')!;
    const edges = [...graph.querySelectorAll('deck-edge')];
    edges[0]!.setAttribute('route', 'ortho');
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const box = graph.getBoundingClientRect();
    return {
      box: { width: box.width, height: box.height },
      paths: edges.map((e) => e.getAttribute('data-path')),
      painted: graph.shadowRoot!.querySelector('path.edge')!.getAttribute('d'),
    };
  });
  expect(published.paths.every((p) => p !== null), 'every edge is published').toBe(true);
  const points = (path: string) => path.split(' ').map((pair) => pair.split(',').map(Number));
  // The orthogonal route publishes its bends; a straight edge publishes two ends.
  expect(points(published.paths[0]!)).toHaveLength(4);
  for (const path of published.paths.slice(1)) expect(points(path!)).toHaveLength(2);
  // Graph-relative CSS pixels · inside the drawing area, not viewport coordinates.
  for (const [x, y] of points(published.paths.join(' '))) {
    expect(x!).toBeGreaterThanOrEqual(0);
    expect(x!).toBeLessThanOrEqual(published.box.width);
    expect(y!).toBeGreaterThanOrEqual(0);
    expect(y!).toBeLessThanOrEqual(published.box.height);
  }
  // What is published is what is painted.
  const painted = published
    .painted!.replace(/^M | L /g, ' ')
    .trim()
    .split(/\s+/)
    .map(Number);
  expect(points(published.paths[0]!).flat().map((n) => Number(n!.toFixed(2)))).toEqual(
    painted.map((n) => Number(n.toFixed(2))),
  );
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
