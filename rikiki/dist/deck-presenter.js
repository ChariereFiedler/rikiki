var v="rik-presenter",L=new URL("./index.js",import.meta.url).href,s=null,d=null,i=null,l=null,u=!1;async function E(){if(l)return l;let e=window.getScreenDetails;if(!e)return null;try{return l=await e.call(window),l}catch{return null}}var h=1280,g=720;function D(e){let t=Math.round(e.availLeft+(e.availWidth-h)/2),n=Math.round(e.availTop+(e.availHeight-g)/2);return`popup=yes,width=${h},height=${g},left=${t},top=${n}`}function b(e,t){e.requestFullscreen?.({screen:t}).then(()=>{if(!i?.has(e)){document.exitFullscreen?.().catch(()=>{});return}u=!0}).catch(()=>{})}function w(){document.fullscreenElement||(u=!1)}function f(){document.removeEventListener("fullscreenchange",w),u&&document.fullscreenElement&&document.exitFullscreen?.().catch(()=>{}),u=!1}function x(e){let t=Array.from(e.children).filter(a=>a.tagName.toLowerCase().startsWith("deck-")),n=t.findIndex(a=>a.hasAttribute("active")),c=t[n]??null,m=t[n+1]??null,o=(c?.querySelector("deck-notes")?.textContent??"").trim(),p=document.querySelector('link[rel="stylesheet"][href*="rikiki"], link[rel="stylesheet"][href*="tokens"], link[rel="stylesheet"][href*="theme"]')?.href??"",S=Array.from(document.querySelectorAll("style")).map(a=>a.textContent??"").join(`
`),H=document.querySelector('script[type="module"][data-rikiki-bundle]')?.textContent??"";return{current:n+1,total:t.length,slideHtml:c?.outerHTML??"",nextHtml:m?.outerHTML??null,notes:o,themeHref:p,inlineStyles:S,bundleHref:L,bundleInline:H}}function k(e){d&&d.postMessage({type:"state",state:x(e)})}var I=e=>`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Rikiki \xB7 presenter</title>
${e.themeHref?`<link rel="stylesheet" href="${e.themeHref}">`:""}
<style>
  html, body { margin: 0; padding: 0; height: 100%; background: #0f1422; color: #fafafa; font-family: var(--rik-font-sans, system-ui); }
  .grid {
    display: grid;
    grid-template-columns: 2fr 1fr;
    grid-template-rows: 1fr auto;
    gap: clamp(8px, 1.5vw, 16px);
    padding: clamp(8px, 1.5vw, 16px);
    height: 100vh;
    box-sizing: border-box;
  }
  @media (max-width: 1000px) {
    .grid { grid-template-columns: 1fr; grid-template-rows: 1fr 1fr auto auto; }
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
  /* Preview panes center a 16:9 box so the thumbnail matches the projection
     geometry regardless of the pane/window shape (issue #5) \xB7 the size
     container lets the iframe size against the pane in cq units. */
  #current .body, #next .body { display: grid; place-items: center; container-type: size; }
  .panel iframe { border: 0; background: #0f1422; display: block; }
  #current-frame, #next-frame {
    aspect-ratio: 16 / 9;
    width: min(100cqw, calc(100cqh * 16 / 9));
    height: auto;
    max-width: 100%;
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
  <section class="panel" id="notes-panel" style="grid-column: 1 / -1;">
    <header>Speaker notes</header>
    <div id="notes" class="body"></div>
  </section>
  <div id="footer">
    <div><span id="timer">00:00</span> <button id="timer-toggle">Pause</button> <button id="timer-reset">Reset</button></div>
    <div id="counter">${e.current} / ${e.total}</div>
    <div><span class="ghost">P to close</span></div>
  </div>
</div>
<script>
  const channel = new BroadcastChannel('${v}');
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

  function wrapFrame(slideHtml) {
    const themeHref    = ${JSON.stringify(e.themeHref)};
    const inlineStyles = ${JSON.stringify(e.inlineStyles)};
    const bundleHref   = ${JSON.stringify(e.bundleHref)};
    const bundleInline = ${JSON.stringify(e.bundleInline)};
    const themeLink  = themeHref ? '<link rel="stylesheet" href="' + themeHref + '">' : '';
    const themeStyle = inlineStyles ? '<style>' + inlineStyles + '</style>' : '';
    // Bootstrap rikiki inside the iframe so its <deck-*> elements upgrade.
    //  \xB7 single-file deck \u2192 the framework is inlined and tagged \xB7 re-inline it
    //    so the module base is the iframe document URL (a <script src="data:">
    //    or a non-existent ./index.js would break new URL(rel, import.meta.url)
    //    and abort registration). Escape any script end-tag so it can't close
    //    this block early (this comment must avoid the literal too).
    //  \xB7 served deck \u2192 load the real bundle URL with <script src>.
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
    // The deck always letterboxes into its logical canvas, so the slide keeps
    // its 16:9 proportions regardless of the pane's shape \xB7 just drop the
    // hint / nav-arrow chrome for a clean, correctly-shaped thumbnail.
    return '<!doctype html><html><head><meta charset="UTF-8">' + themeLink + themeStyle +
      bundleTag +
      '<style>html,body{margin:0;padding:0;height:100%;overflow:hidden;background:#0f1422}' +
      'deck-root{position:absolute;inset:0}</style>' +
      '</head><body><deck-root no-hint no-arrows>' + activeSlide + '</deck-root></body></html>';
  }

  channel.onmessage = (e) => {
    if (e.data?.type !== 'state') return;
    const s = e.data.state;
    counter.textContent = s.current + ' / ' + s.total;
    notes.textContent = s.notes;
    if (s.slideHtml) current.srcdoc = wrapFrame(s.slideHtml);
    if (s.nextHtml)  next.srcdoc = wrapFrame(s.nextHtml);
    else next.srcdoc = '<!doctype html><html><body style="background:#0f1422;color:rgba(232,228,240,0.4);display:flex;align-items:center;justify-content:center;font-family:system-ui">End of deck</body></html>';
  };

  // Initial paint from the seed state
  const seed = ${JSON.stringify(e)};
  channel.postMessage({ type: 'state', state: seed });

  // Forward keys back to the main window (so the speaker can drive nav from the laptop)
  window.addEventListener('keydown', (e) => {
    if (e.target.matches && e.target.matches('input,textarea,button')) return;
    channel.postMessage({ type: 'key', key: e.key, shift: e.shiftKey });
  });

  // Tell main window we're alive
  channel.postMessage({ type: 'hello' });
<\/script>
</body>
</html>`;function B(e){if(i=i??new WeakSet,i.has(e)){s?.close(),s=null,e.presenterActive=!1,f();return}i.add(e),d=new BroadcastChannel(v),e.addEventListener("slide-change",()=>k(e)),d.addEventListener("message",o=>{let r=o.data;r?.type==="key"&&r.key&&window.dispatchEvent(new KeyboardEvent("keydown",{key:r.key,shiftKey:!!r.shift,bubbles:!0})),r?.type==="hello"&&k(e)});let t=l,n=t?.screens.find(o=>o!==t.currentScreen)??null;n?b(e,n):E().then(o=>{let r=o?.screens.find(p=>p!==o.currentScreen);r&&b(e,r)});let c=x(e),m=t?.currentScreen?D(t.currentScreen):`popup=yes,width=${h},height=${g}`;if(s=window.open("","rikiki-presenter",m),!s){console.warn("[rikiki/presenter] popup was blocked \xB7 allow popups for this site"),i.delete(e),f();return}s.document.open(),s.document.write(I(c)),s.document.close(),e.presenterActive=!0,document.addEventListener("fullscreenchange",w);let y=setInterval(()=>{s?.closed&&(clearInterval(y),i?.delete(e),s=null,e.presenterActive=!1,f())},1e3)}export{B as installPresenter};
