// src/deck-stat.ts
import { LitElement, html, css } from "https://cdn.jsdelivr.net/npm/lit@3/+esm";
var TONES = {
  yellow: "var(--yellow)",
  orange: "var(--orange)",
  green: "var(--green)",
  red: "var(--red)",
  purple: "var(--purple)",
  lime: "var(--lime)",
  cyan: "var(--cyan)"
};
var DeckStat = class extends LitElement {
  static {
    this.styles = css`
    :host {
      display: flex; flex-direction: column;
      gap: var(--sp-2);
      padding: var(--sp-4) var(--sp-3);
      border-left: 4px solid var(--_c, var(--yellow));
      min-width: 0;
      font-family: var(--sans);
    }
    .num {
      font-family: var(--display, var(--sans));
      font-size: clamp(3.5rem, 7vw, 6rem);
      font-weight: 900;
      line-height: 0.9;
      color: var(--_c, var(--yellow));
      letter-spacing: -0.04em;
    }
    ::slotted([slot="claim"]) {
      font-family: var(--display, var(--sans));
      font-size: var(--fs-strong);
      font-weight: 800;
      color: var(--text);
      line-height: 1.1;
      letter-spacing: -0.02em;
      margin: 0;
    }
    .body {
      font-size: var(--fs-body);
      color: var(--muted);
      line-height: 1.45;
      margin-top: var(--sp-2);
    }
    ::slotted(strong) { color: var(--text); font-weight: 700; }
    ::slotted(code) {
      font-family: var(--mono); font-size: var(--fs-mono-sm);
      background: var(--surface-tint); color: var(--text);
      padding: 2px 6px; border-radius: var(--r-sm);
    }
  `;
  }
  static {
    this.properties = {
      num: { type: String },
      tone: { type: String }
    };
  }
  updated() {
    if (this.tone) this.style.setProperty("--_c", TONES[this.tone] || this.tone);
  }
  render() {
    return html`
      ${this.num ? html`<div class="num" part="num">${this.num}</div>` : ""}
      <slot name="claim"></slot>
      <div class="body" part="body"><slot></slot></div>
    `;
  }
};
customElements.define("deck-stat", DeckStat);
export {
  DeckStat
};
//# sourceMappingURL=deck-stat.js.map
