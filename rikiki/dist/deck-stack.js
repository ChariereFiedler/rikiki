// src/deck-stack.ts
import { LitElement, html, css } from "https://cdn.jsdelivr.net/npm/lit@3/+esm";
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
  static {
    this.styles = css`
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
  }
  static {
    this.properties = {
      gap: { type: String },
      direction: { type: String },
      align: { type: String },
      justify: { type: String }
    };
  }
  updated() {
    const n = parseInt(this.gap, 10);
    if (!Number.isNaN(n) && n >= 1 && n <= 6) {
      this.style.setProperty("--_gap", `var(--sp-${n})`);
    } else if (this.gap) {
      this.style.setProperty("--_gap", this.gap);
    }
    this.style.setProperty("--_dir", this.direction === "row" ? "row" : "column");
    if (this.align) this.style.setProperty("--_align", ALIGN[this.align] || this.align);
    if (this.justify) this.style.setProperty("--_justify", JUSTIFY[this.justify] || this.justify);
  }
  render() {
    return html`<slot></slot>`;
  }
};
customElements.define("deck-stack", DeckStack);
export {
  DeckStack
};
//# sourceMappingURL=deck-stack.js.map
