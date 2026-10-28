var Fe=Object.defineProperty;var Pe=Object.getOwnPropertyDescriptor;var p=(t,e,n,r)=>{for(var o=r>1?void 0:r?Pe(e,n):e,s=t.length-1,i;s>=0;s--)(i=t[s])&&(o=(r?i(e,n,o):i(o))||o);return r&&o&&Fe(e,n,o),o};import{css as At,html as Tt,svg as I}from"./vendor/lit.js";import{customElement as Nt,property as J}from"./vendor/lit.js";var Ue='{"check":"M20 6 9 17l-5-5","cross":"M18 6 6 18M6 6l12 12","alert":"M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z","info":"M12 16v-4m0-4h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z","question":"M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3m.1 4h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z","ban":"M4.9 4.9l14.2 14.2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z","arrow":"M5 12h14m-6-6 6 6-6 6","arrow-down":"M12 5v14m6-6-6 6-6-6","clock":"M12 6v6l4 2m6-2a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z","calendar":"M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z","refresh":"M21 12a9 9 0 1 1-3-6.7M21 3v6h-6","trend":"M22 7 13.5 15.5l-5-5L2 17M16 7h6v6","user":"M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z","team":"M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Zm10 14v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8","target":"M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0-6a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 9a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z","flag":"M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1Zm0 0v7","lock":"M7 11V7a5 5 0 0 1 10 0v4M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z","search":"M21 21l-4.3-4.3M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z","code":"M16 18l6-6-6-6M8 6l-6 6 6 6","database":"M3 5c0 1.7 4 3 9 3s9-1.3 9-3-4-3-9-3-9 1.3-9 3Zm0 0v14c0 1.7 4 3 9 3s9-1.3 9-3V5M3 12c0 1.7 4 3 9 3s9-1.3 9-3","cloud":"M17.5 19a4.5 4.5 0 0 0 0-9h-1.3A7 7 0 1 0 4 16.9","document":"M14 2v6h6M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Zm-6 11h8m-8 4h8m-8-8h2","chart":"M3 3v18h18M7 16V9m5 7V5m5 11v-4","spark":"M12 2 15 9l7 3-7 3-3 7-3-7-7-3 7-3Z"}',ne=Object.freeze(JSON.parse(Ue)),Ut=Object.keys(ne);function y(t){return t?ne[t.trim().toLowerCase()]??null:null}import{LitElement as He,css as Be}from"./vendor/lit.js";import{property as E}from"./vendor/lit.js";var h=class extends He{constructor(){super(...arguments);this.emphasis=!1}static{this.styles=Be`:host{display:none}`}render(){return null}};p([E({type:String})],h.prototype,"label",2),p([E({type:String})],h.prototype,"note",2),p([E({type:String})],h.prototype,"icon",2),p([E({type:String})],h.prototype,"tag",2),p([E({type:String})],h.prototype,"value",2),p([E({type:String})],h.prototype,"level",2),p([E({type:String})],h.prototype,"from",2),p([E({type:String})],h.prototype,"to",2),p([E({type:Boolean,reflect:!0})],h.prototype,"emphasis",2);customElements.get("deck-scene-item")||customElements.define("deck-scene-item",h);import{LitElement as bt,css as gt}from"./vendor/lit.js";import{property as ve}from"./vendor/lit.js";var c=Object.freeze({label:{size:31,weight:650,line:38},note:{size:25,weight:400,line:34},tag:{size:23,weight:600,line:30},value:{size:56,weight:750,line:64}});var A=4;function oe(t,e=1600){return`${-A} ${-A} ${e+2*A} ${t+2*A}`}var U=620;var se=.88,g=28,v=32,T=Object.freeze({cards:{min:2,max:5},steps:{min:1,max:6},bars:{min:2,max:8},matrix:{min:1,max:6},ranges:{min:1,max:8},lanes:{min:2,max:5},units:{min:1,max:3}});function re(t,e,n,r){let o=t.trim().split(/[ \t\n\r]+/).filter(Boolean),s=[],i="",a=!0;for(let l of o){let u=i?`${i} ${l}`:l;if(n(u)<=e){i=u;continue}i&&s.push(i),i=l,n(l)>e&&(a=!1)}return i&&s.push(i),{lines:s,fits:a&&s.length<=r}}function N(t,e,n,r,o){let s=re(t,e,o(r),n);if(s.fits)return{...s,size:r};let i=Math.round(r*se);return{...re(t,e,o(i),n),size:i}}var Yt=T.bars.max;var We=48;var Xe=16,jt=(We-Xe)/2;function M(t){let e=(t??"").replace(/\s/g,"").replace(",",".");if(!e)return null;let n=Number(e);return Number.isFinite(n)?n:null}var L=4,R=2,H=Object.freeze({sources:.3,hub:.22,outcomes:.26}),Jt=(1-H.sources-H.hub-H.outcomes)/2;function ie(t,e){let n=t.findIndex(e),r=n>=0?n:t.length-1;return{sources:t.slice(0,Math.max(0,r)).slice(0,L),hub:t[r],outcomes:t.slice(r+1,r+1+R)}}var B=8,ae=3;var Ve=10,ze=6,tn=2*Ve+ze;function le(t,e){if(t==null||t.trim()==="")return{value:e,valid:!0};let n=Number(t),r=Number.isInteger(n)&&n>=0&&n<=B;return{value:r?n:e,valid:r}}var X=400,ce=100,V=12,Ke=44,Ye=340,W=.25,je=2.2,O=40;function k(t,e,n,r){if(t==null||t.trim()==="")return{value:e,valid:!0};let o=Number(t),s=Number.isInteger(o)&&o>=n&&o<=r;return{value:s?o:e,valid:s}}var Ze=48;function ue(t,e=1600){let n=Math.max(1,t);return(e-Ze*(n-1))/n}function me(t){return Math.min(O,Math.max(1,Math.ceil(Math.sqrt(t*je))))}function qe(t,e,n,r=Ye){let o=Math.ceil(t/e),s=Math.ceil(t/o),i=Math.min(Ke,n/(s+(s-1)*W),r/(o+(o-1)*W)),a=i*W;return{columns:s,rows:o,cell:i,gap:a,width:s*i+(s-1)*a,height:o*i+(o-1)*a}}function de(t,e,n){return qe(t,e,n).cell>=V}var z=["prod","pilot","test","announced","none"];var sn=Object.freeze({prod:"in production",pilot:"pilot",test:"in test",announced:"announced",none:"nothing yet"});var Je=t=>(t??"").split("|").map(e=>e.trim()).filter(Boolean);function pe(t){return Je(t).slice(0,12)}function C(t){if(t===null||t.trim()==="")return null;let e=Number(t);return Number.isFinite(e)?e:null}var Qe=["cards","steps","flow","bars","matrix","ranges","lanes","units"];function Y(t){let e=t.toLowerCase().replace(/^deck-scene-/,"");return Qe.includes(e)?e:null}var et=["label","note","icon","tag","value","level","from","to","emphasis"],tt=Object.freeze({cards:["label","note","icon","tag","emphasis"],steps:["label","note","tag","emphasis"],flow:["label","note","icon","tag","emphasis"],bars:["label","note","tag","value","emphasis"],matrix:["label","level","emphasis"],ranges:["label","note","tag","from","to"],lanes:["label","note","icon","tag"],units:["label","note","icon","value","emphasis"]});function ge(t,e,n){if(!e.length)return null;let r=e.map(s=>`${s.item} \xB7 ${s.field}`),o=e.filter(s=>s.measured!==void 0&&s.budget!==void 0).map(s=>`${s.item} \xB7 ${s.field} needs ${Math.round(s.measured??0)} of ${Math.round(s.budget??0)} units`);return{code:"SCENE_TEXT_TOO_LONG",severity:"error",items:r,fields:e,...n?{scene:{kind:t,...n}}:{},message:`a ${t} scene could not fit ${r.join(", ")} even one size down \xB7 drawn anyway, past its box${o.length?` (${o.join("; ")})`:""}`}}var he=2,nt=L+1+R,fe=4,rt=/(?<=[.!?…])\s+(?=\p{Lu})/u,D=(t,e)=>t.label?.trim()||`item ${e+1}`,Ee=t=>t.trim().split(/\s+/).filter(Boolean);function _e(t,e,n){return e<=U?null:{code:"SCENE_TOO_TALL",severity:"error",items:[`${n} ${n===1?"item":"items"}, ${Math.round(e)} units tall`],message:`a slide leaves room for about ${U} units and this ${t} scene is taller \xB7 the slide clips it \xB7 fewer items, or split the slide`}}function xe(t,e,n={}){let r=[],o=(i,a,l,u)=>{l.length&&r.push({code:i,severity:a,items:l,message:u})},s=i=>e.flatMap((a,l)=>i(a,l)?[D(a,l)]:[]);return at(t,e,o),o("SCENE_ITEM_NO_LABEL","error",s(i=>!i.label?.trim()),"an item has no label \xB7 the scene would draw it as an empty box"),o("SCENE_ATTRIBUTE_IGNORED","warning",e.flatMap((i,a)=>ot(t,i).map(l=>`${D(i,a)} \xB7 ${l}`)),`a ${t} scene does not read this attribute \xB7 it is dropped, and the picture does not change`),o("SCENE_ICON_UNKNOWN","error",s(i=>!!i.icon&&!y(i.icon)),"the icon is not in the 24-glyph set \xB7 it draws nothing, silently"),t==="bars"&&(o("SCENE_VALUE_INVALID","error",s(i=>M(i.value)===null),"`value` is missing or is not a number \xB7 the bar is drawn flat"),lt(e,n,o,s)),t==="ranges"&&(o("SCENE_VALUE_INVALID","error",s(dt),mt),ut(n,o,s)),t==="matrix"&&ft(n,o,s),t==="lanes"&&pt(n,o),t==="units"&&ht(e,n,o,s),o("SCENE_EMPHASIS_MANY","warning",t==="bars"?it(e):Se(e),"more than one item is emphasised \xB7 the scene puts one forward, and two are none"),o("SCENE_LABEL_LONG","warning",s(i=>Ee(i.label??"").length>fe),`a label past ${fe} words reads as a sentence \xB7 one to three words, the detail goes in the note`),o("SCENE_NOTE_LONG","warning",s(i=>(i.note??"").trim().split(rt).length>1),"a note of more than one sentence \xB7 the scene is read from the back of the room, one sentence each"),r}function ot(t,e){let n=tt[t];return et.filter(r=>(r==="emphasis"?e.emphasis:e[r]!==null)&&!n.includes(r))}var st=t=>t.flatMap((e,n)=>e.emphasis?[D(e,n)]:[]),Se=t=>{let e=st(t);return e.length>1?e:[]};function it(t){let e=[];for(let n of t){let r=e.at(-1);r&&(r[0].note??"")===(n.note??"")?r.push(n):e.push([n])}return e.flatMap(Se)}function at(t,e,n){let r=i=>D(i,e.indexOf(i));if(t==="flow"){let i=ie(e,l=>l.emphasis),a=new Set([...i.sources,i.hub,...i.outcomes]);n("SCENE_ITEMS_DROPPED","error",e.filter(l=>!a.has(l)).map(r),`a flow draws ${L} sources before the hub and ${R} outcomes after it at most \xB7 these are not drawn`),e.length<he&&be(n,e.length,he,nt);return}let{min:o,max:s}=T[t];n("SCENE_ITEMS_DROPPED","error",e.slice(s).map(r),`a ${t} scene draws at most ${s} items \xB7 these are not drawn`),e.length<o&&be(n,e.length,o,s)}function be(t,e,n,r){t("SCENE_TOO_FEW_ITEMS","error",[`${e} item${e===1?"":"s"}`],`the scene is built for ${n} to ${r} items \xB7 with ${e} it has nothing to compare`)}function K(t,e){if(!t?.trim())return null;let n=e(t);return n!==null&&n>0?n:!1}function lt(t,e,n,r){let o=K(e.max,M),s=K(e.height,M);n("SCENE_ATTRIBUTE_INVALID","error",[...o===!1?["max"]:[],...s===!1?["height"]:[]],"`max` and `height` must be positive numbers \xB7 the scene drew its default instead"),n("SCENE_VALUE_CLIPPED","error",r(i=>{let a=M(i.value);return a!==null&&(a<0||typeof o=="number"&&a>o)}),typeof o=="number"?`a value is outside the scale (0 to ${o}) \xB7 its bar stops at the edge \xB7 use non-negative values, or raise \`max\` for values above it`:"a value is negative \xB7 the automatic scale starts at zero, so its bar stays flat \xB7 use non-negative values or a chart with a signed scale"),n("SCENE_GROUP_SPLIT","warning",ct(t),"a note comes back after another \xB7 only neighbours with the same note share a group, so these are drawn as separate groups \xB7 keep the items of a group together")}function ct(t){let e=new Set,n=new Set,r=null;for(let o of t){let s=(o.note??"").trim();s&&s!==r&&e.has(s)&&n.add(s),s&&e.add(s),r=s}return[...n]}function ut(t,e,n){let r=K(t.scale,s=>C(s));e("SCENE_ATTRIBUTE_INVALID","error",r===!1?["scale"]:[],"`scale` must be a positive number \xB7 the scene fitted the scale to the rows instead");let o=s=>{let i=C(s);return i!==null&&(i<0||typeof r=="number"&&i>r)};e("SCENE_VALUE_CLIPPED","error",n(s=>o(s.from)||o(s.to)),typeof r=="number"?`a bound is outside the scale (0 to ${r}) \xB7 the bar stops at the edge \xB7 use non-negative bounds, or raise \`scale\` for bounds above it`:"a bound is negative \xB7 the automatic scale starts at zero, so the bar stops at the edge \xB7 use non-negative bounds")}var mt="`from` and `to` must be numbers when written, with `from` first \xB7 otherwise the bar lands where the scene guessed";function dt(t){let e=C(t.from),n=C(t.to),r=!!t.from?.trim(),o=!!t.to?.trim();return r&&e===null||o&&n===null?!0:e!==null&&n!==null&&e>n}function pt(t,e){let n=["passed","blocked"].filter(r=>!le(t[r],ae).valid);e("SCENE_VALUE_INVALID","error",n,`these must be whole numbers from 0 to ${B} \xB7 the scene drew its default instead`)}function ht(t,e,n,r){let o=k(e.total,ce,1,X),s=k(e.columns,me(o.value),1,O),i=[...o.valid?[]:["total"],...s.valid?[]:["columns"]];n("SCENE_VALUE_INVALID","error",i,`\`total\` is a whole number from 1 to ${X} and \`columns\` from 1 to ${O} \xB7 the scene drew its default instead`),n("SCENE_VALUE_INVALID","error",r(a=>!k(a.value,0,0,o.value).valid||!a.value?.trim()),`\`value\` is how many cells are lit, a whole number from 0 to ${o.value} \xB7 missing or out of range, the grid is drawn empty or full`),n("SCENE_GRID_TOO_DENSE","error",s.valid&&!de(o.value,s.value,ue(t.length,e.width))?[`${o.value} cells in ${s.value} columns`]:[],`the cells are under ${V} units wide at this size \xB7 fewer cells, fewer columns would not help, fewer panels would`)}function ft(t,e,n){let r=pe(t.columns??void 0).length,o=i=>Ee(i.level??""),s=new Set(z);e("SCENE_LEVEL_INVALID","error",n(i=>{let a=o(i);return r>0&&a.length!==r||a.some(u=>!s.has(u))}),`\`level\` needs one status per column${r?` (${r})`:""}, each one of ${z.join(", ")} \xB7 a missing or unknown one is drawn as "none"`)}var Et=200,Ae=null;function _t(){return Ae??=document.createElement("canvas"),Ae.getContext("2d")}function G(t,e,n="--rik-font-sans"){let r=getComputedStyle(t),o=r.getPropertyValue(n).trim()||r.getPropertyValue("--rik-font-sans").trim()||"sans-serif";return s=>{let i=_t();if(!i)return l=>l.length*s*.5;let a=`${e} ${s}px ${o}`;return xt(a),l=>(i.font=a,i.measureText(l).width)}}var Te=new Set;function xt(t){Te.has(t)||!document.fonts?.load||(Te.add(t),document.fonts.load(t).catch(e=>{console.warn(`rikiki \xB7 scene font did not load (${t}): ${String(e)}`)}))}function j(t,e,n){return Object.entries(e).filter(([,r])=>!r.fits).map(([r,o])=>({item:t,field:r,text:o.lines.join(" "),budget:n,size:o.size}))}var Ne=gt`:host{display:block;inline-size:100%}svg{display:block;inline-size:100%;block-size:auto;overflow:visible}text{font-family:var(--rik-font-sans);fill:var(--rik-text-default)}.note{fill:var(--deck-scene-muted,var(--rik-text-default--muted))}.tag{/* The strong accent,not the text accent · a tag sits on a card (paper-100),and the text accent measures 2.8:1 there,under the 3:1 large text needs. \`check\` (SVG_TEXT_CONTRAST_LOW) found it on the default theme. */
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
`;function St(t){let e=n=>t.getAttribute(n);return{label:e("label"),note:e("note"),icon:e("icon"),tag:e("tag"),value:e("value"),level:e("level"),from:e("from"),to:e("to"),emphasis:t.hasAttribute("emphasis")}}var w=class extends bt{constructor(){super(...arguments);this.playing=!1;this.warnedIssues="";this.linted=[];this.overflows=[];this.onFontsLoaded=()=>{this.requestUpdate()}}get width(){let n=this.frameWidth;return n!==void 0&&Number.isFinite(n)&&n>=Et?n:1600}get items(){return[...this.querySelectorAll(":scope > deck-scene-item")]}connectedCallback(){super.connectedCallback(),this.onShownSlide()?this.applyStep(0):this.playing=!1,document.fonts?.ready.then(()=>this.requestUpdate()),document.fonts?.addEventListener("loadingdone",this.onFontsLoaded),this.observer=new MutationObserver(n=>{n.some(r=>r.type==="childList"||r.target!==this)&&this.requestUpdate()}),this.observer.observe(this,{attributes:!0,childList:!0,subtree:!0})}disconnectedCallback(){super.disconnectedCallback(),this.observer?.disconnect(),document.fonts?.removeEventListener("loadingdone",this.onFontsLoaded)}onShownSlide(){let n=this.closest("deck-root");return!n||n.hasAttribute("data-overview-snapshot")||n.hasAttribute("preview")?!1:!!this.closest("deck-root > [active]")}applyStep(n){n===0&&(this.playing=!1,requestAnimationFrame(()=>{this.playing=!0}))}willUpdate(){let n=Y(this.localName);this.linted=n?xe(n,this.items.map(St),{columns:this.getAttribute("columns"),passed:this.getAttribute("passed"),blocked:this.getAttribute("blocked"),total:this.getAttribute("total"),max:this.getAttribute("max"),height:this.getAttribute("height"),scale:this.getAttribute("scale"),width:this.width}):[]}updated(){let n=Y(this.localName),r=this.renderRoot.querySelector("svg")?.getAttribute("viewBox"),o=Number(r?.split(" ")[3])-2*A,s=n&&o>0&&this.frameWidth===void 0?_e(n,o,this.items.length):null,i=ge(n??this.localName.replace(/^deck-scene-/,""),this.overflows,{width:this.width,count:this.items.length});this.reportIssues([...this.linted,...this.extraIssues(),...i?[i]:[],...s?[s]:[]])}extraIssues(){return[]}reportIssues(n){let r=n.length?JSON.stringify(n):"";if(r!==(this.getAttribute("data-scene-issues")??"")&&(r?this.setAttribute("data-scene-issues",r):this.removeAttribute("data-scene-issues")),r&&r!==this.warnedIssues)for(let o of n)console.warn(`<${this.localName}> \xB7 ${o.message}: ${o.items.join(", ")}`);this.warnedIssues=r}reportOverflow(n){this.overflows=n.map(r=>typeof r=="string"?{item:r,field:"text"}:r)}};p([ve({type:Boolean,reflect:!0})],w.prototype,"playing",2),p([ve({type:Number,attribute:"frame-width"})],w.prototype,"frameWidth",2);var x=40,Z=320,we=v/2,vt=v,Ie=8,q=g+x/2,$=g+x+v;function Me(t){return Math.ceil(t/Ie)*Ie}function Ce(t,e=1600){let n=$+Z+v,r=e-g,o=t>0?r-t-v:r;return{discCenter:q,labelX:$,noteX:n,noteWidth:o-n,tagRight:r}}function ye(t,e){let n=Math.max(1,t.length),r=Me(Math.max(x,...t)+2*g),o=Array.from({length:n},(l,u)=>u*(r+we)),s=n*r+(n-1)*we;if(e===null)return{rowHeight:r,ys:o,bandY:s,bandHeight:0,height:s};let i=s+vt,a=Me(e+2*g);return{rowHeight:r,ys:o,bandY:i,bandHeight:a,height:i+a}}var wt=T.steps.max,It=2,Mt=2,Ct=2,yt=320,Lt=8,F=x,Rt=F/24,Le=16,Re=8,Ot=.36,Q=.1,ee=.15,kt=.45,S=class extends w{render(){let e=this.items.slice(0,wt),n=G(this,c.tag.weight),r=e.map(m=>N(m.getAttribute("tag")??"",yt,1,c.tag.size,n)),o=Math.max(0,...r.map(m=>Dt(m,n))),s=Ce(o,this.width),i=G(this,c.label.weight),a=G(this,c.note.weight),l=e.map((m,f)=>({label:N(m.getAttribute("label")??"",Z,It,c.label.size,i),note:N(m.getAttribute("note")??"",s.noteWidth,Mt,c.note.size,a),tag:r[f],emphasis:m.hasAttribute("emphasis"),name:m.getAttribute("label")||`step ${f+1}`})),u=this.band(i,a),d=ye(l.map(Gt),u?$t(u):null);this.reportOverflow([...l.flatMap(m=>j(m.name,{label:m.label,note:m.note,tag:m.tag})),...u?j("conclusion",{conclusion:u.sentence,"conclusion-note":u.note}):[]]);let b=Q+(l.length-1)*ee+kt;return Tt`<svg viewBox=${oe(d.height,this.width)} role="img" aria-label=${Ft(l,u)} part="drawing" > ${l.map((m,f)=>this.row(m,f,s,d.ys[f]??0,d.rowHeight))} ${l.slice(1).map((m,f)=>this.connector(f,s,d.ys,d.rowHeight))} ${u?this.drawBand(u,d.bandY,d.bandHeight,b):""} </svg>`}band(e,n){let r=this.conclusion?.trim()??"",o=this.conclusionNote?.trim()??"";if(!r&&!o)return null;let s=y(this.conclusionIcon),i=this.width-Oe(s)-g;return{sentence:N(r,i,Ct,c.label.size,e),note:N(o,i,1,c.note.size,n),icon:s}}row(e,n,r,o,s){let i=e.emphasis?"on-emphasis":"",a=e.emphasis?"flip":"",l=o+s/2,u=(d,b,m,f="start")=>{let P=l-b.lines.length*c[d].line/2;return b.lines.map((Ge,$e)=>I`<text
          class="${d} ${i}"
          x=${m}
          y=${te(P+$e*c[d].line,c[d].line,b.size)}
          font-size=${b.size}
          font-weight=${c[d].weight}
          text-anchor=${f}
        >${Ge}</text>`)};return I`<g class="pop" style="--t0:${Q+n*ee}s">
      <rect class=${e.emphasis?"emphasis":"card"} x="0" y=${o} width=${this.width} height=${s} rx=${Le}></rect>
      <circle class="disc emphasis ${a}" cx=${r.discCenter} cy=${l} r=${x/2}></circle>
      <text
        class="number on-emphasis ${a}"
        x=${r.discCenter}
        y=${te(l-c.label.line/2,c.label.line,c.label.size)}
        font-size=${c.label.size}
        font-weight=${c.label.weight}
        text-anchor="middle"
      >${n+1}</text>
      ${u("label",e.label,r.labelX)}
      ${u("note",e.note,r.noteX)}
      ${u("tag",e.tag,r.tagRight,"end")}
    </g>`}connector(e,n,r,o){let s=(r[e]??0)+o/2+x/2+Re,i=(r[e+1]??0)+o/2-x/2-Re;return I`<line
      class="line muted fade"
      style="--t0:${Q+(e+1)*ee}s"
      x1=${n.discCenter}
      y1=${s}
      x2=${n.discCenter}
      y2=${i}
    ></line>`}drawBand(e,n,r,o){let s=Oe(e.icon),i=n+r/2,a=i-De(e)/2,l=a+e.sentence.lines.length*c.label.line+ke(e),u=(d,b,m)=>b.lines.map((f,P)=>I`<text
          class="${d} on-band"
          x=${s}
          y=${te(m+P*c[d].line,c[d].line,b.size)}
          font-size=${b.size}
          font-weight=${c[d].weight}
        >${f}</text>`);return I`<g class="fade" style="--t0:${o}s">
      <rect class="band" x="0" y=${n} width=${this.width} height=${r} rx=${Le}></rect>
      ${e.icon?I`<g transform="translate(${q-F/2} ${i-F/2}) scale(${Rt})"><path class="icon on-band" d=${e.icon}></path></g>`:""}
      ${u("label",e.sentence,a)}
      ${u("note",e.note,l)}
    </g>`}};S.styles=[Ne,At`.disc.flip{fill:var(--deck-scene-emphasis-text,var(--rik-accent__on,var(--rik-text-default)))}.number.flip{fill:var(--deck-scene-emphasis-bg,var(--rik-accent))}.band{fill:var(--deck-scene-band-bg,var(--rik-surface-inverse))}.on-band{fill:var(--deck-scene-band-text,var(--rik-text-inverse))}.on-band.note{fill:var(--deck-scene-band-muted,var(--rik-text-inverse--muted))}.icon.on-band{fill:none;stroke:var(--deck-scene-band-icon,var(--rik-accent))}`],p([J({type:String})],S.prototype,"conclusion",2),p([J({type:String,attribute:"conclusion-note"})],S.prototype,"conclusionNote",2),p([J({type:String,attribute:"conclusion-icon"})],S.prototype,"conclusionIcon",2),S=p([Nt("deck-scene-steps")],S);function te(t,e,n){return t+e/2+n*Ot}function Dt(t,e){let n=e(t.size);return Math.max(0,...t.lines.map(r=>n(r)))}function Gt(t){return Math.max(t.label.lines.length*c.label.line,t.note.lines.length*c.note.line,t.tag.lines.length*c.tag.line)}function ke(t){return t.sentence.lines.length&&t.note.lines.length?Lt:0}function De(t){return t.sentence.lines.length*c.label.line+ke(t)+t.note.lines.length*c.note.line}function $t(t){return Math.max(t.icon?F:0,De(t))}function Oe(t){return t?$:g}function Ft(t,e){let n=t.map((o,s)=>[`${s+1}. ${o.name}`,o.note.lines.join(" "),o.tag.lines.join(" ")].filter(Boolean).join(", ")),r=e?[e.sentence.lines.join(" "),e.note.lines.join(" ")].filter(Boolean).join(", "):"";return[...n,r].filter(Boolean).join(". ")}export{S as DeckSceneSteps};
