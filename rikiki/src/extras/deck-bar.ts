// ════════════════════════════════════════════════════════════════
// <deck-bar value="160" total="538" label="Lines worth a second look"></deck-bar>
// <deck-bar segments="blocker:137:danger|major:921:warn|minor:1544:info"></deck-bar>
//
// A proportion, drawn. deck-stat shows a number; a number does not show a
// share, and a room reading "160 of 538" should see the bar rather than do
// the arithmetic.
//
// OPT-IN · not imported by src/index.ts. Load it next to the bundle:
//   <script type="module" src="dist/deck-bar.js"></script>
// ════════════════════════════════════════════════════════════════

import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { parseSegments, remainder, sizeSegments } from '../shared/bar-segments.js';

export type DeckBarTone = 'accent' | 'ok' | 'warn' | 'danger' | 'info' | 'muted';

/** Tone → the text-grade token for that colour. Text-grade on purpose: the
 *  legend prints the tone as small text, and the plain tones sit under WCAG AA
 *  (see scripts/theme-contrast.test.mjs). */
const TONES: Record<DeckBarTone, string> = {
  accent: 'var(--rik-accent__text)',
  ok: 'var(--rik-status-success__text)',
  warn: 'var(--rik-status-warn__text)',
  danger: 'var(--rik-status-danger__text)',
  info: 'var(--rik-status-info, var(--rik-accent__text))',
  muted: 'var(--rik-text-default--faint)',
};

/** Colour for a segment index when the author names no tone · walks the tones
 *  so a five-way stack is legible without the author picking five colours. */
const CYCLE: DeckBarTone[] = ['accent', 'info', 'ok', 'warn', 'danger', 'muted'];

@customElement('deck-bar')
export class DeckBar extends LitElement {
  /* Customization tokens · every value below routes to a semantic --rik-*
     token, so the component follows whichever theme is loaded and never
     hardcodes a colour or a length.

       --deck-bar-track          empty part of the track
       --deck-bar-height         thickness of the bar
       --deck-bar-radius         corner radius
       --deck-bar-gap            space between bar, label and legend
       --deck-bar-label-color    the label above the bar
       --deck-bar-value-color    the figure at the right of the label
       --deck-bar-legend-color   the legend under a stacked bar
       --deck-bar-legend-size    legend type size
       --deck-bar-fill           override the fill of a single-value bar
       --deck-bar-divider        hairline between two stacked segments
       --deck-bar-divider-width  its thickness                             */
  static override styles = css`
    :host {
      display: block;
      width: 100%;
      font-family: var(--rik-font-sans);
      margin-block: var(--deck-bar-gap, var(--rik-space-2));
    }
    .head {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: var(--rik-space-3);
      margin-bottom: var(--rik-space-1);
    }
    .label {
      color: var(--deck-bar-label-color, var(--rik-text-default));
      font-weight: 600;
    }
    .value {
      color: var(--deck-bar-value-color, var(--rik-text-default--faint));
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }
    .track {
      display: flex;
      width: 100%;
      height: var(--deck-bar-height, var(--rik-space-3));
      border-radius: var(--deck-bar-radius, var(--rik-radius-pill));
      background: var(--deck-bar-track, var(--rik-surface-sunken));
      overflow: hidden;
    }
    .seg {
      height: 100%;
      /* The width is the only inline style · it is data, not decoration. */
      background: var(--seg-color);
      transition: width 0.3s ease;
    }
    /* A hairline between neighbours · two adjacent tones from the same family
       (warn beside info on the rikiki palette) otherwise read as one block, and
       the author picks the tones, so the fix belongs here. */
    .seg + .seg {
      box-shadow: inset var(--deck-bar-divider-width, 2px) 0 0
        var(--deck-bar-divider, var(--rik-surface-page));
    }
    @media (prefers-reduced-motion: reduce) {
      .seg { transition: none; }
    }
    .legend {
      display: flex;
      flex-wrap: wrap;
      gap: var(--rik-space-1) var(--rik-space-3);
      margin-top: var(--rik-space-1);
      font-size: var(--deck-bar-legend-size, var(--rik-font-size-xs));
      color: var(--deck-bar-legend-color, var(--rik-text-default--faint));
    }
    .legend-item {
      display: inline-flex;
      align-items: center;
      gap: var(--rik-space-1);
    }
    .dot {
      width: 0.6em;
      height: 0.6em;
      border-radius: var(--rik-radius-pill);
      background: var(--seg-color);
      flex: none;
    }
    .legend-value {
      font-variant-numeric: tabular-nums;
      opacity: 0.75;
    }
    /* Print · the fills are the content, not decoration. */
    @media print {
      .seg, .dot { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  `;

