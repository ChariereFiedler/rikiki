// ════════════════════════════════════════════════════════════════
// RIKIKI · the signature the opt-in components share
//
// DIRECTION · engineering editorial. The deck already commits to it: a heavy
// display face for the statement, a mono micro-label for the metadata, and a
// short accent rule under the title. The extras repeat that, and nothing else.
//
// THE SIGNATURE, in three parts, repeated by every component here:
//   1. a short ACCENT RULE marks what matters (the active step, the winning
//      side, the current chapter) · never a filled tile
//   2. a MONO UPPERCASE micro-label carries metadata (a date, a unit, a note)
//   3. STRUCTURE COMES FROM HAIRLINES AND SPACE, not from boxes
//
// What that rules out, on purpose · a filled rounded card behind every item, an
// icon parked in a tinted square, a three-up grid of look-alike tiles. Those
// read as a template, and at projection distance a row of identical grey
// rectangles carries no hierarchy at all: everything is equally important,
// which is the same as nothing being important.
//
// Every value is a token. No literal colour, no literal length.
// ════════════════════════════════════════════════════════════════

import { css } from 'lit';

/** The three-part signature · imported by every component in src/extras/. */
export const signature = css`
  /* 1 · The accent rule. A short bar, not a border around a box. It is the one
     device that says "this one" across every component here. */
  .rule {
    display: block;
    width: var(--rik-extras-rule-length, 2.5rem);
    height: var(--rik-extras-rule-width, 3px);
    background: var(--rik-extras-rule, var(--rik-accent));
    flex: none;
  }

  /* 2 · The micro-label. Mono, uppercase, tracked out · the metadata voice. */
  .meta {
    font-family: var(--rik-font-mono, monospace);
    font-size: var(--rik-font-size-xs);
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--rik-text-default--faint);
    font-variant-numeric: tabular-nums;
  }

  /* 3 · The hairline. Structure without enclosure. */
  .hair {
    border: 0;
    border-top: 1px solid var(--rik-border-default);
    margin: 0;
  }

  /* The statement voice · a figure or a name, set in the display face. */
  .display {
    font-family: var(--rik-font-display, var(--rik-font-sans));
    font-weight: 900;
    line-height: 1;
    letter-spacing: -0.02em;
    font-variant-numeric: tabular-nums;
  }

  /* Motion is one gesture, and it is optional. */
  @media (prefers-reduced-motion: reduce) {
    * {
      transition: none !important;
      animation: none !important;
    }
  }
`;
