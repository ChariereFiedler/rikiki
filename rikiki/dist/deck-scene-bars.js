var ke=Object.defineProperty;var Ge=Object.getOwnPropertyDescriptor;var c=(n,t,e,s)=>{for(var r=s>1?void 0:s?Ge(t,e):t,o=n.length-1,i;o>=0;o--)(i=n[o])&&(r=(s?i(t,e,r):i(r))||r);return s&&r&&ke(t,e,r),r};import{css as xt,html as St,svg as L}from"./vendor/lit.js";import{customElement as vt,property as Y}from"./vendor/lit.js";import{LitElement as De,css as $e}from"./vendor/lit.js";import{property as f}from"./vendor/lit.js";var p=class extends De{constructor(){super(...arguments);this.emphasis=!1}static{this.styles=$e`:host{display:none}`}render(){return null}};c([f({type:String})],p.prototype,"label",2),c([f({type:String})],p.prototype,"note",2),c([f({type:String})],p.prototype,"icon",2),c([f({type:String})],p.prototype,"tag",2),c([f({type:String})],p.prototype,"value",2),c([f({type:String})],p.prototype,"level",2),c([f({type:String})],p.prototype,"from",2),c([f({type:String})],p.prototype,"to",2),c([f({type:Boolean,reflect:!0})],p.prototype,"emphasis",2);customElements.get("deck-scene-item")||customElements.define("deck-scene-item",p);import{LitElement as ft,css as ht}from"./vendor/lit.js";import{property as Ie}from"./vendor/lit.js";var Fe='{"check":"M20 6 9 17l-5-5","cross":"M18 6 6 18M6 6l12 12","alert":"M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z","info":"M12 16v-4m0-4h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z","question":"M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3m.1 4h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z","ban":"M4.9 4.9l14.2 14.2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z","arrow":"M5 12h14m-6-6 6 6-6 6","arrow-down":"M12 5v14m6-6-6 6-6-6","clock":"M12 6v6l4 2m6-2a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z","calendar":"M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z","refresh":"M21 12a9 9 0 1 1-3-6.7M21 3v6h-6","trend":"M22 7 13.5 15.5l-5-5L2 17M16 7h6v6","user":"M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z","team":"M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Zm10 14v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8","target":"M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0-6a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 9a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z","flag":"M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1Zm0 0v7","lock":"M7 11V7a5 5 0 0 1 10 0v4M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z","search":"M21 21l-4.3-4.3M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z","code":"M16 18l6-6-6-6M8 6l-6 6 6 6","database":"M3 5c0 1.7 4 3 9 3s9-1.3 9-3-4-3-9-3-9 1.3-9 3Zm0 0v14c0 1.7 4 3 9 3s9-1.3 9-3V5M3 12c0 1.7 4 3 9 3s9-1.3 9-3","cloud":"M17.5 19a4.5 4.5 0 0 0 0-9h-1.3A7 7 0 1 0 4 16.9","document":"M14 2v6h6M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Zm-6 11h8m-8 4h8m-8-8h2","chart":"M3 3v18h18M7 16V9m5 7V5m5 11v-4","spark":"M12 2 15 9l7 3-7 3-3 7-3-7-7-3 7-3Z"}',J=Object.freeze(JSON.parse(Fe)),Ut=Object.keys(J);function Q(n){return n?J[n.trim().toLowerCase()]??null:null}var m=Object.freeze({label:{size:31,weight:650,line:38},note:{size:25,weight:400,line:34},tag:{size:23,weight:600,line:30},value:{size:56,weight:750,line:64}}),te=.8,x=4;function ne(n,t=1600){return`${-x} ${-x} ${t+2*x} ${n+2*x}`}var D=620;var $=.88;var M=Object.freeze({cards:{min:2,max:5},steps:{min:1,max:6},bars:{min:2,max:8},matrix:{min:1,max:6},ranges:{min:1,max:8},lanes:{min:2,max:5},units:{min:1,max:3}});function ee(n,t,e,s){let r=n.trim().split(/[ \t\n\r]+/).filter(Boolean),o=[],i="",a=!0;for(let u of r){let l=i?`${i} ${u}`:u;if(e(l)<=t){i=l;continue}i&&o.push(i),i=u,e(u)>t&&(a=!1)}return i&&o.push(i),{lines:o,fits:a&&o.length<=s}}function F(n,t,e,s,r){let o=ee(n,t,r(s),e);if(o.fits)return{...o,size:s};let i=Math.round(s*$);return{...ee(n,t,r(i),e),size:i}}var oe=M.bars.max,Pe=200,P=48,re=96,se=16,S=(P-se)/2,Ue=8,Be="\u202F";function U(n){return v(n)??0}function v(n){let t=(n??"").replace(/\s/g,"").replace(",",".");if(!t)return null;let e=Number(t);return Number.isFinite(e)?e:null}function ie(n,t){let e=(n??"").trim();if(!e)return"";let s=t.trim();return s?`${e}${Be}${s}`:e}var He=.7;function ae(n,t,e,s){let r=n?[n]:[],o=Math.round(e*He),i=e;for(;;){let a=s(i)(n);if(a<=t)return{lines:r,fits:!0,size:i,measured:a};if(i<=o)return{lines:r,fits:!1,size:i,measured:a};i=Math.max(o,Math.round(i*$))}}function le(n,t){let e=t!==void 0&&t>0?t:Math.max(0,...n);return e>0?e:1}function ue(n,t,e){return Math.min(1,Math.max(0,n/t))*e}function ce(n){let t=[];return n.forEach((e,s)=>{let r=e.trim(),o=t.at(-1);o&&o.note===r?o.count+=1:t.push({note:r,first:s,count:1})}),t}function me(n,t=1600){let e=n.reduce((w,k)=>w+k.count,0);if(!e)return{barWidth:0,labelWidth:0,xs:[],groups:[],dividers:[]};let s=(e-n.length)*P+(n.length-1)*re,r=t-2*S,o=s?Math.min(1,Math.max(0,(r-e*Ue)/s)):1,i=P*o,a=re*o,u=s*o,l=Math.max(0,Math.min(Pe,(r-u)/e)),d=e*l+u,E=[],_=[],Z=[],b=(t-d)/2;n.forEach((w,k)=>{k>0&&(Z.push(b+a/2),b+=a);let q=b;for(let G=0;G<w.count;G+=1)G>0&&(b+=i),E.push(b),b+=l;_.push({...w,x:q,width:b-q})});let Le=Math.max(0,l+i-se);return{barWidth:l,labelWidth:Le,xs:E,groups:_,dividers:Z}}var I=4,C=2,B=Object.freeze({sources:.3,hub:.22,outcomes:.26}),jt=(1-B.sources-B.hub-B.outcomes)/2;function de(n,t){let e=n.findIndex(t),s=e>=0?e:n.length-1;return{sources:n.slice(0,Math.max(0,s)).slice(0,I),hub:n[s],outcomes:n.slice(s+1,s+1+C)}}var H=8,pe=3;var We=10,Ve=6,qt=2*We+Ve;function fe(n,t){if(n==null||n.trim()==="")return{value:t,valid:!0};let e=Number(n),s=Number.isInteger(e)&&e>=0&&e<=H;return{value:s?e:t,valid:s}}var V=400,he=100,z=12,ze=44,Ke=340,W=.25,Xe=2.2,y=40;function R(n,t,e,s){if(n==null||n.trim()==="")return{value:t,valid:!0};let r=Number(n),o=Number.isInteger(r)&&r>=e&&r<=s;return{value:o?r:t,valid:o}}var je=48;function be(n,t=1600){let e=Math.max(1,n);return(t-je*(e-1))/e}function ge(n){return Math.min(y,Math.max(1,Math.ceil(Math.sqrt(n*Xe))))}function Ye(n,t,e,s=Ke){let r=Math.ceil(n/t),o=Math.ceil(n/r),i=Math.min(ze,e/(o+(o-1)*W),s/(r+(r-1)*W)),a=i*W;return{columns:o,rows:r,cell:i,gap:a,width:o*i+(o-1)*a,height:r*i+(r-1)*a}}function Ee(n,t,e){return Ye(n,t,e).cell>=z}var K=["prod","pilot","test","announced","none"];var tn=Object.freeze({prod:"in production",pilot:"pilot",test:"in test",announced:"announced",none:"nothing yet"});var Ze=n=>(n??"").split("|").map(t=>t.trim()).filter(Boolean);function _e(n){return Ze(n).slice(0,12)}function T(n){if(n===null||n.trim()==="")return null;let t=Number(n);return Number.isFinite(t)?t:null}var qe=["cards","steps","flow","bars","matrix","ranges","lanes","units"];function j(n){let t=n.toLowerCase().replace(/^deck-scene-/,"");return qe.includes(t)?t:null}var Je=["label","note","icon","tag","value","level","from","to","emphasis"],Qe=Object.freeze({cards:["label","note","icon","tag","emphasis"],steps:["label","note","tag","emphasis"],flow:["label","note","icon","tag","emphasis"],bars:["label","note","tag","value","emphasis"],matrix:["label","level","emphasis"],ranges:["label","note","tag","from","to"],lanes:["label","note","icon","tag"],units:["label","note","icon","value","emphasis"]});function Ae(n,t,e){if(!t.length)return null;let s=t.map(o=>`${o.item} \xB7 ${o.field}`),r=t.filter(o=>o.measured!==void 0&&o.budget!==void 0).map(o=>`${o.item} \xB7 ${o.field} needs ${Math.round(o.measured??0)} of ${Math.round(o.budget??0)} units`);return{code:"SCENE_TEXT_TOO_LONG",severity:"error",items:s,fields:t,...e?{scene:{kind:n,...e}}:{},message:`a ${n} scene could not fit ${s.join(", ")} even one size down \xB7 drawn anyway, past its box${r.length?` (${r.join("; ")})`:""}`}}var xe=2,et=I+1+C,Se=4,tt=/(?<=[.!?…])\s+(?=\p{Lu})/u,O=(n,t)=>n.label?.trim()||`item ${t+1}`,Te=n=>n.trim().split(/\s+/).filter(Boolean);function Ne(n,t,e){return t<=D?null:{code:"SCENE_TOO_TALL",severity:"error",items:[`${e} ${e===1?"item":"items"}, ${Math.round(t)} units tall`],message:`a slide leaves room for about ${D} units and this ${n} scene is taller \xB7 the slide clips it \xB7 fewer items, or split the slide`}}function we(n,t,e={}){let s=[],r=(i,a,u,l)=>{u.length&&s.push({code:i,severity:a,items:u,message:l})},o=i=>t.flatMap((a,u)=>i(a,u)?[O(a,u)]:[]);return st(n,t,r),r("SCENE_ITEM_NO_LABEL","error",o(i=>!i.label?.trim()),"an item has no label \xB7 the scene would draw it as an empty box"),r("SCENE_ATTRIBUTE_IGNORED","warning",t.flatMap((i,a)=>nt(n,i).map(u=>`${O(i,a)} \xB7 ${u}`)),`a ${n} scene does not read this attribute \xB7 it is dropped, and the picture does not change`),r("SCENE_ICON_UNKNOWN","error",o(i=>!!i.icon&&!Q(i.icon)),"the icon is not in the 24-glyph set \xB7 it draws nothing, silently"),n==="bars"&&(r("SCENE_VALUE_INVALID","error",o(i=>v(i.value)===null),"`value` is missing or is not a number \xB7 the bar is drawn flat"),it(t,e,r,o)),n==="ranges"&&(r("SCENE_VALUE_INVALID","error",o(ct),ut),lt(e,r,o)),n==="matrix"&&pt(e,r,o),n==="lanes"&&mt(e,r),n==="units"&&dt(t,e,r,o),r("SCENE_EMPHASIS_MANY","warning",n==="bars"?ot(t):Me(t),"more than one item is emphasised \xB7 the scene puts one forward, and two are none"),r("SCENE_LABEL_LONG","warning",o(i=>Te(i.label??"").length>Se),`a label past ${Se} words reads as a sentence \xB7 one to three words, the detail goes in the note`),r("SCENE_NOTE_LONG","warning",o(i=>(i.note??"").trim().split(tt).length>1),"a note of more than one sentence \xB7 the scene is read from the back of the room, one sentence each"),s}function nt(n,t){let e=Qe[n];return Je.filter(s=>(s==="emphasis"?t.emphasis:t[s]!==null)&&!e.includes(s))}var rt=n=>n.flatMap((t,e)=>t.emphasis?[O(t,e)]:[]),Me=n=>{let t=rt(n);return t.length>1?t:[]};function ot(n){let t=[];for(let e of n){let s=t.at(-1);s&&(s[0].note??"")===(e.note??"")?s.push(e):t.push([e])}return t.flatMap(Me)}function st(n,t,e){let s=i=>O(i,t.indexOf(i));if(n==="flow"){let i=de(t,u=>u.emphasis),a=new Set([...i.sources,i.hub,...i.outcomes]);e("SCENE_ITEMS_DROPPED","error",t.filter(u=>!a.has(u)).map(s),`a flow draws ${I} sources before the hub and ${C} outcomes after it at most \xB7 these are not drawn`),t.length<xe&&ve(e,t.length,xe,et);return}let{min:r,max:o}=M[n];e("SCENE_ITEMS_DROPPED","error",t.slice(o).map(s),`a ${n} scene draws at most ${o} items \xB7 these are not drawn`),t.length<r&&ve(e,t.length,r,o)}function ve(n,t,e,s){n("SCENE_TOO_FEW_ITEMS","error",[`${t} item${t===1?"":"s"}`],`the scene is built for ${e} to ${s} items \xB7 with ${t} it has nothing to compare`)}function X(n,t){if(!n?.trim())return null;let e=t(n);return e!==null&&e>0?e:!1}function it(n,t,e,s){let r=X(t.max,v),o=X(t.height,v);e("SCENE_ATTRIBUTE_INVALID","error",[...r===!1?["max"]:[],...o===!1?["height"]:[]],"`max` and `height` must be positive numbers \xB7 the scene drew its default instead"),typeof r=="number"&&e("SCENE_VALUE_CLIPPED","error",s(i=>{let a=v(i.value);return a!==null&&(a>r||a<0)}),`a value is past the scale (0 to ${r}) \xB7 its bar stops at the edge, so it is not the size it says \xB7 raise \`max\``),e("SCENE_GROUP_SPLIT","warning",at(n),"a note comes back after another \xB7 only neighbours with the same note share a group, so these are drawn as separate groups \xB7 keep the items of a group together")}function at(n){let t=new Set,e=new Set,s=null;for(let r of n){let o=(r.note??"").trim();o&&o!==s&&t.has(o)&&e.add(o),o&&t.add(o),s=o}return[...e]}function lt(n,t,e){let s=X(n.scale,o=>T(o));if(t("SCENE_ATTRIBUTE_INVALID","error",s===!1?["scale"]:[],"`scale` must be a positive number \xB7 the scene fitted the scale to the rows instead"),typeof s!="number")return;let r=o=>{let i=T(o);return i!==null&&(i>s||i<0)};t("SCENE_VALUE_CLIPPED","error",e(o=>r(o.from)||r(o.to)),`a bound is past the scale (0 to ${s}) \xB7 the bar stops at the edge, so it is not the length it says \xB7 raise \`scale\``)}var ut="`from` and `to` must be numbers when written, with `from` first \xB7 otherwise the bar lands where the scene guessed";function ct(n){let t=T(n.from),e=T(n.to),s=!!n.from?.trim(),r=!!n.to?.trim();return s&&t===null||r&&e===null?!0:t!==null&&e!==null&&t>e}function mt(n,t){let e=["passed","blocked"].filter(s=>!fe(n[s],pe).valid);t("SCENE_VALUE_INVALID","error",e,`these must be whole numbers from 0 to ${H} \xB7 the scene drew its default instead`)}function dt(n,t,e,s){let r=R(t.total,he,1,V),o=R(t.columns,ge(r.value),1,y),i=[...r.valid?[]:["total"],...o.valid?[]:["columns"]];e("SCENE_VALUE_INVALID","error",i,`\`total\` is a whole number from 1 to ${V} and \`columns\` from 1 to ${y} \xB7 the scene drew its default instead`),e("SCENE_VALUE_INVALID","error",s(a=>!R(a.value,0,0,r.value).valid||!a.value?.trim()),`\`value\` is how many cells are lit, a whole number from 0 to ${r.value} \xB7 missing or out of range, the grid is drawn empty or full`),e("SCENE_GRID_TOO_DENSE","error",o.valid&&!Ee(r.value,o.value,be(n.length,t.width))?[`${r.value} cells in ${o.value} columns`]:[],`the cells are under ${z} units wide at this size \xB7 fewer cells, fewer columns would not help, fewer panels would`)}function pt(n,t,e){let s=_e(n.columns??void 0).length,r=i=>Te(i.level??""),o=new Set(K);t("SCENE_LEVEL_INVALID","error",e(i=>{let a=r(i);return s>0&&a.length!==s||a.some(l=>!o.has(l))}),`\`level\` needs one status per column${s?` (${s})`:""}, each one of ${K.join(", ")} \xB7 a missing or unknown one is drawn as "none"`)}var bt=200,Ce=null;function gt(){return Ce??=document.createElement("canvas"),Ce.getContext("2d")}function N(n,t,e="--rik-font-sans"){let s=getComputedStyle(n),r=s.getPropertyValue(e).trim()||s.getPropertyValue("--rik-font-sans").trim()||"sans-serif";return o=>{let i=gt();if(!i)return u=>u.length*o*.5;let a=`${t} ${o}px ${r}`;return Et(a),u=>(i.font=a,i.measureText(u).width)}}var ye=new Set;function Et(n){ye.has(n)||!document.fonts?.load||(ye.add(n),document.fonts.load(n).catch(t=>{console.warn(`rikiki \xB7 scene font did not load (${n}): ${String(t)}`)}))}var Re=ht`:host{display:block;inline-size:100%}svg{display:block;inline-size:100%;block-size:auto;overflow:visible}text{font-family:var(--rik-font-sans);fill:var(--rik-text-default)}.note{fill:var(--deck-scene-muted,var(--rik-text-default--muted))}.tag{/* The strong accent,not the text accent · a tag sits on a card (paper-100),and the text accent measures 2.8:1 there,under the 3:1 large text needs. \`check\` (SVG_TEXT_CONTRAST_LOW) found it on the default theme. */
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
`;function _t(n){let t=e=>n.getAttribute(e);return{label:t("label"),note:t("note"),icon:t("icon"),tag:t("tag"),value:t("value"),level:t("level"),from:t("from"),to:t("to"),emphasis:n.hasAttribute("emphasis")}}var A=class extends ft{constructor(){super(...arguments);this.playing=!1;this.warnedIssues="";this.linted=[];this.overflows=[];this.onFontsLoaded=()=>{this.requestUpdate()}}get width(){let e=this.frameWidth;return e!==void 0&&Number.isFinite(e)&&e>=bt?e:1600}get items(){return[...this.querySelectorAll(":scope > deck-scene-item")]}connectedCallback(){super.connectedCallback(),this.onShownSlide()?this.applyStep(0):this.playing=!1,document.fonts?.ready.then(()=>this.requestUpdate()),document.fonts?.addEventListener("loadingdone",this.onFontsLoaded),this.observer=new MutationObserver(e=>{e.some(s=>s.type==="childList"||s.target!==this)&&this.requestUpdate()}),this.observer.observe(this,{attributes:!0,childList:!0,subtree:!0})}disconnectedCallback(){super.disconnectedCallback(),this.observer?.disconnect(),document.fonts?.removeEventListener("loadingdone",this.onFontsLoaded)}onShownSlide(){let e=this.closest("deck-root");return!e||e.hasAttribute("data-overview-snapshot")||e.hasAttribute("preview")?!1:!!this.closest("deck-root > [active]")}applyStep(e){e===0&&(this.playing=!1,requestAnimationFrame(()=>{this.playing=!0}))}willUpdate(){let e=j(this.localName);this.linted=e?we(e,this.items.map(_t),{columns:this.getAttribute("columns"),passed:this.getAttribute("passed"),blocked:this.getAttribute("blocked"),total:this.getAttribute("total"),max:this.getAttribute("max"),height:this.getAttribute("height"),scale:this.getAttribute("scale"),width:this.width}):[]}updated(){let e=j(this.localName),s=this.renderRoot.querySelector("svg")?.getAttribute("viewBox"),r=Number(s?.split(" ")[3])-2*x,o=e&&r>0&&this.frameWidth===void 0?Ne(e,r,this.items.length):null,i=Ae(e??this.localName.replace(/^deck-scene-/,""),this.overflows,{width:this.width,count:this.items.length});this.reportIssues([...this.linted,...this.extraIssues(),...i?[i]:[],...o?[o]:[]])}extraIssues(){return[]}reportIssues(e){let s=e.length?JSON.stringify(e):"";if(s!==(this.getAttribute("data-scene-issues")??"")&&(s?this.setAttribute("data-scene-issues",s):this.removeAttribute("data-scene-issues")),s&&s!==this.warnedIssues)for(let r of e)console.warn(`<${this.localName}> \xB7 ${r.message}: ${r.items.join(", ")}`);this.warnedIssues=s}reportOverflow(e){this.overflows=e.map(s=>typeof s=="string"?{item:s,field:"text"}:s)}};c([Ie({type:Boolean,reflect:!0})],A.prototype,"playing",2),c([Ie({type:Number,attribute:"frame-width"})],A.prototype,"frameWidth",2);var At=280,Tt=16,Oe=16,Nt=24,wt=16,Mt=2,It=2,Ct=8,yt=.1,Rt=.12,Ot=.7,h=class extends A{constructor(){super(...arguments);this.unit=""}render(){let e=this.items.slice(0,oe),s=ce(e.map(l=>l.getAttribute("note")??"")),r=me(s,this.width),o=Lt(e.map(l=>this.bar(l,r.labelWidth))),i=this.captions(r.groups),a=this.bands(o,i),u=le(o.map(l=>l.value),this.max===void 0?void 0:U(this.max));return this.reportOverflow([...o.flatMap(l=>this.overflowsOf(l,r.labelWidth)),...i.filter(l=>!l.text.fits).map(l=>({item:l.span.note,field:"caption",text:l.span.note,budget:l.span.width+2*S,size:l.text.size}))]),St`<svg viewBox=${ne(a.height,this.width)} role="img" aria-label=${this.description(o,r.groups)} part="drawing"> ${r.dividers.map(l=>L`<line class="line muted dash" x1=${l} y1="0" x2=${l} y2=${a.height}></line>`)}
      ${o.map((l,d)=>this.drawBar(l,r,d,ue(l.value,u,a.area),a))}
      ${r.groups.map(l=>L`<line class="line muted" x1=${l.x-S} y1=${a.baseline} x2=${l.x+l.width+S} y2=${a.baseline}></line>`)}
      ${i.map(l=>this.lines(l.text,"label",l.span.x+l.span.width/2,a.captionTop,m.label))}
    </svg>`}bar(e,s){let r=N(this,m.value.weight,"--rik-font-display"),o=N(this,m.note.weight),i=e.getAttribute("value"),a=e.getAttribute("tag")?.trim()||ie(i,this.unit),u=e.getAttribute("label")??"",l=e.getAttribute("note")?.trim(),d=u||a;return{value:U(i),figure:ae(a,s,m.value.size,r),label:F(u,s,Mt,m.note.size,o),emphasis:e.hasAttribute("emphasis"),name:d,overflowName:l?`${l} \xB7 ${d}`:d,shown:a,labelText:u}}overflowsOf(e,s){let r=[];if(e.figure.fits||r.push({item:e.overflowName,field:"figure",text:e.shown,measured:e.figure.measured,budget:s,size:e.figure.size}),!e.label.fits){let o=N(this,m.note.weight)(e.label.size);r.push({item:e.overflowName,field:"label",text:e.labelText,measured:Math.max(0,...e.label.lines.map(o)),budget:s,size:e.label.size})}return r}captions(e){let s=N(this,m.label.weight);return e.filter(r=>r.note).map(r=>({span:r,text:F(r.note,r.width+2*S,It,m.label.size,s)}))}bands(e,s){let r=this.height&&this.height>0?this.height:At,o=Tt+m.value.line+Oe+r,i=Math.max(0,...e.map(_=>_.label.lines.length)),a=o+Nt,u=i?a+i*m.note.line:o,l=Math.max(0,...s.map(_=>_.text.lines.length)),d=u+wt,E=l?d+l*m.label.line:u;return{area:r,baseline:o,labelTop:a,captionTop:d,height:E}}drawBar(e,s,r,o,i){let a=s.xs[r]??0,u=a+s.barWidth/2,l=i.baseline-o,d=yt+r*Rt,E=l-Oe-m.value.line;return L`
      <path class="${e.emphasis?"emphasis":"card"} grow" style="--t0:${d}s"
        d=${kt(a,l,s.barWidth,o)}></path>
      <g class="fade" style="--t0:${d+Ot}s">
        ${this.lines(e.figure,e.emphasis?"value figure lead":"value figure",u,E,m.value)}
      </g>
      ${this.lines(e.label,"label",u,i.labelTop,m.note)}`}lines(e,s,r,o,i){return e.lines.map((a,u)=>L`<text
        class=${s}
        x=${r}
        y=${o+u*i.line+e.size*te}
        text-anchor="middle"
        font-size=${e.size}
        font-weight=${i.weight}
      >${a}</text>`)}description(e,s){let r=o=>[o.name,o.figure.lines.join(" ")].filter(Boolean).join(" ");return s.map(o=>{let i=e.slice(o.first,o.first+o.count).map(r).join(", ");return o.note?`${o.note}: ${i}`:i}).join(". ")}};h.styles=[Re,xt`.figure{fill:var(--deck-scene-value,var(--rik-text-default))}.figure.lead{fill:var(--deck-scene-value-emphasis,var(--rik-accent__text,var(--rik-accent)))}`],c([Y({type:String})],h.prototype,"unit",2),c([Y({type:String})],h.prototype,"max",2),c([Y({type:Number})],h.prototype,"height",2),h=c([vt("deck-scene-bars")],h);function Lt(n){let t=Math.min(...n.map(e=>e.figure.size));return n.map(e=>({...e,figure:{...e.figure,size:t}}))}function kt(n,t,e,s){let r=Math.min(Ct,s,e/2),o=t+s;return`M${n} ${o}V${t+r}Q${n} ${t} ${n+r} ${t}H${n+e-r}Q${n+e} ${t} ${n+e} ${t+r}V${o}Z`}export{h as DeckSceneBars};
