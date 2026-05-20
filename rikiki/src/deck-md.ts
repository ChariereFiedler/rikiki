// ════════════════════════════════════════════════════════════════
// <deck-md>
//   ## Sous-titre
//   Texte **avec markdown** et `inline code`.
//   - item
//   - item
// </deck-md>
// ════════════════════════════════════════════════════════════════

import { LitElement, html, css } from 'lit';
import { marked } from 'https://cdn.jsdelivr.net/npm/marked@12/+esm';

marked.setOptions({ gfm: true, breaks: false });

export class DeckMd extends LitElement {
  static override styles = css`
    :host { display: block; color: var(--soft); font-family: var(--sans); }
    h1, h2, h3, h4 { color: var(--text); font-weight: 700; letter-spacing: -0.01em; }
    h2 { font-size: var(--fs-h2); margin-bottom: var(--sp-2); }
    h3 { font-size: var(--fs-lead); margin-bottom: var(--sp-2); margin-top: var(--sp-3); }
    h4 { font-size: var(--fs-body); margin-bottom: var(--sp-1); margin-top: var(--sp-3); }
    p { font-size: var(--fs-body); line-height: 1.65; margin: 0 0 var(--sp-3); }
    p:last-child { margin-bottom: 0; }
    strong { color: var(--text); font-weight: 700; }
    em { font-style: italic; }
    code {
      font-family: var(--mono); font-size: var(--fs-mono-sm);
      background: var(--surface-tint); padding: 2px 6px;
      border-radius: var(--r-sm); color: var(--text);
    }
    pre {
      background: var(--deck-md-pre-bg, var(--code-bg));
      border: 1px solid var(--deck-md-pre-border, var(--code-border));
      border-radius: var(--r-md);
      padding: var(--sp-3) var(--sp-4);
      overflow: auto;
      font-family: var(--mono); font-size: var(--fs-mono);
      line-height: 1.75; color: var(--deck-md-pre-text, var(--code-text));
      margin: 0 0 var(--sp-3);
      box-shadow: var(--shadow-card);
    }
    pre code { background: none; padding: 0; color: inherit; border-radius: 0; }
    ul, ol { padding-left: 1.4rem; margin: 0 0 var(--sp-3); }
    li { margin-bottom: var(--sp-1); font-size: var(--fs-body); line-height: 1.55; }
    li::marker { color: var(--yellow); }
    a { color: var(--yellow); text-decoration: underline; text-decoration-thickness: 1px; }
    blockquote {
      border-left: 3px solid var(--yellow);
      padding: var(--sp-1) var(--sp-3);
      color: var(--muted); font-style: italic;
      margin: 0 0 var(--sp-3);
    }
    hr { border: none; border-top: 1px solid var(--border); margin: var(--sp-4) 0; }
    .content { display: contents; }
  `;

  static override properties = { _html: { state: true } };

  override connectedCallback() {
    super.connectedCallback();
    this._parse();
  }

  _parse() {
    // Récupère le texte brut, dédente, parse markdown
    const raw = this.textContent || '';
    const lines = raw.split('\n');
    // Enlève les indentations communes (utile quand le markdown est imbriqué dans du HTML indenté)
    const indent = lines
      .filter(l => l.trim().length > 0)
      .reduce((min, l) => Math.min(min, l.match(/^ */)[0].length), Infinity);
    const cleaned = indent === Infinity ? raw : lines.map(l => l.slice(indent)).join('\n');
    this._html = marked.parse(cleaned.trim());
    // Vide le slot original puisqu'on rend via shadow
    this.textContent = '';
  }

  override render() {
    return html`<div class="content" .innerHTML="${this._html || ''}"></div>`;
  }
}

customElements.define('deck-md', DeckMd);
