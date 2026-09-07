// ════════════════════════════════════════════════════════════════
// RIKIKI · shared styles
// Imported by every Lit component (Shadow DOM).
// ════════════════════════════════════════════════════════════════

import { css } from 'lit';

// Style "slide" de base : layout flex column, padding, fond
export const slideShell = css`
  :host {
    display: none;
    position: absolute;
    inset: 0;
    padding: var(--rik-slide-padding-y) var(--rik-slide-padding-x);
    flex-direction: column;
    overflow: hidden;
    background: var(--rik-surface-page);
    font-family: var(--rik-font-sans);
    color: var(--rik-text-default);
  }
  :host([active]) { display: flex; }

  /* Print · every slide is shown and becomes exactly one page.
     On screen a slide is an absolutely-positioned layer inside a scaled stage;
     on paper it is a block the size of the deck's own canvas, so the layout an
     author composed is the layout that prints. The page box itself is set by
     the @page rule deck-root injects from the same canvas variables. */
  @media print {
    :host {
      display: flex;
      position: relative;
      inset: auto;
      width: calc(var(--deck-canvas-w, 1920) * 1px);
      height: calc(var(--deck-canvas-h, 1080) * 1px);
      break-inside: avoid;
      break-after: page;
      /* Slide backgrounds are content, not decoration · without this the page
         prints white and every tinted layout loses its meaning. */
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    /* No trailing blank page after the last slide. */
    :host(:last-child) { break-after: auto; }
  }
`;

// Typographie de base
export const typo = css`
  h1 {
    font-size: var(--rik-font-size-h1);
    font-weight: 700;
    color: var(--rik-text-default);
    letter-spacing: -0.022em;
    line-height: 1.15;
    margin-bottom: var(--rik-space-4);
    padding-bottom: var(--rik-space-2);
    border-bottom: 3px solid var(--rik-accent);
    display: inline-block;
    align-self: flex-start;
    flex: 0 0 auto;
  }
  h1 .accent { color: var(--rik-accent); }
  ::slotted(p), p {
    font-size: var(--rik-font-size-body);
    line-height: 1.65;
    color: var(--rik-text-default--muted);
    margin: 0;
  }
  ::slotted(strong), strong { color: var(--rik-text-default); font-weight: 700; }
  ::slotted(code), code {
    font-family: var(--rik-font-mono);
    font-size: var(--rik-font-size-mono-sm);
    background: rgba(0,0,0,0.06);
    padding: 2px 6px;
    border-radius: var(--rik-radius-sm);
    color: var(--rik-text-default);
  }
`;

// Helpers (lbl, lead, kicker, caption)
export const helpers = css`
  /* Eyebrow pill · customizable per slide-host via:
       --deck-eyebrow-bg / --deck-eyebrow-color
       --deck-eyebrow-padding-x / --deck-eyebrow-padding-y / --deck-eyebrow-radius */
  /* The eyebrow · a word that says where in the talk you are.
     It used to be a pill: an accent-filled badge holding tracked-out small
     caps, which stacks two of the plainest marks of a generated page and, at
     projection distance, is a coloured smudge nobody reads. Written plainly it
     costs one line and can actually be read. The tokens still work · a deck
     that set --deck-eyebrow-bg gets its badge back. See ADR-002. */
  .lbl {
    display: inline-block;
    padding: var(--deck-eyebrow-padding-y, 0) var(--deck-eyebrow-padding-x, 0);
    background: var(--deck-eyebrow-bg, transparent);
    color: var(--deck-eyebrow-color, var(--rik-accent__text));
    border-radius: var(--deck-eyebrow-radius, 0);
    font-size: var(--rik-font-size-body);
    font-weight: 600;
    margin-bottom: var(--rik-space-1);
    align-self: flex-start;
  }
  .lead {
    font-size: var(--rik-font-size-lead);
    color: var(--rik-text-default--faint);
    line-height: 1.5;
    margin-bottom: var(--rik-space-4);
    max-width: 75ch;
    flex: 0 0 auto;
  }
  .kicker {
    font-size: var(--rik-font-size-xs);
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--rik-text-default--faint);
    margin-bottom: var(--rik-space-3);
    display: block;
  }
  .kicker.on-dark { color: rgba(255,255,255,0.35); }
  .caption {
    font-size: var(--rik-font-size-sm);
    color: var(--rik-text-default--faint);
    line-height: 1.55;
  }
  .caption.on-dark { color: rgba(255,255,255,0.5); }
  .col-label {
    font-size: var(--rik-font-size-xs);
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--rik-text-default--faint);
    margin-bottom: var(--rik-space-2);
  }
`;

// La base à importer pour toutes les slides
export const slideBase = [slideShell, typo, helpers];
