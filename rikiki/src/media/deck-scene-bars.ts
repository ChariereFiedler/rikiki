// ════════════════════════════════════════════════════════════════
// <deck-scene-bars unit="%">
//   <deck-scene-item note="holiday 2025" label="AI visits" value="1,7" emphasis></deck-scene-item>
//   <deck-scene-item note="holiday 2025" label="other channels" value="2,3"></deck-scene-item>
//   <deck-scene-item note="May 2026" label="AI visits" value="1,8" emphasis></deck-scene-item>
//   <deck-scene-item note="May 2026" label="other channels" value="1,5"></deck-scene-item>
// </deck-scene-bars>
//
// A handful of values as vertical bars, up to eight · "this one is bigger". Not
// a chart: no axis, no tick, no gridline. Each bar carries its figure above it
// and its label under it, so the scale is read off the bars, not off a ruler.
//
// Consecutive items with the same `note` form a group, captioned under it and
// set apart by a wider gap and a dashed divider · "before / after", "France /
// United States". Without a note the bars are one group with no caption.
//
// `emphasis` fills a bar with the accent and prints its figure in the accent
// text colour · a series the slide argues for may carry it on every group.
//
// OPT-IN · <script type="module" src="dist/deck-scene-bars.js"></script>
//
// Item attributes read: value, label, tag, note, emphasis.
//   value · "1,7" and "1.7" are the same number; printed as written
//   tag   · printed instead of the figure ("×3"), the bar still follows value
//
// Scene attributes:
//   unit   · appended to every figure after a narrow no-break space: "1,7 %"
//   max    · the top of the scale (default: the largest value)
//   height · the height of the bar area, in drawing units (default 280)
//
// Tokens (override on `:host` to retheme one instance):
//   --deck-scene-card-bg / --deck-scene-card-stroke / --deck-scene-emphasis-bg
//   --deck-scene-muted (baseline, divider)
//   --deck-scene-value (figures) / --deck-scene-value-emphasis (emphasised figures)
// ════════════════════════════════════════════════════════════════

import { css, html, svg } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import './deck-scene-item.js';
import {
  BASELINE,
  SceneElement,
  TYPE,
  type Fitted,
  fitText,
  measurerFor,
  sceneStyles,
  sceneViewBox,
} from './scene-kit.js';
import type { Overflow } from './scene-lint.js';
import {
  type BarColumns,
  type FittedFigure,
  type GroupSpan,
  LABEL_OVERHANG,
  MAX_BARS,
  barColumns,
  barHeight,
  fitFigure,
  formatFigure,
  groupByNote,
  parseFigure,
  scaleMax,
} from './deck-scene-bars-layout.js';

const DEFAULT_AREA = 280;
/** Above the figure of the tallest bar · a display face's ascent reaches past
 *  the BASELINE share of its line box, and the slide crops what leaves the drawing. */
const HEADROOM = 16;
/** Between the top of a bar and the line its figure sits on. */
const ABOVE_BAR = 16;
const BELOW_BASELINE = 24;
const BEFORE_CAPTION = 16;
const LABEL_LINES = 2;
const CAPTION_LINES = 2;
const BAR_RADIUS = 8;
const FIRST_BAR = 0.1;
const STAGGER = 0.12;
/** The length of the kit's grow keyframes · a figure fades in once its bar has risen. */
const GROW_DURATION = 0.7;

interface Bar {
  value: number;
  figure: FittedFigure;
  label: Fitted;
  emphasis: boolean;
  name: string;
  overflowName: string;
  /** The figure as printed, and the label as written · for the report. */
  shown: string;
  labelText: string;
}

interface Caption {
  span: GroupSpan;
  text: Fitted;
}

/** The vertical bands of the drawing, top to bottom. */
interface Bands {
  area: number;
  baseline: number;
  labelTop: number;
  captionTop: number;
  height: number;
}

@customElement('deck-scene-bars')
export class DeckSceneBars extends SceneElement {
  static override styles = [
    sceneStyles,
    css`
      /* Figures are read first, so they take the text colour rather than a muted
         one · a deck that wants the others quieter sets --deck-scene-value. */
      .figure {
        fill: var(--deck-scene-value, var(--rik-text-default));
      }
      .figure.lead {
        fill: var(--deck-scene-value-emphasis, var(--rik-accent__text, var(--rik-accent)));
      }
    `,
  ];

