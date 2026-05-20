var v=Object.defineProperty;var p=Object.getOwnPropertyDescriptor;var a=(n,t,s,o)=>{for(var e=o>1?void 0:o?p(t,s):t,l=n.length-1,i;l>=0;l--)(i=n[l])&&(e=(o?i(t,s,e):i(e))||e);return o&&e&&v(t,s,e),e};import{LitElement as c,html as d,css as g}from"https://cdn.jsdelivr.net/npm/lit@3/+esm";import{customElement as y,property as m}from"https://cdn.jsdelivr.net/npm/lit@3/decorators.js/+esm";var f={yellow:"var(--yellow)",orange:"var(--orange)",green:"var(--green)",red:"var(--red)",purple:"var(--purple)",lime:"var(--lime)",cyan:"var(--cyan)"},r=class extends c{updated(){this.tone?this.style.setProperty("--_c",f[this.tone]??this.tone):this.style.removeProperty("--_c")}render(){return d`
      ${this.num?d`<div class="num" part="num">${this.num}</div>`:""}
      <slot name="claim"></slot>
      <div class="body" part="body"><slot></slot></div>
    `}};r.styles=g`
    :host {
      display: flex; flex-direction: column;
      gap: var(--sp-2);
      padding: var(--sp-4) var(--sp-3);
      border-left: 4px solid var(--_c, var(--yellow));
      min-width: 0;
      font-family: var(--sans);
    }
    .num {
      font-family: var(--display, var(--sans));
      font-size: clamp(3.5rem, 7vw, 6rem);
      font-weight: 900;
      line-height: 0.9;
      color: var(--_c, var(--yellow));
      letter-spacing: -0.04em;
    }
    ::slotted([slot="claim"]) {
      font-family: var(--display, var(--sans));
      font-size: var(--fs-strong);
      font-weight: 800;
      color: var(--text);
      line-height: 1.1;
      letter-spacing: -0.02em;
      margin: 0;
    }
    .body {
      font-size: var(--fs-body);
      color: var(--muted);
      line-height: 1.45;
      margin-top: var(--sp-2);
    }
    ::slotted(strong) { color: var(--text); font-weight: 700; }
    ::slotted(code) {
      font-family: var(--mono); font-size: var(--fs-mono-sm);
      background: var(--surface-tint); color: var(--text);
      padding: 2px 6px; border-radius: var(--r-sm);
    }
  `,a([m({type:String})],r.prototype,"num",2),a([m({type:String})],r.prototype,"tone",2),r=a([y("deck-stat")],r);export{r as DeckStat};
