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

// src/deck-metric.ts
import { LitElement, html, css } from "https://cdn.jsdelivr.net/npm/lit@3/+esm";
import { customElement, property } from "https://cdn.jsdelivr.net/npm/lit@3/decorators.js/+esm";
var DeckMetricList = class extends LitElement {
  render() {
    return html`<slot></slot>`;
  }
};
DeckMetricList.styles = css`
    :host { display: flex; flex-direction: column; gap: var(--sp-2); }
  `;
DeckMetricList = __decorateClass([
  customElement("deck-metric-list")
], DeckMetricList);
var DeckMetric = class extends LitElement {
  constructor() {
    super(...arguments);
    this.mono = false;
  }
  render() {
    return html`
      <span class="label ${this.mono ? "mono" : ""}"><slot></slot></span>
      <span class="value" data-severity="${this.severity ?? ""}">${this.value}</span>
    `;
  }
};
DeckMetric.styles = css`
    :host {
      display: flex; justify-content: space-between; align-items: center;
      background: var(--surface-card);
      border: 1px solid var(--border);
      border-radius: var(--r-md);
      padding: var(--sp-2) var(--sp-4);
      font-family: var(--sans);
      font-size: var(--fs-body);
      color: var(--soft);
      box-shadow: var(--shadow-card);
    }
    .label { font-family: inherit; }
    .label.mono { font-family: var(--mono); font-size: var(--fs-small); color: var(--muted); }
    .value { font-weight: 700; }
    .value[data-severity="bad"]  { color: var(--red); }
    .value[data-severity="warn"] { color: var(--orange); }
    .value[data-severity="ok"]   { color: var(--green); }
    .value[data-severity="info"] { color: var(--text-info); }
  `;
__decorateClass([
  property({ type: String })
], DeckMetric.prototype, "value", 2);
__decorateClass([
  property({ type: String })
], DeckMetric.prototype, "severity", 2);
__decorateClass([
  property({ type: Boolean })
], DeckMetric.prototype, "mono", 2);
DeckMetric = __decorateClass([
  customElement("deck-metric")
], DeckMetric);
export {
  DeckMetric,
  DeckMetricList
};
//# sourceMappingURL=deck-metric.js.map
