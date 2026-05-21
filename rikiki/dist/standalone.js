var ct=Object.defineProperty;var Gt=Object.getOwnPropertyDescriptor;var Le=(s,t)=>()=>(s&&(t=s(s=0)),t);var ze=(s,t)=>{for(var e in t)ct(s,e,{get:t[e],enumerable:!0})};var o=(s,t,e,r)=>{for(var i=r>1?void 0:r?Gt(t,e):t,a=s.length-1,n;a>=0;a--)(n=s[a])&&(i=(r?n(t,e,i):n(i))||i);return r&&i&&ct(t,e,i),i};var et={};ze(et,{closeHelp:()=>Lt,toggleHelp:()=>hr});function pr(s){let t=s.querySelector("#kb-overlay");if(t)return t;if(!s.querySelector(`style[${Tt}]`)){let i=document.createElement("style");i.setAttribute(Tt,"1"),i.textContent=dr,s.appendChild(i)}let e=document.createElement("div");return e.innerHTML=cr,t=e.firstElementChild,s.appendChild(t),t.addEventListener("click",()=>Lt(s.host)),t.querySelector(".kb-card")?.addEventListener("click",i=>i.stopPropagation()),t}function hr(s){if(!s.shadowRoot)return;pr(s.shadowRoot).classList.toggle("open")}function Lt(s){s.shadowRoot?.querySelector("#kb-overlay")?.classList.remove("open")}var Tt,dr,cr,Oe=Le(()=>{"use strict";Tt="data-deck-help",dr=`
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
`,cr=`
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
`});var Ct={};ze(Ct,{installPresenter:()=>vr});function Ht(s){let t=Array.from(s.children).filter(v=>v.tagName.toLowerCase().startsWith("deck-")),e=t.findIndex(v=>v.hasAttribute("active")),r=t[e]??null,i=t[e+1]??null,n=(r?.querySelector("deck-notes")?.textContent??"").trim(),h=document.querySelector('link[rel="stylesheet"][href*="rikiki"], link[rel="stylesheet"][href*="tokens"], link[rel="stylesheet"][href*="theme"]')?.href??"";return{current:e+1,total:t.length,slideHtml:r?.outerHTML??"",nextHtml:i?.outerHTML??null,notes:n,themeHref:h}}function zt(s){Ue&&Ue.postMessage({type:"state",state:Ht(s)})}function vr(s){if(ne=ne??new WeakSet,ne.has(s)){I?.close(),I=null;return}ne.add(s),Ue=new BroadcastChannel(Mt),s.addEventListener("slide-change",()=>zt(s)),Ue.addEventListener("message",r=>{let i=r.data;i?.type==="key"&&i.key&&window.dispatchEvent(new KeyboardEvent("keydown",{key:i.key,shiftKey:!!i.shift,bubbles:!0})),i?.type==="hello"&&zt(s)});let t=Ht(s);if(I=window.open("","rikiki-presenter","width=1280,height=800,popup=yes"),!I){console.warn("[rikiki/presenter] popup was blocked \xB7 allow popups for this site"),ne.delete(s);return}I.document.open(),I.document.write(mr(t)),I.document.close();let e=setInterval(()=>{I&&I.closed&&(clearInterval(e),ne?.delete(s),I=null)},1e3)}var Mt,I,Ue,ne,mr,tt=Le(()=>{"use strict";Mt="rik-presenter",I=null,Ue=null,ne=null;mr=s=>`<!doctype html>
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
    gap: 16px;
    padding: 16px;
    height: 100vh;
    box-sizing: border-box;
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
  .panel .body { flex: 1; min-height: 0; padding: 16px; overflow: hidden; }
  .panel iframe { width: 100%; height: 100%; border: 0; background: white; border-radius: 8px; }
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
  const channel = new BroadcastChannel('${Mt}');
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
    const themeHref = ${JSON.stringify(s.themeHref)};
    const themeLink = themeHref ? '<link rel="stylesheet" href="' + themeHref + '">' : '';
    // Use the consumer's rikiki bundle URL \xB7 we cannot guess it perfectly, so
    // assume it sits next to the theme css.
    const bundleHref = themeHref.replace(/themes\\/[^/]+\\.css.*$/, 'dist/index.js');
    return '<!doctype html><html><head><meta charset="UTF-8">' + themeLink +
      '<script type="module" src="' + bundleHref + '"><' + '/script>' +
      '<style>html,body{margin:0;padding:0;height:100%;overflow:hidden}body{display:flex}deck-root{flex:1}deck-root>*{display:flex!important}</style>' +
      '</head><body><deck-root>' + slideHtml + '</deck-root></body></html>';
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
</html>`});var Ot={};ze(Ot,{mountOverview:()=>yr});function fr(s){if(s.querySelector(`style[${Pt}]`))return;let t=document.createElement("style");t.setAttribute(Pt,"1"),t.textContent=ur,s.appendChild(t)}function gr(s,t){if(s.querySelector(`link[${Nt}]`))return;let e=document.createElement("link");e.rel="stylesheet",e.setAttribute(Nt,"1"),e.href=new URL("../tokens.css",t).href,s.appendChild(e)}function It(s){let e=s.slides[0]?.querySelector("h1");return e?Array.from(e.childNodes).map(r=>r.nodeName==="BR"?" ":r.textContent??"").join("").replace(/\s+/g," ").trim()||`Slide ${s.startIdx+1}`:`Slide ${s.startIdx+1}`}function kr(s){return(s.textContent||"").replace(/\s+/g," ").trim().slice(0,400).toLowerCase()}function yr(s,t){let e=s.shadowRoot;if(!e)return()=>{};fr(e),gr(e,import.meta.url);let r=e.querySelector("#overview-grid");r||(r=document.createElement("div"),r.id="overview-grid",e.appendChild(r)),r.innerHTML="";let i=t.slides.length,a=i>60,n=i>300?140:i>150?160:i>60?180:220;r.style.setProperty("--ov-cell-min",n+"px");let d=window.innerWidth,h=window.innerHeight;r.style.setProperty("--ov-thumb-w",`${d}px`),r.style.setProperty("--ov-thumb-h",`${h}px`),requestAnimationFrame(()=>{let k=r.querySelector(".ov-cell")?.clientWidth??n;r.style.setProperty("--overview-scale",String(k/d))});let v=document.createElement("div");v.className="ov-bar";let g=document.createElement("input");g.className="ov-search",g.type="search",g.placeholder=`Search ${i} slides \xB7 type to filter`,g.spellcheck=!1,v.appendChild(g);let f=document.createElement("span");f.className="ov-count",f.textContent=`${i} slides \xB7 ${t.chapters.length} chapters`,v.appendChild(f);let x=document.createElement("span");x.className="ov-hint",x.textContent="O \xB7 Esc \xB7 close",v.appendChild(x),r.appendChild(v);let $=document.createElement("div");$.className="ov-body"+(a?"":" compact"),r.appendChild($);let T=a?document.createElement("aside"):null;T&&(T.className="ov-aside",$.appendChild(T));let F=document.createElement("div");F.className="ov-main"+(a?"":" ov-path"),$.appendChild(F);let Re=[],at=[],nt=new WeakMap,je=new IntersectionObserver(k=>{for(let S of k){if(!S.isIntersecting)continue;let b=S.target;if(b.dataset.loaded)continue;let M=nt.get(b);if(!M)continue;let y=document.createElement("div");y.className="ov-thumb";let P=M.cloneNode(!0);P.setAttribute("active",""),y.appendChild(P),b.insertBefore(y,b.firstChild),b.dataset.loaded="1",je.unobserve(b)}},{root:null,rootMargin:"300px 0px",threshold:0});t.chapters.forEach((k,S)=>{let b=document.createElement("section");if(b.className="ov-chapter",b.id=`ov-chapter-${S}`,a){let y=document.createElement("header");y.className="ov-chapter-head";let P=document.createElement("span");P.className="ov-chapter-num",P.textContent=String(S+1).padStart(2,"0"),y.appendChild(P);let H=document.createElement("span");H.className="ov-chapter-title",H.textContent=It(k),y.appendChild(H);let _=document.createElement("span");_.className="ov-chapter-count",_.textContent=`${k.slides.length} slide${k.slides.length>1?"s":""}`,y.appendChild(_),b.appendChild(y)}let M=document.createElement("div");if(M.className="ov-row",k.slides.forEach((y,P)=>{if(!a&&P>0){let dt=document.createElement("div");dt.className="ov-connector",M.appendChild(dt)}let H=k.startIdx+P,_=document.createElement("div");_.className="ov-cell",_.dataset.idx=String(H),_.dataset.search=kr(y),H===t.currentIdx&&(_.dataset.current="1"),nt.set(_,y),je.observe(_);let J=document.createElement("span");J.className="ov-cell-label",J.textContent=String(H+1),_.appendChild(J),_.addEventListener("click",()=>t.onPick(H)),M.appendChild(_)}),b.appendChild(M),F.appendChild(b),Re.push(b),T){let y=document.createElement("button");y.type="button",y.className="ov-aside-item",t.currentIdx>=k.startIdx&&t.currentIdx<k.startIdx+k.slides.length&&(y.dataset.active="1");let H=document.createElement("span");H.className="ov-aside-num",H.textContent=String(S+1).padStart(2,"0"),y.appendChild(H);let _=document.createElement("span");_.className="ov-aside-text",_.textContent=It(k);let J=document.createElement("div");J.className="ov-aside-count",J.textContent=`${k.slides.length} slide${k.slides.length>1?"s":""}`,_.appendChild(J),y.appendChild(_),y.addEventListener("click",()=>{b.scrollIntoView({behavior:"smooth",block:"start"})}),T.appendChild(y),at.push(y)}});let Be=null;T&&(Be=new IntersectionObserver(k=>{let S=k.filter(b=>b.isIntersecting).sort((b,M)=>b.boundingClientRect.top-M.boundingClientRect.top);if(S.length>0){let b=Re.indexOf(S[0].target);b>=0&&at.forEach((M,y)=>{y===b?M.dataset.active="1":delete M.dataset.active})}},{root:F,rootMargin:"0px 0px -70% 0px",threshold:0}),Re.forEach(k=>Be.observe(k)));let lt=r.querySelectorAll(".ov-cell");return g.addEventListener("input",()=>{let k=g.value.trim().toLowerCase();if(!k){lt.forEach(S=>delete S.dataset.filteredOut);return}lt.forEach(S=>{(S.dataset.search||"").includes(k)?delete S.dataset.filteredOut:S.dataset.filteredOut="1"})}),requestAnimationFrame(()=>{let k=r.querySelector(".ov-cell[data-current]");k&&k.scrollIntoView({block:"center"})}),()=>{Be?.disconnect(),je.disconnect(),r&&(r.innerHTML="")}}var Pt,Nt,ur,rt=Le(()=>{"use strict";Pt="data-deck-overview",Nt="data-overview-tokens",ur=`
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
`});var Rt={};ze(Rt,{installTransitions:()=>wr});function wr(s){if(s.__rkTransitions)return s.__rkTransitions;let t=s.shadowRoot;if(!t)return()=>{};let e=document.createElement("style");e.textContent=xr,e.setAttribute("data-rik-transitions",""),t.appendChild(e);function r(d,h){if(!h)return 0;let v=d.compareDocumentPosition(h);return v&Node.DOCUMENT_POSITION_PRECEDING?1:v&Node.DOCUMENT_POSITION_FOLLOWING?-1:0}let i=d=>{let h=d,v=h.detail.current,g=h.detail.previous;if(!v)return;let f=v.dataset.transition||s.transition||"fade",x=r(v,g);f==="slide"&&x<0?f="slide-right":f==="slide-right"&&x>0?f="slide":f==="slide-up"&&x<0?f="slide-down":f==="slide-down"&&x>0&&(f="slide-up");let $=`rk-enter-${f}`,T=`rk-exit-${f}`,F=A[f]??480;g&&g!==v&&(g.classList.remove(...Ut,..._r,"rk-leaving"),g.style.display="flex",g.style.zIndex="1",g.offsetWidth,g.classList.add("rk-leaving",T),window.setTimeout(()=>{g.classList.remove("rk-leaving",T),g.style.display="",g.style.zIndex=""},F+40)),v.classList.remove(...Ut),v.style.zIndex="2",v.offsetWidth,v.classList.add($),window.setTimeout(()=>{v.classList.remove($),v.style.zIndex=""},F+40)};s.addEventListener("slide-change",i);let a=s.querySelector(":scope > [active]");a&&i(new CustomEvent("slide-change",{detail:{current:a,previous:null}}));let n=()=>{s.removeEventListener("slide-change",i),e.remove(),delete s.__rkTransitions};return s.__rkTransitions=n,n}var A,L,br,xr,Ut,_r,it=Le(()=>{"use strict";A={slide:560,"slide-up":520,"slide-down":520,"slide-right":560,fade:480,zoom:520,flip:560},L="var(--rik-motion__ease-out, cubic-bezier(0.16, 1, 0.3, 1))",br="var(--rik-motion__ease-spring, cubic-bezier(0.5, 1.8, 0.3, 1))",xr=`
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

  ::slotted([active].rk-enter-slide)        { animation: rk-slide-in       ${A.slide}ms ${L}    both; }
  ::slotted(.rk-leaving.rk-exit-slide)      { animation: rk-slide-out      ${A.slide}ms ${L}    both; }
  ::slotted([active].rk-enter-slide-right)  { animation: rk-slide-right-in ${A["slide-right"]}ms ${L} both; }
  ::slotted(.rk-leaving.rk-exit-slide-right){ animation: rk-slide-right-out ${A["slide-right"]}ms ${L} both; }
  ::slotted([active].rk-enter-slide-up)     { animation: rk-slide-up-in    ${A["slide-up"]}ms ${L} both; }
  ::slotted(.rk-leaving.rk-exit-slide-up)   { animation: rk-slide-up-out   ${A["slide-up"]}ms ${L} both; }
  ::slotted([active].rk-enter-slide-down)   { animation: rk-slide-down-in  ${A["slide-down"]}ms ${L} both; }
  ::slotted(.rk-leaving.rk-exit-slide-down) { animation: rk-slide-down-out ${A["slide-down"]}ms ${L} both; }
  ::slotted([active].rk-enter-fade)         { animation: rk-fade-in        ${A.fade}ms ${L} both; }
  ::slotted(.rk-leaving.rk-exit-fade)       { animation: rk-fade-out       ${A.fade}ms ${L} both; }
  ::slotted([active].rk-enter-zoom)         { animation: rk-zoom-in        ${A.zoom}ms ${br} both; }
  ::slotted(.rk-leaving.rk-exit-zoom)       { animation: rk-zoom-out       ${A.zoom}ms ${L} both; }
  ::slotted([active].rk-enter-flip)         { animation: rk-flip-in        ${A.flip}ms ${L} both; }
  ::slotted(.rk-leaving.rk-exit-flip)       { animation: rk-flip-out       ${A.flip}ms ${L} both; }

  @media (prefers-reduced-motion: reduce) {
    ::slotted([active][class*='rk-enter-']),
    ::slotted(.rk-leaving)                  { animation: none; }
  }
`,Ut=["rk-enter-slide","rk-enter-slide-up","rk-enter-slide-down","rk-enter-slide-right","rk-enter-fade","rk-enter-zoom","rk-enter-flip"],_r=["rk-exit-slide","rk-exit-slide-up","rk-exit-slide-down","rk-exit-slide-right","rk-exit-fade","rk-exit-zoom","rk-exit-flip"]});var Me=globalThis,He=Me.ShadowRoot&&(Me.ShadyCSS===void 0||Me.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,qe=Symbol(),pt=new WeakMap,fe=class{constructor(t,e,r){if(this._$cssResult$=!0,r!==qe)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o,e=this.t;if(He&&t===void 0){let r=e!==void 0&&e.length===1;r&&(t=pt.get(e)),t===void 0&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),r&&pt.set(e,t))}return t}toString(){return this.cssText}},ht=s=>new fe(typeof s=="string"?s:s+"",void 0,qe),m=(s,...t)=>{let e=s.length===1?s[0]:t.reduce((r,i,a)=>r+(n=>{if(n._$cssResult$===!0)return n.cssText;if(typeof n=="number")return n;throw Error("Value passed to 'css' function must be a 'css' function result: "+n+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+s[a+1],s[0]);return new fe(e,s,qe)},mt=(s,t)=>{if(He)s.adoptedStyleSheets=t.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(let e of t){let r=document.createElement("style"),i=Me.litNonce;i!==void 0&&r.setAttribute("nonce",i),r.textContent=e.cssText,s.appendChild(r)}},Ye=He?s=>s:s=>s instanceof CSSStyleSheet?(t=>{let e="";for(let r of t.cssRules)e+=r.cssText;return ht(e)})(s):s;var{is:Kt,defineProperty:Ft,getOwnPropertyDescriptor:Jt,getOwnPropertyNames:Zt,getOwnPropertySymbols:Qt,getPrototypeOf:Dt}=Object,Ce=globalThis,vt=Ce.trustedTypes,er=vt?vt.emptyScript:"",tr=Ce.reactiveElementPolyfillSupport,ge=(s,t)=>s,ke={toAttribute(s,t){switch(t){case Boolean:s=s?er:null;break;case Object:case Array:s=s==null?s:JSON.stringify(s)}return s},fromAttribute(s,t){let e=s;switch(t){case Boolean:e=s!==null;break;case Number:e=s===null?null:Number(s);break;case Object:case Array:try{e=JSON.parse(s)}catch{e=null}}return e}},Pe=(s,t)=>!Kt(s,t),ut={attribute:!0,type:String,converter:ke,reflect:!1,useDefault:!1,hasChanged:Pe};Symbol.metadata??=Symbol("metadata"),Ce.litPropertyMetadata??=new WeakMap;var j=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=ut){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){let r=Symbol(),i=this.getPropertyDescriptor(t,r,e);i!==void 0&&Ft(this.prototype,t,i)}}static getPropertyDescriptor(t,e,r){let{get:i,set:a}=Jt(this.prototype,t)??{get(){return this[e]},set(n){this[e]=n}};return{get:i,set(n){let d=i?.call(this);a?.call(this,n),this.requestUpdate(t,d,r)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??ut}static _$Ei(){if(this.hasOwnProperty(ge("elementProperties")))return;let t=Dt(this);t.finalize(),t.l!==void 0&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(ge("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(ge("properties"))){let e=this.properties,r=[...Zt(e),...Qt(e)];for(let i of r)this.createProperty(i,e[i])}let t=this[Symbol.metadata];if(t!==null){let e=litPropertyMetadata.get(t);if(e!==void 0)for(let[r,i]of e)this.elementProperties.set(r,i)}this._$Eh=new Map;for(let[e,r]of this.elementProperties){let i=this._$Eu(e,r);i!==void 0&&this._$Eh.set(i,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){let e=[];if(Array.isArray(t)){let r=new Set(t.flat(1/0).reverse());for(let i of r)e.unshift(Ye(i))}else t!==void 0&&e.push(Ye(t));return e}static _$Eu(t,e){let r=e.attribute;return r===!1?void 0:typeof r=="string"?r:typeof t=="string"?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),this.renderRoot!==void 0&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){let t=new Map,e=this.constructor.elementProperties;for(let r of e.keys())this.hasOwnProperty(r)&&(t.set(r,this[r]),delete this[r]);t.size>0&&(this._$Ep=t)}createRenderRoot(){let t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return mt(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,e,r){this._$AK(t,r)}_$ET(t,e){let r=this.constructor.elementProperties.get(t),i=this.constructor._$Eu(t,r);if(i!==void 0&&r.reflect===!0){let a=(r.converter?.toAttribute!==void 0?r.converter:ke).toAttribute(e,r.type);this._$Em=t,a==null?this.removeAttribute(i):this.setAttribute(i,a),this._$Em=null}}_$AK(t,e){let r=this.constructor,i=r._$Eh.get(t);if(i!==void 0&&this._$Em!==i){let a=r.getPropertyOptions(i),n=typeof a.converter=="function"?{fromAttribute:a.converter}:a.converter?.fromAttribute!==void 0?a.converter:ke;this._$Em=i;let d=n.fromAttribute(e,a.type);this[i]=d??this._$Ej?.get(i)??d,this._$Em=null}}requestUpdate(t,e,r,i=!1,a){if(t!==void 0){let n=this.constructor;if(i===!1&&(a=this[t]),r??=n.getPropertyOptions(t),!((r.hasChanged??Pe)(a,e)||r.useDefault&&r.reflect&&a===this._$Ej?.get(t)&&!this.hasAttribute(n._$Eu(t,r))))return;this.C(t,e,r)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(t,e,{useDefault:r,reflect:i,wrapped:a},n){r&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,n??e??this[t]),a!==!0||n!==void 0)||(this._$AL.has(t)||(this.hasUpdated||r||(e=void 0),this._$AL.set(t,e)),i===!0&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}let t=this.scheduleUpdate();return t!=null&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(let[i,a]of this._$Ep)this[i]=a;this._$Ep=void 0}let r=this.constructor.elementProperties;if(r.size>0)for(let[i,a]of r){let{wrapped:n}=a,d=this[i];n!==!0||this._$AL.has(i)||d===void 0||this.C(i,void 0,a,d)}}let t=!1,e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$EO?.forEach(r=>r.hostUpdate?.()),this.update(e)):this._$EM()}catch(r){throw t=!1,this._$EM(),r}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$EO?.forEach(e=>e.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(e=>this._$ET(e,this[e])),this._$EM()}updated(t){}firstUpdated(t){}};j.elementStyles=[],j.shadowRootOptions={mode:"open"},j[ge("elementProperties")]=new Map,j[ge("finalized")]=new Map,tr?.({ReactiveElement:j}),(Ce.reactiveElementVersions??=[]).push("2.1.2");var Je=globalThis,ft=s=>s,Ne=Je.trustedTypes,gt=Ne?Ne.createPolicy("lit-html",{createHTML:s=>s}):void 0,wt="$lit$",X=`lit$${Math.random().toFixed(9).slice(2)}$`,Et="?"+X,rr=`<${Et}>`,D=document,be=()=>D.createComment(""),xe=s=>s===null||typeof s!="object"&&typeof s!="function",Ze=Array.isArray,ir=s=>Ze(s)||typeof s?.[Symbol.iterator]=="function",We=`[ 	
\f\r]`,ye=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,kt=/-->/g,yt=/>/g,Z=RegExp(`>|${We}(?:([^\\s"'>=/]+)(${We}*=${We}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),bt=/'/g,xt=/"/g,$t=/^(?:script|style|textarea|title)$/i,Qe=s=>(t,...e)=>({_$litType$:s,strings:t,values:e}),c=Qe(1),Ur=Qe(2),Rr=Qe(3),ee=Symbol.for("lit-noChange"),w=Symbol.for("lit-nothing"),_t=new WeakMap,Q=D.createTreeWalker(D,129);function St(s,t){if(!Ze(s)||!s.hasOwnProperty("raw"))throw Error("invalid template strings array");return gt!==void 0?gt.createHTML(t):t}var sr=(s,t)=>{let e=s.length-1,r=[],i,a=t===2?"<svg>":t===3?"<math>":"",n=ye;for(let d=0;d<e;d++){let h=s[d],v,g,f=-1,x=0;for(;x<h.length&&(n.lastIndex=x,g=n.exec(h),g!==null);)x=n.lastIndex,n===ye?g[1]==="!--"?n=kt:g[1]!==void 0?n=yt:g[2]!==void 0?($t.test(g[2])&&(i=RegExp("</"+g[2],"g")),n=Z):g[3]!==void 0&&(n=Z):n===Z?g[0]===">"?(n=i??ye,f=-1):g[1]===void 0?f=-2:(f=n.lastIndex-g[2].length,v=g[1],n=g[3]===void 0?Z:g[3]==='"'?xt:bt):n===xt||n===bt?n=Z:n===kt||n===yt?n=ye:(n=Z,i=void 0);let $=n===Z&&s[d+1].startsWith("/>")?" ":"";a+=n===ye?h+rr:f>=0?(r.push(v),h.slice(0,f)+wt+h.slice(f)+X+$):h+X+(f===-2?d:$)}return[St(s,a+(s[e]||"<?>")+(t===2?"</svg>":t===3?"</math>":"")),r]},_e=class s{constructor({strings:t,_$litType$:e},r){let i;this.parts=[];let a=0,n=0,d=t.length-1,h=this.parts,[v,g]=sr(t,e);if(this.el=s.createElement(v,r),Q.currentNode=this.el.content,e===2||e===3){let f=this.el.content.firstChild;f.replaceWith(...f.childNodes)}for(;(i=Q.nextNode())!==null&&h.length<d;){if(i.nodeType===1){if(i.hasAttributes())for(let f of i.getAttributeNames())if(f.endsWith(wt)){let x=g[n++],$=i.getAttribute(f).split(X),T=/([.?@])?(.*)/.exec(x);h.push({type:1,index:a,name:T[2],strings:$,ctor:T[1]==="."?Xe:T[1]==="?"?Ge:T[1]==="@"?Ke:ae}),i.removeAttribute(f)}else f.startsWith(X)&&(h.push({type:6,index:a}),i.removeAttribute(f));if($t.test(i.tagName)){let f=i.textContent.split(X),x=f.length-1;if(x>0){i.textContent=Ne?Ne.emptyScript:"";for(let $=0;$<x;$++)i.append(f[$],be()),Q.nextNode(),h.push({type:2,index:++a});i.append(f[x],be())}}}else if(i.nodeType===8)if(i.data===Et)h.push({type:2,index:a});else{let f=-1;for(;(f=i.data.indexOf(X,f+1))!==-1;)h.push({type:7,index:a}),f+=X.length-1}a++}}static createElement(t,e){let r=D.createElement("template");return r.innerHTML=t,r}};function oe(s,t,e=s,r){if(t===ee)return t;let i=r!==void 0?e._$Co?.[r]:e._$Cl,a=xe(t)?void 0:t._$litDirective$;return i?.constructor!==a&&(i?._$AO?.(!1),a===void 0?i=void 0:(i=new a(s),i._$AT(s,e,r)),r!==void 0?(e._$Co??=[])[r]=i:e._$Cl=i),i!==void 0&&(t=oe(s,i._$AS(s,t.values),i,r)),t}var Ve=class{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){let{el:{content:e},parts:r}=this._$AD,i=(t?.creationScope??D).importNode(e,!0);Q.currentNode=i;let a=Q.nextNode(),n=0,d=0,h=r[0];for(;h!==void 0;){if(n===h.index){let v;h.type===2?v=new we(a,a.nextSibling,this,t):h.type===1?v=new h.ctor(a,h.name,h.strings,this,t):h.type===6&&(v=new Fe(a,this,t)),this._$AV.push(v),h=r[++d]}n!==h?.index&&(a=Q.nextNode(),n++)}return Q.currentNode=D,i}p(t){let e=0;for(let r of this._$AV)r!==void 0&&(r.strings!==void 0?(r._$AI(t,r,e),e+=r.strings.length-2):r._$AI(t[e])),e++}},we=class s{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,r,i){this.type=2,this._$AH=w,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=r,this.options=i,this._$Cv=i?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode,e=this._$AM;return e!==void 0&&t?.nodeType===11&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=oe(this,t,e),xe(t)?t===w||t==null||t===""?(this._$AH!==w&&this._$AR(),this._$AH=w):t!==this._$AH&&t!==ee&&this._(t):t._$litType$!==void 0?this.$(t):t.nodeType!==void 0?this.T(t):ir(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==w&&xe(this._$AH)?this._$AA.nextSibling.data=t:this.T(D.createTextNode(t)),this._$AH=t}$(t){let{values:e,_$litType$:r}=t,i=typeof r=="number"?this._$AC(t):(r.el===void 0&&(r.el=_e.createElement(St(r.h,r.h[0]),this.options)),r);if(this._$AH?._$AD===i)this._$AH.p(e);else{let a=new Ve(i,this),n=a.u(this.options);a.p(e),this.T(n),this._$AH=a}}_$AC(t){let e=_t.get(t.strings);return e===void 0&&_t.set(t.strings,e=new _e(t)),e}k(t){Ze(this._$AH)||(this._$AH=[],this._$AR());let e=this._$AH,r,i=0;for(let a of t)i===e.length?e.push(r=new s(this.O(be()),this.O(be()),this,this.options)):r=e[i],r._$AI(a),i++;i<e.length&&(this._$AR(r&&r._$AB.nextSibling,i),e.length=i)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t!==this._$AB;){let r=ft(t).nextSibling;ft(t).remove(),t=r}}setConnected(t){this._$AM===void 0&&(this._$Cv=t,this._$AP?.(t))}},ae=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,r,i,a){this.type=1,this._$AH=w,this._$AN=void 0,this.element=t,this.name=e,this._$AM=i,this.options=a,r.length>2||r[0]!==""||r[1]!==""?(this._$AH=Array(r.length-1).fill(new String),this.strings=r):this._$AH=w}_$AI(t,e=this,r,i){let a=this.strings,n=!1;if(a===void 0)t=oe(this,t,e,0),n=!xe(t)||t!==this._$AH&&t!==ee,n&&(this._$AH=t);else{let d=t,h,v;for(t=a[0],h=0;h<a.length-1;h++)v=oe(this,d[r+h],e,h),v===ee&&(v=this._$AH[h]),n||=!xe(v)||v!==this._$AH[h],v===w?t=w:t!==w&&(t+=(v??"")+a[h+1]),this._$AH[h]=v}n&&!i&&this.j(t)}j(t){t===w?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}},Xe=class extends ae{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===w?void 0:t}},Ge=class extends ae{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==w)}},Ke=class extends ae{constructor(t,e,r,i,a){super(t,e,r,i,a),this.type=5}_$AI(t,e=this){if((t=oe(this,t,e,0)??w)===ee)return;let r=this._$AH,i=t===w&&r!==w||t.capture!==r.capture||t.once!==r.once||t.passive!==r.passive,a=t!==w&&(r===w||i);i&&this.element.removeEventListener(this.name,this,r),a&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}},Fe=class{constructor(t,e,r){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=r}get _$AU(){return this._$AM._$AU}_$AI(t){oe(this,t)}};var or=Je.litHtmlPolyfillSupport;or?.(_e,we),(Je.litHtmlVersions??=[]).push("3.3.3");var At=(s,t,e)=>{let r=e?.renderBefore??t,i=r._$litPart$;if(i===void 0){let a=e?.renderBefore??null;r._$litPart$=i=new we(t.insertBefore(be(),a),a,void 0,e??{})}return i._$AI(s),i};var De=globalThis,p=class extends j{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){let t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){let e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=At(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return ee}};p._$litElement$=!0,p.finalized=!0,De.litElementHydrateSupport?.({LitElement:p});var ar=De.litElementPolyfillSupport;ar?.({LitElement:p});(De.litElementVersions??=[]).push("4.2.2");var u=s=>(t,e)=>{e!==void 0?e.addInitializer(()=>{customElements.define(s,t)}):customElements.define(s,t)};var nr={attribute:!0,type:String,converter:ke,reflect:!1,hasChanged:Pe},lr=(s=nr,t,e)=>{let{kind:r,metadata:i}=e,a=globalThis.litPropertyMetadata.get(i);if(a===void 0&&globalThis.litPropertyMetadata.set(i,a=new Map),r==="setter"&&((s=Object.create(s)).wrapped=!0),a.set(e.name,s),r==="accessor"){let{name:n}=e;return{set(d){let h=t.get.call(this);t.set.call(this,d),this.requestUpdate(n,h,s,!0,d)},init(d){return d!==void 0&&this.C(n,void 0,s,d),d}}}if(r==="setter"){let{name:n}=e;return function(d){let h=this[n];t.call(this,d),this.requestUpdate(n,h,s,!0,d)}}throw Error("Unsupported decorator location: "+r)};function l(s){return(t,e)=>typeof e=="object"?lr(s,t,e):((r,i,a)=>{let n=i.hasOwnProperty(a);return i.constructor.createProperty(a,r),n?Object.getOwnPropertyDescriptor(i,a):void 0})(s,t,e)}function N(s){return l({...s,state:!0,attribute:!1})}var z=class extends p{constructor(){super(...arguments);this.current=0;this.step=0;this.blank=null;this.overview=!1;this.transition=null;this.autoplay=0;this.loop=!1;this.swipe=!1;this.slides=[];this.chapters=[];this._overviewTeardown=null;this._transitionLoaded=!1;this._autoplayTimer=null;this._autoplayPaused=!1;this._swipeStartX=0;this._swipeStartY=0;this._swipePointerId=null;this._onHoverEnter=()=>{this._autoplayPaused=!0,this._stopAutoplay()};this._onHoverLeave=()=>{this._autoplayPaused=!1,this.autoplay>0&&this._startAutoplay()};this._onPointerDown=e=>{!this.swipe||e.pointerType==="mouse"&&e.button!==0||e.target?.closest("a, button, input, textarea, [contenteditable]")||(this._swipePointerId=e.pointerId,this._swipeStartX=e.clientX,this._swipeStartY=e.clientY)};this._onPointerUp=e=>{if(this._swipePointerId===null||e.pointerId!==this._swipePointerId)return;let r=e.clientX-this._swipeStartX,i=e.clientY-this._swipeStartY;this._swipePointerId=null,!(Math.abs(r)<60||Math.abs(r)<Math.abs(i)*2)&&(this._stopAutoplay(),r<0?this._advance():this._back(),this.autoplay>0&&!this._autoplayPaused&&this._startAutoplay())};this._onHash=()=>{this._readHash(!1)};this._onKey=e=>{if(!(e.target&&e.target.matches?.("input,textarea,[contenteditable]"))){if(this.autoplay>0&&!this._autoplayPaused&&this._startAutoplay(),this.overview){(e.key==="Escape"||e.key==="o"||e.key==="O"||e.key==="Enter")&&(e.preventDefault(),this.overview=!1);return}if(this.blank){e.preventDefault(),this.blank=null;return}if(e.key==="."||e.key==="b"||e.key==="B"){e.preventDefault(),this.blank="black";return}if(e.key===","||e.key==="w"||e.key==="W"){e.preventDefault(),this.blank="white";return}if(e.key==="?"||e.key==="h"||e.key==="H"){this._toggleHelp();return}if(e.key==="Escape"){this._closeHelp();return}if(e.key==="o"||e.key==="O"){e.preventDefault(),this.overview=!0;return}if(e.key==="p"||e.key==="P"){e.preventDefault(),this._togglePresenter();return}if(e.key==="Home"){this._goTo(0);return}if(e.key==="End"){this._goTo(this.slides.length-1);return}if(e.key===" "||e.key==="PageDown"){e.preventDefault(),this._advance();return}if(e.key==="PageUp"){e.preventDefault(),this._back();return}if(this._has2DNav()){let{c:r,i}=this._coords(this.current);if(e.key==="ArrowRight"){e.preventDefault(),r+1<this.chapters.length?this._goToCoords(r+1,0):this._advance();return}if(e.key==="ArrowLeft"){e.preventDefault(),r-1>=0?this._goToCoords(r-1,0):this._back();return}if(e.key==="ArrowDown"){e.preventDefault();let a=this.chapters[r];a&&i+1<a.slides.length?this._goToCoords(r,i+1):this._advance();return}if(e.key==="ArrowUp"){e.preventDefault(),i-1>=0?this._goToCoords(r,i-1):this._back();return}}else{if(e.key==="ArrowRight"||e.key==="ArrowDown"){e.preventDefault(),this._advance();return}if(e.key==="ArrowLeft"||e.key==="ArrowUp"){e.preventDefault(),this._back();return}}}}}firstUpdated(){this.slides=Array.from(this.querySelectorAll(":scope > *")).filter(e=>e.tagName?.toLowerCase().startsWith("deck-")&&e.tagName?.toLowerCase()!=="deck-root"),this._buildChapters(),this._readHash(!0),this._applyActive(),this._applyStep(),this._updateUI(),this.requestUpdate(),window.addEventListener("keydown",this._onKey),window.addEventListener("hashchange",this._onHash),this.autoplay>0&&this._startAutoplay(),this.swipe?(this.addEventListener("pointerdown",this._onPointerDown),this.addEventListener("pointerup",this._onPointerUp),this.addEventListener("pointercancel",this._onPointerUp),this.addEventListener("mouseenter",this._onHoverEnter),this.addEventListener("mouseleave",this._onHoverLeave)):this.autoplay>0&&(this.addEventListener("mouseenter",this._onHoverEnter),this.addEventListener("mouseleave",this._onHoverLeave))}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener("keydown",this._onKey),window.removeEventListener("hashchange",this._onHash),this._stopAutoplay(),this.removeEventListener("pointerdown",this._onPointerDown),this.removeEventListener("pointerup",this._onPointerUp),this.removeEventListener("pointercancel",this._onPointerUp),this.removeEventListener("mouseenter",this._onHoverEnter),this.removeEventListener("mouseleave",this._onHoverLeave)}_startAutoplay(){this._stopAutoplay(),!(this.autoplay<=0||this._autoplayPaused)&&(this._autoplayTimer=window.setInterval(()=>this._autoTick(),this.autoplay))}_stopAutoplay(){this._autoplayTimer!==null&&(window.clearInterval(this._autoplayTimer),this._autoplayTimer=null)}_autoTick(){if(this.overview)return;this.current>=this.slides.length-1&&this.step>=this._maxSteps()&&this.loop?this._goTo(0):this._advance()}_buildChapters(){this.chapters=[];let e=null;this.slides.forEach((r,i)=>{r.tagName?.toLowerCase()==="deck-section"||!e?(e={startIdx:i,slides:[r]},this.chapters.push(e)):e.slides.push(r)})}_has2DNav(){return this.chapters.some(e=>e.slides.length>1)&&this.chapters.length>1}_coords(e){for(let r=0;r<this.chapters.length;r++){let i=this.chapters[r],a=e-i.startIdx;if(a>=0&&a<i.slides.length)return{c:r,i:a}}return{c:0,i:0}}_flatFromCoords(e,r){let i=this.chapters[e];return i?i.startIdx+Math.max(0,Math.min(i.slides.length-1,r)):0}_readHash(e){let r=location.hash,i=r.match(/^#(\d+)\.(\d+)(?:s(\d+))?$/),a=r.match(/^#(\d+)(?:\.(\d+))?$/),n=this.current,d=this.step;if(this._has2DNav()&&i){let h=parseInt(i[1],10)-1,v=parseInt(i[2],10)-1;n=this._flatFromCoords(Math.max(0,h),Math.max(0,v)),d=i[3]?parseInt(i[3],10):0}else if(a)n=parseInt(a[1],10)-1,d=a[2]?parseInt(a[2],10):0;else return;n===this.current&&d===this.step&&!e||(this.current=Math.max(0,Math.min(this.slides.length-1,n)),this.step=Math.max(0,d),e||(this._applyActive(),this._applyStep(),this._updateUI()))}_writeHash(){let e=`#${this.current+1}`+(this.step>0?`.${this.step}`:"");location.hash!==e&&history.replaceState(null,"",e)}async _toggleHelp(){(await Promise.resolve().then(()=>(Oe(),et))).toggleHelp(this)}async _togglePresenter(){(await Promise.resolve().then(()=>(tt(),Ct))).installPresenter(this)}async _closeHelp(){(await Promise.resolve().then(()=>(Oe(),et))).closeHelp(this)}async _renderOverviewIfActive(){if(!this.overview){this._overviewTeardown?.(),this._overviewTeardown=null;return}let{mountOverview:e}=await Promise.resolve().then(()=>(rt(),Ot));this._overviewTeardown=e(this,{slides:this.slides,chapters:this.chapters,currentIdx:this.current,onPick:r=>{this.overview=!1,this._goTo(r)}})}_maxSteps(){let e=this.slides[this.current];if(!e)return 0;let r=parseInt(e.getAttribute("steps")||e.dataset?.steps||"0",10);if(r>0)return r;let i=e.querySelector("deck-code[step-groups]");if(i)try{return JSON.parse(i.getAttribute("step-groups")).length}catch{}return 0}_advance(){let e=this._maxSteps();this.step<e?(this.step++,this._applyStep(),this._updateUI(),this._writeHash()):this.current<this.slides.length-1?this._goTo(this.current+1):this.loop&&this._goTo(0)}_back(){this.step>0?(this.step--,this._applyStep(),this._updateUI(),this._writeHash()):this.current>0?(this._goTo(this.current-1),this.step=this._maxSteps(),this._applyStep(),this._updateUI(),this._writeHash()):this.loop&&(this._goTo(this.slides.length-1),this.step=this._maxSteps(),this._applyStep(),this._updateUI(),this._writeHash())}_goTo(e){this.current=Math.max(0,Math.min(this.slides.length-1,e)),this.step=0,this._applyActive(),this._applyStep(),this._updateUI(),this._writeHash()}_goToCoords(e,r){let i=Math.max(0,Math.min(this.chapters.length-1,e)),a=this.chapters[i];if(!a)return;let n=Math.max(0,Math.min(a.slides.length-1,r));this._goTo(this._flatFromCoords(i,n))}_applyActive(){let e=this.slides.find(i=>i.hasAttribute("active"))??null,r=this.slides[this.current]??null;this.slides.forEach((i,a)=>{let n=a===this.current;i.toggleAttribute("active",n),n&&i.querySelectorAll("deck-mermaid").forEach(d=>d.render?.())}),this.transition&&!this._transitionLoaded&&(this._transitionLoaded=!0,Promise.resolve().then(()=>(it(),Rt)).then(i=>i.installTransitions(this))),e!==r&&this.dispatchEvent(new CustomEvent("slide-change",{detail:{current:r,previous:e},bubbles:!1}))}_applyStep(){let e=this.slides[this.current];e&&(e.applyStep?.(this.step),e.querySelectorAll("*").forEach(r=>r.applyStep?.(this.step)),e.querySelectorAll("[data-step-block]").forEach(r=>{let i=parseInt(r.dataset.stepBlock,10);r.style.transition="opacity 0.25s ease",r.style.opacity=this.step===0||i<=this.step?"1":"0.15"}))}_updateUI(){let e=this.slides.length,r=this.current+1,i=this.renderRoot.querySelector("#progress"),a=this.renderRoot.querySelector("#counter"),n=this.renderRoot.querySelector("#step-dots");i&&(i.style.width=r/e*100+"%"),a&&(a.textContent=`${r} / ${e}`);let d=this._maxSteps();n&&(n.innerHTML=d===0?"":Array.from({length:d},(h,v)=>`<div class="dot${v<this.step?" active":""}"></div>`).join(""))}updated(){this._updateUI(),this._renderOverviewIfActive()}render(){return c`<div id="progress"></div> <div id="counter"></div> <div id="step-dots"></div> <div id="kb-hint"> <kbd>←</kbd><kbd>→</kbd> ${this._has2DNav()?c`<kbd>↑</kbd><kbd>↓</kbd>`:""}
        <span>·</span>
        <kbd>O</kbd>
        <span>·</span>
        <kbd>P</kbd>
        <span>·</span>
        <kbd>?</kbd>
      </div>
      <slot></slot>
      ${this.blank?c`<div id="blank" data-tone="${this.blank}" @click=${()=>{this.blank=null}}></div>`:""}
    `}};z.styles=m`:host{display:block;width:100vw;height:100vh;position:relative;background:var(--deck-root-bg,var(--rik-surface-page))}#progress{position:fixed;bottom:0;left:0;height:var(--deck-root-progress-height,3px);background:var(--deck-root-progress-color,linear-gradient(90deg,var(--rik-accent),var(--rik-accent--soft)));transition:width 0.25s ease;z-index:100}#counter{position:fixed;bottom:1rem;right:1.5rem;font-size:var(--rik-font-size-xs);color:var(--deck-root-counter-color,var(--rik-text-default--faint));font-family:var(--rik-font-mono);z-index:100}#step-dots{position:fixed;bottom:1rem;left:50%;transform:translateX(-50%);display:flex;gap:6px;z-index:100}.dot{width:6px;height:6px;border-radius:50%;background:var(--deck-root-dot-bg,#d4d4d0);transition:background 0.2s}.dot.active{background:var(--deck-root-dot-active-bg,var(--rik-accent))}#kb-hint{position:fixed;bottom:1rem;left:1.5rem;display:inline-flex;align-items:center;gap:6px;font:600 0.62rem/1 var(--rik-font-mono);color:var(--deck-root-kb-hint-color,var(--rik-text-default--faint));z-index:100;opacity:0.5;transition:opacity 0.2s ease;cursor:help}#kb-hint:hover{opacity:1}#kb-hint kbd{background:var(--rik-surface-raised);border:1px solid var(--rik-border-default);border-bottom:2px solid var(--rik-border-default);border-radius:4px;padding:2px 6px;color:var(--rik-text-default);font:inherit;min-width:16px;text-align:center}#kb-hint .sep{opacity:0.4}#blank{position:fixed;inset:0;z-index:9999;cursor:pointer}#blank[data-tone="black"]{background:#000}#blank[data-tone="white"]{background:#fff}`,o([N()],z.prototype,"current",2),o([N()],z.prototype,"step",2),o([N()],z.prototype,"blank",2),o([l({type:Boolean,reflect:!0})],z.prototype,"overview",2),o([l({type:String,reflect:!0})],z.prototype,"transition",2),o([l({type:Number,reflect:!0})],z.prototype,"autoplay",2),o([l({type:Boolean,reflect:!0})],z.prototype,"loop",2),o([l({type:Boolean,reflect:!0})],z.prototype,"swipe",2),z=o([u("deck-root")],z);it();Oe();rt();tt();var Ee=class extends p{get notes(){return(this.textContent??"").trim()}render(){return c`<slot></slot>`}};Ee.styles=m`:host{display:none}`,Ee=o([u("deck-notes")],Ee);var st=m`:host{display:none;position:absolute;inset:0;padding:var(--rik-slide-padding-y) var(--rik-slide-padding-x);flex-direction:column;overflow:hidden;background:var(--rik-surface-page);font-family:var(--rik-font-sans);color:var(--rik-text-default)}:host([active]){display:flex}`,Er=m`h1{font-size:var(--rik-font-size-h1);font-weight:700;color:var(--rik-text-default);letter-spacing:-0.022em;line-height:1.15;margin-bottom:var(--rik-space-4);padding-bottom:var(--rik-space-2);border-bottom:3px solid var(--rik-accent);display:inline-block;align-self:flex-start;flex:0 0 auto}h1 .accent{color:var(--rik-accent)}::slotted(p),p{font-size:var(--rik-font-size-body);line-height:1.65;color:var(--rik-text-default--muted);margin:0}::slotted(strong),strong{color:var(--rik-text-default);font-weight:700}::slotted(code),code{font-family:var(--rik-font-mono);font-size:var(--rik-font-size-mono-sm);background:rgba(0,0,0,0.06);padding:2px 6px;border-radius:var(--rik-radius-sm);color:var(--rik-text-default)}`,$r=m`.lbl{display:inline-block;padding:var(--deck-eyebrow-padding-y,4px) var(--deck-eyebrow-padding-x,12px);background:var(--deck-eyebrow-bg,var(--rik-accent));color:var(--deck-eyebrow-color,var(--rik-accent__on,var(--rik-surface-inverse)));border-radius:var(--deck-eyebrow-radius,var(--rik-radius-pill));font-size:var(--rik-font-size-xs);font-weight:700;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:var(--rik-space-1);align-self:flex-start}.lead{font-size:var(--rik-font-size-lead);color:var(--rik-text-default--faint);line-height:1.5;margin-bottom:var(--rik-space-4);max-width:75ch;flex:0 0 auto}.kicker{font-size:var(--rik-font-size-xs);font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:var(--rik-text-default--faint);margin-bottom:var(--rik-space-3);display:block}.kicker.on-dark{color:rgba(255,255,255,0.35)}.caption{font-size:var(--rik-font-size-sm);color:var(--rik-text-default--faint);line-height:1.55}.caption.on-dark{color:rgba(255,255,255,0.5)}.col-label{font-size:var(--rik-font-size-xs);font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--rik-text-default--faint);margin-bottom:var(--rik-space-2)}`,C=[st,Er,$r];var E=class extends p{render(){let t=(this.brand??"").split("\xB7").map(n=>n.trim()).filter(Boolean),e=t[0]??"",r=t.slice(1).join(" \xB7 "),i=[this.speaker&&{l:this.speakerLabel??"Pr\xE9sent\xE9 par",v:this.speaker},this.company&&{l:this.companyLabel??"Entreprise",v:this.company},this.duration&&{l:this.durationLabel??"Dur\xE9e",v:this.duration},this.audience&&{l:this.audienceLabel??"Audience",v:this.audience},this.runtime&&{l:this.runtimeLabel??"Runtime",v:this.runtime}].filter(n=>!!n),a=!!this.brandSrc;return c`<div class="brand" part="brand"> ${a?c`<span class="brand-tile"><img src="${this.brandSrc}" alt="${e}"></span>`:""}
        ${e?c`<span class="brand-name">${e}</span>`:""}
        ${r?c`<span class="brand-context">${r}</span>`:""}
      </div>
      <slot></slot>
      ${i.length?c`<div class="meta" part="meta"> ${i.map(n=>c`
            <div class="meta-item"><strong>${n.l}</strong><span>${n.v}</span></div>
          `)}
        </div>`:""}
    `}};E.styles=[...C,m`:host{background:var(--deck-cover-bg,var(--rik-surface-inverse));justify-content:center;color:var(--deck-cover-text,var(--rik-text-inverse))}.brand{display:inline-flex;align-items:center;gap:var(--rik-space-3);margin-bottom:var(--rik-space-5);align-self:flex-start}.brand-tile{width:64px;height:64px;display:inline-flex;align-items:center;justify-content:center}.brand-tile img{width:100%;height:100%;display:block}.brand-name{font-family:var(--rik-font-display,inherit);font-size:var(--rik-font-size-xs);font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:var(--deck-cover-soft,var(--rik-text-inverse--muted))}.brand-context{font-size:var(--rik-font-size-xs);font-weight:700;color:var(--deck-cover-muted,var(--rik-text-inverse--faint));letter-spacing:0.2em;text-transform:uppercase;padding-left:var(--rik-space-3);border-left:1px solid var(--deck-cover-border,var(--rik-border-inverse))}::slotted(h1){font-size:clamp(3.6rem,9vw,8.5rem);font-weight:900;color:var(--deck-cover-text,var(--rik-text-inverse));line-height:1.02;letter-spacing:-0.035em;margin-bottom:var(--rik-space-4);border:none;padding:0}::slotted(.sub){font-size:var(--rik-font-size-h2);color:var(--deck-cover-muted,var(--rik-text-inverse--faint));margin-bottom:var(--rik-space-6);max-width:60ch;line-height:1.45;display:block}.meta{display:flex;gap:var(--rik-space-6);border-top:1px solid var(--deck-cover-border,var(--rik-border-inverse));padding-top:var(--rik-space-4)}.meta-item strong{display:block;font-size:var(--rik-font-size-xs);letter-spacing:0.12em;text-transform:uppercase;color:var(--deck-cover-faint,var(--rik-text-inverse--ghost));margin-bottom:6px;font-weight:700}.meta-item span{color:var(--deck-cover-text,var(--rik-text-inverse));font-size:var(--rik-font-size-body);font-weight:600}`],o([l({type:String})],E.prototype,"brand",2),o([l({type:String,attribute:"brand-src"})],E.prototype,"brandSrc",2),o([l({type:String})],E.prototype,"speaker",2),o([l({type:String})],E.prototype,"company",2),o([l({type:String})],E.prototype,"duration",2),o([l({type:String})],E.prototype,"audience",2),o([l({type:String})],E.prototype,"runtime",2),o([l({type:String,attribute:"speaker-label"})],E.prototype,"speakerLabel",2),o([l({type:String,attribute:"company-label"})],E.prototype,"companyLabel",2),o([l({type:String,attribute:"duration-label"})],E.prototype,"durationLabel",2),o([l({type:String,attribute:"audience-label"})],E.prototype,"audienceLabel",2),o([l({type:String,attribute:"runtime-label"})],E.prototype,"runtimeLabel",2),E=o([u("deck-cover")],E);var le=class extends p{render(){return c`${this.num?c`<div class="sec-num" part="num">${this.num}</div>`:""}
      <slot></slot>
    `}};le.styles=[...C,m`:host{background:var(--deck-section-bg,var(--rik-surface-inverse));color:var(--rik-text-inverse);justify-content:center;align-items:center;text-align:center}.sec-num{font-size:var(--rik-font-size-xs);font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:var(--deck-section-num-color,var(--rik-text-inverse--ghost));margin-bottom:var(--rik-space-3);display:inline-flex;align-items:center;gap:0.8rem;font-family:var(--rik-font-mono)}.sec-num::before,.sec-num::after{content:'';width:32px;height:1px;background:var(--deck-section-rule-color,var(--rik-border-inverse))}::slotted(h1){font-size:var(--rik-font-size-section);font-weight:900;color:var(--deck-section-title-color,var(--rik-accent));line-height:1.02;letter-spacing:-0.03em;max-width:18ch;border:none;padding:0;margin:0;text-align:center;align-self:center}::slotted(h1 em){color:var(--deck-section-em-color,var(--rik-text-inverse--muted));font-style:normal;font-weight:700}`],o([l({type:String})],le.prototype,"num",2),le=o([u("deck-section")],le);var de=class extends p{render(){return c`${this.eyebrow?c`<span class="lbl">${this.eyebrow}</span>`:""}
      <slot name="title"></slot>
      <slot name="lead"></slot>
      <div class="body" part="body"><slot></slot></div>
    `}};de.styles=[...C,m`:host{justify-content:flex-start}.body{flex:1;min-height:0;display:flex;flex-direction:column;justify-content:flex-start;gap:var(--rik-space-3);overflow:hidden}::slotted(deck-code:not([nested])),::slotted(deck-mermaid),::slotted(table),::slotted(pre),::slotted(svg),::slotted(.hero-main){max-height:100%;flex:0 1 auto}`],o([l({type:String})],de.prototype,"eyebrow",2),de=o([u("deck-feature")],de);var B=class extends p{_resolveSp(t){let e=parseInt(t,10);return!Number.isNaN(e)&&e>=1&&e<=6?`var(--rik-space-${e})`:t}updated(){this.gap&&this.style.setProperty("--_gap",this._resolveSp(this.gap)),this.colGap&&this.style.setProperty("--_col-gap",this._resolveSp(this.colGap))}render(){let t=this.querySelector('[slot="a"]'),e=this.cols==="3"||!!t;return c`${this.eyebrow?c`<span class="lbl">${this.eyebrow}</span>`:""}
      <slot name="title"></slot>
      <slot name="lead"></slot>
      <div class="body" part="body">
        ${e?c`<div class="col" part="col"><slot name="a"></slot></div> <div class="col" part="col"><slot name="b"></slot></div> <div class="col" part="col"><slot name="c"></slot></div>`:c`<div class="col" part="col"><slot name="left"></slot></div> <div class="col" part="col"><slot name="right"></slot></div>`}
      </div>
    `}};B.styles=[...C,m`:host{justify-content:flex-start}.body{flex:1;min-height:0;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:minmax(0,1fr);gap:var(--_gap,var(--deck-split-gap,var(--rik-space-5)))}:host([cols="1-2"]) .body{grid-template-columns:1fr 2fr}:host([cols="2-1"]) .body{grid-template-columns:2fr 1fr}:host([cols="3"]) .body{grid-template-columns:1fr 1fr 1fr;gap:var(--_gap,var(--deck-split-gap,var(--rik-space-4)))}.col{display:flex;flex-direction:column;min-height:0;min-width:0;gap:var(--_col-gap,var(--deck-split-col-gap,var(--rik-space-3)));overflow:hidden}.col.center{justify-content:center}`],o([l({type:String})],B.prototype,"eyebrow",2),o([l({type:String})],B.prototype,"cols",2),o([l({type:String})],B.prototype,"gap",2),o([l({type:String,attribute:"col-gap"})],B.prototype,"colGap",2),B=o([u("deck-split")],B);var ce=class extends p{render(){return c`${this.eyebrow?c`<span class="lbl">${this.eyebrow}</span>`:""}
      <slot name="title"></slot>
      <slot name="lead"></slot>
      <div class="hero" part="hero"><slot></slot></div>
      <div class="detail" part="detail">
        <div class="col"><slot name="left"></slot></div>
        <div class="col"><slot name="right"></slot></div>
      </div>
    `}};ce.styles=[...C,m`:host{justify-content:flex-start}.hero{flex:var(--deck-feature-cards-hero-flex,1 1 50%);min-height:0;display:flex;flex-direction:column;overflow:hidden}::slotted(deck-code),::slotted(deck-mermaid),::slotted(pre),::slotted(table),::slotted(svg){max-height:100%;flex:1 1 auto}.detail{flex:var(--deck-feature-cards-detail-flex,0 1 40%);min-height:0;margin-top:var(--deck-feature-cards-gap,var(--rik-space-3));display:grid;grid-template-columns:1fr 1fr;gap:var(--deck-feature-cards-col-gap,var(--rik-space-4));overflow:hidden}.col{display:flex;flex-direction:column;gap:var(--rik-space-2);min-width:0;min-height:0;overflow:hidden}`],o([l({type:String})],ce.prototype,"eyebrow",2),ce=o([u("deck-feature-cards")],ce);var O=class extends p{updated(){this.position&&this.style.setProperty("--_pos",this.position),typeof this.darken=="number"&&this.style.setProperty("--_dim",String(this.darken));let t=this.align==="top"?"flex-start":this.align==="bottom"?"flex-end":"center";if(this.style.setProperty("--_align",t),this.textAlign){this.style.setProperty("--_text-align",this.textAlign);let e=this.textAlign==="center"?"center":this.textAlign==="right"?"flex-end":"flex-start";this.style.setProperty("--_text-align-items",e)}}render(){let t=this.src?`background-image: url("${this.src.replace(/"/g,"%22")}")`:"";return c`<div class="bg" part="bg" style=${t}></div> <div class="overlay" part="overlay"></div> <div class="content" part="content"><slot></slot></div>`}};O.styles=[st,m`:host{padding:0;color:var(--deck-photo-text-color,var(--rik-text-inverse));overflow:hidden}.bg{position:absolute;inset:0;background-size:cover;background-position:var(--_pos,center);background-repeat:no-repeat}.overlay{position:absolute;inset:0;background:var(--deck-photo-overlay-color,rgba(0,0,0,var(--_dim,0.35)))}.content{position:relative;z-index:1;display:flex;flex-direction:column;gap:var(--rik-space-3);padding:var(--deck-photo-padding-y,var(--rik-slide-padding-y)) var(--deck-photo-padding-x,var(--rik-slide-padding-x));width:100%;height:100%;max-width:100%;box-sizing:border-box;justify-content:var(--_align,center);text-align:var(--_text-align,left);align-items:var(--_text-align-items,flex-start)}.content > *{max-width:var(--deck-photo-content-max-width,36ch)}::slotted(h1){font-family:var(--rik-font-display,var(--rik-font-sans));font-size:clamp(2.5rem,6vw,5.5rem);font-weight:900;letter-spacing:-0.035em;line-height:1.02;color:var(--deck-photo-text-color,var(--rik-text-inverse));margin:0;text-shadow:0 2px 16px rgba(0,0,0,0.35)}::slotted(h2){font-family:var(--rik-font-display,var(--rik-font-sans));font-size:clamp(1.6rem,3vw,2.6rem);font-weight:800;letter-spacing:-0.025em;line-height:1.1;color:var(--deck-photo-text-color,var(--rik-text-inverse));margin:0;text-shadow:0 2px 12px rgba(0,0,0,0.35)}::slotted(p),::slotted(.sub){font-size:var(--rik-font-size-lead);color:var(--deck-photo-text-muted,var(--rik-text-inverse--muted));line-height:1.5;margin:0;text-shadow:0 1px 8px rgba(0,0,0,0.35)}::slotted(.kicker){font:700 var(--rik-font-size-xs)/1 var(--rik-font-mono);letter-spacing:0.18em;text-transform:uppercase;color:var(--deck-photo-text-muted,var(--rik-text-inverse--muted));margin:0}`],o([l({type:String})],O.prototype,"src",2),o([l({type:String})],O.prototype,"position",2),o([l({type:Number})],O.prototype,"darken",2),o([l({type:String})],O.prototype,"align",2),o([l({type:String,attribute:"text-align"})],O.prototype,"textAlign",2),O=o([u("deck-photo")],O);var pe=class extends p{render(){return c`<div class="body" part="body"> ${this.kicker?c`<span class="kicker on-dark">${this.kicker}</span>`:""}
        <slot></slot>
      </div>
    `}};pe.styles=[...C,m`:host{background:var(--deck-takeaway-bg,var(--rik-surface-inverse));color:var(--rik-text-inverse);justify-content:center;align-items:center;text-align:center}.body{display:flex;flex-direction:column;align-items:center;gap:var(--deck-takeaway-gap,var(--rik-space-4));max-width:75vw}::slotted(.display){font-family:var(--rik-font-display,var(--rik-font-sans));font-size:clamp(3rem,7vw,5.5rem);font-weight:900;color:var(--deck-takeaway-display-color,var(--rik-accent));letter-spacing:-0.03em;line-height:1.05;margin:0}::slotted(.display.danger){color:var(--rik-status-danger)}::slotted(.caption){font-size:var(--rik-font-size-lead);color:var(--deck-takeaway-caption-color,var(--rik-text-inverse--faint))}`],o([l({type:String})],pe.prototype,"kicker",2),pe=o([u("deck-takeaway")],pe);var jt={info:'<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',warn:'<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',danger:'<circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/>',ok:'<path d="M20 6 9 17l-5-5"/>'},he=class extends p{render(){let t=this.type??"info",e=jt[t]??jt.info;return c`<div class="icon-box"> <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" .innerHTML="${e}"></svg> </div> <div class="content"><slot></slot></div>`}};he.styles=m`:host{display:flex;gap:var(--rik-space-3);padding:var(--deck-callout-padding-y,var(--rik-space-3)) var(--deck-callout-padding-x,var(--rik-space-4));border-radius:var(--deck-callout-radius,var(--rik-radius-md));background:var(--deck-callout-bg,var(--rik-status-info__bg--mid));border:1px solid var(--deck-callout-border,var(--rik-status-info__border));box-shadow:var(--rik-elevation-2);align-items:center;color:var(--rik-text-default--muted);font-family:var(--rik-font-sans);font-size:var(--rik-font-size-body);line-height:1.55}:host([type="info"]){--deck-callout-bg:var(--rik-status-info__bg--mid);--deck-callout-border:var(--rik-status-info__border);--deck-callout-stroke:var(--rik-accent)}:host([type="warn"]){--deck-callout-bg:var(--rik-status-warn__bg);--deck-callout-border:var(--rik-status-warn__border);--deck-callout-stroke:var(--rik-status-warn)}:host([type="danger"]){--deck-callout-bg:var(--rik-status-danger__bg);--deck-callout-border:var(--rik-status-danger__border);--deck-callout-stroke:var(--rik-status-danger)}:host([type="ok"]){--deck-callout-bg:var(--rik-status-success__bg);--deck-callout-border:var(--rik-status-success__border);--deck-callout-stroke:var(--rik-status-success)}.icon-box{flex-shrink:0;width:var(--rik-icon-2xl);height:var(--rik-icon-2xl);display:inline-flex;align-items:center;justify-content:center;border-radius:50%;background:var(--rik-surface-tint)}.icon-box svg{width:var(--rik-icon-lg);height:var(--rik-icon-lg);stroke:var(--deck-callout-stroke,var(--rik-accent));stroke-width:2.2}.content{flex:1}::slotted(p){margin:0}::slotted(strong){color:var(--rik-text-default);font-weight:700}::slotted(code){font-family:var(--rik-font-mono);font-size:var(--rik-font-size-mono-sm);background:var(--rik-surface-tint);padding:2px 6px;border-radius:var(--rik-radius-sm);color:var(--rik-text-default)}`,o([l({type:String})],he.prototype,"type",2),he=o([u("deck-callout")],he);var G=class extends p{constructor(){super(...arguments);this.center=!1;this.compact=!1}render(){return c`<slot></slot>`}};G.styles=m`:host{display:flex;flex-direction:column;gap:var(--deck-card-gap,var(--rik-space-2));background:var(--deck-card-bg,var(--rik-surface-raised--strong));border:1px solid var(--deck-card-border,var(--rik-border-default));border-radius:var(--deck-card-radius,var(--rik-radius-lg));padding:var(--deck-card-padding-y,var(--rik-space-3)) var(--deck-card-padding-x,var(--rik-space-4));box-shadow:var(--deck-card-shadow,var(--rik-elevation-2));min-height:0;font-family:var(--rik-font-sans);color:var(--deck-card-text,var(--rik-text-default--muted))}:host([color="yellow"]){background:var(--deck-card-bg,var(--rik-status-info__bg));border:4px solid var(--deck-card-border,var(--rik-status-info__border))}:host([color="orange"]){background:var(--deck-card-bg,var(--rik-status-warn__bg));border:4px solid var(--deck-card-border,var(--rik-status-warn__border))}:host([color="green"]){background:var(--deck-card-bg,var(--rik-status-success__bg));border:4px solid var(--deck-card-border,var(--rik-status-success__border))}:host([color="red"]){background:var(--deck-card-bg,var(--rik-status-danger__bg));border:4px solid var(--deck-card-border,var(--rik-status-danger__border))}::slotted(h3){font-family:var(--rik-font-display,var(--rik-font-sans));font-size:var(--rik-font-size-h2);font-weight:700;color:var(--deck-card-title-color,var(--rik-text-default));letter-spacing:-0.01em;line-height:1.25;margin:0}::slotted(p){font-size:var(--rik-font-size-body);line-height:1.55;margin:0}::slotted(strong){color:var(--rik-text-default);font-weight:700}:host([center]){text-align:center;align-items:center}:host([compact]){padding:var(--rik-space-2) var(--rik-space-3)}`,o([l({type:String})],G.prototype,"color",2),o([l({type:Boolean})],G.prototype,"center",2),o([l({type:Boolean})],G.prototype,"compact",2),G=o([u("deck-card")],G);import{marked as Bt}from"https://cdn.jsdelivr.net/npm/marked@12/+esm";Bt.setOptions({gfm:!0,breaks:!1});var me=class extends p{constructor(){super(...arguments);this._html=""}connectedCallback(){super.connectedCallback(),this._parse()}_parse(){let e=this.textContent??"",r=e.split(`
`),i=r.filter(n=>n.trim().length>0).reduce((n,d)=>Math.min(n,d.match(/^ */)?.[0].length??0),1/0),a=i===1/0?e:r.map(n=>n.slice(i)).join(`
`);this._html=Bt.parse(a.trim()),this.textContent=""}render(){return c`<div class="content" .innerHTML="${this._html}"></div>`}};me.styles=m`:host{display:block;color:var(--rik-text-default--muted);font-family:var(--rik-font-sans)}h1,h2,h3,h4{color:var(--rik-text-default);font-weight:700;letter-spacing:-0.01em}h2{font-size:var(--rik-font-size-h2);margin-bottom:var(--rik-space-2)}h3{font-size:var(--rik-font-size-lead);margin-bottom:var(--rik-space-2);margin-top:var(--rik-space-3)}h4{font-size:var(--rik-font-size-body);margin-bottom:var(--rik-space-1);margin-top:var(--rik-space-3)}p{font-size:var(--rik-font-size-body);line-height:1.65;margin:0 0 var(--rik-space-3)}p:last-child{margin-bottom:0}strong{color:var(--rik-text-default);font-weight:700}em{font-style:italic}code{font-family:var(--rik-font-mono);font-size:var(--rik-font-size-mono-sm);background:var(--rik-surface-tint);padding:2px 6px;border-radius:var(--rik-radius-sm);color:var(--rik-text-default)}pre{background:var(--deck-md-pre-bg,var(--rik-code__bg));border:1px solid var(--deck-md-pre-border,var(--rik-code__border));border-radius:var(--rik-radius-md);padding:var(--rik-space-3) var(--rik-space-4);overflow:auto;font-family:var(--rik-font-mono);font-size:var(--rik-font-size-mono);line-height:1.75;color:var(--deck-md-pre-text,var(--rik-code__text));margin:0 0 var(--rik-space-3);box-shadow:var(--rik-elevation-2)}pre code{background:none;padding:0;color:inherit;border-radius:0}ul,ol{padding-left:1.4rem;margin:0 0 var(--rik-space-3)}li{margin-bottom:var(--rik-space-1);font-size:var(--rik-font-size-body);line-height:1.55}li::marker{color:var(--rik-accent)}a{color:var(--rik-accent);text-decoration:underline;text-decoration-thickness:1px}blockquote{border-left:3px solid var(--rik-accent);padding:var(--rik-space-1) var(--rik-space-3);color:var(--rik-text-default--faint);font-style:italic;margin:0 0 var(--rik-space-3)}hr{border:none;border-top:1px solid var(--rik-border-default);margin:var(--rik-space-4) 0}.content{display:contents}`,o([N()],me.prototype,"_html",2),me=o([u("deck-md")],me);var qt=!1;async function Sr(){qt||(window.mermaid||await new Promise((s,t)=>{let e=document.createElement("script");e.src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js",e.onload=()=>s(),e.onerror=()=>t(new Error("mermaid failed to load")),document.head.appendChild(e)}),window.mermaid.initialize({startOnLoad:!1,theme:"dark",themeVariables:{background:"#0f0f10",mainBkg:"#2a2a2a",nodeBorder:"#555",lineColor:"#777",textColor:"#e5e5e5",fontSize:"13px",edgeLabelBackground:"#111"},flowchart:{curve:"basis",htmlLabels:!0,padding:12},securityLevel:"loose"}),qt=!0)}var Ar=0,te=class extends p{constructor(){super(...arguments);this.rendered=!1;this._svg="";this._source=""}connectedCallback(){super.connectedCallback(),this._source=(this.textContent??"").trim();let e=this._source.split(`
`),r=e.filter(i=>i.trim()).reduce((i,a)=>Math.min(i,a.match(/^ */)?.[0].length??0),1/0);r<1/0&&(this._source=e.map(i=>i.slice(r)).join(`
`)),this._render()}async _render(){if(!this._source)return;await Sr();let e=`mmd-${++Ar}`;try{let{svg:r}=await window.mermaid.render(e,this._source);this._svg=r,this.rendered=!0}catch(r){console.error("Mermaid render error",r);let i=r instanceof Error?r.message:String(r);this._svg=`<pre style="color:#f87171">${i}</pre>`}}render(){return c`<div class="canvas" .innerHTML="${this._svg}"></div>`}};te.styles=m`:host{display:flex;align-items:center;justify-content:center;background:var(--deck-mermaid-bg,var(--rik-code__bg));border:1px solid var(--deck-mermaid-border,var(--rik-code__border));border-radius:var(--deck-mermaid-radius,var(--rik-radius-md));padding:var(--deck-mermaid-padding,var(--rik-space-4));box-shadow:var(--rik-elevation-2);overflow:hidden;min-width:0}:host([compact]){padding:var(--rik-space-2)}.canvas{width:100%;max-width:100%;text-align:center;overflow:hidden}.canvas svg{width:100% !important;height:auto !important;max-width:100% !important;max-height:60vh}:host([compact]) .canvas{max-width:60%}:host([compact]) .canvas svg{max-height:22vh}`,o([l({type:Boolean,reflect:!0})],te.prototype,"rendered",2),o([N()],te.prototype,"_svg",2),te=o([u("deck-mermaid")],te);var Tr={yellow:"var(--rik-accent)",orange:"var(--rik-status-warn)",green:"var(--rik-status-success)",red:"var(--rik-status-danger)",purple:"var(--rik-decor-orchid)",lime:"var(--rik-decor-lime)",cyan:"var(--rik-decor-canary)"},re=class extends p{updated(){this.tone?this.style.setProperty("--_c",Tr[this.tone]??this.tone):this.style.removeProperty("--_c")}render(){return c`${this.num?c`<div class="num" part="num">${this.num}</div>`:""}
      <slot name="claim"></slot>
      <div class="body" part="body"><slot></slot></div>
    `}};re.styles=m`:host{display:flex;flex-direction:column;gap:var(--deck-stat-gap,var(--rik-space-2));padding:var(--deck-stat-padding-y,var(--rik-space-4)) var(--deck-stat-padding-x,var(--rik-space-3));border-left:var(--deck-stat-border-width,4px) solid var(--_c,var(--deck-stat-color,var(--rik-accent)));min-width:0;font-family:var(--rik-font-sans)}.num{font-family:var(--rik-font-display,var(--rik-font-sans));font-size:var(--deck-stat-num-size,clamp(3.5rem,7vw,6rem));font-weight:var(--deck-stat-num-weight,900);line-height:0.9;color:var(--_c,var(--deck-stat-color,var(--rik-accent)));letter-spacing:-0.04em}::slotted([slot="claim"]){font-family:var(--rik-font-display,var(--rik-font-sans));font-size:var(--rik-font-size-strong);font-weight:800;color:var(--deck-stat-claim-color,var(--rik-text-default));line-height:1.1;letter-spacing:-0.02em;margin:0}.body{font-size:var(--rik-font-size-body);color:var(--deck-stat-body-color,var(--rik-text-default--faint));line-height:1.45;margin-top:var(--rik-space-2)}::slotted(strong){color:var(--rik-text-default);font-weight:700}::slotted(code){font-family:var(--rik-font-mono);font-size:var(--rik-font-size-mono-sm);background:var(--rik-surface-tint);color:var(--rik-text-default);padding:2px 6px;border-radius:var(--rik-radius-sm)}`,o([l({type:String})],re.prototype,"num",2),o([l({type:String})],re.prototype,"tone",2),re=o([u("deck-stat")],re);var $e=class extends p{render(){return c`<slot></slot>`}};$e.styles=m`:host{display:flex;flex-direction:column;gap:var(--rik-space-2)}`,$e=o([u("deck-metric-list")],$e);var K=class extends p{constructor(){super(...arguments);this.mono=!1}render(){return c`<span class="label ${this.mono?"mono":""}"><slot></slot></span> <span class="value" data-severity="${this.severity??""}">${this.value}</span>`}};K.styles=m`:host{display:flex;justify-content:space-between;align-items:center;background:var(--deck-metric-bg,var(--rik-surface-raised--strong));border:1px solid var(--deck-metric-border,var(--rik-border-default));border-radius:var(--deck-metric-radius,var(--rik-radius-md));padding:var(--deck-metric-padding-y,var(--rik-space-2)) var(--deck-metric-padding-x,var(--rik-space-4));font-family:var(--rik-font-sans);font-size:var(--rik-font-size-body);color:var(--deck-metric-text,var(--rik-text-default--muted));box-shadow:var(--deck-metric-shadow,var(--rik-elevation-2))}.label{font-family:inherit}.label.mono{font-family:var(--rik-font-mono);font-size:var(--rik-font-size-sm);color:var(--deck-metric-label-color,var(--rik-text-default--faint))}.value{font-weight:700}.value[data-severity="bad"]{color:var(--deck-metric-value-bad,var(--rik-status-danger))}.value[data-severity="warn"]{color:var(--deck-metric-value-warn,var(--rik-status-warn))}.value[data-severity="ok"]{color:var(--deck-metric-value-ok,var(--rik-status-success))}.value[data-severity="info"]{color:var(--deck-metric-value-info,var(--rik-status-info__text))}`,o([l({type:String})],K.prototype,"value",2),o([l({type:String})],K.prototype,"severity",2),o([l({type:Boolean})],K.prototype,"mono",2),K=o([u("deck-metric")],K);var Se=class extends p{render(){return c`<slot></slot>`}};Se.styles=m`:host{display:flex;flex-direction:column;gap:var(--rik-space-2xs)}`,Se=o([u("deck-tier-list")],Se);var q=class extends p{constructor(){super(...arguments);this.hot=!1}render(){return c`<div class="head"> <span class="name">${this.name}</span> <span class="speed" data-severity="${this.severity??(this.hot?"hot":"")}">${this.speed}</span> </div> <div class="desc"><slot></slot></div>`}};q.styles=m`:host{display:flex;flex-direction:column;gap:var(--rik-space-hair);background:var(--deck-tier-bg,var(--rik-surface-raised--strong));border:1px solid var(--deck-tier-border,var(--rik-border-default));border-radius:var(--deck-tier-radius,var(--rik-radius-md));padding:var(--deck-tier-padding-y,var(--rik-space-2)) var(--deck-tier-padding-x,var(--rik-space-4));box-shadow:var(--deck-tier-shadow,var(--rik-elevation-2));font-family:var(--rik-font-sans)}:host([hot]){border-color:var(--deck-tier-hot-border,var(--rik-status-info__border));background:var(--deck-tier-hot-bg,var(--rik-status-info__bg))}.head{display:flex;justify-content:space-between;align-items:baseline}.name{font:700 var(--rik-font-size-body)/1 var(--rik-font-mono);color:var(--deck-tier-name-color,var(--rik-text-default))}:host([hot]) .name{color:var(--deck-tier-hot-color,var(--rik-accent))}.speed{font:700 var(--rik-font-size-body)/1 var(--rik-font-mono)}.speed[data-severity="muted"]{color:var(--deck-tier-speed-muted,var(--rik-text-default--faint))}.speed[data-severity="warn"]{color:var(--deck-tier-speed-warn,var(--rik-status-warn))}.speed[data-severity="ok"]{color:var(--deck-tier-speed-ok,var(--rik-status-success))}:host([hot]) .speed{color:var(--deck-tier-hot-color,var(--rik-accent))}.desc{font-size:var(--rik-font-size-sm);color:var(--deck-tier-desc-color,var(--rik-text-default--faint));line-height:1.4}`,o([l({type:String})],q.prototype,"name",2),o([l({type:String})],q.prototype,"speed",2),o([l({type:String})],q.prototype,"severity",2),o([l({type:Boolean,reflect:!0})],q.prototype,"hot",2),q=o([u("deck-tier")],q);var Ae=class extends p{render(){return c`<slot></slot>`}};Ae.styles=m`:host{display:block;text-align:center;color:var(--rik-text-default--faint);opacity:var(--rik-opacity-soft);font-size:var(--rik-font-size-xs);padding:2px 0}`,Ae=o([u("deck-tier-arrow")],Ae);var Te=class extends p{render(){return c`<slot></slot>`}};Te.styles=m`:host{display:flex;flex-direction:column;gap:var(--rik-space-2xs)}`,Te=o([u("deck-step-list")],Te);var ie=class extends p{render(){return c`<span class="step-num">${this.n}</span> <span class="label"><slot></slot></span> ${this.note?c`<span class="chip">${this.note}</span>`:""}
    `}};ie.styles=m`:host{display:flex;align-items:center;gap:var(--rik-space-3);background:var(--deck-step-bg,var(--rik-surface-raised--strong));border:1px solid var(--deck-step-border,var(--rik-border-default));border-radius:var(--deck-step-radius,var(--rik-radius-md));padding:var(--deck-step-padding-y,var(--rik-space-2xs)) var(--deck-step-padding-x,var(--rik-space-3));box-shadow:var(--deck-step-shadow,var(--rik-elevation-2));font-family:var(--rik-font-sans);font-size:var(--rik-font-size-body)}.step-num{flex:0 0 auto;width:var(--deck-step-num-size,var(--rik-icon-sm));height:var(--deck-step-num-size,var(--rik-icon-sm));display:inline-flex;align-items:center;justify-content:center;background:var(--deck-step-num-bg,var(--rik-accent));color:var(--deck-step-num-color,var(--rik-accent__on,var(--rik-surface-inverse)));border-radius:50%;font:700 var(--rik-font-size-xs)/1 var(--rik-font-sans)}.label{flex:1;font-family:var(--rik-font-mono);font-weight:600;color:var(--deck-step-label-color,var(--rik-text-default))}.chip{flex:0 0 auto;display:inline-block;padding:2px var(--rik-space-2);background:var(--deck-step-chip-bg,var(--rik-surface-tint));color:var(--deck-step-chip-color,var(--rik-text-default--faint));border-radius:var(--rik-radius-pill);font:600 var(--rik-font-size-sm)/1.4 var(--rik-font-sans)}`,o([l({type:String})],ie.prototype,"n",2),o([l({type:String})],ie.prototype,"note",2),ie=o([u("deck-step")],ie);var ve=class extends p{render(){return c`<slot></slot>`}};ve.styles=m`:host{display:inline-flex;align-items:center;justify-content:center;background:var(--deck-kbd-bg,var(--rik-surface-raised--strong));border:1px solid var(--deck-kbd-border,var(--rik-border-default));border-bottom:3px solid var(--rik-surface-tint--strong,rgba(0,0,0,0.10));border-radius:var(--deck-kbd-radius,5px);padding:var(--deck-kbd-padding-y,3px) var(--deck-kbd-padding-x,8px);font:700 0.92rem/1 var(--rik-font-mono);color:var(--deck-kbd-color,var(--rik-text-default));min-width:22px;text-align:center;box-shadow:0 1px 0 rgba(255,255,255,0.5) inset}:host([tone="accent"]){background:var(--deck-kbd-accent-bg,var(--rik-accent));color:var(--deck-kbd-color,var(--rik-accent__on,var(--rik-surface-inverse)));border-color:rgba(0,0,0,0.15)}:host([tone="ok"]){background:var(--deck-kbd-ok-bg,var(--rik-status-success));color:var(--deck-kbd-color,var(--rik-surface-inverse));border-color:rgba(0,0,0,0.15)}`,o([l({type:String})],ve.prototype,"tone",2),ve=o([u("deck-kbd")],ve);var Y=class extends p{render(){let t=(this.keys??"").trim().split(/\s+/).filter(Boolean);return c`<span class="keys" part="keys"> ${t.map(e=>c`<span class="k">${e}</span>`)}
      </span>
      <div class="body" part="body">
        ${this.label?c`<div class="label">${this.label}</div>`:""}
        ${this.note?c`<div class="note">${this.note}</div>`:c`<div class="note"><slot></slot></div>`}
      </div>
    `}};Y.styles=m`:host{display:flex;align-items:center;gap:var(--rik-space-3);padding:var(--rik-space-2) 0;font-family:var(--rik-font-sans)}.keys{display:inline-flex;gap:4px;flex-shrink:0}.keys deck-kbd,.keys .k{display:inline-flex;align-items:center;justify-content:center;background:var(--rik-surface-raised--strong);border:1px solid var(--rik-border-default);border-bottom:3px solid rgba(0,0,0,0.10);border-radius:5px;padding:3px 8px;font:700 0.92rem/1 var(--rik-font-mono);color:var(--rik-text-default);min-width:22px;text-align:center}.body{flex:1;min-width:0}.label{font:700 var(--rik-font-size-body)/1.2 var(--rik-font-sans);color:var(--rik-text-default)}.note{font:400 var(--rik-font-size-sm)/1.4 var(--rik-font-sans);color:var(--rik-text-default--faint);margin-top:2px}:host([tone="accent"]) .keys .k{background:var(--rik-accent);color:var(--rik-surface-inverse);border-color:rgba(0,0,0,0.15)}:host([tone="ok"]) .keys .k{background:var(--rik-status-success);color:var(--rik-surface-inverse);border-color:rgba(0,0,0,0.15)}`,o([l({type:String})],Y.prototype,"keys",2),o([l({type:String})],Y.prototype,"label",2),o([l({type:String})],Y.prototype,"note",2),o([l({type:String})],Y.prototype,"tone",2),Y=o([u("deck-shortcut")],Y);var se=class extends p{updated(){if(this.colGap){let t=parseInt(this.colGap,10),e=!Number.isNaN(t)&&t>=1&&t<=6?`var(--sp-${t})`:this.colGap;this.style.setProperty("--_col-gap",e)}}render(){return c`<slot></slot>`}};se.styles=m`:host{display:grid;grid-template-columns:1fr 1fr;gap:0 var(--_col-gap,var(--rik-space-5));font-family:var(--rik-font-sans)}:host([cols="1"]){grid-template-columns:1fr}::slotted(deck-shortcut){border-bottom:1px solid var(--rik-border-default)}`,o([l({type:String})],se.prototype,"cols",2),o([l({type:String,attribute:"col-gap"})],se.prototype,"colGap",2),se=o([u("deck-shortcut-list")],se);var Lr={start:"flex-start",center:"center",end:"flex-end",between:"space-between",around:"space-around"},zr={start:"flex-start",center:"center",end:"flex-end",stretch:"stretch"},W=class extends p{updated(){if(this.gap){let t=parseInt(this.gap,10);!Number.isNaN(t)&&t>=1&&t<=6?this.style.setProperty("--_gap",`var(--rik-space-${t})`):this.style.setProperty("--_gap",this.gap)}else this.style.removeProperty("--_gap");this.style.setProperty("--_dir",this.direction==="row"?"row":"column"),this.align&&this.style.setProperty("--_align",zr[this.align]??this.align),this.justify&&this.style.setProperty("--_justify",Lr[this.justify]??this.justify)}render(){return c`<slot></slot>`}};W.styles=m`:host{display:flex;flex-direction:var(--_dir,column);gap:var(--_gap,var(--deck-stack-gap,var(--rik-space-3)));align-items:var(--_align,stretch);justify-content:var(--_justify,flex-start);min-width:0;min-height:0}:host([fill]){flex:1 1 auto}`,o([l({type:String})],W.prototype,"gap",2),o([l({type:String})],W.prototype,"direction",2),o([l({type:String})],W.prototype,"align",2),o([l({type:String})],W.prototype,"justify",2),W=o([u("deck-stack")],W);var Yt={start:"start",center:"center",end:"end",stretch:"stretch"};function Wt(s){if(!s)return null;let t=parseInt(s,10);return!Number.isNaN(t)&&String(t)===s.trim()&&t>=1&&t<=12?`repeat(${t}, minmax(0, 1fr))`:s}function Mr(s){if(!s)return null;let t=parseInt(s,10);return!Number.isNaN(t)&&t>=1&&t<=6?`var(--rik-space-${t})`:s}var U=class extends p{updated(){let t=Wt(this.cols),e=Wt(this.rows),r=Mr(this.gap);t&&this.style.setProperty("--_cols",t),e&&this.style.setProperty("--_rows",e),r&&this.style.setProperty("--_gap",r),this.align&&this.style.setProperty("--_align",Yt[this.align]??this.align),this.justify&&this.style.setProperty("--_justify",Yt[this.justify]??this.justify)}render(){return c`<slot></slot>`}};U.styles=m`:host{display:grid;grid-template-columns:var(--_cols,1fr);grid-template-rows:var(--_rows,auto);gap:var(--_gap,var(--deck-grid-gap,var(--rik-space-3)));align-items:var(--_align,stretch);justify-items:var(--_justify,stretch);min-width:0;min-height:0}:host([fill]){flex:1 1 auto;height:100%}`,o([l({type:String})],U.prototype,"cols",2),o([l({type:String})],U.prototype,"rows",2),o([l({type:String})],U.prototype,"gap",2),o([l({type:String})],U.prototype,"align",2),o([l({type:String})],U.prototype,"justify",2),U=o([u("deck-grid")],U);var ue=class extends p{render(){return c`<slot></slot>`}};ue.styles=m`:host{display:inline-block;padding:var(--deck-badge-padding-y,var(--rik-space-1)) var(--deck-badge-padding-x,var(--rik-space-3));margin-bottom:var(--rik-space-2);font:700 var(--rik-font-size-xs)/1.2 var(--rik-font-sans);letter-spacing:0.1em;text-transform:uppercase;border-radius:var(--deck-badge-radius,var(--rik-radius-pill));background:var(--deck-badge-bg,var(--rik-surface-tint));color:var(--deck-badge-fg,var(--rik-text-default--faint));border:1px solid var(--deck-badge-border,var(--rik-border-default))}:host([type="bad"]){--deck-badge-bg:var(--rik-status-danger__bg);--deck-badge-fg:var(--rik-status-danger);--deck-badge-border:var(--rik-status-danger__border)}:host([type="ok"]){--deck-badge-bg:var(--rik-status-success__bg);--deck-badge-fg:var(--rik-status-success);--deck-badge-border:var(--rik-status-success__border)}:host([type="info"]){--deck-badge-bg:var(--rik-status-info__bg--strong);--deck-badge-fg:var(--rik-status-info__text);--deck-badge-border:var(--rik-status-info__border)}:host([type="warn"]){--deck-badge-bg:var(--rik-status-warn__bg);--deck-badge-fg:var(--rik-status-warn);--deck-badge-border:var(--rik-status-warn__border)}`,o([l({type:String})],ue.prototype,"type",2),ue=o([u("deck-badge")],ue);var ot=class extends p{static{this.styles=m`:host{display:block;font:700 var(--deck-kicker-font-size,var(--rik-font-size-xs))/1.2 var(--rik-font-sans);letter-spacing:var(--deck-kicker-tracking,0.14em);text-transform:uppercase;color:var(--deck-kicker-color,var(--rik-text-default--faint));margin-bottom:var(--deck-kicker-margin,var(--rik-space-2))}:host([on-dark]){color:var(--deck-kicker-on-dark-color,var(--rik-text-inverse--faint))}`}render(){return c`<slot></slot>`}};customElements.define("deck-kicker",ot);var Vt={warn:"var(--rik-status-warn)",danger:"var(--rik-status-danger)",ok:"var(--rik-status-success)",info:"var(--rik-accent)",muted:"var(--rik-text-default--faint)",accent:"var(--rik-accent)"},Xt={lead:"var(--rik-font-size-lead)",big:"var(--rik-font-size-big)",mega:"var(--rik-font-size-mega)",stat:"var(--rik-font-size-stat)",display:"clamp(2.6rem, 6vw, 5rem)"},V=class extends p{updated(){this.tone&&Vt[this.tone]?this.style.setProperty("--_color",Vt[this.tone]):this.style.removeProperty("--_color"),this.size&&Xt[this.size]?this.style.setProperty("--_size",Xt[this.size]):this.style.removeProperty("--_size")}render(){return c`<slot></slot>`}};V.styles=m`:host{display:block;margin:0;font-family:var(--rik-font-display,var(--rik-font-sans));font-weight:900;line-height:1.1;letter-spacing:-0.02em;font-size:var(--deck-punch-size,var(--_size,var(--rik-font-size-lead)));color:var(--deck-punch-color,var(--_color,inherit))}:host([weight="700"]){font-weight:700}:host([weight="800"]){font-weight:800}:host([align="center"]){text-align:center}:host([align="right"]){text-align:right}`,o([l({type:String})],V.prototype,"tone",2),o([l({type:String})],V.prototype,"size",2),o([l({type:String,reflect:!0})],V.prototype,"weight",2),o([l({type:String,reflect:!0})],V.prototype,"align",2),V=o([u("deck-punch")],V);function Hr(s,t){let e=s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"),r=[],i=(d,h)=>{let v="P"+r.length+"E";return r.push('<span class="'+d+'">'+h+"</span>"),v};return t==="html"||t==="xml"||t==="svg"?(e=e.replace(/(&lt;!--[\s\S]*?--&gt;)/g,d=>i("cmt",d)),e=e.replace(/(&lt;!doctype[^&]*&gt;)/gi,d=>i("cmt",d)),e=e.replace(/("[^"]*"|'[^']*')/g,d=>i("str",d)),e=e.replace(/(&lt;\/?)([a-zA-Z][a-zA-Z0-9:-]*)/g,(d,h,v)=>h+i("kw",v)),e=e.replace(/\b([a-zA-Z][a-zA-Z0-9-]*)(?==)/g,d=>i("prop",d))):t==="css"||t==="scss"||t==="less"?(e=e.replace(/(\/\*[\s\S]*?\*\/)/g,d=>i("cmt",d)),e=e.replace(/("[^"]*"|'[^']*')/g,d=>i("str",d)),e=e.replace(/([a-zA-Z-]+)(?=\s*:)/g,d=>i("prop",d)),e=e.replace(/(#[0-9a-fA-F]{3,8})\b/g,d=>i("num",d)),e=e.replace(/\b(\d+(?:\.\d+)?)(px|rem|em|%|vh|vw|vmin|vmax|s|ms|deg)?/g,(d,h,v)=>i("num",h+(v??"")))):(e=e.replace(/(\/\/[^\n]*)/g,d=>i("cmt",d)),e=e.replace(/(['"`])((?:\\.|(?!\1)[^\\])*)\1/g,d=>i("str",d)),e=e.replace(/\b(const|let|var|function|return|if|else|for|while|class|extends|new|export|import|from|as|await|async|of|in|typeof|instanceof|true|false|null|undefined)\b/g,d=>i("kw",d)),e=e.replace(/\b(\d+(?:\.\d+)?)\b/g,d=>i("num",d))),e=e.replace(/P(\d+)E/g,(d,h)=>r[+h]??""),e}var R=class extends p{constructor(){super(...arguments);this.lang="";this.hero=!1;this.nested=!1;this._html="";this._groups=null}connectedCallback(){super.connectedCallback(),this._highlight();try{this._groups=JSON.parse(this.getAttribute("step-groups")??"null")}catch{this._groups=null}}_highlight(){let r=(this.textContent??"").split(`
`);for(;r.length&&!r[0].trim();)r.shift();for(;r.length&&!r[r.length-1].trim();)r.pop();let i=r.filter(n=>n.trim().length>0).reduce((n,d)=>Math.min(n,d.match(/^ */)?.[0].length??0),1/0),a=i===1/0?r:r.map(n=>n.slice(i));this._html=a.map((n,d)=>'<span class="line" data-line="'+(d+1)+'">'+Hr(n||" ",this.lang)+"</span>").join("")}applyStep(e){if(!this._groups)return;let r=this.shadowRoot?.querySelectorAll(".line");if(r)if(e===0)r.forEach(i=>i.classList.remove("dim","lit"));else{let i=this._groups[Math.min(e-1,this._groups.length-1)]??[];r.forEach(a=>{let n=parseInt(a.dataset.line??"0",10);a.classList.toggle("lit",i.includes(n)),a.classList.toggle("dim",!i.includes(n))})}}render(){return c`<pre><code .innerHTML="${this._html}"></code></pre>`}};R.styles=m`:host{display:block;background:var(--deck-code-bg,var(--rik-code__bg));border:1px solid var(--deck-code-border,var(--rik-code__border));border-radius:var(--deck-code-radius,var(--rik-radius-md));padding:var(--deck-code-padding-y,var(--rik-space-3)) var(--deck-code-padding-x,var(--rik-space-4));font-family:var(--rik-font-mono);font-size:var(--rik-font-size-mono);line-height:1.7;color:var(--deck-code-text,var(--rik-code__text));box-shadow:var(--rik-elevation-2);overflow:auto;white-space:pre}:host([hero]){display:flex;align-items:safe center;padding:var(--rik-space-4) var(--rik-space-5)}:host([nested]){box-shadow:none;border-radius:var(--rik-radius-sm);padding:var(--rik-space-2) var(--rik-space-3)}pre{margin:0;font:inherit;color:inherit}code{display:block;width:100%;font:inherit;color:inherit}.line{transition:opacity 0.25s ease;display:block}.line.dim{opacity:0.25}.line.lit{opacity:1}.kw{color:var(--deck-code-syntax-kw,var(--rik-code__syntax-keyword))}.fn{color:var(--deck-code-syntax-fn,var(--rik-code__syntax-function))}.str{color:var(--deck-code-syntax-str,var(--rik-code__syntax-string))}.num{color:var(--deck-code-syntax-num,var(--rik-code__syntax-number))}.cmt{color:var(--deck-code-syntax-cmt,var(--rik-code__syntax-comment));font-style:italic}.ty{color:var(--deck-code-syntax-ty,var(--rik-code__syntax-type))}.prop{color:var(--deck-code-syntax-prop,var(--rik-code__syntax-property))}`,o([l({type:String})],R.prototype,"lang",2),o([l({type:Boolean,reflect:!0})],R.prototype,"hero",2),o([l({type:Boolean,reflect:!0})],R.prototype,"nested",2),o([l({type:String,attribute:"step-groups"})],R.prototype,"stepGroups",2),o([N()],R.prototype,"_html",2),R=o([u("deck-code")],R);
