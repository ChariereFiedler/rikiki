#!/usr/bin/env node
// ════════════════════════════════════════════════════════════════
// RIKIKI · scene bench, the command
//
//   node scripts/scene-bench/bench.mjs [--seed 1] [--cases 500] [--kinds bars,cards]
//        [--widths 1600,752] [--reduce] [--json] [--out report.json]
//
// Draws generated scenes on the real fonts and checks them against the oracles
// (see bench-page.mjs). Exit 1 when any oracle fails. Needs Chromium (Playwright)
// and a built `dist/`. A failure is reproduced by `--seed S --cases N`, case id
// `S:i`, and shown reduced with --reduce. Without --widths each shape is drawn at
// the widths it is declared clean at (MIN_SCENE_WIDTH and up · under it a
// composition reports SCENE_REGION_TOO_NARROW); --widths draws every shape at
// exactly those, as the width sweep does.
// ════════════════════════════════════════════════════════════════

import { writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { openBench } from './runner.mjs';

const { values } = parseArgs({
  options: {
    seed: { type: 'string', default: '1' },
    cases: { type: 'string', default: '500' },
    kinds: { type: 'string' },
    widths: { type: 'string' },
    reduce: { type: 'boolean', default: false },
    json: { type: 'boolean', default: false },
    out: { type: 'string' },
    port: { type: 'string', default: '7811' },
  },
});

async function main() {
  const bench = await openBench(Number(values.port));
  try {
    const { page } = bench;
    const kinds = values.kinds?.split(',');
    const widths = values.widths?.split(',').map(Number);
    const started = Date.now();
    const report = await page.evaluate(
      async ([seed, cases, k, w]) => window.bench.run(window.bench.generate(seed, cases, k, w)),
      [Number(values.seed), Number(values.cases), kinds, widths],
    );
    report.seconds = Math.round((Date.now() - started) / 100) / 10;
    report.seed = Number(values.seed);

    if (values.reduce) {
      const seen = new Set();
      for (const failure of report.failed) {
        const oracle = failure.failures[0].oracle;
        const key = `${failure.kind}:${oracle}`;
        if (seen.has(key)) continue;
        seen.add(key);
        failure.reduced = await page.evaluate(
          ([c, o]) => window.bench.reduce(c, o),
          [failure.testCase, oracle],
        );
      }
    }
    for (const failure of report.failed) if (!failure.reduced) delete failure.testCase;

    if (values.out) writeFileSync(values.out, JSON.stringify(report, null, 2));
    if (values.json) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      console.log(
        `scene bench · seed ${report.seed} · ${report.total} cases in ${report.seconds}s · ${report.failed.length} failed`,
      );
      for (const [oracle, count] of Object.entries(report.byOracle))
        console.log(`  ${oracle} · ${count}`);
      for (const failure of report.failed.slice(0, 15)) {
        console.log(
          `  ${failure.id} · ${failure.kind} · ${failure.width} · ${failure.count} items`,
        );
        for (const x of failure.failures.slice(0, 3))
          console.log(`      ${x.oracle} · ${x.detail}`);
      }
    }
    process.exitCode = report.failed.length ? 1 : 0;
  } finally {
    await bench.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 2;
});
