// ════════════════════════════════════════════════════════════════
// <deck-mermaid compact?>
//   graph LR
//   a --> b
// </deck-mermaid>
// ════════════════════════════════════════════════════════════════

import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

interface MermaidLib {
  initialize(opts: Record<string, unknown>): void;
  render(id: string, source: string): Promise<{ svg: string }>;
}
declare global {
  interface Window { mermaid?: MermaidLib; }
}

let mermaidReady = false;
async function ensureMermaid(): Promise<void> {
  if (mermaidReady) return;
  if (!window.mermaid) {
    await new Promise<void>((res, rej) => {
      const s = document.createElement('script');
      // Vendored UMD bundle · resolved next to this module's dist/ location so
      // the deck stays offline. import.meta.url → dist/deck-mermaid.js.
      s.src = new URL('./vendor/mermaid.min.js', import.meta.url).href;
      s.onload = () => res();
      s.onerror = () => rej(new Error('mermaid failed to load'));
      document.head.appendChild(s);
    });
  }
  window.mermaid!.initialize({
    startOnLoad: false,
    theme: 'dark',
    themeVariables: {
      background:  '#0f0f10',
      mainBkg:     '#2a2a2a',
      nodeBorder:  '#555',
      lineColor:   '#777',
      textColor:   '#e5e5e5',
      fontSize:    '13px',
      edgeLabelBackground: '#111',
    },
    flowchart: { curve: 'basis', htmlLabels: true, padding: 12 },
    securityLevel: 'loose',
  });
  mermaidReady = true;
}

let mermaidId = 0;

@customElement('deck-mermaid')
export class DeckMermaid extends LitElement {
  /* Tokens:
       --deck-mermaid-bg / -border / -radius / -padding
     Defaults to the --code-* theme tokens · diagrams sit on the same
     dark surface as code blocks for visual consistency. */
  static override styles = css`
    :host {
      display: flex; align-items: center; justify-content: center;
      background: var(--deck-mermaid-bg, var(--rik-code__bg));
      border: 1px solid var(--deck-mermaid-border, var(--rik-code__border));
      border-radius: var(--deck-mermaid-radius, var(--rik-radius-md));
      padding: var(--deck-mermaid-padding, var(--rik-space-4));
      box-shadow: var(--rik-elevation-2);
      overflow: hidden;
      min-width: 0;
    }
    :host([compact]) { padding: var(--rik-space-2); }
    .canvas { width: 100%; max-width: 100%; text-align: center; overflow: hidden; }
    .canvas svg { width: 100% !important; height: auto !important; max-width: 100% !important; max-height: 60cqh; }
    :host([compact]) .canvas { max-width: 60%; }
    :host([compact]) .canvas svg { max-height: 22cqh; }
  `;

  @property({ type: Boolean, reflect: true }) rendered = false;
  @state() private _svg = '';
  private _source = '';
  private _renderPromise: Promise<void> | null = null;

  /** Rendered SVG markup · '' until the async render completes. Lets the
   *  overview build static thumbnails without reaching into this shadow root. */
  get renderedSvg(): string { return this._svg; }

  /** Resolves when the current render attempt settles (success or error). */
  get whenRendered(): Promise<void> { return this._renderPromise ?? Promise.resolve(); }

  override connectedCallback() {
    super.connectedCallback();
    this._source = (this.textContent ?? '').trim();
    // Deindent · the common leading-spaces stripped.
    const lines = this._source.split('\n');
    const indent = lines
      .filter((l: string) => l.trim())
      .reduce((m: number, l: string) => Math.min(m, l.match(/^ */)?.[0].length ?? 0), Infinity);
    if (indent < Infinity) this._source = lines.map((l: string) => l.slice(indent)).join('\n');
    // Keep light-DOM textContent intact so cloneNode(true) preserves the source
    // for overview thumbnails (the shadow template has no <slot>).
    this._renderPromise = this._render();
  }

  private async _render(): Promise<void> {
    if (!this._source) return;
    await ensureMermaid();
    const id = `mmd-${++mermaidId}`;
    try {
      const { svg } = await window.mermaid!.render(id, this._source);
      this._svg = svg;
      this.rendered = true;
    } catch (e: unknown) {
      console.error('Mermaid render error', e);
      const msg = e instanceof Error ? e.message : String(e);
      this._svg = `<pre style="color:#f87171">${msg}</pre>`;
    }
  }

  override render() {
    return html`<div class="canvas" .innerHTML="${this._svg}"></div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'deck-mermaid': DeckMermaid;
  }
}
