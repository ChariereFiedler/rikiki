import { expect, test } from '@playwright/test';
import { contrastRatio, flatten, isOpaque, parseColor } from '../src/shared/contrast.js';
import { createDeckPage } from './pages/deck.page';

const EXTRAS = '/rikiki/decks/tests/extras.html';
const MORE = '/rikiki/decks/tests/extras-more.html';
const EXTENSIONS = '/rikiki/decks/tests/extensions.html';

test('deck-annotate can displace badges and keep a leader on the exact target', async ({ page }) => {
  const deck = createDeckPage(page);
  await deck.goto(`${EXTRAS}#4`);

  await page.evaluate(async () => {
    const annotation = document.getElementById('shot') as HTMLElement & {
      updateComplete: Promise<unknown>;
    };
    annotation.setAttribute('leader', '');
    annotation.setAttribute('offset', '32,-24');
    // The leader element does not exist before that re-render · measuring it
    // straight after setAttribute reads a null.
    await annotation.updateComplete;
  });
  await page.keyboard.press('ArrowRight');

  const geometry = await page.evaluate(() => {
    const annotation = document.getElementById('shot')!;
    const shadow = annotation.shadowRoot!;
    const image = shadow.querySelector('img') as HTMLImageElement;
    const imageBox = image.getBoundingClientRect();
    const ratio = image.naturalWidth / image.naturalHeight;
    const boxRatio = imageBox.width / imageBox.height;
    const paintedWidth = ratio > boxRatio ? imageBox.width : imageBox.height * ratio;
    const paintedHeight = ratio > boxRatio ? imageBox.width / ratio : imageBox.height;
    const target = {
      x: imageBox.left + (imageBox.width - paintedWidth) / 2 + paintedWidth * 0.2,
      y: imageBox.top + (imageBox.height - paintedHeight) / 2 + paintedHeight * 0.3,
    };
    const leaderElement = shadow.querySelector('.leader') as HTMLElement;
    const marker = (shadow.querySelector('.mark') as HTMLElement).getBoundingClientRect();
    const leader = leaderElement.getBoundingClientRect();
    return {
      dx: marker.left + marker.width / 2 - target.x,
      dy: marker.top + marker.height / 2 - target.y,
      leaderWidth: leader.width,
      leaderVisible: getComputedStyle(leaderElement).display !== 'none',
    };
  });

  expect(geometry.dx, 'the badge moves away from the target to the right').toBeGreaterThan(5);
  expect(geometry.dy, 'the badge moves away from the target upward').toBeLessThan(-5);
  expect(geometry.leaderWidth, 'the target remains connected to the badge').toBeGreaterThan(5);
  expect(geometry.leaderVisible).toBe(true);
});

test('deck-annotate offset="above" clears the target and turns the leader on unasked', async ({ page }) => {
  const deck = createDeckPage(page);
  await deck.goto(`${EXTRAS}#4`);

  await page.evaluate(async () => {
    const annotation = document.getElementById('shot') as HTMLElement & {
      updateComplete: Promise<unknown>;
    };
    // `leader` is deliberately left unset · a keyword offset must turn it on
    // by itself.
    annotation.setAttribute('offset', 'above');
    await annotation.updateComplete;
  });
  await page.keyboard.press('ArrowRight');

  const geometry = await page.evaluate(() => {
    const annotation = document.getElementById('shot')!;
    const shadow = annotation.shadowRoot!;
    const image = shadow.querySelector('img') as HTMLImageElement;
    const imageBox = image.getBoundingClientRect();
    const ratio = image.naturalWidth / image.naturalHeight;
    const boxRatio = imageBox.width / imageBox.height;
    const paintedWidth = ratio > boxRatio ? imageBox.width : imageBox.height * ratio;
    const paintedHeight = ratio > boxRatio ? imageBox.width / ratio : imageBox.height;
    const targetY = imageBox.top + (imageBox.height - paintedHeight) / 2 + paintedHeight * 0.3;
    const leaderElement = shadow.querySelector('.leader') as HTMLElement;
    const marker = (shadow.querySelector('.mark') as HTMLElement).getBoundingClientRect();
    return {
      gapAboveTarget: targetY - marker.bottom,
      leaderVisible: getComputedStyle(leaderElement).display !== 'none',
    };
  });

  expect(geometry.gapAboveTarget, 'the badge bottom edge sits above the target y').toBeGreaterThan(0);
  expect(geometry.gapAboveTarget, 'the gap stays close to the anchor gap token, not a stray value').toBeLessThan(40);
  expect(geometry.leaderVisible, 'a keyword offset turns the leader on by itself').toBe(true);
});

