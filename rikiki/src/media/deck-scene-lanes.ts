// ════════════════════════════════════════════════════════════════
// <deck-scene-lanes gate="STOP" trigger="a drill flips the switch" passed="3" blocked="3">
//   <deck-scene-item icon="code" label="API" tag="3 served, 3 refused"></deck-scene-item>
//   <deck-scene-item icon="clock" label="Jobs" tag="3 served, 3 held"></deck-scene-item>
//   <deck-scene-item icon="database" label="Service" note="batch"
//     tag="3 served, 3 held"></deck-scene-item>
// </deck-scene-lanes>
//
// What happens when one thing changes · several lanes carry the same traffic, a
// gate comes down across all of them, and what was still on its way stops
// against it. A kill switch, a deploy freeze, a rate limit, a closed account.
//
// The story is told in time: tokens run down every lane, the gate drops after
// the last one that passes, and the others queue against it. At rest · overview,
// print, PDF, reduced motion · the picture is the end state: the gate down, the
// served tokens on the far side, the refused ones in a queue.
//
// Items are the lanes (2 to 5): an icon, a label, a note under it, and a `tag`
// at the end of the lane, past the gate, which says how it ended.
//
// Scene attributes:
//   gate     · the word on the gate ("STOP")
//   trigger  · what brought it down, written above the lanes
//   passed   · tokens per lane that get through before it comes down (0 to 8, default 3)
//   blocked  · tokens per lane that are stopped by it (0 to 8, default 3)
//
// OPT-IN · <script type="module" src="dist/deck-scene-lanes.js"></script>
//
// Item attributes read: label, note, icon, tag.
//
// Tokens (override on `:host` to retheme one instance):
//   --deck-scene-card-bg / --deck-scene-card-stroke / --deck-scene-emphasis-bg
//   --deck-scene-emphasis-text / --deck-scene-muted / --deck-scene-tag
//   --deck-scene-icon / --deck-scene-line
// ════════════════════════════════════════════════════════════════

import { css, html, svg, unsafeCSS } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { iconPath } from '../shared/icon-set.js';
import './deck-scene-item.js';
import {
  CLOSE_DURATION,
  DEFAULT_BLOCKED,
  DEFAULT_PASSED,
  type Frame,
  HEADER_GAP,
  TOKEN_RADIUS,
  gateCloses,
  laneTokens,
  lanesFrame,
  readCount,
  triggerSpan,
} from './deck-scene-lanes-layout.js';
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
const AFTER_ICON = 24;
/** A lane's label and note keep to one line each, and this much width. */
const MAX_LANE_TEXT = 360;
const MAX_TAG = 360;
const MAX_GATE_LABEL = 280;
const ARROW_HEAD = 12;
const GATE_RADIUS = 12;
/** The label ends above the lane's centre and its note starts below it. */
const LABEL_NOTE_GAP = 12;

interface Lane {
  label: Fitted;
  note: Fitted;
  tag: Fitted;
  icon: string | null;
  name: string;
}

@customElement('deck-scene-lanes')
export class DeckSceneLanes extends SceneElement {
  static override styles = [
    sceneStyles,
    css`
      /* The tokens rest where they end · the animation brings them from the start
         of the lane, so the final state needs no animation at all. */
      .dot {
        fill: var(--deck-scene-line, var(--rik-text-default));
        transform-box: fill-box;
      }
      .dot.blocked {
        fill: var(--deck-scene-emphasis-bg, var(--rik-accent));
      }
      .gate {
        transform-box: fill-box;
        transform-origin: top;
      }
      :host([playing]) .dot {
        animation: lanes-arrive var(--du, 0.8s) cubic-bezier(0.2, 0.7, 0.3, 1) calc(var(--t0, 0s) + var(--scene-delay, 0s)) both;
      }
      :host([playing]) .gate {
        animation: lanes-close ${unsafeCSS(CLOSE_DURATION)}s cubic-bezier(0.3, 0, 0.2, 1) calc(var(--t0, 0s) + var(--scene-delay, 0s)) both;
      }
      @keyframes lanes-arrive {
        from { opacity: 0; transform: translateX(var(--back, 0)); }
        10% { opacity: 1; }
        to { opacity: 1; transform: translateX(0); }
      }
      @keyframes lanes-close {
        from { opacity: 0.2; transform: scaleY(0.05); }
        to { opacity: 1; transform: scaleY(1); }
      }
      @media (prefers-reduced-motion: reduce), print {
        :host([playing]) :is(.dot, .gate) {
          animation: none;
        }
      }
    `,
  ];

