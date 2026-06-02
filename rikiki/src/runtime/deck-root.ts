// ════════════════════════════════════════════════════════════════
// <deck-root> · navigation, hash routing, slide management.
//
// Overview mode (`O`) and the keyboard help overlay (`?`) live in
// separate modules (deck-overview.js, deck-help.js) that are fetched
// the first time the user activates them · they aren't in this bundle.
// ════════════════════════════════════════════════════════════════

import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

type Slide = HTMLElement & {
  applyStep?: (step: number) => void;
  render?: () => unknown;
};

type Chapter = { startIdx: number; slides: Slide[] };

@customElement('deck-root')
export class DeckRoot extends LitElement {
  /* Customization tokens:
       --deck-root-bg (page background under all slides)
       --deck-root-progress-color / --deck-root-progress-height
       --deck-root-counter-color / --deck-root-dot-bg / --deck-root-dot-active-bg
       --deck-root-kb-hint-color (the bottom-left keyboard hint chip) */
  static override styles = css`
    :host {
      display: block;
      width: 100vw;
      height: 100vh;
      position: relative;
      background: var(--deck-root-bg, var(--rik-surface-page));
    }
    #progress {
      position: fixed; bottom: 0; left: 0;
      height: var(--deck-root-progress-height, 3px);
      background: var(--deck-root-progress-color, linear-gradient(90deg, var(--rik-accent), var(--rik-accent--soft)));
      transition: width 0.25s ease;
      z-index: 100;
    }
    #counter {
      position: fixed; bottom: 1rem; right: 1.5rem;
      font-size: var(--rik-font-size-xs);
      color: var(--deck-root-counter-color, var(--rik-text-default--faint));
      font-family: var(--rik-font-mono);
      z-index: 100;
    }
    #step-dots {
      position: fixed; bottom: 1rem; left: 50%;
      transform: translateX(-50%);
      display: flex; gap: 6px;
      z-index: 100;
    }
    .dot {
      width: 6px; height: 6px; border-radius: 50%;
      background: var(--deck-root-dot-bg, #d4d4d0);
      transition: background 0.2s;
    }
    .dot.active { background: var(--deck-root-dot-active-bg, var(--rik-accent)); }

    #kb-hint {
      position: fixed; bottom: 1rem; left: 1.5rem;
      display: inline-flex; align-items: center; gap: 6px;
      font: 600 0.62rem/1 var(--rik-font-mono);
      color: var(--deck-root-kb-hint-color, var(--rik-text-default--faint));
      z-index: 100;
      opacity: 0.5;
      transition: opacity 0.2s ease;
      cursor: help;
    }
    #kb-hint:hover { opacity: 1; }
    #kb-hint kbd {
      background: var(--rik-surface-raised);
      border: 1px solid var(--rik-border-default);
      border-bottom: 2px solid var(--rik-border-default);
      border-radius: 4px;
      padding: 2px 6px;
      color: var(--rik-text-default);
      font: inherit;
      min-width: 16px; text-align: center;
    }
    #kb-hint .sep { opacity: 0.4; }

    /* Black / white overlay · raised over everything, dismissed by any key
       (handled in _onKey) or a click. */
    #blank {
      position: fixed;
      inset: 0;
      z-index: 9999;
      cursor: pointer;
    }
    #blank[data-tone="black"] { background: #000; }
    #blank[data-tone="white"] { background: #fff; }
  `;

  @state() current = 0;
  @state() step = 0;
  /** When non-null, a full-screen overlay covers the deck (clicker B/./W/,
   *  keys). Pressing any key dismisses it · same convention as PowerPoint. */
  @state() blank: 'black' | 'white' | null = null;
  @property({ type: Boolean, reflect: true }) overview = false;
  /** Optional slide transition · "slide" | "fade" | "zoom". When set, the
   *  deck-transition.js plugin is fetched on first navigation. Per-slide
   *  override available via `data-transition` on the slide host. */
  @property({ type: String, reflect: true }) transition: string | null = null;
  /** Carousel-mode auto-advance · milliseconds between slides.
   *  Pauses on hover / focus, restarts on mouse-leave. Resets on any
   *  user-triggered navigation. Use 0 (default) to disable. */
  @property({ type: Number, reflect: true }) autoplay = 0;
  /** Wrap around at the deck edges. When advancing past the last slide,
   *  jump to the first; when going back from the first, jump to the last. */
  @property({ type: Boolean, reflect: true }) loop = false;
  /** Enable pointer-driven horizontal swipe for navigation (touch + mouse).
   *  Translates a swipe ≥ 60 px into an advance / back navigation. */
  @property({ type: Boolean, reflect: true }) swipe = false;

