// ════════════════════════════════════════════════════════════════
// <deck-root> · root, navigation, overview mode, keyboard help
// ════════════════════════════════════════════════════════════════

import { LitElement, html, css } from 'lit';

type Slide = HTMLElement & {
  applyStep?: (step: number) => void;
  render?: () => unknown;
};

type Chapter = { startIdx: number; slides: Slide[] };

interface DeckMermaidElement extends HTMLElement {
  render?: () => void;
}

export class DeckRoot extends LitElement {
  static override styles = css`
    :host {
      display: block;
      width: 100vw;
      height: 100vh;
      position: relative;
      background: var(--bg);
    }
    #progress {
      position: fixed; bottom: 0; left: 0;
      height: 3px; background: linear-gradient(90deg, var(--yellow), var(--yellow-soft));
      transition: width 0.25s ease;
      z-index: 100;
    }
    #counter {
      position: fixed; bottom: 1rem; right: 1.5rem;
      font-size: var(--fs-micro);
      color: var(--muted);
      font-family: var(--mono);
      z-index: 100;
    }
    #step-dots {
      position: fixed; bottom: 1rem; left: 50%;
      transform: translateX(-50%);
      display: flex; gap: 6px;
      z-index: 100;
    }
    .dot { width: 6px; height: 6px; border-radius: 50%; background: #d4d4d0; transition: background 0.2s; }
    .dot.active { background: var(--yellow); }

    #kb-hint {
      position: fixed; bottom: 1rem; left: 1.5rem;
      display: inline-flex; align-items: center; gap: 6px;
      font: 600 0.62rem/1 var(--mono);
      color: var(--muted);
      z-index: 100;
      opacity: 0.5;
      transition: opacity 0.2s ease;
      cursor: help;
    }
    #kb-hint:hover { opacity: 1; }
    #kb-hint kbd {
      background: var(--card);
      border: 1px solid var(--border);
      border-bottom: 2px solid var(--border);
      border-radius: 4px;
      padding: 2px 6px;
      color: var(--text);
      font: inherit;
      min-width: 16px; text-align: center;
    }
    #kb-hint .sep { opacity: 0.4; }

    /* Keyboard help overlay */
    #kb-overlay {
      position: fixed; inset: 0;
      background: rgba(10,10,10,0.7);
      display: none; align-items: center; justify-content: center;
      z-index: 200;
      backdrop-filter: blur(8px);
      opacity: 0;
      transition: opacity 0.2s ease;
    }
    #kb-overlay.open { display: flex; opacity: 1; }
    .kb-card {
      background: var(--card); color: var(--text);
      border: 1px solid var(--border);
      border-radius: var(--r-lg);
      padding: 2.2rem 2.5rem;
      box-shadow: 0 24px 80px rgba(0,0,0,0.5);
      width: min(560px, 90vw);
      font-family: var(--sans);
      animation: kbSlideIn 0.22s ease;
    }
    @keyframes kbSlideIn {
      from { transform: translateY(8px) scale(0.98); opacity: 0; }
      to   { transform: translateY(0) scale(1); opacity: 1; }
    }
    .kb-card-header {
      display: flex; align-items: baseline; justify-content: space-between;
      gap: 1rem;
      margin-bottom: 1.4rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid var(--border);
    }
    .kb-card h3 {
      font: 700 1.05rem/1.2 var(--sans);
      letter-spacing: -0.01em;
      color: var(--text);
    }
    .kb-group-label {
      font: 700 0.62rem/1 var(--mono);
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--muted);
      margin: 0.8rem 0 0.3rem;
    }
    .kb-group-label:first-of-type { margin-top: 0; }
    .kb-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 0.4rem 0;
      font-size: 0.88rem;
    }
    .kb-row .keys { display: flex; gap: 4px; align-items: center; }
    .kb-row kbd {
      background: linear-gradient(180deg, #fff 0%, var(--bg) 100%);
      border: 1px solid var(--border);
      border-bottom: 2px solid #c4c4be;
      border-radius: 5px;
      padding: 3px 9px;
      font: 600 0.78rem/1 var(--mono);
      color: var(--text);
      min-width: 22px; text-align: center;
      box-shadow: 0 1px 0 rgba(255,255,255,0.5) inset;
    }
    .kb-row .desc { color: var(--soft); }

    /* Overview mode · live cloned thumbnails laid out as a path (à la reveal.js).
       Each chapter is a row; the section marker sits at the left, sub-slides
       flow rightward. Vertical = sections, horizontal = slides within. */
    :host([overview]) ::slotted(*) {
      /* Hide the real slides; the grid renders cloned thumbnails. */
      display: none !important;
    }
    :host([overview]) #overview-grid {
      position: fixed; inset: 0;
      display: flex; flex-direction: column;
      gap: 28px;
      padding: 32px 48px;
      background: var(--bg);
      overflow: auto;
      z-index: 80;
    }
    :host([overview]) .ov-row {
      display: flex; gap: 14px;
      align-items: center;
      flex-wrap: wrap;
    }
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
      box-shadow: 0 0 0 3px rgba(247,203,68,0.35);
    }
    :host([overview]) .ov-thumb {
      /* Render the cloned slide at the live viewport's exact dimensions, then
         scale down. Using actual viewport size (instead of a fixed 1920×1080
         reference) keeps clones layout-identical to the live slides, no matter
         how text or padding scale with viewport. */
      position: absolute; top: 0; left: 0;
      width: var(--ov-thumb-w, 1920px); height: var(--ov-thumb-h, 1080px);
      transform: scale(var(--overview-scale, 0.2));
      transform-origin: top left;
      pointer-events: none;
    }
    :host([overview]) .ov-thumb > * {
      /* Force the cloned slide to render fully (override its :host[active] gate). */
      display: flex !important;
    }
    :host([overview]) .ov-cell-label {
      position: absolute; bottom: 6px; right: 8px;
      font: 700 0.72rem/1 var(--mono);
      color: var(--text);
      background: rgba(255,255,255,0.9);
      padding: 3px 7px; border-radius: 4px;
      z-index: 2;
      pointer-events: none;
    }
    :host(:not([overview])) #overview-grid { display: none; }
  `;