test('deck-annotate offset="right" moves the badge to the right of the target', async ({ page }) => {
  const deck = createDeckPage(page);
  await deck.goto(`${EXTRAS}#4`);

  await page.evaluate(async () => {
    const annotation = document.getElementById('shot') as HTMLElement & {
      updateComplete: Promise<unknown>;
    };
    annotation.setAttribute('offset', 'right');
    await annotation.updateComplete;
  });
  await page.keyboard.press('ArrowRight');

  const geometry = await page.evaluate(() => {
    const annotation = document.getElementById('shot')!;
    const shadow = annotation.shadowRoot!;
    const image = shadow.querySelector('img') as HTMLImageElement;
    const imageBox = image.getBoundingClientRect();
    const ratio = image.naturalWidth / image.naturalHeight;
    const boxRatio = imageBox.width / imageBox.height;
    const paintedWidth = ratio > boxRatio ? imageBox.width : imageBox.height * ratio;
    const paintedHeight = ratio > boxRatio ? imageBox.width / ratio : imageBox.height;
    const target = {
      x: imageBox.left + (imageBox.width - paintedWidth) / 2 + paintedWidth * 0.2,
      y: imageBox.top + (imageBox.height - paintedHeight) / 2 + paintedHeight * 0.3,
    };
    const marker = (shadow.querySelector('.mark') as HTMLElement).getBoundingClientRect();
    return {
      dx: marker.left + marker.width / 2 - target.x,
      dy: marker.top + marker.height / 2 - target.y,
    };
  });

  expect(geometry.dx, 'the badge moves to the right of the target').toBeGreaterThan(5);
  expect(Math.abs(geometry.dy), 'the badge stays level with the target vertically').toBeLessThan(5);
});

test('deck-annotate pixel offsets keep working unchanged', async ({ page }) => {
  const deck = createDeckPage(page);
  await deck.goto(`${EXTRAS}#4`);

  await page.evaluate(async () => {
    const annotation = document.getElementById('shot') as HTMLElement & {
      updateComplete: Promise<unknown>;
    };
    annotation.setAttribute('offset', '0,0');
    await annotation.updateComplete;
  });
  await page.keyboard.press('ArrowRight');

  const geometry = await page.evaluate(() => {
    const annotation = document.getElementById('shot')!;
    const shadow = annotation.shadowRoot!;
    const leaderElement = shadow.querySelector('.leader') as HTMLElement | null;
    return {
      leaderPresent: leaderElement !== null,
    };
  });

  // offset="0,0" produces zero displacement · no leader is drawn for it, since
  // there is nothing to connect the badge back to, and the pixel form never
  // forces one on.
  expect(geometry.leaderPresent).toBe(false);
});

test('deck-annotate offsets mixes keywords and pixels per mark', async ({ page }) => {
  const deck = createDeckPage(page);
  await deck.goto(`${EXTRAS}#4`);

  await page.evaluate(async () => {
    const annotation = document.getElementById('shot') as HTMLElement & {
      updateComplete: Promise<unknown>;
    };
    // First mark : keyword, no `leader` attribute set anywhere on the host.
    // Second mark : plain pixels, unaffected by the first mark's keyword.
    annotation.setAttribute('offsets', 'above|10,10');
    await annotation.updateComplete;
  });
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');

  const leaderCount = await page.evaluate(() => {
    const annotation = document.getElementById('shot')!;
    return annotation.shadowRoot!.querySelectorAll('.leader').length;
  });

  // Only the keyword mark renders a leader element at all · the pixel mark
  // has `leader` unset and a non-zero offset, but the keyword form is the
  // only one that forces it on.
  expect(leaderCount, 'exactly the keyword mark gets a leader, not the pixel one').toBe(1);
});

