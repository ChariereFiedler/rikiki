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
// The plugin patches deck-root so its step counter (the dots at the
// bottom) accounts for [data-click] elements, and so stepping toggles
// their visibility. Respects prefers-reduced-motion.
// ════════════════════════════════════════════════════════════════

interface DeckRootProto {
  _maxSteps(): number;
  _applyStep(): void;
  current: number;
  step: number;
  // slides is private on the class; typed loosely here for the patch.
  slides?: HTMLElement[];
}

const REVEAL_ATTR = 'data-click';
const HIDE_ATTR = 'data-click-hide';

/** Highest explicit step referenced by [data-click]/[data-click-hide] in a slide,
 *  plus an implicit +1 per bare (value-less) attribute, mirroring Slidev's
 *  auto-incrementing click counter. Returns the number of extra steps the slide
 *  needs beyond what deck-root already counts. */
function clickStepCount(slide: HTMLElement): number {
  let auto = 0;
  let maxExplicit = 0;
  const els = slide.querySelectorAll<HTMLElement>(`[${REVEAL_ATTR}], [${HIDE_ATTR}]`);
  els.forEach((el) => {
    const raw = el.getAttribute(REVEAL_ATTR) ?? el.getAttribute(HIDE_ATTR) ?? '';
    const n = parseInt(raw, 10);
    if (Number.isFinite(n) && n > 0) maxExplicit = Math.max(maxExplicit, n);
    else auto += 1;
  });
  return Math.max(maxExplicit, auto);
}

/** Resolve the click step each annotated element belongs to. Bare attributes
 *  get sequential steps in document order; explicit numbers are honored. */
function assignSteps(slide: HTMLElement): Array<{ el: HTMLElement; step: number; hide: boolean }> {
  let cursor = 0;
  const out: Array<{ el: HTMLElement; step: number; hide: boolean }> = [];
  slide.querySelectorAll<HTMLElement>(`[${REVEAL_ATTR}], [${HIDE_ATTR}]`).forEach((el) => {
    const hide = el.hasAttribute(HIDE_ATTR);
    const raw = el.getAttribute(hide ? HIDE_ATTR : REVEAL_ATTR) ?? '';
    const explicit = parseInt(raw, 10);
    const step = Number.isFinite(explicit) && explicit > 0 ? explicit : ++cursor;
    out.push({ el, step, hide });
  });
  return out;
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

  const origApply = proto._applyStep;
  proto._applyStep = function (this: DeckRootProto): void {
    origApply.call(this);
    const slide = this.slides?.[this.current];
    if (!slide) return;
    assignSteps(slide).forEach(({ el, step, hide }) => {
      prepare(el, hide);
      // reveal: visible once we've reached its step. hide: hidden once reached.
      const reached = this.step >= step;
      setVisible(el, hide ? !reached : reached);
    });
  };

  // Re-apply to any already-rendered decks · their initial _applyStep(0) ran
  // before this patch, leaving data-click elements visible. Same idea as the
  // Shiki plugin re-rendering existing <deck-code> instances on install.
  document.querySelectorAll('deck-root').forEach((dr) => {
    (dr as unknown as { _applyStep?: () => void })._applyStep?.();
  });
}
