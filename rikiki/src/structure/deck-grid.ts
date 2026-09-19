// ════════════════════════════════════════════════════════════════
// <deck-grid cols="2" rows? gap="3" align? justify? fill?>
//   <child1/>
//   <child2/>
// </deck-grid>
//
// Attributes:
//   cols    · integer 1..12 OR explicit template ("1fr 2fr", "auto 1fr")
//   rows    · same, optional
//   gap     · 1..6 → var(--sp-N), default 3. Or any CSS value.
//   align   · start | center | end | stretch (align-items)
//   justify · start | center | end | stretch (justify-items)
//   fill    · flex: 1, takes the parent's full height
// ════════════════════════════════════════════════════════════════

import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { expandGap, expandTracks } from './grid-tracks.js';

export type DeckGridAlign = 'start' | 'center' | 'end' | 'stretch';

@customElement('deck-grid')
export class DeckGrid extends LitElement {
  /* Customization tokens: --deck-grid-gap (used when no `gap` attr is set). */
  static override styles = css`
    :host {
      display: grid;
      grid-template-columns: var(--_cols, 1fr);
      grid-template-rows:    var(--_rows, auto);
      gap:           var(--_gap, var(--deck-grid-gap, var(--rik-space-3)));
      align-items:   var(--_align, stretch);
      justify-items: var(--_justify, stretch);
      min-width: 0;
      min-height: 0;
    }
    :host([fill]) { flex: 1 1 auto; height: 100%; }
  `;

  @property({ type: String }) cols?: string;
  @property({ type: String }) rows?: string;
  @property({ type: String }) gap?: string;
  @property({ type: String }) align?: DeckGridAlign;
  @property({ type: String }) justify?: DeckGridAlign;

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
    return html`<slot></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'deck-grid': DeckGrid;
  }
}
