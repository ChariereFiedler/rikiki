// ════════════════════════════════════════════════════════════════
// <deck-diagram layout="layers" direction="right">
//   <dg-box name="web" label="Web"></dg-box>
//   <dg-box name="api" label="API" emphasis></dg-box>
//   <dg-box name="db" label="Postgres" icon="database"></dg-box>
//   <dg-link from="web" to="api"></dg-link>
//   <dg-link from="api" to="db" label="SQL"></dg-link>
// </deck-diagram>
//
// An illustration written without a coordinate · marks (a box, a text, a dot, a
// bar, a link, a lane, a gate, a cursor, a meter, a queue, a curve) inside groups, and each
// group names how its children are placed: in a row or a column, on a grid, in
// layers (a graph), round a ring, as lanes that carry tokens, on an axis. The
// diagram measures every text in the deck's font, places everything, routes the
// links, puts each note beside what it points at, draws one SVG in theme tokens
// and plays its motion when the slide is entered, and on each click a mark waits
// for (`step`). With `dg-state`, each click is a picture of its own: what two
// pictures share by name moves from its place in one to its place in the next.
//
// It does not remove a mark, shorten a text or draw smaller type to make things
// fit. When the marks cannot be placed in the room, it draws them anyway and says
// so under `DG_NO_FIT`, with the number of marks that would fit.
//
// OPT-IN · <script type="module" src="dist/deck-diagram.js"></script>
//
// Root attributes: layout (row · column · grid · layers · ring · lanes · axis),
//   direction (right · down, for layers and axis), columns, align, gap (tight ·
//   normal · airy), paint, link (arrow · line: chain the children), bounds
//   ("800x500"), max-marks, balance · or intent (one of the sixteen of
//   diagram/intent-specs.ts: cause, barrier, feedback, threshold, partition…) and
//   also, which place the marks by their role (diagram/intent.ts) and prove the
//   drawing demonstrates it (INT_*, diagram/intent-prove.ts).
// Marks (every one also reads enter · after · step · role):
//   dg-box    · name label note tag icon value paint tone size emphasis (tone: one word per click)
//   dg-text   · name label note for side emphasis tone
//   dg-dot    · name count emphasis tone
//   dg-bar    · name label value from to tag emphasis tone
//   dg-link   · name from to label route dashed back flow speed
//   dg-group  · name label layout direction columns align gap paint tone weights wrap link
//   dg-lane   · name label note icon flow speed tone          (in layout="lanes")
//   dg-gate   · name label over at by state                   (in layout="lanes")
//   dg-cursor · name label value tone                         (in layout="axis")
//   dg-meter  · name label value max unit tone emphasis       (value, tone: one word per click)
//   dg-queue  · name label count fill tone emphasis           (fill, tone: one word per click)
//   dg-curve  · name label values ticks max unit threshold tone emphasis (a series, traced)
//   dg-state  · step · holds the marks of its place from that click on
// Marks that tell a story in their own words (diagram/marks.ts · they act on their beat):
//   dg-terminal · name label lines tone emphasis          (lines typed, one per line)
//   dg-table    · name label icon rows from swap strike paint tone emphasis
//   dg-switch   · name label state on off emphasis         (state: one word per click)
//   dg-status   · name for state label note side           (a disc beside its mark)
//   dg-timer    · name label value unit tone emphasis      (a ring that fills)
//   dg-band     · name label note from to cut until tag brace tone steady emphasis
//   dg-person   · name label count absent tone emphasis
//   dg-screen   · name label note count emphasis           (a page in a browser frame)
//   dg-counter  · name label value from unit tone emphasis (a figure that counts)
// The charts (diagram/charts.ts · swept or grown on their beat, else on entry):
//   dg-pie      · name label slices unit value note focus emphasis (parts of a whole)
//   dg-columns  · name label columns series max unit threshold focus emphasis
// A composition (compose="split|model-incident|body-axis|inset|dashboard", diagram/compose.ts):
//   dg-panel    · name label layout … paint · a sub-picture, its names local (panel.mark)
//   entity      · on any mark: the same object in several panels, which joins them
//   dg-camera   · focus to beat after with duration · frames a mark, then pulls back (diagram/camera.ts)
//                 zoom-from="slide-id/mark" · opens on the frame the slide before showed
// The motifs of a deck (diagram/act.ts, deck-motifs.ts), on the root:
//   acts act    · the strip of the act above the picture, and the step it stands at
//   pair        · the slide of the remedy an incident answers
//
// Tokens: the scenes' own (--deck-scene-card-bg, --deck-scene-emphasis-bg …).
// ════════════════════════════════════════════════════════════════

import { type PropertyValues, css, html, nothing, svg, unsafeCSS } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { keyed } from 'lit/directives/keyed.js';
import { iconPath } from '../shared/icon-set.js';
import {
  type Choreography,
  type Frame,
  RIDE_SPACING,
  cueIds,
  framesOf,
  itemEnter,
  lastChange,
  linkEnter,
  noteEnter,
  rideSeconds,
  runsShown,
} from './diagram/choreography.js';
import { ARROW_ROOM, REFUSE_SECONDS, TOKEN_RADIUS } from './diagram/lanes.js';
import {
  type DiagramLayout,
  type LBar,
  type LBox,
  type LCurve,
  type LCursor,
  type LDot,
  type LFrame,
  type LGate,
  type LItem,
  type LLane,
  type LLink,
  type LMeter,
  type LNote,
  type LQueue,
  type LSpan,
  type LText,
  type LayoutOptions,
  type Meter,
  atClick,
  gateStateAt,
  marksThatFit,
  textsOf,
} from './diagram/layout.js';
import { compileIntent, proveIntent } from './diagram/intent.js';
import {
  type DgIssue,
  type DgNode,
  MARK_ATTRIBUTES,
  MARK_TAGS,
  type ParsedDiagram,
  nameOf,
  parseDiagram,
  readZoomFrom,
  roleOf,
} from './diagram/model.js';
import {
  DIM_OPACITY,
  type StoryPlan,
  camerasOf,
  leverPivots,
  planStory,
  readSeconds,
  storyIds,
} from './diagram/story.js';
import {
  type Transition,
  morphIds,
  pictureOf,
  planTransition,
  transitionLinkEnter,
} from './diagram/morph.js';
import {
  ENTER_SECONDS,
  type Enter,
  type MotionIssue,
  type Timing,
  schedule,
} from './diagram/motion.js';
import { THRESHOLD_REACH } from './diagram/meter.js';
import { type Pen, drawPiece, drawStatus, piecesStyles } from './diagram/draw-marks.js';
import { type LPiece, PIECE_KINDS } from './diagram/marks.js';
import { takenPlaces } from './diagram/queue.js';
import { signatureOf } from './diagram/diagram-signature.js';
import { type Ink, arrowWings, growthFor, inkOf, unionOf, widthToGrow } from './diagram/growth.js';
import type { Point } from './diagram/types.js';
import {
  DIAGRAM_ROOM_HEIGHT,
  EDGE,
  SceneElement,
  TYPE,
  sceneStyles,
  sceneViewBox,
} from './scene-kit.js';
import {
  type CameraPlan,
  type Rect,
  type View as CameraView,
  planCamera,
  viewFrom,
} from './diagram/camera.js';
import {
  ACT_HEIGHT,
  ACT_STEPS,
  ACT_STRIP,
  ACT_TYPE,
  actIndex,
  layoutAct,
  readActs,
} from './diagram/act.js';
import type { Motif } from './deck-motifs.js';
import { measurerFor } from './scene-kit.js';
import type { Overflow, SceneIssue } from './scene-lint.js';

const BASELINE = 0.8;
const DOT_INSET = 0.1;
/** A bar's label and tag come in once the bar has grown this share of its way. */
const BAR_TEXT_AT = 0.4;
/** An arrow head appears when its line is this far drawn. */
const HEAD_AT = 0.8;
/** A drawn link's label comes in half way along. */
const LABEL_AT = 0.5;
/** The icon in a lane's disc takes this share of the disc. */
const DISC_ICON_SHARE = 0.5;
const GATE_RADIUS = 12;
const SPAN_RADIUS = 10;
/** The last point of a curve, and the point where it crosses its line, as dots this
 *  big · the crossing is what the picture is about, so it is the larger, and in the
 *  accent when the curve is the thing put forward. */
const CURVE_DOT = 9;
const CROSSING_DOT = 14;
/** The last point of a curve comes in once the trace has gone this far, the ground
 *  under it once it is half traced. */
const LAST_POINT_AT = 0.9;
const AREA_AT = 0.5;
/** The tones a stretch on an axis is filled in · `normal` keeps the pale card. */
const STRETCH_TONES: ReadonlySet<string> = new Set(['muted', 'ok', 'warn', 'danger']);
/** The icon in a disc takes this share of it. */
const STATE_ICON_SHARE = 0.56;
/** A surface that says its part is a panel · its corners are drawn tighter than a card's. */
const ROLE_RADIUS = 10;
/** A lever is this long from the mark it turns at. */
const LEVER_LENGTH = 64;
/** A story that loops waits this long on its last picture before it plays again. */
const LOOP_HOLD_MS = 1600;

/** `800x500` → { w: 800, h: 500 } · null when the attribute is absent or unusable. */
function readBounds(text: string | null): { w: number; h: number } | null {
  const match = /^\s*(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)\s*$/.exec(text ?? '');
  return match ? { w: Number(match[1]), h: Number(match[2]) } : null;
}

/** How far a picture moves so its ink is centred in the shared frame. */
function centring(ink: Ink | null, frame: Ink | null): Point {
  if (!ink || !frame) return { x: 0, y: 0 };
  return {
    x: (frame.x0 + frame.x1) / 2 - (ink.x0 + ink.x1) / 2,
    y: (frame.y0 + frame.y1) / 2 - (ink.y0 + ink.y1) / 2,
  };
}

/** A drawing laid out narrower to grow keeps its height, to this ratio · taller, it
 *  is another arrangement, not the same one drawn larger. */
const SAME_HEIGHT = 1.02;

/** Under this, a surface keeps its size from one picture to the next. */
const SAME_SIZE = 0.005;

/** What a mark draws, under its name · `rikiki check` reads `data-mark` to say which
 *  mark a finding is about and which of its attributes to change. `ground` is the
 *  surface it is drawn on (`groundClass`). */
const owned = (mark: string, kind: string, content: unknown, ground?: string) =>
  svg`<g data-mark=${mark} data-kind=${kind} class=${ground ?? nothing}>${content}</g>`;

/** The marks that bring their own surface, on which their words are set · on a dark
 *  panel they keep their ink. */
const SURFACED_PIECES: ReadonlySet<string> = new Set(['table', 'switch', 'terminal', 'screen']);

const hasSurface = (item: LItem | undefined): boolean =>
  !!item &&
  (item.kind === 'box' || item.kind === 'frame'
    ? item.paint !== 'none'
    : SURFACED_PIECES.has(item.kind));

/** The panel surface each node is drawn on · the paint of the nearest panel around it
 *  that paints one (pale unless it says another). Groups keep their marks as they are. */
function groundsOf(tree: DgNode[]): Map<DgNode, string> {
  const found = new Map<DgNode, string>();
  const walk = (nodes: DgNode[], ground: string | undefined) => {
    for (const node of nodes) {
      if (ground) found.set(node, ground);
      const paint = node.attrs.paint ?? 'pale';
      const own = node.kind === 'panel' && paint !== 'none' ? paint : ground;
      walk(node.children, own);
    }
  };
  walk(tree, undefined);
  return found;
}

/** Whether the drawing sets its labels in a column at its left by construction ·
 *  lanes (a label per row), an axis across, a chart in rows. Its weight leans left
 *  because of that column, and `check` judges its balance in height only. */
function leansAcross(attrs: Readonly<Record<string, string>>, tree: DgNode[]): boolean {
  const layout = attrs.layout ?? 'row';
  if (layout === 'lanes') return true;
  // Lanes stacked under the chain that drives them keep their labels at the left and
  // run into what they feed at the right, however the chain above is drawn.
  if (
    layout === 'column' &&
    tree.some((node) => node.kind === 'group' && node.attrs.layout === 'lanes')
  )
    return true;
  if (layout === 'axis') return attrs.direction !== 'down';
  const placed = tree.filter((node) => node.kind !== 'link');
  return layout === 'column' && placed.length > 0 && placed.every((node) => node.kind === 'bar');
}

/** What the words of a box sit on · the accent, the dark band, or a light surface. */
function fillUnder(paint: string, role: string | undefined): 'solid' | 'inverse' | null {
  if (role) return role === 'ink' ? 'inverse' : null;
  return paint === 'solid' ? 'solid' : paint === 'inverse' ? 'inverse' : null;
}

/** A link by its name, else by its ends. */
const linkName = (link: LLink) => link.node?.attrs.name || `${link.from} → ${link.to}`;

/** The class an entrance plays as · a line is traced, a surface grows from its start. */
const enterClass = (enter: Enter): string => (enter === 'draw' ? 'grow-x' : enter);

/** When something moves, as the style its animation reads. */
const at = (t: Timing | undefined) =>
  t ? `--t0:${t.start.toFixed(3)}s;--du:${t.duration.toFixed(3)}s` : '';

/** The last part of a movement · what comes in once a line is `share` drawn, and
 *  ends with it, so a head or a label never outlasts the time it was given. */
const tail = (t: Timing | undefined, share: number) =>
  t
    ? `--t0:${(t.start + t.duration * share).toFixed(3)}s;--du:${(t.duration * (1 - share)).toFixed(3)}s`
    : '';

/** The strip of the act · a rail, the steps behind in the ink of text, the step it
 *  is at in that ink circled by the accent (the accent is a mark, never a surface: on
 *  a pale page a disc of it would not be seen), the steps ahead as rings. */
