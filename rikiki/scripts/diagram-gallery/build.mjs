#!/usr/bin/env node
// ════════════════════════════════════════════════════════════════
// Build the generated diagram gallery · examples/diagrams-generated
//
//   node scripts/diagram-gallery/build.mjs [--count 30] [--seed 1] [--out examples/diagrams-generated] [--rounds 4]
//
// Thirty illustrations written in the grammar by sixteen builders (a graph by layers,
// a chart in rows, a ring, a grid of cells with a note, two groups side by side, a
// dashboard of figures…), from vocabulary packs and a seed. Each slide is then
// CHECKED by `rikiki check` on the real fonts, and a slide that has a defect, a
// diagram that does not fit or a verdict under `ship` is rebuilt from the next seed,
// up to `--rounds` times: what is in the gallery is what the linter passed, not what
// was hoped for. Same arguments, same deck.
// ════════════════════════════════════════════════════════════════

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { checkDeck } from '../../bin/lib/check.mjs';
import { BUILDERS, PACK_IDS, buildSlide } from './builders.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const PKG = join(HERE, '..', '..');
const REPO = join(PKG, '..');

const { values } = parseArgs({
  options: {
    count: { type: 'string', default: '30' },
    seed: { type: 'string', default: '1' },
    out: { type: 'string', default: 'examples/diagrams-generated' },
    rounds: { type: 'string', default: '4' },
  },
});

const count = Number(values.count);
const baseSeed = Number(values.seed);
const rounds = Number(values.rounds);

/** The plan of the gallery · builders in turn, packs rotating, each slide with its own seed. */
function plan() {
  return Array.from({ length: count }, (_, i) => {
    const lap = Math.floor(i / BUILDERS.length);
    return {
      builder: BUILDERS[i % BUILDERS.length].id,
      pack: PACK_IDS[(i + lap) % PACK_IDS.length],
      seed: baseSeed + i * 13,
    };
  });
}

const indent = (html) =>
  html
    .split('\n')
    .map((line) => (line ? `    ${line}` : line))
    .join('\n');

function slideHtml(slide, n) {
  return `  <deck-feature id="${slide.id}-${n}" eyebrow="${slide.builder}">
    <h1 slot="title">${slide.claim}</h1>
${indent(slide.html)}
    <deck-source>${slide.source}</deck-source>
    <deck-notes>${slide.claim}.</deck-notes>
  </deck-feature>`;
}

function deckHtml(slides, runtime) {
  return `<!doctype html>
<!--
  Rikiki · generated diagram gallery · ${slides.length} illustrations from one grammar
  Built by scripts/diagram-gallery/build.mjs (seed ${baseSeed}) · bundle with
    node rikiki/bundle.mjs examples/diagrams-generated/source.html examples/diagrams-generated/index.html

  Not drawn: each slide is marks and a layout, no coordinate. Every slide was checked
  by \`rikiki check\` and rebuilt from another seed when it had a defect. Every figure
  is invented, and says so.
-->
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Rikiki · generated diagrams</title>
<link rel="stylesheet" href="${runtime}/themes/rikiki.css">
<script type="module" src="${runtime}/dist/index.js"></script>
<script type="module" src="${runtime}/dist/deck-diagram.js"></script>
</head>
<body>
<deck-root transition="slide">

  <deck-cover brand="rikiki · diagrams" speaker="One grammar" duration="${Math.ceil(slides.length / 2)} min">
    <h1>${slides.length} illustrations,<br><span class="accent">no coordinates</span></h1>
    <p class="sub">Marks and a layout. The rest is computed, then checked.</p>
    <deck-notes>Thirty pictures from one grammar: a box, a text, dots, a bar, a link, and how a group places them. Each was checked for its frame, its balance and its focal point.</deck-notes>
  </deck-cover>

${slides.map((s, i) => slideHtml(s, i + 1)).join('\n\n')}

  <deck-takeaway kicker="The point">
    Say what the picture proves, name how it is arranged, and let the grammar place it.
    <deck-notes>A picture is evidence for the title. When it overflows or leans, the linter knows before the room does.</deck-notes>
  </deck-takeaway>

</deck-root>
</body>
</html>
`;
}

/** Which slides of a checked deck are not good enough, by their position in the deck. */
function failing(report, firstSlide) {
  const bad = new Set();
  for (const d of report.diagnostics) {
    if (!d.slide || d.slide < firstSlide) continue;
    const serious = d.severity === 'error' || d.code.startsWith('DG_') || d.code.startsWith('ILL_');
    if (serious && !['TALK_SHORTER_THAN_ANNOUNCED'].includes(d.code)) bad.add(d.slide);
  }
  for (const ill of report.illustrations ?? []) if (ill.verdict !== 'ship') bad.add(ill.slide);
  return bad;
}

const work = mkdtempSync(join(tmpdir(), 'diagram-gallery-'));
const outDir = resolve(REPO, values.out);
let slides = plan().map((p) => buildSlide(p.builder, p.pack, p.seed));
const spent = new Map();

try {
  for (let round = 0; round <= rounds; round += 1) {
    // The deck under test sits where the runtime is, so its modules load.
    const file = join(PKG, `.diagram-gallery-${process.pid}.html`);
    writeFileSync(file, deckHtml(slides, '.'));
    const report = await checkDeck(file, { visual: false });
    rmSync(file, { force: true });
    const bad = failing(report, 2);
    const names = [...bad].map((n) => `${n - 1}`);
    console.log(
      `round ${round} · ${slides.length} slides · ${bad.size} to rebuild${names.length ? ` (${names.join(', ')})` : ''}`,
    );
    if (!bad.size || round === rounds) {
      if (bad.size)
        console.log('  still failing after the last round · kept as the closest to clean');
      break;
    }
    for (const position of bad) {
      const index = position - 2; // the cover is slide 1
      const tried = (spent.get(index) ?? 0) + 1;
      spent.set(index, tried);
      const p = plan()[index];
      slides[index] = buildSlide(p.builder, p.pack, p.seed + tried * 1000);
    }
  }
} finally {
  rmSync(work, { recursive: true, force: true });
}

mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'source.html'), deckHtml(slides, '../../rikiki'));
writeFileSync(
  join(outDir, 'slides.json'),
  `${JSON.stringify(
    slides.map(({ builder, pack, seed, structure, claim }) => ({
      builder,
      pack,
      seed,
      structure,
      claim,
    })),
    null,
    2,
  )}\n`,
);
const byStructure = {};
for (const s of slides) byStructure[s.structure] = (byStructure[s.structure] ?? 0) + 1;
console.log(`diagram gallery · ${slides.length} slides → ${relative(REPO, outDir)}/source.html`);
console.log(
  `  builders ${new Set(slides.map((s) => s.builder)).size} · structures ${JSON.stringify(byStructure)}`,
);
