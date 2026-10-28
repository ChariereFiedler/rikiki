// ════════════════════════════════════════════════════════════════
// <deck-scene-units total="200">
//   <deck-scene-item icon="team" label="200 users in nine months" value="200"
//     emphasis></deck-scene-item>
//   <deck-scene-item label="chose and tuned the right signal" value="0"
//     note="not one of them"></deck-scene-item>
// </deck-scene-units>
//
// One cell per person · a grid of `total` cells, the first `value` of them lit.
// Two grids of the same size side by side show a share without a percentage: 200
// users lit, and the same 200, with none lit. The eye counts cells before it
// reads a number, and the gap between two grids is the argument.
//
// Items are the panels (1 to 3), each its own grid of the same `total`:
//   label · the caption above the grid, with an `icon` before it when there is one
//   value · how many cells are lit, 0 to `total`
//   note  · one line under the grid
//   emphasis · the panel lit in the accent · the others are lit in ink
//
// The cells light down a column, then on to the next, so a count fills from the
// left like a bar. At rest · overview, print, PDF, reduced motion · every grid is
// complete.
//
// Scene attributes:
//   total   · cells per grid, 1 to 400 (default 100)
//   columns · cells per row · by default a landscape grid; the lint says when
//             the cells would be too small to count
//
// OPT-IN · <script type="module" src="dist/deck-scene-units.js"></script>
//
// Item attributes read: label, note, icon, value, emphasis.
//
// Tokens (override on `:host` to retheme one instance):
//   --deck-scene-emphasis-bg / --deck-scene-line / --deck-scene-card-stroke
//   --deck-scene-muted / --deck-scene-icon
// ════════════════════════════════════════════════════════════════

