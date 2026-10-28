// ════════════════════════════════════════════════════════════════
// <deck-scene-steps conclusion="No change to a retailer's site without its consent"
//   conclusion-note="our tests run on a test shop or on recorded data"
//   conclusion-icon="lock">
//   <deck-scene-item label="measure" tag="no prerequisite"
//     note="five assistants asked typical questions, then a score"></deck-scene-item>
//   <deck-scene-item label="connect" tag="one week"
//     note="one connector, read-only, on the catalogue"></deck-scene-item>
//   <deck-scene-item label="advise" tag="once measured" emphasis
//     note="what to fix first, ranked by effect on the score"></deck-scene-item>
// </deck-scene-steps>
//
// One to six numbered rows down the drawing · a sequence the slide asks the
// room to follow, "start with this, then that". Each row: a number in a disc,
// a label in a fixed column, a note wrapped to the middle, a tag on the right
// edge. Every row takes the height of the fullest one and a thin connector
// joins the discs, so the order reads before any word does.
//
// One row may carry `emphasis` · the step the slide argues for. Its disc flips
// colours with the row, so the number stays readable on the accent.
//
// The closing band is optional · the sentence every step answers to, on the
// inverse surface, under the rows. It reads from the scene, not from an item:
//   conclusion       · the sentence, bold, up to two lines
//   conclusion-note  · one line under it
//   conclusion-icon  · a deck-icon name drawn at its left (lock, flag…)
//
// OPT-IN · <script type="module" src="dist/deck-scene-steps.js"></script>
//
// Item attributes read: label, note, tag, emphasis. The icon is not drawn ·
// the number is the device.
//
// Tokens (override on `:host` to retheme one instance):
//   --deck-scene-card-bg / --deck-scene-card-stroke / --deck-scene-emphasis-bg
//   --deck-scene-emphasis-text / --deck-scene-muted / --deck-scene-tag
//   --deck-scene-band-bg / --deck-scene-band-text / --deck-scene-band-muted
//   --deck-scene-band-icon
// ════════════════════════════════════════════════════════════════

import { css, html, svg } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { iconPath } from '../shared/icon-set.js';
import './deck-scene-item.js';
import {
  PAD,
  SCENE_LIMITS,
  SceneElement,
  TYPE,
  type Fitted,
  type Measure,
  fitText,
  measurerFor,
  misfits,
  sceneStyles,
  sceneViewBox,
} from './scene-kit.js';
import {
  DISC,
  DISC_CENTER,
  LABEL_WIDTH,
  LABEL_X,
  stepColumns,
  stepRows,
  type StepColumns,
} from './deck-scene-steps-layout.js';

const MAX_ROWS = SCENE_LIMITS.steps.max;
const LABEL_LINES = 2;
const NOTE_LINES = 2;
const CONCLUSION_LINES = 2;
/** A tag wider than this is a sentence · the note is where sentences go. */
const TAG_MAX_WIDTH = 320;
const AFTER_CONCLUSION = 8;
/** The band icon is as wide as a disc, so it sits exactly under them. */
const ICON_SIZE = DISC;
const ICON_SCALE = ICON_SIZE / 24;
const RADIUS = 16;
/** The connector stops short of each disc · touching, it reads as a stem. */
const CONNECTOR_INSET = 8;
/** The visual middle of a line (half the cap height) sits about this far above
 *  its baseline, as a fraction of the size, in the sans families themes use.
 *  Every line is placed by that middle, so the number, the label, the note and
 *  the tag of a row read on one axis whatever their sizes. */
const TEXT_MIDDLE = 0.36;
const FIRST_DELAY = 0.1;
const STAGGER = 0.15;
/** The kit's pop lasts this long · the band waits for the last row to land. */
const POP_SECONDS = 0.45;

interface Step {
  label: Fitted;
  note: Fitted;
  tag: Fitted;
  emphasis: boolean;
  name: string;
}

interface Band {
  sentence: Fitted;
  note: Fitted;
  icon: string | null;
}

type Role = 'label' | 'note' | 'tag';

@customElement('deck-scene-steps')
export class DeckSceneSteps extends SceneElement {
  static override styles = [
    sceneStyles,
    css`
      /* A disc in an emphasised row takes the row's text colour, and its number
         the accent · the pair flips with the row instead of vanishing into it. */
      .disc.flip {
        fill: var(--deck-scene-emphasis-text, var(--rik-accent__on, var(--rik-text-default)));
      }
      .number.flip {
        fill: var(--deck-scene-emphasis-bg, var(--rik-accent));
      }
      .band {
        fill: var(--deck-scene-band-bg, var(--rik-surface-inverse));
      }
      .on-band {
        fill: var(--deck-scene-band-text, var(--rik-text-inverse));
      }
      .on-band.note {
        fill: var(--deck-scene-band-muted, var(--rik-text-inverse--muted));
      }
      .icon.on-band {
        fill: none;
        stroke: var(--deck-scene-band-icon, var(--rik-accent));
      }
    `,
  ];

