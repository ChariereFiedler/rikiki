// ════════════════════════════════════════════════════════════════
// <deck-versus pivot="vs" winner="right">
//   <div slot="left"><h3>Manual review</h3><p>Four hours.</p></div>
//   <div slot="right"><h3>Reviewed in CI</h3><p>Twelve minutes.</p></div>
// </deck-versus>
//
// A comparison block by default. Add `slide` to use the same vocabulary as a
// complete slide, without assembling deck-split and two deck-card elements:
//
// <deck-versus slide eyebrow="Before / after" pivot="→" winner="right">
//   <h1 slot="title">The review loop</h1>
//   <p slot="lead">Same evidence, less waiting.</p>
//   <section slot="left">...</section>
//   <section slot="right">...</section>
//   <deck-callout slot="footer" type="info">Rolls out behind a flag.</deck-callout>
// </deck-versus>
//
// OPT-IN · <script type="module" src="dist/deck-versus.js"></script>
// ════════════════════════════════════════════════════════════════

import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { signature } from '../shared/signature.js';

@customElement('deck-versus')
export class DeckVersus extends LitElement {
  /* Customization tokens:
       --deck-versus-gap / --deck-versus-pivot-color / --deck-versus-pivot-size
       --deck-versus-rule / --deck-versus-winner-rule / --deck-versus-loser-color
       --deck-versus-footer-gap (defaults to --rik-space-3) */
  static override styles = [
    signature,
    css`
    :host {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 64px minmax(0, 1fr);
      align-items: stretch;
      gap: var(--deck-versus-gap, var(--rik-space-3));
      font-family: var(--rik-font-sans);
    }
    :host([slide]) {
      display: none;
      position: absolute;
      inset: 0;
      box-sizing: border-box;
      grid-template-columns: minmax(0, 1fr) 80px minmax(0, 1fr);
      grid-template-rows: auto minmax(0, 1fr) auto;
      align-content: stretch;
      gap: var(--rik-space-3) var(--deck-versus-gap, var(--rik-space-4));
      padding: var(--rik-slide-padding-y) var(--rik-slide-padding-x);
      overflow: hidden;
      background: var(--deck-versus-slide-bg, var(--rik-surface-page));
      color: var(--rik-text-default);
    }
    :host([slide][active]) { display: grid; }
    :host([slide]:not([pivot])) { grid-template-columns: 1fr 1fr; }
    .heading { display: none; }
    :host([slide]) .heading {
      display: flex;
      grid-column: 1 / -1;
      flex-direction: column;
      align-items: flex-start;
      gap: var(--rik-space-2);
      min-width: 0;
    }
    .eyebrow {
      color: var(--deck-versus-eyebrow-color, var(--rik-accent__text));
      font-size: var(--rik-font-size-body);
      font-weight: 600;
    }
    .title, .lead { min-width: 0; }
    /* The footer · like title/lead, present only once the comparison owns
       the whole slide. A slotted deck-callout keeps its own font-size, so it
       renders at its normal size rather than shrinking to reading size. */
    .footer { display: none; }
    :host([slide]) .footer {
      display: block;
      grid-column: 1 / -1;
      grid-row: 3;
      margin-top: var(--deck-versus-footer-gap, var(--rik-space-3));
      font-family: var(--rik-font-sans);
      font-size: var(--rik-font-size-body);
      color: var(--rik-text-default--muted);
      line-height: 1.5;
    }
    :host([slide]) .side,
    :host([slide]) .pivot { grid-row: 2; min-height: 0; }
    :host([slide]) .side {
      display: flex;
      flex-direction: column;
      justify-content: var(--deck-versus-side-align, center);
      overflow: hidden;
      padding-block: var(--rik-space-4);
    }
    :host(:not([pivot])) {
      grid-template-columns: 1fr 1fr;
    }
    /* No tile. A side is a rule and the type under it · the same device the
       rest of the extras use. Two filled rectangles carry no hierarchy at ten
       metres and turn a comparison into a pair of grey blocks. */
    .side {
      min-width: 0;
      padding: var(--rik-space-4) 0;
      border-block: var(--deck-versus-rule-width, 2px) solid
        var(--deck-versus-rule, var(--rik-text-default--faint));
      transition: border-color 0.2s ease, color 0.2s ease;
    }
    /* The winner is marked by its rule and by full-strength type. The loser
       recedes in COLOUR, not behind an opacity that greys its own heading. */
    :host([winner='left']) .side.left,
    :host([winner='right']) .side.right {
      border-top-color: var(--deck-versus-winner-rule, var(--rik-accent));
    }
    :host([winner='right']) .side.left,
    :host([winner='left']) .side.right {
      color: var(--deck-versus-loser-color, var(--rik-text-default--faint));
    }
    :host([winner='right']) .side.left ::slotted(*),
    :host([winner='left']) .side.right ::slotted(*) {
      color: inherit;
    }
    /* The pivot is the word between the two columns · written plainly, at
       reading size. It used to be tracked out in the metadata voice, which
       made a three-letter word into a piece of chrome. */
    .pivot {
      position: relative;
      display: grid;
      place-items: center;
      align-self: stretch;
      color: var(--deck-versus-pivot-color, var(--rik-accent--strong));
      font: 800 var(--deck-versus-pivot-size, var(--rik-font-size-sm))/1 var(--rik-font-display);
      text-align: center;
      isolation: isolate;
    }
    .pivot::before {
      content: '';
      position: absolute;
      inset-block: 0;
      left: 50%;
      width: 1px;
      background: var(--deck-versus-rule, var(--rik-border-default));
      z-index: -2;
    }
    .pivot::after {
      content: '';
      position: absolute;
      width: 52px;
      height: 52px;
      border: 1px solid var(--deck-versus-rule, var(--rik-border-default));
      border-radius: 50%;
      background: var(--rik-surface-page);
      z-index: -1;
    }
    ::slotted(h3) { margin: 0 0 var(--rik-space-2); color: var(--rik-text-default); font: 800 var(--rik-font-size-h3)/1.1 var(--rik-font-display); }
    ::slotted(p) { margin: 0; color: var(--rik-text-default--muted); line-height: 1.5; }
    ::slotted([slot='title']) {
      display: inline-block;
      margin: 0;
      padding-bottom: var(--rik-space-2);
      border-bottom: 3px solid var(--rik-accent);
      color: var(--rik-text-default);
      font: 800 var(--rik-font-size-h1)/1.1 var(--rik-font-display);
      letter-spacing: -0.022em;
    }
    ::slotted([slot='lead']) {
      max-width: 75ch;
      margin: 0;
      color: var(--rik-text-default--muted);
      font-size: var(--rik-font-size-lead);
      line-height: 1.5;
    }
    @media (max-width: 640px) {
      :host, :host(:not([pivot])) { grid-template-columns: 1fr; }
      :host([slide]), :host([slide]:not([pivot])) {
        grid-template-columns: 1fr;
        grid-template-rows: auto minmax(0, 1fr) auto minmax(0, 1fr) auto;
      }
      :host([slide]) .side.left { grid-row: 2; }
      :host([slide]) .pivot { grid-row: 3; }
      :host([slide]) .side.right { grid-row: 4; }
      :host([slide]) .footer { grid-row: 5; }
      .pivot { min-height: 44px; }
      .pivot::before { inset-block: 50%; inset-inline: 0; width: auto; height: 1px; }
      .pivot::after { width: 44px; height: 44px; }
    }
    @media print {
      .side { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      /* Slide mode draws its own shell instead of taking slideShell, so it
         takes the same print contract by hand · every slide shown, one page
         each, the deck canvas as the page. Without it the comparison stayed
         display:none off screen and vanished from the PDF. */
      :host([slide]) {
        display: grid;
        position: relative;
        inset: auto;
        width: calc(var(--deck-canvas-w, 1920) * 1px);
        height: calc(var(--deck-canvas-h, 1080) * 1px);
        break-inside: avoid;
        break-after: page;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      :host([slide]:last-child) { break-after: auto; }
    }
  `,
  ];

  /** Symbol or word between the two sides · omit for a plain two-up. */
  @property({ type: String, reflect: true }) pivot?: string;

  /** Which side carries the accent. */
  @property({ type: String, reflect: true }) winner?: 'left' | 'right';

  /** Make this comparison a direct deck-root slide. */
  @property({ type: Boolean, reflect: true }) slide = false;

  /** Optional context label shown above the title in slide mode. */
  @property({ type: String }) eyebrow?: string;

  override render() {
    return html`
      <div class="heading">
        ${this.eyebrow ? html`<span class="eyebrow" part="eyebrow">${this.eyebrow}</span>` : ''}
        <div class="title" part="title"><slot name="title"></slot></div>
        <div class="lead" part="lead"><slot name="lead"></slot></div>
      </div>
      <div class="side left" part="left"><slot name="left"></slot></div>
      ${this.pivot ? html`<span class="pivot reading" part="pivot" aria-hidden="true">${this.pivot}</span>` : ''}
      <div class="side right" part="right"><slot name="right"></slot></div>
      <div class="footer" part="footer"><slot name="footer"></slot></div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'deck-versus': DeckVersus;
  }
}