  declare current: number;
  declare step: number;
  declare overview: boolean;

  static override properties = {
    current:  { type: Number, state: true },
    step:     { type: Number, state: true },
    overview: { type: Boolean, reflect: true },
  };

  // Flat list of all <deck-*> children (excluding deck-root itself)
  private slides: Slide[] = [];
  // 2D index · chapters are bounded by <deck-section> elements
  private chapters: Chapter[] = [];

  constructor() {
    super();
    this.current = 0;
    this.step = 0;
    this.overview = false;
  }

  override firstUpdated(): void {
    this.slides = Array.from(this.querySelectorAll<Slide>(':scope > *')).filter((el) =>
      el.tagName?.toLowerCase().startsWith('deck-') && el.tagName?.toLowerCase() !== 'deck-root'
    );
    this._buildChapters();
    this._readHash(true);
    this._applyActive();
    this._applyStep();
    this._updateUI();
    // Chapters are known only after firstUpdated; re-render so the keyboard
    // hint can show ↑↓ if 2D navigation applies.
    this.requestUpdate();
    window.addEventListener('keydown', this._onKey);
    window.addEventListener('hashchange', this._onHash);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener('keydown', this._onKey);
    window.removeEventListener('hashchange', this._onHash);
  }

  /** Group slides into chapters bounded by <deck-section> markers. */
  private _buildChapters(): void {
    this.chapters = [];
    let current: Chapter | null = null;
    this.slides.forEach((slide, i) => {
      const isSection = slide.tagName?.toLowerCase() === 'deck-section';
      if (isSection || !current) {
        current = { startIdx: i, slides: [slide] };
        this.chapters.push(current);
      } else {
        current.slides.push(slide);
      }
    });
  }

  /** Whether 2D nav is enabled (i.e. at least one chapter has multiple slides). */
  private _has2DNav(): boolean {
    return this.chapters.some((c) => c.slides.length > 1) && this.chapters.length > 1;
  }

  /** Convert flat index → {chapter, intra-chapter index}. */
  private _coords(flatIdx: number): { c: number; i: number } {
    for (let c = 0; c < this.chapters.length; c++) {
      const chap = this.chapters[c]!;
      const local = flatIdx - chap.startIdx;
      if (local >= 0 && local < chap.slides.length) return { c, i: local };
    }
    return { c: 0, i: 0 };
  }

