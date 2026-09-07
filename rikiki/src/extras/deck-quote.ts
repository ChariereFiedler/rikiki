// ════════════════════════════════════════════════════════════════
// <deck-quote author="Marie Dupont" author-role="CTO, Acme">
//   We stopped arguing about the diff and started arguing about the design.
// </deck-quote>
//
// Someone else's words, attributed. Distinct from deck-punch on purpose:
// a punch is the speaker's own line, a quote belongs to a named person and
// carries their name with it.
//
// OPT-IN · not imported by src/index.ts. Load it next to the bundle:
//   <script type="module" src="dist/deck-quote.js"></script>
// ════════════════════════════════════════════════════════════════

import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

export type DeckQuoteSize = 'lead' | 'big' | 'mega';

const SIZES: Record<DeckQuoteSize, string> = {
  lead: 'var(--rik-font-size-lead)',
  big: 'var(--rik-font-size-big)',
  mega: 'var(--rik-font-size-mega)',
};

@customElement('deck-quote')
export class DeckQuote extends LitElement {
  /* Customization tokens · each routes to a semantic --rik-* token, so the
     component follows whichever theme is loaded.

       --deck-quote-color         the quoted text
       --deck-quote-size          type size (overrides the `size` attribute)
       --deck-quote-mark-color    the opening quotation mark
       --deck-quote-mark-size     its size
       --deck-quote-rule          the accent rule down the left edge
       --deck-quote-rule-width    its thickness
       --deck-quote-gap           space between mark, quote and attribution
       --deck-quote-author-color  the attributed name
       --deck-quote-role-color    the role under the name
       --deck-quote-max-width     measure of the quoted line                */
  static override styles = css`
    :host {
      display: block;
      font-family: var(--rik-font-sans);
      padding-left: var(--rik-space-4);
      border-left: var(--deck-quote-rule-width, 3px) solid
        var(--deck-quote-rule, var(--rik-accent));
    }
    figure {
      /* The theme reset is scoped to the deck subtree and does not reach into
         a shadow root · the UA margin on <figure> would offset every quote. */
      margin: 0;
    }
    :host([plain]) {
      padding-left: 0;
      border-left: none;
    }
    .mark {
      display: block;
      font-family: var(--rik-font-display, var(--rik-font-sans));
      /* Relative to the quote · the glyph is optically small at an equal
         font size, so matching sizes makes it disappear. */
      font-size: var(--deck-quote-mark-size, calc(var(--_size) * 1.8));
      line-height: 0.8;
      color: var(--deck-quote-mark-color, var(--rik-accent));
      /* Decoration · the quotation mark is already implied by the element. */
      user-select: none;
    }
    .quote {
      display: block;
      font-size: var(--deck-quote-size, var(--_size));
      line-height: 1.25;
      color: var(--deck-quote-color, var(--rik-text-default));
      max-width: var(--deck-quote-max-width, 26ch);
      margin: var(--deck-quote-gap, var(--rik-space-2)) 0;
      text-wrap: balance;
    }
    .who {
      margin-top: var(--deck-quote-gap, var(--rik-space-2));
      line-height: 1.35;
    }
    .author {
      display: block;
      font-weight: 700;
      color: var(--deck-quote-author-color, var(--rik-text-default));
    }
    /* Who they are, written as a phrase · the tracked-out small caps it used
       to wear said nothing the words do not, and said it illegibly. */
    .role {
      display: block;
      font-size: var(--rik-font-size-body);
      color: var(--deck-quote-role-color, var(--rik-text-default--muted));
    }
    /* On a dark slide (a cover, a section) the inverse text tokens apply. */
    :host([on-dark]) .quote,
    :host([on-dark]) .author {
      color: var(--rik-text-inverse);
    }
    :host([on-dark]) .role {
      color: var(--rik-text-inverse--muted);
    }
  `;

  /** Attributed name · omitted, the quote stands alone. */
  @property({ type: String }) author?: string;

  /** Role or affiliation, under the name.
   *
   *  NOT `role`: that attribute is ARIA's, and putting "CTO, Acme" in it would
   *  announce the figure as a landmark of that name. The property would also
   *  shadow HTMLElement.role. */
  @property({ type: String, attribute: 'author-role' }) authorRole?: string;

  /** Type size of the quoted line. */
  @property({ type: String, reflect: true }) size: DeckQuoteSize = 'big';

  /** Drop the accent rule down the left edge. */
  @property({ type: Boolean, reflect: true }) plain = false;

  /** Use the inverse text tokens · for a quote on a dark slide. */
  @property({ type: Boolean, reflect: true, attribute: 'on-dark' }) onDark = false;

  /** Hide the decorative opening mark. */
  @property({ type: Boolean, attribute: 'no-mark' }) noMark = false;

  override willUpdate(): void {
    // The style follows the ATTRIBUTE everywhere in this library · resolve the
    // size once and let the CSS read it.
    this.style.setProperty('--_size', SIZES[this.size] ?? SIZES.big);
  }

  override render() {
    return html`
      <figure>
        ${this.noMark ? '' : html`<span class="mark" aria-hidden="true">&ldquo;</span>`}
        <blockquote class="quote" part="quote"><slot></slot></blockquote>
        ${
          this.author
            ? html`<figcaption class="who" part="attribution">
                <span class="author">${this.author}</span>
                ${this.authorRole ? html`<span class="role">${this.authorRole}</span>` : ''}
              </figcaption>`
            : ''
        }
      </figure>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'deck-quote': DeckQuote;
  }
}
