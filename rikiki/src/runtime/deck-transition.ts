// ════════════════════════════════════════════════════════════════
// Optional slide-transition plugin · NOT part of the core bundle.
//
// Enabled by setting `transition="slide|fade|zoom|flip"` on <deck-root>.
// When deck-root navigates for the first time, it lazy-imports this
// module and calls `installTransitions(host)` once. The plugin then
// listens for the host's `slide-change` event and animates BOTH the
// incoming and outgoing slides so the deck-root background never
// flashes through.
//
// Per-slide override · set `data-transition="zoom"` on any slide host
// to overrule the deck-wide default.
// ════════════════════════════════════════════════════════════════

import type { DeckRoot } from './deck-root.js';

type Name = 'slide' | 'slide-up' | 'slide-down' | 'slide-right' | 'fade' | 'zoom' | 'flip';

const TIMINGS: Record<Name, number> = {
  slide: 560,
  'slide-up': 520,
  'slide-down': 520,
  'slide-right': 560,
  fade: 480,
  zoom: 520,
  flip: 560,
};

const EASE_OUT = 'var(--rik-motion__ease-out, cubic-bezier(0.16, 1, 0.3, 1))';
const EASE_SPRING = 'var(--rik-motion__ease-spring, cubic-bezier(0.5, 1.8, 0.3, 1))';

/* Both enter and exit animations · the outgoing slide travels out of view
   while the incoming slide travels in. Animating both prevents the
   deck-root background from flashing through during the transition.
   No opacity changes anywhere · everything is transform-only. */
const SHEET = `
  /* Incoming · from right (forward) */
  @keyframes rk-slide-in       { from { transform: translateX(100%);  } to { transform: translateX(0); } }
  /* Outgoing · pushed off to the left (forward) */
  @keyframes rk-slide-out      { from { transform: translateX(0);     } to { transform: translateX(-100%); } }
  /* Incoming · from left (backward) */
  @keyframes rk-slide-right-in  { from { transform: translateX(-100%); } to { transform: translateX(0); } }
  /* Outgoing · pushed off to the right (backward) */
  @keyframes rk-slide-right-out { from { transform: translateX(0);     } to { transform: translateX(100%); } }
  /* Vertical · incoming from below, outgoing pushed up (forward) */
  @keyframes rk-slide-up-in     { from { transform: translateY(100%);  } to { transform: translateY(0); } }
  @keyframes rk-slide-up-out    { from { transform: translateY(0);     } to { transform: translateY(-100%); } }
  /* Vertical · incoming from above, outgoing pushed down (backward) */
  @keyframes rk-slide-down-in   { from { transform: translateY(-100%); } to { transform: translateY(0); } }
  @keyframes rk-slide-down-out  { from { transform: translateY(0);     } to { transform: translateY(100%); } }
  /* Fade · pop in / pop out from center, no horizontal motion */
  @keyframes rk-fade-in         { from { transform: scale(0.94); } to { transform: scale(1); } }
  @keyframes rk-fade-out        { from { transform: scale(1);    } to { transform: scale(1.06); } }
  /* Zoom · aggressive scale (for hooks) */
  @keyframes rk-zoom-in         { from { transform: scale(0.86); } to { transform: scale(1);    } }
  @keyframes rk-zoom-out        { from { transform: scale(1);    } to { transform: scale(1.10); } }
  /* Flip · 3D rotateY */
  @keyframes rk-flip-in         { from { transform: perspective(900px) rotateY(-22deg) scale(0.94); }
                                  to   { transform: perspective(900px) rotateY(0)     scale(1);    } }
  @keyframes rk-flip-out        { from { transform: perspective(900px) rotateY(0)    scale(1);    }
                                  to   { transform: perspective(900px) rotateY(22deg) scale(0.94); } }

  /* Outgoing slide stays display:flex via inline JS style; this rule is
     a placeholder so the selector resolves cleanly in shadow CSS. */
  ::slotted(.rk-leaving) { }

  ::slotted([active].rk-enter-slide)        { animation: rk-slide-in       ${TIMINGS.slide}ms ${EASE_OUT}    both; }
  ::slotted(.rk-leaving.rk-exit-slide)      { animation: rk-slide-out      ${TIMINGS.slide}ms ${EASE_OUT}    both; }
  ::slotted([active].rk-enter-slide-right)  { animation: rk-slide-right-in ${TIMINGS['slide-right']}ms ${EASE_OUT} both; }
  ::slotted(.rk-leaving.rk-exit-slide-right){ animation: rk-slide-right-out ${TIMINGS['slide-right']}ms ${EASE_OUT} both; }
  ::slotted([active].rk-enter-slide-up)     { animation: rk-slide-up-in    ${TIMINGS['slide-up']}ms ${EASE_OUT} both; }
  ::slotted(.rk-leaving.rk-exit-slide-up)   { animation: rk-slide-up-out   ${TIMINGS['slide-up']}ms ${EASE_OUT} both; }
  ::slotted([active].rk-enter-slide-down)   { animation: rk-slide-down-in  ${TIMINGS['slide-down']}ms ${EASE_OUT} both; }
  ::slotted(.rk-leaving.rk-exit-slide-down) { animation: rk-slide-down-out ${TIMINGS['slide-down']}ms ${EASE_OUT} both; }
  ::slotted([active].rk-enter-fade)         { animation: rk-fade-in        ${TIMINGS.fade}ms ${EASE_OUT} both; }
  ::slotted(.rk-leaving.rk-exit-fade)       { animation: rk-fade-out       ${TIMINGS.fade}ms ${EASE_OUT} both; }
  ::slotted([active].rk-enter-zoom)         { animation: rk-zoom-in        ${TIMINGS.zoom}ms ${EASE_SPRING} both; }
  ::slotted(.rk-leaving.rk-exit-zoom)       { animation: rk-zoom-out       ${TIMINGS.zoom}ms ${EASE_OUT} both; }
  ::slotted([active].rk-enter-flip)         { animation: rk-flip-in        ${TIMINGS.flip}ms ${EASE_OUT} both; }
  ::slotted(.rk-leaving.rk-exit-flip)       { animation: rk-flip-out       ${TIMINGS.flip}ms ${EASE_OUT} both; }

  @media (prefers-reduced-motion: reduce) {
    ::slotted([active][class*='rk-enter-']),
    ::slotted(.rk-leaving)                  { animation: none; }
  }
`;

