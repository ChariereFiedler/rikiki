// src/deck-shortcut.ts
import { LitElement, html, css } from "https://cdn.jsdelivr.net/npm/lit@3/+esm";
var DeckKbd = class extends LitElement {
  static {
    this.styles = css`
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
  }
  render() {
    return html`<slot></slot>`;
  }
};
customElements.define("deck-kbd", DeckKbd);
var DeckShortcut = class extends LitElement {
  static {
    this.styles = css`
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
  }
  static {
    this.properties = {
      keys: { type: String },
      label: { type: String },
      note: { type: String },
      tone: { type: String }
    };
  }
  render() {
    const keyTokens = (this.keys || "").trim().split(/\s+/).filter(Boolean);
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
customElements.define("deck-shortcut", DeckShortcut);
var DeckShortcutList = class extends LitElement {
  static {
    this.styles = css`
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
  }
  static {
    this.properties = {
      cols: { type: String },
      colGap: { type: String, attribute: "col-gap" }
    };
  }
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
customElements.define("deck-shortcut-list", DeckShortcutList);
export {
  DeckKbd,
  DeckShortcut,
  DeckShortcutList
};
//# sourceMappingURL=deck-shortcut.js.map
