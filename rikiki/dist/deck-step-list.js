var g=Object.defineProperty;var u=Object.getOwnPropertyDescriptor;var s=(t,o,l,n)=>{for(var r=n>1?void 0:n?u(o,l):o,i=t.length-1,d;i>=0;i--)(d=t[i])&&(r=(n?d(o,l,r):d(r))||r);return n&&r&&g(o,l,r),r};import{LitElement as v,html as p,css as f}from"https://cdn.jsdelivr.net/npm/lit@3/+esm";import{customElement as m,property as c}from"https://cdn.jsdelivr.net/npm/lit@3/decorators.js/+esm";var e=class extends v{render(){return p`<slot></slot>`}};e.styles=f`
    :host {
      display: flex; flex-direction: column;
      gap: var(--gap-xs);
    }
  `,e=s([m("deck-step-list")],e);var a=class extends v{render(){return p`
      <span class="step-num">${this.n}</span>
      <span class="label"><slot></slot></span>
      ${this.note?p`<span class="chip">${this.note}</span>`:""}
    `}};a.styles=f`
    :host {
      display: flex; align-items: center; gap: var(--sp-3);
      background: var(--surface-card);
      border: 1px solid var(--border);
      border-radius: var(--r-md);
      padding: var(--gap-xs) var(--sp-3);
      box-shadow: var(--shadow-card);
      font-family: var(--sans);
      font-size: var(--fs-body);
    }
    .step-num {
      flex: 0 0 auto;
      width: var(--icon-sm); height: var(--icon-sm);
      display: inline-flex; align-items: center; justify-content: center;
      background: var(--yellow); color: var(--dark);
      border-radius: 50%;
      font: 700 var(--fs-micro)/1 var(--sans);
    }
    .label {
      flex: 1;
      font-family: var(--mono); font-weight: 600;
      color: var(--text);
    }
    .chip {
      flex: 0 0 auto;
      display: inline-block;
      padding: 2px var(--sp-2);
      background: var(--surface-tint);
      color: var(--muted);
      border-radius: var(--r-pill);
      font: 600 var(--fs-small)/1.4 var(--sans);
    }
  `,s([c({type:String})],a.prototype,"n",2),s([c({type:String})],a.prototype,"note",2),a=s([m("deck-step")],a);export{a as DeckStep,e as DeckStepList};
