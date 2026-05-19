// ════════════════════════════════════════════════════════════════
// <deck-section num="Section 2"><h1>Le système<br>de modules</h1></deck-section>
// ════════════════════════════════════════════════════════════════

import { LitElement, html, css } from 'lit';
import { slideBase } from './shared-styles.js';

export class DeckSection extends LitElement {
  static styles = [...slideBase, css`
    :host {
      background: var(--dark); color: #fff;
      justify-content: center; align-items: center; text-align: center;
    }
    .sec-num {
      font-size: var(--fs-micro); font-weight: 700; letter-spacing: 0.16em;
      text-transform: uppercase; color: rgba(255,255,255,0.35);
      margin-bottom: var(--sp-3);
      display: inline-flex; align-items: center; gap: 0.8rem;
    }
    .sec-num::before, .sec-num::after {
      content: ''; width: 32px; height: 1px;
      background: rgba(255,255,255,0.2);
    }
    ::slotted(h1) {
      font-size: var(--fs-section); font-weight: 900;
      color: var(--yellow); line-height: 1.02; letter-spacing: -0.03em;
      max-width: 18ch;
      border: none; padding: 0; margin: 0;
      text-align: center; align-self: center;
    }
    ::slotted(h1 em) { color: rgba(255,255,255,0.65); font-style: normal; font-weight: 700; }
  `];

  static properties = { num: { type: String } };

  render() {
    return html`
      ${this.num ? html`<div class="sec-num" part="num">${this.num}</div>` : ''}
      <slot></slot>
    `;
  }
}

customElements.define('deck-section', DeckSection);
