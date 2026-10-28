var Pe=Object.defineProperty;var He=Object.getOwnPropertyDescriptor;var m=(n,e,t,r)=>{for(var o=r>1?void 0:r?He(e,t):e,s=n.length-1,i;s>=0;s--)(i=n[s])&&(o=(r?i(e,t,o):i(o))||o);return r&&o&&Pe(e,t,o),o};import{html as Tt,svg as _}from"./vendor/lit.js";import{customElement as vt,property as G}from"./vendor/lit.js";import{LitElement as Ue,css as Be}from"./vendor/lit.js";import{property as b}from"./vendor/lit.js";var p=class extends Ue{constructor(){super(...arguments);this.emphasis=!1}static{this.styles=Be`:host{display:none}`}render(){return null}};m([b({type:String})],p.prototype,"label",2),m([b({type:String})],p.prototype,"note",2),m([b({type:String})],p.prototype,"icon",2),m([b({type:String})],p.prototype,"tag",2),m([b({type:String})],p.prototype,"value",2),m([b({type:String})],p.prototype,"level",2),m([b({type:String})],p.prototype,"from",2),m([b({type:String})],p.prototype,"to",2),m([b({type:Boolean,reflect:!0})],p.prototype,"emphasis",2);customElements.get("deck-scene-item")||customElements.define("deck-scene-item",p);import{LitElement as gt,css as Et}from"./vendor/lit.js";import{property as ve}from"./vendor/lit.js";var We='{"check":"M20 6 9 17l-5-5","cross":"M18 6 6 18M6 6l12 12","alert":"M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z","info":"M12 16v-4m0-4h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z","question":"M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3m.1 4h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z","ban":"M4.9 4.9l14.2 14.2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z","arrow":"M5 12h14m-6-6 6 6-6 6","arrow-down":"M12 5v14m6-6-6 6-6-6","clock":"M12 6v6l4 2m6-2a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z","calendar":"M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z","refresh":"M21 12a9 9 0 1 1-3-6.7M21 3v6h-6","trend":"M22 7 13.5 15.5l-5-5L2 17M16 7h6v6","user":"M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z","team":"M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Zm10 14v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8","target":"M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0-6a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 9a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z","flag":"M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1Zm0 0v7","lock":"M7 11V7a5 5 0 0 1 10 0v4M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z","search":"M21 21l-4.3-4.3M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z","code":"M16 18l6-6-6-6M8 6l-6 6 6 6","database":"M3 5c0 1.7 4 3 9 3s9-1.3 9-3-4-3-9-3-9 1.3-9 3Zm0 0v14c0 1.7 4 3 9 3s9-1.3 9-3V5M3 12c0 1.7 4 3 9 3s9-1.3 9-3","cloud":"M17.5 19a4.5 4.5 0 0 0 0-9h-1.3A7 7 0 1 0 4 16.9","document":"M14 2v6h6M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Zm-6 11h8m-8 4h8m-8-8h2","chart":"M3 3v18h18M7 16V9m5 7V5m5 11v-4","spark":"M12 2 15 9l7 3-7 3-3 7-3-7-7-3 7-3Z"}',ee=Object.freeze(JSON.parse(We)),Ht=Object.keys(ee);function te(n){return n?ee[n.trim().toLowerCase()]??null:null}var c=Object.freeze({label:{size:31,weight:650,line:38},note:{size:25,weight:400,line:34},tag:{size:23,weight:600,line:30},value:{size:56,weight:750,line:64}}),v=.8,x=4;function re(n,e=1600){return`${-x} ${-x} ${e+2*x} ${n+2*x}`}var P=620;var oe=.88;var w=32,S=Object.freeze({cards:{min:2,max:5},steps:{min:1,max:6},bars:{min:2,max:8},matrix:{min:1,max:6},ranges:{min:1,max:8},lanes:{min:2,max:5},units:{min:1,max:3}});function ne(n,e,t,r){let o=n.trim().split(/[ \t\n\r]+/).filter(Boolean),s=[],i="",a=!0;for(let l of o){let d=i?`${i} ${l}`:l;if(t(d)<=e){i=d;continue}i&&s.push(i),i=l,t(l)>e&&(a=!1)}return i&&s.push(i),{lines:s,fits:a&&s.length<=r}}function M(n,e,t,r,o){let s=ne(n,e,o(r),t);if(s.fits)return{...s,size:r};let i=Math.round(r*oe);return{...ne(n,e,o(i),t),size:i}}var zt=S.bars.max;var ze=48;var Ve=16,Vt=(ze-Ve)/2;function N(n){let e=(n??"").replace(/\s/g,"").replace(",",".");if(!e)return null;let t=Number(e);return Number.isFinite(t)?t:null}var I=4,C=2,H=Object.freeze({sources:.3,hub:.22,outcomes:.26}),Yt=(1-H.sources-H.hub-H.outcomes)/2;function se(n,e){let t=n.findIndex(e),r=t>=0?t:n.length-1;return{sources:n.slice(0,Math.max(0,r)).slice(0,I),hub:n[r],outcomes:n.slice(r+1,r+1+C)}}var U=8,ie=3;var Xe=10,Ke=6,Jt=2*Xe+Ke;function ae(n,e){if(n==null||n.trim()==="")return{value:e,valid:!0};let t=Number(n),r=Number.isInteger(t)&&t>=0&&t<=U;return{value:r?t:e,valid:r}}var W=400,le=100,z=12,je=44,Ye=340,B=.25,Ze=2.2,y=40;function L(n,e,t,r){if(n==null||n.trim()==="")return{value:e,valid:!0};let o=Number(n),s=Number.isInteger(o)&&o>=t&&o<=r;return{value:s?o:e,valid:s}}var qe=48;function ce(n,e=1600){let t=Math.max(1,n);return(e-qe*(t-1))/t}function ue(n){return Math.min(y,Math.max(1,Math.ceil(Math.sqrt(n*Ze))))}function Je(n,e,t,r=Ye){let o=Math.ceil(n/e),s=Math.ceil(n/o),i=Math.min(je,t/(s+(s-1)*B),r/(o+(o-1)*B)),a=i*B;return{columns:s,rows:o,cell:i,gap:a,width:s*i+(s-1)*a,height:o*i+(o-1)*a}}function me(n,e,t){return Je(n,e,t).cell>=z}var V=["prod","pilot","test","announced","none"];var nn=Object.freeze({prod:"in production",pilot:"pilot",test:"in test",announced:"announced",none:"nothing yet"});var Qe=n=>(n??"").split("|").map(e=>e.trim()).filter(Boolean);function de(n){return Qe(n).slice(0,12)}function f(n){if(n===null||n.trim()==="")return null;let e=Number(n);return Number.isFinite(e)?e:null}function pe(n){return String(n)}function K(n,e,t){return Math.min(Math.max(n,e),t)}function X(n,e,t){return e<=0?t.left:t.left+K(n,0,e)/e*(t.right-t.left)}function he(n,e,t,r,o,s){if(e===null)return null;if(n===null){let d=X(e,t,r);return{x:K(d-s/2,r.left,r.right-s),width:s}}let i=X(Math.min(n,e),t,r),a=X(Math.max(n,e),t,r),l=Math.max(a-i,o);return{x:K(i,r.left,r.right-l),width:l}}function fe(n,e,t){return Math.max(t.left,Math.min(n,t.right-e))}var et=["cards","steps","flow","bars","matrix","ranges","lanes","units"];function Y(n){let e=n.toLowerCase().replace(/^deck-scene-/,"");return et.includes(e)?e:null}var tt=["label","note","icon","tag","value","level","from","to","emphasis"],nt=Object.freeze({cards:["label","note","icon","tag","emphasis"],steps:["label","note","tag","emphasis"],flow:["label","note","icon","tag","emphasis"],bars:["label","note","tag","value","emphasis"],matrix:["label","level","emphasis"],ranges:["label","note","tag","from","to"],lanes:["label","note","icon","tag"],units:["label","note","icon","value","emphasis"]});function _e(n,e,t){if(!e.length)return null;let r=e.map(s=>`${s.item} \xB7 ${s.field}`),o=e.filter(s=>s.measured!==void 0&&s.budget!==void 0).map(s=>`${s.item} \xB7 ${s.field} needs ${Math.round(s.measured??0)} of ${Math.round(s.budget??0)} units`);return{code:"SCENE_TEXT_TOO_LONG",severity:"error",items:r,fields:e,...t?{scene:{kind:n,...t}}:{},message:`a ${n} scene could not fit ${r.join(", ")} even one size down \xB7 drawn anyway, past its box${o.length?` (${o.join("; ")})`:""}`}}var be=2,rt=I+1+C,ge=4,ot=/(?<=[.!?…])\s+(?=\p{Lu})/u,R=(n,e)=>n.label?.trim()||`item ${e+1}`,xe=n=>n.trim().split(/\s+/).filter(Boolean);function Se(n,e,t){return e<=P?null:{code:"SCENE_TOO_TALL",severity:"error",items:[`${t} ${t===1?"item":"items"}, ${Math.round(e)} units tall`],message:`a slide leaves room for about ${P} units and this ${n} scene is taller \xB7 the slide clips it \xB7 fewer items, or split the slide`}}function Ae(n,e,t={}){let r=[],o=(i,a,l,d)=>{l.length&&r.push({code:i,severity:a,items:l,message:d})},s=i=>e.flatMap((a,l)=>i(a,l)?[R(a,l)]:[]);return lt(n,e,o),o("SCENE_ITEM_NO_LABEL","error",s(i=>!i.label?.trim()),"an item has no label \xB7 the scene would draw it as an empty box"),o("SCENE_ATTRIBUTE_IGNORED","warning",e.flatMap((i,a)=>st(n,i).map(l=>`${R(i,a)} \xB7 ${l}`)),`a ${n} scene does not read this attribute \xB7 it is dropped, and the picture does not change`),o("SCENE_ICON_UNKNOWN","error",s(i=>!!i.icon&&!te(i.icon)),"the icon is not in the 24-glyph set \xB7 it draws nothing, silently"),n==="bars"&&(o("SCENE_VALUE_INVALID","error",s(i=>N(i.value)===null),"`value` is missing or is not a number \xB7 the bar is drawn flat"),ct(e,t,o,s)),n==="ranges"&&(o("SCENE_VALUE_INVALID","error",s(pt),dt),mt(t,o,s)),n==="matrix"&&bt(t,o,s),n==="lanes"&&ht(t,o),n==="units"&&ft(e,t,o,s),o("SCENE_EMPHASIS_MANY","warning",n==="bars"?at(e):Te(e),"more than one item is emphasised \xB7 the scene puts one forward, and two are none"),o("SCENE_LABEL_LONG","warning",s(i=>xe(i.label??"").length>ge),`a label past ${ge} words reads as a sentence \xB7 one to three words, the detail goes in the note`),o("SCENE_NOTE_LONG","warning",s(i=>(i.note??"").trim().split(ot).length>1),"a note of more than one sentence \xB7 the scene is read from the back of the room, one sentence each"),r}function st(n,e){let t=nt[n];return tt.filter(r=>(r==="emphasis"?e.emphasis:e[r]!==null)&&!t.includes(r))}var it=n=>n.flatMap((e,t)=>e.emphasis?[R(e,t)]:[]),Te=n=>{let e=it(n);return e.length>1?e:[]};function at(n){let e=[];for(let t of n){let r=e.at(-1);r&&(r[0].note??"")===(t.note??"")?r.push(t):e.push([t])}return e.flatMap(Te)}function lt(n,e,t){let r=i=>R(i,e.indexOf(i));if(n==="flow"){let i=se(e,l=>l.emphasis),a=new Set([...i.sources,i.hub,...i.outcomes]);t("SCENE_ITEMS_DROPPED","error",e.filter(l=>!a.has(l)).map(r),`a flow draws ${I} sources before the hub and ${C} outcomes after it at most \xB7 these are not drawn`),e.length<be&&Ee(t,e.length,be,rt);return}let{min:o,max:s}=S[n];t("SCENE_ITEMS_DROPPED","error",e.slice(s).map(r),`a ${n} scene draws at most ${s} items \xB7 these are not drawn`),e.length<o&&Ee(t,e.length,o,s)}function Ee(n,e,t,r){n("SCENE_TOO_FEW_ITEMS","error",[`${e} item${e===1?"":"s"}`],`the scene is built for ${t} to ${r} items \xB7 with ${e} it has nothing to compare`)}function j(n,e){if(!n?.trim())return null;let t=e(n);return t!==null&&t>0?t:!1}function ct(n,e,t,r){let o=j(e.max,N),s=j(e.height,N);t("SCENE_ATTRIBUTE_INVALID","error",[...o===!1?["max"]:[],...s===!1?["height"]:[]],"`max` and `height` must be positive numbers \xB7 the scene drew its default instead"),t("SCENE_VALUE_CLIPPED","error",r(i=>{let a=N(i.value);return a!==null&&(a<0||typeof o=="number"&&a>o)}),typeof o=="number"?`a value is outside the scale (0 to ${o}) \xB7 its bar stops at the edge \xB7 use non-negative values, or raise \`max\` for values above it`:"a value is negative \xB7 the automatic scale starts at zero, so its bar stays flat \xB7 use non-negative values or a chart with a signed scale"),t("SCENE_GROUP_SPLIT","warning",ut(n),"a note comes back after another \xB7 only neighbours with the same note share a group, so these are drawn as separate groups \xB7 keep the items of a group together")}function ut(n){let e=new Set,t=new Set,r=null;for(let o of n){let s=(o.note??"").trim();s&&s!==r&&e.has(s)&&t.add(s),s&&e.add(s),r=s}return[...t]}function mt(n,e,t){let r=j(n.scale,s=>f(s));e("SCENE_ATTRIBUTE_INVALID","error",r===!1?["scale"]:[],"`scale` must be a positive number \xB7 the scene fitted the scale to the rows instead");let o=s=>{let i=f(s);return i!==null&&(i<0||typeof r=="number"&&i>r)};e("SCENE_VALUE_CLIPPED","error",t(s=>o(s.from)||o(s.to)),typeof r=="number"?`a bound is outside the scale (0 to ${r}) \xB7 the bar stops at the edge \xB7 use non-negative bounds, or raise \`scale\` for bounds above it`:"a bound is negative \xB7 the automatic scale starts at zero, so the bar stops at the edge \xB7 use non-negative bounds")}var dt="`from` and `to` must be numbers when written, with `from` first \xB7 otherwise the bar lands where the scene guessed";function pt(n){let e=f(n.from),t=f(n.to),r=!!n.from?.trim(),o=!!n.to?.trim();return r&&e===null||o&&t===null?!0:e!==null&&t!==null&&e>t}function ht(n,e){let t=["passed","blocked"].filter(r=>!ae(n[r],ie).valid);e("SCENE_VALUE_INVALID","error",t,`these must be whole numbers from 0 to ${U} \xB7 the scene drew its default instead`)}function ft(n,e,t,r){let o=L(e.total,le,1,W),s=L(e.columns,ue(o.value),1,y),i=[...o.valid?[]:["total"],...s.valid?[]:["columns"]];t("SCENE_VALUE_INVALID","error",i,`\`total\` is a whole number from 1 to ${W} and \`columns\` from 1 to ${y} \xB7 the scene drew its default instead`),t("SCENE_VALUE_INVALID","error",r(a=>!L(a.value,0,0,o.value).valid||!a.value?.trim()),`\`value\` is how many cells are lit, a whole number from 0 to ${o.value} \xB7 missing or out of range, the grid is drawn empty or full`),t("SCENE_GRID_TOO_DENSE","error",s.valid&&!me(o.value,s.value,ce(n.length,e.width))?[`${o.value} cells in ${s.value} columns`]:[],`the cells are under ${z} units wide at this size \xB7 fewer cells, fewer columns would not help, fewer panels would`)}function bt(n,e,t){let r=de(n.columns??void 0).length,o=i=>xe(i.level??""),s=new Set(V);e("SCENE_LEVEL_INVALID","error",t(i=>{let a=o(i);return r>0&&a.length!==r||a.some(d=>!s.has(d))}),`\`level\` needs one status per column${r?` (${r})`:""}, each one of ${V.join(", ")} \xB7 a missing or unknown one is drawn as "none"`)}var _t=200,Me=null;function xt(){return Me??=document.createElement("canvas"),Me.getContext("2d")}function O(n,e,t="--rik-font-sans"){let r=getComputedStyle(n),o=r.getPropertyValue(t).trim()||r.getPropertyValue("--rik-font-sans").trim()||"sans-serif";return s=>{let i=xt();if(!i)return l=>l.length*s*.5;let a=`${e} ${s}px ${o}`;return St(a),l=>(i.font=a,i.measureText(l).width)}}var Ne=new Set;function St(n){Ne.has(n)||!document.fonts?.load||(Ne.add(n),document.fonts.load(n).catch(e=>{console.warn(`rikiki \xB7 scene font did not load (${n}): ${String(e)}`)}))}function Z(n,e,t){return Object.entries(e).filter(([,r])=>!r.fits).map(([r,o])=>({item:n,field:r,text:o.lines.join(" "),budget:t,size:o.size}))}var we=Et`:host{display:block;inline-size:100%}svg{display:block;inline-size:100%;block-size:auto;overflow:visible}text{font-family:var(--rik-font-sans);fill:var(--rik-text-default)}.note{fill:var(--deck-scene-muted,var(--rik-text-default--muted))}.tag{/* The strong accent,not the text accent · a tag sits on a card (paper-100),and the text accent measures 2.8:1 there,under the 3:1 large text needs. \`check\` (SVG_TEXT_CONTRAST_LOW) found it on the default theme. */
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
`;function At(n){let e=t=>n.getAttribute(t);return{label:e("label"),note:e("note"),icon:e("icon"),tag:e("tag"),value:e("value"),level:e("level"),from:e("from"),to:e("to"),emphasis:n.hasAttribute("emphasis")}}var T=class extends gt{constructor(){super(...arguments);this.playing=!1;this.warnedIssues="";this.linted=[];this.overflows=[];this.onFontsLoaded=()=>{this.requestUpdate()}}get width(){let t=this.frameWidth;return t!==void 0&&Number.isFinite(t)&&t>=_t?t:1600}get items(){return[...this.querySelectorAll(":scope > deck-scene-item")]}connectedCallback(){super.connectedCallback(),this.onShownSlide()?this.applyStep(0):this.playing=!1,document.fonts?.ready.then(()=>this.requestUpdate()),document.fonts?.addEventListener("loadingdone",this.onFontsLoaded),this.observer=new MutationObserver(t=>{t.some(r=>r.type==="childList"||r.target!==this)&&this.requestUpdate()}),this.observer.observe(this,{attributes:!0,childList:!0,subtree:!0})}disconnectedCallback(){super.disconnectedCallback(),this.observer?.disconnect(),document.fonts?.removeEventListener("loadingdone",this.onFontsLoaded)}onShownSlide(){let t=this.closest("deck-root");return!t||t.hasAttribute("data-overview-snapshot")||t.hasAttribute("preview")?!1:!!this.closest("deck-root > [active]")}applyStep(t){t===0&&(this.playing=!1,requestAnimationFrame(()=>{this.playing=!0}))}willUpdate(){let t=Y(this.localName);this.linted=t?Ae(t,this.items.map(At),{columns:this.getAttribute("columns"),passed:this.getAttribute("passed"),blocked:this.getAttribute("blocked"),total:this.getAttribute("total"),max:this.getAttribute("max"),height:this.getAttribute("height"),scale:this.getAttribute("scale"),width:this.width}):[]}updated(){let t=Y(this.localName),r=this.renderRoot.querySelector("svg")?.getAttribute("viewBox"),o=Number(r?.split(" ")[3])-2*x,s=t&&o>0&&this.frameWidth===void 0?Se(t,o,this.items.length):null,i=_e(t??this.localName.replace(/^deck-scene-/,""),this.overflows,{width:this.width,count:this.items.length});this.reportIssues([...this.linted,...this.extraIssues(),...i?[i]:[],...s?[s]:[]])}extraIssues(){return[]}reportIssues(t){let r=t.length?JSON.stringify(t):"";if(r!==(this.getAttribute("data-scene-issues")??"")&&(r?this.setAttribute("data-scene-issues",r):this.removeAttribute("data-scene-issues")),r&&r!==this.warnedIssues)for(let o of t)console.warn(`<${this.localName}> \xB7 ${o.message}: ${o.items.join(", ")}`);this.warnedIssues=r}reportOverflow(t){this.overflows=t.map(r=>typeof r=="string"?{item:r,field:"text"}:r)}};m([ve({type:Boolean,reflect:!0})],T.prototype,"playing",2),m([ve({type:Number,attribute:"frame-width"})],T.prototype,"frameWidth",2);var Mt=S.ranges.max,Ie=8,Nt=2,wt=320,Ce=.4,ye=16,It=8,Ct=24,Le=24,yt=8,E=24,Lt=2*E,Re=E/2,Rt="to be set",Ot=.2,Gt=.15,Oe=n=>Math.ceil(n/Ie)*Ie,g=class extends T{render(){let e=this.items.slice(0,Mt),t=O(this,c.label.weight),r=O(this,c.note.weight),o=O(this,c.tag.weight),s=e.map(u=>M(u.getAttribute("label")??"",wt,1,c.label.size,t)),i=M(this.caption??"",this.width*Ce,1,c.tag.size,o),a=this.noteX(s,t),l=this.scaleArea(e,a,i,r,o),d=this.scaleMaximum(e),h=e.map((u,D)=>{let $=f(u.getAttribute("from")),$e=f(u.getAttribute("to")),Q=he($,$e,d,l,E,Lt),Fe=u.getAttribute("tag")||(Q?"":this.openLabel??Rt),F=M(Fe,l.right-l.left,1,c.tag.size,o);return{label:s[D],note:M(u.getAttribute("note")??"",l.left-w-a,Nt,c.note.size,r),tag:F,tagWidth:o(F.size)(F.lines[0]??""),bar:Q,name:u.getAttribute("label")??""}});this.reportOverflow([...Z("caption",{caption:i}),...h.flatMap(u=>Z(u.name,{label:u.label,note:u.note,tag:u.tag}))]);let J=c.note.line+It,k=J+Ct,Ge=h.map((u,D)=>{let $=k;return k+=this.rowHeight(u)+Le,this.row(u,$,l,a,D)}),ke=k-Le,De=[pe(d),this.unit].filter(Boolean).join(" ");return Tt`<svg viewBox=${re(ke,this.width)} role="img" aria-label=${[this.caption,...h.map(u=>[u.name,u.note.lines.join(" "),u.tag.lines.join(" ")].filter(Boolean).join(", "))].filter(Boolean).join(". ")} part="drawing" > ${this.header(i,De,l)} <path class="line muted" d="M0 ${J} H${this.width}"></path> ${Ge} </svg>`}noteX(e,t){let r=Math.max(0,...e.map(o=>t(o.size)(o.lines[0]??"")));return Oe(r+ye)}scaleArea(e,t,r,o,s){let i=Math.max(0,...e.map(h=>o(c.note.size)(h.getAttribute("note")??""))),a=i?t+i:t-ye,l=s(r.size)(r.lines[0]??""),d=Math.max(a,l)+w;return{left:Oe(Math.min(d,this.width*Ce)),right:this.width}}scaleMaximum(e){let t=f(this.scale??null);if(t!==null&&t>0)return t;let r=e.flatMap(o=>[f(o.getAttribute("from")),f(o.getAttribute("to"))]);return Math.max(1,...r.filter(o=>o!==null))}header(e,t,r){let o=c.note.size*v;return _`
      ${e.lines.map(s=>_`<text class="tag" x="0" y=${o} font-size=${e.size} font-weight=${c.tag.weight}>${s}</text>`)}
      <text class="note" x=${r.left} y=${o} font-size=${c.note.size} font-weight=${c.note.weight}>0</text>
      <text class="note" x=${r.right} y=${o} text-anchor="end" font-size=${c.note.size} font-weight=${c.note.weight}>${t}</text>
    `}barCentre(){return c.tag.line+yt+E/2}labelBaseline(e){return this.barCentre()-c.label.line/2+e.label.size*v}rowHeight(e){let t=this.barCentre()+E/2,r=this.barCentre()+c.label.line/2,o=this.labelBaseline(e)-e.note.size*v+e.note.lines.length*c.note.line;return Math.max(t,r,o)}row(e,t,r,o,s){let i=t+this.labelBaseline(e),a=t+this.barCentre(),l=Ot+s*Gt,d=e.bar?fe(e.bar.x,e.tagWidth,r):r.left;return _`
      ${e.label.lines.map(h=>_`<text class="label" x="0" y=${i} font-size=${e.label.size} font-weight=${c.label.weight}>${h}</text>`)}
      ${e.note.lines.map((h,q)=>_`<text class="note" x=${o} y=${i+q*c.note.line} font-size=${e.note.size} font-weight=${c.note.weight}>${h}</text>`)}
      <path class="line muted ${e.bar?"":"dash"}" d="M${r.left+Re} ${a} H${r.right-Re}"></path>
      ${e.bar?_`<rect class="emphasis grow-x" style="--t0:${l}s" x=${e.bar.x} y=${a-E/2}
            width=${e.bar.width} height=${E} rx=${E/2}></rect>`:""}
      ${e.tag.lines.map(h=>_`<text class="${e.bar?"tag":"note"} fade" style="--t0:${l}s" x=${d} y=${t+e.tag.size*v}
          font-size=${e.tag.size} font-weight=${c.tag.weight}>${h}</text>`)}
    `}};g.styles=we,m([G({type:String})],g.prototype,"scale",2),m([G({type:String})],g.prototype,"unit",2),m([G({type:String})],g.prototype,"caption",2),m([G({type:String,attribute:"open-label"})],g.prototype,"openLabel",2),g=m([vt("deck-scene-ranges")],g);export{g as DeckSceneRanges};