  private _flatFromCoords(c: number, i: number): number {
    const chap = this.chapters[c];
    if (!chap) return 0;
    return chap.startIdx + Math.max(0, Math.min(chap.slides.length - 1, i));
  }

  private _onHash = (): void => { this._readHash(false); };

  private _readHash(initial: boolean): void {
    // Supports #N (flat) and #C.N (chapter.intra) and legacy #N.step (treated as flat if 2D off)
    const h = location.hash;
    const m2D = h.match(/^#(\d+)\.(\d+)(?:s(\d+))?$/);
    const m1D = h.match(/^#(\d+)(?:\.(\d+))?$/);

    let target = this.current;
    let stepTarget = this.step;

    if (this._has2DNav() && m2D) {
      const c = parseInt(m2D[1]!, 10) - 1;
      const i = parseInt(m2D[2]!, 10) - 1;
      target = this._flatFromCoords(Math.max(0, c), Math.max(0, i));
      stepTarget = m2D[3] ? parseInt(m2D[3], 10) : 0;
    } else if (m1D) {
      target = parseInt(m1D[1]!, 10) - 1;
      stepTarget = m1D[2] ? parseInt(m1D[2], 10) : 0;
    } else {
      return;
    }

    if (target === this.current && stepTarget === this.step && !initial) return;
    this.current = Math.max(0, Math.min(this.slides.length - 1, target));
    this.step = Math.max(0, stepTarget);
    if (!initial) {
      this._applyActive();
      this._applyStep();
      this._updateUI();
    }
  }

  private _writeHash(): void {
    // Always write the flat #N form for shareability and back-compat.
    // 2D coordinates are accepted as input via #C.N but the canonical URL stays linear.
    const h = `#${this.current + 1}` + (this.step > 0 ? `.${this.step}` : '');
    if (location.hash !== h) history.replaceState(null, '', h);
  }

  private _onKey = (e: KeyboardEvent): void => {
    if (e.target && (e.target as HTMLElement).matches?.('input,textarea,[contenteditable]')) return;

    // Overview mode handles its own subset of keys
    if (this.overview) {
      if (e.key === 'Escape' || e.key === 'o' || e.key === 'O') {
        e.preventDefault();
        this.overview = false;
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        this.overview = false;
        return;
      }
      return;
    }

    if (e.key === '?' || e.key === 'h' || e.key === 'H') { this._toggleHelp(); return; }
    if (e.key === 'Escape')                                { this._closeHelp(); return; }
    if (e.key === 'o' || e.key === 'O')                    { e.preventDefault(); this.overview = true; return; }
    if (e.key === 'Home')                                  { this._goTo(0); return; }
    if (e.key === 'End')                                   { this._goTo(this.slides.length - 1); return; }

    // Space always advances linearly (sequence-friendly)
    if (e.key === ' ' || e.key === 'PageDown') { e.preventDefault(); this._advance(); return; }
    if (e.key === 'PageUp')                    { e.preventDefault(); this._back(); return; }

    if (this._has2DNav()) {
      // Two axes, both with linear fallback at edges:
      //   ←/→ : jump to the previous/next top-level chapter (section).
      //         At the deck edges, fall back to a linear step.
      //   ↑/↓ : walk slide-by-slide. Inside a section stays in the section;
      //         at the section boundary, crosses over linearly · so the user
      //         can hold ↓ to traverse the whole deck.
      const { c, i } = this._coords(this.current);
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (c + 1 < this.chapters.length) this._goToCoords(c + 1, 0);
        else this._advance();
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (c - 1 >= 0) this._goToCoords(c - 1, 0);
        else this._back();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const chap = this.chapters[c];
        if (chap && i + 1 < chap.slides.length) this._goToCoords(c, i + 1);
        else this._advance();
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (i - 1 >= 0) this._goToCoords(c, i - 1);
        else this._back();
        return;
      }
    } else {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); this._advance(); return; }
      if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   { e.preventDefault(); this._back(); return; }
    }
  };

  private _toggleHelp(): void {
    const o = this.renderRoot.querySelector<HTMLDivElement>('#kb-overlay');
    o?.classList.toggle('open');
  }
  private _closeHelp(): void {
    this.renderRoot.querySelector<HTMLDivElement>('#kb-overlay')?.classList.remove('open');
  }

  private _maxSteps(): number {
    const s = this.slides[this.current];
    if (!s) return 0;
    const direct = parseInt(s.getAttribute('steps') || s.dataset?.['steps'] || '0', 10);
    if (direct > 0) return direct;
    const code = s.querySelector('deck-code[step-groups]');
    if (code) {
      try { return JSON.parse(code.getAttribute('step-groups')!).length; } catch { /* noop */ }
    }
    return 0;
  }

  private _advance(): void {
    const max = this._maxSteps();
    if (this.step < max) {
      this.step++;
      this._applyStep();
      this._updateUI();
      this._writeHash();
    } else if (this.current < this.slides.length - 1) {
      this._goTo(this.current + 1);
    }
  }

  private _back(): void {
    if (this.step > 0) {
      this.step--;
      this._applyStep();
      this._updateUI();
      this._writeHash();
    } else if (this.current > 0) {
      this._goTo(this.current - 1);
      this.step = this._maxSteps();
      this._applyStep();
      this._updateUI();
      this._writeHash();
    }
  }

  private _goTo(n: number): void {
    this.current = Math.max(0, Math.min(this.slides.length - 1, n));
    this.step = 0;
    this._applyActive();
    this._applyStep();
    this._updateUI();
    this._writeHash();
  }

  private _goToCoords(c: number, i: number): void {
    const clampedC = Math.max(0, Math.min(this.chapters.length - 1, c));
    const chap = this.chapters[clampedC];
    if (!chap) return;
    const clampedI = Math.max(0, Math.min(chap.slides.length - 1, i));
    this._goTo(this._flatFromCoords(clampedC, clampedI));
  }

  private _applyActive(): void {
    this.slides.forEach((s, i) => {
      if (i === this.current) s.setAttribute('active', '');
      else s.removeAttribute('active');
    });
    const active = this.slides[this.current];
    const win = window as unknown as { mermaid?: unknown };
    if (active && win.mermaid) {
      active.querySelectorAll<DeckMermaidElement>('deck-mermaid:not([rendered])').forEach((el) => el.render?.());
    }
  }

  private _applyStep(): void {
    const slide = this.slides[this.current];
    if (!slide) return;
    slide.applyStep?.(this.step);
    slide.querySelectorAll<Slide>('*').forEach((el) => el.applyStep?.(this.step));
    slide.querySelectorAll<HTMLElement>('[data-step-block]').forEach((el) => {
      const n = parseInt(el.dataset['stepBlock']!, 10);
      el.style.transition = 'opacity 0.25s ease';
      el.style.opacity = (this.step === 0 || n <= this.step) ? '1' : '0.15';
    });
  }

  private _updateUI(): void {
    const total = this.slides.length;
    const n = this.current + 1;
    const progress = this.renderRoot.querySelector<HTMLDivElement>('#progress');
    const counter  = this.renderRoot.querySelector<HTMLDivElement>('#counter');
    const dots     = this.renderRoot.querySelector<HTMLDivElement>('#step-dots');
    if (progress) progress.style.width = (n / total * 100) + '%';
    if (counter) counter.textContent = `${n} / ${total}`;
    const max = this._maxSteps();
    if (dots) {
      dots.innerHTML = max === 0 ? '' :
        Array.from({ length: max }, (_, i) =>
          `<div class="dot${i < this.step ? ' active' : ''}"></div>`
        ).join('');
    }
  }

  override updated(): void {
    this._updateUI();
    this._renderOverviewIfActive();
  }

  /** Inject tokens.css into our shadow root so cloned slides get the
   *  light-DOM-only styling (deck-cover > h1, .lead, .sub, etc.). */
  private _ensureOverviewTokens(): void {
    if (this.renderRoot.querySelector('link[data-overview-tokens]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.dataset['overviewTokens'] = '1';
    // dist/deck-root.js → ../tokens.css (package root)
    link.href = new URL('../tokens.css', import.meta.url).href;
    (this.renderRoot as ShadowRoot).appendChild(link);
  }

  private _renderOverviewIfActive(): void {
    if (!this.overview) return;
    const grid = this.renderRoot.querySelector<HTMLDivElement>('#overview-grid');
    if (!grid) return;
    grid.innerHTML = '';

    // The cloned slides live inside this shadow root, but tokens.css carries
    // light-DOM-only rules (deck-cover > h1, .lead, .sub, etc.). Inject the
    // sheet here so the clones inherit the same styling as the live slides.
    this._ensureOverviewTokens();

    // Use the live viewport's exact dimensions for each thumb. Clones render at
    // the same logical size as the live slide, then scale to fit the cell width.
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    grid.style.setProperty('--ov-thumb-w', `${vw}px`);
    grid.style.setProperty('--ov-thumb-h', `${vh}px`);
    requestAnimationFrame(() => {
      const cellW = grid.querySelector<HTMLDivElement>('.ov-cell')?.clientWidth ?? 360;
      grid.style.setProperty('--overview-scale', String(cellW / vw));
    });

    // Render one row per chapter; slides inside a chapter flow left → right.
    // A chapter's first slide is usually a <deck-section> marker (or the cover
    // for the leading group); subsequent slides are sub-slides under it.
    this.chapters.forEach((chap) => {
      const row = document.createElement('div');
      row.className = 'ov-row';

      const label = document.createElement('span');
      label.className = 'ov-row-label';
      const first = chap.slides[0];
      const h1 = first?.querySelector('h1');
      // Walk childNodes so <br> becomes a space (slides are display:none in
      // overview, so innerText falls back to textContent and drops line breaks).
      const sectionTitle = h1
        ? Array.from(h1.childNodes)
            .map((n) => (n.nodeName === 'BR' ? ' ' : n.textContent || ''))
            .join('')
            .replace(/\s+/g, ' ')
            .trim()
        : '';
      label.textContent = sectionTitle || `Slide ${chap.startIdx + 1}`;
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
        if (idx === this.current) cell.dataset['current'] = '1';

        const thumb = document.createElement('div');
        thumb.className = 'ov-thumb';
        // cloneNode(true) re-instantiates any custom elements inside, so their shadow
        // DOM is rebuilt automatically when the clone is attached to the document.
        const clone = slide.cloneNode(true) as HTMLElement;
        clone.setAttribute('active', '');
        thumb.appendChild(clone);
        cell.appendChild(thumb);

        const num = document.createElement('span');
        num.className = 'ov-cell-label';
        num.textContent = String(idx + 1);
        cell.appendChild(num);

        cell.addEventListener('click', () => {
          this.overview = false;
          this._goTo(idx);
        });
        row.appendChild(cell);
      });

      grid.appendChild(row);
    });
  }

  override render(): unknown {
    return html`
      <div id="progress"></div>
      <div id="counter"></div>
      <div id="step-dots"></div>
      <div id="kb-hint">
        <kbd>←</kbd><kbd>→</kbd>
        ${this._has2DNav() ? html`<kbd>↑</kbd><kbd>↓</kbd>` : ''}
        <span>·</span>
        <kbd>O</kbd>
        <span>·</span>
        <kbd>?</kbd>
      </div>
      <div id="overview-grid"></div>
      <div id="kb-overlay" @click="${() => this._closeHelp()}">
        <div class="kb-card" @click="${(e: MouseEvent) => e.stopPropagation()}">
          <div class="kb-card-header">
            <h3>Keyboard shortcuts</h3>
            <span class="esc"><kbd>Esc</kbd> to close</span>
          </div>
          <div class="kb-group-label">Navigation</div>
          <div class="kb-row"><span class="desc">Next slide (linear)</span><span class="keys"><kbd>Space</kbd><kbd>PgDn</kbd></span></div>
          <div class="kb-row"><span class="desc">Previous slide</span><span class="keys"><kbd>PgUp</kbd></span></div>
          <div class="kb-row"><span class="desc">Previous / Next chapter</span><span class="keys"><kbd>←</kbd><kbd>→</kbd></span></div>
          <div class="kb-row"><span class="desc">Up / Down inside a chapter</span><span class="keys"><kbd>↑</kbd><kbd>↓</kbd></span></div>
          <div class="kb-row"><span class="desc">First / Last slide</span><span class="keys"><kbd>Home</kbd><kbd>End</kbd></span></div>
          <div class="kb-group-label">View</div>
          <div class="kb-row"><span class="desc">Toggle overview</span><span class="keys"><kbd>O</kbd></span></div>
          <div class="kb-row"><span class="desc">Show this help</span><span class="keys"><kbd>?</kbd><kbd>H</kbd></span></div>
        </div>
      </div>
      <slot></slot>
    `;
  }
}

customElements.define('deck-root', DeckRoot);
