// ════════════════════════════════════════════════════════════════
// <deck-section num="Section 2"><h1>Le système<br>de modules</h1></deck-section>
// ════════════════════════════════════════════════════════════════

import { LitElement, html, css } from 'lit';
import { slideBase } from './shared-styles.js';

export class DeckSection extends LitElement {
  /* Tokens:
       --deck-section-bg          (defaults to --dark)
       --deck-section-num-color   small section number      (--on-dark-faint)
       --deck-section-rule-color  line on each side         (--on-dark-border)
       --deck-section-title-color (defaults to --yellow)
       --deck-section-em-color    italic inside h1          (--on-dark-soft) */
  static override styles = [...slideBase, css`
    :host {
      background: var(--deck-section-bg, var(--dark));
      color: var(--on-dark-text);
      justify-content: center; align-items: center; text-align: center;
    }
    .sec-num {
      font-size: var(--fs-micro); font-weight: 700; letter-spacing: 0.16em;
      text-transform: uppercase;
      color: var(--deck-section-num-color, var(--on-dark-faint));
      margin-bottom: var(--sp-3);
      display: inline-flex; align-items: center; gap: 0.8rem;
      font-family: var(--mono);
    }
    .sec-num::before, .sec-num::after {
      content: ''; width: 32px; height: 1px;
      background: var(--deck-section-rule-color, var(--on-dark-border));
    }
    ::slotted(h1) {
      font-size: var(--fs-section); font-weight: 900;
      color: var(--deck-section-title-color, var(--yellow));
      line-height: 1.02; letter-spacing: -0.03em;
      max-width: 18ch;
      border: none; padding: 0; margin: 0;
      text-align: center; align-self: center;
    }
    ::slotted(h1 em) {
      color: var(--deck-section-em-color, var(--on-dark-soft));
      font-style: normal; font-weight: 700;
    }
  `];

  static override properties = { num: { type: String } };

  override render() {
    return html`
      ${this.num ? html`<div class="sec-num" part="num">${this.num}</div>` : ''}
      <slot></slot>
    `;
  }
}

customElements.define('deck-section', DeckSection);
