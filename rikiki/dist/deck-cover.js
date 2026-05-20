var g=Object.defineProperty;var b=Object.getOwnPropertyDescriptor;var e=(p,n,o,s)=>{for(var a=s>1?void 0:s?b(n,o):n,d=p.length-1,i;d>=0;d--)(i=p[d])&&(a=(s?i(n,o,a):i(a))||a);return s&&a&&g(n,o,a),a};import{LitElement as u,html as l,css as x}from"https://cdn.jsdelivr.net/npm/lit@3/+esm";import{customElement as y,property as r}from"https://cdn.jsdelivr.net/npm/lit@3/decorators.js/+esm";import{css as c}from"https://cdn.jsdelivr.net/npm/lit@3/+esm";var v=c`
  :host {
    display: none;
    position: absolute;
    inset: 0;
    padding: var(--slide-pad-y) var(--slide-pad-x);
    flex-direction: column;
    overflow: hidden;
    background: var(--bg);
    font-family: var(--sans);
    color: var(--text);
  }
  :host([active]) { display: flex; }
`,f=c`
  h1 {
    font-size: var(--fs-h1);
    font-weight: 700;
    color: var(--text);
    letter-spacing: -0.022em;
    line-height: 1.15;
    margin-bottom: var(--sp-4);
    padding-bottom: var(--sp-2);
    border-bottom: 3px solid var(--yellow);
    display: inline-block;
    align-self: flex-start;
    flex: 0 0 auto;
  }
  h1 .accent { color: var(--yellow); }
  ::slotted(p), p {
    font-size: var(--fs-body);
    line-height: 1.65;
    color: var(--soft);
    margin: 0;
  }
  ::slotted(strong), strong { color: var(--text); font-weight: 700; }
  ::slotted(code), code {
    font-family: var(--mono);
    font-size: var(--fs-mono-sm);
    background: rgba(0,0,0,0.06);
    padding: 2px 6px;
    border-radius: var(--r-sm);
    color: var(--text);
  }
`,h=c`
  .lbl {
    display: inline-block;
    padding: 4px 12px;
    background: var(--yellow);
    color: var(--dark);
    border-radius: 9999px;
    font-size: var(--fs-micro);
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    margin-bottom: var(--sp-1);
    align-self: flex-start;
  }
  .lead {
    font-size: var(--fs-lead);
    color: var(--muted);
    line-height: 1.5;
    margin-bottom: var(--sp-4);
    max-width: 75ch;
    flex: 0 0 auto;
  }
  .kicker {
    font-size: var(--fs-micro);
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: var(--sp-3);
    display: block;
  }
  .kicker.on-dark { color: rgba(255,255,255,0.35); }
  .caption {
    font-size: var(--fs-small);
    color: var(--muted);
    line-height: 1.55;
  }
  .caption.on-dark { color: rgba(255,255,255,0.5); }
  .col-label {
    font-size: var(--fs-micro);
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: var(--sp-2);
  }
`,m=[v,f,h];var t=class extends u{render(){let n=(this.brand??"").split("\xB7").map(i=>i.trim()).filter(Boolean),o=n[0]??"",s=n.slice(1).join(" \xB7 "),a=[this.speaker&&{l:this.speakerLabel??"Pr\xE9sent\xE9 par",v:this.speaker},this.company&&{l:this.companyLabel??"Entreprise",v:this.company},this.duration&&{l:this.durationLabel??"Dur\xE9e",v:this.duration},this.audience&&{l:this.audienceLabel??"Audience",v:this.audience},this.runtime&&{l:this.runtimeLabel??"Runtime",v:this.runtime}].filter(i=>!!i),d=!!this.brandSrc;return l`
      <div class="brand" part="brand">
        ${d?l`<span class="brand-tile"><img src="${this.brandSrc}" alt="${o}"></span>`:""}
        ${o?l`<span class="brand-name">${o}</span>`:""}
        ${s?l`<span class="brand-context">${s}</span>`:""}
      </div>
      <slot></slot>
      ${a.length?l`
        <div class="meta" part="meta">
          ${a.map(i=>l`
            <div class="meta-item"><strong>${i.l}</strong><span>${i.v}</span></div>
          `)}
        </div>`:""}
    `}};t.styles=[...m,x`
    :host {
      background: var(--deck-cover-bg, var(--dark));
      justify-content: center;
      color: var(--deck-cover-text, var(--on-dark-text));
    }
    .brand {
      display: inline-flex; align-items: center; gap: var(--sp-3);
      margin-bottom: var(--sp-5);
      align-self: flex-start;
    }
    .brand-tile {
      width: 64px; height: 64px;
      display: inline-flex; align-items: center; justify-content: center;
    }
    .brand-tile img { width: 100%; height: 100%; display: block; }
    .brand-name {
      font-family: var(--display, inherit);
      font-size: var(--fs-micro); font-weight: 700;
      letter-spacing: 0.2em; text-transform: uppercase;
      color: var(--deck-cover-soft, var(--on-dark-soft));
    }
    .brand-context {
      font-size: var(--fs-micro); font-weight: 700;
      color: var(--deck-cover-muted, var(--on-dark-muted));
      letter-spacing: 0.2em; text-transform: uppercase;
      padding-left: var(--sp-3);
      border-left: 1px solid var(--deck-cover-border, var(--on-dark-border));
    }
    ::slotted(h1) {
      font-size: clamp(3.6rem, 9vw, 8.5rem); font-weight: 900;
      color: var(--deck-cover-text, var(--on-dark-text));
      line-height: 1.02; letter-spacing: -0.035em;
      margin-bottom: var(--sp-4);
      border: none; padding: 0;
    }
    ::slotted(.sub) {
      font-size: var(--fs-h2);
      color: var(--deck-cover-muted, var(--on-dark-muted));
      margin-bottom: var(--sp-6); max-width: 60ch; line-height: 1.45;
      display: block;
    }
    .meta {
      display: flex; gap: var(--sp-6);
      border-top: 1px solid var(--deck-cover-border, var(--on-dark-border));
      padding-top: var(--sp-4);
    }
    .meta-item strong {
      display: block; font-size: var(--fs-micro); letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--deck-cover-faint, var(--on-dark-faint));
      margin-bottom: 6px; font-weight: 700;
    }
    .meta-item span {
      color: var(--deck-cover-text, var(--on-dark-text));
      font-size: var(--fs-body); font-weight: 600;
    }
  `],e([r({type:String})],t.prototype,"brand",2),e([r({type:String,attribute:"brand-src"})],t.prototype,"brandSrc",2),e([r({type:String})],t.prototype,"speaker",2),e([r({type:String})],t.prototype,"company",2),e([r({type:String})],t.prototype,"duration",2),e([r({type:String})],t.prototype,"audience",2),e([r({type:String})],t.prototype,"runtime",2),e([r({type:String,attribute:"speaker-label"})],t.prototype,"speakerLabel",2),e([r({type:String,attribute:"company-label"})],t.prototype,"companyLabel",2),e([r({type:String,attribute:"duration-label"})],t.prototype,"durationLabel",2),e([r({type:String,attribute:"audience-label"})],t.prototype,"audienceLabel",2),e([r({type:String,attribute:"runtime-label"})],t.prototype,"runtimeLabel",2),t=e([y("deck-cover")],t);export{t as DeckCover};
