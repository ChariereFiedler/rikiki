var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if (decorator = decorators[i])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp(target, key, result);
  return result;
};

// src/deck-shortcut.ts
import { LitElement, html, css } from "https://cdn.jsdelivr.net/npm/lit@3/+esm";
import { customElement, property } from "https://cdn.jsdelivr.net/npm/lit@3/decorators.js/+esm";
var DeckKbd = class extends LitElement {
  render() {
    return html`<slot></slot>`;
  }
};
DeckKbd.styles = css`
    :host {
      display: inline-flex; align-items: center; justify-content: center;
      background: var(--surface-card);
      border: 1px solid var(--border);
      border-bottom: 3px solid var(--surface-tint-strong, rgba(0,0,0,0.10));
      border-radius: 5px;
      padding: 3px 8px;
      font: 700 0.92rem/1 var(--mono);
      color: var(--text);
      min-width: 22px;
      text-align: center;
      box-shadow: 0 1px 0 rgba(255,255,255,0.5) inset;
    }
    :host([tone="accent"]) {
      background: var(--yellow);
      color: var(--dark);
      border-color: rgba(0,0,0,0.15);
    }
    :host([tone="ok"]) {
      background: var(--green);
      color: var(--dark);
      border-color: rgba(0,0,0,0.15);
    }
  `;
__decorateClass([
  property({ type: String })
], DeckKbd.prototype, "tone", 2);
DeckKbd = __decorateClass([
  customElement("deck-kbd")
], DeckKbd);
var DeckShortcut = class extends LitElement {
  render() {
    const keyTokens = (this.keys ?? "").trim().split(/\s+/).filter(Boolean);
    return html`
      <span class="keys" part="keys">
        ${keyTokens.map((k) => html`<span class="k">${k}</span>`)}
      </span>
      <div class="body" part="body">
        ${this.label ? html`<div class="label">${this.label}</div>` : ""}
        ${this.note ? html`<div class="note">${this.note}</div>` : html`<div class="note"><slot></slot></div>`}
      </div>
    `;
  }
};
DeckShortcut.styles = css`
    :host {
      display: flex; align-items: center; gap: var(--sp-3);
      padding: var(--sp-2) 0;
      font-family: var(--sans);
    }
    .keys { display: inline-flex; gap: 4px; flex-shrink: 0; }
    .keys deck-kbd, .keys .k {
      display: inline-flex; align-items: center; justify-content: center;
      background: var(--surface-card);
      border: 1px solid var(--border);
      border-bottom: 3px solid rgba(0,0,0,0.10);
      border-radius: 5px;
      padding: 3px 8px;
      font: 700 0.92rem/1 var(--mono);
      color: var(--text);
      min-width: 22px; text-align: center;
    }
    .body { flex: 1; min-width: 0; }
    .label {
      font: 700 var(--fs-body)/1.2 var(--sans);
      color: var(--text);
    }
    .note {
      font: 400 var(--fs-small)/1.4 var(--sans);
      color: var(--muted);
      margin-top: 2px;
    }
    :host([tone="accent"]) .keys .k { background: var(--yellow); color: var(--dark); border-color: rgba(0,0,0,0.15); }
    :host([tone="ok"])     .keys .k { background: var(--green);  color: var(--dark); border-color: rgba(0,0,0,0.15); }
  `;
__decorateClass([
  property({ type: String })
], DeckShortcut.prototype, "keys", 2);
__decorateClass([
  property({ type: String })
], DeckShortcut.prototype, "label", 2);
__decorateClass([
  property({ type: String })
], DeckShortcut.prototype, "note", 2);
__decorateClass([
  property({ type: String })
], DeckShortcut.prototype, "tone", 2);
DeckShortcut = __decorateClass([
  customElement("deck-shortcut")
], DeckShortcut);
var DeckShortcutList = class extends LitElement {
  updated() {
    if (this.colGap) {
      const n = parseInt(this.colGap, 10);
      const v = !Number.isNaN(n) && n >= 1 && n <= 6 ? `var(--sp-${n})` : this.colGap;
      this.style.setProperty("--_col-gap", v);
    }
  }
  render() {
    return html`<slot></slot>`;
  }
};
DeckShortcutList.styles = css`
    :host {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0 var(--_col-gap, var(--sp-5));
      font-family: var(--sans);
    }
    :host([cols="1"]) { grid-template-columns: 1fr; }
    ::slotted(deck-shortcut) {
      border-bottom: 1px solid var(--border);
    }
  `;
__decorateClass([
  property({ type: String })
], DeckShortcutList.prototype, "cols", 2);
__decorateClass([
  property({ type: String, attribute: "col-gap" })
], DeckShortcutList.prototype, "colGap", 2);
DeckShortcutList = __decorateClass([
  customElement("deck-shortcut-list")
], DeckShortcutList);
export {
  DeckKbd,
  DeckShortcut,
  DeckShortcutList
};
//# sourceMappingURL=deck-shortcut.js.map
