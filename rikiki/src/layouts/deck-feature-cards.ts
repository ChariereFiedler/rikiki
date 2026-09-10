// ════════════════════════════════════════════════════════════════
// <deck-feature-cards eyebrow="Étape 0">
//   <h1 slot="title">Le fichier</h1>
//   <p slot="lead">Avant tout traitement, ce n'est qu'un texte UTF-8.</p>
//   <deck-code>...</deck-code>                 <!-- hero -->
//   <div slot="left">Card 1</div>              <!-- detail -->
//   <div slot="right">Card 2</div>
// </deck-feature-cards>
// ════════════════════════════════════════════════════════════════

import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { slideBase } from '../shared-styles.js';

@customElement('deck-feature-cards')
export class DeckFeatureCards extends LitElement {
  static override styles = [
    ...slideBase,
    css`
    :host { justify-content: flex-start; }
    /* Let the hero use its measured content height, then give the remaining
       canvas to the detail row. A percentage split leaves a dead band whenever
       a short code block sits inside the reserved hero half. */
    .hero {
      flex: var(--deck-feature-cards-hero-flex, 0 1 auto); min-height: 0;
      display: flex; flex-direction: column;
      overflow: hidden;
    }
    ::slotted(deck-code), ::slotted(deck-mermaid), ::slotted(pre), ::slotted(table), ::slotted(svg) {
      max-height: 100%; flex: 1 1 auto;
    }
    /* Customization tokens:
         --deck-feature-cards-gap (between hero and detail cards)
         --deck-feature-cards-col-gap (between left and right cards)
         --deck-feature-cards-hero-flex (default '0 1 auto')
         --deck-feature-cards-detail-flex (default '1 1 auto') */
    .detail {
      flex: var(--deck-feature-cards-detail-flex, 1 1 auto);
      min-height: 0;
      margin-top: var(--deck-feature-cards-gap, var(--rik-space-3));
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--deck-feature-cards-col-gap, var(--rik-space-4));
      overflow: hidden;
    }
    .col {
      display: flex; flex-direction: column;
      justify-content: flex-start;
      gap: var(--rik-space-2);
      min-width: 0;
      min-height: 0;
      overflow: hidden;
    }
  `,
  ];

  @property({ type: String }) eyebrow?: string;

  override render() {
    return html`
      ${this.eyebrow ? html`<span class="lbl">${this.eyebrow}</span>` : ''}
      <slot name="title"></slot>
      <slot name="lead"></slot>
      <div class="hero" part="hero"><slot></slot></div>
      <div class="detail" part="detail">
        <div class="col"><slot name="left"></slot></div>
        <div class="col"><slot name="right"></slot></div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'deck-feature-cards': DeckFeatureCards;
  }
}
