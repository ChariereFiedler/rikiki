// ════════════════════════════════════════════════════════════════
// Speaker / presenter window plugin · NOT in the core bundle.
//
// Activated by pressing `P` on the speaker's laptop (deck-root keyboard
// handler lazy-imports this module). The plugin opens a popup window
// that mirrors the deck's current slide, shows the next slide as a
// preview, displays `<deck-notes>` content, and runs a presentation
// timer. State sync uses BroadcastChannel · no localStorage races,
// no postMessage ceremony.
//
// Usage in the deck (nothing to configure):
//   <deck-root>
//     <deck-feature>
//       <h1 slot="title">My slide</h1>
//       <deck-notes>What I want to say here.</deck-notes>
//     </deck-feature>
//   </deck-root>
//
// Press P · presenter window opens on the second screen.
// ════════════════════════════════════════════════════════════════

import type { DeckRoot } from './deck-root.js';
import { escapeHtml } from '../shared/escape-html.js';

const CHANNEL = 'rik-presenter';

// Absolute URL of the full rikiki bundle. dist/ is flat, so deck-presenter.js
// sits next to index.js · this resolves correctly whether served locally or
// from a CDN. Computed locally (not imported from deck-root) so esbuild does
// not inline deck-root's customElement definition into this lazy module,
// which would double-define <deck-root> at runtime.
const RIKIKI_BUNDLE_URL = new URL('./index.js', import.meta.url).href;

interface PresenterState {
  current: number;
  total: number;
  // Outer HTML of the active slide (live mirror in the presenter)
  slideHtml: string;
  // Outer HTML of the next slide (or null if at the end)
  nextHtml: string | null;
  // Notes extracted from <deck-notes> inside the active slide
  notes: string;
  // Tokens.css URL so the popup looks like the deck (served decks)
  themeHref: string;
  // Inlined theme CSS · for self-contained single-file decks where the theme
  // is a <style> block, not a <link> (empty for served decks).
  inlineStyles: string;
  // Absolute URL of the rikiki bundle so iframes can upgrade <deck-*> elements
  bundleHref: string;
  // The inlined framework bundle code · for single-file decks where there's no
  // external index.js to <script src> (empty for served decks).
  bundleInline: string;
}

let popup: Window | null = null;
let channel: BroadcastChannel | null = null;
let installed: WeakSet<DeckRoot> | null = null;

// ── Multi-screen placement (issue #5) ──────────────────────────────
// On a projector setup the slides go fullscreen on the external screen and the
// presenter popup opens on the speaker's (current) screen. We fetch the screen
// layout on demand (the Window Management API prompts for permission the first
// time · the prompt's own activation then lets the same press go fullscreen).
// Everything is best-effort: without the API, the permission, or a second
// screen, the deck stays put and the popup uses the default placement.
//
// Ordering: requestFullscreen consumes the press's transient activation, so it
// goes first; window.open relies on popups being allowed for the origin (which
// the presenter already requires) so it still opens afterwards.
type ScreenLike = {
  availLeft: number;
  availTop: number;
  availWidth: number;
  availHeight: number;
};
type ScreenDetailsLike = { screens: ScreenLike[]; currentScreen: ScreenLike };
type WindowWithScreens = Window & {
  getScreenDetails?: () => Promise<ScreenDetailsLike>;
};

// The live ScreenDetails (cached once granted · the object self-updates), and a
// flag so closing only exits the fullscreen we initiated.
let cachedScreens: ScreenDetailsLike | null = null;
let deckFullscreened = false;

/** Resolve the screen layout · prompts for the Window Management permission the
 *  first time, then reuses the live object. Null when the API is missing or the
 *  permission is denied. */
async function getScreens(): Promise<ScreenDetailsLike | null> {
  if (cachedScreens) return cachedScreens;
  const getScreenDetails = (window as WindowWithScreens).getScreenDetails;
  if (!getScreenDetails) return null;
  try {
    cachedScreens = await getScreenDetails.call(window);
    return cachedScreens;
  } catch {
    return null; // denied / dismissed · keep the deck in place
  }
}

