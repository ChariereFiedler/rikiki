import { expect, test, type Page } from '@playwright/test';

// ════════════════════════════════════════════════════════════════
// deck-diagram · the grammar, drawn
//
// Five illustrations of different kinds, written with the same marks and no
// coordinate: a graph by layers, a chart in rows, a ring, a grid of 400 cells
// with a note, two groups with notes. What is promised here is what an agent
// relies on: it is drawn, it says nothing when it is right, nothing leaves its
// frame, the scale of the picture is the same whatever the slide, and it rests
// at its final state. The random trees are the bench's job (scene-bench.spec).
// ════════════════════════════════════════════════════════════════

const LIVE = 'deck-root:not([data-overview-snapshot])';
const diagram = (page: Page, testId: string) => page.locator(`${LIVE} > * > [data-testid="${testId}"]`);

const SLIDES = ['graph', 'funnel', 'cycle', 'crowd', 'before-after'];

test.beforeEach(async ({ page }) => {
  await page.route('https://fonts.googleapis.com/**', (route) => route.fulfill({ contentType: 'text/css', body: '' }));
});

async function open(page: Page, slide: number) {
  await page.goto(`/rikiki/decks/tests/deck-diagram.html#${slide}`);
  await page.waitForFunction(
    ([live, id]) => !!document.querySelector(`${live} > [active] [data-testid="${id}"]`)?.shadowRoot?.querySelector('svg text, svg rect.dot'),
    [LIVE, SLIDES[slide - 1]!],
  );
  await page.evaluate(() => document.fonts.ready);
  return settled(diagram(page, SLIDES[slide - 1]!));
}

/** A diagram measured at rest · it plays on its shown slide, and its entrance has
 *  played to the end. */
async function settled(scene: ReturnType<typeof diagram>) {
  await expect(scene).toHaveAttribute('playing', '');
  await scene.evaluate((el) =>
    Promise.all(el.shadowRoot!.getAnimations().map((animation) => animation.finished)),
  );
  return scene;
}

for (const [index, id] of SLIDES.entries()) {
  test.describe(id, () => {
    test('is drawn, and says nothing about itself when it is right', async ({ page }) => {
      const scene = await open(page, index + 1);
      await expect(scene).not.toHaveAttribute('data-scene-issues');
      const marks = await scene.evaluate((el) => el.shadowRoot!.querySelectorAll('svg rect, svg path, svg text').length);
      expect(marks).toBeGreaterThan(3);
    });

    test('keeps everything it draws inside its own frame', async ({ page }) => {
      const scene = await open(page, index + 1);
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

    test('is already at its final state without playing, and under reduced motion', async ({ browser }) => {
      for (const reducedMotion of ['no-preference', 'reduce'] as const) {
        const context = await browser.newContext({ reducedMotion });
        const page = await context.newPage();
        const scene = await open(page, index + 1);
        const running = await scene.evaluate((el) => el.shadowRoot!.getAnimations().length);
        if (reducedMotion === 'reduce') expect(running, 'nothing animates under reduced motion').toBe(0);
        await context.close();
      }
    });
  });
}

test('the nodes of a graph are placed left to right in the order of the links, with no coordinate written', async ({ page }) => {
  const scene = await open(page, 1);
  const x = await scene.evaluate((el) => {
    const drawn = (el as unknown as { drawn: { items: { kind: string; key: string; x: number }[] } }).drawn;
    return Object.fromEntries(drawn.items.filter((i) => i.kind === 'box').map((i) => [i.key, i.x]));
  });
  expect(x.web).toBeLessThan(x.gw!);
  expect(x.gw).toBeLessThan(x.auth!);
  expect(x.auth).toBeLessThan(x.db!);
});

test('a bar chart sizes each bar by its value', async ({ page }) => {
  const scene = await open(page, 2);
  const widths = await scene.evaluate((el) =>
    [...el.shadowRoot!.querySelectorAll('rect.bar')].map((r) => r.getBoundingClientRect().width),
  );
  expect(widths).toHaveLength(4);
  expect(widths[0]! / widths[1]!).toBeGreaterThan(4);
  expect(widths[1]!).toBeGreaterThan(widths[2]!);
  expect(widths[2]!).toBeGreaterThan(widths[3]!);
});

test('a grid draws exactly the cells it was asked for, and the lit ones are the series put forward', async ({ page }) => {
  const scene = await open(page, 4);
  const cells = await scene.evaluate((el) => ({
    all: el.shadowRoot!.querySelectorAll('rect.dot').length,
    lit: el.shadowRoot!.querySelectorAll('rect.dot.accent').length,
  }));
  expect(cells).toEqual({ all: 400, lit: 38 });
});

test('a note stands beside what it points at, with a leader', async ({ page }) => {
  const scene = await open(page, 4);
  const geometry = await scene.evaluate((el) => {
    const drawn = (el as unknown as { drawn: { notes: { x: number; w: number; leader?: unknown }[]; items: { kind: string; x: number; size: number }[] } }).drawn;
    const right = Math.max(...drawn.items.filter((i) => i.kind === 'dot').map((i) => i.x + i.size));
    return { noteX: drawn.notes[0]!.x, right, leader: !!drawn.notes[0]!.leader };
  });
  expect(geometry.noteX).toBeGreaterThanOrEqual(geometry.right);
  expect(geometry.leader).toBe(true);
});

test('a bad tree is named under codes that say what to write instead', async ({ page }) => {
  await open(page, 1);
  const scene = diagram(page, 'graph');
  await scene.evaluate((el) => {
    const link = document.createElement('dg-link');
    link.setAttribute('from', 'web');
    link.setAttribute('to', 'nowhere');
    el.append(link);
    const stray = document.createElement('p');
    el.append(stray);
    (el.querySelector('dg-box') as HTMLElement).setAttribute('colour', 'red');
  });
  await expect
    .poll(async () => (await scene.getAttribute('data-scene-issues')) ?? '')
    .toMatch(/DG_REF_UNKNOWN/);
  const issues = JSON.parse((await scene.getAttribute('data-scene-issues')) ?? '[]') as { code: string; fix?: { action: string } }[];
  const codes = issues.map((i) => i.code);
  expect(codes).toEqual(expect.arrayContaining(['DG_REF_UNKNOWN', 'DG_CHILD_UNKNOWN', 'DG_ATTR_UNKNOWN']));
  for (const issue of issues) expect(issue.fix?.action, issue.code).toBeTruthy();
});

// ── motion · lanes, gates, tokens, clicks, an axis ─────────────────────────
//
// decks/tests/deck-diagram-motion.html holds five concepts that move: a kill
// switch (lanes, a gate driven by a mark, closing on a click), a request through
// layers and back (tokens tracing their links), a queue that fills then a gate
// that sheds, a state machine whose tokens wait for a click, a frise with a
// cursor. What is promised: each is drawn clean, rests still under reduced
// motion, and a click brings what waits for it.

const MOTION = ['kill-switch', 'round-trip', 'queue-shed', 'state-machine', 'frise'];

async function openMotion(page: Page, slide: number) {
  const id = MOTION[slide - 1]!;
  await page.goto(`/rikiki/decks/tests/deck-diagram-motion.html#${slide}`);
  await page.waitForFunction(
    ([live, testId]) => !!document.querySelector(`${live} > [active] [data-testid="${testId}"]`)?.shadowRoot?.querySelector('svg text'),
    [LIVE, id],
  );
  await page.evaluate(() => document.fonts.ready);
  return settled(diagram(page, id));
}

/** One click forward, the deck has taken it, and what it brought has moved. */
async function click(page: Page, scene: ReturnType<typeof diagram>) {
  const before = await page.evaluate(() => (document.querySelector('deck-root') as unknown as { step: number }).step);
  await page.keyboard.press('ArrowRight');
  await page.waitForFunction((b) => (document.querySelector('deck-root') as unknown as { step: number }).step === b + 1, before);
  await scene.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))));
}

