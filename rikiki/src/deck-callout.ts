// ════════════════════════════════════════════════════════════════
// <deck-callout type="info|warn|danger|ok">
//   Body, with **markdown** allowed via <deck-md> inside.
// </deck-callout>
//
// Customization tokens (override any of these on `:host` or on a
// parent to retheme one callout, or every callout):
//   --deck-callout-bg            background fill
//   --deck-callout-border        border color
//   --deck-callout-stroke        icon stroke color
//   --deck-callout-radius        border radius
//   --deck-callout-padding-y     vertical padding
//   --deck-callout-padding-x     horizontal padding
//
// By default, the `type` attribute maps to the theme's semantic
// surface/border tokens, so a theme switch updates every callout in
// place · no rgba literals baked in JS.
// ════════════════════════════════════════════════════════════════

import { LitElement, html, css } from 'lit';

/* Lucide icon paths (https://lucide.dev) · 24×24, stroke-only, linecap round.
   The `i` dot in info/warn/danger needs `stroke-linecap="round"` to show up,
   because it is rendered as a zero-length path. Without round caps it
   collapses to nothing — the original bug. */
const ICONS = {
  info:   '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  warn:   '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  danger: '<circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/>',
  ok:     '<path d="M20 6 9 17l-5-5"/>',
};

export class DeckCallout extends LitElement {
  static styles = css`
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

  static properties = { type: { type: String } };

  render() {
    const t = this.type || 'info';
    const icon = ICONS[t] || ICONS.info;
    // stroke-linecap="round" lets the i-dot (a zero-length path) render as a
    // small circle · without it, the dot collapses to nothing.
    return html`
      <div class="icon-box">
        <svg viewBox="0 0 24 24" fill="none"
             stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
             .innerHTML="${icon}"></svg>
      </div>
      <div class="content"><slot></slot></div>
    `;
  }
}

customElements.define('deck-callout', DeckCallout);
