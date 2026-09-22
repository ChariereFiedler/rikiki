// ════════════════════════════════════════════════════════════════
// deck-overview · path-style thumbnail grid · lazy-loaded by deck-root
//
// Two layouts depending on slide count:
//   · ≤ 60 slides   · classic path layout, one row per chapter
//   · > 60 slides   · two-column layout · sticky chapter sidebar on the
//                     left, wrapping thumbnail grid on the right. The
//                     sidebar tracks the currently-visible chapter via
//                     IntersectionObserver.
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
type CachedThumb = { key: string; thumb: HTMLElement };
const thumbCaches = new WeakMap<HTMLElement, Map<Slide, CachedThumb>>();

const views = new WeakMap<HTMLElement, { key: string; dispose: () => void }>();
function sourceKey(slide: Slide): string {
  const html = slide.outerHTML;
  const end = html.indexOf('>');
  return html.slice(0, end).replace(/\sactive(?:="[^"]*")?/, '') + html.slice(end);
}
const STYLES = `
  :host([overview]) ::slotted(*) { display: none !important; }
  :host(:is([overview], [data-overview-warming])) #overview-grid {
    position: fixed; inset: 0;
    background: var(--rik-surface-page);
    overflow: hidden;
    z-index: 80;
    display: grid;
    grid-template-rows: auto 1fr;
  }

  /* ── Top bar · search, slide count, close hint ─────── */
  :host(:is([overview], [data-overview-warming])) .ov-bar {
    display: flex; align-items: center; gap: 16px;
    padding: 14px 28px;
    background: var(--rik-surface-raised);
    border-bottom: 1px solid var(--rik-border-default);
    font: 700 0.78rem/1 var(--rik-font-mono);
    letter-spacing: 0.10em;
    color: var(--rik-text-default--faint);
  }
  :host(:is([overview], [data-overview-warming])) .ov-bar .ov-search {
    flex: 1;
    appearance: none;
    background: var(--rik-surface-raised--strong);
    border: 1px solid var(--rik-border-default);
    border-radius: var(--rik-radius-sm);
    padding: 8px 14px;
    font: inherit;
    color: var(--rik-text-default);
    letter-spacing: 0;
    max-width: 480px;
  }
  :host(:is([overview], [data-overview-warming])) .ov-bar .ov-search:focus {
    outline: none;
    border-color: var(--rik-accent);
    box-shadow: 0 0 0 3px var(--rik-accent--soft);
  }
  :host(:is([overview], [data-overview-warming])) .ov-bar .ov-count { color: var(--rik-accent); }
  :host(:is([overview], [data-overview-warming])) .ov-bar .ov-hint { letter-spacing: 0.16em; text-transform: uppercase; }

  /* ── Sidebar layout (many slides) ───────────────── */
  :host(:is([overview], [data-overview-warming])) .ov-body {
    display: grid;
    grid-template-columns: 240px 1fr;
    min-height: 0;
  }
  :host(:is([overview], [data-overview-warming])) .ov-body.compact { grid-template-columns: 1fr; }
  :host(:is([overview], [data-overview-warming])) .ov-aside {
    border-right: 1px solid var(--rik-border-default);
    background: var(--rik-surface-raised);
    overflow-y: auto;
    padding: 16px 0;
  }
  :host(:is([overview], [data-overview-warming])) .ov-aside-item {
    display: grid;
    grid-template-columns: 36px 1fr;
    gap: 10px;
    align-items: baseline;
    padding: 10px 16px;
    cursor: pointer;
    border-left: 3px solid transparent;
    color: var(--rik-text-default--muted);
    transition: background 0.12s, color 0.12s, border-color 0.12s;
  }
  :host(:is([overview], [data-overview-warming])) .ov-aside-item:hover {
    background: var(--rik-surface-tint);
    color: var(--rik-text-default);
  }
  :host(:is([overview], [data-overview-warming])) .ov-aside-item[data-active] {
    background: var(--rik-accent--faint);
    border-left-color: var(--rik-accent);
    color: var(--rik-text-default);
  }
  :host(:is([overview], [data-overview-warming])) .ov-aside-num {
    font: 800 0.85rem/1 var(--rik-font-mono);
    color: var(--rik-accent);
  }
  :host(:is([overview], [data-overview-warming])) .ov-aside-text {
    font: 700 0.92rem/1.3 var(--rik-font-display, var(--rik-font-sans));
    letter-spacing: -0.005em;
  }
  :host(:is([overview], [data-overview-warming])) .ov-aside-count {
    font: 600 0.70rem/1 var(--rik-font-mono);
    color: var(--rik-text-default--faint);
    margin-top: 4px;
  }

  /* ── Main scroll area ─────────────────────────────── */
  :host(:is([overview], [data-overview-warming])) .ov-main {
    overflow-y: auto;
    padding: 24px 32px 48px;
    display: flex; flex-direction: column;
    gap: 32px;
    min-width: 0;
  }
  :host(:is([overview], [data-overview-warming])) .ov-chapter {
    display: flex; flex-direction: column;
    gap: 12px;
    scroll-margin-top: 24px;
  }
  :host(:is([overview], [data-overview-warming])) .ov-chapter-head {
    display: flex; align-items: baseline; gap: 12px;
    padding-bottom: 6px;
    border-bottom: 2px solid var(--rik-accent);
  }
  :host(:is([overview], [data-overview-warming])) .ov-chapter-num {
    font: 800 0.85rem/1 var(--rik-font-mono);
    color: var(--rik-accent);
    letter-spacing: 0.12em;
  }
  :host(:is([overview], [data-overview-warming])) .ov-chapter-title {
    font: 800 1.2rem/1.2 var(--rik-font-display, var(--rik-font-sans));
    color: var(--rik-text-default);
    letter-spacing: -0.012em;
    flex: 1;
    min-width: 0;
  }
  :host(:is([overview], [data-overview-warming])) .ov-chapter-count {
    font: 700 0.72rem/1 var(--rik-font-mono);
    color: var(--rik-text-default--faint);
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }
  :host(:is([overview], [data-overview-warming])) .ov-row {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(var(--ov-cell-min, 180px), 1fr));
    gap: 12px;
  }

  /* ── Path layout (≤ 60 slides) ────────────────────── */
  :host(:is([overview], [data-overview-warming])) .ov-path .ov-row {
    display: flex; gap: 14px; align-items: center; flex-wrap: wrap;
  }
  :host(:is([overview], [data-overview-warming])) .ov-path .ov-connector {
    flex: 0 0 auto;
    width: 16px; height: 2px;
    background: var(--rik-border-default);
  }
  :host(:is([overview], [data-overview-warming])) .ov-path .ov-cell { flex: 0 0 auto; width: clamp(160px, 14vw, 260px); }

  /* ── Thumbnail cell ───────────────────────────────── */
  :host(:is([overview], [data-overview-warming])) .ov-cell {
    position: relative;
    aspect-ratio: 16 / 9;
    background:
      linear-gradient(180deg, var(--rik-surface-raised) 0%, var(--rik-surface-sunken) 100%);
    border: 1px solid var(--rik-border-default);
    border-radius: var(--rik-radius-md);
    overflow: hidden;
    cursor: pointer;
    transition: border-color 0.12s ease, transform 0.12s ease, box-shadow 0.12s ease, opacity 0.15s;
    box-shadow: var(--rik-elevation-1);
    /* It is a <button> now · drop the UA chrome, keep the tile look. */
    padding: 0;
    font: inherit;
    color: inherit;
    text-align: left;
    appearance: none;
  }
  /* The keyboard user must see where they are · without this the grid moves
     focus invisibly. */
  :host(:is([overview], [data-overview-warming])) .ov-cell:focus-visible {
    outline: var(--rik-focus-ring--width, 2px) solid var(--rik-focus-ring, currentColor);
    outline-offset: var(--rik-focus-ring--offset, 2px);
    z-index: 2;
  }
  :host(:is([overview], [data-overview-warming])) .ov-cell:hover {
    transform: translateY(-2px) scale(1.015);
    border-color: var(--rik-accent--soft);
    box-shadow: var(--rik-elevation-3);
    z-index: 1;
  }
  :host(:is([overview], [data-overview-warming])) .ov-cell[data-current] {
    border-color: var(--rik-accent);
    box-shadow: 0 0 0 3px var(--rik-accent--soft), var(--rik-elevation-2);
  }
  :host(:is([overview], [data-overview-warming])) .ov-cell[data-filtered-out] { opacity: 0.10; pointer-events: none; transform: scale(0.96); }
  :host(:is([overview], [data-overview-warming])) .ov-cell:not([data-loaded]) .ov-thumb { display: none; }
  :host(:is([overview], [data-overview-warming])) .ov-cell:not([data-loaded])::before {
    content: '';
    position: absolute; inset: 0;
    background:
      linear-gradient(110deg,
        transparent 0%,
        transparent 38%,
        rgba(42, 37, 32, 0.04) 50%,
        transparent 62%,
        transparent 100%);
    background-size: 200% 100%;
    animation: ov-shimmer 1.4s linear infinite;
  }
  @keyframes ov-shimmer {
    from { background-position: 100% 0; }
    to   { background-position: -100% 0; }
  }
  /* The thumb mirrors the letterboxed stage, so make it a size container too ·
     the cloned slide's cqw/cqh then resolve exactly as they do live instead of
     falling back to the (larger) window. */
  :host(:is([overview], [data-overview-warming])) .ov-thumb {
    position: absolute; top: 0; left: 0;
    width: var(--ov-thumb-w, 1920px); height: var(--ov-thumb-h, 1080px);
    transform: scale(var(--overview-scale, 0.2));
    transform-origin: top left;
    pointer-events: none;
    container-type: size;
  }
  :host(:is([overview], [data-overview-warming])) .ov-thumb > * { display: flex !important; }
  :host(:is([overview], [data-overview-warming])) .ov-mermaid-snap {
    display: flex; align-items: center; justify-content: center;
    background: var(--rik-code__bg);
    border: 1px solid var(--rik-code__border);
    border-radius: var(--rik-radius-md);
    padding: var(--rik-space-4);
    overflow: hidden; min-width: 0;
  }
  :host(:is([overview], [data-overview-warming])) .ov-mermaid-snap svg {
    width: 100% !important; height: auto !important;
    max-width: 100% !important; max-height: 60cqh;
  }
  :host(:is([overview], [data-overview-warming])) .ov-cell-label {
    position: absolute; bottom: 6px; right: 8px;
    font: 700 0.70rem/1 var(--rik-font-mono);
    color: var(--rik-text-default);
    background: rgba(255, 255, 255, 0.92);
    padding: 3px 7px; border-radius: 4px;
    z-index: 2;
    pointer-events: none;
  }
  :host(:not([overview])) #overview-grid { visibility: hidden; pointer-events: none; }
  :host(:not([overview]):not([data-overview-warming])) #overview-grid { display: none; }
`;

function ensureStyles(shadow: ShadowRoot): void {
  if (shadow.querySelector(`style[${STYLE_TAG}]`)) return;
  const style = document.createElement('style');
  style.setAttribute(STYLE_TAG, '1');
  style.textContent = STYLES;
  shadow.appendChild(style);
}

function sectionTitleOf(chap: Chapter): string {
  const first = chap.slides[0];
  const h1 = first?.querySelector('h1');
  if (!h1) return `Slide ${chap.startIdx + 1}`;
  return (
    Array.from(h1.childNodes)
      .map((n) => (n.nodeName === 'BR' ? ' ' : (n.textContent ?? '')))
      .join('')
      .replace(/\s+/g, ' ')
      .trim() || `Slide ${chap.startIdx + 1}`
  );
}

/** Extract a short, searchable text for a single slide · used by the filter. */
function slideSearchText(slide: Slide): string {
  return (slide.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 400).toLowerCase();
}

interface MermaidLike extends HTMLElement {
  renderedSvg?: string;
  whenRendered?: Promise<void>;
}

/** Attributes whose value may carry url(#id) references. */
const URL_REF_ATTRS = [
  'fill',
  'stroke',
  'clip-path',
  'mask',
  'filter',
  'marker-start',
  'marker-mid',
  'marker-end',
  'style',
];

/** Suffix every [id] inside root and rewrite url(#…) / href="#…" references
 *  so multiple clones can coexist in one shadow tree without collisions. */
function namespaceIds(root: HTMLElement, suffix: string): void {
  const renames = new Map<string, string>();
  root.querySelectorAll('[id]').forEach((el) => {
    renames.set(el.id, el.id + suffix);
    el.id = el.id + suffix;
  });
  if (renames.size === 0) return;
  const rewriteUrls = (value: string): string =>
    value.replace(/url\(['"]?#([^'")]+)['"]?\)/g, (m, id: string) =>
      renames.has(id) ? `url(#${renames.get(id)})` : m,
    );
  root.querySelectorAll('*').forEach((el) => {
    for (const attr of URL_REF_ATTRS) {
      const v = el.getAttribute(attr);
      if (v?.includes('url(')) el.setAttribute(attr, rewriteUrls(v));
    }
    for (const attr of ['href', 'xlink:href']) {
      const v = el.getAttribute(attr);
      if (v?.startsWith('#') && renames.has(v.slice(1))) {
        el.setAttribute(attr, `#${renames.get(v.slice(1))}`);
      }
    }
  });
  // Rewrite #id selectors inside <style> blocks · mermaid scopes every rule
  // by the root svg id (`#mmd-2 .node {…}`), which stops matching once that id
  // is suffixed, leaving the diagram unstyled (black). The trailing lookahead
  // keeps `#mmd-2` from corrupting a longer id like `#mmd-2_flowchart`.
  const styles = root.querySelectorAll('style');
  if (styles.length) {
    const escapeRe = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    styles.forEach((styleEl) => {
      let css = styleEl.textContent ?? '';
      renames.forEach((newId, oldId) => {
        css = css.replace(new RegExp(`#${escapeRe(oldId)}(?![\\w-])`, 'g'), `#${newId}`);
      });
      styleEl.textContent = css;
    });
  }
}

/** Freeze light-DOM SVG dimensions from the live slide so SVGs without
 *  intrinsic size don't fall back to 300×150 in the thumbnail. Runs BEFORE
 *  mermaid replacement so live/clone <svg> lists stay index-aligned. */
function freezeSvgSizes(live: Slide, clone: HTMLElement): void {
  const liveSvgs = live.querySelectorAll('svg');
  clone.querySelectorAll('svg').forEach((svg, i) => {
    const rect = liveSvgs[i]?.getBoundingClientRect();
    if (rect && rect.width > 0) {
      svg.setAttribute('width', String(Math.round(rect.width)));
      svg.setAttribute('height', String(Math.round(rect.height)));
      svg.style.maxWidth = '100%';
    } else if (svg.hasAttribute('viewBox') && !svg.hasAttribute('width')) {
      // Never-measured slide · derive a size from the viewBox aspect.
      const vb = (svg.getAttribute('viewBox') ?? '').split(/[\s,]+/).map(Number);
      if (vb.length === 4 && vb[2]! > 0) {
        svg.setAttribute('width', String(vb[2]));
        svg.setAttribute('height', String(vb[3]));
        svg.style.maxWidth = '100%';
        svg.style.height = 'auto';
      }
    }
  });
}

/** Replace each cloned <deck-mermaid> (empty Lit state) with a static <div>
 *  containing the SVG serialized from the live component's shadow root. */
function snapshotMermaids(live: Slide, clone: HTMLElement): void {
  const liveM = live.querySelectorAll<MermaidLike>('deck-mermaid');
  clone.querySelectorAll('deck-mermaid').forEach((c, i) => {
    const src = liveM[i];
    const snap = document.createElement('div');
    snap.className = 'ov-mermaid-snap';
    snap.innerHTML = src?.renderedSvg ?? '';
    const rect = src?.getBoundingClientRect();
    if (rect && rect.width > 0) {
      snap.style.width = `${rect.width}px`;
      snap.style.height = `${rect.height}px`;
    }
    c.replaceWith(snap);
  });
}

/** Reveal click-staged content so the thumbnail shows the slide's *final*
 *  state, not click step 0 · a slide whose payload hides behind data-click
 *  (the punchline) would otherwise render blank in the overview. The clone
 *  carries the live slide's inline opacity/transform from click-stages · clear
 *  it on reveal-type elements (no-op when click-stages isn't installed). */
function revealClickStages(clone: HTMLElement): void {
  clone
    .querySelectorAll<HTMLElement>(
      '[data-click], [data-click-auto], [data-click-children], [data-click-stagger] > *',
    )
    .forEach((el) => {
      el.style.opacity = '';
      el.style.transform = '';
      el.style.filter = '';
      el.style.pointerEvents = '';
      el.querySelectorAll<SVGElement>(
        'path, line, polyline, polygon, circle, ellipse, rect',
      ).forEach((s) => {
        (s as SVGElement & { style: CSSStyleDeclaration }).style.strokeDashoffset = '';
      });
    });
}

/** Thumbnail-safe clone of a slide · static mermaid, namespaced IDs,
 *  frozen SVG dimensions, click-staged content revealed. */
function snapshotSlide(slide: Slide, idx: number): HTMLElement {
  const clone = slide.cloneNode(true) as HTMLElement;
  clone.setAttribute('active', '');
  revealClickStages(clone);
  freezeSvgSizes(slide, clone);
  snapshotMermaids(slide, clone);
  namespaceIds(clone, `-ov${idx}`);
  return clone;
}

/** Build a cell's thumbnail · awaits in-flight mermaid renders first so the
 *  snapshot serializes real SVG even for never-visited slides. */
async function buildThumb(
  cell: HTMLElement,
  src: Slide,
  cache: Map<Slide, CachedThumb>,
  contextKey: string,
): Promise<void> {
  const key = contextKey + ':' + cell.dataset['idx'] + ':' + src.outerHTML;
  const cached = cache.get(src);
  if (cached?.key === key) {
    cell.insertBefore(cached.thumb, cell.firstChild);
    cell.dataset['loaded'] = '1';
    delete cell.dataset['building'];
    return;
  }
  const pending = Array.from(src.querySelectorAll<MermaidLike>('deck-mermaid'))
    .map((m) => m.whenRendered)
    .filter((p): p is Promise<void> => !!p);
  if (pending.length) await Promise.all(pending).catch(() => undefined);
  if (!cell.isConnected) return;
  cached?.thumb.remove();
  const thumb = document.createElement('div');
  thumb.className = 'ov-thumb';
  // Isolate author styles from the overview controls, while preserving the
  // deck-root ancestry used by themes and third-party layout components.
  const surface = thumb.attachShadow({ mode: 'open' });
  for (const node of document.querySelectorAll('link[rel="stylesheet"], style')) {
    surface.appendChild(node.cloneNode(true));
  }
  const preview = document.createElement('deck-root');
  preview.setAttribute('data-overview-snapshot', '');
  for (const attr of ['preview', 'no-hint', 'no-arrows', 'no-counter'])
    preview.setAttribute(attr, '');
  const sourceRoot = src.closest('deck-root');
  for (const attr of ['width', 'height', 'class', 'lang', 'dir', 'style']) {
    const value = sourceRoot?.getAttribute(attr);
    if (value != null) preview.setAttribute(attr, value);
  }
  preview.style.cssText += ';position:absolute;inset:0;width:100%;height:100%;';
  preview.appendChild(snapshotSlide(src, Number(cell.dataset['idx'])));
  surface.appendChild(preview);
  cache.set(src, { key, thumb });
  cell.insertBefore(thumb, cell.firstChild);
  cell.dataset['loaded'] = '1';
  delete cell.dataset['building'];
}

export function mountOverview(host: HTMLElement, opts: OverviewOptions): () => void {
  const shadow = host.shadowRoot;
  if (!shadow) return () => undefined;

  ensureStyles(shadow);
  // Theme tokens inherit from the deck; never fetch another stylesheet here.

  let grid = shadow.querySelector<HTMLDivElement>('#overview-grid');
  if (!grid) {
    grid = document.createElement('div');
    grid.id = 'overview-grid';
    shadow.appendChild(grid);
  }

  let cache = thumbCaches.get(host);
  if (!cache) {
    cache = new Map();
    thumbCaches.set(host, cache);
  }
  const liveSlides = new Set(opts.slides);
  for (const [slide, entry] of cache) {
    if (!liveSlides.has(slide)) {
      entry.thumb.remove();
      cache.delete(slide);
    }
  }
  const contextKey =
    Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .filter((node) => !node.id.startsWith('rik-deck-'))
      .map((node) => node.outerHTML)
      .join('') +
    ['width', 'height', 'class', 'lang', 'dir', 'style']
      .map((name) => host.getAttribute(name))
      .join('|');

  const viewKey =
    contextKey +
    opts.slides.map(sourceKey).join('') +
    JSON.stringify(opts.chapters.map((c) => c.startIdx));
  const previous = views.get(host);
  if (previous?.key === viewKey) {
    grid.querySelectorAll<HTMLElement>('.ov-cell').forEach((cell) => {
      const current = Number(cell.dataset['idx']) === opts.currentIdx;
      cell.toggleAttribute('data-current', current);
      if (current) cell.setAttribute('aria-current', 'true');
      else cell.removeAttribute('aria-current');
    });
    requestAnimationFrame(() => {
      if (!host.hasAttribute('overview')) return;
      const cell = grid!.querySelector<HTMLElement>('.ov-cell[data-current]');
      cell?.scrollIntoView({ block: 'center' });
      cell?.focus({ preventScroll: true });
    });
    return previous.dispose;
  }
  previous?.dispose();
  grid.innerHTML = '';
  const total = opts.slides.length;
  const useSidebar = total > 60;

  // Adaptive thumb min-width for the auto-fill grid. More slides → smaller.
  const cellMin = total > 300 ? 140 : total > 150 ? 160 : total > 60 ? 180 : 220;
  grid.style.setProperty('--ov-cell-min', `${cellMin}px`);

  // Each thumb is a 1:1 clone of a slide laid out at the deck's own dimensions,
  // then scaled down to the cell. Slides live inside the letterboxed logical
  // canvas (#stage), so measure that box (and the CSS makes the thumb a size
  // container) to keep clones layout-identical to the live slides.
  const stage = shadow.querySelector<HTMLElement>('#stage');
  const thumbW = stage?.clientWidth || window.innerWidth;
  const thumbH = stage?.clientHeight || window.innerHeight;
  grid.style.setProperty('--ov-thumb-w', `${thumbW}px`);
  grid.style.setProperty('--ov-thumb-h', `${thumbH}px`);

  // Compute the per-cell scale after the first paint · cellWidth depends on
  // the grid's auto-fill resolution, which we can only measure post-mount.
  const resize = new ResizeObserver(() => {
    const cellW = grid!.querySelector<HTMLDivElement>('.ov-cell')?.clientWidth;
    if (cellW) grid!.style.setProperty('--overview-scale', String(cellW / thumbW));
  });
  resize.observe(grid);
  requestAnimationFrame(() => {
    const cellW = grid!.querySelector<HTMLDivElement>('.ov-cell')?.clientWidth ?? cellMin;
    grid!.style.setProperty('--overview-scale', String(cellW / thumbW));
  });

  // ── Top bar · search + count + close hint ──────────────────────────
  const bar = document.createElement('div');
  bar.className = 'ov-bar';

  const search = document.createElement('input');
  search.className = 'ov-search';
  search.type = 'search';
  search.placeholder = `Search ${total} slides · type to filter`;
  search.spellcheck = false;
  bar.appendChild(search);

  const count = document.createElement('span');
  count.className = 'ov-count';
  count.textContent = `${total} slides · ${opts.chapters.length} chapters`;
  bar.appendChild(count);

  const hint = document.createElement('span');
  hint.className = 'ov-hint';
  hint.textContent = 'O · Esc · close';
  bar.appendChild(hint);

  grid.appendChild(bar);

  // ── Body · sidebar (optional) + main scrollable column ──────────────
  const body = document.createElement('div');
  body.className = `ov-body${useSidebar ? '' : ' compact'}`;
  grid.appendChild(body);

  // Sidebar · chapter list (only when there are many chapters)
  const aside: HTMLElement | null = useSidebar ? document.createElement('aside') : null;
  if (aside) {
    aside.className = 'ov-aside';
    body.appendChild(aside);
  }

  const main = document.createElement('div');
  main.className = `ov-main${useSidebar ? '' : ' ov-path'}`;
  body.appendChild(main);

  // Build chapters · either as a vertical stack (sidebar mode) or as
  // path-style flex rows (compact mode).
  const chapterEls: HTMLElement[] = [];
  const asideEls: HTMLElement[] = [];

  // Cells lazy-load their thumbnail clones via IntersectionObserver · the
  // overview opens in <50 ms regardless of slide count, then populates as
  // the user scrolls. We keep a map idx → slide source so the observer
  // callback can build a clone on demand.
  const lazyLoad = new WeakMap<HTMLElement, Slide>();
  let disposed = false;
  const pending: (() => void)[] = [];
  let scheduled = false;
  const schedule = () => {
    if (scheduled || disposed || !pending.length) return;
    scheduled = true;
    const run = () => {
      scheduled = false;
      if (disposed) return;
      pending.shift()?.();
      schedule();
    };
    if ('requestIdleCallback' in window) window.requestIdleCallback(run, { timeout: 1000 });
    else setTimeout(run, 32);
  };
  const lazyObserver = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const cell = e.target as HTMLElement;
        if (cell.dataset['loaded'] || cell.dataset['building']) continue;
        const src = lazyLoad.get(cell);
        if (!src) continue;
        cell.dataset['building'] = '1';
        lazyObserver.unobserve(cell);
        const build = () => {
          void buildThumb(cell, src, cache!, contextKey).catch((err) => {
            // Release the cell on failure · the next scroll-into-view retries
            // instead of leaving the thumbnail permanently blank. Cap the retries
            // so a slide that deterministically fails to snapshot doesn't re-throw
            // (and re-warn) on every scroll.
            const tries = Number(cell.dataset['tries'] ?? '0') + 1;
            cell.dataset['tries'] = String(tries);
            console.warn('[rikiki/overview] thumbnail build failed', err);
            delete cell.dataset['building'];
            if (tries < 3 && !disposed) lazyObserver.observe(cell);
          });
        };
        if (host.hasAttribute('overview')) build();
        else {
          pending.push(build);
          schedule();
        }
      }
    },
    { root: null, rootMargin: '300px 0px', threshold: 0 },
  );

  opts.chapters.forEach((chap, ci) => {
    const sectionEl = document.createElement('section');
    sectionEl.className = 'ov-chapter';
    sectionEl.id = `ov-chapter-${ci}`;

    if (useSidebar) {
      const head = document.createElement('header');
      head.className = 'ov-chapter-head';
      const num = document.createElement('span');
      num.className = 'ov-chapter-num';
      num.textContent = String(ci + 1).padStart(2, '0');
      head.appendChild(num);
      const title = document.createElement('span');
      title.className = 'ov-chapter-title';
      title.textContent = sectionTitleOf(chap);
      head.appendChild(title);
      const cnt = document.createElement('span');
      cnt.className = 'ov-chapter-count';
      cnt.textContent = `${chap.slides.length} slide${chap.slides.length > 1 ? 's' : ''}`;
      head.appendChild(cnt);
      sectionEl.appendChild(head);
    }

    const row = document.createElement('div');
    row.className = 'ov-row';

    chap.slides.forEach((slide, j) => {
      if (!useSidebar && j > 0) {
        const conn = document.createElement('div');
        conn.className = 'ov-connector';
        row.appendChild(conn);
      }
      const idx = chap.startIdx + j;
      // A button, not a div · the overview was unreachable by keyboard, and a
      // screen reader announced nothing for a cell.
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'ov-cell';
      cell.dataset['idx'] = String(idx);
      cell.dataset['search'] = slideSearchText(slide);
      if (idx === opts.currentIdx) cell.dataset['current'] = '1';

      // Lazy thumb · the clone is built when the cell scrolls into view.
      lazyLoad.set(cell, slide);
      lazyObserver.observe(cell);

      const num = document.createElement('span');
      num.className = 'ov-cell-label';
      num.textContent = String(idx + 1);
      cell.appendChild(num);

      // The visible label is just a number · the accessible name carries the
      // slide's own text and says which one is current.
      const summary = slideSearchText(slide).trim().slice(0, 80);
      cell.setAttribute(
        'aria-label',
        `Slide ${idx + 1} of ${total}${summary ? ` · ${summary}` : ''}`,
      );
      if (idx === opts.currentIdx) cell.setAttribute('aria-current', 'true');

      cell.addEventListener('click', () => opts.onPick(idx));
      row.appendChild(cell);
    });

    sectionEl.appendChild(row);
    main.appendChild(sectionEl);
    chapterEls.push(sectionEl);

    // Matching aside entry
    if (aside) {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'ov-aside-item';
      const isCurrent =
        opts.currentIdx >= chap.startIdx && opts.currentIdx < chap.startIdx + chap.slides.length;
      if (isCurrent) item.dataset['active'] = '1';

      const numEl = document.createElement('span');
      numEl.className = 'ov-aside-num';
      numEl.textContent = String(ci + 1).padStart(2, '0');
      item.appendChild(numEl);

      const text = document.createElement('span');
      text.className = 'ov-aside-text';
      text.textContent = sectionTitleOf(chap);
      const cnt = document.createElement('div');
      cnt.className = 'ov-aside-count';
      cnt.textContent = `${chap.slides.length} slide${chap.slides.length > 1 ? 's' : ''}`;
      text.appendChild(cnt);
      item.appendChild(text);

      item.addEventListener('click', () => {
        sectionEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      aside.appendChild(item);
      asideEls.push(item);
    }
  });

  // ── Sidebar active-chapter tracking via IntersectionObserver ─────────
  let io: IntersectionObserver | null = null;
  if (aside) {
    io = new IntersectionObserver(
      (entries) => {
        // Find the entry closest to the top edge of the viewport.
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          const idx = chapterEls.indexOf(visible[0]!.target as HTMLElement);
          if (idx >= 0) {
            asideEls.forEach((el, i) => {
              if (i === idx) el.dataset['active'] = '1';
              else delete el.dataset['active'];
            });
          }
        }
      },
      { root: main, rootMargin: '0px 0px -70% 0px', threshold: 0 },
    );
    chapterEls.forEach((c) => {
      io!.observe(c);
    });
  }

  // ── Search · filter cells live as the user types ────────────────────
  const allCells = grid.querySelectorAll<HTMLElement>('.ov-cell');
  search.addEventListener('input', () => {
    const q = search.value.trim().toLowerCase();
    if (!q) {
      allCells.forEach((c) => {
        delete c.dataset['filteredOut'];
      });
      return;
    }
    allCells.forEach((c) => {
      const hay = c.dataset['search'] || '';
      if (hay.includes(q)) delete c.dataset['filteredOut'];
      else c.dataset['filteredOut'] = '1';
    });
  });

  // Scroll AND focus the current slide on open · scrolling alone leaves a
  // keyboard user with nothing selected and no way into the grid.
  requestAnimationFrame(() => {
    if (!host.hasAttribute('overview')) return;
    const cur = grid!.querySelector<HTMLElement>('.ov-cell[data-current]');
    if (!cur) return;
    cur.scrollIntoView({ block: 'center' });
    cur.focus({ preventScroll: true });
  });

  // Arrow keys walk the visible cells · the grid is a list of buttons, so Tab
  // works too, but arrows are what someone expects in a slide grid.
  grid.addEventListener('keydown', (e) => {
    const key = (e as KeyboardEvent).key;
    if (key !== 'ArrowLeft' && key !== 'ArrowRight') return;
    const visible = [...grid!.querySelectorAll<HTMLElement>('.ov-cell')].filter(
      (c) => !c.dataset['filteredOut'],
    );
    const here = visible.indexOf(document.activeElement as HTMLElement);
    if (here < 0) return;
    e.preventDefault();
    const next = visible[here + (key === 'ArrowRight' ? 1 : -1)];
    next?.focus();
    next?.scrollIntoView({ block: 'nearest' });
  });

  const dispose = () => {
    disposed = true;
    resize.disconnect();
    pending.length = 0;
    views.delete(host);
    io?.disconnect();
    lazyObserver.disconnect();
    if (grid) grid.innerHTML = '';
  };
  views.set(host, { key: viewKey, dispose });
  return dispose;
}
