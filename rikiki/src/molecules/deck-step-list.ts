// ════════════════════════════════════════════════════════════════
// <deck-step-list>
//   <deck-step n="1" note="leaf">button.ts</deck-step>
//   <deck-step n="2" note="leaf">icon.ts</deck-step>
//   ...
// </deck-step-list>
// ════════════════════════════════════════════════════════════════

import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('deck-step-list')
export class DeckStepList extends LitElement {
  /* Customization tokens:
       --deck-step-list-gap        space between steps
       --deck-step-list-connector  colour of the connector in row direction
       --deck-step-list-arrow      size of the connector                    */
  static override styles = css`
    :host {
      display: flex;
      flex-direction: column;
      gap: var(--deck-step-list-gap, var(--rik-space-2xs));
    }
    /* Horizontal · the steps share the width and a connector sits between
       them. The connector is drawn on the gap, so it never shifts the steps. */
    :host([direction='row']) {
      flex-direction: row;
      align-items: stretch;
      gap: var(--deck-step-list-gap, var(--rik-space-4));
    }
    :host([direction='row']) ::slotted(*) {
      flex: 1 1 0;
      min-width: 0;
      position: relative;
    }
    :host([direction='row']:not([no-connectors])) ::slotted(* + *)::before {
      content: '';
      position: absolute;
      top: 50%;
      right: 100%;
      width: var(--deck-step-list-gap, var(--rik-space-4));
      height: var(--deck-step-list-arrow, 2px);
      transform: translateY(-50%);
      background: var(--deck-step-list-connector, var(--rik-border-default)) /* thin */;
    }
  `;

  /** `column` (default) or `row` · a chain that wants the slide width. */
  @property({ type: String, reflect: true }) direction: 'column' | 'row' = 'column';

  /** Drop the connectors between steps in row direction. */
  @property({ type: Boolean, reflect: true, attribute: 'no-connectors' }) noConnectors = false;

  override render() {
    return html`<slot></slot>`;
  }
}

@customElement('deck-step')
export class DeckStep extends LitElement {
  /* Customization tokens:
       --deck-step-rule          the hairline between steps
       --deck-step-padding-y     vertical breathing room
       --deck-step-num-color / --deck-step-num-size / --deck-step-num-scale
       --deck-step-label-color / --deck-step-note-color */
  /* The step is a line of a sequence, not a card in a grid.
   *
   *  It used to be a white rounded box with a shadow, a 16px accent disc
   *  holding the number at the smallest type step, and the label in the mono
   *  face. Projected, the disc read as a speck and the mono read as code the
   *  step was not. The number carries the sequence, so it is the thing that is
   *  allowed to be large; the accent is a mark on it, never a fill behind it,
   *  which is what the measured 1.48 contrast under siliceum requires. */
  static override styles = css`
    :host {
      display: flex; align-items: baseline; gap: var(--rik-space-3);
      padding: var(--deck-step-padding-y, var(--rik-space-2)) 0;
      border-bottom: 1px solid var(--deck-step-rule, var(--rik-border-subtle, var(--rik-border-default)));
      font-family: var(--rik-font-sans);
      font-size: var(--rik-font-size-body);
    }
    :host(:last-of-type) { border-bottom: 0; }
    .step-num {
      flex: 0 0 auto;
      min-width: var(--deck-step-num-size, 1.6em);
      color: var(--deck-step-num-color, var(--rik-accent));
      font: 800 var(--deck-step-num-scale, 1.15em)/1 var(--rik-font-sans);
      font-variant-numeric: tabular-nums;
    }
    .label {
      flex: 0 1 auto;
      font-weight: 600;
      color: var(--deck-step-label-color, var(--rik-text-default));
    }
    /* The note explains the step · it reads after it, quietly, on the same
       line. A pill floated to the far right made the eye travel the whole
       slide width to pair two halves of one sentence. */
    .note {
      /* Right after the label, not against the far edge. Pushing it to the
         other side of the slide made the eye travel the full width to pair two
         halves of one sentence. */
      flex: 0 1 auto;
      margin-right: auto;
      color: var(--deck-step-note-color, var(--rik-text-default--muted, var(--rik-text-default--faint)));
      font-size: var(--rik-font-size-sm);
    }
  `;

  @property({ type: String }) n?: string;
  @property({ type: String }) note?: string;

  override render() {
    return html`
      ${this.n ? html`<span class="step-num">${this.n}</span>` : ''}
      <span class="label"><slot></slot></span>
      ${this.note ? html`<span class="note">${this.note}</span>` : ''}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'deck-step-list': DeckStepList;
    'deck-step': DeckStep;
  }
}