import { css, html, svg } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { iconPath } from '../shared/icon-set.js';
import './deck-scene-item.js';
import {
  DEFAULT_TOTAL,
  MAX_COLUMNS,
  MAX_TOTAL,
  PANEL_GAP,
  cellsOf,
  columnDelays,
  defaultColumns,
  gridFrame,
  panelWidth,
  readWhole,
} from './deck-scene-units-layout.js';
import {
  BASELINE,
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

const ICON_SIZE = 48;
const ICON_SCALE = ICON_SIZE / 24;
const AFTER_ICON = 20;
const LABEL_LINES = 2;
const NOTE_LINES = 2;
const AFTER_CAPTION = 28;
const BEFORE_NOTE = 20;
/** A cell is a rounded square · the corner as a share of the cell. */
const CORNER = 0.2;

interface Panel {
  label: Fitted;
  note: Fitted;
  icon: string | null;
  lit: number;
  emphasis: boolean;
  name: string;
}

@customElement('deck-scene-units')
export class DeckSceneUnits extends SceneElement {
  static override styles = [
    sceneStyles,
    css`
      .cell.on {
        fill: var(--deck-scene-line, var(--rik-text-default));
      }
      .cell.on.accent {
        fill: var(--deck-scene-emphasis-bg, var(--rik-accent));
      }
      .cell.off {
        fill: none;
        stroke: var(--deck-scene-card-stroke, var(--rik-border-default));
        stroke-width: 1.5;
      }
    `,
  ];

  @property({ type: String }) total?: string;
  @property({ type: String }) columns?: string;

  override render() {
    const items = this.items.slice(0, SCENE_LIMITS.units.max);
    if (!items.length) {
      this.reportOverflow([]);
      return html``;
    }
    const total = readWhole(this.total, DEFAULT_TOTAL, 1, MAX_TOTAL).value;
    const width = panelWidth(items.length, this.width);
    const columns = readWhole(this.columns, defaultColumns(total), 1, MAX_COLUMNS).value;
    const frame = gridFrame(total, columns, width);
    const cells = cellsOf(total, frame);

    const label = measurerFor(this, TYPE.label.weight);
    const note = measurerFor(this, TYPE.note.weight);
    // A grid is centred in its panel and the text starts at the grid's left edge ·
    // so the text has the panel's width less that inset, not the whole panel.
    const inset = (width - frame.width) / 2;
    // Every caption shifts right when one panel has an icon, so every caption is
    // fitted to what is left after it · not only the captions that carry one.
    const hasIcon = items.some((item) => iconPath(item.getAttribute('icon')));
    const panels = items.map((item) =>
      this.panel(item, total, width - inset, hasIcon, label, note),
    );
    const captionHeight =
      Math.max(
        hasIcon ? ICON_SIZE : 0,
        ...panels.map((panel) => panel.label.lines.length * TYPE.label.line),
      ) + AFTER_CAPTION;
    const noteHeight =
      Math.max(0, ...panels.map((panel) => panel.note.lines.length)) * TYPE.note.line;
    const height = captionHeight + frame.height + (noteHeight ? BEFORE_NOTE + noteHeight : 0);

    this.reportOverflow(panels.flatMap((p) => misfits(p.name, { label: p.label, note: p.note })));

    // A grid is no wider than its cells allow · centred in its panel, so one big
    // grid sits in the middle of the slide and two sit as a symmetrical pair.
    return html`<svg viewBox=${sceneViewBox(height, this.width)} role="img" aria-label=${this.describe(panels, total)} part="drawing">
      ${panels.map((panel, i) =>
        this.drawPanel(panel, i * (width + PANEL_GAP) + inset, i, {
          frame,
          cells,
          captionHeight,
          hasIcon,
        }),
      )}
    </svg>`;
  }

  private panel(
    item: HTMLElement,
    total: number,
    width: number,
    hasIcon: boolean,
    label: ReturnType<typeof measurerFor>,
    note: ReturnType<typeof measurerFor>,
  ): Panel {
    const icon = iconPath(item.getAttribute('icon'));
    const room = width - (hasIcon ? ICON_SIZE + AFTER_ICON : 0);
    // A value that is not a number lights nothing, one past the total fills the
    // grid · the lint names both, and the drawing stays whole.
    const written = Number(item.getAttribute('value'));
    const lit = Number.isFinite(written) ? Math.min(Math.max(0, Math.round(written)), total) : 0;
    return {
      icon,
      lit,
      name: item.getAttribute('label') ?? '',
      label: fitText(item.getAttribute('label') ?? '', room, LABEL_LINES, TYPE.label.size, label),
      note: fitText(item.getAttribute('note') ?? '', width, NOTE_LINES, TYPE.note.size, note),
      emphasis: item.hasAttribute('emphasis'),
    };
  }

  private drawPanel(
    panel: Panel,
    x: number,
    index: number,
    shared: {
      frame: ReturnType<typeof gridFrame>;
      cells: ReturnType<typeof cellsOf>;
      captionHeight: number;
      hasIcon: boolean;
    },
  ) {
    const { frame, cells, captionHeight, hasIcon } = shared;
    const textX = x + (hasIcon ? ICON_SIZE + AFTER_ICON : 0);
    const delays = columnDelays(frame.columns, index);
    const gridTop = captionHeight;
    const byColumn = Array.from({ length: frame.columns }, (_, c) =>
      cells.filter((cell) => cell.column === c),
    );
    const radius = frame.cell * CORNER;
    const captionTop = (ICON_SIZE - panel.label.lines.length * TYPE.label.line) / 2;
    return svg`<g>
      <g class="fade" style="--t0:${0.05 + index * 0.18}s">
        ${panel.icon ? svg`<g transform="translate(${x} 0) scale(${ICON_SCALE})"><path class="icon" d=${panel.icon}></path></g>` : ''}
        ${panel.label.lines.map(
          (line, i) => svg`<text class="label" x=${textX}
            y=${Math.max(0, captionTop) + i * TYPE.label.line + panel.label.size * BASELINE}
            font-size=${panel.label.size} font-weight=${TYPE.label.weight}>${line}</text>`,
        )}
      </g>
      <g transform="translate(${x} ${gridTop})">
        ${byColumn.map(
          (column, c) => svg`<g class="pop" style="--t0:${delays[c]}s">
            ${column.map(
              (
                cell,
              ) => svg`<rect class="cell ${cell.index < panel.lit ? (panel.emphasis ? 'on accent' : 'on') : 'off'}"
                x=${cell.x} y=${cell.y} width=${frame.cell} height=${frame.cell} rx=${radius}></rect>`,
            )}
          </g>`,
        )}
      </g>
      ${panel.note.lines.map(
        (line, i) => svg`<text class="note fade" style="--t0:${0.4 + index * 0.18}s" x=${x}
          y=${gridTop + frame.height + BEFORE_NOTE + i * TYPE.note.line + panel.note.size * BASELINE}
          font-size=${panel.note.size} font-weight=${TYPE.note.weight}>${line}</text>`,
      )}
    </g>`;
  }

  private describe(panels: Panel[], total: number): string {
    return panels
      .map((p) =>
        [`${p.name}: ${p.lit} of ${total}`, p.note.lines.join(' ')].filter(Boolean).join(', '),
      )
      .join('; ');
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'deck-scene-units': DeckSceneUnits;
  }
}
