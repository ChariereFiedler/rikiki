// ════════════════════════════════════════════════════════════════
// <deck-root> · navigation, hash routing, slide management.
//
// Overview mode (`O`) and the keyboard help overlay (`?`) live in
// separate modules (deck-overview.js, deck-help.js) that are fetched
// the first time the user activates them · they aren't in this bundle.
// ════════════════════════════════════════════════════════════════

import { LitElement, html, css, type PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { isOpaqueColor } from './color.js';

type Slide = HTMLElement & {
  applyStep?: (step: number) => void;
  render?: () => unknown;
};

type Chapter = { startIdx: number; slides: Slide[] };

/** The stable surface a plugin may touch · deliberately small so plugins never
 *  reach into the engine's private internals (the old approach monkey-patched
 *  the prototype's private methods, which broke silently on any rename). */
export interface DeckContext {
  /** The deck-root element · for ad-hoc first-party coordination markers. */
  readonly host: DeckRoot;
  readonly current: number;
  readonly step: number;
  readonly slides: readonly Slide[];
  requestUpdate(): void;
}

/** A deck-root extension. Register one with `deckRoot.use(plugin)` · the engine
 *  calls the optional hooks at the matching points. All hooks are optional so a
 *  plugin implements only what it needs. */
export interface DeckPlugin {
  /** Unique name · registration is idempotent by this. */
  name: string;
  /** Run once on registration · may return a teardown run on unregister. */
  // biome-ignore lint/suspicious/noConfusingVoidType: a teardown or nothing · mirrors React's effect cleanup contract
  setup?(ctx: DeckContext): void | (() => void);
  /** Contribute to the active slide's step count · combined with the engine's
   *  own count (and other plugins') as a maximum. Must not call back into the
   *  engine's step count. */
  steps?(slide: Slide, ctx: DeckContext): number;
  /** React after the engine applied a step to the active slide. */
  applyStep?(step: number, slide: Slide, ctx: DeckContext): void;
  /** Around-advice for navigation · call `proceed()` to run the real navigation
   *  (optionally wrapped, e.g. inside a View Transition). Return a truthy value
   *  when handled · otherwise the engine navigates normally. Only the first
   *  registered plugin with a `navigate` hook owns navigation. */
  // biome-ignore lint/suspicious/noConfusingVoidType: truthy = handled · returning nothing means not handled
  navigate?(to: number, ctx: DeckContext, proceed: () => void): boolean | void;
}

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
      width: 100%;
      height: 100%;
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
      transform: translate(var(--deck-pan-x, 0px), var(--deck-pan-y, 0px))
        scale(calc(var(--deck-scale, 1) * var(--deck-zoom, 1)));
      transform-origin: center center;
      container-type: size;
    }
    /* Fluid deck, or a single per-slide fluid escape (host gets the unfixed
       marker): the stage fills its box and drops the zoom-to-fit transform ·
       the size container stays so cqw/cqh still resolve, against the real box. */
    :host([fluid]) #stage,
    :host([unfixed]) #stage {
      width: 100%;
      height: 100%;
      transform: none;
    }
    /* While magnified beyond fit (slide zoom), the deck is grab-to-pan. */
    :host([data-zoomed]) { cursor: grab; }
    :host([data-zoomed][data-panning]) { cursor: grabbing; }
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
  /** Set by the presenter plugin while the speaker popup is open. The main
   *  window is then the projected one, so its key-hint chips and nav arrows are
   *  noise · hide them until the popup closes (issue #6). */
  @state() presenterActive = false;
  @property({ type: Boolean, reflect: true }) overview = false;
  /** Fluid rendering · the deck fills its box and reflows like a web page
   *  (no logical canvas, no zoom-to-fit scale, no letterbox). Opt-in · the
   *  default stays the uniform zoom-to-fit canvas. Toggleable at runtime ·
   *  flipping it re-applies the canvas vars, scale and letterbox both ways. */
  @property({ type: Boolean, reflect: true }) fluid = false;
  /** Logical canvas size · defaults to 1920 × 1080 (16:9). Only the ratio and
   *  the rem baseline depend on these · the canvas is then scaled uniformly to
   *  fill the window (see _applyScale). */
  @property({ type: Number }) width = 1920;
  @property({ type: Number }) height = 1080;
  /** Hide the bottom-left keyboard-hint chip (the ←/→ · O · P · ? row). */
  @property({ type: Boolean, reflect: true, attribute: 'no-hint' }) noHint = false;
  /** Hide the bottom-right on-screen previous/next navigation arrows. */
  @property({ type: Boolean, reflect: true, attribute: 'no-arrows' }) noArrows = false;
  /** Disable slide zoom (Ctrl/⌘+wheel, pinch, +/-/0) · on by default. */
  @property({ type: Boolean, reflect: true, attribute: 'no-zoom' }) noZoom = false;
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
  // Slide zoom · 1 = fit, panX/panY in viewport px.
  private _zoom = 1;
  private _panX = 0;
  private _panY = 0;
  private static readonly ZOOM_MAX = 4;
  private static readonly ZOOM_STEP = 1.25;
  private static readonly ZOOM_WHEEL_SENSITIVITY = 0.002;
  // Registered plugins (see use()) and the lazily-built, frozen context handed
  // to their hooks.
  private _plugins: DeckPlugin[] = [];
  private _ctx: DeckContext | null = null;

  /** Build (once) the stable context object plugins receive · live getters so a
   *  plugin always sees the engine's current position (the object itself is
   *  cached, not frozen). */
  private _context(): DeckContext {
    if (this._ctx) return this._ctx;
    const host = this;
    this._ctx = {
      host,
      get current() {
        return host.current;
      },
      get step() {
        return host.step;
      },
      get slides() {
        return host.slides;
      },
      requestUpdate: () => host.requestUpdate(),
    };
    return this._ctx;
  }

  /** Register a plugin · idempotent by name. Returns an unregister function that
   *  runs the plugin's teardown and detaches its hooks. A freshly registered
   *  plugin may change step counts or element visibility, so the active slide is
   *  re-applied immediately (this also covers plugins attached after the deck
   *  has already rendered). */
  use(plugin: DeckPlugin): () => void {
    if (this._plugins.some((p) => p.name === plugin.name)) return () => {};
    if (plugin.navigate && this._plugins.some((p) => p.navigate)) {
      console.warn(
        `[rikiki] plugin "${plugin.name}" has a navigate hook but another plugin already owns navigation · it will be ignored`,
      );
    }
    this._plugins.push(plugin);
    const teardown = plugin.setup?.(this._context());
    this._applyStep();
    this._updateUI();
    return () => {
      const i = this._plugins.indexOf(plugin);
      if (i >= 0) this._plugins.splice(i, 1);
      if (typeof teardown === 'function') teardown();
    };
  }

  override firstUpdated(): void {
    this._installRuntime();
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
  }

  /** Canvas vars, scale and every listener the deck needs while connected.
   *  Mirror of the disconnectedCallback teardown · runs from firstUpdated on
   *  the initial connect, and again from connectedCallback on a re-attach
   *  (firstUpdated only ever runs once per element). */
  private _installRuntime(): void {
    this._applyCanvasVars();
    this._applyScale();
    this._resizeObserver = new ResizeObserver(this._applyScale);
    this._resizeObserver.observe(this);
    window.addEventListener('keydown', this._onKey);
    window.addEventListener('hashchange', this._onHash);
    this.addEventListener('pointerdown', this._onNavPointerDown);
    this.addEventListener('click', this._onClickNav);
    this.addEventListener('wheel', this._onWheel, { passive: false });
    this.addEventListener('pointerdown', this._onPanDown);
    this.addEventListener('pointermove', this._onPanMove);
    this.addEventListener('pointerup', this._onPanUp);
    this.addEventListener('pointercancel', this._onPanUp);
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
  /** True when the whole deck is fluid, or the active slide opts out of the
   *  fixed canvas via its own `fluid` attribute · a per-slide viewport escape
   *  (issue #4). It drives the canvas vars, scale and letterbox exactly like
   *  the deck-wide `fluid` flag, just for that one slide. */
  private _effectiveFluid(): boolean {
    return this.fluid || (this.slides[this.current]?.hasAttribute('fluid') ?? false);
  }

  /** Reflect the active slide's per-slide fluid escape on the host · the
   *  `unfixed` marker that the stage CSS and the injected rem baseline key on ·
   *  then re-apply the canvas vars and scale for the new effective mode. Called
   *  on every slide change · a no-op for a deck that never uses per-slide fluid. */
  private _applySlideFluid(): void {
    const slideFluid = !this.fluid && (this.slides[this.current]?.hasAttribute('fluid') ?? false);
    this.toggleAttribute('unfixed', slideFluid);
    this._applyCanvasVars();
    this._applyScale();
  }

  private _applyCanvasVars(): void {
    const root = document.documentElement;
    // Fluid mode has no logical canvas · clear the vars a prior non-fluid
    // render published (symmetric with the _applyScale / _applyLetterbox
    // guards) so toggling into fluid leaves no stale global state.
    if (this._effectiveFluid()) {
      root.style.removeProperty('--deck-canvas-w');
      root.style.removeProperty('--deck-canvas-h');
      return;
    }
    root.style.setProperty('--deck-canvas-w', String(this.width));
    root.style.setProperty('--deck-canvas-h', String(this.height));
  }

  /** Uniform zoom-to-fit · scale the fixed logical canvas to the largest size
   *  that still fits the host's own box (the viewport for a full-window deck,
   *  the container for an embedded one). Driven by a ResizeObserver. */
  private _applyScale = (): void => {
    if (this._effectiveFluid()) {
      this.style.removeProperty('--deck-scale');
      return;
    }
    const scale = Math.min(this.clientWidth / this.width, this.clientHeight / this.height);
    if (scale > 0) this.style.setProperty('--deck-scale', String(scale));
    if (this._zoom > 1) {
      this._clampPan();
      this._applyZoom();
    }
  };

  private _resizeObserver: ResizeObserver | null = null;

  /* ── Slide zoom ───────────────────────────────────────────────── */

  /** Zoom is live only in the fixed canvas and outside overlays. */
  private _zoomEnabled(): boolean {
    return !this.noZoom && !this._effectiveFluid() && !this.overview && !this.blank;
  }

  /** Publish zoom + pan as custom props the #stage transform reads. */
  private _applyZoom(): void {
    this.style.setProperty('--deck-zoom', String(this._zoom));
    this.style.setProperty('--deck-pan-x', `${this._panX}px`);
    this.style.setProperty('--deck-pan-y', `${this._panY}px`);
    this.toggleAttribute('data-zoomed', this._zoom > 1);
  }

  /** Keep the pan within bounds so the magnified stage always covers the
   *  viewport (no gaps); at fit (zoom 1) it forces re-centring. */
  private _clampPan(): void {
    const fit =
      this.clientWidth && this.clientHeight
        ? Math.min(this.clientWidth / this.width, this.clientHeight / this.height)
        : 1;
    const s = fit * this._zoom;
    const maxX = Math.max(0, (this.width * s - this.clientWidth) / 2);
    const maxY = Math.max(0, (this.height * s - this.clientHeight) / 2);
    this._panX = Math.max(-maxX, Math.min(maxX, this._panX));
    this._panY = Math.max(-maxY, Math.min(maxY, this._panY));
  }

  /** Zoom by a factor, keeping the point at viewport (cx, cy) fixed. */
  private _zoomAt(factor: number, cx: number, cy: number): void {
    if (!this._zoomEnabled()) return;
    const z0 = this._zoom;
    const z1 = Math.max(1, Math.min(DeckRoot.ZOOM_MAX, z0 * factor));
    if (z1 === z0) return;
    const rect = this.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const ratio = z1 / z0;
    this._panX += (cx - centerX - this._panX) * (1 - ratio);
    this._panY += (cy - centerY - this._panY) * (1 - ratio);
    this._zoom = z1;
    this._clampPan();
    this._applyZoom();
  }

  private _resetZoom(): void {
    this._zoom = 1;
    this._panX = 0;
    this._panY = 0;
    this._applyZoom();
  }

  private _panBy(dx: number, dy: number): void {
    this._panX += dx;
    this._panY += dy;
    this._clampPan();
    this._applyZoom();
  }

  /* Drag-to-pan · active only while magnified beyond fit. */
  private _panning = false;
  private _panLastX = 0;
  private _panLastY = 0;

  private _onPanDown = (e: PointerEvent): void => {
    if (this._zoom <= 1 || !this._zoomEnabled()) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const target = e.target as HTMLElement | null;
    if (target?.closest('a, button, input, textarea, select, [contenteditable]')) return;
    this._panning = true;
    this._panLastX = e.clientX;
    this._panLastY = e.clientY;
    this.toggleAttribute('data-panning', true);
    this.setPointerCapture?.(e.pointerId);
  };
  private _onPanMove = (e: PointerEvent): void => {
    if (!this._panning) return;
    this._panBy(e.clientX - this._panLastX, e.clientY - this._panLastY);
    this._panLastX = e.clientX;
    this._panLastY = e.clientY;
  };
  private _onPanUp = (e: PointerEvent): void => {
    if (!this._panning) return;
    this._panning = false;
    this.toggleAttribute('data-panning', false);
    this.releasePointerCapture?.(e.pointerId);
  };

  /** Make the letterbox bands match the active slide's background, so a scaled
   *  deck blends seamlessly into the bands instead of sitting on a contrasting
   *  frame. A slide with no background of its own (transparent) shows the page
   *  surface · removing the override lets the bands fall back to that same
   *  surface, which stays seamless too. */
  private _applyLetterbox(slide: Slide | null): void {
    if (this._effectiveFluid()) {
      this.style.removeProperty('--deck-letterbox-bg');
      return;
    }
    const bg = slide ? getComputedStyle(slide).backgroundColor : '';
    if (bg && isOpaqueColor(bg)) this.style.setProperty('--deck-letterbox-bg', bg);
    else this.style.removeProperty('--deck-letterbox-bg');
  }

  /** The scaling baseline is a framework concern, not a theme one: inject it
   *  globally so any theme (or none) gets it. The rem unit tracks the logical
   *  canvas height · the #stage transform does the responsive scaling · and the
   *  page never scrolls (so the letterbox is the only thing outside a slide).
   *  Guarded by the element id (not a static) so separately-bundled copies of
   *  this class on one page share the same once-per-document semantics.
   *
   *  Every rule is scoped with `:has(> body > deck-root)`, so it is inert
   *  unless a deck is a direct <body> child · i.e. a full-page deck. An
   *  embedded deck (sitting in some container) never matches, so it leaves the
   *  host page's scroll and rem baseline alone.
   *
   *  The `:not([fluid])` rule carries the zoom-to-fit canvas baseline; the
   *  `[fluid]` rule gives a fluid deck the viewport-relative rem baseline
   *  instead. The `[unfixed]` rule (set while the active slide opts out via its
   *  own `fluid` attribute) borrows that same viewport baseline for that one
   *  slide · it comes last so it wins the equal-specificity tie with the
   *  `:not([fluid])` rule. The `height:100%` pair backs the 100% `:host`
   *  sizing. */
  private static _injectGlobals(): void {
    if (typeof document === 'undefined' || document.getElementById('rik-deck-globals')) return;
    const style = document.createElement('style');
    style.id = 'rik-deck-globals';
    style.textContent =
      'html:has(> body > deck-root){overflow:hidden;height:100%}' +
      'html:has(> body > deck-root) body{margin:0;overflow:hidden;height:100%}' +
      'html:has(> body > deck-root:not([fluid])){font-size:calc(var(--deck-canvas-h,1080)*0.0235px)}' +
      'html:has(> body > deck-root[fluid]){font-size:clamp(14px,2.35vh,42px)}' +
      'html:has(> body > deck-root[unfixed]){font-size:clamp(14px,2.35vh,42px)}';
    document.head.appendChild(style);
  }

  override connectedCallback(): void {
    super.connectedCallback();
    DeckRoot._injectGlobals();
    // firstUpdated installs the runtime on the initial connect only · restore
    // it when the element is re-attached after a disconnect teardown.
    if (this.hasUpdated) this._installRuntime();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    document.documentElement.style.removeProperty('--deck-canvas-w');
    document.documentElement.style.removeProperty('--deck-canvas-h');
    // Last deck gone (this element is already detached here) · give the host
    // page its scroll and rem sizing back.
    if (!document.querySelector('deck-root')) {
      document.getElementById('rik-deck-globals')?.remove();
    }
    this._resizeObserver?.disconnect();
    this._resizeObserver = null;
    window.removeEventListener('keydown', this._onKey);
    window.removeEventListener('hashchange', this._onHash);
    this.removeEventListener('pointerdown', this._onNavPointerDown);
    this.removeEventListener('click', this._onClickNav);
    this.removeEventListener('wheel', this._onWheel);
    this.removeEventListener('pointerdown', this._onPanDown);
    this.removeEventListener('pointermove', this._onPanMove);
    this.removeEventListener('pointerup', this._onPanUp);
    this.removeEventListener('pointercancel', this._onPanUp);
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
    if (this._zoom > 1) {
      this._swipePointerId = null;
      return;
    }
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
    if (this._zoom > 1) return; // panning, not advancing
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
    // Ctrl/⌘ + wheel (and trackpad pinch, which fires ctrlKey wheel events) is a
    // zoom gesture: magnify the slide around the cursor. When zoom is disabled
    // (no-zoom / fluid / overlay) let the browser handle its own zoom instead.
    if (e.ctrlKey || e.metaKey) {
      if (!this._zoomEnabled()) return;
      e.preventDefault();
      this._zoomAt(Math.exp(-e.deltaY * DeckRoot.ZOOM_WHEEL_SENSITIVITY), e.clientX, e.clientY);
      return;
    }
    // While magnified, a plain wheel pans the slide instead of navigating.
    if (this._zoom > 1 && this._zoomEnabled()) {
      e.preventDefault();
      this._panBy(-e.deltaX, -e.deltaY);
      return;
    }
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
    const h = `#${this.current + 1}${this.step > 0 ? `.${this.step}` : ''}`;
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

    // Slide zoom · +/= zoom in, - zoom out (centred), 0 resets to fit.
    if (this._zoomEnabled() && (e.key === '+' || e.key === '=' || e.key === '-')) {
      e.preventDefault();
      const rect = this.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const factor = e.key === '-' ? 1 / DeckRoot.ZOOM_STEP : DeckRoot.ZOOM_STEP;
      this._zoomAt(factor, cx, cy);
      return;
    }
    if (e.key === '0' && this._zoom > 1) {
      e.preventDefault();
      this._resetZoom();
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
    let n = this._baseMaxSteps();
    const slide = this.slides[this.current];
    if (slide) {
      for (const p of this._plugins) {
        if (p.steps) n = Math.max(n, p.steps(slide, this._context()));
      }
    }
    return n;
  }

  /** The engine's own step count for the active slide · `steps`/`data-steps`
   *  attribute, or a `deck-code[step-groups]` group count. Plugins extend this
   *  through their `steps` hook (see _maxSteps). */
  private _baseMaxSteps(): number {
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
    // A plugin may own navigation (e.g. wrap it in a View Transition for cross
    // slide morphs) · it receives the real navigation as `proceed`. Only the
    // first plugin with a navigate hook owns it; otherwise navigate normally.
    const nav = this._plugins.find((p) => p.navigate);
    if (nav?.navigate?.(idx, this._context(), () => this._goToNow(idx))) return;
    this._goToNow(idx);
  }

  private _goToNow(idx: number): void {
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
    this._applySlideFluid();
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
    for (const p of this._plugins) {
      p.applyStep?.(this.step, slide, this._context());
    }
  }

  private _updateUI(): void {
    const total = this.slides.length;
    const n = this.current + 1;
    const progress = this.renderRoot.querySelector<HTMLDivElement>('#progress');
    const counter = this.renderRoot.querySelector<HTMLDivElement>('#counter');
    const dots = this.renderRoot.querySelector<HTMLDivElement>('#step-dots');
    if (progress) progress.style.width = `${total > 0 ? (n / total) * 100 : 0}%`;
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

  override updated(changed: PropertyValues<this>): void {
    // A canvas resize after first render must republish the vars and rescale ·
    // firstUpdated only covers the initial values. Toggling `fluid` at runtime
    // goes through the same machinery: turning it off must re-engage the canvas
    // vars and zoom-to-fit scale, turning it on hits their fluid guards (which
    // clear the now-inert custom props). (All calls are idempotent, so the
    // overlap on the very first update cycle is harmless.)
    if (changed.has('width') || changed.has('height') || changed.has('fluid')) {
      this._applyCanvasVars();
      this._applyScale();
    }
    // The canvas vars/scale handle geometry; the letterbox bands also need the
    // active slide, so re-apply them for the current slide on a `fluid` toggle.
    if (changed.has('fluid')) {
      this._applyLetterbox(this.slides[this.current] ?? null);
    }
    this._updateUI();
    void this._renderOverviewIfActive();
  }

  private _navArrows(): unknown {
    if (this.noArrows || this.presenterActive || !this._mouseEnabled('arrows') || this.overview)
      return '';
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
        this.noHint || this.presenterActive
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
