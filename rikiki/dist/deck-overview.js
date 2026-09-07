var I="data-deck-overview",O="data-overview-tokens",P=`
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
    /* It is a <button> now \xB7 drop the UA chrome, keep the tile look. */
    padding: 0;
    font: inherit;
    color: inherit;
    text-align: left;
    appearance: none;
  }
  /* The keyboard user must see where they are \xB7 without this the grid moves
     focus invisibly. */
  :host([overview]) .ov-cell:focus-visible {
    outline: var(--rik-focus-ring--width, 2px) solid var(--rik-focus-ring, currentColor);
    outline-offset: var(--rik-focus-ring--offset, 2px);
    z-index: 2;
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
  /* The thumb mirrors the letterboxed stage, so make it a size container too \xB7
     the cloned slide's cqw/cqh then resolve exactly as they do live instead of
     falling back to the (larger) window. */
  :host([overview]) .ov-thumb {
    position: absolute; top: 0; left: 0;
    width: var(--ov-thumb-w, 1920px); height: var(--ov-thumb-h, 1080px);
    transform: scale(var(--overview-scale, 0.2));
    transform-origin: top left;
    pointer-events: none;
    container-type: size;
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
`;function W(r){if(r.querySelector(`style[${I}]`))return;let o=document.createElement("style");o.setAttribute(I,"1"),o.textContent=P,r.appendChild(o)}function _(r,o){if(r.querySelector(`link[${O}]`))return;let t=document.createElement("link");t.rel="stylesheet",t.setAttribute(O,"1"),t.href=new URL("../tokens.css",o).href,r.appendChild(t)}function R(r){let t=r.slides[0]?.querySelector("h1");return t?Array.from(t.childNodes).map(e=>e.nodeName==="BR"?" ":e.textContent??"").join("").replace(/\s+/g," ").trim()||`Slide ${r.startIdx+1}`:`Slide ${r.startIdx+1}`}function z(r){return(r.textContent||"").replace(/\s+/g," ").trim().slice(0,400).toLowerCase()}var B=["fill","stroke","clip-path","mask","filter","marker-start","marker-mid","marker-end","style"];function D(r,o){let t=new Map;if(r.querySelectorAll("[id]").forEach(a=>{t.set(a.id,a.id+o),a.id=a.id+o}),t.size===0)return;let e=a=>a.replace(/url\(['"]?#([^'")]+)['"]?\)/g,(s,d)=>t.has(d)?`url(#${t.get(d)})`:s);r.querySelectorAll("*").forEach(a=>{for(let s of B){let d=a.getAttribute(s);d?.includes("url(")&&a.setAttribute(s,e(d))}for(let s of["href","xlink:href"]){let d=a.getAttribute(s);d?.startsWith("#")&&t.has(d.slice(1))&&a.setAttribute(s,`#${t.get(d.slice(1))}`)}});let u=r.querySelectorAll("style");if(u.length){let a=s=>s.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");u.forEach(s=>{let d=s.textContent??"";t.forEach((w,S)=>{d=d.replace(new RegExp(`#${a(S)}(?![\\w-])`,"g"),`#${w}`)}),s.textContent=d})}}function V(r,o){let t=r.querySelectorAll("svg");o.querySelectorAll("svg").forEach((e,u)=>{let a=t[u]?.getBoundingClientRect();if(a&&a.width>0)e.setAttribute("width",String(Math.round(a.width))),e.setAttribute("height",String(Math.round(a.height))),e.style.maxWidth="100%";else if(e.hasAttribute("viewBox")&&!e.hasAttribute("width")){let s=(e.getAttribute("viewBox")??"").split(/[\s,]+/).map(Number);s.length===4&&s[2]>0&&(e.setAttribute("width",String(s[2])),e.setAttribute("height",String(s[3])),e.style.maxWidth="100%",e.style.height="auto")}})}function G(r,o){let t=r.querySelectorAll("deck-mermaid");o.querySelectorAll("deck-mermaid").forEach((e,u)=>{let a=t[u],s=document.createElement("div");s.className="ov-mermaid-snap",s.innerHTML=a?.renderedSvg??"";let d=a?.getBoundingClientRect();d&&d.width>0&&(s.style.width=`${d.width}px`,s.style.height=`${d.height}px`),e.replaceWith(s)})}function U(r){r.querySelectorAll("[data-click], [data-click-auto], [data-click-children], [data-click-stagger] > *").forEach(o=>{o.style.opacity="",o.style.transform="",o.style.filter="",o.style.pointerEvents="",o.querySelectorAll("path, line, polyline, polygon, circle, ellipse, rect").forEach(t=>{t.style.strokeDashoffset=""})})}function F(r,o){let t=r.cloneNode(!0);return t.setAttribute("active",""),U(t),V(r,t),G(r,t),D(t,`-ov${o}`),t}async function K(r,o){let t=Array.from(o.querySelectorAll("deck-mermaid")).map(u=>u.whenRendered).filter(u=>!!u);t.length&&await Promise.all(t).catch(()=>{});let e=document.createElement("div");e.className="ov-thumb",e.appendChild(F(o,Number(r.dataset.idx))),r.insertBefore(e,r.firstChild),r.dataset.loaded="1",delete r.dataset.building}function Y(r,o){let t=r.shadowRoot;if(!t)return()=>{};W(t),_(t,import.meta.url);let e=t.querySelector("#overview-grid");e||(e=document.createElement("div"),e.id="overview-grid",t.appendChild(e)),e.innerHTML="";let u=o.slides.length,a=u>60,s=u>300?140:u>150?160:u>60?180:220;e.style.setProperty("--ov-cell-min",`${s}px`);let d=t.querySelector("#stage"),w=d?.clientWidth||window.innerWidth,S=d?.clientHeight||window.innerHeight;e.style.setProperty("--ov-thumb-w",`${w}px`),e.style.setProperty("--ov-thumb-h",`${S}px`),requestAnimationFrame(()=>{let i=e.querySelector(".ov-cell")?.clientWidth??s;e.style.setProperty("--overview-scale",String(i/w))});let x=document.createElement("div");x.className="ov-bar";let f=document.createElement("input");f.className="ov-search",f.type="search",f.placeholder=`Search ${u} slides \xB7 type to filter`,f.spellcheck=!1,x.appendChild(f);let C=document.createElement("span");C.className="ov-count",C.textContent=`${u} slides \xB7 ${o.chapters.length} chapters`,x.appendChild(C);let L=document.createElement("span");L.className="ov-hint",L.textContent="O \xB7 Esc \xB7 close",x.appendChild(L),e.appendChild(x);let k=document.createElement("div");k.className=`ov-body${a?"":" compact"}`,e.appendChild(k);let b=a?document.createElement("aside"):null;b&&(b.className="ov-aside",k.appendChild(b));let y=document.createElement("div");y.className=`ov-main${a?"":" ov-path"}`,k.appendChild(y);let T=[],A=[],H=new WeakMap,E=new IntersectionObserver(i=>{for(let v of i){if(!v.isIntersecting)continue;let n=v.target;if(n.dataset.loaded||n.dataset.building)continue;let m=H.get(n);m&&(n.dataset.building="1",E.unobserve(n),K(n,m).catch(l=>{let h=Number(n.dataset.tries??"0")+1;n.dataset.tries=String(h),console.warn("[rikiki/overview] thumbnail build failed",l),delete n.dataset.building,h<3&&E.observe(n)}))}},{root:null,rootMargin:"300px 0px",threshold:0});o.chapters.forEach((i,v)=>{let n=document.createElement("section");if(n.className="ov-chapter",n.id=`ov-chapter-${v}`,a){let l=document.createElement("header");l.className="ov-chapter-head";let h=document.createElement("span");h.className="ov-chapter-num",h.textContent=String(v+1).padStart(2,"0"),l.appendChild(h);let p=document.createElement("span");p.className="ov-chapter-title",p.textContent=R(i),l.appendChild(p);let c=document.createElement("span");c.className="ov-chapter-count",c.textContent=`${i.slides.length} slide${i.slides.length>1?"s":""}`,l.appendChild(c),n.appendChild(l)}let m=document.createElement("div");if(m.className="ov-row",i.slides.forEach((l,h)=>{if(!a&&h>0){let q=document.createElement("div");q.className="ov-connector",m.appendChild(q)}let p=i.startIdx+h,c=document.createElement("button");c.type="button",c.className="ov-cell",c.dataset.idx=String(p),c.dataset.search=z(l),p===o.currentIdx&&(c.dataset.current="1"),H.set(c,l),E.observe(c);let g=document.createElement("span");g.className="ov-cell-label",g.textContent=String(p+1),c.appendChild(g);let $=z(l).trim().slice(0,80);c.setAttribute("aria-label",`Slide ${p+1} of ${u}${$?` \xB7 ${$}`:""}`),p===o.currentIdx&&c.setAttribute("aria-current","true"),c.addEventListener("click",()=>o.onPick(p)),m.appendChild(c)}),n.appendChild(m),y.appendChild(n),T.push(n),b){let l=document.createElement("button");l.type="button",l.className="ov-aside-item",o.currentIdx>=i.startIdx&&o.currentIdx<i.startIdx+i.slides.length&&(l.dataset.active="1");let p=document.createElement("span");p.className="ov-aside-num",p.textContent=String(v+1).padStart(2,"0"),l.appendChild(p);let c=document.createElement("span");c.className="ov-aside-text",c.textContent=R(i);let g=document.createElement("div");g.className="ov-aside-count",g.textContent=`${i.slides.length} slide${i.slides.length>1?"s":""}`,c.appendChild(g),l.appendChild(c),l.addEventListener("click",()=>{n.scrollIntoView({behavior:"smooth",block:"start"})}),b.appendChild(l),A.push(l)}});let M=null;b&&(M=new IntersectionObserver(i=>{let v=i.filter(n=>n.isIntersecting).sort((n,m)=>n.boundingClientRect.top-m.boundingClientRect.top);if(v.length>0){let n=T.indexOf(v[0].target);n>=0&&A.forEach((m,l)=>{l===n?m.dataset.active="1":delete m.dataset.active})}},{root:y,rootMargin:"0px 0px -70% 0px",threshold:0}),T.forEach(i=>{M.observe(i)}));let N=e.querySelectorAll(".ov-cell");return f.addEventListener("input",()=>{let i=f.value.trim().toLowerCase();if(!i){N.forEach(v=>{delete v.dataset.filteredOut});return}N.forEach(v=>{(v.dataset.search||"").includes(i)?delete v.dataset.filteredOut:v.dataset.filteredOut="1"})}),requestAnimationFrame(()=>{let i=e.querySelector(".ov-cell[data-current]");i&&(i.scrollIntoView({block:"center"}),i.focus({preventScroll:!0}))}),e.addEventListener("keydown",i=>{let v=i.key;if(v!=="ArrowLeft"&&v!=="ArrowRight")return;let n=[...e.querySelectorAll(".ov-cell")].filter(h=>!h.dataset.filteredOut),m=n.indexOf(document.activeElement);if(m<0)return;i.preventDefault();let l=n[m+(v==="ArrowRight"?1:-1)];l?.focus(),l?.scrollIntoView({block:"nearest"})}),()=>{M?.disconnect(),E.disconnect(),e&&(e.innerHTML="")}}export{Y as mountOverview};
