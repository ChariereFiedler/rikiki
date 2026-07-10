// ════════════════════════════════════════════════════════════════
// <deck-fit min="1" max="10"> ...any content... </deck-fit>
//
// Shrinks its slotted content to fit its box (the PowerPoint "shrink text on
// overflow" move) for content that is not a <deck-punch>. Inside a
// <deck-cell>, it fills the cell and picks the largest font-size that keeps
// the content from overflowing. See FitController for why this survives the
// zoom-to-fit transform and never loops.
//
// Attributes:
//   min · floor font-size in rem (default 1)
//   max · ceiling font-size in rem (default 12)
// ════════════════════════════════════════════════════════════════

import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { FitController } from '../shared/fit-controller.js';

@customElement('deck-fit')
export class DeckFit extends LitElement {
  static override styles = css`
    :host {
      display: block;
      width: 100%;
      height: 100%;
      overflow: hidden;
    }
  `;

  @property({ type: Number }) min?: number;
  @property({ type: Number }) max?: number;

  private fitter = new FitController(this, {
    minRem: () => this.min ?? 1,
    maxRem: () => this.max ?? 12,
  });

  override updated() {
    this.fitter.refit();
  }

  override render() {
    return html`<slot></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'deck-fit': DeckFit;
  }
}
