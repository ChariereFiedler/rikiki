// ════════════════════════════════════════════════════════════════
// RIKIKI · the signature the opt-in components share
//
// DIRECTION · one block, one scale. See docs/design/adr-002-extras-visual-
// direction.md for how it was arrived at and what it replaced.
//
// The subject is a slide projected in a room, read from three to ten metres in
// about forty seconds while someone talks over it. That decides everything: at
// that distance AREA, SIZE and POSITION survive, and hairlines, tracked-out
// small caps, thin strokes and pale tints do not. The signature this replaces
// was built entirely out of the second list, which is why the slides read as
// weak however carefully they were tuned.
//
// THE FOUR RULES, repeated by every component here:
//   1. ONE MASS at most · a single filled area, carrying whatever the markup
//      marks. Nothing marked means no fill anywhere.
//   2. TWO SIZES · statement and reading. There is no third step, which is what
//      removes the mono micro-label from every component at once.
//   3. NO LABEL ABOVE CONTENT · context is written after the thing, at reading
//      size, in sentence case.
//   4. A LINE ONLY WHERE TWO THINGS WOULD TOUCH · a table header, a timeline
//      axis, a graph edge. Never as decoration.
//
// Note what is absent on purpose: no `.rule` accent bar, no `.meta` mono label,
// no `.hair`. Removing them from here removes them from fourteen components,
// which is the point.
//
// Every value is a token. No literal colour, no literal length.
// ════════════════════════════════════════════════════════════════

import { css } from 'lit';

/** The shared signature · imported by every component in src/extras/. */
export const signature = css`
  /* 1 · The mass. The one filled area a component is allowed, and it exists
     only where the markup marked something. Dark on light is the only
     high-contrast device this palette has: the raised surface measures 1.10
     against the page, the inverse surface 18.9. */
  .mass {
    background: var(--rik-extras-mass, var(--rik-surface-inverse));
    color: var(--rik-extras-mass-text, var(--rik-text-inverse));
    padding: var(--rik-space-3) var(--rik-space-4);
    border-radius: var(--rik-radius-sm);
  }

  /* 2 · The two sizes. Statement carries the figure, the name, the answer.
     Reading carries everything else. There is nothing in between, and adding
     something in between is how the label tier grows back. */
  .statement {
    font-family: var(--rik-font-display, var(--rik-font-sans));
    font-size: var(--rik-extras-statement, var(--rik-font-size-mega));
    font-weight: 800;
    line-height: 0.95;
    letter-spacing: -0.02em;
    font-variant-numeric: tabular-nums;
    overflow-wrap: anywhere;
  }
  .reading {
    font-family: var(--rik-font-sans);
    font-size: var(--rik-extras-reading, var(--rik-font-size-body));
    font-weight: 400;
    line-height: 1.35;
    /* Under 80 characters, so a glance can find the end of the line. */
    max-width: 62ch;
  }
  /* The reading voice, stepped back · a second line of context that must not
     compete with the first. Colour, never size, and never small caps. */
  .quiet {
    color: var(--rik-extras-quiet, var(--rik-text-default--muted));
  }

  /* 4 · The load-bearing line. Present because two things would otherwise
     touch, absent everywhere else. */
  .edge {
    border: 0;
    border-top: 1px solid var(--rik-extras-edge, var(--rik-border-default));
    margin: 0;
  }

  /* Motion is one gesture, and it is optional. */
  @media (prefers-reduced-motion: reduce) {
    * {
      transition: none !important;
      animation: none !important;
    }
  }
`;
