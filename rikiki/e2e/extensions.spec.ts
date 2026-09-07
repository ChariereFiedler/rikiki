import { expect, test } from '@playwright/test';
import { createDeckPage } from './pages/deck.page';

// Four extensions of components that already existed. Each was chosen over a
// new element because a new element would have duplicated a vocabulary the
// project already has · see the assessment in the changelog.
const DECK = '/rikiki/decks/tests/extensions.html';

test('deck-step-list lays a chain across the width and connects it', async ({ page }) => {
  const deck = createDeckPage(page);
  await deck.goto(DECK);

  const geometry = await page.evaluate(() => {
    const list = document.getElementById('steps-row')!;
    const steps = [...list.querySelectorAll('deck-step')].map((s) => s.getBoundingClientRect());
    return {
      direction: getComputedStyle(list).flexDirection,
      sameRow: steps.every((r) => Math.abs(r.top - steps[0]!.top) < 2),
      count: steps.length,
    };
  });

  expect(geometry.direction).toBe('row');
  expect(geometry.sameRow, 'the four steps share one row').toBe(true);
  expect(geometry.count).toBe(4);
});

test('a column step list is unchanged · the default is untouched', async ({ page }) => {
  const deck = createDeckPage(page);
  await deck.goto(DECK);
  const direction = await page.evaluate(() => {
    const list = document.createElement('deck-step-list');
    document.body.appendChild(list);
    const d = getComputedStyle(list).flexDirection;
    list.remove();
    return d;
  });
  expect(direction).toBe('column');
});

test('deck-split places a pivot and accents the winning side', async ({ page }) => {
  const deck = createDeckPage(page);
  await deck.goto(`${DECK}#2`);

  const pivot = await page.evaluate(() => {
    const shadow = document.getElementById('versus')?.shadowRoot;
    const el = shadow?.querySelector('.pivot');
    return el ? { text: el.textContent?.trim(), hidden: el.getAttribute('aria-hidden') } : null;
  });
  expect(pivot?.text, 'the pivot symbol is rendered').toBe('→');
  expect(pivot?.hidden, 'a decorative arrow is not read aloud').toBe('true');

  const rules = await page.evaluate(() => {
    const shadow = document.getElementById('versus')?.shadowRoot;
    return [...(shadow?.querySelectorAll('.col') ?? [])].map((c) => ({
      width: getComputedStyle(c).borderTopWidth,
      color: getComputedStyle(c).borderTopColor,
    }));
  });
  // winner="right" · both columns carry a rule, and the winning one carries it
  // in the accent colour. A ring would draw a box, which this design avoids.
  const first = rules[0]!;
  const last = rules[rules.length - 1]!;
  expect(first.width, 'both sides get a rule').not.toBe('0px');
  expect(last.width).not.toBe('0px');
  expect(last.color, 'the winning rule differs from the neutral one').not.toBe(first.color);
});

test('deck-csv marks the row and the column it is told to', async ({ page }) => {
  const deck = createDeckPage(page);
  await deck.goto(`${DECK}#3`);

  const marks = await page.evaluate(() => {
    const shadow = document.getElementById('csv-marked')?.shadowRoot;
    const rows = [...(shadow?.querySelectorAll('tbody tr') ?? [])];
    return {
      markedRows: rows.map((r) => r.hasAttribute('data-mark')),
      markedHeaderCells: [...(shadow?.querySelectorAll('thead th') ?? [])].map((c) =>
        c.hasAttribute('data-mark'),
      ),
    };
  });

  expect(marks.markedRows, 'row 2 of the body, 1-based').toEqual([false, true, false]);
  expect(marks.markedHeaderCells, 'column 3, 1-based').toEqual([false, false, true]);
});

test('deck-csv reveals its rows one per step, without reflowing', async ({ page }) => {
  const deck = createDeckPage(page);
  await deck.goto(`${DECK}#4`);

  const shown = () =>
    page.evaluate(() => {
      const shadow = document.getElementById('csv-reveal')?.shadowRoot;
      return [...(shadow?.querySelectorAll('tbody tr') ?? [])].filter(
        (r) => !r.hasAttribute('data-pending'),
      ).length;
    });
  const tableHeight = () =>
    page.evaluate(
      () =>
        document
          .getElementById('csv-reveal')
          ?.shadowRoot?.querySelector('table')
          ?.getBoundingClientRect().height ?? 0,
    );

  expect(await shown()).toBe(0);
  const before = await tableHeight();

  await page.keyboard.press('ArrowRight');
  await expect.poll(shown).toBe(1);
  await page.keyboard.press('ArrowRight');
  await expect.poll(shown).toBe(2);

  // Hidden rows keep their space · the slide must not jump under the audience.
  expect(await tableHeight()).toBeCloseTo(before, 0);
});

test('a revealing table asks the engine for one step per row', async ({ page }) => {
  const deck = createDeckPage(page);
  await deck.goto(`${DECK}#4`);
  const steps = await page.evaluate(
    () => document.getElementById('revealed')?.getAttribute('data-steps'),
  );
  expect(steps, 'three body rows means three steps').toBe('3');
});

test('deck-stat compact drops the scale without changing the family', async ({ page }) => {
  const deck = createDeckPage(page);
  await deck.goto(`${DECK}#5`);

  const sizes = await page.evaluate(() => {
    const read = (id: string) => {
      const num = document.getElementById(id)?.shadowRoot?.querySelector('.num');
      return num ? parseFloat(getComputedStyle(num).fontSize) : 0;
    };
    return ['kpi-1', 'kpi-2', 'kpi-3'].map(read);
  });

  expect(sizes.every((s) => s > 0), 'the figures render').toBe(true);
  expect(new Set(sizes).size, 'a row of compact stats shares one scale').toBe(1);
});
