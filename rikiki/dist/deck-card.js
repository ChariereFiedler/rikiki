// src/deck-card.ts
import { LitElement, html, css } from "https://cdn.jsdelivr.net/npm/lit@3/+esm";
var DeckCard = class extends LitElement {
  static {
    this.styles = css`
    :host {
      display: flex; flex-direction: column;
      gap: var(--sp-2);
      background: var(--surface-card);
      border: 1px solid var(--border);
      border-radius: var(--r-lg);
      padding: var(--sp-3) var(--sp-4);
      box-shadow: var(--shadow-card);
      min-height: 0;
      font-family: var(--sans);
      color: var(--soft);
    }
    :host([color="yellow"]) { background: var(--surface-info-faint); border-color: var(--border-info); }
    :host([color="orange"]) { background: var(--surface-warn);       border-color: var(--border-warn); }
    :host([color="green"])  { background: var(--surface-ok);         border-color: var(--border-ok); }
    :host([color="red"])    { background: var(--surface-bad);        border-color: var(--border-bad); }
    ::slotted(h3) {
      font-family: var(--display, var(--sans));
      font-size: var(--fs-h2);
      font-weight: 700;
      color: var(--text);
      letter-spacing: -0.01em;
      line-height: 1.25;
      margin: 0;
    }
    ::slotted(p) {
      font-size: var(--fs-body);
      line-height: 1.55;
      margin: 0;
    }
    ::slotted(strong) { color: var(--text); font-weight: 700; }
    :host([center])  { text-align: center; align-items: center; }
    :host([compact]) { padding: var(--sp-2) var(--sp-3); }
  `;
  }
  static {
    this.properties = { color: { type: String } };
  }
  render() {
    return html`<slot></slot>`;
  }
};
customElements.define("deck-card", DeckCard);
export {
  DeckCard
};
//# sourceMappingURL=deck-card.js.map
