var c=Object.defineProperty;var p=Object.getOwnPropertyDescriptor;var d=(s,n,o,e)=>{for(var r=e>1?void 0:e?p(n,o):n,i=s.length-1,t;i>=0;i--)(t=s[i])&&(r=(e?t(n,o,r):t(r))||r);return e&&r&&c(n,o,r),r};import{LitElement as v,html as f,css as g}from"https://cdn.jsdelivr.net/npm/lit@3/+esm";import{customElement as h,state as b}from"https://cdn.jsdelivr.net/npm/lit@3/decorators.js/+esm";import{marked as l}from"https://cdn.jsdelivr.net/npm/marked@12/+esm";l.setOptions({gfm:!0,breaks:!1});var a=class extends v{constructor(){super(...arguments);this._html=""}connectedCallback(){super.connectedCallback(),this._parse()}_parse(){let o=this.textContent??"",e=o.split(`
`),r=e.filter(t=>t.trim().length>0).reduce((t,m)=>Math.min(t,m.match(/^ */)?.[0].length??0),1/0),i=r===1/0?o:e.map(t=>t.slice(r)).join(`
`);this._html=l.parse(i.trim()),this.textContent=""}render(){return f`<div class="content" .innerHTML="${this._html}"></div>`}};a.styles=g`
    :host { display: block; color: var(--soft); font-family: var(--sans); }
    h1, h2, h3, h4 { color: var(--text); font-weight: 700; letter-spacing: -0.01em; }
    h2 { font-size: var(--fs-h2); margin-bottom: var(--sp-2); }
    h3 { font-size: var(--fs-lead); margin-bottom: var(--sp-2); margin-top: var(--sp-3); }
    h4 { font-size: var(--fs-body); margin-bottom: var(--sp-1); margin-top: var(--sp-3); }
    p { font-size: var(--fs-body); line-height: 1.65; margin: 0 0 var(--sp-3); }
    p:last-child { margin-bottom: 0; }
    strong { color: var(--text); font-weight: 700; }
    em { font-style: italic; }
    code {
      font-family: var(--mono); font-size: var(--fs-mono-sm);
      background: var(--surface-tint); padding: 2px 6px;
      border-radius: var(--r-sm); color: var(--text);
    }
    pre {
      background: var(--deck-md-pre-bg, var(--code-bg));
      border: 1px solid var(--deck-md-pre-border, var(--code-border));
      border-radius: var(--r-md);
      padding: var(--sp-3) var(--sp-4);
      overflow: auto;
      font-family: var(--mono); font-size: var(--fs-mono);
      line-height: 1.75; color: var(--deck-md-pre-text, var(--code-text));
      margin: 0 0 var(--sp-3);
      box-shadow: var(--shadow-card);
    }
    pre code { background: none; padding: 0; color: inherit; border-radius: 0; }
    ul, ol { padding-left: 1.4rem; margin: 0 0 var(--sp-3); }
    li { margin-bottom: var(--sp-1); font-size: var(--fs-body); line-height: 1.55; }
    li::marker { color: var(--yellow); }
    a { color: var(--yellow); text-decoration: underline; text-decoration-thickness: 1px; }
    blockquote {
      border-left: 3px solid var(--yellow);
      padding: var(--sp-1) var(--sp-3);
      color: var(--muted); font-style: italic;
      margin: 0 0 var(--sp-3);
    }
    hr { border: none; border-top: 1px solid var(--border); margin: var(--sp-4) 0; }
    .content { display: contents; }
  `,d([b()],a.prototype,"_html",2),a=d([h("deck-md")],a);export{a as DeckMd};
