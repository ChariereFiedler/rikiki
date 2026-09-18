// ════════════════════════════════════════════════════════════════
// <deck-mermaid compact?>
//   graph LR
//   a --> b
// </deck-mermaid>
// ════════════════════════════════════════════════════════════════

import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { escapeHtml } from '../shared/escape-html.js';

interface MermaidLib {
  initialize(opts: Record<string, unknown>): void;
  render(id: string, source: string): Promise<{ svg: string }>;
}
declare global {
  interface Window {
    mermaid?: MermaidLib;
  }
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
  // Mermaid takes concrete colors, not CSS variables, so the palette cannot be
  // expressed in the stylesheet · it is READ from the theme instead of copied
  // here. It had already been copied: the three values below were
  // byte-identical to --rik-code__* in both shipped themes, which is a drift
  // waiting for the first theme that moves its code surface.
  const theme = getComputedStyle(document.documentElement);
  // An unresolved token yields '' · the key is then dropped rather than
  // defaulted, so mermaid falls back to its own dark theme instead of to a
  // second copy of the palette living here.
  const fromTheme = (vars: Record<string, string>) =>
    Object.fromEntries(
      Object.entries(vars)
        .map(([key, name]) => [key, theme.getPropertyValue(name).trim()])
        .filter(([, value]) => value !== ''),
    );

  window.mermaid!.initialize({
    startOnLoad: false,
    theme: 'dark',
    themeVariables: {
      // The diagram sits on the code surface · see the host styles below.
      ...fromTheme({
        background: '--rik-code__bg',
        edgeLabelBackground: '--rik-code__bg',
        textColor: '--rik-code__text',
      }),
      /* rikiki:allow-hex · a diagram's own geometry · no token describes a node
         fill, a node border or an edge on the code surface. Giving diagrams a
         theme-aware palette is a visual decision with its own measurements,
         not a token substitution. */
      mainBkg: '#2a2a2a',
      nodeBorder: '#555',
      lineColor: '#777',
      fontSize: '13px',
    },
    flowchart: { curve: 'basis', htmlLabels: true, padding: 12 },
    // 'strict' is mermaid's own secure default · it encodes HTML in labels and
    // refuses click-bound scripts. 'loose' let a diagram inject markup into the
    // deck, which no diagram needs to do.
    securityLevel: 'strict',
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
    /* The canvas takes the host's content box so the diagram can be capped
       against the room it actually has. Capping the SVG at 60cqh alone measures
       the slide, not this box: a diagram beside a two-line title then drew
       taller than the space left for it and the box clipped, which
       \`rikiki check\` reports in pixels. */
    .canvas {
      width: 100%; max-width: 100%; height: 100%; min-height: 0;
      display: flex; align-items: center; justify-content: center;
      text-align: center; overflow: hidden;
    }
    .canvas svg {
      width: 100% !important; height: auto !important; max-width: 100% !important;
      max-height: min(60cqh, 100%) !important;
    }
    :host([compact]) .canvas { max-width: 60%; }
    :host([compact]) .canvas svg { max-height: 22cqh; }
  `;

  @property({ type: Boolean, reflect: true }) rendered = false;
  @state() private _svg = '';
  private _source = '';
  private _renderPromise: Promise<void> | null = null;

  /** Rendered SVG markup · '' until the async render completes. Lets the
   *  overview build static thumbnails without reaching into this shadow root. */
  get renderedSvg(): string {
    return this._svg;
  }

  /** Resolves when the current render attempt settles (success or error). */
  get whenRendered(): Promise<void> {
    return this._renderPromise ?? Promise.resolve();
  }

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
      // Mermaid folds the offending source into the error text (for instance
      // UnknownDiagramError), so this message is author-reachable and must be
      // escaped before it reaches the innerHTML sink below · and again in the
      // overview thumbnail, which re-injects `renderedSvg` into a second tree.
      const msg = e instanceof Error ? e.message : String(e);
      /* rikiki:allow-hex · an error on the code surface, and no token is tuned
         for it · --rik-status-danger__text is a paper color and measures
         4.92:1 on rikiki, 3.97:1 on siliceum against --rik-code__bg, under the
         4.5 AA floor. This red measures 6.93:1 on both. */
      this._svg = `<pre style="color:#f87171">${escapeHtml(msg)}</pre>`;
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
