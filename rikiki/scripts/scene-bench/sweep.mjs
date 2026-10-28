#!/usr/bin/env node
// ════════════════════════════════════════════════════════════════
// RIKIKI · scene bench, the width sweep
//
//   node scripts/scene-bench/sweep.mjs [--cases 200] [--seed 7] [--out widths.json]
//
// For each shape, draws the same generated cases at a ladder of widths and prints
// how many fail an oracle · the narrowest width at which a shape is clean is the
// width a composition may give it. A scene that draws wrong without saying so at
// a width is not usable at that width, however good it looks at 1600.
// ════════════════════════════════════════════════════════════════

import { writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { openBench } from './runner.mjs';

const { values } = parseArgs({
  options: {
    cases: { type: 'string', default: '200' },
    seed: { type: 'string', default: '7' },
    widths: { type: 'string', default: '1600,1250,1000,850,752,650,560,469' },
    out: { type: 'string' },
    port: { type: 'string', default: '7814' },
  },
});

const bench = await openBench(Number(values.port));
const widths = values.widths.split(',').map(Number);
const table = {};
try {
  const kinds = await bench.page.evaluate(() => window.bench.KINDS);
  for (const kind of kinds) {
    table[kind] = {};
    for (const width of widths) {
      const report = await bench.page.evaluate(
        async ([seed, cases, k, w]) => {
          const result = await window.bench.run(window.bench.generate(seed, cases, [k], [w]));
          return { total: result.total, failed: result.failed.length, byOracle: result.byOracle };
        },
        [Number(values.seed), Number(values.cases), kind, width],
      );
      table[kind][width] = report;
      const rate = ((report.failed / report.total) * 100).toFixed(1).padStart(5);
      console.log(
        `${kind.padEnd(7)} ${String(width).padStart(5)} · ${rate}% · ${JSON.stringify(report.byOracle)}`,
      );
    }
  }
} finally {
  await bench.close();
}

console.log('\nnarrowest clean width per shape (0 failures):');
const clean = {};
for (const [kind, byWidth] of Object.entries(table)) {
  const ok = widths.filter((w) => byWidth[w].failed === 0).sort((a, b) => a - b);
  clean[kind] = ok[0] ?? null;
  console.log(`  ${kind.padEnd(7)} ${clean[kind] ?? 'none'}`);
}
if (values.out)
  writeFileSync(
    values.out,
    JSON.stringify(
      { seed: Number(values.seed), cases: Number(values.cases), widths, table, clean },
      null,
      2,
    ),
  );
