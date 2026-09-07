// ════════════════════════════════════════════════════════════════
// RIKIKI · domain · the shape of a deck
//
// Pure. No DOM, no Lit, no globals. See docs/design/adr-001-deck-navigation-domain.md.
//
// The engine derives an outline from the slide elements once, then asks this
// model where navigation should go. The model never looks at an element.
// ════════════════════════════════════════════════════════════════

/** A run of consecutive slides under one section heading. */
export interface Chapter {
  /** Index of the chapter's first slide in the flat slide list. */
  readonly start: number;
  /** How many slides the chapter holds · always >= 1. */
  readonly length: number;
}

/** Slide count plus chapter structure · everything navigation needs to know
 *  about the deck's shape, and nothing about its content. */
export interface DeckOutline {
  readonly slideCount: number;
  readonly chapters: readonly Chapter[];
}

/** Where the deck is · a slide and a step within it. */
export interface DeckPosition {
  readonly slide: number;
  readonly step: number;
}

/** A coordinate in the 2D (chapter × slide) model. */
export interface DeckCoords {
  readonly chapter: number;
  readonly index: number;
}

/** How many steps a slide has · injected, because the count comes from the DOM
 *  and from plugin hooks, which the domain must not know about. */
export type StepsOf = (slide: number) => number;

export const EMPTY_OUTLINE: DeckOutline = { slideCount: 0, chapters: [] };

/** Build an outline from the slides' tag names.
 *
 *  A `deck-section` opens a new chapter; anything else joins the current one.
 *  The first slide always opens one, whatever its tag, so every slide belongs
 *  to exactly one chapter. */
export function outlineOf(tagNames: readonly string[]): DeckOutline {
  const chapters: Chapter[] = [];
  tagNames.forEach((tag, i) => {
    const opensChapter = tag.toLowerCase() === 'deck-section';
    if (opensChapter || chapters.length === 0) chapters.push({ start: i, length: 1 });
    else {
      const last = chapters[chapters.length - 1]!;
      chapters[chapters.length - 1] = { start: last.start, length: last.length + 1 };
    }
  });
  return { slideCount: tagNames.length, chapters };
}

/** Is 2D navigation meaningful for this outline?
 *
 *  It is opt-in (`nav="2d"`) AND needs a structure that makes sense: more than
 *  one chapter, at least one of them holding more than one slide. Without the
 *  opt-in the arrows stay linear, so a sectioned deck does not surprise its
 *  author by remapping left/right to chapter jumps. */
export function supportsTwoD(outline: DeckOutline, optedIn: boolean): boolean {
  return optedIn && outline.chapters.length > 1 && outline.chapters.some((c) => c.length > 1);
}

/** Flat slide index → chapter coordinate. Falls back to the origin for an index
 *  that belongs to no chapter (an empty deck). */
export function coordsOf(outline: DeckOutline, slide: number): DeckCoords {
  for (let c = 0; c < outline.chapters.length; c++) {
    const chapter = outline.chapters[c]!;
    const local = slide - chapter.start;
    if (local >= 0 && local < chapter.length) return { chapter: c, index: local };
  }
  return { chapter: 0, index: 0 };
}

/** Chapter coordinate → flat slide index.
 *
 *  An out-of-range chapter clamps to the nearest one rather than snapping back
 *  to slide 0: a deep link to a coordinate that no longer exists (a chapter
 *  removed while iterating) should land on the closest valid slide. */
export function slideAt(outline: DeckOutline, coords: DeckCoords): number | null {
  if (outline.chapters.length === 0) return null;
  const c = clamp(coords.chapter, 0, outline.chapters.length - 1);
  const chapter = outline.chapters[c]!;
  const i = clamp(coords.index, 0, chapter.length - 1);
  return chapter.start + i;
}

export function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.max(min, Math.min(max, value));
}
