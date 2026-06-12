// ════════════════════════════════════════════════════════════════
// <deck-md>
//   ## Subtitle
//   Text **with markdown** and `inline code`.
//   - item
//   - item
// </deck-md>
// ════════════════════════════════════════════════════════════════

import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
// Bare specifier · build.mjs rewrites it to ./vendor/marked.js (offline);
// the standalone build inlines it. marked ships its own types.
import { marked } from 'marked';

marked.setOptions({ gfm: true, breaks: false });

@customElement('deck-md')
export class DeckMd extends LitElement {
  static override styles = css`
    :host { display: block; color: var(--rik-text-default--muted); font-family: var(--rik-font-sans); }
    h1, h2, h3, h4 { color: var(--rik-text-default); font-weight: 700; letter-spacing: -0.01em; }
    h2 { font-size: var(--rik-font-size-h2); margin-bottom: var(--rik-space-2); }
    h3 { font-size: var(--rik-font-size-lead); margin-bottom: var(--rik-space-2); margin-top: var(--rik-space-3); }
    h4 { font-size: var(--rik-font-size-body); margin-bottom: var(--rik-space-1); margin-top: var(--rik-space-3); }
    p { font-size: var(--rik-font-size-body); line-height: 1.65; margin: 0 0 var(--rik-space-3); }
    p:last-child { margin-bottom: 0; }
    strong { color: var(--rik-text-default); font-weight: 700; }
    em { font-style: italic; }
    code {
      font-family: var(--rik-font-mono); font-size: var(--rik-font-size-mono-sm);
      background: var(--rik-surface-tint); padding: 2px 6px;
      border-radius: var(--rik-radius-sm); color: var(--rik-text-default);
    }
    pre {
      background: var(--deck-md-pre-bg, var(--rik-code__bg));
      border: 1px solid var(--deck-md-pre-border, var(--rik-code__border));
      border-radius: var(--rik-radius-md);
      padding: var(--rik-space-3) var(--rik-space-4);
      overflow: auto;
      font-family: var(--rik-font-mono); font-size: var(--rik-font-size-mono);
      line-height: 1.75; color: var(--deck-md-pre-text, var(--rik-code__text));
      margin: 0 0 var(--rik-space-3);
      box-shadow: var(--rik-elevation-2);
    }
    pre code { background: none; padding: 0; color: inherit; border-radius: 0; }
    ul, ol { padding-left: 1.4rem; margin: 0 0 var(--rik-space-3); }
    li { margin-bottom: var(--rik-space-1); font-size: var(--rik-font-size-body); line-height: 1.55; }
    li::marker { color: var(--rik-accent); }
    a { color: var(--rik-accent); text-decoration: underline; text-decoration-thickness: 1px; }
    blockquote {
      border-left: 3px solid var(--rik-accent);
      padding: var(--rik-space-1) var(--rik-space-3);
      color: var(--rik-text-default--faint); font-style: italic;
      margin: 0 0 var(--rik-space-3);
    }
    hr { border: none; border-top: 1px solid var(--rik-border-default); margin: var(--rik-space-4) 0; }
    .content { display: contents; }
  `;

  @state() private _html = '';

  override connectedCallback() {
    super.connectedCallback();
    this._parse();
  }

  private _parse(): void {
    // Grab raw text, deindent, parse markdown.
    const raw = this.textContent ?? '';
    const lines = raw.split('\n');
    // Strip the common indent · so markdown nested inside indented HTML still parses.
    const indent = lines
      .filter((l: string) => l.trim().length > 0)
      .reduce((min: number, l: string) => Math.min(min, l.match(/^ */)?.[0].length ?? 0), Infinity);
    const cleaned =
      indent === Infinity ? raw : lines.map((l: string) => l.slice(indent)).join('\n');
    this._html = marked.parse(cleaned.trim()) as string;
    // Clear the original slot · we render via shadow DOM.
    this.textContent = '';
  }

  override render() {
    return html`<div class="content" .innerHTML="${this._html}"></div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'deck-md': DeckMd;
  }
}
