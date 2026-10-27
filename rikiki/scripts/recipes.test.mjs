import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { RECIPES } from '../bin/lib/recipe-specs.mjs';
import {
  briefProblems,
  closestRecipes,
  exampleBrief,
  fillRecipe,
  recipeNamed,
} from '../bin/lib/recipe.mjs';
import { choreograph } from '../src/media/diagram/choreography.ts';
import { compileIntent } from '../src/media/diagram/intent.ts';
import { layoutDiagram } from '../src/media/diagram/layout.ts';
import { parseDiagram } from '../src/media/diagram/model.ts';
import { planStory, readSeconds } from '../src/media/diagram/story.ts';
import { readMarkup } from './fixtures/read-markup.mjs';

// A recipe is what an agent copies to draw a graphic model:
// filled with its example brief, every skeleton is a story written in the grammar,
// laid out inside its room, timed inside its budget with a working system before it
// breaks, and the acceptance deck is each skeleton filled with another brief. The
// check in a browser (ILL_*) runs on the same fills in e2e/render-check.spec.ts.

const PKG_DIR = join(dirname(fileURLToPath(import.meta.url)), '..');
const DECK = readFileSync(join(PKG_DIR, 'decks', 'tests', 'deck-diagram-recipes.html'), 'utf8');

const meter = (size) => (text) => text.length * size * 0.55;
const BOUNDS = { w: 1600, h: 600 };

/** The diagram of a slide · the part the grammar reads. */
const diagramOf = (html) => html.match(/<deck-diagram[\s\S]*<\/deck-diagram>/)[0];

/** The slide of a deck by its id. */
const slideOf = (html, id) =>
  html.match(new RegExp(`<deck-feature id="${id}"[\\s\\S]*?</deck-feature>`))?.[0];

/** What a piece of markup is made of, words aside · each element and the names of its
 *  attributes, in order. Two fills of one skeleton have the same shape. */
function shapeOf(html) {
  const walk = (node) => [
    `${node.localName}(${Object.keys(node.attrs).sort().join(' ')})`,
    ...node.children.flatMap(walk),
  ];
  return walk(readMarkup(diagramOf(html)));
}

/** A filled recipe, parsed, laid out at every click and timed as a story. */
function draw(html) {
  const parsed = parseDiagram(readMarkup(diagramOf(html)), compileIntent);
  const drawn = layoutDiagram(parsed, { meter, bounds: BOUNDS });
  const plan = planStory(drawn, choreograph(drawn, drawn.tree), {
    budget: readSeconds(parsed.attrs.budget) || undefined,
  });
  return { parsed, drawn, plan };
}

