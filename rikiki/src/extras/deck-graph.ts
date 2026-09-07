// ════════════════════════════════════════════════════════════════
// <deck-graph>
//   <deck-node id="a" at="10,50" label="Client"></deck-node>
//   <deck-node id="b" at="50,50" label="Gateway"></deck-node>
//   <deck-node id="c" at="90,30" label="Service"></deck-node>
//   <deck-edge from="a" to="b" label="HTTP"></deck-edge>
//   <deck-edge from="b" to="c" dashed></deck-edge>
// </deck-graph>
//
// The primitive behind every "boxes and arrows" slide. A chain, an
// architecture sketch, a decision tree and a dependency map are all the same
// thing: nodes the author places, and edges between them.
//
// WHY NOT MERMAID · mermaid renders an opaque SVG from a text DSL. It does not
// follow the deck's tokens, it cannot be revealed a node at a time, and it
// weighs 1 MB. This is thirty lines of SVG that inherits the theme, reveals
// with the engine's own steps, prints, and is hand-editable in 2031.
//
// WHY NO AUTO-LAYOUT · placing the nodes IS the diagram. An automatic layout
// engine is a solver whose output changes when you add a node, which breaks
// "source = output" and would make the file unreadable. `at="x,y"` in percent
// is the whole layout language, plus two canned arrangements for the common
// cases (see `layout`).
//
// OPT-IN · <script type="module" src="dist/deck-graph.js"></script>
// ════════════════════════════════════════════════════════════════

import { LitElement, css, html, svg } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { arrange, edgeGeometry } from '../shared/graph-layout.js';
import { signature } from './signature.js';

@customElement('deck-graph')
export class DeckGraph extends LitElement {
  /* Customization tokens:
       --deck-graph-edge / --deck-graph-edge-width / --deck-graph-edge-label
       --deck-graph-ratio   aspect ratio of the drawing area                 */
  static override styles = [
    signature,
    css`
    :host {
      display: block;
      position: relative;
      width: 100%;
      aspect-ratio: var(--deck-graph-ratio, 16 / 7);
      min-height: 0;
      font-family: var(--rik-font-sans);
    }
    /* The edges are one SVG behind the nodes · lines belong in vector space,
       labels belong in the DOM where they inherit the theme's type.
       The viewBox is the element's PIXEL box, measured. A percentage viewBox
       with preserveAspectRatio="none" stretches the two axes differently, and
       a stroke under a non-uniform scale is either anisotropic or, with
       vector-effect, not painted at all in Firefox. */
    svg {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      overflow: visible;
      pointer-events: none;
    }
    .edge {
      fill: none;
      /* A text-grade token, not a border one · --rik-border-default is a hair
         away from the page colour and a line drawn in it is invisible on a
         projector, which is the only screen that matters here. */
      /* Thick, and in the reading grade rather than the faint one. Two
         pixels of a colour a hair from the page is a hairline in a tint · the
         two things this medium is documented not to carry, drawn together.
         An edge is the message of a boxes-and-arrows slide, not its scaffold. */
      stroke: var(--deck-graph-edge, var(--rik-text-default--muted));
      stroke-width: var(--deck-graph-edge-width, 4);
      stroke-linecap: round;
      transition: stroke 0.2s ease, opacity 0.2s ease;
    }
    .edge[data-dashed] {
      stroke-dasharray: 6 6;
    }
    .edge[data-active] {
      stroke: var(--rik-accent);
    }
    .edge[data-pending] {
      opacity: 0.2;
    }
    .head {
      fill: var(--deck-graph-edge, var(--rik-text-default--muted));
    }
    /* A drawing annotates itself · an edge carries a short name. Plain sans at
       a smaller size, not a tracked-out mono tag: the convention comes from
       technical drawings, the mono uppercase came from nowhere. */
    .tag {
      font-family: var(--rik-font-sans);
      font-size: var(--deck-graph-tag-size, 0.95em);
      line-height: 1.2;
    }
    .edge-label {
      position: absolute;
      transform: translate(-50%, -50%);
      background: var(--rik-surface-page);
      padding-inline: var(--rik-space-1);
      white-space: nowrap;
      color: var(--deck-graph-edge-label, var(--rik-text-default--faint));
    }
    @media print {
      .edge, .arrow { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .edge[data-pending] { opacity: 1; }
    }
  `,
  ];

  /** `free` (default, author places every node), `row` or `column` · the two
   *  arrangements that would otherwise be typed out by hand every time. */
  @property({ type: String, reflect: true }) layout: 'free' | 'row' | 'column' = 'free';

  /** Walk the graph one node per step · emphasis, not concealment. */
  @property({ type: Boolean, reflect: true }) reveal = false;

