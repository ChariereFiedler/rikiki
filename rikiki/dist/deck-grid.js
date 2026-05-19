// src/deck-grid.ts
import { LitElement, html, css } from "https://cdn.jsdelivr.net/npm/lit@3/+esm";
var MAP = {
  start: "start",
  center: "center",
  end: "end",
  stretch: "stretch"
};
function expandTracks(value) {
  if (!value) return null;
  const n = parseInt(value, 10);
  if (!Number.isNaN(n) && String(n) === value.trim() && n >= 1 && n <= 12) {
    return `repeat(${n}, minmax(0, 1fr))`;
  }
  return value;
}
function expandGap(value) {
  if (!value) return null;
  const n = parseInt(value, 10);
  if (!Number.isNaN(n) && n >= 1 && n <= 6) return `var(--sp-${n})`;
  return value;
}
var DeckGrid = class extends LitElement {
  static {
    this.styles = css`
    :host {
      display: grid;
      grid-template-columns: var(--_cols, 1fr);
      grid-template-rows:    var(--_rows, auto);
      gap:           var(--_gap, var(--sp-3));
      align-items:   var(--_align, stretch);
      justify-items: var(--_justify, stretch);
      min-width: 0;
      min-height: 0;
    }
    :host([fill]) { flex: 1 1 auto; height: 100%; }
  `;
  }
  static {
    this.properties = {
      cols: { type: String },
      rows: { type: String },
      gap: { type: String },
      align: { type: String },
      justify: { type: String }
    };
  }
  updated() {
    const cols = expandTracks(this.cols);
    const rows = expandTracks(this.rows);
    const gap = expandGap(this.gap);
    if (cols) this.style.setProperty("--_cols", cols);
    if (rows) this.style.setProperty("--_rows", rows);
    if (gap) this.style.setProperty("--_gap", gap);
    if (this.align) this.style.setProperty("--_align", MAP[this.align] || this.align);
    if (this.justify) this.style.setProperty("--_justify", MAP[this.justify] || this.justify);
  }
  render() {
    return html`<slot></slot>`;
  }
};
customElements.define("deck-grid", DeckGrid);
export {
  DeckGrid
};
//# sourceMappingURL=deck-grid.js.map
