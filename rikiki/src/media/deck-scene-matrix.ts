// ════════════════════════════════════════════════════════════════
// <deck-scene-matrix
//   columns="be cited | connected catalogue | brand app | agent payment"
//   groups="be found:2 | be chosen:1 | sell:1"
//   statuses="prod=in production | test=in test | none=nothing yet">
//   <deck-scene-item label="France" level="prod prod test none"></deck-scene-item>
//   <deck-scene-item label="United States" level="prod prod prod prod"></deck-scene-item>
// </deck-scene-matrix>
//
// Where each stands · one row per market, player or offer, one column per
// usage, one dot per cell. The dot carries the status by its shape, so the row
// reads from across the room: filled is in production, a ring in the accent is
// a pilot, a plain ring is in test, a dashed ring is announced, a faint dashed
// ring is nothing yet. Every dot that is not in production says its status in
// words under it · a gap is the point of the slide, and it gets named.
//
// Scene attributes:
//   columns  · the column headers, separated by `|` (2 to 12), up to two lines each
//   groups   · optional `name:count | name:count`, labels over runs of columns
//   statuses · optional `status=word | …`, the words under the dots and in the
//              legend, in the deck's language (English by default)
//
// Item `level`: one status per column, space-separated, among prod, pilot,
// test, announced, none. A missing or unknown one reads as none.
//
// OPT-IN · <script type="module" src="dist/deck-scene-matrix.js"></script>
//
// Item attributes read: label, level, emphasis (the row the title is about,
// on a tinted band). Up to 6 rows.
//
// Tokens (override on `:host` to retheme one instance):
//   --deck-scene-card-bg / --deck-scene-card-stroke / --deck-scene-emphasis-bg
//   --deck-scene-muted / --deck-scene-tag / --deck-scene-line
//   --deck-scene-row-emphasis-bg · the band of the emphasised row (accent, faint)
//   --deck-scene-band-bg · the band of every second row
// ════════════════════════════════════════════════════════════════

import { css, html, svg } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import './deck-scene-item.js';
import {
  BASELINE,
  GAP,
  PAD,
  SCENE_LIMITS,
  SceneElement,
  TYPE,
  type Fitted,
  fitText,
  measurerFor,
  misfits,
  sceneStyles,
  sceneViewBox,
  wrapText,
} from './scene-kit.js';
import {
  type Group,
  type Status,
  dotDelays,
  flowLine,
  legendStatuses,
  parseColumns,
  parseGroups,
  parseLevels,
  parseStatusWords,
  unfitWords,
} from './deck-scene-matrix-layout.js';

const MAX_ROWS = SCENE_LIMITS.matrix.max;
const GRID = 8;
const LABEL_LINES = 2;
const HEADER_LINES = 2;
const WORD_LINES = 2;
const MIN_LABEL_COLUMN = 160;
const MAX_LABEL_COLUMN = 400;
/** Kept free on each side of a column, so two neighbouring headers or status
 *  words never read as one. */
const COLUMN_INSET = GRID;
const GROUP_TO_RULE = 8;
const AFTER_GROUPS = 16;
const AFTER_HEADERS = 16;
const DOT_RADIUS = 24;
const AFTER_DOT = 8;
const CORNER = 16;
const LEGEND_DOT_RADIUS = 12;
const LEGEND_DOT_GAP = 12;
const LEGEND_ITEM_GAP = 40;
/** Half the cap height of the sans families rikiki themes use, as a share of
 *  the size · what centres a line of text on a dot or in a band. */
const CAP_HALF = 0.35;
const START = 0.2;
const MAX_STEP = 0.1;
/** The last dot starts here, and pops for 0.45 s · inside the 2.5 s budget. */
const LAST_START = 2;

interface Row {
  label: Fitted;
  levels: Status[];
  words: Fitted[];
  name: string;
  emphasis: boolean;
}

interface Grid {
  labelColumn: number;
  columnWidth: number;
}

