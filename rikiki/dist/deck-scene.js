var Se=Object.defineProperty;var xe=Object.getOwnPropertyDescriptor;var p=(t,e,n,r)=>{for(var s=r>1?void 0:r?xe(e,n):e,o=t.length-1,i;o>=0;o--)(i=t[o])&&(s=(r?i(e,n,s):i(s))||s);return r&&s&&Se(e,n,s),s};import{css as ot,html as z,svg as Ee}from"./vendor/lit.js";import{customElement as st,property as v}from"./vendor/lit.js";var ve='{"check":"M20 6 9 17l-5-5","cross":"M18 6 6 18M6 6l12 12","alert":"M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z","info":"M12 16v-4m0-4h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z","question":"M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3m.1 4h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z","ban":"M4.9 4.9l14.2 14.2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z","arrow":"M5 12h14m-6-6 6 6-6 6","arrow-down":"M12 5v14m6-6-6 6-6-6","clock":"M12 6v6l4 2m6-2a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z","calendar":"M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z","refresh":"M21 12a9 9 0 1 1-3-6.7M21 3v6h-6","trend":"M22 7 13.5 15.5l-5-5L2 17M16 7h6v6","user":"M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z","team":"M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Zm10 14v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8","target":"M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0-6a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 9a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z","flag":"M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1Zm0 0v7","lock":"M7 11V7a5 5 0 0 1 10 0v4M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z","search":"M21 21l-4.3-4.3M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z","code":"M16 18l6-6-6-6M8 6l-6 6 6 6","database":"M3 5c0 1.7 4 3 9 3s9-1.3 9-3-4-3-9-3-9 1.3-9 3Zm0 0v14c0 1.7 4 3 9 3s9-1.3 9-3V5M3 12c0 1.7 4 3 9 3s9-1.3 9-3","cloud":"M17.5 19a4.5 4.5 0 0 0 0-9h-1.3A7 7 0 1 0 4 16.9","document":"M14 2v6h6M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Zm-6 11h8m-8 4h8m-8-8h2","chart":"M3 3v18h18M7 16V9m5 7V5m5 11v-4","spark":"M12 2 15 9l7 3-7 3-3 7-3-7-7-3 7-3Z"}',q=Object.freeze(JSON.parse(ve)),mt=Object.keys(q);function N(t){return t?q[t.trim().toLowerCase()]??null:null}var A=Object.freeze({label:{size:31,weight:650,line:38},note:{size:25,weight:400,line:34},tag:{size:23,weight:600,line:30},value:{size:56,weight:750,line:64}});var f=4;var D=620;var T=Object.freeze({cards:{min:2,max:5},steps:{min:1,max:6},bars:{min:2,max:8},matrix:{min:1,max:6},ranges:{min:1,max:8},lanes:{min:2,max:5},units:{min:1,max:3}});var $=96,w=32,Ne=3,Ae=2,Te=Object.freeze({cards:469,flow:469,bars:469,ranges:469,units:469,steps:650,matrix:1e3,lanes:1e3}),we=469;function Z(t){return Te[t.replace(/^deck-scene-/,"")]??we}var G=["row","stack"],I=["arrow","vs","equals","plus"],J=Object.freeze({vs:"vs",equals:"=",plus:"+"});function _(t,e){let n=Array.from({length:Math.max(1,e)},()=>1);if(t==null||!t.trim())return{shares:n,valid:!0};let r=t.split(":").map(o=>Number(o.trim()));return r.length===e&&r.every(o=>Number.isFinite(o)&&o>0)?{shares:r,valid:!0}:{shares:n,valid:!1}}function M(t,e=1600,n=$){let r=t.length,s=e-(r-1)*n,o=t.reduce((c,g)=>c+g,0),i=t.map(c=>s*c/o),a=i.map(c=>c+2*f),l=n-2*f,m=[],u=0;return a.forEach((c,g)=>{u+=c,g<r-1&&m.push(u+l/2),u+=l}),{widths:i,tracks:a,gap:l,gutterCentres:m}}function P(t){return G.includes(t??"")?t:"row"}function Q(t,e){let n=[],r=(l,m,u,c)=>{u.length&&n.push({code:l,severity:m,items:u,message:c})},s=P(t.layout),o=t.regions.length,i=s==="row"?Ne:Ae,a=s==="stack"&&t.band?1:2;if(r("SCENE_LAYOUT_INVALID","error",t.layout!==null&&!G.includes(t.layout)?[`layout="${t.layout}"`]:[],`\`layout\` is one of ${G.join(", ")} \xB7 a row is drawn instead`),r("SCENE_LAYOUT_INVALID","error",t.link!==null&&!I.includes(t.link)?[`link="${t.link}"`]:[],`\`link\` is one of ${I.join(", ")} \xB7 no link is drawn`),r("SCENE_LAYOUT_INVALID","error",o>0&&!_(t.split,o).valid?[`split="${t.split}"`]:[],`\`split\` is one positive number per region, joined by ":" (${o} here) \xB7 equal shares are drawn instead`),r("SCENE_LAYOUT_INVALID","error",o<a?[`${o} region${o===1?"":"s"}`]:[],s==="stack"&&!t.band?"a stack puts a scene above another, or above a `deck-scene-band` \xB7 one scene alone needs no composition":"a composition puts at least two scenes side by side \xB7 one scene needs no composition"),r("SCENE_ITEMS_DROPPED","error",o>i?t.regions.slice(i):[],`a ${s} composes at most ${i} scenes \xB7 these are not given a place`),r("SCENE_LAYOUT_INVALID","error",t.strays,"only scenes and one `deck-scene-band` go in a composition \xB7 this child is not drawn"),s==="row"&&o>=2&&o<=i){let l=_(t.split,o),{widths:m}=M(l.shares),u=t.regions.filter((c,g)=>m[g]<Z(c));r("SCENE_REGION_TOO_NARROW","error",u.map(c=>`${c} (needs ${Z(c)})`),"a scene gets less width than it draws cleanly at \xB7 below it the scene can draw wrong without saying so \xB7 give it more with `split`, put it in a stack, or use fewer scenes")}return r("SCENE_EMPHASIS_SCATTERED","warning",e.length>1?e:[],"more than one region puts something forward \xB7 the composition argues for one, and two are none"),n}function ee(t,e,n){let r=t==="row"?Math.max(0,...e):e.reduce((s,o)=>s+o,0)+w*Math.max(0,e.length-1);return n>0?r+w+n:r}import{LitElement as et,css as tt}from"./vendor/lit.js";import{property as ge}from"./vendor/lit.js";var Et=T.bars.max;var Ie=48;var Me=16,_t=(Ie-Me)/2;function S(t){let e=(t??"").replace(/\s/g,"").replace(",",".");if(!e)return null;let n=Number(e);return Number.isFinite(n)?n:null}var y=4,C=2,U=Object.freeze({sources:.3,hub:.22,outcomes:.26}),At=(1-U.sources-U.hub-U.outcomes)/2;function te(t,e){let n=t.findIndex(e),r=n>=0?n:t.length-1;return{sources:t.slice(0,Math.max(0,r)).slice(0,y),hub:t[r],outcomes:t.slice(r+1,r+1+C)}}var H=8,ne=3;var ye=10,Ce=6,It=2*ye+Ce;function re(t,e){if(t==null||t.trim()==="")return{value:e,valid:!0};let n=Number(t),r=Number.isInteger(n)&&n>=0&&n<=H;return{value:r?n:e,valid:r}}var W=400,oe=100,K=12,Le=44,ke=340,F=.25,Oe=2.2,L=40;function k(t,e,n,r){if(t==null||t.trim()==="")return{value:e,valid:!0};let s=Number(t),o=Number.isInteger(s)&&s>=n&&s<=r;return{value:o?s:e,valid:o}}var Re=48;function se(t,e=1600){let n=Math.max(1,t);return(e-Re*(n-1))/n}function ie(t){return Math.min(L,Math.max(1,Math.ceil(Math.sqrt(t*Oe))))}function De(t,e,n,r=ke){let s=Math.ceil(t/e),o=Math.ceil(t/s),i=Math.min(Le,n/(o+(o-1)*F),r/(s+(s-1)*F)),a=i*F;return{columns:o,rows:s,cell:i,gap:a,width:o*i+(o-1)*a,height:s*i+(s-1)*a}}function ae(t,e,n){return De(t,e,n).cell>=K}var V=["prod","pilot","test","announced","none"];var Lt=Object.freeze({prod:"in production",pilot:"pilot",test:"in test",announced:"announced",none:"nothing yet"});var Ge=t=>(t??"").split("|").map(e=>e.trim()).filter(Boolean);function le(t){return Ge(t).slice(0,12)}function x(t){if(t===null||t.trim()==="")return null;let e=Number(t);return Number.isFinite(e)?e:null}var $e=["cards","steps","flow","bars","matrix","ranges","lanes","units"];function X(t){let e=t.toLowerCase().replace(/^deck-scene-/,"");return $e.includes(e)?e:null}var Pe=["label","note","icon","tag","value","level","from","to","emphasis"],Ue=Object.freeze({cards:["label","note","icon","tag","emphasis"],steps:["label","note","tag","emphasis"],flow:["label","note","icon","tag","emphasis"],bars:["label","note","tag","value","emphasis"],matrix:["label","level","emphasis"],ranges:["label","note","tag","from","to"],lanes:["label","note","icon","tag"],units:["label","note","icon","value","emphasis"]});function de(t,e,n){if(!e.length)return null;let r=e.map(o=>`${o.item} \xB7 ${o.field}`),s=e.filter(o=>o.measured!==void 0&&o.budget!==void 0).map(o=>`${o.item} \xB7 ${o.field} needs ${Math.round(o.measured??0)} of ${Math.round(o.budget??0)} units`);return{code:"SCENE_TEXT_TOO_LONG",severity:"error",items:r,fields:e,...n?{scene:{kind:t,...n}}:{},message:`a ${t} scene could not fit ${r.join(", ")} even one size down \xB7 drawn anyway, past its box${s.length?` (${s.join("; ")})`:""}`}}var ce=2,He=y+1+C,ue=4,Fe=/(?<=[.!?…])\s+(?=\p{Lu})/u,O=(t,e)=>t.label?.trim()||`item ${e+1}`,pe=t=>t.trim().split(/\s+/).filter(Boolean);function R(t,e,n){return e<=D?null:{code:"SCENE_TOO_TALL",severity:"error",items:[`${n} ${n===1?"item":"items"}, ${Math.round(e)} units tall`],message:`a slide leaves room for about ${D} units and this ${t} scene is taller \xB7 the slide clips it \xB7 fewer items, or split the slide`}}function he(t,e,n={}){let r=[],s=(i,a,l,m)=>{l.length&&r.push({code:i,severity:a,items:l,message:m})},o=i=>e.flatMap((a,l)=>i(a,l)?[O(a,l)]:[]);return Be(t,e,s),s("SCENE_ITEM_NO_LABEL","error",o(i=>!i.label?.trim()),"an item has no label \xB7 the scene would draw it as an empty box"),s("SCENE_ATTRIBUTE_IGNORED","warning",e.flatMap((i,a)=>We(t,i).map(l=>`${O(i,a)} \xB7 ${l}`)),`a ${t} scene does not read this attribute \xB7 it is dropped, and the picture does not change`),s("SCENE_ICON_UNKNOWN","error",o(i=>!!i.icon&&!N(i.icon)),"the icon is not in the 24-glyph set \xB7 it draws nothing, silently"),t==="bars"&&(s("SCENE_VALUE_INVALID","error",o(i=>S(i.value)===null),"`value` is missing or is not a number \xB7 the bar is drawn flat"),Xe(e,n,s,o)),t==="ranges"&&(s("SCENE_VALUE_INVALID","error",o(qe),je),Ye(n,s,o)),t==="matrix"&&Qe(n,s,o),t==="lanes"&&Ze(n,s),t==="units"&&Je(e,n,s,o),s("SCENE_EMPHASIS_MANY","warning",t==="bars"?Ve(e):fe(e),"more than one item is emphasised \xB7 the scene puts one forward, and two are none"),s("SCENE_LABEL_LONG","warning",o(i=>pe(i.label??"").length>ue),`a label past ${ue} words reads as a sentence \xB7 one to three words, the detail goes in the note`),s("SCENE_NOTE_LONG","warning",o(i=>(i.note??"").trim().split(Fe).length>1),"a note of more than one sentence \xB7 the scene is read from the back of the room, one sentence each"),r}function We(t,e){let n=Ue[t];return Pe.filter(r=>(r==="emphasis"?e.emphasis:e[r]!==null)&&!n.includes(r))}var Ke=t=>t.flatMap((e,n)=>e.emphasis?[O(e,n)]:[]),fe=t=>{let e=Ke(t);return e.length>1?e:[]};function Ve(t){let e=[];for(let n of t){let r=e.at(-1);r&&(r[0].note??"")===(n.note??"")?r.push(n):e.push([n])}return e.flatMap(fe)}function Be(t,e,n){let r=i=>O(i,e.indexOf(i));if(t==="flow"){let i=te(e,l=>l.emphasis),a=new Set([...i.sources,i.hub,...i.outcomes]);n("SCENE_ITEMS_DROPPED","error",e.filter(l=>!a.has(l)).map(r),`a flow draws ${y} sources before the hub and ${C} outcomes after it at most \xB7 these are not drawn`),e.length<ce&&me(n,e.length,ce,He);return}let{min:s,max:o}=T[t];n("SCENE_ITEMS_DROPPED","error",e.slice(o).map(r),`a ${t} scene draws at most ${o} items \xB7 these are not drawn`),e.length<s&&me(n,e.length,s,o)}function me(t,e,n,r){t("SCENE_TOO_FEW_ITEMS","error",[`${e} item${e===1?"":"s"}`],`the scene is built for ${n} to ${r} items \xB7 with ${e} it has nothing to compare`)}function B(t,e){if(!t?.trim())return null;let n=e(t);return n!==null&&n>0?n:!1}function Xe(t,e,n,r){let s=B(e.max,S),o=B(e.height,S);n("SCENE_ATTRIBUTE_INVALID","error",[...s===!1?["max"]:[],...o===!1?["height"]:[]],"`max` and `height` must be positive numbers \xB7 the scene drew its default instead"),typeof s=="number"&&n("SCENE_VALUE_CLIPPED","error",r(i=>{let a=S(i.value);return a!==null&&(a>s||a<0)}),`a value is past the scale (0 to ${s}) \xB7 its bar stops at the edge, so it is not the size it says \xB7 raise \`max\``),n("SCENE_GROUP_SPLIT","warning",ze(t),"a note comes back after another \xB7 only neighbours with the same note share a group, so these are drawn as separate groups \xB7 keep the items of a group together")}function ze(t){let e=new Set,n=new Set,r=null;for(let s of t){let o=(s.note??"").trim();o&&o!==r&&e.has(o)&&n.add(o),o&&e.add(o),r=o}return[...n]}function Ye(t,e,n){let r=B(t.scale,o=>x(o));if(e("SCENE_ATTRIBUTE_INVALID","error",r===!1?["scale"]:[],"`scale` must be a positive number \xB7 the scene fitted the scale to the rows instead"),typeof r!="number")return;let s=o=>{let i=x(o);return i!==null&&(i>r||i<0)};e("SCENE_VALUE_CLIPPED","error",n(o=>s(o.from)||s(o.to)),`a bound is past the scale (0 to ${r}) \xB7 the bar stops at the edge, so it is not the length it says \xB7 raise \`scale\``)}var je="`from` and `to` must be numbers when written, with `from` first \xB7 otherwise the bar lands where the scene guessed";function qe(t){let e=x(t.from),n=x(t.to),r=!!t.from?.trim(),s=!!t.to?.trim();return r&&e===null||s&&n===null?!0:e!==null&&n!==null&&e>n}function Ze(t,e){let n=["passed","blocked"].filter(r=>!re(t[r],ne).valid);e("SCENE_VALUE_INVALID","error",n,`these must be whole numbers from 0 to ${H} \xB7 the scene drew its default instead`)}function Je(t,e,n,r){let s=k(e.total,oe,1,W),o=k(e.columns,ie(s.value),1,L),i=[...s.valid?[]:["total"],...o.valid?[]:["columns"]];n("SCENE_VALUE_INVALID","error",i,`\`total\` is a whole number from 1 to ${W} and \`columns\` from 1 to ${L} \xB7 the scene drew its default instead`),n("SCENE_VALUE_INVALID","error",r(a=>!k(a.value,0,0,s.value).valid||!a.value?.trim()),`\`value\` is how many cells are lit, a whole number from 0 to ${s.value} \xB7 missing or out of range, the grid is drawn empty or full`),n("SCENE_GRID_TOO_DENSE","error",o.valid&&!ae(s.value,o.value,se(t.length,e.width))?[`${s.value} cells in ${o.value} columns`]:[],`the cells are under ${K} units wide at this size \xB7 fewer cells, fewer columns would not help, fewer panels would`)}function Qe(t,e,n){let r=le(t.columns??void 0).length,s=i=>pe(i.level??""),o=new Set(V);e("SCENE_LEVEL_INVALID","error",n(i=>{let a=s(i);return r>0&&a.length!==r||a.some(m=>!o.has(m))}),`\`level\` needs one status per column${r?` (${r})`:""}, each one of ${V.join(", ")} \xB7 a missing or unknown one is drawn as "none"`)}var nt=200;var be=tt`:host{display:block;inline-size:100%}svg{display:block;inline-size:100%;block-size:auto;overflow:visible}text{font-family:var(--rik-font-sans);fill:var(--rik-text-default)}.note{fill:var(--deck-scene-muted,var(--rik-text-default--muted))}.tag{/* The strong accent,not the text accent · a tag sits on a card (paper-100),and the text accent measures 2.8:1 there,under the 3:1 large text needs. \`check\` (SVG_TEXT_CONTRAST_LOW) found it on the default theme. */
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
`;function rt(t){let e=n=>t.getAttribute(n);return{label:e("label"),note:e("note"),icon:e("icon"),tag:e("tag"),value:e("value"),level:e("level"),from:e("from"),to:e("to"),emphasis:t.hasAttribute("emphasis")}}var b=class extends et{constructor(){super(...arguments);this.playing=!1;this.warnedIssues="";this.linted=[];this.overflows=[];this.onFontsLoaded=()=>{this.requestUpdate()}}get width(){let n=this.frameWidth;return n!==void 0&&Number.isFinite(n)&&n>=nt?n:1600}get items(){return[...this.querySelectorAll(":scope > deck-scene-item")]}connectedCallback(){super.connectedCallback(),this.onShownSlide()?this.applyStep(0):this.playing=!1,document.fonts?.ready.then(()=>this.requestUpdate()),document.fonts?.addEventListener("loadingdone",this.onFontsLoaded),this.observer=new MutationObserver(n=>{n.some(r=>r.type==="childList"||r.target!==this)&&this.requestUpdate()}),this.observer.observe(this,{attributes:!0,childList:!0,subtree:!0})}disconnectedCallback(){super.disconnectedCallback(),this.observer?.disconnect(),document.fonts?.removeEventListener("loadingdone",this.onFontsLoaded)}onShownSlide(){let n=this.closest("deck-root");return!n||n.hasAttribute("data-overview-snapshot")||n.hasAttribute("preview")?!1:!!this.closest("deck-root > [active]")}applyStep(n){n===0&&(this.playing=!1,requestAnimationFrame(()=>{this.playing=!0}))}willUpdate(){let n=X(this.localName);this.linted=n?he(n,this.items.map(rt),{columns:this.getAttribute("columns"),passed:this.getAttribute("passed"),blocked:this.getAttribute("blocked"),total:this.getAttribute("total"),max:this.getAttribute("max"),height:this.getAttribute("height"),scale:this.getAttribute("scale"),width:this.width}):[]}updated(){let n=X(this.localName),r=this.renderRoot.querySelector("svg")?.getAttribute("viewBox"),s=Number(r?.split(" ")[3])-2*f,o=n&&s>0&&this.frameWidth===void 0?R(n,s,this.items.length):null,i=de(n??this.localName.replace(/^deck-scene-/,""),this.overflows,{width:this.width,count:this.items.length});this.reportIssues([...this.linted,...this.extraIssues(),...i?[i]:[],...o?[o]:[]])}extraIssues(){return[]}reportIssues(n){let r=n.length?JSON.stringify(n):"";if(r!==(this.getAttribute("data-scene-issues")??"")&&(r?this.setAttribute("data-scene-issues",r):this.removeAttribute("data-scene-issues")),r&&r!==this.warnedIssues)for(let s of n)console.warn(`<${this.localName}> \xB7 ${s.message}: ${s.items.join(", ")}`);this.warnedIssues=r}reportOverflow(n){this.overflows=n.map(r=>typeof r=="string"?{item:r,field:"text"}:r)}};p([ge({type:Boolean,reflect:!0})],b.prototype,"playing",2),p([ge({type:Number,attribute:"frame-width"})],b.prototype,"frameWidth",2);var it="deck-scene-band",Y=64,j=48,at=.45,lt=["start","center","end","stretch"],_e=1600+2*f,ct=t=>t.localName.startsWith("deck-scene-")&&t.localName!=="deck-scene-item",E=t=>`${(t/_e*100).toFixed(5)}cqw`,h=class extends b{get parts(){return[...this.children].map(e=>({element:e,role:e.localName===it?"band":ct(e)?"region":"stray"}))}get regions(){return this.parts.filter(e=>e.role==="region").map(e=>e.element)}get layoutKind(){return P(this.layout??null)}frameWidths(){let e=this.regions.length;return this.layoutKind==="stack"?this.regions.map(()=>1600):M(_(this.split??null,e).shares).widths}willUpdate(){let e=this.frameWidths();this.regions.forEach((r,s)=>{r.frameWidth=e[s]});let n=this.parts.find(r=>r.role==="band")?.element;n&&(n.frameWidth=1600)}render(){let e=this.layoutKind,n=this.parts,r=this.regions.length,s=_(this.split??null,r).shares,o=M(s),i=this.stagger!==void 0&&this.stagger>=0?this.stagger:at,a=I.includes(this.link??"")?this.link:null,l=lt.includes(this.align??"")?this.align:"center",m=e==="row"&&r>=2?o.tracks.map(c=>E(c)).join(" "):E(_e),u=this.placement(n,e,i,r);return z`<div class="stage"> <div class="grid" style="grid-template-columns:${m};column-gap:${E(o.gap)};row-gap:${E(w)};align-items:${l}" > <style>${u}</style> ${e==="row"&&a&&r>=2?this.links(o,a,r):""} <slot></slot> </div> </div>`}placement(e,n,r,s){let o=[],i=0;return e.forEach((a,l)=>{let u=`::slotted(:nth-child(${l+1}))`;if(a.role==="stray")o.push(`${u}{display:none}`);else if(a.role==="band"){let c=n==="row"?2:s+1;o.push(`${u}{grid-column:1/-1;grid-row:${c};--scene-delay:${(s*r).toFixed(2)}s}`)}else{let c=n==="row"?i+1:1,g=n==="row"?1:i+1;o.push(`${u}{grid-column:${c};grid-row:${g};--scene-delay:${(i*r).toFixed(2)}s}`),i+=1}}),o.join("")}links(e,n,r){return z`<div class="links" aria-hidden="true"> ${e.gutterCentres.slice(0,r-1).map(s=>{let o=$-2*f,i=s-o/2;return z`<div class="link" style="left:${E(i)};width:${E(o)}">
          <svg viewBox="0 0 ${o} ${Y}" part="link">${this.mark(n,o)}</svg>
        </div>`})}
    </div>`}mark(e,n){if(e==="arrow"){let r=N("arrow"),s=j/24;return Ee`<g transform="translate(${(n-j)/2} ${(Y-j)/2}) scale(${s})">
        <path class="icon" d=${r??""}></path>
      </g>`}return Ee`<text x=${n/2} y=${Y/2+A.label.size*.36}
      text-anchor="middle" font-size=${A.label.size} font-weight=${A.label.weight}>${J[e]}</text>`}updated(){let e=this.parts,n=this.regions,r=e.map(s=>s.element);Promise.all(r.map(s=>s.updateComplete)).then(()=>{let s=Q({layout:this.getAttribute("layout"),link:this.getAttribute("link"),split:this.getAttribute("split"),regions:n.map(i=>i.localName),strays:e.filter(i=>i.role==="stray").map(i=>i.element.localName),band:e.some(i=>i.role==="band")},n.filter(i=>i.querySelector(":scope > deck-scene-item[emphasis]")).map(i=>i.localName)),o=this.tallness(n,e);this.reportIssues(o?[...s,o]:s)})}drawnHeight(e){let n=e.shadowRoot?.querySelector("svg")?.getAttribute("viewBox"),r=Number(n?.split(" ")[3])-2*f;return Number.isFinite(r)&&r>0?r:0}tallness(e,n){let r=n.find(o=>o.role==="band")?.element,s=ee(this.layoutKind,e.map(o=>this.drawnHeight(o)),r?this.drawnHeight(r):0);return s>0?R("composition",s,e.length):null}};h.styles=[be,ot`:host{display:block}.stage{container-type:inline-size;inline-size:100%}.grid{display:grid;position:relative;align-items:center}.links{grid-row:1;grid-column:1 / -1;position:relative;pointer-events:none}.link{position:absolute;top:50%;transform:translateY(-50%)}.link svg{inline-size:100%}.link .icon{stroke:var(--deck-scene-line,var(--rik-text-default--muted))}.link text{fill:var(--deck-scene-line,var(--rik-text-default--muted))}`],p([v({type:String})],h.prototype,"layout",2),p([v({type:String})],h.prototype,"split",2),p([v({type:String})],h.prototype,"link",2),p([v({type:String})],h.prototype,"align",2),p([v({type:Number})],h.prototype,"stagger",2),h=p([st("deck-scene")],h);export{h as DeckScene};
