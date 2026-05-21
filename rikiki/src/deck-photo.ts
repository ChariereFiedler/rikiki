// ════════════════════════════════════════════════════════════════
// <deck-photo src="..." position="center" darken="0.4">
//   <h1>Optional title</h1>
//   <p class="sub">Optional caption.</p>
// </deck-photo>
//
// Full-bleed image slide. The image fills the entire slide area; any
// slotted content sits on top, vertically centered on a dimmable
// overlay. Use it for cover-style slides with a hero photograph, or
// as a section break with a mood image.
//
// Attributes:
//   src       · image URL (required)
//   position  · CSS object-position string · default "center"
//   darken    · 0-1 alpha of the dark overlay · default 0.35
//   align     · slot content position: top | center | bottom · default center
//   text-align · left | center | right · default left
// ════════════════════════════════════════════════════════════════

import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { slideShell } from './shared-styles.js';

@customElement('deck-photo')
export class DeckPhoto extends LitElement {
  /* Customization tokens:
       --deck-photo-overlay-color (default rgba(0,0,0,<darken>))
       --deck-photo-text-color (default --rik-text-inverse)
       --deck-photo-text-muted (default --rik-text-inverse--muted)
       --deck-photo-content-max-width (default 28ch)
       --deck-photo-padding-x / -padding-y */
  static override styles = [slideShell, css`
    :host {
      padding: 0;
      color: var(--deck-photo-text-color, var(--rik-text-inverse));
      overflow: hidden;
    }
    .bg {
      position: absolute;
      inset: 0;
      background-size: cover;
      background-position: var(--_pos, center);
      background-repeat: no-repeat;
    }
    .overlay {
      position: absolute;
      inset: 0;
      background: var(--deck-photo-overlay-color, rgba(0, 0, 0, var(--_dim, 0.35)));
    }
    .content {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      gap: var(--rik-space-3);
      padding: var(--deck-photo-padding-y, var(--rik-slide-padding-y)) var(--deck-photo-padding-x, var(--rik-slide-padding-x));
      width: 100%;
      height: 100%;
      max-width: 100%;
      box-sizing: border-box;
      justify-content: var(--_align, center);
      text-align: var(--_text-align, left);
      align-items: var(--_text-align-items, flex-start);
    }
    .content > * { max-width: var(--deck-photo-content-max-width, 36ch); }
    ::slotted(h1) {
      font-family: var(--rik-font-display, var(--rik-font-sans));
      font-size: clamp(2.5rem, 6vw, 5.5rem);
      font-weight: 900;
      letter-spacing: -0.035em;
      line-height: 1.02;
      color: var(--deck-photo-text-color, var(--rik-text-inverse));
      margin: 0;
      text-shadow: 0 2px 16px rgba(0, 0, 0, 0.35);
    }
    ::slotted(h2) {
      font-family: var(--rik-font-display, var(--rik-font-sans));
      font-size: clamp(1.6rem, 3vw, 2.6rem);
      font-weight: 800;
      letter-spacing: -0.025em;
      line-height: 1.1;
      color: var(--deck-photo-text-color, var(--rik-text-inverse));
      margin: 0;
      text-shadow: 0 2px 12px rgba(0, 0, 0, 0.35);
    }
    ::slotted(p), ::slotted(.sub) {
      font-size: var(--rik-font-size-lead);
      color: var(--deck-photo-text-muted, var(--rik-text-inverse--muted));
      line-height: 1.5;
      margin: 0;
      text-shadow: 0 1px 8px rgba(0, 0, 0, 0.35);
    }
    ::slotted(.kicker) {
      font: 700 var(--rik-font-size-xs)/1 var(--rik-font-mono);
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--deck-photo-text-muted, var(--rik-text-inverse--muted));
      margin: 0;
    }
  `];

  @property({ type: String }) src?: string;
  @property({ type: String }) position?: string;
  @property({ type: Number }) darken?: number;
  @property({ type: String }) align?: 'top' | 'center' | 'bottom';
  @property({ type: String, attribute: 'text-align' }) textAlign?: 'left' | 'center' | 'right';

  override updated(): void {
    if (this.position) this.style.setProperty('--_pos', this.position);
    if (typeof this.darken === 'number') this.style.setProperty('--_dim', String(this.darken));
    const a = this.align === 'top' ? 'flex-start' : this.align === 'bottom' ? 'flex-end' : 'center';
    this.style.setProperty('--_align', a);
    if (this.textAlign) {
      this.style.setProperty('--_text-align', this.textAlign);
      const items = this.textAlign === 'center' ? 'center' : this.textAlign === 'right' ? 'flex-end' : 'flex-start';
      this.style.setProperty('--_text-align-items', items);
    }
  }

  override render(): unknown {
    const bg = this.src ? `background-image: url("${this.src.replace(/"/g, '%22')}")` : '';
    return html`
      <div class="bg" part="bg" style=${bg}></div>
      <div class="overlay" part="overlay"></div>
      <div class="content" part="content"><slot></slot></div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'deck-photo': DeckPhoto;
  }
}
