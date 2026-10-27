import { type Browser, expect, type Locator, type Page, test } from '@playwright/test';

// ════════════════════════════════════════════════════════════════
// deck-diagram play="enter" · a story played on entry
//
// decks/tests/deck-diagram-story.html holds four remedies told as stories, with no
// click and no coordinate: a kill switch, a blue/green switch, an incident frise,
// a race for a lock. What is promised: each plays on entry for six to ten
// seconds with at least eight beats, the system runs before it breaks, the end of
// the story is the picture at rest (reduced motion jumps to it), a test can hold
// any instant (`seek`), and Pause, Replay and Loop drive it.
// ════════════════════════════════════════════════════════════════

const STORIES = ['kill-switch', 'blue-green', 'frise', 'course'] as const;
const LIVE = 'deck-root:not([data-overview-snapshot])';

/** The story fixture, one slide at a time · what the specs read and drive. */
class StoryDeck {
  constructor(readonly page: Page) {}

  diagram(id: string): Locator {
    return this.page.locator(`${LIVE} > [active] [data-testid="${id}"]`);
  }

  async open(slide: number): Promise<Locator> {
    const id = STORIES[slide - 1]!;
    await this.page.route('https://fonts.googleapis.com/**', (route) =>
      route.fulfill({ contentType: 'text/css', body: '' }),
    );
    await this.page.goto(`/rikiki/decks/tests/deck-diagram-story.html#${slide}`);
    await this.page.waitForFunction(
      ([live, testId]) => !!document.querySelector(`${live} > [active] [data-testid="${testId}"]`)?.shadowRoot?.querySelector('svg text'),
      [LIVE, id],
    );
    await this.page.evaluate(() => document.fonts.ready);
    const scene = this.diagram(id);
    await expect(scene).toHaveAttribute('playing', '');
    return scene;
  }

  /** The script the diagram published · played times, in ms. */
  script(scene: Locator) {
    return scene.evaluate((el) => JSON.parse(el.shadowRoot!.querySelector('svg')!.getAttribute('data-story')!));
  }

  /** Hold the story at `seconds` and wait for the frame to be painted. */
  async seek(scene: Locator, seconds: number) {
    await scene.evaluate((el, s) => (el as unknown as { seek(s: number): void }).seek(s), seconds);
    await scene.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))));
  }

  /** What the room sees at the instant held · visible texts, the tokens left and
   *  right of the gate, the state the gate is drawn in. */
  seen(scene: Locator) {
    return scene.evaluate((el) => {
      const root = el.shadowRoot!;
      const strength = (node: Element) => {
        if (getComputedStyle(node).visibility === 'hidden') return 0;
        let opacity = 1;
        for (let at: Element | null = node; at; at = at.parentElement) opacity *= Number(getComputedStyle(at).opacity);
        return opacity;
      };
      const painted = (node: Element) => strength(node) >= 0.5;
      const texts = [...root.querySelectorAll('text')];
      const words = texts.filter(painted).map((t) => t.textContent ?? '');
      const faint = texts.filter((t) => strength(t) > 0 && !painted(t)).map((t) => t.textContent ?? '');
      const gate = [...root.querySelectorAll('rect.gate')].filter(painted).at(-1);
      const bar = gate?.getBoundingClientRect();
      const tokens = [...root.querySelectorAll('circle.pass, circle.token')].filter(painted).map((t) => {
        const b = t.getBoundingClientRect();
        return (b.left + b.right) / 2;
      });
      return {
        words: words.join(' | '),
        faint: faint.join(' | '),
        closed: !!gate?.classList.contains('gate-closed'),
        past: bar ? tokens.filter((x) => x > bar.right).length : 0,
        before: bar ? tokens.filter((x) => x < bar.left).length : 0,
      };
    });
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
  return { context, deck: new StoryDeck(await context.newPage()) };
}

for (const [index, id] of STORIES.entries()) {
  test.describe(`story · ${id}`, () => {
    test('plays on entry with no click, six to ten seconds and eight beats at least', async ({ page }) => {
      const deck = new StoryDeck(page);
      const scene = await deck.open(index + 1);
      await expect(scene).not.toHaveAttribute('data-scene-issues');
      await expect(page.locator(`${LIVE} > #${id}`)).not.toHaveAttribute('data-steps');
      const script = await deck.script(scene);
      expect(script.playedMs).toBeGreaterThanOrEqual(6000);
      expect(script.playedMs).toBeLessThanOrEqual(10_000);
      expect(script.writtenMs).toBeLessThanOrEqual(12_000);
      expect(await deck.beats(scene)).toBeGreaterThanOrEqual(8);
      // The system runs before it breaks.
      expect(script.steadyMs).toBeGreaterThanOrEqual(1500);
    });

    test('keeps everything it draws inside its own frame, at the end of its story', async ({ page }) => {
      const deck = new StoryDeck(page);
      const scene = await deck.open(index + 1);
      await deck.seek(scene, 12);
      const outside = await scene.evaluate((el) => {
        const svg = el.shadowRoot!.querySelector('svg')!;
        const frame = svg.getBoundingClientRect();
        const slack = 1.5;
        return [...svg.querySelectorAll('rect, path, text, line')]
          .map((shape) => shape.getBoundingClientRect())
          .filter((b) => b.width > 0 && b.height > 0)
          .filter((b) => b.left < frame.left - slack || b.right > frame.right + slack || b.top < frame.top - slack || b.bottom > frame.bottom + slack).length;
      });
      expect(outside).toBe(0);
    });

    test('jumps to its last picture under reduced motion, with no button', async ({ browser }) => {
      const { context, deck } = await reducedDeck(browser);
      const scene = await deck.open(index + 1);
      expect(await scene.evaluate((el) => el.shadowRoot!.getAnimations().length)).toBe(0);
      await expect(scene.getByTestId('story-replay')).toBeHidden();
      await context.close();
    });
  });
}

