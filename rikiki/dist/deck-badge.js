// src/deck-badge.ts
import { LitElement, html, css } from "https://cdn.jsdelivr.net/npm/lit@3/+esm";
var DeckBadge = class extends LitElement {
  static {
    this.styles = css`
    :host {
      display: inline-block;
      padding: var(--deck-badge-padding-y, var(--sp-1)) var(--deck-badge-padding-x, var(--sp-3));
      margin-bottom: var(--sp-2);
      font: 700 var(--fs-micro)/1.2 var(--sans);
      letter-spacing: 0.1em; text-transform: uppercase;
      border-radius: var(--deck-badge-radius, var(--r-pill));
      background: var(--deck-badge-bg, var(--surface-tint));
      color: var(--deck-badge-fg, var(--muted));
      border: 1px solid var(--deck-badge-border, var(--border));
    }
    :host([type="bad"])  { --deck-badge-bg: var(--surface-bad);          --deck-badge-fg: var(--red);       --deck-badge-border: var(--border-bad); }
    :host([type="ok"])   { --deck-badge-bg: var(--surface-ok);           --deck-badge-fg: var(--green);     --deck-badge-border: var(--border-ok); }
    :host([type="info"]) { --deck-badge-bg: var(--surface-info-strong);  --deck-badge-fg: var(--text-info); --deck-badge-border: var(--border-info); }
    :host([type="warn"]) { --deck-badge-bg: var(--surface-warn);         --deck-badge-fg: var(--orange);    --deck-badge-border: var(--border-warn); }
  `;
  }
  static {
    this.properties = { type: { type: String } };
  }
  render() {
    return html`<slot></slot>`;
  }
};
customElements.define("deck-badge", DeckBadge);
export {
  DeckBadge
};
//# sourceMappingURL=deck-badge.js.map
