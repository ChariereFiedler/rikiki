// src/deck-card.ts
import { LitElement, html, css } from "https://cdn.jsdelivr.net/npm/lit@3/+esm";
var COLORS = {
  yellow: { bg: "rgba(247,203,68,0.04)", bd: "rgba(247,203,68,0.55)" },
  orange: { bg: "rgba(234,88,12,0.03)", bd: "rgba(234,88,12,0.45)" },
  green: { bg: "rgba(22,163,74,0.025)", bd: "rgba(22,163,74,0.45)" },
  red: { bg: "rgba(220,38,38,0.025)", bd: "rgba(220,38,38,0.45)" }
};
var DeckCard = class extends LitElement {
  static {
    this.styles = css`
    :host {
      display: flex; flex-direction: column;
      gap: var(--sp-2);
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: var(--r-lg);
      padding: var(--sp-3) var(--sp-4);
      box-shadow: var(--shadow-card);
      min-height: 0;
      font-family: var(--sans);
      color: var(--soft);
    }
    ::slotted(h3) {
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
    :host([center]) { text-align: center; align-items: center; }
    :host([compact]) { padding: var(--sp-2) var(--sp-3); }
  `;
  }
  static {
    this.properties = { color: { type: String } };
  }
  render() {
    const c = COLORS[this.color];
    if (c) {
      this.style.background = c.bg;
      this.style.borderColor = c.bd;
    }
    return html`<slot></slot>`;
  }
};
customElements.define("deck-card", DeckCard);
export {
  DeckCard
};
//# sourceMappingURL=deck-card.js.map
