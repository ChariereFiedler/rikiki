import { LitElement, type PropertyValues } from 'lit';
export declare class DeckRoot extends LitElement {
    static styles: import("lit").CSSResult;
    current: number;
    step: number;
    /** When non-null, a full-screen overlay covers the deck (clicker B/./W/,
     *  keys). Pressing any key dismisses it · same convention as PowerPoint. */
    blank: 'black' | 'white' | null;
    overview: boolean;
    /** Logical canvas size · defaults to 1920 × 1080 (16:9). Only the ratio and
     *  the rem baseline depend on these · the canvas is then scaled uniformly to
     *  fill the window (see _applyScale). */
    width: number;
    height: number;
    /** Hide the bottom-left keyboard-hint chip (the ←/→ · O · P · ? row). */
    noHint: boolean;
    /** Hide the bottom-right on-screen previous/next navigation arrows. */
    noArrows: boolean;
    /** Optional slide transition · "slide" | "fade" | "zoom". When set, the
     *  deck-transition.js plugin is fetched on first navigation. Per-slide
     *  override available via `data-transition` on the slide host. */
    transition: string | null;
    /** Carousel-mode auto-advance · milliseconds between slides.
     *  Pauses on hover / focus, restarts on mouse-leave. Resets on any
     *  user-triggered navigation. Use 0 (default) to disable. */
    autoplay: number;
    /** Wrap around at the deck edges. When advancing past the last slide,
     *  jump to the first; when going back from the first, jump to the last. */
    loop: boolean;
    /** Enable pointer-driven horizontal swipe for navigation (touch + mouse).
     *  Translates a swipe ≥ 60 px into an advance / back navigation. */
    swipe: boolean;
    /** Mouse navigation · enabled by default. Set to "none" to disable, or to a
     *  space-separated subset of "click wheel arrows aux" to pick mechanisms. */
    mouseNav: string | null;
    /** Navigation model · `nav="2d"` opts into chapter/slide grid navigation
     *  (←→ between chapters, ↑↓ within). Default is linear: arrows always move to
     *  the next/previous slide regardless of `<deck-section>` structure. */
    nav: string | null;
    private slides;
    private chapters;
    private _overviewTeardown;
    private _transitionLoaded;
    private _autoplayTimer;
    private _autoplayPaused;
    private _swipeStartX;
    private _swipeStartY;
    private _swipePointerId;
    private _navDownX;
    private _navDownY;
    private _wheelAccum;
    private _wheelLockUntil;
    firstUpdated(): void;
    /** Canvas vars, scale and every listener the deck needs while connected.
     *  Mirror of the disconnectedCallback teardown · runs from firstUpdated on
     *  the initial connect, and again from connectedCallback on a re-attach
     *  (firstUpdated only ever runs once per element). */
    private _installRuntime;
    /** Confine author `<style scoped>` blocks to their own slide. A light-DOM
     *  <style> is a global stylesheet by default, so a per-slide tweak would
     *  bleed across the whole deck. Wrapping its body in a native @scope rule
     *  (whose implicit root is the style's parent slide) limits it to that slide
     *  with no selector rewriting · plain CSS inside keeps working unchanged. */
    private _scopeSlideStyles;
    /** Publish the logical canvas size on the document root so both the
     *  `html:has(deck-root)` rem-baseline rule and the shadow `#stage` (via
     *  custom-property inheritance) size against the same numbers. */
    private _applyCanvasVars;
    /** Uniform zoom-to-fit · scale the fixed logical canvas to the largest size
     *  that still fits the host's own box (the viewport for a full-window deck,
     *  the container for an embedded one). Driven by a ResizeObserver. */
    private _applyScale;
    private _resizeObserver;
    /** Make the letterbox bands match the active slide's background, so a scaled
     *  deck blends seamlessly into the bands instead of sitting on a contrasting
     *  frame. A slide with no background of its own (transparent) shows the page
     *  surface · removing the override lets the bands fall back to that same
     *  surface, which stays seamless too. */
    private _applyLetterbox;
    /** The scaling baseline is a framework concern, not a theme one: inject it
     *  globally so any theme (or none) gets it. The rem unit tracks the logical
     *  canvas height — the #stage transform does the responsive scaling — and the
     *  page never scrolls (so the letterbox is the only thing outside a slide).
     *  Guarded by the element id (not a static) so separately-bundled copies of
     *  this class on one page share the same once-per-document semantics.
     *
     *  Every rule is scoped with `:has(> body > deck-root)`, so it is inert
     *  unless a deck is a direct <body> child — i.e. a full-page deck. An
     *  embedded deck (sitting in some container) never matches, so it leaves the
     *  host page's scroll and rem baseline alone.
     *
     *  The `[fluid]` branch is consumed by a later task: until the `fluid`
     *  attribute exists it matches nothing, while `:not([fluid])` covers every
     *  current deck. The `height:100%` pair is also forward-looking — a later
     *  task switches `:host` from 100vw/100vh to 100% sizing; it's harmless now. */
    private static _injectGlobals;
    connectedCallback(): void;
    disconnectedCallback(): void;
    private _startAutoplay;
    private _stopAutoplay;
    private _autoTick;
    private _onHoverEnter;
    private _onHoverLeave;
    /** Any explicit user navigation resets the autoplay countdown so the press
     *  isn't immediately followed by an auto-advance. */
    private _restartAutoplay;
    private _onPointerDown;
    private _onPointerUp;
    private _onNavPointerDown;
    /** Click anywhere → advance (Shift+click → back) · PowerPoint-style.
     *  Skips interactive targets, our own chrome, text selections and drags. */
    private _onClickNav;
    /** Wheel over a scrollable descendant (overflowing code block, …) must stay
     *  a native scroll · only wheel on the deck shell itself navigates. */
    private _wheelTargetScrolls;
    private _onWheel;
    /** Mouse back/forward buttons (3/4) · act on mouseup, suppress the
     *  browser's history navigation best-effort on auxclick. */
    private _onAuxUp;
    private _onAuxClick;
    /** Group slides into chapters bounded by <deck-section> markers. */
    private _buildChapters;
    /** 2D navigation is opt-in via `nav="2d"` · it also needs the structure to
     *  make sense (2+ chapters, at least one with multiple slides). Without the
     *  opt-in, arrows stay linear so a sectioned deck doesn't surprise the author
     *  by remapping ← / → to chapter jumps. */
    private _has2DNav;
    private _mouseEnabled;
    /** Flat index → {chapter, intra-chapter index}. */
    private _coords;
    private _flatFromCoords;
    private _onHash;
    private _readHash;
    private _writeHash;
    private _onKey;
    /** Lazy-import the help module the first time the user opens it. */
    private _toggleHelp;
    /** Lazy-import the presenter (speaker-notes window) plugin on first P press. */
    private _togglePresenter;
    private _closeHelp;
    /** Lazy-import the overview module the first time the user opens it. */
    private _renderOverviewIfActive;
    private _maxSteps;
    private _advance;
    private _back;
    private _goTo;
    private _goToCoords;
    private _applyActive;
    private _applyStep;
    private _updateUI;
    updated(changed: PropertyValues<this>): void;
    private _navArrows;
    render(): unknown;
}
declare global {
    interface HTMLElementTagNameMap {
        'deck-root': DeckRoot;
    }
}
