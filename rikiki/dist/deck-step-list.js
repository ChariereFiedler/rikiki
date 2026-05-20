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

// src/deck-step-list.ts
import { LitElement, html, css } from "https://cdn.jsdelivr.net/npm/lit@3/+esm";
import { customElement, property } from "https://cdn.jsdelivr.net/npm/lit@3/decorators.js/+esm";
var DeckStepList = class extends LitElement {
  render() {
    return html`<slot></slot>`;
  }
};
DeckStepList.styles = css`
    :host {
      display: flex; flex-direction: column;
      gap: var(--gap-xs);
    }
  `;
DeckStepList = __decorateClass([
  customElement("deck-step-list")
], DeckStepList);
var DeckStep = class extends LitElement {
  render() {
    return html`
      <span class="step-num">${this.n}</span>
      <span class="label"><slot></slot></span>
      ${this.note ? html`<span class="chip">${this.note}</span>` : ""}
    `;
  }
};
DeckStep.styles = css`
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
__decorateClass([
  property({ type: String })
], DeckStep.prototype, "n", 2);
__decorateClass([
  property({ type: String })
], DeckStep.prototype, "note", 2);
DeckStep = __decorateClass([
  customElement("deck-step")
], DeckStep);
export {
  DeckStep,
  DeckStepList
};
//# sourceMappingURL=deck-step-list.js.map