  @property({ type: String }) unit = '';
  @property({ type: String }) max?: string;
  @property({ type: Number }) height?: number;

  override render() {
    const items = this.items.slice(0, MAX_BARS);
    const groups = groupByNote(items.map((item) => item.getAttribute('note') ?? ''));
    const columns = barColumns(groups, this.width);
    const bars = sameFigureSize(items.map((item) => this.bar(item, columns.labelWidth)));
    const captions = this.captions(columns.groups);
    const bands = this.bands(bars, captions);
    const max = scaleMax(
      bars.map((bar) => bar.value),
      this.max === undefined ? undefined : parseFigure(this.max),
    );

    this.reportOverflow([
      ...bars.flatMap((bar) => this.overflowsOf(bar, columns.labelWidth)),
      ...captions
        .filter((caption) => !caption.text.fits)
        .map((caption) => ({
          item: caption.span.note,
          field: 'caption',
          text: caption.span.note,
          budget: caption.span.width + 2 * LABEL_OVERHANG,
          size: caption.text.size,
        })),
    ]);

    return html`<svg viewBox=${sceneViewBox(bands.height, this.width)} role="img" aria-label=${this.description(bars, columns.groups)} part="drawing">
      ${columns.dividers.map(
        (x) => svg`<line class="line muted dash" x1=${x} y1="0" x2=${x} y2=${bands.height}></line>`,
      )}
      ${bars.map((bar, index) => this.drawBar(bar, columns, index, barHeight(bar.value, max, bands.area), bands))}
      ${columns.groups.map(
        (span) =>
          svg`<line class="line muted" x1=${span.x - LABEL_OVERHANG} y1=${bands.baseline} x2=${span.x + span.width + LABEL_OVERHANG} y2=${bands.baseline}></line>`,
      )}
      ${captions.map((caption) =>
        this.lines(
          caption.text,
          'label',
          caption.span.x + caption.span.width / 2,
          bands.captionTop,
          TYPE.label,
        ),
      )}
    </svg>`;
  }

  private bar(item: HTMLElement, width: number): Bar {
    // A figure is drawn in the display family, often much wider than the sans.
    const figureMeasure = measurerFor(this, TYPE.value.weight, '--rik-font-display');
    const labelMeasure = measurerFor(this, TYPE.note.weight);
    const raw = item.getAttribute('value');
    const shown = item.getAttribute('tag')?.trim() || formatFigure(raw, this.unit);
    const label = item.getAttribute('label') ?? '';
    // Groups often repeat their labels ("AI visits" in each period) · the
    // caption is what tells the author which one did not fit.
    const group = item.getAttribute('note')?.trim();
    const name = label || shown;
    return {
      value: parseFigure(raw),
      figure: fitFigure(shown, width, TYPE.value.size, figureMeasure),
      label: fitText(label, width, LABEL_LINES, TYPE.note.size, labelMeasure),
      emphasis: item.hasAttribute('emphasis'),
      name,
      overflowName: group ? `${group} · ${name}` : name,
      shown,
      labelText: label,
    };
  }

  /** The fields of a bar that did not fit, each with what it needed · the
   *  figure and the label are different problems with different fixes. */
  private overflowsOf(bar: Bar, width: number): Overflow[] {
    const found: Overflow[] = [];
    if (!bar.figure.fits) {
      found.push({
        item: bar.overflowName,
        field: 'figure',
        text: bar.shown,
        measured: bar.figure.measured,
        budget: width,
        size: bar.figure.size,
      });
    }
    if (!bar.label.fits) {
      const measure = measurerFor(this, TYPE.note.weight)(bar.label.size);
      found.push({
        item: bar.overflowName,
        field: 'label',
        text: bar.labelText,
        measured: Math.max(0, ...bar.label.lines.map(measure)),
        budget: width,
        size: bar.label.size,
      });
    }
    return found;
  }

