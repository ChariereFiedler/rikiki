// ════════════════════════════════════════════════════════════════
// <deck-feature eyebrow="ESM">
//   <h1>Title</h1>
//   <p slot="lead">Optional hook line.</p>
//   <deck-code lang="js">...</deck-code>     <!-- or any focal block -->
// </deck-feature>
// ════════════════════════════════════════════════════════════════

import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { slideBase } from '../shared-styles.js';
import { spreadValue } from '../shared/slide-fill.js';

@customElement('deck-feature')
export class DeckFeature extends LitElement {
  static override styles = [
    ...slideBase,
    css`
    :host { justify-content: flex-start; }
    .body {
      flex: 1; min-height: 0;
      display: flex; flex-direction: column;
      justify-content: flex-start;
      gap: var(--rik-space-3);
      overflow: hidden;
    }
    ::slotted(deck-code:not([nested])),
    ::slotted(deck-mermaid),
    ::slotted(table),
    ::slotted(pre),
    ::slotted(svg),
    ::slotted(.hero-main) { max-height: 100%; flex: 0 1 auto; }

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

  @property({ type: String }) eyebrow?: string;

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
      ${this.eyebrow ? html`<span class="lbl">${this.eyebrow}</span>` : ''}
      <slot name="title"></slot>
      <slot name="lead"></slot>
      <div class="body" part="body"><slot></slot></div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'deck-feature': DeckFeature;
  }
}