  @property({ type: String }) conclusion?: string;
  @property({ type: String, attribute: 'conclusion-note' }) conclusionNote?: string;
  @property({ type: String, attribute: 'conclusion-icon' }) conclusionIcon?: string;

  override render() {
    const items = this.items.slice(0, MAX_ROWS);
    const tagMeasure = measurerFor(this, TYPE.tag.weight);
    const tags = items.map((item) =>
      fitText(item.getAttribute('tag') ?? '', TAG_MAX_WIDTH, 1, TYPE.tag.size, tagMeasure),
    );
    const tagWidth = Math.max(0, ...tags.map((tag) => widest(tag, tagMeasure)));
    const cols = stepColumns(tagWidth, this.width);

    const label = measurerFor(this, TYPE.label.weight);
    const note = measurerFor(this, TYPE.note.weight);
    const steps: Step[] = items.map((item, index) => ({
      label: fitText(
        item.getAttribute('label') ?? '',
        LABEL_WIDTH,
        LABEL_LINES,
        TYPE.label.size,
        label,
      ),
      note: fitText(
        item.getAttribute('note') ?? '',
        cols.noteWidth,
        NOTE_LINES,
        TYPE.note.size,
        note,
      ),
      tag: tags[index] as Fitted,
      emphasis: item.hasAttribute('emphasis'),
      name: item.getAttribute('label') || `step ${index + 1}`,
    }));
    const band = this.band(label, note);
    const layout = stepRows(steps.map(stepContent), band ? bandContent(band) : null);

    this.reportOverflow([
      ...steps.flatMap((step) =>
        misfits(step.name, { label: step.label, note: step.note, tag: step.tag }),
      ),
      ...(band
        ? misfits('conclusion', { conclusion: band.sentence, 'conclusion-note': band.note })
        : []),
    ]);

    const bandDelay = FIRST_DELAY + (steps.length - 1) * STAGGER + POP_SECONDS;
    return html`<svg
      viewBox=${sceneViewBox(layout.height, this.width)}
      role="img"
      aria-label=${describe(steps, band)}
      part="drawing"
    >
      ${steps.map((step, index) => this.row(step, index, cols, layout.ys[index] ?? 0, layout.rowHeight))}
      ${steps.slice(1).map((_, index) => this.connector(index, cols, layout.ys, layout.rowHeight))}
      ${band ? this.drawBand(band, layout.bandY, layout.bandHeight, bandDelay) : ''}
    </svg>`;
  }

  /** The band is drawn when the scene says something to close on · either
   *  attribute is enough, an icon alone is not. */
  private band(label: (size: number) => Measure, note: (size: number) => Measure): Band | null {
    const sentence = this.conclusion?.trim() ?? '';
    const aside = this.conclusionNote?.trim() ?? '';
    if (!sentence && !aside) return null;
    const icon = iconPath(this.conclusionIcon);
    const width = this.width - bandTextX(icon) - PAD;
    return {
      sentence: fitText(sentence, width, CONCLUSION_LINES, TYPE.label.size, label),
      note: fitText(aside, width, 1, TYPE.note.size, note),
      icon,
    };
  }

  private row(step: Step, index: number, cols: StepColumns, y: number, height: number) {
    const on = step.emphasis ? 'on-emphasis' : '';
    const flip = step.emphasis ? 'flip' : '';
    const middle = y + height / 2;
    const text = (role: Role, fitted: Fitted, x: number, anchor = 'start') => {
      const top = middle - (fitted.lines.length * TYPE[role].line) / 2;
      return fitted.lines.map(
        (line, i) => svg`<text
          class="${role} ${on}"
          x=${x}
          y=${baseline(top + i * TYPE[role].line, TYPE[role].line, fitted.size)}
          font-size=${fitted.size}
          font-weight=${TYPE[role].weight}
          text-anchor=${anchor}
        >${line}</text>`,
      );
    };
    return svg`<g class="pop" style="--t0:${FIRST_DELAY + index * STAGGER}s">
      <rect class=${step.emphasis ? 'emphasis' : 'card'} x="0" y=${y} width=${this.width} height=${height} rx=${RADIUS}></rect>
      <circle class="disc emphasis ${flip}" cx=${cols.discCenter} cy=${middle} r=${DISC / 2}></circle>
      <text
        class="number on-emphasis ${flip}"
        x=${cols.discCenter}
        y=${baseline(middle - TYPE.label.line / 2, TYPE.label.line, TYPE.label.size)}
        font-size=${TYPE.label.size}
        font-weight=${TYPE.label.weight}
        text-anchor="middle"
      >${index + 1}</text>
      ${text('label', step.label, cols.labelX)}
      ${text('note', step.note, cols.noteX)}
      ${text('tag', step.tag, cols.tagRight, 'end')}
    </g>`;
  }

