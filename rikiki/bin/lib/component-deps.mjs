// What a component needs loaded besides itself.
//
// A component may render another component's tag · deck-figure renders
// <deck-source> for its credit line, deck-annotate does the same, deck-graph
// renders <deck-icon>. The curated bundle is built from the tags written in
// the DECK (see scanComponents in inline.mjs), so those tags are invisible to
// it: the deck shipped without the module and the element stayed unregistered,
// rendering as bare text. decks/tests/figure.html is the live case.
//
// Read from dist/, not src/, for one reason: `rikiki bundle` runs from an
// installed package, where src/ does not exist. dist/ is also the only thing
// that can be wrong · a graph derived from what ships cannot disagree with
// what ships.
//
// The scan OVER-APPROXIMATES on purpose. `<deck-code` also appears in a
// warning string inside deck-code-highlighter and shiki, so both are reported
// as needing deck-code. That is the safe direction: a false positive adds a
// module the deck almost certainly wanted anyway (shiki highlights deck-code),
// while a false negative ships a deck with a missing element. Precision here
// would mean parsing minified JS to tell a Lit template from a string
// literal, which is a lot of machinery to save a few hundred bytes.

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/** Tags a module mentions in markup · `<deck-thing`. */
const RENDERED = /<(deck-[a-z0-9-]+)/g;

/** Every loadable module, mapped to the modules it needs beside it.
 *
 *  dist/ is flat and a file IS its tag (build.mjs entryNames '[name]'), so the
 *  filename is the lookup key. A secondary element defined inside a sibling's
 *  file · deck-kbd in deck-shortcut.js, deck-tier in deck-tier-list.js · has
 *  no module of its own and travels with its parent, which is why anything
 *  without a dist/<tag>.js is dropped rather than requested. */
export function componentGraph(distDir) {
  const modules = readdirSync(distDir)
    .filter((f) => f.endsWith('.js') && f.startsWith('deck-'))
    .map((f) => f.slice(0, -3));
  const known = new Set(modules);

  const graph = new Map();
  for (const tag of modules) {
    const source = readFileSync(join(distDir, `${tag}.js`), 'utf8');
    const deps = new Set();
    for (const [, found] of source.matchAll(RENDERED)) {
      if (found !== tag && known.has(found)) deps.add(found);
    }
    graph.set(tag, deps);
  }
  return graph;
}

/** The tags to load so every one of `tags` renders completely.
 *
 *  A closure over a visited set · a cycle between two components would be a
 *  defect to report, not a reason for this to recurse forever. */
export function expandDeps(tags, distDir, graph = componentGraph(distDir)) {
  const out = new Set();
  const queue = [...tags];
  while (queue.length > 0) {
    const tag = queue.pop();
    if (out.has(tag)) continue;
    out.add(tag);
    for (const dep of graph.get(tag) ?? []) if (!out.has(dep)) queue.push(dep);
  }
  // Keep only what can actually be loaded · a caller may pass deck-kbd.
  return [...out].filter((t) => existsSync(join(distDir, `${t}.js`)));
}
