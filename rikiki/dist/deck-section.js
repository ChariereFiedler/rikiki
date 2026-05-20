var p=Object.defineProperty;var f=Object.getOwnPropertyDescriptor;var l=(a,o,n,r)=>{for(var e=r>1?void 0:r?f(o,n):o,s=a.length-1,i;s>=0;s--)(i=a[s])&&(e=(r?i(o,n,e):i(e))||e);return r&&e&&p(o,n,e),e};import{LitElement as x,html as m,css as b}from"https://cdn.jsdelivr.net/npm/lit@3/+esm";import{customElement as u,property as k}from"https://cdn.jsdelivr.net/npm/lit@3/decorators.js/+esm";import{css as c}from"https://cdn.jsdelivr.net/npm/lit@3/+esm";var g=c`
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
`,v=c`
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
`,d=[g,v,h];var t=class extends x{render(){return m`
      ${this.num?m`<div class="sec-num" part="num">${this.num}</div>`:""}
      <slot></slot>
    `}};t.styles=[...d,b`
    :host {
      background: var(--deck-section-bg, var(--dark));
      color: var(--on-dark-text);
      justify-content: center; align-items: center; text-align: center;
    }
    .sec-num {
      font-size: var(--fs-micro); font-weight: 700; letter-spacing: 0.16em;
      text-transform: uppercase;
      color: var(--deck-section-num-color, var(--on-dark-faint));
      margin-bottom: var(--sp-3);
      display: inline-flex; align-items: center; gap: 0.8rem;
      font-family: var(--mono);
    }
    .sec-num::before, .sec-num::after {
      content: ''; width: 32px; height: 1px;
      background: var(--deck-section-rule-color, var(--on-dark-border));
    }
    ::slotted(h1) {
      font-size: var(--fs-section); font-weight: 900;
      color: var(--deck-section-title-color, var(--yellow));
      line-height: 1.02; letter-spacing: -0.03em;
      max-width: 18ch;
      border: none; padding: 0; margin: 0;
      text-align: center; align-self: center;
    }
    ::slotted(h1 em) {
      color: var(--deck-section-em-color, var(--on-dark-soft));
      font-style: normal; font-weight: 700;
    }
  `],l([k({type:String})],t.prototype,"num",2),t=l([u("deck-section")],t);export{t as DeckSection};
