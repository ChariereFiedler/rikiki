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
const TOKEN_LINK_TAG = 'data-overview-tokens';

const STYLES = `
  :host([overview]) ::slotted(*) { display: none !important; }
  :host([overview]) #overview-grid {
    position: fixed; inset: 0;
    background: var(--rik-surface-page);
    overflow: hidden;
    z-index: 80;
    display: grid;
    grid-template-rows: auto 1fr;
  }

  /* ── Top bar · search, slide count, close hint ─────── */
  :host([overview]) .ov-bar {
    display: flex; align-items: center; gap: 16px;
    padding: 14px 28px;
    background: var(--rik-surface-raised);
    border-bottom: 1px solid var(--rik-border-default);
    font: 700 0.78rem/1 var(--rik-font-mono);
    letter-spacing: 0.10em;
    color: var(--rik-text-default--faint);
  }
  :host([overview]) .ov-bar .ov-search {
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
  :host([overview]) .ov-bar .ov-search:focus {
    outline: none;
    border-color: var(--rik-accent);
    box-shadow: 0 0 0 3px var(--rik-accent--soft);
  }
  :host([overview]) .ov-bar .ov-count { color: var(--rik-accent); }
  :host([overview]) .ov-bar .ov-hint { letter-spacing: 0.16em; text-transform: uppercase; }

  /* ── Sidebar layout (many slides) ───────────────── */
  :host([overview]) .ov-body {
    display: grid;
    grid-template-columns: 240px 1fr;
    min-height: 0;
  }
  :host([overview]) .ov-body.compact { grid-template-columns: 1fr; }
  :host([overview]) .ov-aside {
    border-right: 1px solid var(--rik-border-default);
    background: var(--rik-surface-raised);
    overflow-y: auto;
    padding: 16px 0;
  }
  :host([overview]) .ov-aside-item {
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
  :host([overview]) .ov-aside-item:hover {
    background: var(--rik-surface-tint);
    color: var(--rik-text-default);
  }
  :host([overview]) .ov-aside-item[data-active] {
    background: var(--rik-accent--faint);
    border-left-color: var(--rik-accent);
    color: var(--rik-text-default);
  }
  :host([overview]) .ov-aside-num {
    font: 800 0.85rem/1 var(--rik-font-mono);
    color: var(--rik-accent);
  }
  :host([overview]) .ov-aside-text {
    font: 700 0.92rem/1.3 var(--rik-font-display, var(--rik-font-sans));
    letter-spacing: -0.005em;
  }
  :host([overview]) .ov-aside-count {
    font: 600 0.70rem/1 var(--rik-font-mono);
    color: var(--rik-text-default--faint);
    margin-top: 4px;
  }

  /* ── Main scroll area ─────────────────────────────── */
  :host([overview]) .ov-main {
    overflow-y: auto;
    padding: 24px 32px 48px;
    display: flex; flex-direction: column;
    gap: 32px;
    min-width: 0;
  }
  :host([overview]) .ov-chapter {
    display: flex; flex-direction: column;
    gap: 12px;
    scroll-margin-top: 24px;
  }
  :host([overview]) .ov-chapter-head {
    display: flex; align-items: baseline; gap: 12px;
    padding-bottom: 6px;
    border-bottom: 2px solid var(--rik-accent);
  }
  :host([overview]) .ov-chapter-num {
    font: 800 0.85rem/1 var(--rik-font-mono);
    color: var(--rik-accent);
    letter-spacing: 0.12em;
  }
  :host([overview]) .ov-chapter-title {
    font: 800 1.2rem/1.2 var(--rik-font-display, var(--rik-font-sans));
    color: var(--rik-text-default);
    letter-spacing: -0.012em;
    flex: 1;
    min-width: 0;
  }
  :host([overview]) .ov-chapter-count {
    font: 700 0.72rem/1 var(--rik-font-mono);
    color: var(--rik-text-default--faint);
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }
  :host([overview]) .ov-row {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(var(--ov-cell-min, 180px), 1fr));
    gap: 12px;
  }

  /* ── Path layout (≤ 60 slides) ────────────────────── */
  :host([overview]) .ov-path .ov-row {
    display: flex; gap: 14px; align-items: center; flex-wrap: wrap;
  }
  :host([overview]) .ov-path .ov-connector {
    flex: 0 0 auto;
    width: 16px; height: 2px;
    background: var(--rik-border-default);
  }
  :host([overview]) .ov-path .ov-cell { flex: 0 0 auto; width: clamp(160px, 14vw, 260px); }

  /* ── Thumbnail cell ───────────────────────────────── */
  :host([overview]) .ov-cell {
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
  }
  :host([overview]) .ov-cell:hover {
    transform: translateY(-2px) scale(1.015);
    border-color: var(--rik-accent--soft);
    box-shadow: var(--rik-elevation-3);
    z-index: 1;
  }
  :host([overview]) .ov-cell[data-current] {
    border-color: var(--rik-accent);
    box-shadow: 0 0 0 3px var(--rik-accent--soft), var(--rik-elevation-2);
  }
  :host([overview]) .ov-cell[data-filtered-out] { opacity: 0.10; pointer-events: none; transform: scale(0.96); }
  :host([overview]) .ov-cell:not([data-loaded]) .ov-thumb { display: none; }
  :host([overview]) .ov-cell:not([data-loaded])::before {
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
    font: 700 0.70rem/1 var(--rik-font-mono);
    color: var(--rik-text-default);
    background: rgba(255, 255, 255, 0.92);
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

/** Extract a short, searchable text for a single slide · used by the filter. */
function slideSearchText(slide: Slide): string {
  return (slide.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 400).toLowerCase();
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

  const total = opts.slides.length;
  const useSidebar = total > 60;

  // Adaptive thumb min-width for the auto-fill grid. More slides → smaller.
  const cellMin =
    total > 300 ? 140 :
    total > 150 ? 160 :
    total > 60  ? 180 : 220;
  grid.style.setProperty('--ov-cell-min', cellMin + 'px');

  // Use the live viewport's exact dimensions for each thumb · clones layout-identical to live.
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  grid.style.setProperty('--ov-thumb-w', `${vw}px`);
  grid.style.setProperty('--ov-thumb-h', `${vh}px`);

  // Compute the per-cell scale after the first paint · cellWidth depends on
  // the grid's auto-fill resolution, which we can only measure post-mount.
  requestAnimationFrame(() => {
    const cellW = grid!.querySelector<HTMLDivElement>('.ov-cell')?.clientWidth ?? cellMin;
    grid!.style.setProperty('--overview-scale', String(cellW / vw));
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
  body.className = 'ov-body' + (useSidebar ? '' : ' compact');
  grid.appendChild(body);

  // Sidebar · chapter list (only when there are many chapters)
  const aside: HTMLElement | null = useSidebar ? document.createElement('aside') : null;
  if (aside) {
    aside.className = 'ov-aside';
    body.appendChild(aside);
  }

  const main = document.createElement('div');
  main.className = 'ov-main' + (useSidebar ? '' : ' ov-path');
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
  const lazyObserver = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const cell = e.target as HTMLElement;
        if (cell.dataset['loaded']) continue;
        const src = lazyLoad.get(cell);
        if (!src) continue;
        const thumb = document.createElement('div');
        thumb.className = 'ov-thumb';
        const clone = src.cloneNode(true) as HTMLElement;
        clone.setAttribute('active', '');
        thumb.appendChild(clone);
        cell.insertBefore(thumb, cell.firstChild);
        cell.dataset['loaded'] = '1';
        lazyObserver.unobserve(cell);
      }
    },
    { root: null, rootMargin: '300px 0px', threshold: 0 }
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
      const cell = document.createElement('div');
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
        opts.currentIdx >= chap.startIdx &&
        opts.currentIdx < chap.startIdx + chap.slides.length;
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
      { root: main, rootMargin: '0px 0px -70% 0px', threshold: 0 }
    );
    chapterEls.forEach((c) => io!.observe(c));
  }

  // ── Search · filter cells live as the user types ────────────────────
  const allCells = grid.querySelectorAll<HTMLElement>('.ov-cell');
  search.addEventListener('input', () => {
    const q = search.value.trim().toLowerCase();
    if (!q) {
      allCells.forEach((c) => delete c.dataset['filteredOut']);
      return;
    }
    allCells.forEach((c) => {
      const hay = c.dataset['search'] || '';
      if (hay.includes(q)) delete c.dataset['filteredOut'];
      else c.dataset['filteredOut'] = '1';
    });
  });

  // Scroll the current slide into view on open.
  requestAnimationFrame(() => {
    const cur = grid!.querySelector<HTMLElement>('.ov-cell[data-current]');
    if (cur) cur.scrollIntoView({ block: 'center' });
  });

  return () => {
    io?.disconnect();
    lazyObserver.disconnect();
    if (grid) grid.innerHTML = '';
  };
}
