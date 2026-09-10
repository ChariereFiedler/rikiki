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
      grid-template-columns: minmax(0, 1fr) 64px minmax(0, 1fr);
      align-items: stretch;
      gap: var(--deck-versus-gap, var(--rik-space-3));
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
      padding: var(--rik-space-4) 0;
      border-block: var(--deck-versus-rule-width, 2px) solid
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
      position: relative;
      display: grid;
      place-items: center;
      align-self: stretch;
      color: var(--deck-versus-pivot-color, var(--rik-accent--strong));
      font: 800 var(--deck-versus-pivot-size, var(--rik-font-size-sm))/1 var(--rik-font-display);
      text-align: center;
      isolation: isolate;
    }
    .pivot::before {
      content: '';
      position: absolute;
      inset-block: 0;
      left: 50%;
      width: 1px;
      background: var(--deck-versus-rule, var(--rik-border-default));
      z-index: -2;
    }
    .pivot::after {
      content: '';
      position: absolute;
      width: 52px;
      height: 52px;
      border: 1px solid var(--deck-versus-rule, var(--rik-border-default));
      border-radius: 50%;
      background: var(--rik-surface-page);
      z-index: -1;
    }
    ::slotted(h3) { margin: 0 0 var(--rik-space-2); color: var(--rik-text-default); font: 800 var(--rik-font-size-h3)/1.1 var(--rik-font-display); }
    ::slotted(p) { margin: 0; color: var(--rik-text-default--muted); line-height: 1.5; }
    @media (max-width: 640px) {
      :host, :host(:not([pivot])) { grid-template-columns: 1fr; }
      .pivot { min-height: 44px; }
      .pivot::before { inset-block: 50%; inset-inline: 0; width: auto; height: 1px; }
      .pivot::after { width: 44px; height: 44px; }
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
