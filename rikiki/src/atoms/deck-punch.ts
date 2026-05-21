// ════════════════════════════════════════════════════════════════
// <deck-punch tone="default|warn|danger|ok|info|muted|accent"
//             size="lead|big|mega|stat|display"
//             weight="700|800|900"
//             align="left|center|right">
//   Short, punchy line.
// </deck-punch>
//
// Tokens:
//   --deck-punch-color · text color  · defaults to `inherit` so the
//     punch picks up the slide's color (works on dark hooks etc.).
//   --deck-punch-size  · font-size   · defaults to var(--rik-font-size-lead).
//
// `tone` and `size` map to theme tokens · zero hard-coded color.
// ════════════════════════════════════════════════════════════════

import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

export type DeckPunchTone = 'warn' | 'danger' | 'ok' | 'info' | 'muted' | 'accent';
export type DeckPunchSize = 'lead' | 'big' | 'mega' | 'stat' | 'display';

const TONES: Record<DeckPunchTone, string> = {
  warn:   'var(--rik-status-warn)',
  danger: 'var(--rik-status-danger)',
  ok:     'var(--rik-status-success)',
  info:   'var(--rik-accent)',
  muted:  'var(--rik-text-default--faint)',
  accent: 'var(--rik-accent)',
};

const SIZES: Record<DeckPunchSize, string> = {
  lead:    'var(--rik-font-size-lead)',
  big:     'var(--rik-font-size-big)',
  mega:    'var(--rik-font-size-mega)',
  stat:    'var(--rik-font-size-stat)',
  display: 'clamp(2.6rem, 6vw, 5rem)',
};

@customElement('deck-punch')
export class DeckPunch extends LitElement {
  static override styles = css`
    :host {
      display: block;
      margin: 0;
      font-family: var(--rik-font-display, var(--rik-font-sans));
      font-weight: 900;
      line-height: 1.1;
      letter-spacing: -0.02em;
      font-size: var(--deck-punch-size, var(--_size, var(--rik-font-size-lead)));
      /* "inherit" lets us pick up the on-dark color of cover/hook/section · the
         color is only overridden when a tone is explicitly chosen. */
      color:     var(--deck-punch-color, var(--_color, inherit));
    }
    :host([weight="700"]) { font-weight: 700; }
    :host([weight="800"]) { font-weight: 800; }
    :host([align="center"]) { text-align: center; }
    :host([align="right"])  { text-align: right; }
  `;

  @property({ type: String }) tone?: DeckPunchTone;
  @property({ type: String }) size?: DeckPunchSize;
  @property({ type: String, reflect: true }) weight?: string;
  @property({ type: String, reflect: true }) align?: string;

  override updated() {
    if (this.tone && TONES[this.tone]) {
      this.style.setProperty('--_color', TONES[this.tone]);
    } else {
      this.style.removeProperty('--_color');
    }
    if (this.size && SIZES[this.size]) {
      this.style.setProperty('--_size', SIZES[this.size]);
    } else {
      this.style.removeProperty('--_size');
    }
  }

  override render() {
    return html`<slot></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'deck-punch': DeckPunch;
  }
}
