// ════════════════════════════════════════════════════════════════
// <deck-takeaway kicker="Coût au démarrage">
//   <p class="display on-dark">~1 seconde sur Switch</p>
//   <p class="caption on-dark">Sous-titre.</p>
// </deck-takeaway>
// ════════════════════════════════════════════════════════════════

import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { slideBase } from './shared-styles.js';

@customElement('deck-takeaway')
export class DeckTakeaway extends LitElement {
  /* Tokens:
       --deck-takeaway-bg               (defaults to --rik-surface-inverse)
       --deck-takeaway-display-color    (defaults to --rik-accent)
       --deck-takeaway-caption-color    (defaults to --rik-text-inverse--faint)
       --deck-takeaway-gap              vertical gap between elements */
  static override styles = [...slideBase, css`
    :host {
      background: var(--deck-takeaway-bg, var(--rik-surface-inverse));
      color: var(--rik-text-inverse);
      justify-content: center; align-items: center; text-align: center;
    }
    .body {
      display: flex; flex-direction: column; align-items: center;
      gap: var(--deck-takeaway-gap, var(--rik-space-4));
      max-width: 75vw;
    }
    ::slotted(.display) {
      font-family: var(--rik-font-display, var(--rik-font-sans));
      font-size: clamp(3rem, 7vw, 5.5rem);
      font-weight: 900;
      color: var(--deck-takeaway-display-color, var(--rik-accent));
      letter-spacing: -0.03em; line-height: 1.05;
      margin: 0;
    }
    ::slotted(.display.danger) { color: var(--rik-status-danger); }
    ::slotted(.caption) {
      font-size: var(--rik-font-size-lead);
      color: var(--deck-takeaway-caption-color, var(--rik-text-inverse--faint));
    }
  `];

  @property({ type: String }) kicker?: string;

  override render() {
    return html`
      <div class="body" part="body">
        ${this.kicker ? html`<span class="kicker on-dark">${this.kicker}</span>` : ''}
        <slot></slot>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'deck-takeaway': DeckTakeaway;
  }
}
