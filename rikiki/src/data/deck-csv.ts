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
import { parseCsv } from './parse-csv.js';

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
    /* The marked row is a band, not a tint · the light themes ship no pale
       surface that reads at projection distance (raised and tint both sit
       under a delta E of 5 against the page), so the one row that matters
       takes the inverse surface. */
    tr[data-mark] > td {
      background: var(--deck-csv-mark-bg, var(--rik-surface-inverse));
      color: var(--deck-csv-mark-color, var(--rik-text-inverse));
      border-color: var(--deck-csv-mark-bg, var(--rik-surface-inverse));
      font-weight: 700;
    }
    /* The marked column carries colour and weight, never a second fill · two
       overlapping tints leave a table with no hierarchy at all. */
    td[data-mark],
    th[data-mark] {
      color: var(--deck-csv-mark-col-color, var(--rik-accent__text));
      font-weight: 700;
    }
    tr[data-mark] > td[data-mark] {
      color: var(--deck-csv-mark-col-on-mark, var(--rik-accent));
    }
    /* Revealed rows keep their space · a table that grows row by row makes the
       whole slide jump under the audience. */
    tr[data-pending] {
      visibility: hidden;
    }
    @media print {
      /* No steps on paper, and the marks are content. */
      tr[data-pending] { visibility: visible; }
      tr[data-mark] > td, td[data-mark], th[data-mark] {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
    /* The header is told apart by weight and a rule, not by a band · the tint
       it used to carry measures a delta E of 3 against the page, which is to
       say the band was there and nobody could see it, while the text on it sat
       at 2.8:1. A rule costs nothing and reads across the room. */
    th {
      background: var(--deck-csv-header-bg, transparent);
      color: var(--rik-text-default);
      font-weight: 700;
      border-bottom: 2px solid var(--deck-csv-header-rule, var(--rik-accent));
    }
  `;

  @property({ type: String }) delimiter = ',';
  @property({ type: Boolean, attribute: 'no-header' }) noHeader = false;
  @property({ type: Boolean }) fit = false;
  @property({ type: Number, attribute: 'fit-min' }) fitMin?: number;
  @property({ type: Number, attribute: 'fit-max' }) fitMax?: number;

  /** 1-based body rows to emphasise · `2` or `2 5`. A table with no hierarchy
   *  is unreadable at projection distance. */
  @property({ type: String, attribute: 'highlight-rows' }) highlightRows?: string;

  /** 1-based columns to emphasise · same grammar. */
  @property({ type: String, attribute: 'highlight-cols' }) highlightCols?: string;

  /** Reveal body rows one per step instead of showing the whole table. */
  @property({ type: Boolean, reflect: true }) reveal = false;

  /** Current step, set by deck-root on every step change. */
  @state() private step = 0;

  @state() private rows: string[][] = [];

  private fitter = new FitController(this, {
    enabled: () => this.fit,
    minRem: () => this.fitMin ?? 0.6,
    maxRem: () => this.fitMax ?? 2,
  });

  override connectedCallback() {
    super.connectedCallback();
    this.parse();
    this._publishSteps();
  }

  /** One step per body row when revealing · published on the host slide, which
   *  is where the engine reads the count from. Never lowers an author's own. */
  private _publishSteps(): void {
    if (!this.reveal) return;
    let slide: Element | null = this;
    while (slide?.parentElement && slide.parentElement.tagName.toLowerCase() !== 'deck-root') {
      slide = slide.parentElement;
    }
    if (!slide?.parentElement) return;
    const needed = Math.max(0, this.rows.length - (this.noHeader ? 0 : 1));
    const declared = Number(slide.getAttribute('steps') ?? slide.getAttribute('data-steps') ?? '0');
    if (needed > declared) slide.setAttribute('data-steps', String(needed));
  }

  /** Called by deck-root on every step change. */
  applyStep(step: number): void {
    this.step = step;
  }

  /** 1-based indices from a space-separated attribute. */
  private _marked(raw: string | undefined): Set<number> {
    return new Set(
      (raw ?? '')
        .split(/[\s,]+/)
        .map((n) => Number.parseInt(n, 10))
        .filter((n) => Number.isFinite(n) && n > 0),
    );
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
    const parsed = parseCsv(cleaned.trim(), this.delimiter).map((r) => r.map((c) => c.trim()));
    // Pad short rows to the widest one · a ragged source would otherwise render
    // a table whose rows have fewer cells than the header, which is invalid
    // markup and misaligns every column after the gap.
    const width = parsed.reduce((max, r) => Math.max(max, r.length), 0);
    this.rows = parsed.map((r) =>
      r.length === width ? r : [...r, ...Array(width - r.length).fill('')],
    );
    // Keep the raw CSV in light DOM · the template has no <slot>, so it stays
    // invisible, but the overview clones the light DOM to build thumbnails · a
    // cleared source would re-render an empty table there.
  }

  override render() {
    if (this.rows.length === 0) return html``;
    const header = this.noHeader ? null : this.rows[0];
    const body = this.noHeader ? this.rows : this.rows.slice(1);
    const rows = this._marked(this.highlightRows);
    const cols = this._marked(this.highlightCols);
    return html`
      <table part="table">
        ${
          header
            ? html`<thead>
              <tr>
                ${header.map((cell, c) => html`<th ?data-mark=${cols.has(c + 1)}>${cell}</th>`)}
              </tr>
            </thead>`
            : ''
        }
        <tbody>
          ${body.map(
            (r, i) => html`<tr
              ?data-mark=${rows.has(i + 1)}
              ?data-pending=${this.reveal && i + 1 > this.step}
            >
              ${r.map((cell, c) => html`<td ?data-mark=${cols.has(c + 1)}>${cell}</td>`)}
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