  @state() private _tick = 0;
  /** The element's pixel box · the SVG coordinate space. */
  @state() private _box = { w: 0, h: 0 };
  private _ro?: ResizeObserver;

  private get _nodes(): HTMLElement[] {
    return [...this.querySelectorAll<HTMLElement>('deck-node')];
  }

  private get _edges(): HTMLElement[] {
    return [...this.querySelectorAll<HTMLElement>('deck-edge')];
  }

  override firstUpdated(): void {
    // Edge geometry is in pixels, so it is recomputed whenever the box changes.
    this._ro = new ResizeObserver(() => this._measure());
    this._ro.observe(this);
    this._measure();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._ro?.disconnect();
    this._ro = undefined;
  }

  private _measure(): void {
    const r = this.getBoundingClientRect();
    if (r.width && r.height) this._box = { w: r.width, h: r.height };
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this._place();
    if (!this.reveal) return;
    let slide: Element | null = this;
    while (slide?.parentElement && slide.parentElement.tagName.toLowerCase() !== 'deck-root') {
      slide = slide.parentElement;
    }
    if (!slide?.parentElement) return;
    const needed = this._nodes.length;
    const declared = Number(slide.getAttribute('steps') ?? slide.getAttribute('data-steps') ?? '0');
    if (needed > declared) slide.setAttribute('data-steps', String(needed));
  }

  /** Give every node a position · either the one the author wrote, or the one
   *  the canned arrangement computes. */
  private _place(): void {
    const nodes = this._nodes;
    const points = arrange(
      nodes.map((n) => n.getAttribute('at')),
      this.layout,
    );
    nodes.forEach((node, i) => {
      const p = points[i]!;
      node.style.setProperty('--nx', `${p.x}%`);
      node.style.setProperty('--ny', `${p.y}%`);
      node.dataset['x'] = String(p.x);
      node.dataset['y'] = String(p.y);
    });

    // Regions and bands · four numbers and two, both in percent, both written
    // by the author for the same reason the nodes are.
    for (const group of this.querySelectorAll<HTMLElement>('deck-group')) {
      const [x = 0, y = 0, w = 20, h = 20] = (group.getAttribute('at') ?? '')
        .split(',')
        .map((n) => Number(n.trim()))
        .map((n) => (Number.isFinite(n) ? n : 0));
      group.style.setProperty('--gx', `${x}%`);
      group.style.setProperty('--gy', `${y}%`);
      group.style.setProperty('--gw', `${w}%`);
      group.style.setProperty('--gh', `${h}%`);
    }
    for (const lane of this.querySelectorAll<HTMLElement>('deck-lane')) {
      const [y = 0, h = 25] = (lane.getAttribute('at') ?? '')
        .split(',')
        .map((n) => Number(n.trim()))
        .map((n) => (Number.isFinite(n) ? n : 0));
      lane.style.setProperty('--ly', `${y}%`);
      lane.style.setProperty('--lh', `${h}%`);
    }
    this._tick++;
  }

  /** Called by deck-root on every step change. */
  applyStep(step: number): void {
    if (!this.reveal) return;
    this._nodes.forEach((n, i) => {
      n.toggleAttribute('active', i + 1 === step);
      n.toggleAttribute('pending', step > 0 && i + 1 > step);
    });
    this._tick++;
  }

  override render() {
    // Recomputed whenever _tick changes · the geometry is derived from the
    // nodes' resolved positions, which the author or the arrangement set.
    void this._tick;
    const at = (el: Element | null) =>
      el ? { x: Number(el.getAttribute('data-x')), y: Number(el.getAttribute('data-y')) } : null;

    const edges = this._edges.map((edge) => {
      const from = at(this.querySelector(`#${CSS.escape(edge.getAttribute('from') ?? '')}`));
      const to = at(this.querySelector(`#${CSS.escape(edge.getAttribute('to') ?? '')}`));
      return { edge, geom: from && to ? edgeGeometry(from, to) : null };
    });

    const { w, h } = this._box;
    // Percentages are the author's language; pixels are the drawing's.
    const px = (g: { x1: number; y1: number; x2: number; y2: number }) => ({
      x1: (g.x1 / 100) * w,
      y1: (g.y1 / 100) * h,
      x2: (g.x2 / 100) * w,
      y2: (g.y2 / 100) * h,
    });

    return html`
      <svg viewBox="0 0 ${w || 1} ${h || 1}" aria-hidden="true">
        <defs>
          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path class="head" d="M0 0 L10 5 L0 10 z" />
          </marker>
        </defs>
        ${edges.map(({ edge, geom }) => {
          if (!geom || !w) return '';
          const p = px(geom);
          // `svg` and not `html` · a nested html`` fragment is parsed in the
          // HTML namespace, so its <line> becomes an unknown element that is
          // never painted. It reports the right coordinates and draws nothing.
          // The arrow is the direction · a line with no head reads as a
          // relation, and most of these diagrams describe a flow.
          const arrow = (edge.getAttribute('arrow') ?? 'end').toLowerCase();
          return svg`<line
            class="edge"
            ?data-dashed=${edge.hasAttribute('dashed')}
            x1=${p.x1}
            y1=${p.y1}
            x2=${p.x2}
            y2=${p.y2}
            marker-end=${arrow === 'end' || arrow === 'both' ? 'url(#arrow)' : ''}
            marker-start=${arrow === 'start' || arrow === 'both' ? 'url(#arrow)' : ''}
          />`;
        })}
      </svg>
      ${edges.map(({ edge, geom }) =>
        geom && edge.getAttribute('label')
          ? html`<span
              class="tag edge-label"
              style="left:${geom.mx}%;top:${geom.my}%"
              >${edge.getAttribute('label')}</span
            >`
          : '',
      )}
      <slot @slotchange=${() => this._place()}></slot>
    `;
  }
}

