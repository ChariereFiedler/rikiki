// ════════════════════════════════════════════════════════════════
// <deck-flow cols="4">
//   <deck-flow-step label="Collect" note="raw" icon="database"></deck-flow-step>
//   <deck-flow-step label="Analyse" note="rules" icon="search"></deck-flow-step>
//   <deck-flow-step label="Decide" note="verdict" icon="target"></deck-flow-step>
//   <deck-flow-step label="Act" note="ship" icon="check"></deck-flow-step>
// </deck-flow>
//
// A chain across the width, with connectors and one step revealed at a time.
// deck-step-list direction="row" gives the geometry; this gives the chain its
// own vocabulary · a label, a note, an icon, and an active state.
//
// OPT-IN · <script type="module" src="dist/deck-flow.js"></script>
//   Icons need their module too: dist/deck-icon.js
// ════════════════════════════════════════════════════════════════

import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { signature } from './signature.js';

@customElement('deck-flow')
export class DeckFlow extends LitElement {
  /* Customization tokens:
       --deck-flow-gap   space between stages                                */
  static override styles = css`
    :host {
      display: grid;
      grid-template-columns: repeat(var(--_cols, 4), minmax(0, 1fr));
      gap: var(--deck-flow-gap, var(--rik-space-5));
      align-items: stretch;
      position: relative;
    }
    ::slotted(deck-flow-step) {
      position: relative;
    }
  `;

  @property({ type: String, reflect: true }) cols?: string;

  @property({ type: Boolean, reflect: true, attribute: 'no-connectors' }) noConnectors = false;

  /** Walk the chain one stage per step.
   *
   *  This EMPHASISES, it does not hide: at step 0 the whole chain is visible
   *  and neutral, because the room needs to see the shape of the process
   *  before being walked through it. Hiding four stages behind four clicks
   *  tells the audience nothing while they wait. */
  @property({ type: Boolean, reflect: true }) reveal = false;

  @state() private _step = 0;

  override willUpdate(): void {
    // Number the stages · the sequence is carried by the index and the rule,
    // not by an arrow drawn between two tiles.
    const steps = [...this.querySelectorAll('deck-flow-step')];
    steps.forEach((el, i) => el.setAttribute('index', String(i + 1).padStart(2, '0')));
    const declared = Number.parseInt(this.cols ?? '', 10);
    const count =
      Number.isFinite(declared) && declared >= 1 && declared <= 8
        ? declared
        : Math.max(1, this.querySelectorAll('deck-flow-step').length);
    this.style.setProperty('--_cols', String(count));
  }

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this.reveal) return;
    // One step per stage · published on the host slide, where the engine reads
    // the count from. It only ever raises what the author declared.
    let slide: Element | null = this;
    while (slide?.parentElement && slide.parentElement.tagName.toLowerCase() !== 'deck-root') {
      slide = slide.parentElement;
    }
    if (!slide?.parentElement) return;
    const needed = this.querySelectorAll('deck-flow-step').length;
    const declared = Number(slide.getAttribute('steps') ?? slide.getAttribute('data-steps') ?? '0');
    if (needed > declared) slide.setAttribute('data-steps', String(needed));
  }

  /** Called by deck-root on every step change. */
  applyStep(step: number): void {
    this._step = step;
    if (!this.reveal) return;
    this.querySelectorAll('deck-flow-step').forEach((el, i) => {
      el.toggleAttribute('done', step > 0 && i + 1 < step);
      el.toggleAttribute('active', i + 1 === step);
      // Step 0 is the whole chain, neutral · nothing is pending before the
      // speaker has started walking it.
      el.toggleAttribute('pending', step > 0 && i + 1 > step);
    });
  }

  override render() {
    return html`<slot></slot>`;
  }
}

@customElement('deck-flow-step')
export class DeckFlowStep extends LitElement {
  /* Customization tokens:
       --deck-flow-step-accent        the rule and the index of the active step
       --deck-flow-step-label-color / --deck-flow-step-note-color
       --deck-flow-step-pending-opacity                                      */
  static override styles = [
    signature,
    css`
    :host {
      display: flex;
      flex-direction: column;
      gap: var(--rik-space-2);
      font-family: var(--rik-font-sans);
      min-width: 0;
      /* No tile. The step is a column of type under a rule · what separates it
         from its neighbour is space and the rule above it, not a grey box. */
      padding-top: var(--rik-space-2);
      transition: opacity 0.2s ease;
    }
    /* The rule spans the step and thickens when it is the one being discussed:
       one device, two states, no second colour and no fill. */
    .rule {
      width: 100%;
      /* Same reason as the graph edges · a border-grade tone disappears on a
         projector. The neutral state is faint TEXT, not a hairline. */
      background: var(--rik-text-default--faint);
      transition: background 0.2s ease, height 0.2s ease;
    }
    :host([done]) .rule {
      background: var(--deck-flow-step-accent, var(--rik-accent));
    }
    :host([active]) .rule {
      background: var(--deck-flow-step-accent, var(--rik-accent));
      height: calc(var(--rik-extras-rule-width, 3px) * 2);
    }
    :host([pending]) {
      opacity: var(--deck-flow-step-pending-opacity, 0.35);
    }
    .head {
      display: flex;
      align-items: baseline;
      gap: var(--rik-space-2);
    }
    :host([active]) .index {
      color: var(--deck-flow-step-accent, var(--rik-accent__text));
    }
    .label {
      font-size: var(--rik-font-size-lead);
      font-weight: 700;
      line-height: 1.15;
      color: var(--deck-flow-step-label-color, var(--rik-text-default));
      text-wrap: balance;
    }
    .note {
      font-size: var(--rik-font-size-sm);
      color: var(--deck-flow-step-note-color, var(--rik-text-default--faint));
      line-height: 1.35;
      max-width: 28ch;
    }
    @media print {
      :host { opacity: 1; }
      .rule { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  `,
  ];

  @property({ type: String }) label?: string;
  @property({ type: String }) note?: string;

  /** Position in the chain, written by deck-flow · the reader counts stages,
   *  and a number does that better than four identical icons. */
  @property({ type: String, reflect: true }) index?: string;

  override render() {
    return html`
      <span class="rule" part="rule"></span>
      <span class="head">
        ${this.index ? html`<span class="meta index">${this.index}</span>` : ''}
        ${this.label ? html`<span class="label" part="label">${this.label}</span>` : ''}
      </span>
      ${this.note ? html`<span class="note" part="note">${this.note}</span>` : ''}
      <slot></slot>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'deck-flow': DeckFlow;
    'deck-flow-step': DeckFlowStep;
  }
}
