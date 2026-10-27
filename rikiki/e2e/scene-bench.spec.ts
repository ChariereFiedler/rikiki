import { expect, test } from '@playwright/test';
import { MIN_SCENE_WIDTH } from '../src/media/deck-scene-compose-layout.ts';
import { capacityOf } from '../src/media/scene-capacity.ts';

// ════════════════════════════════════════════════════════════════
// The scene bench, as a guard
//
// scripts/scene-bench draws generated scenes (counts from one under the minimum
// to one over the maximum, awkward texts, every emphasis, values of any ratio) on
// the real fonts and checks the drawing against what the scene said about
// itself: a text past its box, two over each other, an item dropped, a drawing
// taller than a slide, all of which must be REPORTED, never silent.
//
// This asserts the bench is clean at full width and, for each shape, at the
// narrowest width it is declared to draw cleanly (MIN_SCENE_WIDTH). A failure
// prints its seed and its reduced case · `node scripts/scene-bench/bench.mjs
// --seed S --cases N --reduce` reproduces it.
// ════════════════════════════════════════════════════════════════

const KINDS = ['cards', 'steps', 'flow', 'bars', 'matrix', 'ranges', 'lanes', 'units'] as const;

interface Report {
  total: number;
  failed: {
    id: string;
    kind?: string;
    layout?: string;
    width?: number;
    failures: { oracle: string; detail: string }[];
  }[];
  byOracle: Record<string, number>;
}

