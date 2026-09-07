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
      stroke: var(--deck-graph-edge, var(--rik-text-default--faint));
      stroke-width: var(--deck-graph-edge-width, 2);
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
    .arrow {
      fill: var(--deck-graph-edge, var(--rik-text-default--faint));
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
        ${edges.map(({ edge, geom }) => {
          if (!geom || !w) return '';
          const p = px(geom);
          // `svg` and not `html` · a nested html`` fragment is parsed in the
          // HTML namespace, so its <line> becomes an unknown element that is
          // never painted. It reports the right coordinates and draws nothing.
          return svg`<line
            class="edge"
            ?data-dashed=${edge.hasAttribute('dashed')}
            x1=${p.x1}
            y1=${p.y1}
            x2=${p.x2}
            y2=${p.y2}
          />`;
        })}
      </svg>
      ${edges.map(({ edge, geom }) =>
        geom && edge.getAttribute('label')
          ? html`<span
              class="meta edge-label"
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
    /* The signature again · a rule, not a box. The node is its label plus the
       accent bar under it, so a graph reads as type on a field of lines. */
    .rule {
      width: 100%;
      background: var(--deck-node-rule, var(--rik-border-strong, var(--rik-text-default)));
      transition: background 0.2s ease, height 0.2s ease;
    }
    :host([active]) .rule {
      background: var(--rik-accent);
      height: calc(var(--rik-extras-rule-width, 3px) * 2);
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
      .rule { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  `,
  ];

  /** `x,y` in percent of the drawing area · ignored under a canned layout. */
  @property({ type: String }) at?: string;

  @property({ type: String }) label?: string;

  /** A mono micro-label under the name · a protocol, a count, a latency. */
  @property({ type: String }) note?: string;

  override render() {
    return html`
      <span class="label" part="label">${this.label ?? ''}</span>
      <span class="rule" part="rule"></span>
      ${this.note ? html`<span class="meta">${this.note}</span>` : ''}
      <slot></slot>
    `;
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
  }
}
