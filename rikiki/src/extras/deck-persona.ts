// ════════════════════════════════════════════════════════════════
// <deck-persona name="Marie Dupont" person-role="CTO" org="Acme"
//   context="Fifty engineers, two monoliths, one deadline.">
// </deck-persona>
//
// Who is speaking, or who the case study is about. Introducing a customer story
// with a name and a situation is what makes the room listen to the numbers that
// follow.
//
// The portrait block is this component's ONE MASS · a square of the inverse
// surface holding the initials, or the photo. A persona slide has exactly one
// subject, and giving that subject a place on the slide is the difference
// between someone being introduced and a contact card. Before it, the initials
// were faint grey type parked left of the name, attached to nothing.
//
// OPT-IN · <script type="module" src="dist/deck-persona.js"></script>
// Add `compact` for supporting personas, and `inline` when identity metadata
// should occupy one short row rather than the opening third of a slide.
// ════════════════════════════════════════════════════════════════

import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { signature } from './signature.js';

@customElement('deck-persona')
export class DeckPersona extends LitElement {
  /* Customization tokens:
       --deck-persona-avatar-size / --deck-persona-avatar-bg
       --deck-persona-initials-color / --deck-persona-initials-size
       --deck-persona-name-size / --deck-persona-name-color
       --deck-persona-role-color / --deck-persona-context-color
       --deck-persona-gap / --deck-persona-name-lift
       --deck-persona-compact-avatar-size
       --deck-persona-compact-name-size                                     */
  static override styles = [
    signature,
    css`
      /* Anchored to the name, not centred against the stack. Centring made the
         block drift down as soon as the context ran to two lines, so it sat
         between the role and the context, attached to neither · the name is
         what it identifies, so the block's top edge and the name's cap line up. */
      :host {
        display: flex;
        align-items: start;
        gap: var(--deck-persona-gap, var(--rik-space-5));
      }
      /* The mass. The night surface is the only fill this palette has that
         survives the room (18.9:1 against the page under both themes), and the
         square is what gives the person a place on the slide. A photo fills the
         same square, so a deck with portraits and a deck without have the same
         shape. */
      .avatar {
        flex: none;
        box-sizing: border-box;
        width: var(--deck-persona-avatar-size, clamp(4.5rem, 7cqw, 8rem));
        height: var(--deck-persona-avatar-size, clamp(4.5rem, 7cqw, 8rem));
        display: grid;
        place-items: center;
        overflow: hidden;
        background: var(--deck-persona-avatar-bg, var(--rik-surface-inverse));
        color: var(--deck-persona-initials-color, var(--rik-text-inverse));
        border-radius: var(--rik-radius-sm);
      }
      .avatar .statement {
        font-size: var(
          --deck-persona-initials-size,
          calc(var(--deck-persona-avatar-size, clamp(4.5rem, 7cqw, 8rem)) * 0.42)
        );
        /* Optical centring · cap-height type in a square sits low when it is
           centred on its line box. */
        line-height: 1;
      }
      .avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }
      .who {
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: var(--rik-space-1);
        /* The name's cap sits below the top of its line box. Nudging the whole
           stack down by the difference puts the cap on the block's top edge,
           which is the alignment the eye actually reads. */
        padding-top: var(--deck-persona-name-lift, 0.12em);
      }
      /* The name is the statement · it is who the room is being asked to care
         about, and it is the only type on the slide worth that size. */
      .name {
        font-size: var(--deck-persona-name-size, clamp(1.75rem, 2.6cqw, 3rem));
        color: var(--deck-persona-name-color, var(--rik-text-default));
      }
      .role {
        color: var(--deck-persona-role-color, var(--rik-text-default--muted));
      }
      /* The situation, separated from the identity by a gap rather than by a
         rule · rule 4 of ADR-002, a line only where two things would touch. */
      .context {
        margin-top: var(--rik-space-3);
        color: var(--deck-persona-context-color, var(--rik-text-default--muted));
      }
      /* On a dark slide the same device read the other way round · the block
         becomes paper and the initials become ink, so it is still the one mass
         and still the highest contrast thing in the component. */
      :host([on-dark]) .avatar {
        background: var(--deck-persona-avatar-bg, var(--rik-surface-page));
        color: var(--deck-persona-initials-color, var(--rik-text-default));
      }
      :host([on-dark]) .name { color: var(--rik-text-inverse); }
      :host([on-dark]) .role,
      :host([on-dark]) .context { color: var(--rik-text-inverse--muted); }

      /* A supporting persona shrinks the block AND the name together · a
         smaller square next to an unchanged name is what made compact read as
         a broken layout rather than a quieter one. */
      :host([compact]),
      :host([inline]) {
        --deck-persona-avatar-size: var(--deck-persona-compact-avatar-size, clamp(3rem, 4cqw, 4.5rem));
        --deck-persona-name-size: var(--deck-persona-compact-name-size, clamp(1.35rem, 2cqw, 2.1rem));
        --deck-persona-gap: var(--rik-space-3);
      }
      :host([compact]) .context,
      :host([inline]) .context {
        margin-top: var(--rik-space-1);
        font-size: var(--rik-font-size-sm);
      }

      :host([inline]) {
        align-items: center;
      }
      :host([inline]) .who {
        flex: 1 1 auto;
        flex-direction: row;
        align-items: baseline;
        flex-wrap: wrap;
        column-gap: var(--rik-space-2);
        row-gap: var(--rik-space-1);
        padding-top: 0;
      }
      :host([inline]) .context {
        margin-top: 0;
      }

      @media print {
        .avatar {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      }
    `,
  ];

  @property({ type: String }) name?: string;

  /** Job title · NOT the `role` attribute, which belongs to ARIA. */
  @property({ type: String, attribute: 'person-role' }) personRole?: string;

  @property({ type: String }) org?: string;

  /** One line of situation · what makes the story concrete. */
  @property({ type: String }) context?: string;

  /** A portrait · without one the initials stand in, so a deck with no photos
   *  still looks deliberate. */
  @property({ type: String, reflect: true }) src?: string;

  @property({ type: Boolean, reflect: true, attribute: 'on-dark' }) onDark = false;

  /** Reduce portrait, type and spacing for a supporting persona. */
  @property({ type: Boolean, reflect: true }) compact = false;

  /** Place name, role and context in a wrapping horizontal line. */
  @property({ type: Boolean, reflect: true }) inline = false;

  private get _initials(): string {
    return (this.name ?? '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('');
  }

  /** The job and the company, written as a phrase.
   *
   *  It used to be joined with a middle dot, which is one of the surest marks
   *  of a generated page and reads as a machine string rather than as a person
   *  being introduced. */
  private get _line(): string {
    if (this.personRole && this.org) return `${this.personRole} at ${this.org}`;
    return this.personRole ?? this.org ?? '';
  }

  override render() {
    return html`
      <span class="avatar" part="avatar" aria-hidden="true">
        ${
          this.src
            ? html`<img src=${this.src} alt="" />`
            : html`<span class="statement">${this._initials}</span>`
        }
      </span>
      <span class="who">
        ${this.name ? html`<span class="name statement" part="name">${this.name}</span>` : ''}
        ${this._line ? html`<span class="role reading" part="role">${this._line}</span>` : ''}
        ${this.context ? html`<span class="context reading quiet" part="context">${this.context}</span>` : ''}
        <slot></slot>
      </span>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'deck-persona': DeckPersona;
  }
}
