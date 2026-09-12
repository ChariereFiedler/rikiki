// ════════════════════════════════════════════════════════════════
// <deck-annotate src="dashboard.png" alt="The ops dashboard"
//   marks="35,60,Latency spike|12,20,Queue depth|80,45,Retries"
//   caption="Staging cluster, one hour before the incident."
//   source="Grafana · 12 September 2026"></deck-annotate>
//
// A screenshot the speaker can point at. Showing a dashboard on a projector is
// useless without designating three places in it, and a laser pointer does not
// survive the recording. An annotated screenshot is a figure before it is an
// annotation, so it takes the same `caption` / `source` / `source-href` as
// deck-figure, in real <figure>/<figcaption> markup.
//
// Positions are percentages of the image box, so they hold under zoom-to-fit,
// in the overview thumbnail and in the PDF export. Marks reveal one per step,
// through the engine's own step mechanism · no plugin.
//
// Add `leader offset="28,-24"` to keep every badge away from the point it
// identifies. Use `offsets="28,-24|-28,-24"` when each mark needs a different
// direction. Offsets are CSS pixels in the rendered slide canvas.
//
// OPT-IN · not imported by src/index.ts. Load it next to the bundle:
//   <script type="module" src="dist/deck-annotate.js"></script>
// ════════════════════════════════════════════════════════════════