const actStyles = css`
  svg.act {
    overflow: visible;
  }
  .act-rail {
    stroke: var(--deck-scene-card-stroke, var(--rik-border-default));
    stroke-width: ${unsafeCSS(ACT_STRIP.rail)};
    stroke-linecap: round;
  }
  .act-rail.act-reached {
    stroke: var(--deck-scene-line, var(--rik-text-default));
  }
  .act-station {
    fill: var(--deck-scene-line, var(--rik-text-default));
  }
  .act-station.act-todo {
    fill: var(--rik-surface-page, var(--rik-surface-raised));
    stroke: var(--deck-scene-muted, var(--rik-text-default--muted));
    stroke-width: 2.5;
  }
  .act-station.act-current {
    stroke: var(--deck-scene-emphasis-bg, var(--rik-accent));
    stroke-width: 5;
    paint-order: stroke;
  }
  .act-label {
    fill: var(--rik-text-default);
  }
  .act-label.act-todo {
    fill: var(--deck-scene-muted, var(--rik-text-default--muted));
  }
`;

/** The marks a diagram names · what a motif of the deck keeps from slide to slide. */
function namedMarks(tree: readonly DgNode[]): string[] {
  const found: string[] = [];
  const visit = (nodes: readonly DgNode[]) => {
    for (const node of nodes) {
      const drawn = node.kind !== 'link' && node.kind !== 'camera' && node.kind !== 'state';
      if (drawn && node.attrs.name) found.push(node.attrs.name);
      visit(node.children);
    }
  };
  visit(tree);
  return found;
}

@customElement('deck-diagram')
export class DeckDiagram extends SceneElement {
  static override styles = [
    sceneStyles,
    piecesStyles,
    actStyles,
    css`
      .frame-outline {
        fill: none;
        stroke: var(--deck-scene-card-stroke, var(--rik-border-default));
        stroke-width: 1.5;
      }
      .frame-soft {
        fill: var(--deck-scene-card-bg, var(--rik-surface-raised));
        stroke: none;
      }
      .frame-inverse {
        fill: var(--deck-scene-band-bg, var(--rik-surface-inverse));
      }
      .p-outline {
        fill: none;
        stroke: var(--deck-scene-card-stroke, var(--rik-border-default));
        stroke-width: 1.5;
      }
      .p-inverse {
        fill: var(--deck-scene-band-bg, var(--rik-surface-inverse));
        stroke: none;
      }
      .tone-ok {
        stroke: var(--rik-status-success, var(--rik-accent));
        stroke-width: 2.5;
      }
      .tone-warn {
        stroke: var(--rik-status-warn, var(--rik-accent));
        stroke-width: 2.5;
      }
      .tone-danger {
        stroke: var(--rik-status-danger, var(--rik-accent));
        stroke-width: 2.5;
      }
      .on-inverse {
        fill: var(--deck-scene-band-text, var(--rik-text-inverse));
      }
      .on-inverse.note {
        fill: var(--deck-scene-band-muted, var(--rik-text-inverse--muted));
      }
      .dot {
        fill: var(--rik-text-default);
        opacity: 0.85;
      }
      .dot.accent {
        fill: var(--deck-scene-emphasis-bg, var(--rik-accent));
        opacity: 1;
      }
      .dot.muted {
        fill: none;
        stroke: var(--deck-scene-card-stroke, var(--rik-border-default));
        stroke-width: 1.5;
        opacity: 1;
      }
      .bar {
        fill: var(--deck-scene-card-bg, var(--rik-surface-raised));
        stroke: var(--deck-scene-card-stroke, var(--rik-border-default));
        stroke-width: 1.5;
      }
      .bar.accent {
        fill: var(--deck-scene-emphasis-bg, var(--rik-accent));
        stroke: none;
      }
      .head {
        fill: none;
        stroke: var(--deck-scene-line, var(--rik-text-default));
        stroke-width: 2;
        stroke-linecap: round;
        stroke-linejoin: round;
      }
      .head.muted {
        stroke: var(--deck-scene-muted, var(--rik-text-default--faint));
      }
      .leader {
        stroke-dasharray: 4 6;
      }
      .disc {
        fill: var(--deck-scene-card-bg, var(--rik-surface-raised));
      }
      .gate {
        fill: var(--deck-scene-emphasis-bg, var(--rik-accent));
      }
      .gate-open {
        fill-opacity: 0.35;
      }
      .gate-shed {
        fill-opacity: 0.65;
      }
      .token {
        fill: var(--deck-scene-line, var(--rik-text-default));
        opacity: 1;
      }
      .token.refused {
        fill-opacity: 0;
        stroke: var(--deck-scene-line, var(--rik-text-default));
        stroke-width: 2;
      }
      .ride {
        fill: var(--deck-scene-line, var(--rik-text-default));
        opacity: 0;
      }
      .cursor {
        fill: var(--deck-scene-line, var(--rik-text-default));
      }
      .cursor.accent {
        fill: var(--deck-scene-emphasis-bg, var(--rik-accent));
      }
      .meter-track,
      .cell {
        fill: var(--deck-scene-card-bg, var(--rik-surface-raised));
        stroke: var(--deck-scene-card-stroke, var(--rik-border-default));
        stroke-width: 1.5;
      }
      .full {
        fill: var(--deck-scene-line, var(--rik-text-default));
      }
      .threshold {
        stroke: var(--deck-scene-line, var(--rik-text-default));
        stroke-width: 4;
        stroke-linecap: round;
      }
      .rail-faint {
        opacity: 0.35;
      }
      .curve {
        fill: none;
        stroke: var(--deck-scene-line, var(--rik-text-default));
        stroke-width: 5;
        stroke-linecap: round;
        stroke-linejoin: round;
      }
      .curve.accent {
        stroke: var(--deck-scene-emphasis-bg, var(--rik-accent));
      }
      .curve.tone-muted {
        stroke: var(--deck-scene-muted, var(--rik-text-default--faint));
      }
      .curve-area {
        stroke: none;
      }
      .full.fill-accent {
        fill: var(--deck-scene-emphasis-bg, var(--rik-accent));
      }
      .full.fill-muted {
        fill: var(--deck-scene-muted, var(--rik-text-default--faint));
      }
      .full.fill-ok {
        fill: var(--rik-status-success, var(--rik-accent));
      }
      .full.fill-warn {
        fill: var(--rik-status-warn, var(--rik-accent));
      }
      .full.fill-danger {
        fill: var(--rik-status-danger, var(--rik-accent));
      }
      .draw {
        stroke-dasharray: 1;
      }
      .rise,
      .drop,
      .travel,
      .resize,
      .refill,
      .take {
        transform-box: fill-box;
      }
      .drop {
        transform-origin: top;
      }
      .resize,
      .refill {
        transform-origin: 0 0;
      }
      .take {
        transform-origin: center;
      }

      /* Every entrance takes the time the schedule gave it (--du) · the scene
         kit's own durations are the fallback. */
      :host([playing]) .pop {
        animation-duration: var(--du, ${unsafeCSS(ENTER_SECONDS.pop)}s);
      }
      :host([playing]) .fade {
        animation-duration: var(--du, ${unsafeCSS(ENTER_SECONDS.fade)}s);
      }
      :host([playing]) .grow-x {
        animation-duration: var(--du, ${unsafeCSS(ENTER_SECONDS.draw)}s);
      }
      :host([playing]) .rise {
        animation: dg-rise var(--du, 0.5s) cubic-bezier(0.2, 0.8, 0.2, 1) calc(var(--t0, 0s) + var(--scene-delay, 0s)) both;
      }
      :host([playing]) .draw {
        animation: dg-draw var(--du, 0.7s) cubic-bezier(0.4, 0, 0.2, 1) calc(var(--t0, 0s) + var(--scene-delay, 0s)) both;
      }
      :host([playing]) .drop {
        animation: dg-drop var(--du, 0.35s) cubic-bezier(0.3, 0, 0.2, 1) calc(var(--t0, 0s) + var(--scene-delay, 0s)) both;
      }
      :host([playing]) .travel {
        animation: dg-travel var(--du, 1s) cubic-bezier(0.3, 0.6, 0.3, 1) calc(var(--t0, 0s) + var(--scene-delay, 0s)) both;
      }
      :host([playing]) .token.refused {
        animation:
          dg-travel var(--du, 1s) cubic-bezier(0.3, 0.6, 0.3, 1) calc(var(--t0, 0s) + var(--scene-delay, 0s)) both,
          dg-refuse ${unsafeCSS(REFUSE_SECONDS)}s ease calc(var(--t1, 1s) + var(--scene-delay, 0s)) both;
      }
      :host([playing]) .ride {
        animation: dg-ride var(--du, 0.7s) cubic-bezier(0.45, 0, 0.55, 1) calc(var(--t0, 0s) + var(--scene-delay, 0s)) both;
      }
      /* A click that changes the picture · what stays is drawn at its new place and
         played from the old one, what leaves fades, and nothing else replays. */
      :host([playing]) .still,
      :host([playing]) .still *,
      :host([playing]) .still .token.refused {
        animation: none;
      }
      :host([playing]) .move {
        animation: dg-move var(--du, 0.8s) cubic-bezier(0.65, 0, 0.35, 1) calc(var(--t0, 0s) + var(--scene-delay, 0s)) both;
      }
      :host([playing]) :is(.resize, .still .resize) {
        animation: dg-resize var(--du, 0.8s) cubic-bezier(0.65, 0, 0.35, 1) calc(var(--t0, 0s) + var(--scene-delay, 0s)) both;
      }
      :host([playing]) :is(.refill, .still .refill) {
        animation: dg-refill var(--du, 0.8s) cubic-bezier(0.4, 0, 0.2, 1) calc(var(--t0, 0s) + var(--scene-delay, 0s)) both;
      }
      :host([playing]) :is(.relabel, .still .relabel) {
        animation: dg-relabel var(--du, 0.8s) ease calc(var(--t0, 0s) + var(--scene-delay, 0s)) both;
      }
      :host([playing]) :is(.take, .still .take) {
        animation: scene-pop var(--du, 0.3s) cubic-bezier(0.2, 0.8, 0.2, 1) calc(var(--t0, 0s) + var(--scene-delay, 0s)) both;
      }
      :host([playing]) :is(.leave, .still .leave) {
        animation: dg-leave var(--du, 0.3s) ease calc(var(--t0, 0s) + var(--scene-delay, 0s)) both;
      }
      @keyframes dg-move {
        from { transform: translate(var(--mx, 0), var(--my, 0)); }
        to { transform: none; }
      }
      @keyframes dg-resize {
        from { transform: scale(var(--sx, 1), var(--sy, 1)); }
        to { transform: none; }
      }
      @keyframes dg-refill {
        from { transform: scaleX(var(--s0, 0)); }
        to { transform: none; }
      }
      @keyframes dg-relabel {
        from { opacity: 0; }
        50% { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes dg-leave {
        from { opacity: 1; }
        to { opacity: 0; visibility: hidden; }
      }
      @keyframes dg-rise {
        from { opacity: 0; transform: translateY(16px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes dg-draw {
        from { stroke-dashoffset: 1; }
        to { stroke-dashoffset: 0; }
      }
      @keyframes dg-drop {
        from { opacity: 0.3; transform: scaleY(0.04); }
        to { opacity: 1; transform: scaleY(1); }
      }
      @keyframes dg-travel {
        from { opacity: 0; transform: translate(var(--bx, 0), var(--by, 0)); }
        12% { opacity: 1; }
        to { opacity: 1; transform: translate(0, 0); }
      }
      @keyframes dg-refuse {
        from { fill-opacity: 1; }
        to { fill-opacity: 0; }
      }
      @keyframes dg-ride {
        0% { offset-distance: 0%; opacity: 0; }
        10% { opacity: 1; }
        90% { opacity: 1; }
        100% { offset-distance: 100%; opacity: 0; }
      }

      /* Surfaces that say the part a mark plays, and the disc its icon sits in. Each is
         seen on the page and told from the others on every theme, dark ones included
         (scripts/diagram-paint.test.mjs measures them). The context is the text's ink
         laid thin over the page · a theme's raised surface is a shade off it (1.05:1 in
         siliceum) and a pale part was not there. The control and the incident stay tints
         (under the 0.3 of opacity where \`check\` weighs a fill in the balance, as the
         theme's tints were), the control at 28 % and the incident at 16 %: at the
         theme's 18 % both, the mango and the ember of rikiki were one colour (delta E 5). */
      .p-pale {
        fill: var(--deck-scene-pale-bg, color-mix(in srgb, var(--rik-text-default) 15%, var(--rik-surface-page)));
      }
      .p-gold {
        fill: var(--deck-scene-gold-bg, color-mix(in srgb, var(--rik-accent) 28%, transparent));
      }
      .p-ink {
        fill: var(--deck-scene-band-bg, var(--rik-surface-inverse));
      }
      .p-ok {
        fill: var(--deck-scene-ok-bg, var(--rik-status-success__bg, var(--rik-surface-raised)));
      }
      .p-bad {
        fill: var(--deck-scene-bad-bg, color-mix(in srgb, var(--rik-status-danger) 16%, transparent));
      }
      .state-disc.d-pale {
        fill: var(--deck-scene-band-bg, var(--rik-surface-inverse));
      }
      .state-disc.d-gold,
      .state-disc.d-ink {
        fill: var(--deck-scene-emphasis-bg, var(--rik-accent));
      }
      .state-disc.d-ok {
        fill: var(--rik-status-success, var(--rik-accent));
      }
      .state-disc.d-bad {
        fill: var(--rik-status-danger, var(--rik-accent));
      }
      .icon.on-disc {
        stroke: var(--deck-scene-band-text, var(--rik-text-inverse));
      }
      .icon.on-disc.d-gold,
      .icon.on-disc.d-ink {
        stroke: var(--deck-scene-emphasis-text, var(--rik-accent__on, var(--rik-text-default)));
      }
      /* A status disc is a saturated mid-tone · its icon is cut in the ink of the band,
         which every theme keeps darkest (a light check on the green of rikiki: 1.7:1). */
      .icon.on-disc.d-ok,
      .icon.on-disc.d-bad {
        stroke: var(--deck-scene-band-bg, var(--rik-surface-inverse));
      }
      .lever {
        fill: none;
        stroke: var(--deck-scene-emphasis-bg, var(--rik-accent));
        stroke-width: 12;
        stroke-linecap: round;
      }

      /* A story · what it shows until its beat is gone at rest, what it cuts is pale
         at rest, a token of the established flow is seen only while it travels. */
      .pass,
      .swap-out {
        opacity: 0;
        visibility: hidden;
      }
      .swap-under {
        visibility: hidden;
      }
      :host([playing]) .swap-under {
        animation: dg-under var(--du, 0.5s) linear calc(var(--t0, 0s) + var(--scene-delay, 0s)) both;
      }
      @keyframes dg-under {
        from { visibility: visible; }
        98% { visibility: visible; }
        99%, to { visibility: hidden; }
      }
      .dim-to {
        opacity: ${unsafeCSS(DIM_OPACITY)};
      }
      .pass {
        fill: var(--deck-scene-line, var(--rik-text-default));
      }
      .pivot {
        transform-box: fill-box;
        transform-origin: 0 50%;
      }
      :host([playing]) .drop.drop-in {
        animation-name: dg-drop-in;
      }
      @keyframes dg-drop-in {
        from { opacity: 0; transform: scaleY(0.04); }
        1% { opacity: 0.3; }
        to { opacity: 1; transform: scaleY(1); }
      }
      :host([playing]) .pass {
        animation: dg-pass var(--du, 1s) linear calc(var(--t0, 0s) + var(--scene-delay, 0s)) both;
      }
      :host([playing]) .swap-out {
        animation: dg-swap-out var(--du, 0.5s) ease calc(var(--t0, 0s) + var(--scene-delay, 0s)) both;
      }
      :host([playing]) .swap-in {
        animation: dg-swap-in var(--du, 0.5s) ease calc(var(--t0, 0s) + var(--scene-delay, 0s)) both;
      }
      :host([playing]) .dim-to {
        animation: dg-dim var(--du, 0.6s) ease calc(var(--t0, 0s) + var(--scene-delay, 0s)) both;
      }
      :host([playing]) .pivot {
        animation: dg-pivot var(--du, 0.6s) cubic-bezier(0.45, 0, 0.55, 1) calc(var(--t0, 0s) + var(--scene-delay, 0s)) both;
      }
      :host([playing]) .ride.turn-ok,
      :host([playing]) .ride.turn-warn,
      :host([playing]) .ride.turn-danger,
      :host([playing]) .ride.turn-muted {
        animation:
          dg-ride var(--du, 0.7s) cubic-bezier(0.45, 0, 0.55, 1) calc(var(--t0, 0s) + var(--scene-delay, 0s)) both,
          dg-turn var(--du, 0.7s) linear calc(var(--t0, 0s) + var(--scene-delay, 0s)) both;
      }
      .ride.turn-ok { --turn-to: var(--rik-status-success, var(--rik-accent)); }
      .ride.turn-warn { --turn-to: var(--rik-status-warn, var(--rik-accent)); }
      .ride.turn-danger { --turn-to: var(--rik-status-danger, var(--rik-accent)); }
      .ride.turn-muted { --turn-to: var(--deck-scene-muted, var(--rik-text-default--faint)); }
      @keyframes dg-pass {
        0% { opacity: 0; visibility: visible; transform: translate(var(--bx, 0), 0); }
        8% { opacity: 1; }
        90% { opacity: 1; }
        100% { opacity: 0; visibility: hidden; transform: none; }
      }
      /* The old word goes as the new one comes · they cross, so the mark is never blank. */
      /* Hidden from 99 % on, not only at the end · an animation that ends with the story
         can be finished a hair before its last frame (6.105 s + 0.395 s is not 6.5 s in
         floating point), and visibility, which only turns at the frame, stayed visible. */
      @keyframes dg-swap-out {
        from { opacity: 1; visibility: visible; }
        55% { opacity: 0; }
        98% { visibility: visible; }
        99%, to { opacity: 0; visibility: hidden; }
      }
      @keyframes dg-swap-in {
        from { opacity: 0; }
        45% { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes dg-dim {
        from { opacity: 1; }
        to { opacity: ${unsafeCSS(DIM_OPACITY)}; }
      }
      @keyframes dg-pivot {
        from { transform: rotate(var(--turn, 0deg)); }
        to { transform: none; }
      }
      @keyframes dg-turn {
        0%, 40% { fill: var(--deck-scene-line, var(--rik-text-default)); }
        60%, 100% { fill: var(--turn-to); }
      }

      /* The controls of a story · small, under the drawing's corner, only while it
         plays on the slide shown, never on paper nor under reduced motion. */
      :host {
        position: relative;
      }
      .story-controls {
        position: absolute;
        right: 0;
        bottom: 0;
        display: flex;
        gap: 6px;
        opacity: 0;
        transition: opacity 0.2s ease;
      }
      /* Seen when the speaker reaches for them · never over the drawing otherwise. */
      :host(:hover) .story-controls,
      .story-controls:focus-within {
        opacity: 1;
      }
      .story-controls button {
        display: grid;
        place-items: center;
        inline-size: 30px;
        block-size: 30px;
        padding: 0;
        border: 1px solid var(--rik-border-default, currentColor);
        border-radius: 999px;
        background: var(--rik-surface-raised, transparent);
        color: var(--rik-text-default);
        cursor: pointer;
      }
      .story-controls button[aria-pressed='true'] {
        background: var(--rik-text-default);
        color: var(--rik-surface-default, var(--rik-surface-raised));
      }
      .story-controls svg {
        inline-size: 16px;
        block-size: 16px;
        fill: none;
        stroke: currentColor;
        stroke-width: 2;
        stroke-linecap: round;
        stroke-linejoin: round;
      }

      /* A mark with no surface of its own on a dark panel · its words, its lines and
         its tokens in the light ink of the band. */
      .on-ink {
        --rik-text-default: var(--deck-scene-band-text, var(--rik-text-inverse));
        --deck-scene-line: var(--deck-scene-band-text, var(--rik-text-inverse));
        --deck-scene-muted: var(--deck-scene-band-muted, var(--rik-text-inverse--muted));
        --rik-text-default--muted: var(--deck-scene-band-muted, var(--rik-text-inverse--muted));
      }
      /* A surface on a dark panel · the tints of the parts are translucent, made for a
         light page, and would darken there: they are mixed over white instead. */
      .on-ink-surface {
        --deck-scene-gold-bg: color-mix(in srgb, var(--rik-accent) 30%, var(--rik-surface-raised--strong, var(--rik-surface-page)));
        --deck-scene-ok-bg: color-mix(in srgb, var(--rik-status-success) 18%, var(--rik-surface-raised--strong, var(--rik-surface-page)));
        --deck-scene-bad-bg: color-mix(in srgb, var(--rik-status-danger) 18%, var(--rik-surface-raised--strong, var(--rik-surface-page)));
      }
      /* On a pale panel the pale surfaces take the page again, so they stand out of it by
         what the panel stands out of the page · the white of a card was the panel itself
         in siliceum, whose raised surface is white. */
      .on-pale :is(.p-pale, .card, .frame-soft, .meter-track, .cell, .disc) {
        fill: var(--deck-scene-card-raised, var(--rik-surface-page));
      }

      /* The camera · each move eases from where it frames to the whole picture, its
         group nested in the order of the moves. At rest, in print and under reduced
         motion there is no move: the whole composition is in the frame. */
      .cam {
        transform-box: view-box;
        transform-origin: 0 0;
      }
      :host([playing]) .cam {
        animation: dg-cam var(--du, 1.2s) cubic-bezier(0.45, 0, 0.55, 1) calc(var(--t0, 0s) + var(--scene-delay, 0s)) both;
      }
      @keyframes dg-cam {
        from { transform: translate(var(--cx, 0), var(--cy, 0)) scale(var(--cs, 1)); }
        to { transform: none; }
      }
      /* A camera frames a part of the picture · what lies past the frame is not drawn
         over the slide around it. */
      svg[data-camera] {
        overflow: hidden;
      }

      @media (prefers-reduced-motion: reduce), print {
        :host([playing]) .cam,
        :host([playing]) :is(.rise, .draw, .drop, .travel, .token.refused, .ride, .move),
        :host([playing]) :is(.resize, .refill, .relabel, .take, .leave, .still .resize),
        :host([playing]) :is(.still .refill, .still .relabel, .still .take, .still .leave),
        :host([playing]) :is(.pass, .swap-out, .swap-in, .swap-under, .dim-to, .pivot),
        :host([playing]) .drop.drop-in,
        :host([playing]) :is(.ride.turn-ok, .ride.turn-warn, .ride.turn-danger, .ride.turn-muted) {
          animation: none;
        }
        /* What leaves is gone at once · the click shows its picture, still. */
        .leave {
          display: none;
        }
        .story-controls {
          display: none;
        }
      }
    `,
  ];

