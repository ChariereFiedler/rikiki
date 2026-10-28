import { expect, test, type Page } from '@playwright/test';

// ════════════════════════════════════════════════════════════════
// deck-scene-* · the promises a scene makes about its own drawing
//
// A scene lays its text out itself, so the failures a hand-drawn SVG has are
// the ones to rule out on the real fonts: a word leaving the drawing, two
// words on top of each other, a long note drawn as if it fitted. Then the
// contract with the engine: play when the slide is entered, rest at the final
// state under reduced motion, redraw when an item changes, re-tint by token.
// ════════════════════════════════════════════════════════════════

const FIXTURES = {
  cards: 2,
  steps: 2,
  flow: 3,
  bars: 2,
  matrix: 2,
  ranges: 2,
  lanes: 3,
  units: 3,
} as const;

/** Ink rounding and anti-aliasing · a box this close to another is touching,
 *  not overlapping. */
const TOLERANCE = 1;

test.beforeEach(async ({ page }) => {
  await page.route('https://fonts.googleapis.com/**', (route) =>
    route.fulfill({ contentType: 'text/css', body: '' }),
  );
});

/** The live deck · the overview keeps a snapshot copy of every slide. */
const LIVE = 'deck-root:not([data-overview-snapshot])';

/** A scene of the live deck · a slide is a direct child of deck-root and a
 *  scene a direct child of its slide, which leaves out the overview copies. */
const sceneById = (page: Page, testId: string) => page.locator(`${LIVE} > * > [data-testid="${testId}"]`);

/** Open a fixture on one slide and wait for its scene to have drawn text. */
async function openScene(page: Page, name: string, slide: number) {
  await page.goto(`/rikiki/decks/tests/deck-scene-${name}.html#${slide}`);
  await page.waitForFunction(
    ([live, tag]) => {
      const scene = document.querySelector(`${live} > [active] ${tag}`);
      return !!scene?.shadowRoot?.querySelector('svg text');
    },
    [LIVE, `deck-scene-${name}`],
  );
  await page.evaluate(() => document.fonts.ready);
}

interface Box {
  text: string;
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/** Every text box of the active slide's scene, and the drawing's own box. */
function textBoxes(page: Page, name: string) {
  return page.evaluate(([live, tag]) => {
    const scene = document.querySelector(`${live} > [active] ${tag}`)!;
    const svg = scene.shadowRoot!.querySelector('svg')!;
    const box = (r: DOMRect) => ({ left: r.left, top: r.top, right: r.right, bottom: r.bottom });
    const texts = [...svg.querySelectorAll('text')]
      .filter((t) => (t.textContent ?? '').trim() !== '')
      .map((t) => ({ text: t.textContent ?? '', ...box(t.getBoundingClientRect()) }));
    return { drawing: box(svg.getBoundingClientRect()), texts };
  }, [LIVE, `deck-scene-${name}`]);
}

const overlaps = (a: Box, b: Box) =>
  a.left < b.right - TOLERANCE &&
  b.left < a.right - TOLERANCE &&
  a.top < b.bottom - TOLERANCE &&
  b.top < a.bottom - TOLERANCE;

test.describe('the layout keeps every word readable', () => {
  // Geometry at the final state · a popping card is mid-scale for half a second.
  test.use({ contextOptions: { reducedMotion: 'reduce' } });

  for (const [name, slides] of Object.entries(FIXTURES)) {
    for (let slide = 1; slide <= slides; slide++) {
      test(`${name} · slide ${slide} · no text leaves the drawing or covers another`, async ({ page }) => {
        await openScene(page, name, slide);
        // Whether a text fits depends on the font, and the web font is stubbed
        // here · what must hold in every font is that nothing collides.
        const { drawing, texts } = await textBoxes(page, name);

        for (const t of texts) {
          expect(t.left, `"${t.text}" starts inside the drawing`).toBeGreaterThanOrEqual(drawing.left - TOLERANCE);
          expect(t.right, `"${t.text}" ends inside the drawing`).toBeLessThanOrEqual(drawing.right + TOLERANCE);
          expect(t.top, `"${t.text}" is below the drawing's top`).toBeGreaterThanOrEqual(drawing.top - TOLERANCE);
          expect(t.bottom, `"${t.text}" is above the drawing's bottom`).toBeLessThanOrEqual(drawing.bottom + TOLERANCE);
        }
        const collisions = texts.flatMap((a, i) =>
          texts.slice(i + 1).filter((b) => overlaps(a, b)).map((b) => `"${a.text}" × "${b.text}"`),
        );
        expect(collisions, 'no two texts overlap').toEqual([]);
      });
    }
  }
});

test('lane labels and notes keep a gap with a tall fallback font', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openScene(page, 'lanes', 2);
  // Font metrics differ on the browser runner. Keep that condition portable:
  // use a shipped face with taller ascent/descent, rather than a system font.
  await page.addStyleTag({ content: `
    @font-face {
      font-family: 'Tall lane fixture';
      src: url('/rikiki/fonts/6xK3dSBYKcSV-LCoeQqfX1RYOo3qOK7l.woff2');
      ascent-override: 120%;
      descent-override: 30%;
    }
    [data-testid="scene-lanes-notes"] { --rik-font-sans: 'Tall lane fixture'; }
  ` });
  const scene = sceneById(page, 'scene-lanes-notes');
  await scene.evaluate(async (el) => {
    await document.fonts.load('31px "Tall lane fixture"');
    const host = el as HTMLElement & { requestUpdate(): void; updateComplete: Promise<boolean> };
    host.requestUpdate();
    await host.updateComplete;
  });
  const { texts } = await textBoxes(page, 'lanes');
  for (const [label, note] of [['Free', 'shared pool'], ['Team', 'per workspace']]) {
    const title = texts.find((t) => t.text === label)!;
    const aside = texts.find((t) => t.text === note)!;
    expect(aside.top - title.bottom, `${label} leaves space before its note`).toBeGreaterThan(0);
  }
});

