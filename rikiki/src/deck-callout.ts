// ════════════════════════════════════════════════════════════════
// <deck-callout type="info|warn|danger|ok">
//   Texte du callout, **markdown autorisé via deck-md à l'intérieur**.
// </deck-callout>
// ════════════════════════════════════════════════════════════════

import { LitElement, html, css } from 'lit';

const ICONS = {
  info:   '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>',
  warn:   '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
  danger: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
  ok:     '<polyline points="20 6 9 17 4 12"/>',
};

const COLORS = {
  info:   { bg: 'rgba(247,203,68,0.10)', bd: 'rgba(247,203,68,0.45)', st: 'var(--yellow)' },
  warn:   { bg: 'rgba(234,88,12,0.08)',  bd: 'rgba(234,88,12,0.40)',  st: 'var(--orange)' },
  danger: { bg: 'rgba(220,38,38,0.08)',  bd: 'rgba(220,38,38,0.40)',  st: 'var(--red)' },
  ok:     { bg: 'rgba(22,163,74,0.08)',  bd: 'rgba(22,163,74,0.40)',  st: 'var(--green)' },
};

export class DeckCallout extends LitElement {
  static styles = css`
    :host {
      display: flex; gap: var(--sp-3);
      padding: var(--sp-3) var(--sp-4);
      border-radius: var(--r-md);
      border: 1px solid transparent;
      font-size: var(--fs-body); line-height: 1.55;
      box-shadow: var(--shadow-card);
      align-items: center;
      color: var(--soft);
      font-family: var(--sans);
    }
    .icon-box {
      flex-shrink: 0;
      width: var(--icon-2xl); height: var(--icon-2xl);
      display: inline-flex; align-items: center; justify-content: center;
      border-radius: 50%;
      background: var(--surface-tint);
    }
    .icon-box svg { width: var(--icon-lg); height: var(--icon-lg); stroke-width: 2.2; }
    .content { flex: 1; }
    ::slotted(p) { margin: 0; }
    ::slotted(strong) { color: var(--text); font-weight: 700; }
    ::slotted(code) {
      font-family: var(--mono); font-size: var(--fs-mono-sm);
      background: rgba(0,0,0,0.06); padding: 2px 6px;
      border-radius: var(--r-sm); color: var(--text);
    }
  `;

  static properties = { type: { type: String } };

  render() {
    const t = this.type || 'info';
    const c = COLORS[t] || COLORS.info;
    const icon = ICONS[t] || ICONS.info;
    this.style.background = c.bg;
    this.style.borderColor = c.bd;
    return html`
      <div class="icon-box">
        <svg viewBox="0 0 24 24" fill="none" stroke="${c.st}" stroke-width="2.2"
             .innerHTML="${icon}"></svg>
      </div>
      <div class="content"><slot></slot></div>
    `;
  }
}

customElements.define('deck-callout', DeckCallout);