  // The root attributes, declared so the scene says it reads them (`check` asks an
  // element what it observes, and an attribute it does not is "ignored"). They are
  // read straight from the element by the parser, not through these properties.
  @property({ type: String }) intent?: string;
  @property({ type: String }) also?: string;
  @property({ type: String }) compose?: string;
  @property({ type: String }) layout?: string;
  @property({ type: String }) direction?: string;
  @property({ type: String }) columns?: string;
  @property({ type: String }) align?: string;
  @property({ type: String }) gap?: string;
  @property({ type: String }) paint?: string;
  @property({ type: String }) weights?: string;
  @property({ type: String }) wrap?: string;
  @property({ type: String }) link?: string;
  @property({ type: String }) bounds?: string;
  @property({ type: String, attribute: 'max-marks' }) maxMarks?: string;
  @property({ type: String }) balance?: string;
  @property({ type: String }) play?: string;
  @property({ type: String }) budget?: string;
  @property({ type: String }) acts?: string;
  @property({ type: String }) act?: string;
  @property({ type: String }) pair?: string;

  /** The id of the slide the deck came from to this one · a camera that opens from it
   *  (`zoom-from`) takes over its frame, any other way in it frames its own mark. */
  @state() private arrivedFrom: string | null = null;
  /** Where the picture shown is drawn in the viewBox · what `placeInView` maps by. */
  private placed?: { drawn: DiagramLayout; left: number; top: number; grow: number; shift: Point };

  /** The click the slide is on · what a playing diagram shows. */
  @state() private stage = 0;
  /** A story plays again once it ends, from its Loop button. */
  @state() private looping = false;
  /** A story held still, from its Pause button or by `seek`. */
  @state() private paused = false;
  /** Counts the plays of a story · a loop waits on the play it was started for. */
  private run = 0;
  /** The story of the drawing shown, when it plays on entry. */
  private story?: StoryPlan;

  private parsed?: ParsedDiagram;
  /** The picture of the click shown · what the bench and the browser tests judge. */
  drawn?: DiagramLayout;
  /** The picture of every click, for a diagram with `dg-state` · the one drawing else. */
  drawnStages: DiagramLayout[] = [];
  private noFitKeep: number | null = null;
  private motionIssues: (MotionIssue | DgIssue)[] = [];
  /** Where the drawing does not demonstrate its intent (`INT_*`). */
  private intentIssues: DgIssue[] = [];
  /** The surface each node is drawn on, of the picture shown. */
  private grounds = new Map<DgNode, string>();

  /** How a mark is set on the surface around it · on a dark panel what has no surface
   *  of its own takes the light ink, on a pale one the pale surfaces are drawn white,
   *  so a card stands out of the panel that holds it. */
  private groundClass(node: DgNode | undefined, item?: LItem): string | undefined {
    const ground = node ? this.grounds.get(node) : undefined;
    if (ground === 'ink' || ground === 'inverse')
      return hasSurface(item) ? 'on-ink-surface' : 'on-ink';
    return ground === 'pale' || ground === 'soft' ? 'on-pale' : undefined;
  }

  /** A mark is data, not an element with a shadow tree · the root reads its children,
   *  compiled first when the diagram is written as an intent. */
  protected override willUpdate(): void {
    super.willUpdate();
    this.parsed = parseDiagram(this, compileIntent);
    // A story plays on entry · its per-click lists are its beats, not clicks.
    if (!this.parsed.story) this.publishSteps(this.parsed.stages);
  }

  /** Each time a story starts playing, a loop waits for its end. */
  protected override updated(changed?: PropertyValues): void {
    super.updated();
    if (this.story && changed?.has('playing') && this.playing) {
      this.run += 1;
      this.paused = false;
      void this.loopAfter(this.run);
    }
  }

  private deck: Element | null = null;

  override connectedCallback(): void {
    super.connectedCallback();
    this.deck = this.closest('deck-root');
    this.deck?.addEventListener('slide-change', this.onSlideChange);
    this.deck?.addEventListener('slide-leave', this.onSlideLeave);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.deck?.removeEventListener('slide-change', this.onSlideChange);
    this.deck?.removeEventListener('slide-leave', this.onSlideLeave);
    this.deck = null;
  }

  /** The slide of this drawing is about to be hidden · how its picture stands on the
   *  screen at this instant is kept, a camera half way through its move included. */
  private readonly onSlideLeave = (event: Event): void => {
    const { previous } = (event as CustomEvent<{ previous: Element | null }>).detail;
    if (!previous?.contains(this)) return;
    const view = this.screenView();
    if (view) this.leftView = view;
  };