test('two scene modules in one deck both draw', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  // Each scene is drawn when its slide is shown · both slides are visited, and each
  // module must have drawn its own words, not merely loaded without an error.
  const drawn = [
    { slide: 1, id: 'together-cards', words: ['Cards', 'Steps'] },
    { slide: 2, id: 'together-steps', words: ['load', 'load again'] },
  ];
  for (const { slide, id, words } of drawn) {
    await page.goto(`/rikiki/decks/tests/deck-scene-together.html#${slide}`);
    const scene = sceneById(page, id);
    await expect
      .poll(() => scene.evaluate((el) => [...(el.shadowRoot?.querySelectorAll('text') ?? [])].map((t) => t.textContent?.trim())), {
        message: `${id} draws its items`,
      })
      .toEqual(expect.arrayContaining(words));
  }
  expect(errors, 'no module failed to load').toEqual([]);
});

test('a scene plays when its slide is entered', async ({ page }) => {
  await openScene(page, 'cards', 1);
  const first = sceneById(page, 'scene-cards');
  const second = sceneById(page, 'scene-cards-two');
  await expect(first).toHaveAttribute('playing');
  await expect(second).not.toHaveAttribute('playing');

  await page.keyboard.press('ArrowRight');
  await expect(second).toHaveAttribute('playing');
});

test('the overview thumbnails rest at the final state', async ({ page }) => {
  await openScene(page, 'cards', 1);
  await expect(sceneById(page, 'scene-cards')).toHaveAttribute('playing');
  await page.keyboard.press('o');
  const copies = page.locator('deck-root[data-overview-snapshot] deck-scene-cards');
  await expect(copies.first()).toBeAttached();
  for (const copy of await copies.all()) await expect(copy).not.toHaveAttribute('playing');
});

test('the motion runs inside the drawing, and not at all under reduced motion', async ({ browser }) => {
  for (const reducedMotion of ['no-preference', 'reduce'] as const) {
    const context = await browser.newContext({ reducedMotion });
    const page = await context.newPage();
    await openScene(page, 'cards', 1);
    await expect(sceneById(page, 'scene-cards')).toHaveAttribute('playing');
    const running = await sceneById(page, 'scene-cards').evaluate((scene) => scene.shadowRoot!.getAnimations().length);
    if (reducedMotion === 'reduce') expect(running, 'nothing animates under reduced motion').toBe(0);
    else expect(running, 'the cards pop in').toBeGreaterThan(0);
    await context.close();
  }
});

