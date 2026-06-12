// ════════════════════════════════════════════════════════════════
// <deck-stat num="01" tone="orange|green|yellow|purple|lime|red|cyan">
//   <h3 slot="claim">Open index.html</h3>
//   Body text · what this number actually means.
// </deck-stat>
//
// A big-number visual element · for "promises", "metrics", "steps".
// Three layers:
//   · the `num` attribute renders as a huge display-font number
//   · the `claim` slot renders below, mid-size, in the display font
//   · the default slot renders as the body line
//
// A left border picks up the tone color; the number adopts it too.
// Tone defaults to `--rik-accent` (the deck's primary accent).
// ════════════════════════════════════════════════════════════════

import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

export type DeckStatTone =
  | 'yellow' | 'orange' | 'green' | 'red' | 'purple' | 'lime' | 'cyan';

const TONES: Record<DeckStatTone, string> = {
  yellow: 'var(--rik-accent)',
  orange: 'var(--rik-status-warn)',
  green:  'var(--rik-status-success)',
  red:    'var(--rik-status-danger)',
  purple: 'var(--rik-decor-orchid)',
  lime:   'var(--rik-decor-lime)',
  cyan:   'var(--rik-decor-canary)',
};

@customElement('deck-stat')
export class DeckStat extends LitElement {
  /* Customization tokens:
       --deck-stat-color (also drives the left border + number color)
       --deck-stat-num-size · default clamp(3.5rem, 7cqw, 6rem)
       --deck-stat-num-weight · default 900
       --deck-stat-claim-color · default --rik-text-default
       --deck-stat-body-color · default --rik-text-default--faint
       --deck-stat-border-width · default 4px
       --deck-stat-padding-x / --deck-stat-padding-y / --deck-stat-gap */
  static override styles = css`
    :host {
      display: flex; flex-direction: column;
      gap: var(--deck-stat-gap, var(--rik-space-2));
      padding: var(--deck-stat-padding-y, var(--rik-space-4)) var(--deck-stat-padding-x, var(--rik-space-3));
      border-left: var(--deck-stat-border-width, 4px) solid var(--_c, var(--deck-stat-color, var(--rik-accent)));
      min-width: 0;
      font-family: var(--rik-font-sans);
    }
    .num {
      font-family: var(--rik-font-display, var(--rik-font-sans));
      font-size: var(--deck-stat-num-size, clamp(3.5rem, 7cqw, 6rem));
      font-weight: var(--deck-stat-num-weight, 900);
      line-height: 0.9;
      color: var(--_c, var(--deck-stat-color, var(--rik-accent)));
      letter-spacing: -0.04em;
    }
    ::slotted([slot="claim"]) {
      font-family: var(--rik-font-display, var(--rik-font-sans));
      font-size: var(--rik-font-size-strong);
      font-weight: 800;
      color: var(--deck-stat-claim-color, var(--rik-text-default));
      line-height: 1.1;
      letter-spacing: -0.02em;
      margin: 0;
    }
    .body {
      font-size: var(--rik-font-size-body);
      color: var(--deck-stat-body-color, var(--rik-text-default--faint));
      line-height: 1.45;
      margin-top: var(--rik-space-2);
    }
    ::slotted(strong) { color: var(--rik-text-default); font-weight: 700; }
    ::slotted(code) {
      font-family: var(--rik-font-mono); font-size: var(--rik-font-size-mono-sm);
      background: var(--rik-surface-tint); color: var(--rik-text-default);
      padding: 2px 6px; border-radius: var(--rik-radius-sm);
    }
  `;

  @property({ type: String }) num?: string;
  @property({ type: String }) tone?: DeckStatTone;

  override updated() {
    if (this.tone) {
      this.style.setProperty('--_c', TONES[this.tone] ?? this.tone);
    } else {
      this.style.removeProperty('--_c');
    }
  }

  override render() {
    return html`
      ${this.num ? html`<div class="num" part="num">${this.num}</div>` : ''}
      <slot name="claim"></slot>
      <div class="body" part="body"><slot></slot></div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'deck-stat': DeckStat;
  }
}