  // Flat list of all <deck-*> children (excluding deck-root itself)
  private slides: Slide[] = [];
  // 2D index · chapters are bounded by <deck-section> elements
  private chapters: Chapter[] = [];
  // Cached teardown for the overview mount (the module is imported lazily)
  private _overviewTeardown: (() => void) | null = null;
  // True after the transition plugin has been fetched once
  private _transitionLoaded = false;
  // Autoplay timer + paused state · paused while overview/help/hover is up
  private _autoplayTimer: number | null = null;
  private _autoplayPaused = false;
  // Swipe tracking · start coordinates and the active pointer id
  private _swipeStartX = 0;
  private _swipeStartY = 0;
  private _swipePointerId: number | null = null;

  override firstUpdated(): void {
    this.slides = Array.from(this.querySelectorAll<Slide>(':scope > *')).filter((el) =>
      el.tagName?.toLowerCase().startsWith('deck-') && el.tagName?.toLowerCase() !== 'deck-root'
    );
    this._buildChapters();
    this._readHash(true);
    this._applyActive();
    this._applyStep();
    this._updateUI();
    // Chapters are known only after firstUpdated; re-render so the kb hint
    // can show ↑↓ when 2D navigation applies.
    this.requestUpdate();
    window.addEventListener('keydown', this._onKey);
    window.addEventListener('hashchange', this._onHash);
    if (this.autoplay > 0) this._startAutoplay();
    if (this.swipe) {
      this.addEventListener('pointerdown', this._onPointerDown);
      this.addEventListener('pointerup',   this._onPointerUp);
      this.addEventListener('pointercancel', this._onPointerUp);
      // Pause autoplay while user hovers · resume on leave
      this.addEventListener('mouseenter', this._onHoverEnter);
      this.addEventListener('mouseleave', this._onHoverLeave);
    } else if (this.autoplay > 0) {
      this.addEventListener('mouseenter', this._onHoverEnter);
      this.addEventListener('mouseleave', this._onHoverLeave);
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener('keydown', this._onKey);
    window.removeEventListener('hashchange', this._onHash);
    this._stopAutoplay();
    this.removeEventListener('pointerdown',  this._onPointerDown);
    this.removeEventListener('pointerup',    this._onPointerUp);
    this.removeEventListener('pointercancel', this._onPointerUp);
    this.removeEventListener('mouseenter',   this._onHoverEnter);
    this.removeEventListener('mouseleave',   this._onHoverLeave);
  }

  /* ── Autoplay ─────────────────────────────────────────────────── */
  private _startAutoplay(): void {
    this._stopAutoplay();
    if (this.autoplay <= 0 || this._autoplayPaused) return;
    this._autoplayTimer = window.setInterval(() => this._autoTick(), this.autoplay);
  }
  private _stopAutoplay(): void {
    if (this._autoplayTimer !== null) {
      window.clearInterval(this._autoplayTimer);
      this._autoplayTimer = null;
    }
  }
  private _autoTick(): void {
    if (this.overview) return;
    const atEnd = this.current >= this.slides.length - 1 && this.step >= this._maxSteps();
    if (atEnd && this.loop) this._goTo(0);
    else this._advance();
  }
  private _onHoverEnter = (): void => { this._autoplayPaused = true; this._stopAutoplay(); };
  private _onHoverLeave = (): void => { this._autoplayPaused = false; if (this.autoplay > 0) this._startAutoplay(); };

  /* ── Swipe ────────────────────────────────────────────────────── */
  private _onPointerDown = (e: PointerEvent): void => {
    if (!this.swipe || e.pointerType === 'mouse' && e.button !== 0) return;
    // Ignore swipes that start inside an interactive child (links, inputs, kbd-hint, …)
    const target = e.target as HTMLElement | null;
    if (target?.closest('a, button, input, textarea, [contenteditable]')) return;
    this._swipePointerId = e.pointerId;
    this._swipeStartX = e.clientX;
    this._swipeStartY = e.clientY;
  };
  private _onPointerUp = (e: PointerEvent): void => {
    if (this._swipePointerId === null || e.pointerId !== this._swipePointerId) return;
    const dx = e.clientX - this._swipeStartX;
    const dy = e.clientY - this._swipeStartY;
    this._swipePointerId = null;
    // Require a horizontal swipe at least 60 px and ≥ 2× the vertical drift
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 2) return;
    this._stopAutoplay();
    if (dx < 0) this._advance(); else this._back();
    if (this.autoplay > 0 && !this._autoplayPaused) this._startAutoplay();
  };

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

  /** True when at least one chapter has multiple slides and there are 2+ chapters. */
  private _has2DNav(): boolean {
    return this.chapters.some((c) => c.slides.length > 1) && this.chapters.length > 1;
  }