test('deck-step note-position below remains legible in a five-step row', async ({ page }) => {
  const deck = createDeckPage(page);
  await deck.goto(EXTENSIONS);

  const geometry = await page.evaluate(async () => {
    const list = document.getElementById('steps-row')!;
    const fifth = document.createElement('deck-step');
    fifth.setAttribute('n', '5');
    fifth.setAttribute('note', 'a supporting note that may wrap');
    fifth.textContent = 'Report';
    list.appendChild(fifth);
    for (const step of list.querySelectorAll('deck-step')) {
      step.setAttribute('note-position', 'below');
    }
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    return [...list.querySelectorAll('deck-step')].map((step) => {
      const shadow = step.shadowRoot!;
      const label = shadow.querySelector('.label')!.getBoundingClientRect();
      const note = shadow.querySelector('.note')!.getBoundingClientRect();
      return {
        display: getComputedStyle(step).display,
        labelBottom: label.bottom,
        noteTop: note.top,
        noteWidth: note.width,
        host: step.getBoundingClientRect().toJSON(),
      };
    });
  });

  expect(geometry).toHaveLength(5);
  expect(geometry.every((item) => item.display === 'grid')).toBe(true);
  expect(geometry.every((item) => item.noteTop >= item.labelBottom - 2)).toBe(true);
  expect(geometry.every((item) => item.noteWidth > 20), 'notes retain usable width').toBe(true);
  for (let index = 1; index < geometry.length; index += 1) {
    expect(geometry[index]!.host.left).toBeGreaterThanOrEqual(geometry[index - 1]!.host.right - 1);
  }
});

test('deck-callout on-dark supplies an opaque readable inverse surface', async ({ page }) => {
  const deck = createDeckPage(page);
  await deck.goto(EXTENSIONS);

  const colors = await page.evaluate(async () => {
    const callout = document.createElement('deck-callout');
    callout.setAttribute('on-dark', '');
    callout.setAttribute('type', 'info');
    callout.innerHTML = '<strong>Decision.</strong> Keep the evidence with the file.';
    document.querySelector('deck-root > [active]')!.appendChild(callout);
    await customElements.whenDefined('deck-callout');
    await callout.updateComplete;
    const strong = callout.querySelector('strong')!;
    return {
      background: getComputedStyle(callout).backgroundColor,
      body: getComputedStyle(callout).color,
      strong: getComputedStyle(strong).color,
    };
  });

  const background = parseColor(colors.background)!;
  const body = parseColor(colors.body)!;
  const strong = parseColor(colors.strong)!;
  expect(background && body && strong).toBeTruthy();
  expect(isOpaque(background), 'the component owns a stable backdrop').toBe(true);
  expect(contrastRatio(flatten(body, background), background)).toBeGreaterThanOrEqual(4.5);
  expect(contrastRatio(flatten(strong, background), background)).toBeGreaterThanOrEqual(4.5);
});

test('deck-persona compact inline uses one short wrapping identity row', async ({ page }) => {
  const deck = createDeckPage(page);
  await deck.goto(`${MORE}#5`);

  const dimensions = await page.evaluate(async () => {
    const persona = document.getElementById('who')!;
    const before = {
      height: persona.getBoundingClientRect().height,
      avatar: persona.shadowRoot!.querySelector('.avatar')!.getBoundingClientRect().width,
    };
    persona.setAttribute('compact', '');
    persona.setAttribute('inline', '');
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const who = persona.shadowRoot!.querySelector('.who')!;
    const name = persona.shadowRoot!.querySelector('.name')!.getBoundingClientRect();
    const role = persona.shadowRoot!.querySelector('.role')!.getBoundingClientRect();
    const context = persona.shadowRoot!.querySelector('.context')!.getBoundingClientRect();
    return {
      before,
      after: {
        height: persona.getBoundingClientRect().height,
        avatar: persona.shadowRoot!.querySelector('.avatar')!.getBoundingClientRect().width,
        direction: getComputedStyle(who).flexDirection,
        // `inline` aligns the fields on their shared BASELINE, so their box
        // tops legitimately differ by the type-size difference. What "one row"
        // means is that every field overlaps the name vertically.
        shareRow: [role, context].every(
          (field) =>
            Math.min(name.bottom, field.bottom) - Math.max(name.top, field.top) >
            Math.min(name.height, field.height) / 2,
        ),
      },
    };
  });

  expect(dimensions.after.avatar).toBeLessThan(dimensions.before.avatar);
  expect(dimensions.after.height).toBeLessThan(dimensions.before.height);
  expect(dimensions.after.direction).toBe('row');
  expect(dimensions.after.shareRow, 'identity fields share the row when space permits').toBe(true);
});
