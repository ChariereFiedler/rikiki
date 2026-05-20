// ════════════════════════════════════════════════════════════════
// <deck-metric-list>
//   <deck-metric severity="bad" value="5">Fichiers parsés</deck-metric>
//   <deck-metric severity="ok"  value="1">Utilisés</deck-metric>
// </deck-metric-list>
// ════════════════════════════════════════════════════════════════

import { LitElement, html, css } from 'lit';

export class DeckMetricList extends LitElement {
  static override styles = css`
    :host { display: flex; flex-direction: column; gap: var(--sp-2); }
  `;
  override render() { return html`<slot></slot>`; }
}
customElements.define('deck-metric-list', DeckMetricList);

export class DeckMetric extends LitElement {
  static override styles = css`
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
  static override properties = {
    value: { type: String },
    severity: { type: String },
    mono: { type: Boolean },
  };
  override render() {
    return html`
      <span class="label ${this.mono ? 'mono' : ''}"><slot></slot></span>
      <span class="value" data-severity="${this.severity || ''}">${this.value}</span>
    `;
  }
}
customElements.define('deck-metric', DeckMetric);
