// ════════════════════════════════════════════════════════════════
// <deck-section num="Section 2"><h1>Le système<br>de modules</h1></deck-section>
// ════════════════════════════════════════════════════════════════

import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { slideBase } from '../shared-styles.js';

@customElement('deck-section')
export class DeckSection extends LitElement {
  /* Tokens:
       --deck-section-bg          (defaults to --rik-surface-inverse)
       --deck-section-num-color   small section number      (--rik-text-inverse--ghost)
       --deck-section-rule-color  line on each side         (--rik-border-inverse)
       --deck-section-title-color (defaults to --rik-accent)
       --deck-section-em-color    italic inside h1          (--rik-text-inverse--muted) */
  static override styles = [...slideBase, css`
    :host {
      background: var(--deck-section-bg, var(--rik-surface-inverse));
      color: var(--rik-text-inverse);
      justify-content: center; align-items: center; text-align: center;
    }
    .sec-num {
      font-size: var(--rik-font-size-xs); font-weight: 700; letter-spacing: 0.16em;
      text-transform: uppercase;
      color: var(--deck-section-num-color, var(--rik-text-inverse--ghost));
      margin-bottom: var(--rik-space-3);
      display: inline-flex; align-items: center; gap: 0.8rem;
      font-family: var(--rik-font-mono);
    }
    .sec-num::before, .sec-num::after {
      content: ''; width: 32px; height: 1px;
      background: var(--deck-section-rule-color, var(--rik-border-inverse));
    }
    ::slotted(h1) {
      font-size: var(--rik-font-size-section); font-weight: 900;
      color: var(--deck-section-title-color, var(--rik-accent));
      line-height: 1.02; letter-spacing: -0.03em;
      max-width: 18ch;
      border: none; padding: 0; margin: 0;
      text-align: center; align-self: center;
    }
    ::slotted(h1 em) {
      color: var(--deck-section-em-color, var(--rik-text-inverse--muted));
      font-style: normal; font-weight: 700;
    }
  `];

  @property({ type: String }) num?: string;

  override render() {
    return html`
      ${this.num ? html`<div class="sec-num" part="num">${this.num}</div>` : ''}
      <slot></slot>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'deck-section': DeckSection;
  }
}
