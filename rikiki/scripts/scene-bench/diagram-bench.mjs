#!/usr/bin/env node
// ════════════════════════════════════════════════════════════════
// RIKIKI · diagram bench, the command
//
//   node scripts/scene-bench/diagram-bench.mjs [--seed 1] [--cases 500] [--reduce] [--json] [--out report.json]
//
// Draws generated diagrams (every engine, nested groups, boxes with every treatment,
// dots, bars, links, notes, rooms from the canvas to a third of it) in the real element
// on the real fonts, and judges each against the grammar's oracles: it says "does not
// fit" exactly when it does not, it loses no mark, it keeps everything inside its room
// when it fits, no box over another, no link through a box, the same tree draws the
// same drawing. Then every compiled intent: its skeleton demonstrates it (no INT_*,
// no error) and each of its counter-examples is rejected by its own code. Exit 1 on
// any failure; a generated failure is reproduced by its seed and index.
// ════════════════════════════════════════════════════════════════

import { writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { openBench } from './runner.mjs';

const { values } = parseArgs({
  options: {
    seed: { type: 'string', default: '1' },
    cases: { type: 'string', default: '400' },
    reduce: { type: 'boolean', default: false },
    json: { type: 'boolean', default: false },
    out: { type: 'string' },
    port: { type: 'string', default: '7819' },
  },
});

const bench = await openBench(Number(values.port));
try {
  const started = Date.now();
  const report = await bench.page.evaluate(
    async ([seed, cases]) => window.bench.runDiagrams(window.bench.generateDiagrams(seed, cases)),
    [Number(values.seed), Number(values.cases)],
  );
  report.seconds = Math.round((Date.now() - started) / 100) / 10;
  report.seed = Number(values.seed);
  if (values.reduce) {
    const seen = new Set();
    for (const failure of report.failed) {
      const oracle = failure.failures[0].oracle;
      const key = `${failure.layout}:${oracle}`;
      if (seen.has(key)) continue;
      seen.add(key);
      failure.reduced = await bench.page.evaluate(
        ([c, o]) => window.bench.reduceDiagram(c, o),
        [failure.testCase, oracle],
      );
    }
  }
  for (const failure of report.failed) if (!failure.reduced) delete failure.testCase;
  report.intents = await bench.page.evaluate(() => window.bench.runIntents());
  if (values.out) writeFileSync(values.out, JSON.stringify(report, null, 2));
  if (values.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(
      `diagram bench · seed ${report.seed} · ${report.total} cases in ${report.seconds}s · ${report.failed.length} failed`,
    );
    for (const [oracle, count] of Object.entries(report.byOracle))
      console.log(`  ${oracle} · ${count}`);
    for (const failure of report.failed.slice(0, 12)) {
      console.log(`  ${failure.id} · ${failure.layout} · ${failure.room.w}×${failure.room.h}`);
      for (const x of failure.failures.slice(0, 2)) console.log(`      ${x.oracle} · ${x.detail}`);
    }
    console.log(
      `intent cases · ${report.intents.total} (a skeleton and its counter-examples per intent) · ${report.intents.failed.length} failed`,
    );
    for (const failure of report.intents.failed)
      console.log(`  ${failure.id} · ${failure.oracle} · ${failure.detail}`);
  }
  process.exitCode = report.failed.length || report.intents.failed.length ? 1 : 0;
} finally {
  await bench.close();
}
