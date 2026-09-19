// ════════════════════════════════════════════════════════════════
// <deck-point tone? plain? flat? align?>
//   <h3>A proof</h3>
//   <p>Because it invents what it does not know.</p>
// </deck-point>
//
// One point of a bento · a cell that is sized BY what it holds, where
// <deck-cell> sizes what it holds to itself. The two exist because that single
// difference cannot be had twice in one element:
//
//   deck-cell   is a size container. It reports no height of its own, so its
//               children can be measured against it · that is what makes
//               fit-to-cell text, a diagram capped in cqh and a contained
//               image work. It also means its row can never be sized by its
//               content, so the row takes a share of the slide and every cell
//               is as tall as the slide.
//   deck-point  is not a container. Its height is its content's height, so a
//               row of points is as tall as the tallest point, a painted point
//               shows no hole under its text, and the points of a row can
//               borrow the grid's rows (subgrid) so a title that wraps to a
//               second line stops dragging its own body text below its
//               neighbours'.
//
// Reach for deck-point for words, deck-cell for anything measured. A row may
// mix them; the mixed row loses the shared bands, keeps everything else.
//
// Attributes:
//   span    · "CxR" (e.g. "2x1") or a bare column count. col/row override it.
//   col/row · explicit per-axis span · integer → `span N`, else raw line syntax.
//   tone    · info | warn | ok | danger · status tint (maps to theme tokens).
//   plain   · stop painting the chrome · the gutter and the border WIDTH stay,
//             so a plain point keeps the reading edge of its painted siblings.
//   flat    · keep the surface, drop the border.
//   align   · start | center | end | stretch · HORIZONTAL, as on deck-cell.
//
// There is deliberately no `justify`. A point is as tall as its content, so
// there is no leftover height inside it to distribute · asking for one would
// be asking for the hole this element exists to remove.
//
// Tokens: the deck-cell family, so a row of both looks like one row ·
//   --deck-cell-bg / --deck-cell-border / --deck-cell-radius
//   --deck-cell-padding-x / --deck-cell-padding-y / --deck-cell-gap
// ════════════════════════════════════════════════════════════════

import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { parseSpan, toTrack } from '../shared/grid-tracks.js';

export type DeckPointAlign = 'start' | 'center' | 'end' | 'stretch';

const ALIGN: Record<DeckPointAlign, string> = {
  start: 'start',
  center: 'center',
  end: 'end',
  stretch: 'stretch',
};

@customElement('deck-point')
export class DeckPoint extends LitElement {
  static override styles = css`
    :host {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      grid-auto-rows: min-content;
      row-gap: var(--deck-cell-gap, var(--rik-space-2));
      justify-items: var(--_align, stretch);
      grid-column: var(--_col, auto);
      grid-row: var(--_row, auto);
      min-width: 0;
      box-sizing: border-box;
      padding: var(--deck-cell-padding-y, var(--rik-space-3)) var(--deck-cell-padding-x, var(--rik-space-4));
      background: var(--deck-cell-bg, var(--rik-surface-raised--strong));
      border: 1px solid var(--deck-cell-border, var(--rik-border-default));
      border-radius: var(--deck-cell-radius, var(--rik-radius-lg));
      font-family: var(--rik-font-sans);
      color: var(--rik-text-default--muted);
    }
    /* Borrow the bento's rows · deck-bento sets this, never an author. Each
       child then sits in the same band as its opposite number in every other
       point of the row, so the bands line up whatever a title wraps to. */
    :host([banded]) {
      grid-template-rows: subgrid;
      grid-auto-rows: initial;
      row-gap: 0;
    }
    /* The gap between bands belongs to the grid when the bands are shared ·
       a row-gap here would be added on top of the bento's own. */
    :host([banded]) ::slotted(*) {
      align-self: start;
    }

    /* Status tints · the deck-cell token family, so a row of both reads as one
       row rather than as two kinds of box. */
    :host([tone="info"])   { background: var(--deck-cell-bg, var(--rik-status-info__bg));    border-color: var(--deck-cell-border, var(--rik-status-info__border)); }
    :host([tone="warn"])   { background: var(--deck-cell-bg, var(--rik-status-warn__bg));    border-color: var(--deck-cell-border, var(--rik-status-warn__border)); }
    :host([tone="ok"])     { background: var(--deck-cell-bg, var(--rik-status-success__bg)); border-color: var(--deck-cell-border, var(--rik-status-success__border)); }
    :host([tone="danger"]) { background: var(--deck-cell-bg, var(--rik-status-danger__bg));  border-color: var(--deck-cell-border, var(--rik-status-danger__border)); }

    /* Unpainted, not unpadded · the gutter and the border width stay so the
       text of a plain point starts on the same edge as its painted sibling. */
    :host([plain]) {
      background: none;
      border-color: transparent;
      border-radius: 0;
    }
    :host([flat]) {
      border: none;
    }

    ::slotted(h3) {
      font-family: var(--rik-font-display, var(--rik-font-sans));
      font-size: var(--rik-font-size-h2);
      font-weight: 700;
      color: var(--rik-text-default);
      letter-spacing: -0.01em;
      line-height: 1.2;
      margin: 0;
    }
    ::slotted(p) {
      font-size: var(--rik-font-size-body);
      line-height: 1.5;
      margin: 0;
    }
  `;

  @property({ type: String }) span?: string;
  @property({ type: String }) col?: string;
  @property({ type: String }) row?: string;
  @property({ type: String }) align?: DeckPointAlign;
  @property({ type: String }) tone?: string;

  /** How many bands this point borrows from its bento · written by deck-bento,
   *  never by an author. Declared rather than read off the attribute so Lit
   *  re-runs updated() when the parent sets it; an undeclared attribute would
   *  change the CSS and leave the point spanning one band instead of all. */
  @property({ type: String, reflect: true }) banded?: string;

  override updated() {
    const fromSpan = parseSpan(this.span);
    this.style.setProperty('--_col', this.col ? toTrack(this.col) : fromSpan.col);
    this.style.setProperty(
      '--_row',
      this.banded ? `span ${this.banded}` : this.row ? toTrack(this.row) : fromSpan.row,
    );
    if (this.align) this.style.setProperty('--_align', ALIGN[this.align] ?? this.align);
  }

  override render() {
    return html`<slot></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'deck-point': DeckPoint;
  }
}
