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
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      background: var(--deck-letterbox-bg, var(--deck-root-bg, var(--rik-surface-page)));
    }
    /* Zoom-to-fit · the stage is a fixed logical canvas (1920×1080 by default)
       scaled uniformly to fit the viewport, so every slide keeps an identical
       layout at any window size · letterboxed when the screen aspect differs.
       --deck-scale is computed in JS on resize (see _applyScale); the stage is a
       size container so the slides' cqw/cqh resolve against the canvas. */
    #stage {
      flex: none;
      width: calc(var(--deck-canvas-w, 1920) * 1px);
      height: calc(var(--deck-canvas-h, 1080) * 1px);
      transform: scale(var(--deck-scale, 1));
      transform-origin: center center;
      container-type: size;
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
      cursor: pointer;
    }
    #kb-hint kbd:hover { border-color: var(--rik-accent); }
    #kb-hint .sep { opacity: 0.4; }

    #nav-arrows {
      position: fixed; bottom: 2.4rem; right: 1.5rem;
      display: flex; gap: 4px;
      z-index: 100;
      opacity: var(--deck-root-nav-opacity, 0.35);
      transition: opacity 0.2s ease;
    }
    #nav-arrows:hover { opacity: 1; }
    .nav-btn {
      appearance: none; cursor: pointer;
      width: 30px; height: 30px;
      display: grid; place-items: center;
      font: 700 1rem/1 var(--rik-font-mono);
      color: var(--deck-root-nav-color, var(--rik-text-default));
      background: var(--deck-root-nav-bg, var(--rik-surface-raised));
      border: 1px solid var(--rik-border-default);
      border-radius: 6px;
      padding: 0;
    }
    .nav-btn:hover:not(:disabled) { border-color: var(--rik-accent); }
    .nav-btn:disabled { opacity: 0.3; cursor: default; }

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
  /** Fixed-viewport mode · the deck renders into a fixed-aspect canvas that is
   *  letterboxed to fit any screen, so layouts never reflow between displays.
   *  Opt-in · the default stays fluid (100vw × 100vh). */
  @property({ type: Boolean, reflect: true }) fixed = false;
  /** Logical canvas size for fixed mode · defaults to 1920 × 1080 (16:9).
   *  Only the ratio and the rem baseline depend on these · the canvas is then
   *  scaled by CSS to fill the window. */
  @property({ type: Number }) width = 1920;
  @property({ type: Number }) height = 1080;
  /** Hide the bottom-left keyboard-hint chip (the ←/→ · O · P · ? row). */
  @property({ type: Boolean, reflect: true, attribute: 'no-hint' }) noHint = false;
  /** Hide the bottom-right on-screen previous/next navigation arrows. */
  @property({ type: Boolean, reflect: true, attribute: 'no-arrows' }) noArrows = false;
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
  /** Mouse navigation · enabled by default. Set to "none" to disable, or to a
   *  space-separated subset of "click wheel arrows aux" to pick mechanisms. */
  @property({ type: String, reflect: true, attribute: 'mouse-nav' }) mouseNav: string | null = null;

  /** Navigation model · `nav="2d"` opts into chapter/slide grid navigation
   *  (←→ between chapters, ↑↓ within). Default is linear: arrows always move to
   *  the next/previous slide regardless of `<deck-section>` structure. */
  @property({ type: String, reflect: true }) nav: string | null = null;

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
  // Mouse-nav click guard · pointerdown coords to tell clicks from drags
  private _navDownX = 0;
  private _navDownY = 0;
  // Wheel navigation · deltaY accumulation + lockout against trackpad inertia
  private _wheelAccum = 0;
  private _wheelLockUntil = 0;

  override firstUpdated(): void {
    this._applyCanvasVars();
    this._applyScale();
    window.addEventListener('resize', this._applyScale);
    this._scopeSlideStyles();
    this.slides = Array.from(this.querySelectorAll<Slide>(':scope > *')).filter(
      (el) =>
        el.tagName?.toLowerCase().startsWith('deck-') && el.tagName?.toLowerCase() !== 'deck-root',
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
    this.addEventListener('pointerdown', this._onNavPointerDown);
    this.addEventListener('click', this._onClickNav);
    this.addEventListener('wheel', this._onWheel, { passive: false });
    window.addEventListener('mouseup', this._onAuxUp);
    window.addEventListener('auxclick', this._onAuxClick);
    if (this.autoplay > 0) this._startAutoplay();
    if (this.swipe) {
      this.addEventListener('pointerdown', this._onPointerDown);
      this.addEventListener('pointerup', this._onPointerUp);
      this.addEventListener('pointercancel', this._onPointerUp);
      // Pause autoplay while user hovers · resume on leave
      this.addEventListener('mouseenter', this._onHoverEnter);
      this.addEventListener('mouseleave', this._onHoverLeave);
    } else if (this.autoplay > 0) {
      this.addEventListener('mouseenter', this._onHoverEnter);
      this.addEventListener('mouseleave', this._onHoverLeave);
    }
  }

  /** Confine author `<style scoped>` blocks to their own slide. A light-DOM
   *  <style> is a global stylesheet by default, so a per-slide tweak would
   *  bleed across the whole deck. Wrapping its body in a native @scope rule
   *  (whose implicit root is the style's parent slide) limits it to that slide
   *  with no selector rewriting · plain CSS inside keeps working unchanged. */
  private _scopeSlideStyles(): void {
    this.querySelectorAll<HTMLStyleElement>('style[scoped]').forEach((el) => {
      if (el.dataset['rikScoped']) return;
      el.dataset['rikScoped'] = '1';
      el.textContent = `@scope {\n${el.textContent ?? ''}\n}`;
    });
  }

  /** Publish the logical canvas size on the document root so both the
   *  `html:has(deck-root)` rem-baseline rule and the shadow `#stage` (via
   *  custom-property inheritance) size against the same numbers. */
  private _applyCanvasVars(): void {
    const root = document.documentElement;
    root.style.setProperty('--deck-canvas-w', String(this.width));
    root.style.setProperty('--deck-canvas-h', String(this.height));
  }

  /** Uniform zoom-to-fit · scale the fixed logical canvas to the largest size
   *  that still fits the viewport, so the slide layout is identical at any
   *  window size (letterboxed when the aspect differs). Recomputed on resize. */
  private _applyScale = (): void => {
    const scale = Math.min(window.innerWidth / this.width, window.innerHeight / this.height);
    this.style.setProperty('--deck-scale', String(scale));
  };

  /** Make the letterbox bands match the active slide's background, so a scaled
   *  deck blends seamlessly into the bands instead of sitting on a contrasting
   *  frame. A slide with no background of its own (transparent) shows the page
   *  surface · removing the override lets the bands fall back to that same
   *  surface, which stays seamless too. */
  private _applyLetterbox(slide: Slide | null): void {
    const bg = slide ? getComputedStyle(slide).backgroundColor : '';
    const opaque = bg && bg !== 'transparent' && !/,\s*0\s*\)$/.test(bg);
    if (opaque) this.style.setProperty('--deck-letterbox-bg', bg);
    else this.style.removeProperty('--deck-letterbox-bg');
  }

  /** Injected once per document · true after the global baseline is in place. */
  private static _globalsInjected = false;

  /** The scaling baseline is a framework concern, not a theme one: inject it
   *  globally so any theme (or none) gets it. The rem unit tracks the logical
   *  canvas height — the #stage transform does the responsive scaling — and the
   *  page never scrolls (so the letterbox is the only thing outside a slide). */
  private static _injectGlobals(): void {
    if (DeckRoot._globalsInjected || typeof document === 'undefined') return;
    DeckRoot._globalsInjected = true;
    const style = document.createElement('style');
    style.id = 'rik-deck-globals';
    style.textContent =
      'html{font-size:calc(var(--deck-canvas-h,1080)*0.0235px)}html,body{margin:0;overflow:hidden}';
    document.head.appendChild(style);
  }

  override connectedCallback(): void {
    super.connectedCallback();
    DeckRoot._injectGlobals();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    document.documentElement.style.removeProperty('--deck-canvas-w');
    document.documentElement.style.removeProperty('--deck-canvas-h');
    window.removeEventListener('resize', this._applyScale);
    window.removeEventListener('keydown', this._onKey);
    window.removeEventListener('hashchange', this._onHash);
    this.removeEventListener('pointerdown', this._onNavPointerDown);
    this.removeEventListener('click', this._onClickNav);
    this.removeEventListener('wheel', this._onWheel);
    window.removeEventListener('mouseup', this._onAuxUp);
    window.removeEventListener('auxclick', this._onAuxClick);
    this._stopAutoplay();
    this.removeEventListener('pointerdown', this._onPointerDown);
    this.removeEventListener('pointerup', this._onPointerUp);
    this.removeEventListener('pointercancel', this._onPointerUp);
    this.removeEventListener('mouseenter', this._onHoverEnter);
    this.removeEventListener('mouseleave', this._onHoverLeave);
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
  private _onHoverEnter = (): void => {
    this._autoplayPaused = true;
    this._stopAutoplay();
  };
  private _onHoverLeave = (): void => {
    this._autoplayPaused = false;
    if (this.autoplay > 0) this._startAutoplay();
  };

  /** Any explicit user navigation resets the autoplay countdown so the press
   *  isn't immediately followed by an auto-advance. */
  private _restartAutoplay(): void {
    if (this.autoplay > 0 && !this._autoplayPaused) this._startAutoplay();
  }

  /* ── Swipe ────────────────────────────────────────────────────── */
  private _onPointerDown = (e: PointerEvent): void => {
    if (!this.swipe || (e.pointerType === 'mouse' && e.button !== 0)) return;
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
    if (dx < 0) this._advance();
    else this._back();
    this._restartAutoplay();
  };

  /* ── Mouse navigation ─────────────────────────────────────────── */
  private _onNavPointerDown = (e: PointerEvent): void => {
    this._navDownX = e.clientX;
    this._navDownY = e.clientY;
  };

  /** Click anywhere → advance (Shift+click → back) · PowerPoint-style.
   *  Skips interactive targets, our own chrome, text selections and drags. */
  private _onClickNav = (e: MouseEvent): void => {
    if (!this._mouseEnabled('click')) return;
    if (this.overview || this.blank) return;
    if (this.shadowRoot?.querySelector('#kb-overlay.open')) return;
    if (Math.hypot(e.clientX - this._navDownX, e.clientY - this._navDownY) > 5) return;
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed) return;
    const interactive = e.composedPath().some((n) => {
      if (!(n instanceof HTMLElement)) return false;
      if (n.matches?.('a, button, input, textarea, select, [contenteditable], [data-no-advance]'))
        return true;
      return (
        n.id === 'blank' ||
        n.id === 'kb-overlay' ||
        n.id === 'overview-grid' ||
        n.id === 'nav-arrows' ||
        n.id === 'kb-hint'
      );
    });
    if (interactive) return;
    this._restartAutoplay();
    if (e.shiftKey) this._back();
    else this._advance();
  };

  /** Wheel over a scrollable descendant (overflowing code block, …) must stay
   *  a native scroll · only wheel on the deck shell itself navigates. */
  private _wheelTargetScrolls(e: WheelEvent): boolean {
    const down = e.deltaY > 0;
    const right = e.deltaX > 0;
    for (const n of e.composedPath()) {
      if (n === this) return false;
      // Element, not HTMLElement · an overflowing inline <svg> (a zoomable
      // diagram) is an SVGElement and must scroll natively too.
      if (!(n instanceof Element)) continue;
      const canY = n.scrollHeight > n.clientHeight;
      const canX = n.scrollWidth > n.clientWidth;
      if (!canY && !canX) continue;
      const cs = getComputedStyle(n);
      // Only treat it as a native scroll while the wheel can still move it in
      // that direction · at the scroll boundary, let the deck navigate instead
      // of trapping the user inside an already-bottomed-out block.
      if (canY && /auto|scroll/.test(cs.overflowY)) {
        if (down ? n.scrollTop + n.clientHeight < n.scrollHeight - 1 : n.scrollTop > 0) return true;
      }
      if (canX && /auto|scroll/.test(cs.overflowX)) {
        if (right ? n.scrollLeft + n.clientWidth < n.scrollWidth - 1 : n.scrollLeft > 0)
          return true;
      }
    }
    return false;
  }

  private _onWheel = (e: WheelEvent): void => {
    if (!this._mouseEnabled('wheel') || this.overview || this.blank) return;
    if (this._wheelTargetScrolls(e)) return;
    e.preventDefault();
    const now = performance.now();
    if (now < this._wheelLockUntil) return;
    this._wheelAccum += e.deltaY;
    if (Math.abs(this._wheelAccum) < 50) return;
    const forward = this._wheelAccum > 0;
    this._wheelAccum = 0;
    this._wheelLockUntil = now + 400;
    this._restartAutoplay();
    if (forward) this._advance();
    else this._back();
  };

  /** Mouse back/forward buttons (3/4) · act on mouseup, suppress the
   *  browser's history navigation best-effort on auxclick. */
  private _onAuxUp = (e: MouseEvent): void => {
    if (!this._mouseEnabled('aux')) return;
    if (e.button !== 3 && e.button !== 4) return;
    e.preventDefault();
    this._restartAutoplay();
    if (e.button === 3) this._back();
    else this._advance();
  };

  private _onAuxClick = (e: MouseEvent): void => {
    if (!this._mouseEnabled('aux')) return;
    if (e.button === 3 || e.button === 4) e.preventDefault();
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

  /** 2D navigation is opt-in via `nav="2d"` · it also needs the structure to
   *  make sense (2+ chapters, at least one with multiple slides). Without the
   *  opt-in, arrows stay linear so a sectioned deck doesn't surprise the author
   *  by remapping ← / → to chapter jumps. */
  private _has2DNav(): boolean {
    return (
      this.nav === '2d' &&
      this.chapters.length > 1 &&
      this.chapters.some((c) => c.slides.length > 1)
    );
  }

  private _mouseEnabled(kind: 'click' | 'wheel' | 'arrows' | 'aux'): boolean {
    const v = (this.mouseNav ?? 'all').trim();
    if (v === 'none') return false;
    if (v === '' || v === 'all') return true;
    return v.split(/\s+/).includes(kind);
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
    // Clamp an out-of-range chapter to the last one rather than snapping back
    // to slide 0 · a deep link to a coordinate that no longer exists (e.g. a
    // chapter removed while iterating) should land on the nearest valid slide.
    const chap = this.chapters[Math.max(0, Math.min(this.chapters.length - 1, c))];
    if (!chap) return 0;
    return chap.startIdx + Math.max(0, Math.min(chap.slides.length - 1, i));
  }

  private _onHash = (): void => {
    this._readHash(false);
  };

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
    // Clamp the step to the slide's range · a deep link to a click that no
    // longer exists (e.g. a bullet removed while iterating) settles on the last
    // available step instead of over-stepping. Skip the upper clamp when the
    // count is still 0 (plugins may not have computed it yet on cold load).
    const maxStep = this._maxSteps();
    this.step = maxStep > 0 ? Math.max(0, Math.min(maxStep, stepTarget)) : Math.max(0, stepTarget);
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

    // Any user keyboard input resets the autoplay countdown.
    this._restartAutoplay();

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
    if (e.key === '.' || e.key === 'b' || e.key === 'B') {
      e.preventDefault();
      this.blank = 'black';
      return;
    }
    if (e.key === ',' || e.key === 'w' || e.key === 'W') {
      e.preventDefault();
      this.blank = 'white';
      return;
    }

    if (e.key === '?' || e.key === 'h' || e.key === 'H') {
      void this._toggleHelp();
      return;
    }
    if (e.key === 'Escape') {
      void this._closeHelp();
      return;
    }
    if (e.key === 'o' || e.key === 'O') {
      e.preventDefault();
      this.overview = true;
      return;
    }
    if (e.key === 'p' || e.key === 'P') {
      e.preventDefault();
      void this._togglePresenter();
      return;
    }
    if (e.key === 'Home') {
      this._goTo(0);
      return;
    }
    if (e.key === 'End') {
      this._goTo(this.slides.length - 1);
      return;
    }
    if (e.key === ' ' || e.key === 'PageDown') {
      e.preventDefault();
      this._advance();
      return;
    }
    if (e.key === 'PageUp') {
      e.preventDefault();
      this._back();
      return;
    }

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
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        this._advance();
        return;
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        this._back();
        return;
      }
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
      try {
        return JSON.parse(code.getAttribute('step-groups')!).length;
      } catch {
        /* noop */
      }
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
        s.querySelectorAll<HTMLElement & { render?: () => void }>('deck-mermaid').forEach((m) => {
          m.render?.();
        });
      }
    });
    this._applyLetterbox(next);
    // Lazy-load the transition plugin the first time we navigate when the
    // user has opted in via the `transition` attribute. The plugin attaches
    // its own listener for the `slide-change` event below.
    if (this.transition && !this._transitionLoaded) {
      this._transitionLoaded = true;
      void import('./deck-transition.js').then((m) => m.installTransitions(this));
    }
    if (previous !== next) {
      this.dispatchEvent(
        new CustomEvent('slide-change', {
          detail: { current: next, previous },
          bubbles: false,
        }),
      );
    }
  }

  private _applyStep(): void {
    const slide = this.slides[this.current];
    if (!slide) return;
    slide.applyStep?.(this.step);
    slide.querySelectorAll<Slide>('*').forEach((el) => {
      el.applyStep?.(this.step);
    });
    slide.querySelectorAll<HTMLElement>('[data-step-block]').forEach((el) => {
      const n = parseInt(el.dataset['stepBlock']!, 10);
      el.style.transition = 'opacity 0.25s ease';
      el.style.opacity = this.step === 0 || n <= this.step ? '1' : '0.15';
    });
  }

  private _updateUI(): void {
    const total = this.slides.length;
    const n = this.current + 1;
    const progress = this.renderRoot.querySelector<HTMLDivElement>('#progress');
    const counter = this.renderRoot.querySelector<HTMLDivElement>('#counter');
    const dots = this.renderRoot.querySelector<HTMLDivElement>('#step-dots');
    if (progress) progress.style.width = (n / total) * 100 + '%';
    if (counter) counter.textContent = `${n} / ${total}`;
    const max = this._maxSteps();
    if (dots) {
      dots.innerHTML =
        max === 0
          ? ''
          : Array.from(
              { length: max },
              (_, i) => `<div class="dot${i < this.step ? ' active' : ''}"></div>`,
            ).join('');
    }
  }

  override updated(): void {
    this._updateUI();
    void this._renderOverviewIfActive();
  }

  private _navArrows(): unknown {
    if (this.noArrows || !this._mouseEnabled('arrows') || this.overview) return '';
    const total = this.slides.length;
    if (total === 0) return '';
    const atStart = this.current === 0 && this.step === 0;
    const atEnd = this.current >= total - 1 && this.step >= this._maxSteps();
    if (this._has2DNav()) {
      const { c, i } = this._coords(this.current);
      const chap = this.chapters[c];
      return html`
        <div id="nav-arrows">
          <button class="nav-btn" title="Previous chapter" ?disabled=${!this.loop && this.current === 0}
            @click=${() => (c > 0 ? this._goToCoords(c - 1, 0) : this._back())}>&lsaquo;</button>
          <button class="nav-btn" title="Up" ?disabled=${i === 0}
            @click=${() => this._goToCoords(c, i - 1)}>&uarr;</button>
          <button class="nav-btn" title="Down" ?disabled=${!chap || i + 1 >= chap.slides.length}
            @click=${() => this._goToCoords(c, i + 1)}>&darr;</button>
          <button class="nav-btn" title="Next chapter" ?disabled=${!this.loop && atEnd}
            @click=${() => (c + 1 < this.chapters.length ? this._goToCoords(c + 1, 0) : this._advance())}>&rsaquo;</button>
        </div>`;
    }
    return html`
      <div id="nav-arrows">
        <button class="nav-btn" title="Previous" ?disabled=${!this.loop && atStart}
          @click=${() => this._back()}>&lsaquo;</button>
        <button class="nav-btn" title="Next" ?disabled=${!this.loop && atEnd}
          @click=${() => this._advance()}>&rsaquo;</button>
      </div>`;
  }

  override render(): unknown {
    return html`
      <div id="progress"></div>
      <div id="counter"></div>
      <div id="step-dots"></div>
      ${
        this.noHint
          ? ''
          : html`
      <div id="kb-hint">
        <kbd title="Previous" @click=${() => this._back()}>←</kbd
        ><kbd title="Next" @click=${() => this._advance()}>→</kbd>
        ${
          this._has2DNav()
            ? html`<kbd title="Previous" @click=${() => this._back()}>↑</kbd
            ><kbd title="Next" @click=${() => this._advance()}>↓</kbd>`
            : ''
        }
        <span>·</span>
        <kbd title="Overview" @click=${() => {
          this.overview = !this.overview;
        }}>O</kbd>
        <span>·</span>
        <kbd title="Presenter" @click=${() => void this._togglePresenter()}>P</kbd>
        <span>·</span>
        <kbd title="Help" @click=${() => void this._toggleHelp()}>?</kbd>
      </div>`
      }
      ${this._navArrows()}
      <div id="stage"><slot></slot></div>
      ${
        this.blank
          ? html`<div id="blank" data-tone="${this.blank}" @click=${() => {
              this.blank = null;
            }}></div>`
          : ''
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'deck-root': DeckRoot;
  }
}
