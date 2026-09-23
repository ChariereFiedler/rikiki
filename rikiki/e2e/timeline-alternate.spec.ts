import { expect, test } from '@playwright/test';

// Seven milestones in a row leave each one a seventh of the slide, so every note
// wraps into a narrow column. `alternate` puts every other milestone above the
// axis: each can then span two columns without touching its neighbour.

const DECK = '/rikiki/decks/tests/timeline.html';

// These tests exercise marker geometry, not the external font service.
// Keep its stylesheet request local so an unavailable font CDN cannot hang load.
test.beforeEach(async ({ page }) => {
  await page.route('https://fonts.googleapis.com/**', (route) =>
    route.fulfill({ contentType: 'text/css', body: '' }),
  );
});

interface Placed {
  top: number;
  bottom: number;
  width: number;
  dotCentre: number;
}

/** Each milestone's painted box and dot centre, and the axis at mid-track. */
async function layoutOf(page: import('@playwright/test').Page, slide: number, id: string) {
  await page.goto(`${DECK}#${slide}`);
  // Waits on state · the slide shown and its milestones laid out.
  await page.waitForFunction(
    (sel) =>
      [...document.querySelectorAll(`#${sel} deck-milestone`)].every(
        (m) => m.getBoundingClientRect().width > 0 && !!m.shadowRoot?.querySelector('.dot'),
      ),
    id,
  );
  await page.evaluate(() => document.fonts.ready);
  return page.evaluate((sel) => {
    // Painted boxes carry the deck's zoom-to-fit scale, so every number here is
    // in the same space · the axis is drawn at the middle of the track.
    const t = document.getElementById(sel)!.getBoundingClientRect();
    const items = [...document.querySelectorAll(`#${sel} deck-milestone`)].map((m) => {
      const r = m.getBoundingClientRect();
      const d = m.shadowRoot!.querySelector('.dot')!.getBoundingClientRect();
      return { top: r.top, bottom: r.bottom, width: r.width, dotCentre: d.top + d.height / 2 };
    });
    return { axisCentre: t.top + t.height / 2, items };
  }, id);
}

test('alternate puts odd milestones above the axis and even ones below', async ({ page }) => {
  const { axisCentre, items } = await layoutOf(page, 2, 'tl-alternate');
  const [one, two, three, four] = items as [Placed, Placed, Placed, Placed];

  for (const up of [one, three]) expect(up.top, 'text above the axis').toBeLessThan(axisCentre);
  for (const down of [two, four]) expect(down.bottom, 'text below the axis').toBeGreaterThan(axisCentre);
  for (const m of items) expect(Math.abs(m.dotCentre - axisCentre), 'every dot sits on the axis').toBeLessThan(3);
});

test('alternate gives each milestone more width than a plain row', async ({ page }) => {
  const plain = await layoutOf(page, 1, 'tl-plain');
  const alternate = await layoutOf(page, 2, 'tl-alternate');
  expect(alternate.items[0]!.width).toBeGreaterThan(plain.items[0]!.width * 1.3);
});

for (const [slide, id] of [[1, 'tl-plain'], [2, 'tl-alternate']] as const) {
  test(id + ' keeps enlarged endpoint markers inside the clipping width', async ({ page }) => {
    await layoutOf(page, slide, id);
    const bounds = await page.evaluate((sel) => {
      const timeline = document.getElementById(sel)!;
      const milestones = [...timeline.querySelectorAll('deck-milestone')];
      const endpoints = [milestones[0]!, milestones[milestones.length - 1]!];
      endpoints.forEach((m) => m.setAttribute('active', ''));
      const r = timeline.getBoundingClientRect();
      const scale = r.width / (timeline as HTMLElement).offsetWidth;
      return endpoints.map((m) => {
        const dot = m.shadowRoot!.querySelector('.dot')!.getBoundingClientRect();
        return { left: dot.left - 4 * scale, right: dot.right + 4 * scale, clipLeft: r.left, clipRight: r.right };
      });
    }, id);
    for (const dot of bounds) {
      expect(dot.left).toBeGreaterThanOrEqual(dot.clipLeft - 0.5);
      expect(dot.right).toBeLessThanOrEqual(dot.clipRight + 0.5);
    }
  });
}
