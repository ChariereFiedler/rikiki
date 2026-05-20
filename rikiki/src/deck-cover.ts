// ════════════════════════════════════════════════════════════════
// <deck-cover
//   brand="rikiki · tag · line"
//   brand-src="./brand/mark.svg"
//   speaker="..." duration="...">
//   <h1>Title <span class="accent">with accent</span></h1>
//   <p slot="sub">Subtitle</p>
// </deck-cover>
//
// `brand`     · the leading text label (split on " · ", first segment is
//               the brand name, the rest is shown as context)
// `brand-src` · optional URL to a logo SVG/PNG · omit for text-only brand
// ════════════════════════════════════════════════════════════════

import { LitElement, html, css } from 'lit';
import { slideBase } from './shared-styles.js';

export class DeckCover extends LitElement {
  /* Tokens:
       --deck-cover-bg          slide background          (defaults to --dark)
       --deck-cover-text        primary on-dark text      (--on-dark-text)
       --deck-cover-soft        soft on-dark text         (--on-dark-soft)
       --deck-cover-muted       very soft on-dark text    (--on-dark-muted)
       --deck-cover-faint       faintest on-dark text     (--on-dark-faint)
       --deck-cover-border      meta separator border     (--on-dark-border) */
  static styles = [...slideBase, css`
    :host {
      background: var(--deck-cover-bg, var(--dark));
      justify-content: center;
      color: var(--deck-cover-text, var(--on-dark-text));
    }
    .brand {
      display: inline-flex; align-items: center; gap: var(--sp-3);
      margin-bottom: var(--sp-5);
      align-self: flex-start;
    }
    .brand-tile {
      width: 64px; height: 64px;
      display: inline-flex; align-items: center; justify-content: center;
    }
    .brand-tile img { width: 100%; height: 100%; display: block; }
    .brand-name {
      font-family: var(--display, inherit);
      font-size: var(--fs-micro); font-weight: 700;
      letter-spacing: 0.2em; text-transform: uppercase;
      color: var(--deck-cover-soft, var(--on-dark-soft));
    }
    .brand-context {
      font-size: var(--fs-micro); font-weight: 700;
      color: var(--deck-cover-muted, var(--on-dark-muted));
      letter-spacing: 0.2em; text-transform: uppercase;
      padding-left: var(--sp-3);
      border-left: 1px solid var(--deck-cover-border, var(--on-dark-border));
    }
    ::slotted(h1) {
      font-size: clamp(3.6rem, 9vw, 8.5rem); font-weight: 900;
      color: var(--deck-cover-text, var(--on-dark-text));
      line-height: 1.02; letter-spacing: -0.035em;
      margin-bottom: var(--sp-4);
      border: none; padding: 0;
    }
    ::slotted(.sub) {
      font-size: var(--fs-h2);
      color: var(--deck-cover-muted, var(--on-dark-muted));
      margin-bottom: var(--sp-6); max-width: 60ch; line-height: 1.45;
      display: block;
    }
    .meta {
      display: flex; gap: var(--sp-6);
      border-top: 1px solid var(--deck-cover-border, var(--on-dark-border));
      padding-top: var(--sp-4);
    }
    .meta-item strong {
      display: block; font-size: var(--fs-micro); letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--deck-cover-faint, var(--on-dark-faint));
      margin-bottom: 6px; font-weight: 700;
    }
    .meta-item span {
      color: var(--deck-cover-text, var(--on-dark-text));
      font-size: var(--fs-body); font-weight: 600;
    }
  `];

  static properties = {
    brand: { type: String },
    brandSrc: { type: String, attribute: 'brand-src' },
    speaker: { type: String },
    company: { type: String },
    duration: { type: String },
    audience: { type: String },
    runtime: { type: String },
    // Labels (default FR, override via attrs for i18n)
    speakerLabel:  { type: String, attribute: 'speaker-label'  },
    companyLabel:  { type: String, attribute: 'company-label'  },
    durationLabel: { type: String, attribute: 'duration-label' },
    audienceLabel: { type: String, attribute: 'audience-label' },
    runtimeLabel:  { type: String, attribute: 'runtime-label'  },
  };

  render() {
    const parts = (this.brand || '').split('·').map(s => s.trim()).filter(Boolean);
    const brandName = parts[0] || '';
    const context = parts.slice(1).join(' · ');
    const items = [
      this.speaker  && { l: this.speakerLabel  || 'Présenté par', v: this.speaker },
      this.company  && { l: this.companyLabel  || 'Entreprise',   v: this.company },
      this.duration && { l: this.durationLabel || 'Durée',        v: this.duration },
      this.audience && { l: this.audienceLabel || 'Audience',     v: this.audience },
      this.runtime  && { l: this.runtimeLabel  || 'Runtime',      v: this.runtime },
    ].filter(Boolean);

    const hasMark = !!this.brandSrc;

    return html`
      <div class="brand" part="brand">
        ${hasMark
          ? html`<span class="brand-tile"><img src="${this.brandSrc}" alt="${brandName || ''}"></span>`
          : ''}
        ${brandName ? html`<span class="brand-name">${brandName}</span>` : ''}
        ${context ? html`<span class="brand-context">${context}</span>` : ''}
      </div>
      <slot></slot>
      ${items.length ? html`
        <div class="meta" part="meta">
          ${items.map(i => html`
            <div class="meta-item"><strong>${i.l}</strong><span>${i.v}</span></div>
          `)}
        </div>` : ''}
    `;
  }
}

customElements.define('deck-cover', DeckCover);
