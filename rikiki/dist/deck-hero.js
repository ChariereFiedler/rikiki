// src/deck-hero.ts
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

// src/deck-hero.ts
var DeckHero = class extends LitElement {
  static {
    this.styles = [...slideBase, css2`
    :host { justify-content: flex-start; }
    .body {
      flex: 1; min-height: 0;
      display: flex; flex-direction: column;
      justify-content: flex-start;
      gap: var(--sp-3);
      overflow: hidden;
    }
    ::slotted(deck-code:not([nested])),
    ::slotted(deck-mermaid),
    ::slotted(table),
    ::slotted(pre),
    ::slotted(svg),
    ::slotted(.hero-main) { max-height: 100%; flex: 0 1 auto; }
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
      <div class="body" part="body"><slot></slot></div>
    `;
  }
};
customElements.define("deck-hero", DeckHero);
export {
  DeckHero
};
//# sourceMappingURL=deck-hero.js.map
