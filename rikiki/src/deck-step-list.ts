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
      gap: var(--gap-xs);
    }
  `;
  override render() { return html`<slot></slot>`; }
}

@customElement('deck-step')
export class DeckStep extends LitElement {
  static override styles = css`
    :host {
      display: flex; align-items: center; gap: var(--sp-3);
      background: var(--surface-card);
      border: 1px solid var(--border);
      border-radius: var(--r-md);
      padding: var(--gap-xs) var(--sp-3);
      box-shadow: var(--shadow-card);
      font-family: var(--sans);
      font-size: var(--fs-body);
    }
    .step-num {
      flex: 0 0 auto;
      width: var(--icon-sm); height: var(--icon-sm);
      display: inline-flex; align-items: center; justify-content: center;
      background: var(--yellow); color: var(--dark);
      border-radius: 50%;
      font: 700 var(--fs-micro)/1 var(--sans);
    }
    .label {
      flex: 1;
      font-family: var(--mono); font-weight: 600;
      color: var(--text);
    }
    .chip {
      flex: 0 0 auto;
      display: inline-block;
      padding: 2px var(--sp-2);
      background: var(--surface-tint);
      color: var(--muted);
      border-radius: var(--r-pill);
      font: 600 var(--fs-small)/1.4 var(--sans);
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