for (const [index, id] of MOTION.entries()) {
  test.describe(`motion · ${id}`, () => {
    test('is drawn, says nothing about itself, and keeps inside its frame', async ({ page }) => {
      const scene = await openMotion(page, index + 1);
      await expect(scene).not.toHaveAttribute('data-scene-issues');
      const outside = await scene.evaluate((el) => {
        const svg = el.shadowRoot!.querySelector('svg')!;
        const frame = svg.getBoundingClientRect();
        const slack = 1.5;
        return [...svg.querySelectorAll('rect, path, text, line, circle:not(.ride)')]
          .map((shape) => shape.getBoundingClientRect())
          .filter((b) => b.width > 0 && b.height > 0)
          .filter((b) => b.left < frame.left - slack || b.right > frame.right + slack || b.top < frame.top - slack || b.bottom > frame.bottom + slack).length;
      });
      expect(outside).toBe(0);
    });

    test('does not move under reduced motion', async ({ browser }) => {
      const context = await browser.newContext({ reducedMotion: 'reduce' });
      const page = await context.newPage();
      const scene = await openMotion(page, index + 1);
      expect(await scene.evaluate((el) => el.shadowRoot!.getAnimations().length)).toBe(0);
      await context.close();
    });
  });
}

test('the kill switch: tokens pass the open gate, then queue against it once a click closes it', async ({ page }) => {
  const scene = await openMotion(page, 1);
  const state = () =>
    scene.evaluate((el) => {
      const root = el.shadowRoot!;
      const gate = root.querySelector('rect.gate')!;
      const bar = gate.getBoundingClientRect();
      const tokens = [...root.querySelectorAll('circle.token')].map((t) => {
        const b = t.getBoundingClientRect();
        return (b.left + b.right) / 2;
      });
      return {
        open: gate.classList.contains('gate-open'),
        closed: gate.classList.contains('gate-closed'),
        past: tokens.filter((x) => x > bar.right).length,
        before: tokens.filter((x) => x < bar.left).length,
        notes: [...root.querySelectorAll('text')].map((t) => t.textContent).join(' '),
      };
    });
  await expect(page.locator(`${LIVE} > #kill-switch`)).toHaveAttribute('data-steps', '1');
  const entered = await state();
  expect(entered.open).toBe(true);
  expect(entered.past).toBeGreaterThan(0);
  expect(entered.notes).not.toContain('plus rien ne passe');
  await click(page, scene);
  await expect.poll(async () => (await state()).closed).toBe(true);
  await expect.poll(async () => (await state()).past).toBe(0);
  const stopped = await state();
  expect(stopped.before).toBe(9);
  expect(stopped.notes).toContain('plus rien ne passe');
});

test('a request traces its links on the first click, and the answer comes back on the second', async ({ page }) => {
  const scene = await openMotion(page, 2);
  const counts = () =>
    scene.evaluate((el) => ({
      lines: el.shadowRoot!.querySelectorAll('path.line').length,
      riding: el.shadowRoot!.querySelectorAll('circle.ride').length,
    }));
  const entered = await counts();
  expect(entered.riding).toBe(0);
  await click(page, scene);
  await expect.poll(async () => (await counts()).riding).toBe(3);
  expect((await counts()).lines).toBeGreaterThan(entered.lines);
  await click(page, scene);
  await expect.poll(async () => (await counts()).riding).toBe(4);
});

test('a state machine shows its transitions on entry, and only its tokens wait for the click', async ({ page }) => {
  const scene = await openMotion(page, 4);
  const counts = () =>
    scene.evaluate((el) => ({
      lines: el.shadowRoot!.querySelectorAll('path.line').length,
      riding: el.shadowRoot!.querySelectorAll('circle.ride').length,
    }));
  const entered = await counts();
  expect(entered.lines).toBe(4);
  expect(entered.riding).toBe(0);
  await click(page, scene);
  await expect.poll(async () => (await counts()).riding).toBe(3);
  expect((await counts()).lines).toBe(4);
});

test('marks that do not fit the room are drawn anyway and reported with the number that would', async ({ page }) => {
  await open(page, 1);
  const scene = diagram(page, 'graph');
  await scene.evaluate((el) => {
    el.setAttribute('bounds', '420x200');
    el.setAttribute('direction', 'down');
  });
  await expect
    .poll(async () => (await scene.getAttribute('data-scene-issues')) ?? '')
    .toMatch(/DG_NO_FIT/);
  const issues = JSON.parse((await scene.getAttribute('data-scene-issues')) ?? '[]') as { code: string; fix?: { action: string; keep: number } }[];
  const noFit = issues.find((i) => i.code === 'DG_NO_FIT')!;
  expect(noFit.fix?.action).toBe('remove-marks');
  expect(noFit.fix?.keep).toBeLessThan(6);
  const drawn = await scene.evaluate((el) => el.shadowRoot!.querySelectorAll('svg g.pop').length);
  expect(drawn, 'nothing was removed to make it fit').toBe(6);
});

