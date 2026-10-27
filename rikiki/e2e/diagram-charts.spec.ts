import { type Browser, expect, type Locator, type Page, test } from '@playwright/test';

// ════════════════════════════════════════════════════════════════
// deck-diagram · the charts, a pie and columns
//
// decks/tests/deck-diagram-charts.html holds five slides: a pie told as a story,
// columns in one series with a threshold, two series compared, three series beside
// a box, a pie beside a counter. What is promised: no issue, every ink inside its
// frame, the ring swept part after part on its beat (nothing of it before), the
// columns grown one after the other from their baseline, each figure as written at
// rest, one bar or one part in the accent, and reduced motion standing at the end.
// ════════════════════════════════════════════════════════════════

const SLIDES = ['anneau', 'lundi', 'trimestres', 'regions', 'duo'] as const;
const LIVE = 'deck-root:not([data-overview-snapshot])';

/** The charts fixture, one slide at a time · what the specs read and drive. */
class ChartsDeck {
  constructor(readonly page: Page) {}

  diagram(id: string): Locator {
    return this.page.locator(`${LIVE} > [active] [data-testid="${id}"]`);
  }

  async open(id: (typeof SLIDES)[number]): Promise<Locator> {
    await this.page.route('https://fonts.googleapis.com/**', (route) =>
      route.fulfill({ contentType: 'text/css', body: '' }),
    );
    await this.page.goto(`/rikiki/decks/tests/deck-diagram-charts.html#${SLIDES.indexOf(id) + 1}`);
    await this.page.waitForFunction(
      ([live, testId]) =>
        !!document.querySelector(`${live} > [active] [data-testid="${testId}"]`)?.shadowRoot?.querySelector('svg text'),
      [LIVE, id],
    );
    await this.page.evaluate(() => document.fonts.ready);
    return this.diagram(id);
  }

  /** Holds every animation of the drawing at `seconds` from its start. */
  async hold(scene: Locator, seconds: number) {
    await scene.evaluate((el, ms) => {
      for (const a of el.shadowRoot!.getAnimations()) {
        a.pause();
        a.currentTime = ms;
      }
    }, seconds * 1000);
    await scene.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))));
  }

  /** When a mark's own beat starts in a story, in seconds. */
  beatOf(scene: Locator, mark: string): Promise<number> {
    return scene.evaluate((el, name) => {
      const script = JSON.parse(el.shadowRoot!.querySelector('svg')!.getAttribute('data-story')!);
      return script.beats.find((b: { mark: string }) => b.mark === name).atMs / 1000;
    }, mark);
  }

  /** What a chart shows at the instant held · its painted words, how much of each
   *  part of its ring is drawn, how tall each column stands, its accent shapes. */
  seen(scene: Locator, mark: string) {
    return scene.evaluate((el, name) => {
      const root = el.shadowRoot!.querySelector(`[data-mark="${name}"]`)!;
      const strength = (node: Element) => {
        let opacity = 1;
        for (let at: Element | null = node; at; at = at.parentElement) opacity *= Number(getComputedStyle(at).opacity);
        return getComputedStyle(node).visibility === 'hidden' ? 0 : opacity;
      };
      const all = [...root.querySelectorAll('*')];
      return {
        words: all.filter((n) => n.localName === 'text' && strength(n) >= 0.5).map((n) => n.textContent ?? ''),
        // 1 when a part is drawn whole, 0 when nothing of it is.
        swept: all
          .filter((n) => n.classList.contains('pie-slice'))
          .map((n) => 1 - Number.parseFloat(getComputedStyle(n).strokeDashoffset || '0')),
        heights: all.filter((n) => n.classList.contains('col-bar') && n.localName === 'path').map((n) => n.getBoundingClientRect().height),
        accent: all.filter((n) => n.classList.contains('col-focus') || n.classList.contains('pie-focus')).length,
      };
    }, mark);
  }
}

async function reducedDeck(browser: Browser) {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  return { context, deck: new ChartsDeck(await context.newPage()) };
}