  /** From the disc of the row above to the disc of this one · drawn over the
   *  rows, so the sequence reads as one line and not as separate boxes. */
  private connector(index: number, cols: StepColumns, ys: number[], height: number) {
    const from = (ys[index] ?? 0) + height / 2 + DISC / 2 + CONNECTOR_INSET;
    const to = (ys[index + 1] ?? 0) + height / 2 - DISC / 2 - CONNECTOR_INSET;
    return svg`<line
      class="line muted fade"
      style="--t0:${FIRST_DELAY + (index + 1) * STAGGER}s"
      x1=${cols.discCenter}
      y1=${from}
      x2=${cols.discCenter}
      y2=${to}
    ></line>`;
  }

  private drawBand(band: Band, y: number, height: number, delay: number) {
    const x = bandTextX(band.icon);
    const middle = y + height / 2;
    const top = middle - bandText(band) / 2;
    const noteTop = top + band.sentence.lines.length * TYPE.label.line + betweenBandLines(band);
    const lines = (role: 'label' | 'note', fitted: Fitted, from: number) =>
      fitted.lines.map(
        (line, i) => svg`<text
          class="${role} on-band"
          x=${x}
          y=${baseline(from + i * TYPE[role].line, TYPE[role].line, fitted.size)}
          font-size=${fitted.size}
          font-weight=${TYPE[role].weight}
        >${line}</text>`,
      );
    return svg`<g class="fade" style="--t0:${delay}s">
      <rect class="band" x="0" y=${y} width=${this.width} height=${height} rx=${RADIUS}></rect>
      ${band.icon ? svg`<g transform="translate(${DISC_CENTER - ICON_SIZE / 2} ${middle - ICON_SIZE / 2}) scale(${ICON_SCALE})"><path class="icon on-band" d=${band.icon}></path></g>` : ''}
      ${lines('label', band.sentence, top)}
      ${lines('note', band.note, noteTop)}
    </g>`;
  }
}

/** The baseline that puts a line's visual middle on the middle of its line box. */
function baseline(lineTop: number, lineHeight: number, size: number): number {
  return lineTop + lineHeight / 2 + size * TEXT_MIDDLE;
}

function widest(fitted: Fitted, measureAt: (size: number) => Measure): number {
  const measure = measureAt(fitted.size);
  return Math.max(0, ...fitted.lines.map((line) => measure(line)));
}

/** The tallest column of a row · what the row height is computed from. */
function stepContent(step: Step): number {
  return Math.max(
    step.label.lines.length * TYPE.label.line,
    step.note.lines.length * TYPE.note.line,
    step.tag.lines.length * TYPE.tag.line,
  );
}

function betweenBandLines(band: Band): number {
  return band.sentence.lines.length && band.note.lines.length ? AFTER_CONCLUSION : 0;
}

/** The sentence and its note, stacked · centred in the band as one block. */
function bandText(band: Band): number {
  return (
    band.sentence.lines.length * TYPE.label.line +
    betweenBandLines(band) +
    band.note.lines.length * TYPE.note.line
  );
}

/** The band is as tall as its text, or as its icon when the text is shorter. */
function bandContent(band: Band): number {
  return Math.max(band.icon ? ICON_SIZE : 0, bandText(band));
}

/** With an icon, the sentence starts on the label column, the icon under the
 *  discs · the band reads as the list's last line. Without one, at the edge. */
function bandTextX(icon: string | null): number {
  return icon ? LABEL_X : PAD;
}

function describe(steps: Step[], band: Band | null): string {
  const rows = steps.map((step, index) =>
    [`${index + 1}. ${step.name}`, step.note.lines.join(' '), step.tag.lines.join(' ')]
      .filter(Boolean)
      .join(', '),
  );
  const closing = band
    ? [band.sentence.lines.join(' '), band.note.lines.join(' ')].filter(Boolean).join(', ')
    : '';
  return [...rows, closing].filter(Boolean).join('. ');
}

declare global {
  interface HTMLElementTagNameMap {
    'deck-scene-steps': DeckSceneSteps;
  }
}
