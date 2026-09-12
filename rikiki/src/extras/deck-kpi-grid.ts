// ════════════════════════════════════════════════════════════════
// <deck-kpi-grid cols="3">
//   <deck-kpi value="34" label="components"></deck-kpi>
//   <deck-kpi value="24 KB" label="gzip" tone="ok"></deck-kpi>
//   <deck-kpi value="3" label="engines" note="chromium, firefox, webkit"></deck-kpi>
// </deck-kpi-grid>
//
// Several figures that must read as ONE FAMILY. deck-stat is built to stand
// alone and claims the slide; three of them side by side needed hand layout and
// came out looking like three separate decisions.
//
// The family is built by the grid, not by the figures. The grid owns three rows
// · value, label, note · and every deck-kpi adopts them through
// `grid-template-rows: subgrid`, so all the values share one row box and one
// baseline, all the labels sit on one line, and a column without a note costs
// no height anywhere else. Before that, each figure was its own little
// paragraph with a ragged bottom edge.
//
// OPT-IN · <script type="module" src="dist/deck-kpi-grid.js"></script>
// ════════════════════════════════════════════════════════════════

import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { signature } from './signature.js';

export type DeckKpiTone = 'default' | 'accent' | 'ok' | 'warn' | 'danger' | 'muted';

/** The tone as written on paper · the `__text` ramps, tuned for contrast on the
 *  page surface. It colours the digits of a figure that carries no mass, and the
 *  LABEL of one that does · a marked figure's digits are inverse ink on the
 *  block, so the tone has to be said somewhere that is still on paper. */
const TONES: Record<DeckKpiTone, string> = {
  default: 'var(--rik-text-default)',
  accent: 'var(--rik-accent__text)',
  ok: 'var(--rik-status-success__text)',
  warn: 'var(--rik-status-warn__text)',
  danger: 'var(--rik-status-danger__text)',
  muted: 'var(--rik-text-default--faint)',
};

@customElement('deck-kpi-grid')
export class DeckKpiGrid extends LitElement {
  /* Customization tokens:
       --deck-kpi-grid-gap        space between figures
       --deck-kpi-grid-row-gap    space between a figure and its label
       --deck-kpi-grid-cols       column count (overrides the cols attribute)
       --deck-kpi-grid-rule       the divider drawn by `ruled`
       --deck-kpi-grid-rule-width its weight                                */
  static override styles = css`
    :host {
      display: grid;
      grid-template-columns: repeat(var(--deck-kpi-grid-cols, var(--_cols, 3)), minmax(0, 1fr));
      /* The three rows every figure adopts. Their heights come from the
         tallest value, the tallest label and the tallest note across the whole
         row · that is what makes the figures one family rather than three
         columns that happen to be adjacent. */
      grid-template-rows: auto auto auto;
      column-gap: var(--deck-kpi-grid-gap, var(--rik-space-6));
      row-gap: var(--deck-kpi-grid-row-gap, var(--rik-space-2));
      align-items: stretch;
      /* The mass has padding, so the ink of a marked figure would sit inset
         against an unmarked one. Every figure therefore carries the same
         padding, and the row is pulled back by exactly that amount: the ink of
         the first column lands on the slide's text edge and the night block
         bleeds into the margin instead of being politely contained. */
      margin-inline-start: calc(-1 * var(--deck-kpi-block-pad-x, var(--rik-space-3)));
    }
    /* Hand the subgrid down. A custom property crosses into the shadow root of
       each figure, which a selector cannot; a deck-kpi used on its own never
       receives it and keeps its own rows. */
    ::slotted(deck-kpi) {
      --_kpi-rows: subgrid;
      grid-row: 1 / -1;
    }
    /* The ruled attribute draws a divider between figures · opt-in, because at
       projection distance the gap already separates two columns and a line that
       is only inferred is decoration. Where it IS asked for it has to be seen,
       so the default weight is 2px and the default colour is ink rather than
       the paper-on-paper hairline that was invisible on a wall. */
    :host([ruled]) ::slotted(deck-kpi:not(:first-child)) {
      border-left: var(--deck-kpi-grid-rule-width, 2px) solid
        var(--deck-kpi-grid-rule, var(--rik-text-default--faint));
      padding-left: var(--deck-kpi-grid-gap, var(--rik-space-5));
    }
    @media (max-width: 640px) {
      :host {
        grid-template-columns: minmax(0, 1fr);
        grid-template-rows: none;
      }
      :host([ruled]) ::slotted(deck-kpi:not(:first-child)) {
        border-left: 0;
        padding-left: 0;
      }
      ::slotted(deck-kpi) {
        --_kpi-rows: none;
        grid-row: auto;
      }
    }
  `;

  @property({ type: String, reflect: true }) cols?: string;

  /** Draw a divider between the figures. */
  @property({ type: Boolean, reflect: true }) ruled = false;

  override willUpdate(): void {
    const n = Number.parseInt(this.cols ?? '3', 10);
    this.style.setProperty('--_cols', String(n >= 1 && n <= 6 ? n : 3));
  }

  override render() {
    return html`<slot></slot>`;
  }
}