type MeasureAt = ReturnType<typeof measurerFor>;

const ceilToGrid = (value: number) => Math.ceil(value / GRID) * GRID;

/** Fit every text, then set them all at the smallest size any of them took ·
 *  a row of headers in two sizes reads as two kinds of header. */
function fitUniform(
  texts: string[],
  maxWidth: number,
  maxLines: number,
  size: number,
  measureAt: MeasureAt,
): Fitted[] {
  const fitted = texts.map((text) => fitText(text, maxWidth, maxLines, size, measureAt));
  const smallest = Math.min(size, ...fitted.map((each) => each.size));
  if (smallest === size) return fitted;
  return texts.map((text) => ({
    ...wrapText(text, maxWidth, measureAt(smallest), maxLines),
    size: smallest,
  }));
}

/** The baseline of the first of `lines` lines, the block centred on `centre`. */
const centredBaseline = (centre: number, lines: number, line: number, size: number) =>
  centre - ((lines - 1) * line) / 2 + size * CAP_HALF;

@customElement('deck-scene-matrix')
export class DeckSceneMatrix extends SceneElement {
  static override styles = [
    sceneStyles,
    css`
      .card.emphasis-row {
        fill: var(--deck-scene-row-emphasis-bg, var(--rik-accent--faint));
      }
      .band {
        fill: var(--deck-scene-band-bg, var(--rik-surface-sunken));
        stroke: none;
      }
      .dot {
        stroke-width: 3;
      }
      .dot.raised {
        fill: var(--deck-scene-card-bg, var(--rik-surface-raised));
      }
      .dot.pilot {
        stroke: var(--deck-scene-emphasis-bg, var(--rik-accent));
      }
    `,
  ];

  @property({ type: String }) columns?: string;
  @property({ type: String }) groups?: string;
  @property({ type: String }) statuses?: string;

  override render() {
    const headers = parseColumns(this.columns);
    const words = parseStatusWords(this.statuses);
    const label = measurerFor(this, TYPE.label.weight);
    const note = measurerFor(this, TYPE.note.weight);
    const tag = measurerFor(this, TYPE.tag.weight);

    const items = this.items.slice(0, MAX_ROWS);
    const grid = this.grid(items, headers.length, label);
    const inner = grid.columnWidth - 2 * COLUMN_INSET;
    const levels = items.map((item) => parseLevels(item.getAttribute('level'), headers.length));
    const statusWords = fitUniform(
      levels.flat().map((level) => (level === 'prod' ? '' : words[level])),
      inner,
      WORD_LINES,
      TYPE.tag.size,
      tag,
    );
    const rows: Row[] = items.map((item, index) => ({
      label: fitText(
        item.getAttribute('label') ?? '',
        grid.labelColumn - PAD - GRID,
        LABEL_LINES,
        TYPE.label.size,
        label,
      ),
      levels: levels[index],
      words: statusWords.slice(index * headers.length, (index + 1) * headers.length),
      name: item.getAttribute('label') ?? '',
      emphasis: item.hasAttribute('emphasis'),
    }));
    const heads = fitUniform(headers, inner, HEADER_LINES, TYPE.note.size, note);
    const groups = parseGroups(this.groups, headers.length);
    const groupLabels = groups.map((group) =>
      fitText(group.name, group.count * grid.columnWidth - 2 * COLUMN_INSET, 1, TYPE.tag.size, tag),
    );

    this.reportOverflow([
      ...groups.flatMap((group, i) => misfits(group.name, { group: groupLabels[i] })),
      ...headers.flatMap((header, i) => misfits(header, { column: heads[i] }, inner)),
      ...rows.flatMap((row) => [
        ...misfits(row.name, { label: row.label }, grid.labelColumn - PAD - GRID),
        ...unfitWords(row.words).flatMap((status) => misfits(row.name, { status }, inner)),
      ]),
    ]);

    const headerTop = groups.length ? TYPE.tag.line + GROUP_TO_RULE + AFTER_GROUPS : 0;
    const headerLines = Math.max(0, ...heads.map((head) => head.lines.length));
    let top = headerTop + (headerLines ? headerLines * TYPE.note.line + AFTER_HEADERS : 0);
    const delays = dotDelays(rows.length, headers.length, START, MAX_STEP, LAST_START);
    const drawnRows = rows.map((row, index) => {
      const rowTop = top;
      top += this.rowHeight(row) + GAP;
      return this.row(row, index, rowTop, grid, delays[index]);
    });
    const legendTop = top;
    const legend = this.legend(
      legendStatuses(rows.map((row) => row.levels)),
      words,
      legendTop,
      note,
    );

    return html`<svg
      viewBox=${sceneViewBox(legend.bottom, this.width)}
      role="img"
      aria-label=${rows.map((row) => `${row.name}: ${headers.map((header, i) => `${header} ${words[row.levels[i]]}`).join(', ')}`).join('. ')}
      part="drawing"
    >
      ${groups.map((group, i) => this.group(group, groupLabels[i], grid))}
      ${heads.map((head, i) => this.header(head, i, headerTop, headerLines, grid))}
      ${drawnRows}
      ${legend.drawn}
    </svg>`;
  }