test('the kill switch: the flow passes the open gate, then stops against it once the switch reads STOP', async ({ page, browser }) => {
  const deck = new StoryDeck(page);
  const scene = await deck.open(1);
  // The established flow, held at a few instants before the event: the switch says
  // MARCHE, the gate is open, and tokens are seen on the far side of it.
  const script = await deck.script(scene);
  const event = script.beats.find((b: { phase: string }) => b.phase === 'event').atMs / 1000;
  let passed = 0;
  for (let t = event - 1.2; t < event; t += 0.15) {
    await deck.seek(scene, t);
    const running = await deck.seen(scene);
    expect(running.words).toContain('DB 2 · MARCHE');
    expect(running.words).not.toContain('0 devis créé');
    expect(running.closed).toBe(false);
    passed += running.past;
  }
  expect(passed, 'tokens of the flow are seen past the open gate').toBeGreaterThan(0);

  await deck.seek(scene, 12);
  const end = await deck.seen(scene);
  expect(end.words).toContain('DB 2 · STOP');
  expect(end.words).not.toContain('MARCHE');
  expect(end.words).toContain('0 devis créé');
  expect(end.closed).toBe(true);
  expect(end.past, 'nothing passes the closed gate').toBe(0);
  expect(end.before, 'the tokens stopped against it').toBeGreaterThanOrEqual(6);

  // The picture at rest is the end of the story · what reduced motion, print and a render show.
  const { context, deck: still } = await reducedDeck(browser);
  const rest = await still.seen(await still.open(1));
  expect(rest.words).toBe(end.words);
  expect(rest.closed).toBe(true);
  await context.close();
});

test('blue/green: the lever turns, the old route pales and the traffic follows the new one', async ({ page }) => {
  const deck = new StoryDeck(page);
  const scene = await deck.open(2);
  const script = await deck.script(scene);
  const lever = script.beats.find((b: { mark: string }) => b.mark === 'vers-green').atMs / 1000;
  // Where the tip of the lever stands, on screen · above its pivot toward blue, below it toward green.
  const tip = () =>
    scene.evaluate((el) => {
      const b = el.shadowRoot!.querySelector('line.lever')!.getBoundingClientRect();
      return (b.top + b.bottom) / 2;
    });
  await deck.seek(scene, lever - 0.3);
  const before = await tip();
  expect((await deck.seen(scene)).words).toContain('Traefik · blue');
  await deck.seek(scene, 12);
  const after = await tip();
  expect(after - before, 'the lever turned from blue, above, to green, below').toBeGreaterThan(10);
  const end = await deck.seen(scene);
  expect(end.words).toContain('Traefik · green');
  expect(end.words).toContain('0 requête perdue');
});

test('the race: two versions run for one lock, one passes, the other does nothing', async ({ page }) => {
  const deck = new StoryDeck(page);
  const scene = await deck.open(4);
  const script = await deck.script(scene);
  // The beat a mark plays · not the established flow it carried before.
  const at = (mark: string) =>
    script.beats.find((b: { mark: string; kind: string }) => b.mark === mark && b.kind !== 'flow').atMs;
  expect(at('course-v1'), 'both start together').toBe(at('course-v2'));
  expect(at('verrou')).toBeGreaterThan(at('course-v2'));
  expect(at('v1')).toBeGreaterThan(at('verrou'));
  await deck.seek(scene, 12);
  const end = await deck.seen(scene);
  expect(end.words).toContain('pris par v2');
  expect(end.words).toContain('1 rapport reçu');
  // v1 steps back: its new words are drawn, pale.
  expect(end.faint).toContain('v1 · ne fait rien');
  expect(end.words).not.toContain('v1 · ancienne');
});

test('Pause holds the story, Replay plays it from the start, Loop says it is on', async ({ page }) => {
  const deck = new StoryDeck(page);
  const scene = await deck.open(1);
  const pause = scene.getByTestId('story-pause');
  await pause.click();
  await expect(pause).toHaveAttribute('aria-pressed', 'true');
  const held = await scene.evaluate((el) => el.shadowRoot!.getAnimations().every((a) => a.playState === 'paused'));
  expect(held).toBe(true);
  await pause.click();
  await expect(pause).toHaveAttribute('aria-pressed', 'false');

  await deck.seek(scene, 5);
  await scene.getByTestId('story-replay').click();
  await expect
    .poll(() => scene.evaluate((el) => Math.min(...el.shadowRoot!.getAnimations().map((a) => Number(a.currentTime ?? 0)))))
    .toBeLessThan(1500);

  const loop = scene.getByTestId('story-loop');
  await loop.click();
  await expect(loop).toHaveAttribute('aria-pressed', 'true');
});
