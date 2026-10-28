#!/usr/bin/env node
// ════════════════════════════════════════════════════════════════
// Build the generated scene gallery · examples/scenes-generated
//
//   node scripts/build-scene-gallery.mjs [--count 30] [--seed 1] [--out examples/scenes-generated]
//
// Not thirty drawings written by hand: thirty BRIEFS, written by the recipes of
// `rikiki scene` from vocabulary packs and a seed, planned by the planner, and
// compiled into slides. The deck is the proof that the workflow reaches the
// variety it claims, and `rikiki check` on it must say nothing.
//
// Variety is chosen, not hoped for: the recipes are taken in turn, the packs
// rotate, the seed moves on, and the candidate shown cycles through those that
// fit, so every shape and every composition appears. Same arguments, same deck.
// ════════════════════════════════════════════════════════════════

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { compileSlide, planScenes } from '../bin/lib/scene-plan.mjs';
import { PACKS, RECIPES, buildBrief } from '../bin/lib/scene-recipes.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const PKG = join(HERE, '..');
const REPO = join(PKG, '..');

const { values } = parseArgs({
  options: {
    count: { type: 'string', default: '30' },
    seed: { type: 'string', default: '1' },
    out: { type: 'string', default: 'examples/scenes-generated' },
  },
});

const count = Number(values.count);
const seed = Number(values.seed);
const packNames = Object.keys(PACKS);

/** The briefs of the gallery · recipes in turn, packs rotating, the seed moving
 *  on at each lap, so no two slides are the same recipe on the same pack and seed. */
function chosenBriefs() {
  const chosen = [];
  for (let i = 0; i < count; i += 1) {
    const recipe = RECIPES[i % RECIPES.length];
    const lap = Math.floor(i / RECIPES.length);
    const pack = packNames[(i + lap) % packNames.length];
    const brief = buildBrief(recipe.id, { pack, seed: seed + lap * 17 + i });
    chosen.push({ recipe: recipe.id, pack, seed: seed + lap * 17 + i, brief });
  }
  return chosen;
}

const slides = [];
const modules = new Set(['index']);
const used = new Set();

for (const [index, entry] of chosenBriefs().entries()) {
  const plan = planScenes(entry.brief);
  if (!plan.ok)
    throw new Error(`${entry.recipe}/${entry.pack}/${entry.seed}: ${JSON.stringify(plan.errors)}`);
  const fitting = plan.candidates.filter((candidate) => candidate.fits);
  if (!fitting.length)
    throw new Error(`${entry.recipe}/${entry.pack}/${entry.seed}: no candidate fits`);
  // Cycle through the candidates that fit, so a recipe with two (units and bars)
  // shows both across the gallery rather than always the first.
  const candidate = fitting[Math.floor(index / RECIPES.length) % fitting.length];
  const brief = { ...entry.brief, eyebrow: `${entry.recipe} · ${candidate.id}` };
  let compiled = compileSlide(brief, candidate);
  // Two briefs can have the same claim · a slide id is unique in a deck.
  let id = compiled.html.match(/<deck-feature id="([^"]+)"/)[1];
  if (used.has(id)) {
    const unique = `${id}-${index + 1}`;
    compiled = { ...compiled, html: compiled.html.replace(`id="${id}"`, `id="${unique}"`) };
    id = unique;
  }
  used.add(id);
  for (const name of candidate.imports) modules.add(name);
  slides.push({ ...entry, candidate: candidate.id, form: candidate.form, id, html: compiled.html });
}

const scripts = [...modules]
  .sort((a, b) => (a === 'index' ? -1 : b === 'index' ? 1 : a.localeCompare(b)))
  .map((name) => `<script type="module" src="../../rikiki/dist/${name}.js"></script>`)
  .join('\n');

const indent = (html) =>
  html
    .split('\n')
    .map((line) => (line ? `  ${line}` : line))
    .join('\n');

const deck = `<!doctype html>
<!--
  Rikiki · generated scene gallery · ${slides.length} illustrations from briefs
  Authoring view · built by scripts/build-scene-gallery.mjs (seed ${seed}) · run
    node rikiki/bundle.mjs examples/scenes-generated/source.html examples/scenes-generated/index.html
  to produce a single-file shareable copy with everything inlined.

  Not drawn by hand: every slide below was written from a brief by \`rikiki scene\`
  (a recipe, a vocabulary pack, a seed), planned, and compiled. The briefs are in
  briefs.json. Every figure is invented, and each slide says so in its source.
-->
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Rikiki · generated scenes</title>
<link rel="stylesheet" href="../../rikiki/themes/rikiki.css">
${scripts}
</head>
<body>
<deck-root transition="slide">

  <deck-cover brand="rikiki · scenes" speaker="From briefs" duration="${Math.ceil(slides.length / 2)} min">
    <h1>${slides.length} illustrations,<br><span class="accent">no coordinates</span></h1>
    <p class="sub">Each one written from a brief, planned, compiled, checked.</p>
    <deck-notes>
      Thirty slides, none drawn by hand. Each started as a brief: the claim, the relation between the items, the figures and their source. The planner picked the shapes that can say it and checked them against the measured capacity of every field.
    </deck-notes>
  </deck-cover>

${slides.map((slide) => indent(slide.html)).join('\n\n')}

  <deck-takeaway kicker="The point">
    Write what the room must understand, name the relation, and let the shape follow.
    <deck-notes>
      The shape is a consequence of the relation, not a taste. When the relation is wrong, the brief says so before a slide exists.
    </deck-notes>
  </deck-takeaway>

</deck-root>
</body>
</html>
`;

const out = resolve(REPO, values.out);
mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'source.html'), deck);
writeFileSync(
  join(out, 'briefs.json'),
  `${JSON.stringify(
    slides.map(({ recipe, pack, seed: s, candidate, form, id, brief }) => ({
      id,
      recipe,
      pack,
      seed: s,
      candidate,
      form,
      brief,
    })),
    null,
    2,
  )}\n`,
);

const byForm = {};
for (const slide of slides) byForm[slide.candidate] = (byForm[slide.candidate] ?? 0) + 1;
console.log(`scene gallery · ${slides.length} slides → ${relative(REPO, out)}/source.html`);
console.log(
  `  recipes ${new Set(slides.map((s) => s.recipe)).size} · packs ${new Set(slides.map((s) => s.pack)).size} · candidates ${JSON.stringify(byForm)}`,
);
