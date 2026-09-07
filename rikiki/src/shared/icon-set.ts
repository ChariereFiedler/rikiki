// ════════════════════════════════════════════════════════════════
// RIKIKI · the icon set
//
// A CLOSED set, drawn here, vendored from nothing. Twenty-four glyphs chosen
// for technical and business decks · the vocabulary a slide actually needs, not
// a library that grows by one icon per request.
//
// Every path is drawn on a 24x24 grid with a 2px stroke and no fill, so a glyph
// inherits `currentColor` and the stroke stays even at any projected size. That
// also keeps the whole set under 3 KB, which is why it can ship inline and
// survive `rikiki bundle` with no network at runtime.
//
// The rule for what enters: it must be unambiguous at ten metres, it must not
// duplicate an existing glyph, and it must be nameable in one word. Anything
// else belongs in a slotted <svg>, which deck-icon also accepts.
//
// WHY A JSON STRING · `rikiki bundle` prunes this set down to the glyphs the
// deck actually writes, the same curation it already does for components. A
// single string literal survives minification byte for byte, so the pruning is
// an exact swap the CLI can verify, instead of a regex hunt through minified
// object syntax. See bin/lib/prune-icons.mjs.
// ════════════════════════════════════════════════════════════════

/** The set, as a JSON string so the bundler can swap it for a pruned one.
 *  The sentinel below is what the CLI looks for · do not reformat this line. */
const ICON_DATA =
  /* rikiki:icons */ '{"check":"M20 6 9 17l-5-5","cross":"M18 6 6 18M6 6l12 12","alert":"M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z","info":"M12 16v-4m0-4h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z","question":"M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3m.1 4h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z","ban":"M4.9 4.9l14.2 14.2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z","arrow":"M5 12h14m-6-6 6 6-6 6","arrow-down":"M12 5v14m6-6-6 6-6-6","clock":"M12 6v6l4 2m6-2a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z","calendar":"M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z","refresh":"M21 12a9 9 0 1 1-3-6.7M21 3v6h-6","trend":"M22 7 13.5 15.5l-5-5L2 17M16 7h6v6","user":"M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z","team":"M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Zm10 14v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8","target":"M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0-6a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 9a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z","flag":"M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1Zm0 0v7","lock":"M7 11V7a5 5 0 0 1 10 0v4M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z","search":"M21 21l-4.3-4.3M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z","code":"M16 18l6-6-6-6M8 6l-6 6 6 6","database":"M3 5c0 1.7 4 3 9 3s9-1.3 9-3-4-3-9-3-9 1.3-9 3Zm0 0v14c0 1.7 4 3 9 3s9-1.3 9-3V5M3 12c0 1.7 4 3 9 3s9-1.3 9-3","cloud":"M17.5 19a4.5 4.5 0 0 0 0-9h-1.3A7 7 0 1 0 4 16.9","document":"M14 2v6h6M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Zm-6 11h8m-8 4h8m-8-8h2","chart":"M3 3v18h18M7 16V9m5 7V5m5 11v-4","spark":"M12 2 15 9l7 3-7 3-3 7-3-7-7-3 7-3Z"}';

export const ICONS: Readonly<Record<string, string>> = Object.freeze(JSON.parse(ICON_DATA));

export type IconName = string;

export const ICON_NAMES: string[] = Object.keys(ICONS);

/** The path for a name · null when the set does not have it, so the component
 *  can render a slotted SVG instead of an empty box. */
export function iconPath(name: string | null | undefined): string | null {
  if (!name) return null;
  return ICONS[name.trim().toLowerCase()] ?? null;
}
