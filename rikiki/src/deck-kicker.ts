// ════════════════════════════════════════════════════════════════
// <deck-kicker>Ordre d'évaluation</deck-kicker>
// Sur fond clair par défaut. Ajouter on-dark pour fond sombre.
// ════════════════════════════════════════════════════════════════

import { LitElement, html, css } from 'lit';

export class DeckKicker extends LitElement {
  static styles = css`
    :host {
      display: block;
      font: 700 var(--fs-micro)/1.2 var(--sans);
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--muted);
      margin-bottom: var(--sp-2);
    }
    :host([on-dark]) { color: var(--on-dark-muted); }
  `;
  render() { return html`<slot></slot>`; }
}
customElements.define('deck-kicker', DeckKicker);
