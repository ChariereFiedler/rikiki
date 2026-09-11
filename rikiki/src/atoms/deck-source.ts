// ════════════════════════════════════════════════════════════════
// <deck-source href="https://example.com/report">Word, p. 12</deck-source>
//
// A source or credit line for an evidence block · sits flush under a
// deck-csv, deck-table, deck-bar, deck-kpi-grid, deck-annotate, or plain
// prose. `deck-figure` renders one internally for its own `source` /
// `source-href` attributes, so both paths share one implementation.
//
// CORE ATOM · registered by default, no opt-in <script> needed.
// ════════════════════════════════════════════════════════════════

import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('deck-source')
export class DeckSource extends LitElement {
  /* Tokens:
       --deck-source-color  text color · defaults to what
         --deck-figure-source-color used to default to on its own
       --deck-source-gap    top margin, keeps the line flush under the
         block it credits */
  static override styles = css`
    :host {
      display: block;
      margin-top: var(--deck-source-gap, var(--rik-space-2));
      color: var(--deck-source-color, var(--rik-text-default--faint));
      font-family: var(--rik-font-mono);
      font-size: var(--rik-font-size-xs);
      font-style: normal;
    }
    a {
      color: inherit;
      text-underline-offset: 0.18em;
    }
  `;

  /** Optional URL for the source or credit. */
  @property({ type: String }) href?: string;

  override render() {
    return html`<cite part="source"
      >${this.href ? html`<a href=${this.href}><slot></slot></a>` : html`<slot></slot>`}</cite
    >`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'deck-source': DeckSource;
  }
}
