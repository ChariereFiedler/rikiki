var ht=Object.defineProperty;var er=Object.getOwnPropertyDescriptor;var ke=(i,t)=>()=>(i&&(t=i(i=0)),t);var He=(i,t)=>{for(var e in t)ht(i,e,{get:t[e],enumerable:!0})};var o=(i,t,e,r)=>{for(var s=r>1?void 0:r?er(t,e):t,a=i.length-1,n;a>=0;a--)(n=i[a])&&(s=(r?n(t,e,s):n(s))||s);return r&&s&&ht(t,e,s),s};var rt={};He(rt,{closeHelp:()=>Mt,toggleHelp:()=>yr});function kr(i){let t=i.querySelector("#kb-overlay");if(t)return t;if(!i.querySelector(`style[${zt}]`)){let s=document.createElement("style");s.setAttribute(zt,"1"),s.textContent=fr,i.appendChild(s)}let e=document.createElement("div");return e.innerHTML=gr,t=e.firstElementChild,i.appendChild(t),t.addEventListener("click",()=>Mt(i.host)),t.querySelector(".kb-card")?.addEventListener("click",s=>s.stopPropagation()),t}function yr(i){if(!i.shadowRoot)return;kr(i.shadowRoot).classList.toggle("open")}function Mt(i){i.shadowRoot?.querySelector("#kb-overlay")?.classList.remove("open")}var zt,fr,gr,Re=ke(()=>{"use strict";zt="data-deck-help",fr=`
  #kb-overlay {
    position: fixed; inset: 0;
    background: rgba(10,10,10,0.7);
    display: none; align-items: center; justify-content: center;
    z-index: 200;
    backdrop-filter: blur(8px);
    opacity: 0;
    transition: opacity 0.2s ease;
  }
  #kb-overlay.open { display: flex; opacity: 1; }
  .kb-card {
    background: var(--rik-surface-raised); color: var(--rik-text-default);
    border: 1px solid var(--rik-border-default);
    border-radius: var(--rik-radius-lg);
    padding: 2.2rem 2.5rem;
    box-shadow: 0 24px 80px rgba(0,0,0,0.5);
    width: min(560px, 90vw);
    font-family: var(--rik-font-sans);
    animation: kbSlideIn 0.22s ease;
  }
  @keyframes kbSlideIn {
    from { transform: translateY(8px) scale(0.98); opacity: 0; }
    to   { transform: translateY(0) scale(1); opacity: 1; }
  }
  .kb-card-header {
    display: flex; align-items: baseline; justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1.4rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid var(--rik-border-default);
  }
  .kb-card h3 {
    font: 700 1.05rem/1.2 var(--rik-font-sans);
    letter-spacing: -0.01em;
    color: var(--rik-text-default);
  }
  .kb-group-label {
    font: 700 0.62rem/1 var(--rik-font-mono);
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--rik-text-default--faint);
    margin: 0.8rem 0 0.3rem;
  }
  .kb-group-label:first-of-type { margin-top: 0; }
  .kb-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 0.4rem 0;
    font-size: 0.88rem;
  }
  .kb-row .keys { display: flex; gap: 4px; align-items: center; }
  .kb-row kbd {
    background: linear-gradient(180deg, #fff 0%, var(--rik-surface-page) 100%);
    border: 1px solid var(--rik-border-default);
    border-bottom: 2px solid #c4c4be;
    border-radius: 5px;
    padding: 3px 9px;
    font: 600 0.78rem/1 var(--rik-font-mono);
    color: var(--rik-text-default);
    min-width: 22px; text-align: center;
    box-shadow: 0 1px 0 rgba(255,255,255,0.5) inset;
  }
  .kb-row .desc { color: var(--rik-text-default--muted); }
`,gr=`
  <div id="kb-overlay">
    <div class="kb-card">
      <div class="kb-card-header">
        <h3>Keyboard shortcuts</h3>
        <span class="esc"><kbd>Esc</kbd> to close</span>
      </div>
      <div class="kb-group-label">Navigation</div>
      <div class="kb-row"><span class="desc">Next slide (linear)</span><span class="keys"><kbd>Space</kbd><kbd>PgDn</kbd></span></div>
      <div class="kb-row"><span class="desc">Previous slide</span><span class="keys"><kbd>PgUp</kbd></span></div>
      <div class="kb-row"><span class="desc">Previous / Next chapter</span><span class="keys"><kbd>&larr;</kbd><kbd>&rarr;</kbd></span></div>
      <div class="kb-row"><span class="desc">Up / Down inside a chapter</span><span class="keys"><kbd>&uarr;</kbd><kbd>&darr;</kbd></span></div>
      <div class="kb-row"><span class="desc">First / Last slide</span><span class="keys"><kbd>Home</kbd><kbd>End</kbd></span></div>
      <div class="kb-group-label">View</div>
      <div class="kb-row"><span class="desc">Toggle overview</span><span class="keys"><kbd>O</kbd></span></div>
      <div class="kb-row"><span class="desc">Show this help</span><span class="keys"><kbd>?</kbd><kbd>H</kbd></span></div>
    </div>
  </div>
`});var Nt={};He(Nt,{installPresenter:()=>wr});function Pt(i){let t=Array.from(i.children).filter(v=>v.tagName.toLowerCase().startsWith("deck-")),e=t.findIndex(v=>v.hasAttribute("active")),r=t[e]??null,s=t[e+1]??null,n=(r?.querySelector("deck-notes")?.textContent??"").trim(),h=document.querySelector('link[rel="stylesheet"][href*="rikiki"], link[rel="stylesheet"][href*="tokens"], link[rel="stylesheet"][href*="theme"]')?.href??"";return{current:e+1,total:t.length,slideHtml:r?.outerHTML??"",nextHtml:s?.outerHTML??null,notes:n,themeHref:h,bundleHref:br}}function Ht(i){Ue&&Ue.postMessage({type:"state",state:Pt(i)})}function wr(i){if(de=de??new WeakSet,de.has(i)){j?.close(),j=null;return}de.add(i),Ue=new BroadcastChannel(Ct),i.addEventListener("slide-change",()=>Ht(i)),Ue.addEventListener("message",r=>{let s=r.data;s?.type==="key"&&s.key&&window.dispatchEvent(new KeyboardEvent("keydown",{key:s.key,shiftKey:!!s.shift,bubbles:!0})),s?.type==="hello"&&Ht(i)});let t=Pt(i);if(j=window.open("","rikiki-presenter","width=1280,height=800,popup=yes"),!j){console.warn("[rikiki/presenter] popup was blocked \xB7 allow popups for this site"),de.delete(i);return}j.document.open(),j.document.write(xr(t)),j.document.close();let e=setInterval(()=>{j&&j.closed&&(clearInterval(e),de?.delete(i),j=null)},1e3)}var Ct,br,j,Ue,de,xr,it=ke(()=>{"use strict";Ct="rik-presenter",br=new URL("./index.js",import.meta.url).href,j=null,Ue=null,de=null;xr=i=>`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Rikiki \xB7 presenter</title>
${i.themeHref?`<link rel="stylesheet" href="${i.themeHref}">`:""}
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
    <div id="counter">${i.current} / ${i.total}</div>
    <div><span class="ghost">P to close</span></div>
  </div>
</div>
<script>
  const channel = new BroadcastChannel('${Ct}');
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
    const themeHref  = ${JSON.stringify(i.themeHref)};
    const bundleHref = ${JSON.stringify(i.bundleHref)};
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
  const seed = ${JSON.stringify(i)};
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
</html>`});var Rt={};He(Rt,{mountOverview:()=>Ar});function Er(i){if(i.querySelector(`style[${It}]`))return;let t=document.createElement("style");t.setAttribute(It,"1"),t.textContent=_r,i.appendChild(t)}function $r(i,t){if(i.querySelector(`link[${Ot}]`))return;let e=document.createElement("link");e.rel="stylesheet",e.setAttribute(Ot,"1"),e.href=new URL("../tokens.css",t).href,i.appendChild(e)}function jt(i){let e=i.slides[0]?.querySelector("h1");return e?Array.from(e.childNodes).map(r=>r.nodeName==="BR"?" ":r.textContent??"").join("").replace(/\s+/g," ").trim()||`Slide ${i.startIdx+1}`:`Slide ${i.startIdx+1}`}function Sr(i){return(i.textContent||"").replace(/\s+/g," ").trim().slice(0,400).toLowerCase()}function Ar(i,t){let e=i.shadowRoot;if(!e)return()=>{};Er(e),$r(e,import.meta.url);let r=e.querySelector("#overview-grid");r||(r=document.createElement("div"),r.id="overview-grid",e.appendChild(r)),r.innerHTML="";let s=t.slides.length,a=s>60,n=s>300?140:s>150?160:s>60?180:220;r.style.setProperty("--ov-cell-min",n+"px");let d=window.innerWidth,h=window.innerHeight;r.style.setProperty("--ov-thumb-w",`${d}px`),r.style.setProperty("--ov-thumb-h",`${h}px`),requestAnimationFrame(()=>{let k=r.querySelector(".ov-cell")?.clientWidth??n;r.style.setProperty("--overview-scale",String(k/d))});let v=document.createElement("div");v.className="ov-bar";let g=document.createElement("input");g.className="ov-search",g.type="search",g.placeholder=`Search ${s} slides \xB7 type to filter`,g.spellcheck=!1,v.appendChild(g);let f=document.createElement("span");f.className="ov-count",f.textContent=`${s} slides \xB7 ${t.chapters.length} chapters`,v.appendChild(f);let x=document.createElement("span");x.className="ov-hint",x.textContent="O \xB7 Esc \xB7 close",v.appendChild(x),r.appendChild(v);let S=document.createElement("div");S.className="ov-body"+(a?"":" compact"),r.appendChild(S);let L=a?document.createElement("aside"):null;L&&(L.className="ov-aside",S.appendChild(L));let Z=document.createElement("div");Z.className="ov-main"+(a?"":" ov-path"),S.appendChild(Z);let Be=[],lt=[],dt=new WeakMap,qe=new IntersectionObserver(k=>{for(let A of k){if(!A.isIntersecting)continue;let b=A.target;if(b.dataset.loaded)continue;let H=dt.get(b);if(!H)continue;let y=document.createElement("div");y.className="ov-thumb";let I=H.cloneNode(!0);I.setAttribute("active",""),y.appendChild(I),b.insertBefore(y,b.firstChild),b.dataset.loaded="1",qe.unobserve(b)}},{root:null,rootMargin:"300px 0px",threshold:0});t.chapters.forEach((k,A)=>{let b=document.createElement("section");if(b.className="ov-chapter",b.id=`ov-chapter-${A}`,a){let y=document.createElement("header");y.className="ov-chapter-head";let I=document.createElement("span");I.className="ov-chapter-num",I.textContent=String(A+1).padStart(2,"0"),y.appendChild(I);let C=document.createElement("span");C.className="ov-chapter-title",C.textContent=jt(k),y.appendChild(C);let w=document.createElement("span");w.className="ov-chapter-count",w.textContent=`${k.slides.length} slide${k.slides.length>1?"s":""}`,y.appendChild(w),b.appendChild(y)}let H=document.createElement("div");if(H.className="ov-row",k.slides.forEach((y,I)=>{if(!a&&I>0){let pt=document.createElement("div");pt.className="ov-connector",H.appendChild(pt)}let C=k.startIdx+I,w=document.createElement("div");w.className="ov-cell",w.dataset.idx=String(C),w.dataset.search=Sr(y),C===t.currentIdx&&(w.dataset.current="1"),dt.set(w,y),qe.observe(w);let Q=document.createElement("span");Q.className="ov-cell-label",Q.textContent=String(C+1),w.appendChild(Q),w.addEventListener("click",()=>t.onPick(C)),H.appendChild(w)}),b.appendChild(H),Z.appendChild(b),Be.push(b),L){let y=document.createElement("button");y.type="button",y.className="ov-aside-item",t.currentIdx>=k.startIdx&&t.currentIdx<k.startIdx+k.slides.length&&(y.dataset.active="1");let C=document.createElement("span");C.className="ov-aside-num",C.textContent=String(A+1).padStart(2,"0"),y.appendChild(C);let w=document.createElement("span");w.className="ov-aside-text",w.textContent=jt(k);let Q=document.createElement("div");Q.className="ov-aside-count",Q.textContent=`${k.slides.length} slide${k.slides.length>1?"s":""}`,w.appendChild(Q),y.appendChild(w),y.addEventListener("click",()=>{b.scrollIntoView({behavior:"smooth",block:"start"})}),L.appendChild(y),lt.push(y)}});let Ye=null;L&&(Ye=new IntersectionObserver(k=>{let A=k.filter(b=>b.isIntersecting).sort((b,H)=>b.boundingClientRect.top-H.boundingClientRect.top);if(A.length>0){let b=Be.indexOf(A[0].target);b>=0&&lt.forEach((H,y)=>{y===b?H.dataset.active="1":delete H.dataset.active})}},{root:Z,rootMargin:"0px 0px -70% 0px",threshold:0}),Be.forEach(k=>Ye.observe(k)));let ct=r.querySelectorAll(".ov-cell");return g.addEventListener("input",()=>{let k=g.value.trim().toLowerCase();if(!k){ct.forEach(A=>delete A.dataset.filteredOut);return}ct.forEach(A=>{(A.dataset.search||"").includes(k)?delete A.dataset.filteredOut:A.dataset.filteredOut="1"})}),requestAnimationFrame(()=>{let k=r.querySelector(".ov-cell[data-current]");k&&k.scrollIntoView({block:"center"})}),()=>{Ye?.disconnect(),qe.disconnect(),r&&(r.innerHTML="")}}var It,Ot,_r,st=ke(()=>{"use strict";It="data-deck-overview",Ot="data-overview-tokens",_r=`
  :host([overview]) ::slotted(*) { display: none !important; }
  :host([overview]) #overview-grid {
    position: fixed; inset: 0;
    background: var(--rik-surface-page);
    overflow: hidden;
    z-index: 80;
    display: grid;
    grid-template-rows: auto 1fr;
  }

  /* \u2500\u2500 Top bar \xB7 search, slide count, close hint \u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
  :host([overview]) .ov-bar {
    display: flex; align-items: center; gap: 16px;
    padding: 14px 28px;
    background: var(--rik-surface-raised);
    border-bottom: 1px solid var(--rik-border-default);
    font: 700 0.78rem/1 var(--rik-font-mono);
    letter-spacing: 0.10em;
    color: var(--rik-text-default--faint);
  }
  :host([overview]) .ov-bar .ov-search {
    flex: 1;
    appearance: none;
    background: var(--rik-surface-raised--strong);
    border: 1px solid var(--rik-border-default);
    border-radius: var(--rik-radius-sm);
    padding: 8px 14px;
    font: inherit;
    color: var(--rik-text-default);
    letter-spacing: 0;
    max-width: 480px;
  }
  :host([overview]) .ov-bar .ov-search:focus {
    outline: none;
    border-color: var(--rik-accent);
    box-shadow: 0 0 0 3px var(--rik-accent--soft);
  }
  :host([overview]) .ov-bar .ov-count { color: var(--rik-accent); }
  :host([overview]) .ov-bar .ov-hint { letter-spacing: 0.16em; text-transform: uppercase; }

  /* \u2500\u2500 Sidebar layout (many slides) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
  :host([overview]) .ov-body {
    display: grid;
    grid-template-columns: 240px 1fr;
    min-height: 0;
  }
  :host([overview]) .ov-body.compact { grid-template-columns: 1fr; }
  :host([overview]) .ov-aside {
    border-right: 1px solid var(--rik-border-default);
    background: var(--rik-surface-raised);
    overflow-y: auto;
    padding: 16px 0;
  }
  :host([overview]) .ov-aside-item {
    display: grid;
    grid-template-columns: 36px 1fr;
    gap: 10px;
    align-items: baseline;
    padding: 10px 16px;
    cursor: pointer;
    border-left: 3px solid transparent;
    color: var(--rik-text-default--muted);
    transition: background 0.12s, color 0.12s, border-color 0.12s;
  }
  :host([overview]) .ov-aside-item:hover {
    background: var(--rik-surface-tint);
    color: var(--rik-text-default);
  }
  :host([overview]) .ov-aside-item[data-active] {
    background: var(--rik-accent--faint);
    border-left-color: var(--rik-accent);
    color: var(--rik-text-default);
  }
  :host([overview]) .ov-aside-num {
    font: 800 0.85rem/1 var(--rik-font-mono);
    color: var(--rik-accent);
  }
  :host([overview]) .ov-aside-text {
    font: 700 0.92rem/1.3 var(--rik-font-display, var(--rik-font-sans));
    letter-spacing: -0.005em;
  }
  :host([overview]) .ov-aside-count {
    font: 600 0.70rem/1 var(--rik-font-mono);
    color: var(--rik-text-default--faint);
    margin-top: 4px;
  }

  /* \u2500\u2500 Main scroll area \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
  :host([overview]) .ov-main {
    overflow-y: auto;
    padding: 24px 32px 48px;
    display: flex; flex-direction: column;
    gap: 32px;
    min-width: 0;
  }
  :host([overview]) .ov-chapter {
    display: flex; flex-direction: column;
    gap: 12px;
    scroll-margin-top: 24px;
  }
  :host([overview]) .ov-chapter-head {
    display: flex; align-items: baseline; gap: 12px;
    padding-bottom: 6px;
    border-bottom: 2px solid var(--rik-accent);
  }
  :host([overview]) .ov-chapter-num {
    font: 800 0.85rem/1 var(--rik-font-mono);
    color: var(--rik-accent);
    letter-spacing: 0.12em;
  }
  :host([overview]) .ov-chapter-title {
    font: 800 1.2rem/1.2 var(--rik-font-display, var(--rik-font-sans));
    color: var(--rik-text-default);
    letter-spacing: -0.012em;
    flex: 1;
    min-width: 0;
  }
  :host([overview]) .ov-chapter-count {
    font: 700 0.72rem/1 var(--rik-font-mono);
    color: var(--rik-text-default--faint);
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }
  :host([overview]) .ov-row {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(var(--ov-cell-min, 180px), 1fr));
    gap: 12px;
  }

  /* \u2500\u2500 Path layout (\u2264 60 slides) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
  :host([overview]) .ov-path .ov-row {
    display: flex; gap: 14px; align-items: center; flex-wrap: wrap;
  }
  :host([overview]) .ov-path .ov-connector {
    flex: 0 0 auto;
    width: 16px; height: 2px;
    background: var(--rik-border-default);
  }
  :host([overview]) .ov-path .ov-cell { flex: 0 0 auto; width: clamp(160px, 14vw, 260px); }

  /* \u2500\u2500 Thumbnail cell \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
  :host([overview]) .ov-cell {
    position: relative;
    aspect-ratio: 16 / 9;
    background:
      linear-gradient(180deg, var(--rik-surface-raised) 0%, var(--rik-surface-sunken) 100%);
    border: 1px solid var(--rik-border-default);
    border-radius: var(--rik-radius-md);
    overflow: hidden;
    cursor: pointer;
    transition: border-color 0.12s ease, transform 0.12s ease, box-shadow 0.12s ease, opacity 0.15s;
    box-shadow: var(--rik-elevation-1);
  }
  :host([overview]) .ov-cell:hover {
    transform: translateY(-2px) scale(1.015);
    border-color: var(--rik-accent--soft);
    box-shadow: var(--rik-elevation-3);
    z-index: 1;
  }
  :host([overview]) .ov-cell[data-current] {
    border-color: var(--rik-accent);
    box-shadow: 0 0 0 3px var(--rik-accent--soft), var(--rik-elevation-2);
  }
  :host([overview]) .ov-cell[data-filtered-out] { opacity: 0.10; pointer-events: none; transform: scale(0.96); }
  :host([overview]) .ov-cell:not([data-loaded]) .ov-thumb { display: none; }
  :host([overview]) .ov-cell:not([data-loaded])::before {
    content: '';
    position: absolute; inset: 0;
    background:
      linear-gradient(110deg,
        transparent 0%,
        transparent 38%,
        rgba(42, 37, 32, 0.04) 50%,
        transparent 62%,
        transparent 100%);
    background-size: 200% 100%;
    animation: ov-shimmer 1.4s linear infinite;
  }
  @keyframes ov-shimmer {
    from { background-position: 100% 0; }
    to   { background-position: -100% 0; }
  }
  :host([overview]) .ov-thumb {
    position: absolute; top: 0; left: 0;
    width: var(--ov-thumb-w, 1920px); height: var(--ov-thumb-h, 1080px);
    transform: scale(var(--overview-scale, 0.2));
    transform-origin: top left;
    pointer-events: none;
  }
  :host([overview]) .ov-thumb > * { display: flex !important; }
  :host([overview]) .ov-cell-label {
    position: absolute; bottom: 6px; right: 8px;
    font: 700 0.70rem/1 var(--rik-font-mono);
    color: var(--rik-text-default);
    background: rgba(255, 255, 255, 0.92);
    padding: 3px 7px; border-radius: 4px;
    z-index: 2;
    pointer-events: none;
  }
  :host(:not([overview])) #overview-grid { display: none; }
`});var Bt={};He(Bt,{installTransitions:()=>Mr});function Mr(i){if(i.__rkTransitions)return i.__rkTransitions;let t=i.shadowRoot;if(!t)return()=>{};let e=document.createElement("style");e.textContent=Lr,e.setAttribute("data-rik-transitions",""),t.appendChild(e);function r(d,h){if(!h)return 0;let v=d.compareDocumentPosition(h);return v&Node.DOCUMENT_POSITION_PRECEDING?1:v&Node.DOCUMENT_POSITION_FOLLOWING?-1:0}let s=d=>{let h=d,v=h.detail.current,g=h.detail.previous;if(!v)return;let f=v.dataset.transition||i.transition||"fade",x=r(v,g);f==="slide"&&x<0?f="slide-right":f==="slide-right"&&x>0?f="slide":f==="slide-up"&&x<0?f="slide-down":f==="slide-down"&&x>0&&(f="slide-up");let S=`rk-enter-${f}`,L=`rk-exit-${f}`,Z=T[f]??480;g&&g!==v&&(g.classList.remove(...Ut,...zr,"rk-leaving"),g.style.display="flex",g.style.zIndex="1",g.offsetWidth,g.classList.add("rk-leaving",L),window.setTimeout(()=>{g.classList.remove("rk-leaving",L),g.style.display="",g.style.zIndex=""},Z+40)),v.classList.remove(...Ut),v.style.zIndex="2",v.offsetWidth,v.classList.add(S),window.setTimeout(()=>{v.classList.remove(S),v.style.zIndex=""},Z+40)};i.addEventListener("slide-change",s);let a=i.querySelector(":scope > [active]");a&&s(new CustomEvent("slide-change",{detail:{current:a,previous:null}}));let n=()=>{i.removeEventListener("slide-change",s),e.remove(),delete i.__rkTransitions};return i.__rkTransitions=n,n}var T,z,Tr,Lr,Ut,zr,ot=ke(()=>{"use strict";T={slide:560,"slide-up":520,"slide-down":520,"slide-right":560,fade:480,zoom:520,flip:560},z="var(--rik-motion__ease-out, cubic-bezier(0.16, 1, 0.3, 1))",Tr="var(--rik-motion__ease-spring, cubic-bezier(0.5, 1.8, 0.3, 1))",Lr=`
  /* Incoming \xB7 from right (forward) */
  @keyframes rk-slide-in       { from { transform: translateX(100%);  } to { transform: translateX(0); } }
  /* Outgoing \xB7 pushed off to the left (forward) */
  @keyframes rk-slide-out      { from { transform: translateX(0);     } to { transform: translateX(-100%); } }
  /* Incoming \xB7 from left (backward) */
  @keyframes rk-slide-right-in  { from { transform: translateX(-100%); } to { transform: translateX(0); } }
  /* Outgoing \xB7 pushed off to the right (backward) */
  @keyframes rk-slide-right-out { from { transform: translateX(0);     } to { transform: translateX(100%); } }
  /* Vertical \xB7 incoming from below, outgoing pushed up (forward) */
  @keyframes rk-slide-up-in     { from { transform: translateY(100%);  } to { transform: translateY(0); } }
  @keyframes rk-slide-up-out    { from { transform: translateY(0);     } to { transform: translateY(-100%); } }
  /* Vertical \xB7 incoming from above, outgoing pushed down (backward) */
  @keyframes rk-slide-down-in   { from { transform: translateY(-100%); } to { transform: translateY(0); } }
  @keyframes rk-slide-down-out  { from { transform: translateY(0);     } to { transform: translateY(100%); } }
  /* Fade \xB7 pop in / pop out from center, no horizontal motion */
  @keyframes rk-fade-in         { from { transform: scale(0.94); } to { transform: scale(1); } }
  @keyframes rk-fade-out        { from { transform: scale(1);    } to { transform: scale(1.06); } }
  /* Zoom \xB7 aggressive scale (for hooks) */
  @keyframes rk-zoom-in         { from { transform: scale(0.86); } to { transform: scale(1);    } }
  @keyframes rk-zoom-out        { from { transform: scale(1);    } to { transform: scale(1.10); } }
  /* Flip \xB7 3D rotateY */
  @keyframes rk-flip-in         { from { transform: perspective(900px) rotateY(-22deg) scale(0.94); }
                                  to   { transform: perspective(900px) rotateY(0)     scale(1);    } }
  @keyframes rk-flip-out        { from { transform: perspective(900px) rotateY(0)    scale(1);    }
                                  to   { transform: perspective(900px) rotateY(22deg) scale(0.94); } }

  /* Outgoing slide stays display:flex via inline JS style; this rule is
     a placeholder so the selector resolves cleanly in shadow CSS. */
  ::slotted(.rk-leaving) { }

  ::slotted([active].rk-enter-slide)        { animation: rk-slide-in       ${T.slide}ms ${z}    both; }
  ::slotted(.rk-leaving.rk-exit-slide)      { animation: rk-slide-out      ${T.slide}ms ${z}    both; }
  ::slotted([active].rk-enter-slide-right)  { animation: rk-slide-right-in ${T["slide-right"]}ms ${z} both; }
  ::slotted(.rk-leaving.rk-exit-slide-right){ animation: rk-slide-right-out ${T["slide-right"]}ms ${z} both; }
  ::slotted([active].rk-enter-slide-up)     { animation: rk-slide-up-in    ${T["slide-up"]}ms ${z} both; }
  ::slotted(.rk-leaving.rk-exit-slide-up)   { animation: rk-slide-up-out   ${T["slide-up"]}ms ${z} both; }
  ::slotted([active].rk-enter-slide-down)   { animation: rk-slide-down-in  ${T["slide-down"]}ms ${z} both; }
  ::slotted(.rk-leaving.rk-exit-slide-down) { animation: rk-slide-down-out ${T["slide-down"]}ms ${z} both; }
  ::slotted([active].rk-enter-fade)         { animation: rk-fade-in        ${T.fade}ms ${z} both; }
  ::slotted(.rk-leaving.rk-exit-fade)       { animation: rk-fade-out       ${T.fade}ms ${z} both; }
  ::slotted([active].rk-enter-zoom)         { animation: rk-zoom-in        ${T.zoom}ms ${Tr} both; }
  ::slotted(.rk-leaving.rk-exit-zoom)       { animation: rk-zoom-out       ${T.zoom}ms ${z} both; }
  ::slotted([active].rk-enter-flip)         { animation: rk-flip-in        ${T.flip}ms ${z} both; }
  ::slotted(.rk-leaving.rk-exit-flip)       { animation: rk-flip-out       ${T.flip}ms ${z} both; }

  @media (prefers-reduced-motion: reduce) {
    ::slotted([active][class*='rk-enter-']),
    ::slotted(.rk-leaving)                  { animation: none; }
  }
`,Ut=["rk-enter-slide","rk-enter-slide-up","rk-enter-slide-down","rk-enter-slide-right","rk-enter-fade","rk-enter-zoom","rk-enter-flip"],zr=["rk-exit-slide","rk-exit-slide-up","rk-exit-slide-down","rk-exit-slide-right","rk-exit-fade","rk-exit-zoom","rk-exit-flip"]});var Wr={};function Zt(i,t="#0a0a0a"){N||(N=document.createElement("div"),N.style.cssText=`position:fixed;bottom:12px;left:12px;z-index:9999;padding:6px 12px;background:${t};color:#F7CB44;font:600 11px/1.4 monospace;border-radius:6px;letter-spacing:.08em;text-transform:uppercase;opacity:0;transition:opacity .2s;pointer-events:none;border:1px solid #F7CB44`,document.body.appendChild(N)),N.textContent=i,N.style.opacity="1",N._t&&clearTimeout(N._t),N._t=setTimeout(()=>{N&&(N.style.opacity="0")},1500)}async function Qt(i){try{let t=await fetch(i+"?_lr="+Date.now(),{method:"HEAD",cache:"no-store"}),e=t.headers.get("last-modified")??t.headers.get("etag")??t.headers.get("content-length");if(!e)return!1;let r=Gt.get(i);return Gt.set(i,e),r!==void 0&&r!==e}catch{return!1}}async function Yr(){for(;;){for(let i of Jt)if(await Qt(i)){Zt(`reload \xB7 ${i.split("/").pop()}`),await new Promise(t=>setTimeout(t,150)),location.reload();return}await new Promise(i=>setTimeout(i,800))}}var $,Br,qr,Jt,Gt,N,Dt=ke(()=>{"use strict";$=i=>new URL(i,import.meta.url).href,Br=i=>{try{return new URL(i,location.href).origin===location.origin}catch{return!1}},qr=Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map(i=>i.href).filter(Br),Jt=[...qr,$("./index.js"),$("./deck-root.js"),$("./deck-cover.js"),$("./deck-section.js"),$("./deck-feature.js"),$("./deck-split.js"),$("./deck-feature-cards.js"),$("./deck-takeaway.js"),$("./deck-md.js"),$("./deck-code.js"),$("./deck-callout.js"),$("./deck-card.js"),$("./deck-mermaid.js"),$("./shared-styles.js"),$("./deck-stack.js"),$("./deck-grid.js"),$("./deck-punch.js"),location.pathname],Gt=new Map;(async()=>(await Promise.all(Jt.map(Qt)),Zt("livereload on"),Yr()))()});var Ce=globalThis,Pe=Ce.ShadowRoot&&(Ce.ShadyCSS===void 0||Ce.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,We=Symbol(),mt=new WeakMap,ye=class{constructor(t,e,r){if(this._$cssResult$=!0,r!==We)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o,e=this.t;if(Pe&&t===void 0){let r=e!==void 0&&e.length===1;r&&(t=mt.get(e)),t===void 0&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),r&&mt.set(e,t))}return t}toString(){return this.cssText}},vt=i=>new ye(typeof i=="string"?i:i+"",void 0,We),m=(i,...t)=>{let e=i.length===1?i[0]:t.reduce((r,s,a)=>r+(n=>{if(n._$cssResult$===!0)return n.cssText;if(typeof n=="number")return n;throw Error("Value passed to 'css' function must be a 'css' function result: "+n+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(s)+i[a+1],i[0]);return new ye(e,i,We)},ut=(i,t)=>{if(Pe)i.adoptedStyleSheets=t.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(let e of t){let r=document.createElement("style"),s=Ce.litNonce;s!==void 0&&r.setAttribute("nonce",s),r.textContent=e.cssText,i.appendChild(r)}},Fe=Pe?i=>i:i=>i instanceof CSSStyleSheet?(t=>{let e="";for(let r of t.cssRules)e+=r.cssText;return vt(e)})(i):i;var{is:tr,defineProperty:rr,getOwnPropertyDescriptor:ir,getOwnPropertyNames:sr,getOwnPropertySymbols:or,getPrototypeOf:ar}=Object,Ne=globalThis,ft=Ne.trustedTypes,nr=ft?ft.emptyScript:"",lr=Ne.reactiveElementPolyfillSupport,be=(i,t)=>i,xe={toAttribute(i,t){switch(t){case Boolean:i=i?nr:null;break;case Object:case Array:i=i==null?i:JSON.stringify(i)}return i},fromAttribute(i,t){let e=i;switch(t){case Boolean:e=i!==null;break;case Number:e=i===null?null:Number(i);break;case Object:case Array:try{e=JSON.parse(i)}catch{e=null}}return e}},Ie=(i,t)=>!tr(i,t),gt={attribute:!0,type:String,converter:xe,reflect:!1,useDefault:!1,hasChanged:Ie};Symbol.metadata??=Symbol("metadata"),Ne.litPropertyMetadata??=new WeakMap;var q=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=gt){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){let r=Symbol(),s=this.getPropertyDescriptor(t,r,e);s!==void 0&&rr(this.prototype,t,s)}}static getPropertyDescriptor(t,e,r){let{get:s,set:a}=ir(this.prototype,t)??{get(){return this[e]},set(n){this[e]=n}};return{get:s,set(n){let d=s?.call(this);a?.call(this,n),this.requestUpdate(t,d,r)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??gt}static _$Ei(){if(this.hasOwnProperty(be("elementProperties")))return;let t=ar(this);t.finalize(),t.l!==void 0&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(be("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(be("properties"))){let e=this.properties,r=[...sr(e),...or(e)];for(let s of r)this.createProperty(s,e[s])}let t=this[Symbol.metadata];if(t!==null){let e=litPropertyMetadata.get(t);if(e!==void 0)for(let[r,s]of e)this.elementProperties.set(r,s)}this._$Eh=new Map;for(let[e,r]of this.elementProperties){let s=this._$Eu(e,r);s!==void 0&&this._$Eh.set(s,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){let e=[];if(Array.isArray(t)){let r=new Set(t.flat(1/0).reverse());for(let s of r)e.unshift(Fe(s))}else t!==void 0&&e.push(Fe(t));return e}static _$Eu(t,e){let r=e.attribute;return r===!1?void 0:typeof r=="string"?r:typeof t=="string"?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),this.renderRoot!==void 0&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){let t=new Map,e=this.constructor.elementProperties;for(let r of e.keys())this.hasOwnProperty(r)&&(t.set(r,this[r]),delete this[r]);t.size>0&&(this._$Ep=t)}createRenderRoot(){let t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return ut(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,e,r){this._$AK(t,r)}_$ET(t,e){let r=this.constructor.elementProperties.get(t),s=this.constructor._$Eu(t,r);if(s!==void 0&&r.reflect===!0){let a=(r.converter?.toAttribute!==void 0?r.converter:xe).toAttribute(e,r.type);this._$Em=t,a==null?this.removeAttribute(s):this.setAttribute(s,a),this._$Em=null}}_$AK(t,e){let r=this.constructor,s=r._$Eh.get(t);if(s!==void 0&&this._$Em!==s){let a=r.getPropertyOptions(s),n=typeof a.converter=="function"?{fromAttribute:a.converter}:a.converter?.fromAttribute!==void 0?a.converter:xe;this._$Em=s;let d=n.fromAttribute(e,a.type);this[s]=d??this._$Ej?.get(s)??d,this._$Em=null}}requestUpdate(t,e,r,s=!1,a){if(t!==void 0){let n=this.constructor;if(s===!1&&(a=this[t]),r??=n.getPropertyOptions(t),!((r.hasChanged??Ie)(a,e)||r.useDefault&&r.reflect&&a===this._$Ej?.get(t)&&!this.hasAttribute(n._$Eu(t,r))))return;this.C(t,e,r)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(t,e,{useDefault:r,reflect:s,wrapped:a},n){r&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,n??e??this[t]),a!==!0||n!==void 0)||(this._$AL.has(t)||(this.hasUpdated||r||(e=void 0),this._$AL.set(t,e)),s===!0&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}let t=this.scheduleUpdate();return t!=null&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(let[s,a]of this._$Ep)this[s]=a;this._$Ep=void 0}let r=this.constructor.elementProperties;if(r.size>0)for(let[s,a]of r){let{wrapped:n}=a,d=this[s];n!==!0||this._$AL.has(s)||d===void 0||this.C(s,void 0,a,d)}}let t=!1,e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$EO?.forEach(r=>r.hostUpdate?.()),this.update(e)):this._$EM()}catch(r){throw t=!1,this._$EM(),r}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$EO?.forEach(e=>e.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(e=>this._$ET(e,this[e])),this._$EM()}updated(t){}firstUpdated(t){}};q.elementStyles=[],q.shadowRootOptions={mode:"open"},q[be("elementProperties")]=new Map,q[be("finalized")]=new Map,lr?.({ReactiveElement:q}),(Ne.reactiveElementVersions??=[]).push("2.1.2");var Qe=globalThis,kt=i=>i,Oe=Qe.trustedTypes,yt=Oe?Oe.createPolicy("lit-html",{createHTML:i=>i}):void 0,$t="$lit$",X=`lit$${Math.random().toFixed(9).slice(2)}$`,St="?"+X,dr=`<${St}>`,te=document,_e=()=>te.createComment(""),Ee=i=>i===null||typeof i!="object"&&typeof i!="function",De=Array.isArray,cr=i=>De(i)||typeof i?.[Symbol.iterator]=="function",Ke=`[ 	
\f\r]`,we=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,bt=/-->/g,xt=/>/g,D=RegExp(`>|${Ke}(?:([^\\s"'>=/]+)(${Ke}*=${Ke}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),wt=/'/g,_t=/"/g,At=/^(?:script|style|textarea|title)$/i,et=i=>(t,...e)=>({_$litType$:i,strings:t,values:e}),c=et(1),Jr=et(2),Zr=et(3),re=Symbol.for("lit-noChange"),_=Symbol.for("lit-nothing"),Et=new WeakMap,ee=te.createTreeWalker(te,129);function Tt(i,t){if(!De(i)||!i.hasOwnProperty("raw"))throw Error("invalid template strings array");return yt!==void 0?yt.createHTML(t):t}var pr=(i,t)=>{let e=i.length-1,r=[],s,a=t===2?"<svg>":t===3?"<math>":"",n=we;for(let d=0;d<e;d++){let h=i[d],v,g,f=-1,x=0;for(;x<h.length&&(n.lastIndex=x,g=n.exec(h),g!==null);)x=n.lastIndex,n===we?g[1]==="!--"?n=bt:g[1]!==void 0?n=xt:g[2]!==void 0?(At.test(g[2])&&(s=RegExp("</"+g[2],"g")),n=D):g[3]!==void 0&&(n=D):n===D?g[0]===">"?(n=s??we,f=-1):g[1]===void 0?f=-2:(f=n.lastIndex-g[2].length,v=g[1],n=g[3]===void 0?D:g[3]==='"'?_t:wt):n===_t||n===wt?n=D:n===bt||n===xt?n=we:(n=D,s=void 0);let S=n===D&&i[d+1].startsWith("/>")?" ":"";a+=n===we?h+dr:f>=0?(r.push(v),h.slice(0,f)+$t+h.slice(f)+X+S):h+X+(f===-2?d:S)}return[Tt(i,a+(i[e]||"<?>")+(t===2?"</svg>":t===3?"</math>":"")),r]},$e=class i{constructor({strings:t,_$litType$:e},r){let s;this.parts=[];let a=0,n=0,d=t.length-1,h=this.parts,[v,g]=pr(t,e);if(this.el=i.createElement(v,r),ee.currentNode=this.el.content,e===2||e===3){let f=this.el.content.firstChild;f.replaceWith(...f.childNodes)}for(;(s=ee.nextNode())!==null&&h.length<d;){if(s.nodeType===1){if(s.hasAttributes())for(let f of s.getAttributeNames())if(f.endsWith($t)){let x=g[n++],S=s.getAttribute(f).split(X),L=/([.?@])?(.*)/.exec(x);h.push({type:1,index:a,name:L[2],strings:S,ctor:L[1]==="."?Xe:L[1]==="?"?Ge:L[1]==="@"?Je:le}),s.removeAttribute(f)}else f.startsWith(X)&&(h.push({type:6,index:a}),s.removeAttribute(f));if(At.test(s.tagName)){let f=s.textContent.split(X),x=f.length-1;if(x>0){s.textContent=Oe?Oe.emptyScript:"";for(let S=0;S<x;S++)s.append(f[S],_e()),ee.nextNode(),h.push({type:2,index:++a});s.append(f[x],_e())}}}else if(s.nodeType===8)if(s.data===St)h.push({type:2,index:a});else{let f=-1;for(;(f=s.data.indexOf(X,f+1))!==-1;)h.push({type:7,index:a}),f+=X.length-1}a++}}static createElement(t,e){let r=te.createElement("template");return r.innerHTML=t,r}};function ne(i,t,e=i,r){if(t===re)return t;let s=r!==void 0?e._$Co?.[r]:e._$Cl,a=Ee(t)?void 0:t._$litDirective$;return s?.constructor!==a&&(s?._$AO?.(!1),a===void 0?s=void 0:(s=new a(i),s._$AT(i,e,r)),r!==void 0?(e._$Co??=[])[r]=s:e._$Cl=s),s!==void 0&&(t=ne(i,s._$AS(i,t.values),s,r)),t}var Ve=class{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){let{el:{content:e},parts:r}=this._$AD,s=(t?.creationScope??te).importNode(e,!0);ee.currentNode=s;let a=ee.nextNode(),n=0,d=0,h=r[0];for(;h!==void 0;){if(n===h.index){let v;h.type===2?v=new Se(a,a.nextSibling,this,t):h.type===1?v=new h.ctor(a,h.name,h.strings,this,t):h.type===6&&(v=new Ze(a,this,t)),this._$AV.push(v),h=r[++d]}n!==h?.index&&(a=ee.nextNode(),n++)}return ee.currentNode=te,s}p(t){let e=0;for(let r of this._$AV)r!==void 0&&(r.strings!==void 0?(r._$AI(t,r,e),e+=r.strings.length-2):r._$AI(t[e])),e++}},Se=class i{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,r,s){this.type=2,this._$AH=_,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=r,this.options=s,this._$Cv=s?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode,e=this._$AM;return e!==void 0&&t?.nodeType===11&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=ne(this,t,e),Ee(t)?t===_||t==null||t===""?(this._$AH!==_&&this._$AR(),this._$AH=_):t!==this._$AH&&t!==re&&this._(t):t._$litType$!==void 0?this.$(t):t.nodeType!==void 0?this.T(t):cr(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==_&&Ee(this._$AH)?this._$AA.nextSibling.data=t:this.T(te.createTextNode(t)),this._$AH=t}$(t){let{values:e,_$litType$:r}=t,s=typeof r=="number"?this._$AC(t):(r.el===void 0&&(r.el=$e.createElement(Tt(r.h,r.h[0]),this.options)),r);if(this._$AH?._$AD===s)this._$AH.p(e);else{let a=new Ve(s,this),n=a.u(this.options);a.p(e),this.T(n),this._$AH=a}}_$AC(t){let e=Et.get(t.strings);return e===void 0&&Et.set(t.strings,e=new $e(t)),e}k(t){De(this._$AH)||(this._$AH=[],this._$AR());let e=this._$AH,r,s=0;for(let a of t)s===e.length?e.push(r=new i(this.O(_e()),this.O(_e()),this,this.options)):r=e[s],r._$AI(a),s++;s<e.length&&(this._$AR(r&&r._$AB.nextSibling,s),e.length=s)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t!==this._$AB;){let r=kt(t).nextSibling;kt(t).remove(),t=r}}setConnected(t){this._$AM===void 0&&(this._$Cv=t,this._$AP?.(t))}},le=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,r,s,a){this.type=1,this._$AH=_,this._$AN=void 0,this.element=t,this.name=e,this._$AM=s,this.options=a,r.length>2||r[0]!==""||r[1]!==""?(this._$AH=Array(r.length-1).fill(new String),this.strings=r):this._$AH=_}_$AI(t,e=this,r,s){let a=this.strings,n=!1;if(a===void 0)t=ne(this,t,e,0),n=!Ee(t)||t!==this._$AH&&t!==re,n&&(this._$AH=t);else{let d=t,h,v;for(t=a[0],h=0;h<a.length-1;h++)v=ne(this,d[r+h],e,h),v===re&&(v=this._$AH[h]),n||=!Ee(v)||v!==this._$AH[h],v===_?t=_:t!==_&&(t+=(v??"")+a[h+1]),this._$AH[h]=v}n&&!s&&this.j(t)}j(t){t===_?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}},Xe=class extends le{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===_?void 0:t}},Ge=class extends le{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==_)}},Je=class extends le{constructor(t,e,r,s,a){super(t,e,r,s,a),this.type=5}_$AI(t,e=this){if((t=ne(this,t,e,0)??_)===re)return;let r=this._$AH,s=t===_&&r!==_||t.capture!==r.capture||t.once!==r.once||t.passive!==r.passive,a=t!==_&&(r===_||s);s&&this.element.removeEventListener(this.name,this,r),a&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}},Ze=class{constructor(t,e,r){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=r}get _$AU(){return this._$AM._$AU}_$AI(t){ne(this,t)}};var hr=Qe.litHtmlPolyfillSupport;hr?.($e,Se),(Qe.litHtmlVersions??=[]).push("3.3.3");var Lt=(i,t,e)=>{let r=e?.renderBefore??t,s=r._$litPart$;if(s===void 0){let a=e?.renderBefore??null;r._$litPart$=s=new Se(t.insertBefore(_e(),a),a,void 0,e??{})}return s._$AI(i),s};var tt=globalThis,p=class extends q{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){let t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){let e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=Lt(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return re}};p._$litElement$=!0,p.finalized=!0,tt.litElementHydrateSupport?.({LitElement:p});var mr=tt.litElementPolyfillSupport;mr?.({LitElement:p});(tt.litElementVersions??=[]).push("4.2.2");var u=i=>(t,e)=>{e!==void 0?e.addInitializer(()=>{customElements.define(i,t)}):customElements.define(i,t)};var vr={attribute:!0,type:String,converter:xe,reflect:!1,hasChanged:Ie},ur=(i=vr,t,e)=>{let{kind:r,metadata:s}=e,a=globalThis.litPropertyMetadata.get(s);if(a===void 0&&globalThis.litPropertyMetadata.set(s,a=new Map),r==="setter"&&((i=Object.create(i)).wrapped=!0),a.set(e.name,i),r==="accessor"){let{name:n}=e;return{set(d){let h=t.get.call(this);t.set.call(this,d),this.requestUpdate(n,h,i,!0,d)},init(d){return d!==void 0&&this.C(n,void 0,i,d),d}}}if(r==="setter"){let{name:n}=e;return function(d){let h=this[n];t.call(this,d),this.requestUpdate(n,h,i,!0,d)}}throw Error("Unsupported decorator location: "+r)};function l(i){return(t,e)=>typeof e=="object"?ur(i,t,e):((r,s,a)=>{let n=s.hasOwnProperty(a);return s.constructor.createProperty(a,r),n?Object.getOwnPropertyDescriptor(s,a):void 0})(i,t,e)}function O(i){return l({...i,state:!0,attribute:!1})}var M=class extends p{constructor(){super(...arguments);this.current=0;this.step=0;this.blank=null;this.overview=!1;this.transition=null;this.autoplay=0;this.loop=!1;this.swipe=!1;this.slides=[];this.chapters=[];this._overviewTeardown=null;this._transitionLoaded=!1;this._autoplayTimer=null;this._autoplayPaused=!1;this._swipeStartX=0;this._swipeStartY=0;this._swipePointerId=null;this._onHoverEnter=()=>{this._autoplayPaused=!0,this._stopAutoplay()};this._onHoverLeave=()=>{this._autoplayPaused=!1,this.autoplay>0&&this._startAutoplay()};this._onPointerDown=e=>{!this.swipe||e.pointerType==="mouse"&&e.button!==0||e.target?.closest("a, button, input, textarea, [contenteditable]")||(this._swipePointerId=e.pointerId,this._swipeStartX=e.clientX,this._swipeStartY=e.clientY)};this._onPointerUp=e=>{if(this._swipePointerId===null||e.pointerId!==this._swipePointerId)return;let r=e.clientX-this._swipeStartX,s=e.clientY-this._swipeStartY;this._swipePointerId=null,!(Math.abs(r)<60||Math.abs(r)<Math.abs(s)*2)&&(this._stopAutoplay(),r<0?this._advance():this._back(),this.autoplay>0&&!this._autoplayPaused&&this._startAutoplay())};this._onHash=()=>{this._readHash(!1)};this._onKey=e=>{if(!(e.target&&e.target.matches?.("input,textarea,[contenteditable]"))){if(this.autoplay>0&&!this._autoplayPaused&&this._startAutoplay(),this.overview){(e.key==="Escape"||e.key==="o"||e.key==="O"||e.key==="Enter")&&(e.preventDefault(),this.overview=!1);return}if(this.blank){e.preventDefault(),this.blank=null;return}if(e.key==="."||e.key==="b"||e.key==="B"){e.preventDefault(),this.blank="black";return}if(e.key===","||e.key==="w"||e.key==="W"){e.preventDefault(),this.blank="white";return}if(e.key==="?"||e.key==="h"||e.key==="H"){this._toggleHelp();return}if(e.key==="Escape"){this._closeHelp();return}if(e.key==="o"||e.key==="O"){e.preventDefault(),this.overview=!0;return}if(e.key==="p"||e.key==="P"){e.preventDefault(),this._togglePresenter();return}if(e.key==="Home"){this._goTo(0);return}if(e.key==="End"){this._goTo(this.slides.length-1);return}if(e.key===" "||e.key==="PageDown"){e.preventDefault(),this._advance();return}if(e.key==="PageUp"){e.preventDefault(),this._back();return}if(this._has2DNav()){let{c:r,i:s}=this._coords(this.current);if(e.key==="ArrowRight"){e.preventDefault(),r+1<this.chapters.length?this._goToCoords(r+1,0):this._advance();return}if(e.key==="ArrowLeft"){e.preventDefault(),r-1>=0?this._goToCoords(r-1,0):this._back();return}if(e.key==="ArrowDown"){e.preventDefault();let a=this.chapters[r];a&&s+1<a.slides.length?this._goToCoords(r,s+1):this._advance();return}if(e.key==="ArrowUp"){e.preventDefault(),s-1>=0?this._goToCoords(r,s-1):this._back();return}}else{if(e.key==="ArrowRight"||e.key==="ArrowDown"){e.preventDefault(),this._advance();return}if(e.key==="ArrowLeft"||e.key==="ArrowUp"){e.preventDefault(),this._back();return}}}}}firstUpdated(){this.slides=Array.from(this.querySelectorAll(":scope > *")).filter(e=>e.tagName?.toLowerCase().startsWith("deck-")&&e.tagName?.toLowerCase()!=="deck-root"),this._buildChapters(),this._readHash(!0),this._applyActive(),this._applyStep(),this._updateUI(),this.requestUpdate(),window.addEventListener("keydown",this._onKey),window.addEventListener("hashchange",this._onHash),this.autoplay>0&&this._startAutoplay(),this.swipe?(this.addEventListener("pointerdown",this._onPointerDown),this.addEventListener("pointerup",this._onPointerUp),this.addEventListener("pointercancel",this._onPointerUp),this.addEventListener("mouseenter",this._onHoverEnter),this.addEventListener("mouseleave",this._onHoverLeave)):this.autoplay>0&&(this.addEventListener("mouseenter",this._onHoverEnter),this.addEventListener("mouseleave",this._onHoverLeave))}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener("keydown",this._onKey),window.removeEventListener("hashchange",this._onHash),this._stopAutoplay(),this.removeEventListener("pointerdown",this._onPointerDown),this.removeEventListener("pointerup",this._onPointerUp),this.removeEventListener("pointercancel",this._onPointerUp),this.removeEventListener("mouseenter",this._onHoverEnter),this.removeEventListener("mouseleave",this._onHoverLeave)}_startAutoplay(){this._stopAutoplay(),!(this.autoplay<=0||this._autoplayPaused)&&(this._autoplayTimer=window.setInterval(()=>this._autoTick(),this.autoplay))}_stopAutoplay(){this._autoplayTimer!==null&&(window.clearInterval(this._autoplayTimer),this._autoplayTimer=null)}_autoTick(){if(this.overview)return;this.current>=this.slides.length-1&&this.step>=this._maxSteps()&&this.loop?this._goTo(0):this._advance()}_buildChapters(){this.chapters=[];let e=null;this.slides.forEach((r,s)=>{r.tagName?.toLowerCase()==="deck-section"||!e?(e={startIdx:s,slides:[r]},this.chapters.push(e)):e.slides.push(r)})}_has2DNav(){return this.chapters.some(e=>e.slides.length>1)&&this.chapters.length>1}_coords(e){for(let r=0;r<this.chapters.length;r++){let s=this.chapters[r],a=e-s.startIdx;if(a>=0&&a<s.slides.length)return{c:r,i:a}}return{c:0,i:0}}_flatFromCoords(e,r){let s=this.chapters[e];return s?s.startIdx+Math.max(0,Math.min(s.slides.length-1,r)):0}_readHash(e){let r=location.hash,s=r.match(/^#(\d+)\.(\d+)(?:s(\d+))?$/),a=r.match(/^#(\d+)(?:\.(\d+))?$/),n=this.current,d=this.step;if(this._has2DNav()&&s){let h=parseInt(s[1],10)-1,v=parseInt(s[2],10)-1;n=this._flatFromCoords(Math.max(0,h),Math.max(0,v)),d=s[3]?parseInt(s[3],10):0}else if(a)n=parseInt(a[1],10)-1,d=a[2]?parseInt(a[2],10):0;else return;n===this.current&&d===this.step&&!e||(this.current=Math.max(0,Math.min(this.slides.length-1,n)),this.step=Math.max(0,d),e||(this._applyActive(),this._applyStep(),this._updateUI()))}_writeHash(){let e=`#${this.current+1}`+(this.step>0?`.${this.step}`:"");if(location.hash!==e)try{history.replaceState(null,"",e)}catch{}}async _toggleHelp(){(await Promise.resolve().then(()=>(Re(),rt))).toggleHelp(this)}async _togglePresenter(){(await Promise.resolve().then(()=>(it(),Nt))).installPresenter(this)}async _closeHelp(){(await Promise.resolve().then(()=>(Re(),rt))).closeHelp(this)}async _renderOverviewIfActive(){if(!this.overview){this._overviewTeardown?.(),this._overviewTeardown=null;return}let{mountOverview:e}=await Promise.resolve().then(()=>(st(),Rt));this._overviewTeardown=e(this,{slides:this.slides,chapters:this.chapters,currentIdx:this.current,onPick:r=>{this.overview=!1,this._goTo(r)}})}_maxSteps(){let e=this.slides[this.current];if(!e)return 0;let r=parseInt(e.getAttribute("steps")||e.dataset?.steps||"0",10);if(r>0)return r;let s=e.querySelector("deck-code[step-groups]");if(s)try{return JSON.parse(s.getAttribute("step-groups")).length}catch{}return 0}_advance(){let e=this._maxSteps();this.step<e?(this.step++,this._applyStep(),this._updateUI(),this._writeHash()):this.current<this.slides.length-1?this._goTo(this.current+1):this.loop&&this._goTo(0)}_back(){this.step>0?(this.step--,this._applyStep(),this._updateUI(),this._writeHash()):this.current>0?(this._goTo(this.current-1),this.step=this._maxSteps(),this._applyStep(),this._updateUI(),this._writeHash()):this.loop&&(this._goTo(this.slides.length-1),this.step=this._maxSteps(),this._applyStep(),this._updateUI(),this._writeHash())}_goTo(e){this.current=Math.max(0,Math.min(this.slides.length-1,e)),this.step=0,this._applyActive(),this._applyStep(),this._updateUI(),this._writeHash()}_goToCoords(e,r){let s=Math.max(0,Math.min(this.chapters.length-1,e)),a=this.chapters[s];if(!a)return;let n=Math.max(0,Math.min(a.slides.length-1,r));this._goTo(this._flatFromCoords(s,n))}_applyActive(){let e=this.slides.find(s=>s.hasAttribute("active"))??null,r=this.slides[this.current]??null;this.slides.forEach((s,a)=>{let n=a===this.current;s.toggleAttribute("active",n),n&&s.querySelectorAll("deck-mermaid").forEach(d=>d.render?.())}),this.transition&&!this._transitionLoaded&&(this._transitionLoaded=!0,Promise.resolve().then(()=>(ot(),Bt)).then(s=>s.installTransitions(this))),e!==r&&this.dispatchEvent(new CustomEvent("slide-change",{detail:{current:r,previous:e},bubbles:!1}))}_applyStep(){let e=this.slides[this.current];e&&(e.applyStep?.(this.step),e.querySelectorAll("*").forEach(r=>r.applyStep?.(this.step)),e.querySelectorAll("[data-step-block]").forEach(r=>{let s=parseInt(r.dataset.stepBlock,10);r.style.transition="opacity 0.25s ease",r.style.opacity=this.step===0||s<=this.step?"1":"0.15"}))}_updateUI(){let e=this.slides.length,r=this.current+1,s=this.renderRoot.querySelector("#progress"),a=this.renderRoot.querySelector("#counter"),n=this.renderRoot.querySelector("#step-dots");s&&(s.style.width=r/e*100+"%"),a&&(a.textContent=`${r} / ${e}`);let d=this._maxSteps();n&&(n.innerHTML=d===0?"":Array.from({length:d},(h,v)=>`<div class="dot${v<this.step?" active":""}"></div>`).join(""))}updated(){this._updateUI(),this._renderOverviewIfActive()}render(){return c`<div id="progress"></div> <div id="counter"></div> <div id="step-dots"></div> <div id="kb-hint"> <kbd>←</kbd><kbd>→</kbd> ${this._has2DNav()?c`<kbd>↑</kbd><kbd>↓</kbd>`:""}
        <span>·</span>
        <kbd>O</kbd>
        <span>·</span>
        <kbd>P</kbd>
        <span>·</span>
        <kbd>?</kbd>
      </div>
      <slot></slot>
      ${this.blank?c`<div id="blank" data-tone="${this.blank}" @click=${()=>{this.blank=null}}></div>`:""}
    `}};M.styles=m`:host{display:block;width:100vw;height:100vh;position:relative;background:var(--deck-root-bg,var(--rik-surface-page))}#progress{position:fixed;bottom:0;left:0;height:var(--deck-root-progress-height,3px);background:var(--deck-root-progress-color,linear-gradient(90deg,var(--rik-accent),var(--rik-accent--soft)));transition:width 0.25s ease;z-index:100}#counter{position:fixed;bottom:1rem;right:1.5rem;font-size:var(--rik-font-size-xs);color:var(--deck-root-counter-color,var(--rik-text-default--faint));font-family:var(--rik-font-mono);z-index:100}#step-dots{position:fixed;bottom:1rem;left:50%;transform:translateX(-50%);display:flex;gap:6px;z-index:100}.dot{width:6px;height:6px;border-radius:50%;background:var(--deck-root-dot-bg,#d4d4d0);transition:background 0.2s}.dot.active{background:var(--deck-root-dot-active-bg,var(--rik-accent))}#kb-hint{position:fixed;bottom:1rem;left:1.5rem;display:inline-flex;align-items:center;gap:6px;font:600 0.62rem/1 var(--rik-font-mono);color:var(--deck-root-kb-hint-color,var(--rik-text-default--faint));z-index:100;opacity:0.5;transition:opacity 0.2s ease;cursor:help}#kb-hint:hover{opacity:1}#kb-hint kbd{background:var(--rik-surface-raised);border:1px solid var(--rik-border-default);border-bottom:2px solid var(--rik-border-default);border-radius:4px;padding:2px 6px;color:var(--rik-text-default);font:inherit;min-width:16px;text-align:center}#kb-hint .sep{opacity:0.4}#blank{position:fixed;inset:0;z-index:9999;cursor:pointer}#blank[data-tone="black"]{background:#000}#blank[data-tone="white"]{background:#fff}`,o([O()],M.prototype,"current",2),o([O()],M.prototype,"step",2),o([O()],M.prototype,"blank",2),o([l({type:Boolean,reflect:!0})],M.prototype,"overview",2),o([l({type:String,reflect:!0})],M.prototype,"transition",2),o([l({type:Number,reflect:!0})],M.prototype,"autoplay",2),o([l({type:Boolean,reflect:!0})],M.prototype,"loop",2),o([l({type:Boolean,reflect:!0})],M.prototype,"swipe",2),M=o([u("deck-root")],M);ot();Re();st();it();var Ae=class extends p{get notes(){return(this.textContent??"").trim()}render(){return c`<slot></slot>`}};Ae.styles=m`:host{display:none}`,Ae=o([u("deck-notes")],Ae);var at=m`:host{display:none;position:absolute;inset:0;padding:var(--rik-slide-padding-y) var(--rik-slide-padding-x);flex-direction:column;overflow:hidden;background:var(--rik-surface-page);font-family:var(--rik-font-sans);color:var(--rik-text-default)}:host([active]){display:flex}`,Hr=m`h1{font-size:var(--rik-font-size-h1);font-weight:700;color:var(--rik-text-default);letter-spacing:-0.022em;line-height:1.15;margin-bottom:var(--rik-space-4);padding-bottom:var(--rik-space-2);border-bottom:3px solid var(--rik-accent);display:inline-block;align-self:flex-start;flex:0 0 auto}h1 .accent{color:var(--rik-accent)}::slotted(p),p{font-size:var(--rik-font-size-body);line-height:1.65;color:var(--rik-text-default--muted);margin:0}::slotted(strong),strong{color:var(--rik-text-default);font-weight:700}::slotted(code),code{font-family:var(--rik-font-mono);font-size:var(--rik-font-size-mono-sm);background:rgba(0,0,0,0.06);padding:2px 6px;border-radius:var(--rik-radius-sm);color:var(--rik-text-default)}`,Cr=m`.lbl{display:inline-block;padding:var(--deck-eyebrow-padding-y,4px) var(--deck-eyebrow-padding-x,12px);background:var(--deck-eyebrow-bg,var(--rik-accent));color:var(--deck-eyebrow-color,var(--rik-accent__on,var(--rik-surface-inverse)));border-radius:var(--deck-eyebrow-radius,var(--rik-radius-pill));font-size:var(--rik-font-size-xs);font-weight:700;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:var(--rik-space-1);align-self:flex-start}.lead{font-size:var(--rik-font-size-lead);color:var(--rik-text-default--faint);line-height:1.5;margin-bottom:var(--rik-space-4);max-width:75ch;flex:0 0 auto}.kicker{font-size:var(--rik-font-size-xs);font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:var(--rik-text-default--faint);margin-bottom:var(--rik-space-3);display:block}.kicker.on-dark{color:rgba(255,255,255,0.35)}.caption{font-size:var(--rik-font-size-sm);color:var(--rik-text-default--faint);line-height:1.55}.caption.on-dark{color:rgba(255,255,255,0.5)}.col-label{font-size:var(--rik-font-size-xs);font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--rik-text-default--faint);margin-bottom:var(--rik-space-2)}`,P=[at,Hr,Cr];var E=class extends p{render(){let t=(this.brand??"").split("\xB7").map(n=>n.trim()).filter(Boolean),e=t[0]??"",r=t.slice(1).join(" \xB7 "),s=[this.speaker&&{l:this.speakerLabel??"Pr\xE9sent\xE9 par",v:this.speaker},this.company&&{l:this.companyLabel??"Entreprise",v:this.company},this.duration&&{l:this.durationLabel??"Dur\xE9e",v:this.duration},this.audience&&{l:this.audienceLabel??"Audience",v:this.audience},this.runtime&&{l:this.runtimeLabel??"Runtime",v:this.runtime}].filter(n=>!!n),a=!!this.brandSrc;return c`<div class="brand" part="brand"> ${a?c`<span class="brand-tile"><img src="${this.brandSrc}" alt="${e}"></span>`:""}
        ${e?c`<span class="brand-name">${e}</span>`:""}
        ${r?c`<span class="brand-context">${r}</span>`:""}
      </div>
      <slot></slot>
      ${s.length?c`<div class="meta" part="meta"> ${s.map(n=>c`
            <div class="meta-item"><strong>${n.l}</strong><span>${n.v}</span></div>
          `)}
        </div>`:""}
    `}};E.styles=[...P,m`:host{background:var(--deck-cover-bg,var(--rik-surface-inverse));justify-content:center;color:var(--deck-cover-text,var(--rik-text-inverse))}.brand{display:inline-flex;align-items:center;gap:var(--rik-space-3);margin-bottom:var(--rik-space-5);align-self:flex-start}.brand-tile{width:64px;height:64px;display:inline-flex;align-items:center;justify-content:center}.brand-tile img{width:100%;height:100%;display:block}.brand-name{font-family:var(--rik-font-display,inherit);font-size:var(--rik-font-size-xs);font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:var(--deck-cover-soft,var(--rik-text-inverse--muted))}.brand-context{font-size:var(--rik-font-size-xs);font-weight:700;color:var(--deck-cover-muted,var(--rik-text-inverse--faint));letter-spacing:0.2em;text-transform:uppercase;padding-left:var(--rik-space-3);border-left:1px solid var(--deck-cover-border,var(--rik-border-inverse))}::slotted(h1){font-size:clamp(3.6rem,9vw,8.5rem);font-weight:900;color:var(--deck-cover-text,var(--rik-text-inverse));line-height:1.02;letter-spacing:-0.035em;margin-bottom:var(--rik-space-4);border:none;padding:0}::slotted(.sub){font-size:var(--rik-font-size-h2);color:var(--deck-cover-muted,var(--rik-text-inverse--faint));margin-bottom:var(--rik-space-6);max-width:60ch;line-height:1.45;display:block}.meta{display:flex;gap:var(--rik-space-6);border-top:1px solid var(--deck-cover-border,var(--rik-border-inverse));padding-top:var(--rik-space-4)}.meta-item strong{display:block;font-size:var(--rik-font-size-xs);letter-spacing:0.12em;text-transform:uppercase;color:var(--deck-cover-faint,var(--rik-text-inverse--ghost));margin-bottom:6px;font-weight:700}.meta-item span{color:var(--deck-cover-text,var(--rik-text-inverse));font-size:var(--rik-font-size-body);font-weight:600}`],o([l({type:String})],E.prototype,"brand",2),o([l({type:String,attribute:"brand-src"})],E.prototype,"brandSrc",2),o([l({type:String})],E.prototype,"speaker",2),o([l({type:String})],E.prototype,"company",2),o([l({type:String})],E.prototype,"duration",2),o([l({type:String})],E.prototype,"audience",2),o([l({type:String})],E.prototype,"runtime",2),o([l({type:String,attribute:"speaker-label"})],E.prototype,"speakerLabel",2),o([l({type:String,attribute:"company-label"})],E.prototype,"companyLabel",2),o([l({type:String,attribute:"duration-label"})],E.prototype,"durationLabel",2),o([l({type:String,attribute:"audience-label"})],E.prototype,"audienceLabel",2),o([l({type:String,attribute:"runtime-label"})],E.prototype,"runtimeLabel",2),E=o([u("deck-cover")],E);var ce=class extends p{render(){return c`${this.num?c`<div class="sec-num" part="num">${this.num}</div>`:""}
      <slot></slot>
    `}};ce.styles=[...P,m`:host{background:var(--deck-section-bg,var(--rik-surface-inverse));color:var(--rik-text-inverse);justify-content:center;align-items:center;text-align:center}.sec-num{font-size:var(--rik-font-size-xs);font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:var(--deck-section-num-color,var(--rik-text-inverse--ghost));margin-bottom:var(--rik-space-3);display:inline-flex;align-items:center;gap:0.8rem;font-family:var(--rik-font-mono)}.sec-num::before,.sec-num::after{content:'';width:32px;height:1px;background:var(--deck-section-rule-color,var(--rik-border-inverse))}::slotted(h1){font-size:var(--rik-font-size-section);font-weight:900;color:var(--deck-section-title-color,var(--rik-accent));line-height:1.02;letter-spacing:-0.03em;max-width:18ch;border:none;padding:0;margin:0;text-align:center;align-self:center}::slotted(h1 em){color:var(--deck-section-em-color,var(--rik-text-inverse--muted));font-style:normal;font-weight:700}`],o([l({type:String})],ce.prototype,"num",2),ce=o([u("deck-section")],ce);var pe=class extends p{render(){return c`${this.eyebrow?c`<span class="lbl">${this.eyebrow}</span>`:""}
      <slot name="title"></slot>
      <slot name="lead"></slot>
      <div class="body" part="body"><slot></slot></div>
    `}};pe.styles=[...P,m`:host{justify-content:flex-start}.body{flex:1;min-height:0;display:flex;flex-direction:column;justify-content:flex-start;gap:var(--rik-space-3);overflow:hidden}::slotted(deck-code:not([nested])),::slotted(deck-mermaid),::slotted(table),::slotted(pre),::slotted(svg),::slotted(.hero-main){max-height:100%;flex:0 1 auto}`],o([l({type:String})],pe.prototype,"eyebrow",2),pe=o([u("deck-feature")],pe);var Y=class extends p{_resolveSp(t){let e=parseInt(t,10);return!Number.isNaN(e)&&e>=1&&e<=6?`var(--rik-space-${e})`:t}updated(){this.gap&&this.style.setProperty("--_gap",this._resolveSp(this.gap)),this.colGap&&this.style.setProperty("--_col-gap",this._resolveSp(this.colGap))}render(){let t=this.querySelector('[slot="a"]'),e=this.cols==="3"||!!t;return c`${this.eyebrow?c`<span class="lbl">${this.eyebrow}</span>`:""}
      <slot name="title"></slot>
      <slot name="lead"></slot>
      <div class="body" part="body">
        ${e?c`<div class="col" part="col"><slot name="a"></slot></div> <div class="col" part="col"><slot name="b"></slot></div> <div class="col" part="col"><slot name="c"></slot></div>`:c`<div class="col" part="col"><slot name="left"></slot></div> <div class="col" part="col"><slot name="right"></slot></div>`}
      </div>
    `}};Y.styles=[...P,m`:host{justify-content:flex-start}.body{flex:1;min-height:0;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:minmax(0,1fr);gap:var(--_gap,var(--deck-split-gap,var(--rik-space-5)))}:host([cols="1-2"]) .body{grid-template-columns:1fr 2fr}:host([cols="2-1"]) .body{grid-template-columns:2fr 1fr}:host([cols="3"]) .body{grid-template-columns:1fr 1fr 1fr;gap:var(--_gap,var(--deck-split-gap,var(--rik-space-4)))}.col{display:flex;flex-direction:column;min-height:0;min-width:0;gap:var(--_col-gap,var(--deck-split-col-gap,var(--rik-space-3)));overflow:hidden}.col.center{justify-content:center}`],o([l({type:String})],Y.prototype,"eyebrow",2),o([l({type:String})],Y.prototype,"cols",2),o([l({type:String})],Y.prototype,"gap",2),o([l({type:String,attribute:"col-gap"})],Y.prototype,"colGap",2),Y=o([u("deck-split")],Y);var he=class extends p{render(){return c`${this.eyebrow?c`<span class="lbl">${this.eyebrow}</span>`:""}
      <slot name="title"></slot>
      <slot name="lead"></slot>
      <div class="hero" part="hero"><slot></slot></div>
      <div class="detail" part="detail">
        <div class="col"><slot name="left"></slot></div>
        <div class="col"><slot name="right"></slot></div>
      </div>
    `}};he.styles=[...P,m`:host{justify-content:flex-start}.hero{flex:var(--deck-feature-cards-hero-flex,1 1 50%);min-height:0;display:flex;flex-direction:column;overflow:hidden}::slotted(deck-code),::slotted(deck-mermaid),::slotted(pre),::slotted(table),::slotted(svg){max-height:100%;flex:1 1 auto}.detail{flex:var(--deck-feature-cards-detail-flex,0 1 40%);min-height:0;margin-top:var(--deck-feature-cards-gap,var(--rik-space-3));display:grid;grid-template-columns:1fr 1fr;gap:var(--deck-feature-cards-col-gap,var(--rik-space-4));overflow:hidden}.col{display:flex;flex-direction:column;gap:var(--rik-space-2);min-width:0;min-height:0;overflow:hidden}`],o([l({type:String})],he.prototype,"eyebrow",2),he=o([u("deck-feature-cards")],he);var R=class extends p{updated(){this.position&&this.style.setProperty("--_pos",this.position),typeof this.darken=="number"&&this.style.setProperty("--_dim",String(this.darken));let t=this.align==="top"?"flex-start":this.align==="bottom"?"flex-end":"center";if(this.style.setProperty("--_align",t),this.textAlign){this.style.setProperty("--_text-align",this.textAlign);let e=this.textAlign==="center"?"center":this.textAlign==="right"?"flex-end":"flex-start";this.style.setProperty("--_text-align-items",e)}}render(){let t=this.src?`background-image: url("${this.src.replace(/"/g,"%22")}")`:"";return c`<div class="bg" part="bg" style=${t}></div> <div class="overlay" part="overlay"></div> <div class="content" part="content"><slot></slot></div>`}};R.styles=[at,m`:host{padding:0;color:var(--deck-photo-text-color,var(--rik-text-inverse));overflow:hidden}.bg{position:absolute;inset:0;background-size:cover;background-position:var(--_pos,center);background-repeat:no-repeat}.overlay{position:absolute;inset:0;background:var(--deck-photo-overlay-color,rgba(0,0,0,var(--_dim,0.35)))}.content{position:relative;z-index:1;display:flex;flex-direction:column;gap:var(--rik-space-3);padding:var(--deck-photo-padding-y,var(--rik-slide-padding-y)) var(--deck-photo-padding-x,var(--rik-slide-padding-x));width:100%;height:100%;max-width:100%;box-sizing:border-box;justify-content:var(--_align,center);text-align:var(--_text-align,left);align-items:var(--_text-align-items,flex-start)}.content > *{max-width:var(--deck-photo-content-max-width,36ch)}::slotted(h1){font-family:var(--rik-font-display,var(--rik-font-sans));font-size:clamp(2.5rem,6vw,5.5rem);font-weight:900;letter-spacing:-0.035em;line-height:1.02;color:var(--deck-photo-text-color,var(--rik-text-inverse));margin:0;text-shadow:0 2px 16px rgba(0,0,0,0.35)}::slotted(h2){font-family:var(--rik-font-display,var(--rik-font-sans));font-size:clamp(1.6rem,3vw,2.6rem);font-weight:800;letter-spacing:-0.025em;line-height:1.1;color:var(--deck-photo-text-color,var(--rik-text-inverse));margin:0;text-shadow:0 2px 12px rgba(0,0,0,0.35)}::slotted(p),::slotted(.sub){font-size:var(--rik-font-size-lead);color:var(--deck-photo-text-muted,var(--rik-text-inverse--muted));line-height:1.5;margin:0;text-shadow:0 1px 8px rgba(0,0,0,0.35)}::slotted(.kicker){font:700 var(--rik-font-size-xs)/1 var(--rik-font-mono);letter-spacing:0.18em;text-transform:uppercase;color:var(--deck-photo-text-muted,var(--rik-text-inverse--muted));margin:0}`],o([l({type:String})],R.prototype,"src",2),o([l({type:String})],R.prototype,"position",2),o([l({type:Number})],R.prototype,"darken",2),o([l({type:String})],R.prototype,"align",2),o([l({type:String,attribute:"text-align"})],R.prototype,"textAlign",2),R=o([u("deck-photo")],R);var me=class extends p{render(){return c`<div class="body" part="body"> ${this.kicker?c`<span class="kicker on-dark">${this.kicker}</span>`:""}
        <slot></slot>
      </div>
    `}};me.styles=[...P,m`:host{background:var(--deck-takeaway-bg,var(--rik-surface-inverse));color:var(--rik-text-inverse);justify-content:center;align-items:center;text-align:center}.body{display:flex;flex-direction:column;align-items:center;gap:var(--deck-takeaway-gap,var(--rik-space-4));max-width:75vw}::slotted(.display){font-family:var(--rik-font-display,var(--rik-font-sans));font-size:clamp(3rem,7vw,5.5rem);font-weight:900;color:var(--deck-takeaway-display-color,var(--rik-accent));letter-spacing:-0.03em;line-height:1.05;margin:0}::slotted(.display.danger){color:var(--rik-status-danger)}::slotted(.caption){font-size:var(--rik-font-size-lead);color:var(--deck-takeaway-caption-color,var(--rik-text-inverse--faint))}`],o([l({type:String})],me.prototype,"kicker",2),me=o([u("deck-takeaway")],me);var qt={info:'<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',warn:'<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',danger:'<circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/>',ok:'<path d="M20 6 9 17l-5-5"/>'},ve=class extends p{render(){let t=this.type??"info",e=qt[t]??qt.info;return c`<div class="icon-box"> <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" .innerHTML="${e}"></svg> </div> <div class="content"><slot></slot></div>`}};ve.styles=m`:host{display:flex;gap:var(--rik-space-3);padding:var(--deck-callout-padding-y,var(--rik-space-3)) var(--deck-callout-padding-x,var(--rik-space-4));border-radius:var(--deck-callout-radius,var(--rik-radius-md));background:var(--deck-callout-bg,var(--rik-status-info__bg--mid));border:1px solid var(--deck-callout-border,var(--rik-status-info__border));box-shadow:var(--rik-elevation-2);align-items:center;color:var(--rik-text-default--muted);font-family:var(--rik-font-sans);font-size:var(--rik-font-size-body);line-height:1.55}:host([type="info"]){--deck-callout-bg:var(--rik-status-info__bg--mid);--deck-callout-border:var(--rik-status-info__border);--deck-callout-stroke:var(--rik-accent)}:host([type="warn"]){--deck-callout-bg:var(--rik-status-warn__bg);--deck-callout-border:var(--rik-status-warn__border);--deck-callout-stroke:var(--rik-status-warn)}:host([type="danger"]){--deck-callout-bg:var(--rik-status-danger__bg);--deck-callout-border:var(--rik-status-danger__border);--deck-callout-stroke:var(--rik-status-danger)}:host([type="ok"]){--deck-callout-bg:var(--rik-status-success__bg);--deck-callout-border:var(--rik-status-success__border);--deck-callout-stroke:var(--rik-status-success)}.icon-box{flex-shrink:0;width:var(--rik-icon-2xl);height:var(--rik-icon-2xl);display:inline-flex;align-items:center;justify-content:center;border-radius:50%;background:var(--rik-surface-tint)}.icon-box svg{width:var(--rik-icon-lg);height:var(--rik-icon-lg);stroke:var(--deck-callout-stroke,var(--rik-accent));stroke-width:2.2}.content{flex:1}::slotted(p){margin:0}::slotted(strong){color:var(--rik-text-default);font-weight:700}::slotted(code){font-family:var(--rik-font-mono);font-size:var(--rik-font-size-mono-sm);background:var(--rik-surface-tint);padding:2px 6px;border-radius:var(--rik-radius-sm);color:var(--rik-text-default)}`,o([l({type:String})],ve.prototype,"type",2),ve=o([u("deck-callout")],ve);var G=class extends p{constructor(){super(...arguments);this.center=!1;this.compact=!1}render(){return c`<slot></slot>`}};G.styles=m`:host{display:flex;flex-direction:column;gap:var(--deck-card-gap,var(--rik-space-2));background:var(--deck-card-bg,var(--rik-surface-raised--strong));border:1px solid var(--deck-card-border,var(--rik-border-default));border-radius:var(--deck-card-radius,var(--rik-radius-lg));padding:var(--deck-card-padding-y,var(--rik-space-3)) var(--deck-card-padding-x,var(--rik-space-4));box-shadow:var(--deck-card-shadow,var(--rik-elevation-2));min-height:0;font-family:var(--rik-font-sans);color:var(--deck-card-text,var(--rik-text-default--muted))}:host([color="yellow"]){background:var(--deck-card-bg,var(--rik-status-info__bg));border:4px solid var(--deck-card-border,var(--rik-status-info__border))}:host([color="orange"]){background:var(--deck-card-bg,var(--rik-status-warn__bg));border:4px solid var(--deck-card-border,var(--rik-status-warn__border))}:host([color="green"]){background:var(--deck-card-bg,var(--rik-status-success__bg));border:4px solid var(--deck-card-border,var(--rik-status-success__border))}:host([color="red"]){background:var(--deck-card-bg,var(--rik-status-danger__bg));border:4px solid var(--deck-card-border,var(--rik-status-danger__border))}::slotted(h3){font-family:var(--rik-font-display,var(--rik-font-sans));font-size:var(--rik-font-size-h2);font-weight:700;color:var(--deck-card-title-color,var(--rik-text-default));letter-spacing:-0.01em;line-height:1.25;margin:0}::slotted(p){font-size:var(--rik-font-size-body);line-height:1.55;margin:0}::slotted(strong){color:var(--rik-text-default);font-weight:700}:host([center]){text-align:center;align-items:center}:host([compact]){padding:var(--rik-space-2) var(--rik-space-3)}`,o([l({type:String})],G.prototype,"color",2),o([l({type:Boolean})],G.prototype,"center",2),o([l({type:Boolean})],G.prototype,"compact",2),G=o([u("deck-card")],G);import{marked as Yt}from"https://cdn.jsdelivr.net/npm/marked@12/+esm";Yt.setOptions({gfm:!0,breaks:!1});var ue=class extends p{constructor(){super(...arguments);this._html=""}connectedCallback(){super.connectedCallback(),this._parse()}_parse(){let e=this.textContent??"",r=e.split(`
`),s=r.filter(n=>n.trim().length>0).reduce((n,d)=>Math.min(n,d.match(/^ */)?.[0].length??0),1/0),a=s===1/0?e:r.map(n=>n.slice(s)).join(`
`);this._html=Yt.parse(a.trim()),this.textContent=""}render(){return c`<div class="content" .innerHTML="${this._html}"></div>`}};ue.styles=m`:host{display:block;color:var(--rik-text-default--muted);font-family:var(--rik-font-sans)}h1,h2,h3,h4{color:var(--rik-text-default);font-weight:700;letter-spacing:-0.01em}h2{font-size:var(--rik-font-size-h2);margin-bottom:var(--rik-space-2)}h3{font-size:var(--rik-font-size-lead);margin-bottom:var(--rik-space-2);margin-top:var(--rik-space-3)}h4{font-size:var(--rik-font-size-body);margin-bottom:var(--rik-space-1);margin-top:var(--rik-space-3)}p{font-size:var(--rik-font-size-body);line-height:1.65;margin:0 0 var(--rik-space-3)}p:last-child{margin-bottom:0}strong{color:var(--rik-text-default);font-weight:700}em{font-style:italic}code{font-family:var(--rik-font-mono);font-size:var(--rik-font-size-mono-sm);background:var(--rik-surface-tint);padding:2px 6px;border-radius:var(--rik-radius-sm);color:var(--rik-text-default)}pre{background:var(--deck-md-pre-bg,var(--rik-code__bg));border:1px solid var(--deck-md-pre-border,var(--rik-code__border));border-radius:var(--rik-radius-md);padding:var(--rik-space-3) var(--rik-space-4);overflow:auto;font-family:var(--rik-font-mono);font-size:var(--rik-font-size-mono);line-height:1.75;color:var(--deck-md-pre-text,var(--rik-code__text));margin:0 0 var(--rik-space-3);box-shadow:var(--rik-elevation-2)}pre code{background:none;padding:0;color:inherit;border-radius:0}ul,ol{padding-left:1.4rem;margin:0 0 var(--rik-space-3)}li{margin-bottom:var(--rik-space-1);font-size:var(--rik-font-size-body);line-height:1.55}li::marker{color:var(--rik-accent)}a{color:var(--rik-accent);text-decoration:underline;text-decoration-thickness:1px}blockquote{border-left:3px solid var(--rik-accent);padding:var(--rik-space-1) var(--rik-space-3);color:var(--rik-text-default--faint);font-style:italic;margin:0 0 var(--rik-space-3)}hr{border:none;border-top:1px solid var(--rik-border-default);margin:var(--rik-space-4) 0}.content{display:contents}`,o([O()],ue.prototype,"_html",2),ue=o([u("deck-md")],ue);var Wt=!1;async function Pr(){Wt||(window.mermaid||await new Promise((i,t)=>{let e=document.createElement("script");e.src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js",e.onload=()=>i(),e.onerror=()=>t(new Error("mermaid failed to load")),document.head.appendChild(e)}),window.mermaid.initialize({startOnLoad:!1,theme:"dark",themeVariables:{background:"#0f0f10",mainBkg:"#2a2a2a",nodeBorder:"#555",lineColor:"#777",textColor:"#e5e5e5",fontSize:"13px",edgeLabelBackground:"#111"},flowchart:{curve:"basis",htmlLabels:!0,padding:12},securityLevel:"loose"}),Wt=!0)}var Nr=0,ie=class extends p{constructor(){super(...arguments);this.rendered=!1;this._svg="";this._source=""}connectedCallback(){super.connectedCallback(),this._source=(this.textContent??"").trim();let e=this._source.split(`
`),r=e.filter(s=>s.trim()).reduce((s,a)=>Math.min(s,a.match(/^ */)?.[0].length??0),1/0);r<1/0&&(this._source=e.map(s=>s.slice(r)).join(`
`)),this._render()}async _render(){if(!this._source)return;await Pr();let e=`mmd-${++Nr}`;try{let{svg:r}=await window.mermaid.render(e,this._source);this._svg=r,this.rendered=!0}catch(r){console.error("Mermaid render error",r);let s=r instanceof Error?r.message:String(r);this._svg=`<pre style="color:#f87171">${s}</pre>`}}render(){return c`<div class="canvas" .innerHTML="${this._svg}"></div>`}};ie.styles=m`:host{display:flex;align-items:center;justify-content:center;background:var(--deck-mermaid-bg,var(--rik-code__bg));border:1px solid var(--deck-mermaid-border,var(--rik-code__border));border-radius:var(--deck-mermaid-radius,var(--rik-radius-md));padding:var(--deck-mermaid-padding,var(--rik-space-4));box-shadow:var(--rik-elevation-2);overflow:hidden;min-width:0}:host([compact]){padding:var(--rik-space-2)}.canvas{width:100%;max-width:100%;text-align:center;overflow:hidden}.canvas svg{width:100% !important;height:auto !important;max-width:100% !important;max-height:60vh}:host([compact]) .canvas{max-width:60%}:host([compact]) .canvas svg{max-height:22vh}`,o([l({type:Boolean,reflect:!0})],ie.prototype,"rendered",2),o([O()],ie.prototype,"_svg",2),ie=o([u("deck-mermaid")],ie);var Ir={yellow:"var(--rik-accent)",orange:"var(--rik-status-warn)",green:"var(--rik-status-success)",red:"var(--rik-status-danger)",purple:"var(--rik-decor-orchid)",lime:"var(--rik-decor-lime)",cyan:"var(--rik-decor-canary)"},se=class extends p{updated(){this.tone?this.style.setProperty("--_c",Ir[this.tone]??this.tone):this.style.removeProperty("--_c")}render(){return c`${this.num?c`<div class="num" part="num">${this.num}</div>`:""}
      <slot name="claim"></slot>
      <div class="body" part="body"><slot></slot></div>
    `}};se.styles=m`:host{display:flex;flex-direction:column;gap:var(--deck-stat-gap,var(--rik-space-2));padding:var(--deck-stat-padding-y,var(--rik-space-4)) var(--deck-stat-padding-x,var(--rik-space-3));border-left:var(--deck-stat-border-width,4px) solid var(--_c,var(--deck-stat-color,var(--rik-accent)));min-width:0;font-family:var(--rik-font-sans)}.num{font-family:var(--rik-font-display,var(--rik-font-sans));font-size:var(--deck-stat-num-size,clamp(3.5rem,7vw,6rem));font-weight:var(--deck-stat-num-weight,900);line-height:0.9;color:var(--_c,var(--deck-stat-color,var(--rik-accent)));letter-spacing:-0.04em}::slotted([slot="claim"]){font-family:var(--rik-font-display,var(--rik-font-sans));font-size:var(--rik-font-size-strong);font-weight:800;color:var(--deck-stat-claim-color,var(--rik-text-default));line-height:1.1;letter-spacing:-0.02em;margin:0}.body{font-size:var(--rik-font-size-body);color:var(--deck-stat-body-color,var(--rik-text-default--faint));line-height:1.45;margin-top:var(--rik-space-2)}::slotted(strong){color:var(--rik-text-default);font-weight:700}::slotted(code){font-family:var(--rik-font-mono);font-size:var(--rik-font-size-mono-sm);background:var(--rik-surface-tint);color:var(--rik-text-default);padding:2px 6px;border-radius:var(--rik-radius-sm)}`,o([l({type:String})],se.prototype,"num",2),o([l({type:String})],se.prototype,"tone",2),se=o([u("deck-stat")],se);var Te=class extends p{render(){return c`<slot></slot>`}};Te.styles=m`:host{display:flex;flex-direction:column;gap:var(--rik-space-2)}`,Te=o([u("deck-metric-list")],Te);var J=class extends p{constructor(){super(...arguments);this.mono=!1}render(){return c`<span class="label ${this.mono?"mono":""}"><slot></slot></span> <span class="value" data-severity="${this.severity??""}">${this.value}</span>`}};J.styles=m`:host{display:flex;justify-content:space-between;align-items:center;background:var(--deck-metric-bg,var(--rik-surface-raised--strong));border:1px solid var(--deck-metric-border,var(--rik-border-default));border-radius:var(--deck-metric-radius,var(--rik-radius-md));padding:var(--deck-metric-padding-y,var(--rik-space-2)) var(--deck-metric-padding-x,var(--rik-space-4));font-family:var(--rik-font-sans);font-size:var(--rik-font-size-body);color:var(--deck-metric-text,var(--rik-text-default--muted));box-shadow:var(--deck-metric-shadow,var(--rik-elevation-2))}.label{font-family:inherit}.label.mono{font-family:var(--rik-font-mono);font-size:var(--rik-font-size-sm);color:var(--deck-metric-label-color,var(--rik-text-default--faint))}.value{font-weight:700}.value[data-severity="bad"]{color:var(--deck-metric-value-bad,var(--rik-status-danger))}.value[data-severity="warn"]{color:var(--deck-metric-value-warn,var(--rik-status-warn))}.value[data-severity="ok"]{color:var(--deck-metric-value-ok,var(--rik-status-success))}.value[data-severity="info"]{color:var(--deck-metric-value-info,var(--rik-status-info__text))}`,o([l({type:String})],J.prototype,"value",2),o([l({type:String})],J.prototype,"severity",2),o([l({type:Boolean})],J.prototype,"mono",2),J=o([u("deck-metric")],J);var Le=class extends p{render(){return c`<slot></slot>`}};Le.styles=m`:host{display:flex;flex-direction:column;gap:var(--rik-space-2xs)}`,Le=o([u("deck-tier-list")],Le);var W=class extends p{constructor(){super(...arguments);this.hot=!1}render(){return c`<div class="head"> <span class="name">${this.name}</span> <span class="speed" data-severity="${this.severity??(this.hot?"hot":"")}">${this.speed}</span> </div> <div class="desc"><slot></slot></div>`}};W.styles=m`:host{display:flex;flex-direction:column;gap:var(--rik-space-hair);background:var(--deck-tier-bg,var(--rik-surface-raised--strong));border:1px solid var(--deck-tier-border,var(--rik-border-default));border-radius:var(--deck-tier-radius,var(--rik-radius-md));padding:var(--deck-tier-padding-y,var(--rik-space-2)) var(--deck-tier-padding-x,var(--rik-space-4));box-shadow:var(--deck-tier-shadow,var(--rik-elevation-2));font-family:var(--rik-font-sans)}:host([hot]){border-color:var(--deck-tier-hot-border,var(--rik-status-info__border));background:var(--deck-tier-hot-bg,var(--rik-status-info__bg))}.head{display:flex;justify-content:space-between;align-items:baseline}.name{font:700 var(--rik-font-size-body)/1 var(--rik-font-mono);color:var(--deck-tier-name-color,var(--rik-text-default))}:host([hot]) .name{color:var(--deck-tier-hot-color,var(--rik-accent))}.speed{font:700 var(--rik-font-size-body)/1 var(--rik-font-mono)}.speed[data-severity="muted"]{color:var(--deck-tier-speed-muted,var(--rik-text-default--faint))}.speed[data-severity="warn"]{color:var(--deck-tier-speed-warn,var(--rik-status-warn))}.speed[data-severity="ok"]{color:var(--deck-tier-speed-ok,var(--rik-status-success))}:host([hot]) .speed{color:var(--deck-tier-hot-color,var(--rik-accent))}.desc{font-size:var(--rik-font-size-sm);color:var(--deck-tier-desc-color,var(--rik-text-default--faint));line-height:1.4}`,o([l({type:String})],W.prototype,"name",2),o([l({type:String})],W.prototype,"speed",2),o([l({type:String})],W.prototype,"severity",2),o([l({type:Boolean,reflect:!0})],W.prototype,"hot",2),W=o([u("deck-tier")],W);var ze=class extends p{render(){return c`<slot></slot>`}};ze.styles=m`:host{display:block;text-align:center;color:var(--rik-text-default--faint);opacity:var(--rik-opacity-soft);font-size:var(--rik-font-size-xs);padding:2px 0}`,ze=o([u("deck-tier-arrow")],ze);var Me=class extends p{render(){return c`<slot></slot>`}};Me.styles=m`:host{display:flex;flex-direction:column;gap:var(--rik-space-2xs)}`,Me=o([u("deck-step-list")],Me);var oe=class extends p{render(){return c`<span class="step-num">${this.n}</span> <span class="label"><slot></slot></span> ${this.note?c`<span class="chip">${this.note}</span>`:""}
    `}};oe.styles=m`:host{display:flex;align-items:center;gap:var(--rik-space-3);background:var(--deck-step-bg,var(--rik-surface-raised--strong));border:1px solid var(--deck-step-border,var(--rik-border-default));border-radius:var(--deck-step-radius,var(--rik-radius-md));padding:var(--deck-step-padding-y,var(--rik-space-2xs)) var(--deck-step-padding-x,var(--rik-space-3));box-shadow:var(--deck-step-shadow,var(--rik-elevation-2));font-family:var(--rik-font-sans);font-size:var(--rik-font-size-body)}.step-num{flex:0 0 auto;width:var(--deck-step-num-size,var(--rik-icon-sm));height:var(--deck-step-num-size,var(--rik-icon-sm));display:inline-flex;align-items:center;justify-content:center;background:var(--deck-step-num-bg,var(--rik-accent));color:var(--deck-step-num-color,var(--rik-accent__on,var(--rik-surface-inverse)));border-radius:50%;font:700 var(--rik-font-size-xs)/1 var(--rik-font-sans)}.label{flex:1;font-family:var(--rik-font-mono);font-weight:600;color:var(--deck-step-label-color,var(--rik-text-default))}.chip{flex:0 0 auto;display:inline-block;padding:2px var(--rik-space-2);background:var(--deck-step-chip-bg,var(--rik-surface-tint));color:var(--deck-step-chip-color,var(--rik-text-default--faint));border-radius:var(--rik-radius-pill);font:600 var(--rik-font-size-sm)/1.4 var(--rik-font-sans)}`,o([l({type:String})],oe.prototype,"n",2),o([l({type:String})],oe.prototype,"note",2),oe=o([u("deck-step")],oe);var fe=class extends p{render(){return c`<slot></slot>`}};fe.styles=m`:host{display:inline-flex;align-items:center;justify-content:center;background:var(--deck-kbd-bg,var(--rik-surface-raised--strong));border:1px solid var(--deck-kbd-border,var(--rik-border-default));border-bottom:3px solid var(--rik-surface-tint--strong,rgba(0,0,0,0.10));border-radius:var(--deck-kbd-radius,5px);padding:var(--deck-kbd-padding-y,3px) var(--deck-kbd-padding-x,8px);font:700 0.92rem/1 var(--rik-font-mono);color:var(--deck-kbd-color,var(--rik-text-default));min-width:22px;text-align:center;box-shadow:0 1px 0 rgba(255,255,255,0.5) inset}:host([tone="accent"]){background:var(--deck-kbd-accent-bg,var(--rik-accent));color:var(--deck-kbd-color,var(--rik-accent__on,var(--rik-surface-inverse)));border-color:rgba(0,0,0,0.15)}:host([tone="ok"]){background:var(--deck-kbd-ok-bg,var(--rik-status-success));color:var(--deck-kbd-color,var(--rik-surface-inverse));border-color:rgba(0,0,0,0.15)}`,o([l({type:String})],fe.prototype,"tone",2),fe=o([u("deck-kbd")],fe);var F=class extends p{render(){let t=(this.keys??"").trim().split(/\s+/).filter(Boolean);return c`<span class="keys" part="keys"> ${t.map(e=>c`<span class="k">${e}</span>`)}
      </span>
      <div class="body" part="body">
        ${this.label?c`<div class="label">${this.label}</div>`:""}
        ${this.note?c`<div class="note">${this.note}</div>`:c`<div class="note"><slot></slot></div>`}
      </div>
    `}};F.styles=m`:host{display:flex;align-items:center;gap:var(--rik-space-3);padding:var(--rik-space-2) 0;font-family:var(--rik-font-sans)}.keys{display:inline-flex;gap:4px;flex-shrink:0}.keys deck-kbd,.keys .k{display:inline-flex;align-items:center;justify-content:center;background:var(--rik-surface-raised--strong);border:1px solid var(--rik-border-default);border-bottom:3px solid rgba(0,0,0,0.10);border-radius:5px;padding:3px 8px;font:700 0.92rem/1 var(--rik-font-mono);color:var(--rik-text-default);min-width:22px;text-align:center}.body{flex:1;min-width:0}.label{font:700 var(--rik-font-size-body)/1.2 var(--rik-font-sans);color:var(--rik-text-default)}.note{font:400 var(--rik-font-size-sm)/1.4 var(--rik-font-sans);color:var(--rik-text-default--faint);margin-top:2px}:host([tone="accent"]) .keys .k{background:var(--rik-accent);color:var(--rik-surface-inverse);border-color:rgba(0,0,0,0.15)}:host([tone="ok"]) .keys .k{background:var(--rik-status-success);color:var(--rik-surface-inverse);border-color:rgba(0,0,0,0.15)}`,o([l({type:String})],F.prototype,"keys",2),o([l({type:String})],F.prototype,"label",2),o([l({type:String})],F.prototype,"note",2),o([l({type:String})],F.prototype,"tone",2),F=o([u("deck-shortcut")],F);var ae=class extends p{updated(){if(this.colGap){let t=parseInt(this.colGap,10),e=!Number.isNaN(t)&&t>=1&&t<=6?`var(--sp-${t})`:this.colGap;this.style.setProperty("--_col-gap",e)}}render(){return c`<slot></slot>`}};ae.styles=m`:host{display:grid;grid-template-columns:1fr 1fr;gap:0 var(--_col-gap,var(--rik-space-5));font-family:var(--rik-font-sans)}:host([cols="1"]){grid-template-columns:1fr}::slotted(deck-shortcut){border-bottom:1px solid var(--rik-border-default)}`,o([l({type:String})],ae.prototype,"cols",2),o([l({type:String,attribute:"col-gap"})],ae.prototype,"colGap",2),ae=o([u("deck-shortcut-list")],ae);var Or={start:"flex-start",center:"center",end:"flex-end",between:"space-between",around:"space-around"},jr={start:"flex-start",center:"center",end:"flex-end",stretch:"stretch"},K=class extends p{updated(){if(this.gap){let t=parseInt(this.gap,10);!Number.isNaN(t)&&t>=1&&t<=6?this.style.setProperty("--_gap",`var(--rik-space-${t})`):this.style.setProperty("--_gap",this.gap)}else this.style.removeProperty("--_gap");this.style.setProperty("--_dir",this.direction==="row"?"row":"column"),this.align&&this.style.setProperty("--_align",jr[this.align]??this.align),this.justify&&this.style.setProperty("--_justify",Or[this.justify]??this.justify)}render(){return c`<slot></slot>`}};K.styles=m`:host{display:flex;flex-direction:var(--_dir,column);gap:var(--_gap,var(--deck-stack-gap,var(--rik-space-3)));align-items:var(--_align,stretch);justify-content:var(--_justify,flex-start);min-width:0;min-height:0}:host([fill]){flex:1 1 auto}`,o([l({type:String})],K.prototype,"gap",2),o([l({type:String})],K.prototype,"direction",2),o([l({type:String})],K.prototype,"align",2),o([l({type:String})],K.prototype,"justify",2),K=o([u("deck-stack")],K);var Ft={start:"start",center:"center",end:"end",stretch:"stretch"};function Kt(i){if(!i)return null;let t=parseInt(i,10);return!Number.isNaN(t)&&String(t)===i.trim()&&t>=1&&t<=12?`repeat(${t}, minmax(0, 1fr))`:i}function Rr(i){if(!i)return null;let t=parseInt(i,10);return!Number.isNaN(t)&&t>=1&&t<=6?`var(--rik-space-${t})`:i}var U=class extends p{updated(){let t=Kt(this.cols),e=Kt(this.rows),r=Rr(this.gap);t&&this.style.setProperty("--_cols",t),e&&this.style.setProperty("--_rows",e),r&&this.style.setProperty("--_gap",r),this.align&&this.style.setProperty("--_align",Ft[this.align]??this.align),this.justify&&this.style.setProperty("--_justify",Ft[this.justify]??this.justify)}render(){return c`<slot></slot>`}};U.styles=m`:host{display:grid;grid-template-columns:var(--_cols,1fr);grid-template-rows:var(--_rows,auto);gap:var(--_gap,var(--deck-grid-gap,var(--rik-space-3)));align-items:var(--_align,stretch);justify-items:var(--_justify,stretch);min-width:0;min-height:0}:host([fill]){flex:1 1 auto;height:100%}`,o([l({type:String})],U.prototype,"cols",2),o([l({type:String})],U.prototype,"rows",2),o([l({type:String})],U.prototype,"gap",2),o([l({type:String})],U.prototype,"align",2),o([l({type:String})],U.prototype,"justify",2),U=o([u("deck-grid")],U);var ge=class extends p{render(){return c`<slot></slot>`}};ge.styles=m`:host{display:inline-block;padding:var(--deck-badge-padding-y,var(--rik-space-1)) var(--deck-badge-padding-x,var(--rik-space-3));margin-bottom:var(--rik-space-2);font:700 var(--rik-font-size-xs)/1.2 var(--rik-font-sans);letter-spacing:0.1em;text-transform:uppercase;border-radius:var(--deck-badge-radius,var(--rik-radius-pill));background:var(--deck-badge-bg,var(--rik-surface-tint));color:var(--deck-badge-fg,var(--rik-text-default--faint));border:1px solid var(--deck-badge-border,var(--rik-border-default))}:host([type="bad"]){--deck-badge-bg:var(--rik-status-danger__bg);--deck-badge-fg:var(--rik-status-danger);--deck-badge-border:var(--rik-status-danger__border)}:host([type="ok"]){--deck-badge-bg:var(--rik-status-success__bg);--deck-badge-fg:var(--rik-status-success);--deck-badge-border:var(--rik-status-success__border)}:host([type="info"]){--deck-badge-bg:var(--rik-status-info__bg--strong);--deck-badge-fg:var(--rik-status-info__text);--deck-badge-border:var(--rik-status-info__border)}:host([type="warn"]){--deck-badge-bg:var(--rik-status-warn__bg);--deck-badge-fg:var(--rik-status-warn);--deck-badge-border:var(--rik-status-warn__border)}`,o([l({type:String})],ge.prototype,"type",2),ge=o([u("deck-badge")],ge);var nt=class extends p{static{this.styles=m`:host{display:block;font:700 var(--deck-kicker-font-size,var(--rik-font-size-xs))/1.2 var(--rik-font-sans);letter-spacing:var(--deck-kicker-tracking,0.14em);text-transform:uppercase;color:var(--deck-kicker-color,var(--rik-text-default--faint));margin-bottom:var(--deck-kicker-margin,var(--rik-space-2))}:host([on-dark]){color:var(--deck-kicker-on-dark-color,var(--rik-text-inverse--faint))}`}render(){return c`<slot></slot>`}};customElements.define("deck-kicker",nt);var Vt={warn:"var(--rik-status-warn)",danger:"var(--rik-status-danger)",ok:"var(--rik-status-success)",info:"var(--rik-accent)",muted:"var(--rik-text-default--faint)",accent:"var(--rik-accent)"},Xt={lead:"var(--rik-font-size-lead)",big:"var(--rik-font-size-big)",mega:"var(--rik-font-size-mega)",stat:"var(--rik-font-size-stat)",display:"clamp(2.6rem, 6vw, 5rem)"},V=class extends p{updated(){this.tone&&Vt[this.tone]?this.style.setProperty("--_color",Vt[this.tone]):this.style.removeProperty("--_color"),this.size&&Xt[this.size]?this.style.setProperty("--_size",Xt[this.size]):this.style.removeProperty("--_size")}render(){return c`<slot></slot>`}};V.styles=m`:host{display:block;margin:0;font-family:var(--rik-font-display,var(--rik-font-sans));font-weight:900;line-height:1.1;letter-spacing:-0.02em;font-size:var(--deck-punch-size,var(--_size,var(--rik-font-size-lead)));color:var(--deck-punch-color,var(--_color,inherit))}:host([weight="700"]){font-weight:700}:host([weight="800"]){font-weight:800}:host([align="center"]){text-align:center}:host([align="right"]){text-align:right}`,o([l({type:String})],V.prototype,"tone",2),o([l({type:String})],V.prototype,"size",2),o([l({type:String,reflect:!0})],V.prototype,"weight",2),o([l({type:String,reflect:!0})],V.prototype,"align",2),V=o([u("deck-punch")],V);function Ur(i,t){let e=i.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"),r=[],s=(d,h)=>{let v="P"+r.length+"E";return r.push('<span class="'+d+'">'+h+"</span>"),v};return t==="html"||t==="xml"||t==="svg"?(e=e.replace(/(&lt;!--[\s\S]*?--&gt;)/g,d=>s("cmt",d)),e=e.replace(/(&lt;!doctype[^&]*&gt;)/gi,d=>s("cmt",d)),e=e.replace(/("[^"]*"|'[^']*')/g,d=>s("str",d)),e=e.replace(/(&lt;\/?)([a-zA-Z][a-zA-Z0-9:-]*)/g,(d,h,v)=>h+s("kw",v)),e=e.replace(/\b([a-zA-Z][a-zA-Z0-9-]*)(?==)/g,d=>s("prop",d))):t==="css"||t==="scss"||t==="less"?(e=e.replace(/(\/\*[\s\S]*?\*\/)/g,d=>s("cmt",d)),e=e.replace(/("[^"]*"|'[^']*')/g,d=>s("str",d)),e=e.replace(/([a-zA-Z-]+)(?=\s*:)/g,d=>s("prop",d)),e=e.replace(/(#[0-9a-fA-F]{3,8})\b/g,d=>s("num",d)),e=e.replace(/\b(\d+(?:\.\d+)?)(px|rem|em|%|vh|vw|vmin|vmax|s|ms|deg)?/g,(d,h,v)=>s("num",h+(v??"")))):(e=e.replace(/(\/\/[^\n]*)/g,d=>s("cmt",d)),e=e.replace(/(['"`])((?:\\.|(?!\1)[^\\])*)\1/g,d=>s("str",d)),e=e.replace(/\b(const|let|var|function|return|if|else|for|while|class|extends|new|export|import|from|as|await|async|of|in|typeof|instanceof|true|false|null|undefined)\b/g,d=>s("kw",d)),e=e.replace(/\b(\d+(?:\.\d+)?)\b/g,d=>s("num",d))),e=e.replace(/P(\d+)E/g,(d,h)=>r[+h]??""),e}var B=class extends p{constructor(){super(...arguments);this.lang="";this.hero=!1;this.nested=!1;this._html="";this._groups=null}connectedCallback(){super.connectedCallback(),this._highlight();try{this._groups=JSON.parse(this.getAttribute("step-groups")??"null")}catch{this._groups=null}}_highlight(){let r=(this.textContent??"").split(`
`);for(;r.length&&!r[0].trim();)r.shift();for(;r.length&&!r[r.length-1].trim();)r.pop();let s=r.filter(n=>n.trim().length>0).reduce((n,d)=>Math.min(n,d.match(/^ */)?.[0].length??0),1/0),a=s===1/0?r:r.map(n=>n.slice(s));this._html=a.map((n,d)=>'<span class="line" data-line="'+(d+1)+'">'+Ur(n||" ",this.lang)+"</span>").join("")}applyStep(e){if(!this._groups)return;let r=this.shadowRoot?.querySelectorAll(".line");if(r)if(e===0)r.forEach(s=>s.classList.remove("dim","lit"));else{let s=this._groups[Math.min(e-1,this._groups.length-1)]??[];r.forEach(a=>{let n=parseInt(a.dataset.line??"0",10);a.classList.toggle("lit",s.includes(n)),a.classList.toggle("dim",!s.includes(n))})}}render(){return c`<pre><code .innerHTML="${this._html}"></code></pre>`}};B.styles=m`:host{display:block;background:var(--deck-code-bg,var(--rik-code__bg));border:1px solid var(--deck-code-border,var(--rik-code__border));border-radius:var(--deck-code-radius,var(--rik-radius-md));padding:var(--deck-code-padding-y,var(--rik-space-3)) var(--deck-code-padding-x,var(--rik-space-4));font-family:var(--rik-font-mono);font-size:var(--rik-font-size-mono);line-height:1.7;color:var(--deck-code-text,var(--rik-code__text));box-shadow:var(--rik-elevation-2);overflow:auto;white-space:pre}:host([hero]){display:flex;align-items:safe center;padding:var(--deck-code-padding-y,var(--rik-space-4)) var(--deck-code-padding-x,var(--rik-space-5))}:host([nested]){box-shadow:none;border-radius:var(--rik-radius-sm);padding:var(--deck-code-padding-y,var(--rik-space-2)) var(--deck-code-padding-x,var(--rik-space-3))}pre{margin:0;font:inherit;color:inherit}code{display:block;width:100%;font:inherit;color:inherit}.line{transition:opacity 0.25s ease;display:block}.line.dim{opacity:0.25}.line.lit{opacity:1}.kw{color:var(--deck-code-syntax-kw,var(--rik-code__syntax-keyword))}.fn{color:var(--deck-code-syntax-fn,var(--rik-code__syntax-function))}.str{color:var(--deck-code-syntax-str,var(--rik-code__syntax-string))}.num{color:var(--deck-code-syntax-num,var(--rik-code__syntax-number))}.cmt{color:var(--deck-code-syntax-cmt,var(--rik-code__syntax-comment));font-style:italic}.ty{color:var(--deck-code-syntax-ty,var(--rik-code__syntax-type))}.prop{color:var(--deck-code-syntax-prop,var(--rik-code__syntax-property))}`,o([l({type:String})],B.prototype,"lang",2),o([l({type:Boolean,reflect:!0})],B.prototype,"hero",2),o([l({type:Boolean,reflect:!0})],B.prototype,"nested",2),o([l({type:String,attribute:"step-groups"})],B.prototype,"stepGroups",2),o([O()],B.prototype,"_html",2),B=o([u("deck-code")],B);new URLSearchParams(location.search).has("live")&&Promise.resolve().then(()=>(Dt(),Wr));
