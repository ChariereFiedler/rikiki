// ════════════════════════════════════════════════════════════════
// <deck-csv delimiter="," no-header?>
//   Metric, Q2, Q3
//   p95, 1.8s, 1.2s
//   errors, 0.5%, 0.3%
// </deck-csv>
//
// Renders inline CSV as a styled table · the quick way to drop tabular data
// onto a slide without hand-writing <table> markup. The first row is the
// header unless `no-header` is set. Inside a <deck-cell> it fills the width;
// add `fit` to shrink an oversized table to the cell (the table font-size is
// 1em, so the same font-size fit as deck-punch scales the whole table).
//
// Attributes:
//   delimiter · field separator · default ","
//   no-header · treat the first row as data, not a header
//   fit       · shrink the table to fit the cell box (font-size measure)
//   fit-min / fit-max · fit bounds in rem · default 0.6 / 2
//
// Tokens:
//   --deck-csv-border        (defaults to --rik-border-default)
//   --deck-csv-header-bg     (defaults to --rik-surface-tint)
//   --deck-csv-padding-x / --deck-csv-padding-y
// ════════════════════════════════════════════════════════════════

import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { FitController } from '../shared/fit-controller.js';
import { parseCsv } from '../shared/parse-csv.js';

@customElement('deck-csv')
export class DeckCsv extends LitElement {
  static override styles = css`
    :host {
      display: block;
      min-width: 0;
      overflow: hidden;
      font-family: var(--rik-font-sans);
      font-size: var(--rik-font-size-body);
    }
    /* fit · fill the cell so FitController can measure the table against the
       box · the table tracks the host font-size (1em), so the size search
       scales the whole table at once. */
    :host([fit]) {
      width: 100%;
      height: 100%;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 1em;
      color: var(--rik-text-default--muted);
    }
    th,
    td {
      border: 1px solid var(--deck-csv-border, var(--rik-border-default));
      padding: var(--deck-csv-padding-y, var(--rik-space-1)) var(--deck-csv-padding-x, var(--rik-space-2));
      text-align: left;
      vertical-align: top;
    }
    th {
      background: var(--deck-csv-header-bg, var(--rik-surface-tint));
      color: var(--rik-text-default);
      font-weight: 700;
    }
  `;

  @property({ type: String }) delimiter = ',';
  @property({ type: Boolean, attribute: 'no-header' }) noHeader = false;
  @property({ type: Boolean }) fit = false;
  @property({ type: Number, attribute: 'fit-min' }) fitMin?: number;
  @property({ type: Number, attribute: 'fit-max' }) fitMax?: number;

  @state() private rows: string[][] = [];

  private fitter = new FitController(this, {
    enabled: () => this.fit,
    minRem: () => this.fitMin ?? 0.6,
    maxRem: () => this.fitMax ?? 2,
  });

  override connectedCallback() {
    super.connectedCallback();
    this.parse();
  }

  override updated() {
    this.fitter.refit();
  }

  /** Re-read the light-DOM CSV and re-render · used by the live editor. */
  reparse(): void {
    this.parse();
  }

  private parse(): void {
    const raw = this.textContent ?? '';
    const lines = raw.split('\n');
    // Strip the common indent so CSV nested inside indented HTML still parses.
    const indent = lines
      .filter((l) => l.trim().length > 0)
      .reduce((min, l) => Math.min(min, l.match(/^ */)?.[0].length ?? 0), Infinity);
    const cleaned = indent === Infinity ? raw : lines.map((l) => l.slice(indent)).join('\n');
    // Trim each cell · authors naturally write "a, b, c" with spaces after the
    // delimiter, and leading/trailing padding never matters on a slide.
    this.rows = parseCsv(cleaned.trim(), this.delimiter).map((r) => r.map((c) => c.trim()));
    // Keep the raw CSV in light DOM · the template has no <slot>, so it stays
    // invisible, but the overview clones the light DOM to build thumbnails · a
    // cleared source would re-render an empty table there.
  }

  override render() {
    if (this.rows.length === 0) return html``;
    const header = this.noHeader ? null : this.rows[0];
    const body = this.noHeader ? this.rows : this.rows.slice(1);
    return html`
      <table part="table">
        ${
          header
            ? html`<thead>
              <tr>
                ${header.map((cell) => html`<th>${cell}</th>`)}
              </tr>
            </thead>`
            : ''
        }
        <tbody>
          ${body.map(
            (r) => html`<tr>
              ${r.map((cell) => html`<td>${cell}</td>`)}
            </tr>`,
          )}
        </tbody>
      </table>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'deck-csv': DeckCsv;
  }
}
