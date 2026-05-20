// ════════════════════════════════════════════════════════════════
// <deck-hook kicker="Coût au démarrage">
//   <p class="display on-dark">~1 seconde sur Switch</p>
//   <p class="caption on-dark">Sous-titre.</p>
// </deck-hook>
// ════════════════════════════════════════════════════════════════

import { LitElement, html, css } from 'lit';
import { slideBase } from './shared-styles.js';

export class DeckHook extends LitElement {
  /* Tokens:
       --deck-hook-bg               (defaults to --dark)
       --deck-hook-display-color    (defaults to --yellow)
       --deck-hook-caption-color    (defaults to --on-dark-muted)
       --deck-hook-gap              vertical gap between elements */
  static override styles = [...slideBase, css`
    :host {
      background: var(--deck-hook-bg, var(--dark));
      color: var(--on-dark-text);
      justify-content: center; align-items: center; text-align: center;
    }
    .body {
      display: flex; flex-direction: column; align-items: center;
      gap: var(--deck-hook-gap, var(--sp-4));
      max-width: 75vw;
    }
    ::slotted(.display) {
      font-family: var(--display, var(--sans));
      font-size: clamp(3rem, 7vw, 5.5rem);
      font-weight: 900;
      color: var(--deck-hook-display-color, var(--yellow));
      letter-spacing: -0.03em; line-height: 1.05;
      margin: 0;
    }
    ::slotted(.display.danger) { color: var(--red); }
    ::slotted(.caption) {
      font-size: var(--fs-lead);
      color: var(--deck-hook-caption-color, var(--on-dark-muted));
    }
  `];

  static override properties = { kicker: { type: String } };

  override render() {
    return html`
      <div class="body" part="body">
        ${this.kicker ? html`<span class="kicker on-dark">${this.kicker}</span>` : ''}
        <slot></slot>
      </div>
    `;
  }
}

customElements.define('deck-hook', DeckHook);
