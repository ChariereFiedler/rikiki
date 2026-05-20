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
//   yellow  → --surface-info  / --border-info
//   orange  → --surface-warn  / --border-warn
//   green   → --surface-ok    / --border-ok
//   red     → --surface-bad   / --border-bad
// ════════════════════════════════════════════════════════════════

import { LitElement, html, css } from 'lit';

export class DeckCard extends LitElement {
  static override styles = css`
    :host {
      display: flex; flex-direction: column;
      gap: var(--sp-2);
      background: var(--surface-card);
      border: 1px solid var(--border);
      border-radius: var(--r-lg);
      padding: var(--sp-3) var(--sp-4);
      box-shadow: var(--shadow-card);
      min-height: 0;
      font-family: var(--sans);
      color: var(--soft);
    }
    :host([color="yellow"]) { background: var(--surface-info-faint); border-color: var(--border-info); }
    :host([color="orange"]) { background: var(--surface-warn);       border-color: var(--border-warn); }
    :host([color="green"])  { background: var(--surface-ok);         border-color: var(--border-ok); }
    :host([color="red"])    { background: var(--surface-bad);        border-color: var(--border-bad); }
    ::slotted(h3) {
      font-family: var(--display, var(--sans));
      font-size: var(--fs-h2);
      font-weight: 700;
      color: var(--text);
      letter-spacing: -0.01em;
      line-height: 1.25;
      margin: 0;
    }
    ::slotted(p) {
      font-size: var(--fs-body);
      line-height: 1.55;
      margin: 0;
    }
    ::slotted(strong) { color: var(--text); font-weight: 700; }
    :host([center])  { text-align: center; align-items: center; }
    :host([compact]) { padding: var(--sp-2) var(--sp-3); }
  `;

  static override properties = { color: { type: String } };

  override render() {
    return html`<slot></slot>`;
  }
}

customElements.define('deck-card', DeckCard);
