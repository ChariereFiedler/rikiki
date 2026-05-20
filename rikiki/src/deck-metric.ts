// ════════════════════════════════════════════════════════════════
// <deck-metric-list>
//   <deck-metric severity="bad" value="5">Files parsed</deck-metric>
//   <deck-metric severity="ok"  value="1">Used</deck-metric>
// </deck-metric-list>
// ════════════════════════════════════════════════════════════════

import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

export type DeckMetricSeverity = 'bad' | 'warn' | 'ok' | 'info';

@customElement('deck-metric-list')
export class DeckMetricList extends LitElement {
  static override styles = css`
    :host { display: flex; flex-direction: column; gap: var(--sp-2); }
  `;
  override render() { return html`<slot></slot>`; }
}

@customElement('deck-metric')
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

  @property({ type: String }) value?: string;
  @property({ type: String }) severity?: DeckMetricSeverity;
  @property({ type: Boolean }) mono = false;

  override render() {
    return html`
      <span class="label ${this.mono ? 'mono' : ''}"><slot></slot></span>
      <span class="value" data-severity="${this.severity ?? ''}">${this.value}</span>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'deck-metric-list': DeckMetricList;
    'deck-metric': DeckMetric;
  }
}
