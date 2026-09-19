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
import { expandCards } from './cards-syntax.js';

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
    img { max-width: 100%; height: auto; display: block; border-radius: var(--rik-radius-md); margin: 0 0 var(--rik-space-3); }
    table { width: 100%; border-collapse: collapse; font-size: var(--rik-font-size-body); margin: 0 0 var(--rik-space-3); }
    th, td { border: 1px solid var(--rik-border-default); padding: var(--rik-space-1) var(--rik-space-2); text-align: left; vertical-align: top; }
    th { background: var(--rik-surface-tint); color: var(--rik-text-default); font-weight: 700; }
    /* ::: cards grid · authored as compact markdown, rendered as tinted cards. */
    .md-cards {
      display: grid;
      grid-template-columns: repeat(var(--cards-cols, 2), minmax(0, 1fr));
      gap: var(--cards-gap, var(--rik-space-3));
      margin: 0 0 var(--rik-space-3);
    }
    .md-card {
      background: var(--rik-surface-raised--strong);
      border: 1px solid var(--rik-border-default);
      border-radius: var(--rik-radius-lg);
      padding: var(--rik-space-3) var(--rik-space-4);
      container-type: inline-size;
      min-width: 0;
    }
    .md-card[data-tone="info"]   { background: var(--rik-status-info__bg);    border-color: var(--rik-status-info__border); }
    .md-card[data-tone="warn"]   { background: var(--rik-status-warn__bg);    border-color: var(--rik-status-warn__border); }
    .md-card[data-tone="ok"]     { background: var(--rik-status-success__bg); border-color: var(--rik-status-success__border); }
    .md-card[data-tone="danger"] { background: var(--rik-status-danger__bg);  border-color: var(--rik-status-danger__border); }
    .md-card h3 { margin: 0 0 var(--rik-space-2); }
    .md-card > :last-child { margin-bottom: 0; }
    .content { display: contents; }
  `;

  @state() private _html = '';

  override connectedCallback() {
    super.connectedCallback();
    this._parse();
  }

  /** Re-read the light-DOM source and re-render · used by the live editor when
   *  the markdown is edited in place. */
  reparse(): void {
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
    // Expand `::: cards` blocks first · they pre-render to HTML behind comment
    // placeholders that marked passes through, then get swapped back in.
    const { text, blocks } = expandCards(cleaned.trim(), {
      inline: (s) => marked.parseInline(s) as string,
      block: (s) => marked.parse(s) as string,
    });
    let out = marked.parse(text) as string;
    blocks.forEach((b, i) => {
      // Function replacer · a string replacement would interpret `$&`, `$1`…
      // inside the card HTML (a body with a "$5" price could be mangled).
      out = out.replace(`<!--cards:${i}-->`, () => b);
    });
    this._html = out;
    // Keep the raw source in light DOM · the template has no <slot>, so it stays
    // invisible, but the overview clones the light DOM to build thumbnails · a
    // cleared source would re-render blank there (and drops out of search).
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