@customElement('deck-kpi')
export class DeckKpi extends LitElement {
  /* Customization tokens:
       --deck-kpi-value-size / --deck-kpi-value-color
       --deck-kpi-label-color / --deck-kpi-note-color
       --deck-kpi-mass / --deck-kpi-mass-text
       --deck-kpi-block-pad-x / --deck-kpi-block-pad-y                      */
  static override styles = [
    signature,
    css`
      :host {
        display: grid;
        /* Handed down by deck-kpi-grid; none when the figure stands alone. */
        grid-template-rows: var(--_kpi-rows, none);
        row-gap: var(--deck-kpi-grid-row-gap, var(--rik-space-2));
        align-content: start;
        min-width: 0;
      }
      /* The figure IS the design · at ten metres a number is either large
         enough to read or it is decoration, and there is no middle. The size
         is the one statement size of the extras signature, which is what a
         slide that already fitted was laid out against · a row of three
         three-line metrics inside a deck-feature is 32px from the bottom of
         the canvas, and a scale that grows with the viewport pushed it off.
         A deck with room to spare asks for the fluid one by the knob:
           --deck-kpi-value-size: clamp(2.25rem, 6cqw, 7rem); */
      .value {
        align-self: end;
        /* The block hugs the digits instead of stretching to the column. A
           mass the width of its cell is the card kit wearing a dark coat, and
           it makes an unmarked neighbour look small at the same type size. */
        justify-self: start;
        max-width: 100%;
        font-size: var(--deck-kpi-value-size, var(--rik-extras-statement, var(--rik-font-size-mega)));
        color: var(--deck-kpi-value-color, var(--_tone));
        /* Identical box metrics on every figure, marked or not · that is what
           keeps the values on one baseline and their ink on one left edge.
           An unmarked figure paints nothing at all. */
        box-sizing: border-box;
        padding: var(--deck-kpi-block-pad-y, var(--rik-space-2))
          var(--deck-kpi-block-pad-x, var(--rik-space-3));
        border-radius: var(--rik-radius-sm);
      }
      /* The one mass · the marked figure, and only it. default and muted
         are deliberately absent from this list: they colour the ink and paint
         nothing, which is rule 1 of ADR-002 · a component with nothing marked
         has no mass at all. The night surface is the
         only fill this palette has that survives the room (18.9:1 against the
         page under both themes), and the block alone is the emphasis · the
         tone is said by the label under it, on paper, where the tone ramps are
         legible. It is deliberately NOT a coloured edge on one side of the
         block: a single-sided stroke on a box that has a radius reads as a
         rendering accident, not as a mark. */
      :host([tone='accent']) .value,
      :host([tone='ok']) .value,
      :host([tone='warn']) .value,
      :host([tone='danger']) .value {
        background: var(--deck-kpi-mass, var(--rik-surface-inverse));
        color: var(--deck-kpi-value-color, var(--deck-kpi-mass-text, var(--rik-text-inverse)));
      }
      /* The tone, carried by the label of the marked figure · the one place it
         can be said in the tone's own colour without competing with the block.
         Under siliceum the accent ramp is a muted olive and this reads as a
         near-plain label, which is the correct outcome: the block is the
         emphasis, the colour was only ever the name of the tone. */
      :host([tone='accent']) .label,
      :host([tone='ok']) .label,
      :host([tone='warn']) .label,
      :host([tone='danger']) .label {
        color: var(--deck-kpi-label-color, var(--_tone));
      }
      /* The label is a sentence, not a tag. It used to be a tracked-out mono
         micro-label, which is unreadable across a room and is one of the
         clearest marks of a generated slide. It sits tight under the figure and
         lines up with its ink. */
      .label,
      .note {
        padding-inline-start: var(--deck-kpi-block-pad-x, var(--rik-space-3));
      }
      .label {
        align-self: start;
        color: var(--deck-kpi-label-color, var(--rik-text-default));
        font-weight: 600;
      }
      /* The note is separated by a gap and by colour, never by a third size. */
      .note {
        align-self: start;
        padding-top: var(--rik-space-1);
        color: var(--deck-kpi-note-color, var(--rik-text-default--muted));
      }
      ::slotted(*) {
        grid-column: 1;
      }
      @media print {
        .value {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      }
    `,
  ];

  @property({ type: String }) value?: string;
  @property({ type: String }) label?: string;
  /** A line of context under the label · what the figure is measured against. */
  @property({ type: String }) note?: string;
  @property({ type: String, reflect: true }) tone: DeckKpiTone = 'default';

  override willUpdate(): void {
    const tone = TONES[this.tone] ? this.tone : 'default';
    this.style.setProperty('--_tone', TONES[tone]);
  }

  override render() {
    return html`
      <span class="value statement" part="value">${this.value ?? ''}</span>
      ${this.label ? html`<span class="label reading" part="label">${this.label}</span>` : ''}
      ${this.note ? html`<span class="note reading quiet" part="note">${this.note}</span>` : ''}
      <slot></slot>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'deck-kpi-grid': DeckKpiGrid;
    'deck-kpi': DeckKpi;
  }
}
