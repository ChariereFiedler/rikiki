// ════════════════════════════════════════════════════════════════
// <deck-notes> · speaker notes for a slide.
//
// Place inside any slide host (deck-feature, deck-cover, deck-split, …).
// Hidden by default · the deck-presenter.js plugin reads `textContent`
// to display them in the presenter window.
//
// Usage:
//   <deck-feature>
//     <h1 slot="title">My slide</h1>
//     <deck-notes>
//       - Mention the migration story
//       - Pause for laughter on the Java joke
//     </deck-notes>
//   </deck-feature>
// ════════════════════════════════════════════════════════════════

import { LitElement, css, html } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('deck-notes')
export class DeckNotes extends LitElement {
  static override styles = css`
    :host { display: none; }
  `;

  /** Read by the presenter plugin · pre-formatted text content. */
  get notes(): string {
    return (this.textContent ?? '').trim();
  }

  override render(): unknown {
    return html`<slot></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'deck-notes': DeckNotes;
  }
}
