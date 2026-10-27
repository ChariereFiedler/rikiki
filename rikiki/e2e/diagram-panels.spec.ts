import { type Browser, expect, type Locator, type Page, test } from '@playwright/test';

// ════════════════════════════════════════════════════════════════
// deck-diagram · several pictures in one, and a camera
//
// decks/tests/deck-diagram-panels.html holds five compositions, with no click and no coordinate: a kill switch beside its incident, a
// fail-over over its RPO/RTO axis, the test set lost in production with a pull back,
// a dashboard of four widgets, a zoom out in rings. What is promised: each plays on
// entry for six to ten seconds with eight beats at least, its panels laid out by the
// composition, keeps its ink in its frame at the end, and the camera opens on what it
// names, closer than the whole, then shows the whole composition at rest · also when
// the slide is reached by the keyboard, and at once under reduced motion.
// ════════════════════════════════════════════════════════════════

const SLIDES = ['filet', 'secours', 'production', 'tableau', 'anneaux'] as const;
type Slide = (typeof SLIDES)[number];
const LIVE = 'deck-root:not([data-overview-snapshot])';

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** The panels fixture, one slide at a time · what the specs read and drive. */
class PanelsDeck {
  constructor(readonly page: Page) {}

  diagram(id: Slide): Locator {
    return this.page.locator(`${LIVE} > [active] [data-testid="${id}"]`);
  }

  private async ready(id: Slide): Promise<Locator> {
    await this.page.waitForFunction(
      ([live, testId]) => !!document.querySelector(`${live} > [active] [data-testid="${testId}"]`)?.shadowRoot?.querySelector('svg text'),
      [LIVE, id],
    );
    await this.page.evaluate(() => document.fonts.ready);
    const scene = this.diagram(id);
    await expect(scene).toHaveAttribute('playing', '');
    return scene;
  }

  async open(id: Slide): Promise<Locator> {
    await this.page.route('https://fonts.googleapis.com/**', (route) =>
      route.fulfill({ contentType: 'text/css', body: '' }),
    );
    await this.page.goto(`/rikiki/decks/tests/deck-diagram-panels.html#${SLIDES.indexOf(id) + 1}`);
    return this.ready(id);
  }

  /** The next slide, by the keyboard · a slide reached as a speaker reaches it. */
  async next(id: Slide): Promise<Locator> {
    await this.page.keyboard.press('ArrowRight');
    return this.ready(id);
  }

  script(scene: Locator): Promise<{ playedMs: number; writtenMs: number; beats: { mark: string; kind: string; atMs: number }[] }> {
    return scene.evaluate((el) => JSON.parse(el.shadowRoot!.querySelector('svg')!.getAttribute('data-story')!));
  }

  async beatOf(scene: Locator, mark: string): Promise<number> {
    return (await this.script(scene)).beats.find((b) => b.mark === mark)!.atMs / 1000;
  }

  async seek(scene: Locator, seconds: number) {
    await scene.evaluate((el, s) => (el as unknown as { seek(s: number): void }).seek(s), seconds);
    await scene.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))));
  }

  /** Where a mark is painted on screen, at the instant held. */
  place(scene: Locator, mark: string): Promise<Box> {
    return scene.evaluate((el, name) => {
      const b = el.shadowRoot!.querySelector(`[data-mark="${name}"]`)!.getBoundingClientRect();
      return { x: b.x, y: b.y, w: b.width, h: b.height };
    }, mark);
  }

  /** How strongly a mark is painted, at the instant held · 0 when not yet there. */
  strength(scene: Locator, mark: string): Promise<number> {
    return scene.evaluate((el, name) => {
      const root = el.shadowRoot!.querySelector(`[data-mark="${name}"]`)!;
      const shapes = [...root.querySelectorAll('rect, text')];
      return Math.max(
        ...shapes.map((node) => {
          if (getComputedStyle(node).visibility === 'hidden') return 0;
          let opacity = 1;
          for (let at: Element | null = node; at; at = at.parentElement) opacity *= Number(getComputedStyle(at).opacity);
          return opacity;
        }),
      );
    }, mark);
  }

  /** The words a mark paints at the instant held. */
  words(scene: Locator, mark: string): Promise<string[]> {
    return scene.evaluate((el, name) => {
      const root = el.shadowRoot!.querySelector(`[data-mark="${name}"]`)!;
      return [...root.querySelectorAll('text')]
        .filter((n) => getComputedStyle(n).visibility !== 'hidden' && Number(getComputedStyle(n.parentElement!).opacity) > 0.5)
        .map((n) => n.textContent ?? '');
    }, mark);
  }

  /** How many camera moves the drawing nests, and whether any frames it now. */
  camera(scene: Locator): Promise<{ moves: number; transformed: boolean }> {
    return scene.evaluate((el) => {
      const moves = [...el.shadowRoot!.querySelectorAll('.cam')];
      const framed = (g: Element) => {
        const t = getComputedStyle(g).transform;
        return t !== 'none' && !new DOMMatrix(t).isIdentity;
      };
      return { moves: moves.length, transformed: moves.some(framed) };
    });
  }

  beats(scene: Locator) {
    return scene.evaluate((el) => {
      const starts = el.shadowRoot!.getAnimations().map((a) => (a.effect!.getComputedTiming().delay as number) ?? 0);
      return new Set(starts.map((ms) => Math.round(ms / 250))).size;
    });
  }
}

async function reducedDeck(browser: Browser) {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  return { context, deck: new PanelsDeck(await context.newPage()) };
}