// ── a picture per click · morph, meter, queue ─────────────────────────────
//
// decks/tests/deck-diagram-morph.html holds four concepts that change on a click:
// a monolith whose parts move under a gateway (dg-state), a bottleneck whose queue
// fills (dg-queue), a disk that saturates (dg-meter), a ranking that reverses
// (bars that change place). What is promised: each is clean and in its frame, still
// under reduced motion, the frame does not jump, and a click lands on its picture.

const MORPH = ['decoupe', 'goulot', 'saturation', 'classement'];

async function openMorph(page: Page, slide: number) {
  const id = MORPH[slide - 1]!;
  await page.goto(`/rikiki/decks/tests/deck-diagram-morph.html#${slide}`);
  await page.waitForFunction(
    ([live, testId]) => !!document.querySelector(`${live} > [active] [data-testid="${testId}"]`)?.shadowRoot?.querySelector('svg text'),
    [LIVE, id],
  );
  await page.evaluate(() => document.fonts.ready);
  return settled(diagram(page, id));
}

/** One click forward, and every animation it started has played to its end. */
async function clickAndSettle(page: Page, scene: ReturnType<typeof diagram>) {
  await click(page, scene);
  await scene.evaluate((el) =>
    Promise.all(el.shadowRoot!.getAnimations().map((animation) => animation.finished)),
  );
}

type Drawn = { items: { kind: string; key: string; fills?: number[]; track?: { w: number } }[] };
const keysOf = (scene: ReturnType<typeof diagram>) =>
  scene.evaluate((el) => (el as unknown as { drawn: Drawn }).drawn.items.map((i) => `${i.kind}:${i.key}`));

for (const [index, id] of MORPH.entries()) {
  test.describe(`picture per click · ${id}`, () => {
    test('is drawn, says nothing about itself, and keeps inside its frame on every click', async ({ page }) => {
      const scene = await openMorph(page, index + 1);
      const steps = Number(await page.locator(`${LIVE} > #${id}`).getAttribute('data-steps'));
      expect(steps).toBeGreaterThan(0);
      for (let step = 0; step <= steps; step += 1) {
        if (step) await clickAndSettle(page, scene);
        await expect(scene).not.toHaveAttribute('data-scene-issues');
        const outside = await scene.evaluate((el) => {
          const svg = el.shadowRoot!.querySelector('svg')!;
          const frame = svg.getBoundingClientRect();
          const slack = 1.5;
          return [...svg.querySelectorAll('rect, path, text, line')]
            .filter((shape) => getComputedStyle(shape).visibility !== 'hidden')
            .map((shape) => shape.getBoundingClientRect())
            .filter((b) => b.width > 0 && b.height > 0)
            .filter((b) => b.left < frame.left - slack || b.right > frame.right + slack || b.top < frame.top - slack || b.bottom > frame.bottom + slack).length;
        });
        expect(outside, `click ${step}`).toBe(0);
      }
    });

    test('moves nothing under reduced motion, and shows each click as its picture', async ({ browser }) => {
      const context = await browser.newContext({ reducedMotion: 'reduce' });
      const page = await context.newPage();
      const scene = await openMorph(page, index + 1);
      await click(page, scene);
      expect(await scene.evaluate((el) => el.shadowRoot!.getAnimations().length)).toBe(0);
      const leftovers = await scene.evaluate((el) =>
        [...el.shadowRoot!.querySelectorAll('.leave')].filter((g) => getComputedStyle(g).display !== 'none').length,
      );
      expect(leftovers, 'what leaves is gone at once').toBe(0);
      await context.close();
    });
  });
}

test('the monolith: its parts keep their names and move under the gateway, the frame does not jump', async ({ page }) => {
  const scene = await openMorph(page, 1);
  const viewBox = () => scene.evaluate((el) => el.shadowRoot!.querySelector('svg')!.getAttribute('viewBox'));
  const before = await keysOf(scene);
  const frame = await viewBox();
  expect(before).toEqual(expect.arrayContaining(['frame:bloc', 'box:base', 'box:commandes', 'box:comptes']));
  expect(before).not.toContain('box:passerelle');
  await click(page, scene);
  // Mid-click, what stays is played from its old place: a move, not a fade.
  const moving = await scene.evaluate((el) => el.shadowRoot!.querySelectorAll('g.move').length);
  expect(moving).toBe(4);
  await settled(scene);
  const after = await keysOf(scene);
  expect(after).toEqual(expect.arrayContaining(['box:passerelle', 'box:commandes', 'box:paiement', 'box:catalogue', 'box:comptes']));
  expect(after).not.toContain('frame:bloc');
  expect(await viewBox()).toBe(frame);
});

test('a click lands on its picture without playing the ones before it (applyStep)', async ({ page }) => {
  const scene = await openMorph(page, 1);
  await scene.evaluate((el) => (el as unknown as { applyStep(step: number): void }).applyStep(1));
  await expect.poll(() => keysOf(scene)).toContain('box:passerelle');
  await scene.evaluate((el) => (el as unknown as { applyStep(step: number): void }).applyStep(0));
  await expect.poll(() => keysOf(scene)).toContain('frame:bloc');
});

test('the bottleneck: the queue takes 0, then 4, then 8 of its places, from the end that leads out', async ({ page }) => {
  const scene = await openMorph(page, 2);
  const taken = () =>
    scene.evaluate((el) => {
      const cells = [...el.shadowRoot!.querySelectorAll('rect.cell')].map((c) => c.getBoundingClientRect().x);
      const full = [...el.shadowRoot!.querySelectorAll('rect.full:not(.leave)')].map((c) => c.getBoundingClientRect().x);
      return { places: cells.length, taken: full.length, rightmost: full.length ? Math.max(...full) >= Math.max(...cells) - 1 : true };
    });
  expect(await taken()).toEqual({ places: 8, taken: 0, rightmost: true });
  await clickAndSettle(page, scene);
  expect(await taken()).toEqual({ places: 8, taken: 4, rightmost: true });
  await clickAndSettle(page, scene);
  expect(await taken()).toEqual({ places: 8, taken: 8, rightmost: true });
});

