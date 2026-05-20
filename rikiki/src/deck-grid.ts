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

export type DeckGridAlign = 'start' | 'center' | 'end' | 'stretch';

const MAP: Record<DeckGridAlign, string> = {
  start:   'start',
  center:  'center',
  end:     'end',
  stretch: 'stretch',
};

function expandTracks(value: string | undefined): string | null {
  if (!value) return null;
  const n = parseInt(value, 10);
  if (!Number.isNaN(n) && String(n) === value.trim() && n >= 1 && n <= 12) {
    return `repeat(${n}, minmax(0, 1fr))`;
  }
  return value;
}

function expandGap(value: string | undefined): string | null {
  if (!value) return null;
  const n = parseInt(value, 10);
  if (!Number.isNaN(n) && n >= 1 && n <= 6) return `var(--sp-${n})`;
  return value;
}

@customElement('deck-grid')
export class DeckGrid extends LitElement {
  static override styles = css`
    :host {
      display: grid;
      grid-template-columns: var(--_cols, 1fr);
      grid-template-rows:    var(--_rows, auto);
      gap:           var(--_gap, var(--sp-3));
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
    const gap  = expandGap(this.gap);
    if (cols) this.style.setProperty('--_cols', cols);
    if (rows) this.style.setProperty('--_rows', rows);
    if (gap)  this.style.setProperty('--_gap', gap);
    if (this.align)   this.style.setProperty('--_align',   MAP[this.align]   ?? this.align);
    if (this.justify) this.style.setProperty('--_justify', MAP[this.justify] ?? this.justify);
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