const ENTER_CLASSES = [
  'rk-enter-slide',
  'rk-enter-slide-up',
  'rk-enter-slide-down',
  'rk-enter-slide-right',
  'rk-enter-fade',
  'rk-enter-zoom',
  'rk-enter-flip',
];
const EXIT_CLASSES = [
  'rk-exit-slide',
  'rk-exit-slide-up',
  'rk-exit-slide-down',
  'rk-exit-slide-right',
  'rk-exit-fade',
  'rk-exit-zoom',
  'rk-exit-flip',
];

export function installTransitions(host: DeckRoot): () => void {
  // The teardown is stashed on the host so a second install stays idempotent.
  const stash = host as DeckRoot & { __rkTransitions?: () => void };
  if (stash.__rkTransitions) return stash.__rkTransitions;
  const root = host.shadowRoot;
  if (!root) return () => {};

  const style = document.createElement('style');
  style.textContent = SHEET;
  style.setAttribute('data-rik-transitions', '');
  root.appendChild(style);

  /** DOM order direction · +1 forward, -1 backward, 0 unknown. */
  function direction(current: HTMLElement, previous: HTMLElement | null): number {
    if (!previous) return 0;
    const pos = current.compareDocumentPosition(previous);
    if (pos & Node.DOCUMENT_POSITION_PRECEDING) return 1;
    if (pos & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
    return 0;
  }

  const onChange = (e: Event) => {
    // A morph view-transition owns this navigation · don't double-animate.
    if ((host as unknown as { __rkMorphActive?: boolean }).__rkMorphActive) return;
    const ev = e as CustomEvent<{ current: HTMLElement | null; previous: HTMLElement | null }>;
    const next = ev.detail.current;
    const prev = ev.detail.previous;
    if (!next) return;

    let name = (next.dataset['transition'] || host.transition || 'fade') as Name;
    const dir = direction(next, prev);
    if (name === 'slide' && dir < 0) name = 'slide-right';
    else if (name === 'slide-right' && dir > 0) name = 'slide';
    else if (name === 'slide-up' && dir < 0) name = 'slide-down';
    else if (name === 'slide-down' && dir > 0) name = 'slide-up';

    const enterCls = `rk-enter-${name}`;
    const exitCls = `rk-exit-${name}`;
    const duration = TIMINGS[name] ?? 480;

    // ── Outgoing slide · keep it visible during exit, then hide it back ──
    if (prev && prev !== next) {
      prev.classList.remove(...ENTER_CLASSES, ...EXIT_CLASSES, 'rk-leaving');
      // Inline display:flex overrides the slide-host :host shadow CSS that
      // would otherwise display:none it (it lost [active] when nav moved on).
      prev.style.display = 'flex';
      prev.style.zIndex = '1';
      // Force reflow so the exit keyframe restarts cleanly
      void prev.offsetWidth;
      prev.classList.add('rk-leaving', exitCls);
      window.setTimeout(() => {
        prev.classList.remove('rk-leaving', exitCls);
        prev.style.display = '';
        prev.style.zIndex = '';
      }, duration + 40);
    }

    // ── Incoming slide · enter animation on top ────────────────────────
    next.classList.remove(...ENTER_CLASSES);
    next.style.zIndex = '2';
    void next.offsetWidth;
    next.classList.add(enterCls);
    window.setTimeout(() => {
      next.classList.remove(enterCls);
      next.style.zIndex = '';
    }, duration + 40);
  };

  host.addEventListener('slide-change', onChange as EventListener);

  // Trigger the first-render animation manually since slide-change for the
  // initial slide was dispatched before this module finished loading.
  const initial = host.querySelector<HTMLElement>(':scope > [active]');
  if (initial) {
    onChange(new CustomEvent('slide-change', { detail: { current: initial, previous: null } }));
  }

  const teardown = () => {
    host.removeEventListener('slide-change', onChange as EventListener);
    style.remove();
    delete stash.__rkTransitions;
  };
  stash.__rkTransitions = teardown;
  return teardown;
}
