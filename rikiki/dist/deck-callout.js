// src/deck-callout.ts
import { LitElement, html, css } from "https://cdn.jsdelivr.net/npm/lit@3/+esm";
var ICONS = {
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  warn: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  danger: '<circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/>',
  ok: '<path d="M20 6 9 17l-5-5"/>'
};
var DeckCallout = class extends LitElement {
  static {
    this.styles = css`
    :host {
      display: flex; gap: var(--sp-3);
      padding: var(--deck-callout-padding-y, var(--sp-3)) var(--deck-callout-padding-x, var(--sp-4));
      border-radius: var(--deck-callout-radius, var(--r-md));
      background: var(--deck-callout-bg, var(--surface-info));
      border: 1px solid var(--deck-callout-border, var(--border-info));
      box-shadow: var(--shadow-card);
      align-items: center;
      color: var(--soft);
      font-family: var(--sans);
      font-size: var(--fs-body); line-height: 1.55;
    }
    /* Type-based mapping · every value points at a theme token. */
    :host([type="info"])   { --deck-callout-bg: var(--surface-info);   --deck-callout-border: var(--border-info);   --deck-callout-stroke: var(--yellow); }
    :host([type="warn"])   { --deck-callout-bg: var(--surface-warn);   --deck-callout-border: var(--border-warn);   --deck-callout-stroke: var(--orange); }
    :host([type="danger"]) { --deck-callout-bg: var(--surface-bad);    --deck-callout-border: var(--border-bad);    --deck-callout-stroke: var(--red); }
    :host([type="ok"])     { --deck-callout-bg: var(--surface-ok);     --deck-callout-border: var(--border-ok);     --deck-callout-stroke: var(--green); }

    .icon-box {
      flex-shrink: 0;
      width: var(--icon-2xl); height: var(--icon-2xl);
      display: inline-flex; align-items: center; justify-content: center;
      border-radius: 50%;
      background: var(--surface-tint);
    }
    .icon-box svg {
      width: var(--icon-lg); height: var(--icon-lg);
      stroke: var(--deck-callout-stroke, var(--yellow));
      stroke-width: 2.2;
    }
    .content { flex: 1; }
    ::slotted(p) { margin: 0; }
    ::slotted(strong) { color: var(--text); font-weight: 700; }
    ::slotted(code) {
      font-family: var(--mono); font-size: var(--fs-mono-sm);
      background: var(--surface-tint); padding: 2px 6px;
      border-radius: var(--r-sm); color: var(--text);
    }
  `;
  }
  static {
    this.properties = { type: { type: String } };
  }
  render() {
    const t = this.type || "info";
    const icon = ICONS[t] || ICONS.info;
    return html`
      <div class="icon-box">
        <svg viewBox="0 0 24 24" fill="none"
             stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
             .innerHTML="${icon}"></svg>
      </div>
      <div class="content"><slot></slot></div>
    `;
  }
};
customElements.define("deck-callout", DeckCallout);
export {
  DeckCallout
};
//# sourceMappingURL=deck-callout.js.map
