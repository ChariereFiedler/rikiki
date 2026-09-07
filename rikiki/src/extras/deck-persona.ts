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

@customElement('deck-persona')
export class DeckPersona extends LitElement {
  /* Customization tokens:
       --deck-persona-avatar-size / --deck-persona-avatar-bg
       --deck-persona-name-color / --deck-persona-role-color
       --deck-persona-context-color / --deck-persona-gap                     */
  static override styles = css`
    :host {
      display: flex;
      align-items: start;
      gap: var(--deck-persona-gap, var(--rik-space-4));
      font-family: var(--rik-font-sans);
    }
    .avatar {
      flex: none;
      width: var(--deck-persona-avatar-size, 5rem);
      height: var(--deck-persona-avatar-size, 5rem);
      border-radius: var(--rik-radius-pill);
      background: var(--deck-persona-avatar-bg, var(--rik-surface-tint));
      display: grid;
      place-items: center;
      overflow: hidden;
      font-family: var(--rik-font-display, var(--rik-font-sans));
      font-weight: 900;
      font-size: calc(var(--deck-persona-avatar-size, 5rem) * 0.38);
      color: var(--rik-accent__text);
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
    .name {
      font-size: var(--rik-font-size-lead);
      font-weight: 700;
      color: var(--deck-persona-name-color, var(--rik-text-default));
      line-height: 1.2;
    }
    .role {
      font-size: var(--rik-font-size-sm);
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--deck-persona-role-color, var(--rik-text-default--faint));
    }
    .context {
      margin-top: var(--rik-space-1);
      color: var(--deck-persona-context-color, var(--rik-text-default));
      line-height: 1.4;
      max-width: 48ch;
    }
    :host([on-dark]) .name { color: var(--rik-text-inverse); }
    :host([on-dark]) .role { color: var(--rik-text-inverse--muted); }
    :host([on-dark]) .context { color: var(--rik-text-inverse--muted); }
    @media print {
      .avatar { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  `;

  @property({ type: String }) name?: string;

  /** Job title · NOT the `role` attribute, which belongs to ARIA. */
  @property({ type: String, attribute: 'person-role' }) personRole?: string;

  @property({ type: String }) org?: string;

  /** One line of situation · what makes the story concrete. */
  @property({ type: String }) context?: string;

  /** A portrait · without one the initials stand in, so a deck with no photos
   *  still looks deliberate. */
  @property({ type: String }) src?: string;

  @property({ type: Boolean, reflect: true, attribute: 'on-dark' }) onDark = false;

  private get _initials(): string {
    return (this.name ?? '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('');
  }

  private get _line(): string {
    return [this.personRole, this.org].filter(Boolean).join(' · ');
  }

  override render() {
    return html`
      <span class="avatar" part="avatar" aria-hidden="true">
        ${this.src ? html`<img src=${this.src} alt="" />` : this._initials}
      </span>
      <span class="who">
        ${this.name ? html`<span class="name" part="name">${this.name}</span>` : ''}
        ${this._line ? html`<span class="role" part="role">${this._line}</span>` : ''}
        ${this.context ? html`<span class="context" part="context">${this.context}</span>` : ''}
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