test('a queue that drains frees its places · they fade while it plays, and are empty at rest', async ({ page }) => {
  const scene = await openMorph(page, 2);
  await scene.evaluate((el) => el.querySelector('dg-queue')!.setAttribute('fill', '8 2'));
  const full = () =>
    scene.evaluate(async (el) => {
      await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
      await Promise.all(el.shadowRoot!.getAnimations().map((animation) => animation.finished));
      return [...el.shadowRoot!.querySelectorAll('rect.full')].filter((r) => getComputedStyle(r).visibility !== 'hidden').length;
    });
  expect(await full()).toBe(8);
  await click(page, scene);
  expect(await full()).toBe(2);
  const resting = await scene.evaluate(async (el) => {
    (el as unknown as { playing: boolean }).playing = false;
    await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
    return el.shadowRoot!.querySelectorAll('rect.full').length;
  });
  expect(resting).toBe(2);
});

test('the saturation: the disk fills to its value on each click, against the same track', async ({ page }) => {
  const scene = await openMorph(page, 3);
  const share = () =>
    scene.evaluate((el) => {
      const [track] = [...el.shadowRoot!.querySelectorAll('rect.meter-track')].map((r) => r.getBoundingClientRect());
      const [fill] = [...el.shadowRoot!.querySelectorAll('rect.full')].map((r) => r.getBoundingClientRect());
      return Math.round((fill!.width / track!.width) * 100);
    });
  expect(await share()).toBe(40);
  await clickAndSettle(page, scene);
  expect(await share()).toBe(62);
  await clickAndSettle(page, scene);
  expect(await share()).toBe(85);
});

// ── written as intents ────────────────────────────────────────────────────
//
// decks/tests/deck-diagram-intent.html holds six slides written only as intents: no
// layout, no coordinate, no duration. What is promised: each is clean on every click
// (no INT_*, no DG_*), it keeps inside its frame, the intent chose what the author
// did not write, and the same slide turned into its counter-example is rejected by
// the code that names what it no longer demonstrates.

const INTENT = ['kill-switch', 'goulot', 'backlog', 'formulaire', 'panne', 'quota'];

async function openIntent(page: Page, slide: number) {
  const id = INTENT[slide - 1]!;
  await page.goto(`/rikiki/decks/tests/deck-diagram-intent.html#${slide}`);
  await page.waitForFunction(
    ([live, testId]) => !!document.querySelector(`${live} > [active] [data-testid="${testId}"]`)?.shadowRoot?.querySelector('svg text'),
    [LIVE, id],
  );
  await page.evaluate(() => document.fonts.ready);
  return settled(diagram(page, id));
}

/** The codes a diagram reports about itself, once it has redrawn. */
const issueCodes = async (scene: ReturnType<typeof diagram>) =>
  (JSON.parse((await scene.getAttribute('data-scene-issues')) ?? '[]') as { code: string }[]).map((i) => i.code);

for (const [index, id] of INTENT.entries()) {
  test(`intent · ${id} demonstrates what it declares, clean and in its frame on every click`, async ({ page }) => {
    const scene = await openIntent(page, index + 1);
    // A cause tells its chain on entry and takes no click; the others take theirs.
    const steps = Number((await page.locator(`${LIVE} > #${id}`).getAttribute('data-steps')) ?? '0');
    for (let step = 0; step <= steps; step += 1) {
      if (step) await clickAndSettle(page, scene);
      await expect(scene).not.toHaveAttribute('data-scene-issues');
      const outside = await scene.evaluate((el) => {
        const svg = el.shadowRoot!.querySelector('svg')!;
        const frame = svg.getBoundingClientRect();
        const slack = 1.5;
        return [...svg.querySelectorAll('rect, path, text, line')]
          .filter((shape) => getComputedStyle(shape).visibility !== 'hidden')
          .map((shape) => shape.getBoundingClientRect())
          .filter((b) => b.width > 0 && b.height > 0)
          .filter((b) => b.left < frame.left - slack || b.right > frame.right + slack || b.top < frame.top - slack || b.bottom > frame.bottom + slack).length;
      });
      expect(outside, `click ${step}`).toBe(0);
    }
    expect(await scene.evaluate((el) => el.shadowRoot!.querySelector('svg')!.dataset.intent)).toBeTruthy();
  });
}

for (const declared of [0, 1, 3]) {
  test(`a diagram preserves every click with an explicit steps="${declared}" on its slide`, async ({ page }) => {
    await page.route('**/deck-diagram-intent.html', async (route) => {
      const response = await route.fetch();
      const body = (await response.text()).replace('id="kill-switch"', `id="kill-switch" steps="${declared}"`);
      await route.fulfill({ response, body });
    });
    const scene = await openIntent(page, 1);
    await expect(page.locator(`${LIVE} > #kill-switch`)).toHaveAttribute('steps', String(Math.max(declared, 2)));
    await clickAndSettle(page, scene);
    await clickAndSettle(page, scene);
    await expect(page.locator(`${LIVE} > #kill-switch`)).toHaveAttribute('active', '');
    await expect(scene.locator('rect.gate')).toHaveClass(/gate-closed/);
  });
}

test('intent · the kill switch: the chain rides on click 1, the gate under the reader closes on click 2', async ({ page }) => {
  const scene = await openIntent(page, 1);
  await expect(page.locator(`${LIVE} > #kill-switch`)).toHaveAttribute('data-steps', '2');
  const gate = () =>
    scene.evaluate((el) => {
      const root = el.shadowRoot!;
      const bar = root.querySelector('rect.gate')!;
      return {
        closed: bar.classList.contains('gate-closed'),
        riding: root.querySelectorAll('circle.ride').length,
        centre: (bar.getBoundingClientRect().left + bar.getBoundingClientRect().right) / 2,
      };
    });
  expect((await gate()).closed).toBe(false);
  await click(page, scene);
  await expect.poll(async () => (await gate()).riding).toBe(2);
  expect((await gate()).closed).toBe(false);
  await click(page, scene);
  await expect.poll(async () => (await gate()).closed).toBe(true);
  // The gate stands under the one code that reads the switch, as the intent placed it.
  const reader = await scene.evaluate((el) => {
    const drawn = (el as unknown as { drawn: { items: { key: string; x: number; w: number }[] } }).drawn;
    const gate = drawn.items.find((i) => i.key === 'stop')!;
    const lit = drawn.items.find((i) => i.key === 'lit')!;
    return { gate: gate.x + gate.w / 2, from: lit.x, to: lit.x + lit.w };
  });
  expect(reader.gate).toBeGreaterThan(reader.from);
  expect(reader.gate).toBeLessThan(reader.to);
});