test('a note too long for its card is named on the scene', async ({ page }) => {
  await openScene(page, 'cards', 1);
  const scene = sceneById(page, 'scene-cards');
  await scene.evaluate((el) => {
    el.querySelectorAll('deck-scene-item')[1]!.setAttribute(
      'note',
      'a note written as a paragraph, which keeps going well past the three lines a card gives it, then keeps going again',
    );
  });
  await expect
    .poll(async () => {
      const issues = JSON.parse((await scene.getAttribute('data-scene-issues')) ?? '[]');
      const long = issues.find((issue: { code: string }) => issue.code === 'SCENE_TEXT_TOO_LONG');
      return long?.fields?.map((f: { item: string; field: string }) => `${f.item}:${f.field}`);
    })
    .toEqual(['UCP:note']);
  await expect(scene).not.toHaveAttribute('data-overflow');
});

test('the scene redraws when an item changes', async ({ page }) => {
  await openScene(page, 'cards', 1);
  const scene = sceneById(page, 'scene-cards');
  await scene.evaluate((el) => el.querySelector('deck-scene-item')!.setAttribute('label', 'Renamed'));
  await expect
    .poll(() => scene.evaluate((el) => [...el.shadowRoot!.querySelectorAll('text')].map((t) => t.textContent)))
    .toContain('Renamed');
});

test('a token re-tints the emphasis without scene CSS', async ({ page }) => {
  await openScene(page, 'cards', 1);
  const scene = sceneById(page, 'scene-cards');
  await scene.evaluate((el) => (el as HTMLElement).style.setProperty('--deck-scene-emphasis-bg', 'rgb(1, 2, 3)'));
  const fill = await scene.evaluate((el) => getComputedStyle(el.shadowRoot!.querySelector('rect.emphasis')!).fill);
  expect(fill).toBe('rgb(1, 2, 3)');
});

// ── deck-scene-lanes · the story is told in tokens and a gate ─────────
test.describe('lanes', () => {
  const SLIDES = [
    { slide: 1, id: 'scene-lanes', lanes: 3, passed: 3, blocked: 3 },
    { slide: 2, id: 'scene-lanes-notes', lanes: 2, passed: 5, blocked: 2 },
    { slide: 3, id: 'scene-lanes-bare', lanes: 4, passed: 2, blocked: 4 },
  ] as const;

  /** Every token and the gate of the live scene, in drawing coordinates. */
  const drawing = (page: Page, id: string) =>
    sceneById(page, id).evaluate((scene) => {
      const root = scene.shadowRoot!;
      const num = (el: Element, name: string) => Number(el.getAttribute(name));
      const gate = root.querySelector('rect.gate')!;
      return {
        gate: { x: num(gate, 'x'), y: num(gate, 'y'), width: num(gate, 'width'), height: num(gate, 'height') },
        dots: [...root.querySelectorAll('circle.dot')].map((dot) => ({
          kind: dot.classList.contains('blocked') ? 'blocked' : 'passed',
          x: num(dot, 'cx'),
          y: num(dot, 'cy'),
          r: num(dot, 'r'),
          opacity: getComputedStyle(dot).opacity,
        })),
        tracks: [...root.querySelectorAll('path.line.muted')].length,
      };
    });

  test.describe('at rest', () => {
    test.use({ contextOptions: { reducedMotion: 'reduce' } });

    for (const { slide, id, lanes, passed, blocked } of SLIDES) {
      test(`slide ${slide} · ${lanes} lanes hold ${passed} served and ${blocked} stopped tokens each`, async ({ page }) => {
        await openScene(page, 'lanes', slide);
        const { dots } = await drawing(page, id);
        expect(dots.filter((d) => d.kind === 'passed')).toHaveLength(lanes * passed);
        expect(dots.filter((d) => d.kind === 'blocked')).toHaveLength(lanes * blocked);
      });

      test(`slide ${slide} · the stopped tokens queue before the gate and the served ones rest beyond it`, async ({ page }) => {
        await openScene(page, 'lanes', slide);
        const { gate, dots } = await drawing(page, id);
        for (const dot of dots.filter((d) => d.kind === 'blocked')) {
          expect(dot.x + dot.r, 'a stopped token stays on the near side').toBeLessThanOrEqual(gate.x);
        }
        for (const dot of dots.filter((d) => d.kind === 'passed')) {
          expect(dot.x - dot.r, 'a served token is past the gate').toBeGreaterThanOrEqual(gate.x + gate.width);
        }
      });

      test(`slide ${slide} · the gate spans every lane, and no token is faded out at rest`, async ({ page }) => {
        await openScene(page, 'lanes', slide);
        const { gate, dots } = await drawing(page, id);
        const ys = [...new Set(dots.map((d) => d.y))].sort((a, b) => a - b);
        expect(ys).toHaveLength(lanes);
        expect(gate.y).toBeLessThan(ys[0]!);
        expect(gate.y + gate.height).toBeGreaterThan(ys.at(-1)!);
        for (const dot of dots) expect(dot.opacity, 'the final state is visible').toBe('1');
      });
    }
  });

  test('the tokens run while the slide plays, and the gate drops with them', async ({ page }) => {
    await openScene(page, 'lanes', 1);
    await expect(sceneById(page, 'scene-lanes')).toHaveAttribute('playing');
    const names = await sceneById(page, 'scene-lanes').evaluate((scene) =>
      scene.shadowRoot!.getAnimations().map((a) => (a as CSSAnimation).animationName),
    );
    expect(names).toContain('lanes-arrive');
    expect(names).toContain('lanes-close');
  });

  test('nothing runs under reduced motion', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();
    await openScene(page, 'lanes', 1);
    await expect(sceneById(page, 'scene-lanes')).toHaveAttribute('playing');
    expect(await sceneById(page, 'scene-lanes').evaluate((s) => s.shadowRoot!.getAnimations().length)).toBe(0);
    await context.close();
  });

  test('a changed count redraws the story', async ({ page }) => {
    await openScene(page, 'lanes', 1);
    const scene = sceneById(page, 'scene-lanes');
    await scene.evaluate((el) => el.setAttribute('blocked', '1'));
    await expect
      .poll(async () => (await drawing(page, 'scene-lanes')).dots.filter((d) => d.kind === 'blocked').length)
      .toBe(3);
  });

  test('a count that is not a number is named, and the default is drawn', async ({ page }) => {
    await openScene(page, 'lanes', 1);
    const scene = sceneById(page, 'scene-lanes');
    await scene.evaluate((el) => el.setAttribute('passed', 'three'));
    await expect(scene).toHaveAttribute('data-scene-issues', /SCENE_VALUE_INVALID/);
    const { dots } = await drawing(page, 'scene-lanes');
    expect(dots.filter((d) => d.kind === 'passed')).toHaveLength(9);
  });
});