  /** Which slide the deck came from, when it arrives on this one · told before the
   *  slide plays (deck-root changes the slide, then its step). */
  private readonly onSlideChange = (event: Event): void => {
    const { current, previous } = (
      event as CustomEvent<{ current: Element | null; previous: Element | null }>
    ).detail;
    if (current?.contains(this)) this.arrivedFrom = previous?.id || null;
  };

  /** How the picture stood on the screen when its slide was left · from the units of
   *  the picture to the screen, through every move of its camera as it then stood. A
   *  slide left is hidden, and the next one's camera still needs to know where it was. */
  private leftView?: DOMMatrix;

  private drawingSvg(): SVGSVGElement | null {
    return this.renderRoot.querySelector<SVGSVGElement>('svg:not([data-act])');
  }

  /** From the units of the picture to the screen, now · through the innermost move of
   *  the camera, which holds the picture, so its animated transform counts. */
  private screenView(): DOMMatrix | undefined {
    const svg = this.drawingSvg();
    if (!svg?.getBoundingClientRect().width) return undefined;
    const moves = svg.querySelectorAll<SVGGElement>('g.cam');
    return (moves[moves.length - 1] ?? svg).getScreenCTM() ?? undefined;
  }

  /** Where a mark of the picture stood on the screen when its slide was last left ·
   *  what the next slide's camera takes over (`zoom-from`), where and as large as the
   *  room saw it, a camera stopped half way included. */
  placeOnScreen(name: string): Rect | undefined {
    const place = this.placeInView(name);
    const view = this.leftView;
    if (!place || !view) return undefined;
    const from = new DOMPoint(place.x, place.y).matrixTransform(view);
    const to = new DOMPoint(place.x + place.w, place.y + place.h).matrixTransform(view);
    return { x: from.x, y: from.y, w: to.x - from.x, h: to.y - from.y };
  }

  /** Where a mark of the picture shown stands, in the units of its viewBox. */
  placeInView(name: string): Rect | undefined {
    const at = this.placed;
    const r = at?.drawn.places.get(name);
    if (!at || !r) return undefined;
    return {
      x: at.left + (r.x + at.shift.x) * at.grow,
      y: at.top + (r.y + at.shift.y) * at.grow,
      w: r.w * at.grow,
      h: r.h * at.grow,
    };
  }

  /** The frame the slide before showed `zoom-from`'s mark in, seen here · only when
   *  the deck came from that slide, else the camera frames its own mark. */
  private openingFrom(text: string | undefined, here: Rect | undefined): CameraView | undefined {
    const from = readZoomFrom(text);
    const box = this.drawingSvg()?.getBoundingClientRect();
    if (!from || !here || !box?.width || from.slide !== this.arrivedFrom) return undefined;
    const slide = this.deck?.querySelector(`:scope > #${CSS.escape(from.slide)}`);
    const seen = [...(slide?.querySelectorAll('deck-diagram') ?? [])]
      .map((d) => (d as DeckDiagram).placeOnScreen(from.mark))
      .find(Boolean);
    if (!seen) return undefined;
    // From the screen to this drawing's viewBox, where the camera frames.
    const k = box.width / (this.width + 2 * EDGE);
    const before = {
      x: (seen.x - box.x) / k - EDGE,
      y: (seen.y - box.y) / k - EDGE,
      w: seen.w / k,
      h: seen.h / k,
    };
    return viewFrom(before, here);
  }

  /** A mark a camera takes over from the slide before (`zoom-from`) is already there
   *  when the slide opens · the room has just seen it, so it does not enter again:
   *  it stands from the first frame, and the rest of the picture comes around it. */
  private holdTakenOver(drawn: DiagramLayout, story: StoryPlan): void {
    const mark = camerasOf(drawn.tree)
      .map((camera) => readZoomFrom(camera.attrs['zoom-from'])?.mark)
      .find(Boolean);
    const i = mark ? drawn.items.findIndex((item) => item.node?.attrs.name === mark) : -1;
    const id = cueIds.item(i);
    const entrance = story.timing.get(id);
    if (i >= 0 && entrance) story.timing.set(id, { ...entrance, start: 0, duration: 0.001 });
  }

  /** The step of the act the slide stands at · null when the diagram draws no strip. */
  private actOf(): { steps: string[]; at: number } | null {
    const steps = readActs(this.getAttribute('acts') ?? undefined);
    const at = actIndex(steps, this.getAttribute('act') ?? undefined);
    const counted = steps.length >= ACT_STEPS.min && steps.length <= ACT_STEPS.max;
    return counted && at >= 0 ? { steps, at } : null;
  }

  /** The strip of the act, above the picture and out of the camera's frame. */
  private actStrip(meter: Meter) {
    const act = this.actOf();
    if (!act) return { strip: nothing, misfit: [] as Overflow[] };
    const layout = layoutAct(act.steps, act.at, this.width, {
      regular: meter(ACT_TYPE.size, ACT_TYPE.weight),
      bold: meter(ACT_TYPE.size, ACT_TYPE.current),
    });
    const french = (this.closest('[lang]')?.getAttribute('lang') ?? '').startsWith('fr');
    const said = french
      ? `Étape ${act.at + 1} sur ${act.steps.length} · ${act.steps[act.at]} (${act.steps.join(', ')})`
      : `Step ${act.at + 1} of ${act.steps.length} · ${act.steps[act.at]} (${act.steps.join(', ')})`;
    const { rail } = layout;
    const strip = html`<svg class="act" data-act viewBox=${sceneViewBox(ACT_HEIGHT, this.width)} role="img" aria-label=${said} part="act">
      <line class="act-rail" x1=${rail.x0} y1=${rail.y} x2=${rail.x1} y2=${rail.y}></line>
      <line class="act-rail act-reached" x1=${rail.x0} y1=${rail.y} x2=${rail.reached} y2=${rail.y}></line>
      ${layout.stations.map(
        (
          station,
        ) => svg`<circle class="act-station act-${station.state}" cx=${station.x} cy=${rail.y} r=${station.state === 'current' ? ACT_STRIP.current : ACT_STRIP.station}></circle>
          <text class="act-label act-${station.state}" x=${station.x} y=${layout.labelY + ACT_TYPE.size * BASELINE} text-anchor="middle" font-size=${ACT_TYPE.size} font-weight=${station.state === 'current' ? ACT_TYPE.current : ACT_TYPE.weight}>${station.label}</text>`,
      )}
    </svg>`;
    const misfit: Overflow[] = layout.fits
      ? []
      : [
          {
            item: 'deck-diagram',
            field: 'acts',
            text: act.steps.join(' · '),
            budget: this.width / act.steps.length,
            size: ACT_TYPE.size,
          },
        ];
    return { strip, misfit };
  }

  /** What the drawing says of its place in the deck · `rikiki check` reads it
   *  (deck-motifs.ts) beside the words it measures. */
  private motifOf(parsed: ParsedDiagram): Omit<Motif, 'words'> {
    const zoom = camerasOf(parsed.children)
      .map((camera) => readZoomFrom(camera.attrs['zoom-from']))
      .find(Boolean);
    return {
      names: namedMarks(parsed.children),
      act: this.actOf(),
      pair: this.getAttribute('pair') || null,
      zoomFrom: zoom ?? null,
    };
  }

  /** The animations of the drawing · what the story's buttons and `seek` drive. */
  private animations(): Animation[] {
    return this.renderRoot instanceof ShadowRoot ? this.renderRoot.getAnimations() : [];
  }

  /** Hold the story at `seconds` from its start, every animation paused there ·
   *  how a test or a capture looks at one instant of it. */
  seek(seconds: number): void {
    for (const animation of this.animations()) {
      animation.pause();
      animation.currentTime = seconds * 1000;
    }
    this.paused = true;
  }

  private togglePause(): void {
    for (const animation of this.animations()) {
      if (this.paused) animation.play();
      else animation.pause();
    }
    this.paused = !this.paused;
  }

  private replay(): void {
    this.applyStep(0);
  }

  private toggleLoop(): void {
    this.looping = !this.looping;
    if (this.looping) void this.loopAfter(this.run);
  }

  /** Once the play `run` has ended, play again after a pause on its last picture ·
   *  while the loop is on, the slide is the one shown, and no other play started. */
  private async loopAfter(run: number): Promise<void> {
    await new Promise((done) => requestAnimationFrame(done));
    await Promise.allSettled(this.animations().map((animation) => animation.finished));
    const current = () =>
      run === this.run &&
      this.looping &&
      this.isConnected &&
      !!this.closest('deck-root > [active]');
    if (!current()) return;
    setTimeout(() => {
      if (current()) this.replay();
    }, LOOP_HOLD_MS);
  }

  /** Called by deck-root on every step change · step 0 replays the entrance, a
   *  later one brings in what waits for it. */
  override applyStep(step: number): void {
    this.stage = step;
    super.applyStep(step);
  }

  /** The engine reads the step count off the slide · the diagram raises it to the
   *  clicks its marks wait for, and never lowers what the author declared. */
  private publishSteps(needed: number): void {
    if (!needed) return;
    let slide: Element | null = this;
    while (slide?.parentElement && slide.parentElement.localName !== 'deck-root')
      slide = slide.parentElement;
    if (!slide?.parentElement) return;
    const declared = Number(slide.getAttribute('steps') ?? slide.getAttribute('data-steps') ?? '0');
    // The engine gives `steps` precedence over `data-steps`. Raise that same
    // attribute when the author supplied it, or later pictures stay unreachable.
    if (needed > declared)
      slide.setAttribute(slide.hasAttribute('steps') ? 'steps' : 'data-steps', String(needed));
  }

  override render() {
    const parsed = this.parsed ?? parseDiagram(this, compileIntent);
    const room = this.room();
    const meter: Meter = (size, weight) =>
      measurerFor(
        this,
        weight,
        weight >= TYPE.value.weight ? '--rik-font-display' : '--rik-font-sans',
      )(size);
    const locale = this.closest('[lang]')?.getAttribute('lang') || undefined;
    const { options, frames } = this.framesToGrow(parsed, {
      meter,
      bounds: room,
      hasIcon: (name: string) => !!iconPath(name),
      ...(locale ? { locale } : {}),
    });
    // Resting (overview, print, PDF, a render) shows the last click · playing, the
    // click the slide is on. A story shows its end, and plays its way there.
    const shown =
      this.playing && !parsed.story ? Math.min(this.stage, parsed.stages) : parsed.stages;
    const current = frames[parsed.states ? shown : 0]!;
    this.story = parsed.story
      ? planStory(current.drawn, current.choreography, {
          budget: readSeconds(parsed.attrs.budget) || undefined,
        })
      : undefined;
    if (this.story) this.holdTakenOver(current.drawn, this.story);
    this.drawn = current.drawn;
    this.drawnStages = frames.map((f) => f.drawn);
    this.noFitKeep = this.keepThatFits(parsed, options, frames);
    const act = this.actStrip(meter);
    this.reportOverflow([...this.misfits(frames), ...act.misfit]);
    this.intentIssues = parsed.intent
      ? proveIntent(
          parsed.intent,
          frames.map((f) => ({
            drawn: f.drawn,
            stage: f.stage,
            appears: f.choreography.appears,
            timing: f.timing,
          })),
        )
      : [];

    // Every picture shares one frame · the ink of all of them sets the scale and
    // the height, and each is centred in it, so nothing jumps from click to click.
    const inks = frames.map((f) => inkOf(f.drawn, meter));
    const ink = unionOf(inks);
    const shifts = inks.map((own) => centring(own, ink));
    const grow = growthFor(ink, room);
    const tallest = Math.max(...frames.map((f) => f.drawn.size.h));
    const height = ink ? Math.max(tallest, (ink.y1 - ink.y0) * grow) : tallest;
    // Centred on its ink when the ink fits across · a text wider than its box
    // (reported, drawn anyway) would otherwise push the rest out of the frame.
    const inkFits = !!ink && (ink.x1 - ink.x0) * grow <= this.width;
    const left =
      ink && inkFits ? this.width / 2 - ((ink.x0 + ink.x1) / 2) * grow : (this.width - room.w) / 2;
    const top = ink ? height / 2 - ((ink.y0 + ink.y1) / 2) * grow : 0;

    const changes = parsed.states ? this.changesOf(frames, shifts) : [];
    this.motionIssues = this.story
      ? this.story.issues
      : parsed.states
        ? [
            ...frames[0]!.issues.filter((issue) => issue.stage === 0),
            ...changes.flatMap((c) => c.issues),
          ]
        : current.issues;
    const change = parsed.states && this.playing && shown > 0 ? changes[shown - 1] : undefined;
    const view: View = change
      ? { choreography: current.choreography, timing: change.timing, shown, change: change.plan }
      : this.story
        ? {
            choreography: current.choreography,
            timing: this.story.timing,
            shown,
            story: this.story,
          }
        : { choreography: current.choreography, timing: current.timing, shown };
    const shift = shifts[parsed.states ? shown : 0]!;
    this.placed = { drawn: current.drawn, left, top, grow, shift };
    this.grounds = groundsOf(parsed.children);
    const camera = this.story
      ? this.cameraOf(current.drawn, { left, top, grow, shift, height, meter })
      : undefined;
    if (camera) this.motionIssues = [...this.motionIssues, ...camera.issues];
    // In a story, a lever and the route it turns away from leave from one pivot.
    const pivots = this.story ? leverPivots(current.drawn) : new Map();
    const pictured: DiagramLayout = pivots.size
      ? {
          ...current.drawn,
          links: current.drawn.links.map((link, j) =>
            pivots.has(j) ? { ...link, points: [pivots.get(j)!, ...link.points.slice(1)] } : link,
          ),
        }
      : current.drawn;
    const drawing = svg`${change ? this.leaving(frames[shown - 1]!, change, shifts[shown - 1]!, shown - 1) : nothing}
      <g transform="translate(${shift.x} ${shift.y})">${this.parts(
        pictured,
        view,
        (id) => this.shows(view, id),
        (id, content) => this.staged(view, id, content),
      )}</g>`;
    const content = svg`<g transform="translate(${left} ${top}) scale(${grow})">
        ${parsed.states ? keyed(shown, drawing) : drawing}
      </g>`;
    // The first move is the outermost group · before it, every group stands where its
    // move starts, which is the frame the picture opens on.
    const framed = camera
      ? camera.moves.reduceRight<unknown>(
          (inner, move) =>
            svg`<g class="cam" data-camera-move=${move.id} style="${at(this.story?.timing.get(move.id))};--cx:${move.from.x.toFixed(2)}px;--cy:${move.from.y.toFixed(2)}px;--cs:${move.from.s.toFixed(4)}">${inner}</g>`,
          content,
        )
      : content;
    return html`${act.strip}<svg viewBox=${sceneViewBox(height, this.width)} data-motif=${JSON.stringify(this.motifOf(parsed))} role="img" aria-label=${this.description(current.drawn)} part="drawing" data-layout=${parsed.attrs.compose ? 'compose' : (parsed.attrs.layout ?? 'row')} data-compose=${parsed.attrs.compose ?? nothing} data-camera=${camera ? '' : nothing} data-intent=${parsed.intent ? [parsed.intent.main, ...parsed.intent.also].join(' ') : nothing} data-balance=${parsed.attrs.balance === 'free' ? 'free' : nothing} data-lean=${leansAcross(parsed.attrs, current.drawn.tree) ? 'x' : nothing} data-signature=${JSON.stringify(signatureOf(parsed))} data-story=${this.story ? JSON.stringify(this.story.script) : nothing}>
      ${framed}
    </svg>${this.story && this.playing ? this.controls() : nothing}`;
  }