  /** The label column is as wide as the widest label needs, within bounds;
   *  the columns share what is left equally. No PAD after the label · the first
   *  dot already stands half a column away from it, and ten columns need the room. */
  private grid(items: HTMLElement[], columnCount: number, label: MeasureAt): Grid {
    const widest = Math.max(
      0,
      ...items.map((item) => label(TYPE.label.size)(item.getAttribute('label') ?? '')),
    );
    const wanted = ceilToGrid(PAD + widest + GRID);
    const labelColumn = Math.min(Math.max(wanted, MIN_LABEL_COLUMN), MAX_LABEL_COLUMN);
    return { labelColumn, columnWidth: (this.width - labelColumn) / Math.max(1, columnCount) };
  }

  private columnCentre(column: number, grid: Grid): number {
    return grid.labelColumn + (column + 1 / 2) * grid.columnWidth;
  }

  /** The dot and the words under it, as one block. */
  private dotBlock(row: Row): number {
    const wordLines = Math.max(0, ...row.words.map((word) => word.lines.length));
    return 2 * DOT_RADIUS + (wordLines ? AFTER_DOT + wordLines * TYPE.tag.line : 0);
  }

  private contentHeight(row: Row): number {
    return Math.max(this.dotBlock(row), row.label.lines.length * TYPE.label.line);
  }

  private rowHeight(row: Row): number {
    return this.contentHeight(row) + 2 * PAD;
  }

  private group(group: Group, fitted: Fitted, grid: Grid) {
    const left = grid.labelColumn + group.start * grid.columnWidth + COLUMN_INSET;
    const right = grid.labelColumn + (group.start + group.count) * grid.columnWidth - COLUMN_INSET;
    const ruleY = TYPE.tag.line + GROUP_TO_RULE;
    return svg`
      ${fitted.lines.map(
        (
          line,
        ) => svg`<text class="tag" x=${(left + right) / 2} y=${fitted.size * BASELINE} text-anchor="middle"
          font-size=${fitted.size} font-weight=${TYPE.tag.weight}>${line}</text>`,
      )}
      <path class="line muted" d="M${left} ${ruleY} H${right}"></path>
    `;
  }

  /** Headers are centred on their column, and a one-line header sits in the
   *  middle of the two-line band, level with its neighbours' centre. */
  private header(head: Fitted, column: number, headerTop: number, headerLines: number, grid: Grid) {
    const top = headerTop + ((headerLines - head.lines.length) * TYPE.note.line) / 2;
    return head.lines.map(
      (
        line,
        i,
      ) => svg`<text x=${this.columnCentre(column, grid)} y=${top + i * TYPE.note.line + head.size * BASELINE}
        text-anchor="middle" font-size=${head.size} font-weight=${TYPE.note.weight}>${line}</text>`,
    );
  }

