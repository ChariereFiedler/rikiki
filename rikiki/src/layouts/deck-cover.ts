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
import { customElement, property } from 'lit/decorators.js';
import { slideBase } from '../shared-styles.js';

interface MetaItem {
  l: string;
  v: string;
}

@customElement('deck-cover')
export class DeckCover extends LitElement {
  /* Tokens:
       --deck-cover-bg          slide background          (defaults to --rik-surface-inverse)
       --deck-cover-text        primary on-dark text      (--rik-text-inverse)
       --deck-cover-soft        soft on-dark text         (--rik-text-inverse--muted)
       --deck-cover-muted       very soft on-dark text    (--rik-text-inverse--faint)
       --deck-cover-faint       faintest on-dark text     (--rik-text-inverse--ghost)
       --deck-cover-border      meta separator border     (--rik-border-inverse) */
  static override styles = [
    ...slideBase,
    css`
    :host {
      background: var(--deck-cover-bg, var(--rik-surface-inverse));
      justify-content: center;
      color: var(--deck-cover-text, var(--rik-text-inverse));
    }
    .brand {
      display: inline-flex; align-items: center; gap: var(--rik-space-3);
      margin-bottom: var(--rik-space-5);
      align-self: flex-start;
    }
    .brand-tile {
      /* rem (not px) so the logo scales with the canvas in fixed mode · 2.5rem
         ≈ 64px at the baseline root font (2.35% of a 1080 canvas). */
      width: 2.5rem; height: 2.5rem;
      display: inline-flex; align-items: center; justify-content: center;
    }
    .brand-tile img { width: 100%; height: 100%; display: block; }
    .brand-name {
      font-family: var(--rik-font-display, inherit);
      font-size: var(--rik-font-size-xs); font-weight: 700;
      letter-spacing: 0.2em; text-transform: uppercase;
      color: var(--deck-cover-soft, var(--rik-text-inverse--muted));
    }
    .brand-context {
      font-size: var(--rik-font-size-xs); font-weight: 700;
      color: var(--deck-cover-muted, var(--rik-text-inverse--faint));
      letter-spacing: 0.2em; text-transform: uppercase;
      padding-left: var(--rik-space-3);
      border-left: 1px solid var(--deck-cover-border, var(--rik-border-inverse));
    }
    ::slotted(h1) {
      font-size: clamp(3.6rem, 9cqw, 8.5rem); font-weight: 900;
      color: var(--deck-cover-text, var(--rik-text-inverse));
      line-height: 1.02; letter-spacing: -0.035em;
      margin-bottom: var(--rik-space-4);
      border: none; padding: 0;
    }
    ::slotted(.sub) {
      font-size: var(--rik-font-size-h2);
      color: var(--deck-cover-muted, var(--rik-text-inverse--faint));
      margin-bottom: var(--rik-space-6); max-width: 60ch; line-height: 1.45;
      display: block;
    }
    .meta {
      display: flex; gap: var(--rik-space-6);
      border-top: 1px solid var(--deck-cover-border, var(--rik-border-inverse));
      padding-top: var(--rik-space-4);
    }
    .meta-item strong {
      display: block; font-size: var(--rik-font-size-xs); letter-spacing: 0.12em;
      text-transform: uppercase;
      /* --ghost is a decoration alpha (0.32) · on the dark cover it measured
         2.43:1 behind these labels. Muted is the lightest text-grade step. */
      color: var(--deck-cover-faint, var(--rik-text-inverse--muted));
      margin-bottom: 6px; font-weight: 700;
    }
    .meta-item span {
      color: var(--deck-cover-text, var(--rik-text-inverse));
      font-size: var(--rik-font-size-body); font-weight: 600;
    }
  `,
  ];

  @property({ type: String }) brand?: string;
  @property({ type: String, attribute: 'brand-src' }) brandSrc?: string;
  @property({ type: String }) speaker?: string;
  @property({ type: String }) company?: string;
  @property({ type: String }) duration?: string;
  @property({ type: String }) audience?: string;
  @property({ type: String }) runtime?: string;
  // Labels (default FR, override via attrs for i18n)
  @property({ type: String, attribute: 'speaker-label' }) speakerLabel?: string;
  @property({ type: String, attribute: 'company-label' }) companyLabel?: string;
  @property({ type: String, attribute: 'duration-label' }) durationLabel?: string;
  @property({ type: String, attribute: 'audience-label' }) audienceLabel?: string;
  @property({ type: String, attribute: 'runtime-label' }) runtimeLabel?: string;

  override render() {
    const parts = (this.brand ?? '')
      .split('·')
      .map((s: string) => s.trim())
      .filter(Boolean);
    const brandName = parts[0] ?? '';
    const context = parts.slice(1).join(' · ');
    const items: MetaItem[] = [
      this.speaker && { l: this.speakerLabel ?? 'Présenté par', v: this.speaker },
      this.company && { l: this.companyLabel ?? 'Entreprise', v: this.company },
      this.duration && { l: this.durationLabel ?? 'Durée', v: this.duration },
      this.audience && { l: this.audienceLabel ?? 'Audience', v: this.audience },
      this.runtime && { l: this.runtimeLabel ?? 'Runtime', v: this.runtime },
    ].filter((x): x is MetaItem => !!x);

    const hasMark = !!this.brandSrc;

    return html`
      <div class="brand" part="brand">
        ${
          hasMark
            ? html`<span class="brand-tile"><img src="${this.brandSrc!}" alt="${brandName}"></span>`
            : ''
        }
        ${brandName ? html`<span class="brand-name">${brandName}</span>` : ''}
        ${context ? html`<span class="brand-context">${context}</span>` : ''}
      </div>
      <slot></slot>
      ${
        items.length
          ? html`
        <div class="meta" part="meta">
          ${items.map(
            (i) => html`
            <div class="meta-item"><strong>${i.l}</strong><span>${i.v}</span></div>
          `,
          )}
        </div>`
          : ''
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'deck-cover': DeckCover;
  }
}
