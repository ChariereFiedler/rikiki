var I="data-deck-overview",$="data-overview-tokens",z=`
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
  /* Fixed-viewport decks: the thumb mirrors the letterboxed stage, so make it a
     size container too \xB7 the cloned slide's cqw/cqh then resolve exactly as they
     do live instead of falling back to the (larger) window. */
  :host([overview]) #overview-grid[data-fixed] .ov-thumb { container-type: size; }
  :host([overview]) .ov-thumb > * { display: flex !important; }
  :host([overview]) .ov-mermaid-snap {
    display: flex; align-items: center; justify-content: center;
    background: var(--rik-code__bg);
    border: 1px solid var(--rik-code__border);
    border-radius: var(--rik-radius-md);
    padding: var(--rik-space-4);
    overflow: hidden; min-width: 0;
  }
  :host([overview]) .ov-mermaid-snap svg {
    width: 100% !important; height: auto !important;
    max-width: 100% !important; max-height: 60cqh;
  }
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
`;function P(r){if(r.querySelector(`style[${I}]`))return;let o=document.createElement("style");o.setAttribute(I,"1"),o.textContent=z,r.appendChild(o)}function W(r,o){if(r.querySelector(`link[${$}]`))return;let t=document.createElement("link");t.rel="stylesheet",t.setAttribute($,"1"),t.href=new URL("../tokens.css",o).href,r.appendChild(t)}function O(r){let t=r.slides[0]?.querySelector("h1");return t?Array.from(t.childNodes).map(e=>e.nodeName==="BR"?" ":e.textContent??"").join("").replace(/\s+/g," ").trim()||`Slide ${r.startIdx+1}`:`Slide ${r.startIdx+1}`}function _(r){return(r.textContent||"").replace(/\s+/g," ").trim().slice(0,400).toLowerCase()}var B=["fill","stroke","clip-path","mask","filter","marker-start","marker-mid","marker-end","style"];function D(r,o){let t=new Map;if(r.querySelectorAll("[id]").forEach(i=>{t.set(i.id,i.id+o),i.id=i.id+o}),t.size===0)return;let e=i=>i.replace(/url\(['"]?#([^'")]+)['"]?\)/g,(n,l)=>t.has(l)?`url(#${t.get(l)})`:n);r.querySelectorAll("*").forEach(i=>{for(let n of B){let l=i.getAttribute(n);l&&l.includes("url(")&&i.setAttribute(n,e(l))}for(let n of["href","xlink:href"]){let l=i.getAttribute(n);l&&l.startsWith("#")&&t.has(l.slice(1))&&i.setAttribute(n,"#"+t.get(l.slice(1)))}});let v=r.querySelectorAll("style");if(v.length){let i=n=>n.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");v.forEach(n=>{let l=n.textContent??"";t.forEach((w,k)=>{l=l.replace(new RegExp("#"+i(k)+"(?![\\w-])","g"),"#"+w)}),n.textContent=l})}}function F(r,o){let t=r.querySelectorAll("svg");o.querySelectorAll("svg").forEach((e,v)=>{let i=t[v]?.getBoundingClientRect();if(i&&i.width>0)e.setAttribute("width",String(Math.round(i.width))),e.setAttribute("height",String(Math.round(i.height))),e.style.maxWidth="100%";else if(e.hasAttribute("viewBox")&&!e.hasAttribute("width")){let n=(e.getAttribute("viewBox")??"").split(/[\s,]+/).map(Number);n.length===4&&n[2]>0&&(e.setAttribute("width",String(n[2])),e.setAttribute("height",String(n[3])),e.style.maxWidth="100%",e.style.height="auto")}})}function G(r,o){let t=r.querySelectorAll("deck-mermaid");o.querySelectorAll("deck-mermaid").forEach((e,v)=>{let i=t[v],n=document.createElement("div");n.className="ov-mermaid-snap",n.innerHTML=i?.renderedSvg??"";let l=i?.getBoundingClientRect();l&&l.width>0&&(n.style.width=l.width+"px",n.style.height=l.height+"px"),e.replaceWith(n)})}function V(r){r.querySelectorAll("[data-click], [data-click-auto], [data-click-children], [data-click-stagger] > *").forEach(o=>{o.style.opacity="",o.style.transform="",o.style.filter="",o.style.pointerEvents="",o.querySelectorAll("path, line, polyline, polygon, circle, ellipse, rect").forEach(t=>{t.style.strokeDashoffset=""})})}function U(r,o){let t=r.cloneNode(!0);return t.setAttribute("active",""),V(t),F(r,t),G(r,t),D(t,`-ov${o}`),t}async function Y(r,o){let t=Array.from(o.querySelectorAll("deck-mermaid")).map(v=>v.whenRendered).filter(v=>!!v);t.length&&await Promise.all(t).catch(()=>{});let e=document.createElement("div");e.className="ov-thumb",e.appendChild(U(o,Number(r.dataset.idx))),r.insertBefore(e,r.firstChild),r.dataset.loaded="1",delete r.dataset.building}function K(r,o){let t=r.shadowRoot;if(!t)return()=>{};P(t),W(t,import.meta.url);let e=t.querySelector("#overview-grid");e||(e=document.createElement("div"),e.id="overview-grid",t.appendChild(e)),e.innerHTML="";let v=o.slides.length,i=v>60,n=v>300?140:v>150?160:v>60?180:220;e.style.setProperty("--ov-cell-min",n+"px");let l=r.hasAttribute("fixed"),w=l?t.querySelector("#stage"):null,k=w?.clientWidth||window.innerWidth,R=w?.clientHeight||window.innerHeight;l&&(e.dataset.fixed="1"),e.style.setProperty("--ov-thumb-w",`${k}px`),e.style.setProperty("--ov-thumb-h",`${R}px`),requestAnimationFrame(()=>{let s=e.querySelector(".ov-cell")?.clientWidth??n;e.style.setProperty("--overview-scale",String(s/k))});let b=document.createElement("div");b.className="ov-bar";let f=document.createElement("input");f.className="ov-search",f.type="search",f.placeholder=`Search ${v} slides \xB7 type to filter`,f.spellcheck=!1,b.appendChild(f);let C=document.createElement("span");C.className="ov-count",C.textContent=`${v} slides \xB7 ${o.chapters.length} chapters`,b.appendChild(C);let L=document.createElement("span");L.className="ov-hint",L.textContent="O \xB7 Esc \xB7 close",b.appendChild(L),e.appendChild(b);let y=document.createElement("div");y.className="ov-body"+(i?"":" compact"),e.appendChild(y);let x=i?document.createElement("aside"):null;x&&(x.className="ov-aside",y.appendChild(x));let E=document.createElement("div");E.className="ov-main"+(i?"":" ov-path"),y.appendChild(E);let M=[],A=[],N=new WeakMap,S=new IntersectionObserver(s=>{for(let m of s){if(!m.isIntersecting)continue;let a=m.target;if(a.dataset.loaded||a.dataset.building)continue;let p=N.get(a);p&&(a.dataset.building="1",S.unobserve(a),Y(a,p).catch(d=>{let u=Number(a.dataset.tries??"0")+1;a.dataset.tries=String(u),console.warn("[rikiki/overview] thumbnail build failed",d),delete a.dataset.building,u<3&&S.observe(a)}))}},{root:null,rootMargin:"300px 0px",threshold:0});o.chapters.forEach((s,m)=>{let a=document.createElement("section");if(a.className="ov-chapter",a.id=`ov-chapter-${m}`,i){let d=document.createElement("header");d.className="ov-chapter-head";let u=document.createElement("span");u.className="ov-chapter-num",u.textContent=String(m+1).padStart(2,"0"),d.appendChild(u);let h=document.createElement("span");h.className="ov-chapter-title",h.textContent=O(s),d.appendChild(h);let c=document.createElement("span");c.className="ov-chapter-count",c.textContent=`${s.slides.length} slide${s.slides.length>1?"s":""}`,d.appendChild(c),a.appendChild(d)}let p=document.createElement("div");if(p.className="ov-row",s.slides.forEach((d,u)=>{if(!i&&u>0){let q=document.createElement("div");q.className="ov-connector",p.appendChild(q)}let h=s.startIdx+u,c=document.createElement("div");c.className="ov-cell",c.dataset.idx=String(h),c.dataset.search=_(d),h===o.currentIdx&&(c.dataset.current="1"),N.set(c,d),S.observe(c);let g=document.createElement("span");g.className="ov-cell-label",g.textContent=String(h+1),c.appendChild(g),c.addEventListener("click",()=>o.onPick(h)),p.appendChild(c)}),a.appendChild(p),E.appendChild(a),M.push(a),x){let d=document.createElement("button");d.type="button",d.className="ov-aside-item",o.currentIdx>=s.startIdx&&o.currentIdx<s.startIdx+s.slides.length&&(d.dataset.active="1");let h=document.createElement("span");h.className="ov-aside-num",h.textContent=String(m+1).padStart(2,"0"),d.appendChild(h);let c=document.createElement("span");c.className="ov-aside-text",c.textContent=O(s);let g=document.createElement("div");g.className="ov-aside-count",g.textContent=`${s.slides.length} slide${s.slides.length>1?"s":""}`,c.appendChild(g),d.appendChild(c),d.addEventListener("click",()=>{a.scrollIntoView({behavior:"smooth",block:"start"})}),x.appendChild(d),A.push(d)}});let T=null;x&&(T=new IntersectionObserver(s=>{let m=s.filter(a=>a.isIntersecting).sort((a,p)=>a.boundingClientRect.top-p.boundingClientRect.top);if(m.length>0){let a=M.indexOf(m[0].target);a>=0&&A.forEach((p,d)=>{d===a?p.dataset.active="1":delete p.dataset.active})}},{root:E,rootMargin:"0px 0px -70% 0px",threshold:0}),M.forEach(s=>{T.observe(s)}));let H=e.querySelectorAll(".ov-cell");return f.addEventListener("input",()=>{let s=f.value.trim().toLowerCase();if(!s){H.forEach(m=>{delete m.dataset.filteredOut});return}H.forEach(m=>{(m.dataset.search||"").includes(s)?delete m.dataset.filteredOut:m.dataset.filteredOut="1"})}),requestAnimationFrame(()=>{let s=e.querySelector(".ov-cell[data-current]");s&&s.scrollIntoView({block:"center"})}),()=>{T?.disconnect(),S.disconnect(),e&&(e.innerHTML="")}}export{K as mountOverview};
