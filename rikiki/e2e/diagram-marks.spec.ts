import { type Browser, expect, type Locator, type Page, test } from '@playwright/test';

// ════════════════════════════════════════════════════════════════
// deck-diagram · the marks that tell a story in their own words
//
// decks/tests/deck-diagram-marks.html holds six stories, each on a graphic model of
// a graphic model, with no click and no coordinate: a terminal and its
// consequence, a probe that fails, an incident frise, records through a filter, an
// escalation with a timer, a switch with a lever. What is promised: each plays on
// entry for six to ten seconds with eight beats at least, after an established
// flow, ends on a picture that tells it alone (reduced motion jumps there), keeps
// its ink in its frame, and each mark does on its beat what it says: a terminal
// types, rows are carried and change, a switch turns, a status turns, a timer
// fills, a band is cut, people go missing, a counter counts.
// ════════════════════════════════════════════════════════════════

const STORIES = ['termine', 'sonde', 'frise', 'filtre', 'relais', 'bascule'] as const;
const LIVE = 'deck-root:not([data-overview-snapshot])';

interface Beat {
  phase: string;
  mark: string;
  kind: string;
  atMs: number;
}

/** The marks fixture, one slide at a time · what the specs read and drive. */
class MarksDeck {
  constructor(readonly page: Page) {}

  diagram(id: string): Locator {
    return this.page.locator(`${LIVE} > [active] [data-testid="${id}"]`);
  }

  async open(id: (typeof STORIES)[number]): Promise<Locator> {
    await this.page.route('https://fonts.googleapis.com/**', (route) =>
      route.fulfill({ contentType: 'text/css', body: '' }),
    );
    await this.page.goto(`/rikiki/decks/tests/deck-diagram-marks.html#${STORIES.indexOf(id) + 1}`);
    await this.page.waitForFunction(
      ([live, testId]) => !!document.querySelector(`${live} > [active] [data-testid="${testId}"]`)?.shadowRoot?.querySelector('svg text'),
      [LIVE, id],
    );
    await this.page.evaluate(() => document.fonts.ready);
    const scene = this.diagram(id);
    await expect(scene).toHaveAttribute('playing', '');
    return scene;
  }

  script(scene: Locator): Promise<{ playedMs: number; writtenMs: number; steadyMs: number; beats: Beat[] }> {
    return scene.evaluate((el) => JSON.parse(el.shadowRoot!.querySelector('svg')!.getAttribute('data-story')!));
  }

  /** When a mark's own beat starts, in seconds · not the flow it carried before. */
  async beatOf(scene: Locator, mark: string): Promise<number> {
    const beat = (await this.script(scene)).beats.find((b) => b.mark === mark && b.kind !== 'flow');
    return beat!.atMs / 1000;
  }

  async seek(scene: Locator, seconds: number) {
    await scene.evaluate((el, s) => (el as unknown as { seek(s: number): void }).seek(s), seconds);
    await scene.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))));
  }

  /** What one mark shows at the instant held · its painted words, its painted shapes
   *  by class, and how far its typed lines are revealed. */
  seen(scene: Locator, mark: string) {
    return scene.evaluate((el, name) => {
      const root = el.shadowRoot!.querySelector(`[data-mark="${name}"]`);
      const strength = (node: Element) => {
        if (getComputedStyle(node).visibility === 'hidden') return 0;
        let opacity = 1;
        for (let at: Element | null = node; at; at = at.parentElement) opacity *= Number(getComputedStyle(at).opacity);
        return opacity;
      };
      const painted = (node: Element) => strength(node) >= 0.5;
      const all = root ? [...root.querySelectorAll('*')] : [];
      const typed = all.filter((n) => n.classList.contains('typed'));
      return {
        words: all.filter((n) => n.localName === 'text' && painted(n)).map((n) => n.textContent ?? ''),
        shapes: all.filter((n) => n.localName !== 'text' && n.localName !== 'g' && painted(n)).map((n) => n.getAttribute('class') ?? ''),
        // A line still clipped from the right is not typed yet.
        hidden: typed.filter((n) => (getComputedStyle(n).clipPath.match(/[\d.]+/g) ?? []).some((v) => Number(v) > 0.5)).length,
        typed: typed.length,
        // How wide the void of a band is drawn, on screen.
        void: (() => {
          const gap = all.find((n) => n.classList.contains('void'));
          return gap ? gap.getBoundingClientRect().width : 0;
        })(),
      };
    }, mark);
  }

  /** Distinct instants, to the quarter second, at which something starts to move. */
  beats(scene: Locator) {
    return scene.evaluate((el) => {
      const starts = el.shadowRoot!.getAnimations().map((a) => (a.effect!.getComputedTiming().delay as number) ?? 0);
      return new Set(starts.map((ms) => Math.round(ms / 250))).size;
    });
  }
}

