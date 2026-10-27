// ════════════════════════════════════════════════════════════════
// <deck-scene-flow>
//   <deck-scene-item icon="document" label="Product file"
//     note="price, stock and specifications"></deck-scene-item>
//   <deck-scene-item icon="search" label="Pages and reviews"
//     note="what the web says about it"></deck-scene-item>
//   <deck-scene-item icon="code" label="Connector" note="live data on demand"></deck-scene-item>
//   <deck-scene-item icon="spark" label="The assistant" emphasis
//     note="reads, compares, picks"></deck-scene-item>
//   <deck-scene-item icon="target" label="2 or 3 retailers" tag="cited"
//     note="the rest are not seen"></deck-scene-item>
// </deck-scene-flow>
//
// How it works · a few sources feed one hub, and the hub produces an outcome.
// The sources merge on a bracket into a single arrow, because the point of the
// slide is that they end up in one place; a token then travels the arrows, in
// and out, so the room reads the direction before the words.
//
// ROLES COME FROM ORDER · the item with `emphasis` is the hub, the items before
// it are the sources (1 to 4, stacked on the left), the items after it are the
// outcomes (1 or 2, stacked on the right). Without an emphasis the last item is
// the hub and there is no outcome column. Extra sources or outcomes are ignored.
//
// Each box: an icon, a label (up to two lines), a note (up to two lines). A
// `tag` on an outcome is drawn on the arrow into it, in the accent.
//
// OPT-IN · <script type="module" src="dist/deck-scene-flow.js"></script>
//
// Item attributes read: icon, label, note, emphasis, tag (outcomes only).
//
// Tokens (override on `:host` to retheme one instance):
//   --deck-scene-card-bg / --deck-scene-card-stroke / --deck-scene-emphasis-bg
//   --deck-scene-emphasis-text / --deck-scene-muted / --deck-scene-tag
//   --deck-scene-icon / --deck-scene-line
// ════════════════════════════════════════════════════════════════