test.describe('scene bench', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'one browser is enough for a bench');
  test.setTimeout(180_000);

  test.beforeEach(async ({ page }) => {
    await page.goto('/rikiki/scripts/scene-bench/harness.html');
    await page.waitForFunction(() => (window as unknown as { benchReady?: boolean }).benchReady === true);
    await page.evaluate(() => document.fonts.ready);
  });

  const run = (page: import('@playwright/test').Page, seed: number, cases: number, kinds: string[], widths: number[]) =>
    page.evaluate(
      async ([s, n, k, w]) => {
        const bench = (window as unknown as { bench: { generate: Function; run: Function } }).bench;
        return bench.run(bench.generate(s, n, k, w));
      },
      [seed, cases, kinds, widths] as [number, number, string[], number[]],
    ) as Promise<Report>;

  const summary = (report: Report) =>
    report.failed
      .slice(0, 5)
      .map((f) => `${f.id} ${f.kind ?? f.layout}@${f.width ?? ''}: ${f.failures.map((x) => `${x.oracle} ${x.detail}`).join('; ')}`)
      .join('\n');

  test('draws nothing wrong without saying so, at full width', async ({ page }) => {
    const report = await run(page, 101, 400, [...KINDS], [1600]);
    expect(report.total).toBe(400);
    expect(report.failed, summary(report)).toEqual([]);
  });

  for (const kind of KINDS) {
    const width = MIN_SCENE_WIDTH[kind]!;
    test(`${kind} is clean at the ${width} units it is declared to draw at`, async ({ page }) => {
      const report = await run(page, 202, 120, [kind], [width]);
      expect(report.failed, summary(report)).toEqual([]);
    });
  }

  test('draws nothing wrong without saying so, at every width each shape is declared clean at', async ({ page }) => {
    // The generator's own widths · each shape at those of 1600, 752 and 469 it
    // promises, and at its narrowest, where it is closest to failing.
    const report = (await page.evaluate(async () => {
      const bench = (window as unknown as { bench: { generate: Function; run: Function } }).bench;
      return bench.run(bench.generate(2, 500));
    })) as Report;
    expect(report.total).toBe(500);
    expect(report.failed, summary(report)).toEqual([]);
  });

  // Found by seed 2 at 1000 units, the narrowest a lanes and a matrix promise ·
  // each drew a text over another and named a different one.
  const SILENT_AT_THE_EDGE = [
    {
      what: 'a lanes trigger with no room before the gate label',
      field: 'trigger',
      text: 'deploy',
      testCase: {
        id: '2:38',
        kind: 'lanes',
        width: 1000,
        count: 2,
        attrs: { gate: 'KILL SWITCH', trigger: 'deploy', passed: '0', blocked: '5' },
        items: [
          { label: 'ship', note: 'où lane budget trust Zürich', tag: 'verify', icon: 'team' },
          { label: 'qualité', tag: 'Donaudampfschifffahrtsgesellschaft' },
        ],
      },
    },
    {
      what: 'a matrix status word past its column after another one',
      field: 'status',
      text: 'Donaudampfschifffahrtsgesellschaft',
      testCase: {
        id: '2:323',
        kind: 'matrix',
        width: 1000,
        count: 1,
        attrs: {
          columns: 'où|audit naïve|cache données|ship|98,6 % des cas|naïve ship',
          statuses: 'prod=internationalisation|none=Donaudampfschifffahrtsgesellschaft',
        },
        items: [{ label: 'budget queue été', level: 'announced test test none none announced', emphasis: true }],
      },
    },
  ];
  for (const { what, field, text, testCase } of SILENT_AT_THE_EDGE) {
    test(`${what} is named, not drawn over its neighbour in silence`, async ({ page }) => {
      const { report, fields } = await page.evaluate(async (c) => {
        const bench = (window as unknown as { bench: { mount: Function; run: Function } }).bench;
        // `run` draws every shape once before judging, so the fonts are in.
        const report = await bench.run([c]);
        const element = (await bench.mount(c)) as HTMLElement;
        const issues = JSON.parse(element.getAttribute('data-scene-issues') || '[]');
        const long = issues.find((issue: { code: string }) => issue.code === 'SCENE_TEXT_TOO_LONG');
        return {
          report,
          fields: (long?.fields ?? []).map((f: { field: string; text: string }) => `${f.field}:${f.text}`),
        };
      }, testCase);
      expect(fields).toContain(`${field}:${text}`);
      expect((report as Report).failed, summary(report as Report)).toEqual([]);
    });
  }

  for (const seed of [301, 302]) {
    test(`random diagrams (seed ${seed}) keep the grammar's promises on the real fonts`, async ({ page }) => {
      // Every engine, nested groups, boxes with every treatment, dots, bars, links, notes,
      // rooms from the canvas to a third of it · never silent about not fitting, no mark
      // lost, everything inside its room when it fits, no box over another, no link
      // through a box, the same tree draws the same drawing · and, one case in eight more,
      // the marks that tell a story (a terminal, a table, a switch…), none lost.
      const { report, generated } = (await page.evaluate(
        async ([s, n]) => {
          const bench = (window as unknown as { bench: { generateDiagrams: Function; runDiagrams: Function } }).bench;
          const cases = bench.generateDiagrams(s, n);
          return { report: await bench.runDiagrams(cases), generated: cases.length };
        },
        [seed, 400] as [number, number],
      )) as { report: Report; generated: number };
      expect(generated).toBeGreaterThan(400);
      expect(report.total).toBe(generated);
      expect(report.failed, summary(report)).toEqual([]);
    });
  }

  test('every compiled intent demonstrates itself, and each counter-example is rejected by its code', async ({ page }) => {
    const report = (await page.evaluate(() =>
      (window as unknown as { bench: { runIntents: Function } }).bench.runIntents(),
    )) as { total: number; failed: { id: string; oracle: string; detail: string }[] };
    // Five skeletons and at least one counter-example each.
    expect(report.total).toBeGreaterThanOrEqual(10);
    expect(report.failed, JSON.stringify(report.failed, null, 2)).toEqual([]);
  });

  test('the committed capacity table is what the scenes hold today', async ({ page }) => {
    // Three cells recomputed on the real fonts · a scene whose layout changed
    // without the table being regenerated fails here, and the fix is
    // `node scripts/scene-bench/capacity.mjs --ts src/media/scene-capacity.data.ts`.
    const cells = [
      ['cards', 1600, 3, 'note'],
      ['bars', 1000, 5, 'label'],
      ['units', 752, 2, 'label'],
    ] as const;
    for (const [kind, width, count, field] of cells) {
      const measured = await page.evaluate(
        ([k, w, n, f]) =>
          (window as unknown as { bench: { capacity: Function } }).bench.capacity(k, w, n, f) as Promise<number>,
        [kind, width, count, field] as [string, number, number, string],
      );
      const committed = capacityOf(kind, width, count, field)!;
      expect(Math.abs(measured - committed), `${kind} ${field} x${count} at ${width}: ${measured} now, ${committed} committed`).toBeLessThanOrEqual(2);
    }
  });

  test('a case is reproduced by its seed and its index', async ({ page }) => {
    const [first, second] = await page.evaluate(() => {
      const bench = (window as unknown as { bench: { generate: Function } }).bench;
      return [bench.generate(5, 40), bench.generate(5, 40)];
    });
    expect(second).toEqual(first);
  });
});
