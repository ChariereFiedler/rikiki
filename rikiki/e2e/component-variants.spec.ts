import { expect, test } from '@playwright/test';
import { contrastRatio, parseColor } from '../tools/contrast.js';
import { createDeckPage } from './pages/deck.page';

test('annotation leader keeps the exact target visible beside its displaced marker', async ({ page }) => {
  const deck = createDeckPage(page);
  await deck.goto('/rikiki/decks/tests/extras.html#4');

  const geometry = await page.evaluate(async () => {
    const annotation = document.getElementById('shot') as HTMLElement & { updateComplete: Promise<unknown> };
    annotation.setAttribute('leader', '');
    annotation.setAttribute('offset', '32,-24');
    annotation.setAttribute('all-at-once', '');
    await annotation.updateComplete;

    const shadow = annotation.shadowRoot!;
    const marker = shadow.querySelector('.mark') as HTMLElement;
    const line = shadow.querySelector('.leader') as HTMLElement;
    const markerBox = marker.getBoundingClientRect();
    const lineBox = line.getBoundingClientRect();
    return {
      markCenter: { x: markerBox.left + markerBox.width / 2, y: markerBox.top + markerBox.height / 2 },
      target: { x: lineBox.left, y: lineBox.top + lineBox.height / 2 },
      lineLength: parseFloat(getComputedStyle(line).width),
      // The slide canvas is scaled to the viewport, so painted pixels are not
      // the offset the author wrote · compare like with like.
      paintedLength: Math.hypot(lineBox.width, lineBox.height),
      angle: line.style.getPropertyValue('--leader-angle'),
    };
  });

  expect(geometry.lineLength).toBeCloseTo(40, 0);
  expect(geometry.angle).toContain('-36.8');
  expect(geometry.paintedLength, 'the leader is painted, not collapsed').toBeGreaterThan(5);
  expect(Math.hypot(
    geometry.markCenter.x - geometry.target.x,
    geometry.markCenter.y - geometry.target.y,
  ), 'the marker is displaced from the target').toBeGreaterThan(geometry.paintedLength / 2);
});

test('annotation accepts a different leader direction for each marker', async ({ page }) => {
  const deck = createDeckPage(page);
  await deck.goto('/rikiki/decks/tests/extras.html#4');
  const offsets = await page.evaluate(async () => {
    const annotation = document.getElementById('shot') as HTMLElement & { updateComplete: Promise<unknown> };
    annotation.setAttribute('leader', '');
    annotation.setAttribute('all-at-once', '');
    annotation.setAttribute('offset', '20,0');
    annotation.setAttribute('offsets', '20,0|-20,0');
    await annotation.updateComplete;
    return [...annotation.shadowRoot!.querySelectorAll<HTMLElement>('.mark')].slice(0, 2).map((mark) =>
      mark.style.getPropertyValue('--mark-dx'),
    );
  });
  expect(offsets).toEqual(['20px', '-20px']);
});

test('five horizontal steps keep supporting notes below their own labels', async ({ page }) => {
  const deck = createDeckPage(page);
  await deck.goto('/rikiki/decks/tests/extensions.html');

  const layout = await page.evaluate(async () => {
    const list = document.getElementById('steps-row')!;
    const fifth = document.createElement('deck-step') as HTMLElement & { updateComplete: Promise<unknown> };
    fifth.setAttribute('n', '5');
    fifth.setAttribute('note', 'A longer explanation that belongs to delivery');
    fifth.setAttribute('note-position', 'below');
    fifth.textContent = 'Deliver';
    list.append(fifth);
    for (const step of list.querySelectorAll<HTMLElement>('deck-step')) {
      step.setAttribute('note-position', 'below');
      await (step as HTMLElement & { updateComplete: Promise<unknown> }).updateComplete;
    }
    return [...list.querySelectorAll('deck-step')].map((step) => {
      const label = step.shadowRoot!.querySelector('.label')!.getBoundingClientRect();
      const note = step.shadowRoot!.querySelector('.note')!.getBoundingClientRect();
      return { labelBottom: label.bottom, noteTop: note.top, noteWidth: note.width };
    });
  });

  expect(layout).toHaveLength(5);
  expect(layout.every(({ labelBottom, noteTop }) => noteTop >= labelBottom - 1)).toBe(true);
  expect(layout.every(({ noteWidth }) => noteWidth > 24), 'notes keep a usable measure').toBe(true);
});

test('note-position inline remains available for terse steps', async ({ page }) => {
  const deck = createDeckPage(page);
  await deck.goto('/rikiki/decks/tests/extensions.html');
  const positions = await page.evaluate(async () => {
    const step = document.querySelector('deck-step') as HTMLElement & { updateComplete: Promise<unknown> };
    step.setAttribute('note-position', 'inline');
    await step.updateComplete;
    const label = step.shadowRoot!.querySelector('.label')!.getBoundingClientRect();
    const note = step.shadowRoot!.querySelector('.note')!.getBoundingClientRect();
    return {
      // The note is set in a smaller size on a shared baseline, so its box top
      // sits a few pixels below the label's · staying on the same line means
      // overlapping it, not starting at the same pixel.
      overlap: Math.min(label.bottom, note.bottom) - Math.max(label.top, note.top),
      noteHeight: note.height,
      afterLabel: note.left >= label.right - 1,
    };
  });
  expect(positions.overlap).toBeGreaterThan(positions.noteHeight / 2);
  expect(positions.afterLabel, 'the inline note follows its label on the line').toBe(true);
});

test('on-dark callout resolves to readable inverse colors', async ({ page }) => {
  const deck = createDeckPage(page);
  await deck.goto('/rikiki/decks/tests/extensions.html');
  const colors = await page.evaluate(async () => {
    const callout = document.createElement('deck-callout') as HTMLElement & { updateComplete: Promise<unknown> };
    callout.setAttribute('on-dark', '');
    callout.innerHTML = '<strong>Verified.</strong> The report is ready.';
    document.body.append(callout);
    await callout.updateComplete;
    return {
      background: getComputedStyle(callout).backgroundColor,
      text: getComputedStyle(callout).color,
      strong: getComputedStyle(callout.querySelector('strong')!).color,
    };
  });
  const background = parseColor(colors.background)!;
  expect(contrastRatio(parseColor(colors.text)!, background)).toBeGreaterThanOrEqual(4.5);
  expect(contrastRatio(parseColor(colors.strong)!, background)).toBeGreaterThanOrEqual(4.5);
});

test('compact and inline personas remove the oversized opening footprint', async ({ page }) => {
  const deck = createDeckPage(page);
  await deck.goto('/rikiki/decks/tests/extras-more.html#5');
  const sizes = await page.evaluate(async () => {
    const persona = document.getElementById('who') as HTMLElement & { updateComplete: Promise<unknown> };
    const avatar = () => persona.shadowRoot!.querySelector('.avatar')!.getBoundingClientRect();
    const normal = avatar();
    persona.setAttribute('compact', '');
    await persona.updateComplete;
    const compact = avatar();
    persona.removeAttribute('compact');
    persona.setAttribute('inline', '');
    await persona.updateComplete;
    const inline = avatar();
    const direction = getComputedStyle(persona.shadowRoot!.querySelector('.who')!).flexDirection;
    return { normal: normal.height, compact: compact.height, inline: inline.height, direction };
  });

  expect(sizes.compact).toBeLessThan(sizes.normal);
  expect(sizes.inline).toBeLessThan(sizes.normal);
  expect(sizes.direction).toBe('row');
});
