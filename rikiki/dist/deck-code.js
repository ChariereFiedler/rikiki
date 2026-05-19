// src/deck-code.ts
import { LitElement, html, css } from "https://cdn.jsdelivr.net/npm/lit@3/+esm";
function highlight(src) {
  let s = src.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const placeholders = [];
  const stash = (cls, text) => {
    const id = `\uE000P${placeholders.length}E\uE001`;
    placeholders.push(`<span class="${cls}">${text}</span>`);
    return id;
  };
  s = s.replace(/(\/\/[^\n]*)/g, (m) => stash("cmt", m));
  s = s.replace(/(['"`])((?:\\.|(?!\1)[^\\])*)\1/g, (m) => stash("str", m));
  s = s.replace(
    /\b(const|let|var|function|return|if|else|for|while|class|extends|new|export|import|from|as|await|async|of|in|typeof|instanceof|true|false|null|undefined)\b/g,
    (m) => stash("kw", m)
  );
  s = s.replace(/\b(\d+(?:\.\d+)?)\b/g, (m) => stash("num", m));
  s = s.replace(/P(\d+)E/g, (_, i) => placeholders[+i]);
  return s;
}
var DeckCode = class extends LitElement {
  static {
    this.styles = css`
    :host {
      display: block;
      background: #0f0f10; border: 1px solid #232325;
      border-radius: var(--r-md);
      padding: var(--sp-3) var(--sp-4);
      font-family: var(--mono);
      font-size: var(--fs-mono);
      line-height: 1.7;
      color: #f4f4f5;
      box-shadow: var(--shadow-card);
      overflow: auto;
      white-space: pre;
    }
    :host([hero]) { display: flex; align-items: safe center; padding: var(--sp-4) var(--sp-5); }
    :host([nested]) {
      box-shadow: none;
      border: 1px solid #1f1f21;
      border-radius: var(--r-sm);
      padding: var(--sp-2) var(--sp-3);
    }
    pre { margin: 0; font: inherit; color: inherit; }
    code { display: block; width: 100%; font: inherit; color: inherit; }
    .line { transition: opacity 0.25s ease; display: block; }
    .line.dim { opacity: 0.25; }
    .line.lit { opacity: 1; }
    .kw   { color: #c792ea; }
    .fn   { color: #82aaff; }
    .str  { color: #c3e88d; }
    .num  { color: #f78c6c; }
    .cmt  { color: #546e7a; font-style: italic; }
    .ty   { color: #ffcb6b; }
    .prop { color: #80cbc4; }
  `;
  }
  static {
    this.properties = {
      lang: { type: String },
      hero: { type: Boolean, reflect: true },
      nested: { type: Boolean, reflect: true },
      "step-groups": { attribute: "step-groups", type: String },
      _html: { state: true }
    };
  }
  connectedCallback() {
    super.connectedCallback();
    this._highlight();
    try {
      this._groups = JSON.parse(this.getAttribute("step-groups") || "null");
    } catch {
      this._groups = null;
    }
  }
  _highlight() {
    const raw = this.textContent || "";
    const lines = raw.split("\n");
    while (lines.length && !lines[0].trim()) lines.shift();
    while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
    const indent = lines.filter((l) => l.trim().length > 0).reduce((min, l) => Math.min(min, l.match(/^ */)[0].length), Infinity);
    const cleaned = indent === Infinity ? lines : lines.map((l) => l.slice(indent));
    this._html = cleaned.map(
      (line, i) => `<span class="line" data-line="${i + 1}">${highlight(line || " ")}</span>`
    ).join("");
  }
  applyStep(n) {
    if (!this._groups) return;
    const lines = this.shadowRoot?.querySelectorAll(".line");
    if (!lines) return;
    if (n === 0) {
      lines.forEach((l) => l.classList.remove("dim", "lit"));
    } else {
      const active = this._groups[Math.min(n - 1, this._groups.length - 1)];
      lines.forEach((l) => {
        const num = parseInt(l.dataset.line, 10);
        l.classList.toggle("lit", active.includes(num));
        l.classList.toggle("dim", !active.includes(num));
      });
    }
  }
  render() {
    return html`<pre><code .innerHTML="${this._html || ""}"></code></pre>`;
  }
};
customElements.define("deck-code", DeckCode);
export {
  DeckCode
};
//# sourceMappingURL=deck-code.js.map
