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
import { customElement, property } from 'lit/decorators.js';
import { signature } from '../shared/signature.js';

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

  override willUpdate(): void {
    // Number the stages · a chain genuinely is a sequence, which is what makes
    // the figure information rather than ornament.
    const steps = [...this.querySelectorAll('deck-flow-step')];
    steps.forEach((el, i) => {
      el.setAttribute('index', String(i + 1));
      // The last stage has nothing to point at · a connector there would be an
      // arrow into the margin.
      el.toggleAttribute('last', i === steps.length - 1);
      el.toggleAttribute('linked', !this.noConnectors);
    });
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
        gap: var(--rik-space-1);
        min-width: 0;
        position: relative;
        padding: var(--rik-space-3) var(--rik-space-4);
        border-radius: var(--rik-radius-sm);
        /* A stage is a shape, not a paragraph in a row of paragraphs. The
           stroke is thick on purpose · a hairline is the one thing this
           medium is documented not to carry, so an outline is only worth
           drawing at a width the back of the room can see. */
        border: var(--deck-flow-step-outline-width, 4px) solid
          var(--deck-flow-step-outline, var(--rik-accent));
        transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
      }
      /* ONE mass in the chain, and it is the stage being discussed. Every
         stage used to be a dark block, which is the card kit wearing another
         colour: four identical slabs carry no hierarchy, so the eye has
         nothing to land on and the speaker has nothing to point at. */
      :host([active]:not([plain])) {
        background: var(--deck-flow-step-bg, var(--rik-surface-inverse));
        color: var(--deck-flow-step-color, var(--rik-text-inverse));
      }
      :host([active][plain]) .label {
        color: var(--deck-flow-step-accent, var(--rik-accent__text));
      }
      /* Not yet · the stroke stays, because it is the shape of the stage and
         the shape does not change; only its presence does. */
      :host([pending]) {
        color: var(--rik-text-default--faint);
        border-color: var(--deck-flow-step-pending-outline, var(--rik-text-default--faint));
      }
      /* The connector · the chain has to read as a chain, and the arrow is
         what says which way it runs. Drawn from the stage rather than from the
         parent because ::slotted() cannot reach a pseudo-element, and sized in
         the same stroke as the outline so the two read as one drawing. */
      .link {
        position: absolute;
        left: 100%;
        top: 50%;
        width: var(--deck-flow-gap, var(--rik-space-5));
        height: var(--deck-flow-step-outline-width, 4px);
        transform: translateY(-50%);
        background: var(--deck-flow-link, var(--rik-accent));
        pointer-events: none;
      }
      /* The head · two strokes of the same width, met at the point. */
      .link::after {
        content: '';
        position: absolute;
        right: 0;
        top: 50%;
        width: 0.8rem;
        height: 0.8rem;
        border-top: var(--deck-flow-step-outline-width, 4px) solid
          var(--deck-flow-link, var(--rik-accent));
        border-right: var(--deck-flow-step-outline-width, 4px) solid
          var(--deck-flow-link, var(--rik-accent));
        transform: translate(0, -50%) rotate(45deg);
        transform-origin: center;
      }
      /* A stage not yet reached is quieter, not absent · the border grade is
         a hair from the page colour and would delete the shape rather than
         calm it. scripts/theme-contrast.test.mjs measures this. */
      :host([pending]) .link,
      :host([pending]) .link::after {
        background: var(--rik-text-default--faint);
        border-color: var(--rik-text-default--faint);
      }
      .head {
        display: flex;
        align-items: baseline;
        gap: var(--rik-space-2);
      }
      /* A chain IS a sequence, so it is numbered · one of only two components
         here that earn a number. Written as a figure, not as a zero-padded
         mono tag, which numbers nothing better and reads as machine output. */
      .index {
        flex: none;
        font-variant-numeric: tabular-nums;
        opacity: 0.55;
      }
      :host([active]) .index {
        opacity: 1;
      }
      .label {
        font-weight: 600;
        color: var(--deck-flow-step-label-color, inherit);
        text-wrap: balance;
      }
      .note {
        color: var(--deck-flow-step-note-color, inherit);
        opacity: 0.7;
        max-width: 28ch;
      }
      @media print {
        :host { opacity: 1; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }
    `,
  ];

  @property({ type: String }) label?: string;
  @property({ type: String }) note?: string;

  /** Position in the chain, written by deck-flow · the reader counts stages,
   *  and a number does that better than four identical icons. */
  @property({ type: String, reflect: true }) index?: string;

  /** Kept for decks that set it · the chain is now plain by default, so this
   *  only stops the active stage from taking the block. */
  @property({ type: Boolean, reflect: true }) plain = false;

  /** Last in the chain · written by deck-flow. Nothing to point at. */
  @property({ type: Boolean, reflect: true }) last = false;

  /** Draw the connector to the next stage · written by deck-flow from its own
   *  no-connectors attribute, which declared the option and drew nothing. */
  @property({ type: Boolean, reflect: true }) linked = false;

  override render() {
    return html`
      <span class="head">
        ${this.index ? html`<span class="index reading" part="index">${this.index}</span>` : ''}
        ${this.label ? html`<span class="label reading" part="label">${this.label}</span>` : ''}
      </span>
      ${this.note ? html`<span class="note reading" part="note">${this.note}</span>` : ''}
      <slot></slot>
      ${this.linked && !this.last ? html`<span class="link" part="link"></span>` : ''}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'deck-flow': DeckFlow;
    'deck-flow-step': DeckFlowStep;
  }
}
