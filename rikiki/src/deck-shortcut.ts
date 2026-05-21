// ════════════════════════════════════════════════════════════════
// <deck-kbd>Esc</deck-kbd>
// <deck-shortcut keys="O" label="Overview" note="..."></deck-shortcut>
// <deck-shortcut-list> ... </deck-shortcut-list>
//
// A trio of components for documenting keyboard shortcuts.
//
//   · <deck-kbd>           styled keyboard key chip · use it inline anywhere.
//   · <deck-shortcut>      one row: one or more keys + a label + a note.
//                          `keys` is space-separated, e.g. `keys="Space PgDn"`.
//                          A `note` attribute (or default slot) describes it.
//   · <deck-shortcut-list> renders its children in a responsive two-column
//                          grid, with separator lines between rows.
//
// All gaps map to design tokens · `gap` attribute on the list accepts 1..6.
// ════════════════════════════════════════════════════════════════

import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

export type DeckKbdTone = 'accent' | 'ok';

/* ────────────────────────────── deck-kbd ────────────────────────────── */

@customElement('deck-kbd')
export class DeckKbd extends LitElement {
  /* Customization tokens:
       --deck-kbd-bg / --deck-kbd-color / --deck-kbd-border
       --deck-kbd-radius / --deck-kbd-padding-x / --deck-kbd-padding-y
       --deck-kbd-accent-bg / --deck-kbd-ok-bg (per-tone overrides) */
  static override styles = css`
    :host {
      display: inline-flex; align-items: center; justify-content: center;
      background: var(--deck-kbd-bg, var(--rik-surface-raised--strong));
      border: 1px solid var(--deck-kbd-border, var(--rik-border-default));
      border-bottom: 3px solid var(--rik-surface-tint--strong, rgba(0,0,0,0.10));
      border-radius: var(--deck-kbd-radius, 5px);
      padding: var(--deck-kbd-padding-y, 3px) var(--deck-kbd-padding-x, 8px);
      font: 700 0.92rem/1 var(--rik-font-mono);
      color: var(--deck-kbd-color, var(--rik-text-default));
      min-width: 22px;
      text-align: center;
      box-shadow: 0 1px 0 rgba(255,255,255,0.5) inset;
    }
    :host([tone="accent"]) {
      background: var(--deck-kbd-accent-bg, var(--rik-accent));
      color: var(--deck-kbd-color, var(--rik-accent__on, var(--rik-surface-inverse)));
      border-color: rgba(0,0,0,0.15);
    }
    :host([tone="ok"]) {
      background: var(--deck-kbd-ok-bg, var(--rik-status-success));
      color: var(--deck-kbd-color, var(--rik-surface-inverse));
      border-color: rgba(0,0,0,0.15);
    }
  `;

  @property({ type: String }) tone?: DeckKbdTone;

  override render() {
    return html`<slot></slot>`;
  }
}

/* ──────────────────────────── deck-shortcut ─────────────────────────── */

@customElement('deck-shortcut')
export class DeckShortcut extends LitElement {
  static override styles = css`
    :host {
      display: flex; align-items: center; gap: var(--rik-space-3);
      padding: var(--rik-space-2) 0;
      font-family: var(--rik-font-sans);
    }
    .keys { display: inline-flex; gap: 4px; flex-shrink: 0; }
    .keys deck-kbd, .keys .k {
      display: inline-flex; align-items: center; justify-content: center;
      background: var(--rik-surface-raised--strong);
      border: 1px solid var(--rik-border-default);
      border-bottom: 3px solid rgba(0,0,0,0.10);
      border-radius: 5px;
      padding: 3px 8px;
      font: 700 0.92rem/1 var(--rik-font-mono);
      color: var(--rik-text-default);
      min-width: 22px; text-align: center;
    }
    .body { flex: 1; min-width: 0; }
    .label {
      font: 700 var(--rik-font-size-body)/1.2 var(--rik-font-sans);
      color: var(--rik-text-default);
    }
    .note {
      font: 400 var(--rik-font-size-sm)/1.4 var(--rik-font-sans);
      color: var(--rik-text-default--faint);
      margin-top: 2px;
    }
    :host([tone="accent"]) .keys .k { background: var(--rik-accent); color: var(--rik-surface-inverse); border-color: rgba(0,0,0,0.15); }
    :host([tone="ok"])     .keys .k { background: var(--rik-status-success);  color: var(--rik-surface-inverse); border-color: rgba(0,0,0,0.15); }
  `;

  @property({ type: String }) keys?: string;
  @property({ type: String }) label?: string;
  @property({ type: String }) note?: string;
  @property({ type: String }) tone?: DeckKbdTone;

  override render() {
    const keyTokens = (this.keys ?? '').trim().split(/\s+/).filter(Boolean);
    return html`
      <span class="keys" part="keys">
        ${keyTokens.map((k) => html`<span class="k">${k}</span>`)}
      </span>
      <div class="body" part="body">
        ${this.label ? html`<div class="label">${this.label}</div>` : ''}
        ${this.note ? html`<div class="note">${this.note}</div>` : html`<div class="note"><slot></slot></div>`}
      </div>
    `;
  }
}

/* ─────────────────────────── deck-shortcut-list ─────────────────────── */

@customElement('deck-shortcut-list')
export class DeckShortcutList extends LitElement {
  static override styles = css`
    :host {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0 var(--_col-gap, var(--rik-space-5));
      font-family: var(--rik-font-sans);
    }
    :host([cols="1"]) { grid-template-columns: 1fr; }
    ::slotted(deck-shortcut) {
      border-bottom: 1px solid var(--rik-border-default);
    }
  `;

  @property({ type: String }) cols?: string;
  @property({ type: String, attribute: 'col-gap' }) colGap?: string;

  override updated() {
    if (this.colGap) {
      const n = parseInt(this.colGap, 10);
      const v = !Number.isNaN(n) && n >= 1 && n <= 6 ? `var(--sp-${n})` : this.colGap;
      this.style.setProperty('--_col-gap', v);
    }
  }

  override render() {
    return html`<slot></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'deck-kbd': DeckKbd;
    'deck-shortcut': DeckShortcut;
    'deck-shortcut-list': DeckShortcutList;
  }
}
