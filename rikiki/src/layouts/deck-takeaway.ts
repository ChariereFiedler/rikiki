// ════════════════════════════════════════════════════════════════
// <deck-takeaway kicker="Coût au démarrage">
//   <p class="display on-dark">~1 seconde sur Switch</p>
//   <p class="caption on-dark">Sous-titre.</p>
// </deck-takeaway>
// ════════════════════════════════════════════════════════════════

import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { slideBase } from '../shared-styles.js';
import { spreadValue } from '../shared/slide-fill.js';

@customElement('deck-takeaway')
export class DeckTakeaway extends LitElement {
  /* Tokens:
       --deck-takeaway-bg               (defaults to --rik-surface-inverse)
       --deck-takeaway-display-color    (defaults to --rik-accent)
       --deck-takeaway-caption-color    (defaults to --rik-text-inverse--faint)
       --deck-takeaway-gap              vertical gap between elements */
  static override styles = [
    ...slideBase,
    css`
    :host {
      background: var(--deck-takeaway-bg, var(--rik-surface-inverse));
      color: var(--rik-text-inverse);
      justify-content: center; align-items: center; text-align: center;
    }
    .body {
      display: flex; flex-direction: column; align-items: center;
      gap: var(--deck-takeaway-gap, var(--rik-space-4));
      max-width: 75cqw;
    }
    ::slotted(.display) {
      font-family: var(--rik-font-display, var(--rik-font-sans));
      font-size: clamp(3rem, 7cqw, 5.5rem);
      font-weight: 900;
      color: var(--deck-takeaway-display-color, var(--rik-accent));
      letter-spacing: -0.03em; line-height: 1.05;
      margin: 0;
    }
    ::slotted(.display.danger) { color: var(--rik-status-danger); }
    ::slotted(.caption) {
      font-size: var(--rik-font-size-lead);
      color: var(--deck-takeaway-caption-color, var(--rik-text-inverse--faint));
    }

    /* Vertical distribution · both opt-in, both no-ops when absent.
       spread shares the leftover height between the blocks; fill gives that
       height to the blocks themselves (put a deck-fit inside and its text
       grows into it). See src/shared/slide-fill.ts.
       No backticks in here · this sits inside a css template literal. */
    /* A per-slide spread attribute wins; without one the theme default applies
       (--rik-slide-spread), and without that the historical top stack. */
    .body { justify-content: var(--_spread, var(--rik-slide-spread, flex-start)); }
    :host([fill]) .body > ::slotted(*) { flex: 1 1 0; min-height: 0; }
    :host([fill]) .body { justify-content: stretch; }
  `,
  ];

  @property({ type: String }) kicker?: string;

  /** Distribute the leftover vertical space of the body ·
   *  `between` / `around` / `evenly` / `center` / `end` / `start` (default). */
  @property({ type: String, reflect: true }) spread?: string;

  /** Let the body's blocks take the leftover height instead of distributing it
   *  around them · pair with a `<deck-fit>` child to grow its text into it. */
  @property({ type: Boolean, reflect: true }) fill = false;

  override willUpdate(): void {
    // The style follows the ATTRIBUTE everywhere in this library, so reflect
    // both and write the resolved value as a custom property.
    this.style.setProperty('--_spread', spreadValue(this.spread ?? null));
  }

  override render() {
    return html`
      <div class="body" part="body">
        ${this.kicker ? html`<span class="kicker on-dark">${this.kicker}</span>` : ''}
        <slot></slot>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'deck-takeaway': DeckTakeaway;
  }
}