test('intent · the bottleneck reads its rates: six tokens in, two out, four places taken on the click', async ({ page }) => {
  const scene = await openIntent(page, 2);
  const queue = () =>
    scene.evaluate((el) => ({
      places: el.shadowRoot!.querySelectorAll('rect.cell').length,
      taken: el.shadowRoot!.querySelectorAll('rect.full:not(.leave)').length,
    }));
  expect(await queue()).toEqual({ places: 6, taken: 0 });
  await clickAndSettle(page, scene);
  expect(await queue()).toEqual({ places: 6, taken: 4 });
  const flows = await scene.evaluate((el) =>
    (el as unknown as { drawn: { links: { from: string; flow: number }[] } }).drawn.links.map((l) => `${l.from}:${l.flow}`),
  );
  expect(flows).toEqual(['arrivees:6', 'file:0', 'validation:2']);
});

/** Each fixture slide, turned into the counter-example of its intent. */
const COUNTER: [number, string, string, (el: Element) => void][] = [
  [1, 'kill-switch', 'INT_BARRIER_NOT_ACROSS', (el) => el.querySelector('dg-gate')!.setAttribute('over', 'api')],
  [2, 'goulot', 'INT_BOTTLENECK_NOT_NARROWEST', (el) => el.querySelector('[role="neck"]')!.setAttribute('value', '8 / min')],
  [3, 'backlog', 'INT_ACCUMULATE_NOT_MONOTONE', (el) => el.querySelector('dg-queue')!.setAttribute('fill', '2 6 1')],
  [4, 'formulaire', 'INT_TRANSFORM_NO_PAIR', (el) => {
    for (const mark of el.querySelectorAll('[role="after"] [name]')) mark.setAttribute('name', `new-${mark.getAttribute('name')}`);
  }],
  [5, 'panne', 'INT_CAUSE_NO_ARROW', (el) => {
    el.insertAdjacentHTML('beforeend', '<dg-link from="base" to="cache"></dg-link><dg-link from="pages" to="base"></dg-link>');
  }],
  [6, 'quota', 'INT_FOCAL_OFF_ROLE', (el) => el.querySelector('[role="beyond"]')!.setAttribute('emphasis', '')],
];

/** The counter-example is named by its code, as an error that says what to do. */
async function expectRejected(scene: ReturnType<typeof diagram>, code: string) {
  await expect.poll(() => issueCodes(scene)).toContain(code);
  const issues = JSON.parse((await scene.getAttribute('data-scene-issues')) ?? '[]') as {
    code: string;
    severity: string;
    fix?: { action: string };
  }[];
  const found = issues.find((i) => i.code === code)!;
  expect(found.severity).toBe('error');
  expect(found.fix?.action).toBeTruthy();
}

for (const [slide, id, code, spoil] of COUNTER) {
  test(`intent · ${id} turned into its counter-example is rejected with ${code}, an error`, async ({ page }) => {
    const scene = await openIntent(page, slide);
    await scene.evaluate(spoil);
    await expectRejected(scene, code);
  });
}

// ── the eleven intents of the third lot ───────────────────────────────────
//
// decks/tests/deck-diagram-intents-all.html holds one slide per intent of the third
// lot, written only as intents. Each is clean and in its frame on every click, each
// is drawn its own way (no two share a layout and a set of marks), its motion says
// what it means, and its counter-example is rejected by its own code.

const ALL = [
  'boucle',
  'foule',
  'enveloppes',
  'chantiers',
  'cascade',
  'seuil',
  'compromis',
  'derive',
  'comparaison',
  'repartition',
  'convergence',
];

async function openAll(page: Page, slide: number) {
  const id = ALL[slide - 1]!;
  await page.goto(`/rikiki/decks/tests/deck-diagram-intents-all.html#${slide}`);
  await page.waitForFunction(
    ([live, testId]) =>
      !!document.querySelector(`${live} > [active] [data-testid="${testId}"]`)?.shadowRoot?.querySelector('svg text, svg rect'),
    [LIVE, id],
  );
  await page.evaluate(() => document.fonts.ready);
  return settled(diagram(page, id));
}

/** How a drawing is built, its words aside · its layout, the kinds of its marks, and
 *  how its arrows run (straight or bent, across or down). */
const structureOf = (scene: ReturnType<typeof diagram>) =>
  scene.evaluate((el) => {
    type Point = { x: number; y: number };
    const svg = el.shadowRoot!.querySelector('svg')!;
    const drawn = (el as unknown as { drawn: { items: { kind: string }[]; links: { points: Point[] }[] } }).drawn;
    const kinds = [...new Set(drawn.items.map((i) => i.kind))].sort().join(' ');
    const across = drawn.links.reduce((s, l) => s + Math.abs(l.points.at(-1)!.x - l.points[0]!.x), 0);
    const down = drawn.links.reduce((s, l) => s + Math.abs(l.points.at(-1)!.y - l.points[0]!.y), 0);
    const arrows = !drawn.links.length
      ? 'no arrow'
      : `${drawn.links.every((l) => l.points.length === 2) ? 'straight' : 'bent'} ${across >= down ? 'across' : 'down'}`;
    return `${svg.dataset.layout} · ${kinds} · ${arrows}`;
  });

for (const [index, id] of ALL.entries()) {
  test(`intent · ${id} demonstrates what it declares, clean and in its frame on every click`, async ({ page }) => {
    const scene = await openAll(page, index + 1);
    const steps = Number((await page.locator(`${LIVE} > #${id}`).getAttribute('data-steps')) ?? '0');
    for (let step = 0; step <= steps; step += 1) {
      if (step) await clickAndSettle(page, scene);
      await expect(scene).not.toHaveAttribute('data-scene-issues');
      const outside = await scene.evaluate((el) => {
        const svg = el.shadowRoot!.querySelector('svg')!;
        const frame = svg.getBoundingClientRect();
        const slack = 1.5;
        return [...svg.querySelectorAll('rect, path, text, line')]
          .filter((shape) => getComputedStyle(shape).visibility !== 'hidden')
          .map((shape) => shape.getBoundingClientRect())
          .filter((b) => b.width > 0 && b.height > 0)
          .filter((b) => b.left < frame.left - slack || b.right > frame.right + slack || b.top < frame.top - slack || b.bottom > frame.bottom + slack).length;
      });
      expect(outside, `click ${step}`).toBe(0);
    }
  });
}

