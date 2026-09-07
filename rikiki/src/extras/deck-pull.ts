// ════════════════════════════════════════════════════════════════
// <deck-pull>The one line that matters.</deck-pull>
//
// An excerpt lifted out of a dense slide, without turning it into a slide of
// its own. Distinct from deck-punch (a full-slide statement) and from
// deck-quote (someone else's words, attributed).
//
// OPT-IN · <script type="module" src="dist/deck-pull.js"></script>
// ════════════════════════════════════════════════════════════════

import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

export type DeckPullSide = 'left' | 'right' | 'full';

@customElement('deck-pull')
export class DeckPull extends LitElement {
  /* Customization tokens:
       --deck-pull-color / --deck-pull-size / --deck-pull-rule
       --deck-pull-rule-width / --deck-pull-bg / --deck-pull-padding
       --deck-pull-width   how much of the line the excerpt takes when floated */
  static override styles = css`
    :host {
      display: block;
      font-family: var(--rik-font-sans);
      font-size: var(--deck-pull-size, var(--rik-font-size-lead));
      line-height: 1.3;
      font-weight: 700;
      color: var(--deck-pull-color, var(--rik-text-default));
      background: var(--deck-pull-bg, transparent);
      padding: var(--deck-pull-padding, var(--rik-space-2) 0);
      border-left: var(--deck-pull-rule-width, 4px) solid
        var(--deck-pull-rule, var(--rik-accent));
      padding-left: var(--rik-space-4);
      text-wrap: balance;
    }
    /* Floated · the surrounding text wraps around it, which is what makes it an
       excerpt rather than an interruption. */
    :host([side='left']),
    :host([side='right']) {
      width: var(--deck-pull-width, 38%);
      margin-block: var(--rik-space-2);
    }
    :host([side='left']) {
      float: left;
      margin-right: var(--rik-space-4);
    }
    :host([side='right']) {
      float: right;
      margin-left: var(--rik-space-4);
      border-left: 0;
      border-right: var(--deck-pull-rule-width, 4px) solid
        var(--deck-pull-rule, var(--rik-accent));
      padding-left: 0;
      padding-right: var(--rik-space-4);
      text-align: right;
    }
    @media print {
      :host { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  `;

  /** `full` (default), or floated to one side so the text wraps around it. */
  @property({ type: String, reflect: true }) side: DeckPullSide = 'full';

  override render() {
    return html`<slot></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'deck-pull': DeckPull;
  }
}
