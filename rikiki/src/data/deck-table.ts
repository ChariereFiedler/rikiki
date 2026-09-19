// ════════════════════════════════════════════════════════════════
// <deck-table highlight-rows="2" reveal>
//   <table>
//     <thead><tr><th>Region</th><th>Users</th></tr></thead>
//     <tbody><tr><td>EMEA</td><td>12 040</td></tr></tbody>
//   </table>
// </deck-table>
//
// A hand-authored table with the same hierarchy deck-csv now has. deck-csv is
// for data pasted as CSV; this is for a table whose cells carry markup ·
// a badge, a link, an icon.
//
// The table stays in the light DOM, so its markup is the author's and the
// theme's table styles still apply. This component adds the emphasis and the
// progressive reveal on top.
//
// OPT-IN · <script type="module" src="dist/deck-table.js"></script>
// ════════════════════════════════════════════════════════════════

import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

/** Mark the columns the author asked for, on one row. */
function markCells(row: HTMLTableRowElement, cols: Set<number>): void {
  [...row.cells].forEach((cell, c) => {
    cell.toggleAttribute('data-mark', cols.has(c + 1));
  });
}

@customElement('deck-table')
export class DeckTable extends LitElement {
  /* Customization tokens:
       --deck-table-mark-bg / --deck-table-mark-color
       --deck-table-pending-opacity                                          */
  static override styles = css`
    :host {
      display: block;
      min-width: 0;
      overflow: hidden;
    }
    /* The table is slotted, so the emphasis is applied through attributes the
       component writes onto the author's own rows and cells. */
    ::slotted(table) {
      width: 100%;
      border-collapse: collapse;
    }
  `;

  /** 1-based body rows to emphasise · `2` or `2 5`. */
  @property({ type: String, attribute: 'highlight-rows' }) highlightRows?: string;

  /** 1-based columns to emphasise. */
  @property({ type: String, attribute: 'highlight-cols' }) highlightCols?: string;

  /** Reveal body rows one per step. */
  @property({ type: Boolean, reflect: true }) reveal = false;

  private _indices(raw: string | undefined): Set<number> {
    return new Set(
      (raw ?? '')
        .split(/[\s,]+/)
        .map((n) => Number.parseInt(n, 10))
        .filter((n) => Number.isFinite(n) && n > 0),
    );
  }

  private get _bodyRows(): HTMLTableRowElement[] {
    return [...this.querySelectorAll<HTMLTableRowElement>('tbody tr')];
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this._paint();
    if (!this.reveal) return;
    let slide: Element | null = this;
    while (slide?.parentElement && slide.parentElement.tagName.toLowerCase() !== 'deck-root') {
      slide = slide.parentElement;
    }
    if (!slide?.parentElement) return;
    const needed = this._bodyRows.length;
    const declared = Number(slide.getAttribute('steps') ?? slide.getAttribute('data-steps') ?? '0');
    if (needed > declared) slide.setAttribute('data-steps', String(needed));
  }

  override updated(): void {
    this._paint();
  }

  /** Write the emphasis onto the author's own markup · a light-DOM table cannot
   *  be styled from this shadow root, so the marks travel as attributes and the
   *  rules live in the theme (table[data-rik-table] in themes/*.css). */
  private _paint(): void {
    const rows = this._indices(this.highlightRows);
    const cols = this._indices(this.highlightCols);
    const table = this.querySelector('table');
    table?.setAttribute('data-rik-table', '');
    this._bodyRows.forEach((row, i) => {
      row.toggleAttribute('data-mark', rows.has(i + 1));
      markCells(row, cols);
    });
    for (const head of this.querySelectorAll<HTMLTableRowElement>('thead tr')) {
      markCells(head, cols);
    }
  }

  /** Called by deck-root on every step change. */
  applyStep(step: number): void {
    if (!this.reveal) return;
    this._bodyRows.forEach((row, i) => {
      row.toggleAttribute('data-pending', i + 1 > step);
    });
  }

  override render() {
    return html`<slot @slotchange=${() => this._paint()}></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'deck-table': DeckTable;
  }
}
