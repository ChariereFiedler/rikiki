var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if (decorator = decorators[i])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp(target, key, result);
  return result;
};

// src/deck-punch.ts
import { LitElement, html, css } from "https://cdn.jsdelivr.net/npm/lit@3/+esm";
import { customElement, property } from "https://cdn.jsdelivr.net/npm/lit@3/decorators.js/+esm";
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
DeckPunch.styles = css`
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
__decorateClass([
  property({ type: String })
], DeckPunch.prototype, "tone", 2);
__decorateClass([
  property({ type: String })
], DeckPunch.prototype, "size", 2);
__decorateClass([
  property({ type: String, reflect: true })
], DeckPunch.prototype, "weight", 2);
__decorateClass([
  property({ type: String, reflect: true })
], DeckPunch.prototype, "align", 2);
DeckPunch = __decorateClass([
  customElement("deck-punch")
], DeckPunch);
export {
  DeckPunch
};
//# sourceMappingURL=deck-punch.js.map
