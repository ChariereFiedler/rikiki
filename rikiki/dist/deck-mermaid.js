// src/deck-mermaid.ts
import { LitElement, html, css } from "https://cdn.jsdelivr.net/npm/lit@3/+esm";
var mermaidReady = false;
async function ensureMermaid() {
  if (mermaidReady) return;
  if (!window.mermaid) {
    await new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js";
      s.onload = res;
      s.onerror = rej;
      document.head.appendChild(s);
    });
  }
  window.mermaid.initialize({
    startOnLoad: false,
    theme: "dark",
    themeVariables: {
      background: "#0f0f10",
      mainBkg: "#2a2a2a",
      nodeBorder: "#555",
      lineColor: "#777",
      textColor: "#e5e5e5",
      fontSize: "13px",
      edgeLabelBackground: "#111"
    },
    flowchart: { curve: "basis", htmlLabels: true, padding: 12 },
    securityLevel: "loose"
  });
  mermaidReady = true;
}
var mermaidId = 0;
var DeckMermaid = class extends LitElement {
  static {
    /* Tokens:
         --deck-mermaid-bg / -border / -radius / -padding
       Defaults to the --code-* theme tokens · diagrams sit on the same
       dark surface as code blocks for visual consistency. */
    this.styles = css`
    :host {
      display: flex; align-items: center; justify-content: center;
      background: var(--deck-mermaid-bg, var(--code-bg));
      border: 1px solid var(--deck-mermaid-border, var(--code-border));
      border-radius: var(--deck-mermaid-radius, var(--r-md));
      padding: var(--deck-mermaid-padding, var(--sp-4));
      box-shadow: var(--shadow-card);
      overflow: hidden;
      min-width: 0;
    }
    :host([compact]) { padding: var(--sp-2); }
    .canvas { width: 100%; max-width: 100%; text-align: center; overflow: hidden; }
    .canvas svg { width: 100% !important; height: auto !important; max-width: 100% !important; max-height: 60vh; }
    :host([compact]) .canvas { max-width: 60%; }
    :host([compact]) .canvas svg { max-height: 22vh; }
  `;
  }
  static {
    this.properties = {
      _svg: { state: true },
      rendered: { type: Boolean, reflect: true }
    };
  }
  connectedCallback() {
    super.connectedCallback();
    this._source = (this.textContent || "").trim();
    const lines = this._source.split("\n");
    const indent = lines.filter((l) => l.trim()).reduce((m, l) => Math.min(m, l.match(/^ */)[0].length), Infinity);
    if (indent < Infinity) this._source = lines.map((l) => l.slice(indent)).join("\n");
    this.render = this.render.bind(this);
    this._render();
  }
  async _render() {
    if (!this._source) return;
    await ensureMermaid();
    const id = `mmd-${++mermaidId}`;
    try {
      const { svg } = await window.mermaid.render(id, this._source);
      this._svg = svg;
      this.rendered = true;
    } catch (e) {
      console.error("Mermaid render error", e);
      this._svg = `<pre style="color:#f87171">${e.message}</pre>`;
    }
  }
  render() {
    return html`<div class="canvas" .innerHTML="${this._svg || ""}"></div>`;
  }
};
customElements.define("deck-mermaid", DeckMermaid);
export {
  DeckMermaid
};
//# sourceMappingURL=deck-mermaid.js.map
