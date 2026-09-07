// ════════════════════════════════════════════════════════════════
// <deck-kpi-grid cols="3">
//   <deck-kpi value="34" label="components"></deck-kpi>
//   <deck-kpi value="24 KB" label="gzip" tone="ok"></deck-kpi>
//   <deck-kpi value="3" label="engines" note="chromium, firefox, webkit"></deck-kpi>
// </deck-kpi-grid>
//
// Several figures that must read as one family. deck-stat is built to stand
// alone and claims the slide; three of them side by side needed hand layout and
// came out looking like three separate decisions.
//
// OPT-IN · <script type="module" src="dist/deck-kpi-grid.js"></script>
// ════════════════════════════════════════════════════════════════

import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { signature } from './signature.js';

export type DeckKpiTone = 'default' | 'accent' | 'ok' | 'warn' | 'danger' | 'muted';

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
       --deck-kpi-grid-gap    space between figures
       --deck-kpi-grid-cols   column count (overrides the cols attribute)
       --deck-kpi-grid-rule   the divider between figures                   */
  static override styles = css`
    :host {
      display: grid;
      grid-template-columns: repeat(var(--deck-kpi-grid-cols, var(--_cols, 3)), minmax(0, 1fr));
      gap: var(--deck-kpi-grid-gap, var(--rik-space-6));
      align-items: start;
    }
    /* The ruled attribute draws a line between figures. It survives as an
       opt-in because a
       dense row of four sometimes needs it, but the default is space: at
       projection distance a hairline between two columns is not seen, it is
       inferred, and the gap does the same job for free. */
    :host([ruled]) ::slotted(deck-kpi:not(:first-child)) {
      border-left: 1px solid var(--deck-kpi-grid-rule, var(--rik-border-default));
      padding-left: var(--deck-kpi-grid-gap, var(--rik-space-5));
    }
  `;

  @property({ type: String, reflect: true }) cols?: string;

  /** Draw a hairline between the figures. */
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
       --deck-kpi-label-color / --deck-kpi-note-color                       */
  static override styles = [
    signature,
    css`
      :host {
        display: flex;
        flex-direction: column;
        gap: var(--rik-space-2);
        min-width: 0;
      }
      /* The figure IS the design · at ten metres a number is either large
         enough to read or it is decoration, and there is no middle. */
      .value {
        color: var(--deck-kpi-value-color, var(--_tone));
      }
      /* The label is a sentence, not a tag. It used to be a tracked-out mono
         micro-label, which is unreadable across a room and is one of the
         clearest marks of a generated slide. */
      .label {
        color: var(--deck-kpi-label-color, var(--rik-text-default));
      }
      .note {
        color: var(--deck-kpi-note-color, var(--rik-text-default--muted));
      }
    `,
  ];

  @property({ type: String }) value?: string;
  @property({ type: String }) label?: string;
  /** A line of context under the label · what the figure is measured against. */
  @property({ type: String }) note?: string;
  @property({ type: String, reflect: true }) tone: DeckKpiTone = 'default';

  override willUpdate(): void {
    this.style.setProperty('--_tone', TONES[this.tone] ?? TONES.default);
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
