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

// src/deck-code.ts
import { LitElement, html, css } from "https://cdn.jsdelivr.net/npm/lit@3/+esm";
import { customElement, property, state } from "https://cdn.jsdelivr.net/npm/lit@3/decorators.js/+esm";
function highlight(src, lang) {
  let s = src.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const placeholders = [];
  const stash = (cls, text) => {
    const id = "P" + placeholders.length + "E";
    placeholders.push('<span class="' + cls + '">' + text + "</span>");
    return id;
  };
  const isHtml = lang === "html" || lang === "xml" || lang === "svg";
  const isCss = lang === "css" || lang === "scss" || lang === "less";
  if (isHtml) {
    s = s.replace(/(&lt;!--[\s\S]*?--&gt;)/g, (m) => stash("cmt", m));
    s = s.replace(/(&lt;!doctype[^&]*&gt;)/gi, (m) => stash("cmt", m));
    s = s.replace(/("[^"]*"|'[^']*')/g, (m) => stash("str", m));
    s = s.replace(
      /(&lt;\/?)([a-zA-Z][a-zA-Z0-9:-]*)/g,
      (_, lt, tag) => lt + stash("kw", tag)
    );
    s = s.replace(/\b([a-zA-Z][a-zA-Z0-9-]*)(?==)/g, (m) => stash("prop", m));
  } else if (isCss) {
    s = s.replace(/(\/\*[\s\S]*?\*\/)/g, (m) => stash("cmt", m));
    s = s.replace(/("[^"]*"|'[^']*')/g, (m) => stash("str", m));
    s = s.replace(/([a-zA-Z-]+)(?=\s*:)/g, (m) => stash("prop", m));
    s = s.replace(/(#[0-9a-fA-F]{3,8})\b/g, (m) => stash("num", m));
    s = s.replace(
      /\b(\d+(?:\.\d+)?)(px|rem|em|%|vh|vw|vmin|vmax|s|ms|deg)?/g,
      (_, n, u) => stash("num", n + (u ?? ""))
    );
  } else {
    s = s.replace(/(\/\/[^\n]*)/g, (m) => stash("cmt", m));
    s = s.replace(/(['"`])((?:\\.|(?!\1)[^\\])*)\1/g, (m) => stash("str", m));
    s = s.replace(
      /\b(const|let|var|function|return|if|else|for|while|class|extends|new|export|import|from|as|await|async|of|in|typeof|instanceof|true|false|null|undefined)\b/g,
      (m) => stash("kw", m)
    );
    s = s.replace(/\b(\d+(?:\.\d+)?)\b/g, (m) => stash("num", m));
  }
  s = s.replace(/P(\d+)E/g, (_, i) => placeholders[+i] ?? "");
  return s;
}
var DeckCode = class extends LitElement {
  constructor() {
    super(...arguments);
    this.lang = "";
    this.hero = false;
    this.nested = false;
    this._html = "";
    this._groups = null;
  }
  connectedCallback() {
    super.connectedCallback();
    this._highlight();
    try {
      this._groups = JSON.parse(this.getAttribute("step-groups") ?? "null");
    } catch {
      this._groups = null;
    }
  }
  _highlight() {
    const raw = this.textContent ?? "";
    const lines = raw.split("\n");
    while (lines.length && !lines[0].trim()) lines.shift();
    while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
    const indent = lines.filter((l) => l.trim().length > 0).reduce((min, l) => Math.min(min, l.match(/^ */)?.[0].length ?? 0), Infinity);
    const cleaned = indent === Infinity ? lines : lines.map((l) => l.slice(indent));
    this._html = cleaned.map(
      (line, i) => '<span class="line" data-line="' + (i + 1) + '">' + highlight(line || " ", this.lang) + "</span>"
    ).join("");
  }
  /** Public API · called by deck-root when stepping through code groups. */
  applyStep(n) {
    if (!this._groups) return;
    const lines = this.shadowRoot?.querySelectorAll(".line");
    if (!lines) return;
    if (n === 0) {
      lines.forEach((l) => l.classList.remove("dim", "lit"));
    } else {
      const active = this._groups[Math.min(n - 1, this._groups.length - 1)] ?? [];
      lines.forEach((l) => {
        const num = parseInt(l.dataset["line"] ?? "0", 10);
        l.classList.toggle("lit", active.includes(num));
        l.classList.toggle("dim", !active.includes(num));
      });
    }
  }
  render() {
    return html`<pre><code .innerHTML="${this._html}"></code></pre>`;
  }
};
/* Customization tokens:
     --deck-code-bg / -border / -text
     --deck-code-radius / -padding-y / -padding-x
     --deck-code-syntax-{kw,str,num,cmt,ty,prop,fn}
   All default to the theme's --code-* tokens. */
DeckCode.styles = css`
    :host {
      display: block;
      background: var(--deck-code-bg, var(--code-bg));
      border: 1px solid var(--deck-code-border, var(--code-border));
      border-radius: var(--deck-code-radius, var(--r-md));
      padding: var(--deck-code-padding-y, var(--sp-3)) var(--deck-code-padding-x, var(--sp-4));
      font-family: var(--mono);
      font-size: var(--fs-mono);
      line-height: 1.7;
      color: var(--deck-code-text, var(--code-text));
      box-shadow: var(--shadow-card);
      overflow: auto;
      white-space: pre;
    }
    :host([hero]) { display: flex; align-items: safe center; padding: var(--sp-4) var(--sp-5); }
    :host([nested]) {
      box-shadow: none;
      border-radius: var(--r-sm);
      padding: var(--sp-2) var(--sp-3);
    }
    pre { margin: 0; font: inherit; color: inherit; }
    code { display: block; width: 100%; font: inherit; color: inherit; }
    .line { transition: opacity 0.25s ease; display: block; }
    .line.dim { opacity: 0.25; }
    .line.lit { opacity: 1; }
    .kw   { color: var(--deck-code-syntax-kw,   var(--code-kw)); }
    .fn   { color: var(--deck-code-syntax-fn,   var(--code-fn)); }
    .str  { color: var(--deck-code-syntax-str,  var(--code-str)); }
    .num  { color: var(--deck-code-syntax-num,  var(--code-num)); }
    .cmt  { color: var(--deck-code-syntax-cmt,  var(--code-cmt)); font-style: italic; }
    .ty   { color: var(--deck-code-syntax-ty,   var(--code-ty)); }
    .prop { color: var(--deck-code-syntax-prop, var(--code-prop)); }
  `;
__decorateClass([
  property({ type: String })
], DeckCode.prototype, "lang", 2);
__decorateClass([
  property({ type: Boolean, reflect: true })
], DeckCode.prototype, "hero", 2);
__decorateClass([
  property({ type: Boolean, reflect: true })
], DeckCode.prototype, "nested", 2);
__decorateClass([
  property({ type: String, attribute: "step-groups" })
], DeckCode.prototype, "stepGroups", 2);
__decorateClass([
  state()
], DeckCode.prototype, "_html", 2);
DeckCode = __decorateClass([
  customElement("deck-code")
], DeckCode);
export {
  DeckCode
};
//# sourceMappingURL=deck-code.js.map