async function reducedDeck(browser: Browser) {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  return { context, deck: new MarksDeck(await context.newPage()) };
}

for (const id of STORIES) {
  test.describe(`marks · ${id}`, () => {
    test('plays on entry with no click, six to ten seconds, eight beats at least, after a steady flow', async ({ page }) => {
      const deck = new MarksDeck(page);
      const scene = await deck.open(id);
      await expect(scene).not.toHaveAttribute('data-scene-issues');
      await expect(page.locator(`${LIVE} > #${id}`)).not.toHaveAttribute('data-steps');
      const script = await deck.script(scene);
      expect(script.playedMs).toBeGreaterThanOrEqual(6000);
      expect(script.playedMs).toBeLessThanOrEqual(10_000);
      expect(script.writtenMs).toBeLessThanOrEqual(12_000);
      expect(script.steadyMs).toBeGreaterThanOrEqual(1500);
      expect(await deck.beats(scene)).toBeGreaterThanOrEqual(8);
    });

    test('keeps everything it draws inside its own frame, at the end of its story', async ({ page }) => {
      const deck = new MarksDeck(page);
      const scene = await deck.open(id);
      await deck.seek(scene, 12);
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

    test('jumps to its last picture under reduced motion, with no animation', async ({ browser }) => {
      const { context, deck } = await reducedDeck(browser);
      const scene = await deck.open(id);
      expect(await scene.evaluate((el) => el.shadowRoot!.getAnimations().length)).toBe(0);
      await context.close();
    });
  });
}

test('the terminal types its lines while the system runs, then the page fails and the clients leave', async ({ page }) => {
  const deck = new MarksDeck(page);
  const scene = await deck.open('termine');
  await deck.seek(scene, 0.3);
  const before = await deck.seen(scene, 'claude');
  expect(before.typed).toBeGreaterThan(0);
  expect(before.hidden, 'nothing typed yet').toBe(before.typed);
  expect(before.words).not.toContain('Terminé. Autre chose ?');

  const event = await deck.beatOf(scene, '14:02 · page blanche');
  await deck.seek(scene, event - 0.1);
  expect((await deck.seen(scene, 'claude')).hidden, 'every line typed before the event').toBe(0);
  const page0 = await deck.seen(scene, '14:02 · page blanche');
  expect(page0.words, 'the status says nothing before it turns').toEqual([]);
  expect(page0.shapes.some((c) => c.includes('d-ok'))).toBe(true);
  expect((await deck.seen(scene, 'clients')).shapes.filter((c) => c.includes('person-absent'))).toHaveLength(0);

  await deck.seek(scene, 12);
  expect((await deck.seen(scene, '14:02 · page blanche')).shapes.some((c) => c.includes('d-bad'))).toBe(true);
  expect((await deck.seen(scene, 'clients')).shapes.filter((c) => c.includes('person-absent'))).toHaveLength(3);
});

test('the rows are carried through the filter, change on the way, and the address is struck', async ({ page }) => {
  const deck = new MarksDeck(page);
  const scene = await deck.open('filtre');
  const event = await deck.beatOf(scene, 'anon');
  await deck.seek(scene, event - 0.1);
  expect((await deck.seen(scene, 'anon')).words.filter((w) => w !== 'anonymiser')).toEqual([]);
  expect((await deck.seen(scene, 'prod')).words).toContain('Marie Dubois · DG');

  await deck.seek(scene, 12);
  const anon = await deck.seen(scene, 'anon');
  expect(anon.words).toContain('Claire Martin · DG');
  expect(anon.words).not.toContain('Marie Dubois · DG');
  expect(anon.shapes.filter((c) => c.includes('strike'))).toHaveLength(1);
  expect((await deck.seen(scene, 'prod')).words, 'the source keeps its rows').toContain('Marie Dubois · DG');
  expect((await deck.seen(scene, 'jetable')).words).toContain('✗ 李娜 · 销售总监');
});

test('the band runs, is cut on the event, and its void grows as long as it lasted', async ({ page }) => {
  const deck = new MarksDeck(page);
  const scene = await deck.open('frise');
  const event = await deck.beatOf(scene, 'leads');
  await deck.seek(scene, event - 0.1);
  const running = await deck.seen(scene, 'leads');
  expect(running.void).toBeLessThan(2);
  expect(running.words).not.toContain('19 h sans lead');
  await deck.seek(scene, 12);
  const cut = await deck.seen(scene, 'leads');
  expect(cut.void).toBeGreaterThan(100);
  expect(cut.words).toContain('19 h sans lead');
  expect(cut.words).toContain('mer. 12:38 · v2.4 en ligne');
  expect((await deck.seen(scene, 'perdus')).words).toEqual(['64 leads', 'perdus, estimés']);
});

test('Peter goes missing, the timer runs its five minutes, the steps are ticked one by one', async ({ page }) => {
  const deck = new MarksDeck(page);
  const scene = await deck.open('relais');
  const timer = await deck.beatOf(scene, 'delai');
  await deck.seek(scene, timer - 0.05);
  expect((await deck.seen(scene, 'delai')).words).toContain('0 min');
  expect((await deck.seen(scene, 'peter')).shapes.filter((c) => c.includes('person-absent'))).toHaveLength(1);
  const proof = await deck.beatOf(scene, 'runbook');
  await deck.seek(scene, proof + 0.4);
  const ticking = (await deck.seen(scene, 'runbook')).words.filter((w) => w.startsWith('✓'));
  expect(ticking.length, 'the first steps are ticked before the last').toBeGreaterThan(0);
  expect(ticking.length).toBeLessThan(4);
  await deck.seek(scene, 12);
  expect((await deck.seen(scene, 'delai')).words).toContain('5 min');
  expect((await deck.seen(scene, 'runbook')).words.filter((w) => w.startsWith('✓'))).toHaveLength(4);
});

test('the switch turns from OFF to ON on its beat, and the status of green turns from waiting to sound', async ({ page }) => {
  const deck = new MarksDeck(page);
  const scene = await deck.open('bascule');
  const flag = await deck.beatOf(scene, 'flag');
  await deck.seek(scene, flag - 0.1);
  const off = await deck.seen(scene, 'flag');
  expect(off.words).toContain('OFF');
  expect(off.shapes.some((c) => c.includes('sw-off'))).toBe(true);
  await deck.seek(scene, 12);
  const on = await deck.seen(scene, 'flag');
  expect(on.words).toContain('ON');
  expect(on.words).not.toContain('OFF');
  expect(on.shapes.some((c) => c.includes('sw-off'))).toBe(false);
  expect((await deck.seen(scene, 'GET /health · 200')).shapes.some((c) => c.includes('d-ok'))).toBe(true);
});

test('the probe fails at the task, the account waits, the counter counts the minutes', async ({ page }) => {
  const deck = new MarksDeck(page);
  const scene = await deck.open('sonde');
  const effect = await deck.beatOf(scene, 'attente');
  await deck.seek(scene, effect + 0.3);
  const counting = (await deck.seen(scene, 'attente')).words.find((w) => w.endsWith('min'));
  expect(counting).not.toBe('15 min');
  await deck.seek(scene, 12);
  expect((await deck.seen(scene, 'attente')).words).toContain('15 min');
  expect((await deck.seen(scene, '11:02')).shapes.some((c) => c.includes('d-bad'))).toBe(true);
  expect((await deck.seen(scene, '11 h')).shapes.some((c) => c.includes('d-gold'))).toBe(true);
});
