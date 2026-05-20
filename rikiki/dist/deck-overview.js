var u="data-deck-overview",w="data-overview-tokens",f=`
  :host([overview]) ::slotted(*) { display: none !important; }
  :host([overview]) #overview-grid {
    position: fixed; inset: 0;
    display: flex; flex-direction: column;
    gap: 28px;
    padding: 32px 48px;
    background: var(--bg);
    overflow: auto;
    z-index: 80;
  }
  :host([overview]) .ov-row { display: flex; gap: 14px; align-items: center; flex-wrap: wrap; }
  :host([overview]) .ov-row-label {
    flex: 0 0 200px;
    font: 700 0.72rem/1.3 var(--mono);
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--muted);
    padding-right: 12px;
    text-align: right;
    white-space: normal;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
  }
  :host([overview]) .ov-cell {
    position: relative;
    flex: 0 0 auto;
    width: clamp(160px, 14vw, 260px);
    aspect-ratio: 16 / 9;
    background: var(--card);
    border: 2px solid var(--border);
    border-radius: var(--r-md);
    overflow: hidden;
    cursor: pointer;
    transition: border-color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
    box-shadow: var(--shadow-card);
  }
  :host([overview]) .ov-connector {
    flex: 0 0 auto;
    width: 16px; height: 2px;
    background: var(--border);
  }
  :host([overview]) .ov-cell:hover {
    transform: translateY(-2px);
    border-color: var(--yellow-soft);
    box-shadow: var(--shadow-hover);
  }
  :host([overview]) .ov-cell[data-current] {
    border-color: var(--yellow);
    box-shadow: 0 0 0 3px rgba(247, 203, 68, 0.35);
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
    font: 700 0.72rem/1 var(--mono);
    color: var(--text);
    background: rgba(255, 255, 255, 0.9);
    padding: 3px 7px; border-radius: 4px;
    z-index: 2;
    pointer-events: none;
  }
  :host(:not([overview])) #overview-grid { display: none; }
`;function g(o){if(o.querySelector(`style[${u}]`))return;let r=document.createElement("style");r.setAttribute(u,"1"),r.textContent=f,o.appendChild(r)}function y(o,r){if(o.querySelector(`link[${w}]`))return;let t=document.createElement("link");t.rel="stylesheet",t.setAttribute(w,"1"),t.href=new URL("../tokens.css",r).href,o.appendChild(t)}function E(o){let t=o.slides[0]?.querySelector("h1");return t?Array.from(t.childNodes).map(e=>e.nodeName==="BR"?" ":e.textContent??"").join("").replace(/\s+/g," ").trim()||`Slide ${o.startIdx+1}`:`Slide ${o.startIdx+1}`}function k(o,r){let t=o.shadowRoot;if(!t)return()=>{};g(t),y(t,import.meta.url);let e=t.querySelector("#overview-grid");e||(e=document.createElement("div"),e.id="overview-grid",t.appendChild(e)),e.innerHTML="";let v=window.innerWidth,x=window.innerHeight;return e.style.setProperty("--ov-thumb-w",`${v}px`),e.style.setProperty("--ov-thumb-h",`${x}px`),requestAnimationFrame(()=>{let i=e.querySelector(".ov-cell")?.clientWidth??360;e.style.setProperty("--overview-scale",String(i/v))}),r.chapters.forEach(i=>{let a=document.createElement("div");a.className="ov-row";let s=document.createElement("span");s.className="ov-row-label",s.textContent=E(i),a.appendChild(s),i.slides.forEach((b,p)=>{if(p>0){let h=document.createElement("div");h.className="ov-connector",a.appendChild(h)}let l=i.startIdx+p,n=document.createElement("div");n.className="ov-cell",l===r.currentIdx&&(n.dataset.current="1");let d=document.createElement("div");d.className="ov-thumb";let m=b.cloneNode(!0);m.setAttribute("active",""),d.appendChild(m),n.appendChild(d);let c=document.createElement("span");c.className="ov-cell-label",c.textContent=String(l+1),n.appendChild(c),n.addEventListener("click",()=>r.onPick(l)),a.appendChild(n)}),e.appendChild(a)}),()=>{e&&(e.innerHTML="")}}export{k as mountOverview};
