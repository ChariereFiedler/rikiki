// ════════════════════════════════════════════════════════════════
// RIKIKI · which slides a command works on
//
// `--slides 3`, `--slides 2,intro,4`, `--slides 4-9`, `--slides -3,8-`,
// `--slides intro..conclusion` · one grammar for `render` and `check`, so a
// slide picked for a picture is picked the same way for a measurement.
//
//   N            the slide at that 1-based position
//   id           the slide with that id (ids hold hyphens, "u2-etat" is an id)
//   A-B          positions A to B, inclusive · "-B" starts at 1, "A-" runs to the end
//   A..B         from one slide to another, each end a position or an id
//
// A name that matches nothing is an error, never a silently missing slide.
// ════════════════════════════════════════════════════════════════

import { ExpectedError } from './cli-error.mjs';

/** Positions only, one hyphen, at least one digit · "u2-etat" and "-" are not. */
const NUMBER_RANGE = /^(\d*)-(\d*)$/;

const describeDeck = (outline) =>
  outline.map((s) => (s.id ? `${s.index} (${s.id})` : String(s.index))).join(', ');

/** The slide a single end of a range names, by position first, then by id. */
function slideNamed(outline, name) {
  const byNumber = /^\d+$/.test(name) ? outline.find((s) => s.index === Number(name)) : null;
  return byNumber ?? outline.find((s) => s.id === name);
}

/** The slides a token covers, or null when it names nothing in this deck. */
function slidesOf(outline, token) {
  const numbers = token.match(NUMBER_RANGE);
  if (numbers && token !== '-') {
    const from = numbers[1] === '' ? 1 : Number(numbers[1]);
    const to = numbers[2] === '' ? outline.length : Number(numbers[2]);
    if (from > to || from < 1 || to > outline.length) return null;
    return outline.filter((s) => s.index >= from && s.index <= to);
  }
  if (token.includes('..')) {
    const [startName, endName, ...rest] = token.split('..');
    const start = slideNamed(outline, startName);
    const end = slideNamed(outline, endName);
    if (rest.length || !start || !end || start.index > end.index) return null;
    return outline.filter((s) => s.index >= start.index && s.index <= end.index);
  }
  const single = slideNamed(outline, token);
  return single ? [single] : null;
}

/** Resolve a selector against the outline · the deck's order, each slide once.
 *  Without a selector every slide is chosen. `command` names the caller in the
 *  error, and `exitCode` is what that caller exits with when the selector is
 *  wrong (`check` keeps 1 for "the deck has defects"). */
export function selectSlides(outline, selector, { command = 'render', exitCode = 1 } = {}) {
  if (!selector) return outline;
  const tokens = selector
    .split(',')
    .map((token) => token.trim())
    .filter(Boolean);
  const chosen = new Map();
  const unknown = [];
  for (const token of tokens) {
    const slides = slidesOf(outline, token);
    if (!slides) unknown.push(token);
    else for (const slide of slides) chosen.set(slide.index, slide);
  }
  if (unknown.length) {
    throw new ExpectedError(
      `${command} · no slide matches ${unknown.map((u) => `"${u}"`).join(', ')}\n` +
        `  this deck has: ${describeDeck(outline)}\n` +
        '  write a position (3), an id, an interval (4-9, -3, 8-) or two ends (intro..outro)',
      { exitCode },
    );
  }
  if (!chosen.size) {
    throw new ExpectedError(`${command} · --slides "${selector}" names no slide`, { exitCode });
  }
  return [...chosen.values()].sort((a, b) => a.index - b.index);
}
