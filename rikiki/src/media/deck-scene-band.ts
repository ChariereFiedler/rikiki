// ════════════════════════════════════════════════════════════════
// <deck-scene-band label="Twice as many stay" note="at the same headcount" icon="target">
// </deck-scene-band>
//
// The sentence a composition answers to · one band on the inverse surface, an
// optional icon at its left, a bold sentence of up to two lines and one line
// under it. The closing band of `deck-scene-steps`, as a scene of its own, so
// a `deck-scene` can close a row of scenes the same way.
//
// OPT-IN · <script type="module" src="dist/deck-scene-band.js"></script>
//
// Attributes:
//   label · the sentence, bold, up to two lines (required)
//   note  · one line under it
//   icon  · a deck-icon name drawn at the left (lock, flag, target…)
//
// Tokens: --deck-scene-band-bg / --deck-scene-band-text / --deck-scene-band-muted
//   / --deck-scene-band-icon
// ════════════════════════════════════════════════════════════════

import { css, html, svg } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { iconPath } from '../shared/icon-set.js';
import {
  PAD,
  SceneElement,
  TYPE,
  fitText,
  measurerFor,
  misfits,
  sceneStyles,
  sceneViewBox,
} from './scene-kit.js';

const ICON_SIZE = 40;
const ICON_SCALE = ICON_SIZE / 24;
const ICON_GAP = 32;
const RADIUS = 16;
const GRID = 8;
const SENTENCE_LINES = 2;
const BETWEEN_LINES = 8;
/** The visual middle of a line sits about this far above its baseline. */
const TEXT_MIDDLE = 0.36;

@customElement('deck-scene-band')
export class DeckSceneBand extends SceneElement {
  static override styles = [
    sceneStyles,
    css`
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

  @property({ type: String }) label?: string;
  @property({ type: String }) note?: string;
  @property({ type: String }) icon?: string;

  override render() {
    const icon = iconPath(this.icon ?? null);
    const textX = icon ? PAD + ICON_SIZE + ICON_GAP : PAD;
    const room = this.width - textX - PAD;
    const sentence = fitText(
      this.label?.trim() ?? '',
      room,
      SENTENCE_LINES,
      TYPE.label.size,
      measurerFor(this, TYPE.label.weight),
    );
    const aside = fitText(
      this.note?.trim() ?? '',
      room,
      1,
      TYPE.note.size,
      measurerFor(this, TYPE.note.weight),
    );
    this.reportOverflow(misfits('band', { label: sentence, note: aside }, room));

    const between = sentence.lines.length && aside.lines.length ? BETWEEN_LINES : 0;
    const text =
      sentence.lines.length * TYPE.label.line + between + aside.lines.length * TYPE.note.line;
    const height = Math.ceil((Math.max(icon ? ICON_SIZE : 0, text) + 2 * PAD) / GRID) * GRID;
    const middle = height / 2;
    const top = middle - text / 2;
    const noteTop = top + sentence.lines.length * TYPE.label.line + between;
    const lines = (role: 'label' | 'note', fitted: typeof sentence, from: number) =>
      fitted.lines.map(
        (line, i) => svg`<text
          class="${role} on-band"
          x=${textX}
          y=${from + i * TYPE[role].line + TYPE[role].line / 2 + fitted.size * TEXT_MIDDLE}
          font-size=${fitted.size}
          font-weight=${TYPE[role].weight}
        >${line}</text>`,
      );
    return html`<svg
      viewBox=${sceneViewBox(height, this.width)}
      role="img"
      aria-label=${[sentence.lines.join(' '), aside.lines.join(' ')].filter(Boolean).join(', ')}
      part="drawing"
    >
      <g class="fade">
        <rect class="band" x="0" y="0" width=${this.width} height=${height} rx=${RADIUS}></rect>
        ${icon ? svg`<g transform="translate(${PAD} ${middle - ICON_SIZE / 2}) scale(${ICON_SCALE})"><path class="icon on-band" d=${icon}></path></g>` : ''}
        ${lines('label', sentence, top)}
        ${lines('note', aside, noteTop)}
      </g>
    </svg>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'deck-scene-band': DeckSceneBand;
  }
}