describe('the recipes', () => {
  it('are the twelve graphic models, in the order they were written', () => {
    expect(RECIPES.map((r) => r.model)).toEqual([
      'M15',
      'M22',
      'M16',
      'M17',
      'M21',
      'M23',
      'M19',
      'M20',
      'M24',
      'M25',
      'M14',
      'M3',
    ]);
  });

  for (const recipe of RECIPES) {
    describe(recipe.name, () => {
      const html = fillRecipe(recipe, exampleBrief(recipe));

      it('asks for every field it writes, and writes every field it asks for', () => {
        const slots = new Set([...recipe.skeleton.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]));
        slots.delete('name');
        expect([...slots].sort()).toEqual(recipe.brief.map((f) => f.key).sort());
        expect(briefProblems(recipe, exampleBrief(recipe))).toEqual([]);
        expect(html).not.toMatch(/\{\{|\b(x|y|width|height|style)="/);
      });

      it('filled with its example, is a story in the grammar that fits its room', () => {
        const { parsed, drawn, plan } = draw(html);
        const errors = parsed.issues.filter((i) => i.severity === 'error');
        expect(errors, JSON.stringify(errors)).toEqual([]);
        expect(parsed.issues.filter((i) => i.code === 'DG_ATTR_UNKNOWN')).toEqual([]);
        expect(parsed.story).toBe(true);
        expect(drawn.status, drawn.reasons.join('; ')).toBe('fit');
        expect(plan.issues, JSON.stringify(plan.issues)).toEqual([]);
      });

      it('plays six to twelve seconds, its system running before it breaks', () => {
        const { script } = draw(html).plan;
        expect(script.playedMs).toBeGreaterThanOrEqual(6000);
        expect(script.playedMs).toBeLessThanOrEqual(10_000);
        expect(script.writtenMs).toBeLessThanOrEqual(12_000);
        if (script.beats.some((b) => b.phase === 'event'))
          expect(script.steadyMs).toBeGreaterThanOrEqual(1500);
        // The steady beat is often an attribute (`steady="3s"` on a lane, a link, a band),
        // not a mark of its own · every other beat of the sequence is a declared one.
        for (const [beat] of recipe.sequence.filter(([b]) => b !== 'steady'))
          expect(
            script.beats.some((b) => b.phase === beat && b.declared),
            beat,
          ).toBe(true);
      });

      it('is drawn in the acceptance deck with another brief of its own', () => {
        const slide = slideOf(DECK, recipe.name);
        expect(slide, `#${recipe.name} in deck-diagram-recipes.html`).toBeTruthy();
        expect(shapeOf(slide)).toEqual(shapeOf(html));
        expect(diagramOf(slide)).not.toBe(diagramOf(html));
        expect(slide).toMatch(/<deck-source>Illustration · [^<]*inventé/);
      });
    });
  }
});

describe('a brief', () => {
  const recipe = recipeNamed('incident-band');
  const example = exampleBrief(recipe);

  it('is refused empty, generic, half filled or with no precise value', () => {
    expect(briefProblems(recipe, {}).length).toBeGreaterThan(recipe.brief.length - 1);
    expect(briefProblems(recipe, { ...example, flow: 'service A' }).join()).toMatch(
      /flow · "service A" says nothing/,
    );
    expect(briefProblems(recipe, { ...example, loss: 'beaucoup' }).join()).toMatch(
      /loss · "beaucoup" is not a number/,
    );
    expect(briefProblems(recipe, { ...example, cutTag: '{{cutTag}}' }).join()).toMatch(/cutTag/);
    expect(briefProblems(recipe, { ...example, colour: 'red' }).join()).toMatch(
      /colour · not a field/,
    );
    const vague = Object.fromEntries(
      Object.entries(example).map(([key, value]) => [
        key,
        typeof value === 'number' ? value : 'il est cassé',
      ]),
    );
    expect(briefProblems(recipe, vague).join()).toMatch(/0 precise values/);
    expect(() => fillRecipe(recipe, { ...example, gap: '' })).toThrow(/gap · empty/);
  });

  it('writes its rows one per line and escapes its quotes', () => {
    const filter = recipeNamed('filter-records');
    const html = fillRecipe(filter, { ...exampleBrief(filter), found: '1 bug « "é" »' });
    expect(html).toContain('&quot;é&quot;');
    expect(html).toMatch(/rows="\n\s+Ольга Петрова · CFO\n\s+José Ñúñez · Ventas/);
  });
});

describe('a sentence', () => {
  it('finds its recipe, the same every time', () => {
    for (const [sentence, name] of [
      ['Tout est vert, et 19 h sans un lead', 'incident-band'],
      ['Mon bouton stop, je le teste comment ?', 'lanes-gate'],
      ['Comment je sais que mes leads arrivent bien ?', 'probe-stations'],
      ["Et qui me prouve qu'un test a tourné ?", 'wiring'],
      ['Le serveur de secours prend la main', 'switch-over'],
      ['Comment on évite le rapport en double ?', 'race-lock'],
      ['Quelles données de test, anonymisées ?', 'filter-records'],
      ['Changer mon API sans casser les clients : migrer vers v2', 'version-lanes'],
      ['3 h du matin, qui répond ? Astreinte et escalade', 'escalation-runbook'],
      ['Le heartbeat se tait : plus aucun battement', 'pulse-threshold'],
      ['Mon code est bon. Et autour ?', 'scope-rings'],
      ['À quoi ressemblent ces dix mois ?', 'data-replay'],
    ]) {
      expect(closestRecipes(sentence)[0]?.recipe.name, sentence).toBe(name);
      expect(closestRecipes(sentence)).toEqual(closestRecipes(sentence));
    }
    expect(closestRecipes('Bonjour à tous')).toEqual([]);
    expect(recipeNamed('m15')?.name).toBe('incident-band');
  });
});
