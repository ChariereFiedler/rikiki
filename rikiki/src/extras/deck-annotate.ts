// ════════════════════════════════════════════════════════════════
// <deck-annotate src="dashboard.png" alt="The ops dashboard"
//   marks="35,60,Latency spike|12,20,Queue depth|80,45,Retries">
// </deck-annotate>
//
// A screenshot the speaker can point at. Showing a dashboard on a projector is
// useless without designating three places in it, and a laser pointer does not
// survive the recording.
//
// Positions are percentages of the image box, so they hold under zoom-to-fit,
// in the overview thumbnail and in the PDF export. Marks reveal one per step,
// through the engine's own step mechanism · no plugin.
//
// OPT-IN · not imported by src/index.ts. Load it next to the bundle:
//   <script type="module" src="dist/deck-annotate.js"></script>
// ════════════════════════════════════════════════════════════════

import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { parseMarks, placeMarks, stepsForMarks, visibleCount } from '../shared/annotation-marks.js';

@customElement('deck-annotate')
export class DeckAnnotate extends LitElement {
  /* Customization tokens · every default routes to a semantic --rik-* token.

       --deck-annotate-radius        corner radius of the image
       --deck-annotate-border        frame around the image
       --deck-annotate-mark-bg       marker disc
       --deck-annotate-mark-color    the number inside it
       --deck-annotate-mark-size     its diameter
       --deck-annotate-mark-ring     halo that lifts it off the screenshot
       --deck-annotate-legend-color  the caption list
       --deck-annotate-legend-size   its type size
       --deck-annotate-gap           space between image and legend           */
  static override styles = css`
    :host {
      display: flex;
      flex-direction: column;
      gap: var(--deck-annotate-gap, var(--rik-space-3));
      min-height: 0;
      font-family: var(--rik-font-sans);
    }
    .frame {
      position: relative;
      flex: 1 1 auto;
      min-height: 0;
      display: flex;
    }
    img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: contain;
      object-position: center;
      border-radius: var(--deck-annotate-radius, var(--rik-radius-md));
      border: 1px solid var(--deck-annotate-border, var(--rik-border-default));
    }
    .mark {
      position: absolute;
      /* The pair is the whole placement · a percentage of the frame, so it
         holds at any projected size. */
      left: var(--mx);
      top: var(--my);
      transform: translate(-50%, -50%);
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
  `;

  /** The image to annotate. */
  @property({ type: String }) src?: string;

  /** Alternative text · required for anything a reader must understand. */
  @property({ type: String }) alt = '';

  /** `x,y,label` triples separated by `|`, coordinates in percent. */
  @property({ type: String }) marks?: string;

  /** Show every mark at once instead of revealing them one per step. */
  @property({ type: Boolean, attribute: 'all-at-once' }) allAtOnce = false;

  /** Drop the caption list under the image. */
  @property({ type: Boolean, attribute: 'no-legend' }) noLegend = false;

  /** Current step, mirrored from the slide by deck-root's step machinery. */
  @state() private _step = 0;

  private get _marks() {
    return placeMarks(parseMarks(this.marks));
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

  override render() {
    const marks = this._marks;
    const shown = this.allAtOnce ? marks.length : visibleCount(marks.length, this._step);

    return html`
      <div class="frame" part="frame">
        ${this.src ? html`<img src=${this.src} alt=${this.alt} part="image" />` : ''}
        ${marks.map(
          (m) => html`<span
            class="mark"
            part="mark"
            ?hidden=${m.n > shown}
            style="--mx:${m.x}%;--my:${m.y}%"
            aria-hidden="true"
            >${m.n}</span
          >`,
        )}
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
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'deck-annotate': DeckAnnotate;
  }
}
