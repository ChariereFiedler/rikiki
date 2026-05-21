// ════════════════════════════════════════════════════════════════
// <deck-tier-list>
//   <deck-tier name="LLInt" desc="Bytecode" speed="×1"></deck-tier>
//   <deck-tier-arrow>↓ after ~6 runs</deck-tier-arrow>
//   <deck-tier name="Baseline JIT" speed="×10" severity="warn"></deck-tier>
//   ...
//   <deck-tier name="FTL · LLVM" speed="×100" hot></deck-tier>
// </deck-tier-list>
// ════════════════════════════════════════════════════════════════

import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

export type DeckTierSeverity = 'muted' | 'warn' | 'ok' | 'hot';

@customElement('deck-tier-list')
export class DeckTierList extends LitElement {
  static override styles = css`
    :host { display: flex; flex-direction: column; gap: var(--rik-space-2xs); }
  `;
  override render() { return html`<slot></slot>`; }
}

@customElement('deck-tier')
export class DeckTier extends LitElement {
  /* Customization tokens:
       --deck-tier-bg / --deck-tier-border / --deck-tier-radius
       --deck-tier-padding-x / --deck-tier-padding-y / --deck-tier-shadow
       --deck-tier-name-color / --deck-tier-desc-color
       --deck-tier-speed-{muted,warn,ok}
       --deck-tier-hot-bg / --deck-tier-hot-border / --deck-tier-hot-color */
  static override styles = css`
    :host {
      display: flex; flex-direction: column; gap: var(--rik-space-hair);
      background: var(--deck-tier-bg, var(--rik-surface-raised--strong));
      border: 1px solid var(--deck-tier-border, var(--rik-border-default));
      border-radius: var(--deck-tier-radius, var(--rik-radius-md));
      padding: var(--deck-tier-padding-y, var(--rik-space-2)) var(--deck-tier-padding-x, var(--rik-space-4));
      box-shadow: var(--deck-tier-shadow, var(--rik-elevation-2));
      font-family: var(--rik-font-sans);
    }
    :host([hot]) {
      border-color: var(--deck-tier-hot-border, var(--rik-status-info__border));
      background: var(--deck-tier-hot-bg, var(--rik-status-info__bg));
    }
    .head { display: flex; justify-content: space-between; align-items: baseline; }
    .name {
      font: 700 var(--rik-font-size-body)/1 var(--rik-font-mono);
      color: var(--deck-tier-name-color, var(--rik-text-default));
    }
    :host([hot]) .name { color: var(--deck-tier-hot-color, var(--rik-accent)); }
    .speed { font: 700 var(--rik-font-size-body)/1 var(--rik-font-mono); }
    .speed[data-severity="muted"] { color: var(--deck-tier-speed-muted, var(--rik-text-default--faint)); }
    .speed[data-severity="warn"]  { color: var(--deck-tier-speed-warn,  var(--rik-status-warn)); }
    .speed[data-severity="ok"]    { color: var(--deck-tier-speed-ok,    var(--rik-status-success)); }
    :host([hot]) .speed { color: var(--deck-tier-hot-color, var(--rik-accent)); }
    .desc {
      font-size: var(--rik-font-size-sm);
      color: var(--deck-tier-desc-color, var(--rik-text-default--faint));
      line-height: 1.4;
    }
  `;

  @property({ type: String }) name?: string;
  @property({ type: String }) speed?: string;
  @property({ type: String }) severity?: DeckTierSeverity;
  @property({ type: Boolean, reflect: true }) hot = false;

  override render() {
    return html`
      <div class="head">
        <span class="name">${this.name}</span>
        <span class="speed" data-severity="${this.severity ?? (this.hot ? 'hot' : '')}">${this.speed}</span>
      </div>
      <div class="desc"><slot></slot></div>
    `;
  }
}

@customElement('deck-tier-arrow')
export class DeckTierArrow extends LitElement {
  static override styles = css`
    :host {
      display: block; text-align: center;
      color: var(--rik-text-default--faint); opacity: var(--rik-opacity-soft);
      font-size: var(--rik-font-size-xs);
      padding: 2px 0;
    }
  `;
  override render() { return html`<slot></slot>`; }
}

declare global {
  interface HTMLElementTagNameMap {
    'deck-tier-list': DeckTierList;
    'deck-tier': DeckTier;
    'deck-tier-arrow': DeckTierArrow;
  }
}
