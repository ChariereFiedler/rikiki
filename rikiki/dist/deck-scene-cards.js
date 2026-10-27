var Ae=Object.defineProperty;var Te=Object.getOwnPropertyDescriptor;var u=(n,e,t,r)=>{for(var o=r>1?void 0:r?Te(e,t):e,s=n.length-1,i;s>=0;s--)(i=n[s])&&(o=(r?i(e,t,o):i(o))||o);return r&&o&&Ae(e,t,o),o};import{html as it,svg as X}from"./vendor/lit.js";import{customElement as at}from"./vendor/lit.js";var ve='{"check":"M20 6 9 17l-5-5","cross":"M18 6 6 18M6 6l12 12","alert":"M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z","info":"M12 16v-4m0-4h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z","question":"M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3m.1 4h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z","ban":"M4.9 4.9l14.2 14.2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z","arrow":"M5 12h14m-6-6 6 6-6 6","arrow-down":"M12 5v14m6-6-6 6-6-6","clock":"M12 6v6l4 2m6-2a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z","calendar":"M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z","refresh":"M21 12a9 9 0 1 1-3-6.7M21 3v6h-6","trend":"M22 7 13.5 15.5l-5-5L2 17M16 7h6v6","user":"M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z","team":"M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Zm10 14v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8","target":"M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0-6a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 9a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z","flag":"M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1Zm0 0v7","lock":"M7 11V7a5 5 0 0 1 10 0v4M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z","search":"M21 21l-4.3-4.3M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z","code":"M16 18l6-6-6-6M8 6l-6 6 6 6","database":"M3 5c0 1.7 4 3 9 3s9-1.3 9-3-4-3-9-3-9 1.3-9 3Zm0 0v14c0 1.7 4 3 9 3s9-1.3 9-3V5M3 12c0 1.7 4 3 9 3s9-1.3 9-3","cloud":"M17.5 19a4.5 4.5 0 0 0 0-9h-1.3A7 7 0 1 0 4 16.9","document":"M14 2v6h6M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Zm-6 11h8m-8 4h8m-8-8h2","chart":"M3 3v18h18M7 16V9m5 7V5m5 11v-4","spark":"M12 2 15 9l7 3-7 3-3 7-3-7-7-3 7-3Z"}',z=Object.freeze(JSON.parse(ve)),bt=Object.keys(z);function w(n){return n?z[n.trim().toLowerCase()]??null:null}import{LitElement as Ne,css as Ie}from"./vendor/lit.js";import{property as h}from"./vendor/lit.js";var d=class extends Ne{constructor(){super(...arguments);this.emphasis=!1}static{this.styles=Ie`:host{display:none}`}render(){return null}};u([h({type:String})],d.prototype,"label",2),u([h({type:String})],d.prototype,"note",2),u([h({type:String})],d.prototype,"icon",2),u([h({type:String})],d.prototype,"tag",2),u([h({type:String})],d.prototype,"value",2),u([h({type:String})],d.prototype,"level",2),u([h({type:String})],d.prototype,"from",2),u([h({type:String})],d.prototype,"to",2),u([h({type:Boolean,reflect:!0})],d.prototype,"emphasis",2);customElements.get("deck-scene-item")||customElements.define("deck-scene-item",d);import{LitElement as et,css as tt}from"./vendor/lit.js";import{property as fe}from"./vendor/lit.js";var m=Object.freeze({label:{size:31,weight:650,line:38},note:{size:25,weight:400,line:34},tag:{size:23,weight:600,line:30},value:{size:56,weight:750,line:64}}),Y=.8,g=4;function Z(n,e=1600){return`${-g} ${-g} ${e+2*g} ${n+2*g}`}var $=620;var q=.88,f=28,M=32,E=Object.freeze({cards:{min:2,max:5},steps:{min:1,max:6},bars:{min:2,max:8},matrix:{min:1,max:6},ranges:{min:1,max:8},lanes:{min:2,max:5},units:{min:1,max:3}});function j(n,e,t,r){let o=n.trim().split(/[ \t\n\r]+/).filter(Boolean),s=[],i="",a=!0;for(let l of o){let p=i?`${i} ${l}`:l;if(t(p)<=e){i=p;continue}i&&s.push(i),i=l,t(l)>e&&(a=!1)}return i&&s.push(i),{lines:s,fits:a&&s.length<=r}}function C(n,e,t,r,o){let s=j(n,e,o(r),t);if(s.fits)return{...s,size:r};let i=Math.round(r*q);return{...j(n,e,o(i),t),size:i}}function J(n,e=M,t=1600){let r=Math.max(1,n),o=(t-e*(r-1))/r;return{width:o,xs:Array.from({length:r},(s,i)=>i*(o+e))}}var vt=E.bars.max;var we=48;var Me=16,Nt=(we-Me)/2;function A(n){let e=(n??"").replace(/\s/g,"").replace(",",".");if(!e)return null;let t=Number(e);return Number.isFinite(t)?t:null}var L=4,R=2,P=Object.freeze({sources:.3,hub:.22,outcomes:.26}),Mt=(1-P.sources-P.hub-P.outcomes)/2;function Q(n,e){let t=n.findIndex(e),r=t>=0?t:n.length-1;return{sources:n.slice(0,Math.max(0,r)).slice(0,L),hub:n[r],outcomes:n.slice(r+1,r+1+R)}}var F=8,ee=3;var Ce=10,Le=6,Rt=2*Ce+Le;function te(n,e){if(n==null||n.trim()==="")return{value:e,valid:!0};let t=Number(n),r=Number.isInteger(t)&&t>=0&&t<=F;return{value:r?t:e,valid:r}}var H=400,ne=100,B=12,Re=44,ye=340,U=.25,Oe=2.2,y=40;function O(n,e,t,r){if(n==null||n.trim()==="")return{value:e,valid:!0};let o=Number(n),s=Number.isInteger(o)&&o>=t&&o<=r;return{value:s?o:e,valid:s}}var ke=48;function re(n,e=1600){let t=Math.max(1,n);return(e-ke*(t-1))/t}function oe(n){return Math.min(y,Math.max(1,Math.ceil(Math.sqrt(n*Oe))))}function De(n,e,t,r=ye){let o=Math.ceil(n/e),s=Math.ceil(n/o),i=Math.min(Re,t/(s+(s-1)*U),r/(o+(o-1)*U)),a=i*U;return{columns:s,rows:o,cell:i,gap:a,width:s*i+(s-1)*a,height:o*i+(o-1)*a}}function se(n,e,t){return De(n,e,t).cell>=B}var W=["prod","pilot","test","announced","none"];var Dt=Object.freeze({prod:"in production",pilot:"pilot",test:"in test",announced:"announced",none:"nothing yet"});var Ge=n=>(n??"").split("|").map(e=>e.trim()).filter(Boolean);function ie(n){return Ge(n).slice(0,12)}function T(n){if(n===null||n.trim()==="")return null;let e=Number(n);return Number.isFinite(e)?e:null}var $e=["cards","steps","flow","bars","matrix","ranges","lanes","units"];function K(n){let e=n.toLowerCase().replace(/^deck-scene-/,"");return $e.includes(e)?e:null}var Pe=["label","note","icon","tag","value","level","from","to","emphasis"],Fe=Object.freeze({cards:["label","note","icon","tag","emphasis"],steps:["label","note","tag","emphasis"],flow:["label","note","icon","tag","emphasis"],bars:["label","note","tag","value","emphasis"],matrix:["label","level","emphasis"],ranges:["label","note","tag","from","to"],lanes:["label","note","icon","tag"],units:["label","note","icon","value","emphasis"]});function ue(n,e,t){if(!e.length)return null;let r=e.map(s=>`${s.item} \xB7 ${s.field}`),o=e.filter(s=>s.measured!==void 0&&s.budget!==void 0).map(s=>`${s.item} \xB7 ${s.field} needs ${Math.round(s.measured??0)} of ${Math.round(s.budget??0)} units`);return{code:"SCENE_TEXT_TOO_LONG",severity:"error",items:r,fields:e,...t?{scene:{kind:n,...t}}:{},message:`a ${n} scene could not fit ${r.join(", ")} even one size down \xB7 drawn anyway, past its box${o.length?` (${o.join("; ")})`:""}`}}var ae=2,Ue=L+1+R,le=4,He=/(?<=[.!?…])\s+(?=\p{Lu})/u,k=(n,e)=>n.label?.trim()||`item ${e+1}`,me=n=>n.trim().split(/\s+/).filter(Boolean);function de(n,e,t){return e<=$?null:{code:"SCENE_TOO_TALL",severity:"error",items:[`${t} ${t===1?"item":"items"}, ${Math.round(e)} units tall`],message:`a slide leaves room for about ${$} units and this ${n} scene is taller \xB7 the slide clips it \xB7 fewer items, or split the slide`}}function pe(n,e,t={}){let r=[],o=(i,a,l,p)=>{l.length&&r.push({code:i,severity:a,items:l,message:p})},s=i=>e.flatMap((a,l)=>i(a,l)?[k(a,l)]:[]);return Ke(n,e,o),o("SCENE_ITEM_NO_LABEL","error",s(i=>!i.label?.trim()),"an item has no label \xB7 the scene would draw it as an empty box"),o("SCENE_ATTRIBUTE_IGNORED","warning",e.flatMap((i,a)=>Be(n,i).map(l=>`${k(i,a)} \xB7 ${l}`)),`a ${n} scene does not read this attribute \xB7 it is dropped, and the picture does not change`),o("SCENE_ICON_UNKNOWN","error",s(i=>!!i.icon&&!w(i.icon)),"the icon is not in the 24-glyph set \xB7 it draws nothing, silently"),n==="bars"&&(o("SCENE_VALUE_INVALID","error",s(i=>A(i.value)===null),"`value` is missing or is not a number \xB7 the bar is drawn flat"),Xe(e,t,o,s)),n==="ranges"&&(o("SCENE_VALUE_INVALID","error",s(Ze),Ye),je(t,o,s)),n==="matrix"&&Qe(t,o,s),n==="lanes"&&qe(t,o),n==="units"&&Je(e,t,o,s),o("SCENE_EMPHASIS_MANY","warning",n==="bars"?Ve(e):he(e),"more than one item is emphasised \xB7 the scene puts one forward, and two are none"),o("SCENE_LABEL_LONG","warning",s(i=>me(i.label??"").length>le),`a label past ${le} words reads as a sentence \xB7 one to three words, the detail goes in the note`),o("SCENE_NOTE_LONG","warning",s(i=>(i.note??"").trim().split(He).length>1),"a note of more than one sentence \xB7 the scene is read from the back of the room, one sentence each"),r}function Be(n,e){let t=Fe[n];return Pe.filter(r=>(r==="emphasis"?e.emphasis:e[r]!==null)&&!t.includes(r))}var We=n=>n.flatMap((e,t)=>e.emphasis?[k(e,t)]:[]),he=n=>{let e=We(n);return e.length>1?e:[]};function Ve(n){let e=[];for(let t of n){let r=e.at(-1);r&&(r[0].note??"")===(t.note??"")?r.push(t):e.push([t])}return e.flatMap(he)}function Ke(n,e,t){let r=i=>k(i,e.indexOf(i));if(n==="flow"){let i=Q(e,l=>l.emphasis),a=new Set([...i.sources,i.hub,...i.outcomes]);t("SCENE_ITEMS_DROPPED","error",e.filter(l=>!a.has(l)).map(r),`a flow draws ${L} sources before the hub and ${R} outcomes after it at most \xB7 these are not drawn`),e.length<ae&&ce(t,e.length,ae,Ue);return}let{min:o,max:s}=E[n];t("SCENE_ITEMS_DROPPED","error",e.slice(s).map(r),`a ${n} scene draws at most ${s} items \xB7 these are not drawn`),e.length<o&&ce(t,e.length,o,s)}function ce(n,e,t,r){n("SCENE_TOO_FEW_ITEMS","error",[`${e} item${e===1?"":"s"}`],`the scene is built for ${t} to ${r} items \xB7 with ${e} it has nothing to compare`)}function V(n,e){if(!n?.trim())return null;let t=e(n);return t!==null&&t>0?t:!1}function Xe(n,e,t,r){let o=V(e.max,A),s=V(e.height,A);t("SCENE_ATTRIBUTE_INVALID","error",[...o===!1?["max"]:[],...s===!1?["height"]:[]],"`max` and `height` must be positive numbers \xB7 the scene drew its default instead"),typeof o=="number"&&t("SCENE_VALUE_CLIPPED","error",r(i=>{let a=A(i.value);return a!==null&&(a>o||a<0)}),`a value is past the scale (0 to ${o}) \xB7 its bar stops at the edge, so it is not the size it says \xB7 raise \`max\``),t("SCENE_GROUP_SPLIT","warning",ze(n),"a note comes back after another \xB7 only neighbours with the same note share a group, so these are drawn as separate groups \xB7 keep the items of a group together")}function ze(n){let e=new Set,t=new Set,r=null;for(let o of n){let s=(o.note??"").trim();s&&s!==r&&e.has(s)&&t.add(s),s&&e.add(s),r=s}return[...t]}function je(n,e,t){let r=V(n.scale,s=>T(s));if(e("SCENE_ATTRIBUTE_INVALID","error",r===!1?["scale"]:[],"`scale` must be a positive number \xB7 the scene fitted the scale to the rows instead"),typeof r!="number")return;let o=s=>{let i=T(s);return i!==null&&(i>r||i<0)};e("SCENE_VALUE_CLIPPED","error",t(s=>o(s.from)||o(s.to)),`a bound is past the scale (0 to ${r}) \xB7 the bar stops at the edge, so it is not the length it says \xB7 raise \`scale\``)}var Ye="`from` and `to` must be numbers when written, with `from` first \xB7 otherwise the bar lands where the scene guessed";function Ze(n){let e=T(n.from),t=T(n.to),r=!!n.from?.trim(),o=!!n.to?.trim();return r&&e===null||o&&t===null?!0:e!==null&&t!==null&&e>t}function qe(n,e){let t=["passed","blocked"].filter(r=>!te(n[r],ee).valid);e("SCENE_VALUE_INVALID","error",t,`these must be whole numbers from 0 to ${F} \xB7 the scene drew its default instead`)}function Je(n,e,t,r){let o=O(e.total,ne,1,H),s=O(e.columns,oe(o.value),1,y),i=[...o.valid?[]:["total"],...s.valid?[]:["columns"]];t("SCENE_VALUE_INVALID","error",i,`\`total\` is a whole number from 1 to ${H} and \`columns\` from 1 to ${y} \xB7 the scene drew its default instead`),t("SCENE_VALUE_INVALID","error",r(a=>!O(a.value,0,0,o.value).valid||!a.value?.trim()),`\`value\` is how many cells are lit, a whole number from 0 to ${o.value} \xB7 missing or out of range, the grid is drawn empty or full`),t("SCENE_GRID_TOO_DENSE","error",s.valid&&!se(o.value,s.value,re(n.length,e.width))?[`${o.value} cells in ${s.value} columns`]:[],`the cells are under ${B} units wide at this size \xB7 fewer cells, fewer columns would not help, fewer panels would`)}function Qe(n,e,t){let r=ie(n.columns??void 0).length,o=i=>me(i.level??""),s=new Set(W);e("SCENE_LEVEL_INVALID","error",t(i=>{let a=o(i);return r>0&&a.length!==r||a.some(p=>!s.has(p))}),`\`level\` needs one status per column${r?` (${r})`:""}, each one of ${W.join(", ")} \xB7 a missing or unknown one is drawn as "none"`)}var nt=200,be=null;function rt(){return be??=document.createElement("canvas"),be.getContext("2d")}function D(n,e,t="--rik-font-sans"){let r=getComputedStyle(n),o=r.getPropertyValue(t).trim()||r.getPropertyValue("--rik-font-sans").trim()||"sans-serif";return s=>{let i=rt();if(!i)return l=>l.length*s*.5;let a=`${e} ${s}px ${o}`;return ot(a),l=>(i.font=a,i.measureText(l).width)}}var ge=new Set;function ot(n){ge.has(n)||!document.fonts?.load||(ge.add(n),document.fonts.load(n).catch(e=>{console.warn(`rikiki \xB7 scene font did not load (${n}): ${String(e)}`)}))}function Ee(n,e,t){return Object.entries(e).filter(([,r])=>!r.fits).map(([r,o])=>({item:n,field:r,text:o.lines.join(" "),budget:t,size:o.size}))}var _e=tt`:host{display:block;inline-size:100%}svg{display:block;inline-size:100%;block-size:auto;overflow:visible}text{font-family:var(--rik-font-sans);fill:var(--rik-text-default)}.note{fill:var(--deck-scene-muted,var(--rik-text-default--muted))}.tag{/* The strong accent,not the text accent · a tag sits on a card (paper-100),and the text accent measures 2.8:1 there,under the 3:1 large text needs. \`check\` (SVG_TEXT_CONTRAST_LOW) found it on the default theme. */
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
`;function st(n){let e=t=>n.getAttribute(t);return{label:e("label"),note:e("note"),icon:e("icon"),tag:e("tag"),value:e("value"),level:e("level"),from:e("from"),to:e("to"),emphasis:n.hasAttribute("emphasis")}}var x=class extends et{constructor(){super(...arguments);this.playing=!1;this.warnedIssues="";this.linted=[];this.overflows=[];this.onFontsLoaded=()=>{this.requestUpdate()}}get width(){let t=this.frameWidth;return t!==void 0&&Number.isFinite(t)&&t>=nt?t:1600}get items(){return[...this.querySelectorAll(":scope > deck-scene-item")]}connectedCallback(){super.connectedCallback(),this.onShownSlide()?this.applyStep(0):this.playing=!1,document.fonts?.ready.then(()=>this.requestUpdate()),document.fonts?.addEventListener("loadingdone",this.onFontsLoaded),this.observer=new MutationObserver(t=>{t.some(r=>r.type==="childList"||r.target!==this)&&this.requestUpdate()}),this.observer.observe(this,{attributes:!0,childList:!0,subtree:!0})}disconnectedCallback(){super.disconnectedCallback(),this.observer?.disconnect(),document.fonts?.removeEventListener("loadingdone",this.onFontsLoaded)}onShownSlide(){let t=this.closest("deck-root");return!t||t.hasAttribute("data-overview-snapshot")||t.hasAttribute("preview")?!1:!!this.closest("deck-root > [active]")}applyStep(t){t===0&&(this.playing=!1,requestAnimationFrame(()=>{this.playing=!0}))}willUpdate(){let t=K(this.localName);this.linted=t?pe(t,this.items.map(st),{columns:this.getAttribute("columns"),passed:this.getAttribute("passed"),blocked:this.getAttribute("blocked"),total:this.getAttribute("total"),max:this.getAttribute("max"),height:this.getAttribute("height"),scale:this.getAttribute("scale"),width:this.width}):[]}updated(){let t=K(this.localName),r=this.renderRoot.querySelector("svg")?.getAttribute("viewBox"),o=Number(r?.split(" ")[3])-2*g,s=t&&o>0&&this.frameWidth===void 0?de(t,o,this.items.length):null,i=ue(t??this.localName.replace(/^deck-scene-/,""),this.overflows,{width:this.width,count:this.items.length});this.reportIssues([...this.linted,...this.extraIssues(),...i?[i]:[],...s?[s]:[]])}extraIssues(){return[]}reportIssues(t){let r=t.length?JSON.stringify(t):"";if(r!==(this.getAttribute("data-scene-issues")??"")&&(r?this.setAttribute("data-scene-issues",r):this.removeAttribute("data-scene-issues")),r&&r!==this.warnedIssues)for(let o of t)console.warn(`<${this.localName}> \xB7 ${o.message}: ${o.items.join(", ")}`);this.warnedIssues=r}reportOverflow(t){this.overflows=t.map(r=>typeof r=="string"?{item:r,field:"text"}:r)}};u([fe({type:Boolean,reflect:!0})],x.prototype,"playing",2),u([fe({type:Number,attribute:"frame-width"})],x.prototype,"frameWidth",2);var lt=E.cards.max,Se=48,ct=Se/24,ut=28,xe=14,mt=24,dt=2,pt=3,ht=.15,v=class extends x{render(){let e=this.items.slice(0,lt),{width:t,xs:r}=J(e.length,M,this.width),o=t-2*f,s=D(this,m.label.weight),i=D(this,m.note.weight),a=D(this,m.tag.weight),l=e.map(c=>({label:C(c.getAttribute("label")??"",o,dt,m.label.size,s),note:C(c.getAttribute("note")??"",o,pt,m.note.size,i),tag:C(c.getAttribute("tag")??"",o,1,m.tag.size,a),icon:w(c.getAttribute("icon")),emphasis:c.hasAttribute("emphasis"),name:c.getAttribute("label")??""})),p=l.some(c=>c.icon),G=l.some(c=>c.tag.lines.length),b=f+(p?Se+ut:0),S=Math.max(0,...l.map(c=>c.label.lines.length*m.label.line+(c.note.lines.length?xe+c.note.lines.length*m.note.line:0))),N=b+S+(G?mt+m.tag.line:0)+f;return this.reportOverflow(l.flatMap(c=>Ee(c.name,{label:c.label,note:c.note,tag:c.tag},o))),it`<svg viewBox=${Z(N,this.width)} role="img" aria-label=${l.map(c=>[c.name,c.note.lines.join(" "),c.tag.lines.join(" ")].filter(Boolean).join(", ")).join(". ")} part="drawing" > ${l.map((c,I)=>this.card(c,r[I]??0,t,N,b,I))} </svg>`}card(e,t,r,o,s,i){let a=e.emphasis?"on-emphasis":"",l=(b,S,N)=>S.lines.map((c,I)=>X`<text
          class="${b} ${a}"
          x=${t+f}
          y=${N+I*m[b].line+S.size*Y}
          font-size=${S.size}
          font-weight=${m[b].weight}
        >${c}</text>`),p=s+e.label.lines.length*m.label.line+xe,G=o-f-m.tag.line;return X`<g class="pop" style="--t0:${.1+i*ht}s">
      <rect class=${e.emphasis?"emphasis":"card"} x=${t} y="0" width=${r} height=${o} rx="16"></rect>
      ${e.icon?X`<g transform="translate(${t+f} ${f}) scale(${ct})"><path class="icon ${a}" d=${e.icon}></path></g>`:""}
      ${l("label",e.label,s)}
      ${l("note",e.note,p)}
      ${l("tag",e.tag,G)}
    </g>`}};v.styles=_e,v=u([at("deck-scene-cards")],v);export{v as DeckSceneCards};
