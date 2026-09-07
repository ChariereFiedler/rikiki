import { LitElement, type PropertyValues } from 'lit';
type Slide = HTMLElement & {
    applyStep?: (step: number) => void;
    render?: () => unknown;
};
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
    navigate?(to: number, ctx: DeckContext, proceed: () => void): boolean | void;
}
export declare class DeckRoot extends LitElement {
    static styles: import("lit").CSSResult;
    current: number;
    step: number;
    /** When non-null, a full-screen overlay covers the deck (clicker B/./W/,
     *  keys). Pressing any key dismisses it · same convention as PowerPoint. */
    blank: 'black' | 'white' | null;
    /** Set by the presenter plugin while the speaker popup is open. The main
     *  window is then the projected one, so its key-hint chips and nav arrows are
     *  noise · hide them until the popup closes (issue #6). */
    presenterActive: boolean;
    overview: boolean;
    /** Fluid rendering · the deck fills its box and reflows like a web page
     *  (no logical canvas, no zoom-to-fit scale, no letterbox). Opt-in · the
     *  default stays the uniform zoom-to-fit canvas. Toggleable at runtime ·
     *  flipping it re-applies the canvas vars, scale and letterbox both ways. */
    fluid: boolean;
    /** Logical canvas size · defaults to 1920 × 1080 (16:9). Only the ratio and
     *  the rem baseline depend on these · the canvas is then scaled uniformly to
     *  fill the window (see _applyScale). */
    width: number;
    height: number;
    /** Hide the bottom-left keyboard-hint chip (the ←/→ · O · P · ? row). */
    noHint: boolean;
    /** Hide the bottom-right on-screen previous/next navigation arrows. */
    noArrows: boolean;
    /** Hide the bottom-right slide counter (`n / total`) · used by the presenter
     *  preview, which already shows the count in its own chrome. */
    noCounter: boolean;
    /** Passive-render mode · the deck still scales/letterboxes but wires NO
     *  keyboard, mouse, autoplay or presenter handlers. Used by the presenter
     *  preview iframes, which must not hijack keys or open a nested presenter on
     *  the shared BroadcastChannel · the speaker drives the real deck instead. */
    preview: boolean;
    /** Disable slide zoom (Ctrl/⌘+wheel, pinch, +/-/0) · on by default. */
    noZoom: boolean;
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
    private _zoom;
    private _panX;
    private _panY;
    private static readonly ZOOM_MAX;
    private static readonly ZOOM_STEP;
    private static readonly ZOOM_WHEEL_SENSITIVITY;
    private _plugins;
    private _ctx;
    /** Build (once) the stable context object plugins receive · live getters so a
     *  plugin always sees the engine's current position (the object itself is
     *  cached, not frozen). */
    private _context;
    /** Register a plugin · idempotent by name. Returns an unregister function that
     *  runs the plugin's teardown and detaches its hooks. A freshly registered
     *  plugin may change step counts or element visibility, so the active slide is
     *  re-applied immediately (this also covers plugins attached after the deck
     *  has already rendered). */
    use(plugin: DeckPlugin): () => void;
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
    /** True when the whole deck is fluid, or the active slide opts out of the
     *  fixed canvas via its own `fluid` attribute · a per-slide viewport escape
     *  (issue #4). It drives the canvas vars, scale and letterbox exactly like
     *  the deck-wide `fluid` flag, just for that one slide. */
    private _effectiveFluid;
    /** Reflect the active slide's per-slide fluid escape on the host · the
     *  `unfixed` marker that the stage CSS and the injected rem baseline key on ·
     *  then re-apply the canvas vars and scale for the new effective mode. Called
     *  on every slide change · a no-op for a deck that never uses per-slide fluid. */
    private _applySlideFluid;
    private _applyCanvasVars;
    /** Uniform zoom-to-fit · scale the fixed logical canvas to the largest size
     *  that still fits the host's own box (the viewport for a full-window deck,
     *  the container for an embedded one). Driven by a ResizeObserver. */
    private _applyScale;
    private _resizeObserver;
    /** Zoom is live only in the fixed canvas and outside overlays. */
    private _zoomEnabled;
    /** Publish zoom + pan as custom props the #stage transform reads. */
    private _applyZoom;
    /** Keep the pan within bounds so the magnified stage always covers the
     *  viewport (no gaps); at fit (zoom 1) it forces re-centring. */
    private _clampPan;
    /** Zoom by a factor, keeping the point at viewport (cx, cy) fixed. */
    private _zoomAt;
    private _resetZoom;
    private _panBy;
    private _panning;
    private _panLastX;
    private _panLastY;
    private _onPanDown;
    private _onPanMove;
    private _onPanUp;
    /** Make the letterbox bands match the active slide's background, so a scaled
     *  deck blends seamlessly into the bands instead of sitting on a contrasting
     *  frame. A slide with no background of its own (transparent) shows the page
     *  surface · removing the override lets the bands fall back to that same
     *  surface, which stays seamless too. */
    private _applyLetterbox;
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
    /** Size the printed page from the deck's own canvas.
     *
     *  `@page` cannot read a custom property, so the rule is written from JS every
     *  time the canvas changes. Without it the browser prints A4 and crops a 16:9
     *  slide down its right edge · the exact symptom the FAQ promised away. */
    /** What a screen reader hears on a slide change · position first, because
     *  that is the part a listener cannot get any other way. */
    private _liveLabel;
    private _applyPageSize;
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
    /** True when the deck IS the page rather than a widget inside one.
     *
     *  A full-page deck owns the URL, the keyboard and the wheel · that is the
     *  whole point. An embedded deck owns none of them by default: the host put
     *  the anchor in the URL, the host's reader is using the arrow keys to read
     *  the host's page, and the wheel over a widget scrolls the page it sits in. */
    private _isFullPage;
    /** Does a key press belong to this deck right now? Always, when the deck is
     *  the page · only while focus is inside it, when it is embedded. */
    private _ownsKeyboard;
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
    /** The engine's own step count for the active slide · `steps`/`data-steps`
     *  attribute, or a `deck-code[step-groups]` group count. Plugins extend this
     *  through their `steps` hook (see _maxSteps). */
    private _baseMaxSteps;
    private _advance;
    private _back;
    private _goTo;
    private _goToNow;
    private _goToCoords;
    private _applyActive;
    private _applyStep;
    /** The bottom-right slide counter is noise in modes where it shouldn't show:
     *  the overview grid, a black/white blanked screen, and the cover slide (the
     *  title slide has no business carrying a page number). */
    private _counterHidden;
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
export {};
