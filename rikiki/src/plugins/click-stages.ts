// ════════════════════════════════════════════════════════════════
// Per-element "click stages" · Slidev-style v-click for rikiki.
// NOT in the core bundle · opt-in like the Shiki plugin.
//
// Usage in a deck:
//   <script type="module">
//     import { installClickStages } from './rikiki/dist/click-stages.js';
//     installClickStages();
//   </script>
//
// Then annotate any element inside a slide:
//   <p data-click>appears on the next click</p>
//   <p data-click="2">appears at step 2</p>
//   <p data-click-hide>visible first, hidden on the next click</p>
//   <p data-click data-anim="slide-up">reveal sliding up</p>
//
//   data-anim · fade (default) | slide-up | slide-down | slide-left |
//               slide-right | scale | blur | flip-up | draw (SVG strokes)
//   data-anim-duration="600" · ms (default 320)
//   data-anim-delay="120"    · ms (default 0)
//   data-anim-ease="out|spring|in-out|cubic-bezier(…)" (default out)
//
//   <p data-click-auto="800">  · no click consumed, fires 800ms after the
//                                previous stage (autos chain in order)
//   <ul data-click-stagger="80"> · one click, children cascade 80ms apart
//   <div data-click-children>    · each direct child = one sequential click
//
//   <h1 data-morph="title">…</h1> · paired across steps or consecutive
//   slides → FLIP morph via the View Transitions API (graceful no-op
//   fallback). Morph targets must live in light DOM.
//
// The plugin patches deck-root so its step counter (the dots at the
// bottom) accounts for [data-click] elements, and so stepping toggles
// their visibility. Respects prefers-reduced-motion.
// ════════════════════════════════════════════════════════════════

interface DeckRootProto {
  _maxSteps(): number;
  _applyStep(): void;
  _goTo(idx: number): void;
  current: number;
  step: number;
  // slides is private on the class; typed loosely here for the patch.
  slides?: HTMLElement[];
}

type DocWithVT = Document & {
  startViewTransition?: (cb: () => void) => { finished: Promise<void> };
};

const REVEAL_ATTR = 'data-click';
const HIDE_ATTR = 'data-click-hide';
const AUTO_ATTR = 'data-click-auto';
const STAGGER_ATTR = 'data-click-stagger';
const CHILDREN_ATTR = 'data-click-children';

interface StageEntry {
  el: HTMLElement;
  /** Click step this element belongs to · 0 = revealed on slide activation. */
  step: number;
  hide: boolean;
  /** ms after the step is reached before the state flips (auto chain / stagger). */
  delay: number;
}

const EXPANDED = new WeakSet<HTMLElement>();

/** Materialize data-click-children sugar · each direct child becomes a bare
 *  data-click, inheriting the container's data-anim* unless it overrides. */
function expandClickChildren(slide: HTMLElement): void {
  slide.querySelectorAll<HTMLElement>(`[${CHILDREN_ATTR}]`).forEach((box) => {
    if (EXPANDED.has(box)) return;
    EXPANDED.add(box);
    Array.from(box.children).forEach((child) => {
      const c = child as HTMLElement;
      if (!c.hasAttribute(REVEAL_ATTR)) c.setAttribute(REVEAL_ATTR, '');
      for (const a of ['data-anim', 'data-anim-duration', 'data-anim-delay', 'data-anim-ease']) {
        const v = box.getAttribute(a);
        if (v && !c.hasAttribute(a)) c.setAttribute(a, v);
      }
    });
  });
}

/** Extra steps the slide needs beyond what deck-root counts. Explicit numbers
 *  set a floor; each bare data-click / data-click-hide / stagger container
 *  auto-increments; data-click-auto consumes no click. */
function clickStepCount(slide: HTMLElement): number {
  expandClickChildren(slide);
  let auto = 0;
  let maxExplicit = 0;
  slide
    .querySelectorAll<HTMLElement>(`[${REVEAL_ATTR}], [${HIDE_ATTR}], [${STAGGER_ATTR}]`)
    .forEach((el) => {
      if (el.hasAttribute(STAGGER_ATTR)) { auto += 1; return; }
      const raw = el.getAttribute(REVEAL_ATTR) ?? el.getAttribute(HIDE_ATTR) ?? '';
      const n = parseInt(raw, 10);
      if (Number.isFinite(n) && n > 0) maxExplicit = Math.max(maxExplicit, n);
      else auto += 1;
    });
  return Math.max(maxExplicit, auto);
}

