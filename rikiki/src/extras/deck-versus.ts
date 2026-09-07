// ════════════════════════════════════════════════════════════════
// <deck-versus pivot="vs" winner="right">
//   <div slot="left"><h3>Manual review</h3><p>Four hours.</p></div>
//   <div slot="right"><h3>Reviewed in CI</h3><p>Twelve minutes.</p></div>
// </deck-versus>
//
// A comparison that is not a slide layout. deck-split (with `pivot` / `winner`)
// covers the case where the comparison IS the slide; this one is a block you
// drop inside a slide that already has a title and other content.
//
// OPT-IN · <script type="module" src="dist/deck-versus.js"></script>
// ════════════════════════════════════════════════════════════════

import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { signature } from './signature.js';

@customElement('deck-versus')
export class DeckVersus extends LitElement {
  /* Customization tokens:
       --deck-versus-gap / --deck-versus-pivot-color / --deck-versus-pivot-size
       --deck-versus-rule / --deck-versus-winner-rule / --deck-versus-loser-color */
  static override styles = [
    signature,
    css`
    :host {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      align-items: start;
      gap: var(--deck-versus-gap, var(--rik-space-5));
      font-family: var(--rik-font-sans);
    }
    :host(:not([pivot])) {
      grid-template-columns: 1fr 1fr;
    }
    /* No tile. A side is a rule and the type under it · the same device the
       rest of the extras use. Two filled rectangles carry no hierarchy at ten
       metres and turn a comparison into a pair of grey blocks. */
    .side {
      min-width: 0;
      padding-top: var(--rik-space-3);
      border-top: var(--deck-versus-rule-width, 3px) solid
        var(--deck-versus-rule, var(--rik-text-default--faint));
      transition: border-color 0.2s ease, color 0.2s ease;
    }
    /* The winner is marked by its rule and by full-strength type. The loser
       recedes in COLOUR, not behind an opacity that greys its own heading. */
    :host([winner='left']) .side.left,
    :host([winner='right']) .side.right {
      border-top-color: var(--deck-versus-winner-rule, var(--rik-accent));
    }
    :host([winner='right']) .side.left,
    :host([winner='left']) .side.right {
      color: var(--deck-versus-loser-color, var(--rik-text-default--faint));
    }
    :host([winner='right']) .side.left ::slotted(*),
    :host([winner='left']) .side.right ::slotted(*) {
      color: inherit;
    }
    /* The pivot is the word between the two columns · written plainly, at
       reading size. It used to be tracked out in the metadata voice, which
       made a three-letter word into a piece of chrome. */
    .pivot {
      align-self: start;
      padding-top: var(--rik-space-3);
      color: var(--deck-versus-pivot-color, var(--rik-text-default--muted));
      font-size: var(--deck-versus-pivot-size, var(--rik-font-size-body));
    }
    @media print {
      .side { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  `,
  ];

  /** Symbol or word between the two sides · omit for a plain two-up. */
  @property({ type: String, reflect: true }) pivot?: string;

  /** Which side carries the accent. */
  @property({ type: String, reflect: true }) winner?: 'left' | 'right';

  override render() {
    return html`
      <div class="side left" part="left"><slot name="left"></slot></div>
      ${this.pivot ? html`<span class="pivot reading" part="pivot" aria-hidden="true">${this.pivot}</span>` : ''}
      <div class="side right" part="right"><slot name="right"></slot></div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'deck-versus': DeckVersus;
  }
}
