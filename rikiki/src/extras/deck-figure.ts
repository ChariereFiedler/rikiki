// ════════════════════════════════════════════════════════════════
// <deck-figure src="result.png" alt="Build duration by pipeline stage"
//              caption="The cache removes most of the install cost."
//              source="CI benchmark · 11 September 2026"></deck-figure>
//
// A content figure for screenshots, diagrams and charts. The image keeps its
// intrinsic ratio; its caption and source stay attached to it semantically.
// Decorative images must say so explicitly with `decorative`.
//
// OPT-IN · <script type="module" src="dist/deck-figure.js"></script>
// ════════════════════════════════════════════════════════════════

import { LitElement, css, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { signature } from './signature.js';

// deck-source is a core atom, registered by dist/index.js · every opt-in
// module is documented as "loaded next to the bundle" (§20), so it is always
// present by the time a deck reaches this one. Importing it here too would
// register 'deck-source' a second time and throw when both bundles load.

@customElement('deck-figure')
export class DeckFigure extends LitElement {
  /* Customization tokens:
       --deck-figure-gap / --deck-figure-image-fit / --deck-figure-image-position
       --deck-figure-radius / --deck-figure-border / --deck-figure-caption-color
       --deck-figure-source-color / --deck-figure-max-height */
  static override styles = [
    signature,
    css`
      :host {
        display: block;
        min-width: 0;
        min-height: 0;
        font-family: var(--rik-font-sans);
      }
      figure {
        display: flex;
        flex-direction: column;
        gap: var(--deck-figure-gap, var(--rik-space-2));
        min-width: 0;
        min-height: 0;
        margin: 0;
      }
      .media {
        display: flex;
        min-height: 0;
        overflow: hidden;
        border: 1px solid var(--deck-figure-border, var(--rik-border-default));
        border-radius: var(--deck-figure-radius, var(--rik-radius-md));
        background: var(--deck-figure-bg, var(--rik-surface-raised));
      }
      img {
        display: block;
        width: 100%;
        /* cqh is the WHOLE slide, eyebrow, title and padding included, so the
           default has to leave room for the heading a figure usually sits
           under · a figure that owns its slide raises the token. */
        max-height: var(--deck-figure-max-height, 52cqh);
        object-fit: var(--deck-figure-image-fit, contain);
        object-position: var(--deck-figure-image-position, center);
      }
      figcaption {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: baseline;
        gap: var(--rik-space-2) var(--rik-space-4);
        color: var(--deck-figure-caption-color, var(--rik-text-default--muted));
        font-size: var(--rik-font-size-sm);
        line-height: 1.5;
      }
      /* deck-source renders the actual credit · these two rules forward the
         figure's own token and restore the single-line, baseline-aligned
         look this figcaption grid needs (deck-source's own default is a
         block line under a block, not a column beside a caption). */
      deck-source {
        --deck-source-color: var(--deck-figure-source-color, var(--rik-text-default--faint));
        --deck-source-gap: 0;
      }
      deck-source::part(source) {
        white-space: nowrap;
      }
      @media (max-width: 640px) {
        figcaption { grid-template-columns: 1fr; }
        deck-source::part(source) { white-space: normal; }
      }
    `,
  ];

  /** Image URL. */
  @property({ type: String }) src?: string;

  /** Text alternative. Required unless `decorative` is present. */
  @property({ type: String }) alt?: string;

  /** Declare that the image conveys no information. Produces alt="". */
  @property({ type: Boolean, reflect: true }) decorative = false;

  /** Concise explanation displayed below the image. */
  @property({ type: String }) caption?: string;

  /** Source or credit displayed beside the caption. */
  @property({ type: String }) source?: string;

  /** Optional URL for the source or credit. */
  @property({ type: String, attribute: 'source-href' }) sourceHref?: string;

  private get _hasCaption(): boolean {
    return Boolean(
      this.caption || this.source || this.querySelector('[slot="caption"], [slot="source"]'),
    );
  }

  private get _hasSource(): boolean {
    return Boolean(this.source || this.querySelector('[slot="source"]'));
  }

  private get _imageAlt(): string | typeof nothing {
    if (this.decorative) return '';
    const value = this.alt?.trim();
    return value ? value : nothing;
  }

  override updated(): void {
    // Keep the authoring error visible to tooling without inventing an empty
    // alternative that would silently turn an informative image decorative.
    this.toggleAttribute('data-missing-alt', !this.decorative && !this.alt?.trim());
  }

  override render() {
    return html`
      <figure part="figure">
        <div class="media" part="media">
          ${
            this.src
              ? html`<img part="image" src=${this.src} alt=${this._imageAlt} />`
              : html`<slot name="image"></slot>`
          }
        </div>
        ${
          this._hasCaption
            ? html`<figcaption part="caption">
              <span class="caption"><slot name="caption">${this.caption ?? ''}</slot></span>
              ${
                this._hasSource
                  ? html`<deck-source part="source" href=${this.sourceHref ?? nothing}
                      ><slot name="source">${this.source ?? ''}</slot></deck-source
                    >`
                  : nothing
              }
            </figcaption>`
            : nothing
        }
      </figure>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'deck-figure': DeckFigure;
  }
}