// ── deck-scene-units · one cell per person ───────────────────────────
test.describe('units', () => {
  const SLIDES = [
    { slide: 1, id: 'scene-units', total: 200, lit: [200, 0], accent: [true, false] },
    { slide: 2, id: 'scene-units-three', total: 100, lit: [18, 47, 83], accent: [false, false, true] },
    { slide: 3, id: 'scene-units-one', total: 360, lit: [90], accent: [true] },
  ] as const;

  /** Every cell of the live scene, panel by panel · panels are the top-level groups of the grid layer. */
  const cells = (page: Page, id: string) =>
    sceneById(page, id).evaluate((scene) => {
      const rects = [...scene.shadowRoot!.querySelectorAll('rect.cell')];
      const box = (r: Element) => {
        const b = r.getBoundingClientRect();
        return { left: b.left, top: b.top, right: b.right, bottom: b.bottom };
      };
      const panels = new Map<Element, Element[]>();
      for (const rect of rects) {
        const panel = rect.parentElement!.parentElement!;
        panels.set(panel, [...(panels.get(panel) ?? []), rect]);
      }
      return [...panels.values()].map((group) => ({
        count: group.length,
        lit: group.filter((r) => r.classList.contains('on')).length,
        accent: group.some((r) => r.classList.contains('accent')),
        boxes: group.map(box),
      }));
    });

  test.describe('at rest', () => {
    test.use({ contextOptions: { reducedMotion: 'reduce' } });

    for (const { slide, id, total, lit, accent } of SLIDES) {
      test(`slide ${slide} · every grid holds ${total} cells, ${lit.join(' / ')} of them lit`, async ({ page }) => {
        await openScene(page, 'units', slide);
        const panels = await cells(page, id);
        expect(panels.map((p) => p.count)).toEqual(lit.map(() => total));
        expect(panels.map((p) => p.lit)).toEqual([...lit]);
      });

      test(`slide ${slide} · only the emphasised panel is in the accent`, async ({ page }) => {
        await openScene(page, 'units', slide);
        expect((await cells(page, id)).map((p) => p.accent)).toEqual([...accent]);
      });

      test(`slide ${slide} · no two cells of a grid overlap`, async ({ page }) => {
        await openScene(page, 'units', slide);
        for (const panel of await cells(page, id)) {
          const sorted = [...panel.boxes].sort((a, b) => a.left - b.left || a.top - b.top);
          for (let i = 1; i < sorted.length; i++) {
            const a = sorted[i - 1]!;
            const b = sorted[i]!;
            const overlap = a.left < b.right - 0.5 && b.left < a.right - 0.5 && a.top < b.bottom - 0.5 && b.top < a.bottom - 0.5;
            expect(overlap, `cells ${i - 1} and ${i}`).toBe(false);
          }
        }
      });
    }
  });

  test('the cells light column by column while the slide plays', async ({ page }) => {
    await openScene(page, 'units', 1);
    await expect(sceneById(page, 'scene-units')).toHaveAttribute('playing');
    const delays = await sceneById(page, 'scene-units').evaluate((scene) =>
      [...scene.shadowRoot!.querySelectorAll('g.pop')].slice(0, 5).map((g) => (g as SVGElement).style.getPropertyValue('--t0')),
    );
    const seconds = delays.map((d) => Number.parseFloat(d));
    for (let i = 1; i < seconds.length; i++) expect(seconds[i]!).toBeGreaterThan(seconds[i - 1]!);
  });

  test('a value past the total fills the grid and is named', async ({ page }) => {
    await openScene(page, 'units', 3);
    const scene = sceneById(page, 'scene-units-one');
    await scene.evaluate((el) => el.querySelector('deck-scene-item')!.setAttribute('value', '999'));
    await expect(scene).toHaveAttribute('data-scene-issues', /SCENE_VALUE_INVALID/);
    const [panel] = await cells(page, 'scene-units-one');
    expect(panel!.lit).toBe(360);
  });
});

