// ════════════════════════════════════════════════════════════════
// <deck-code lang="js|ts|html|css|json" hero? nested? step-groups?>
//   const x = 1;
// </deck-code>
//
// hero   · centers vertically as the focal block of a slide
// nested · no shadow / lighter border (when nested inside a card)
// lang   · drives the highlighter:
//          · js / ts / json (default) · keyword + string + number
//          · html / xml / svg          · tag + attribute + string
//          · css / scss / less         · property + value + comment
// ════════════════════════════════════════════════════════════════

import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

export type DeckCodeLang = 'js' | 'ts' | 'json' | 'html' | 'xml' | 'svg' | 'css' | 'scss' | 'less';

function highlight(src: string, lang: string): string {
  // Escape HTML first so we can spit <span>s safely
  let s = src.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  // Non-numeric placeholder ids (so the \d+ pass cannot collide with them)
  const placeholders: string[] = [];
  const stash = (cls: string, text: string): string => {
    const id = 'P' + placeholders.length + 'E';
    placeholders.push('<span class="' + cls + '">' + text + '</span>');
    return id;
  };

  const isHtml = lang === 'html' || lang === 'xml' || lang === 'svg';
  const isCss = lang === 'css' || lang === 'scss' || lang === 'less';

  if (isHtml) {
    // 1 · HTML comments  <!-- ... -->
    s = s.replace(/(&lt;!--[\s\S]*?--&gt;)/g, (m: string) => stash('cmt', m));
    // 2 · Doctype
    s = s.replace(/(&lt;!doctype[^&]*&gt;)/gi, (m: string) => stash('cmt', m));
    // 3 · Strings inside attributes (both ' and ")
    s = s.replace(/("[^"]*"|'[^']*')/g, (m: string) => stash('str', m));
    // 4 · Tag names · word right after &lt; or &lt;/
    s = s.replace(
      /(&lt;\/?)([a-zA-Z][a-zA-Z0-9:-]*)/g,
      (_: string, lt: string, tag: string) => lt + stash('kw', tag),
    );
    // 5 · Attribute names · token right before =
    s = s.replace(/\b([a-zA-Z][a-zA-Z0-9-]*)(?==)/g, (m: string) => stash('prop', m));
  } else if (isCss) {
    s = s.replace(/(\/\*[\s\S]*?\*\/)/g, (m: string) => stash('cmt', m));
    s = s.replace(/("[^"]*"|'[^']*')/g, (m: string) => stash('str', m));
    s = s.replace(/([a-zA-Z-]+)(?=\s*:)/g, (m: string) => stash('prop', m));
    s = s.replace(/(#[0-9a-fA-F]{3,8})\b/g, (m: string) => stash('num', m));
    s = s.replace(
      /\b(\d+(?:\.\d+)?)(px|rem|em|%|vh|vw|vmin|vmax|s|ms|deg)?/g,
      (_: string, n: string, u: string | undefined) => stash('num', n + (u ?? '')),
    );
  } else {
    // js / ts / json (default)
    s = s.replace(/(\/\/[^\n]*)/g, (m: string) => stash('cmt', m));
    s = s.replace(/(['"`])((?:\\.|(?!\1)[^\\])*)\1/g, (m: string) => stash('str', m));
    s = s.replace(
      /\b(const|let|var|function|return|if|else|for|while|class|extends|new|export|import|from|as|await|async|of|in|typeof|instanceof|true|false|null|undefined)\b/g,
      (m: string) => stash('kw', m),
    );
    s = s.replace(/\b(\d+(?:\.\d+)?)\b/g, (m: string) => stash('num', m));
  }

  // Restore placeholders
  s = s.replace(/P(\d+)E/g, (_: string, i: string) => placeholders[+i] ?? '');
  return s;
}

@customElement('deck-code')
export class DeckCode extends LitElement {
  /* Customization tokens:
       --deck-code-bg / -border / -text
       --deck-code-radius / -padding-y / -padding-x
       --deck-code-syntax-{kw,str,num,cmt,ty,prop,fn}
     All default to the theme's --code-* tokens. */
  static override styles = css`
    :host {
      display: block;
      background: var(--deck-code-bg, var(--rik-code__bg));
      border: 1px solid var(--deck-code-border, var(--rik-code__border));
      border-radius: var(--deck-code-radius, var(--rik-radius-md));
      padding: var(--deck-code-padding-y, var(--rik-space-3)) var(--deck-code-padding-x, var(--rik-space-4));
      font-family: var(--rik-font-mono);
      font-size: var(--rik-font-size-mono);
      line-height: 1.7;
      color: var(--deck-code-text, var(--rik-code__text));
      box-shadow: var(--rik-elevation-2);
      overflow: auto;
      white-space: pre;
    }
    :host([hero]) {
      display: flex;
      align-items: safe center;
      padding: var(--deck-code-padding-y, var(--rik-space-4)) var(--deck-code-padding-x, var(--rik-space-5));
    }
    :host([nested]) {
      box-shadow: none;
      border-radius: var(--rik-radius-sm);
      padding: var(--deck-code-padding-y, var(--rik-space-2)) var(--deck-code-padding-x, var(--rik-space-3));
    }
    pre { margin: 0; font: inherit; color: inherit; }
    code { display: block; width: 100%; font: inherit; color: inherit; }
    .line { transition: opacity 0.25s ease; display: block; }
    .line.dim { opacity: 0.25; }
    .line.lit { opacity: 1; }
    .kw   { color: var(--deck-code-syntax-kw,   var(--rik-code__syntax-keyword)); }
    .fn   { color: var(--deck-code-syntax-fn,   var(--rik-code__syntax-function)); }
    .str  { color: var(--deck-code-syntax-str,  var(--rik-code__syntax-string)); }
    .num  { color: var(--deck-code-syntax-num,  var(--rik-code__syntax-number)); }
    .cmt  { color: var(--deck-code-syntax-cmt,  var(--rik-code__syntax-comment)); font-style: italic; }
    .ty   { color: var(--deck-code-syntax-ty,   var(--rik-code__syntax-type)); }
    .prop { color: var(--deck-code-syntax-prop, var(--rik-code__syntax-property)); }
  `;

  @property({ type: String }) override lang: string = '';
  @property({ type: Boolean, reflect: true }) hero = false;
  @property({ type: Boolean, reflect: true }) nested = false;
  @property({ type: String, attribute: 'step-groups' }) stepGroups?: string;
  @state() private _html = '';
  private _groups: number[][] | null = null;

  override connectedCallback() {
    super.connectedCallback();
    this._highlight();
    try {
      this._groups = JSON.parse(this.getAttribute('step-groups') ?? 'null') as number[][] | null;
    } catch {
      this._groups = null;
    }
  }

  private _highlight(): void {
    const raw = this.textContent ?? '';
    const lines = raw.split('\n');
    while (lines.length && !lines[0]!.trim()) lines.shift();
    while (lines.length && !lines[lines.length - 1]!.trim()) lines.pop();
    const indent = lines
      .filter((l: string) => l.trim().length > 0)
      .reduce((min: number, l: string) => Math.min(min, l.match(/^ */)?.[0].length ?? 0), Infinity);
    const cleaned = indent === Infinity ? lines : lines.map((l: string) => l.slice(indent));
    // Wrap each line in a .line span (display:block) without a \n between · otherwise we double-newline
    this._html = cleaned
      .map(
        (line: string, i: number) =>
          '<span class="line" data-line="' +
          (i + 1) +
          '">' +
          highlight(line || ' ', this.lang) +
          '</span>',
      )
      .join('');
    // Keep light-DOM textContent intact so cloneNode(true) preserves the source
    // for overview thumbnails (the shadow template has no <slot>, so light DOM
    // children remain invisible).
  }

  /** Public API · called by deck-root when stepping through code groups. */
  applyStep(n: number): void {
    if (!this._groups) return;
    const lines = this.shadowRoot?.querySelectorAll<HTMLElement>('.line');
    if (!lines) return;
    if (n === 0) {
      lines.forEach((l) => {
        l.classList.remove('dim', 'lit');
      });
    } else {
      const active = this._groups[Math.min(n - 1, this._groups.length - 1)] ?? [];
      lines.forEach((l) => {
        const num = parseInt(l.dataset['line'] ?? '0', 10);
        l.classList.toggle('lit', active.includes(num));
        l.classList.toggle('dim', !active.includes(num));
      });
    }
  }

  override render() {
    return html`<pre><code .innerHTML="${this._html}"></code></pre>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'deck-code': DeckCode;
  }
}
