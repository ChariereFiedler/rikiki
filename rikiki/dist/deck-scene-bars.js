var Ie=Object.defineProperty;var Ce=Object.getOwnPropertyDescriptor;var m=(n,t,e,o)=>{for(var s=o>1?void 0:o?Ce(t,e):t,r=n.length-1,i;r>=0;r--)(i=n[r])&&(s=(o?i(t,e,s):i(s))||s);return o&&s&&Ie(t,e,s),s};import{css as ft,html as ht,svg as R}from"./vendor/lit.js";import{customElement as bt,property as X}from"./vendor/lit.js";import{LitElement as ye,css as Re}from"./vendor/lit.js";import{property as f}from"./vendor/lit.js";var p=class extends ye{constructor(){super(...arguments);this.emphasis=!1}static{this.styles=Re`:host{display:none}`}render(){return null}};m([f({type:String})],p.prototype,"label",2),m([f({type:String})],p.prototype,"note",2),m([f({type:String})],p.prototype,"icon",2),m([f({type:String})],p.prototype,"tag",2),m([f({type:String})],p.prototype,"value",2),m([f({type:String})],p.prototype,"level",2),m([f({type:String})],p.prototype,"from",2),m([f({type:String})],p.prototype,"to",2),m([f({type:Boolean,reflect:!0})],p.prototype,"emphasis",2);customElements.get("deck-scene-item")||customElements.define("deck-scene-item",p);import{LitElement as lt,css as ut}from"./vendor/lit.js";import{property as Ae}from"./vendor/lit.js";var Oe='{"check":"M20 6 9 17l-5-5","cross":"M18 6 6 18M6 6l12 12","alert":"M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z","info":"M12 16v-4m0-4h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z","question":"M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3m.1 4h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z","ban":"M4.9 4.9l14.2 14.2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z","arrow":"M5 12h14m-6-6 6 6-6 6","arrow-down":"M12 5v14m6-6-6 6-6-6","clock":"M12 6v6l4 2m6-2a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z","calendar":"M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z","refresh":"M21 12a9 9 0 1 1-3-6.7M21 3v6h-6","trend":"M22 7 13.5 15.5l-5-5L2 17M16 7h6v6","user":"M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z","team":"M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Zm10 14v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8","target":"M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0-6a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 9a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z","flag":"M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1Zm0 0v7","lock":"M7 11V7a5 5 0 0 1 10 0v4M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z","search":"M21 21l-4.3-4.3M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z","code":"M16 18l6-6-6-6M8 6l-6 6 6 6","database":"M3 5c0 1.7 4 3 9 3s9-1.3 9-3-4-3-9-3-9 1.3-9 3Zm0 0v14c0 1.7 4 3 9 3s9-1.3 9-3V5M3 12c0 1.7 4 3 9 3s9-1.3 9-3","cloud":"M17.5 19a4.5 4.5 0 0 0 0-9h-1.3A7 7 0 1 0 4 16.9","document":"M14 2v6h6M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Zm-6 11h8m-8 4h8m-8-8h2","chart":"M3 3v18h18M7 16V9m5 7V5m5 11v-4","spark":"M12 2 15 9l7 3-7 3-3 7-3-7-7-3 7-3Z"}',Y=Object.freeze(JSON.parse(Oe)),kt=Object.keys(Y);function Z(n){return n?Y[n.trim().toLowerCase()]??null:null}var d=Object.freeze({label:{size:31,weight:650,line:38},note:{size:25,weight:400,line:34},tag:{size:23,weight:600,line:30},value:{size:56,weight:750,line:64}}),J=.8,x=4;function Q(n,t=1600){return`${-x} ${-x} ${t+2*x} ${n+2*x}`}var L=620;var k=.88;var N=Object.freeze({cards:{min:2,max:5},steps:{min:1,max:6},bars:{min:2,max:8},matrix:{min:1,max:6},ranges:{min:1,max:8},lanes:{min:2,max:5},units:{min:1,max:3}});function q(n,t,e,o){let s=n.trim().split(/[ \t\n\r]+/).filter(Boolean),r=[],i="",a=!0;for(let u of s){let l=i?`${i} ${u}`:u;if(e(l)<=t){i=l;continue}i&&r.push(i),i=u,e(u)>t&&(a=!1)}return i&&r.push(i),{lines:r,fits:a&&r.length<=o}}function G(n,t,e,o,s){let r=q(n,t,s(o),e);if(r.fits)return{...r,size:o};let i=Math.round(o*k);return{...q(n,t,s(i),e),size:i}}var ee=N.bars.max,Le=200,$=48,D=96,ke=16,E=($-ke)/2,Ge="\u202F";function F(n){return S(n)??0}function S(n){let t=(n??"").replace(/\s/g,"").replace(",",".");if(!t)return null;let e=Number(t);return Number.isFinite(e)?e:null}function te(n,t){let e=(n??"").trim();if(!e)return"";let o=t.trim();return o?`${e}${Ge}${o}`:e}var De=.7;function ne(n,t,e,o){let s=n?[n]:[],r=Math.round(e*De),i=e;for(;;){let a=o(i)(n);if(a<=t)return{lines:s,fits:!0,size:i,measured:a};if(i<=r)return{lines:s,fits:!1,size:i,measured:a};i=Math.max(r,Math.round(i*k))}}function re(n,t){let e=t!==void 0&&t>0?t:Math.max(0,...n);return e>0?e:1}function se(n,t,e){return Math.min(1,Math.max(0,n/t))*e}function oe(n){let t=[];return n.forEach((e,o)=>{let s=e.trim(),r=t.at(-1);r&&r.note===s?r.count+=1:t.push({note:s,first:o,count:1})}),t}function ie(n,t=1600){let e=n.reduce((h,g)=>h+g.count,0);if(!e)return{barWidth:0,labelWidth:0,xs:[],groups:[],dividers:[]};let o=(e-n.length)*$+(n.length-1)*D,s=t-2*E-o,r=Math.min(Le,s/e),i=e*r+o,a=[],u=[],l=[],c=(t-i)/2;return n.forEach((h,g)=>{g>0&&(l.push(c+D/2),c+=D);let j=c;for(let O=0;O<h.count;O+=1)O>0&&(c+=$),a.push(c),c+=r;u.push({...h,x:j,width:c-j})}),{barWidth:r,labelWidth:r+2*E,xs:a,groups:u,dividers:l}}var w=4,M=2,P=Object.freeze({sources:.3,hub:.22,outcomes:.26}),Ht=(1-P.sources-P.hub-P.outcomes)/2;function ae(n,t){let e=n.findIndex(t),o=e>=0?e:n.length-1;return{sources:n.slice(0,Math.max(0,o)).slice(0,w),hub:n[o],outcomes:n.slice(o+1,o+1+M)}}var U=8,le=3;var $e=10,Fe=6,zt=2*$e+Fe;function ue(n,t){if(n==null||n.trim()==="")return{value:t,valid:!0};let e=Number(n),o=Number.isInteger(e)&&e>=0&&e<=U;return{value:o?e:t,valid:o}}var H=400,ce=100,W=12,Pe=44,Ue=340,B=.25,Be=2.2,I=40;function C(n,t,e,o){if(n==null||n.trim()==="")return{value:t,valid:!0};let s=Number(n),r=Number.isInteger(s)&&s>=e&&s<=o;return{value:r?s:t,valid:r}}var He=48;function me(n,t=1600){let e=Math.max(1,n);return(t-He*(e-1))/e}function de(n){return Math.min(I,Math.max(1,Math.ceil(Math.sqrt(n*Be))))}function We(n,t,e,o=Ue){let s=Math.ceil(n/t),r=Math.ceil(n/s),i=Math.min(Pe,e/(r+(r-1)*B),o/(s+(s-1)*B)),a=i*B;return{columns:r,rows:s,cell:i,gap:a,width:r*i+(r-1)*a,height:s*i+(s-1)*a}}function pe(n,t,e){return We(n,t,e).cell>=W}var V=["prod","pilot","test","announced","none"];var Yt=Object.freeze({prod:"in production",pilot:"pilot",test:"in test",announced:"announced",none:"nothing yet"});var Ve=n=>(n??"").split("|").map(t=>t.trim()).filter(Boolean);function fe(n){return Ve(n).slice(0,12)}function A(n){if(n===null||n.trim()==="")return null;let t=Number(n);return Number.isFinite(t)?t:null}var ze=["cards","steps","flow","bars","matrix","ranges","lanes","units"];function K(n){let t=n.toLowerCase().replace(/^deck-scene-/,"");return ze.includes(t)?t:null}var Ke=["label","note","icon","tag","value","level","from","to","emphasis"],Xe=Object.freeze({cards:["label","note","icon","tag","emphasis"],steps:["label","note","tag","emphasis"],flow:["label","note","icon","tag","emphasis"],bars:["label","note","tag","value","emphasis"],matrix:["label","level","emphasis"],ranges:["label","note","tag","from","to"],lanes:["label","note","icon","tag"],units:["label","note","icon","value","emphasis"]});function Ee(n,t,e){if(!t.length)return null;let o=t.map(r=>`${r.item} \xB7 ${r.field}`),s=t.filter(r=>r.measured!==void 0&&r.budget!==void 0).map(r=>`${r.item} \xB7 ${r.field} needs ${Math.round(r.measured??0)} of ${Math.round(r.budget??0)} units`);return{code:"SCENE_TEXT_TOO_LONG",severity:"error",items:o,fields:t,...e?{scene:{kind:n,...e}}:{},message:`a ${n} scene could not fit ${o.join(", ")} even one size down \xB7 drawn anyway, past its box${s.length?` (${s.join("; ")})`:""}`}}var he=2,je=w+1+M,be=4,Ye=/(?<=[.!?…])\s+(?=\p{Lu})/u,y=(n,t)=>n.label?.trim()||`item ${t+1}`,_e=n=>n.trim().split(/\s+/).filter(Boolean);function xe(n,t,e){return t<=L?null:{code:"SCENE_TOO_TALL",severity:"error",items:[`${e} ${e===1?"item":"items"}, ${Math.round(t)} units tall`],message:`a slide leaves room for about ${L} units and this ${n} scene is taller \xB7 the slide clips it \xB7 fewer items, or split the slide`}}function Se(n,t,e={}){let o=[],s=(i,a,u,l)=>{u.length&&o.push({code:i,severity:a,items:u,message:l})},r=i=>t.flatMap((a,u)=>i(a,u)?[y(a,u)]:[]);return Qe(n,t,s),s("SCENE_ITEM_NO_LABEL","error",r(i=>!i.label?.trim()),"an item has no label \xB7 the scene would draw it as an empty box"),s("SCENE_ATTRIBUTE_IGNORED","warning",t.flatMap((i,a)=>Ze(n,i).map(u=>`${y(i,a)} \xB7 ${u}`)),`a ${n} scene does not read this attribute \xB7 it is dropped, and the picture does not change`),s("SCENE_ICON_UNKNOWN","error",r(i=>!!i.icon&&!Z(i.icon)),"the icon is not in the 24-glyph set \xB7 it draws nothing, silently"),n==="bars"&&(s("SCENE_VALUE_INVALID","error",r(i=>S(i.value)===null),"`value` is missing or is not a number \xB7 the bar is drawn flat"),et(t,e,s,r)),n==="ranges"&&(s("SCENE_VALUE_INVALID","error",r(st),rt),nt(e,s,r)),n==="matrix"&&at(e,s,r),n==="lanes"&&ot(e,s),n==="units"&&it(t,e,s,r),s("SCENE_EMPHASIS_MANY","warning",n==="bars"?Je(t):ve(t),"more than one item is emphasised \xB7 the scene puts one forward, and two are none"),s("SCENE_LABEL_LONG","warning",r(i=>_e(i.label??"").length>be),`a label past ${be} words reads as a sentence \xB7 one to three words, the detail goes in the note`),s("SCENE_NOTE_LONG","warning",r(i=>(i.note??"").trim().split(Ye).length>1),"a note of more than one sentence \xB7 the scene is read from the back of the room, one sentence each"),o}function Ze(n,t){let e=Xe[n];return Ke.filter(o=>(o==="emphasis"?t.emphasis:t[o]!==null)&&!e.includes(o))}var qe=n=>n.flatMap((t,e)=>t.emphasis?[y(t,e)]:[]),ve=n=>{let t=qe(n);return t.length>1?t:[]};function Je(n){let t=[];for(let e of n){let o=t.at(-1);o&&(o[0].note??"")===(e.note??"")?o.push(e):t.push([e])}return t.flatMap(ve)}function Qe(n,t,e){let o=i=>y(i,t.indexOf(i));if(n==="flow"){let i=ae(t,u=>u.emphasis),a=new Set([...i.sources,i.hub,...i.outcomes]);e("SCENE_ITEMS_DROPPED","error",t.filter(u=>!a.has(u)).map(o),`a flow draws ${w} sources before the hub and ${M} outcomes after it at most \xB7 these are not drawn`),t.length<he&&ge(e,t.length,he,je);return}let{min:s,max:r}=N[n];e("SCENE_ITEMS_DROPPED","error",t.slice(r).map(o),`a ${n} scene draws at most ${r} items \xB7 these are not drawn`),t.length<s&&ge(e,t.length,s,r)}function ge(n,t,e,o){n("SCENE_TOO_FEW_ITEMS","error",[`${t} item${t===1?"":"s"}`],`the scene is built for ${e} to ${o} items \xB7 with ${t} it has nothing to compare`)}function z(n,t){if(!n?.trim())return null;let e=t(n);return e!==null&&e>0?e:!1}function et(n,t,e,o){let s=z(t.max,S),r=z(t.height,S);e("SCENE_ATTRIBUTE_INVALID","error",[...s===!1?["max"]:[],...r===!1?["height"]:[]],"`max` and `height` must be positive numbers \xB7 the scene drew its default instead"),typeof s=="number"&&e("SCENE_VALUE_CLIPPED","error",o(i=>{let a=S(i.value);return a!==null&&(a>s||a<0)}),`a value is past the scale (0 to ${s}) \xB7 its bar stops at the edge, so it is not the size it says \xB7 raise \`max\``),e("SCENE_GROUP_SPLIT","warning",tt(n),"a note comes back after another \xB7 only neighbours with the same note share a group, so these are drawn as separate groups \xB7 keep the items of a group together")}function tt(n){let t=new Set,e=new Set,o=null;for(let s of n){let r=(s.note??"").trim();r&&r!==o&&t.has(r)&&e.add(r),r&&t.add(r),o=r}return[...e]}function nt(n,t,e){let o=z(n.scale,r=>A(r));if(t("SCENE_ATTRIBUTE_INVALID","error",o===!1?["scale"]:[],"`scale` must be a positive number \xB7 the scene fitted the scale to the rows instead"),typeof o!="number")return;let s=r=>{let i=A(r);return i!==null&&(i>o||i<0)};t("SCENE_VALUE_CLIPPED","error",e(r=>s(r.from)||s(r.to)),`a bound is past the scale (0 to ${o}) \xB7 the bar stops at the edge, so it is not the length it says \xB7 raise \`scale\``)}var rt="`from` and `to` must be numbers when written, with `from` first \xB7 otherwise the bar lands where the scene guessed";function st(n){let t=A(n.from),e=A(n.to),o=!!n.from?.trim(),s=!!n.to?.trim();return o&&t===null||s&&e===null?!0:t!==null&&e!==null&&t>e}function ot(n,t){let e=["passed","blocked"].filter(o=>!ue(n[o],le).valid);t("SCENE_VALUE_INVALID","error",e,`these must be whole numbers from 0 to ${U} \xB7 the scene drew its default instead`)}function it(n,t,e,o){let s=C(t.total,ce,1,H),r=C(t.columns,de(s.value),1,I),i=[...s.valid?[]:["total"],...r.valid?[]:["columns"]];e("SCENE_VALUE_INVALID","error",i,`\`total\` is a whole number from 1 to ${H} and \`columns\` from 1 to ${I} \xB7 the scene drew its default instead`),e("SCENE_VALUE_INVALID","error",o(a=>!C(a.value,0,0,s.value).valid||!a.value?.trim()),`\`value\` is how many cells are lit, a whole number from 0 to ${s.value} \xB7 missing or out of range, the grid is drawn empty or full`),e("SCENE_GRID_TOO_DENSE","error",r.valid&&!pe(s.value,r.value,me(n.length,t.width))?[`${s.value} cells in ${r.value} columns`]:[],`the cells are under ${W} units wide at this size \xB7 fewer cells, fewer columns would not help, fewer panels would`)}function at(n,t,e){let o=fe(n.columns??void 0).length,s=i=>_e(i.level??""),r=new Set(V);t("SCENE_LEVEL_INVALID","error",e(i=>{let a=s(i);return o>0&&a.length!==o||a.some(l=>!r.has(l))}),`\`level\` needs one status per column${o?` (${o})`:""}, each one of ${V.join(", ")} \xB7 a missing or unknown one is drawn as "none"`)}var ct=200,Te=null;function mt(){return Te??=document.createElement("canvas"),Te.getContext("2d")}function T(n,t,e="--rik-font-sans"){let o=getComputedStyle(n),s=o.getPropertyValue(e).trim()||o.getPropertyValue("--rik-font-sans").trim()||"sans-serif";return r=>{let i=mt();if(!i)return u=>u.length*r*.5;let a=`${t} ${r}px ${s}`;return dt(a),u=>(i.font=a,i.measureText(u).width)}}var Ne=new Set;function dt(n){Ne.has(n)||!document.fonts?.load||(Ne.add(n),document.fonts.load(n).catch(t=>{console.warn(`rikiki \xB7 scene font did not load (${n}): ${String(t)}`)}))}var we=ut`:host{display:block;inline-size:100%}svg{display:block;inline-size:100%;block-size:auto;overflow:visible}text{font-family:var(--rik-font-sans);fill:var(--rik-text-default)}.note{fill:var(--deck-scene-muted,var(--rik-text-default--muted))}.tag{/* The strong accent,not the text accent · a tag sits on a card (paper-100),and the text accent measures 2.8:1 there,under the 3:1 large text needs. \`check\` (SVG_TEXT_CONTRAST_LOW) found it on the default theme. */
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
`;function pt(n){let t=e=>n.getAttribute(e);return{label:t("label"),note:t("note"),icon:t("icon"),tag:t("tag"),value:t("value"),level:t("level"),from:t("from"),to:t("to"),emphasis:n.hasAttribute("emphasis")}}var v=class extends lt{constructor(){super(...arguments);this.playing=!1;this.warnedIssues="";this.linted=[];this.overflows=[];this.onFontsLoaded=()=>{this.requestUpdate()}}get width(){let e=this.frameWidth;return e!==void 0&&Number.isFinite(e)&&e>=ct?e:1600}get items(){return[...this.querySelectorAll(":scope > deck-scene-item")]}connectedCallback(){super.connectedCallback(),this.onShownSlide()?this.applyStep(0):this.playing=!1,document.fonts?.ready.then(()=>this.requestUpdate()),document.fonts?.addEventListener("loadingdone",this.onFontsLoaded),this.observer=new MutationObserver(e=>{e.some(o=>o.type==="childList"||o.target!==this)&&this.requestUpdate()}),this.observer.observe(this,{attributes:!0,childList:!0,subtree:!0})}disconnectedCallback(){super.disconnectedCallback(),this.observer?.disconnect(),document.fonts?.removeEventListener("loadingdone",this.onFontsLoaded)}onShownSlide(){let e=this.closest("deck-root");return!e||e.hasAttribute("data-overview-snapshot")||e.hasAttribute("preview")?!1:!!this.closest("deck-root > [active]")}applyStep(e){e===0&&(this.playing=!1,requestAnimationFrame(()=>{this.playing=!0}))}willUpdate(){let e=K(this.localName);this.linted=e?Se(e,this.items.map(pt),{columns:this.getAttribute("columns"),passed:this.getAttribute("passed"),blocked:this.getAttribute("blocked"),total:this.getAttribute("total"),max:this.getAttribute("max"),height:this.getAttribute("height"),scale:this.getAttribute("scale"),width:this.width}):[]}updated(){let e=K(this.localName),o=this.renderRoot.querySelector("svg")?.getAttribute("viewBox"),s=Number(o?.split(" ")[3])-2*x,r=e&&s>0&&this.frameWidth===void 0?xe(e,s,this.items.length):null,i=Ee(e??this.localName.replace(/^deck-scene-/,""),this.overflows,{width:this.width,count:this.items.length});this.reportIssues([...this.linted,...this.extraIssues(),...i?[i]:[],...r?[r]:[]])}extraIssues(){return[]}reportIssues(e){let o=e.length?JSON.stringify(e):"";if(o!==(this.getAttribute("data-scene-issues")??"")&&(o?this.setAttribute("data-scene-issues",o):this.removeAttribute("data-scene-issues")),o&&o!==this.warnedIssues)for(let s of e)console.warn(`<${this.localName}> \xB7 ${s.message}: ${s.items.join(", ")}`);this.warnedIssues=o}reportOverflow(e){this.overflows=e.map(o=>typeof o=="string"?{item:o,field:"text"}:o)}};m([Ae({type:Boolean,reflect:!0})],v.prototype,"playing",2),m([Ae({type:Number,attribute:"frame-width"})],v.prototype,"frameWidth",2);var gt=280,Et=16,Me=16,_t=24,xt=16,St=2,vt=2,At=8,Tt=.1,Nt=.12,wt=.7,b=class extends v{constructor(){super(...arguments);this.unit=""}render(){let e=this.items.slice(0,ee),o=oe(e.map(l=>l.getAttribute("note")??"")),s=ie(o,this.width),r=Mt(e.map(l=>this.bar(l,s.labelWidth))),i=this.captions(s.groups),a=this.bands(r,i),u=re(r.map(l=>l.value),this.max===void 0?void 0:F(this.max));return this.reportOverflow([...r.flatMap(l=>this.overflowsOf(l,s.labelWidth)),...i.filter(l=>!l.text.fits).map(l=>({item:l.span.note,field:"caption",text:l.span.note,budget:l.span.width+2*E,size:l.text.size}))]),ht`<svg viewBox=${Q(a.height,this.width)} role="img" aria-label=${this.description(r,s.groups)} part="drawing"> ${s.dividers.map(l=>R`<line class="line muted dash" x1=${l} y1="0" x2=${l} y2=${a.height}></line>`)}
      ${r.map((l,c)=>this.drawBar(l,s,c,se(l.value,u,a.area),a))}
      ${s.groups.map(l=>R`<line class="line muted" x1=${l.x-E} y1=${a.baseline} x2=${l.x+l.width+E} y2=${a.baseline}></line>`)}
      ${i.map(l=>this.lines(l.text,"label",l.span.x+l.span.width/2,a.captionTop,d.label))}
    </svg>`}bar(e,o){let s=T(this,d.value.weight,"--rik-font-display"),r=T(this,d.note.weight),i=e.getAttribute("value"),a=e.getAttribute("tag")?.trim()||te(i,this.unit),u=e.getAttribute("label")??"",l=e.getAttribute("note")?.trim(),c=u||a;return{value:F(i),figure:ne(a,o,d.value.size,s),label:G(u,o,St,d.note.size,r),emphasis:e.hasAttribute("emphasis"),name:c,overflowName:l?`${l} \xB7 ${c}`:c,shown:a,labelText:u}}overflowsOf(e,o){let s=[];if(e.figure.fits||s.push({item:e.overflowName,field:"figure",text:e.shown,measured:e.figure.measured,budget:o,size:e.figure.size}),!e.label.fits){let r=T(this,d.note.weight)(e.label.size);s.push({item:e.overflowName,field:"label",text:e.labelText,measured:Math.max(0,...e.label.lines.map(r)),budget:o,size:e.label.size})}return s}captions(e){let o=T(this,d.label.weight);return e.filter(s=>s.note).map(s=>({span:s,text:G(s.note,s.width+2*E,vt,d.label.size,o)}))}bands(e,o){let s=this.height&&this.height>0?this.height:gt,r=Et+d.value.line+Me+s,i=Math.max(0,...e.map(g=>g.label.lines.length)),a=r+_t,u=i?a+i*d.note.line:r,l=Math.max(0,...o.map(g=>g.text.lines.length)),c=u+xt,h=l?c+l*d.label.line:u;return{area:s,baseline:r,labelTop:a,captionTop:c,height:h}}drawBar(e,o,s,r,i){let a=o.xs[s]??0,u=a+o.barWidth/2,l=i.baseline-r,c=Tt+s*Nt,h=l-Me-d.value.line;return R`
      <path class="${e.emphasis?"emphasis":"card"} grow" style="--t0:${c}s"
        d=${It(a,l,o.barWidth,r)}></path>
      <g class="fade" style="--t0:${c+wt}s">
        ${this.lines(e.figure,e.emphasis?"value figure lead":"value figure",u,h,d.value)}
      </g>
      ${this.lines(e.label,"label",u,i.labelTop,d.note)}`}lines(e,o,s,r,i){return e.lines.map((a,u)=>R`<text
        class=${o}
        x=${s}
        y=${r+u*i.line+e.size*J}
        text-anchor="middle"
        font-size=${e.size}
        font-weight=${i.weight}
      >${a}</text>`)}description(e,o){let s=r=>[r.name,r.figure.lines.join(" ")].filter(Boolean).join(" ");return o.map(r=>{let i=e.slice(r.first,r.first+r.count).map(s).join(", ");return r.note?`${r.note}: ${i}`:i}).join(". ")}};b.styles=[we,ft`.figure{fill:var(--deck-scene-value,var(--rik-text-default))}.figure.lead{fill:var(--deck-scene-value-emphasis,var(--rik-accent__text,var(--rik-accent)))}`],m([X({type:String})],b.prototype,"unit",2),m([X({type:String})],b.prototype,"max",2),m([X({type:Number})],b.prototype,"height",2),b=m([bt("deck-scene-bars")],b);function Mt(n){let t=Math.min(...n.map(e=>e.figure.size));return n.map(e=>({...e,figure:{...e.figure,size:t}}))}function It(n,t,e,o){let s=Math.min(At,o,e/2),r=t+o;return`M${n} ${r}V${t+s}Q${n} ${t} ${n+s} ${t}H${n+e-s}Q${n+e} ${t} ${n+e} ${t+s}V${r}Z`}export{b as DeckSceneBars};
