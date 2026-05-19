// ════════════════════════════════════════════════════════════════
// <deck-hook kicker="Coût au démarrage">
//   <p class="display on-dark">~1 seconde sur Switch</p>
//   <p class="caption on-dark">Sous-titre.</p>
// </deck-hook>
// ════════════════════════════════════════════════════════════════

import { LitElement, html, css } from 'lit';
import { slideBase } from './shared-styles.js';

export class DeckHook extends LitElement {
  static styles = [...slideBase, css`
    :host {
      background: var(--dark); color: #fff;
      justify-content: center; align-items: center; text-align: center;
    }
    .body {
      display: flex; flex-direction: column; align-items: center;
      gap: var(--sp-4);
      max-width: 75vw;
    }
    ::slotted(.display) {
      font-size: clamp(3rem, 7vw, 5.5rem);
      font-weight: 900; color: var(--yellow);
      letter-spacing: -0.03em; line-height: 1.05;
      margin: 0;
    }
    ::slotted(.display.danger) { color: var(--red); }
    ::slotted(.caption) {
      font-size: var(--fs-lead);
      color: rgba(255,255,255,0.6);
    }
  `];

  static properties = { kicker: { type: String } };

  render() {
    return html`
      <div class="body" part="body">
        ${this.kicker ? html`<span class="kicker on-dark">${this.kicker}</span>` : ''}
        <slot></slot>
      </div>
    `;
  }
}

customElements.define('deck-hook', DeckHook);
