// ════════════════════════════════════════════════════════════════
// <deck-scene-ranges scale="12" unit="days" caption="approximate durations">
//   <deck-scene-item label="A1" note="Connected catalogue" from="5" to="10"
//     tag="5 to 10 days"></deck-scene-item>
//   <deck-scene-item label="B2" note="My account in ChatGPT" to="10"
//     tag="10 days"></deck-scene-item>
//   <deck-scene-item label="C2" note="One-sentence basket"></deck-scene-item>
// </deck-scene-ranges>
//
// One row per item, every bar on the same scale · how long each option takes,
// read against the others. A range is a bar from `from` to `to`; `to` alone is
// a single value, drawn as a short pill on it. A row with neither is open: its
// track is dashed and its tag says "to be set" · a duration nobody knows yet is
// shown as unknown, not left out.
//
// The tag above the bar is the human text ("6 to 10 weeks"): the bar shows the
// proportion, the words carry the figure, so nobody reads a value off an axis.
//
// Scene attributes:
//   scale       · the maximum of the shared scale, a number (required · without
//                 it the largest value of the rows stands in)
//   unit        · the word after the maximum in the header ("days")
//   caption     · a header label in the accent ("approximate durations")
//   open-label  · the tag of an open row without its own (default "to be set")
//
// OPT-IN · <script type="module" src="dist/deck-scene-ranges.js"></script>
//
// Item attributes read: label, note, from, to, tag. Up to 8 rows.
//
// Tokens (override on `:host` to retheme one instance):
//   --deck-scene-emphasis-bg / --deck-scene-muted / --deck-scene-tag / --deck-scene-line
// ════════════════════════════════════════════════════════════════

import { html, svg } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import './deck-scene-item.js';
import {
  BASELINE,
  GAP,
  SCENE_LIMITS,
  SceneElement,
  TYPE,
  type Fitted,
  fitText,
  measurerFor,
  misfits,
  sceneStyles,
  sceneViewBox,
} from './scene-kit.js';
import {
  type ScaleArea,
  type Span,
  barSpan,
  parseValue,
  tagStart,
} from './deck-scene-ranges-layout.js';

const MAX_ROWS = SCENE_LIMITS.ranges.max;
const GRID = 8;
const NOTE_LINES = 2;
/** A label is a code or a short name · past this width it is no longer short. */
const MAX_LABEL_WIDTH = 320;
/** The words on the left never take more than this share of the drawing · the
 *  scale is the figure, and it needs the room. */
const MAX_LEFT_SHARE = 0.4;
const LABEL_TO_NOTE = 16;
const AFTER_HEADER = 8;
const AFTER_RULE = 24;
/** Rows are lines of one chart, not cards · they sit closer than GAP. */
const ROW_GAP = 24;
const AFTER_TAG = 8;
const BAR_HEIGHT = 24;
const POINT_WIDTH = 2 * BAR_HEIGHT;
/** The track stops where a bar at either end of the scale starts to round ·
 *  past it, its cap would show beside the bar's rounded end. */
const TRACK_INSET = BAR_HEIGHT / 2;
const DEFAULT_OPEN_LABEL = 'to be set';
const START = 0.2;
const STAGGER = 0.15;

interface Row {
  label: Fitted;
  note: Fitted;
  tag: Fitted;
  tagWidth: number;
  bar: Span | null;
  name: string;
}

type MeasureAt = ReturnType<typeof measurerFor>;

const ceilToGrid = (value: number) => Math.ceil(value / GRID) * GRID;

@customElement('deck-scene-ranges')
export class DeckSceneRanges extends SceneElement {
  static override styles = sceneStyles;

  @property({ type: String }) scale?: string;
  @property({ type: String }) unit?: string;
  @property({ type: String }) caption?: string;
  @property({ type: String, attribute: 'open-label' }) openLabel?: string;