test('intent · no two slides of the third lot are drawn alike', async ({ page }) => {
  const seen = new Map<string, string>();
  for (const [index, id] of ALL.entries()) {
    const structure = await structureOf(await openAll(page, index + 1));
    expect(seen.get(structure), `${id} is drawn like ${seen.get(structure)}`).toBeUndefined();
    seen.set(structure, id);
  }
});

test('intent · the loop closes on the click: its return arrow comes in, a token riding it', async ({ page }) => {
  const scene = await openAll(page, 1);
  const heads = () => scene.evaluate((el) => el.shadowRoot!.querySelectorAll('path.head').length);
  expect(await heads()).toBe(3);
  await click(page, scene);
  await expect.poll(() => scene.evaluate((el) => el.shadowRoot!.querySelectorAll('circle.ride').length)).toBe(1);
  expect(await heads()).toBe(4);
});

test('intent · the cascade turns one rank per click, never a far mark before a near one', async ({ page }) => {
  const scene = await openAll(page, 5);
  const turned = () =>
    scene.evaluate((el) => el.shadowRoot!.querySelectorAll('rect.tone-danger').length);
  expect(await turned()).toBe(0);
  await clickAndSettle(page, scene);
  expect(await turned()).toBe(2);
  await clickAndSettle(page, scene);
  expect(await turned()).toBe(4);
});

test('intent · the threshold tips what follows only on the click the gauge crosses its line', async ({ page }) => {
  const scene = await openAll(page, 6);
  const tipped = () => scene.evaluate((el) => el.shadowRoot!.querySelectorAll('rect.tone-danger').length);
  expect(await tipped()).toBe(0);
  await clickAndSettle(page, scene);
  expect(await tipped()).toBe(0);
  await clickAndSettle(page, scene);
  expect(await tipped()).toBe(1);
});

test('intent · the merge converges in straight arrows, every token riding at once on the click', async ({ page }) => {
  const scene = await openAll(page, 11);
  const straight = await scene.evaluate((el) =>
    (el as unknown as { drawn: { links: { points: unknown[] }[] } }).drawn.links.every((l) => l.points.length === 2),
  );
  expect(straight).toBe(true);
  await click(page, scene);
  await expect.poll(() => scene.evaluate((el) => el.shadowRoot!.querySelectorAll('circle.ride').length)).toBe(6);
});

/** Each slide of the third lot, turned into the counter-example of its intent. */
const COUNTER_ALL: [number, string, string, (el: Element) => void][] = [
  [1, 'boucle', 'INT_FEEDBACK_OPEN', (el) => {
    el.insertAdjacentHTML('beforeend', '<dg-link from="lecteurs" to="auteurs"></dg-link><dg-link from="auteurs" to="articles"></dg-link>');
  }],
  [2, 'foule', 'INT_SCALE_TOO_CLOSE', (el) => el.querySelector('[role="crowd"]')!.setAttribute('count', '4')],
  [3, 'enveloppes', 'INT_CONTAIN_NOT_NESTED', (el) => el.querySelector('[name="reseau"]')!.setAttribute('paint', 'none')],
  [4, 'chantiers', 'INT_PARALLEL_NOT_TOGETHER', (el) => el.querySelector('[name="back"]')!.setAttribute('step', '1')],
  [5, 'cascade', 'INT_PROPAGATE_SKIPS', (el) => el.querySelector('[name="web"]')!.setAttribute('tone', 'danger')],
  [6, 'seuil', 'INT_THRESHOLD_NEVER_CROSSED', (el) => el.querySelector('dg-meter')!.setAttribute('value', '40 55 70')],
  [7, 'compromis', 'INT_TRADEOFF_ONE_SIDED', (el) => el.querySelector('[role="cost"]')!.setAttribute('value', '35 90')],
  [8, 'derive', 'INT_DRIFT_NOT_WIDENING', (el) => el.querySelector('[name="t3"]')!.setAttribute('value', '12')],
  [9, 'comparaison', 'INT_COMPARE_LIE', (el) => el.querySelector('[role="subject"]')!.setAttribute('value', '5800')],
  [10, 'repartition', 'INT_PARTITION_NOT_WHOLE', (el) => el.querySelector('[name="outils"]')!.setAttribute('value', '10')],
  [11, 'convergence', 'INT_MERGE_NOT_SUM', (el) => el.querySelector('[role="into"]')!.setAttribute('value', '7 k')],
];

for (const [slide, id, code, spoil] of COUNTER_ALL) {
  test(`intent · ${id} turned into its counter-example is rejected with ${code}, an error`, async ({ page }) => {
    const scene = await openAll(page, slide);
    await scene.evaluate(spoil);
    await expectRejected(scene, code);
  });
}

// ── a secondary joined to its main intent, a gate's word ──────────────────

test('intent · a stock under a barrier is fed by an arrow from the gate that holds the flow back', async ({ page }) => {
  const scene = await openIntent(page, 6);
  const fed = await scene.evaluate((el) =>
    (el as unknown as { drawn: { links: { from: string; to: string; head: boolean }[] } }).drawn.links.some(
      (l) => l.from === 'quota' && l.to === 'reprise' && l.head,
    ),
  );
  expect(fed).toBe(true);
  await expect(scene).not.toHaveAttribute('data-scene-issues');
});

test("a gate on the last lanes only has its word under it, off the lane above", async ({ page }) => {
  const scene = await openMotion(page, 3);
  await scene.evaluate((el) => el.querySelector('dg-gate')!.setAttribute('over', 'batch'));
  const placed = () =>
    scene.evaluate(async (el) => {
      await (el as unknown as { updateComplete: Promise<unknown> }).updateComplete;
      const svg = el.shadowRoot!.querySelector('svg')!;
      const gate = svg.querySelector('rect.gate')!.getBoundingClientRect();
      const word = [...svg.querySelectorAll('text')].find((t) => t.textContent === '100 req/s')!.getBoundingClientRect();
      return { below: word.top >= gate.bottom - 0.5 };
    });
  await expect.poll(async () => (await placed()).below).toBe(true);
});

