var e={slide:560,"slide-up":520,"slide-down":520,"slide-right":560,fade:480,zoom:520,flip:560},r="var(--rik-motion__ease-out, cubic-bezier(0.16, 1, 0.3, 1))",y="var(--rik-motion__ease-spring, cubic-bezier(0.5, 1.8, 0.3, 1))",$=`
  /* Incoming \xB7 from right (forward) */
  @keyframes rk-slide-in       { from { transform: translateX(100%);  } to { transform: translateX(0); } }
  /* Outgoing \xB7 pushed off to the left (forward) */
  @keyframes rk-slide-out      { from { transform: translateX(0);     } to { transform: translateX(-100%); } }
  /* Incoming \xB7 from left (backward) */
  @keyframes rk-slide-right-in  { from { transform: translateX(-100%); } to { transform: translateX(0); } }
  /* Outgoing \xB7 pushed off to the right (backward) */
  @keyframes rk-slide-right-out { from { transform: translateX(0);     } to { transform: translateX(100%); } }
  /* Vertical \xB7 incoming from below, outgoing pushed up (forward) */
  @keyframes rk-slide-up-in     { from { transform: translateY(100%);  } to { transform: translateY(0); } }
  @keyframes rk-slide-up-out    { from { transform: translateY(0);     } to { transform: translateY(-100%); } }
  /* Vertical \xB7 incoming from above, outgoing pushed down (backward) */
  @keyframes rk-slide-down-in   { from { transform: translateY(-100%); } to { transform: translateY(0); } }
  @keyframes rk-slide-down-out  { from { transform: translateY(0);     } to { transform: translateY(100%); } }
  /* Fade \xB7 pop in / pop out from center, no horizontal motion */
  @keyframes rk-fade-in         { from { transform: scale(0.94); } to { transform: scale(1); } }
  @keyframes rk-fade-out        { from { transform: scale(1);    } to { transform: scale(1.06); } }
  /* Zoom \xB7 aggressive scale (for hooks) */
  @keyframes rk-zoom-in         { from { transform: scale(0.86); } to { transform: scale(1);    } }
  @keyframes rk-zoom-out        { from { transform: scale(1);    } to { transform: scale(1.10); } }
  /* Flip \xB7 3D rotateY */
  @keyframes rk-flip-in         { from { transform: perspective(900px) rotateY(-22deg) scale(0.94); }
                                  to   { transform: perspective(900px) rotateY(0)     scale(1);    } }
  @keyframes rk-flip-out        { from { transform: perspective(900px) rotateY(0)    scale(1);    }
                                  to   { transform: perspective(900px) rotateY(22deg) scale(0.94); } }

  /* Outgoing slide stays display:flex via inline JS style; this rule is
     a placeholder so the selector resolves cleanly in shadow CSS. */
  ::slotted(.rk-leaving) { }

  ::slotted([active].rk-enter-slide)        { animation: rk-slide-in       ${e.slide}ms ${r}    both; }
  ::slotted(.rk-leaving.rk-exit-slide)      { animation: rk-slide-out      ${e.slide}ms ${r}    both; }
  ::slotted([active].rk-enter-slide-right)  { animation: rk-slide-right-in ${e["slide-right"]}ms ${r} both; }
  ::slotted(.rk-leaving.rk-exit-slide-right){ animation: rk-slide-right-out ${e["slide-right"]}ms ${r} both; }
  ::slotted([active].rk-enter-slide-up)     { animation: rk-slide-up-in    ${e["slide-up"]}ms ${r} both; }
  ::slotted(.rk-leaving.rk-exit-slide-up)   { animation: rk-slide-up-out   ${e["slide-up"]}ms ${r} both; }
  ::slotted([active].rk-enter-slide-down)   { animation: rk-slide-down-in  ${e["slide-down"]}ms ${r} both; }
  ::slotted(.rk-leaving.rk-exit-slide-down) { animation: rk-slide-down-out ${e["slide-down"]}ms ${r} both; }
  ::slotted([active].rk-enter-fade)         { animation: rk-fade-in        ${e.fade}ms ${r} both; }
  ::slotted(.rk-leaving.rk-exit-fade)       { animation: rk-fade-out       ${e.fade}ms ${r} both; }
  ::slotted([active].rk-enter-zoom)         { animation: rk-zoom-in        ${e.zoom}ms ${y} both; }
  ::slotted(.rk-leaving.rk-exit-zoom)       { animation: rk-zoom-out       ${e.zoom}ms ${r} both; }
  ::slotted([active].rk-enter-flip)         { animation: rk-flip-in        ${e.flip}ms ${r} both; }
  ::slotted(.rk-leaving.rk-exit-flip)       { animation: rk-flip-out       ${e.flip}ms ${r} both; }

  @media (prefers-reduced-motion: reduce) {
    ::slotted([active][class*='rk-enter-']),
    ::slotted(.rk-leaving)                  { animation: none; }
  }
`,h=["rk-enter-slide","rk-enter-slide-up","rk-enter-slide-down","rk-enter-slide-right","rk-enter-fade","rk-enter-zoom","rk-enter-flip"],x=["rk-exit-slide","rk-exit-slide-up","rk-exit-slide-down","rk-exit-slide-right","rk-exit-fade","rk-exit-zoom","rk-exit-flip"];function E(s){let a=s;if(a.__rkTransitions)return a.__rkTransitions;let k=s.shadowRoot;if(!k)return()=>{};let l=document.createElement("style");l.textContent=$,l.setAttribute("data-rik-transitions",""),k.appendChild(l);function w(f,n){if(!n)return 0;let t=f.compareDocumentPosition(n);return t&Node.DOCUMENT_POSITION_PRECEDING?1:t&Node.DOCUMENT_POSITION_FOLLOWING?-1:0}let m=f=>{if(s.__rkMorphActive)return;let n=f,t=n.detail.current,o=n.detail.previous;if(!t)return;let i=t.dataset.transition||s.transition||"fade",d=w(t,o);i==="slide"&&d<0?i="slide-right":i==="slide-right"&&d>0?i="slide":i==="slide-up"&&d<0?i="slide-down":i==="slide-down"&&d>0&&(i="slide-up");let p=`rk-enter-${i}`,v=`rk-exit-${i}`,g=e[i]??480;o&&o!==t&&(o.classList.remove(...h,...x,"rk-leaving"),o.style.display="flex",o.style.zIndex="1",o.offsetWidth,o.classList.add("rk-leaving",v),window.setTimeout(()=>{o.classList.remove("rk-leaving",v),o.style.display="",o.style.zIndex=""},g+40)),t.classList.remove(...h),t.style.zIndex="2",t.offsetWidth,t.classList.add(p),window.setTimeout(()=>{t.classList.remove(p),t.style.zIndex=""},g+40)};s.addEventListener("slide-change",m);let c=s.querySelector(":scope > [active]");c&&m(new CustomEvent("slide-change",{detail:{current:c,previous:null}}));let u=()=>{s.removeEventListener("slide-change",m),l.remove(),delete a.__rkTransitions};return a.__rkTransitions=u,u}export{E as installTransitions};
