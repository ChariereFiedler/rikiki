// src/deck-tier-list.ts
import { LitElement, html, css } from "https://cdn.jsdelivr.net/npm/lit@3/+esm";
var DeckTierList = class extends LitElement {
  static {
    this.styles = css`
    :host { display: flex; flex-direction: column; gap: var(--gap-xs); }
  `;
  }
  render() {
    return html`<slot></slot>`;
  }
};
customElements.define("deck-tier-list", DeckTierList);
var DeckTier = class extends LitElement {
  static {
    this.styles = css`
    :host {
      display: flex; flex-direction: column; gap: var(--gap-hair);
      background: var(--surface-card);
      border: 1px solid var(--border);
      border-radius: var(--r-md);
      padding: var(--sp-2) var(--sp-4);
      box-shadow: var(--shadow-card);
      font-family: var(--sans);
    }
    :host([hot]) {
      border-color: var(--border-info);
      background: var(--surface-info-faint);
    }
    .head {
      display: flex; justify-content: space-between; align-items: baseline;
    }
    .name { font: 700 var(--fs-body)/1 var(--mono); color: var(--text); }
    :host([hot]) .name { color: var(--yellow); }
    .speed { font: 700 var(--fs-body)/1 var(--mono); }
    .speed[data-severity="muted"] { color: var(--muted); }
    .speed[data-severity="warn"]  { color: var(--orange); }
    .speed[data-severity="ok"]    { color: var(--green); }
    :host([hot]) .speed { color: var(--yellow); }
    .desc { font-size: var(--fs-small); color: var(--muted); line-height: 1.4; }
  `;
  }
  static {
    this.properties = {
      name: { type: String },
      speed: { type: String },
      severity: { type: String },
      hot: { type: Boolean, reflect: true }
    };
  }
  render() {
    return html`
      <div class="head">
        <span class="name">${this.name}</span>
        <span class="speed" data-severity="${this.severity || (this.hot ? "hot" : "")}">${this.speed}</span>
      </div>
      <div class="desc"><slot></slot></div>
    `;
  }
};
customElements.define("deck-tier", DeckTier);
var DeckTierArrow = class extends LitElement {
  static {
    this.styles = css`
    :host {
      display: block; text-align: center;
      color: var(--muted); opacity: var(--opacity-soft);
      font-size: var(--fs-micro);
      padding: 2px 0;
    }
  `;
  }
  render() {
    return html`<slot></slot>`;
  }
};
customElements.define("deck-tier-arrow", DeckTierArrow);
export {
  DeckTier,
  DeckTierArrow,
  DeckTierList
};
//# sourceMappingURL=deck-tier-list.js.map
