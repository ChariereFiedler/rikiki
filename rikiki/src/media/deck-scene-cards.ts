// ════════════════════════════════════════════════════════════════
// <deck-scene-cards>
//   <deck-scene-item icon="target" label="MCP" tag="safe bet" emphasis
//     note="one connector for every assistant"></deck-scene-item>
//   <deck-scene-item icon="cloud" label="UCP" tag="publish too"
//     note="real volume, but American"></deck-scene-item>
//   <deck-scene-item icon="ban" label="AP2" tag="too early"
//     note="no production deployment found"></deck-scene-item>
// </deck-scene-cards>
//
// Two to five equal cards across the width · options side by side, roles, the
// three things a slide compares. Each card: an icon, a label, a note wrapped to
// the card, a tag at the bottom. Every card takes the height of the fullest one,
// so the row lines up without anyone moving a coordinate.
//
// One card may carry `emphasis` · the one the slide argues for, filled with the
// accent. More than one emphasis is no emphasis.
//
// OPT-IN · <script type="module" src="dist/deck-scene-cards.js"></script>
//
// Item attributes read: icon, label, note, tag, emphasis.
//
// Tokens (override on `:host` to retheme one instance):
//   --deck-scene-card-bg / --deck-scene-card-stroke / --deck-scene-emphasis-bg
//   --deck-scene-emphasis-text / --deck-scene-muted / --deck-scene-tag / --deck-scene-icon
// ════════════════════════════════════════════════════════════════

import { html, svg } from 'lit';
import { customElement } from 'lit/decorators.js';
import { iconPath } from '../shared/icon-set.js';
import './deck-scene-item.js';
import {
  BASELINE,
  GAP,
  PAD,
  SCENE_LIMITS,
  SceneElement,
  TYPE,
  type Fitted,
  columns,
  fitText,
  measurerFor,
  misfits,
  sceneStyles,
  sceneViewBox,
} from './scene-kit.js';

const MAX_CARDS = SCENE_LIMITS.cards.max;
const ICON_SIZE = 48;
const ICON_SCALE = ICON_SIZE / 24;
const AFTER_ICON = 28;
const AFTER_LABEL = 14;
const BEFORE_TAG = 24;
const LABEL_LINES = 2;
const NOTE_LINES = 3;
const STAGGER = 0.15;

interface Card {
  label: Fitted;
  note: Fitted;
  tag: Fitted;
  icon: string | null;
  emphasis: boolean;
  name: string;
}

@customElement('deck-scene-cards')
export class DeckSceneCards extends SceneElement {
  static override styles = sceneStyles;

  override render() {
    const items = this.items.slice(0, MAX_CARDS);
    const { width: cardWidth, xs } = columns(items.length, GAP, this.width);
    const inner = cardWidth - 2 * PAD;
    const label = measurerFor(this, TYPE.label.weight);
    const note = measurerFor(this, TYPE.note.weight);
    const tag = measurerFor(this, TYPE.tag.weight);

    const cards: Card[] = items.map((item) => ({
      label: fitText(item.getAttribute('label') ?? '', inner, LABEL_LINES, TYPE.label.size, label),
      note: fitText(item.getAttribute('note') ?? '', inner, NOTE_LINES, TYPE.note.size, note),
      tag: fitText(item.getAttribute('tag') ?? '', inner, 1, TYPE.tag.size, tag),
      icon: iconPath(item.getAttribute('icon')),
      emphasis: item.hasAttribute('emphasis'),
      name: item.getAttribute('label') ?? '',
    }));

    const hasIcon = cards.some((card) => card.icon);
    const hasTag = cards.some((card) => card.tag.lines.length);
    const contentTop = PAD + (hasIcon ? ICON_SIZE + AFTER_ICON : 0);
    const bodyHeight = Math.max(
      0,
      ...cards.map(
        (card) =>
          card.label.lines.length * TYPE.label.line +
          (card.note.lines.length ? AFTER_LABEL + card.note.lines.length * TYPE.note.line : 0),
      ),
    );
    const height = contentTop + bodyHeight + (hasTag ? BEFORE_TAG + TYPE.tag.line : 0) + PAD;

    this.reportOverflow(
      cards.flatMap((card) =>
        misfits(card.name, { label: card.label, note: card.note, tag: card.tag }, inner),
      ),
    );

    return html`<svg
      viewBox=${sceneViewBox(height, this.width)}
      role="img"
      aria-label=${cards.map((card) => [card.name, card.note.lines.join(' '), card.tag.lines.join(' ')].filter(Boolean).join(', ')).join('. ')}
      part="drawing"
    >
      ${cards.map((card, index) => this.card(card, xs[index] ?? 0, cardWidth, height, contentTop, index))}
    </svg>`;
  }

  private card(
    card: Card,
    x: number,
    width: number,
    height: number,
    contentTop: number,
    index: number,
  ) {
    const on = card.emphasis ? 'on-emphasis' : '';
    const text = (role: 'label' | 'note' | 'tag', fitted: Fitted, top: number) =>
      fitted.lines.map(
        (line, i) => svg`<text
          class="${role} ${on}"
          x=${x + PAD}
          y=${top + i * TYPE[role].line + fitted.size * BASELINE}
          font-size=${fitted.size}
          font-weight=${TYPE[role].weight}
        >${line}</text>`,
      );
    const noteTop = contentTop + card.label.lines.length * TYPE.label.line + AFTER_LABEL;
    const tagTop = height - PAD - TYPE.tag.line;
    return svg`<g class="pop" style="--t0:${0.1 + index * STAGGER}s">
      <rect class=${card.emphasis ? 'emphasis' : 'card'} x=${x} y="0" width=${width} height=${height} rx="16"></rect>
      ${card.icon ? svg`<g transform="translate(${x + PAD} ${PAD}) scale(${ICON_SCALE})"><path class="icon ${on}" d=${card.icon}></path></g>` : ''}
      ${text('label', card.label, contentTop)}
      ${text('note', card.note, noteTop)}
      ${text('tag', card.tag, tagTop)}
    </g>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'deck-scene-cards': DeckSceneCards;
  }
}