/** Walk annotated elements in document order and resolve each one's stage. */
function collectEntries(slide: HTMLElement): StageEntry[] {
  expandClickChildren(slide);
  const out: StageEntry[] = [];
  let cursor = 0;     // last assigned click step
  let autoAccum = 0;  // chained data-click-auto delays since that step
  slide
    .querySelectorAll<HTMLElement>(`[${REVEAL_ATTR}], [${HIDE_ATTR}], [${AUTO_ATTR}], [${STAGGER_ATTR}]`)
    .forEach((el) => {
      if (el.hasAttribute(STAGGER_ATTR)) {
        // Container consumes one click · children cascade in.
        const gap = parseInt(el.getAttribute(STAGGER_ATTR) ?? '', 10) || 80;
        const step = ++cursor;
        autoAccum = 0;
        Array.from(el.children).forEach((child, i) => {
          out.push({ el: child as HTMLElement, step, hide: false, delay: i * gap });
        });
        return;
      }
      if (el.hasAttribute(AUTO_ATTR)) {
        // No click consumed · fires after the previous stage (or slide
        // activation when cursor is still 0). Consecutive autos chain.
        autoAccum += parseInt(el.getAttribute(AUTO_ATTR) ?? '', 10) || 0;
        out.push({ el, step: cursor, hide: false, delay: autoAccum });
        return;
      }
      const hide = el.hasAttribute(HIDE_ATTR);
      const raw = el.getAttribute(hide ? HIDE_ATTR : REVEAL_ATTR) ?? '';
      const explicit = parseInt(raw, 10);
      const isExplicit = Number.isFinite(explicit) && explicit > 0;
      const step = isExplicit ? explicit : ++cursor;
      if (!isExplicit) autoAccum = 0;
      out.push({ el, step, hide, delay: 0 });
    });
  return out;
}

const MORPH_ATTR = 'data-morph';
/** True while one of our view transitions is running · prevents nesting. */
let vtActive = false;

function morphGroups(root: HTMLElement): Map<string, HTMLElement[]> {
  const map = new Map<string, HTMLElement[]>();
  root.querySelectorAll<HTMLElement>(`[${MORPH_ATTR}]`).forEach((el) => {
    const key = el.getAttribute(MORPH_ATTR);
    if (!key) return;
    map.set(key, [...(map.get(key) ?? []), el]);
  });
  return map;
}

function matchedMorphKeys(a: HTMLElement, b: HTMLElement): string[] {
  const kb = morphGroups(b);
  return Array.from(morphGroups(a).keys()).filter((k) => kb.has(k));
}

const cssKey = (key: string): string => key.replace(/[^a-zA-Z0-9_-]/g, '_');

/** Give the visible element of each morph key a view-transition-name and
 *  'none' to the rest · duplicate names abort a view transition. Visibility
 *  comes from the entries model when provided, else from inline opacity. */
function nameVisibleMorphs(root: HTMLElement, targets?: Map<HTMLElement, boolean>): void {
  morphGroups(root).forEach((els, key) => {
    let named = false;
    els.forEach((el) => {
      const visible = targets?.get(el) ?? el.style.opacity !== '0';
      const take = visible && !named;
      if (take) named = true;
      el.style.viewTransitionName = take ? `rk-morph-${cssKey(key)}` : 'none';
    });
  });
}

const PREP = new WeakSet<HTMLElement>();

const EASES: Record<string, string> = {
  out: 'cubic-bezier(0.22, 1, 0.36, 1)',
  spring: 'cubic-bezier(0.5, 1.8, 0.3, 1)',
  'in-out': 'cubic-bezier(0.45, 0, 0.55, 1)',
};

