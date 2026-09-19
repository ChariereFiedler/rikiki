// ════════════════════════════════════════════════════════════════
// <deck-card color="yellow|orange|green|red" center? compact?>
//   <h3>Title</h3>
//   <p>Content, or any component inside.</p>
// </deck-card>
//
// Attributes:
//   color   · tints the card · maps to the theme's semantic tokens.
//   center  · centers content and text.
//   compact · reduced padding.
//
// `color` maps to the theme tokens, so a theme switch updates the card
// instantly · no rgba literals baked in JS.
//   yellow  → --rik-status-info__bg--mid  / --rik-status-info__border
//   orange  → --rik-status-warn__bg  / --rik-status-warn__border
//   green   → --rik-status-success__bg    / --rik-status-success__border
//   red     → --rik-status-danger__bg   / --rik-status-danger__border
// ════════════════════════════════════════════════════════════════

import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

export type DeckCardColor = 'yellow' | 'orange' | 'green' | 'red';

@customElement('deck-card')
export class DeckCard extends LitElement {
  /* Customization tokens:
       --deck-card-bg / --deck-card-border / --deck-card-text
       --deck-card-radius / --deck-card-padding-x / --deck-card-padding-y
       --deck-card-shadow / --deck-card-title-color / --deck-card-gap
     Override on the host or :root to retheme. Color-attribute variants
     map to --rik-status-* tokens by default. */
  static override styles = css`
    :host {
      display: flex; flex-direction: column;
      gap: var(--deck-card-gap, var(--rik-space-2));
      background: var(--deck-card-bg, var(--rik-surface-raised--strong));
      border: 1px solid var(--deck-card-border, var(--rik-border-default));
      border-radius: var(--deck-card-radius, var(--rik-radius-lg));
      padding: var(--deck-card-padding-y, var(--rik-space-3)) var(--deck-card-padding-x, var(--rik-space-4));
      box-shadow: var(--deck-card-shadow, var(--rik-elevation-2));
      min-height: 0;
      font-family: var(--rik-font-sans);
      color: var(--deck-card-text, var(--rik-text-default--muted));
    }
    /* Status-tinted variants · 4 px border reads as a status pill at slide
       distance. The status tokens are saturated enough (0.70 alpha) to carry
       a thick line without feeling shouty. */
    :host([color="yellow"]) { background: var(--deck-card-bg, var(--rik-status-info__bg));     border: 4px solid var(--deck-card-border, var(--rik-status-info__border)); }
    :host([color="orange"]) { background: var(--deck-card-bg, var(--rik-status-warn__bg));     border: 4px solid var(--deck-card-border, var(--rik-status-warn__border)); }
    :host([color="green"])  { background: var(--deck-card-bg, var(--rik-status-success__bg));  border: 4px solid var(--deck-card-border, var(--rik-status-success__border)); }
    :host([color="red"])    { background: var(--deck-card-bg, var(--rik-status-danger__bg));   border: 4px solid var(--deck-card-border, var(--rik-status-danger__border)); }
    ::slotted(h3) {
      font-family: var(--rik-font-display, var(--rik-font-sans));
      font-size: var(--rik-font-size-h2);
      font-weight: 700;
      color: var(--deck-card-title-color, var(--rik-text-default));
      letter-spacing: -0.01em;
      line-height: 1.25;
      margin: 0;
    }
    ::slotted(p) {
      font-size: var(--rik-font-size-body);
      line-height: 1.55;
      margin: 0;
    }
    ::slotted(strong) { color: var(--rik-text-default); font-weight: 700; }
    :host([center])  { text-align: center; align-items: center; }
    :host([compact]) { padding: var(--rik-space-2) var(--rik-space-3); }
  `;

  @property({ type: String }) color?: DeckCardColor;
  @property({ type: Boolean }) center = false;
  @property({ type: Boolean }) compact = false;

  override render() {
    return html`<slot></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'deck-card': DeckCard;
  }
}
