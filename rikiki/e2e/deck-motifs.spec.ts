import { type Browser, expect, type Locator, type Page, test } from '@playwright/test';

// ════════════════════════════════════════════════════════════════
// deck-diagram · the motifs of a deck
//
// decks/tests/deck-diagram-deck-motifs.html holds three incident → remedy pairs on
// the strip of one act. What is promised: every slide draws the strip with the step
// it stands at; the chapter "environnement" opens on the CI job where and as large as
// the slide before left it when the room comes from there, on its own frame when it
// arrives any other way, and ends on the whole picture; reduced motion shows the
// whole picture at once.
// ════════════════════════════════════════════════════════════════

const SLIDES = [
  'tests-oublies',
  'tests-branches',
  'migration-cassee',
  'migration-testee',
  'vert-casse',
  'sonde-horaire',
] as const;
type SlideId = (typeof SLIDES)[number];
const LIVE = 'deck-root:not([data-overview-snapshot])';

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** The deck of motifs · one slide shown at a time, its diagram driven. */
class MotifsDeck {
  constructor(readonly page: Page) {}

  diagram(id: SlideId): Locator {
    return this.page.locator(`${LIVE} > [active] [data-testid="${id}"]`);
  }

  async open(id: SlideId): Promise<Locator> {
    await this.page.route('https://fonts.googleapis.com/**', (route) =>
      route.fulfill({ contentType: 'text/css', body: '' }),
    );
    await this.page.goto(`/rikiki/decks/tests/deck-diagram-deck-motifs.html#${SLIDES.indexOf(id) + 1}`);
    return this.ready(id);
  }

  /** The next slide, as a speaker steps to it. */
  async next(id: SlideId): Promise<Locator> {
    await this.page.keyboard.press('ArrowRight');
    return this.ready(id);
  }

  private async ready(id: SlideId): Promise<Locator> {
    const scene = this.diagram(id);
    await expect(scene).toHaveAttribute('playing', '');
    await scene.evaluate(async () => {
      await document.fonts.ready;
    });
    return scene;
  }

  /** Every animation of the diagram held at `seconds` from its start. */
  async hold(scene: Locator, seconds: number) {
    await scene.evaluate((el, s) => (el as unknown as { seek(s: number): void }).seek(s), seconds);
    await scene.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))));
  }

  /** Where a mark's surface stands on the screen. */
  markBox(scene: Locator, mark: string): Promise<Box> {
    return scene.evaluate((el, name) => {
      const surface = el.shadowRoot!.querySelector(`svg:not([data-act]) [data-mark="${name}"] rect`)!;
      const b = surface.getBoundingClientRect();
      return { x: b.x, y: b.y, w: b.width, h: b.height };
    }, mark);
  }

  /** The strip of the act · its words, the one it stands at, what it says aloud. */
  strip(scene: Locator) {
    return scene.evaluate((el) => {
      const svg = el.shadowRoot!.querySelector('svg[data-act]');
      return {
        label: svg?.getAttribute('aria-label') ?? null,
        steps: [...(svg?.querySelectorAll('text') ?? [])].map((t) => t.textContent),
        current: svg?.querySelector('text.act-current')?.textContent ?? null,
        stations: svg?.querySelectorAll('circle.act-station').length ?? 0,
      };
    });
  }
}

async function reducedDeck(browser: Browser) {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  return { context, deck: new MotifsDeck(await context.newPage()) };
}

const STEPS = ['terminal', 'code', 'environnement', 'exploitation', 'client'];
const AT: Record<SlideId, string> = {
  'tests-oublies': 'code',
  'tests-branches': 'code',
  'migration-cassee': 'environnement',
  'migration-testee': 'environnement',
  'vert-casse': 'exploitation',
  'sonde-horaire': 'exploitation',
};

for (const id of SLIDES) {
  test(`${id} · draws the strip of the act at its step, and says nothing wrong`, async ({ page }) => {
    const deck = new MotifsDeck(page);
    const scene = await deck.open(id);
    await expect(scene).not.toHaveAttribute('data-scene-issues');
    const strip = await deck.strip(scene);
    expect(strip.steps).toEqual(STEPS);
    expect(strip.stations).toBe(STEPS.length);
    expect(strip.current).toBe(AT[id]);
    expect(strip.label).toContain(`Étape ${STEPS.indexOf(AT[id]) + 1} sur 5`);
  });
}

test('the chapter opens on the CI job where the slide before left it, then pulls back to the whole picture', async ({ page }) => {
  const deck = new MotifsDeck(page);
  const before = await deck.open('tests-branches');
  await deck.hold(before, 30);
  const left = await deck.markBox(before, 'ci');

  const chapter = await deck.next('migration-cassee');
  await deck.hold(chapter, 0.05);
  const opening = await deck.markBox(chapter, 'ci');
  // The same place and the same width, to a few pixels · the room sees one mark. Its
  // height follows its own words, so it is the centres that meet.
  const centre = (b: Box) => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 });
  expect(Math.abs(centre(opening).x - centre(left).x)).toBeLessThan(4);
  expect(Math.abs(centre(opening).y - centre(left).y)).toBeLessThan(4);
  expect(Math.abs(opening.w - left.w)).toBeLessThan(4);

  await deck.hold(chapter, 30);
  const rest = await deck.markBox(chapter, 'ci');
  expect(rest.w, 'at rest the whole picture, the mark at its own size').toBeLessThan(opening.w - 10);
});

/** Two slides whose cameras meet · the first pulls back from its CI job, the second
 *  opens from that job. Served by a route: a deck of this test alone. */
