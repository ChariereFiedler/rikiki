// ════════════════════════════════════════════════════════════════
// <deck-punch tone="default|warn|danger|ok|info|muted"
//             size="lead|big|mega|stat|display"
//             weight="700|800|900"
//             align="left|center|right">
//   Short, punchy line.
// </deck-punch>
//
// Tokens:
//   --deck-punch-color · text color  · defaults to `inherit` so the
//     punch picks up the slide's color (works on dark hooks etc.).
//   --deck-punch-size  · font-size   · defaults to var(--fs-lead).
//
// `tone` and `size` map to theme tokens · zero hard-coded color.
// ════════════════════════════════════════════════════════════════

import { LitElement, html, css } from 'lit';

const TONES = {
  warn:   'var(--orange)',
  danger: 'var(--red)',
  ok:     'var(--green)',
  info:   'var(--yellow)',
  muted:  'var(--muted)',
  accent: 'var(--yellow)',
};

const SIZES = {
  lead:    'var(--fs-lead)',
  big:     'var(--fs-big)',
  mega:    'var(--fs-mega)',
  stat:    'var(--fs-stat)',
  display: 'clamp(2.6rem, 6vw, 5rem)',
};

export class DeckPunch extends LitElement {
  static styles = css`
    :host {
      display: block;
      margin: 0;
      font-family: var(--display, var(--sans));
      font-weight: 900;
      line-height: 1.1;
      letter-spacing: -0.02em;
      font-size: var(--deck-punch-size, var(--_size, var(--fs-lead)));
      /* "inherit" lets us pick up the on-dark color of cover/hook/section · the
         color is only overridden when a tone is explicitly chosen. */
      color:     var(--deck-punch-color, var(--_color, inherit));
    }
    :host([weight="700"]) { font-weight: 700; }
    :host([weight="800"]) { font-weight: 800; }
    :host([align="center"]) { text-align: center; }
    :host([align="right"])  { text-align: right; }
  `;

  static properties = {
    tone:   { type: String },
    size:   { type: String },
    weight: { type: String, reflect: true },
    align:  { type: String, reflect: true },
  };

  updated() {
    // Only set the colour when a tone is named · otherwise inherit.
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

  render() {
    return html`<slot></slot>`;
  }
}

customElements.define('deck-punch', DeckPunch);