const POPUP_W = 1280;
const POPUP_H = 720;

/** Top-left that centers the presenter popup on a given screen. */
function popupTopLeft(s: ScreenLike): { left: number; top: number } {
  return {
    left: Math.round(s.availLeft + (s.availWidth - POPUP_W) / 2),
    top: Math.round(s.availTop + (s.availHeight - POPUP_H) / 2),
  };
}

/** Window features that center the presenter popup on a given screen. */
function placementOn(s: ScreenLike): string {
  const { left, top } = popupTopLeft(s);
  return `popup=yes,width=${POPUP_W},height=${POPUP_H},left=${left},top=${top}`;
}

/** Move an already-open popup onto a screen · used on the first P press, where
 *  the popup had to open with default placement before the screen layout was
 *  known (window.open is synchronous; the layout resolves asynchronously). */
function movePopupTo(win: Window, s: ScreenLike): void {
  const { left, top } = popupTopLeft(s);
  win.resizeTo(POPUP_W, POPUP_H);
  win.moveTo(left, top);
}

/** Send the deck fullscreen to the given screen (the projector) · best-effort,
 *  flips the restore flag on success. */
function sendDeckToScreen(host: DeckRoot, screen: ScreenLike): void {
  const el = host as unknown as {
    requestFullscreen?: (opts?: { screen?: unknown }) => Promise<void>;
  };
  el.requestFullscreen?.({ screen })
    .then(() => {
      // The presenter may have been closed while the request was in flight ·
      // don't strand the deck fullscreen with no presenter.
      if (!installed?.has(host)) {
        document.exitFullscreen?.().catch(() => {});
        return;
      }
      deckFullscreened = true;
    })
    .catch(() => {
      // Older browser / the {screen} option unsupported · leave the deck put.
    });
}

/** Keep our fullscreen flag honest when the user exits fullscreen natively
 *  (Esc) · otherwise restore would later think the deck is still fullscreen. */
function onFullscreenChange(): void {
  if (!document.fullscreenElement) deckFullscreened = false;
}

/** Exit the fullscreen we put the deck into when the presenter closes. */
function restoreDeckFromFullscreen(): void {
  document.removeEventListener('fullscreenchange', onFullscreenChange);
  if (deckFullscreened && document.fullscreenElement) {
    document.exitFullscreen?.().catch(() => {});
  }
  deckFullscreened = false;
}

/** Tear the presenter down · used both when the speaker toggles it off (P again)
 *  and when the popup is closed externally. Closing the channel is essential:
 *  leaving it open would keep its message listener alive, so the next presenter
 *  would receive every key/click/wheel twice. */
function teardown(host: DeckRoot): void {
  popup?.close();
  popup = null;
  channel?.close();
  channel = null;
  installed?.delete(host);
  host.presenterActive = false;
  restoreDeckFromFullscreen();
}

function readState(host: DeckRoot): PresenterState {
  const slides = Array.from(host.children).filter((el) =>
    el.tagName.toLowerCase().startsWith('deck-'),
  ) as HTMLElement[];
  const current = slides.findIndex((s) => s.hasAttribute('active'));
  const slide = slides[current] ?? null;
  const next = slides[current + 1] ?? null;
  const notesEl = slide?.querySelector('deck-notes');
  const notes = (notesEl?.textContent ?? '').trim();
  // Find the active theme link · falls back to a sensible CDN default
  const themeLink = document.querySelector<HTMLLinkElement>(
    'link[rel="stylesheet"][href*="rikiki"], link[rel="stylesheet"][href*="tokens"], link[rel="stylesheet"][href*="theme"]',
  );
  const themeHref = themeLink?.href ?? '';
  // Self-contained single-file decks have the theme inlined as <style> and the
  // framework as a tagged inline module · capture both so the preview iframes
  // get the same look and the same <deck-*> definitions, with no external fetch.
  const inlineStyles = Array.from(document.querySelectorAll('style'))
    .map((s) => s.textContent ?? '')
    .join('\n');
  const bundleInline =
    document.querySelector<HTMLScriptElement>('script[type="module"][data-rikiki-bundle]')
      ?.textContent ?? '';
  return {
    current: current + 1,
    total: slides.length,
    slideHtml: slide?.outerHTML ?? '',
    nextHtml: next?.outerHTML ?? null,
    notes,
    themeHref,
    inlineStyles,
    bundleHref: RIKIKI_BUNDLE_URL,
    bundleInline,
  };
}

