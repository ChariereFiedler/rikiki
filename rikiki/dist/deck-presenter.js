var H="rik-presenter",R=new URL("./index.js",import.meta.url).href,a=null,p=null,u=null,f=null,h=!1;async function I(){if(f)return f;let e=window.getScreenDetails;if(!e)return null;try{return f=await e.call(window),f}catch{return null}}var g=1280,y=720;function C(e){return{left:Math.round(e.availLeft+(e.availWidth-g)/2),top:Math.round(e.availTop+(e.availHeight-y)/2)}}function M(e){let{left:n,top:r}=C(e);return`popup=yes,width=${g},height=${y},left=${n},top=${r}`}function T(e,n){let{left:r,top:t}=C(n);e.resizeTo(g,y),e.moveTo(r,t)}function S(e,n){e.requestFullscreen?.({screen:n}).then(()=>{if(!u?.has(e)){document.exitFullscreen?.().catch(()=>{});return}h=!0}).catch(()=>{})}function P(){document.fullscreenElement||(h=!1)}function B(){document.removeEventListener("fullscreenchange",P),h&&document.fullscreenElement&&document.exitFullscreen?.().catch(()=>{}),h=!1}function v(e){a?.close(),a=null,p?.close(),p=null,u?.delete(e),e.presenterActive=!1,B()}function D(e){let n=Array.from(e.children).filter(i=>i.tagName.toLowerCase().startsWith("deck-")),r=n.findIndex(i=>i.hasAttribute("active")),t=n[r]??null,d=n[r+1]??null,b=(t?.querySelector("deck-notes")?.textContent??"").trim(),o=document.querySelector('link[rel="stylesheet"][href*="rikiki"], link[rel="stylesheet"][href*="tokens"], link[rel="stylesheet"][href*="theme"]')?.href??"",l=Array.from(document.querySelectorAll("style")).map(i=>i.textContent??"").join(`
`),m=document.querySelector('script[type="module"][data-rikiki-bundle]')?.textContent??"";return{current:r+1,total:n.length,slideHtml:t?.outerHTML??"",nextHtml:d?.outerHTML??null,notes:b,themeHref:o,inlineStyles:l,bundleHref:R,bundleInline:m}}function E(e){p&&p.postMessage({type:"state",state:D(e)})}var N=e=>`<!doctype html>
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
     projection geometry regardless of pane shape (issue #5) \xB7 the size
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
    <div id="counter">${e.current} / ${e.total}</div>
    <div>
      <label class="opt"><input type="checkbox" id="opt-advance" checked> Advance on click</label>
      <span class="ghost">\xB7 P to close</span>
    </div>
  </div>
</div>
<script>
  const channel = new BroadcastChannel('${H}');
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

  // Presentation options \xB7 push each change to the live deck over the channel.
  document.getElementById('opt-advance').addEventListener('change', (e) => {
    channel.postMessage({ type: 'config', advanceOnClick: e.target.checked });
  });

  function wrapFrame(slideHtml, forward) {
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
    // Only the "Current" pane is a control surface \xB7 it captures key/click/wheel
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
    // its 16:9 proportions regardless of the pane's shape \xB7 just drop the
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
  const seed = ${JSON.stringify(e)};
  channel.postMessage({ type: 'state', state: seed });

  // Forward keys back to the main window (so the speaker can drive nav from the laptop)
  window.addEventListener('keydown', (e) => {
    if (e.target.matches && e.target.matches('input,textarea,button')) return;
    channel.postMessage({ type: 'key', key: e.key, shift: e.shiftKey });
  });

  // Relay input captured inside the "Current" preview iframe (key/click/wheel)
  // onto the channel \xB7 the iframe is a separate browsing context so its events
  // never reach this window directly \xB7 it postMessages them here instead.
  window.addEventListener('message', (e) => {
    const d = e.data;
    if (!d || d.source !== 'rikiki-presenter-input') return;
    channel.postMessage({ type: d.type, key: d.key, shift: d.shift, x: d.x, y: d.y, dx: d.dx, dy: d.dy });
  });

  // Tell main window we're alive
  channel.postMessage({ type: 'hello' });
<\/script>
</body>
</html>`;function W(e,n){let r=document.elementFromPoint(e,n);for(;r?.shadowRoot;){let t=r.shadowRoot.elementFromPoint(e,n);if(!t||t===r)break;r=t}return r}function F(e,n,r){for(let t=e;t;t=t.parentElement){let d=getComputedStyle(t);if(r!==0&&t.scrollHeight>t.clientHeight&&/auto|scroll/.test(d.overflowY)||n!==0&&t.scrollWidth>t.clientWidth&&/auto|scroll/.test(d.overflowX))return t}return null}function $(e,n,r){let t=e.getBoundingClientRect();return{x:t.left+n*t.width,y:t.top+r*t.height}}function L(e,n){let{x:r,y:t}=$(e,n.x??.5,n.y??.5);return{x:r,y:t,target:W(r,t)??e}}function A(e){let n=(e??"all").trim();return n==="none"?"none":n===""||n==="all"?"wheel arrows aux":n.split(/\s+/).filter(r=>r!=="click").join(" ")||"none"}function O(e){if(u=u??new WeakSet,u.has(e)){v(e);return}u.add(e);let n=e.mouseNav;p=new BroadcastChannel(H),e.addEventListener("slide-change",()=>E(e)),p.addEventListener("message",s=>{let o=s.data;if(o?.type==="key"&&o.key)window.dispatchEvent(new KeyboardEvent("keydown",{key:o.key,shiftKey:!!o.shift,bubbles:!0}));else if(o?.type==="click"){let{x:l,y:m,target:i}=L(e,o),c={bubbles:!0,composed:!0,cancelable:!0,clientX:l,clientY:m,view:window,shiftKey:!!o.shift};i.dispatchEvent(new PointerEvent("pointerdown",{...c,pointerId:1,isPrimary:!0})),i.dispatchEvent(new PointerEvent("pointerup",{...c,pointerId:1,isPrimary:!0})),i.dispatchEvent(new MouseEvent("click",c))}else if(o?.type==="wheel"){let{x:l,y:m,target:i}=L(e,o),c=o.dx??0,k=o.dy??0,x=F(i,c,k);x?x.scrollBy({left:c,top:k}):i.dispatchEvent(new WheelEvent("wheel",{bubbles:!0,composed:!0,cancelable:!0,clientX:l,clientY:m,deltaX:c,deltaY:k,view:window}))}else o?.type==="config"&&typeof o.advanceOnClick=="boolean"?e.mouseNav=o.advanceOnClick?n:A(n):o?.type==="hello"&&E(e)});let r=f,t=r?.screens.find(s=>s!==r.currentScreen)??null;t?S(e,t):I().then(s=>{if(!s)return;let o=s.screens.find(l=>l!==s.currentScreen);o&&S(e,o),a&&s.currentScreen&&T(a,s.currentScreen)});let d=D(e),w=r?.currentScreen?M(r.currentScreen):`popup=yes,width=${g},height=${y}`;if(a=window.open("","rikiki-presenter",w),!a){console.warn("[rikiki/presenter] popup was blocked \xB7 allow popups for this site"),v(e);return}a.document.open(),a.document.write(N(d)),a.document.close(),e.presenterActive=!0,document.addEventListener("fullscreenchange",P);let b=setInterval(()=>{a?.closed&&(clearInterval(b),v(e))},1e3)}export{O as installPresenter};