  override render() {
    const items = this.items.slice(0, MAX_ROWS);
    const label = measurerFor(this, TYPE.label.weight);
    const note = measurerFor(this, TYPE.note.weight);
    const tag = measurerFor(this, TYPE.tag.weight);

    const labels = items.map((item) =>
      fitText(item.getAttribute('label') ?? '', MAX_LABEL_WIDTH, 1, TYPE.label.size, label),
    );
    const caption = fitText(this.caption ?? '', this.width * MAX_LEFT_SHARE, 1, TYPE.tag.size, tag);
    const noteX = this.noteX(labels, label);
    const area = this.scaleArea(items, noteX, caption, note, tag);
    const scale = this.scaleMaximum(items);

    const rows: Row[] = items.map((item, index) => {
      const from = parseValue(item.getAttribute('from'));
      const to = parseValue(item.getAttribute('to'));
      const bar = barSpan(from, to, scale, area, BAR_HEIGHT, POINT_WIDTH);
      const tagText =
        item.getAttribute('tag') || (bar ? '' : (this.openLabel ?? DEFAULT_OPEN_LABEL));
      const fittedTag = fitText(tagText, area.right - area.left, 1, TYPE.tag.size, tag);
      return {
        label: labels[index],
        note: fitText(
          item.getAttribute('note') ?? '',
          area.left - GAP - noteX,
          NOTE_LINES,
          TYPE.note.size,
          note,
        ),
        tag: fittedTag,
        tagWidth: tag(fittedTag.size)(fittedTag.lines[0] ?? ''),
        bar,
        name: item.getAttribute('label') ?? '',
      };
    });

    this.reportOverflow([
      ...misfits('caption', { caption }),
      ...rows.flatMap((row) =>
        misfits(row.name, { label: row.label, note: row.note, tag: row.tag }),
      ),
    ]);

    const headerHeight = TYPE.note.line;
    const ruleY = headerHeight + AFTER_HEADER;
    let top = ruleY + AFTER_RULE;
    const drawn = rows.map((row, index) => {
      const rowTop = top;
      top += this.rowHeight(row) + ROW_GAP;
      return this.row(row, rowTop, area, noteX, index);
    });
    const height = top - ROW_GAP;
    const maximum = [this.formatScale(scale), this.unit].filter(Boolean).join(' ');

    return html`<svg
      viewBox=${sceneViewBox(height, this.width)}
      role="img"
      aria-label=${[this.caption, ...rows.map((row) => [row.name, row.note.lines.join(' '), row.tag.lines.join(' ')].filter(Boolean).join(', '))].filter(Boolean).join('. ')}
      part="drawing"
    >
      ${this.header(caption, maximum, area)}
      <path class="line muted" d="M0 ${ruleY} H${this.width}"></path>
      ${drawn}
    </svg>`;
  }

  /** The note starts after the widest label, so every note lines up. */
  private noteX(labels: Fitted[], label: MeasureAt): number {
    const widest = Math.max(
      0,
      ...labels.map((fitted) => label(fitted.size)(fitted.lines[0] ?? '')),
    );
    return ceilToGrid(widest + LABEL_TO_NOTE);
  }

  /** The scale starts after the words on the left, as close as they allow and
   *  never past MAX_LEFT_SHARE · a longer note wraps instead. */
  private scaleArea(
    items: HTMLElement[],
    noteX: number,
    caption: Fitted,
    note: MeasureAt,
    tag: MeasureAt,
  ): ScaleArea {
    const widestNote = Math.max(
      0,
      ...items.map((item) => note(TYPE.note.size)(item.getAttribute('note') ?? '')),
    );
    const words = widestNote ? noteX + widestNote : noteX - LABEL_TO_NOTE;
    const captionWidth = tag(caption.size)(caption.lines[0] ?? '');
    const left = Math.max(words, captionWidth) + GAP;
    return { left: ceilToGrid(Math.min(left, this.width * MAX_LEFT_SHARE)), right: this.width };
  }