// ── deck-scene · scenes composed on one slide ────────────────────────
test.describe('composition', () => {
  const SLIDES = ['compose-before-after', 'compose-uneven', 'compose-three', 'compose-stack'];

  async function openComposition(page: Page, slide: number) {
    await page.goto(`/rikiki/decks/tests/deck-scene-compose.html#${slide}`);
    await page.waitForFunction(
      ([live, id]) => {
        const scene = document.querySelector(`${live} > [active] [data-testid="${id}"]`);
        const regions = [...(scene?.children ?? [])].filter((c) => c.localName.startsWith('deck-scene-'));
        return regions.length > 0 && regions.every((r) => !!r.shadowRoot?.querySelector('svg text'));
      },
      [LIVE, SLIDES[slide - 1]!],
    );
    await page.evaluate(() => document.fonts.ready);
    return sceneById(page, SLIDES[slide - 1]!);
  }

  /** What each region and the band measure on screen · pixels per drawing unit. */
  const scales = (scene: ReturnType<typeof sceneById>) =>
    scene.evaluate((host) => {
      const hostBox = host.getBoundingClientRect();
      return [...host.children]
        .filter((c) => c.localName.startsWith('deck-scene-'))
        .map((region) => {
          const svg = region.shadowRoot!.querySelector('svg')!;
          const units = Number(svg.getAttribute('viewBox')!.split(' ')[2]);
          const box = svg.getBoundingClientRect();
          return {
            tag: region.localName,
            perUnit: box.width / units,
            left: box.left - hostBox.left,
            right: box.right - hostBox.left,
            hostWidth: hostBox.width,
          };
        });
    });

  for (const [index, id] of SLIDES.entries()) {
    test(`${id}: a unit is the same length in every region, so the type is one size`, async ({ page }) => {
      const scene = await openComposition(page, index + 1);
      const measured = await scales(scene);
      expect(measured.length).toBeGreaterThanOrEqual(2);
      const first = measured[0]!.perUnit;
      for (const region of measured) {
        expect(region.perUnit / first, `${region.tag} against the first region`).toBeGreaterThan(0.995);
        expect(region.perUnit / first, `${region.tag} against the first region`).toBeLessThan(1.005);
      }
    });

    test(`${id}: nothing leaves the host, and a well-written composition reports nothing`, async ({ page }) => {
      const scene = await openComposition(page, index + 1);
      for (const region of await scales(scene)) {
        expect(region.left, `${region.tag} left`).toBeGreaterThanOrEqual(-1);
        expect(region.right, `${region.tag} right`).toBeLessThanOrEqual(region.hostWidth + 1);
      }
      await expect(scene).not.toHaveAttribute('data-scene-issues');
    });
  }

  test('a row fills the host edge to edge, the gutters included', async ({ page }) => {
    const scene = await openComposition(page, 1);
    const [a, b] = await scales(scene);
    expect(a!.left).toBeLessThan(1);
    expect(b!.right).toBeGreaterThan(a!.hostWidth - 1);
    expect(b!.left).toBeGreaterThan(a!.right);
  });

  test('an uneven split gives the regions the shares it names', async ({ page }) => {
    const scene = await openComposition(page, 2);
    const [flow, bars] = await scales(scene);
    const ratio = (flow!.right - flow!.left) / (bars!.right - bars!.left);
    expect(ratio).toBeGreaterThan(1.9);
    expect(ratio).toBeLessThan(2.1);
  });

  test('the scenes enter one after another', async ({ page }) => {
    const scene = await openComposition(page, 1);
    const delays = await scene.evaluate((host) =>
      [...host.children].map((c) => Number.parseFloat(getComputedStyle(c).getPropertyValue('--scene-delay'))),
    );
    expect(delays[0]).toBe(0);
    expect(delays[1]!).toBeGreaterThan(delays[0]!);
    expect(delays[2]!, 'the band closes').toBeGreaterThan(delays[1]!);
  });

  test('a link is drawn in the gutter, and only with a row', async ({ page }) => {
    const scene = await openComposition(page, 1);
    await expect(scene.locator('.link')).toHaveCount(1);
    const stack = await openComposition(page, 4);
    await expect(stack.locator('.link')).toHaveCount(0);
  });

  test('a split that leaves a region too narrow is named, not drawn small', async ({ page }) => {
    const scene = await openComposition(page, 1);
    await scene.evaluate((host) => host.setAttribute('split', '1:5'));
    await expect
      .poll(async () => (await scene.getAttribute('data-scene-issues')) ?? '')
      .toContain('SCENE_REGION_TOO_NARROW');
  });

  test('a child that is not a scene is named, and hidden', async ({ page }) => {
    const scene = await openComposition(page, 1);
    await scene.evaluate((host) => {
      const stray = document.createElement('p');
      stray.textContent = 'not a scene';
      host.insertBefore(stray, host.lastElementChild);
    });
    await expect
      .poll(async () => (await scene.getAttribute('data-scene-issues')) ?? '')
      .toContain('SCENE_LAYOUT_INVALID');
    await expect(scene.locator('p')).toBeHidden();
  });

  test('a second closing band is named, and hidden rather than drawn over the first', async ({ page }) => {
    const scene = await openComposition(page, 1);
    await scene.evaluate((host) => {
      const second = document.createElement('deck-scene-band');
      second.setAttribute('label', 'A second conclusion');
      host.append(second);
    });
    await expect
      .poll(async () => (await scene.getAttribute('data-scene-issues')) ?? '')
      .toContain('"deck-scene-band"');
    await expect(scene.locator('deck-scene-band').first()).toBeVisible();
    await expect(scene.locator('deck-scene-band').nth(1)).toBeHidden();
  });

  test('a stack of scenes taller than a slide is named once, on the composition', async ({ page }) => {
    const scene = await openComposition(page, 4);
    await scene.evaluate((host) => {
      const steps = host.querySelector('deck-scene-steps')!;
      for (let i = 0; i < 5; i++) {
        const item = document.createElement('deck-scene-item');
        item.setAttribute('label', `Step ${i + 2}`);
        item.setAttribute('note', 'a note that makes the row taller');
        steps.append(item);
      }
    });
    await expect
      .poll(async () => (await scene.getAttribute('data-scene-issues')) ?? '')
      .toContain('SCENE_TOO_TALL');
    const own = await scene
      .locator('deck-scene-steps')
      .evaluate((el) => el.getAttribute('data-scene-issues') ?? '');
    expect(own, 'the scene inside does not judge a budget that is the composition’s').not.toContain('SCENE_TOO_TALL');
  });
});
