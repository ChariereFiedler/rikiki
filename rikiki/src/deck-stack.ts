// ════════════════════════════════════════════════════════════════
// <deck-stack gap="3" direction="column|row" align="start|center|end"
//             justify="start|center|end|between">
//   <enfant1/>
//   <enfant2/>
// </deck-stack>
//
// Remplace les `<div style="display:flex;flex-direction:column;gap:..">`
// et les `style="margin-top:var(--sp-3)"` sur enfants empilés.
//
// `gap` accepte 1..6 et mappe sur var(--sp-N). Défaut: 3.
// ════════════════════════════════════════════════════════════════

import { LitElement, html, css } from 'lit';

const JUSTIFY = {
  start:   'flex-start',
  center:  'center',
  end:     'flex-end',
  between: 'space-between',
  around:  'space-around',
};
const ALIGN = {
  start:   'flex-start',
  center:  'center',
  end:     'flex-end',
  stretch: 'stretch',
};

export class DeckStack extends LitElement {
  static override styles = css`
    :host {
      display: flex;
      flex-direction: var(--_dir, column);
      gap: var(--_gap, var(--sp-3));
      align-items: var(--_align, stretch);
      justify-content: var(--_justify, flex-start);
      min-width: 0;
      min-height: 0;
    }
    :host([fill]) { flex: 1 1 auto; }
  `;

  static override properties = {
    gap:       { type: String },
    direction: { type: String },
    align:     { type: String },
    justify:   { type: String },
  };

  declare gap?: string;
  declare direction?: string;
  declare align?: string;
  declare justify?: string;

  override updated() {
    const n = parseInt(this.gap, 10);
    if (!Number.isNaN(n) && n >= 1 && n <= 6) {
      this.style.setProperty('--_gap', `var(--sp-${n})`);
    } else if (this.gap) {
      this.style.setProperty('--_gap', this.gap);
    }
    this.style.setProperty('--_dir', this.direction === 'row' ? 'row' : 'column');
    if (this.align)   this.style.setProperty('--_align',   ALIGN[this.align]   || this.align);
    if (this.justify) this.style.setProperty('--_justify', JUSTIFY[this.justify] || this.justify);
  }

  override render() {
    return html`<slot></slot>`;
  }
}

customElements.define('deck-stack', DeckStack);