for (const id of SLIDES) {
  test.describe(`panels · ${id}`, () => {
    test('plays on entry with no click, six to ten seconds, eight beats at least, clean', async ({ page }) => {
      const deck = new PanelsDeck(page);
      const scene = await deck.open(id);
      await expect(scene).not.toHaveAttribute('data-scene-issues');
      await expect(page.locator(`${LIVE} > #${id}`)).not.toHaveAttribute('data-steps');
      const script = await deck.script(scene);
      expect(script.playedMs).toBeGreaterThanOrEqual(6000);
      expect(script.playedMs).toBeLessThanOrEqual(10_000);
      expect(script.writtenMs).toBeLessThanOrEqual(12_000);
      expect(await deck.beats(scene)).toBeGreaterThanOrEqual(8);
    });

    test('keeps everything it draws inside its frame, the whole composition at the end', async ({ page }) => {
      const deck = new PanelsDeck(page);
      const scene = await deck.open(id);
      await deck.seek(scene, 12);
      expect((await deck.camera(scene)).transformed).toBe(false);
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

    test('shows the whole composition at once under reduced motion', async ({ browser }) => {
      const { context, deck } = await reducedDeck(browser);
      const scene = await deck.open(id);
      expect(await scene.evaluate((el) => el.shadowRoot!.getAnimations().length)).toBe(0);
      expect((await deck.camera(scene)).transformed).toBe(false);
      await context.close();
    });
  });
}

test('the model and its incident stand side by side, as wide, the incident coming in on its beat', async ({ page }) => {
  const deck = new PanelsDeck(page);
  const scene = await deck.open('filet');
  const model = await deck.place(scene, 'modele');
  const incident = await deck.place(scene, 'incident');
  expect(Math.abs(model.w - incident.w)).toBeLessThan(2);
  expect(Math.abs(model.y - incident.y)).toBeLessThan(1);
  expect(incident.x).toBeGreaterThan(model.x + model.w);
  const effect = await deck.beatOf(scene, 'incident');
  await deck.seek(scene, effect - 0.2);
  expect(await deck.strength(scene, 'incident.db2')).toBeLessThan(0.1);
  expect(await deck.words(scene, 'modele.drapeau')).toContain('STOP');
  await deck.seek(scene, 12);
  expect(await deck.strength(scene, 'incident.db2')).toBeGreaterThan(0.9);
});

test('the time axis stands at the foot of the fail-over, its panne on the beat the principal fails', async ({ page }) => {
  const deck = new PanelsDeck(page);
  const scene = await deck.open('secours');
  const body = await deck.place(scene, 'reseau.principal');
  const foot = await deck.place(scene, 'temps.rpo');
  expect(foot.y).toBeGreaterThan(body.y + body.h);
  const script = await deck.script(scene);
  const at = (mark: string) => script.beats.find((b) => b.mark === mark && b.kind !== 'flow')!.atMs;
  expect(at('temps.panne')).toBe(at('reseau.principal'));
});

test('the camera opens on the test set, closer than the whole, then pulls back to the production', async ({ page }) => {
  const deck = new PanelsDeck(page);
  const scene = await deck.open('production');
  expect((await deck.camera(scene)).moves).toBe(1);
  await deck.seek(scene, 0.2);
  const close = await deck.place(scene, 'jeu');
  expect((await deck.camera(scene)).transformed).toBe(true);
  await deck.seek(scene, 12);
  const whole = await deck.place(scene, 'jeu');
  expect(close.w / whole.w).toBeGreaterThan(1.2);
});

test('the camera restarts on its opening frame when the slide is reached by the keyboard', async ({ page }) => {
  const deck = new PanelsDeck(page);
  await deck.open('secours');
  const scene = await deck.next('production');
  await deck.seek(scene, 0.2);
  expect((await deck.camera(scene)).transformed).toBe(true);
});

test('the dashboard sets four widgets two by two, the gauge reading its value before its beat', async ({ page }) => {
  const deck = new PanelsDeck(page);
  const scene = await deck.open('tableau');
  const [a, b, c, d] = await Promise.all(['jauge', 'statut', 'courbe', 'deploiements'].map((m) => deck.place(scene, m)));
  expect(Math.abs(a!.y - b!.y)).toBeLessThan(1);
  expect(Math.abs(c!.y - d!.y)).toBeLessThan(1);
  expect(Math.abs(a!.x - c!.x)).toBeLessThan(1);
  expect(c!.y).toBeGreaterThan(a!.y + a!.h);
  const event = await deck.beatOf(scene, 'jauge.p95');
  await deck.seek(scene, event - 0.1);
  expect(await deck.words(scene, 'jauge.p95')).toContain('210 ms');
  await deck.seek(scene, 12);
  expect(await deck.words(scene, 'jauge.p95')).toContain('720 ms');
});

test('the rings pull back three times, each ring before the next, to the whole picture', async ({ page }) => {
  const deck = new PanelsDeck(page);
  const scene = await deck.open('anneaux');
  expect((await deck.camera(scene)).moves).toBe(3);
  const widthAt = async (seconds: number) => {
    await deck.seek(scene, seconds);
    return (await deck.place(scene, 'environnement.code')).w;
  };
  const beats = await Promise.all(['cadre-env', 'cadre-exploit', 'cadre-tout'].map((m) => deck.beatOf(scene, m)));
  const widths = [await widthAt(0.2)];
  for (const at of beats) widths.push(await widthAt(at + 1.3));
  for (let k = 1; k < widths.length; k += 1) expect(widths[k]!).toBeLessThan(widths[k - 1]! - 1);
});
