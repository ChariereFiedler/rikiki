// ════════════════════════════════════════════════════════════════
// <deck-cell span="2x1" tone? plain? align? justify?>
//   <h3>Title</h3>
//   <deck-punch fit>Big adaptive line</deck-punch>
// </deck-cell>
//
// A bento grid item. Sits inside <deck-bento> (or any CSS grid) and is the
// unit that "shares the space". It is a `container-type: size` box, so any
// child using cqw/cqh (e.g. <deck-punch size="display">) scales against this
// cell, not the whole slide · that is what makes the type cell-aware.
//
// Attributes:
//   span    · "CxR" (e.g. "2x1") or a bare column count. col/row override it.
//   col/row · explicit per-axis span · integer → `span N`, else raw line syntax.
//   tone    · info | warn | ok | danger · status tint (maps to theme tokens).
//   plain   · drop the card chrome (no surface, border, padding).
//   flat    · keep the surface/radius/padding but drop the border · the
//             soft-card bento look. Composes with tone.
//   align   · start | center | end | stretch · cross-axis of the content.
//   justify · start | center | end | between  · main-axis of the content.
//
// Tokens:
//   --deck-cell-bg / --deck-cell-border / --deck-cell-radius
//   --deck-cell-padding-x / --deck-cell-padding-y / --deck-cell-gap
// ════════════════════════════════════════════════════════════════

import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { parseSpan, toTrack } from '../shared/grid-tracks.js';

export type DeckCellAlign = 'start' | 'center' | 'end' | 'stretch';
export type DeckCellJustify = 'start' | 'center' | 'end' | 'between';

// A cell lays its children out in a COLUMN, so the two knobs map to the axes a
// reader does not expect from their names:
//   align   -> align-items      -> HORIZONTAL (left / right / centre / stretch)
//   justify -> justify-content  -> VERTICAL   (top / bottom / centre / between)
// Pinned by e2e/bento.spec.ts · the showcase deck got this backwards once.
const ALIGN: Record<DeckCellAlign, string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  stretch: 'stretch',
};
const JUSTIFY: Record<DeckCellJustify, string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  between: 'space-between',
};

@customElement('deck-cell')
export class DeckCell extends LitElement {
  static override styles = css`
    :host {
      display: flex;
      flex-direction: column;
      gap: var(--deck-cell-gap, var(--rik-space-2));
      align-items: var(--_align, stretch);
      justify-content: var(--_justify, flex-start);
      grid-column: var(--_col, auto);
      grid-row: var(--_row, auto);
      min-width: 0;
      min-height: 0;
      overflow: hidden;
      box-sizing: border-box;
      container-type: size;
      padding: var(--deck-cell-padding-y, var(--rik-space-3)) var(--deck-cell-padding-x, var(--rik-space-4));
      background: var(--deck-cell-bg, var(--rik-surface-raised--strong));
      border: 1px solid var(--deck-cell-border, var(--rik-border-default));
      border-radius: var(--deck-cell-radius, var(--rik-radius-lg));
      font-family: var(--rik-font-sans);
      color: var(--rik-text-default--muted);
    }
    /* Status tints · saturated enough to read as a colored block at slide
       distance · same token family as deck-card. */
    :host([tone="info"])   { background: var(--deck-cell-bg, var(--rik-status-info__bg));    border-color: var(--deck-cell-border, var(--rik-status-info__border)); }
    :host([tone="warn"])   { background: var(--deck-cell-bg, var(--rik-status-warn__bg));    border-color: var(--deck-cell-border, var(--rik-status-warn__border)); }
    :host([tone="ok"])     { background: var(--deck-cell-bg, var(--rik-status-success__bg)); border-color: var(--deck-cell-border, var(--rik-status-success__border)); }
    :host([tone="danger"]) { background: var(--deck-cell-bg, var(--rik-status-danger__bg));  border-color: var(--deck-cell-border, var(--rik-status-danger__border)); }
    /* Bare item · no chrome, just a positioned grid cell that still scopes
       container queries for its children. */
    :host([plain]) {
      background: none;
      border: none;
      border-radius: 0;
      padding: 0;
    }
    /* Surfaced but borderless · keeps the fill, radius and padding, drops the
       outline · the soft-card bento look. Works with tone too. */
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
    /* Media auto-fit · the slotted image/svg/video takes the cell's leftover
       space (flex) and fills the width · object-fit keeps a raster's aspect,
       an inline SVG's preserveAspectRatio keeps its own. Geometric containment,
       not the font-size fit (which media can't use). flex sizing (not fixed
       width/height attrs) is also what makes it fill in overview thumbnails,
       where a never-rendered slide's SVG would otherwise stay viewBox-tiny. */
    ::slotted(img),
    ::slotted(svg),
    ::slotted(video) {
      flex: 1 1 0;
      min-height: 0;
      width: 100%;
      max-width: 100%;
      object-fit: contain;
    }
    ::slotted(table) {
      width: 100%;
      border-collapse: collapse;
    }
  `;

  @property({ type: String }) span?: string;
  @property({ type: String }) col?: string;
  @property({ type: String }) row?: string;
  @property({ type: String }) align?: DeckCellAlign;
  @property({ type: String }) justify?: DeckCellJustify;
  @property({ type: String }) tone?: string;

  override updated() {
    const fromSpan = parseSpan(this.span);
    this.style.setProperty('--_col', this.col ? toTrack(this.col) : fromSpan.col);
    this.style.setProperty('--_row', this.row ? toTrack(this.row) : fromSpan.row);
    if (this.align) this.style.setProperty('--_align', ALIGN[this.align] ?? this.align);
    if (this.justify) this.style.setProperty('--_justify', JUSTIFY[this.justify] ?? this.justify);
  }

  override render() {
    return html`<slot></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'deck-cell': DeckCell;
  }
}
