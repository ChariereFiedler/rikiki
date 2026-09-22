var F="data-deck-overview",K=new WeakMap,R=new WeakMap;function J(t){let r=t.outerHTML,o=r.indexOf(">");return r.slice(0,o).replace(/\sactive(?:="[^"]*")?/,"")+r.slice(o)}var Q=`
  :host([overview]) ::slotted(*) { display: none !important; }
  :host(:is([overview], [data-overview-warming])) #overview-grid {
    position: fixed; inset: 0;
    background: var(--rik-surface-page);
    overflow: hidden;
    z-index: 80;
    display: grid;
    grid-template-rows: auto 1fr;
  }

  /* \u2500\u2500 Top bar \xB7 search, slide count, close hint \u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
  :host(:is([overview], [data-overview-warming])) .ov-bar {
    display: flex; align-items: center; gap: 16px;
    padding: 14px 28px;
    background: var(--rik-surface-raised);
    border-bottom: 1px solid var(--rik-border-default);
    font: 700 0.78rem/1 var(--rik-font-mono);
    letter-spacing: 0.10em;
    color: var(--rik-text-default--faint);
  }
  :host(:is([overview], [data-overview-warming])) .ov-bar .ov-search {
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
  :host(:is([overview], [data-overview-warming])) .ov-bar .ov-search:focus {
    outline: none;
    border-color: var(--rik-accent);
    box-shadow: 0 0 0 3px var(--rik-accent--soft);
  }
  :host(:is([overview], [data-overview-warming])) .ov-bar .ov-count { color: var(--rik-accent); }
  :host(:is([overview], [data-overview-warming])) .ov-bar .ov-hint { letter-spacing: 0.16em; text-transform: uppercase; }

  /* \u2500\u2500 Sidebar layout (many slides) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
  :host(:is([overview], [data-overview-warming])) .ov-body {
    display: grid;
    grid-template-columns: 240px 1fr;
    min-height: 0;
  }
  :host(:is([overview], [data-overview-warming])) .ov-body.compact { grid-template-columns: 1fr; }
  :host(:is([overview], [data-overview-warming])) .ov-aside {
    border-right: 1px solid var(--rik-border-default);
    background: var(--rik-surface-raised);
    overflow-y: auto;
    padding: 16px 0;
  }
  :host(:is([overview], [data-overview-warming])) .ov-aside-item {
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
  :host(:is([overview], [data-overview-warming])) .ov-aside-item:hover {
    background: var(--rik-surface-tint);
    color: var(--rik-text-default);
  }
  :host(:is([overview], [data-overview-warming])) .ov-aside-item[data-active] {
    background: var(--rik-accent--faint);
    border-left-color: var(--rik-accent);
    color: var(--rik-text-default);
  }
  :host(:is([overview], [data-overview-warming])) .ov-aside-num {
    font: 800 0.85rem/1 var(--rik-font-mono);
    color: var(--rik-accent);
  }
  :host(:is([overview], [data-overview-warming])) .ov-aside-text {
    font: 700 0.92rem/1.3 var(--rik-font-display, var(--rik-font-sans));
    letter-spacing: -0.005em;
  }
  :host(:is([overview], [data-overview-warming])) .ov-aside-count {
    font: 600 0.70rem/1 var(--rik-font-mono);
    color: var(--rik-text-default--faint);
    margin-top: 4px;
  }

  /* \u2500\u2500 Main scroll area \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
  :host(:is([overview], [data-overview-warming])) .ov-main {
    overflow-y: auto;
    padding: 24px 32px 48px;
    display: flex; flex-direction: column;
    gap: 32px;
    min-width: 0;
  }
  :host(:is([overview], [data-overview-warming])) .ov-chapter {
    display: flex; flex-direction: column;
    gap: 12px;
    scroll-margin-top: 24px;
  }
  :host(:is([overview], [data-overview-warming])) .ov-chapter-head {
    display: flex; align-items: baseline; gap: 12px;
    padding-bottom: 6px;
    border-bottom: 2px solid var(--rik-accent);
  }
  :host(:is([overview], [data-overview-warming])) .ov-chapter-num {
    font: 800 0.85rem/1 var(--rik-font-mono);
    color: var(--rik-accent);
    letter-spacing: 0.12em;
  }
  :host(:is([overview], [data-overview-warming])) .ov-chapter-title {
    font: 800 1.2rem/1.2 var(--rik-font-display, var(--rik-font-sans));
    color: var(--rik-text-default);
    letter-spacing: -0.012em;
    flex: 1;
    min-width: 0;
  }
  :host(:is([overview], [data-overview-warming])) .ov-chapter-count {
    font: 700 0.72rem/1 var(--rik-font-mono);
    color: var(--rik-text-default--faint);
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }
  :host(:is([overview], [data-overview-warming])) .ov-row {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(var(--ov-cell-min, 180px), 1fr));
    gap: 12px;
  }

  /* \u2500\u2500 Path layout (\u2264 60 slides) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
  :host(:is([overview], [data-overview-warming])) .ov-path .ov-row {
    display: flex; gap: 14px; align-items: center; flex-wrap: wrap;
  }
  :host(:is([overview], [data-overview-warming])) .ov-path .ov-connector {
    flex: 0 0 auto;
    width: 16px; height: 2px;
    background: var(--rik-border-default);
  }
  :host(:is([overview], [data-overview-warming])) .ov-path .ov-cell { flex: 0 0 auto; width: clamp(160px, 14vw, 260px); }

  /* \u2500\u2500 Thumbnail cell \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
  :host(:is([overview], [data-overview-warming])) .ov-cell {
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
  :host(:is([overview], [data-overview-warming])) .ov-cell:focus-visible {
    outline: var(--rik-focus-ring--width, 2px) solid var(--rik-focus-ring, currentColor);
    outline-offset: var(--rik-focus-ring--offset, 2px);
    z-index: 2;
  }
  :host(:is([overview], [data-overview-warming])) .ov-cell:hover {
    transform: translateY(-2px) scale(1.015);
    border-color: var(--rik-accent--soft);
    box-shadow: var(--rik-elevation-3);
    z-index: 1;
  }
  :host(:is([overview], [data-overview-warming])) .ov-cell[data-current] {
    border-color: var(--rik-accent);
    box-shadow: 0 0 0 3px var(--rik-accent--soft), var(--rik-elevation-2);
  }
  :host(:is([overview], [data-overview-warming])) .ov-cell[data-filtered-out] { opacity: 0.10; pointer-events: none; transform: scale(0.96); }
  :host(:is([overview], [data-overview-warming])) .ov-cell:not([data-loaded]) .ov-thumb { display: none; }
  :host(:is([overview], [data-overview-warming])) .ov-cell:not([data-loaded])::before {
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
  :host(:is([overview], [data-overview-warming])) .ov-thumb {
    position: absolute; top: 0; left: 0;
    width: var(--ov-thumb-w, 1920px); height: var(--ov-thumb-h, 1080px);
    transform: scale(var(--overview-scale, 0.2));
    transform-origin: top left;
    pointer-events: none;
    container-type: size;
  }
  :host(:is([overview], [data-overview-warming])) .ov-thumb > * { display: flex !important; }
  :host(:is([overview], [data-overview-warming])) .ov-mermaid-snap {
    display: flex; align-items: center; justify-content: center;
    background: var(--rik-code__bg);
    border: 1px solid var(--rik-code__border);
    border-radius: var(--rik-radius-md);
    padding: var(--rik-space-4);
    overflow: hidden; min-width: 0;
  }
  :host(:is([overview], [data-overview-warming])) .ov-mermaid-snap svg {
    width: 100% !important; height: auto !important;
    max-width: 100% !important; max-height: 60cqh;
  }
  :host(:is([overview], [data-overview-warming])) .ov-cell-label {
    position: absolute; bottom: 6px; right: 8px;
    font: 700 0.70rem/1 var(--rik-font-mono);
    color: var(--rik-text-default);
    background: rgba(255, 255, 255, 0.92);
    padding: 3px 7px; border-radius: 4px;
    z-index: 2;
    pointer-events: none;
  }
  :host(:not([overview])) #overview-grid { visibility: hidden; pointer-events: none; }
  :host(:not([overview]):not([data-overview-warming])) #overview-grid { display: none; }
`;function X(t){if(t.querySelector(`style[${F}]`))return;let r=document.createElement("style");r.setAttribute(F,"1"),r.textContent=Q,t.appendChild(r)}function G(t){let o=t.slides[0]?.querySelector("h1");return o?Array.from(o.childNodes).map(i=>i.nodeName==="BR"?" ":i.textContent??"").join("").replace(/\s+/g," ").trim()||`Slide ${t.startIdx+1}`:`Slide ${t.startIdx+1}`}function U(t){return(t.textContent||"").replace(/\s+/g," ").trim().slice(0,400).toLowerCase()}var Z=["fill","stroke","clip-path","mask","filter","marker-start","marker-mid","marker-end","style"];function ee(t,r){let o=new Map;if(t.querySelectorAll("[id]").forEach(s=>{o.set(s.id,s.id+r),s.id=s.id+r}),o.size===0)return;let i=s=>s.replace(/url\(['"]?#([^'")]+)['"]?\)/g,(n,l)=>o.has(l)?`url(#${o.get(l)})`:n);t.querySelectorAll("*").forEach(s=>{for(let n of Z){let l=s.getAttribute(n);l?.includes("url(")&&s.setAttribute(n,i(l))}for(let n of["href","xlink:href"]){let l=s.getAttribute(n);l?.startsWith("#")&&o.has(l.slice(1))&&s.setAttribute(n,`#${o.get(l.slice(1))}`)}});let u=t.querySelectorAll("style");if(u.length){let s=n=>n.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");u.forEach(n=>{let l=n.textContent??"";o.forEach((g,h)=>{l=l.replace(new RegExp(`#${s(h)}(?![\\w-])`,"g"),`#${g}`)}),n.textContent=l})}}function te(t,r){let o=t.querySelectorAll("svg");r.querySelectorAll("svg").forEach((i,u)=>{let s=o[u]?.getBoundingClientRect();if(s&&s.width>0)i.setAttribute("width",String(Math.round(s.width))),i.setAttribute("height",String(Math.round(s.height))),i.style.maxWidth="100%";else if(i.hasAttribute("viewBox")&&!i.hasAttribute("width")){let n=(i.getAttribute("viewBox")??"").split(/[\s,]+/).map(Number);n.length===4&&n[2]>0&&(i.setAttribute("width",String(n[2])),i.setAttribute("height",String(n[3])),i.style.maxWidth="100%",i.style.height="auto")}})}function re(t,r){let o=t.querySelectorAll("deck-mermaid");r.querySelectorAll("deck-mermaid").forEach((i,u)=>{let s=o[u],n=document.createElement("div");n.className="ov-mermaid-snap",n.innerHTML=s?.renderedSvg??"";let l=s?.getBoundingClientRect();l&&l.width>0&&(n.style.width=`${l.width}px`,n.style.height=`${l.height}px`),i.replaceWith(n)})}function ie(t){t.querySelectorAll("[data-click], [data-click-auto], [data-click-children], [data-click-stagger] > *").forEach(r=>{r.style.opacity="",r.style.transform="",r.style.filter="",r.style.pointerEvents="",r.querySelectorAll("path, line, polyline, polygon, circle, ellipse, rect").forEach(o=>{o.style.strokeDashoffset=""})})}function oe(t,r){let o=t.cloneNode(!0);return o.setAttribute("active",""),ie(o),te(t,o),re(t,o),ee(o,`-ov${r}`),o}async function ne(t,r,o,i){let u=i+":"+t.dataset.idx+":"+r.outerHTML,s=o.get(r);if(s?.key===u){t.insertBefore(s.thumb,t.firstChild),t.dataset.loaded="1",delete t.dataset.building;return}let n=Array.from(r.querySelectorAll("deck-mermaid")).map(f=>f.whenRendered).filter(f=>!!f);if(n.length&&await Promise.all(n).catch(()=>{}),!t.isConnected)return;s?.thumb.remove();let l=document.createElement("div");l.className="ov-thumb";let g=l.attachShadow({mode:"open"});for(let f of document.querySelectorAll('link[rel="stylesheet"], style'))g.appendChild(f.cloneNode(!0));let h=document.createElement("deck-root");h.setAttribute("data-overview-snapshot","");for(let f of["preview","no-hint","no-arrows","no-counter"])h.setAttribute(f,"");let b=r.closest("deck-root");for(let f of["width","height","class","lang","dir","style"]){let E=b?.getAttribute(f);E!=null&&h.setAttribute(f,E)}h.style.cssText+=";position:absolute;inset:0;width:100%;height:100%;",h.appendChild(oe(r,Number(t.dataset.idx))),g.appendChild(h),o.set(r,{key:u,thumb:l}),t.insertBefore(l,t.firstChild),t.dataset.loaded="1",delete t.dataset.building}function ae(t,r){let o=t.shadowRoot;if(!o)return()=>{};X(o);let i=o.querySelector("#overview-grid");i||(i=document.createElement("div"),i.id="overview-grid",o.appendChild(i));let u=K.get(t);u||(u=new Map,K.set(t,u));let s=new Set(r.slides);for(let[e,c]of u)s.has(e)||(c.thumb.remove(),u.delete(e));let n=Array.from(document.querySelectorAll('link[rel="stylesheet"], style')).filter(e=>!e.id.startsWith("rik-deck-")).map(e=>e.outerHTML).join("")+["width","height","class","lang","dir","style"].map(e=>t.getAttribute(e)).join("|"),l=n+r.slides.map(J).join("")+JSON.stringify(r.chapters.map(e=>e.startIdx)),g=R.get(t);if(g?.key===l)return i.querySelectorAll(".ov-cell").forEach(e=>{let c=Number(e.dataset.idx)===r.currentIdx;e.toggleAttribute("data-current",c),c?e.setAttribute("aria-current","true"):e.removeAttribute("aria-current")}),requestAnimationFrame(()=>{if(!t.hasAttribute("overview"))return;let e=i.querySelector(".ov-cell[data-current]");e?.scrollIntoView({block:"center"}),e?.focus({preventScroll:!0})}),g.dispose;g?.dispose(),i.innerHTML="";let h=r.slides.length,b=h>60,f=h>300?140:h>150?160:h>60?180:220;i.style.setProperty("--ov-cell-min",`${f}px`);let E=o.querySelector("#stage"),H=E?.clientWidth||window.innerWidth,Y=E?.clientHeight||window.innerHeight;i.style.setProperty("--ov-thumb-w",`${H}px`),i.style.setProperty("--ov-thumb-h",`${Y}px`);let W=new ResizeObserver(()=>{let e=i.querySelector(".ov-cell")?.clientWidth;e&&i.style.setProperty("--overview-scale",String(e/H))});W.observe(i),requestAnimationFrame(()=>{let e=i.querySelector(".ov-cell")?.clientWidth??f;i.style.setProperty("--overview-scale",String(e/H))});let S=document.createElement("div");S.className="ov-bar";let x=document.createElement("input");x.className="ov-search",x.type="search",x.placeholder=`Search ${h} slides \xB7 type to filter`,x.spellcheck=!1,S.appendChild(x);let q=document.createElement("span");q.className="ov-count",q.textContent=`${h} slides \xB7 ${r.chapters.length} chapters`,S.appendChild(q);let N=document.createElement("span");N.className="ov-hint",N.textContent="O \xB7 Esc \xB7 close",S.appendChild(N),i.appendChild(S);let C=document.createElement("div");C.className=`ov-body${b?"":" compact"}`,i.appendChild(C);let k=b?document.createElement("aside"):null;k&&(k.className="ov-aside",C.appendChild(k));let M=document.createElement("div");M.className=`ov-main${b?"":" ov-path"}`,C.appendChild(M);let $=[],z=[],P=new WeakMap,A=!1,T=[],I=!1,B=()=>{if(I||A||!T.length)return;I=!0;let e=()=>{I=!1,!A&&(T.shift()?.(),B())};"requestIdleCallback"in window?window.requestIdleCallback(e,{timeout:1e3}):setTimeout(e,32)},L=new IntersectionObserver(e=>{for(let c of e){if(!c.isIntersecting)continue;let a=c.target;if(a.dataset.loaded||a.dataset.building)continue;let p=P.get(a);if(!p)continue;a.dataset.building="1",L.unobserve(a);let d=()=>{ne(a,p,u,n).catch(w=>{let m=Number(a.dataset.tries??"0")+1;a.dataset.tries=String(m),console.warn("[rikiki/overview] thumbnail build failed",w),delete a.dataset.building,m<3&&!A&&L.observe(a)})};t.hasAttribute("overview")?d():(T.push(d),B())}},{root:null,rootMargin:"300px 0px",threshold:0});r.chapters.forEach((e,c)=>{let a=document.createElement("section");if(a.className="ov-chapter",a.id=`ov-chapter-${c}`,b){let d=document.createElement("header");d.className="ov-chapter-head";let w=document.createElement("span");w.className="ov-chapter-num",w.textContent=String(c+1).padStart(2,"0"),d.appendChild(w);let m=document.createElement("span");m.className="ov-chapter-title",m.textContent=G(e),d.appendChild(m);let v=document.createElement("span");v.className="ov-chapter-count",v.textContent=`${e.slides.length} slide${e.slides.length>1?"s":""}`,d.appendChild(v),a.appendChild(d)}let p=document.createElement("div");if(p.className="ov-row",e.slides.forEach((d,w)=>{if(!b&&w>0){let j=document.createElement("div");j.className="ov-connector",p.appendChild(j)}let m=e.startIdx+w,v=document.createElement("button");v.type="button",v.className="ov-cell",v.dataset.idx=String(m),v.dataset.search=U(d),m===r.currentIdx&&(v.dataset.current="1"),P.set(v,d),L.observe(v);let y=document.createElement("span");y.className="ov-cell-label",y.textContent=String(m+1),v.appendChild(y);let V=U(d).trim().slice(0,80);v.setAttribute("aria-label",`Slide ${m+1} of ${h}${V?` \xB7 ${V}`:""}`),m===r.currentIdx&&v.setAttribute("aria-current","true"),v.addEventListener("click",()=>r.onPick(m)),p.appendChild(v)}),a.appendChild(p),M.appendChild(a),$.push(a),k){let d=document.createElement("button");d.type="button",d.className="ov-aside-item",r.currentIdx>=e.startIdx&&r.currentIdx<e.startIdx+e.slides.length&&(d.dataset.active="1");let m=document.createElement("span");m.className="ov-aside-num",m.textContent=String(c+1).padStart(2,"0"),d.appendChild(m);let v=document.createElement("span");v.className="ov-aside-text",v.textContent=G(e);let y=document.createElement("div");y.className="ov-aside-count",y.textContent=`${e.slides.length} slide${e.slides.length>1?"s":""}`,v.appendChild(y),d.appendChild(v),d.addEventListener("click",()=>{a.scrollIntoView({behavior:"smooth",block:"start"})}),k.appendChild(d),z.push(d)}});let O=null;k&&(O=new IntersectionObserver(e=>{let c=e.filter(a=>a.isIntersecting).sort((a,p)=>a.boundingClientRect.top-p.boundingClientRect.top);if(c.length>0){let a=$.indexOf(c[0].target);a>=0&&z.forEach((p,d)=>{d===a?p.dataset.active="1":delete p.dataset.active})}},{root:M,rootMargin:"0px 0px -70% 0px",threshold:0}),$.forEach(e=>{O.observe(e)}));let _=i.querySelectorAll(".ov-cell");x.addEventListener("input",()=>{let e=x.value.trim().toLowerCase();if(!e){_.forEach(c=>{delete c.dataset.filteredOut});return}_.forEach(c=>{(c.dataset.search||"").includes(e)?delete c.dataset.filteredOut:c.dataset.filteredOut="1"})}),requestAnimationFrame(()=>{if(!t.hasAttribute("overview"))return;let e=i.querySelector(".ov-cell[data-current]");e&&(e.scrollIntoView({block:"center"}),e.focus({preventScroll:!0}))}),i.addEventListener("keydown",e=>{let c=e.key;if(c!=="ArrowLeft"&&c!=="ArrowRight")return;let a=[...i.querySelectorAll(".ov-cell")].filter(w=>!w.dataset.filteredOut),p=a.indexOf(document.activeElement);if(p<0)return;e.preventDefault();let d=a[p+(c==="ArrowRight"?1:-1)];d?.focus(),d?.scrollIntoView({block:"nearest"})});let D=()=>{A=!0,W.disconnect(),T.length=0,R.delete(t),O?.disconnect(),L.disconnect(),i&&(i.innerHTML="")};return R.set(t,{key:l,dispose:D}),D}export{ae as mountOverview};
