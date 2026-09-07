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
      gap: var(--deck-kpi-grid-gap, var(--rik-space-5));
      align-items: start;
    }
    /* A hairline between figures · it is what makes a row read as one block
       rather than three unrelated slides squeezed together. */
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
  static override styles = css`
    :host {
      display: flex;
      flex-direction: column;
      gap: var(--rik-space-1);
      font-family: var(--rik-font-sans);
      min-width: 0;
    }
    .value {
      font-family: var(--rik-font-display, var(--rik-font-sans));
      font-size: var(--deck-kpi-value-size, var(--rik-font-size-big));
      font-weight: 900;
      line-height: 1;
      letter-spacing: -0.02em;
      color: var(--deck-kpi-value-color, var(--_tone));
      font-variant-numeric: tabular-nums;
      /* A long value shrinks rather than pushing its neighbours around. */
      overflow-wrap: anywhere;
    }
    .label {
      font-size: var(--rik-font-size-lead);
      color: var(--deck-kpi-label-color, var(--rik-text-default));
    }
    .note {
      font-size: var(--rik-font-size-xs);
      color: var(--deck-kpi-note-color, var(--rik-text-default--faint));
      line-height: 1.35;
    }
  `;

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
      <span class="value" part="value">${this.value ?? ''}</span>
      ${this.label ? html`<span class="label" part="label">${this.label}</span>` : ''}
      ${this.note ? html`<span class="note" part="note">${this.note}</span>` : ''}
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
