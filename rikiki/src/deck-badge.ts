// ════════════════════════════════════════════════════════════════
// <deck-badge type="bad|ok|info|warn|neutral">Anti-pattern</deck-badge>
// ════════════════════════════════════════════════════════════════

import { LitElement, html, css } from 'lit';

const TYPES = {
  bad:  { bg: 'var(--surface-bad)',          fg: 'var(--red)',       bd: 'var(--border-bad)' },
  ok:   { bg: 'var(--surface-ok)',           fg: 'var(--green)',     bd: 'var(--border-ok)' },
  info: { bg: 'var(--surface-info-strong)',  fg: 'var(--text-info)', bd: 'var(--border-info)' },
  warn: { bg: 'var(--surface-warn)',         fg: 'var(--orange)',    bd: 'var(--border-warn)' },
  neutral: { bg: 'var(--surface-tint)',      fg: 'var(--muted)',     bd: 'var(--border)' },
};

export class DeckBadge extends LitElement {
  static styles = css`
    :host {
      display: inline-block;
      padding: var(--sp-1) var(--sp-3);
      margin-bottom: var(--sp-2);
      font: 700 var(--fs-micro)/1.2 var(--sans);
      letter-spacing: 0.1em; text-transform: uppercase;
      border-radius: var(--r-pill);
      border: 1px solid transparent;
    }
  `;
  static properties = { type: { type: String } };
  render() {
    const t = TYPES[this.type] || TYPES.neutral;
    this.style.background = t.bg;
    this.style.color = t.fg;
    this.style.borderColor = t.bd;
    return html`<slot></slot>`;
  }
}
customElements.define('deck-badge', DeckBadge);