  @property({ type: String }) gate?: string;
  @property({ type: String }) trigger?: string;
  @property({ type: String }) passed?: string;
  @property({ type: String }) blocked?: string;

  override render() {
    const items = this.items.slice(0, SCENE_LIMITS.lanes.max);
    if (!items.length) {
      this.reportOverflow([]);
      return html``;
    }
    const label = measurerFor(this, TYPE.label.weight);
    const note = measurerFor(this, TYPE.note.weight);
    const tag = measurerFor(this, TYPE.tag.weight);
    const lanes = items.map((item) => this.lane(item, label, note, tag));
    const hasIcon = lanes.some((lane) => lane.icon);
    const iconRoom = hasIcon ? ICON_SIZE + AFTER_ICON : 0;
    const gateLabel = fitText(this.gate ?? '', MAX_GATE_LABEL, 1, TYPE.tag.size, tag);

    const frame = lanesFrame({
      lanes: lanes.length,
      hasHeader: !!(this.gate || this.trigger),
      hasNotes: lanes.some((lane) => lane.note.lines.length > 0),
      labelWidth: iconRoom + Math.max(...lanes.map((lane) => textWidth(lane, label, note))),
      tagWidth: Math.max(...lanes.map((lane) => lineWidth(lane.tag, tag))),
      width: this.width,
    });
    const trigger = this.triggerText(frame, gateLabel, note);

    const passed = readCount(this.passed, DEFAULT_PASSED).value;
    const blocked = readCount(this.blocked, DEFAULT_BLOCKED).value;
    const tokens = lanes.map((_, i) => laneTokens(passed, blocked, frame, i, lanes.length));
    const closesAt = gateCloses(tokens);

    this.reportOverflow([
      ...lanes.flatMap((lane) =>
        misfits(lane.name, { label: lane.label, note: lane.note, tag: lane.tag }),
      ),
      ...misfits('gate', { gate: gateLabel }),
      ...misfits('trigger', { trigger: trigger.fitted }),
    ]);

    return html`<svg viewBox=${sceneViewBox(frame.height, this.width)} role="img" aria-label=${this.describe(lanes, passed, blocked)} part="drawing">
      ${trigger.draw(frame.headerY)}
      ${gateLabel.lines.map(
        (
          line,
        ) => svg`<text class="tag fade" style="--t0:${closesAt}s" x=${frame.gate.centre} y=${frame.headerY + (gateLabel.size * BASELINE) / 2}
          text-anchor="middle" font-size=${gateLabel.size} font-weight=${TYPE.tag.weight}>${line}</text>`,
      )}
      ${lanes.map((lane, i) => this.laneRow(lane, frame.laneYs[i] ?? 0, frame, iconRoom))}
      ${
        passed + blocked > 0 || this.gate
          ? svg`<rect class="gate emphasis" style="--t0:${closesAt}s" x=${frame.gate.x} y=${frame.gate.y}
              width=${frame.gate.width} height=${frame.gate.height} rx=${GATE_RADIUS}></rect>`
          : ''
      }
      ${lanes.map((_, i) =>
        (tokens[i] ?? []).map(
          (
            token,
          ) => svg`<circle class="dot ${token.kind}" cx=${token.x} cy=${frame.laneYs[i] ?? 0} r=${TOKEN_RADIUS}
            style="--back:${token.back}px;--du:${token.duration}s;--t0:${token.delay}s"></circle>`,
        ),
      )}
    </svg>`;
  }

  private lane(
    item: HTMLElement,
    label: ReturnType<typeof measurerFor>,
    note: ReturnType<typeof measurerFor>,
    tag: ReturnType<typeof measurerFor>,
  ): Lane {
    const icon = iconPath(item.getAttribute('icon'));
    const room = MAX_LANE_TEXT - (icon ? ICON_SIZE + AFTER_ICON : 0);
    return {
      icon,
      name: item.getAttribute('label') ?? '',
      label: fitText(item.getAttribute('label') ?? '', room, 1, TYPE.label.size, label),
      note: fitText(item.getAttribute('note') ?? '', room, 1, TYPE.note.size, note),
      tag: fitText(item.getAttribute('tag') ?? '', MAX_TAG, 1, TYPE.tag.size, tag),
    };
  }

