var te=Object.defineProperty;var ne=Object.getOwnPropertyDescriptor;var S=(t,e,n,r)=>{for(var o=r>1?void 0:r?ne(e,n):e,s=t.length-1,i;s>=0;s--)(i=t[s])&&(o=(r?i(e,n,o):i(o))||o);return r&&o&&te(e,n,o),o};import{LitElement as Oe,css as ye}from"./vendor/lit.js";import{property as J}from"./vendor/lit.js";var re='{"check":"M20 6 9 17l-5-5","cross":"M18 6 6 18M6 6l12 12","alert":"M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z","info":"M12 16v-4m0-4h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z","question":"M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3m.1 4h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z","ban":"M4.9 4.9l14.2 14.2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z","arrow":"M5 12h14m-6-6 6 6-6 6","arrow-down":"M12 5v14m6-6-6 6-6-6","clock":"M12 6v6l4 2m6-2a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z","calendar":"M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z","refresh":"M21 12a9 9 0 1 1-3-6.7M21 3v6h-6","trend":"M22 7 13.5 15.5l-5-5L2 17M16 7h6v6","user":"M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z","team":"M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Zm10 14v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8","target":"M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0-6a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 9a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z","flag":"M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1Zm0 0v7","lock":"M7 11V7a5 5 0 0 1 10 0v4M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z","search":"M21 21l-4.3-4.3M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z","code":"M16 18l6-6-6-6M8 6l-6 6 6 6","database":"M3 5c0 1.7 4 3 9 3s9-1.3 9-3-4-3-9-3-9 1.3-9 3Zm0 0v14c0 1.7 4 3 9 3s9-1.3 9-3V5M3 12c0 1.7 4 3 9 3s9-1.3 9-3","cloud":"M17.5 19a4.5 4.5 0 0 0 0-9h-1.3A7 7 0 1 0 4 16.9","document":"M14 2v6h6M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Zm-6 11h8m-8 4h8m-8-8h2","chart":"M3 3v18h18M7 16V9m5 7V5m5 11v-4","spark":"M12 2 15 9l7 3-7 3-3 7-3-7-7-3 7-3Z"}',L=Object.freeze(JSON.parse(re)),Fe=Object.keys(L);function O(t){return t?L[t.trim().toLowerCase()]??null:null}var u=1600,$e=Object.freeze({label:{size:31,weight:650,line:38},note:{size:25,weight:400,line:34},tag:{size:23,weight:600,line:30},value:{size:56,weight:750,line:64}}),We=.8,m=4;function Be(t,e=1600){return`${-m} ${-m} ${e+2*m} ${t+2*m}`}var A=620,Ve=600,k=.88,oe=28,D=32,f=Object.freeze({cards:{min:2,max:5},steps:{min:1,max:6},bars:{min:2,max:8},matrix:{min:1,max:6},ranges:{min:1,max:8},lanes:{min:2,max:5},units:{min:1,max:3}});function y(t,e,n,r){let o=t.trim().split(/[ \t\n\r]+/).filter(Boolean),s=[],i="",a=!0;for(let c of o){let l=i?`${i} ${c}`:c;if(n(l)<=e){i=l;continue}i&&s.push(i),i=c,n(c)>e&&(a=!1)}return i&&s.push(i),{lines:s,fits:a&&s.length<=r}}function Ke(t,e,n,r,o){let s=y(t,e,o(r),n);if(s.fits)return{...s,size:r};let i=Math.round(r*k);return{...y(t,e,o(i),n),size:i}}function Xe(t,e=D,n=1600){let r=Math.max(1,t),o=(n-e*(r-1))/r;return{width:o,xs:Array.from({length:r},(s,i)=>i*(o+e))}}var je=f.bars.max;var se=48;var ie=16,Ze=(se-ie)/2;function d(t){let e=(t??"").replace(/\s/g,"").replace(",",".");if(!e)return null;let n=Number(e);return Number.isFinite(n)?n:null}var h=4,b=2,T=Object.freeze({sources:.3,hub:.22,outcomes:.26}),Qe=(1-T.sources-T.hub-T.outcomes)/2;function G(t,e){let n=t.findIndex(e),r=n>=0?n:t.length-1;return{sources:t.slice(0,Math.max(0,r)).slice(0,h),hub:t[r],outcomes:t.slice(r+1,r+1+b)}}var N=8,P=3;var ae=10,ce=6,nt=2*ae+ce;function U(t,e){if(t==null||t.trim()==="")return{value:e,valid:!0};let n=Number(t),r=Number.isInteger(n)&&n>=0&&n<=N;return{value:r?n:e,valid:r}}var I=400,F=100,M=12,ue=44,le=340,v=.25,me=2.2,g=40;function E(t,e,n,r){if(t==null||t.trim()==="")return{value:e,valid:!0};let o=Number(t),s=Number.isInteger(o)&&o>=n&&o<=r;return{value:s?o:e,valid:s}}var de=48;function H(t,e=1600){let n=Math.max(1,t);return(e-de*(n-1))/n}function $(t){return Math.min(g,Math.max(1,Math.ceil(Math.sqrt(t*me))))}function pe(t,e,n,r=le){let o=Math.ceil(t/e),s=Math.ceil(t/o),i=Math.min(ue,n/(s+(s-1)*v),r/(o+(o-1)*v)),a=i*v;return{columns:s,rows:o,cell:i,gap:a,width:s*i+(s-1)*a,height:o*i+(o-1)*a}}function W(t,e,n){return pe(t,e,n).cell>=M}var w=["prod","pilot","test","announced","none"];var it=Object.freeze({prod:"in production",pilot:"pilot",test:"in test",announced:"announced",none:"nothing yet"});var fe=t=>(t??"").split("|").map(e=>e.trim()).filter(Boolean);function B(t){return fe(t).slice(0,12)}function p(t){if(t===null||t.trim()==="")return null;let e=Number(t);return Number.isFinite(e)?e:null}var he=["cards","steps","flow","bars","matrix","ranges","lanes","units"];function R(t){let e=t.toLowerCase().replace(/^deck-scene-/,"");return he.includes(e)?e:null}var be=["label","note","icon","tag","value","level","from","to","emphasis"],ge=Object.freeze({cards:["label","note","icon","tag","emphasis"],steps:["label","note","tag","emphasis"],flow:["label","note","icon","tag","emphasis"],bars:["label","note","tag","value","emphasis"],matrix:["label","level","emphasis"],ranges:["label","note","tag","from","to"],lanes:["label","note","icon","tag"],units:["label","note","icon","value","emphasis"]});function z(t,e,n){if(!e.length)return null;let r=e.map(s=>`${s.item} \xB7 ${s.field}`),o=e.filter(s=>s.measured!==void 0&&s.budget!==void 0).map(s=>`${s.item} \xB7 ${s.field} needs ${Math.round(s.measured??0)} of ${Math.round(s.budget??0)} units`);return{code:"SCENE_TEXT_TOO_LONG",severity:"error",items:r,fields:e,...n?{scene:{kind:t,...n}}:{},message:`a ${t} scene could not fit ${r.join(", ")} even one size down \xB7 drawn anyway, past its box${o.length?` (${o.join("; ")})`:""}`}}var V=2,Ee=h+1+b,K=4,_e=/(?<=[.!?…])\s+(?=\p{Lu})/u,_=(t,e)=>t.label?.trim()||`item ${e+1}`,Y=t=>t.trim().split(/\s+/).filter(Boolean);function j(t,e,n){return e<=A?null:{code:"SCENE_TOO_TALL",severity:"error",items:[`${n} ${n===1?"item":"items"}, ${Math.round(e)} units tall`],message:`a slide leaves room for about ${A} units and this ${t} scene is taller \xB7 the slide clips it \xB7 fewer items, or split the slide`}}function Z(t,e,n={}){let r=[],o=(i,a,c,l)=>{c.length&&r.push({code:i,severity:a,items:c,message:l})},s=i=>e.flatMap((a,c)=>i(a,c)?[_(a,c)]:[]);return Te(t,e,o),o("SCENE_ITEM_NO_LABEL","error",s(i=>!i.label?.trim()),"an item has no label \xB7 the scene would draw it as an empty box"),o("SCENE_ATTRIBUTE_IGNORED","warning",e.flatMap((i,a)=>xe(t,i).map(c=>`${_(i,a)} \xB7 ${c}`)),`a ${t} scene does not read this attribute \xB7 it is dropped, and the picture does not change`),o("SCENE_ICON_UNKNOWN","error",s(i=>!!i.icon&&!O(i.icon)),"the icon is not in the 24-glyph set \xB7 it draws nothing, silently"),t==="bars"&&(o("SCENE_VALUE_INVALID","error",s(i=>d(i.value)===null),"`value` is missing or is not a number \xB7 the bar is drawn flat"),Ne(e,n,o,s)),t==="ranges"&&(o("SCENE_VALUE_INVALID","error",s(we),Me),Ie(n,o,s)),t==="matrix"&&Le(n,o,s),t==="lanes"&&Ce(n,o),t==="units"&&Re(e,n,o,s),o("SCENE_EMPHASIS_MANY","warning",t==="bars"?Ae(e):q(e),"more than one item is emphasised \xB7 the scene puts one forward, and two are none"),o("SCENE_LABEL_LONG","warning",s(i=>Y(i.label??"").length>K),`a label past ${K} words reads as a sentence \xB7 one to three words, the detail goes in the note`),o("SCENE_NOTE_LONG","warning",s(i=>(i.note??"").trim().split(_e).length>1),"a note of more than one sentence \xB7 the scene is read from the back of the room, one sentence each"),r}function xe(t,e){let n=ge[t];return be.filter(r=>(r==="emphasis"?e.emphasis:e[r]!==null)&&!n.includes(r))}var Se=t=>t.flatMap((e,n)=>e.emphasis?[_(e,n)]:[]),q=t=>{let e=Se(t);return e.length>1?e:[]};function Ae(t){let e=[];for(let n of t){let r=e.at(-1);r&&(r[0].note??"")===(n.note??"")?r.push(n):e.push([n])}return e.flatMap(q)}function Te(t,e,n){let r=i=>_(i,e.indexOf(i));if(t==="flow"){let i=G(e,c=>c.emphasis),a=new Set([...i.sources,i.hub,...i.outcomes]);n("SCENE_ITEMS_DROPPED","error",e.filter(c=>!a.has(c)).map(r),`a flow draws ${h} sources before the hub and ${b} outcomes after it at most \xB7 these are not drawn`),e.length<V&&X(n,e.length,V,Ee);return}let{min:o,max:s}=f[t];n("SCENE_ITEMS_DROPPED","error",e.slice(s).map(r),`a ${t} scene draws at most ${s} items \xB7 these are not drawn`),e.length<o&&X(n,e.length,o,s)}function X(t,e,n,r){t("SCENE_TOO_FEW_ITEMS","error",[`${e} item${e===1?"":"s"}`],`the scene is built for ${n} to ${r} items \xB7 with ${e} it has nothing to compare`)}function C(t,e){if(!t?.trim())return null;let n=e(t);return n!==null&&n>0?n:!1}function Ne(t,e,n,r){let o=C(e.max,d),s=C(e.height,d);n("SCENE_ATTRIBUTE_INVALID","error",[...o===!1?["max"]:[],...s===!1?["height"]:[]],"`max` and `height` must be positive numbers \xB7 the scene drew its default instead"),typeof o=="number"&&n("SCENE_VALUE_CLIPPED","error",r(i=>{let a=d(i.value);return a!==null&&(a>o||a<0)}),`a value is past the scale (0 to ${o}) \xB7 its bar stops at the edge, so it is not the size it says \xB7 raise \`max\``),n("SCENE_GROUP_SPLIT","warning",ve(t),"a note comes back after another \xB7 only neighbours with the same note share a group, so these are drawn as separate groups \xB7 keep the items of a group together")}function ve(t){let e=new Set,n=new Set,r=null;for(let o of t){let s=(o.note??"").trim();s&&s!==r&&e.has(s)&&n.add(s),s&&e.add(s),r=s}return[...n]}function Ie(t,e,n){let r=C(t.scale,s=>p(s));if(e("SCENE_ATTRIBUTE_INVALID","error",r===!1?["scale"]:[],"`scale` must be a positive number \xB7 the scene fitted the scale to the rows instead"),typeof r!="number")return;let o=s=>{let i=p(s);return i!==null&&(i>r||i<0)};e("SCENE_VALUE_CLIPPED","error",n(s=>o(s.from)||o(s.to)),`a bound is past the scale (0 to ${r}) \xB7 the bar stops at the edge, so it is not the length it says \xB7 raise \`scale\``)}var Me="`from` and `to` must be numbers when written, with `from` first \xB7 otherwise the bar lands where the scene guessed";function we(t){let e=p(t.from),n=p(t.to),r=!!t.from?.trim(),o=!!t.to?.trim();return r&&e===null||o&&n===null?!0:e!==null&&n!==null&&e>n}function Ce(t,e){let n=["passed","blocked"].filter(r=>!U(t[r],P).valid);e("SCENE_VALUE_INVALID","error",n,`these must be whole numbers from 0 to ${N} \xB7 the scene drew its default instead`)}function Re(t,e,n,r){let o=E(e.total,F,1,I),s=E(e.columns,$(o.value),1,g),i=[...o.valid?[]:["total"],...s.valid?[]:["columns"]];n("SCENE_VALUE_INVALID","error",i,`\`total\` is a whole number from 1 to ${I} and \`columns\` from 1 to ${g} \xB7 the scene drew its default instead`),n("SCENE_VALUE_INVALID","error",r(a=>!E(a.value,0,0,o.value).valid||!a.value?.trim()),`\`value\` is how many cells are lit, a whole number from 0 to ${o.value} \xB7 missing or out of range, the grid is drawn empty or full`),n("SCENE_GRID_TOO_DENSE","error",s.valid&&!W(o.value,s.value,H(t.length,e.width))?[`${o.value} cells in ${s.value} columns`]:[],`the cells are under ${M} units wide at this size \xB7 fewer cells, fewer columns would not help, fewer panels would`)}function Le(t,e,n){let r=B(t.columns??void 0).length,o=i=>Y(i.level??""),s=new Set(w);e("SCENE_LEVEL_INVALID","error",n(i=>{let a=o(i);return r>0&&a.length!==r||a.some(l=>!s.has(l))}),`\`level\` needs one status per column${r?` (${r})`:""}, each one of ${w.join(", ")} \xB7 a missing or unknown one is drawn as "none"`)}var ke=200,Q=null;function De(){return Q??=document.createElement("canvas"),Q.getContext("2d")}function At(t,e,n="--rik-font-sans"){let r=getComputedStyle(t),o=r.getPropertyValue(n).trim()||r.getPropertyValue("--rik-font-sans").trim()||"sans-serif";return s=>{let i=De();if(!i)return c=>c.length*s*.5;let a=`${e} ${s}px ${o}`;return Ge(a),c=>(i.font=a,i.measureText(c).width)}}var ee=new Set;function Ge(t){ee.has(t)||!document.fonts?.load||(ee.add(t),document.fonts.load(t).catch(e=>{console.warn(`rikiki \xB7 scene font did not load (${t}): ${String(e)}`)}))}function Tt(t,e,n){return Object.entries(e).filter(([,r])=>!r.fits).map(([r,o])=>({item:t,field:r,text:o.lines.join(" "),budget:n,size:o.size}))}var Nt=ye`:host{display:block;inline-size:100%}svg{display:block;inline-size:100%;block-size:auto;overflow:visible}text{font-family:var(--rik-font-sans);fill:var(--rik-text-default)}.note{fill:var(--deck-scene-muted,var(--rik-text-default--muted))}.tag{/* The strong accent,not the text accent · a tag sits on a card (paper-100),and the text accent measures 2.8:1 there,under the 3:1 large text needs. \`check\` (SVG_TEXT_CONTRAST_LOW) found it on the default theme. */
    fill: var(
      --deck-scene-tag,
      var(--rik-accent--strong, var(--rik-accent__text, var(--rik-accent)))
    );
  }
  .value {
    font-family: var(--rik-font-display, var(--rik-font-sans));
  }
  .card {
    fill: var(--deck-scene-card-bg, var(--rik-surface-raised));
    stroke: var(--deck-scene-card-stroke, var(--rik-border-default));
    stroke-width: 1.5;
  }
  .emphasis {
    fill: var(--deck-scene-emphasis-bg, var(--rik-accent));
    stroke: none;
  }
  .on-emphasis {
    fill: var(--deck-scene-emphasis-text, var(--rik-accent__on, var(--rik-text-default)));
  }
  .line {
    fill: none;
    stroke: var(--deck-scene-line, var(--rik-text-default));
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .line.muted {
    stroke: var(--deck-scene-muted, var(--rik-text-default--faint));
  }
  .dash {
    stroke-dasharray: 10 10;
  }
  .icon {
    fill: none;
    stroke: var(--deck-scene-icon, var(--rik-accent__text, var(--rik-accent)));
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
    vector-effect: non-scaling-stroke;
  }
  .icon.on-emphasis {
    stroke: var(--deck-scene-emphasis-text, var(--rik-accent__on, var(--rik-text-default)));
    fill: none;
  }
  .token {
    fill: var(--deck-scene-emphasis-bg, var(--rik-accent));
    opacity: 0;
  }

  /* Motion lives inside the drawing and only while the slide is shown · without
     [playing] (overview, presenter preview, render, print) the scene is at its
     final state, which is the state a reader of the PDF needs. */
  .pop,
  .grow,
  .grow-x {
    transform-box: fill-box;
  }
  .pop {
    transform-origin: center;
  }
  .grow {
    transform-origin: bottom;
  }
  .grow-x {
    transform-origin: left;
  }
  :host([playing]) .pop {
    animation: scene-pop 0.45s cubic-bezier(0.2, 0.8, 0.2, 1) calc(var(--t0, 0s) + var(--scene-delay, 0s)) both;
  }
  :host([playing]) .fade {
    animation: scene-fade 0.5s ease calc(var(--t0, 0s) + var(--scene-delay, 0s)) both;
  }
  :host([playing]) .grow {
    animation: scene-grow 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) calc(var(--t0, 0s) + var(--scene-delay, 0s)) both;
  }
  :host([playing]) .grow-x {
    animation: scene-grow-x 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) calc(var(--t0, 0s) + var(--scene-delay, 0s)) both;
  }
  :host([playing]) .token {
    animation: scene-token var(--du, 0.9s) cubic-bezier(0.2, 0.8, 0.2, 1) calc(var(--t0, 0s) + var(--scene-delay, 0s)) both;
  }
  @keyframes scene-pop {
    from { opacity: 0; transform: scale(0.6); }
    to { opacity: 1; transform: scale(1); }
  }
  @keyframes scene-fade {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes scene-grow {
    from { transform: scaleY(0); }
    to { transform: scaleY(1); }
  }
  @keyframes scene-grow-x {
    from { transform: scaleX(0); }
    to { transform: scaleX(1); }
  }
  @keyframes scene-token {
    0% { opacity: 0; transform: translate(0, 0); }
    12% { opacity: 1; transform: translate(0, 0); }
    88% { opacity: 1; transform: translate(var(--dx, 0), var(--dy, 0)); }
    100% { opacity: 0; transform: translate(var(--dx, 0), var(--dy, 0)); }
  }
  @media (prefers-reduced-motion: reduce) {
    :host([playing]) :is(.pop, .fade, .grow, .grow-x, .token) {
      animation: none;
    }
  }
  @media print {
    :host([playing]) :is(.pop, .fade, .grow, .grow-x, .token) {
      animation: none;
    }
  }
`;function Pe(t){let e=n=>t.getAttribute(n);return{label:e("label"),note:e("note"),icon:e("icon"),tag:e("tag"),value:e("value"),level:e("level"),from:e("from"),to:e("to"),emphasis:t.hasAttribute("emphasis")}}var x=class extends Oe{constructor(){super(...arguments);this.playing=!1;this.warnedIssues="";this.linted=[];this.overflows=[];this.onFontsLoaded=()=>{this.requestUpdate()}}get width(){let n=this.frameWidth;return n!==void 0&&Number.isFinite(n)&&n>=ke?n:1600}get items(){return[...this.querySelectorAll(":scope > deck-scene-item")]}connectedCallback(){super.connectedCallback(),this.onShownSlide()?this.applyStep(0):this.playing=!1,document.fonts?.ready.then(()=>this.requestUpdate()),document.fonts?.addEventListener("loadingdone",this.onFontsLoaded),this.observer=new MutationObserver(n=>{n.some(r=>r.type==="childList"||r.target!==this)&&this.requestUpdate()}),this.observer.observe(this,{attributes:!0,childList:!0,subtree:!0})}disconnectedCallback(){super.disconnectedCallback(),this.observer?.disconnect(),document.fonts?.removeEventListener("loadingdone",this.onFontsLoaded)}onShownSlide(){let n=this.closest("deck-root");return!n||n.hasAttribute("data-overview-snapshot")||n.hasAttribute("preview")?!1:!!this.closest("deck-root > [active]")}applyStep(n){n===0&&(this.playing=!1,requestAnimationFrame(()=>{this.playing=!0}))}willUpdate(){let n=R(this.localName);this.linted=n?Z(n,this.items.map(Pe),{columns:this.getAttribute("columns"),passed:this.getAttribute("passed"),blocked:this.getAttribute("blocked"),total:this.getAttribute("total"),max:this.getAttribute("max"),height:this.getAttribute("height"),scale:this.getAttribute("scale"),width:this.width}):[]}updated(){let n=R(this.localName),r=this.renderRoot.querySelector("svg")?.getAttribute("viewBox"),o=Number(r?.split(" ")[3])-2*m,s=n&&o>0&&this.frameWidth===void 0?j(n,o,this.items.length):null,i=z(n??this.localName.replace(/^deck-scene-/,""),this.overflows,{width:this.width,count:this.items.length});this.reportIssues([...this.linted,...this.extraIssues(),...i?[i]:[],...s?[s]:[]])}extraIssues(){return[]}reportIssues(n){let r=n.length?JSON.stringify(n):"";if(r!==(this.getAttribute("data-scene-issues")??"")&&(r?this.setAttribute("data-scene-issues",r):this.removeAttribute("data-scene-issues")),r&&r!==this.warnedIssues)for(let o of n)console.warn(`<${this.localName}> \xB7 ${o.message}: ${o.items.join(", ")}`);this.warnedIssues=r}reportOverflow(n){this.overflows=n.map(r=>typeof r=="string"?{item:r,field:"text"}:r)}};S([J({type:Boolean,reflect:!0})],x.prototype,"playing",2),S([J({type:Number,attribute:"frame-width"})],x.prototype,"frameWidth",2);export{We as BASELINE,Ve as DIAGRAM_ROOM_HEIGHT,m as EDGE,D as GAP,A as MAX_SCENE_HEIGHT,oe as PAD,f as SCENE_LIMITS,u as SCENE_WIDTH,k as SHRINK_RATIO,x as SceneElement,$e as TYPE,Xe as columns,Ke as fitText,At as measurerFor,Tt as misfits,Nt as sceneStyles,Be as sceneViewBox,y as wrapText};
