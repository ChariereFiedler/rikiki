// src/deck-split.ts
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

// src/deck-split.ts
var DeckSplit = class extends LitElement {
  static {
    this.styles = [...slideBase, css2`
    :host { justify-content: flex-start; }
    .body {
      flex: 1; min-height: 0;
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-template-rows: minmax(0, 1fr);
      gap: var(--_gap, var(--sp-5));
    }
    :host([cols="1-2"]) .body { grid-template-columns: 1fr 2fr; }
    :host([cols="2-1"]) .body { grid-template-columns: 2fr 1fr; }
    :host([cols="3"])   .body { grid-template-columns: 1fr 1fr 1fr; gap: var(--_gap, var(--sp-4)); }
    .col {
      display: flex; flex-direction: column;
      min-height: 0; min-width: 0;
      gap: var(--_col-gap, var(--sp-3));
      overflow: hidden;
    }
    .col.center { justify-content: center; }
  `];
  }
  static {
    this.properties = {
      eyebrow: { type: String },
      cols: { type: String },
      // '1-1' (default), '1-2', '2-1', '3'
      gap: { type: String },
      // between-column gap · '1'..'6' or raw value
      colGap: { type: String, attribute: "col-gap" }
      // inside-column gap · '1'..'6' or raw value
    };
  }
  /** Map '1'..'6' to var(--sp-N); fall through to raw values otherwise. */
  _resolveSp(v) {
    const n = parseInt(v, 10);
    if (!Number.isNaN(n) && n >= 1 && n <= 6) return `var(--sp-${n})`;
    return v;
  }
  updated() {
    if (this.gap) this.style.setProperty("--_gap", this._resolveSp(this.gap));
    if (this.colGap) this.style.setProperty("--_col-gap", this._resolveSp(this.colGap));
  }
  render() {
    const hasA = this.querySelector('[slot="a"]');
    const isThree = this.cols === "3" || hasA;
    return html`
      ${this.eyebrow ? html`<span class="lbl">${this.eyebrow}</span>` : ""}
      <slot name="title"></slot>
      <slot name="lead"></slot>
      <div class="body" part="body">
        ${isThree ? html`
          <div class="col" part="col"><slot name="a"></slot></div>
          <div class="col" part="col"><slot name="b"></slot></div>
          <div class="col" part="col"><slot name="c"></slot></div>
        ` : html`
          <div class="col" part="col"><slot name="left"></slot></div>
          <div class="col" part="col"><slot name="right"></slot></div>
        `}
      </div>
    `;
  }
};
customElements.define("deck-split", DeckSplit);
export {
  DeckSplit
};
//# sourceMappingURL=deck-split.js.map