  /** The declared maximum, or the largest value of the rows when the author
   *  left it out · a chart drawn to its own data rather than not drawn at all. */
  private scaleMaximum(items: HTMLElement[]): number {
    const declared = parseValue(this.scale ?? null);
    if (declared !== null && declared > 0) return declared;
    const values = items.flatMap((item) => [
      parseValue(item.getAttribute('from')),
      parseValue(item.getAttribute('to')),
    ]);
    return Math.max(1, ...values.filter((value): value is number => value !== null));
  }

  private formatScale(scale: number): string {
    return String(Number.isInteger(scale) ? scale : Number(scale.toFixed(1)));
  }

  private header(caption: Fitted, maximum: string, area: ScaleArea) {
    const baseline = TYPE.note.size * BASELINE;
    return svg`
      ${caption.lines.map(
        (line) =>
          svg`<text class="tag" x="0" y=${baseline} font-size=${caption.size} font-weight=${TYPE.tag.weight}>${line}</text>`,
      )}
      <text class="note" x=${area.left} y=${baseline} font-size=${TYPE.note.size} font-weight=${TYPE.note.weight}>0</text>
      <text class="note" x=${area.right} y=${baseline} text-anchor="end" font-size=${TYPE.note.size} font-weight=${TYPE.note.weight}>${maximum}</text>
    `;
  }

  /** The bar's centre, from the top of its row · the tag sits above the bar. */
  private barCentre(): number {
    return TYPE.tag.line + AFTER_TAG + BAR_HEIGHT / 2;
  }

  /** The label shares a baseline with the first note line, both centred on the
   *  bar · the name reads on the line it names. */
  private labelBaseline(row: Row): number {
    return this.barCentre() - TYPE.label.line / 2 + row.label.size * BASELINE;
  }

  private rowHeight(row: Row): number {
    const barBottom = this.barCentre() + BAR_HEIGHT / 2;
    const labelBottom = this.barCentre() + TYPE.label.line / 2;
    const noteBottom =
      this.labelBaseline(row) - row.note.size * BASELINE + row.note.lines.length * TYPE.note.line;
    return Math.max(barBottom, labelBottom, noteBottom);
  }

  private row(row: Row, top: number, area: ScaleArea, noteX: number, index: number) {
    const baseline = top + this.labelBaseline(row);
    const centre = top + this.barCentre();
    const t0 = START + index * STAGGER;
    const tagX = row.bar ? tagStart(row.bar.x, row.tagWidth, area) : area.left;
    return svg`
      ${row.label.lines.map(
        (line) =>
          svg`<text class="label" x="0" y=${baseline} font-size=${row.label.size} font-weight=${TYPE.label.weight}>${line}</text>`,
      )}
      ${row.note.lines.map(
        (line, i) =>
          svg`<text class="note" x=${noteX} y=${baseline + i * TYPE.note.line} font-size=${row.note.size} font-weight=${TYPE.note.weight}>${line}</text>`,
      )}
      <path class="line muted ${row.bar ? '' : 'dash'}" d="M${area.left + TRACK_INSET} ${centre} H${area.right - TRACK_INSET}"></path>
      ${
        row.bar
          ? svg`<rect class="emphasis grow-x" style="--t0:${t0}s" x=${row.bar.x} y=${centre - BAR_HEIGHT / 2}
            width=${row.bar.width} height=${BAR_HEIGHT} rx=${BAR_HEIGHT / 2}></rect>`
          : ''
      }
      ${row.tag.lines.map(
        (
          line,
        ) => svg`<text class="${row.bar ? 'tag' : 'note'} fade" style="--t0:${t0}s" x=${tagX} y=${top + row.tag.size * BASELINE}
          font-size=${row.tag.size} font-weight=${TYPE.tag.weight}>${line}</text>`,
      )}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'deck-scene-ranges': DeckSceneRanges;
  }
}
