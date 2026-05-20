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
    :host { display: flex; flex-direction: column; gap: var(--gap-xs); }
  `;
  override render() { return html`<slot></slot>`; }
}

@customElement('deck-tier')
export class DeckTier extends LitElement {
  static override styles = css`
    :host {
      display: flex; flex-direction: column; gap: var(--gap-hair);
      background: var(--surface-card);
      border: 1px solid var(--border);
      border-radius: var(--r-md);
      padding: var(--sp-2) var(--sp-4);
      box-shadow: var(--shadow-card);
      font-family: var(--sans);
    }
    :host([hot]) {
      border-color: var(--border-info);
      background: var(--surface-info-faint);
    }
    .head {
      display: flex; justify-content: space-between; align-items: baseline;
    }
    .name { font: 700 var(--fs-body)/1 var(--mono); color: var(--text); }
    :host([hot]) .name { color: var(--yellow); }
    .speed { font: 700 var(--fs-body)/1 var(--mono); }
    .speed[data-severity="muted"] { color: var(--muted); }
    .speed[data-severity="warn"]  { color: var(--orange); }
    .speed[data-severity="ok"]    { color: var(--green); }
    :host([hot]) .speed { color: var(--yellow); }
    .desc { font-size: var(--fs-small); color: var(--muted); line-height: 1.4; }
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
      color: var(--muted); opacity: var(--opacity-soft);
      font-size: var(--fs-micro);
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
