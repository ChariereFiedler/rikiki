// src/deck-punch.ts
import { LitElement, html, css } from "https://cdn.jsdelivr.net/npm/lit@3/+esm";
var TONES = {
  default: "var(--text)",
  warn: "var(--orange)",
  danger: "var(--red)",
  ok: "var(--green)",
  info: "var(--yellow)",
  muted: "var(--muted)"
};
var SIZES = {
  lead: "var(--fs-lead)",
  big: "var(--fs-big)",
  mega: "var(--fs-mega)",
  stat: "var(--fs-stat)"
};
var DeckPunch = class extends LitElement {
  static {
    this.styles = css`
    :host {
      display: block;
      margin: 0;
      font-weight: 900;
      line-height: 1.1;
      letter-spacing: -0.01em;
      font-size: var(--_size, var(--fs-lead));
      color:     var(--_color, var(--text));
    }
    :host([weight="700"]) { font-weight: 700; }
    :host([align="center"]) { text-align: center; }
  `;
  }
  static {
    this.properties = {
      tone: { type: String },
      size: { type: String },
      weight: { type: String, reflect: true },
      align: { type: String, reflect: true }
    };
  }
  updated() {
    this.style.setProperty("--_color", TONES[this.tone] || TONES.default);
    this.style.setProperty("--_size", SIZES[this.size] || SIZES.lead);
  }
  render() {
    return html`<slot></slot>`;
  }
};
customElements.define("deck-punch", DeckPunch);
export {
  DeckPunch
};
//# sourceMappingURL=deck-punch.js.map
