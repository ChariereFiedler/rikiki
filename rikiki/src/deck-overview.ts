// ════════════════════════════════════════════════════════════════
// deck-overview · path-style thumbnail grid · lazy-loaded by deck-root
//
// Not a Lit component on purpose · this module is fetched on demand
// the first time the user presses `O`. It owns its own CSS (injected
// into the host's shadow root via a <style> element) and renders the
// overview grid into the host's existing `#overview-grid` slot.
//
// Public API:
//   mountOverview(host, opts) → () => void   · returns a teardown function.
// ════════════════════════════════════════════════════════════════

type Slide = HTMLElement;
type Chapter = { startIdx: number; slides: Slide[] };

export interface OverviewOptions {
  slides: Slide[];
  chapters: Chapter[];
  currentIdx: number;
  /** Called when the user clicks a thumbnail. The host should close the
   *  overview and navigate to the chosen slide. */
  onPick: (idx: number) => void;
}

const STYLE_TAG = 'data-deck-overview';
const TOKEN_LINK_TAG = 'data-overview-tokens';

const STYLES = `
  :host([overview]) ::slotted(*) { display: none !important; }
  :host([overview]) #overview-grid {
    position: fixed; inset: 0;
    display: flex; flex-direction: column;
    gap: 28px;
    padding: 32px 48px;
    background: var(--bg);
    overflow: auto;
    z-index: 80;
  }
  :host([overview]) .ov-row { display: flex; gap: 14px; align-items: center; flex-wrap: wrap; }
  :host([overview]) .ov-row-label {
    flex: 0 0 200px;
    font: 700 0.72rem/1.3 var(--mono);
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--muted);
    padding-right: 12px;
    text-align: right;
    white-space: normal;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
  }
  :host([overview]) .ov-cell {
    position: relative;
    flex: 0 0 auto;
    width: clamp(160px, 14vw, 260px);
    aspect-ratio: 16 / 9;
    background: var(--card);
    border: 2px solid var(--border);
    border-radius: var(--r-md);
    overflow: hidden;
    cursor: pointer;
    transition: border-color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
    box-shadow: var(--shadow-card);
  }
  :host([overview]) .ov-connector {
    flex: 0 0 auto;
    width: 16px; height: 2px;
    background: var(--border);
  }
  :host([overview]) .ov-cell:hover {
    transform: translateY(-2px);
    border-color: var(--yellow-soft);
    box-shadow: var(--shadow-hover);
  }
  :host([overview]) .ov-cell[data-current] {
    border-color: var(--yellow);
    box-shadow: 0 0 0 3px rgba(247, 203, 68, 0.35);
  }
  :host([overview]) .ov-thumb {
    position: absolute; top: 0; left: 0;
    width: var(--ov-thumb-w, 1920px); height: var(--ov-thumb-h, 1080px);
    transform: scale(var(--overview-scale, 0.2));
    transform-origin: top left;
    pointer-events: none;
  }
  :host([overview]) .ov-thumb > * { display: flex !important; }
  :host([overview]) .ov-cell-label {
    position: absolute; bottom: 6px; right: 8px;
    font: 700 0.72rem/1 var(--mono);
    color: var(--text);
    background: rgba(255, 255, 255, 0.9);
    padding: 3px 7px; border-radius: 4px;
    z-index: 2;
    pointer-events: none;
  }
  :host(:not([overview])) #overview-grid { display: none; }
`;

function ensureStyles(shadow: ShadowRoot): void {
  if (shadow.querySelector(`style[${STYLE_TAG}]`)) return;
  const style = document.createElement('style');
  style.setAttribute(STYLE_TAG, '1');
  style.textContent = STYLES;
  shadow.appendChild(style);
}

function ensureTokensLink(shadow: ShadowRoot, moduleUrl: string): void {
  if (shadow.querySelector(`link[${TOKEN_LINK_TAG}]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.setAttribute(TOKEN_LINK_TAG, '1');
  // dist/deck-overview.js → ../tokens.css (package root)
  link.href = new URL('../tokens.css', moduleUrl).href;
  shadow.appendChild(link);
}

function sectionTitleOf(chap: Chapter): string {
  const first = chap.slides[0];
  const h1 = first?.querySelector('h1');
  if (!h1) return `Slide ${chap.startIdx + 1}`;
  return Array.from(h1.childNodes)
    .map((n) => (n.nodeName === 'BR' ? ' ' : n.textContent ?? ''))
    .join('')
    .replace(/\s+/g, ' ')
    .trim() || `Slide ${chap.startIdx + 1}`;
}

export function mountOverview(host: HTMLElement, opts: OverviewOptions): () => void {
  const shadow = host.shadowRoot;
  if (!shadow) return () => undefined;

  ensureStyles(shadow);
  ensureTokensLink(shadow, import.meta.url);

  let grid = shadow.querySelector<HTMLDivElement>('#overview-grid');
  if (!grid) {
    grid = document.createElement('div');
    grid.id = 'overview-grid';
    shadow.appendChild(grid);
  }
  grid.innerHTML = '';

  // Use the live viewport's exact dimensions for each thumb · clones layout-identical to live.
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  grid.style.setProperty('--ov-thumb-w', `${vw}px`);
  grid.style.setProperty('--ov-thumb-h', `${vh}px`);
  requestAnimationFrame(() => {
    const cellW = grid!.querySelector<HTMLDivElement>('.ov-cell')?.clientWidth ?? 360;
    grid!.style.setProperty('--overview-scale', String(cellW / vw));
  });

  opts.chapters.forEach((chap) => {
    const row = document.createElement('div');
    row.className = 'ov-row';

    const label = document.createElement('span');
    label.className = 'ov-row-label';
    label.textContent = sectionTitleOf(chap);
    row.appendChild(label);

    chap.slides.forEach((slide, j) => {
      if (j > 0) {
        const conn = document.createElement('div');
        conn.className = 'ov-connector';
        row.appendChild(conn);
      }
      const idx = chap.startIdx + j;
      const cell = document.createElement('div');
      cell.className = 'ov-cell';
      if (idx === opts.currentIdx) cell.dataset['current'] = '1';

      const thumb = document.createElement('div');
      thumb.className = 'ov-thumb';
      const clone = slide.cloneNode(true) as HTMLElement;
      clone.setAttribute('active', '');
      thumb.appendChild(clone);
      cell.appendChild(thumb);

      const num = document.createElement('span');
      num.className = 'ov-cell-label';
      num.textContent = String(idx + 1);
      cell.appendChild(num);

      cell.addEventListener('click', () => opts.onPick(idx));
      row.appendChild(cell);
    });

    grid!.appendChild(row);
  });

  // Teardown · keeps the injected <style> and <link> for re-use; just empties the grid.
  return () => {
    if (grid) grid.innerHTML = '';
  };
}
