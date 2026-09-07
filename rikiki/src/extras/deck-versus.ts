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

@customElement('deck-versus')
export class DeckVersus extends LitElement {
  /* Customization tokens:
       --deck-versus-gap / --deck-versus-pivot-color / --deck-versus-pivot-size
       --deck-versus-side-bg / --deck-versus-side-radius / --deck-versus-padding
       --deck-versus-winner-ring / --deck-versus-loser-opacity               */
  static override styles = css`
    :host {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      align-items: stretch;
      gap: var(--deck-versus-gap, var(--rik-space-4));
      font-family: var(--rik-font-sans);
    }
    :host(:not([pivot])) {
      grid-template-columns: 1fr 1fr;
    }
    .side {
      background: var(--deck-versus-side-bg, var(--rik-surface-raised));
      border-radius: var(--deck-versus-side-radius, var(--rik-radius-md));
      padding: var(--deck-versus-padding, var(--rik-space-4));
      min-width: 0;
      transition: opacity 0.2s ease;
    }
    @media (prefers-reduced-motion: reduce) {
      .side { transition: none; }
    }
    /* The losing side recedes rather than the winning one shouting · a room
       reads the difference either way, and shouting ages badly on a slide. */
    :host([winner='right']) .side.left,
    :host([winner='left']) .side.right {
      opacity: var(--deck-versus-loser-opacity, 0.55);
    }
    :host([winner='left']) .side.left,
    :host([winner='right']) .side.right {
      outline: 3px solid var(--deck-versus-winner-ring, var(--rik-accent));
      outline-offset: 2px;
    }
    .pivot {
      align-self: center;
      font-family: var(--rik-font-display, var(--rik-font-sans));
      font-size: var(--deck-versus-pivot-size, var(--rik-font-size-h2));
      font-weight: 900;
      line-height: 1;
      color: var(--deck-versus-pivot-color, var(--rik-accent__text));
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    @media print {
      .side { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  `;

  /** Symbol or word between the two sides · omit for a plain two-up. */
  @property({ type: String, reflect: true }) pivot?: string;

  /** Which side carries the accent. */
  @property({ type: String, reflect: true }) winner?: 'left' | 'right';

  override render() {
    return html`
      <div class="side left" part="left"><slot name="left"></slot></div>
      ${this.pivot ? html`<span class="pivot" part="pivot" aria-hidden="true">${this.pivot}</span>` : ''}
      <div class="side right" part="right"><slot name="right"></slot></div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'deck-versus': DeckVersus;
  }
}
