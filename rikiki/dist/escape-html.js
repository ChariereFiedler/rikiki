var r={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"};function e(n){return n==null?"":String(n).replace(/[&<>"']/g,t=>r[t])}export{e as escapeHtml};
