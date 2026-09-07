// ════════════════════════════════════════════════════════════════
// <deck-checklist cols="2">
//   <deck-check>Reviewed in CI</deck-check>
//   <deck-check no>Reviewed on the branch</deck-check>
// </deck-checklist>
//
// What works and what does not, told apart by more than colour. Composing this
// from deck-card and deck-badge works, but every slide ends up slightly
// different · a component is what makes twelve of them look like one deck.
//
// OPT-IN · <script type="module" src="dist/deck-checklist.js"></script>
// ════════════════════════════════════════════════════════════════

import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ICONS } from '../shared/icon-set.js';

@customElement('deck-checklist')
export class DeckChecklist extends LitElement {
  /* Customization tokens:
       --deck-checklist-gap    space between items
       --deck-checklist-cols   column count (overrides the cols attribute)  */
  static override styles = css`
    :host {
      display: grid;
      grid-template-columns: repeat(var(--deck-checklist-cols, var(--_cols, 1)), minmax(0, 1fr));
      gap: var(--deck-checklist-gap, var(--rik-space-3));
      align-content: start;
    }
  `;

  /** Columns · 1 (default) reads as a list, 2 as a contrast. */
  @property({ type: String, reflect: true }) cols?: string;

  override willUpdate(): void {
    const n = Number.parseInt(this.cols ?? '1', 10);
    // An out-of-range value falls back to one column rather than removing the
    // grid · the same rule every other layout knob follows here.
    this.style.setProperty('--_cols', String(n >= 1 && n <= 6 ? n : 1));
  }

  override render() {
    return html`<slot></slot>`;
  }
}

@customElement('deck-check')
export class DeckCheck extends LitElement {
  /* Customization tokens:
       --deck-check-yes / --deck-check-no   the two marker colours
       --deck-check-size                    marker diameter
       --deck-check-gap                     space between marker and text
       --deck-check-color                   the text                        */
  static override styles = css`
    :host {
      display: flex;
      align-items: start;
      gap: var(--deck-check-gap, var(--rik-space-2));
      font-family: var(--rik-font-sans);
      font-size: var(--rik-font-size-lead);
      line-height: 1.35;
      color: var(--deck-check-color, var(--rik-text-default));
    }
    .mark {
      flex: none;
      width: var(--deck-check-size, 1.5em);
      height: var(--deck-check-size, 1.5em);
      /* The shape differs too, not only the colour · a red and a green disc are
         the same disc to a colour-blind reader at the back of a room. */
      color: var(--deck-check-yes, var(--rik-status-success__text));
    }
    :host([no]) .mark {
      color: var(--deck-check-no, var(--rik-status-danger__text));
    }
    svg {
      width: 100%;
      height: 100%;
      display: block;
      fill: none;
      stroke: currentColor;
      stroke-width: 2.5;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    @media print {
      .mark { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  `;

  /** This one does NOT work · flips the marker and its colour. */
  @property({ type: Boolean, reflect: true }) no = false;

  override render() {
    // The label carries the meaning for a screen reader, since the marker is a
    // shape and a colour, neither of which is read.
    return html`
      <span class="mark" part="mark" role="img" aria-label=${this.no ? 'No' : 'Yes'}>
        <svg viewBox="0 0 24 24" focusable="false">
          <path d=${this.no ? ICONS.cross : ICONS.check} />
        </svg>
      </span>
      <span part="label"><slot></slot></span>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'deck-checklist': DeckChecklist;
    'deck-check': DeckCheck;
  }
}