  /** How the story's cameras frame the picture · each frames a mark or a panel where
   *  it is drawn in the viewBox, the smallest text checked through every frame. */
  private cameraOf(
    drawn: DiagramLayout,
    at: { left: number; top: number; grow: number; shift: Point; height: number; meter: Meter },
  ): CameraPlan | undefined {
    const timing = this.story?.timing;
    const cameras = camerasOf(drawn.tree);
    if (!timing || !cameras.length) return undefined;
    const startOf = (id: string) => timing.get(id)?.start ?? 0;
    const shots = cameras
      .map((node, c) => ({ node, id: storyIds.camera(c) }))
      .sort((a, b) => startOf(a.id) - startOf(b.id));
    // From the drawing's units to the viewBox's, where the camera frames.
    const toView = (r: { x: number; y: number; w: number; h: number }) => ({
      x: at.left + (r.x + at.shift.x) * at.grow,
      y: at.top + (r.y + at.shift.y) * at.grow,
      w: r.w * at.grow,
      h: r.h * at.grow,
    });
    const sizes = [
      ...drawn.items.flatMap((item) => textsOf(item).map((t) => t.size)),
      ...drawn.notes.flatMap((note) => note.texts.map((t) => t.size)),
      ...drawn.links.flatMap((link) => (link.label ? [link.label.size] : [])),
    ];
    const frames = drawn.items.filter((item): item is LFrame => item.kind === 'frame');
    const holds = (outer: LFrame, inner: { x: number; y: number; w: number; h: number }) =>
      outer.x <= inner.x &&
      outer.y <= inner.y &&
      outer.x + outer.w >= inner.x + inner.w &&
      outer.y + outer.h >= inner.y + inner.h;
    const captionOf = (frame: LFrame | undefined) =>
      frame?.caption
        ? [
            {
              x: frame.caption.x,
              y: frame.caption.y,
              w: Math.max(
                ...frame.caption.lines.map((line) =>
                  at.meter(frame.caption!.size, frame.caption!.weight)(line),
                ),
              ),
              h: frame.caption.lines.length * frame.caption.line,
            },
          ]
        : [];
    // The name of the panel framed, and of the panel around it, stay whole in the frame.
    const captions = (name: string) => {
      const target = drawn.places.get(name);
      if (!target) return { keep: [], avoid: [] };
      const own = frames.find((f) => f.key === name);
      const holder = frames
        .filter((f) => f.key !== name && holds(f, target))
        .sort((a, b) => a.w * a.h - b.w * b.h)[0];
      // A panel framed keeps its own name and leaves out the one around it · a mark
      // framed keeps the name of the panel it is in.
      return own
        ? { keep: captionOf(own).map(toView), avoid: captionOf(holder).map(toView) }
        : { keep: captionOf(holder).map(toView), avoid: [] };
    };
    const place = (name: string) => {
      const r = drawn.places.get(name);
      return r ? toView(r) : undefined;
    };
    const zoomFrom = shots[0]?.node.attrs['zoom-from'];
    const opening = this.openingFrom(zoomFrom, place(readZoomFrom(zoomFrom)?.mark ?? ''));
    return planCamera({
      shots,
      backId: storyIds.cameraBack,
      place,
      ...(opening ? { opening } : {}),
      frame: { x: -EDGE, y: -EDGE, w: this.width + 2 * EDGE, h: at.height + 2 * EDGE },
      smallestText: (sizes.length ? Math.min(...sizes) : Number.POSITIVE_INFINITY) * at.grow,
      captions,
    });
  }

  /** Pause, Replay and Loop · what a speaker needs to hold a story or play it again. */
  private controls() {
    const icon = (d: string) =>
      html`<svg viewBox="0 0 24 24" aria-hidden="true"><path d=${d}></path></svg>`;
    const french = (this.closest('[lang]')?.getAttribute('lang') ?? '').startsWith('fr');
    const [pause, replay, loop] = french
      ? ['Pause', 'Rejouer', 'Boucle']
      : ['Pause', 'Replay', 'Loop'];
    return html`<div class="story-controls" part="controls">
      <button type="button" data-testid="story-pause" aria-label=${pause} aria-pressed=${this.paused ? 'true' : 'false'} @click=${this.togglePause}>
        ${icon(this.paused ? 'M8 5v14l11-7z' : 'M9 5v14M15 5v14')}
      </button>
      <button type="button" data-testid="story-replay" aria-label=${replay} @click=${this.replay}>
        ${icon('M3 12a9 9 0 1 0 3-6.7M3 4v5h5')}
      </button>
      <button type="button" data-testid="story-loop" aria-label=${loop} aria-pressed=${this.looping ? 'true' : 'false'} @click=${this.toggleLoop}>
        ${icon('M17 2l4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3')}
      </button>
    </div>`;
  }

  /** Every click's picture, laid out in the room, or narrower when that lets the
   *  drawing be drawn larger (`widthToGrow`) · kept only if every picture still fits
   *  and the drawing does grow. */
  private framesToGrow(
    parsed: ParsedDiagram,
    options: LayoutOptions,
  ): { options: LayoutOptions; frames: Frame[] } {
    const frames = framesOf(parsed, options);
    const inkAll = (laid: Frame[]): Ink | null =>
      unionOf(laid.map((f) => inkOf(f.drawn, options.meter)));
    const ink = inkAll(frames);
    const narrower = widthToGrow(ink, options.bounds);
    const fits = (laid: Frame[]) => laid.every((f) => f.drawn.status === 'fit');
    // A link's label sits on its run · laid out narrower, the runs shorten under it
    // and the label would cover the marks it joins.
    const labelled = frames.some((f) => f.drawn.links.some((link) => link.label));
    if (!ink || narrower === null || labelled || !fits(frames)) return { options, frames };
    const tried = { ...options, bounds: { w: narrower, h: options.bounds.h } };
    const grown = framesOf(parsed, tried);
    const grownInk = inkAll(grown);
    const larger = growthFor(grownInk, options.bounds) > growthFor(ink, options.bounds);
    // The same picture, drawn larger · not another one: a row that wraps, a graph
    // that turns down, would be taller, and is not what was asked.
    const same = !!grownInk && grownInk.y1 - grownInk.y0 <= (ink.y1 - ink.y0) * SAME_HEIGHT;
    return fits(grown) && larger && same ? { options: tried, frames: grown } : { options, frames };
  }

  /** How each picture becomes the next, and when · one per click. */
  private changesOf(frames: Frame[], shifts: Point[]): Change[] {
    return frames.slice(1).map((frame, n) => {
      const before = frames[n]!;
      const plan = planTransition(
        pictureOf(before.drawn, before.choreography.appears, before.stage, shifts[n]),
        pictureOf(frame.drawn, frame.choreography.appears, frame.stage, shifts[n + 1]),
      );
      const timed = schedule(plan.cues);
      return { plan, timing: timed.timing, issues: [...timed.issues, ...plan.issues] };
    });
  }

  /** What the picture before had and this one has not, fading where it stood. */
  private leaving(frame: Frame, change: Change, shift: Point, stage: number) {
    const { items, links, notes } = change.plan.leaving;
    const ids = new Set([
      ...items.map(cueIds.item),
      ...links.map(cueIds.link),
      ...notes.map(cueIds.note),
    ]);
    const view: View = { choreography: frame.choreography, timing: new Map(), shown: stage };
    return svg`<g transform="translate(${shift.x} ${shift.y})">${this.parts(
      frame.drawn,
      view,
      (id) => ids.has(id),
      (id, content) =>
        svg`<g class="leave" style=${at(change.timing.get(morphIds.leave(id)))}><g class="still">${content}</g></g>`,
    )}</g>`;
  }

  /** A part of the picture, as the click shown has it · on a change of picture it
   *  comes in, moves from where it was, or stays still. */
  private staged(view: View, id: string, content: unknown) {
    const change = view.change;
    if (!change || change.entering.has(id)) return content;
    const move = change.moves.get(id);
    if (!move) return svg`<g class="still">${content}</g>`;
    const t = view.timing.get(morphIds.move(id));
    return svg`<g class="move" style="${at(t)};--mx:${move.dx.toFixed(2)}px;--my:${move.dy.toFixed(2)}px"><g class="still">${content}</g></g>`;
  }

  /** The parts of a drawing, in the order they are painted · surfaces, links,
   *  lanes, gates, tokens, marks, notes. `keep` says which are drawn, `wrap` how. */
  private parts(
    drawn: DiagramLayout,
    view: View,
    keep: (id: string) => boolean,
    wrap: (id: string, content: unknown) => unknown,
  ) {
    const indexed = drawn.items.map((item, i) => ({ item, i }));
    const each = <K extends LItem['kind']>(
      kinds: K[],
      draw: (item: Extract<LItem, { kind: K }>, i: number) => unknown,
    ) =>
      indexed
        .filter((e): e is { item: Extract<LItem, { kind: K }>; i: number } =>
          (kinds as string[]).includes(e.item.kind),
        )
        .map(({ item, i }) =>
          keep(cueIds.item(i))
            ? wrap(
                cueIds.item(i),
                owned(
                  nameOf(item.node),
                  item.node.kind,
                  this.dimmed(view, item.node, storyIds.dim(i), draw(item, i)),
                  this.groundClass(item.node, item),
                ),
              )
            : nothing,
        );
    const links = (draw: (link: LLink, j: number) => unknown) =>
      drawn.links.map((link, j) =>
        keep(cueIds.link(j))
          ? wrap(
              cueIds.link(j),
              owned(
                linkName(link),
                'link',
                this.dimmed(view, link.node, storyIds.linkDim(j), draw(link, j)),
                this.groundClass(link.node),
              ),
            )
          : nothing,
      );
    const cutOf = (lane: LLane) => this.cutOn(drawn, lane, view);
    // A link's label is painted after the marks · under them, a label pushed onto a
    // mark was hidden by it, and the defect went unseen on the picture.
    return svg`
      ${each(['frame'], (item, i) => this.frame(item, view, i))}
      ${links((link, j) => this.drawLink(link, view, j))}
      ${each(['lane'], (item, i) => this.lane(item, view, i, cutOf(item)))}
      ${each(['gate'], (item, i) => this.gate(item, view, i))}
      ${each(['lane'], (item, i) => this.tokens(item, view, i))}
      ${each(['box', 'bar', 'dot', 'span', 'cursor'], (item, i) => this.mark(item, view, i))}
      ${each(['meter'], (item, i) => this.meterMark(item, view, i))}
      ${each(['queue'], (item, i) => this.queueMark(item, view, i))}
      ${each(['curve'], (item, i) => this.curveMark(item, view, i))}
      ${each([...PIECE_KINDS], (item, i) => this.piece(item, view, i))}
      ${links((link, j) => this.linkLabel(link, view, j))}
      ${drawn.notes.map((note, k) => (keep(cueIds.note(k)) ? wrap(cueIds.note(k), svg`<g data-mark=${nameOf(note.node)} data-kind="text" data-for=${note.target} class=${this.groundClass(note.node) ?? nothing}>${this.note(note, view, k)}</g>`) : nothing))}`;
  }

  /** In a story, what pales on its beat (`dim`) · at rest it is pale. */
  private dimmed(view: View, node: DgNode | undefined, id: string, content: unknown) {
    if (!view.story || node?.attrs.dim === undefined) return content;
    return svg`<g class="dim-to" style=${at(view.timing.get(id))}>${content}</g>`;
  }

  /** In a story, where a gate that closes cuts a lane, and when what lies past it
   *  pales · the nearest such gate. */
  private cutOn(
    drawn: DiagramLayout,
    lane: LLane,
    view: View,
  ): { x: number; t?: Timing } | undefined {
    if (!view.story) return undefined;
    const cuts = drawn.items
      .map((item, k) => ({ item, k }))
      .filter((g): g is { item: LGate; k: number } => g.item.kind === 'gate')
      .filter(
        ({ item, k }) => item.lanes.includes(lane.key) && view.timing.has(storyIds.downstream(k)),
      )
      .sort((a, b) => a.item.x - b.item.x);
    const first = cuts[0];
    return first
      ? { x: first.item.x + first.item.w, t: view.timing.get(storyIds.downstream(first.k)) }
      : undefined;
  }

