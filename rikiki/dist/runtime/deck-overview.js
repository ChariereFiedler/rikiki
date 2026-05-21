var H="data-deck-overview",O="data-overview-tokens",A=`
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
`;function P(s){if(s.querySelector(`style[${H}]`))return;let i=document.createElement("style");i.setAttribute(H,"1"),i.textContent=A,s.appendChild(i)}function R(s,i){if(s.querySelector(`link[${O}]`))return;let l=document.createElement("link");l.rel="stylesheet",l.setAttribute(O,"1"),l.href=new URL("../tokens.css",i).href,s.appendChild(l)}function $(s){let l=s.slides[0]?.querySelector("h1");return l?Array.from(l.childNodes).map(r=>r.nodeName==="BR"?" ":r.textContent??"").join("").replace(/\s+/g," ").trim()||`Slide ${s.startIdx+1}`:`Slide ${s.startIdx+1}`}function z(s){return(s.textContent||"").replace(/\s+/g," ").trim().slice(0,400).toLowerCase()}function W(s,i){let l=s.shadowRoot;if(!l)return()=>{};P(l),R(l,import.meta.url);let r=l.querySelector("#overview-grid");r||(r=document.createElement("div"),r.id="overview-grid",l.appendChild(r)),r.innerHTML="";let u=i.slides.length,f=u>60,S=u>300?140:u>150?160:u>60?180:220;r.style.setProperty("--ov-cell-min",S+"px");let L=window.innerWidth,q=window.innerHeight;r.style.setProperty("--ov-thumb-w",`${L}px`),r.style.setProperty("--ov-thumb-h",`${q}px`),requestAnimationFrame(()=>{let e=r.querySelector(".ov-cell")?.clientWidth??S;r.style.setProperty("--overview-scale",String(e/L))});let x=document.createElement("div");x.className="ov-bar";let p=document.createElement("input");p.className="ov-search",p.type="search",p.placeholder=`Search ${u} slides \xB7 type to filter`,p.spellcheck=!1,x.appendChild(p);let w=document.createElement("span");w.className="ov-count",w.textContent=`${u} slides \xB7 ${i.chapters.length} chapters`,x.appendChild(w);let k=document.createElement("span");k.className="ov-hint",k.textContent="O \xB7 Esc \xB7 close",x.appendChild(k),r.appendChild(x);let b=document.createElement("div");b.className="ov-body"+(f?"":" compact"),r.appendChild(b);let h=f?document.createElement("aside"):null;h&&(h.className="ov-aside",b.appendChild(h));let g=document.createElement("div");g.className="ov-main"+(f?"":" ov-path"),b.appendChild(g);let y=[],N=[],T=new WeakMap,E=new IntersectionObserver(e=>{for(let a of e){if(!a.isIntersecting)continue;let o=a.target;if(o.dataset.loaded)continue;let d=T.get(o);if(!d)continue;let t=document.createElement("div");t.className="ov-thumb";let v=d.cloneNode(!0);v.setAttribute("active",""),t.appendChild(v),o.insertBefore(t,o.firstChild),o.dataset.loaded="1",E.unobserve(o)}},{root:null,rootMargin:"300px 0px",threshold:0});i.chapters.forEach((e,a)=>{let o=document.createElement("section");if(o.className="ov-chapter",o.id=`ov-chapter-${a}`,f){let t=document.createElement("header");t.className="ov-chapter-head";let v=document.createElement("span");v.className="ov-chapter-num",v.textContent=String(a+1).padStart(2,"0"),t.appendChild(v);let c=document.createElement("span");c.className="ov-chapter-title",c.textContent=$(e),t.appendChild(c);let n=document.createElement("span");n.className="ov-chapter-count",n.textContent=`${e.slides.length} slide${e.slides.length>1?"s":""}`,t.appendChild(n),o.appendChild(t)}let d=document.createElement("div");if(d.className="ov-row",e.slides.forEach((t,v)=>{if(!f&&v>0){let I=document.createElement("div");I.className="ov-connector",d.appendChild(I)}let c=e.startIdx+v,n=document.createElement("div");n.className="ov-cell",n.dataset.idx=String(c),n.dataset.search=z(t),c===i.currentIdx&&(n.dataset.current="1"),T.set(n,t),E.observe(n);let m=document.createElement("span");m.className="ov-cell-label",m.textContent=String(c+1),n.appendChild(m),n.addEventListener("click",()=>i.onPick(c)),d.appendChild(n)}),o.appendChild(d),g.appendChild(o),y.push(o),h){let t=document.createElement("button");t.type="button",t.className="ov-aside-item",i.currentIdx>=e.startIdx&&i.currentIdx<e.startIdx+e.slides.length&&(t.dataset.active="1");let c=document.createElement("span");c.className="ov-aside-num",c.textContent=String(a+1).padStart(2,"0"),t.appendChild(c);let n=document.createElement("span");n.className="ov-aside-text",n.textContent=$(e);let m=document.createElement("div");m.className="ov-aside-count",m.textContent=`${e.slides.length} slide${e.slides.length>1?"s":""}`,n.appendChild(m),t.appendChild(n),t.addEventListener("click",()=>{o.scrollIntoView({behavior:"smooth",block:"start"})}),h.appendChild(t),N.push(t)}});let C=null;h&&(C=new IntersectionObserver(e=>{let a=e.filter(o=>o.isIntersecting).sort((o,d)=>o.boundingClientRect.top-d.boundingClientRect.top);if(a.length>0){let o=y.indexOf(a[0].target);o>=0&&N.forEach((d,t)=>{t===o?d.dataset.active="1":delete d.dataset.active})}},{root:g,rootMargin:"0px 0px -70% 0px",threshold:0}),y.forEach(e=>C.observe(e)));let M=r.querySelectorAll(".ov-cell");return p.addEventListener("input",()=>{let e=p.value.trim().toLowerCase();if(!e){M.forEach(a=>delete a.dataset.filteredOut);return}M.forEach(a=>{(a.dataset.search||"").includes(e)?delete a.dataset.filteredOut:a.dataset.filteredOut="1"})}),requestAnimationFrame(()=>{let e=r.querySelector(".ov-cell[data-current]");e&&e.scrollIntoView({block:"center"})}),()=>{C?.disconnect(),E.disconnect(),r&&(r.innerHTML="")}}export{W as mountOverview};
