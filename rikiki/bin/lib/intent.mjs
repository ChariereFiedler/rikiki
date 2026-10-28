// ════════════════════════════════════════════════════════════════
// RIKIKI · `rikiki intent`, from a sentence to a diagram written as an intent
//
//   rikiki intent "Six dossiers arrivent, la validation en traite deux"
//   rikiki intent bottleneck
//   rikiki intent --list
//
// Prints the skeleton of the closest intent, ready to paste, with its roles, their
// bounds and the mistakes the linter names, as an HTML comment above it. No model:
// the cues of each intent are looked for in the sentence (dist/intent.js), so the
// same sentence always gives the same skeleton.
// ════════════════════════════════════════════════════════════════

import { INTENTS, INTENT_NAMES, REFUSED_BECAUSE, closestIntents } from '../../dist/intent.js';
import { ExpectedError } from './cli-error.mjs';
import { closestRecipes } from './recipe.mjs';

/** A role's bounds as an author reads them · `1`, `0 to 3`. */
const bounds = (role) => (role.min === role.max ? `${role.min}` : `${role.min} to ${role.max}`);

const pad = (text, width) => text.padEnd(width);

/** Every intent of the grammar · its family, what it shows and what it looks like. */
export function formatIntentList() {
  const lines = ['rikiki · intents · a diagram says what it demonstrates, the marks say their part', ''];
  const showsWidth = Math.max(...INTENT_NAMES.map((name) => INTENTS[name].shows.length)) + 2;
  for (const name of INTENT_NAMES) {
    const spec = INTENTS[name];
    lines.push(`  ${pad(name, 12)}${pad(spec.family, 11)}${pad(spec.shows, showsWidth)}${spec.looks}`);
  }
  lines.push(
    '',
    `${INTENT_NAMES.length} intents, each drawn its own way · one main and two secondaries at most (also="…").`,
    'rikiki intent <name> prints the skeleton of one; rikiki intent "<sentence>" picks the closest.',
  );
  return lines.join('\n');
}

/** What an intent takes as secondaries, or why it takes none. */
function composition(compiled) {
  return compiled.composes.length
    ? `composes with: ${compiled.composes.map((other) => `also="${other}"`).join(', ')}`
    : 'composes with nothing · a picture of its own';
}

/** The skeleton of an intent, its roles, bounds and typical mistakes above it in a
 *  comment · `found` says which cues of the sentence led there. */
export function formatIntent(name, found = null) {
  const spec = INTENTS[name];
  const compiled = spec.compiled;
  const width = Math.max(...compiled.roles.map((r) => r.role.length)) + 2;
  const tagWidth = Math.max(...compiled.roles.map((r) => r.tags.join(' or ').length)) + 2;
  const lines = [`<!-- intent · ${name} · ${spec.shows} (${spec.family}) · drawn as ${spec.looks}`];
  if (found) lines.push(`     picked from the sentence: ${found}`);
  lines.push('     roles · role="…" on the marks, as many as the bounds say:');
  for (const role of compiled.roles)
    lines.push(
      `       ${pad(role.role, width)}${pad(role.tags.join(' or '), tagWidth)}${pad(bounds(role), 9)}${role.says}`,
    );
  lines.push(`     ${composition(compiled)}`, '     what the check rejects:');
  for (const pitfall of compiled.pitfalls) lines.push(`       ${pitfall.code} · ${pitfall.says}`);
  lines.push(
    '       INT_ROLE_MISSING · a role with fewer marks than its bounds',
    `       INT_COMPOSE_INVALID · ${REFUSED_BECAUSE}`,
    '     no layout, no coordinate, no duration: the intent places and times it.',
    '     check every click: npx rikiki check deck.html --slides N --steps -->',
    compiled.skeleton,
  );
  return lines.join('\n');
}

/** `rikiki intent` found no intent, but recipes fit the sentence · said on stderr, the
 *  closest recipes listed, and its own exit code so a script tells it from a failure. */
export const NO_INTENT_RECIPES_EXIT = 3;

/** The recipes a sentence points at, at most three, as a line each. */
const nearRecipes = (query) =>
  closestRecipes(query)
    .slice(0, 3)
    .map(({ recipe }) => `rikiki recipe ${recipe.name}  (${recipe.model} · ${recipe.shows})`);

/** What `rikiki intent <query>` prints · the skeleton of the intent named, else of
 *  the intent the sentence points at, else the recipes it points at (exit 3). */
export function answerIntent(query) {
  if (INTENT_NAMES.includes(query)) return formatIntent(query);
  const [best] = closestIntents(query);
  if (!best) {
    const recipes = nearRecipes(query);
    if (recipes.length)
      throw new ExpectedError(
        `no intent found in "${query}" · the sentence tells a story: the closest recipes are\n  ${recipes.join('\n  ')}`,
        { exitCode: NO_INTENT_RECIPES_EXIT },
      );
    throw new ExpectedError(
      `no intent found in "${query}" · say what the picture demonstrates (it cuts, it waits, it piles up, it loops, it spreads, past a line, at the cost of, before and after), or name one: ${INTENT_NAMES.join(', ')} · rikiki recipe --list for a story`,
    );
  }
  const near = closestRecipes(query).map(({ recipe }) => recipe.name);
  const text = formatIntent(best.name, best.cues.map((cue) => `"${cue}"`).join(', '));
  if (!near.length) return text;
  return text.replace(
    '     roles · role=',
    `     recipes near it, told as a story: ${near.slice(0, 3).join(', ')} (rikiki recipe <name>)\n     roles · role=`,
  );
}
