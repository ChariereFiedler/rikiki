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

// src/deck-stack.ts
import { LitElement, html, css } from "https://cdn.jsdelivr.net/npm/lit@3/+esm";
import { customElement, property } from "https://cdn.jsdelivr.net/npm/lit@3/decorators.js/+esm";
var JUSTIFY = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
  between: "space-between",
  around: "space-around"
};
var ALIGN = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
  stretch: "stretch"
};
var DeckStack = class extends LitElement {
  updated() {
    if (this.gap) {
      const n = parseInt(this.gap, 10);
      if (!Number.isNaN(n) && n >= 1 && n <= 6) {
        this.style.setProperty("--_gap", `var(--sp-${n})`);
      } else {
        this.style.setProperty("--_gap", this.gap);
      }
    } else {
      this.style.removeProperty("--_gap");
    }
    this.style.setProperty("--_dir", this.direction === "row" ? "row" : "column");
    if (this.align) this.style.setProperty("--_align", ALIGN[this.align] ?? this.align);
    if (this.justify) this.style.setProperty("--_justify", JUSTIFY[this.justify] ?? this.justify);
  }
  render() {
    return html`<slot></slot>`;
  }
};
DeckStack.styles = css`
    :host {
      display: flex;
      flex-direction: var(--_dir, column);
      gap: var(--_gap, var(--sp-3));
      align-items: var(--_align, stretch);
      justify-content: var(--_justify, flex-start);
      min-width: 0;
      min-height: 0;
    }
    :host([fill]) { flex: 1 1 auto; }
  `;
__decorateClass([
  property({ type: String })
], DeckStack.prototype, "gap", 2);
__decorateClass([
  property({ type: String })
], DeckStack.prototype, "direction", 2);
__decorateClass([
  property({ type: String })
], DeckStack.prototype, "align", 2);
__decorateClass([
  property({ type: String })
], DeckStack.prototype, "justify", 2);
DeckStack = __decorateClass([
  customElement("deck-stack")
], DeckStack);
export {
  DeckStack
};
//# sourceMappingURL=deck-stack.js.map
