// ════════════════════════════════════════════════════════════════
// RIKIKI · `rikiki recipe`, from a brief to a diagram drawn on a graphic model
//
//   rikiki recipe --list
//   rikiki recipe incident-band                 the brief to fill, the skeleton, the sequence
//   rikiki recipe incident-band --brief         the brief as JSON, filled with its example
//   rikiki recipe incident-band --example       the slide filled with that example
//   rikiki recipe incident-band --fill b.json   the slide filled with your brief, or why not
//   rikiki recipe "19 h sans un lead"           the closest recipe to a sentence
//
// No model: the cues of each recipe are looked for in the sentence, so the same
// sentence always gives the same recipe. A brief is refused when a field is empty,
// generic or left as written in the skeleton, or when it holds fewer than two
// precise values (a date, an hour, a number, an identifier).
// ════════════════════════════════════════════════════════════════

import { cuesIn } from '../../dist/intent.js';
import { GENERIC_WORDS, PRECISE_VALUE } from '../../dist/richness.js';
import { ExpectedError } from './cli-error.mjs';
import { RECIPES, RECIPE_NAMES } from './recipe-specs.mjs';

/** A brief needs this many precise values at least · what makes a picture concrete. */
export const MIN_PRECISE_VALUES = 2;


const pad = (text, width) => text.padEnd(width);

/** A recipe by its name or its model (`incident-band`, `M15`). */
export function recipeNamed(query) {
  const folded = query.trim().toLowerCase();
  return RECIPES.find((recipe) => recipe.name === folded || recipe.model.toLowerCase() === folded);
}

/** The recipes a sentence points at, the closest first · ties keep the registry's order. */
export function closestRecipes(sentence) {
  return RECIPES.map((recipe) => {
    const cues = cuesIn(sentence, recipe.cues);
    return { recipe, cues, score: cues.reduce((sum, cue) => sum + cue.split(/\s+/).length, 0) };
  })
    .filter((match) => match.score > 0)
    .sort((a, b) => b.score - a.score);
}

/** The example brief of a recipe, as an author writes one · field → value. */
export function exampleBrief(recipe) {
  return Object.fromEntries(recipe.brief.map((field) => [field.key, field.example]));
}

/** What is wrong with a brief, one sentence per field · empty when it can be drawn. */
export function briefProblems(recipe, brief) {
  const problems = [];
  let precise = 0;
  for (const field of recipe.brief) {
    const value = brief?.[field.key];
    const items = Array.isArray(value) ? value : [value];
    const text = items.map((item) => String(item ?? '').trim());
    if (value === undefined || value === null || text.every((item) => !item)) {
      problems.push(`${field.key} · empty · ${field.says}`);
      continue;
    }
    if (field.type === 'number' && !Number.isFinite(Number(value))) {
      problems.push(`${field.key} · "${value}" is not a number · ${field.says}`);
      continue;
    }
    if (field.type === 'rows' && !Array.isArray(value)) {
      problems.push(`${field.key} · one string per row, in a list · ${field.says}`);
      continue;
    }
    // Words left when the brief is not filled, and precise values, are read as the
    // richness of a drawing reads them (richness.ts).
    const vague = text.find((item) => GENERIC_WORDS.test(item) || item.includes('{{'));
    if (vague !== undefined) {
      problems.push(`${field.key} · "${vague}" says nothing · ${field.says}`);
      continue;
    }
    const long = field.max ? text.find((item) => [...item].length > field.max) : undefined;
    if (long !== undefined) {
      problems.push(`${field.key} · "${long}" is ${[...long].length} characters, ${field.max} at most · its place holds no more`);
      continue;
    }
    if (field.type !== 'number' && text.some((item) => PRECISE_VALUE.test(item))) precise += 1;
  }
  const unknown = Object.keys(brief ?? {}).filter((key) => !recipe.brief.some((f) => f.key === key));
  for (const key of unknown) problems.push(`${key} · not a field of ${recipe.name}`);
  if (precise < MIN_PRECISE_VALUES)
    problems.push(
      `${precise} precise value${precise === 1 ? '' : 's'} · write ${MIN_PRECISE_VALUES} at least, in the words: a date, an hour, a count, an identifier`,
    );
  return problems;
}

/** A value written into the skeleton · a list of rows one per line, indented under
 *  the line it stands in (the diagram drops the indentation), escaped as text: a
 *  value stands in an attribute or between tags, and never becomes markup there. */
