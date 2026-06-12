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
    :host { display: flex; flex-direction: column; gap: var(--rik-space-2); }
  `;
  override render() {
    return html`<slot></slot>`;
  }
}

@customElement('deck-metric')
export class DeckMetric extends LitElement {
  /* Customization tokens:
       --deck-metric-bg / --deck-metric-border / --deck-metric-text
       --deck-metric-radius / --deck-metric-padding-x / --deck-metric-padding-y
       --deck-metric-shadow / --deck-metric-label-color
       --deck-metric-value-{bad,warn,ok,info} (overrides severity colors) */
  static override styles = css`
    :host {
      display: flex; justify-content: space-between; align-items: center;
      background: var(--deck-metric-bg, var(--rik-surface-raised--strong));
      border: 1px solid var(--deck-metric-border, var(--rik-border-default));
      border-radius: var(--deck-metric-radius, var(--rik-radius-md));
      padding: var(--deck-metric-padding-y, var(--rik-space-2)) var(--deck-metric-padding-x, var(--rik-space-4));
      font-family: var(--rik-font-sans);
      font-size: var(--rik-font-size-body);
      color: var(--deck-metric-text, var(--rik-text-default--muted));
      box-shadow: var(--deck-metric-shadow, var(--rik-elevation-2));
    }
    .label { font-family: inherit; }
    .label.mono {
      font-family: var(--rik-font-mono);
      font-size: var(--rik-font-size-sm);
      color: var(--deck-metric-label-color, var(--rik-text-default--faint));
    }
    .value { font-weight: 700; }
    .value[data-severity="bad"]  { color: var(--deck-metric-value-bad,  var(--rik-status-danger)); }
    .value[data-severity="warn"] { color: var(--deck-metric-value-warn, var(--rik-status-warn)); }
    .value[data-severity="ok"]   { color: var(--deck-metric-value-ok,   var(--rik-status-success)); }
    .value[data-severity="info"] { color: var(--deck-metric-value-info, var(--rik-status-info__text)); }
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