  /** Flat index → {chapter, intra-chapter index}. */
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
    const h = `#${this.current + 1}` + (this.step > 0 ? `.${this.step}` : '');
    if (location.hash === h) return;
    try {
      history.replaceState(null, '', h);
    } catch {
      // srcdoc / sandboxed iframes have an opaque origin · replaceState to a
      // real URL throws SecurityError. The slide already updated visually, so
      // the deck still navigates · deep-linking is just unavailable when the
      // deck is embedded this way (preview thumbnails on the rikiki site).
    }
  }

  private _onKey = (e: KeyboardEvent): void => {
    if (e.target && (e.target as HTMLElement).matches?.('input,textarea,[contenteditable]')) return;

    // Any user keyboard input resets the autoplay countdown so an explicit
    // press doesn't immediately get followed by an auto-advance.
    if (this.autoplay > 0 && !this._autoplayPaused) {
      this._startAutoplay();
    }

    // Overview mode swallows most keys · only O / Esc / Enter exit it.
    if (this.overview) {
      if (e.key === 'Escape' || e.key === 'o' || e.key === 'O' || e.key === 'Enter') {
        e.preventDefault();
        this.overview = false;
      }
      return;
    }

    // Black / white screen (PowerPoint-style clicker keys: B, W, period, comma)
    if (this.blank) {
      e.preventDefault();
      this.blank = null;
      return;
    }
    if (e.key === '.' || e.key === 'b' || e.key === 'B') { e.preventDefault(); this.blank = 'black'; return; }
    if (e.key === ',' || e.key === 'w' || e.key === 'W') { e.preventDefault(); this.blank = 'white'; return; }

    if (e.key === '?' || e.key === 'h' || e.key === 'H') { void this._toggleHelp(); return; }
    if (e.key === 'Escape')                              { void this._closeHelp(); return; }
    if (e.key === 'o' || e.key === 'O')                  { e.preventDefault(); this.overview = true; return; }
    if (e.key === 'p' || e.key === 'P')                  { e.preventDefault(); void this._togglePresenter(); return; }
    if (e.key === 'Home')                                { this._goTo(0); return; }
    if (e.key === 'End')                                 { this._goTo(this.slides.length - 1); return; }
    if (e.key === ' ' || e.key === 'PageDown')           { e.preventDefault(); this._advance(); return; }
    if (e.key === 'PageUp')                              { e.preventDefault(); this._back(); return; }

    if (this._has2DNav()) {
      // Two axes, both with linear fallback at edges:
      //   ←/→ : previous/next chapter · falls back to linear at deck edges.
      //   ↑/↓ : sub-slide within current chapter · falls back to linear at
      //         chapter boundaries so holding ↓ walks the whole deck.
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

  /** Lazy-import the help module the first time the user opens it. */
  private async _toggleHelp(): Promise<void> {
    const mod = await import('./deck-help.js');
    mod.toggleHelp(this);
  }

  /** Lazy-import the presenter (speaker-notes window) plugin on first P press. */
  private async _togglePresenter(): Promise<void> {
    const mod = await import('./deck-presenter.js');
    mod.installPresenter(this);
  }
  private async _closeHelp(): Promise<void> {
    const mod = await import('./deck-help.js');
    mod.closeHelp(this);
  }

  /** Lazy-import the overview module the first time the user opens it. */
  private async _renderOverviewIfActive(): Promise<void> {
    if (!this.overview) {
      this._overviewTeardown?.();
      this._overviewTeardown = null;
      return;
    }
    const { mountOverview } = await import('./deck-overview.js');
    this._overviewTeardown = mountOverview(this, {
      slides: this.slides,
      chapters: this.chapters,
      currentIdx: this.current,
      onPick: (idx) => {
        this.overview = false;
        this._goTo(idx);
      },
    });
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
    } else if (this.loop) {
      this._goTo(0);
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
    } else if (this.loop) {
      this._goTo(this.slides.length - 1);
      this.step = this._maxSteps();
      this._applyStep();
      this._updateUI();
      this._writeHash();
    }
  }

  private _goTo(idx: number): void {
    this.current = Math.max(0, Math.min(this.slides.length - 1, idx));
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
    const previous = this.slides.find((s) => s.hasAttribute('active')) ?? null;
    const next = this.slides[this.current] ?? null;
    this.slides.forEach((s, i) => {
      const isCurrent = i === this.current;
      s.toggleAttribute('active', isCurrent);
      if (isCurrent) {
        s.querySelectorAll<HTMLElement & { render?: () => void }>('deck-mermaid')
          .forEach((m) => m.render?.());
      }
    });
    // Lazy-load the transition plugin the first time we navigate when the
    // user has opted in via the `transition` attribute. The plugin attaches
    // its own listener for the `slide-change` event below.
    if (this.transition && !this._transitionLoaded) {
      this._transitionLoaded = true;
      void import('./deck-transition.js').then((m) => m.installTransitions(this));
    }
    if (previous !== next) {
      this.dispatchEvent(new CustomEvent('slide-change', {
        detail: { current: next, previous },
        bubbles: false,
      }));
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
    void this._renderOverviewIfActive();
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
        <kbd>P</kbd>
        <span>·</span>
        <kbd>?</kbd>
      </div>
      <slot></slot>
      ${this.blank ? html`<div id="blank" data-tone="${this.blank}" @click=${() => { this.blank = null; }}></div>` : ''}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'deck-root': DeckRoot;
  }
}
