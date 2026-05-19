// src/deck-hero-detail.ts
import { LitElement, html, css as css2 } from "https://cdn.jsdelivr.net/npm/lit@3/+esm";

// src/shared-styles.ts
import { css } from "https://cdn.jsdelivr.net/npm/lit@3/+esm";
var slideShell = css`
  :host {
    display: none;
    position: absolute;
    inset: 0;
    padding: var(--slide-pad-y) var(--slide-pad-x);
    flex-direction: column;
    overflow: hidden;
    background: var(--bg);
    font-family: var(--sans);
    color: var(--text);
  }
  :host([active]) { display: flex; }
`;
var typo = css`
  h1 {
    font-size: var(--fs-h1);
    font-weight: 700;
    color: var(--text);
    letter-spacing: -0.022em;
    line-height: 1.15;
    margin-bottom: var(--sp-4);
    padding-bottom: var(--sp-2);
    border-bottom: 3px solid var(--yellow);
    display: inline-block;
    align-self: flex-start;
    flex: 0 0 auto;
  }
  h1 .accent { color: var(--yellow); }
  ::slotted(p), p {
    font-size: var(--fs-body);
    line-height: 1.65;
    color: var(--soft);
    margin: 0;
  }
  ::slotted(strong), strong { color: var(--text); font-weight: 700; }
  ::slotted(code), code {
    font-family: var(--mono);
    font-size: var(--fs-mono-sm);
    background: rgba(0,0,0,0.06);
    padding: 2px 6px;
    border-radius: var(--r-sm);
    color: var(--text);
  }
`;
var helpers = css`
  .lbl {
    display: inline-block;
    padding: 4px 12px;
    background: var(--yellow);
    color: var(--dark);
    border-radius: 9999px;
    font-size: var(--fs-micro);
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    margin-bottom: var(--sp-1);
    align-self: flex-start;
  }
  .lead {
    font-size: var(--fs-lead);
    color: var(--muted);
    line-height: 1.5;
    margin-bottom: var(--sp-4);
    max-width: 75ch;
    flex: 0 0 auto;
  }
  .kicker {
    font-size: var(--fs-micro);
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: var(--sp-3);
    display: block;
  }
  .kicker.on-dark { color: rgba(255,255,255,0.35); }
  .caption {
    font-size: var(--fs-small);
    color: var(--muted);
    line-height: 1.55;
  }
  .caption.on-dark { color: rgba(255,255,255,0.5); }
  .col-label {
    font-size: var(--fs-micro);
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: var(--sp-2);
  }
`;
var slideBase = [slideShell, typo, helpers];

// src/deck-hero-detail.ts
var DeckHeroDetail = class extends LitElement {
  static {
    this.styles = [...slideBase, css2`
    :host { justify-content: flex-start; }
    /* The hero (code/chart) gets at least half the available height; .detail
       (bullets + diagram) is capped at ~40%. Without these caps a tall mermaid
       can grow to its intrinsic size and squeeze .hero to 0 (this is what
       happens in overview clones, which render the diagrams from scratch). */
    .hero {
      flex: 1 1 50%; min-height: 0;
      display: flex; flex-direction: column;
      overflow: hidden;
    }
    ::slotted(deck-code), ::slotted(deck-mermaid), ::slotted(pre), ::slotted(table), ::slotted(svg) {
      max-height: 100%; flex: 1 1 auto;
    }
    .detail {
      flex: 0 1 40%;
      min-height: 0;
      margin-top: var(--sp-3);
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--sp-4);
      overflow: hidden;
    }
    .col {
      display: flex; flex-direction: column;
      gap: var(--sp-2);
      min-width: 0;
      min-height: 0;
      overflow: hidden;
    }
  `];
  }
  static {
    this.properties = { eyebrow: { type: String } };
  }
  render() {
    return html`
      ${this.eyebrow ? html`<span class="lbl">${this.eyebrow}</span>` : ""}
      <slot name="title"></slot>
      <slot name="lead"></slot>
      <div class="hero" part="hero"><slot></slot></div>
      <div class="detail" part="detail">
        <div class="col"><slot name="left"></slot></div>
        <div class="col"><slot name="right"></slot></div>
      </div>
    `;
  }
};
customElements.define("deck-hero-detail", DeckHeroDetail);
export {
  DeckHeroDetail
};
//# sourceMappingURL=deck-hero-detail.js.map
