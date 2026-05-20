// src/deck-punch.ts
import { LitElement, html, css } from "https://cdn.jsdelivr.net/npm/lit@3/+esm";
var TONES = {
  warn: "var(--orange)",
  danger: "var(--red)",
  ok: "var(--green)",
  info: "var(--yellow)",
  muted: "var(--muted)",
  accent: "var(--yellow)"
};
var SIZES = {
  lead: "var(--fs-lead)",
  big: "var(--fs-big)",
  mega: "var(--fs-mega)",
  stat: "var(--fs-stat)",
  display: "clamp(2.6rem, 6vw, 5rem)"
};
var DeckPunch = class extends LitElement {
  static {
    this.styles = css`
    :host {
      display: block;
      margin: 0;
      font-family: var(--display, var(--sans));
      font-weight: 900;
      line-height: 1.1;
      letter-spacing: -0.02em;
      font-size: var(--deck-punch-size, var(--_size, var(--fs-lead)));
      /* "inherit" lets us pick up the on-dark color of cover/hook/section · the
         color is only overridden when a tone is explicitly chosen. */
      color:     var(--deck-punch-color, var(--_color, inherit));
    }
    :host([weight="700"]) { font-weight: 700; }
    :host([weight="800"]) { font-weight: 800; }
    :host([align="center"]) { text-align: center; }
    :host([align="right"])  { text-align: right; }
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
    if (this.tone && TONES[this.tone]) {
      this.style.setProperty("--_color", TONES[this.tone]);
    } else {
      this.style.removeProperty("--_color");
    }
    if (this.size && SIZES[this.size]) {
      this.style.setProperty("--_size", SIZES[this.size]);
    } else {
      this.style.removeProperty("--_size");
    }
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
