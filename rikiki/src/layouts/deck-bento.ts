// ════════════════════════════════════════════════════════════════
// <deck-bento eyebrow="Overview" cols="3" rows="2" gap="3">
//   <h1 slot="title">A bento slide</h1>
//   <deck-cell span="2x1"><deck-punch fit>Hero</deck-punch></deck-cell>
//   <deck-cell tone="info"><h3>Note</h3><p>...</p></deck-cell>
//   <deck-cell span="1x2">...</deck-cell>
// </deck-bento>
//
// A full-slide bento layout · a multi-row / multi-column grid whose cells
// (<deck-cell>) share the available space. The grid fills the slide body, so
// rows declared as `rows="2"` split the height evenly · cells then negotiate
// the room, and cell-aware type (cqw/cqh, or <deck-punch fit>) adapts to it.
//
// Attributes (same semantics as deck-grid):
//   eyebrow · optional pill label above the title
//   cols    · integer 1..12 or an explicit template ("1fr 2fr"). Default 2.
//   rows    · integer 1..12 or template. Default 1 (one full-height row).
//   gap     · 1..6 → var(--rik-space-N), or any CSS length. Default 3.
//   align   · start | center | end | stretch (align-items)
//   justify · start | center | end | stretch (justify-items)
//
// Slots: `title` (an <h1>), default slot (the <deck-cell> children).
//
// Tokens: --deck-bento-gap (used when no `gap` attr is set).
// ════════════════════════════════════════════════════════════════

import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { slideBase } from '../shared-styles.js';
import { expandGap, expandTracks } from '../shared/grid-tracks.js';

export type DeckBentoAlign = 'start' | 'center' | 'end' | 'stretch';

@customElement('deck-bento')
export class DeckBento extends LitElement {
  static override styles = [
    ...slideBase,
    css`
      :host {
        gap: var(--rik-space-3);
      }
      .grid {
        flex: 1 1 auto;
        /* Bleed the cells' own gutter outward so the text of the first column
           lands on the slide's text edge, and the last column's on the other ·
           the cells all inset their content by the same amount now, so without
           this the whole grid would sit a gutter inside the title above it. */
        margin-inline: calc(-1 * var(--deck-cell-padding-x, var(--rik-space-4)));
        display: grid;
        grid-template-columns: var(--_cols, repeat(2, minmax(0, 1fr)));
        grid-template-rows: var(--_rows, minmax(0, 1fr));
        gap: var(--_gap, var(--deck-bento-gap, var(--rik-space-3)));
        align-items: var(--_align, stretch);
        justify-items: var(--_justify, stretch);
        min-height: 0;
        min-width: 0;
      }
    `,
  ];

  @property({ type: String }) eyebrow?: string;
  @property({ type: String }) cols?: string;
  @property({ type: String }) rows?: string;
  @property({ type: String }) gap?: string;
  @property({ type: String }) align?: DeckBentoAlign;
  @property({ type: String }) justify?: DeckBentoAlign;

  override updated() {
    const cols = expandTracks(this.cols);
    const rows = expandTracks(this.rows);
    const gap = expandGap(this.gap);
    if (cols) this.style.setProperty('--_cols', cols);
    if (rows) this.style.setProperty('--_rows', rows);
    if (gap) this.style.setProperty('--_gap', gap);
    if (this.align) this.style.setProperty('--_align', this.align);
    if (this.justify) this.style.setProperty('--_justify', this.justify);
  }

  override render() {
    return html`
      ${this.eyebrow ? html`<span class="lbl">${this.eyebrow}</span>` : ''}
      <slot name="title"></slot>
      <div class="grid" part="grid"><slot></slot></div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'deck-bento': DeckBento;
  }
}
