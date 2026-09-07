// ════════════════════════════════════════════════════════════════
// <deck-split eyebrow="ESM" cols="1-1|1-2|2-1|3" gap="5" col-gap="3">
//   <h1 slot="title">Title</h1>
//   <div slot="left">...</div>
//   <div slot="right">...</div>          <!-- 2 columns -->
//   or
//   <div slot="a">...</div>              <!-- 3 columns -->
//   <div slot="b">...</div>
//   <div slot="c">...</div>
// </deck-split>
//
// `gap`     · spacing between columns · 1..6 maps to var(--sp-N).
//             Default: 5 (4 for 3-col).
// `col-gap` · spacing between children inside a column · 1..6 → var(--sp-N).
//             Default: 3.
// ════════════════════════════════════════════════════════════════

import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { slideBase } from '../shared-styles.js';
import { spreadValue } from '../shared/slide-fill.js';

export type DeckSplitCols = '1-1' | '1-2' | '2-1' | '3';

@customElement('deck-split')
export class DeckSplit extends LitElement {
  /* Customization tokens:
       --deck-split-gap (between columns, default 5 / 4 for 3-col)
       --deck-split-col-gap (between children inside a column, default 3) */
  static override styles = [
    ...slideBase,
    css`
    :host { justify-content: flex-start; }
    .body {
      flex: 1; min-height: 0;
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-template-rows: minmax(0, 1fr);
      gap: var(--_gap, var(--deck-split-gap, var(--rik-space-5)));
    }
    :host([cols="1-2"]) .body { grid-template-columns: 1fr 2fr; }
    :host([cols="2-1"]) .body { grid-template-columns: 2fr 1fr; }
    :host([cols="3"])   .body { grid-template-columns: 1fr 1fr 1fr; gap: var(--_gap, var(--deck-split-gap, var(--rik-space-4))); }
    .col {
      display: flex; flex-direction: column;
      min-height: 0; min-width: 0;
      gap: var(--_col-gap, var(--deck-split-col-gap, var(--rik-space-3)));
      overflow: hidden;
    }
    .col.center { justify-content: center; }

    /* Vertical distribution · both opt-in, both no-ops when absent.
       spread shares the leftover height between the blocks; fill gives that
       height to the blocks themselves (put a deck-fit inside and its text
       grows into it). See src/shared/slide-fill.ts.
       No backticks in here · this sits inside a css template literal. */
    .body { justify-content: var(--_spread, flex-start); }
    :host([fill]) .body > ::slotted(*) { flex: 1 1 0; min-height: 0; }
    :host([fill]) .body { justify-content: stretch; }
  `,
  ];

  @property({ type: String }) eyebrow?: string;
  @property({ type: String }) cols?: DeckSplitCols;
  @property({ type: String }) gap?: string;
  @property({ type: String, attribute: 'col-gap' }) colGap?: string;

  /** Map '1'..'6' to var(--sp-N); fall through to raw values otherwise. */
  private _resolveSp(v: string): string {
    const n = parseInt(v, 10);
    if (!Number.isNaN(n) && n >= 1 && n <= 6) return `var(--rik-space-${n})`;
    return v;
  }

  override updated() {
    if (this.gap) this.style.setProperty('--_gap', this._resolveSp(this.gap));
    if (this.colGap) this.style.setProperty('--_col-gap', this._resolveSp(this.colGap));
  }

  /** Distribute the leftover vertical space of the body ·
   *  `between` / `around` / `evenly` / `center` / `end` / `start` (default). */
  @property({ type: String, reflect: true }) spread?: string;

  /** Let the body's blocks take the leftover height instead of distributing it
   *  around them · pair with a `<deck-fit>` child to grow its text into it. */
  @property({ type: Boolean, reflect: true }) fill = false;

  override willUpdate(): void {
    // The style follows the ATTRIBUTE everywhere in this library, so reflect
    // both and write the resolved value as a custom property.
    this.style.setProperty('--_spread', spreadValue(this.spread ?? null));
  }

  override render() {
    const hasA = this.querySelector('[slot="a"]');
    const isThree = this.cols === '3' || !!hasA;
    return html`
      ${this.eyebrow ? html`<span class="lbl">${this.eyebrow}</span>` : ''}
      <slot name="title"></slot>
      <slot name="lead"></slot>
      <div class="body" part="body">
        ${
          isThree
            ? html`
          <div class="col" part="col"><slot name="a"></slot></div>
          <div class="col" part="col"><slot name="b"></slot></div>
          <div class="col" part="col"><slot name="c"></slot></div>
        `
            : html`
          <div class="col" part="col"><slot name="left"></slot></div>
          <div class="col" part="col"><slot name="right"></slot></div>
        `
        }
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'deck-split': DeckSplit;
  }
}