@customElement('deck-node')
export class DeckNode extends LitElement {
  /* Customization tokens:
       --deck-node-color / --deck-node-rule / --deck-node-size
       --deck-node-pending-opacity                                           */
  static override styles = [
    signature,
    css`
    :host {
      position: absolute;
      left: var(--nx, 50%);
      top: var(--ny, 50%);
      transform: translate(-50%, -50%);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--rik-space-1);
      text-align: center;
      max-width: var(--deck-node-size, 14ch);
      transition: opacity 0.2s ease;
    }
    :host([pending]) {
      opacity: var(--deck-node-pending-opacity, 0.25);
    }
    /* Bare · the node is words on the field, and the edges carry the
       structure. It used to also draw a rule under the label, which added a
       line to a picture already made of lines. */
    /* Boxed · a real block. The theme's raised surface measures 1.10 against
       the page, which is invisible at projection distance, so a block that
       must READ as a block uses the inverse surface. Dark on light is the one
       high-contrast device this palette actually has. */
    :host([boxed]) {
      background: var(--deck-node-bg, var(--rik-surface-inverse));
      color: var(--deck-node-boxed-color, var(--rik-text-inverse));
      padding: var(--rik-space-3) var(--rik-space-4);
      border-radius: var(--rik-radius-md);
      max-width: var(--deck-node-size, 18ch);
    }
    :host([boxed]) .label,
    :host([boxed]) .note {
      background: none;
      color: inherit;
    }
    :host([boxed][tone='accent']) {
      background: var(--rik-accent);
      color: var(--rik-accent__on);
    }
    :host([boxed][tone='ok']) {
      background: var(--rik-status-success__text);
      color: var(--rik-surface-page);
    }
    :host([boxed][tone='warn']) {
      background: var(--rik-status-warn__text);
      color: var(--rik-surface-page);
    }
    :host([boxed][tone='danger']) {
      background: var(--rik-status-danger__text);
      color: var(--rik-surface-page);
    }
    :host([boxed][active]) {
      outline: var(--deck-node-active-width, 3px) solid var(--rik-accent);
      outline-offset: 3px;
    }
    deck-icon {
      margin-bottom: var(--rik-space-1);
    }
    /* The node being discussed · a bare node has no box to outline, so the
       label takes the accent instead. */
    :host([active]:not([boxed])) .label {
      color: var(--deck-node-active-color, var(--rik-accent__text));
    }
    .note {
      font-size: var(--deck-node-note-size, 0.95em);
      line-height: 1.25;
      color: var(--deck-node-note-color, var(--rik-text-default--muted));
      opacity: 0.85;
    }
    .label {
      font-weight: 700;
      line-height: 1.15;
      color: var(--deck-node-color, var(--rik-text-default));
      background: var(--rik-surface-page);
      padding-inline: var(--rik-space-1);
    }
    @media print {
      :host { opacity: 1; }
      :host { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  `,
  ];

  /** `x,y` in percent of the drawing area · ignored under a canned layout. */
  @property({ type: String }) at?: string;

  @property({ type: String }) label?: string;

  /** A mono micro-label under the name · a protocol, a count, a latency. */
  @property({ type: String }) note?: string;

  /** Draw the node as a filled block rather than type under a rule. */
  @property({ type: Boolean, reflect: true }) boxed = false;

  /** Fill colour of a boxed node. */
  @property({ type: String, reflect: true }) tone?: 'accent' | 'ok' | 'warn' | 'danger';