function broadcast(host: DeckRoot): void {
  if (!channel) return;
  channel.postMessage({ type: 'state', state: readState(host) });
}

const PRESENTER_HTML = (initial: PresenterState): string => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Rikiki · presenter</title>
${initial.themeHref ? `<link rel="stylesheet" href="${escapeHtml(initial.themeHref)}">` : ''}
<style>
  html, body { margin: 0; padding: 0; height: 100%; background: #0f1422; color: #fafafa; font-family: var(--rik-font-sans, system-ui); }
  .grid {
    display: grid;
    grid-template-columns: 2fr 1fr;
    /* Next is sized to its 16:9 content (top-right); notes fill the rest of the
       right column; current spans the full left height. Avoids the dead bands a
       full-height narrow Next pane left around a small 16:9 thumbnail. */
    grid-template-rows: auto 1fr auto;
    grid-template-areas:
      "current next"
      "current notes"
      "footer  footer";
    gap: clamp(8px, 1.5vw, 16px);
    padding: clamp(8px, 1.5vw, 16px);
    height: 100vh;
    box-sizing: border-box;
  }
  #current { grid-area: current; }
  #next { grid-area: next; }
  #notes-panel { grid-area: notes; }
  #footer { grid-area: footer; }
  @media (max-width: 1000px) {
    .grid {
      grid-template-columns: 1fr;
      grid-template-rows: auto auto 1fr auto;
      grid-template-areas: "current" "next" "notes" "footer";
    }
  }
  .panel {
    background: #1e2840;
    border-radius: 12px;
    overflow: hidden;
    position: relative;
    display: flex;
    flex-direction: column;
  }
  .panel header {
    font: 700 11px/1 var(--rik-font-mono, monospace);
    text-transform: uppercase;
    letter-spacing: 0.18em;
    padding: 10px 14px;
    color: rgba(232,228,240,0.45);
    background: #161c2e;
  }
  .panel .body { flex: 1; min-height: 0; padding: 16px; overflow: hidden; border-radius: 8px; }
  /* Current centers a 16:9 box in its (tall) pane so the thumbnail matches the
     projection geometry regardless of pane shape (issue #5) · the size
     container lets the iframe size against the pane in cq units. */
  #current .body { display: grid; place-items: center; container-type: size; }
  .panel iframe { border: 0; background: #0f1422; display: block; }
  #current-frame {
    aspect-ratio: 16 / 9;
    width: min(100cqw, calc(100cqh * 16 / 9));
    height: auto;
    max-width: 100%;
  }
  /* Next sizes its 16:9 box from the column width (its pane row is auto), so
     the panel hugs the thumbnail instead of stretching full-height. */
  #next-frame {
    aspect-ratio: 16 / 9;
    width: 100%;
    height: auto;
    display: block;
  }
  #notes { font-size: 17px; line-height: 1.6; white-space: pre-wrap; padding: 20px; overflow: auto; color: #e8e4f0; }
  #notes:empty::before { content: 'No notes for this slide.'; color: rgba(232,228,240,0.4); font-style: italic; }
  #footer {
    grid-column: 1 / -1;
    display: flex; align-items: center; justify-content: space-between;
    background: #1e2840;
    border-radius: 12px;
    padding: 14px 20px;
    font: 700 16px/1 var(--rik-font-mono, monospace);
  }
  #timer { font-size: 28px; font-variant-numeric: tabular-nums; letter-spacing: -0.01em; }
  #counter { color: rgba(232,228,240,0.6); }
  button {
    background: transparent;
    border: 1px solid rgba(232,228,240,0.2);
    color: inherit;
    font: inherit;
    padding: 8px 14px;
    border-radius: 6px;
    cursor: pointer;
  }
  button:hover { background: rgba(255,255,255,0.06); }
  .ghost { color: rgba(232,228,240,0.4); }
  .opt { display: inline-flex; align-items: center; gap: 6px; font: 600 13px/1 var(--rik-font-mono, monospace); color: rgba(232,228,240,0.7); cursor: pointer; user-select: none; }
  .opt input { accent-color: var(--rik-accent, #8fd14f); cursor: pointer; }
</style>
</head>
<body>
<div class="grid">
  <section class="panel" id="current">
    <header>Current</header>
    <div class="body"><iframe id="current-frame" srcdoc=""></iframe></div>
  </section>
  <section class="panel" id="next">
    <header>Next</header>
    <div class="body"><iframe id="next-frame" srcdoc=""></iframe></div>
  </section>
  <section class="panel" id="notes-panel">
    <header>Speaker notes</header>
    <div id="notes" class="body"></div>
  </section>
  <div id="footer">
    <div><span id="timer">00:00</span> <button id="timer-toggle">Pause</button> <button id="timer-reset">Reset</button></div>
    <div id="counter">${initial.current} / ${initial.total}</div>
    <div>
      <label class="opt"><input type="checkbox" id="opt-advance" checked> Advance on click</label>
      <span class="ghost">· P to close</span>
    </div>
  </div>
</div>
<script>
  const channel = new BroadcastChannel('${CHANNEL}');
  const current = document.getElementById('current-frame');
  const next = document.getElementById('next-frame');
  const notes = document.getElementById('notes');
  const counter = document.getElementById('counter');
  const timerEl = document.getElementById('timer');
  const toggleBtn = document.getElementById('timer-toggle');
  const resetBtn = document.getElementById('timer-reset');

  let running = true;
  let startedAt = Date.now();
  let elapsed = 0;
  function fmt(ms) {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    const pad = (n) => String(n).padStart(2, '0');
    return h > 0 ? (h + ':' + pad(m % 60) + ':' + pad(s % 60)) : (pad(m) + ':' + pad(s % 60));
  }
  function tick() {
    if (running) timerEl.textContent = fmt(elapsed + (Date.now() - startedAt));
    requestAnimationFrame(tick);
  }
  tick();
  toggleBtn.onclick = () => {
    if (running) { elapsed += Date.now() - startedAt; running = false; toggleBtn.textContent = 'Resume'; }
    else { startedAt = Date.now(); running = true; toggleBtn.textContent = 'Pause'; }
  };
  resetBtn.onclick = () => { startedAt = Date.now(); elapsed = 0; running = true; toggleBtn.textContent = 'Pause'; };

  // Presentation options · push each change to the live deck over the channel.
  document.getElementById('opt-advance').addEventListener('change', (e) => {
    channel.postMessage({ type: 'config', advanceOnClick: e.target.checked });
  });

  function wrapFrame(slideHtml, forward) {
    const themeHref    = ${JSON.stringify(initial.themeHref)};
    const inlineStyles = ${JSON.stringify(initial.inlineStyles)};
    const bundleHref   = ${JSON.stringify(initial.bundleHref)};
    const bundleInline = ${JSON.stringify(initial.bundleInline)};
    // Both values come from the host document, so they are only as trustworthy
    // as the deck · escape before they become markup. escAttr closes an attribute
    // breakout; escStyle stops a </style> inside the deck's own CSS (a string or
    // a comment) from ending the block early.
    const escAttr  = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
    const escStyle = (s) => s.replace(/<\\/(style|script)/gi, '<\\\\/$1');
    const themeLink  = themeHref ? '<link rel="stylesheet" href="' + escAttr(themeHref) + '">' : '';
    const themeStyle = inlineStyles ? '<style>' + escStyle(inlineStyles) + '</style>' : '';
    // Bootstrap rikiki inside the iframe so its <deck-*> elements upgrade.
    //  · single-file deck → the framework is inlined and tagged · re-inline it
    //    so the module base is the iframe document URL (a <script src="data:">
    //    or a non-existent ./index.js would break new URL(rel, import.meta.url)
    //    and abort registration). Escape any script end-tag so it can't close
    //    this block early (this comment must avoid the literal too).
    //  · served deck → load the real bundle URL with <script src>.
    let bundleTag;
    const esc = (c) => c.replace(/<\\/script/gi, '<\\\\/script');
    if (bundleInline) {
      bundleTag = '<script type="module">' + esc(bundleInline) + '<' + '/script>';
    } else if (bundleHref.slice(0, 5) === 'data:') {
      const b64 = bundleHref.indexOf(';base64,');
      const code = b64 >= 0
        ? atob(bundleHref.slice(b64 + 8))
        : decodeURIComponent(bundleHref.slice(bundleHref.indexOf(',') + 1));
      bundleTag = '<script type="module">' + esc(code) + '<' + '/script>';
    } else {
      bundleTag = '<script type="module" src="' + bundleHref + '"><' + '/script>';
    }
    // Mark the cloned slide [active] so its real component CSS applies
    // (:host([active]){display:flex}) instead of forcing display via !important.
    const activeSlide = slideHtml.replace(/^(\\s*<deck-[a-z-]+)/i, '$1 active');
    // Only the "Current" pane is a control surface · it captures key/click/wheel
    // and posts them to this popup window, which relays them onto the channel so
    // the live deck acts on them. Coords are normalised 0..1 over the iframe.
    const forwarder = forward
      ? '<scr' + 'ipt>(function(){' +
        'var post=function(o){o.source="rikiki-presenter-input";parent.postMessage(o,"*");};' +
        'addEventListener("keydown",function(e){var t=e.target;if(t&&t.matches&&t.matches("input,textarea,button"))return;post({type:"key",key:e.key,shift:!!e.shiftKey});});' +
        'addEventListener("click",function(e){post({type:"click",x:e.clientX/innerWidth,y:e.clientY/innerHeight,shift:!!e.shiftKey});});' +
        'addEventListener("wheel",function(e){if(e.ctrlKey||e.metaKey)return;post({type:"wheel",x:e.clientX/innerWidth,y:e.clientY/innerHeight,dx:e.deltaX,dy:e.deltaY});},{passive:true});' +
        '})();<' + '/scr' + 'ipt>'
      : '';
    // The deck always letterboxes into its logical canvas, so the slide keeps
    // its 16:9 proportions regardless of the pane's shape · just drop the
    // hint / nav-arrow chrome for a clean, correctly-shaped thumbnail.
    return '<!doctype html><html><head><meta charset="UTF-8">' + themeLink + themeStyle +
      bundleTag +
      '<style>html,body{margin:0;padding:0;height:100%;overflow:hidden;background:#0f1422}' +
      'deck-root{position:absolute;inset:0}</style>' +
      '</head><body><deck-root no-hint no-arrows no-counter preview>' + activeSlide + '</deck-root>' + forwarder + '</body></html>';
  }

  channel.onmessage = (e) => {
    if (e.data?.type !== 'state') return;
    const s = e.data.state;
    counter.textContent = s.current + ' / ' + s.total;
    notes.textContent = s.notes;
    if (s.slideHtml) current.srcdoc = wrapFrame(s.slideHtml, true);
    if (s.nextHtml)  next.srcdoc = wrapFrame(s.nextHtml, false);
    else next.srcdoc = '<!doctype html><html><body style="background:#0f1422;color:rgba(232,228,240,0.4);display:flex;align-items:center;justify-content:center;font-family:system-ui">End of deck</body></html>';
  };

  // Initial paint from the seed state
  const seed = ${JSON.stringify(initial)};
  channel.postMessage({ type: 'state', state: seed });

  // Forward keys back to the main window (so the speaker can drive nav from the laptop)
  window.addEventListener('keydown', (e) => {
    if (e.target.matches && e.target.matches('input,textarea,button')) return;
    channel.postMessage({ type: 'key', key: e.key, shift: e.shiftKey });
  });

  // Relay input captured inside the "Current" preview iframe (key/click/wheel)
  // onto the channel · the iframe is a separate browsing context so its events
  // never reach this window directly · it postMessages them here instead.
  window.addEventListener('message', (e) => {
    const d = e.data;
    if (!d || d.source !== 'rikiki-presenter-input') return;
    channel.postMessage({ type: d.type, key: d.key, shift: d.shift, x: d.x, y: d.y, dx: d.dx, dy: d.dy });
  });

  // Tell main window we're alive
  channel.postMessage({ type: 'hello' });
</script>
</body>
</html>`;

/** Pierce open shadow roots to find the deepest element at a viewport point ·
 *  document.elementFromPoint stops at a shadow host, but forwarded presenter
 *  clicks must reach the real interactive element inside a slide component. */
function deepElementFromPoint(x: number, y: number): Element | null {
  let el = document.elementFromPoint(x, y);
  while (el?.shadowRoot) {
    const inner = el.shadowRoot.elementFromPoint(x, y);
    if (!inner || inner === el) break;
    el = inner;
  }
  return el;
}

/** Nearest scrollable ancestor in the given wheel direction · synthetic wheel
 *  events never scroll natively, so the presenter replicates content scroll by
 *  hand and only lets the deck navigate when nothing can scroll. */
function scrollableAncestor(el: Element | null, dx: number, dy: number): Element | null {
  for (let n: Element | null = el; n; n = n.parentElement) {
    const cs = getComputedStyle(n);
    if (dy !== 0 && n.scrollHeight > n.clientHeight && /auto|scroll/.test(cs.overflowY)) return n;
    if (dx !== 0 && n.scrollWidth > n.clientWidth && /auto|scroll/.test(cs.overflowX)) return n;
  }
  return null;
}

/** Map a presenter-relative point (0..1 over the 16:9 preview) onto the live
 *  deck's viewport rect. Assumes the projected deck fills its screen at 16:9
 *  (true for a fullscreen projector) · letterbox bars would shift the mapping. */
function pointInDeck(host: DeckRoot, rx: number, ry: number): { x: number; y: number } {
  const r = host.getBoundingClientRect();
  return { x: r.left + rx * r.width, y: r.top + ry * r.height };
}

/** Resolve a forwarded presenter point (normalised x/y) to a viewport point and
 *  the deepest element under it · shared by the click and wheel handlers. */
function resolveTarget(
  host: DeckRoot,
  data: { x?: number; y?: number },
): { x: number; y: number; target: Element } {
  const { x, y } = pointInDeck(host, data.x ?? 0.5, data.y ?? 0.5);
  return { x, y, target: deepElementFromPoint(x, y) ?? host };
}

/** The deck's mouse-nav value with click-to-advance removed, preserving the
 *  other mechanisms (wheel/arrows/aux) · used by the presenter "Advance on
 *  click" option to flip just clicks without clobbering the rest. */
function withoutClickNav(nav: string | null): string {
  const v = (nav ?? 'all').trim();
  if (v === 'none') return 'none';
  if (v === '' || v === 'all') return 'wheel arrows aux';
  return (
    v
      .split(/\s+/)
      .filter((k) => k !== 'click')
      .join(' ') || 'none'
  );
}

export function installPresenter(host: DeckRoot): void {
  installed = installed ?? new WeakSet<DeckRoot>();
  if (installed.has(host)) {
    // Toggle · already open, close it
    teardown(host);
    return;
  }
  installed.add(host);

  // Capture the deck's own mouse-nav config so the "Advance on click" option can
  // toggle clicks off and back on without losing the author's other settings.
  const originalMouseNav = host.mouseNav;

  channel = new BroadcastChannel(CHANNEL);

  // When the main deck advances, push the new state to the popup.
  host.addEventListener('slide-change', () => broadcast(host));

  // Forward input events from the popup back to the live deck · the presenter's
  // "Current" pane is a control surface: keys, positional clicks and wheel all
  // act on the projected deck, which then re-broadcasts its new state.
  channel.addEventListener('message', (e: MessageEvent) => {
    const data = e.data as {
      type: string;
      key?: string;
      shift?: boolean;
      x?: number;
      y?: number;
      dx?: number;
      dy?: number;
      advanceOnClick?: boolean;
    };
    if (data?.type === 'key' && data.key) {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: data.key, shiftKey: !!data.shift, bubbles: true }),
      );
    } else if (data?.type === 'click') {
      // Positional click · land on the same element the speaker pointed at so a
      // real sub-component (expandable card, button, …) opens, and plain slide
      // areas advance through deck-root's own click-nav.
      const { x, y, target } = resolveTarget(host, data);
      const base = {
        bubbles: true,
        composed: true,
        cancelable: true,
        clientX: x,
        clientY: y,
        view: window,
        shiftKey: !!data.shift,
      };
      target.dispatchEvent(
        new PointerEvent('pointerdown', { ...base, pointerId: 1, isPrimary: true }),
      );
      target.dispatchEvent(
        new PointerEvent('pointerup', { ...base, pointerId: 1, isPrimary: true }),
      );
      target.dispatchEvent(new MouseEvent('click', base));
    } else if (data?.type === 'wheel') {
      const { x, y, target } = resolveTarget(host, data);
      const dx = data.dx ?? 0;
      const dy = data.dy ?? 0;
      const scroller = scrollableAncestor(target, dx, dy);
      if (scroller) {
        scroller.scrollBy({ left: dx, top: dy });
      } else {
        target.dispatchEvent(
          new WheelEvent('wheel', {
            bubbles: true,
            composed: true,
            cancelable: true,
            clientX: x,
            clientY: y,
            deltaX: dx,
            deltaY: dy,
            view: window,
          }),
        );
      }
    } else if (data?.type === 'config' && typeof data.advanceOnClick === 'boolean') {
      // Presenter option · flip click-to-advance on the live deck, keeping the
      // author's other mouse-nav mechanisms intact.
      host.mouseNav = data.advanceOnClick ? originalMouseNav : withoutClickNav(originalMouseNav);
    } else if (data?.type === 'hello') {
      // Popup just appeared · send a fresh state snapshot
      broadcast(host);
    }
  });

  // Send the slides fullscreen to the external screen · NEVER block the popup on
  // the permission prompt. When the screen layout is already cached we can call
  // requestFullscreen synchronously, riding this keypress's activation. The very
  // first time the layout isn't known yet: prompt for it (best-effort fullscreen
  // once it resolves) and cache it so the next P press works synchronously.
  const known = cachedScreens;
  const external = known?.screens.find((s) => s !== known.currentScreen) ?? null;
  if (external) {
    sendDeckToScreen(host, external);
  } else {
    void getScreens().then((s) => {
      if (!s) return;
      const ext = s.screens.find((x) => x !== s.currentScreen);
      if (ext) sendDeckToScreen(host, ext);
      // First press · the popup opened with default placement before the layout
      // was known. Now that it resolved, move it onto the speaker's screen.
      if (popup && s.currentScreen) movePopupTo(popup, s.currentScreen);
    });
  }

  const state = readState(host);
  const features = known?.currentScreen
    ? placementOn(known.currentScreen)
    : `popup=yes,width=${POPUP_W},height=${POPUP_H}`;
  popup = window.open('', 'rikiki-presenter', features);
  if (!popup) {
    console.warn('[rikiki/presenter] popup was blocked · allow popups for this site');
    // We may have already sent the deck fullscreen · don't strand it without a
    // presenter window (teardown also closes the channel we just opened).
    teardown(host);
    return;
  }
  popup.document.open();
  popup.document.write(PRESENTER_HTML(state));
  popup.document.close();
  // The main window is now the projected one · hide its hint chips / arrows.
  host.presenterActive = true;
  // Track native fullscreen exits (Esc) so our flag doesn't go stale.
  document.addEventListener('fullscreenchange', onFullscreenChange);

  // Tidy up if the popup is closed externally
  const watch = setInterval(() => {
    if (popup?.closed) {
      clearInterval(watch);
      teardown(host);
    }
  }, 1000);
}
