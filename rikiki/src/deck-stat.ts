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
// Tone defaults to `--yellow` (the deck's primary accent).
// ════════════════════════════════════════════════════════════════

import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

export type DeckStatTone =
  | 'yellow' | 'orange' | 'green' | 'red' | 'purple' | 'lime' | 'cyan';

const TONES: Record<DeckStatTone, string> = {
  yellow: 'var(--yellow)',
  orange: 'var(--orange)',
  green:  'var(--green)',
  red:    'var(--red)',
  purple: 'var(--purple)',
  lime:   'var(--lime)',
  cyan:   'var(--cyan)',
};

@customElement('deck-stat')
export class DeckStat extends LitElement {
  static override styles = css`
    :host {
      display: flex; flex-direction: column;
      gap: var(--sp-2);
      padding: var(--sp-4) var(--sp-3);
      border-left: 4px solid var(--_c, var(--yellow));
      min-width: 0;
      font-family: var(--sans);
    }
    .num {
      font-family: var(--display, var(--sans));
      font-size: clamp(3.5rem, 7vw, 6rem);
      font-weight: 900;
      line-height: 0.9;
      color: var(--_c, var(--yellow));
      letter-spacing: -0.04em;
    }
    ::slotted([slot="claim"]) {
      font-family: var(--display, var(--sans));
      font-size: var(--fs-strong);
      font-weight: 800;
      color: var(--text);
      line-height: 1.1;
      letter-spacing: -0.02em;
      margin: 0;
    }
    .body {
      font-size: var(--fs-body);
      color: var(--muted);
      line-height: 1.45;
      margin-top: var(--sp-2);
    }
    ::slotted(strong) { color: var(--text); font-weight: 700; }
    ::slotted(code) {
      font-family: var(--mono); font-size: var(--fs-mono-sm);
      background: var(--surface-tint); color: var(--text);
      padding: 2px 6px; border-radius: var(--r-sm);
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