  /** Whether a part is on the drawing at the click shown · a part that is not
   *  leaves its place empty, and comes in with its animation when its click lands. */
  private shows(view: View, id: string): boolean {
    return (view.choreography.appears.get(id) ?? 0) <= view.shown;
  }

  /** How many marks would fit, for the first picture that does not. */
  private keepThatFits(parsed: ParsedDiagram, options: LayoutOptions, frames: Frame[]) {
    const unresolved = frames.find((f) => f.drawn.status === 'unresolved');
    return unresolved ? marksThatFit(parsed, { ...options, stage: unresolved.stage }) : null;
  }

  /** The room the diagram was given · its `bounds`, else the scene's width and the
   *  height a slide holds, never wider than the canvas it sits on. */
  private room(): { w: number; h: number } {
    const asked = readBounds(this.getAttribute('bounds'));
    // The strip of the act stands above the picture, in the height a slide holds.
    const strip = this.actOf() ? ACT_HEIGHT : 0;
    return {
      w: Math.min(asked?.w ?? this.width, this.width),
      h: (asked?.h ?? DIAGRAM_ROOM_HEIGHT) - strip,
    };
  }

  /** The texts that did not fit, in every picture, each once. */
  private misfits(frames: Frame[]): Overflow[] {
    const seen = new Set<string>();
    return frames
      .flatMap((frame) => this.misfitsOf(frame.drawn))
      .filter((overflow) => {
        const key = `${overflow.item} ${overflow.field} ${overflow.text}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }

  private misfitsOf(drawn: DiagramLayout): Overflow[] {
    const found: Overflow[] = [];
    for (const item of drawn.items) {
      const texts = item.kind === 'meter' ? [...textsOf(item), ...item.figures] : textsOf(item);
      for (const text of texts) {
        if (!text.fits)
          found.push({
            item: item.node.attrs.name || item.node.attrs.label || item.key,
            field: text.role,
            text: text.lines.join(' '),
            size: text.size,
          });
      }
    }
    // A note and a link's label are texts too · one that could not be set in its
    // width is as much a defect as one in a box.
    for (const note of drawn.notes) {
      for (const text of note.texts) {
        if (!text.fits)
          found.push({
            item: note.target,
            field: `note ${text.role}`,
            text: text.lines.join(' '),
            size: text.size,
          });
      }
    }
    for (const link of drawn.links) {
      if (link.label && !link.label.fits) {
        found.push({
          item: `${link.from} to ${link.to}`,
          field: 'link label',
          text: link.label.lines.join(' '),
          size: link.label.size,
        });
      }
    }
    return found;
  }

  protected override extraIssues(): SceneIssue[] {
    const issues: SceneIssue[] = [];
    const add = (issue: SceneIssue) =>
      issues.push({
        code: issue.code,
        severity: issue.severity,
        items: issue.items,
        message: issue.message,
        ...(issue.measurement ? { measurement: issue.measurement } : {}),
        ...(issue.expected !== undefined ? { expected: issue.expected } : {}),
        fix: issue.fix,
      });
    for (const issue of this.parsed?.issues ?? []) add(issue);
    for (const issue of this.motionIssues) add(issue);
    for (const issue of this.intentIssues) add(issue);
    const pictures = this.drawnStages;
    const seen = new Set<string>();
    for (const issue of pictures.flatMap((drawn) => drawn.issues)) {
      if (seen.has(issue.message)) continue;
      seen.add(issue.message);
      add(issue);
    }
    // In a diagram with states, a picture that does not fit is named by its click.
    const unresolved = pictures
      .map((drawn, stage) => ({ drawn, stage }))
      .filter(({ drawn }) => drawn.status === 'unresolved');
    if (unresolved.length) {
      const reasons = unresolved.flatMap(({ drawn, stage }) =>
        drawn.reasons.map((r) => (pictures.length > 1 ? `click ${stage}: ${r}` : r)),
      );
      issues.push({
        code: 'DG_NO_FIT',
        severity: 'error',
        items: reasons.slice(0, 4),
        message: `the marks do not fit the room (${reasons.join('; ')}) · drawn anyway, past it`,
        fix: {
          action: 'remove-marks',
          keep: this.noFitKeep ?? 0,
          or: ['a larger `bounds`', 'direction="down"', 'gap="tight"', 'split the slide'],
        },
      });
    }
    return issues;
  }

  // ── drawing ──────────────────────────────────────────────────────────────

  private text(
    t: LText,
    onFill: 'solid' | 'inverse' | null,
    anchor: 'start' | 'middle' = 'start',
    x = t.x,
  ) {
    const cls = [
      t.role === 'value' ? 'value' : t.role,
      onFill === 'solid' ? 'on-emphasis' : onFill === 'inverse' ? 'on-inverse' : '',
    ]
      .filter(Boolean)
      .join(' ');
    return t.lines.map(
      (line, i) =>
        svg`<text class=${cls} x=${x} y=${t.y + i * t.line + t.size * BASELINE} text-anchor=${anchor} font-size=${t.size} font-weight=${t.weight}>${line}</text>`,
    );
  }

  private mark(item: LBox | LBar | LDot | LSpan | LCursor, view: View, i: number) {
    const t = view.timing.get(cueIds.item(i));
    const cls = enterClass(itemEnter(item));
    if (item.kind === 'dot') {
      const inset = item.size * DOT_INSET;
      const tone =
        item.emphasis || item.tone === 'accent'
          ? 'dot accent'
          : item.tone === 'muted'
            ? 'dot muted'
            : 'dot';
      return svg`<rect class="${tone} ${cls}" style=${at(t)} x=${item.x + inset} y=${item.y + inset} width=${item.size - 2 * inset} height=${item.size - 2 * inset} rx=${(item.size - 2 * inset) * 0.22}></rect>`;
    }
    if (item.kind === 'bar') {
      const resize = this.resize(view, i);
      // A bar in a tone is filled in it, as a stretch on an axis is · `tone` was read
      // and never painted, so a funnel could not say which step leaks.
      const lit = item.emphasis || item.tone === 'accent';
      const toned = !lit && STRETCH_TONES.has(item.tone);
      const barCls = lit ? 'bar accent' : toned ? `full fill-${item.tone}` : 'bar';
      return svg`<g class=${cls} style=${at(t)} data-role=${lit ? 'focal' : 'bar'}>
        <rect class="${barCls} ${resize.cls}" style=${resize.style} x=${item.x} y=${item.y} width=${item.w} height=${item.h} rx="10"></rect>
      </g>
      <g class="fade" style=${tail(t, BAR_TEXT_AT)}>${this.relabel(
        view,
        i,
        item.texts.map((text) => this.text(text, null)),
      )}</g>`;
    }
    if (item.kind === 'span') return this.span(item, cls, t);
    if (item.kind === 'cursor') return this.cursor(item, t);
    const proof = this.proofOf(item, view, i);
    const texts = item.texts.filter((text) => text.role !== 'proof');
    if (view.story && (item.before || item.tones.length > 1))
      return svg`<g class=${cls} style=${at(t)} data-role=${item.emphasis ? 'focal' : 'mark'}>
        ${this.storyFace(item, texts, view, i)}
      </g>${proof}`;
    const role = roleOf(item.paint, item.tone);
    const onFill = fillUnder(item.paint, role);
    return svg`<g class=${cls} style=${at(t)} data-role=${item.emphasis ? 'focal' : 'mark'}>
      ${this.turning(item, view, i)}
      ${item.icon ? this.icon(item.icon, role, onFill) : ''}
      ${this.relabel(
        view,
        i,
        texts.map((text) => this.text(text, onFill)),
      )}
    </g>${proof}`;
  }

  /** An icon · in a disc of its state on a surface that says its part, else alone. */
  private icon(
    icon: NonNullable<LBox['icon']>,
    role: string | undefined,
    onFill: 'solid' | 'inverse' | null,
  ) {
    const d = iconPath(icon.name);
    if (!d) return '';
    const size = role ? icon.size * STATE_ICON_SHARE : icon.size;
    const inset = (icon.size - size) / 2;
    const stroke = role ? `on-disc d-${role}` : onFill === 'solid' ? 'on-emphasis' : '';
    return svg`<g transform="translate(${icon.x + inset} ${icon.y + inset}) scale(${size / 24})"><path class="icon ${stroke}" d=${d}></path></g>`;
  }

  /** In a story, a box that changes on its beat · its surface of the new state comes
   *  in over the old one, and its words and its icon change: the old ones go, then
   *  the new ones come. What does not change stays. */
  private storyFace(item: LBox, texts: LText[], view: View, i: number) {
    const t = view.timing.get(storyIds.swap(i)) ?? view.timing.get(cueIds.switch(i, 1));
    const toneBefore = item.tones[0] ?? item.tone;
    const roleBefore = roleOf(item.paint, toneBefore);
    const roleAfter = roleOf(item.paint, item.tone);
    const fillBefore = fillUnder(item.paint, roleBefore);
    const fillAfter = fillUnder(item.paint, roleAfter);
    const none = { cls: '', style: '' };
    const turns = toneBefore !== item.tone;
    const replaced = item.before?.replaces;
    const iconBefore = item.before?.icon ?? item.icon;
    const iconChanges = !!item.before?.icon || (turns && roleBefore !== roleAfter);
    const steady = texts.filter((_, n) => n !== replaced);
    const after = replaced === undefined ? undefined : item.texts[replaced];
    return svg`${turns ? svg`<g class="swap-under" style=${at(t)}>${this.surface(item, toneBefore, none)}</g><g class="fade" style=${at(t)}>${this.surface(item, item.tone, none)}</g>` : this.surface(item, item.tone, none)}
      ${iconChanges && iconBefore ? svg`<g class="swap-out" style=${at(t)}>${this.icon(iconBefore, roleBefore, fillBefore)}</g>` : ''}
      ${item.icon ? svg`<g class=${iconChanges ? 'swap-in' : ''} style=${iconChanges ? at(t) : ''}>${this.icon(item.icon, roleAfter, fillAfter)}</g>` : ''}
      ${steady.map((text) => this.text(text, fillAfter))}
      ${item.before?.label ? svg`<g class="swap-out" style=${at(t)}>${this.text(item.before.label, fillBefore)}</g>` : ''}
      ${after ? svg`<g class="swap-in" style=${at(t)}>${this.text(after, fillAfter)}</g>` : ''}`;
  }

  /** In a story, the proof a box shows on its beat · a check in a disc, and its words. */
  private proofOf(item: LBox | LBar | LDot | LSpan | LCursor, view: View, i: number) {
    if (item.kind !== 'box' || !item.proofDisc) return '';
    const onFill = fillUnder(item.paint, roleOf(item.paint, item.tone));
    const text = item.texts.find((t) => t.role === 'proof');
    const check = iconPath('check');
    if (!text) return '';
    const disc = item.proofDisc;
    const size = disc.size * STATE_ICON_SHARE;
    const inset = (disc.size - size) / 2;
    return svg`<g class="pop" style=${at(view.timing.get(storyIds.proof(i)))} data-role="proof">
      <circle class="state-disc d-ok" data-role="state" cx=${disc.x + disc.size / 2} cy=${disc.y + disc.size / 2} r=${disc.size / 2}></circle>
      ${check ? svg`<g transform="translate(${disc.x + inset} ${disc.y + inset}) scale(${size / 24})"><path class="icon on-disc d-ok" d=${check}></path></g>` : ''}
      ${this.text(text, onFill)}
    </g>`;
  }

  /** On a change of picture, a surface drawn at its new size grows or shrinks from
   *  its old one · nothing otherwise. */
  private resize(view: View, i: number): { cls: string; style: string } {
    const id = cueIds.item(i);
    const move = view.change?.moves.get(id);
    if (!move || (Math.abs(move.sx - 1) < SAME_SIZE && Math.abs(move.sy - 1) < SAME_SIZE))
      return { cls: '', style: '' };
    const t = view.timing.get(morphIds.move(id));
    return {
      cls: 'resize',
      style: `${at(t)};--sx:${move.sx.toFixed(4)};--sy:${move.sy.toFixed(4)}`,
    };
  }

  /** On a change of picture, words that changed fade in as their mark moves. */
  private relabel(view: View, i: number, texts: unknown) {
    const id = cueIds.item(i);
    const move = view.change?.moves.get(id);
    if (!move?.relabel) return texts;
    return svg`<g class="relabel" style=${at(view.timing.get(morphIds.move(id)))}>${texts}</g>`;
  }

  /** A meter · its track, the fill of the click shown, its label and its figure. The
   *  fill grows from nothing as it comes in, and from its value before on a click
   *  that changes it. */
  private meterMark(item: LMeter, view: View, i: number) {
    const id = cueIds.item(i);
    const entrance = view.timing.get(id);
    const fill = atClick(item.fills, view.shown) ?? 0;
    const tone = item.emphasis ? 'accent' : (atClick(item.tones, view.shown) ?? 'normal');
    const { from, t, since } = this.valueChange(item, view, i);
    const track = item.track;
    const fillCls =
      from === undefined ? (entrance ? 'grow-x' : '') : from === fill || fill <= 0 ? '' : 'refill';
    const fillStyle =
      from === undefined
        ? at(entrance)
        : `${at(t)};--s0:${fill > 0 ? (from / fill).toFixed(4) : 0}`;
    const figure = atClick(item.figures, view.shown);
    const figureCls = from === undefined ? 'fade' : from === fill ? '' : 'relabel';
    const figureStyle = from === undefined ? tail(entrance, LABEL_AT) : at(t);
    // In a story the gauge reads its value before its beat until the beat: its figure
    // and its fill in the tone it had, which give way as it fills to the new one.
    const before =
      view.story && from !== undefined && from !== fill && t
        ? {
            from,
            figure: atClick(item.figures, since - 1),
            tone: item.emphasis ? 'accent' : (atClick(item.tones, since - 1) ?? 'normal'),
          }
        : undefined;
    if (before) {
      const track = item.track;
      return svg`<g class=${enterClass(itemEnter(item) === 'draw' ? 'fade' : itemEnter(item))} style=${at(entrance)} data-role=${item.emphasis ? 'focal' : 'mark'}>
          <rect class="meter-track" x=${track.x} y=${track.y} width=${track.w} height=${track.h} rx=${track.h / 2}></rect>
          ${item.texts.slice(0, -1).map((text) => this.text(text, null))}
        </g>
        <rect class="full fill-${tone} refill" style="${at(t)};--s0:${(before.from / fill).toFixed(4)}" x=${track.x} y=${track.y} width=${fill} height=${track.h} rx=${Math.min(track.h, fill) / 2}></rect>
        ${before.from > 0 ? svg`<rect class="full fill-${before.tone} swap-out" style=${at(t)} x=${track.x} y=${track.y} width=${before.from} height=${track.h} rx=${Math.min(track.h, before.from) / 2}></rect>` : ''}
        ${before.figure ? svg`<g class="swap-out" style=${at(t)}>${this.text(before.figure, null)}</g>` : ''}
        ${figure ? svg`<g class="swap-in" style=${at(t)}>${this.text(figure, null)}</g>` : ''}
        ${item.threshold === undefined ? '' : svg`<line class="threshold fade" data-role="overlay" style=${tail(entrance, LABEL_AT)} x1=${item.threshold} x2=${item.threshold} y1=${track.y - THRESHOLD_REACH} y2=${track.y + track.h + THRESHOLD_REACH}></line>`}`;
    }
    // The threshold is drawn over the fill · the fill reaching it is the point.
    const threshold =
      item.threshold === undefined
        ? ''
        : svg`<line class="threshold fade" data-role="overlay" style=${tail(entrance, LABEL_AT)} x1=${item.threshold} x2=${item.threshold} y1=${track.y - THRESHOLD_REACH} y2=${track.y + track.h + THRESHOLD_REACH}></line>`;
    return svg`<g class=${enterClass(itemEnter(item) === 'draw' ? 'fade' : itemEnter(item))} style=${at(entrance)} data-role=${item.emphasis ? 'focal' : 'mark'}>
        <rect class="meter-track" x=${track.x} y=${track.y} width=${track.w} height=${track.h} rx=${track.h / 2}></rect>
        ${item.texts.slice(0, -1).map((text) => this.text(text, null))}
      </g>
      ${keyed(
        since,
        svg`${fill > 0 ? svg`<rect class="full fill-${tone} ${fillCls}" style=${fillStyle} x=${track.x} y=${track.y} width=${fill} height=${track.h} rx=${Math.min(track.h, fill) / 2}></rect>` : ''}
        ${figure ? svg`<g class=${figureCls} style=${figureStyle}>${this.text(figure, null)}</g>` : ''}`,
      )}
      ${threshold}`;
  }

  /** A queue · its places, those taken on the click shown filled. Places taken on a
   *  click pop in one after the other, places freed fade out. */
  private queueMark(item: LQueue, view: View, i: number) {
    const id = cueIds.item(i);
    const entrance = view.timing.get(id);
    const count = item.cells.length;
    const fill = atClick(item.fills, view.shown) ?? 0;
    const tone = item.emphasis ? 'accent' : (atClick(item.tones, view.shown) ?? 'normal');
    const { from, t, since } = this.valueChange(item, view, i);
    const taken = takenPlaces(count, fill);
    const before = new Set(takenPlaces(count, from ?? 0));
    // A freed place is seen fading only while the diagram plays · at rest it is empty.
    const freed = this.playing ? [...before].filter((n) => !taken.includes(n)) : [];
    // On entry every taken place comes in; on a change, those not taken before.
    const timing = from === undefined ? entrance : t;
    const arriving = taken.filter((n) => from === undefined || !before.has(n));
    const step = timing && arriving.length ? timing.duration / (arriving.length + 1) : 0;
    const takeStyle = (n: number) => {
      if (!timing || !arriving.includes(n)) return '';
      const rank = arriving.length - 1 - arriving.indexOf(n);
      return `--t0:${(timing.start + rank * step).toFixed(3)}s;--du:${(2 * step).toFixed(3)}s`;
    };
    return svg`<g class=${enterClass(itemEnter(item) === 'draw' ? 'fade' : itemEnter(item))} style=${at(entrance)} data-role=${item.emphasis ? 'focal' : 'mark'}>
        ${item.cells.map((c) => svg`<rect class="cell" x=${c.x} y=${c.y} width=${c.w} height=${c.h} rx=${c.w * 0.22}></rect>`)}
        ${item.texts.map((text) => this.text(text, null))}
      </g>
      ${keyed(
        since,
        svg`${taken.map((n) => {
          const c = item.cells[n]!;
          return svg`<rect class="full fill-${tone} ${takeStyle(n) ? 'take' : ''}" style=${takeStyle(n)} x=${c.x} y=${c.y} width=${c.w} height=${c.h} rx=${c.w * 0.22}></rect>`;
        })}
        ${freed.map((n) => {
          const c = item.cells[n]!;
          return svg`<rect class="full fill-${tone} leave" style=${at(t)} x=${c.x} y=${c.y} width=${c.w} height=${c.h} rx=${c.w * 0.22}></rect>`;
        })}`,
      )}`;
  }

  /** A curve · its baseline and its threshold come in with its words, then the series
   *  is traced from its first value to its last; the point where it crosses its line
   *  comes in as the trace reaches it · that point is the one put forward, so the last
   *  point is drawn only on a curve that crosses nothing. */
  private curveMark(item: LCurve, view: View, i: number) {
    const t = view.timing.get(cueIds.item(i));
    const traced = itemEnter(item) === 'draw';
    const lit = item.emphasis || item.tone === 'accent';
    const toned = !lit && item.tone === 'muted' ? 'tone-muted' : '';
    const { plot, points, threshold, crossing } = item;
    const base = plot.y + plot.h;
    const last = points.at(-1);
    const d = `M${points.map((p) => `${p.x} ${p.y}`).join('L')}`;
    // The ground under the curve · what it amounts to reads as a surface, and the
    // surface comes in once the trace has shown the shape.
    const area = `${d}L${last?.x ?? plot.x} ${base}L${points[0]?.x ?? plot.x} ${base}Z`;
    return svg`${points.length > 1 ? svg`<path class="card curve-area fade" style=${tail(t, AREA_AT)} d=${area}></path>` : ''}
      <g class=${traced ? 'fade' : enterClass(itemEnter(item))} style=${at(t)} data-role="mark">
        <path class="line muted" d="M${plot.x} ${base}H${plot.x + plot.w}"></path>
        ${threshold === undefined ? '' : svg`<path class="line dash" data-role="overlay" d="M${plot.x} ${threshold}H${plot.x + plot.w}"></path>`}
        ${item.texts.map((text) => this.text(text, null))}
      </g>
      ${points.length > 1 ? svg`<path class="curve ${lit ? 'accent' : toned} ${traced ? 'draw' : ''}" pathLength="1" data-role=${lit ? 'focal' : 'mark'} style=${at(t)} d=${d}></path>` : ''}
      ${last && !crossing ? svg`<circle class="dot ${lit ? 'accent' : ''} pop" style=${tail(t, LAST_POINT_AT)} cx=${last.x} cy=${last.y} r=${CURVE_DOT}></circle>` : ''}
      ${crossing ? svg`<circle class="dot ${lit ? 'accent' : ''} pop" data-role=${lit ? 'focal' : 'mark'} style=${tail(t, crossing.share)} cx=${crossing.at.x} cy=${crossing.at.y} r=${CROSSING_DOT}></circle>` : ''}`;
  }

  /** What a meter or a queue showed before the click it last changed on, and when it
   *  changes · nothing before (`from` absent) when it is coming in. On a change of
   *  picture, its value in the picture before; on a click of its own, its value on
   *  the click before. */
  private valueChange(
    item: LMeter | LQueue,
    view: View,
    i: number,
  ): { from?: number; t?: Timing; since: number } {
    const id = cueIds.item(i);
    if (view.change) {
      const move = view.change.moves.get(id);
      return move?.fill === undefined
        ? { since: view.shown }
        : { from: move.fill, t: view.timing.get(morphIds.move(id)), since: view.shown };
    }
    const appears = view.choreography.appears.get(id) ?? 0;
    const since = lastChange(item, appears, view.shown);
    if (since === appears) return { since };
    return {
      from: atClick(item.fills, since - 1),
      t: view.timing.get(cueIds.switch(i, since)),
      since,
    };
  }

  /** A value on an axis · a point, a stretch, or its label alone, and the track
   *  under it when it is the one that draws it. */
  private span(item: LSpan, cls: string, t: Timing | undefined) {
    const lit = item.emphasis || item.tone === 'accent';
    // A stretch in a tone is filled in it, like a gauge · the gaps of a drift read as
    // ink, the one put forward in the accent, and their rails step back behind them.
    const toned = !lit && STRETCH_TONES.has(item.tone);
    const track = item.track
      ? svg`<path class="line muted draw ${toned ? 'rail-faint' : ''}" pathLength="1" style=${at(t)} d="M${item.track.x0} ${item.track.y0}L${item.track.x1} ${item.track.y1}"></path>`
      : '';
    const stretchCls = lit ? 'bar accent' : toned ? `full fill-${item.tone}` : 'bar';
    const shape =
      item.shape === 'point'
        ? svg`<circle class="dot ${lit ? 'accent' : ''}" cx=${item.x + item.w / 2} cy=${item.y + item.h / 2} r=${Math.min(item.w, item.h) / 2}></circle>`
        : item.shape === 'stretch'
          ? svg`<rect class=${stretchCls} x=${item.x} y=${item.y} width=${item.w} height=${item.h} rx=${SPAN_RADIUS}></rect>`
          : '';
    return svg`${track}<g class=${cls} style=${at(t)} data-role=${lit ? 'focal' : 'mark'}>${shape}</g>
      <g class="fade" style=${tail(t, BAR_TEXT_AT)}>${item.texts.map((text) => this.text(text, null))}</g>`;
  }

  /** A cursor travels from the start of its axis to its value, its word with it. */
  private cursor(item: LCursor, t: Timing | undefined) {
    const travels = itemEnter(item) === 'draw';
    return svg`<g class=${travels ? 'travel' : enterClass(itemEnter(item))} style="${at(t)};--bx:${item.travel.x}px;--by:${item.travel.y}px">
      <rect class="cursor ${item.tone === 'accent' ? 'accent' : ''}" data-role="overlay" x=${item.x} y=${item.y} width=${item.w} height=${item.h} rx=${item.w / 2}></rect>
      ${item.texts.map((text) => this.text(text, null))}
    </g>`;
  }

  /** A box's surface in the tone of the click shown · on the click it turns, the new
   *  tone fades in over the old one. */
  private turning(box: LBox, view: View, i: number) {
    const resize = this.resize(view, i);
    const tone = atClick(box.tones, view.shown) ?? box.tone;
    const appears = view.choreography.appears.get(cueIds.item(i)) ?? 0;
    const since = view.change ? appears : lastChange(box, appears, view.shown);
    if (since === appears) return this.surface(box, tone, resize);
    const before = atClick(box.tones, since - 1) ?? tone;
    const t = view.timing.get(cueIds.switch(i, since));
    return svg`${this.playing ? this.surface(box, before, resize) : ''}
      ${keyed(since, svg`<g class="fade" style=${at(t)}>${this.surface(box, tone, resize)}</g>`)}`;
  }

  private surface(box: LBox, shown: string, resize: { cls: string; style: string }) {
    if (box.paint === 'none') return '';
    const role = roleOf(box.paint, shown);
    if (role) {
      const disc = box.icon;
      return svg`<rect class="p-${role} ${resize.cls}" style=${resize.style} x=${box.x} y=${box.y} width=${box.w} height=${box.h} rx=${ROLE_RADIUS}></rect>
        ${disc ? svg`<circle class="state-disc d-${role}" data-role="state" cx=${disc.x + disc.size / 2} cy=${disc.y + disc.size / 2} r=${disc.size / 2}></circle>` : ''}`;
    }
    const tone = shown === 'ok' || shown === 'warn' || shown === 'danger' ? ` tone-${shown}` : '';
    const cls =
      box.paint === 'solid'
        ? 'emphasis'
        : box.paint === 'inverse'
          ? 'p-inverse'
          : box.paint === 'outline'
            ? 'p-outline'
            : 'card';
    return svg`<rect class="${cls}${tone} ${resize.cls}" style=${resize.style} x=${box.x} y=${box.y} width=${box.w} height=${box.h} rx="16"></rect>`;
  }

  private frame(frame: LFrame, view: View, i: number) {
    if (frame.paint === 'none' && !frame.caption) return '';
    const role = roleOf(frame.paint, frame.tone);
    const cls = role
      ? `p-${role}`
      : frame.paint === 'outline'
        ? 'frame-outline'
        : frame.paint === 'inverse'
          ? 'frame-inverse'
          : frame.paint === 'solid'
            ? 'emphasis'
            : 'frame-soft';
    const resize = this.resize(view, i);
    const onFill = fillUnder(frame.paint, role);
    return svg`<g class=${enterClass(itemEnter(frame))} data-role="frame" style=${at(view.timing.get(cueIds.item(i)))}>
      ${frame.paint === 'none' ? '' : svg`<rect class="${cls} ${resize.cls}" style=${resize.style} x=${frame.x} y=${frame.y} width=${frame.w} height=${frame.h} rx=${role ? ROLE_RADIUS + 2 : 20}></rect>`}
      ${frame.caption ? this.relabel(view, i, this.text(frame.caption, onFill)) : ''}
    </g>`;
  }

  /** An arrow head at the end of a polyline. */
  private head(points: { x: number; y: number }[], cls: string, style: string) {
    const end = points.at(-1)!;
    const wings = arrowWings(points);
    if (!wings) return '';
    const [a, b] = wings;
    return svg`<path class="head ${cls}" style=${style} d="M${a.x} ${a.y}L${end.x} ${end.y}L${b.x} ${b.y}"></path>`;
  }

  private drawLink(link: LLink, view: View, j: number) {
    const [first, ...rest] = link.points;
    if (!first || !rest.length) return '';
    const d = `M${first.x} ${first.y}${rest.map((p) => `L${p.x} ${p.y}`).join('')}`;
    const t = view.timing.get(cueIds.link(j));
    // On a change of picture a new link is traced, unless it says otherwise.
    const enter = view.change ? transitionLinkEnter(link) : linkEnter(link);
    const draws = enter === 'draw' && !link.dashed;
    const later = (share: number) => (draws ? tail(t, share) : at(t));
    const line = draws
      ? svg`<path class="line draw" pathLength="1" style=${at(t)} d=${d}></path>`
      : svg`<path class="line ${link.dashed ? 'dash' : ''} ${enterClass(enter)}" style=${at(t)} d=${d}></path>`;
    const turn = view.story && link.node?.attrs.turn ? `turn-${link.node.attrs.turn}` : '';
    return svg`${line}
      ${link.head ? this.head(link.points, draws ? 'fade' : enterClass(enter), later(HEAD_AT)) : ''}
      ${this.riding(link, j, view) ? this.ride(link, d, view.timing.get(cueIds.ride(j)), turn) : ''}
      ${this.steadyRides(view, storyIds.linkSteady(j), d)}
      ${this.lever(link, view, j)}`;
  }

  /** The tokens of an established flow along a link, in a story · one ride each. */
  private steadyRides(view: View, id: string, d: string) {
    const departures = view.story?.departures.get(id);
    const trip = view.story?.trips.get(id);
    if (!departures?.length || !trip || !this.playing) return '';
    return departures.map(
      (start) =>
        svg`<circle class="ride" r=${TOKEN_RADIUS} style="offset-path:path('${d}');--t0:${start.toFixed(3)}s;--du:${trip.toFixed(3)}s"></circle>`,
    );
  }

  /** A lever at the start of a link · it points along the link at rest, and turns
   *  there on its beat from the link it carried the flow along before. */
  private lever(link: LLink, view: View, j: number) {
    const t = view.timing.get(storyIds.lever(j));
    const [a, b] = link.points;
    if (!t || !a || !b) return '';
    const angle = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
    const length = Math.min(LEVER_LENGTH, Math.hypot(b.x - a.x, b.y - a.y) / 2);
    const turn = view.story?.levers.get(storyIds.lever(j)) ?? 0;
    return svg`<g transform="translate(${a.x} ${a.y}) rotate(${angle.toFixed(2)})" data-role="overlay">
      <g class="pivot" style="${at(t)};--turn:${turn.toFixed(2)}deg"><line class="lever" x1="0" y1="0" x2=${length.toFixed(1)} y2="0"></line></g>
    </g>`;
  }

  /** A link's label · it comes in half way along a traced line, with the line else. */
  private linkLabel(link: LLink, view: View, j: number) {
    if (!link.label) return '';
    const t = view.timing.get(cueIds.link(j));
    const enter = view.change ? transitionLinkEnter(link) : linkEnter(link);
    const draws = enter === 'draw' && !link.dashed;
    return svg`<g class="fade" data-role="link-label" style=${draws ? tail(t, LABEL_AT) : at(t)}>${this.text(link.label, null, 'middle', link.label.x)}</g>`;
  }

  /** Tokens ride a link only while the diagram plays, from the click they wait for. */
  private riding(link: LLink, j: number, view: View): boolean {
    const t = view.timing.get(cueIds.ride(j));
    return link.flow > 0 && this.playing && !!t && t.stage <= view.shown;
  }

  /** Tokens riding a link, one after the other · seen only while they travel. */
  private ride(link: LLink, d: string, t: Timing | undefined, turn = '') {
    if (!t) return '';
    const total = rideSeconds(link) + (link.flow - 1) * RIDE_SPACING;
    const scale = total > 0 ? t.duration / total : 1;
    return Array.from(
      { length: link.flow },
      (_, n) =>
        svg`<circle class="ride ${turn}" r=${TOKEN_RADIUS} style="offset-path:path('${d}');--t0:${(t.start + n * RIDE_SPACING * scale).toFixed(3)}s;--du:${(rideSeconds(link) * scale).toFixed(3)}s"></circle>`,
    );
  }

  /** A lane · its icon in a disc, its label, its track and the arrow at its end. In a
   *  story, what lies past a gate that closes pales once the tokens have stopped. */
  private lane(lane: LLane, view: View, i: number, cut?: { x: number; t?: Timing }) {
    const t = view.timing.get(cueIds.item(i));
    const enter = itemEnter(lane);
    const labelCls = enter === 'draw' ? 'pop' : enterClass(enter);
    const icon = lane.icon ? iconPath(lane.icon.name) : null;
    const disc = lane.icon;
    const track = `M${lane.track.x0} ${lane.cy}H${cut ? cut.x : lane.track.x1}`;
    const ends = [
      { x: lane.track.x0, y: lane.cy },
      { x: lane.track.x1, y: lane.cy },
    ];
    // Past the cut, the track comes in as its trace reaches it.
    const reached = cut ? (cut.x - lane.track.x0) / Math.max(1, lane.track.x1 - lane.track.x0) : 0;
    const past = cut
      ? svg`<g class="dim-to" style=${at(cut.t)}><g class="fade" style=${tail(t, reached)}><path class="line muted" d="M${cut.x} ${lane.cy}H${lane.track.x1}"></path>
          ${lane.head ? this.head(ends, 'muted', '') : ''}</g></g>`
      : '';
    return svg`<g class=${labelCls} style=${at(t)}>
        ${
          disc && icon
            ? svg`<circle class="disc" cx=${disc.x + disc.size / 2} cy=${disc.y + disc.size / 2} r=${disc.size / 2}></circle>
              <g transform="translate(${disc.x + (disc.size * (1 - DISC_ICON_SHARE)) / 2} ${disc.y + (disc.size * (1 - DISC_ICON_SHARE)) / 2}) scale(${(disc.size * DISC_ICON_SHARE) / 24})"><path class="icon" d=${icon}></path></g>`
            : ''
        }
        ${lane.texts.map((text) => this.text(text, null))}
      </g>
      <path class="line muted ${enter === 'draw' ? 'draw' : labelCls}" pathLength="1" style=${at(t)} d=${track}></path>
      ${cut ? past : lane.head ? this.head(ends, 'muted fade', tail(t, HEAD_AT)) : ''}`;
  }

  /** A gate across its lanes, in the state of the click shown · it drops again,
   *  as a new bar, on each click that changes it. */
  private gate(gate: LGate, view: View, i: number) {
    const appears = view.choreography.appears.get(cueIds.item(i)) ?? 0;
    const since = lastChange(gate, appears, view.shown);
    const state = gateStateAt(gate, view.shown, appears) ?? 'closed';
    const entrance = view.timing.get(cueIds.item(i));
    const t = since === appears ? entrance : view.timing.get(cueIds.switch(i, since));
    const enter = itemEnter(gate);
    const cls = enter === 'draw' ? 'drop' : enterClass(enter);
    // In a story the bar that drops on the beat is not there before it.
    const dropCls = view.story && since > appears && enter === 'draw' ? 'drop drop-in' : cls;
    const feed = gate.feed;
    return svg`${
      feed
        ? svg`<path class="line draw" pathLength="1" style=${at(entrance)} d="M${feed.map((p) => `${p.x} ${p.y}`).join('L')}"></path>`
        : ''
    }
      ${
        // In a story the gate stands as it was until its beat, then drops anew.
        view.story && since > appears
          ? svg`<g class=${cls} style=${at(entrance)}><rect class="gate gate-${gateStateAt(gate, since - 1, appears) ?? 'open'} swap-under" data-role="barrier" style=${at(t)} x=${gate.x} y=${gate.y} width=${gate.w} height=${gate.h} rx=${GATE_RADIUS}></rect></g>`
          : ''
      }
      ${keyed(
        since,
        svg`<rect class="gate gate-${state} ${dropCls}" data-role="barrier" style=${at(t)} x=${gate.x} y=${gate.y} width=${gate.w} height=${gate.h} rx=${GATE_RADIUS}></rect>`,
      )}
      <g class="fade" style=${at(entrance)}>${gate.texts.map((text) => this.text(text, null))}</g>`;
  }

  /** A lane's tokens, as the last run up to the click shown left them · a new run
   *  is new tokens, so its motion starts when its click lands. */
  private tokens(lane: LLane, view: View, i: number) {
    const appears = view.choreography.appears.get(cueIds.item(i)) ?? 0;
    const run = runsShown(lane, appears)
      .filter((r) => r.stage <= view.shown)
      .at(-1);
    const passing = this.passing(lane, view, i);
    if (!run) return passing;
    const t = view.timing.get(cueIds.run(i, run.stage));
    const scale = t && run.duration > 0 ? t.duration / run.duration : 1;
    const start = t?.start ?? 0;
    return keyed(
      run.stage,
      svg`<g data-role="tokens">${run.tokens.map((token) => {
        const t0 = start + token.delay * scale;
        const du = token.duration * scale;
        return svg`<circle class="token travel ${token.fate === 'refuse' ? 'refused' : ''}" cx=${token.to} cy=${lane.cy} r=${TOKEN_RADIUS}
          style="--bx:${token.from - token.to}px;--t0:${t0.toFixed(3)}s;--du:${du.toFixed(3)}s;--t1:${(t0 + du).toFixed(3)}s"></circle>`;
      })}</g>${passing}`,
    );
  }

  /** In a story, the tokens of a lane's established flow · each crosses the whole
   *  track and is gone, so the picture at rest keeps only the tokens that stopped. */
  private passing(lane: LLane, view: View, i: number) {
    const departures = view.story?.departures.get(storyIds.steady(i));
    const trip = view.story?.trips.get(storyIds.steady(i));
    if (!departures?.length || !trip || !this.playing) return '';
    const from = lane.track.x0 + TOKEN_RADIUS;
    const to = lane.track.x1 - ARROW_ROOM - TOKEN_RADIUS;
    return svg`<g data-role="tokens">${departures.map(
      (start) =>
        svg`<circle class="pass" cx=${to} cy=${lane.cy} r=${TOKEN_RADIUS} style="--bx:${from - to}px;--t0:${start.toFixed(3)}s;--du:${trip.toFixed(3)}s"></circle>`,
    )}</g>`;
  }

  private note(note: LNote, view: View, k: number) {
    const t = view.timing.get(cueIds.note(k));
    return svg`<g class=${enterClass(noteEnter(note))} style=${at(t)}>
      ${note.leader ? svg`<line class="line muted leader" x1=${note.leader[0].x} y1=${note.leader[0].y} x2=${note.leader[1].x} y2=${note.leader[1].y}></line>` : ''}
      ${note.status ? drawStatus(note, k, this.pen(view)) : note.texts.map((text) => this.text(text, null))}
    </g>`;
  }

  /** What a mark that tells a story needs to know of the time · diagram/draw-marks.ts. */
  private pen(view: View): Pen {
    return {
      t: (id) => view.timing.get(id),
      shown: view.shown,
      appears: (id) => view.choreography.appears.get(id) ?? 0,
    };
  }

  /** A terminal, a table, a switch, a timer, a band, people, a screen, a counter · it
   *  comes in as a surface does, and acts on its beat in a story. */
  private piece(item: LPiece, view: View, i: number) {
    const enter = itemEnter(item);
    return svg`<g class=${enter === 'draw' ? 'fade' : enterClass(enter)} style=${at(view.timing.get(cueIds.item(i)))} data-role=${item.emphasis ? 'focal' : 'mark'}>
      ${drawPiece(item, i, this.pen(view))}
    </g>`;
  }

  /** What a screen reader hears: every label and note, in reading order. */
  private description(drawn: DiagramLayout): string {
    return drawn.items
      .map((item) =>
        textsOf(item)
          .map((t) => t.lines.join(' '))
          .join(', '),
      )
      .filter(Boolean)
      .join('. ');
  }
}

interface View {
  choreography: Choreography;
  timing: Map<string, Timing>;
  /** The click whose state is drawn. */
  shown: number;
  /** On a click that changes the picture · what moves, what comes in. */
  change?: Transition;
  /** A story played on entry · the time of its beats, its flows and its levers. */
  story?: StoryPlan;
}

/** How one picture becomes the next. */
interface Change {
  plan: Transition;
  timing: Map<string, Timing>;
  issues: (MotionIssue | DgIssue)[];
}

// The marks are data · they draw nothing themselves, the diagram reads them. They
// are defined (as empty elements that observe the attributes they accept) so that
// `check` can tell a mark from a typo, and an attribute a mark does not read from
// one it does.
for (const [tag, kind] of Object.entries(MARK_TAGS)) {
  if (customElements.get(tag)) continue;
  const accepted = [...MARK_ATTRIBUTES[kind]];
  customElements.define(
    tag,
    class extends HTMLElement {
      static observedAttributes = accepted;
    },
  );
}

declare global {
  interface HTMLElementTagNameMap {
    'deck-diagram': DeckDiagram;
  }
}
