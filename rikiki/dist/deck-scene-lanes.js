var Be=Object.defineProperty;var ze=Object.getOwnPropertyDescriptor;var m=(n,e,t,r)=>{for(var s=r>1?void 0:r?ze(e,t):e,o=n.length-1,a;o>=0;o--)(a=n[o])&&(s=(r?a(e,t,s):a(s))||s);return r&&s&&Be(e,t,s),s};import{css as Bt,html as Ue,svg as g,unsafeCSS as zt}from"./vendor/lit.js";import{customElement as Vt,property as V}from"./vendor/lit.js";var Ve='{"check":"M20 6 9 17l-5-5","cross":"M18 6 6 18M6 6l12 12","alert":"M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z","info":"M12 16v-4m0-4h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z","question":"M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3m.1 4h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z","ban":"M4.9 4.9l14.2 14.2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z","arrow":"M5 12h14m-6-6 6 6-6 6","arrow-down":"M12 5v14m6-6-6 6-6-6","clock":"M12 6v6l4 2m6-2a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z","calendar":"M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z","refresh":"M21 12a9 9 0 1 1-3-6.7M21 3v6h-6","trend":"M22 7 13.5 15.5l-5-5L2 17M16 7h6v6","user":"M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z","team":"M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Zm10 14v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8","target":"M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0-6a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 9a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z","flag":"M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1Zm0 0v7","lock":"M7 11V7a5 5 0 0 1 10 0v4M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z","search":"M21 21l-4.3-4.3M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z","code":"M16 18l6-6-6-6M8 6l-6 6 6 6","database":"M3 5c0 1.7 4 3 9 3s9-1.3 9-3-4-3-9-3-9 1.3-9 3Zm0 0v14c0 1.7 4 3 9 3s9-1.3 9-3V5M3 12c0 1.7 4 3 9 3s9-1.3 9-3","cloud":"M17.5 19a4.5 4.5 0 0 0 0-9h-1.3A7 7 0 1 0 4 16.9","document":"M14 2v6h6M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Zm-6 11h8m-8 4h8m-8-8h2","chart":"M3 3v18h18M7 16V9m5 7V5m5 11v-4","spark":"M12 2 15 9l7 3-7 3-3 7-3-7-7-3 7-3Z"}',ae=Object.freeze(JSON.parse(Ve)),Qt=Object.keys(ae);function k(n){return n?ae[n.trim().toLowerCase()]??null:null}import{LitElement as Xe,css as Ke}from"./vendor/lit.js";import{property as f}from"./vendor/lit.js";var p=class extends Xe{constructor(){super(...arguments);this.emphasis=!1}static{this.styles=Ke`:host{display:none}`}render(){return null}};m([f({type:String})],p.prototype,"label",2),m([f({type:String})],p.prototype,"note",2),m([f({type:String})],p.prototype,"icon",2),m([f({type:String})],p.prototype,"tag",2),m([f({type:String})],p.prototype,"value",2),m([f({type:String})],p.prototype,"level",2),m([f({type:String})],p.prototype,"from",2),m([f({type:String})],p.prototype,"to",2),m([f({type:Boolean,reflect:!0})],p.prototype,"emphasis",2);customElements.get("deck-scene-item")||customElements.define("deck-scene-item",p);var d=Object.freeze({label:{size:31,weight:650,line:38},note:{size:25,weight:400,line:34},tag:{size:23,weight:600,line:30},value:{size:56,weight:750,line:64}}),y=.8,A=4;function le(n,e=1600){return`${-A} ${-A} ${e+2*A} ${n+2*A}`}var K=620;var ce=.88;var v=Object.freeze({cards:{min:2,max:5},steps:{min:1,max:6},bars:{min:2,max:8},matrix:{min:1,max:6},ranges:{min:1,max:8},lanes:{min:2,max:5},units:{min:1,max:3}});function ie(n,e,t,r){let s=n.trim().split(/[ \t\n\r]+/).filter(Boolean),o=[],a="",i=!0;for(let l of s){let c=a?`${a} ${l}`:l;if(t(c)<=e){a=c;continue}a&&o.push(a),a=l,t(l)>e&&(i=!1)}return a&&o.push(a),{lines:o,fits:i&&o.length<=r}}function T(n,e,t,r,s){let o=ie(n,e,s(r),t);if(o.fits)return{...o,size:r};let a=Math.round(r*ce);return{...ie(n,e,s(a),t),size:a}}var j=8,F=3,pe=3,N=10,Z=6,he=2*N+Z,ue=56,Ye=.6,D=14,je=40,Ze=220,qe=520,me=24,Je=360,de=72,Qe=24,et=88,tt=116;function C(n,e){if(n==null||n.trim()==="")return{value:e,valid:!0};let t=Number(n),r=Number.isInteger(t)&&t>=0&&t<=j;return{value:r?t:e,valid:r}}var fe=(n,e,t)=>Math.min(Math.max(n,e),t);function ge(n){let e=n.hasNotes?tt:et,t=fe(n.labelWidth+je,Ze,qe),r=Math.min(n.tagWidth,Je),s=(n.width??1600)-(r>0?r+me:0),o=t+(s-t)*Ye,a=n.hasHeader?de:D,i=n.lanes*e;return{height:a+i+Qe,laneYs:Array.from({length:n.lanes},(l,c)=>a+e/2+c*e),headerY:de/2,trackLeft:t,trackRight:s,tagX:r>0?s+me:null,tagWidth:r,gate:{x:o-ue/2,y:a-D,width:ue,height:i+2*D,centre:o}}}var G=28;function be(n,e){let t=e>0?e/2:D,r=n.gate.centre-t-G;return{room:r-G-n.trackLeft,tip:r}}var nt=560,rt=.15,Ee=.07,ot=1.4,st=.2,at=.5,it=1;function lt(n,e){let t=e.gate.x+e.gate.width+Z+N,r=e.trackRight-N-t,s=n>1?Math.min(he*1.6,r/(n-1)):0;return Array.from({length:n},(o,a)=>t+a*s)}function ct(n,e){let t=e.gate.x-Z-N;return Array.from({length:n},(r,s)=>t-s*he)}function ut(n,e,t){let r=n+e;if(r===0)return[];let s=Math.min(st,ot/r);return[...lt(n,t).map(a=>["passed",a]),...ct(e,t).map(a=>["blocked",a])].map(([a,i],l)=>{let c=i-t.trackLeft,h=fe(c/nt,at,it),x=rt+l*s,M=a==="passed"?Math.min(1,(t.gate.centre-t.trackLeft)/c):1;return{kind:a,x:i,back:t.trackLeft-i,delay:x,duration:h,crosses:x+h*M}})}function mt(n,e){let t=n.filter(a=>a.kind==="passed"),r=n.filter(a=>a.kind==="blocked");if(!t.length||!r.length)return 0;let s=Math.max(...t.map(a=>a.crosses))+(e-1)*Ee,o=Math.min(...r.map(a=>a.crosses));return Math.max(0,s+2*Y-o)}function _e(n,e,t,r,s=r+1){let o=ut(n,e,t),a=mt(o,s);return o.map(i=>{let l=r*Ee+(i.kind==="blocked"?a:0);return{...i,delay:i.delay+l,crosses:i.crosses+l}})}function xe(n){let e=n.flat(),t=Math.max(0,...e.filter(o=>o.kind==="passed").map(o=>o.crosses)),r=e.filter(o=>o.kind==="blocked").map(o=>o.crosses),s=r.length?Math.min(...r):Number.POSITIVE_INFINITY;return Math.min(t+Y,s-Y)}var Y=.08,Se=.3;import{LitElement as Gt,css as Ft}from"./vendor/lit.js";import{property as De}from"./vendor/lit.js";var un=v.bars.max;var dt=48;var pt=16,mn=(dt-pt)/2;function L(n){let e=(n??"").replace(/\s/g,"").replace(",",".");if(!e)return null;let t=Number(e);return Number.isFinite(t)?t:null}var P=4,U=2,q=Object.freeze({sources:.3,hub:.22,outcomes:.26}),gn=(1-q.sources-q.hub-q.outcomes)/2;function Ae(n,e){let t=n.findIndex(e),r=t>=0?t:n.length-1;return{sources:n.slice(0,Math.max(0,r)).slice(0,P),hub:n[r],outcomes:n.slice(r+1,r+1+U)}}var Q=400,ve=100,ee=12,ht=44,ft=340,J=.25,gt=2.2,H=40;function W(n,e,t,r){if(n==null||n.trim()==="")return{value:e,valid:!0};let s=Number(n),o=Number.isInteger(s)&&s>=t&&s<=r;return{value:o?s:e,valid:o}}var bt=48;function Te(n,e=1600){let t=Math.max(1,n);return(e-bt*(t-1))/t}function Ne(n){return Math.min(H,Math.max(1,Math.ceil(Math.sqrt(n*gt))))}function Et(n,e,t,r=ft){let s=Math.ceil(n/e),o=Math.ceil(n/s),a=Math.min(ht,t/(o+(o-1)*J),r/(s+(s-1)*J)),i=a*J;return{columns:o,rows:s,cell:a,gap:i,width:o*a+(o-1)*i,height:s*a+(s-1)*i}}function we(n,e,t){return Et(n,e,t).cell>=ee}var te=["prod","pilot","test","announced","none"];var xn=Object.freeze({prod:"in production",pilot:"pilot",test:"in test",announced:"announced",none:"nothing yet"});var _t=n=>(n??"").split("|").map(e=>e.trim()).filter(Boolean);function Me(n){return _t(n).slice(0,12)}function R(n){if(n===null||n.trim()==="")return null;let e=Number(n);return Number.isFinite(e)?e:null}var xt=["cards","steps","flow","bars","matrix","ranges","lanes","units"];function re(n){let e=n.toLowerCase().replace(/^deck-scene-/,"");return xt.includes(e)?e:null}var St=["label","note","icon","tag","value","level","from","to","emphasis"],At=Object.freeze({cards:["label","note","icon","tag","emphasis"],steps:["label","note","tag","emphasis"],flow:["label","note","icon","tag","emphasis"],bars:["label","note","tag","value","emphasis"],matrix:["label","level","emphasis"],ranges:["label","note","tag","from","to"],lanes:["label","note","icon","tag"],units:["label","note","icon","value","emphasis"]});function Le(n,e,t){if(!e.length)return null;let r=e.map(o=>`${o.item} \xB7 ${o.field}`),s=e.filter(o=>o.measured!==void 0&&o.budget!==void 0).map(o=>`${o.item} \xB7 ${o.field} needs ${Math.round(o.measured??0)} of ${Math.round(o.budget??0)} units`);return{code:"SCENE_TEXT_TOO_LONG",severity:"error",items:r,fields:e,...t?{scene:{kind:n,...t}}:{},message:`a ${n} scene could not fit ${r.join(", ")} even one size down \xB7 drawn anyway, past its box${s.length?` (${s.join("; ")})`:""}`}}var Ie=2,vt=P+1+U,ye=4,Tt=/(?<=[.!?…])\s+(?=\p{Lu})/u,B=(n,e)=>n.label?.trim()||`item ${e+1}`,Re=n=>n.trim().split(/\s+/).filter(Boolean);function Oe(n,e,t){return e<=K?null:{code:"SCENE_TOO_TALL",severity:"error",items:[`${t} ${t===1?"item":"items"}, ${Math.round(e)} units tall`],message:`a slide leaves room for about ${K} units and this ${n} scene is taller \xB7 the slide clips it \xB7 fewer items, or split the slide`}}function $e(n,e,t={}){let r=[],s=(a,i,l,c)=>{l.length&&r.push({code:a,severity:i,items:l,message:c})},o=a=>e.flatMap((i,l)=>a(i,l)?[B(i,l)]:[]);return It(n,e,s),s("SCENE_ITEM_NO_LABEL","error",o(a=>!a.label?.trim()),"an item has no label \xB7 the scene would draw it as an empty box"),s("SCENE_ATTRIBUTE_IGNORED","warning",e.flatMap((a,i)=>Nt(n,a).map(l=>`${B(a,i)} \xB7 ${l}`)),`a ${n} scene does not read this attribute \xB7 it is dropped, and the picture does not change`),s("SCENE_ICON_UNKNOWN","error",o(a=>!!a.icon&&!k(a.icon)),"the icon is not in the 24-glyph set \xB7 it draws nothing, silently"),n==="bars"&&(s("SCENE_VALUE_INVALID","error",o(a=>L(a.value)===null),"`value` is missing or is not a number \xB7 the bar is drawn flat"),yt(e,t,s,o)),n==="ranges"&&(s("SCENE_VALUE_INVALID","error",o(Ot),Rt),Lt(t,s,o)),n==="matrix"&&Dt(t,s,o),n==="lanes"&&$t(t,s),n==="units"&&kt(e,t,s,o),s("SCENE_EMPHASIS_MANY","warning",n==="bars"?Mt(e):ke(e),"more than one item is emphasised \xB7 the scene puts one forward, and two are none"),s("SCENE_LABEL_LONG","warning",o(a=>Re(a.label??"").length>ye),`a label past ${ye} words reads as a sentence \xB7 one to three words, the detail goes in the note`),s("SCENE_NOTE_LONG","warning",o(a=>(a.note??"").trim().split(Tt).length>1),"a note of more than one sentence \xB7 the scene is read from the back of the room, one sentence each"),r}function Nt(n,e){let t=At[n];return St.filter(r=>(r==="emphasis"?e.emphasis:e[r]!==null)&&!t.includes(r))}var wt=n=>n.flatMap((e,t)=>e.emphasis?[B(e,t)]:[]),ke=n=>{let e=wt(n);return e.length>1?e:[]};function Mt(n){let e=[];for(let t of n){let r=e.at(-1);r&&(r[0].note??"")===(t.note??"")?r.push(t):e.push([t])}return e.flatMap(ke)}function It(n,e,t){let r=a=>B(a,e.indexOf(a));if(n==="flow"){let a=Ae(e,l=>l.emphasis),i=new Set([...a.sources,a.hub,...a.outcomes]);t("SCENE_ITEMS_DROPPED","error",e.filter(l=>!i.has(l)).map(r),`a flow draws ${P} sources before the hub and ${U} outcomes after it at most \xB7 these are not drawn`),e.length<Ie&&Ce(t,e.length,Ie,vt);return}let{min:s,max:o}=v[n];t("SCENE_ITEMS_DROPPED","error",e.slice(o).map(r),`a ${n} scene draws at most ${o} items \xB7 these are not drawn`),e.length<s&&Ce(t,e.length,s,o)}function Ce(n,e,t,r){n("SCENE_TOO_FEW_ITEMS","error",[`${e} item${e===1?"":"s"}`],`the scene is built for ${t} to ${r} items \xB7 with ${e} it has nothing to compare`)}function ne(n,e){if(!n?.trim())return null;let t=e(n);return t!==null&&t>0?t:!1}function yt(n,e,t,r){let s=ne(e.max,L),o=ne(e.height,L);t("SCENE_ATTRIBUTE_INVALID","error",[...s===!1?["max"]:[],...o===!1?["height"]:[]],"`max` and `height` must be positive numbers \xB7 the scene drew its default instead"),t("SCENE_VALUE_CLIPPED","error",r(a=>{let i=L(a.value);return i!==null&&(i<0||typeof s=="number"&&i>s)}),typeof s=="number"?`a value is outside the scale (0 to ${s}) \xB7 its bar stops at the edge \xB7 use non-negative values, or raise \`max\` for values above it`:"a value is negative \xB7 the automatic scale starts at zero, so its bar stays flat \xB7 use non-negative values or a chart with a signed scale"),t("SCENE_GROUP_SPLIT","warning",Ct(n),"a note comes back after another \xB7 only neighbours with the same note share a group, so these are drawn as separate groups \xB7 keep the items of a group together")}function Ct(n){let e=new Set,t=new Set,r=null;for(let s of n){let o=(s.note??"").trim();o&&o!==r&&e.has(o)&&t.add(o),o&&e.add(o),r=o}return[...t]}function Lt(n,e,t){let r=ne(n.scale,o=>R(o));e("SCENE_ATTRIBUTE_INVALID","error",r===!1?["scale"]:[],"`scale` must be a positive number \xB7 the scene fitted the scale to the rows instead");let s=o=>{let a=R(o);return a!==null&&(a<0||typeof r=="number"&&a>r)};e("SCENE_VALUE_CLIPPED","error",t(o=>s(o.from)||s(o.to)),typeof r=="number"?`a bound is outside the scale (0 to ${r}) \xB7 the bar stops at the edge \xB7 use non-negative bounds, or raise \`scale\` for bounds above it`:"a bound is negative \xB7 the automatic scale starts at zero, so the bar stops at the edge \xB7 use non-negative bounds")}var Rt="`from` and `to` must be numbers when written, with `from` first \xB7 otherwise the bar lands where the scene guessed";function Ot(n){let e=R(n.from),t=R(n.to),r=!!n.from?.trim(),s=!!n.to?.trim();return r&&e===null||s&&t===null?!0:e!==null&&t!==null&&e>t}function $t(n,e){let t=["passed","blocked"].filter(r=>!C(n[r],F).valid);e("SCENE_VALUE_INVALID","error",t,`these must be whole numbers from 0 to ${j} \xB7 the scene drew its default instead`)}function kt(n,e,t,r){let s=W(e.total,ve,1,Q),o=W(e.columns,Ne(s.value),1,H),a=[...s.valid?[]:["total"],...o.valid?[]:["columns"]];t("SCENE_VALUE_INVALID","error",a,`\`total\` is a whole number from 1 to ${Q} and \`columns\` from 1 to ${H} \xB7 the scene drew its default instead`),t("SCENE_VALUE_INVALID","error",r(i=>!W(i.value,0,0,s.value).valid||!i.value?.trim()),`\`value\` is how many cells are lit, a whole number from 0 to ${s.value} \xB7 missing or out of range, the grid is drawn empty or full`),t("SCENE_GRID_TOO_DENSE","error",o.valid&&!we(s.value,o.value,Te(n.length,e.width))?[`${s.value} cells in ${o.value} columns`]:[],`the cells are under ${ee} units wide at this size \xB7 fewer cells, fewer columns would not help, fewer panels would`)}function Dt(n,e,t){let r=Me(n.columns??void 0).length,s=a=>Re(a.level??""),o=new Set(te);e("SCENE_LEVEL_INVALID","error",t(a=>{let i=s(a);return r>0&&i.length!==r||i.some(c=>!o.has(c))}),`\`level\` needs one status per column${r?` (${r})`:""}, each one of ${te.join(", ")} \xB7 a missing or unknown one is drawn as "none"`)}var Pt=200,Ge=null;function Ut(){return Ge??=document.createElement("canvas"),Ge.getContext("2d")}function O(n,e,t="--rik-font-sans"){let r=getComputedStyle(n),s=r.getPropertyValue(t).trim()||r.getPropertyValue("--rik-font-sans").trim()||"sans-serif";return o=>{let a=Ut();if(!a)return l=>l.length*o*.5;let i=`${e} ${o}px ${s}`;return Ht(i),l=>(a.font=i,a.measureText(l).width)}}var Fe=new Set;function Ht(n){Fe.has(n)||!document.fonts?.load||(Fe.add(n),document.fonts.load(n).catch(e=>{console.warn(`rikiki \xB7 scene font did not load (${n}): ${String(e)}`)}))}function z(n,e,t){return Object.entries(e).filter(([,r])=>!r.fits).map(([r,s])=>({item:n,field:r,text:s.lines.join(" "),budget:t,size:s.size}))}var Pe=Ft`:host{display:block;inline-size:100%}svg{display:block;inline-size:100%;block-size:auto;overflow:visible}text{font-family:var(--rik-font-sans);fill:var(--rik-text-default)}.note{fill:var(--deck-scene-muted,var(--rik-text-default--muted))}.tag{/* The strong accent,not the text accent · a tag sits on a card (paper-100),and the text accent measures 2.8:1 there,under the 3:1 large text needs. \`check\` (SVG_TEXT_CONTRAST_LOW) found it on the default theme. */
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
`;function Wt(n){let e=t=>n.getAttribute(t);return{label:e("label"),note:e("note"),icon:e("icon"),tag:e("tag"),value:e("value"),level:e("level"),from:e("from"),to:e("to"),emphasis:n.hasAttribute("emphasis")}}var w=class extends Gt{constructor(){super(...arguments);this.playing=!1;this.warnedIssues="";this.linted=[];this.overflows=[];this.onFontsLoaded=()=>{this.requestUpdate()}}get width(){let t=this.frameWidth;return t!==void 0&&Number.isFinite(t)&&t>=Pt?t:1600}get items(){return[...this.querySelectorAll(":scope > deck-scene-item")]}connectedCallback(){super.connectedCallback(),this.onShownSlide()?this.applyStep(0):this.playing=!1,document.fonts?.ready.then(()=>this.requestUpdate()),document.fonts?.addEventListener("loadingdone",this.onFontsLoaded),this.observer=new MutationObserver(t=>{t.some(r=>r.type==="childList"||r.target!==this)&&this.requestUpdate()}),this.observer.observe(this,{attributes:!0,childList:!0,subtree:!0})}disconnectedCallback(){super.disconnectedCallback(),this.observer?.disconnect(),document.fonts?.removeEventListener("loadingdone",this.onFontsLoaded)}onShownSlide(){let t=this.closest("deck-root");return!t||t.hasAttribute("data-overview-snapshot")||t.hasAttribute("preview")?!1:!!this.closest("deck-root > [active]")}applyStep(t){t===0&&(this.playing=!1,requestAnimationFrame(()=>{this.playing=!0}))}willUpdate(){let t=re(this.localName);this.linted=t?$e(t,this.items.map(Wt),{columns:this.getAttribute("columns"),passed:this.getAttribute("passed"),blocked:this.getAttribute("blocked"),total:this.getAttribute("total"),max:this.getAttribute("max"),height:this.getAttribute("height"),scale:this.getAttribute("scale"),width:this.width}):[]}updated(){let t=re(this.localName),r=this.renderRoot.querySelector("svg")?.getAttribute("viewBox"),s=Number(r?.split(" ")[3])-2*A,o=t&&s>0&&this.frameWidth===void 0?Oe(t,s,this.items.length):null,a=Le(t??this.localName.replace(/^deck-scene-/,""),this.overflows,{width:this.width,count:this.items.length});this.reportIssues([...this.linted,...this.extraIssues(),...a?[a]:[],...o?[o]:[]])}extraIssues(){return[]}reportIssues(t){let r=t.length?JSON.stringify(t):"";if(r!==(this.getAttribute("data-scene-issues")??"")&&(r?this.setAttribute("data-scene-issues",r):this.removeAttribute("data-scene-issues")),r&&r!==this.warnedIssues)for(let s of t)console.warn(`<${this.localName}> \xB7 ${s.message}: ${s.items.join(", ")}`);this.warnedIssues=r}reportOverflow(t){this.overflows=t.map(r=>typeof r=="string"?{item:r,field:"text"}:r)}};m([De({type:Boolean,reflect:!0})],w.prototype,"playing",2),m([De({type:Number,attribute:"frame-width"})],w.prototype,"frameWidth",2);var X=48,Xt=X/24,He=24,Kt=360,Yt=360,jt=280,E=12,Zt=12,We=12,b=class extends w{render(){let e=this.items.slice(0,v.lanes.max);if(!e.length)return this.reportOverflow([]),Ue``;let t=O(this,d.label.weight),r=O(this,d.note.weight),s=O(this,d.tag.weight),o=e.map(u=>this.lane(u,t,r,s)),i=o.some(u=>u.icon)?X+He:0,l=T(this.gate??"",jt,1,d.tag.size,s),c=ge({lanes:o.length,hasHeader:!!(this.gate||this.trigger),hasNotes:o.some(u=>u.note.lines.length>0),labelWidth:i+Math.max(...o.map(u=>qt(u,t,r))),tagWidth:Math.max(...o.map(u=>$(u.tag,s))),width:this.width}),h=this.triggerText(c,l,r),x=C(this.passed,F).value,M=C(this.blocked,pe).value,oe=o.map((u,S)=>_e(x,M,c,S,o.length)),se=xe(oe);return this.reportOverflow([...o.flatMap(u=>z(u.name,{label:u.label,note:u.note,tag:u.tag})),...z("gate",{gate:l}),...z("trigger",{trigger:h.fitted})]),Ue`<svg viewBox=${le(c.height,this.width)} role="img" aria-label=${this.describe(o,x,M)} part="drawing"> ${h.draw(c.headerY)} ${l.lines.map(u=>g`<text class="tag fade" style="--t0:${se}s" x=${c.gate.centre} y=${c.headerY+l.size*y/2}
          text-anchor="middle" font-size=${l.size} font-weight=${d.tag.weight}>${u}</text>`)}
      ${o.map((u,S)=>this.laneRow(u,c.laneYs[S]??0,c,i))}
      ${x+M>0||this.gate?g`<rect class="gate emphasis" style="--t0:${se}s" x=${c.gate.x} y=${c.gate.y}
              width=${c.gate.width} height=${c.gate.height} rx=${Zt}></rect>`:""}
      ${o.map((u,S)=>(oe[S]??[]).map(I=>g`<circle class="dot ${I.kind}" cx=${I.x} cy=${c.laneYs[S]??0} r=${N}
            style="--back:${I.back}px;--du:${I.duration}s;--t0:${I.delay}s"></circle>`))}
    </svg>`}lane(e,t,r,s){let o=k(e.getAttribute("icon")),a=Kt-(o?X+He:0);return{icon:o,name:e.getAttribute("label")??"",label:T(e.getAttribute("label")??"",a,1,d.label.size,t),note:T(e.getAttribute("note")??"",a,1,d.note.size,r),tag:T(e.getAttribute("tag")??"",Yt,1,d.tag.size,s)}}triggerText(e,t,r){let s=e.trackLeft,{room:o,tip:a}=be(e,$(t,O(this,d.tag.weight))),i=T(this.trigger??"",o,1,d.note.size,r),l=$(i,r);return{fitted:i,draw:h=>i.lines.length?g`<text class="note fade" x=${s} y=${h+i.size*y/2}
            font-size=${i.size} font-weight=${d.note.weight}>${i.lines[0]}</text>
          <path class="line muted dash fade" d="M${s+l+G} ${h}H${a}"></path>
          <path class="line muted fade" d="M${a-E} ${h-E/2}L${a} ${h}L${a-E} ${h+E/2}"></path>`:""}}laneRow(e,t,r,s){let o=e.note.lines.length>0,a=o?t-We/2:t+e.label.size*y/2-2,i=r.trackRight;return g`<g class="pop">
      ${e.icon?g`<g transform="translate(0 ${t-X/2}) scale(${Xt})"><path class="icon" d=${e.icon}></path></g>`:""}
      ${e.label.lines.map(l=>g`<text class="label" x=${s} y=${a}
          dominant-baseline=${o?"text-after-edge":"alphabetic"}
          font-size=${e.label.size} font-weight=${d.label.weight}>${l}</text>`)}
      ${e.note.lines.map(l=>g`<text class="note" x=${s} y=${t+We/2}
          dominant-baseline="text-before-edge"
          font-size=${e.note.size} font-weight=${d.note.weight}>${l}</text>`)}
      <path class="line muted" d="M${r.trackLeft} ${t}H${i}M${i-E} ${t-E/2}L${i} ${t}L${i-E} ${t+E/2}"></path>
      ${r.tagX!==null?e.tag.lines.map(l=>g`<text class="tag" x=${r.tagX} y=${t+e.tag.size*y/2-2}
                font-size=${e.tag.size} font-weight=${d.tag.weight}>${l}</text>`):""}
    </g>`}describe(e,t,r){let s=`${t} per lane get through, then the gate${this.gate?` ${this.gate}`:""} comes down and ${r} are stopped`,o=e.map(a=>[a.name,a.tag.lines.join(" ")].filter(Boolean).join(": "));return[this.trigger,`${o.join("; ")}`,s].filter(Boolean).join(". ")}};b.styles=[Pe,Bt`.dot{fill:var(--deck-scene-line,var(--rik-text-default));transform-box:fill-box}.dot.blocked{fill:var(--deck-scene-emphasis-bg,var(--rik-accent))}.gate{transform-box:fill-box;transform-origin:top}:host([playing]) .dot{animation:lanes-arrive var(--du,0.8s) cubic-bezier(0.2,0.7,0.3,1) calc(var(--t0,0s) + var(--scene-delay,0s)) both}:host([playing]) .gate{animation:lanes-close ${zt(Se)}s cubic-bezier(0.3,0,0.2,1) calc(var(--t0,0s) + var(--scene-delay,0s)) both}@keyframes lanes-arrive{from{opacity:0;transform:translateX(var(--back,0))}10%{opacity:1}to{opacity:1;transform:translateX(0)}}@keyframes lanes-close{from{opacity:0.2;transform:scaleY(0.05)}to{opacity:1;transform:scaleY(1)}}@media (prefers-reduced-motion:reduce),print{:host([playing]) :is(.dot,.gate){animation:none}}`],m([V({type:String})],b.prototype,"gate",2),m([V({type:String})],b.prototype,"trigger",2),m([V({type:String})],b.prototype,"passed",2),m([V({type:String})],b.prototype,"blocked",2),b=m([Vt("deck-scene-lanes")],b);function $(n,e){return n.lines.length?e(n.size)(n.lines[0]??""):0}function qt(n,e,t){return Math.max($(n.label,e),$(n.note,t))}export{b as DeckSceneLanes};
