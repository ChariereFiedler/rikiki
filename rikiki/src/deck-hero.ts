// ════════════════════════════════════════════════════════════════
// <deck-hero eyebrow="ESM">
//   <h1>Title</h1>
//   <p slot="lead">Optional hook line.</p>
//   <deck-code lang="js">...</deck-code>     <!-- or any focal block -->
// </deck-hero>
// ════════════════════════════════════════════════════════════════

import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { slideBase } from './shared-styles.js';

@customElement('deck-hero')
export class DeckHero extends LitElement {
  static override styles = [...slideBase, css`
    :host { justify-content: flex-start; }
    .body {
      flex: 1; min-height: 0;
      display: flex; flex-direction: column;
      justify-content: flex-start;
      gap: var(--sp-3);
      overflow: hidden;
    }
    ::slotted(deck-code:not([nested])),
    ::slotted(deck-mermaid),
    ::slotted(table),
    ::slotted(pre),
    ::slotted(svg),
    ::slotted(.hero-main) { max-height: 100%; flex: 0 1 auto; }
  `];

  @property({ type: String }) eyebrow?: string;

  override render() {
    return html`
      ${this.eyebrow ? html`<span class="lbl">${this.eyebrow}</span>` : ''}
      <slot name="title"></slot>
      <slot name="lead"></slot>
      <div class="body" part="body"><slot></slot></div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'deck-hero': DeckHero;
  }
}
