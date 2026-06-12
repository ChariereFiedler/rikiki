// ════════════════════════════════════════════════════════════════
// <deck-kicker>Ordre d'évaluation</deck-kicker>
// Sur fond clair par défaut. Ajouter on-dark pour fond sombre.
// ════════════════════════════════════════════════════════════════

import { LitElement, html, css } from 'lit';

export class DeckKicker extends LitElement {
  /* Customization tokens:
       --deck-kicker-color / --deck-kicker-on-dark-color
       --deck-kicker-font-size / --deck-kicker-tracking / --deck-kicker-margin */
  static override styles = css`
    :host {
      display: block;
      font: 700 var(--deck-kicker-font-size, var(--rik-font-size-xs))/1.2 var(--rik-font-sans);
      letter-spacing: var(--deck-kicker-tracking, 0.14em);
      text-transform: uppercase;
      color: var(--deck-kicker-color, var(--rik-text-default--faint));
      margin-bottom: var(--deck-kicker-margin, var(--rik-space-2));
    }
    :host([on-dark]) { color: var(--deck-kicker-on-dark-color, var(--rik-text-inverse--faint)); }
  `;
  override render() {
    return html`<slot></slot>`;
  }
}
customElements.define('deck-kicker', DeckKicker);
