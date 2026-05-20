// ════════════════════════════════════════════════════════════════
// <deck-badge type="bad|ok|info|warn|neutral">Anti-pattern</deck-badge>
//
// Tokens (override on `:host` to retheme just one badge):
//   --deck-badge-bg          background fill
//   --deck-badge-fg          text color
//   --deck-badge-border      border color
//   --deck-badge-radius      border-radius
//   --deck-badge-padding-y / -x
//
// The `type` attribute maps to the theme's semantic surface/border
// tokens · no rgba literal in JS, theme switches just work.
// ════════════════════════════════════════════════════════════════

import { LitElement, html, css } from 'lit';

export class DeckBadge extends LitElement {
  static styles = css`
    :host {
      display: inline-block;
      padding: var(--deck-badge-padding-y, var(--sp-1)) var(--deck-badge-padding-x, var(--sp-3));
      margin-bottom: var(--sp-2);
      font: 700 var(--fs-micro)/1.2 var(--sans);
      letter-spacing: 0.1em; text-transform: uppercase;
      border-radius: var(--deck-badge-radius, var(--r-pill));
      background: var(--deck-badge-bg, var(--surface-tint));
      color: var(--deck-badge-fg, var(--muted));
      border: 1px solid var(--deck-badge-border, var(--border));
    }
    :host([type="bad"])  { --deck-badge-bg: var(--surface-bad);          --deck-badge-fg: var(--red);       --deck-badge-border: var(--border-bad); }
    :host([type="ok"])   { --deck-badge-bg: var(--surface-ok);           --deck-badge-fg: var(--green);     --deck-badge-border: var(--border-ok); }
    :host([type="info"]) { --deck-badge-bg: var(--surface-info-strong);  --deck-badge-fg: var(--text-info); --deck-badge-border: var(--border-info); }
    :host([type="warn"]) { --deck-badge-bg: var(--surface-warn);         --deck-badge-fg: var(--orange);    --deck-badge-border: var(--border-warn); }
  `;

  static properties = { type: { type: String } };

  render() {
    return html`<slot></slot>`;
  }
}

customElements.define('deck-badge', DeckBadge);
