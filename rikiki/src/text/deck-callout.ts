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
//   --deck-callout-color         body text colour
//   --deck-callout-strong-color  emphasized text colour
//   --deck-callout-code-bg       inline-code background
//
// By default, the `type` attribute maps to the theme's semantic
// surface/border tokens, so a theme switch updates every callout in
// place · no rgba literals baked in JS.
// ════════════════════════════════════════════════════════════════

import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

export type DeckCalloutType = 'info' | 'warn' | 'danger' | 'ok';

/* Lucide icon paths (https://lucide.dev) · 24×24, stroke-only, linecap round.
   The `i` dot in info/warn/danger needs `stroke-linecap="round"` to show up,
   because it is rendered as a zero-length path. Without round caps it
   collapses to nothing · the original bug. */
const ICONS: Record<DeckCalloutType, string> = {
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  warn: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  danger: '<circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/>',
  ok: '<path d="M20 6 9 17l-5-5"/>',
};

@customElement('deck-callout')
export class DeckCallout extends LitElement {
  static override styles = css`
    :host {
      display: flex; gap: var(--rik-space-3);
      padding: var(--deck-callout-padding-y, var(--rik-space-3)) var(--deck-callout-padding-x, var(--rik-space-4));
      border-radius: var(--deck-callout-radius, var(--rik-radius-md));
      background: var(--deck-callout-bg, var(--rik-status-info__bg--mid));
      border: 1px solid var(--deck-callout-border, var(--rik-status-info__border));
      box-shadow: var(--rik-elevation-2);
      align-items: center;
      color: var(--deck-callout-color, var(--rik-text-default--muted));
      font-family: var(--rik-font-sans);
      font-size: var(--rik-font-size-body); line-height: 1.55;
    }
    /* Type-based mapping · every value points at a theme token. */
    :host([type="info"])   { --deck-callout-bg: var(--rik-status-info__bg--mid);   --deck-callout-border: var(--rik-status-info__border);   --deck-callout-stroke: var(--rik-accent); }
    :host([type="warn"])   { --deck-callout-bg: var(--rik-status-warn__bg);   --deck-callout-border: var(--rik-status-warn__border);   --deck-callout-stroke: var(--rik-status-warn); }
    :host([type="danger"]) { --deck-callout-bg: var(--rik-status-danger__bg);    --deck-callout-border: var(--rik-status-danger__border);    --deck-callout-stroke: var(--rik-status-danger); }
    :host([type="ok"])     { --deck-callout-bg: var(--rik-status-success__bg);     --deck-callout-border: var(--rik-status-success__border);     --deck-callout-stroke: var(--rik-status-success); }

    /* A callout inside a cover, section or takeaway inherits a dark context.
       The on-dark variant gives it a readable surface and explicitly
       switches every text-bearing descendant to inverse theme tokens. */
    :host([on-dark]) {
      --deck-callout-bg: var(--rik-surface-inverse--soft-2);
      --deck-callout-border: var(--rik-border-inverse);
      --deck-callout-color: var(--rik-text-inverse--muted);
      --deck-callout-strong-color: var(--rik-text-inverse);
      --deck-callout-code-bg: var(--rik-surface-inverse__overlay);
      box-shadow: none;
    }
    :host([on-dark]) .icon-box {
      background: var(--rik-surface-inverse__overlay);
    }

    .icon-box {
      flex-shrink: 0;
      width: var(--rik-icon-2xl); height: var(--rik-icon-2xl);
      display: inline-flex; align-items: center; justify-content: center;
      border-radius: 50%;
      background: var(--rik-surface-tint);
    }
    .icon-box svg {
      width: var(--rik-icon-lg); height: var(--rik-icon-lg);
      stroke: var(--deck-callout-stroke, var(--rik-accent));
      stroke-width: 2.2;
    }
    .content { flex: 1; }
    ::slotted(p) { margin: 0; }
    ::slotted(strong) { color: var(--deck-callout-strong-color, var(--rik-text-default)); font-weight: 700; }
    ::slotted(code) {
      font-family: var(--rik-font-mono); font-size: var(--rik-font-size-mono-sm);
      background: var(--deck-callout-code-bg, var(--rik-surface-tint)); padding: 2px 6px;
      border-radius: var(--rik-radius-sm); color: var(--deck-callout-strong-color, var(--rik-text-default));
    }
  `;

  @property({ type: String }) type?: DeckCalloutType;

  /** Use inverse text and a dark raised surface inside dark slide layouts. */
  @property({ type: Boolean, reflect: true, attribute: 'on-dark' }) onDark = false;

  override render() {
    const t: DeckCalloutType = this.type ?? 'info';
    const icon = ICONS[t] ?? ICONS.info;
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

declare global {
  interface HTMLElementTagNameMap {
    'deck-callout': DeckCallout;
  }
}