function written(value, indent) {
  const escape = (text) =>
    String(text).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  if (!Array.isArray(value)) return escape(value);
  return value.map((row) => `\n${indent}  ${escape(row)}`).join('');
}

/** The skeleton of a recipe with the brief written in · checked first. */
export function fillRecipe(recipe, brief) {
  const problems = briefProblems(recipe, brief);
  if (problems.length)
    throw new ExpectedError(
      `the brief of ${recipe.name} cannot be drawn:\n  ${problems.join('\n  ')}\n\nrikiki recipe ${recipe.name} --brief prints one filled with its example`,
    );
  const values = { ...brief, name: recipe.name };
  return recipe.skeleton
    .split('\n')
    .map((line) => {
      const indent = line.match(/^\s*/)[0];
      return line.replace(/\{\{(\w+)\}\}/g, (_, key) => written(values[key], indent));
    })
    .join('\n');
}

/** Every recipe · its model, what it shows, its tempo. */
export function formatRecipeList() {
  const lines = ['rikiki · recipes · twelve graphic models, told as stories', ''];
  for (const recipe of RECIPES)
    lines.push(`  ${pad(recipe.name, 20)}${pad(recipe.model, 5)}${pad(recipe.tempo, 10)}${recipe.shows}`);
  lines.push(
    '',
    `${RECIPES.length} recipes · rikiki recipe <name> prints its brief, its skeleton and its sequence;`,
    'rikiki recipe "<sentence>" picks the closest; --fill brief.json writes the slide.',
  );
  return lines.join('\n');
}

/** The brief, the sequence, what the check guarantees and the pitfalls of a recipe, as
 *  a comment above its skeleton · `found` says which cues of the sentence led there. */
export function formatRecipe(recipe, found = null) {
  const width = Math.max(...recipe.brief.map((field) => field.key.length)) + 2;
  const lines = [
    `<!-- recipe · ${recipe.name} · ${recipe.model} ${recipe.title} (talk slides ${recipe.talk}) · ${recipe.tempo}`,
    `     shows: ${recipe.shows}`,
  ];
  if (found) lines.push(`     picked from the sentence: ${found}`);
  lines.push('     the brief first · every field filled with a real fact, two precise values at least:');
  for (const field of recipe.brief)
    lines.push(
      `       ${pad(field.key, width)}${field.says}${field.max ? ` (${field.max} characters at most)` : ''} · e.g. ${JSON.stringify(field.example)}`,
    );
  lines.push('     the sequence it plays, in this order:');
  for (const [beat, what] of recipe.sequence) lines.push(`       ${pad(beat, 8)}${what}`);
  lines.push('     what the check guarantees:');
  for (const guarantee of recipe.guarantees) lines.push(`       ${guarantee}`);
  lines.push(`     not when: ${recipe.avoid}`, `     neighbours: ${recipe.neighbours.join(', ')}`, '     pitfalls:');
  for (const pitfall of recipe.pitfalls) lines.push(`       ${pitfall}`);
  lines.push(
    `     fill it: rikiki recipe ${recipe.name} --brief > brief.json, edit it, then`,
    `              rikiki recipe ${recipe.name} --fill brief.json · check it: rikiki check deck.html --steps -->`,
    recipe.skeleton,
  );
  return lines.join('\n');
}

/** What `rikiki recipe <query>` prints · the recipe named, else the closest to the sentence. */
export function answerRecipe(query) {
  const named = recipeNamed(query);
  if (named) return formatRecipe(named);
  const [best] = closestRecipes(query);
  if (!best)
    throw new ExpectedError(
      `no recipe found in "${query}" · say what happens (a void of hours, a stop tested, a probe, a switch-over, a race, an escalation…), or name one: ${RECIPE_NAMES.join(', ')} · rikiki intent "<sentence>" for a relation`,
    );
  return formatRecipe(best.recipe, best.cues.map((cue) => `"${cue}"`).join(', '));
}

/** The recipe a CLI call names · an unknown name is refused with the list. */
export function recipeOrFail(query) {
  const recipe = recipeNamed(query);
  if (!recipe) throw new ExpectedError(`unknown recipe "${query}" · one of ${RECIPE_NAMES.join(', ')}`);
  return recipe;
}
