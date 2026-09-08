// ════════════════════════════════════════════════════════════════
// A slide title states the message · it does not name the topic
//
// The assertion-evidence structure (Michael Alley, Penn State) puts a full
// sentence at the top of a content slide, of about eight to fourteen words, and
// supports it with visual evidence rather than a bullet list. The comprehension
// gain against the common topic-subtitle practice is statistically significant,
// which is why this is a rule here and not a preference.
//
// Measured on the shipped decks before it was adopted: a median title of four
// words, and zero of the twenty-three in the showcase inside the band. A title
// that names a topic carries no message, so the body has to carry all of it,
// which is exactly the slide with nothing to look at.
//
// It costs nothing in type size · at the shipped title size the usable width
// holds about forty-four characters a line, so fourteen words fit on two.
//
// Covers and chapter titles are exempt by construction: a chapter title is a
// boundary, not an assertion, and three words are right there.
//
// https://writing.engr.psu.edu/research.html
// ════════════════════════════════════════════════════════════════

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { REPO_ROOT } from './size-surfaces.mjs';

/** The decks whose titles are a public example of how to write one. */
const DECKS = [
  'examples/showcase/index.html',
  'examples/rikiki-tour/index.html',
  'rikiki/starter.html',
];

/** Layouts whose h1 is a boundary rather than a message. */
const EXEMPT = ['deck-cover', 'deck-section'];

const MIN_WORDS = 6;
const MAX_WORDS = 16;

/**
 * Every content-slide title of a deck, with the layout that carries it.
 *
 * Read from the markup rather than from a rendered page on purpose · this is a
 * question about what the author wrote, and it has to fail in a unit run rather
 * than behind a browser.
 */
function titles(html) {
  const found = [];
  for (const h1 of html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g)) {
    /* The layout a title belongs to is the nearest deck-* opening tag before
       it. Matching a tag against its own closing tag instead would pair every
       h1 with deck-root, because the outermost element closes last. */
    const before = html.slice(0, h1.index);
    const opens = [...before.matchAll(/<(deck-[\w-]+)\b/g)];
    const tag = opens.length ? opens[opens.length - 1][1] : 'unknown';
    if (EXEMPT.includes(tag)) continue;
    const words = h1[1]
      .replace(/<[^>]+>/g, ' ')
      .replace(/&[a-z]+;/g, ' ')
      .split(/\s+/)
      .filter(Boolean);
    if (words.length) found.push({ tag, text: words.join(' '), words: words.length });
  }
  return found;
}

describe.each(DECKS)('%s', (deck) => {
  const html = readFileSync(join(REPO_ROOT, deck), 'utf8');
  const found = titles(html);

  it('has content slides to judge', () => {
    expect(found.length, `${deck} has no titled content slide`).toBeGreaterThan(0);
  });

  it('states its titles as sentences, not as topics', () => {
    const short = found.filter((t) => t.words < MIN_WORDS || t.words > MAX_WORDS);
    expect(
      short.map((t) => `${t.words} words · ${t.tag} · "${t.text}"`),
      `a content title says what the slide argues, in ${MIN_WORDS} to ${MAX_WORDS} words`,
    ).toEqual([]);
  });
});