for (const id of SLIDES) {
  test.describe(`charts · ${id}`, () => {
    test('says nothing wrong, and keeps all its ink inside its frame at rest', async ({ page }) => {
      const deck = new ChartsDeck(page);
      const scene = await deck.open(id);
      await expect(scene).not.toHaveAttribute('data-scene-issues');
      await deck.hold(scene, 20);
      const outside = await scene.evaluate((el) => {
        const svg = el.shadowRoot!.querySelector('svg')!;
        const frame = svg.getBoundingClientRect();
        const slack = 1.5;
        return [...svg.querySelectorAll('rect, path, text, line, circle')]
          .map((shape) => shape.getBoundingClientRect())
          .filter((b) => b.width > 0 && b.height > 0)
          .filter((b) => b.left < frame.left - slack || b.right > frame.right + slack || b.top < frame.top - slack || b.bottom > frame.bottom + slack).length;
      });
      expect(outside).toBe(0);
    });

    test('stands at its end under reduced motion, with no animation', async ({ browser }) => {
      const { context, deck } = await reducedDeck(browser);
      const scene = await deck.open(id);
      expect(await scene.evaluate((el) => el.shadowRoot!.getAnimations().length)).toBe(0);
      await context.close();
    });
  });
}

test('the ring is swept part after part on its beat, then the figure of the whole comes in its hole', async ({ page }) => {
  const deck = new ChartsDeck(page);
  const scene = await deck.open('anneau');
  const beat = await deck.beatOf(scene, 'tickets');
  await deck.hold(scene, Math.max(0, beat - 0.05));
  const before = await deck.seen(scene, 'tickets');
  expect(before.swept.every((s) => s < 0.05), 'nothing of the ring before its beat').toBe(true);
  expect(before.words).not.toContain('62 %');

  await deck.hold(scene, beat + 0.5);
  const sweeping = await deck.seen(scene, 'tickets');
  expect(sweeping.swept[0], 'the first part is being drawn').toBeGreaterThan(0.05);
  expect(sweeping.swept.at(-1), 'the last part waits its turn').toBeLessThan(0.05);

  await deck.hold(scene, 20);
  const done = await deck.seen(scene, 'tickets');
  expect(done.swept.every((s) => s > 0.99)).toBe(true);
  expect(done.words).toEqual(expect.arrayContaining(['3 grands comptes', '62 %', '41 PME', '23 %', '212 indépendants', '15 %', 'des tickets']));
  expect(done.accent, 'one part brought forward, and its swatch').toBe(2);
});

test('the columns rise one after the other from the baseline, and stand as written', async ({ page }) => {
  const deck = new ChartsDeck(page);
  const scene = await deck.open('lundi');
  await deck.hold(scene, 0.3);
  const rising = await deck.seen(scene, 'jours');
  expect(rising.heights[0], 'the first column has started').toBeGreaterThan(1);
  expect(rising.heights.at(-1), 'the last one has not').toBeLessThan(1);

  await deck.hold(scene, 20);
  const done = await deck.seen(scene, 'jours');
  const [monday, tuesday] = done.heights;
  expect(monday! / tuesday!).toBeCloseTo(31 / 14, 1);
  expect(done.words).toEqual(expect.arrayContaining(['31', '14', '3', 'lun.', 'dim.', '20']));
  expect(done.accent, 'Monday alone in the accent').toBe(1);
});

test('two series are named, and only the column brought forward says its figures', async ({ page }) => {
  const deck = new ChartsDeck(page);
  const scene = await deck.open('trimestres');
  await deck.hold(scene, 20);
  const done = await deck.seen(scene, 'ventes');
  expect(done.heights).toHaveLength(8);
  expect(done.words).toEqual(expect.arrayContaining(['2025', '2026', '38 k€', '79 k€', 'T1', 'T4']));
  expect(done.words).not.toContain('51 k€');
  expect(done.accent).toBe(1);
});
