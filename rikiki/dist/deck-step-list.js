// src/deck-step-list.ts
import { LitElement, html, css } from "https://cdn.jsdelivr.net/npm/lit@3/+esm";
var DeckStepList = class extends LitElement {
  static {
    this.styles = css`
    :host {
      display: flex; flex-direction: column;
      gap: var(--gap-xs);
    }
  `;
  }
  render() {
    return html`<slot></slot>`;
  }
};
customElements.define("deck-step-list", DeckStepList);
var DeckStep = class extends LitElement {
  static {
    this.styles = css`
    :host {
      display: flex; align-items: center; gap: var(--sp-3);
      background: var(--surface-card);
      border: 1px solid var(--border);
      border-radius: var(--r-md);
      padding: var(--gap-xs) var(--sp-3);
      box-shadow: var(--shadow-card);
      font-family: var(--sans);
      font-size: var(--fs-body);
    }
    .step-num {
      flex: 0 0 auto;
      width: var(--icon-sm); height: var(--icon-sm);
      display: inline-flex; align-items: center; justify-content: center;
      background: var(--yellow); color: var(--dark);
      border-radius: 50%;
      font: 700 var(--fs-micro)/1 var(--sans);
    }
    .label {
      flex: 1;
      font-family: var(--mono); font-weight: 600;
      color: var(--text);
    }
    .chip {
      flex: 0 0 auto;
      display: inline-block;
      padding: 2px var(--sp-2);
      background: var(--surface-tint);
      color: var(--muted);
      border-radius: var(--r-pill);
      font: 600 var(--fs-small)/1.4 var(--sans);
    }
  `;
  }
  static {
    this.properties = {
      n: { type: String },
      note: { type: String }
    };
  }
  render() {
    return html`
      <span class="step-num">${this.n}</span>
      <span class="label"><slot></slot></span>
      ${this.note ? html`<span class="chip">${this.note}</span>` : ""}
    `;
  }
};
customElements.define("deck-step", DeckStep);
export {
  DeckStep,
  DeckStepList
};
//# sourceMappingURL=deck-step-list.js.map
