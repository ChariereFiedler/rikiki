// ════════════════════════════════════════════════════════════════
// <deck-persona name="Marie Dupont" role="CTO" org="Acme"
//   context="Fifty engineers, two monoliths, one deadline.">
// </deck-persona>
//
// Who is speaking, or who the case study is about. Introducing a customer story
// with a name and a situation is what makes the room listen to the numbers that
// follow.
//
// OPT-IN · <script type="module" src="dist/deck-persona.js"></script>
// ════════════════════════════════════════════════════════════════

import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { signature } from './signature.js';

@customElement('deck-persona')
export class DeckPersona extends LitElement {
  /* Customization tokens:
       --deck-persona-avatar-size / --deck-persona-initials-color
       --deck-persona-rule
       --deck-persona-name-color / --deck-persona-role-color
       --deck-persona-context-color / --deck-persona-gap                     */
  static override styles = [
    signature,
    css`
      :host {
        display: flex;
        align-items: center;
        gap: var(--deck-persona-gap, var(--rik-space-5));
      }
      /* A portrait is a portrait. Without one, the initials are set at
         statement scale instead of parked in a tinted disc · the disc read as
         an avatar placeholder, which is what it was. */
      .avatar {
        flex: none;
        width: var(--deck-persona-avatar-size, 6rem);
        height: var(--deck-persona-avatar-size, 6rem);
        display: grid;
        place-items: center;
        overflow: hidden;
        color: var(--deck-persona-initials-color, var(--rik-text-default--faint));
      }
      .avatar .statement {
        font-size: calc(var(--deck-persona-avatar-size, 6rem) * 0.45);
      }
      :host([src]) .avatar {
        border-radius: var(--rik-radius-sm);
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
      }
      /* The name is the statement · it is who the room is being asked to care
         about, and it is the only thing on the slide worth that size. */
      .name {
        font-size: var(--deck-persona-name-size, var(--rik-font-size-big));
        color: var(--deck-persona-name-color, var(--rik-text-default));
      }
      .role {
        color: var(--deck-persona-role-color, var(--rik-text-default--muted));
      }
      .context {
        margin-top: var(--rik-space-2);
        color: var(--deck-persona-context-color, var(--rik-text-default));
      }
      :host([on-dark]) .avatar { color: var(--rik-text-inverse--faint); }
      :host([on-dark]) .name { color: var(--rik-text-inverse); }
      :host([on-dark]) .role,
      :host([on-dark]) .context { color: var(--rik-text-inverse--muted); }
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
        ${this.context ? html`<span class="context reading" part="context">${this.context}</span>` : ''}
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