function reducedMotion(): boolean {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

/** data-anim-duration / data-anim-delay (ms) + data-anim-ease (preset or raw
 *  cubic-bezier). Reduced motion collapses to a near-instant transition. */
function timingOf(el: HTMLElement): { dur: number; delay: number; ease: string } {
  if (reducedMotion()) return { dur: 1, delay: 0, ease: 'linear' };
  const dur = parseInt(el.getAttribute('data-anim-duration') ?? '', 10) || 320;
  const delay = parseInt(el.getAttribute('data-anim-delay') ?? '', 10) || 0;
  const easeRaw = el.getAttribute('data-anim-ease') ?? 'out';
  return { dur, delay, ease: EASES[easeRaw] ?? easeRaw };
}

const DRAW_SHAPES = 'path, line, polyline, polygon, circle, ellipse, rect';

/** Stroked SVG shapes targeted by data-anim="draw" · the element itself or
 *  every shape underneath it. */
function drawTargets(el: HTMLElement): SVGGeometryElement[] {
  if (el instanceof SVGGeometryElement) return [el];
  return Array.from(el.querySelectorAll<SVGGeometryElement>(DRAW_SHAPES));
}

function prepareDraw(el: HTMLElement, transition: string): void {
  drawTargets(el).forEach((s) => {
    const len = s.getTotalLength?.() ?? 0;
    if (!len) return;
    s.style.strokeDasharray = String(len);
    s.style.transition = transition;
  });
}

function applyDraw(el: HTMLElement, visible: boolean): void {
  drawTargets(el).forEach((s) => {
    const len = s.getTotalLength?.() ?? 0;
    if (!len) return;
    s.style.strokeDashoffset = visible ? '0' : String(len);
  });
  el.style.pointerEvents = visible ? '' : 'none';
}

/** Set the initial hidden/visible state + transition on each annotated element. */
function prepare(el: HTMLElement, hide: boolean): void {
  if (PREP.has(el)) return;
  PREP.add(el);
  const { dur, delay, ease } = timingOf(el);
  const anim = el.getAttribute('data-anim');
  const props =
    anim === 'blur' ? ['opacity', 'transform', 'filter'] :
    anim === 'draw' ? ['stroke-dashoffset'] :
    ['opacity', 'transform'];
  const transition = props.map((p) => `${p} ${dur}ms ${ease} ${delay}ms`).join(', ');
  if (anim === 'draw') {
    prepareDraw(el, transition);
  } else {
    el.style.transition = transition;
    el.style.willChange = props.join(', ');
  }
  // hide-on-click elements start visible; reveal elements start hidden.
  setVisible(el, hide);
}

function animOffset(el: HTMLElement): string {
  switch (el.getAttribute('data-anim')) {
    case 'slide-up':    return 'translateY(16px)';
    case 'slide-down':  return 'translateY(-16px)';
    case 'slide-left':  return 'translateX(16px)';
    case 'slide-right': return 'translateX(-16px)';
    case 'scale':       return 'scale(0.92)';
    case 'flip-up':     return 'perspective(600px) rotateX(35deg)';
    default:            return 'none'; // fade · blur
  }
}

function setVisible(el: HTMLElement, visible: boolean): void {
  if (el.getAttribute('data-anim') === 'draw') { applyDraw(el, visible); return; }
  el.style.opacity = visible ? '1' : '0';
  el.style.transform = visible ? 'none' : animOffset(el);
  if (el.getAttribute('data-anim') === 'blur') el.style.filter = visible ? 'none' : 'blur(12px)';
  el.style.pointerEvents = visible ? '' : 'none';
}

export function installClickStages(): void {
  const ctor = customElements.get('deck-root') as (typeof HTMLElement & { prototype: DeckRootProto }) | undefined;
  if (!ctor) {
    console.warn('[rikiki/click-stages] <deck-root> is not defined yet · import rikiki first');
    return;
  }
  const proto = ctor.prototype;
  if ((proto as unknown as { _clickStagesInstalled?: boolean })._clickStagesInstalled) return;
  (proto as unknown as { _clickStagesInstalled?: boolean })._clickStagesInstalled = true;

  const origMax = proto._maxSteps;
  proto._maxSteps = function (this: DeckRootProto): number {
    const base = origMax.call(this);
    const slide = this.slides?.[this.current];
    const clicks = slide ? clickStepCount(slide) : 0;
    return Math.max(base, clicks);
  };

  const TIMERS = new WeakMap<HTMLElement, number>();
  function cancelTimer(el: HTMLElement): void {
    const t = TIMERS.get(el);
    if (t !== undefined) { window.clearTimeout(t); TIMERS.delete(el); }
  }
  function scheduleVisible(el: HTMLElement, visible: boolean, delay: number): void {
    cancelTimer(el);
    TIMERS.set(el, window.setTimeout(() => {
      TIMERS.delete(el);
      setVisible(el, visible);
    }, delay));
  }

  // Previous (slide, step) per host · lets us tell "just reached this step"
  // (play delays) apart from "jumped past it" (settle immediately).
  const LAST = new WeakMap<object, { slide: number; step: number }>();

  const origApply = proto._applyStep;
  proto._applyStep = function (this: DeckRootProto): void {
    origApply.call(this);
    const slide = this.slides?.[this.current];
    if (!slide) return;
    const last = LAST.get(this);
    const prevStep = last && last.slide === this.current ? last.step : -1;
    LAST.set(this, { slide: this.current, step: this.step });

    const entries = collectEntries(slide);
    const run = () =>
      entries.forEach(({ el, step, hide, delay }) => {
        prepare(el, hide);
        cancelTimer(el);
        // reveal: visible once we've reached its step. hide: hidden once reached.
        const reached = this.step >= step;
        const target = hide ? !reached : reached;
        // Delays only play when we land exactly on the step coming from before
        // it (or on slide activation for step-0 autos) · deep links and back
        // navigation settle instantly.
        const justReached = reached && this.step === step && prevStep < step;
        const onActivation = reached && step === 0 && prevStep === -1;
        if (delay > 0 && (justReached || onActivation)) {
          setVisible(el, hide);               // hold the pre-state…
          scheduleVisible(el, target, delay); // …then flip after the delay
        } else {
          setVisible(el, target);
        }
      });

    // Intra-slide morph · wrap the step change in a view transition when the
    // slide pairs data-morph elements across steps.
    const svt = (document as DocWithVT).startViewTransition?.bind(document);
    const stepChanged = prevStep !== -1 && prevStep !== this.step;
    if (svt && stepChanged && !vtActive && !reducedMotion() && slide.querySelector(`[${MORPH_ATTR}]`)) {
      const targets = new Map(
        entries.map(({ el, step, hide }) => [el, hide ? this.step < step : this.step >= step])
      );
      nameVisibleMorphs(slide);          // old state, before capture
      vtActive = true;
      svt(() => { run(); nameVisibleMorphs(slide, targets); })
        .finished.finally(() => { vtActive = false; });
    } else {
      run();
    }
  };

  const origGoTo = proto._goTo;
  proto._goTo = function (this: DeckRootProto, idx: number): void {
    const slides = this.slides ?? [];
    const from = slides[this.current];
    const to = slides[Math.max(0, Math.min(slides.length - 1, idx))];
    const svt = (document as DocWithVT).startViewTransition?.bind(document);
    const keys = from && to && from !== to ? matchedMorphKeys(from, to) : [];
    if (keys.length === 0 || !svt || vtActive || reducedMotion()) {
      origGoTo.call(this, idx);
      return;
    }
    nameVisibleMorphs(from!);   // outgoing side, before capture
    vtActive = true;
    // deck-transition skips its classic animation for this navigation.
    (this as unknown as { __rkMorphActive?: boolean }).__rkMorphActive = true;
    svt(() => { origGoTo.call(this, idx); nameVisibleMorphs(to!); })
      .finished.finally(() => {
        vtActive = false;
        (this as unknown as { __rkMorphActive?: boolean }).__rkMorphActive = false;
      });
  };

  // Re-apply to any already-rendered decks · their initial _applyStep(0) ran
  // before this patch, leaving data-click elements visible. Same idea as the
  // Shiki plugin re-rendering existing <deck-code> instances on install.
  document.querySelectorAll('deck-root').forEach((dr) => {
    (dr as unknown as { _applyStep?: () => void })._applyStep?.();
  });
}
