// ════════════════════════════════════════════════════════════════
// Icon curation for `rikiki bundle`
//
// The same bargain the component curation already makes: a bundled deck should
// carry the glyphs it writes and nothing else. The set is stored as ONE JSON
// string literal (src/shared/icon-set.ts), which survives minification byte for
// byte, so pruning is an exact swap rather than a hunt through minified object
// syntax.
//
// Pure string work · no parser, no DOM, unit-testable.
// ════════════════════════════════════════════════════════════════

/** Every `name` a deck writes on a `<deck-icon>` · quoted or not. */
export function iconNamesIn(html) {
  const names = new Set();
  for (const tag of html.matchAll(/<deck-icon\b([^>]*)>/gi)) {
    const attrs = tag[1] ?? '';
    const m = /\bname\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/i.exec(attrs);
    const value = (m?.[1] ?? m?.[2] ?? m?.[3] ?? '').trim().toLowerCase();
    if (value) names.add(value);
  }
  return names;
}

/** The JSON payload of the icon set inside a bundle, or null when absent. */
export function findIconData(js) {
  // Match the literal the module emits · a single-quoted JSON object.
  const re = /'(\{"[a-z-]+":"M[^']*\})'/;
  const m = re.exec(js);
  if (!m) return null;
  try {
    return { raw: m[1], index: m.index + 1, set: JSON.parse(m[1]) };
  } catch {
    return null;
  }
}

/**
 * Replace the icon set with only the glyphs the deck uses.
 *
 * Returns the rewritten JS and what was done, so the CLI can report it. When
 * the deck writes NO icon name the set is emptied rather than kept: a deck with
 * only slotted SVGs needs none of it.
 *
 * The set is left untouched when it cannot be found, when the deck uses a name
 * the set does not have (which means something else is going on and dropping
 * glyphs would make it worse), or when nothing would be saved.
 */
export function pruneIcons(js, html) {
  const found = findIconData(js);
  if (!found) return { js, pruned: false, reason: 'no icon set in the bundle' };

  const used = iconNamesIn(html);
  const unknown = [...used].filter((n) => !(n in found.set));
  if (unknown.length > 0) {
    return { js, pruned: false, reason: `unknown icon name: ${unknown.join(', ')}` };
  }

  const kept = {};
  for (const name of Object.keys(found.set)) {
    if (used.has(name)) kept[name] = found.set[name];
  }
  const replacement = JSON.stringify(kept).replace(/'/g, "\\'");
  if (replacement.length >= found.raw.length) {
    return { js, pruned: false, reason: 'nothing to drop' };
  }

  return {
    js: js.slice(0, found.index) + replacement + js.slice(found.index + found.raw.length),
    pruned: true,
    kept: Object.keys(kept),
    dropped: Object.keys(found.set).length - Object.keys(kept).length,
    saved: found.raw.length - replacement.length,
  };
}
