// ════════════════════════════════════════════════════════════════
// <deck-stack gap="3" direction="column|row" align="start|center|end"
//             justify="start|center|end|between">
//   <child1/>
//   <child2/>
// </deck-stack>
//
// Replaces <div style="display:flex;flex-direction:column;gap:.."> and
// margin-top declarations on stacked children.
//
// `gap` accepts 1..6 and maps to var(--sp-N). Default 3.
// ════════════════════════════════════════════════════════════════

import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

export type DeckStackDirection = 'row' | 'column';
export type DeckStackAlign     = 'start' | 'center' | 'end' | 'stretch';
export type DeckStackJustify   = 'start' | 'center' | 'end' | 'between' | 'around';

const JUSTIFY: Record<DeckStackJustify, string> = {
  start:   'flex-start',
  center:  'center',
  end:     'flex-end',
  between: 'space-between',
  around:  'space-around',
};
const ALIGN: Record<DeckStackAlign, string> = {
  start:   'flex-start',
  center:  'center',
  end:     'flex-end',
  stretch: 'stretch',
};

@customElement('deck-stack')
export class DeckStack extends LitElement {
  /* Customization tokens: --deck-stack-gap (used when no `gap` attr is set). */
  static override styles = css`
    :host {
      display: flex;
      flex-direction: var(--_dir, column);
      gap: var(--_gap, var(--deck-stack-gap, var(--rik-space-3)));
      align-items: var(--_align, stretch);
      justify-content: var(--_justify, flex-start);
      min-width: 0;
      min-height: 0;
    }
    :host([fill]) { flex: 1 1 auto; }
  `;

  @property({ type: String }) gap?: string;
  @property({ type: String }) direction?: DeckStackDirection;
  @property({ type: String }) align?: DeckStackAlign;
  @property({ type: String }) justify?: DeckStackJustify;

  override updated() {
    if (this.gap) {
      const n = parseInt(this.gap, 10);
      if (!Number.isNaN(n) && n >= 1 && n <= 6) {
        this.style.setProperty('--_gap', `var(--rik-space-${n})`);
      } else {
        this.style.setProperty('--_gap', this.gap);
      }
    } else {
      this.style.removeProperty('--_gap');
    }
    this.style.setProperty('--_dir', this.direction === 'row' ? 'row' : 'column');
    if (this.align)   this.style.setProperty('--_align',   ALIGN[this.align]   ?? this.align);
    if (this.justify) this.style.setProperty('--_justify', JUSTIFY[this.justify] ?? this.justify);
  }

  override render() {
    return html`<slot></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'deck-stack': DeckStack;
  }
}
