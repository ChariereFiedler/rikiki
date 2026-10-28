var Ye=Object.defineProperty;var je=Object.getOwnPropertyDescriptor;var d=(n,e,t,r)=>{for(var s=r>1?void 0:r?je(e,t):e,o=n.length-1,a;o>=0;o--)(a=n[o])&&(s=(r?a(e,t,s):a(s))||s);return r&&s&&Ye(e,t,s),s};import{css as Ot,html as kt,svg as x}from"./vendor/lit.js";import{customElement as Gt,property as ae}from"./vendor/lit.js";import{LitElement as Ze,css as qe}from"./vendor/lit.js";import{property as _}from"./vendor/lit.js";var b=class extends Ze{constructor(){super(...arguments);this.emphasis=!1}static{this.styles=qe`:host{display:none}`}render(){return null}};d([_({type:String})],b.prototype,"label",2),d([_({type:String})],b.prototype,"note",2),d([_({type:String})],b.prototype,"icon",2),d([_({type:String})],b.prototype,"tag",2),d([_({type:String})],b.prototype,"value",2),d([_({type:String})],b.prototype,"level",2),d([_({type:String})],b.prototype,"from",2),d([_({type:String})],b.prototype,"to",2),d([_({type:Boolean,reflect:!0})],b.prototype,"emphasis",2);customElements.get("deck-scene-item")||customElements.define("deck-scene-item",b);import{LitElement as Mt,css as It}from"./vendor/lit.js";import{property as De}from"./vendor/lit.js";var Je='{"check":"M20 6 9 17l-5-5","cross":"M18 6 6 18M6 6l12 12","alert":"M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z","info":"M12 16v-4m0-4h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z","question":"M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3m.1 4h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z","ban":"M4.9 4.9l14.2 14.2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z","arrow":"M5 12h14m-6-6 6 6-6 6","arrow-down":"M12 5v14m6-6-6 6-6-6","clock":"M12 6v6l4 2m6-2a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z","calendar":"M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z","refresh":"M21 12a9 9 0 1 1-3-6.7M21 3v6h-6","trend":"M22 7 13.5 15.5l-5-5L2 17M16 7h6v6","user":"M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z","team":"M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Zm10 14v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8","target":"M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0-6a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 9a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z","flag":"M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1Zm0 0v7","lock":"M7 11V7a5 5 0 0 1 10 0v4M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z","search":"M21 21l-4.3-4.3M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z","code":"M16 18l6-6-6-6M8 6l-6 6 6 6","database":"M3 5c0 1.7 4 3 9 3s9-1.3 9-3-4-3-9-3-9 1.3-9 3Zm0 0v14c0 1.7 4 3 9 3s9-1.3 9-3V5M3 12c0 1.7 4 3 9 3s9-1.3 9-3","cloud":"M17.5 19a4.5 4.5 0 0 0 0-9h-1.3A7 7 0 1 0 4 16.9","document":"M14 2v6h6M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Zm-6 11h8m-8 4h8m-8-8h2","chart":"M3 3v18h18M7 16V9m5 7V5m5 11v-4","spark":"M12 2 15 9l7 3-7 3-3 7-3-7-7-3 7-3Z"}',le=Object.freeze(JSON.parse(Je)),nn=Object.keys(le);function ce(n){return n?le[n.trim().toLowerCase()]??null:null}var u=Object.freeze({label:{size:31,weight:650,line:38},note:{size:25,weight:400,line:34},tag:{size:23,weight:600,line:30},value:{size:56,weight:750,line:64}}),P=.8,T=4;function ue(n,e=1600){return`${-T} ${-T} ${e+2*T} ${n+2*T}`}var q=620;var me=.88,S=28,U=32,w=Object.freeze({cards:{min:2,max:5},steps:{min:1,max:6},bars:{min:2,max:8},matrix:{min:1,max:6},ranges:{min:1,max:8},lanes:{min:2,max:5},units:{min:1,max:3}});function $(n,e,t,r){let s=n.trim().split(/[ \t\n\r]+/).filter(Boolean),o=[],a="",i=!0;for(let l of s){let p=a?`${a} ${l}`:l;if(t(p)<=e){a=p;continue}a&&o.push(a),a=l,t(l)>e&&(i=!1)}return a&&o.push(a),{lines:o,fits:i&&o.length<=r}}function F(n,e,t,r,s){let o=$(n,e,s(r),t);if(o.fits)return{...o,size:r};let a=Math.round(r*me);return{...$(n,e,s(a),t),size:a}}var an=w.bars.max;var Qe=48;var et=16,ln=(Qe-et)/2;function L(n){let e=(n??"").replace(/\s/g,"").replace(",",".");if(!e)return null;let t=Number(e);return Number.isFinite(t)?t:null}var H=4,W=2,J=Object.freeze({sources:.3,hub:.22,outcomes:.26}),mn=(1-J.sources-J.hub-J.outcomes)/2;function de(n,e){let t=n.findIndex(e),r=t>=0?t:n.length-1;return{sources:n.slice(0,Math.max(0,r)).slice(0,H),hub:n[r],outcomes:n.slice(r+1,r+1+W)}}var Q=8,pe=3;var tt=10,nt=6,hn=2*tt+nt;function he(n,e){if(n==null||n.trim()==="")return{value:e,valid:!0};let t=Number(n),r=Number.isInteger(t)&&t>=0&&t<=Q;return{value:r?t:e,valid:r}}var te=400,fe=100,ne=12,rt=44,st=340,ee=.25,ot=2.2,B=40;function z(n,e,t,r){if(n==null||n.trim()==="")return{value:e,valid:!0};let s=Number(n),o=Number.isInteger(s)&&s>=t&&s<=r;return{value:o?s:e,valid:o}}var at=48;function be(n,e=1600){let t=Math.max(1,n);return(e-at*(t-1))/t}function ge(n){return Math.min(B,Math.max(1,Math.ceil(Math.sqrt(n*ot))))}function it(n,e,t,r=st){let s=Math.ceil(n/e),o=Math.ceil(n/s),a=Math.min(rt,t/(o+(o-1)*ee),r/(s+(s-1)*ee)),i=a*ee;return{columns:o,rows:s,cell:a,gap:i,width:o*a+(o-1)*i,height:s*a+(s-1)*i}}function Ee(n,e,t){return it(n,e,t).cell>=ne}var y=["prod","pilot","test","announced","none"];var lt=Object.freeze({prod:"in production",pilot:"pilot",test:"in test",announced:"announced",none:"nothing yet"}),xe=n=>y.includes(n),re=n=>(n??"").split("|").map(e=>e.trim()).filter(Boolean);function V(n){return re(n).slice(0,12)}function Se(n,e){let t=[],r=0;for(let s of re(n)){let o=s.lastIndexOf(":"),a=o<0?Number.NaN:Number(s.slice(o+1));!Number.isInteger(a)||a<=0||r>=e||(t.push({name:s.slice(0,o).trim(),start:r,count:Math.min(a,e-r)}),r+=a)}return t}function ve(n){let e={...lt};for(let t of re(n)){let r=t.indexOf("="),s=t.slice(0,r).trim(),o=t.slice(r+1).trim();r>0&&xe(s)&&o&&(e[s]=o)}return e}function Ae(n,e){let t=(n??"").trim().split(/\s+/);return Array.from({length:e},(r,s)=>{let o=t[s]??"";return xe(o)?o:"none"})}function Te(n){let e=new Set;return n.filter(t=>{let r=t.lines.join(" ");return t.fits||e.has(r)?!1:(e.add(r),!0)})}function we(n){let e=new Set(n.flat());return y.filter(t=>e.has(t))}var _e=1e3,ct=n=>Math.round(n*_e)/_e;function Ne(n,e,t,r,s){let o=n*e,a=o>1?Math.min(r,(s-t)/(o-1)):0;return Array.from({length:n},(i,l)=>Array.from({length:e},(p,A)=>ct(t+(l*e+A)*a)))}function Me(n,e,t){let r=0,s=0;return n.map(o=>{r>0&&r+o>t&&(r=0,s+=1);let a={x:r,line:s};return r+=o+e,a})}function O(n){if(n===null||n.trim()==="")return null;let e=Number(n);return Number.isFinite(e)?e:null}var ut=["cards","steps","flow","bars","matrix","ranges","lanes","units"];function oe(n){let e=n.toLowerCase().replace(/^deck-scene-/,"");return ut.includes(e)?e:null}var mt=["label","note","icon","tag","value","level","from","to","emphasis"],dt=Object.freeze({cards:["label","note","icon","tag","emphasis"],steps:["label","note","tag","emphasis"],flow:["label","note","icon","tag","emphasis"],bars:["label","note","tag","value","emphasis"],matrix:["label","level","emphasis"],ranges:["label","note","tag","from","to"],lanes:["label","note","icon","tag"],units:["label","note","icon","value","emphasis"]});function Le(n,e,t){if(!e.length)return null;let r=e.map(o=>`${o.item} \xB7 ${o.field}`),s=e.filter(o=>o.measured!==void 0&&o.budget!==void 0).map(o=>`${o.item} \xB7 ${o.field} needs ${Math.round(o.measured??0)} of ${Math.round(o.budget??0)} units`);return{code:"SCENE_TEXT_TOO_LONG",severity:"error",items:r,fields:e,...t?{scene:{kind:n,...t}}:{},message:`a ${n} scene could not fit ${r.join(", ")} even one size down \xB7 drawn anyway, past its box${s.length?` (${s.join("; ")})`:""}`}}var Ie=2,pt=H+1+W,Ce=4,ht=/(?<=[.!?…])\s+(?=\p{Lu})/u,K=(n,e)=>n.label?.trim()||`item ${e+1}`,ye=n=>n.trim().split(/\s+/).filter(Boolean);function Oe(n,e,t){return e<=q?null:{code:"SCENE_TOO_TALL",severity:"error",items:[`${t} ${t===1?"item":"items"}, ${Math.round(e)} units tall`],message:`a slide leaves room for about ${q} units and this ${n} scene is taller \xB7 the slide clips it \xB7 fewer items, or split the slide`}}function ke(n,e,t={}){let r=[],s=(a,i,l,p)=>{l.length&&r.push({code:a,severity:i,items:l,message:p})},o=a=>e.flatMap((i,l)=>a(i,l)?[K(i,l)]:[]);return Et(n,e,s),s("SCENE_ITEM_NO_LABEL","error",o(a=>!a.label?.trim()),"an item has no label \xB7 the scene would draw it as an empty box"),s("SCENE_ATTRIBUTE_IGNORED","warning",e.flatMap((a,i)=>ft(n,a).map(l=>`${K(a,i)} \xB7 ${l}`)),`a ${n} scene does not read this attribute \xB7 it is dropped, and the picture does not change`),s("SCENE_ICON_UNKNOWN","error",o(a=>!!a.icon&&!ce(a.icon)),"the icon is not in the 24-glyph set \xB7 it draws nothing, silently"),n==="bars"&&(s("SCENE_VALUE_INVALID","error",o(a=>L(a.value)===null),"`value` is missing or is not a number \xB7 the bar is drawn flat"),_t(e,t,s,o)),n==="ranges"&&(s("SCENE_VALUE_INVALID","error",o(At),vt),St(t,s,o)),n==="matrix"&&Nt(t,s,o),n==="lanes"&&Tt(t,s),n==="units"&&wt(e,t,s,o),s("SCENE_EMPHASIS_MANY","warning",n==="bars"?gt(e):Ge(e),"more than one item is emphasised \xB7 the scene puts one forward, and two are none"),s("SCENE_LABEL_LONG","warning",o(a=>ye(a.label??"").length>Ce),`a label past ${Ce} words reads as a sentence \xB7 one to three words, the detail goes in the note`),s("SCENE_NOTE_LONG","warning",o(a=>(a.note??"").trim().split(ht).length>1),"a note of more than one sentence \xB7 the scene is read from the back of the room, one sentence each"),r}function ft(n,e){let t=dt[n];return mt.filter(r=>(r==="emphasis"?e.emphasis:e[r]!==null)&&!t.includes(r))}var bt=n=>n.flatMap((e,t)=>e.emphasis?[K(e,t)]:[]),Ge=n=>{let e=bt(n);return e.length>1?e:[]};function gt(n){let e=[];for(let t of n){let r=e.at(-1);r&&(r[0].note??"")===(t.note??"")?r.push(t):e.push([t])}return e.flatMap(Ge)}function Et(n,e,t){let r=a=>K(a,e.indexOf(a));if(n==="flow"){let a=de(e,l=>l.emphasis),i=new Set([...a.sources,a.hub,...a.outcomes]);t("SCENE_ITEMS_DROPPED","error",e.filter(l=>!i.has(l)).map(r),`a flow draws ${H} sources before the hub and ${W} outcomes after it at most \xB7 these are not drawn`),e.length<Ie&&Re(t,e.length,Ie,pt);return}let{min:s,max:o}=w[n];t("SCENE_ITEMS_DROPPED","error",e.slice(o).map(r),`a ${n} scene draws at most ${o} items \xB7 these are not drawn`),e.length<s&&Re(t,e.length,s,o)}function Re(n,e,t,r){n("SCENE_TOO_FEW_ITEMS","error",[`${e} item${e===1?"":"s"}`],`the scene is built for ${t} to ${r} items \xB7 with ${e} it has nothing to compare`)}function se(n,e){if(!n?.trim())return null;let t=e(n);return t!==null&&t>0?t:!1}function _t(n,e,t,r){let s=se(e.max,L),o=se(e.height,L);t("SCENE_ATTRIBUTE_INVALID","error",[...s===!1?["max"]:[],...o===!1?["height"]:[]],"`max` and `height` must be positive numbers \xB7 the scene drew its default instead"),t("SCENE_VALUE_CLIPPED","error",r(a=>{let i=L(a.value);return i!==null&&(i<0||typeof s=="number"&&i>s)}),typeof s=="number"?`a value is outside the scale (0 to ${s}) \xB7 its bar stops at the edge \xB7 use non-negative values, or raise \`max\` for values above it`:"a value is negative \xB7 the automatic scale starts at zero, so its bar stays flat \xB7 use non-negative values or a chart with a signed scale"),t("SCENE_GROUP_SPLIT","warning",xt(n),"a note comes back after another \xB7 only neighbours with the same note share a group, so these are drawn as separate groups \xB7 keep the items of a group together")}function xt(n){let e=new Set,t=new Set,r=null;for(let s of n){let o=(s.note??"").trim();o&&o!==r&&e.has(o)&&t.add(o),o&&e.add(o),r=o}return[...t]}function St(n,e,t){let r=se(n.scale,o=>O(o));e("SCENE_ATTRIBUTE_INVALID","error",r===!1?["scale"]:[],"`scale` must be a positive number \xB7 the scene fitted the scale to the rows instead");let s=o=>{let a=O(o);return a!==null&&(a<0||typeof r=="number"&&a>r)};e("SCENE_VALUE_CLIPPED","error",t(o=>s(o.from)||s(o.to)),typeof r=="number"?`a bound is outside the scale (0 to ${r}) \xB7 the bar stops at the edge \xB7 use non-negative bounds, or raise \`scale\` for bounds above it`:"a bound is negative \xB7 the automatic scale starts at zero, so the bar stops at the edge \xB7 use non-negative bounds")}var vt="`from` and `to` must be numbers when written, with `from` first \xB7 otherwise the bar lands where the scene guessed";function At(n){let e=O(n.from),t=O(n.to),r=!!n.from?.trim(),s=!!n.to?.trim();return r&&e===null||s&&t===null?!0:e!==null&&t!==null&&e>t}function Tt(n,e){let t=["passed","blocked"].filter(r=>!he(n[r],pe).valid);e("SCENE_VALUE_INVALID","error",t,`these must be whole numbers from 0 to ${Q} \xB7 the scene drew its default instead`)}function wt(n,e,t,r){let s=z(e.total,fe,1,te),o=z(e.columns,ge(s.value),1,B),a=[...s.valid?[]:["total"],...o.valid?[]:["columns"]];t("SCENE_VALUE_INVALID","error",a,`\`total\` is a whole number from 1 to ${te} and \`columns\` from 1 to ${B} \xB7 the scene drew its default instead`),t("SCENE_VALUE_INVALID","error",r(i=>!z(i.value,0,0,s.value).valid||!i.value?.trim()),`\`value\` is how many cells are lit, a whole number from 0 to ${s.value} \xB7 missing or out of range, the grid is drawn empty or full`),t("SCENE_GRID_TOO_DENSE","error",o.valid&&!Ee(s.value,o.value,be(n.length,e.width))?[`${s.value} cells in ${o.value} columns`]:[],`the cells are under ${ne} units wide at this size \xB7 fewer cells, fewer columns would not help, fewer panels would`)}function Nt(n,e,t){let r=V(n.columns??void 0).length,s=a=>ye(a.level??""),o=new Set(y);e("SCENE_LEVEL_INVALID","error",t(a=>{let i=s(a);return r>0&&i.length!==r||i.some(p=>!o.has(p))}),`\`level\` needs one status per column${r?` (${r})`:""}, each one of ${y.join(", ")} \xB7 a missing or unknown one is drawn as "none"`)}var Ct=200,$e=null;function Rt(){return $e??=document.createElement("canvas"),$e.getContext("2d")}function X(n,e,t="--rik-font-sans"){let r=getComputedStyle(n),s=r.getPropertyValue(t).trim()||r.getPropertyValue("--rik-font-sans").trim()||"sans-serif";return o=>{let a=Rt();if(!a)return l=>l.length*o*.5;let i=`${e} ${o}px ${s}`;return Lt(i),l=>(a.font=i,a.measureText(l).width)}}var Pe=new Set;function Lt(n){Pe.has(n)||!document.fonts?.load||(Pe.add(n),document.fonts.load(n).catch(e=>{console.warn(`rikiki \xB7 scene font did not load (${n}): ${String(e)}`)}))}function k(n,e,t){return Object.entries(e).filter(([,r])=>!r.fits).map(([r,s])=>({item:n,field:r,text:s.lines.join(" "),budget:t,size:s.size}))}var Ue=It`:host{display:block;inline-size:100%}svg{display:block;inline-size:100%;block-size:auto;overflow:visible}text{font-family:var(--rik-font-sans);fill:var(--rik-text-default)}.note{fill:var(--deck-scene-muted,var(--rik-text-default--muted))}.tag{/* The strong accent,not the text accent · a tag sits on a card (paper-100),and the text accent measures 2.8:1 there,under the 3:1 large text needs. \`check\` (SVG_TEXT_CONTRAST_LOW) found it on the default theme. */
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
`;function yt(n){let e=t=>n.getAttribute(t);return{label:e("label"),note:e("note"),icon:e("icon"),tag:e("tag"),value:e("value"),level:e("level"),from:e("from"),to:e("to"),emphasis:n.hasAttribute("emphasis")}}var M=class extends Mt{constructor(){super(...arguments);this.playing=!1;this.warnedIssues="";this.linted=[];this.overflows=[];this.onFontsLoaded=()=>{this.requestUpdate()}}get width(){let t=this.frameWidth;return t!==void 0&&Number.isFinite(t)&&t>=Ct?t:1600}get items(){return[...this.querySelectorAll(":scope > deck-scene-item")]}connectedCallback(){super.connectedCallback(),this.onShownSlide()?this.applyStep(0):this.playing=!1,document.fonts?.ready.then(()=>this.requestUpdate()),document.fonts?.addEventListener("loadingdone",this.onFontsLoaded),this.observer=new MutationObserver(t=>{t.some(r=>r.type==="childList"||r.target!==this)&&this.requestUpdate()}),this.observer.observe(this,{attributes:!0,childList:!0,subtree:!0})}disconnectedCallback(){super.disconnectedCallback(),this.observer?.disconnect(),document.fonts?.removeEventListener("loadingdone",this.onFontsLoaded)}onShownSlide(){let t=this.closest("deck-root");return!t||t.hasAttribute("data-overview-snapshot")||t.hasAttribute("preview")?!1:!!this.closest("deck-root > [active]")}applyStep(t){t===0&&(this.playing=!1,requestAnimationFrame(()=>{this.playing=!0}))}willUpdate(){let t=oe(this.localName);this.linted=t?ke(t,this.items.map(yt),{columns:this.getAttribute("columns"),passed:this.getAttribute("passed"),blocked:this.getAttribute("blocked"),total:this.getAttribute("total"),max:this.getAttribute("max"),height:this.getAttribute("height"),scale:this.getAttribute("scale"),width:this.width}):[]}updated(){let t=oe(this.localName),r=this.renderRoot.querySelector("svg")?.getAttribute("viewBox"),s=Number(r?.split(" ")[3])-2*T,o=t&&s>0&&this.frameWidth===void 0?Oe(t,s,this.items.length):null,a=Le(t??this.localName.replace(/^deck-scene-/,""),this.overflows,{width:this.width,count:this.items.length});this.reportIssues([...this.linted,...this.extraIssues(),...a?[a]:[],...o?[o]:[]])}extraIssues(){return[]}reportIssues(t){let r=t.length?JSON.stringify(t):"";if(r!==(this.getAttribute("data-scene-issues")??"")&&(r?this.setAttribute("data-scene-issues",r):this.removeAttribute("data-scene-issues")),r&&r!==this.warnedIssues)for(let s of t)console.warn(`<${this.localName}> \xB7 ${s.message}: ${s.items.join(", ")}`);this.warnedIssues=r}reportOverflow(t){this.overflows=t.map(r=>typeof r=="string"?{item:r,field:"text"}:r)}};d([De({type:Boolean,reflect:!0})],M.prototype,"playing",2),d([De({type:Number,attribute:"frame-width"})],M.prototype,"frameWidth",2);var Dt=w.matrix.max,I=8,$t=2,Pt=2,Ut=2,Ft=160,Ht=400,Y=I,Fe=8,Wt=16,Bt=16,j=24,He=8,zt=16,G=12,We=12,Vt=40,Kt=.35,Xt=.2,Yt=.1,jt=2,Zt=n=>Math.ceil(n/I)*I;function Be(n,e,t,r,s){let o=n.map(i=>F(i,e,t,r,s)),a=Math.min(r,...o.map(i=>i.size));return a===r?o:n.map(i=>({...$(i,e,s(a),t),size:a}))}var ze=(n,e,t,r)=>n-(e-1)*t/2+r*Kt,v=class extends M{render(){let e=V(this.columns),t=ve(this.statuses),r=X(this,u.label.weight),s=X(this,u.note.weight),o=X(this,u.tag.weight),a=this.items.slice(0,Dt),i=this.grid(a,e.length,r),l=i.columnWidth-2*Y,p=a.map(c=>Ae(c.getAttribute("level"),e.length)),A=Be(p.flat().map(c=>c==="prod"?"":t[c]),l,Ut,u.tag.size,o),h=a.map((c,m)=>({label:F(c.getAttribute("label")??"",i.labelColumn-S-I,$t,u.label.size,r),levels:p[m],words:A.slice(m*e.length,(m+1)*e.length),name:c.getAttribute("label")??"",emphasis:c.hasAttribute("emphasis")})),f=Be(e,l,Pt,u.note.size,s),g=Se(this.groups,e.length),E=g.map(c=>F(c.name,c.count*i.columnWidth-2*Y,1,u.tag.size,o));this.reportOverflow([...g.flatMap((c,m)=>k(c.name,{group:E[m]})),...e.flatMap((c,m)=>k(c,{column:f[m]},l)),...h.flatMap(c=>[...k(c.name,{label:c.label},i.labelColumn-S-I),...Te(c.words).flatMap(m=>k(c.name,{status:m},l))])]);let D=g.length?u.tag.line+Fe+Wt:0,C=Math.max(0,...f.map(c=>c.lines.length)),R=D+(C?C*u.note.line+Bt:0),Ve=Ne(h.length,e.length,Xt,Yt,jt),Ke=h.map((c,m)=>{let Z=R;return R+=this.rowHeight(c)+U,this.row(c,m,Z,i,Ve[m])}),Xe=R,ie=this.legend(we(h.map(c=>c.levels)),t,Xe,s);return kt`<svg viewBox=${ue(ie.bottom,this.width)} role="img" aria-label=${h.map(c=>`${c.name}: ${e.map((m,Z)=>`${m} ${t[c.levels[Z]]}`).join(", ")}`).join(". ")}
      part="drawing"
    >
      ${g.map((c,m)=>this.group(c,E[m],i))}
      ${f.map((c,m)=>this.header(c,m,D,C,i))}
      ${Ke}
      ${ie.drawn}
    </svg>`}grid(e,t,r){let s=Math.max(0,...e.map(i=>r(u.label.size)(i.getAttribute("label")??""))),o=Zt(S+s+I),a=Math.min(Math.max(o,Ft),Ht);return{labelColumn:a,columnWidth:(this.width-a)/Math.max(1,t)}}columnCentre(e,t){return t.labelColumn+(e+1/2)*t.columnWidth}dotBlock(e){let t=Math.max(0,...e.words.map(r=>r.lines.length));return 2*j+(t?He+t*u.tag.line:0)}contentHeight(e){return Math.max(this.dotBlock(e),e.label.lines.length*u.label.line)}rowHeight(e){return this.contentHeight(e)+2*S}group(e,t,r){let s=r.labelColumn+e.start*r.columnWidth+Y,o=r.labelColumn+(e.start+e.count)*r.columnWidth-Y,a=u.tag.line+Fe;return x`
      ${t.lines.map(i=>x`<text class="tag" x=${(s+o)/2} y=${t.size*P} text-anchor="middle"
          font-size=${t.size} font-weight=${u.tag.weight}>${i}</text>`)}
      <path class="line muted" d="M${s} ${a} H${o}"></path>
    `}header(e,t,r,s,o){let a=r+(s-e.lines.length)*u.note.line/2;return e.lines.map((i,l)=>x`<text x=${this.columnCentre(t,o)} y=${a+l*u.note.line+e.size*P}
        text-anchor="middle" font-size=${e.size} font-weight=${u.note.weight}>${i}</text>`)}bandClass(e,t){return e.emphasis?"card emphasis-row":t%2===0?"card":"band"}row(e,t,r,s,o){let a=this.rowHeight(e),i=this.contentHeight(e),l=r+a/2,p=r+S+(i-this.dotBlock(e))/2+j,A=ze(l,e.label.lines.length,u.label.line,e.label.size);return x`
      <rect class=${this.bandClass(e,t)} x="0" y=${r} width=${this.width} height=${a} rx=${zt}></rect>
      ${e.label.lines.map((h,f)=>x`<text class="label" x=${S} y=${A+f*u.label.line}
          font-size=${e.label.size} font-weight=${u.label.weight}>${h}</text>`)}
      ${e.levels.map((h,f)=>{let g=this.columnCentre(f,s),E=e.words[f],D=p+j+He;return x`<g class="pop" style="--t0:${o[f]}s">
          ${this.dot(h,g,p,j)}
          ${E.lines.map((C,R)=>x`<text class="tag" x=${g} y=${D+R*u.tag.line+E.size*P}
              text-anchor="middle" font-size=${E.size} font-weight=${u.tag.weight}>${C}</text>`)}
        </g>`})}
    `}dot(e,t,r,s){return x`<circle class=${{prod:"emphasis",pilot:"line dot raised pilot",test:"line dot raised",announced:"line dot raised dash",none:"line dot muted dash"}[e]} cx=${t} cy=${r} r=${s}></circle>`}legend(e,t,r,s){let o=s(u.note.size),a=e.map(h=>2*G+We+o(t[h])),i=Me(a,Vt,this.width),l=Math.max(2*G,u.note.line),p=e.length?Math.max(...i.map(h=>h.line))+1:0;return{drawn:e.map((h,f)=>{let g=r+i[f].line*l+l/2,E=i[f].x;return x`
        ${this.dot(h,E+G,g,G)}
        <text class="note" x=${E+2*G+We} y=${ze(g,1,l,u.note.size)}
          font-size=${u.note.size} font-weight=${u.note.weight}>${t[h]}</text>
      `}),bottom:p?r+p*l:r-U}}};v.styles=[Ue,Ot`.card.emphasis-row{fill:var(--deck-scene-row-emphasis-bg,var(--rik-accent--faint))}.band{fill:var(--deck-scene-band-bg,var(--rik-surface-sunken));stroke:none}.dot{stroke-width:3}.dot.raised{fill:var(--deck-scene-card-bg,var(--rik-surface-raised))}.dot.pilot{stroke:var(--deck-scene-emphasis-bg,var(--rik-accent))}`],d([ae({type:String})],v.prototype,"columns",2),d([ae({type:String})],v.prototype,"groups",2),d([ae({type:String})],v.prototype,"statuses",2),v=d([Gt("deck-scene-matrix")],v);export{v as DeckSceneMatrix};