  /** Bands alternate card and plain fill; the row with `emphasis` takes a tone
   *  of its own · the row the title is about, as in every other scene. */
  private bandClass(row: Row, index: number): string {
    if (row.emphasis) return 'card emphasis-row';
    return index % 2 === 0 ? 'card' : 'band';
  }

  private row(row: Row, index: number, top: number, grid: Grid, delays: number[]) {
    const height = this.rowHeight(row);
    const content = this.contentHeight(row);
    const centre = top + height / 2;
    const dotY = top + PAD + (content - this.dotBlock(row)) / 2 + DOT_RADIUS;
    const labelBaseline = centredBaseline(
      centre,
      row.label.lines.length,
      TYPE.label.line,
      row.label.size,
    );
    return svg`
      <rect class=${this.bandClass(row, index)} x="0" y=${top} width=${this.width} height=${height} rx=${CORNER}></rect>
      ${row.label.lines.map(
        (line, i) => svg`<text class="label" x=${PAD} y=${labelBaseline + i * TYPE.label.line}
          font-size=${row.label.size} font-weight=${TYPE.label.weight}>${line}</text>`,
      )}
      ${row.levels.map((level, column) => {
        const x = this.columnCentre(column, grid);
        const word = row.words[column];
        const wordTop = dotY + DOT_RADIUS + AFTER_DOT;
        return svg`<g class="pop" style="--t0:${delays[column]}s">
          ${this.dot(level, x, dotY, DOT_RADIUS)}
          ${word.lines.map(
            (
              line,
              i,
            ) => svg`<text class="tag" x=${x} y=${wordTop + i * TYPE.tag.line + word.size * BASELINE}
              text-anchor="middle" font-size=${word.size} font-weight=${TYPE.tag.weight}>${line}</text>`,
          )}
        </g>`;
      })}
    `;
  }

  private dot(status: Status, cx: number, cy: number, r: number) {
    const shape: Record<Status, string> = {
      prod: 'emphasis',
      pilot: 'line dot raised pilot',
      test: 'line dot raised',
      announced: 'line dot raised dash',
      none: 'line dot muted dash',
    };
    return svg`<circle class=${shape[status]} cx=${cx} cy=${cy} r=${r}></circle>`;
  }

  /** One entry per status present, flowing left to right under the grid. */
  private legend(statuses: Status[], words: Record<Status, string>, top: number, note: MeasureAt) {
    const measure = note(TYPE.note.size);
    const widths = statuses.map(
      (status) => 2 * LEGEND_DOT_RADIUS + LEGEND_DOT_GAP + measure(words[status]),
    );
    const placed = flowLine(widths, LEGEND_ITEM_GAP, this.width);
    const lineHeight = Math.max(2 * LEGEND_DOT_RADIUS, TYPE.note.line);
    const lines = statuses.length ? Math.max(...placed.map((entry) => entry.line)) + 1 : 0;
    const drawn = statuses.map((status, i) => {
      const centre = top + placed[i].line * lineHeight + lineHeight / 2;
      const x = placed[i].x;
      return svg`
        ${this.dot(status, x + LEGEND_DOT_RADIUS, centre, LEGEND_DOT_RADIUS)}
        <text class="note" x=${x + 2 * LEGEND_DOT_RADIUS + LEGEND_DOT_GAP} y=${centredBaseline(centre, 1, lineHeight, TYPE.note.size)}
          font-size=${TYPE.note.size} font-weight=${TYPE.note.weight}>${words[status]}</text>
      `;
    });
    // Without a legend the drawing ends at the last band, not a GAP below it.
    return { drawn, bottom: lines ? top + lines * lineHeight : top - GAP };
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'deck-scene-matrix': DeckSceneMatrix;
  }
}
