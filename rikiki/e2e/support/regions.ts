// ════════════════════════════════════════════════════════════════
// The two regions every slide has, measured in one frame of reference
//
// A slide is read as a 1920×1080 rectangle. Every number about where its ink
// sits has to be expressed in that rectangle, or numbers from two layouts
// cannot be compared · which is exactly what went wrong before this file
// existed. `ink.spec.ts` clipped to `.body ?? active`, and `.body` exists in
// three layouts out of eight, so five slides were measured against a different
// origin and a different denominator from the other three. The centroids it
// reported were not comparable, and the instrument could not see the
// heterogeneity the eye could.
//
// The regions are derived from boxes that already exist rather than from a
// class name a layout has to opt into:
//
//   HEAD   the union of what is anchored at the top and sized by its own
//          content · the eyebrow, the title, the lead. It may be empty, and
//          four layouts (cover, section, photo, takeaway) have no head at all,
//          which is why they already centre and are not the problem.
//   FIELD  the union of everything else the author wrote. It is the only place
//          `spread` has any freedom, so it is the only place a composition
//          rule can act.
//
// Deriving them costs no DOM change, which matters: a slot is display:contents,
// so its slotted elements are flex items of the HOST. Wrapping a slot in a box
// to name it would move every slotted element one level down and change the
// layout of all eight layouts · the opposite of a measurement that must not
// disturb what it measures.
// ════════════════════════════════════════════════════════════════

import type { Page } from '@playwright/test';

export interface Box {
  top: number;
  bottom: number;
  height: number;
  left: number;
  width: number;
}

export interface Regions {
  tag: string;
  /** The slide's own border box · the frame of reference for every fraction. */
  slide: Box;
  /** Anchored at the top, sized by its content. Null when the layout has none. */
  head: Box | null;
  /** Everything the author wrote that is not head. Null when a slide is empty. */
  field: Box | null;
  /** The bottom of the head as a fraction of slide height · the shoulder. */
  shoulder: number | null;
}

/** The slots a layout reserves for its head · everything else is field. */
const HEAD_SLOTS = ['title', 'lead'];

/**
 * Measure the head and the field of the active slide.
 *
 * Head membership is read from the `slot` attribute the author wrote, not from
 * the shadow tree, because that attribute is the contract: `slot="title"` is
 * how the reference tells an author to mark a title, and a layout without those
 * slots genuinely has no head.
 */
export async function readRegions(page: Page): Promise<Regions> {
  return page.evaluate((headSlots) => {
    const slide = document.querySelector('deck-root > [active]') as HTMLElement | null;
    if (!slide) throw new Error('no active slide to measure');
    const box = slide.getBoundingClientRect();

    const union = (elements: Element[]): Box | null => {
      const boxes = elements
        .map((el) => el.getBoundingClientRect())
        .filter((b) => b.height > 0 && b.width > 0);
      if (boxes.length === 0) return null;
      const top = Math.min(...boxes.map((b) => b.top));
      const bottom = Math.max(...boxes.map((b) => b.bottom));
      const left = Math.min(...boxes.map((b) => b.left));
      const right = Math.max(...boxes.map((b) => b.right));
      return { top, bottom, height: bottom - top, left, width: right - left };
    };

    const children = [...slide.children];
    const head: Element[] = [];
    const field: Element[] = [];
    for (const el of children) {
      const slot = el.getAttribute('slot') ?? '';
      // Speaker notes are not painted · counting them would put ink where the
      // room sees none.
      if (el.tagName.toLowerCase() === 'deck-notes') continue;
      (headSlots.includes(slot) ? head : field).push(el);
    }

    /* The eyebrow lives in the shadow, not the light DOM, and it is head by
       every definition that matters · it is anchored at the top and it is what
       pushes the title down. */
    const eyebrow = slide.shadowRoot?.querySelector('.lbl');
    if (eyebrow) head.unshift(eyebrow);

    const headBox = union(head);
    return {
      tag: slide.tagName.toLowerCase(),
      slide: {
        top: box.top,
        bottom: box.bottom,
        height: box.height,
        left: box.left,
        width: box.width,
      },
      head: headBox,
      field: union(field),
      shoulder: headBox ? (headBox.bottom - box.top) / box.height : null,
    };
  }, HEAD_SLOTS);
}

/** Express an absolute y as a fraction of the slide box · 0 top, 1 bottom. */
export function asFraction(y: number, slide: Box): number {
  return (y - slide.top) / slide.height;
}
