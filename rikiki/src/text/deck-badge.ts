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
import { customElement, property } from 'lit/decorators.js';

export type DeckBadgeType = 'bad' | 'ok' | 'info' | 'warn' | 'neutral';

@customElement('deck-badge')
export class DeckBadge extends LitElement {
  static override styles = css`
    :host {
      display: inline-block;
      padding: var(--deck-badge-padding-y, var(--rik-space-1)) var(--deck-badge-padding-x, var(--rik-space-3));
      margin-bottom: var(--rik-space-2);
      font: 700 var(--rik-font-size-xs)/1.2 var(--rik-font-sans);
      letter-spacing: 0.1em; text-transform: uppercase;
      border-radius: var(--deck-badge-radius, var(--rik-radius-pill));
      background: var(--deck-badge-bg, var(--rik-surface-tint));
      color: var(--deck-badge-fg, var(--rik-text-default--faint));
      border: 1px solid var(--deck-badge-border, var(--rik-border-default));
    }
    :host([type="bad"])  { --deck-badge-bg: var(--rik-status-danger__bg);          --deck-badge-fg: var(--rik-status-danger);       --deck-badge-border: var(--rik-status-danger__border); }
    :host([type="ok"])   { --deck-badge-bg: var(--rik-status-success__bg);           --deck-badge-fg: var(--rik-status-success);     --deck-badge-border: var(--rik-status-success__border); }
    :host([type="info"]) { --deck-badge-bg: var(--rik-status-info__bg--strong);  --deck-badge-fg: var(--rik-status-info__text); --deck-badge-border: var(--rik-status-info__border); }
    :host([type="warn"]) { --deck-badge-bg: var(--rik-status-warn__bg);         --deck-badge-fg: var(--rik-status-warn);    --deck-badge-border: var(--rik-status-warn__border); }
  `;

  @property({ type: String }) type?: DeckBadgeType;

  override render() {
    return html`<slot></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'deck-badge': DeckBadge;
  }
}