  /** The trigger sits on the left of the header, as wide as the gate's label
   *  leaves it, with a dashed connector running on to the gate. */
  private triggerText(frame: Frame, gateLabel: Fitted, note: ReturnType<typeof measurerFor>) {
    const trackLeft = frame.trackLeft;
    const { room, tip } = triggerSpan(
      frame,
      lineWidth(gateLabel, measurerFor(this, TYPE.tag.weight)),
    );
    const fitted = fitText(this.trigger ?? '', room, 1, TYPE.note.size, note);
    const width = lineWidth(fitted, note);
    const draw = (centreY: number) =>
      fitted.lines.length
        ? svg`<text class="note fade" x=${trackLeft} y=${centreY + (fitted.size * BASELINE) / 2}
            font-size=${fitted.size} font-weight=${TYPE.note.weight}>${fitted.lines[0]}</text>
          <path class="line muted dash fade" d="M${trackLeft + width + HEADER_GAP} ${centreY}H${tip}"></path>
          <path class="line muted fade" d="M${tip - ARROW_HEAD} ${centreY - ARROW_HEAD / 2}L${tip} ${centreY}L${tip - ARROW_HEAD} ${centreY + ARROW_HEAD / 2}"></path>`
        : '';
    return { fitted, draw };
  }

  private laneRow(lane: Lane, y: number, frame: Frame, textLeft: number) {
    const hasNote = lane.note.lines.length > 0;
    const labelBase = hasNote ? y - LABEL_NOTE_GAP / 2 : y + (lane.label.size * BASELINE) / 2 - 2;
    const head = frame.trackRight;
    return svg`<g class="pop">
      ${lane.icon ? svg`<g transform="translate(0 ${y - ICON_SIZE / 2}) scale(${ICON_SCALE})"><path class="icon" d=${lane.icon}></path></g>` : ''}
      ${lane.label.lines.map(
        // Anchor each font box at its side of the gap. Fallback fonts can have
        // taller ascenders/descenders than the theme's face.
        (line) => svg`<text class="label" x=${textLeft} y=${labelBase}
          dominant-baseline=${hasNote ? 'text-after-edge' : 'alphabetic'}
          font-size=${lane.label.size} font-weight=${TYPE.label.weight}>${line}</text>`,
      )}
      ${lane.note.lines.map(
        (line) => svg`<text class="note" x=${textLeft} y=${y + LABEL_NOTE_GAP / 2}
          dominant-baseline="text-before-edge"
          font-size=${lane.note.size} font-weight=${TYPE.note.weight}>${line}</text>`,
      )}
      <path class="line muted" d="M${frame.trackLeft} ${y}H${head}M${head - ARROW_HEAD} ${y - ARROW_HEAD / 2}L${head} ${y}L${head - ARROW_HEAD} ${y + ARROW_HEAD / 2}"></path>
      ${
        frame.tagX !== null
          ? lane.tag.lines.map(
              (
                line,
              ) => svg`<text class="tag" x=${frame.tagX} y=${y + (lane.tag.size * BASELINE) / 2 - 2}
                font-size=${lane.tag.size} font-weight=${TYPE.tag.weight}>${line}</text>`,
            )
          : ''
      }
    </g>`;
  }

  private describe(lanes: Lane[], passed: number, blocked: number): string {
    const story = `${passed} per lane get through, then the gate${this.gate ? ` ${this.gate}` : ''} comes down and ${blocked} are stopped`;
    const names = lanes.map((lane) =>
      [lane.name, lane.tag.lines.join(' ')].filter(Boolean).join(': '),
    );
    return [this.trigger, `${names.join('; ')}`, story].filter(Boolean).join('. ');
  }
}

/** The width of a fitted single line, in the font it was fitted with. */
function lineWidth(fitted: Fitted, measure: ReturnType<typeof measurerFor>): number {
  return fitted.lines.length ? measure(fitted.size)(fitted.lines[0] ?? '') : 0;
}

/** The wider of a lane's label and note, each in its own font. */
function textWidth(
  lane: Lane,
  label: ReturnType<typeof measurerFor>,
  note: ReturnType<typeof measurerFor>,
): number {
  return Math.max(lineWidth(lane.label, label), lineWidth(lane.note, note));
}

declare global {
  interface HTMLElementTagNameMap {
    'deck-scene-lanes': DeckSceneLanes;
  }
}
