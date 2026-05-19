// src/deck-kicker.ts
import { LitElement, html, css } from "https://cdn.jsdelivr.net/npm/lit@3/+esm";
var DeckKicker = class extends LitElement {
  static {
    this.styles = css`
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
  }
  render() {
    return html`<slot></slot>`;
  }
};
customElements.define("deck-kicker", DeckKicker);
export {
  DeckKicker
};
//# sourceMappingURL=deck-kicker.js.map
