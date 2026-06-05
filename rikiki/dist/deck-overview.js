var H="data-deck-overview",I="data-overview-tokens",$=`
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
    max-width: 100% !important; max-height: 60vh;
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
`;function R(r){if(r.querySelector(`style[${H}]`))return;let o=document.createElement("style");o.setAttribute(H,"1"),o.textContent=$,r.appendChild(o)}function P(r,o){if(r.querySelector(`link[${I}]`))return;let t=document.createElement("link");t.rel="stylesheet",t.setAttribute(I,"1"),t.href=new URL("../tokens.css",o).href,r.appendChild(t)}function q(r){let t=r.slides[0]?.querySelector("h1");return t?Array.from(t.childNodes).map(e=>e.nodeName==="BR"?" ":e.textContent??"").join("").replace(/\s+/g," ").trim()||`Slide ${r.startIdx+1}`:`Slide ${r.startIdx+1}`}function z(r){return(r.textContent||"").replace(/\s+/g," ").trim().slice(0,400).toLowerCase()}var _=["fill","stroke","clip-path","mask","filter","marker-start","marker-mid","marker-end","style"];function W(r,o){let t=new Map;if(r.querySelectorAll("[id]").forEach(n=>{t.set(n.id,n.id+o),n.id=n.id+o}),t.size===0)return;let e=n=>n.replace(/url\(['"]?#([^'")]+)['"]?\)/g,(d,i)=>t.has(i)?`url(#${t.get(i)})`:d);r.querySelectorAll("*").forEach(n=>{for(let d of _){let i=n.getAttribute(d);i&&i.includes("url(")&&n.setAttribute(d,e(i))}for(let d of["href","xlink:href"]){let i=n.getAttribute(d);i&&i.startsWith("#")&&t.has(i.slice(1))&&n.setAttribute(d,"#"+t.get(i.slice(1)))}})}function B(r,o){let t=r.querySelectorAll("svg");o.querySelectorAll("svg").forEach((e,n)=>{let d=t[n]?.getBoundingClientRect();if(d&&d.width>0)e.setAttribute("width",String(Math.round(d.width))),e.setAttribute("height",String(Math.round(d.height))),e.style.maxWidth="100%";else if(e.hasAttribute("viewBox")&&!e.hasAttribute("width")){let i=(e.getAttribute("viewBox")??"").split(/[\s,]+/).map(Number);i.length===4&&i[2]>0&&(e.setAttribute("width",String(i[2])),e.setAttribute("height",String(i[3])),e.style.maxWidth="100%",e.style.height="auto")}})}function F(r,o){let t=r.querySelectorAll("deck-mermaid");o.querySelectorAll("deck-mermaid").forEach((e,n)=>{let d=t[n],i=document.createElement("div");i.className="ov-mermaid-snap",i.innerHTML=d?.renderedSvg??"";let u=d?.getBoundingClientRect();u&&u.width>0&&(i.style.width=u.width+"px",i.style.height=u.height+"px"),e.replaceWith(i)})}function U(r,o){let t=r.cloneNode(!0);return t.setAttribute("active",""),B(r,t),F(r,t),W(t,`-ov${o}`),t}async function Y(r,o){let t=Array.from(o.querySelectorAll("deck-mermaid")).map(n=>n.whenRendered).filter(n=>!!n);t.length&&await Promise.all(t).catch(()=>{});let e=document.createElement("div");e.className="ov-thumb",e.appendChild(U(o,Number(r.dataset.idx))),r.insertBefore(e,r.firstChild),r.dataset.loaded="1",delete r.dataset.building}function D(r,o){let t=r.shadowRoot;if(!t)return()=>{};R(t),P(t,import.meta.url);let e=t.querySelector("#overview-grid");e||(e=document.createElement("div"),e.id="overview-grid",t.appendChild(e)),e.innerHTML="";let n=o.slides.length,d=n>60,i=n>300?140:n>150?160:n>60?180:220;e.style.setProperty("--ov-cell-min",i+"px");let u=window.innerWidth,O=window.innerHeight;e.style.setProperty("--ov-thumb-w",`${u}px`),e.style.setProperty("--ov-thumb-h",`${O}px`),requestAnimationFrame(()=>{let a=e.querySelector(".ov-cell")?.clientWidth??i;e.style.setProperty("--overview-scale",String(a/u))});let b=document.createElement("div");b.className="ov-bar";let h=document.createElement("input");h.className="ov-search",h.type="search",h.placeholder=`Search ${n} slides \xB7 type to filter`,h.spellcheck=!1,b.appendChild(h);let y=document.createElement("span");y.className="ov-count",y.textContent=`${n} slides \xB7 ${o.chapters.length} chapters`,b.appendChild(y);let E=document.createElement("span");E.className="ov-hint",E.textContent="O \xB7 Esc \xB7 close",b.appendChild(E),e.appendChild(b);let w=document.createElement("div");w.className="ov-body"+(d?"":" compact"),e.appendChild(w);let x=d?document.createElement("aside"):null;x&&(x.className="ov-aside",w.appendChild(x));let k=document.createElement("div");k.className="ov-main"+(d?"":" ov-path"),w.appendChild(k);let S=[],M=[],T=new WeakMap,C=new IntersectionObserver(a=>{for(let v of a){if(!v.isIntersecting)continue;let s=v.target;if(s.dataset.loaded||s.dataset.building)continue;let m=T.get(s);m&&(s.dataset.building="1",C.unobserve(s),Y(s,m))}},{root:null,rootMargin:"300px 0px",threshold:0});o.chapters.forEach((a,v)=>{let s=document.createElement("section");if(s.className="ov-chapter",s.id=`ov-chapter-${v}`,d){let l=document.createElement("header");l.className="ov-chapter-head";let f=document.createElement("span");f.className="ov-chapter-num",f.textContent=String(v+1).padStart(2,"0"),l.appendChild(f);let p=document.createElement("span");p.className="ov-chapter-title",p.textContent=q(a),l.appendChild(p);let c=document.createElement("span");c.className="ov-chapter-count",c.textContent=`${a.slides.length} slide${a.slides.length>1?"s":""}`,l.appendChild(c),s.appendChild(l)}let m=document.createElement("div");if(m.className="ov-row",a.slides.forEach((l,f)=>{if(!d&&f>0){let N=document.createElement("div");N.className="ov-connector",m.appendChild(N)}let p=a.startIdx+f,c=document.createElement("div");c.className="ov-cell",c.dataset.idx=String(p),c.dataset.search=z(l),p===o.currentIdx&&(c.dataset.current="1"),T.set(c,l),C.observe(c);let g=document.createElement("span");g.className="ov-cell-label",g.textContent=String(p+1),c.appendChild(g),c.addEventListener("click",()=>o.onPick(p)),m.appendChild(c)}),s.appendChild(m),k.appendChild(s),S.push(s),x){let l=document.createElement("button");l.type="button",l.className="ov-aside-item",o.currentIdx>=a.startIdx&&o.currentIdx<a.startIdx+a.slides.length&&(l.dataset.active="1");let p=document.createElement("span");p.className="ov-aside-num",p.textContent=String(v+1).padStart(2,"0"),l.appendChild(p);let c=document.createElement("span");c.className="ov-aside-text",c.textContent=q(a);let g=document.createElement("div");g.className="ov-aside-count",g.textContent=`${a.slides.length} slide${a.slides.length>1?"s":""}`,c.appendChild(g),l.appendChild(c),l.addEventListener("click",()=>{s.scrollIntoView({behavior:"smooth",block:"start"})}),x.appendChild(l),M.push(l)}});let L=null;x&&(L=new IntersectionObserver(a=>{let v=a.filter(s=>s.isIntersecting).sort((s,m)=>s.boundingClientRect.top-m.boundingClientRect.top);if(v.length>0){let s=S.indexOf(v[0].target);s>=0&&M.forEach((m,l)=>{l===s?m.dataset.active="1":delete m.dataset.active})}},{root:k,rootMargin:"0px 0px -70% 0px",threshold:0}),S.forEach(a=>L.observe(a)));let A=e.querySelectorAll(".ov-cell");return h.addEventListener("input",()=>{let a=h.value.trim().toLowerCase();if(!a){A.forEach(v=>delete v.dataset.filteredOut);return}A.forEach(v=>{(v.dataset.search||"").includes(a)?delete v.dataset.filteredOut:v.dataset.filteredOut="1"})}),requestAnimationFrame(()=>{let a=e.querySelector(".ov-cell[data-current]");a&&a.scrollIntoView({block:"center"})}),()=>{L?.disconnect(),C.disconnect(),e&&(e.innerHTML="")}}export{D as mountOverview};