  /** A group caption may use the width of its group, labels' overhang included. */
  private captions(spans: GroupSpan[]): Caption[] {
    const measure = measurerFor(this, TYPE.label.weight);
    return spans
      .filter((span) => span.note)
      .map((span) => ({
        span,
        text: fitText(
          span.note,
          span.width + 2 * LABEL_OVERHANG,
          CAPTION_LINES,
          TYPE.label.size,
          measure,
        ),
      }));
  }

  /** Every label row takes the height of the fullest label, so the captions
   *  of every group sit on one line. */
  private bands(bars: Bar[], captions: Caption[]): Bands {
    const area = this.height && this.height > 0 ? this.height : DEFAULT_AREA;
    const baseline = HEADROOM + TYPE.value.line + ABOVE_BAR + area;
    const labelRows = Math.max(0, ...bars.map((bar) => bar.label.lines.length));
    const labelTop = baseline + BELOW_BASELINE;
    const labelsEnd = labelRows ? labelTop + labelRows * TYPE.note.line : baseline;
    const captionRows = Math.max(0, ...captions.map((caption) => caption.text.lines.length));
    const captionTop = labelsEnd + BEFORE_CAPTION;
    const height = captionRows ? captionTop + captionRows * TYPE.label.line : labelsEnd;
    return { area, baseline, labelTop, captionTop, height };
  }

  private drawBar(bar: Bar, columns: BarColumns, index: number, barSize: number, bands: Bands) {
    const x = columns.xs[index] ?? 0;
    const centre = x + columns.barWidth / 2;
    const top = bands.baseline - barSize;
    const start = FIRST_BAR + index * STAGGER;
    const figureTop = top - ABOVE_BAR - TYPE.value.line;
    return svg`
      <path class="${bar.emphasis ? 'emphasis' : 'card'} grow" style="--t0:${start}s"
        d=${roundedTop(x, top, columns.barWidth, barSize)}></path>
      <g class="fade" style="--t0:${start + GROW_DURATION}s">
        ${this.lines(bar.figure, bar.emphasis ? 'value figure lead' : 'value figure', centre, figureTop, TYPE.value)}
      </g>
      ${this.lines(bar.label, 'label', centre, bands.labelTop, TYPE.note)}`;
  }

  private lines(
    fitted: Fitted,
    role: string,
    centre: number,
    top: number,
    type: { weight: number; line: number },
  ) {
    return fitted.lines.map(
      (line, i) => svg`<text
        class=${role}
        x=${centre}
        y=${top + i * type.line + fitted.size * BASELINE}
        text-anchor="middle"
        font-size=${fitted.size}
        font-weight=${type.weight}
      >${line}</text>`,
    );
  }

  /** What a screen reader hears: each group's caption, then its bars. */
  private description(bars: Bar[], spans: GroupSpan[]): string {
    const read = (bar: Bar) => [bar.name, bar.figure.lines.join(' ')].filter(Boolean).join(' ');
    return spans
      .map((span) => {
        const values = bars
          .slice(span.first, span.first + span.count)
          .map(read)
          .join(', ');
        return span.note ? `${span.note}: ${values}` : values;
      })
      .join('. ');
  }
}

/** Figures are compared with each other, so they share one size · a single
 *  smaller figure would read as a lesser one. A figure that fits at the full
 *  size fits at the smaller one too. */
function sameFigureSize(bars: Bar[]): Bar[] {
  const size = Math.min(...bars.map((bar) => bar.figure.size));
  return bars.map((bar) => ({ ...bar, figure: { ...bar.figure, size } }));
}

/** A bar rounded at the top only · its foot stands square on the baseline. */
function roundedTop(x: number, top: number, width: number, height: number): string {
  const r = Math.min(BAR_RADIUS, height, width / 2);
  const bottom = top + height;
  return `M${x} ${bottom}V${top + r}Q${x} ${top} ${x + r} ${top}H${x + width - r}Q${x + width} ${top} ${x + width} ${top + r}V${bottom}Z`;
}

declare global {
  interface HTMLElementTagNameMap {
    'deck-scene-bars': DeckSceneBars;
  }
}
