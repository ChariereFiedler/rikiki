// ════════════════════════════════════════════════════════════════
// <deck-hero-detail eyebrow="Étape 0">
//   <h1 slot="title">Le fichier</h1>
//   <p slot="lead">Avant tout traitement, ce n'est qu'un texte UTF-8.</p>
//   <deck-code>...</deck-code>                 <!-- hero -->
//   <div slot="left">Card 1</div>              <!-- detail -->
//   <div slot="right">Card 2</div>
// </deck-hero-detail>
// ════════════════════════════════════════════════════════════════

import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { slideBase } from './shared-styles.js';

@customElement('deck-hero-detail')
export class DeckHeroDetail extends LitElement {
  static override styles = [...slideBase, css`
    :host { justify-content: flex-start; }
    /* The hero (code/chart) gets at least half the available height; .detail
       (bullets + diagram) is capped at ~40%. Without these caps a tall mermaid
       can grow to its intrinsic size and squeeze .hero to 0 (this is what
       happens in overview clones, which render the diagrams from scratch). */
    .hero {
      flex: 1 1 50%; min-height: 0;
      display: flex; flex-direction: column;
      overflow: hidden;
    }
    ::slotted(deck-code), ::slotted(deck-mermaid), ::slotted(pre), ::slotted(table), ::slotted(svg) {
      max-height: 100%; flex: 1 1 auto;
    }
    .detail {
      flex: 0 1 40%;
      min-height: 0;
      margin-top: var(--sp-3);
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--sp-4);
      overflow: hidden;
    }
    .col {
      display: flex; flex-direction: column;
      gap: var(--sp-2);
      min-width: 0;
      min-height: 0;
      overflow: hidden;
    }
  `];

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
    'deck-hero-detail': DeckHeroDetail;
  }
}