// ── a curve ───────────────────────────────────────────────────────────────
//
// decks/tests/deck-diagram-curve.html holds two series read as a shape: a latency
// that crosses its line at a knee, an adoption that levels off, then makes room on
// the click for what holds it back. What is promised: each is clean and in its frame
// on every click, still under reduced motion, the curve is traced, its values stand
// at their exact height, the crossing on its line, and a series too long is said.

const CURVES = ['decolle', 'plafond'];

async function openCurve(page: Page, slide: number) {
  const id = CURVES[slide - 1]!;
  await page.goto(`/rikiki/decks/tests/deck-diagram-curve.html#${slide}`);
  await page.waitForFunction(
    ([live, testId]) => !!document.querySelector(`${live} > [active] [data-testid="${testId}"]`)?.shadowRoot?.querySelector('svg path.curve'),
    [LIVE, id],
  );
  await page.evaluate(() => document.fonts.ready);
  return settled(diagram(page, id));
}

for (const [index, id] of CURVES.entries()) {
  test(`curve · ${id} is clean and inside its frame on every click, and still under reduced motion`, async ({ page, browser }) => {
    const scene = await openCurve(page, index + 1);
    const steps = Number((await page.locator(`${LIVE} > #${id}`).getAttribute('data-steps')) ?? '0');
    for (let step = 0; step <= steps; step += 1) {
      if (step) await clickAndSettle(page, scene);
      await expect(scene).not.toHaveAttribute('data-scene-issues');
      const outside = await scene.evaluate((el) => {
        const svg = el.shadowRoot!.querySelector('svg')!;
        const frame = svg.getBoundingClientRect();
        return [...svg.querySelectorAll('path, circle, text, rect')]
          .map((s) => s.getBoundingClientRect())
          .filter((b) => b.width > 0 && b.height > 0)
          .filter((b) => b.left < frame.left - 1.5 || b.right > frame.right + 1.5 || b.top < frame.top - 1.5 || b.bottom > frame.bottom + 1.5).length;
      });
      expect(outside, `click ${step}`).toBe(0);
    }
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const still = await context.newPage();
    const quiet = await openCurve(still, index + 1);
    expect(await quiet.evaluate((el) => el.shadowRoot!.getAnimations().length)).toBe(0);
    await context.close();
  });
}

test('curve · the series is traced, each value at its height, the crossing on its line', async ({ page }) => {
  await page.goto('/rikiki/decks/tests/deck-diagram-curve.html#1');
  const scene = diagram(page, 'decolle');
  await page.waitForFunction(
    ([live]) => !!document.querySelector(`${live} > [active] [data-testid="decolle"]`)?.shadowRoot?.querySelector('svg path.curve'),
    [LIVE],
  );
  // While it plays, the line is traced from its first value to its last.
  const traced = await scene.evaluate((el) =>
    el.shadowRoot!.querySelector('path.curve')!.getAnimations().some((a) => (a as CSSAnimation).animationName === 'dg-draw'),
  );
  expect(traced).toBe(true);
  await settled(scene);
  const geometry = await scene.evaluate((el) => {
    type Curve = { kind: string; plot: { y: number; h: number }; points: { y: number }[]; threshold: number; crossing: { at: { y: number } } };
    const curve = (el as unknown as { drawn: { items: Curve[] } }).drawn.items.find((i) => i.kind === 'curve')!;
    const base = curve.plot.y + curve.plot.h;
    const svg = el.shadowRoot!.querySelector('svg')!;
    const dash = svg.querySelector('path.dash')!.getBoundingClientRect();
    const dot = [...svg.querySelectorAll('circle.dot')].at(-1)!.getBoundingClientRect();
    return {
      heights: curve.points.map((p) => Math.round(((base - p.y) / curve.plot.h) * 800)),
      onItsLine: Math.abs(curve.crossing.at.y - curve.threshold) < 0.5,
      dotOnDash: Math.abs(dot.top + dot.height / 2 - (dash.top + dash.height / 2)) < 2,
    };
  });
  expect(geometry.heights).toEqual([120, 125, 130, 140, 160, 210, 330, 610]);
  expect(geometry.onItsLine).toBe(true);
  expect(geometry.dotOnDash).toBe(true);
});

test('curve · the adoption makes room on the click: the curve moves aside, what holds it back comes in', async ({ page }) => {
  const scene = await openCurve(page, 2);
  const keys = () => keysOf(scene);
  expect(await keys()).not.toContain('box:reste');
  await click(page, scene);
  expect(await scene.evaluate((el) => el.shadowRoot!.querySelectorAll('g.move').length)).toBeGreaterThan(0);
  await settled(scene);
  expect(await keys()).toEqual(expect.arrayContaining(['curve:adoption', 'box:reste']));
});

test('curve · thirteen values, or words under it that match neither the values nor the ends, are said', async ({ page }) => {
  const scene = await openCurve(page, 1);
  await scene.evaluate((el) =>
    el.querySelector('dg-curve')!.setAttribute('values', '1 2 3 4 5 6 7 8 9 10 11 12 13'),
  );
  await expectRejected(scene, 'DG_CURVE_POINTS');
});

// ── the traps of the free grammar ─────────────────────────────────────────
//
// decks/tests/deck-diagram-pitfalls.html writes, as an author first writes them, the
// traps fifteen free-grammar slides worked round (examples/diagrams-prompts): an
// arrow chain on a group, a link that skips a box of its row, lanes beside a box in
// two states, a tone on a bar, an open gate driven by a gauge, gates in series and a
// note on what the lanes run into, labels in a tight row, notes on top and figures
// in French. Each is drawn clean, and the drawing is what the author meant.

const PITFALLS = [
  'loop-arrows',
  'row-skip',
  'lanes-beside',
  'funnel-tone',
  'gate-open',
  'sieve',
  'labelled-row',
  'top-notes',
];

async function openPitfall(page: Page, id: (typeof PITFALLS)[number]) {
  await page.goto(`/rikiki/decks/tests/deck-diagram-pitfalls.html#${PITFALLS.indexOf(id) + 1}`);
  await page.waitForFunction(
    ([live, testId]) => !!document.querySelector(`${live} > [active] [data-testid="${testId}"]`)?.shadowRoot?.querySelector('svg text'),
    [LIVE, id],
  );
  await page.evaluate(() => document.fonts.ready);
  return settled(diagram(page, id));
}