import { html, svg } from 'lit';
import { customElement } from 'lit/decorators.js';
import { iconPath } from '../shared/icon-set.js';
import './deck-scene-item.js';
import {
  type Span,
  flowColumns,
  flowRoles,
  hubHeight,
  stackHeight,
  stackTops,
} from './deck-scene-flow-layout.js';
import {
  BASELINE,
  PAD,
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
/** Below the icon in the hub, beside it in a source or an outcome · a stacked
 *  box is wide and short, the hub is narrow and stands out by its height. */
const AFTER_ICON = 28;
const BESIDE_ICON = 24;
const AFTER_LABEL = 14;
const LABEL_LINES = 2;
const NOTE_LINES = 2;
const RADIUS = 16;

/** An arrowhead is two strokes, like the line it ends · and its tip stops short
 *  of the box, so the head reads as pointing at the box rather than drawn on it. */
const ARROW_HEAD = 12;
const ARROW_CLEARANCE = 16;
const TOKEN_RADIUS = 8;
/** A tag sits this far above the arrow it labels · clear of the stroke and of the
 *  head, which rises ARROW_HEAD above the line, or the tag's last letters touch its tip. */
const TAG_LIFT = ARROW_HEAD + 10;

/** The order the room reads it in · sources, then the merge, then the hub,
 *  then what comes out. Everything ends before 2.5 s. */
const TIMING = Object.freeze({
  source: 0.1,
  sourceStagger: 0.12,
  linesIn: 0.5,
  hub: 0.55,
  feedToken: 0.7,
  feedTokenDuration: 0.5,
  hubToken: 1.15,
  hubTokenDuration: 0.5,
  linesOut: 1.5,
  outcome: 1.6,
  outcomeStagger: 0.12,
  outToken: 1.65,
  outTokenDuration: 0.6,
});

interface Box {
  label: Fitted;
  note: Fitted;
  tag: Fitted;
  icon: string | null;
  /** Whether any box of its column has an icon · the words of a column start at
   *  the same x and the boxes keep the same height, icon or not. */
  iconRoom: boolean;
  role: Role;
  name: string;
}

interface Placed {
  box: Box;
  x: number;
  y: number;
  width: number;
  height: number;
}

type Role = 'source' | 'hub' | 'outcome';

@customElement('deck-scene-flow')
export class DeckSceneFlow extends SceneElement {
  static override styles = sceneStyles;

  override render() {
    const roles = flowRoles(this.items, (item) => item.hasAttribute('emphasis'));
    if (!roles.hub) {
      this.reportOverflow([]);
      return html``;
    }
    const columns = flowColumns(roles.sources.length > 0, roles.outcomes.length > 0, this.width);
    const tagWidth = columns.link - 2 * ARROW_CLEARANCE;

    const sources = this.boxes(roles.sources, columns.sources, 'source', tagWidth);
    const hubs = this.boxes([roles.hub], columns.hub, 'hub', tagWidth);
    const outcomes = this.boxes(roles.outcomes, columns.outcomes, 'outcome', tagWidth);
    const hub = hubs[0];
    if (!hub) return html``;

    const sourceHeight = columnBoxHeight(sources);
    const outcomeHeight = columnBoxHeight(outcomes);
    const hubBoxHeight = hubHeight(columnBoxHeight(hubs), outcomeHeight, outcomes.length);
    const height = Math.max(
      stackHeight(sources.length, sourceHeight),
      hubBoxHeight,
      stackHeight(outcomes.length, outcomeHeight),
    );
    const centre = height / 2;

    const placedSources = this.place(sources, columns.sources, sourceHeight, centre);
    const placedOutcomes = this.place(outcomes, columns.outcomes, outcomeHeight, centre);
    const placedHub: Placed = {
      box: hub,
      x: columns.hub.x,
      y: centre - hubBoxHeight / 2,
      width: columns.hub.width,
      height: hubBoxHeight,
    };

    const all = [...sources, hub, ...outcomes];
    this.reportOverflow(
      all.flatMap((box) => misfits(box.name, { label: box.label, note: box.note, tag: box.tag })),
    );

    return html`<svg viewBox=${sceneViewBox(height, this.width)} role="img" aria-label=${this.describe(sources, hub, outcomes)} part="drawing">
      ${this.merge(placedSources, placedHub, centre)}
      ${this.split(placedHub, placedOutcomes)}
      ${placedSources.map((placed, i) => this.box(placed, TIMING.source + i * TIMING.sourceStagger))}
      ${this.box(placedHub, TIMING.hub)}
      ${placedOutcomes.map((placed, i) => this.box(placed, TIMING.outcome + i * TIMING.outcomeStagger))}
    </svg>`;
  }

  /** Measure and wrap each item's words to the room its column leaves them. */
  private boxes(items: HTMLElement[], span: Span | null, role: Role, tagWidth: number): Box[] {
    if (!span) return [];
    const label = measurerFor(this, TYPE.label.weight);
    const note = measurerFor(this, TYPE.note.weight);
    const tag = measurerFor(this, TYPE.tag.weight);
    // A tag lives on the arrow into an outcome · elsewhere it has nowhere to go.
    const tagOf = (item: HTMLElement) =>
      role === 'outcome' ? (item.getAttribute('tag') ?? '') : '';
    const iconRoom = items.some((item) => iconPath(item.getAttribute('icon')));
    const inner = span.width - 2 * PAD - (iconRoom && role !== 'hub' ? ICON_SIZE + BESIDE_ICON : 0);
    return items.map((item) => ({
      iconRoom,
      role,
      label: fitText(item.getAttribute('label') ?? '', inner, LABEL_LINES, TYPE.label.size, label),
      note: fitText(item.getAttribute('note') ?? '', inner, NOTE_LINES, TYPE.note.size, note),
      tag: fitText(tagOf(item), tagWidth, 1, TYPE.tag.size, tag),
      icon: iconPath(item.getAttribute('icon')),
      name: item.getAttribute('label') ?? '',
    }));
  }

  private place(boxes: Box[], span: Span | null, height: number, centre: number): Placed[] {
    if (!span) return [];
    const tops = stackTops(boxes.length, height, centre);
    return boxes.map((box, i) => ({ box, x: span.x, y: tops[i] ?? 0, width: span.width, height }));
  }

  /** The merge bracket · a line from each source to a shared bus, then one
   *  arrow into the hub. One source needs no bus: its line runs straight in. */
  private merge(sources: Placed[], hub: Placed, centre: number) {
    const first = sources[0];
    if (!first) return '';
    const sourceEdge = first.x + first.width;
    const bus = sourceEdge + (hub.x - sourceEdge) / 2;
    const middles = sources.map(middle);
    const busTop = Math.min(centre, ...middles);
    const busBottom = Math.max(centre, ...middles);
    const tip = hub.x - ARROW_CLEARANCE;
    const lines = `--t0:${TIMING.linesIn}s`;
    return svg`
      ${middles.map((y) => svg`<path class="line fade" style=${lines} d="M${sourceEdge} ${y}H${bus}"></path>`)}
      ${busBottom > busTop ? svg`<path class="line fade" style=${lines} d="M${bus} ${busTop}V${busBottom}"></path>` : ''}
      ${arrow(bus, tip, centre, lines)}
      ${middles.map((y) => token(sourceEdge, bus, y, TIMING.feedToken, TIMING.feedTokenDuration))}
      ${token(bus, tip, centre, TIMING.hubToken, TIMING.hubTokenDuration)}
    `;
  }

  /** One straight arrow out of the hub at the height of each outcome · the hub
   *  was made tall enough for all of them to leave from its side. */
  private split(hub: Placed, outcomes: Placed[]) {
    const start = hub.x + hub.width;
    const lines = `--t0:${TIMING.linesOut}s`;
    return outcomes.map((placed, i) => {
      const y = middle(placed);
      const tip = placed.x - ARROW_CLEARANCE;
      const tag = placed.box.tag;
      return svg`
        ${arrow(start, tip, y, lines)}
        ${tag.lines.map(
          (line) => svg`<text
            class="tag fade"
            style=${lines}
            x=${start + (placed.x - start) / 2}
            y=${y - TAG_LIFT}
            text-anchor="middle"
            font-size=${tag.size}
            font-weight=${TYPE.tag.weight}
          >${line}</text>`,
        )}
        ${token(start, tip, y, TIMING.outToken + i * TIMING.outcomeStagger, TIMING.outTokenDuration)}
      `;
    });
  }

  private box(placed: Placed, t0: number) {
    const { box, x, y, width, height } = placed;
    const isHub = box.role === 'hub';
    const on = isHub ? 'on-emphasis' : '';
    const beside = !isHub && box.iconRoom;
    const top = y + (height - contentHeight(box)) / 2;
    // A short text beside the icon is centred on it, a long one starts level with it.
    const textTop = beside
      ? top + Math.max(0, (ICON_SIZE - textBlockHeight(box)) / 2)
      : top + (box.iconRoom ? ICON_SIZE + AFTER_ICON : 0);
    const textX = x + PAD + (beside ? ICON_SIZE + BESIDE_ICON : 0);
    const text = (field: 'label' | 'note', fitted: Fitted, from: number) =>
      fitted.lines.map(
        (line, i) => svg`<text
          class="${field} ${on}"
          x=${textX}
          y=${from + i * TYPE[field].line + fitted.size * BASELINE}
          font-size=${fitted.size}
          font-weight=${TYPE[field].weight}
        >${line}</text>`,
      );
    const noteTop = textTop + box.label.lines.length * TYPE.label.line + AFTER_LABEL;
    return svg`<g class="pop" style="--t0:${t0}s">
      <rect class=${isHub ? 'emphasis' : 'card'} x=${x} y=${y} width=${width} height=${height} rx=${RADIUS}></rect>
      ${box.icon ? svg`<g transform="translate(${x + PAD} ${top}) scale(${ICON_SCALE})"><path class="icon ${on}" d=${box.icon}></path></g>` : ''}
      ${text('label', box.label, textTop)}
      ${text('note', box.note, noteTop)}
    </g>`;
  }

  private describe(sources: Box[], hub: Box, outcomes: Box[]): string {
    const say = (box: Box) =>
      [box.name, box.note.lines.join(' '), box.tag.lines.join(' ')].filter(Boolean).join(', ');
    return [
      sources.length ? `From ${sources.map(say).join('; ')}` : '',
      `to ${say(hub)}`,
      outcomes.length ? `giving ${outcomes.map(say).join('; ')}` : '',
    ]
      .filter(Boolean)
      .join(', ');
  }
}

function middle(placed: Placed): number {
  return placed.y + placed.height / 2;
}

function textBlockHeight(box: Box): number {
  const note = box.note.lines.length ? AFTER_LABEL + box.note.lines.length * TYPE.note.line : 0;
  return box.label.lines.length * TYPE.label.line + note;
}

/** The hub puts its icon above the words, a stacked box beside them. */
function contentHeight(box: Box): number {
  const text = textBlockHeight(box);
  if (!box.iconRoom) return text;
  return box.role === 'hub' ? ICON_SIZE + AFTER_ICON + text : Math.max(ICON_SIZE, text);
}

/** The height every box of a column takes · the fullest one's, so the column
 *  is a stack of equal boxes. */
function columnBoxHeight(boxes: Box[]): number {
  return boxes.length ? 2 * PAD + Math.max(...boxes.map(contentHeight)) : 0;
}

/** A horizontal line ending in a two-stroke head at `tip`. */
function arrow(from: number, tip: number, y: number, style: string) {
  return svg`<path class="line fade" style=${style}
    d="M${from} ${y}H${tip}M${tip - ARROW_HEAD} ${y - ARROW_HEAD}L${tip} ${y}L${tip - ARROW_HEAD} ${y + ARROW_HEAD}"></path>`;
}

/** A dot that travels from `from` to `to` along a horizontal line · at rest it
 *  is invisible, so the final state shows the arrows only. */
function token(from: number, to: number, y: number, t0: number, duration: number) {
  const start = from + TOKEN_RADIUS;
  const distance = to - TOKEN_RADIUS - start;
  return svg`<circle class="token" cx=${start} cy=${y} r=${TOKEN_RADIUS}
    style="--dx:${distance}px;--dy:0px;--du:${duration}s;--t0:${t0}s"></circle>`;
}

declare global {
  interface HTMLElementTagNameMap {
    'deck-scene-flow': DeckSceneFlow;
  }
}
