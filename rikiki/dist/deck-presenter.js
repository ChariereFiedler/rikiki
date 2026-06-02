var w=Object.defineProperty;var x=Object.getOwnPropertyDescriptor;var d=(s,a,t,e)=>{for(var i=e>1?void 0:e?x(a,t):a,r=s.length-1,n;r>=0;r--)(n=s[r])&&(i=(e?n(a,t,i):n(i))||i);return e&&i&&w(a,t,i),i};import{LitElement as E,html as m,css as H}from"https://cdn.jsdelivr.net/npm/lit@3/+esm";import{customElement as S,property as u,state as g}from"https://cdn.jsdelivr.net/npm/lit@3/decorators.js/+esm";var y=new URL("./index.js",import.meta.url).href,o=class extends E{constructor(){super(...arguments);this.current=0;this.step=0;this.blank=null;this.overview=!1;this.transition=null;this.autoplay=0;this.loop=!1;this.swipe=!1;this.slides=[];this.chapters=[];this._overviewTeardown=null;this._transitionLoaded=!1;this._autoplayTimer=null;this._autoplayPaused=!1;this._swipeStartX=0;this._swipeStartY=0;this._swipePointerId=null;this._onHoverEnter=()=>{this._autoplayPaused=!0,this._stopAutoplay()};this._onHoverLeave=()=>{this._autoplayPaused=!1,this.autoplay>0&&this._startAutoplay()};this._onPointerDown=t=>{!this.swipe||t.pointerType==="mouse"&&t.button!==0||t.target?.closest("a, button, input, textarea, [contenteditable]")||(this._swipePointerId=t.pointerId,this._swipeStartX=t.clientX,this._swipeStartY=t.clientY)};this._onPointerUp=t=>{if(this._swipePointerId===null||t.pointerId!==this._swipePointerId)return;let e=t.clientX-this._swipeStartX,i=t.clientY-this._swipeStartY;this._swipePointerId=null,!(Math.abs(e)<60||Math.abs(e)<Math.abs(i)*2)&&(this._stopAutoplay(),e<0?this._advance():this._back(),this.autoplay>0&&!this._autoplayPaused&&this._startAutoplay())};this._onHash=()=>{this._readHash(!1)};this._onKey=t=>{if(!(t.target&&t.target.matches?.("input,textarea,[contenteditable]"))){if(this.autoplay>0&&!this._autoplayPaused&&this._startAutoplay(),this.overview){(t.key==="Escape"||t.key==="o"||t.key==="O"||t.key==="Enter")&&(t.preventDefault(),this.overview=!1);return}if(this.blank){t.preventDefault(),this.blank=null;return}if(t.key==="."||t.key==="b"||t.key==="B"){t.preventDefault(),this.blank="black";return}if(t.key===","||t.key==="w"||t.key==="W"){t.preventDefault(),this.blank="white";return}if(t.key==="?"||t.key==="h"||t.key==="H"){this._toggleHelp();return}if(t.key==="Escape"){this._closeHelp();return}if(t.key==="o"||t.key==="O"){t.preventDefault(),this.overview=!0;return}if(t.key==="p"||t.key==="P"){t.preventDefault(),this._togglePresenter();return}if(t.key==="Home"){this._goTo(0);return}if(t.key==="End"){this._goTo(this.slides.length-1);return}if(t.key===" "||t.key==="PageDown"){t.preventDefault(),this._advance();return}if(t.key==="PageUp"){t.preventDefault(),this._back();return}if(this._has2DNav()){let{c:e,i}=this._coords(this.current);if(t.key==="ArrowRight"){t.preventDefault(),e+1<this.chapters.length?this._goToCoords(e+1,0):this._advance();return}if(t.key==="ArrowLeft"){t.preventDefault(),e-1>=0?this._goToCoords(e-1,0):this._back();return}if(t.key==="ArrowDown"){t.preventDefault();let r=this.chapters[e];r&&i+1<r.slides.length?this._goToCoords(e,i+1):this._advance();return}if(t.key==="ArrowUp"){t.preventDefault(),i-1>=0?this._goToCoords(e,i-1):this._back();return}}else{if(t.key==="ArrowRight"||t.key==="ArrowDown"){t.preventDefault(),this._advance();return}if(t.key==="ArrowLeft"||t.key==="ArrowUp"){t.preventDefault(),this._back();return}}}}}firstUpdated(){this.slides=Array.from(this.querySelectorAll(":scope > *")).filter(t=>t.tagName?.toLowerCase().startsWith("deck-")&&t.tagName?.toLowerCase()!=="deck-root"),this._buildChapters(),this._readHash(!0),this._applyActive(),this._applyStep(),this._updateUI(),this.requestUpdate(),window.addEventListener("keydown",this._onKey),window.addEventListener("hashchange",this._onHash),this.autoplay>0&&this._startAutoplay(),this.swipe?(this.addEventListener("pointerdown",this._onPointerDown),this.addEventListener("pointerup",this._onPointerUp),this.addEventListener("pointercancel",this._onPointerUp),this.addEventListener("mouseenter",this._onHoverEnter),this.addEventListener("mouseleave",this._onHoverLeave)):this.autoplay>0&&(this.addEventListener("mouseenter",this._onHoverEnter),this.addEventListener("mouseleave",this._onHoverLeave))}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener("keydown",this._onKey),window.removeEventListener("hashchange",this._onHash),this._stopAutoplay(),this.removeEventListener("pointerdown",this._onPointerDown),this.removeEventListener("pointerup",this._onPointerUp),this.removeEventListener("pointercancel",this._onPointerUp),this.removeEventListener("mouseenter",this._onHoverEnter),this.removeEventListener("mouseleave",this._onHoverLeave)}_startAutoplay(){this._stopAutoplay(),!(this.autoplay<=0||this._autoplayPaused)&&(this._autoplayTimer=window.setInterval(()=>this._autoTick(),this.autoplay))}_stopAutoplay(){this._autoplayTimer!==null&&(window.clearInterval(this._autoplayTimer),this._autoplayTimer=null)}_autoTick(){if(this.overview)return;this.current>=this.slides.length-1&&this.step>=this._maxSteps()&&this.loop?this._goTo(0):this._advance()}_buildChapters(){this.chapters=[];let t=null;this.slides.forEach((e,i)=>{e.tagName?.toLowerCase()==="deck-section"||!t?(t={startIdx:i,slides:[e]},this.chapters.push(t)):t.slides.push(e)})}_has2DNav(){return this.chapters.some(t=>t.slides.length>1)&&this.chapters.length>1}_coords(t){for(let e=0;e<this.chapters.length;e++){let i=this.chapters[e],r=t-i.startIdx;if(r>=0&&r<i.slides.length)return{c:e,i:r}}return{c:0,i:0}}_flatFromCoords(t,e){let i=this.chapters[t];return i?i.startIdx+Math.max(0,Math.min(i.slides.length-1,e)):0}_readHash(t){let e=location.hash,i=e.match(/^#(\d+)\.(\d+)(?:s(\d+))?$/),r=e.match(/^#(\d+)(?:\.(\d+))?$/),n=this.current,l=this.step;if(this._has2DNav()&&i){let v=parseInt(i[1],10)-1,p=parseInt(i[2],10)-1;n=this._flatFromCoords(Math.max(0,v),Math.max(0,p)),l=i[3]?parseInt(i[3],10):0}else if(r)n=parseInt(r[1],10)-1,l=r[2]?parseInt(r[2],10):0;else return;n===this.current&&l===this.step&&!t||(this.current=Math.max(0,Math.min(this.slides.length-1,n)),this.step=Math.max(0,l),t||(this._applyActive(),this._applyStep(),this._updateUI()))}_writeHash(){let t=`#${this.current+1}`+(this.step>0?`.${this.step}`:"");if(location.hash!==t)try{history.replaceState(null,"",t)}catch{}}async _toggleHelp(){(await import("./deck-help.js")).toggleHelp(this)}async _togglePresenter(){(await import("./deck-presenter.js")).installPresenter(this)}async _closeHelp(){(await import("./deck-help.js")).closeHelp(this)}async _renderOverviewIfActive(){if(!this.overview){this._overviewTeardown?.(),this._overviewTeardown=null;return}let{mountOverview:t}=await import("./deck-overview.js");this._overviewTeardown=t(this,{slides:this.slides,chapters:this.chapters,currentIdx:this.current,onPick:e=>{this.overview=!1,this._goTo(e)}})}_maxSteps(){let t=this.slides[this.current];if(!t)return 0;let e=parseInt(t.getAttribute("steps")||t.dataset?.steps||"0",10);if(e>0)return e;let i=t.querySelector("deck-code[step-groups]");if(i)try{return JSON.parse(i.getAttribute("step-groups")).length}catch{}return 0}_advance(){let t=this._maxSteps();this.step<t?(this.step++,this._applyStep(),this._updateUI(),this._writeHash()):this.current<this.slides.length-1?this._goTo(this.current+1):this.loop&&this._goTo(0)}_back(){this.step>0?(this.step--,this._applyStep(),this._updateUI(),this._writeHash()):this.current>0?(this._goTo(this.current-1),this.step=this._maxSteps(),this._applyStep(),this._updateUI(),this._writeHash()):this.loop&&(this._goTo(this.slides.length-1),this.step=this._maxSteps(),this._applyStep(),this._updateUI(),this._writeHash())}_goTo(t){this.current=Math.max(0,Math.min(this.slides.length-1,t)),this.step=0,this._applyActive(),this._applyStep(),this._updateUI(),this._writeHash()}_goToCoords(t,e){let i=Math.max(0,Math.min(this.chapters.length-1,t)),r=this.chapters[i];if(!r)return;let n=Math.max(0,Math.min(r.slides.length-1,e));this._goTo(this._flatFromCoords(i,n))}_applyActive(){let t=this.slides.find(i=>i.hasAttribute("active"))??null,e=this.slides[this.current]??null;this.slides.forEach((i,r)=>{let n=r===this.current;i.toggleAttribute("active",n),n&&i.querySelectorAll("deck-mermaid").forEach(l=>l.render?.())}),this.transition&&!this._transitionLoaded&&(this._transitionLoaded=!0,import("./deck-transition.js").then(i=>i.installTransitions(this))),t!==e&&this.dispatchEvent(new CustomEvent("slide-change",{detail:{current:e,previous:t},bubbles:!1}))}_applyStep(){let t=this.slides[this.current];t&&(t.applyStep?.(this.step),t.querySelectorAll("*").forEach(e=>e.applyStep?.(this.step)),t.querySelectorAll("[data-step-block]").forEach(e=>{let i=parseInt(e.dataset.stepBlock,10);e.style.transition="opacity 0.25s ease",e.style.opacity=this.step===0||i<=this.step?"1":"0.15"}))}_updateUI(){let t=this.slides.length,e=this.current+1,i=this.renderRoot.querySelector("#progress"),r=this.renderRoot.querySelector("#counter"),n=this.renderRoot.querySelector("#step-dots");i&&(i.style.width=e/t*100+"%"),r&&(r.textContent=`${e} / ${t}`);let l=this._maxSteps();n&&(n.innerHTML=l===0?"":Array.from({length:l},(v,p)=>`<div class="dot${p<this.step?" active":""}"></div>`).join(""))}updated(){this._updateUI(),this._renderOverviewIfActive()}render(){return m`<div id="progress"></div> <div id="counter"></div> <div id="step-dots"></div> <div id="kb-hint"> <kbd>←</kbd><kbd>→</kbd> ${this._has2DNav()?m`<kbd>↑</kbd><kbd>↓</kbd>`:""}
        <span>·</span>
        <kbd>O</kbd>
        <span>·</span>
        <kbd>P</kbd>
        <span>·</span>
        <kbd>?</kbd>
      </div>
      <slot></slot>
      ${this.blank?m`<div id="blank" data-tone="${this.blank}" @click=${()=>{this.blank=null}}></div>`:""}
    `}};o.styles=H`:host{display:block;width:100vw;height:100vh;position:relative;background:var(--deck-root-bg,var(--rik-surface-page))}#progress{position:fixed;bottom:0;left:0;height:var(--deck-root-progress-height,3px);background:var(--deck-root-progress-color,linear-gradient(90deg,var(--rik-accent),var(--rik-accent--soft)));transition:width 0.25s ease;z-index:100}#counter{position:fixed;bottom:1rem;right:1.5rem;font-size:var(--rik-font-size-xs);color:var(--deck-root-counter-color,var(--rik-text-default--faint));font-family:var(--rik-font-mono);z-index:100}#step-dots{position:fixed;bottom:1rem;left:50%;transform:translateX(-50%);display:flex;gap:6px;z-index:100}.dot{width:6px;height:6px;border-radius:50%;background:var(--deck-root-dot-bg,#d4d4d0);transition:background 0.2s}.dot.active{background:var(--deck-root-dot-active-bg,var(--rik-accent))}#kb-hint{position:fixed;bottom:1rem;left:1.5rem;display:inline-flex;align-items:center;gap:6px;font:600 0.62rem/1 var(--rik-font-mono);color:var(--deck-root-kb-hint-color,var(--rik-text-default--faint));z-index:100;opacity:0.5;transition:opacity 0.2s ease;cursor:help}#kb-hint:hover{opacity:1}#kb-hint kbd{background:var(--rik-surface-raised);border:1px solid var(--rik-border-default);border-bottom:2px solid var(--rik-border-default);border-radius:4px;padding:2px 6px;color:var(--rik-text-default);font:inherit;min-width:16px;text-align:center}#kb-hint .sep{opacity:0.4}#blank{position:fixed;inset:0;z-index:9999;cursor:pointer}#blank[data-tone="black"]{background:#000}#blank[data-tone="white"]{background:#fff}`,d([g()],o.prototype,"current",2),d([g()],o.prototype,"step",2),d([g()],o.prototype,"blank",2),d([u({type:Boolean,reflect:!0})],o.prototype,"overview",2),d([u({type:String,reflect:!0})],o.prototype,"transition",2),d([u({type:Number,reflect:!0})],o.prototype,"autoplay",2),d([u({type:Boolean,reflect:!0})],o.prototype,"loop",2),d([u({type:Boolean,reflect:!0})],o.prototype,"swipe",2),o=d([S("deck-root")],o);var b="rik-presenter",h=null,f=null,c=null;function _(s){let a=Array.from(s.children).filter(p=>p.tagName.toLowerCase().startsWith("deck-")),t=a.findIndex(p=>p.hasAttribute("active")),e=a[t]??null,i=a[t+1]??null,n=(e?.querySelector("deck-notes")?.textContent??"").trim(),v=document.querySelector('link[rel="stylesheet"][href*="rikiki"], link[rel="stylesheet"][href*="tokens"], link[rel="stylesheet"][href*="theme"]')?.href??"";return{current:t+1,total:a.length,slideHtml:e?.outerHTML??"",nextHtml:i?.outerHTML??null,notes:n,themeHref:v,bundleHref:y}}function k(s){f&&f.postMessage({type:"state",state:_(s)})}var L=s=>`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Rikiki \xB7 presenter</title>
${s.themeHref?`<link rel="stylesheet" href="${s.themeHref}">`:""}
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
  .panel iframe { width: 100%; height: 100%; border: 0; background: #0f1422; display: block; }
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
    <div id="counter">${s.current} / ${s.total}</div>
    <div><span class="ghost">P to close</span></div>
  </div>
</div>
<script>
  const channel = new BroadcastChannel('${b}');
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
    const themeHref  = ${JSON.stringify(s.themeHref)};
    const bundleHref = ${JSON.stringify(s.bundleHref)};
    const themeLink  = themeHref ? '<link rel="stylesheet" href="' + themeHref + '">' : '';
    // Mark the cloned slide [active] so its real component CSS applies
    // (:host([active]){display:flex}) instead of forcing display via !important.
    const activeSlide = slideHtml.replace(/^(\\s*<deck-[a-z-]+)/i, '$1 active');
    return '<!doctype html><html><head><meta charset="UTF-8">' + themeLink +
      '<script type="module" src="' + bundleHref + '"><' + '/script>' +
      '<style>html,body{margin:0;padding:0;height:100%;overflow:hidden;background:#0f1422}' +
      'deck-root{position:absolute;inset:0}</style>' +
      '</head><body><deck-root>' + activeSlide + '</deck-root></body></html>';
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
  const seed = ${JSON.stringify(s)};
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
</html>`;function D(s){if(c=c??new WeakSet,c.has(s)){h?.close(),h=null;return}c.add(s),f=new BroadcastChannel(b),s.addEventListener("slide-change",()=>k(s)),f.addEventListener("message",e=>{let i=e.data;i?.type==="key"&&i.key&&window.dispatchEvent(new KeyboardEvent("keydown",{key:i.key,shiftKey:!!i.shift,bubbles:!0})),i?.type==="hello"&&k(s)});let a=_(s);if(h=window.open("","rikiki-presenter","width=1280,height=800,popup=yes"),!h){console.warn("[rikiki/presenter] popup was blocked \xB7 allow popups for this site"),c.delete(s);return}h.document.open(),h.document.write(L(a)),h.document.close();let t=setInterval(()=>{h&&h.closed&&(clearInterval(t),c?.delete(s),h=null)},1e3)}export{D as installPresenter};