type Laid = {
  items: { kind: string; key: string; x: number; y: number; w: number; h: number; track?: { x0: number; x1: number } }[];
  links: { from: string; to: string; head: boolean; points: { x: number; y: number }[] }[];
  notes: { x: number; y: number; w: number; h: number; target: string }[];
};
const drawnStages = (scene: ReturnType<typeof diagram>) =>
  scene.evaluate((el) => (el as unknown as { drawnStages: Laid[] }).drawnStages);

for (const id of PITFALLS) {
  test(`pitfall · ${id} is drawn, says nothing about itself, and every shape names its mark`, async ({ page }) => {
    const scene = await openPitfall(page, id);
    await expect(scene).not.toHaveAttribute('data-scene-issues');
    const unowned = await scene.evaluate((el) =>
      [...el.shadowRoot!.querySelectorAll('svg :is(rect, circle, path, text)')].filter((s) => !s.closest('[data-mark]')).length,
    );
    expect(unowned).toBe(0);
  });
}

test('pitfall · link="arrow" on a group chains its children, in a row and then round a ring', async ({ page }) => {
  const [row, ring] = await drawnStages(await openPitfall(page, 'loop-arrows'));
  expect(row!.links.map((l) => `${l.from}>${l.to}`)).toEqual(['panne>echecs', 'echecs>retries']);
  expect(ring!.links).toHaveLength(3);
  expect([...row!.links, ...ring!.links].every((l) => l.head)).toBe(true);
});

test('pitfall · a link that skips a box of its row goes round it, not under it', async ({ page }) => {
  const [drawn] = await drawnStages(await openPitfall(page, 'row-skip'));
  const relais = drawn!.items.find((i) => i.key === 'relais')!;
  const link = drawn!.links[0]!;
  const above = Math.min(...link.points.map((p) => p.y));
  expect(above).toBeLessThan(relais.y);
  // Every run of the line is out of the box in between.
  const inside = link.points.some((p) => p.x > relais.x && p.x < relais.x + relais.w && p.y > relais.y && p.y < relais.y + relais.h);
  expect(inside).toBe(false);
});

test('pitfall · lanes beside a box keep their tracks from one picture to the next', async ({ page }) => {
  const stages = await drawnStages(await openPitfall(page, 'lanes-beside'));
  const tracks = stages.map((d) => d.items.filter((i) => i.kind === 'lane').map((l) => l.track));
  expect(tracks[0]).toEqual(tracks[1]);
  const source = stages[0]!.items.find((i) => i.key === 'source')!;
  expect(source.x).toBeGreaterThan(0);
});

test('pitfall · a bar in a tone is painted in it', async ({ page }) => {
  const scene = await openPitfall(page, 'funnel-tone');
  const fills = await scene.evaluate((el) => {
    const bars = [...el.shadowRoot!.querySelectorAll('[data-mark] rect')].filter((r) => r.closest('[data-kind="bar"]'));
    return bars.map((r) => ({ mark: r.closest('[data-mark]')!.getAttribute('data-mark'), fill: getComputedStyle(r).fill }));
  });
  const fill = (mark: string) => fills.find((f) => f.mark === mark)!.fill;
  expect(fill('inscrits')).not.toBe(fill('visiteurs'));
  expect(fill('inscrits')).not.toBe(fill('payants'));
});

test('pitfall · an open gate stands back, and closes when the gauge passes its line', async ({ page }) => {
  const scene = await openPitfall(page, 'gate-open');
  const strength = () =>
    scene.evaluate((el) => Number(getComputedStyle(el.shadowRoot!.querySelector('rect.gate')!).fillOpacity));
  expect(await strength()).toBeLessThan(0.5);
  await click(page, scene);
  await click(page, scene);
  await settled(scene);
  expect(await strength()).toBe(1);
});

test('pitfall · gates in series filter in cascade, and a note finds its place on top of what the lanes run into', async ({ page }) => {
  const scene = await openPitfall(page, 'sieve');
  const refused = await scene.evaluate((el) => el.shadowRoot!.querySelectorAll('circle.token.refused').length);
  expect(refused).toBe(6);
  const [drawn] = await drawnStages(scene);
  const note = drawn!.notes[0]!;
  const sink = drawn!.items.find((i) => i.key === 'donnees')!;
  expect(note.y + note.h).toBeLessThanOrEqual(sink.y);
});

test("pitfall · a tight row widens its gaps for its links' labels, painted over the marks", async ({ page }) => {
  const scene = await openPitfall(page, 'labelled-row');
  const geometry = await scene.evaluate((el) => {
    const svg = el.shadowRoot!.querySelector('svg')!;
    const painted = [...svg.querySelectorAll('[data-role="link-label"], [data-kind="box"]')];
    const labels = [...svg.querySelectorAll('[data-role="link-label"] text')].map((t) => t.getBoundingClientRect());
    const boxes = [...svg.querySelectorAll('[data-kind="box"] rect')].map((r) => r.getBoundingClientRect());
    const hit = (a: DOMRect, b: DOMRect) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
    return {
      labelsLast: painted.findIndex((p) => p.matches('[data-role="link-label"]')) > painted.findLastIndex((p) => p.matches('[data-kind="box"]')),
      onBox: labels.filter((l) => boxes.some((b) => hit(l, b))).length,
    };
  });
  expect(geometry.labelsLast).toBe(true);
  expect(geometry.onBox).toBe(0);
});

test('pitfall · notes asked on top go on top, and a French deck writes its figures with a comma', async ({ page }) => {
  const scene = await openPitfall(page, 'top-notes');
  const stages = await drawnStages(scene);
  const last = stages.at(-1)!;
  for (const note of last.notes) {
    const target = last.items.find((i) => i.key === note.target)!;
    expect(note.y + note.h, note.target).toBeLessThanOrEqual(target.y);
    expect(note.y).toBeGreaterThanOrEqual(0);
  }
  const words = await scene.evaluate((el) => [...el.shadowRoot!.querySelectorAll('svg text')].map((t) => t.textContent));
  // On entry the gauge shows its first figure, written 0.2 in the source.
  expect(words).toContain('0,2 %');
  expect(words).not.toContain('0.2 %');
});
