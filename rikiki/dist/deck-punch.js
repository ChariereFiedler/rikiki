var p=Object.defineProperty;var d=Object.getOwnPropertyDescriptor;var r=(n,i,a,o)=>{for(var t=o>1?void 0:o?d(i,a):i,l=n.length-1,c;l>=0;l--)(c=n[l])&&(t=(o?c(i,a,t):c(t))||t);return o&&t&&p(i,a,t),t};import{LitElement as v,html as y,css as m}from"https://cdn.jsdelivr.net/npm/lit@3/+esm";import{customElement as f,property as s}from"https://cdn.jsdelivr.net/npm/lit@3/decorators.js/+esm";var g={warn:"var(--orange)",danger:"var(--red)",ok:"var(--green)",info:"var(--yellow)",muted:"var(--muted)",accent:"var(--yellow)"},h={lead:"var(--fs-lead)",big:"var(--fs-big)",mega:"var(--fs-mega)",stat:"var(--fs-stat)",display:"clamp(2.6rem, 6vw, 5rem)"},e=class extends v{updated(){this.tone&&g[this.tone]?this.style.setProperty("--_color",g[this.tone]):this.style.removeProperty("--_color"),this.size&&h[this.size]?this.style.setProperty("--_size",h[this.size]):this.style.removeProperty("--_size")}render(){return y`<slot></slot>`}};e.styles=m`
    :host {
      display: block;
      margin: 0;
      font-family: var(--display, var(--sans));
      font-weight: 900;
      line-height: 1.1;
      letter-spacing: -0.02em;
      font-size: var(--deck-punch-size, var(--_size, var(--fs-lead)));
      /* "inherit" lets us pick up the on-dark color of cover/hook/section · the
         color is only overridden when a tone is explicitly chosen. */
      color:     var(--deck-punch-color, var(--_color, inherit));
    }
    :host([weight="700"]) { font-weight: 700; }
    :host([weight="800"]) { font-weight: 800; }
    :host([align="center"]) { text-align: center; }
    :host([align="right"])  { text-align: right; }
  `,r([s({type:String})],e.prototype,"tone",2),r([s({type:String})],e.prototype,"size",2),r([s({type:String,reflect:!0})],e.prototype,"weight",2),r([s({type:String,reflect:!0})],e.prototype,"align",2),e=r([f("deck-punch")],e);export{e as DeckPunch};
