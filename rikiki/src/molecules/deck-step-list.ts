// ════════════════════════════════════════════════════════════════
// <deck-step-list>
//   <deck-step n="1" note="leaf">button.ts</deck-step>
//   <deck-step n="2" note="leaf">icon.ts</deck-step>
//   ...
// </deck-step-list>
// ════════════════════════════════════════════════════════════════

import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('deck-step-list')
export class DeckStepList extends LitElement {
  static override styles = css`
    :host {
      display: flex; flex-direction: column;
      gap: var(--rik-space-2xs);
    }
  `;
  override render() {
    return html`<slot></slot>`;
  }
}

@customElement('deck-step')
export class DeckStep extends LitElement {
  /* Customization tokens:
       --deck-step-bg / --deck-step-border / --deck-step-radius
       --deck-step-padding-x / --deck-step-padding-y / --deck-step-shadow
       --deck-step-num-bg / --deck-step-num-color / --deck-step-num-size
       --deck-step-label-color / --deck-step-chip-bg / --deck-step-chip-color */
  static override styles = css`
    :host {
      display: flex; align-items: center; gap: var(--rik-space-3);
      background: var(--deck-step-bg, var(--rik-surface-raised--strong));
      border: 1px solid var(--deck-step-border, var(--rik-border-default));
      border-radius: var(--deck-step-radius, var(--rik-radius-md));
      padding: var(--deck-step-padding-y, var(--rik-space-2xs)) var(--deck-step-padding-x, var(--rik-space-3));
      box-shadow: var(--deck-step-shadow, var(--rik-elevation-2));
      font-family: var(--rik-font-sans);
      font-size: var(--rik-font-size-body);
    }
    .step-num {
      flex: 0 0 auto;
      width: var(--deck-step-num-size, var(--rik-icon-sm));
      height: var(--deck-step-num-size, var(--rik-icon-sm));
      display: inline-flex; align-items: center; justify-content: center;
      background: var(--deck-step-num-bg, var(--rik-accent));
      color: var(--deck-step-num-color, var(--rik-accent__on, var(--rik-surface-inverse)));
      border-radius: 50%;
      font: 700 var(--rik-font-size-xs)/1 var(--rik-font-sans);
    }
    .label {
      flex: 1;
      font-family: var(--rik-font-mono); font-weight: 600;
      color: var(--deck-step-label-color, var(--rik-text-default));
    }
    .chip {
      flex: 0 0 auto;
      display: inline-block;
      padding: 2px var(--rik-space-2);
      background: var(--deck-step-chip-bg, var(--rik-surface-tint));
      color: var(--deck-step-chip-color, var(--rik-text-default--faint));
      border-radius: var(--rik-radius-pill);
      font: 600 var(--rik-font-size-sm)/1.4 var(--rik-font-sans);
    }
  `;

  @property({ type: String }) n?: string;
  @property({ type: String }) note?: string;

  override render() {
    return html`
      <span class="step-num">${this.n}</span>
      <span class="label"><slot></slot></span>
      ${this.note ? html`<span class="chip">${this.note}</span>` : ''}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'deck-step-list': DeckStepList;
    'deck-step': DeckStep;
  }
}
