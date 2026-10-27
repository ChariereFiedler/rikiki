var Ie=Object.defineProperty;var Ce=Object.getOwnPropertyDescriptor;var u=(n,e,t,r)=>{for(var s=r>1?void 0:r?Ce(e,t):e,o=n.length-1,i;o>=0;o--)(i=n[o])&&(s=(r?i(e,t,s):i(s))||s);return r&&s&&Ie(e,t,s),s};import{css as pt,html as ve,svg as N}from"./vendor/lit.js";import{customElement as ft,property as Ne}from"./vendor/lit.js";var ye='{"check":"M20 6 9 17l-5-5","cross":"M18 6 6 18M6 6l12 12","alert":"M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z","info":"M12 16v-4m0-4h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z","question":"M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3m.1 4h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z","ban":"M4.9 4.9l14.2 14.2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z","arrow":"M5 12h14m-6-6 6 6-6 6","arrow-down":"M12 5v14m6-6-6 6-6-6","clock":"M12 6v6l4 2m6-2a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z","calendar":"M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z","refresh":"M21 12a9 9 0 1 1-3-6.7M21 3v6h-6","trend":"M22 7 13.5 15.5l-5-5L2 17M16 7h6v6","user":"M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z","team":"M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Zm10 14v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8","target":"M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0-6a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 9a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z","flag":"M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1Zm0 0v7","lock":"M7 11V7a5 5 0 0 1 10 0v4M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z","search":"M21 21l-4.3-4.3M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z","code":"M16 18l6-6-6-6M8 6l-6 6 6 6","database":"M3 5c0 1.7 4 3 9 3s9-1.3 9-3-4-3-9-3-9 1.3-9 3Zm0 0v14c0 1.7 4 3 9 3s9-1.3 9-3V5M3 12c0 1.7 4 3 9 3s9-1.3 9-3","cloud":"M17.5 19a4.5 4.5 0 0 0 0-9h-1.3A7 7 0 1 0 4 16.9","document":"M14 2v6h6M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Zm-6 11h8m-8 4h8m-8-8h2","chart":"M3 3v18h18M7 16V9m5 7V5m5 11v-4","spark":"M12 2 15 9l7 3-7 3-3 7-3-7-7-3 7-3Z"}',ee=Object.freeze(JSON.parse(ye)),St=Object.keys(ee);function w(n){return n?ee[n.trim().toLowerCase()]??null:null}import{LitElement as Le,css as Oe}from"./vendor/lit.js";import{property as h}from"./vendor/lit.js";var d=class extends Le{constructor(){super(...arguments);this.emphasis=!1}static{this.styles=Oe`:host{display:none}`}render(){return null}};u([h({type:String})],d.prototype,"label",2),u([h({type:String})],d.prototype,"note",2),u([h({type:String})],d.prototype,"icon",2),u([h({type:String})],d.prototype,"tag",2),u([h({type:String})],d.prototype,"value",2),u([h({type:String})],d.prototype,"level",2),u([h({type:String})],d.prototype,"from",2),u([h({type:String})],d.prototype,"to",2),u([h({type:Boolean,reflect:!0})],d.prototype,"emphasis",2);customElements.get("deck-scene-item")||customElements.define("deck-scene-item",d);var p=Object.freeze({label:{size:31,weight:650,line:38},note:{size:25,weight:400,line:34},tag:{size:23,weight:600,line:30},value:{size:56,weight:750,line:64}}),H=.8,x=4;function ne(n,e=1600){return`${-x} ${-x} ${e+2*x} ${n+2*x}`}var W=620;var re=.88;var S=Object.freeze({cards:{min:2,max:5},steps:{min:1,max:6},bars:{min:2,max:8},matrix:{min:1,max:6},ranges:{min:1,max:8},lanes:{min:2,max:5},units:{min:1,max:3}});function te(n,e,t,r){let s=n.trim().split(/[ \t\n\r]+/).filter(Boolean),o=[],i="",a=!0;for(let l of s){let m=i?`${i} ${l}`:l;if(t(m)<=e){i=m;continue}i&&o.push(i),i=l,t(l)>e&&(a=!1)}return i&&o.push(i),{lines:o,fits:a&&o.length<=r}}function B(n,e,t,r,s){let o=te(n,e,s(r),t);if(o.fits)return{...o,size:r};let i=Math.round(r*re);return{...te(n,e,s(i),t),size:i}}var I=400,k=100,K=12,Re=44,ke=340,V=.25,De=2.2,T=40;function E(n,e,t,r){if(n==null||n.trim()==="")return{value:e,valid:!0};let s=Number(n),o=Number.isInteger(s)&&s>=t&&s<=r;return{value:o?s:e,valid:o}}var X=48;function D(n,e=1600){let t=Math.max(1,n);return(e-X*(t-1))/t}function G(n){return Math.min(T,Math.max(1,Math.ceil(Math.sqrt(n*De))))}function z(n,e,t,r=ke){let s=Math.ceil(n/e),o=Math.ceil(n/s),i=Math.min(Re,t/(o+(o-1)*V),r/(s+(s-1)*V)),a=i*V;return{columns:o,rows:s,cell:i,gap:a,width:o*i+(o-1)*a,height:s*i+(s-1)*a}}function oe(n,e,t){return z(n,e,t).cell>=K}function se(n,e){return Array.from({length:n},(t,r)=>{let s=Math.floor(r/e.rows),o=r%e.rows;return{index:r,column:s,row:o,x:s*(e.cell+e.gap),y:o*(e.cell+e.gap)}})}var Ge=.1,$e=1.6,Pe=.04;function ie(n,e=0){let t=Math.min(Pe,$e/Math.max(1,n));return Array.from({length:n},(r,s)=>Ge+e*.18+s*t)}import{LitElement as at,css as lt}from"./vendor/lit.js";import{property as _e}from"./vendor/lit.js";var Lt=S.bars.max;var Fe=48;var Ue=16,Ot=(Fe-Ue)/2;function C(n){let e=(n??"").replace(/\s/g,"").replace(",",".");if(!e)return null;let t=Number(e);return Number.isFinite(t)?t:null}var $=4,P=2,j=Object.freeze({sources:.3,hub:.22,outcomes:.26}),$t=(1-j.sources-j.hub-j.outcomes)/2;function ae(n,e){let t=n.findIndex(e),r=t>=0?t:n.length-1;return{sources:n.slice(0,Math.max(0,r)).slice(0,$),hub:n[r],outcomes:n.slice(r+1,r+1+P)}}var Y=8,le=3;var He=10,We=6,Ut=2*He+We;function ce(n,e){if(n==null||n.trim()==="")return{value:e,valid:!0};let t=Number(n),r=Number.isInteger(t)&&t>=0&&t<=Y;return{value:r?t:e,valid:r}}var Z=["prod","pilot","test","announced","none"];var Wt=Object.freeze({prod:"in production",pilot:"pilot",test:"in test",announced:"announced",none:"nothing yet"});var Be=n=>(n??"").split("|").map(e=>e.trim()).filter(Boolean);function ue(n){return Be(n).slice(0,12)}function y(n){if(n===null||n.trim()==="")return null;let e=Number(n);return Number.isFinite(e)?e:null}var Ve=["cards","steps","flow","bars","matrix","ranges","lanes","units"];function J(n){let e=n.toLowerCase().replace(/^deck-scene-/,"");return Ve.includes(e)?e:null}var Ke=["label","note","icon","tag","value","level","from","to","emphasis"],Xe=Object.freeze({cards:["label","note","icon","tag","emphasis"],steps:["label","note","tag","emphasis"],flow:["label","note","icon","tag","emphasis"],bars:["label","note","tag","value","emphasis"],matrix:["label","level","emphasis"],ranges:["label","note","tag","from","to"],lanes:["label","note","icon","tag"],units:["label","note","icon","value","emphasis"]});function fe(n,e,t){if(!e.length)return null;let r=e.map(o=>`${o.item} \xB7 ${o.field}`),s=e.filter(o=>o.measured!==void 0&&o.budget!==void 0).map(o=>`${o.item} \xB7 ${o.field} needs ${Math.round(o.measured??0)} of ${Math.round(o.budget??0)} units`);return{code:"SCENE_TEXT_TOO_LONG",severity:"error",items:r,fields:e,...t?{scene:{kind:n,...t}}:{},message:`a ${n} scene could not fit ${r.join(", ")} even one size down \xB7 drawn anyway, past its box${s.length?` (${s.join("; ")})`:""}`}}var me=2,ze=$+1+P,de=4,je=/(?<=[.!?…])\s+(?=\p{Lu})/u,F=(n,e)=>n.label?.trim()||`item ${e+1}`,he=n=>n.trim().split(/\s+/).filter(Boolean);function be(n,e,t){return e<=W?null:{code:"SCENE_TOO_TALL",severity:"error",items:[`${t} ${t===1?"item":"items"}, ${Math.round(e)} units tall`],message:`a slide leaves room for about ${W} units and this ${n} scene is taller \xB7 the slide clips it \xB7 fewer items, or split the slide`}}function ge(n,e,t={}){let r=[],s=(i,a,l,m)=>{l.length&&r.push({code:i,severity:a,items:l,message:m})},o=i=>e.flatMap((a,l)=>i(a,l)?[F(a,l)]:[]);return Je(n,e,s),s("SCENE_ITEM_NO_LABEL","error",o(i=>!i.label?.trim()),"an item has no label \xB7 the scene would draw it as an empty box"),s("SCENE_ATTRIBUTE_IGNORED","warning",e.flatMap((i,a)=>Ye(n,i).map(l=>`${F(i,a)} \xB7 ${l}`)),`a ${n} scene does not read this attribute \xB7 it is dropped, and the picture does not change`),s("SCENE_ICON_UNKNOWN","error",o(i=>!!i.icon&&!w(i.icon)),"the icon is not in the 24-glyph set \xB7 it draws nothing, silently"),n==="bars"&&(s("SCENE_VALUE_INVALID","error",o(i=>C(i.value)===null),"`value` is missing or is not a number \xB7 the bar is drawn flat"),Qe(e,t,s,o)),n==="ranges"&&(s("SCENE_VALUE_INVALID","error",o(rt),nt),tt(t,s,o)),n==="matrix"&&it(t,s,o),n==="lanes"&&ot(t,s),n==="units"&&st(e,t,s,o),s("SCENE_EMPHASIS_MANY","warning",n==="bars"?qe(e):Ee(e),"more than one item is emphasised \xB7 the scene puts one forward, and two are none"),s("SCENE_LABEL_LONG","warning",o(i=>he(i.label??"").length>de),`a label past ${de} words reads as a sentence \xB7 one to three words, the detail goes in the note`),s("SCENE_NOTE_LONG","warning",o(i=>(i.note??"").trim().split(je).length>1),"a note of more than one sentence \xB7 the scene is read from the back of the room, one sentence each"),r}function Ye(n,e){let t=Xe[n];return Ke.filter(r=>(r==="emphasis"?e.emphasis:e[r]!==null)&&!t.includes(r))}var Ze=n=>n.flatMap((e,t)=>e.emphasis?[F(e,t)]:[]),Ee=n=>{let e=Ze(n);return e.length>1?e:[]};function qe(n){let e=[];for(let t of n){let r=e.at(-1);r&&(r[0].note??"")===(t.note??"")?r.push(t):e.push([t])}return e.flatMap(Ee)}function Je(n,e,t){let r=i=>F(i,e.indexOf(i));if(n==="flow"){let i=ae(e,l=>l.emphasis),a=new Set([...i.sources,i.hub,...i.outcomes]);t("SCENE_ITEMS_DROPPED","error",e.filter(l=>!a.has(l)).map(r),`a flow draws ${$} sources before the hub and ${P} outcomes after it at most \xB7 these are not drawn`),e.length<me&&pe(t,e.length,me,ze);return}let{min:s,max:o}=S[n];t("SCENE_ITEMS_DROPPED","error",e.slice(o).map(r),`a ${n} scene draws at most ${o} items \xB7 these are not drawn`),e.length<s&&pe(t,e.length,s,o)}function pe(n,e,t,r){n("SCENE_TOO_FEW_ITEMS","error",[`${e} item${e===1?"":"s"}`],`the scene is built for ${t} to ${r} items \xB7 with ${e} it has nothing to compare`)}function q(n,e){if(!n?.trim())return null;let t=e(n);return t!==null&&t>0?t:!1}function Qe(n,e,t,r){let s=q(e.max,C),o=q(e.height,C);t("SCENE_ATTRIBUTE_INVALID","error",[...s===!1?["max"]:[],...o===!1?["height"]:[]],"`max` and `height` must be positive numbers \xB7 the scene drew its default instead"),typeof s=="number"&&t("SCENE_VALUE_CLIPPED","error",r(i=>{let a=C(i.value);return a!==null&&(a>s||a<0)}),`a value is past the scale (0 to ${s}) \xB7 its bar stops at the edge, so it is not the size it says \xB7 raise \`max\``),t("SCENE_GROUP_SPLIT","warning",et(n),"a note comes back after another \xB7 only neighbours with the same note share a group, so these are drawn as separate groups \xB7 keep the items of a group together")}function et(n){let e=new Set,t=new Set,r=null;for(let s of n){let o=(s.note??"").trim();o&&o!==r&&e.has(o)&&t.add(o),o&&e.add(o),r=o}return[...t]}function tt(n,e,t){let r=q(n.scale,o=>y(o));if(e("SCENE_ATTRIBUTE_INVALID","error",r===!1?["scale"]:[],"`scale` must be a positive number \xB7 the scene fitted the scale to the rows instead"),typeof r!="number")return;let s=o=>{let i=y(o);return i!==null&&(i>r||i<0)};e("SCENE_VALUE_CLIPPED","error",t(o=>s(o.from)||s(o.to)),`a bound is past the scale (0 to ${r}) \xB7 the bar stops at the edge, so it is not the length it says \xB7 raise \`scale\``)}var nt="`from` and `to` must be numbers when written, with `from` first \xB7 otherwise the bar lands where the scene guessed";function rt(n){let e=y(n.from),t=y(n.to),r=!!n.from?.trim(),s=!!n.to?.trim();return r&&e===null||s&&t===null?!0:e!==null&&t!==null&&e>t}function ot(n,e){let t=["passed","blocked"].filter(r=>!ce(n[r],le).valid);e("SCENE_VALUE_INVALID","error",t,`these must be whole numbers from 0 to ${Y} \xB7 the scene drew its default instead`)}function st(n,e,t,r){let s=E(e.total,k,1,I),o=E(e.columns,G(s.value),1,T),i=[...s.valid?[]:["total"],...o.valid?[]:["columns"]];t("SCENE_VALUE_INVALID","error",i,`\`total\` is a whole number from 1 to ${I} and \`columns\` from 1 to ${T} \xB7 the scene drew its default instead`),t("SCENE_VALUE_INVALID","error",r(a=>!E(a.value,0,0,s.value).valid||!a.value?.trim()),`\`value\` is how many cells are lit, a whole number from 0 to ${s.value} \xB7 missing or out of range, the grid is drawn empty or full`),t("SCENE_GRID_TOO_DENSE","error",o.valid&&!oe(s.value,o.value,D(n.length,e.width))?[`${s.value} cells in ${o.value} columns`]:[],`the cells are under ${K} units wide at this size \xB7 fewer cells, fewer columns would not help, fewer panels would`)}function it(n,e,t){let r=ue(n.columns??void 0).length,s=i=>he(i.level??""),o=new Set(Z);e("SCENE_LEVEL_INVALID","error",t(i=>{let a=s(i);return r>0&&a.length!==r||a.some(m=>!o.has(m))}),`\`level\` needs one status per column${r?` (${r})`:""}, each one of ${Z.join(", ")} \xB7 a missing or unknown one is drawn as "none"`)}var ct=200,xe=null;function ut(){return xe??=document.createElement("canvas"),xe.getContext("2d")}function Q(n,e,t="--rik-font-sans"){let r=getComputedStyle(n),s=r.getPropertyValue(t).trim()||r.getPropertyValue("--rik-font-sans").trim()||"sans-serif";return o=>{let i=ut();if(!i)return l=>l.length*o*.5;let a=`${e} ${o}px ${s}`;return mt(a),l=>(i.font=a,i.measureText(l).width)}}var Se=new Set;function mt(n){Se.has(n)||!document.fonts?.load||(Se.add(n),document.fonts.load(n).catch(e=>{console.warn(`rikiki \xB7 scene font did not load (${n}): ${String(e)}`)}))}function Ae(n,e,t){return Object.entries(e).filter(([,r])=>!r.fits).map(([r,s])=>({item:n,field:r,text:s.lines.join(" "),budget:t,size:s.size}))}var Te=lt`:host{display:block;inline-size:100%}svg{display:block;inline-size:100%;block-size:auto;overflow:visible}text{font-family:var(--rik-font-sans);fill:var(--rik-text-default)}.note{fill:var(--deck-scene-muted,var(--rik-text-default--muted))}.tag{/* The strong accent,not the text accent · a tag sits on a card (paper-100),and the text accent measures 2.8:1 there,under the 3:1 large text needs. \`check\` (SVG_TEXT_CONTRAST_LOW) found it on the default theme. */
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
`;function dt(n){let e=t=>n.getAttribute(t);return{label:e("label"),note:e("note"),icon:e("icon"),tag:e("tag"),value:e("value"),level:e("level"),from:e("from"),to:e("to"),emphasis:n.hasAttribute("emphasis")}}var v=class extends at{constructor(){super(...arguments);this.playing=!1;this.warnedIssues="";this.linted=[];this.overflows=[];this.onFontsLoaded=()=>{this.requestUpdate()}}get width(){let t=this.frameWidth;return t!==void 0&&Number.isFinite(t)&&t>=ct?t:1600}get items(){return[...this.querySelectorAll(":scope > deck-scene-item")]}connectedCallback(){super.connectedCallback(),this.onShownSlide()?this.applyStep(0):this.playing=!1,document.fonts?.ready.then(()=>this.requestUpdate()),document.fonts?.addEventListener("loadingdone",this.onFontsLoaded),this.observer=new MutationObserver(t=>{t.some(r=>r.type==="childList"||r.target!==this)&&this.requestUpdate()}),this.observer.observe(this,{attributes:!0,childList:!0,subtree:!0})}disconnectedCallback(){super.disconnectedCallback(),this.observer?.disconnect(),document.fonts?.removeEventListener("loadingdone",this.onFontsLoaded)}onShownSlide(){let t=this.closest("deck-root");return!t||t.hasAttribute("data-overview-snapshot")||t.hasAttribute("preview")?!1:!!this.closest("deck-root > [active]")}applyStep(t){t===0&&(this.playing=!1,requestAnimationFrame(()=>{this.playing=!0}))}willUpdate(){let t=J(this.localName);this.linted=t?ge(t,this.items.map(dt),{columns:this.getAttribute("columns"),passed:this.getAttribute("passed"),blocked:this.getAttribute("blocked"),total:this.getAttribute("total"),max:this.getAttribute("max"),height:this.getAttribute("height"),scale:this.getAttribute("scale"),width:this.width}):[]}updated(){let t=J(this.localName),r=this.renderRoot.querySelector("svg")?.getAttribute("viewBox"),s=Number(r?.split(" ")[3])-2*x,o=t&&s>0&&this.frameWidth===void 0?be(t,s,this.items.length):null,i=fe(t??this.localName.replace(/^deck-scene-/,""),this.overflows,{width:this.width,count:this.items.length});this.reportIssues([...this.linted,...this.extraIssues(),...i?[i]:[],...o?[o]:[]])}extraIssues(){return[]}reportIssues(t){let r=t.length?JSON.stringify(t):"";if(r!==(this.getAttribute("data-scene-issues")??"")&&(r?this.setAttribute("data-scene-issues",r):this.removeAttribute("data-scene-issues")),r&&r!==this.warnedIssues)for(let s of t)console.warn(`<${this.localName}> \xB7 ${s.message}: ${s.items.join(", ")}`);this.warnedIssues=r}reportOverflow(t){this.overflows=t.map(r=>typeof r=="string"?{item:r,field:"text"}:r)}};u([_e({type:Boolean,reflect:!0})],v.prototype,"playing",2),u([_e({type:Number,attribute:"frame-width"})],v.prototype,"frameWidth",2);var L=48,ht=L/24,Me=20,bt=2,gt=2,Et=28,we=20,_t=.2,_=class extends v{render(){let e=this.items.slice(0,S.units.max);if(!e.length)return this.reportOverflow([]),ve``;let t=E(this.total,k,1,I).value,r=D(e.length,this.width),s=E(this.columns,G(t),1,T).value,o=z(t,s,r),i=se(t,o),a=Q(this,p.label.weight),l=Q(this,p.note.weight),m=(r-o.width)/2,g=e.some(c=>w(c.getAttribute("icon"))),b=e.map(c=>this.panel(c,t,r-m,g,a,l)),O=Math.max(g?L:0,...b.map(c=>c.label.lines.length*p.label.line))+Et,R=Math.max(0,...b.map(c=>c.note.lines.length))*p.note.line,U=O+o.height+(R?we+R:0);return this.reportOverflow(b.flatMap(c=>Ae(c.name,{label:c.label,note:c.note}))),ve`<svg viewBox=${ne(U,this.width)} role="img" aria-label=${this.describe(b,t)} part="drawing"> ${b.map((c,f)=>this.drawPanel(c,f*(r+X)+m,f,{frame:o,cells:i,captionHeight:O,hasIcon:g}))} </svg>`}panel(e,t,r,s,o,i){let a=w(e.getAttribute("icon")),l=r-(s?L+Me:0),m=Number(e.getAttribute("value")),g=Number.isFinite(m)?Math.min(Math.max(0,Math.round(m)),t):0;return{icon:a,lit:g,name:e.getAttribute("label")??"",label:B(e.getAttribute("label")??"",l,bt,p.label.size,o),note:B(e.getAttribute("note")??"",r,gt,p.note.size,i),emphasis:e.hasAttribute("emphasis")}}drawPanel(e,t,r,s){let{frame:o,cells:i,captionHeight:a,hasIcon:l}=s,m=t+(l?L+Me:0),g=ie(o.columns,r),b=a,O=Array.from({length:o.columns},(c,f)=>i.filter(M=>M.column===f)),R=o.cell*_t,U=(L-e.label.lines.length*p.label.line)/2;return N`<g>
      <g class="fade" style="--t0:${.05+r*.18}s">
        ${e.icon?N`<g transform="translate(${t} 0) scale(${ht})"><path class="icon" d=${e.icon}></path></g>`:""}
        ${e.label.lines.map((c,f)=>N`<text class="label" x=${m}
            y=${Math.max(0,U)+f*p.label.line+e.label.size*H}
            font-size=${e.label.size} font-weight=${p.label.weight}>${c}</text>`)}
      </g>
      <g transform="translate(${t} ${b})">
        ${O.map((c,f)=>N`<g class="pop" style="--t0:${g[f]}s">
            ${c.map(M=>N`<rect class="cell ${M.index<e.lit?e.emphasis?"on accent":"on":"off"}"
                x=${M.x} y=${M.y} width=${o.cell} height=${o.cell} rx=${R}></rect>`)}
          </g>`)}
      </g>
      ${e.note.lines.map((c,f)=>N`<text class="note fade" style="--t0:${.4+r*.18}s" x=${t}
          y=${b+o.height+we+f*p.note.line+e.note.size*H}
          font-size=${e.note.size} font-weight=${p.note.weight}>${c}</text>`)}
    </g>`}describe(e,t){return e.map(r=>[`${r.name}: ${r.lit} of ${t}`,r.note.lines.join(" ")].filter(Boolean).join(", ")).join("; ")}};_.styles=[Te,pt`.cell.on{fill:var(--deck-scene-line,var(--rik-text-default))}.cell.on.accent{fill:var(--deck-scene-emphasis-bg,var(--rik-accent))}.cell.off{fill:none;stroke:var(--deck-scene-card-stroke,var(--rik-border-default));stroke-width:1.5}`],u([Ne({type:String})],_.prototype,"total",2),u([Ne({type:String})],_.prototype,"columns",2),_=u([ft("deck-scene-units")],_);export{_ as DeckSceneUnits};
