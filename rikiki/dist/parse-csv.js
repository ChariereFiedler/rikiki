function h(l,r=","){let u=[],a=[],t=[],n="",i=!1,o=!1,g=()=>{t.push(n),n=""},f=()=>{g(),u.push(t),a.push(o),t=[],o=!1};for(let e=0;e<l.length;e++){let s=l[e];if(i){s==='"'?l[e+1]==='"'?(n+='"',e++):i=!1:n+=s;continue}s==='"'?(i=!0,o=!0):l.startsWith(r,e)?(g(),e+=r.length-1):s===`
`?f():s==="\r"?l[e+1]!==`
`&&f():n+=s}return(n.length>0||t.length>0)&&f(),u.filter((e,s)=>a[s]||!(e.length===1&&e[0]===""))}export{h as parseCsv};
