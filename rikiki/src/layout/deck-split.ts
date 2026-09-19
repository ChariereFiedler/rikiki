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
import { slideBase } from '../shared/shared-styles.js';
import { spreadValue } from './slide-fill.js';

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


    /* Directed comparison · a before/after has a reading direction, a pivot in
       the middle and, often, a side that wins. Tokens only, both themes.
         --deck-split-pivot-color / -size / -bg
         --deck-split-winner-ring / -width                                  */
    /* The pivot is the seam · the one place on a comparison slide where two
       things genuinely touch, which is the only thing rule 4 of ADR-002 lets a
       line be. It used to be a lone accent word floating at mid-height,
       attached to nothing and reading as a stray glyph between two columns.
       It is a full-height rule now, with the word riding on it. */
    .pivot {
      align-self: stretch;
      justify-self: center;
      display: grid;
      place-items: center;
      position: relative;
      padding-inline: var(--rik-space-3);
      flex: none;
    }
    .pivot::before {
      content: '';
      position: absolute;
      top: 0;
      bottom: 0;
      left: 50%;
      width: var(--deck-split-pivot-rule-width, 4px);
      transform: translateX(-50%);
      background: var(--deck-split-pivot-rule, var(--rik-accent));
      border-radius: var(--rik-radius-pill);
    }
    /* The word breaks the rule rather than sitting beside it · a chip in the
       slide's own surface, so the seam reads as one drawing. */
    .pivot-word {
      position: relative;
      font-family: var(--rik-font-display, var(--rik-font-sans));
      font-size: var(--deck-split-pivot-size, var(--rik-font-size-big));
      font-weight: 900;
      line-height: 1;
      color: var(--deck-split-pivot-color, var(--rik-accent));
      background: var(--deck-split-pivot-bg, var(--rik-surface-page));
      padding-block: var(--rik-space-2);
    }
    :host([pivot]) .body {
      grid-template-columns: 1fr auto 1fr;
    }
    /* The winning side is marked by a rule above it, not by a ring around it ·
       an outline draws a box, and a box is what this design avoids. */
    :host([winner]) .col {
      padding-top: var(--rik-space-3);
      border-top: var(--deck-split-winner-width, 3px) solid var(--rik-text-default--faint);
    }
    :host([winner='left']) .col:first-of-type,
    :host([winner='right']) .col:last-of-type {
      border-top-color: var(--deck-split-winner-ring, var(--rik-accent));
    }
    @media print {
      :host([winner]) .col { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
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

  /** Symbol or word between the two columns · turns a neutral split into a
   *  directed comparison. Two columns only; ignored in the three-column form. */
  @property({ type: String, reflect: true }) pivot?: string;

  /** Which side carries the accent · `left` or `right`, or absent for neither. */
  @property({ type: String, reflect: true }) winner?: 'left' | 'right';

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
          ${this.pivot ? html`<span class="pivot" part="pivot" aria-hidden="true"><span class="pivot-word" part="pivot-word">${this.pivot}</span></span>` : ''}
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
