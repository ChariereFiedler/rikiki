var Xe=Object.defineProperty;var ze=Object.getOwnPropertyDescriptor;var d=(n,e,t,r)=>{for(var o=r>1?void 0:r?ze(e,t):e,s=n.length-1,i;s>=0;s--)(i=n[s])&&(o=(r?i(e,t,o):i(o))||o);return r&&o&&Xe(e,t,o),o};import{html as re,svg as E}from"./vendor/lit.js";import{customElement as Rt}from"./vendor/lit.js";var je='{"check":"M20 6 9 17l-5-5","cross":"M18 6 6 18M6 6l12 12","alert":"M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z","info":"M12 16v-4m0-4h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z","question":"M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3m.1 4h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z","ban":"M4.9 4.9l14.2 14.2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z","arrow":"M5 12h14m-6-6 6 6-6 6","arrow-down":"M12 5v14m6-6-6 6-6-6","clock":"M12 6v6l4 2m6-2a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z","calendar":"M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z","refresh":"M21 12a9 9 0 1 1-3-6.7M21 3v6h-6","trend":"M22 7 13.5 15.5l-5-5L2 17M16 7h6v6","user":"M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z","team":"M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Zm10 14v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8","target":"M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0-6a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 9a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z","flag":"M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1Zm0 0v7","lock":"M7 11V7a5 5 0 0 1 10 0v4M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z","search":"M21 21l-4.3-4.3M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z","code":"M16 18l6-6-6-6M8 6l-6 6 6 6","database":"M3 5c0 1.7 4 3 9 3s9-1.3 9-3-4-3-9-3-9 1.3-9 3Zm0 0v14c0 1.7 4 3 9 3s9-1.3 9-3V5M3 12c0 1.7 4 3 9 3s9-1.3 9-3","cloud":"M17.5 19a4.5 4.5 0 0 0 0-9h-1.3A7 7 0 1 0 4 16.9","document":"M14 2v6h6M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Zm-6 11h8m-8 4h8m-8-8h2","chart":"M3 3v18h18M7 16V9m5 7V5m5 11v-4","spark":"M12 2 15 9l7 3-7 3-3 7-3-7-7-3 7-3Z"}',ce=Object.freeze(JSON.parse(je)),Gt=Object.keys(ce);function R(n){return n?ce[n.trim().toLowerCase()]??null:null}import{LitElement as Ye,css as Ze}from"./vendor/lit.js";import{property as x}from"./vendor/lit.js";var b=class extends Ye{constructor(){super(...arguments);this.emphasis=!1}static{this.styles=Ze`:host{display:none}`}render(){return null}};d([x({type:String})],b.prototype,"label",2),d([x({type:String})],b.prototype,"note",2),d([x({type:String})],b.prototype,"icon",2),d([x({type:String})],b.prototype,"tag",2),d([x({type:String})],b.prototype,"value",2),d([x({type:String})],b.prototype,"level",2),d([x({type:String})],b.prototype,"from",2),d([x({type:String})],b.prototype,"to",2),d([x({type:Boolean,reflect:!0})],b.prototype,"emphasis",2);customElements.get("deck-scene-item")||customElements.define("deck-scene-item",b);var f=Object.freeze({label:{size:31,weight:650,line:38},note:{size:25,weight:400,line:34},tag:{size:23,weight:600,line:30},value:{size:56,weight:750,line:64}}),ue=.8,v=4;function me(n,e=1600){return`${-v} ${-v} ${e+2*v} ${n+2*v}`}var X=620;var de=.88,S=28,z=32,G=Object.freeze({cards:{min:2,max:5},steps:{min:1,max:6},bars:{min:2,max:8},matrix:{min:1,max:6},ranges:{min:1,max:8},lanes:{min:2,max:5},units:{min:1,max:3}});function le(n,e,t,r){let o=n.trim().split(/[ \t\n\r]+/).filter(Boolean),s=[],i="",a=!0;for(let c of o){let l=i?`${i} ${c}`:c;if(t(l)<=e){i=l;continue}i&&s.push(i),i=c,t(c)>e&&(a=!1)}return i&&s.push(i),{lines:s,fits:a&&s.length<=r}}function P(n,e,t,r,o){let s=le(n,e,o(r),t);if(s.fits)return{...s,size:r};let i=Math.round(r*de);return{...le(n,e,o(i),t),size:i}}var H=4,F=2,_=Object.freeze({sources:.3,hub:.22,outcomes:.26}),j=(1-_.sources-_.hub-_.outcomes)/2,pe=8;function U(n,e){let t=n.findIndex(e),r=t>=0?t:n.length-1;return{sources:n.slice(0,Math.max(0,r)).slice(0,H),hub:n[r],outcomes:n.slice(r+1,r+1+F)}}var Y=n=>Math.round(n/pe)*pe;function he(n,e,t=1600){let r=_.hub+(n?_.sources+j:0)+(e?_.outcomes+j:0),o=t/r,s=Y(j*o),i=0,a=null;n&&(a={x:i,width:Y(_.sources*o)},i+=a.width+s);let c=e?Y(_.hub*o):t-i,l={x:i,width:c};i+=c+s;let m=e?{x:i,width:t-i}:null;return{sources:a,hub:l,outcomes:m,link:s}}function y(n,e){return n>0?n*e+(n-1)*z:0}function fe(n,e,t){let r=t-y(n,e)/2;return Array.from({length:n},(o,s)=>r+s*(e+z))}function be(n,e,t){let r=t>1?y(t,e)-e:0;return Math.max(n,r+2*S)}import{LitElement as vt,css as Nt}from"./vendor/lit.js";import{property as Le}from"./vendor/lit.js";var zt=G.bars.max;var qe=48;var Je=16,jt=(qe-Je)/2;function L(n){let e=(n??"").replace(/\s/g,"").replace(",",".");if(!e)return null;let t=Number(e);return Number.isFinite(t)?t:null}var Z=8,ge=3;var Qe=10,et=6,qt=2*Qe+et;function Ee(n,e){if(n==null||n.trim()==="")return{value:e,valid:!0};let t=Number(n),r=Number.isInteger(t)&&t>=0&&t<=Z;return{value:r?t:e,valid:r}}var J=400,xe=100,Q=12,tt=44,nt=340,q=.25,rt=2.2,B=40;function W(n,e,t,r){if(n==null||n.trim()==="")return{value:e,valid:!0};let o=Number(n),s=Number.isInteger(o)&&o>=t&&o<=r;return{value:s?o:e,valid:s}}var ot=48;function _e(n,e=1600){let t=Math.max(1,n);return(e-ot*(t-1))/t}function Se(n){return Math.min(B,Math.max(1,Math.ceil(Math.sqrt(n*rt))))}function st(n,e,t,r=nt){let o=Math.ceil(n/e),s=Math.ceil(n/o),i=Math.min(tt,t/(s+(s-1)*q),r/(o+(o-1)*q)),a=i*q;return{columns:s,rows:o,cell:i,gap:a,width:s*i+(s-1)*a,height:o*i+(o-1)*a}}function Te(n,e,t){return st(n,e,t).cell>=Q}var ee=["prod","pilot","test","announced","none"];var tn=Object.freeze({prod:"in production",pilot:"pilot",test:"in test",announced:"announced",none:"nothing yet"});var it=n=>(n??"").split("|").map(e=>e.trim()).filter(Boolean);function Ae(n){return it(n).slice(0,12)}function O(n){if(n===null||n.trim()==="")return null;let e=Number(n);return Number.isFinite(e)?e:null}var at=["cards","steps","flow","bars","matrix","ranges","lanes","units"];function ne(n){let e=n.toLowerCase().replace(/^deck-scene-/,"");return at.includes(e)?e:null}var ct=["label","note","icon","tag","value","level","from","to","emphasis"],lt=Object.freeze({cards:["label","note","icon","tag","emphasis"],steps:["label","note","tag","emphasis"],flow:["label","note","icon","tag","emphasis"],bars:["label","note","tag","value","emphasis"],matrix:["label","level","emphasis"],ranges:["label","note","tag","from","to"],lanes:["label","note","icon","tag"],units:["label","note","icon","value","emphasis"]});function we(n,e,t){if(!e.length)return null;let r=e.map(s=>`${s.item} \xB7 ${s.field}`),o=e.filter(s=>s.measured!==void 0&&s.budget!==void 0).map(s=>`${s.item} \xB7 ${s.field} needs ${Math.round(s.measured??0)} of ${Math.round(s.budget??0)} units`);return{code:"SCENE_TEXT_TOO_LONG",severity:"error",items:r,fields:e,...t?{scene:{kind:n,...t}}:{},message:`a ${n} scene could not fit ${r.join(", ")} even one size down \xB7 drawn anyway, past its box${o.length?` (${o.join("; ")})`:""}`}}var ve=2,ut=H+1+F,Ne=4,mt=/(?<=[.!?…])\s+(?=\p{Lu})/u,V=(n,e)=>n.label?.trim()||`item ${e+1}`,Ie=n=>n.trim().split(/\s+/).filter(Boolean);function Ce(n,e,t){return e<=X?null:{code:"SCENE_TOO_TALL",severity:"error",items:[`${t} ${t===1?"item":"items"}, ${Math.round(e)} units tall`],message:`a slide leaves room for about ${X} units and this ${n} scene is taller \xB7 the slide clips it \xB7 fewer items, or split the slide`}}function Re(n,e,t={}){let r=[],o=(i,a,c,l)=>{c.length&&r.push({code:i,severity:a,items:c,message:l})},s=i=>e.flatMap((a,c)=>i(a,c)?[V(a,c)]:[]);return ft(n,e,o),o("SCENE_ITEM_NO_LABEL","error",s(i=>!i.label?.trim()),"an item has no label \xB7 the scene would draw it as an empty box"),o("SCENE_ATTRIBUTE_IGNORED","warning",e.flatMap((i,a)=>dt(n,i).map(c=>`${V(i,a)} \xB7 ${c}`)),`a ${n} scene does not read this attribute \xB7 it is dropped, and the picture does not change`),o("SCENE_ICON_UNKNOWN","error",s(i=>!!i.icon&&!R(i.icon)),"the icon is not in the 24-glyph set \xB7 it draws nothing, silently"),n==="bars"&&(o("SCENE_VALUE_INVALID","error",s(i=>L(i.value)===null),"`value` is missing or is not a number \xB7 the bar is drawn flat"),bt(e,t,o,s)),n==="ranges"&&(o("SCENE_VALUE_INVALID","error",s(_t),xt),Et(t,o,s)),n==="matrix"&&At(t,o,s),n==="lanes"&&St(t,o),n==="units"&&Tt(e,t,o,s),o("SCENE_EMPHASIS_MANY","warning",n==="bars"?ht(e):ye(e),"more than one item is emphasised \xB7 the scene puts one forward, and two are none"),o("SCENE_LABEL_LONG","warning",s(i=>Ie(i.label??"").length>Ne),`a label past ${Ne} words reads as a sentence \xB7 one to three words, the detail goes in the note`),o("SCENE_NOTE_LONG","warning",s(i=>(i.note??"").trim().split(mt).length>1),"a note of more than one sentence \xB7 the scene is read from the back of the room, one sentence each"),r}function dt(n,e){let t=lt[n];return ct.filter(r=>(r==="emphasis"?e.emphasis:e[r]!==null)&&!t.includes(r))}var pt=n=>n.flatMap((e,t)=>e.emphasis?[V(e,t)]:[]),ye=n=>{let e=pt(n);return e.length>1?e:[]};function ht(n){let e=[];for(let t of n){let r=e.at(-1);r&&(r[0].note??"")===(t.note??"")?r.push(t):e.push([t])}return e.flatMap(ye)}function ft(n,e,t){let r=i=>V(i,e.indexOf(i));if(n==="flow"){let i=U(e,c=>c.emphasis),a=new Set([...i.sources,i.hub,...i.outcomes]);t("SCENE_ITEMS_DROPPED","error",e.filter(c=>!a.has(c)).map(r),`a flow draws ${H} sources before the hub and ${F} outcomes after it at most \xB7 these are not drawn`),e.length<ve&&Me(t,e.length,ve,ut);return}let{min:o,max:s}=G[n];t("SCENE_ITEMS_DROPPED","error",e.slice(s).map(r),`a ${n} scene draws at most ${s} items \xB7 these are not drawn`),e.length<o&&Me(t,e.length,o,s)}function Me(n,e,t,r){n("SCENE_TOO_FEW_ITEMS","error",[`${e} item${e===1?"":"s"}`],`the scene is built for ${t} to ${r} items \xB7 with ${e} it has nothing to compare`)}function te(n,e){if(!n?.trim())return null;let t=e(n);return t!==null&&t>0?t:!1}function bt(n,e,t,r){let o=te(e.max,L),s=te(e.height,L);t("SCENE_ATTRIBUTE_INVALID","error",[...o===!1?["max"]:[],...s===!1?["height"]:[]],"`max` and `height` must be positive numbers \xB7 the scene drew its default instead"),typeof o=="number"&&t("SCENE_VALUE_CLIPPED","error",r(i=>{let a=L(i.value);return a!==null&&(a>o||a<0)}),`a value is past the scale (0 to ${o}) \xB7 its bar stops at the edge, so it is not the size it says \xB7 raise \`max\``),t("SCENE_GROUP_SPLIT","warning",gt(n),"a note comes back after another \xB7 only neighbours with the same note share a group, so these are drawn as separate groups \xB7 keep the items of a group together")}function gt(n){let e=new Set,t=new Set,r=null;for(let o of n){let s=(o.note??"").trim();s&&s!==r&&e.has(s)&&t.add(s),s&&e.add(s),r=s}return[...t]}function Et(n,e,t){let r=te(n.scale,s=>O(s));if(e("SCENE_ATTRIBUTE_INVALID","error",r===!1?["scale"]:[],"`scale` must be a positive number \xB7 the scene fitted the scale to the rows instead"),typeof r!="number")return;let o=s=>{let i=O(s);return i!==null&&(i>r||i<0)};e("SCENE_VALUE_CLIPPED","error",t(s=>o(s.from)||o(s.to)),`a bound is past the scale (0 to ${r}) \xB7 the bar stops at the edge, so it is not the length it says \xB7 raise \`scale\``)}var xt="`from` and `to` must be numbers when written, with `from` first \xB7 otherwise the bar lands where the scene guessed";function _t(n){let e=O(n.from),t=O(n.to),r=!!n.from?.trim(),o=!!n.to?.trim();return r&&e===null||o&&t===null?!0:e!==null&&t!==null&&e>t}function St(n,e){let t=["passed","blocked"].filter(r=>!Ee(n[r],ge).valid);e("SCENE_VALUE_INVALID","error",t,`these must be whole numbers from 0 to ${Z} \xB7 the scene drew its default instead`)}function Tt(n,e,t,r){let o=W(e.total,xe,1,J),s=W(e.columns,Se(o.value),1,B),i=[...o.valid?[]:["total"],...s.valid?[]:["columns"]];t("SCENE_VALUE_INVALID","error",i,`\`total\` is a whole number from 1 to ${J} and \`columns\` from 1 to ${B} \xB7 the scene drew its default instead`),t("SCENE_VALUE_INVALID","error",r(a=>!W(a.value,0,0,o.value).valid||!a.value?.trim()),`\`value\` is how many cells are lit, a whole number from 0 to ${o.value} \xB7 missing or out of range, the grid is drawn empty or full`),t("SCENE_GRID_TOO_DENSE","error",s.valid&&!Te(o.value,s.value,_e(n.length,e.width))?[`${o.value} cells in ${s.value} columns`]:[],`the cells are under ${Q} units wide at this size \xB7 fewer cells, fewer columns would not help, fewer panels would`)}function At(n,e,t){let r=Ae(n.columns??void 0).length,o=i=>Ie(i.level??""),s=new Set(ee);e("SCENE_LEVEL_INVALID","error",t(i=>{let a=o(i);return r>0&&a.length!==r||a.some(l=>!s.has(l))}),`\`level\` needs one status per column${r?` (${r})`:""}, each one of ${ee.join(", ")} \xB7 a missing or unknown one is drawn as "none"`)}var Mt=200,Oe=null;function wt(){return Oe??=document.createElement("canvas"),Oe.getContext("2d")}function K(n,e,t="--rik-font-sans"){let r=getComputedStyle(n),o=r.getPropertyValue(t).trim()||r.getPropertyValue("--rik-font-sans").trim()||"sans-serif";return s=>{let i=wt();if(!i)return c=>c.length*s*.5;let a=`${e} ${s}px ${o}`;return It(a),c=>(i.font=a,i.measureText(c).width)}}var ke=new Set;function It(n){ke.has(n)||!document.fonts?.load||(ke.add(n),document.fonts.load(n).catch(e=>{console.warn(`rikiki \xB7 scene font did not load (${n}): ${String(e)}`)}))}function $e(n,e,t){return Object.entries(e).filter(([,r])=>!r.fits).map(([r,o])=>({item:n,field:r,text:o.lines.join(" "),budget:t,size:o.size}))}var De=Nt`:host{display:block;inline-size:100%}svg{display:block;inline-size:100%;block-size:auto;overflow:visible}text{font-family:var(--rik-font-sans);fill:var(--rik-text-default)}.note{fill:var(--deck-scene-muted,var(--rik-text-default--muted))}.tag{/* The strong accent,not the text accent · a tag sits on a card (paper-100),and the text accent measures 2.8:1 there,under the 3:1 large text needs. \`check\` (SVG_TEXT_CONTRAST_LOW) found it on the default theme. */
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
`;function Ct(n){let e=t=>n.getAttribute(t);return{label:e("label"),note:e("note"),icon:e("icon"),tag:e("tag"),value:e("value"),level:e("level"),from:e("from"),to:e("to"),emphasis:n.hasAttribute("emphasis")}}var N=class extends vt{constructor(){super(...arguments);this.playing=!1;this.warnedIssues="";this.linted=[];this.overflows=[];this.onFontsLoaded=()=>{this.requestUpdate()}}get width(){let t=this.frameWidth;return t!==void 0&&Number.isFinite(t)&&t>=Mt?t:1600}get items(){return[...this.querySelectorAll(":scope > deck-scene-item")]}connectedCallback(){super.connectedCallback(),this.onShownSlide()?this.applyStep(0):this.playing=!1,document.fonts?.ready.then(()=>this.requestUpdate()),document.fonts?.addEventListener("loadingdone",this.onFontsLoaded),this.observer=new MutationObserver(t=>{t.some(r=>r.type==="childList"||r.target!==this)&&this.requestUpdate()}),this.observer.observe(this,{attributes:!0,childList:!0,subtree:!0})}disconnectedCallback(){super.disconnectedCallback(),this.observer?.disconnect(),document.fonts?.removeEventListener("loadingdone",this.onFontsLoaded)}onShownSlide(){let t=this.closest("deck-root");return!t||t.hasAttribute("data-overview-snapshot")||t.hasAttribute("preview")?!1:!!this.closest("deck-root > [active]")}applyStep(t){t===0&&(this.playing=!1,requestAnimationFrame(()=>{this.playing=!0}))}willUpdate(){let t=ne(this.localName);this.linted=t?Re(t,this.items.map(Ct),{columns:this.getAttribute("columns"),passed:this.getAttribute("passed"),blocked:this.getAttribute("blocked"),total:this.getAttribute("total"),max:this.getAttribute("max"),height:this.getAttribute("height"),scale:this.getAttribute("scale"),width:this.width}):[]}updated(){let t=ne(this.localName),r=this.renderRoot.querySelector("svg")?.getAttribute("viewBox"),o=Number(r?.split(" ")[3])-2*v,s=t&&o>0&&this.frameWidth===void 0?Ce(t,o,this.items.length):null,i=we(t??this.localName.replace(/^deck-scene-/,""),this.overflows,{width:this.width,count:this.items.length});this.reportIssues([...this.linted,...this.extraIssues(),...i?[i]:[],...s?[s]:[]])}extraIssues(){return[]}reportIssues(t){let r=t.length?JSON.stringify(t):"";if(r!==(this.getAttribute("data-scene-issues")??"")&&(r?this.setAttribute("data-scene-issues",r):this.removeAttribute("data-scene-issues")),r&&r!==this.warnedIssues)for(let o of t)console.warn(`<${this.localName}> \xB7 ${o.message}: ${o.items.join(", ")}`);this.warnedIssues=r}reportOverflow(t){this.overflows=t.map(r=>typeof r=="string"?{item:r,field:"text"}:r)}};d([Le({type:Boolean,reflect:!0})],N.prototype,"playing",2),d([Le({type:Number,attribute:"frame-width"})],N.prototype,"frameWidth",2);var A=48,yt=A/24,Fe=28,Ge=24,Ue=14,Lt=2,Ot=2,kt=16,$=12,oe=16,se=8,$t=$+10,h=Object.freeze({source:.1,sourceStagger:.12,linesIn:.5,hub:.55,feedToken:.7,feedTokenDuration:.5,hubToken:1.15,hubTokenDuration:.5,linesOut:1.5,outcome:1.6,outcomeStagger:.12,outToken:1.65,outTokenDuration:.6}),k=class extends N{render(){let e=U(this.items,p=>p.hasAttribute("emphasis"));if(!e.hub)return this.reportOverflow([]),re``;let t=he(e.sources.length>0,e.outcomes.length>0,this.width),r=t.link-2*oe,o=this.boxes(e.sources,t.sources,"source",r),s=this.boxes([e.hub],t.hub,"hub",r),i=this.boxes(e.outcomes,t.outcomes,"outcome",r),a=s[0];if(!a)return re``;let c=ie(o),l=ie(i),m=be(ie(s),l,i.length),u=Math.max(y(o.length,c),m,y(i.length,l)),g=u/2,D=this.place(o,t.sources,c,g),M=this.place(i,t.outcomes,l,g),w={box:a,x:t.hub.x,y:g-m/2,width:t.hub.width,height:m},I=[...o,a,...i];return this.reportOverflow(I.flatMap(p=>$e(p.name,{label:p.label,note:p.note,tag:p.tag}))),re`<svg viewBox=${me(u,this.width)} role="img" aria-label=${this.describe(o,a,i)} part="drawing"> ${this.merge(D,w,g)} ${this.split(w,M)} ${D.map((p,C)=>this.box(p,h.source+C*h.sourceStagger))} ${this.box(w,h.hub)} ${M.map((p,C)=>this.box(p,h.outcome+C*h.outcomeStagger))} </svg>`}boxes(e,t,r,o){if(!t)return[];let s=K(this,f.label.weight),i=K(this,f.note.weight),a=K(this,f.tag.weight),c=u=>r==="outcome"?u.getAttribute("tag")??"":"",l=e.some(u=>R(u.getAttribute("icon"))),m=t.width-2*S-(l&&r!=="hub"?A+Ge:0);return e.map(u=>({iconRoom:l,role:r,label:P(u.getAttribute("label")??"",m,Lt,f.label.size,s),note:P(u.getAttribute("note")??"",m,Ot,f.note.size,i),tag:P(c(u),o,1,f.tag.size,a),icon:R(u.getAttribute("icon")),name:u.getAttribute("label")??""}))}place(e,t,r,o){if(!t)return[];let s=fe(e.length,r,o);return e.map((i,a)=>({box:i,x:t.x,y:s[a]??0,width:t.width,height:r}))}merge(e,t,r){let o=e[0];if(!o)return"";let s=o.x+o.width,i=s+(t.x-s)/2,a=e.map(Pe),c=Math.min(r,...a),l=Math.max(r,...a),m=t.x-oe,u=`--t0:${h.linesIn}s`;return E`
      ${a.map(g=>E`<path class="line fade" style=${u} d="M${s} ${g}H${i}"></path>`)}
      ${l>c?E`<path class="line fade" style=${u} d="M${i} ${c}V${l}"></path>`:""}
      ${He(i,m,r,u)}
      ${a.map(g=>ae(s,i,g,h.feedToken,h.feedTokenDuration))}
      ${ae(i,m,r,h.hubToken,h.hubTokenDuration)}
    `}split(e,t){let r=e.x+e.width,o=`--t0:${h.linesOut}s`;return t.map((s,i)=>{let a=Pe(s),c=s.x-oe,l=s.box.tag;return E`
        ${He(r,c,a,o)}
        ${l.lines.map(m=>E`<text
            class="tag fade"
            style=${o}
            x=${r+(s.x-r)/2}
            y=${a-$t}
            text-anchor="middle"
            font-size=${l.size}
            font-weight=${f.tag.weight}
          >${m}</text>`)}
        ${ae(r,c,a,h.outToken+i*h.outcomeStagger,h.outTokenDuration)}
      `})}box(e,t){let{box:r,x:o,y:s,width:i,height:a}=e,c=r.role==="hub",l=c?"on-emphasis":"",m=!c&&r.iconRoom,u=s+(a-We(r))/2,g=m?u+Math.max(0,(A-Be(r))/2):u+(r.iconRoom?A+Fe:0),D=o+S+(m?A+Ge:0),M=(I,p,C)=>p.lines.map((Ve,Ke)=>E`<text
          class="${I} ${l}"
          x=${D}
          y=${C+Ke*f[I].line+p.size*ue}
          font-size=${p.size}
          font-weight=${f[I].weight}
        >${Ve}</text>`),w=g+r.label.lines.length*f.label.line+Ue;return E`<g class="pop" style="--t0:${t}s">
      <rect class=${c?"emphasis":"card"} x=${o} y=${s} width=${i} height=${a} rx=${kt}></rect>
      ${r.icon?E`<g transform="translate(${o+S} ${u}) scale(${yt})"><path class="icon ${l}" d=${r.icon}></path></g>`:""}
      ${M("label",r.label,g)}
      ${M("note",r.note,w)}
    </g>`}describe(e,t,r){let o=s=>[s.name,s.note.lines.join(" "),s.tag.lines.join(" ")].filter(Boolean).join(", ");return[e.length?`From ${e.map(o).join("; ")}`:"",`to ${o(t)}`,r.length?`giving ${r.map(o).join("; ")}`:""].filter(Boolean).join(", ")}};k.styles=De,k=d([Rt("deck-scene-flow")],k);function Pe(n){return n.y+n.height/2}function Be(n){let e=n.note.lines.length?Ue+n.note.lines.length*f.note.line:0;return n.label.lines.length*f.label.line+e}function We(n){let e=Be(n);return n.iconRoom?n.role==="hub"?A+Fe+e:Math.max(A,e):e}function ie(n){return n.length?2*S+Math.max(...n.map(We)):0}function He(n,e,t,r){return E`<path class="line fade" style=${r}
    d="M${n} ${t}H${e}M${e-$} ${t-$}L${e} ${t}L${e-$} ${t+$}"></path>`}function ae(n,e,t,r,o){let s=n+se,i=e-se-s;return E`<circle class="token" cx=${s} cy=${t} r=${se}
    style="--dx:${i}px;--dy:0px;--du:${o}s;--t0:${r}s"></circle>`}export{k as DeckSceneFlow};