  /** The measured part, for a single-value bar. */
  @property({ type: Number }) value?: number;

  /** The whole it is measured against · defaults to the sum of the segments. */
  @property({ type: Number }) total?: number;

  /** Text above the bar. */
  @property({ type: String }) label?: string;

  /** Colour of a single-value bar. */
  @property({ type: String, reflect: true }) tone: DeckBarTone = 'accent';

  /** A stacked bar · `label:value:tone` triples separated by `|`. */
  @property({ type: String }) segments?: string;

  /** Hide the figure at the right of the label. */
  @property({ type: Boolean, attribute: 'no-value' }) noValue = false;

  /** Hide the legend under a stacked bar. */
  @property({ type: Boolean, attribute: 'no-legend' }) noLegend = false;

  private get _stacked(): boolean {
    return (this.segments ?? '').trim().length > 0;
  }

  private _sized() {
    if (this._stacked) return sizeSegments(parseSegments(this.segments), this.total);
    return sizeSegments([{ label: this.label ?? '', value: this.value ?? 0 }], this.total);
  }

  private _color(tone: string | undefined, index: number): string {
    const key = (tone ?? (this._stacked ? CYCLE[index % CYCLE.length]! : this.tone)) as DeckBarTone;
    const resolved = TONES[key] ?? TONES.accent;
    return this._stacked ? resolved : `var(--deck-bar-fill, ${resolved})`;
  }

  /** The figure beside the label · the honest numbers, not the rounded share. */
  private _figure(sized: ReturnType<typeof this._sized>): string {
    if (this._stacked) {
      const sum = sized.reduce((acc, s) => acc + s.value, 0);
      return `${sum}`;
    }
    const value = this.value ?? 0;
    return this.total === undefined ? `${value}` : `${value} / ${this.total}`;
  }

  override render() {
    const sized = this._sized();
    const empty = remainder(sized);
    const showHead = Boolean(this.label) || !this.noValue;

    return html`
      ${
        showHead
          ? html`<div class="head" part="head">
              <span class="label" part="label">${this.label ?? ''}</span>
              ${this.noValue ? '' : html`<span class="value" part="value">${this._figure(sized)}</span>`}
            </div>`
          : ''
      }
      <div
        class="track"
        part="track"
        role="img"
        aria-label=${this._ariaLabel(sized, empty)}
      >
        ${sized.map(
          (s, i) => html`<div
            class="seg"
            part="segment"
            style="width:${Math.min(100, s.exact)}%;--seg-color:${this._color(s.tone, i)}"
          ></div>`,
        )}
      </div>
      ${
        this._stacked && !this.noLegend
          ? html`<div class="legend" part="legend">
              ${sized.map(
                (s, i) => html`<span class="legend-item">
                  <span class="dot" style="--seg-color:${this._color(s.tone, i)}"></span>
                  ${s.label}
                  <span class="legend-value">${s.percent}%</span>
                </span>`,
              )}
            </div>`
          : ''
      }
    `;
  }

  /** A bar is an image to assistive technology · without a name it is silence. */
  private _ariaLabel(sized: ReturnType<typeof this._sized>, empty: number): string {
    const head = this.label ? `${this.label}: ` : '';
    if (this._stacked) {
      return head + sized.map((s) => `${s.label} ${s.percent}%`).join(', ');
    }
    const share = sized[0]?.percent ?? 0;
    return `${head}${share}%${empty > 0 && this.total !== undefined ? ` of ${this.total}` : ''}`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'deck-bar': DeckBar;
  }
}