import { LitElement, css, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { parseMarks, placeMarks, stepsForMarks, visibleCount } from '../shared/annotation-marks.js';

// deck-source is a core atom, registered by dist/index.js · every opt-in
// module is documented as "loaded next to the bundle" (§20), so it is always
// present by the time a deck reaches this one. Importing it here too would
// register 'deck-source' a second time and throw when both bundles load.

@customElement('deck-annotate')
export class DeckAnnotate extends LitElement {
  /* Customization tokens · every default routes to a semantic --rik-* token.

       --deck-annotate-radius        corner radius of the image
       --deck-annotate-border        frame around the image
       --deck-annotate-mark-bg       marker disc
       --deck-annotate-mark-color    the number inside it
       --deck-annotate-mark-size     its diameter
       --deck-annotate-mark-ring     halo that lifts it off the screenshot
       --deck-annotate-leader        leader line colour
       --deck-annotate-leader-width  leader line thickness
       --deck-annotate-legend-color  the caption list
       --deck-annotate-legend-size   its type size
       --deck-annotate-gap           space between image, legend and caption ·
                                      defaults to deck-figure's own gap
       --deck-annotate-caption-color the caption / source line under the
                                      legend · defaults to deck-figure's own */
  static override styles = css`
    :host {
      display: flex;
      flex-direction: column;
      min-height: 0;
      font-family: var(--rik-font-sans);
    }
    figure {
      display: flex;
      flex-direction: column;
      flex: 1 1 auto;
      gap: var(--deck-annotate-gap, var(--deck-figure-gap, var(--rik-space-2)));
      min-height: 0;
      margin: 0;
    }
    /* The image fills its box and object-fit contain letterboxes it inside, so
       the PAINTED area is smaller than the element. Markers are positioned
       against that painted area, published as --img-* by _measure(). Pure CSS
       cannot express it: sizing a fit-content box from an image that is itself
       max-width 100% is cyclic, and resolves to the full available width, which
       stretches the picture and puts every marker in the wrong place. */
    .frame {
      position: relative;
      flex: 1 1 auto;
      min-height: 0;
      line-height: 0;
    }
    img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: contain;
      object-position: center;
    }
    /* The frame around the PICTURE, not around the element box · drawn from the
       same measurement the markers use, so the two never disagree. */
    .edge {
      position: absolute;
      left: var(--img-x, 0%);
      top: var(--img-y, 0%);
      width: calc(var(--img-w, 1) * 100%);
      height: calc(var(--img-h, 1) * 100%);
      border-radius: var(--deck-annotate-radius, var(--rik-radius-md));
      border: 1px solid var(--deck-annotate-border, var(--rik-border-default));
      pointer-events: none;
    }
    .mark {
      position: absolute;
      /* Anchored to the painted picture, not to the element box · --img-* is
         the letterboxed rectangle, --mx and --my the author percentages. */
      left: calc(var(--img-x, 0%) + var(--mx) * var(--img-w, 1));
      top: calc(var(--img-y, 0%) + var(--my) * var(--img-h, 1));
      transform: translate(calc(-50% + var(--mark-dx, 0px)), calc(-50% + var(--mark-dy, 0px)));
      width: var(--deck-annotate-mark-size, 2.2rem);
      height: var(--deck-annotate-mark-size, 2.2rem);
      border-radius: var(--rik-radius-pill);
      background: var(--deck-annotate-mark-bg, var(--rik-accent));
      color: var(--deck-annotate-mark-color, var(--rik-accent__on));
      display: grid;
      place-items: center;
      font-weight: 700;
      font-size: var(--rik-font-size-sm, 1rem);
      /* A screenshot is busy · the ring is what makes the marker findable. */
      box-shadow: 0 0 0 3px var(--deck-annotate-mark-ring, var(--rik-surface-page));
      transition: opacity 0.2s ease, transform 0.2s ease;
    }
    .mark[hidden] {
      display: none;
    }
    .leader {
      position: absolute;
      left: calc(var(--img-x, 0%) + var(--mx) * var(--img-w, 1));
      top: calc(var(--img-y, 0%) + var(--my) * var(--img-h, 1));
      width: var(--leader-length, 0px);
      height: var(--deck-annotate-leader-width, 2px);
      transform: translateY(-50%) rotate(var(--leader-angle, 0deg));
      transform-origin: left center;
      background: var(--deck-annotate-leader, var(--rik-accent));
      border-radius: var(--rik-radius-pill);
      box-shadow: 0 0 0 1px var(--deck-annotate-mark-ring, var(--rik-surface-page));
      pointer-events: none;
    }
    .leader[hidden] { display: none; }
    @media (prefers-reduced-motion: reduce) {
      .mark { transition: none; }
    }
    .legend {
      display: flex;
      flex-direction: column;
      gap: var(--rik-space-1);
      font-size: var(--deck-annotate-legend-size, var(--rik-font-size-sm));
      color: var(--deck-annotate-legend-color, var(--rik-text-default));
      flex: none;
    }
    .item {
      display: flex;
      align-items: baseline;
      gap: var(--rik-space-2);
      opacity: 1;
      transition: opacity 0.2s ease;
    }
    .item[data-pending] {
      /* Kept in the layout · the legend must not reflow as marks appear. */
      opacity: 0;
    }
    .n {
      flex: none;
      min-width: 1.6em;
      font-weight: 700;
      color: var(--deck-annotate-mark-bg, var(--rik-accent));
      font-variant-numeric: tabular-nums;
    }
    @media print {
      .mark, .n { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      /* On paper there are no steps · everything is shown. */
      .mark[hidden] { display: grid; }
      .item[data-pending] { opacity: 1; }
    }
    /* Matches deck-figure's own figcaption exactly, so the two authoring
       paths read as one line under either kind of image. */
    figcaption {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: baseline;
      gap: var(--rik-space-2) var(--rik-space-4);
      color: var(--deck-annotate-caption-color, var(--deck-figure-caption-color, var(--rik-text-default--muted)));
      font-size: var(--rik-font-size-sm);
      line-height: 1.5;
    }
    /* deck-source renders the actual credit · these two rules forward the
       figcaption's own token and restore the single-line, baseline-aligned
       look this figcaption grid needs. */
    deck-source {
      --deck-source-gap: 0;
    }
    deck-source::part(source) {
      white-space: nowrap;
    }
    @media (max-width: 640px) {
      figcaption { grid-template-columns: 1fr; }
      deck-source::part(source) { white-space: normal; }
    }
  `;

  /** The image to annotate. */
  @property({ type: String }) src?: string;

  /** Alternative text · required for anything a reader must understand. */
  @property({ type: String }) alt = '';

  /** `x,y,label` triples separated by `|`, coordinates in percent. */
  @property({ type: String }) marks?: string;

  /** Show every mark at once instead of revealing them one per step. */
  @property({ type: Boolean, attribute: 'all-at-once' }) allAtOnce = false;

  /** Drop the legend list under the image. */
  @property({ type: Boolean, attribute: 'no-legend' }) noLegend = false;

  /** Draw a line from the precise target coordinate to the displaced badge. */
  @property({ type: Boolean, reflect: true }) leader = false;

  /** Default badge displacement as `x,y` CSS pixels, for example `28,-24`. */
  @property({ type: String }) offset = '0,0';

  /** Per-mark displacements separated by `|`; missing entries use `offset`. */
  @property({ type: String }) offsets?: string;

  /** Concise explanation displayed under the legend, in a real figcaption. */
  @property({ type: String }) caption?: string;

  /** Source or credit displayed beside the caption. */
  @property({ type: String }) source?: string;

  /** Optional URL for the source or credit. */
  @property({ type: String, attribute: 'source-href' }) sourceHref?: string;

  private get _hasCaption(): boolean {
    return Boolean(
      this.caption || this.source || this.querySelector('[slot="caption"], [slot="source"]'),
    );
  }

  private get _hasSource(): boolean {
    return Boolean(this.source || this.querySelector('[slot="source"]'));
  }

  /** Current step, mirrored from the slide by deck-root's step machinery. */
  @state() private _step = 0;

  private get _marks() {
    return placeMarks(parseMarks(this.marks));
  }

  private _parseOffset(value: string | null | undefined): readonly [number, number] | null {
    if (!value) return null;
    const [rawX, rawY] = value.split(',');
    const x = Number(rawX?.trim());
    const y = Number(rawY?.trim());
    return Number.isFinite(x) && Number.isFinite(y) ? [x, y] : null;
  }

  private _offsetFor(index: number): readonly [number, number] {
    const individual = this.offsets?.split('|')[index];
    return this._parseOffset(individual) ?? this._parseOffset(this.offset) ?? [0, 0];
  }

  /** The engine reads the step count off the SLIDE (`steps` / `data-steps`), so
   *  the component publishes what it needs onto its own slide · one step per
   *  mark. It only ever raises the count, never lowers one the author set. */
  private _publishSteps(): void {
    const needed = this.allAtOnce ? 0 : stepsForMarks(this._marks.length);
    if (needed === 0) return;
    let slide: Element | null = this;
    while (slide?.parentElement && slide.parentElement.tagName.toLowerCase() !== 'deck-root') {
      slide = slide.parentElement;
    }
    if (!slide?.parentElement) return;
    const declared = Number(slide.getAttribute('steps') ?? slide.getAttribute('data-steps') ?? '0');
    if (declared < needed) slide.setAttribute('data-steps', String(needed));
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this._publishSteps();
  }

  /** Called by deck-root on every step change · it walks the active slide and
   *  invokes this on each descendant that has it. No listener to clean up. */
  applyStep(step: number): void {
    this._step = step;
  }

  private _ro?: ResizeObserver;

  override firstUpdated(): void {
    // The painted rectangle moves with the box · remeasure on resize, and once
    // the image has decoded (naturalWidth is 0 before that).
    this._ro = new ResizeObserver(() => this._measure());
    const frame = this.renderRoot.querySelector('.frame');
    if (frame) this._ro.observe(frame);
    const img = this.renderRoot.querySelector('img');
    img?.addEventListener('load', this._measure, { once: false });
    this._measure();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    // Paired with firstUpdated · a deck that re-renders a slide would otherwise
    // leave one observer per pass.
    this._ro?.disconnect();
    this._ro = undefined;
  }

  /** Publish the letterboxed picture rectangle as percentages of the frame. */
  private _measure = (): void => {
    const frame = this.renderRoot.querySelector('.frame') as HTMLElement | null;
    const img = this.renderRoot.querySelector('img') as HTMLImageElement | null;
    // naturalWidth is 0 until the image has decoded · measuring then would
    // publish a ratio of zero and pile every marker in one corner.
    if (!frame || !img?.naturalWidth || !img.naturalHeight) return;
    const box = frame.getBoundingClientRect();
    if (!box.width || !box.height) return;

    const ratio = img.naturalWidth / img.naturalHeight;
    const boxRatio = box.width / box.height;
    const w = ratio > boxRatio ? 1 : (box.height * ratio) / box.width;
    const h = ratio > boxRatio ? box.width / ratio / box.height : 1;
    frame.style.setProperty('--img-w', String(w));
    frame.style.setProperty('--img-h', String(h));
    frame.style.setProperty('--img-x', `${((1 - w) / 2) * 100}%`);
    frame.style.setProperty('--img-y', `${((1 - h) / 2) * 100}%`);
  };

  override render() {
    const marks = this._marks;
    const shown = this.allAtOnce ? marks.length : visibleCount(marks.length, this._step);

    return html`
      <figure part="figure">
        <div class="frame" part="frame">
          ${this.src ? html`<img src=${this.src} alt=${this.alt} part="image" />` : ''}
          ${this.src ? html`<span class="edge" part="edge" aria-hidden="true"></span>` : ''}
          ${marks.map((m, index) => {
            const [dx, dy] = this._offsetFor(index);
            const length = Math.hypot(dx, dy);
            const angle = Math.atan2(dy, dx) * (180 / Math.PI);
            const style = `--mx:${m.x}%;--my:${m.y}%;--mark-dx:${dx}px;--mark-dy:${dy}px;--leader-length:${length}px;--leader-angle:${angle}deg`;
            const hidden = m.n > shown;
            return html`
              ${
                this.leader && length > 0
                  ? html`<span class="leader" part="leader" ?hidden=${hidden} style=${style} aria-hidden="true"></span>`
                  : ''
              }
              <span class="mark" part="mark" ?hidden=${hidden} style=${style} aria-hidden="true">${m.n}</span>
            `;
          })}
        </div>
        ${
          this.noLegend || marks.length === 0
            ? ''
            : html`<ol class="legend" part="legend">
                ${marks.map(
                  (m) => html`<li class="item" ?data-pending=${m.n > shown}>
                    <span class="n">${m.n}</span><span>${m.label}</span>
                  </li>`,
                )}
              </ol>`
        }
        ${
          this._hasCaption
            ? html`<figcaption part="caption">
                <span class="caption"><slot name="caption">${this.caption ?? ''}</slot></span>
                ${
                  this._hasSource
                    ? html`<deck-source part="source" href=${this.sourceHref ?? nothing}
                        ><slot name="source">${this.source ?? ''}</slot></deck-source
                      >`
                    : nothing
                }
              </figcaption>`
            : nothing
        }
      </figure>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'deck-annotate': DeckAnnotate;
  }
}