const MID_MOVE = `<!doctype html><html lang="fr"><head><meta charset="UTF-8">
<link rel="stylesheet" href="../../themes/rikiki.css">
<script type="module" src="../../dist/index.js"></script>
<script type="module" src="../../dist/deck-diagram.js"></script></head><body><deck-root>
<deck-feature id="avant"><h1 slot="title">Avant</h1>
  <deck-diagram data-testid="avant" play="enter" layout="layers" direction="right" gap="airy">
    <dg-box name="depot" icon="code" label="dépôt" note="push feat/devis · 14:02" paint="pale"></dg-box>
    <dg-box name="tests" icon="document" label="312 tests" note="à chaque push" paint="ok"></dg-box>
    <dg-box name="ci" icon="refresh" label="job CI" note="build, puis tests" paint="gold"></dg-box>
    <dg-box name="prod" icon="cloud" label="prod · v1.9.0" note="merge bloqué" paint="ink"></dg-box>
    <dg-link from="depot" to="ci"></dg-link><dg-link from="tests" to="ci"></dg-link>
    <dg-link from="ci" to="prod" dashed></dg-link>
    <dg-camera name="recul" focus="ci" to="all" beat="event" duration="3s"></dg-camera>
  </deck-diagram></deck-feature>
<deck-feature id="apres"><h1 slot="title">Après</h1>
  <deck-diagram data-testid="apres" play="enter" layout="layers" direction="right" gap="airy">
    <dg-box name="ci" icon="refresh" label="job CI" note="build, puis tests" paint="gold"></dg-box>
    <dg-box name="migration" icon="document" label="0042_tva" note="migration de la TVA" paint="pale"></dg-box>
    <dg-box name="staging" icon="database" label="staging" note="Postgres 14 · base vide" paint="pale"></dg-box>
    <dg-box name="prod" icon="database" label="prod" note="Postgres 16 · 41 000 devis" paint="ink"></dg-box>
    <dg-link from="ci" to="staging"></dg-link><dg-link from="migration" to="staging" dashed></dg-link>
    <dg-link from="staging" to="prod"></dg-link>
    <dg-camera name="suite" zoom-from="avant/ci" to="all" beat="steady"></dg-camera>
  </deck-diagram></deck-feature>
</deck-root></body></html>`;

test('a chapter left while its camera still moves is taken over where the room saw the mark, not where it rests', async ({ page }) => {
  await page.route('**/rikiki/decks/tests/__mid-move.html', (route) =>
    route.fulfill({ contentType: 'text/html', body: MID_MOVE }),
  );
  await page.route('https://fonts.googleapis.com/**', (route) =>
    route.fulfill({ contentType: 'text/css', body: '' }),
  );
  const deck = new MotifsDeck(page);
  await page.goto('/rikiki/decks/tests/__mid-move.html#1');
  const before = page.locator(`${LIVE} > [active] [data-testid="avant"]`);
  await expect(before).toHaveAttribute('playing', '');
  // Half way through the pull back · the camera's own timing, read off its animation.
  const middle = await before.evaluate((el) => {
    const timing = el.shadowRoot!.querySelector('.cam')!.getAnimations()[0]!.effect!.getComputedTiming();
    return (Number(timing.delay ?? 0) + Number(timing.activeDuration) / 2) / 1000;
  });
  await deck.hold(before, 30);
  const resting = await deck.markBox(before, 'ci');
  await deck.hold(before, middle);
  const seen = await deck.markBox(before, 'ci');
  expect(seen.w, 'mid-move, the mark is drawn larger than at rest').toBeGreaterThan(resting.w + 10);

  await page.keyboard.press('ArrowRight');
  const after = page.locator(`${LIVE} > [active] [data-testid="apres"]`);
  await expect(after).toHaveAttribute('playing', '');
  await deck.hold(after, 0.05);
  const opening = await deck.markBox(after, 'ci');
  const centre = (b: Box) => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 });
  expect(Math.abs(opening.w - seen.w), 'the width the room last saw').toBeLessThan(4);
  expect(Math.abs(centre(opening).x - centre(seen).x)).toBeLessThan(4);
  expect(Math.abs(centre(opening).y - centre(seen).y)).toBeLessThan(4);
});

test('reached directly, the chapter opens framed on its own CI job, not on a slide it never came from', async ({ page }) => {
  const deck = new MotifsDeck(page);
  const chapter = await deck.open('migration-cassee');
  await deck.hold(chapter, 30);
  const rest = await deck.markBox(chapter, 'ci');
  await deck.hold(chapter, 0.05);
  const opening = await deck.markBox(chapter, 'ci');
  expect(opening.w, 'framed closer than at rest').toBeGreaterThan(rest.w * 1.2);
  const frame = await chapter.evaluate((el) => {
    const b = el.shadowRoot!.querySelector('svg:not([data-act])')!.getBoundingClientRect();
    return { x: b.x, y: b.y, w: b.width, h: b.height };
  });
  expect(opening.x).toBeGreaterThanOrEqual(frame.x - 1);
  expect(opening.x + opening.w).toBeLessThanOrEqual(frame.x + frame.w + 1);
});

test('under reduced motion the chapter stands whole at once, with no animation', async ({ browser }) => {
  const { context, deck } = await reducedDeck(browser);
  const chapter = await deck.open('migration-cassee');
  expect(await chapter.evaluate((el) => el.shadowRoot!.getAnimations().length)).toBe(0);
  const transforms = await chapter.evaluate((el) =>
    [...el.shadowRoot!.querySelectorAll('.cam')].map((g) => getComputedStyle(g).transform),
  );
  expect(transforms.every((t) => t === 'none')).toBe(true);
  await context.close();
});