  /** A glyph above the label · needs dist/deck-icon.js loaded too. */
  @property({ type: String }) icon?: string;

  override render() {
    return html`
      ${this.icon ? html`<deck-icon name=${this.icon} size="md"></deck-icon>` : ''}
      <span class="label" part="label">${this.label ?? ''}</span>
      ${this.note ? html`<span class="note" part="note">${this.note}</span>` : ''}
      <slot></slot>
    `;
  }
}

@customElement('deck-group')
export class DeckGroup extends LitElement {
  /* A named region behind a set of nodes · "everything in this dotted box runs
     in the VPC". Placed like a node, in percentages, because the author knows
     where their nodes are and a solver does not.

     Customization tokens:
       --deck-group-border / --deck-group-bg / --deck-group-label-color        */
  static override styles = [
    signature,
    css`
    :host {
      position: absolute;
      left: var(--gx, 0%);
      top: var(--gy, 0%);
      width: var(--gw, 20%);
      height: var(--gh, 20%);
      border: 2px dashed var(--deck-group-border, var(--rik-text-default--faint));
      border-radius: var(--rik-radius-md);
      background: var(--deck-group-bg, transparent);
      /* Behind the nodes, and never in the way of a click. */
      z-index: 0;
      pointer-events: none;
    }
    /* A drawing annotates itself · an edge, a region and a band each carry a
       short name. Plain sans at a smaller size, not a tracked-out mono tag:
       the convention comes from technical drawings, the mono uppercase came
       from nowhere. */
    .tag {
      font-family: var(--rik-font-sans);
      font-size: var(--deck-graph-tag-size, 0.95em);
      line-height: 1.2;
    }
    .tag {
      position: absolute;
      top: 0;
      left: var(--rik-space-3);
      transform: translateY(-50%);
      background: var(--rik-surface-page);
      padding-inline: var(--rik-space-2);
      color: var(--deck-group-label-color, var(--rik-text-default--faint));
      white-space: nowrap;
    }
    :host([solid]) {
      border-style: solid;
    }
  `,
  ];

  /** `x,y,width,height` in percent of the drawing area. */
  @property({ type: String }) at?: string;

  @property({ type: String }) label?: string;

  /** A solid outline instead of the dashed default. */
  @property({ type: Boolean, reflect: true }) solid = false;

  override render() {
    return html`${this.label ? html`<span class="tag">${this.label}</span>` : ''}`;
  }
}

@customElement('deck-lane')
export class DeckLane extends LitElement {
  /* A titled band across the diagram · the swimlane of a sequence, the tier of
     an architecture. Horizontal by default, because that is how a deck reads.

     Customization tokens:
       --deck-lane-rule / --deck-lane-bg / --deck-lane-label-color             */
  static override styles = [
    signature,
    css`
    :host {
      position: absolute;
      left: 0;
      right: 0;
      top: var(--ly, 0%);
      height: var(--lh, 25%);
      border-top: 1px solid var(--deck-lane-rule, var(--rik-text-default--faint));
      background: var(--deck-lane-bg, transparent);
      z-index: 0;
      pointer-events: none;
    }
    /* A drawing annotates itself · an edge, a region and a band each carry a
       short name. Plain sans at a smaller size, not a tracked-out mono tag:
       the convention comes from technical drawings, the mono uppercase came
       from nowhere. */
    .tag {
      font-family: var(--rik-font-sans);
      font-size: var(--deck-graph-tag-size, 0.95em);
      line-height: 1.2;
    }
    .tag {
      position: absolute;
      top: var(--rik-space-1);
      left: 0;
      color: var(--deck-lane-label-color, var(--rik-text-default--faint));
    }
  `,
  ];

  /** `top,height` in percent of the drawing area. */
  @property({ type: String }) at?: string;

  @property({ type: String }) label?: string;

  override render() {
    return html`${this.label ? html`<span class="tag">${this.label}</span>` : ''}`;
  }
}

@customElement('deck-edge')
export class DeckEdge extends LitElement {
  // Data only · deck-graph draws it. Rendering nothing keeps the element out of
  // the layout, so an edge never displaces a node.
  static override styles = css`
    :host { display: none; }
  `;

  @property({ type: String }) from?: string;
  @property({ type: String }) to?: string;
  @property({ type: String }) label?: string;
  @property({ type: Boolean }) dashed = false;

  override render() {
    return html``;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'deck-graph': DeckGraph;
    'deck-node': DeckNode;
    'deck-edge': DeckEdge;
    'deck-group': DeckGroup;
    'deck-lane': DeckLane;
  }
}
